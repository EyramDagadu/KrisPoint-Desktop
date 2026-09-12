export const DEFAULT_LICENSE_SERVER_URL = 'https://license.krispoint.com.gh';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate the server-side settings which are needed for a safe deployment.
 *
 * This function deliberately returns only safe, human-readable diagnostics.
 * In particular, values such as DATABASE_URL and the encryption key must
 * never be included in this result because it is also used by the health
 * endpoint.
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';
  const solo = process.env.VITE_KRISPOINT_EDITION === 'solo';

  if (!solo && !process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  const encryptionKey = solo
    ? process.env.SOLO_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY
    : process.env.ENCRYPTION_KEY || process.env.SOLO_ENCRYPTION_KEY;
  const auditKey = solo
    ? process.env.SOLO_AUDIT_KEY || process.env.AUDIT_SECRET || encryptionKey
    : process.env.AUDIT_SECRET || process.env.ENCRYPTION_KEY || encryptionKey;
  if (!encryptionKey) {
    if (isProduction) {
      errors.push('ENCRYPTION_KEY is required in production for PHI encryption');
    } else {
      warnings.push('ENCRYPTION_KEY not set - using derived key (not recommended for production)');
    }
  } else if (encryptionKey.length < 32) {
    warnings.push('ENCRYPTION_KEY should be at least 32 characters for strong encryption');
  }

  if (!auditKey) {
    if (isProduction) {
      errors.push('AUDIT_SECRET or ENCRYPTION_KEY is required in production for audit log integrity');
    }
  }

  if (!solo) {
    const licenseServerUrl = process.env.LICENSE_SERVER_URL?.trim();
    if (!licenseServerUrl) {
      if (isProduction) {
        errors.push('LICENSE_SERVER_URL is required for Hospital production');
      } else {
        warnings.push('LICENSE_SERVER_URL is not configured');
      }
    } else if (!isValidLicenseServerUrl(licenseServerUrl, isProduction)) {
      errors.push(
        isProduction
          ? 'LICENSE_SERVER_URL must be an HTTPS URL and must not point to localhost'
          : 'LICENSE_SERVER_URL must be a valid HTTP or HTTPS URL'
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Hospital production may use the KrisPoint service or an explicitly
 * configured HTTPS licensing service. Local license servers are intentionally
 * rejected in production so a deployment cannot silently bypass licensing.
 */
export function isValidLicenseServerUrl(value: string, production = process.env.NODE_ENV === 'production'): boolean {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    const isLocalhost = hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      /^127(?:\.\d{1,3}){3}$/.test(hostname);

    if ((isLocalhost && production) || !parsed.hostname || parsed.username || parsed.password) {
      return false;
    }
    if (production && parsed.protocol !== 'https:') {
      return false;
    }
    return parsed.protocol === 'https:' || (!production && parsed.protocol === 'http:');
  } catch {
    return false;
  }
}

export function logEnvironmentStatus(): void {
  const result = validateEnvironment();
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    result.warnings.forEach(w => console.warn(`   - ${w}`));
  }
  
  if (!result.valid) {
    console.error('❌ Environment validation failed:');
    result.errors.forEach(e => console.error(`   - ${e}`));
    if (isProduction) {
      throw new Error('Cannot start in production mode with invalid environment configuration');
    }
  } else {
    console.log('✅ Environment validation passed');
  }
}
