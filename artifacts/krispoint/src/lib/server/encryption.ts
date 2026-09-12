import { createCipheriv, createDecipheriv, randomBytes, createHash, createHmac } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const isProduction = process.env.NODE_ENV === 'production';

function getEncryptionKey(): Buffer {
  // Solo's runtime supplies its key independently of the Hospital deployment.
  // Keep ENCRYPTION_KEY as the first choice so existing Hospital installations
  // retain exactly the same key material.
  const key = process.env.VITE_KRISPOINT_EDITION === 'solo'
    ? process.env.SOLO_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY
    : process.env.ENCRYPTION_KEY || process.env.SOLO_ENCRYPTION_KEY;
  if (!key) {
    if (isProduction) {
      throw new Error('CRITICAL: ENCRYPTION_KEY environment variable is required in production. Cannot start without proper encryption configuration.');
    }
    console.warn('⚠️ ENCRYPTION_KEY not set. PHI encryption will use a derived key. Set ENCRYPTION_KEY for production use.');
    const fallbackKey = process.env.DATABASE_URL || process.env.APP_DATA_DATABASE_URL || 'krispoint-development-key';
    return createHash('sha256').update(fallbackKey).digest();
  }
  return createHash('sha256').update(key).digest();
}

export function encrypt(text: string): string {
  if (!text) return text;
  
  const iv = randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText;
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const key = getEncryptionKey();
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedText;
  }
}

export function hashForAudit(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function getAuditSecret(): string {
  const secret = process.env.VITE_KRISPOINT_EDITION === 'solo'
    ? process.env.SOLO_AUDIT_KEY || process.env.AUDIT_SECRET ||
      process.env.SOLO_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY
    : process.env.AUDIT_SECRET || process.env.ENCRYPTION_KEY ||
      process.env.SOLO_AUDIT_KEY || process.env.SOLO_ENCRYPTION_KEY;
  if (!secret && isProduction) {
    throw new Error('CRITICAL: AUDIT_SECRET or ENCRYPTION_KEY environment variable is required in production.');
  }
  return secret || 'krispoint-audit-default';
}

export function hmacForAudit(data: string): string {
  return createHmac('sha256', getAuditSecret()).update(data).digest('hex');
}

export function verifyAuditHmac(data: string, expectedHmac: string): boolean {
  const computed = hmacForAudit(data);
  return computed === expectedHmac;
}

export function encryptPatientData(patient: {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  dateOfBirth?: string;
  mrn?: string;
  phone?: string;
  email?: string;
  address?: string;
}) {
  return {
    ...patient,
    firstName: patient.firstName ? encrypt(patient.firstName) : undefined,
    lastName: patient.lastName ? encrypt(patient.lastName) : undefined,
    middleName: patient.middleName ? encrypt(patient.middleName) : undefined,
    dateOfBirth: patient.dateOfBirth ? encrypt(patient.dateOfBirth) : undefined,
    mrn: patient.mrn ? encrypt(patient.mrn) : undefined,
    phone: patient.phone ? encrypt(patient.phone) : undefined,
    email: patient.email ? encrypt(patient.email) : undefined,
    address: patient.address ? encrypt(patient.address) : undefined,
  };
}

export function decryptPatientData(patient: {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  dateOfBirth?: string;
  mrn?: string;
  phone?: string;
  email?: string;
  address?: string;
}) {
  return {
    ...patient,
    firstName: patient.firstName ? decrypt(patient.firstName) : undefined,
    lastName: patient.lastName ? decrypt(patient.lastName) : undefined,
    middleName: patient.middleName ? decrypt(patient.middleName) : undefined,
    dateOfBirth: patient.dateOfBirth ? decrypt(patient.dateOfBirth) : undefined,
    mrn: patient.mrn ? decrypt(patient.mrn) : undefined,
    phone: patient.phone ? decrypt(patient.phone) : undefined,
    email: patient.email ? decrypt(patient.email) : undefined,
    address: patient.address ? decrypt(patient.address) : undefined,
  };
}
