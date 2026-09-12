import { createPublicKey, verify as verifySignature } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface LicenseEnvelope {
  key: string;
  machineId: string;
  payload: string;
  signature: string;
}

export interface VerifiedAiLicense {
  key: string;
  machineId: string;
  payload: Record<string, unknown>;
}

export interface LicenseAuthority {
  validate(metadata: {
    licenseKey: string;
    machineId: string;
    payload: string;
    signature: string;
  }): Promise<boolean>;
}

const MAX_LICENSE_FIELD = 16_384;

function decodeBase64(value: string): Buffer {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) {
    throw new Error('Invalid license encoding');
  }
  const decoded = Buffer.from(value, 'base64');
  if (decoded.length === 0) throw new Error('Invalid license encoding');
  return decoded;
}

function pinnedPublicKey(): ReturnType<typeof createPublicKey> {
  const configured = process.env.KRISPOINT_LICENSE_PUBLIC_KEY?.trim();
  let value = configured;

  // The checked-in public key is only a development convenience. Production
  // deployments must pin the key explicitly in their environment.
  if (!value && process.env.NODE_ENV === 'development') {
    try {
      value = readFileSync(resolve(process.cwd(), 'license-server/keys/public.key'), 'utf8').trim();
    } catch {
      value = '';
    }
  }

  if (!value) throw new Error('License verification is not configured');
  if (value.includes('BEGIN PUBLIC KEY')) return createPublicKey(value);

  const raw = decodeBase64(value);
  if (raw.length !== 32) {
    try {
      return createPublicKey({ key: raw, format: 'der', type: 'spki' });
    } catch {
      throw new Error('Invalid license public key');
    }
  }
  // Ed25519 SubjectPublicKeyInfo prefix for a raw 32-byte public key.
  return createPublicKey({
    key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), raw]),
    format: 'der',
    type: 'spki'
  });
}

function parseSignedPayload(payload: string, signature: string, expectedKey: string): Record<string, unknown> {
  if (payload.length > MAX_LICENSE_FIELD || signature.length > MAX_LICENSE_FIELD) {
    throw new Error('License metadata is too large');
  }
  const message = decodeBase64(payload);
  const signed = decodeBase64(signature);
  if (signed.length !== 64 || !verifySignature(null, message, pinnedPublicKey(), signed)) {
    throw new Error('Invalid license signature');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(message.toString('utf8'));
  } catch {
    throw new Error('Invalid signed license payload');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid signed license payload');
  }
  const data = parsed as Record<string, unknown>;
  if (data.key !== expectedKey) throw new Error('License key does not match signed payload');
  const expiresAt = typeof data.expiresAt === 'string' ? Date.parse(data.expiresAt) : NaN;
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) throw new Error('License is expired');
  if (!Array.isArray(data.features) || !data.features.includes('ai_polish')) {
    throw new Error('AI polish is not enabled for this license');
  }
  return data;
}

export function createLicenseAuthority(fetchImpl: typeof fetch = fetch): LicenseAuthority {
  return {
    async validate(metadata) {
      const baseUrl = (
        process.env.KRISPOINT_LICENSE_SERVER_URL ||
        process.env.LICENSE_SERVER_URL ||
        'http://localhost:3001'
      ).replace(/\/+$/, '');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);
      try {
        const response = await fetchImpl(`${baseUrl}/api/license/validate`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          // This object is intentionally restricted to licensing metadata.
          body: JSON.stringify(metadata),
          signal: controller.signal
        });
        if (!response.ok) return false;
        const result = await response.json() as { valid?: unknown };
        return result.valid === true;
      } catch {
        return false;
      } finally {
        clearTimeout(timer);
      }
    }
  };
}

export async function verifyAiLicense(
  envelope: unknown,
  authority: LicenseAuthority = createLicenseAuthority()
): Promise<VerifiedAiLicense> {
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    throw new Error('A signed license envelope is required');
  }
  const candidate = envelope as Record<string, unknown>;
  const key = candidate.key;
  const machineId = candidate.machineId;
  const payload = candidate.payload;
  const signature = candidate.signature;
  if (
    typeof key !== 'string' || !key || key.length > MAX_LICENSE_FIELD ||
    typeof machineId !== 'string' || !machineId || machineId.length > MAX_LICENSE_FIELD ||
    typeof payload !== 'string' || typeof signature !== 'string'
  ) {
    throw new Error('Invalid license envelope');
  }

  const signedPayload = parseSignedPayload(payload, signature, key);
  // Revocation and activation are checked after local signature verification,
  // and before any report/template field is accessed by the API route.
  if (!await authority.validate({ licenseKey: key, machineId, payload, signature })) {
    throw new Error('License is not active for this device');
  }
  return { key, machineId, payload: signedPayload };
}