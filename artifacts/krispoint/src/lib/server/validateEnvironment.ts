const isProduction = process.env.NODE_ENV === 'production';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
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

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function logEnvironmentStatus(): void {
  const result = validateEnvironment();
  
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
