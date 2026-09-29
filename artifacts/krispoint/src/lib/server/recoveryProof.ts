import { randomBytes, timingSafeEqual } from 'crypto';
import { hmacForRecovery } from './encryption';

const PROOF_LIFETIME_MS = 10 * 60 * 1000;

function signature(userId: number, expiresAt: number, nonce: string, passwordHash: string, answerHash: string): Buffer {
  return hmacForRecovery(`${userId}.${expiresAt}.${nonce}.${passwordHash}.${answerHash}`);
}

export function createRecoveryProof(userId: number, passwordHash: string, answerHash: string): string {
  const expiresAt = Date.now() + PROOF_LIFETIME_MS;
  const nonce = randomBytes(16).toString('hex');
  return `${userId}.${expiresAt}.${nonce}.${signature(userId, expiresAt, nonce, passwordHash, answerHash).toString('hex')}`;
}

export function verifyRecoveryProof(proof: unknown, userId: number, passwordHash: string, answerHash: string): boolean {
  if (typeof proof !== 'string' || proof.length > 256) return false;
  const match = /^(\d+)\.(\d{13})\.([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(proof);
  if (!match) return false;
  const expiresAt = Number(match[2]);
  if (Number(match[1]) !== userId || !Number.isSafeInteger(expiresAt) || Date.now() > expiresAt || expiresAt > Date.now() + PROOF_LIFETIME_MS) {
    return false;
  }
  const expected = signature(userId, expiresAt, match[3], passwordHash, answerHash);
  return timingSafeEqual(expected, Buffer.from(match[4], 'hex'));
}