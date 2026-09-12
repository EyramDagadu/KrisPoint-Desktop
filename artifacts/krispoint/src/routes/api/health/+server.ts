import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { validateEnvironment } from '$lib/server/validateEnvironment';

export const GET: RequestHandler = async () => {
  const envValidation = validateEnvironment();
  const isProduction = process.env.NODE_ENV === 'production';
  
  const checks = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checks: {
      database: { status: 'unknown' as string, latencyMs: 0 },
      encryption: { status: 'unknown' as string },
      environment: { status: 'unknown' as string, issues: [] as string[] }
    }
  };

  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.checks.database = { status: 'ok', latencyMs: Date.now() - start };
  } catch (error) {
    checks.checks.database = { status: 'error', latencyMs: 0 };
    checks.status = 'unhealthy';
  }

  if (!envValidation.valid) {
    checks.checks.environment = { status: 'error', issues: envValidation.errors };
    checks.status = 'unhealthy';
  } else if (envValidation.warnings.length > 0) {
    checks.checks.environment = { status: 'warning', issues: envValidation.warnings };
    if (isProduction) {
      checks.status = 'degraded';
    }
  } else {
    checks.checks.environment = { status: 'ok', issues: [] };
  }

  if (process.env.ENCRYPTION_KEY) {
    checks.checks.encryption = { status: 'ok' };
  } else if (isProduction) {
    checks.checks.encryption = { status: 'error' };
    checks.status = 'unhealthy';
  } else {
    checks.checks.encryption = { status: 'warning' };
  }

  const statusCode = checks.status === 'healthy' ? 200 : checks.status === 'degraded' ? 200 : 503;
  
  return json(checks, { status: statusCode });
};
