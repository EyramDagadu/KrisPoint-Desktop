import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const encryptionConfigured = !!(process.env.ENCRYPTION_KEY || process.env.SOLO_ENCRYPTION_KEY);
  const auditConfigured = !!(process.env.AUDIT_SECRET || process.env.SOLO_AUDIT_KEY || encryptionConfigured);
  
  return json({
    encryptionConfigured,
    auditConfigured,
    needsSetup: !encryptionConfigured,
    keyName: process.env.VITE_KRISPOINT_EDITION === 'solo'
      ? 'SOLO_ENCRYPTION_KEY'
      : 'ENCRYPTION_KEY'
  });
};
