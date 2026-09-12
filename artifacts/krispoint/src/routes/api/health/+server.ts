import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, isSqlite } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { decrypt, encrypt } from '$lib/server/encryption';
import {
  isValidLicenseServerUrl,
  validateEnvironment
} from '$lib/server/validateEnvironment';

type ComponentStatus = 'healthy' | 'degraded' | 'unhealthy';

type HealthComponent = {
  status: ComponentStatus;
  [key: string]: unknown;
};

const ACTIVE_TEMPLATE_COLUMNS = ['active_template_id', 'active_template_name'] as const;
const HEALTHCHECK_VALUE = 'krispoint-healthcheck';
const LICENSE_REQUEST_TIMEOUT_MS = 3000;

/**
 * The health response is intentionally limited to operational state. Never
 * include caught error messages here: database errors frequently contain a
 * connection string, and encryption errors can disclose key configuration.
 */
export const GET: RequestHandler = async () => {
  const environment = validateEnvironment();
  const isSolo = process.env.VITE_KRISPOINT_EDITION === 'solo';
  const isProduction = process.env.NODE_ENV === 'production';

  const checks: {
    database: HealthComponent;
    migration: HealthComponent;
    encryption: HealthComponent;
    environment: HealthComponent;
    licensing: HealthComponent;
  } = {
    database: { status: 'unhealthy', latencyMs: 0 },
    migration: { status: 'unhealthy', migration: 'active_template_identity' },
    encryption: { status: 'unhealthy' },
    environment: { status: 'healthy', issues: [] },
    licensing: { status: 'healthy', skipped: true }
  };

  // Verify connectivity with the same query used by the Hospital runtime.
  // Solo uses SQLite, but keeping this check there too makes the endpoint
  // useful for diagnosing a damaged local database.
  try {
    const startedAt = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.database = {
      status: 'healthy',
      latencyMs: Math.max(0, Date.now() - startedAt),
      engine: isSqlite ? 'sqlite' : 'postgresql'
    };
  } catch {
    checks.database = {
      status: 'unhealthy',
      latencyMs: 0,
      engine: isSqlite ? 'sqlite' : 'postgresql'
    };
  }

  // Hospital has no migration journal, so the active-template migration is
  // considered current only when both columns exist. Solo additionally has a
  // schema version table and must have reached version 2.
  try {
    const columnResult = isSqlite
      ? await db.execute(sql`SELECT name FROM pragma_table_info('reports')`)
      : await db.execute(sql`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'reports'
            AND column_name IN ('active_template_id', 'active_template_name')
        `);
    const rows = getRows(columnResult);
    const presentColumns = new Set(
      rows
        .map(row => getRowValue(row, isSqlite ? 'name' : 'column_name', 0))
        .filter((value): value is string => typeof value === 'string')
    );
    const missingColumns = ACTIVE_TEMPLATE_COLUMNS.filter(column => !presentColumns.has(column));

    let currentMigration = true;
    if (isSqlite) {
      const versionResult = await db.execute(sql`
        SELECT version
        FROM krispoint_schema_versions
        ORDER BY version DESC
        LIMIT 1
      `);
      const version = Number(getRowValue(getRows(versionResult)[0], 'version', 0));
      currentMigration = Number.isFinite(version) && version >= 2;
    }

    checks.migration = missingColumns.length === 0 && currentMigration
      ? {
          status: 'healthy',
          migration: 'active_template_identity',
          current: true,
          requiredColumns: [...ACTIVE_TEMPLATE_COLUMNS]
        }
      : {
          status: 'unhealthy',
          migration: 'active_template_identity',
          current: false,
          missingColumns
        };
  } catch {
    checks.migration = {
      status: 'unhealthy',
      migration: 'active_template_identity',
      current: false
    };
  }

  // Exercise the actual crypto implementation with a process-local sentinel.
  // The plaintext and ciphertext are never returned or logged.
  try {
    const keyConfigured = Boolean(
      isSolo
        ? process.env.SOLO_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY
        : process.env.ENCRYPTION_KEY || process.env.SOLO_ENCRYPTION_KEY
    );
    const ciphertext = encrypt(HEALTHCHECK_VALUE);
    const roundTripSucceeded = decrypt(ciphertext) === HEALTHCHECK_VALUE;
    checks.encryption = {
      status: roundTripSucceeded && keyConfigured ? 'healthy' : roundTripSucceeded ? 'degraded' : 'unhealthy',
      keyConfigured,
      roundTrip: roundTripSucceeded
    };
  } catch {
    checks.encryption = {
      status: isProduction ? 'unhealthy' : 'degraded',
      keyConfigured: Boolean(process.env.ENCRYPTION_KEY || process.env.SOLO_ENCRYPTION_KEY),
      roundTrip: false
    };
  }

  if (!environment.valid) {
    checks.environment = {
      status: 'unhealthy',
      issues: environment.errors
    };
  } else if (environment.warnings.length > 0) {
    checks.environment = {
      status: 'degraded',
      issues: environment.warnings
    };
  } else {
    checks.environment = { status: 'healthy', issues: [] };
  }

  // Solo is deliberately independent of public licensing availability.
  // Hospital checks a metadata-free health endpoint without credentials and
  // with a bounded timeout so a dead licensing service cannot hang this API.
  if (isSolo) {
    checks.licensing = {
      status: 'healthy',
      skipped: true,
      reason: 'solo edition'
    };
  } else {
    const configuredUrl = process.env.LICENSE_SERVER_URL?.trim();
    if (!configuredUrl || !isValidLicenseServerUrl(configuredUrl, isProduction)) {
      checks.licensing = {
        status: isProduction ? 'unhealthy' : 'degraded',
        skipped: true,
        reason: 'invalid or missing configuration'
      };
    } else {
      checks.licensing = await checkLicenseServer(configuredUrl);
    }
  }

  const componentStatuses = Object.values(checks).map(component => component.status);
  const status: ComponentStatus = componentStatuses.includes('unhealthy')
    ? 'unhealthy'
    : componentStatuses.includes('degraded')
      ? 'degraded'
      : 'healthy';

  return json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks
    },
    { status: status === 'unhealthy' ? 503 : 200 }
  );
};

async function checkLicenseServer(baseUrl: string): Promise<HealthComponent> {
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/health`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LICENSE_REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller.signal
    });
    const latencyMs = Math.max(0, Date.now() - startedAt);
    return response.ok
      ? { status: 'healthy', latencyMs }
      : { status: 'unhealthy', latencyMs };
  } catch {
    return {
      status: 'unhealthy',
      latencyMs: Math.max(0, Date.now() - startedAt)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function getRows(result: unknown): unknown[] {
  if (Array.isArray(result)) return result;
  if (result && typeof result === 'object' && Array.isArray((result as { rows?: unknown[] }).rows)) {
    return (result as { rows: unknown[] }).rows;
  }
  return [];
}

function getRowValue(row: unknown, key: string, index: number): unknown {
  if (Array.isArray(row)) return row[index];
  if (row && typeof row === 'object') return (row as Record<string, unknown>)[key];
  return undefined;
}