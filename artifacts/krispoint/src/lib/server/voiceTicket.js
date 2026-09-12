import { createHmac, timingSafeEqual } from 'node:crypto';

// Tickets are deliberately shorter-lived than a normal session.  This value is
// shared by the HTTP endpoint and the Vite development proxy.
export const VOICE_TICKET_TTL_SECONDS = 30;

function signingKey() {
  return process.env.VOICE_CLIENT_TOKEN || '';
}

function encode(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(payload, key) {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

/**
 * Issue an opaque, URL-safe ticket. The signing key is never part of the
 * ticket (or returned by this helper).
 */
export function issueVoiceTicket(now = Date.now()) {
  const key = signingKey();
  if (!key) {
    throw new Error('VOICE_CLIENT_TOKEN is not configured');
  }
  const payload = encode(JSON.stringify({
    v: 1,
    exp: Math.floor(now / 1000) + VOICE_TICKET_TTL_SECONDS
  }));
  return `${payload}.${sign(payload, key)}`;
}

/**
 * Verify a ticket without throwing. A small clock tolerance is intentionally
 * not allowed: expired tickets must stop working immediately.
 */
export function verifyVoiceTicket(ticket, now = Date.now()) {
  const key = signingKey();
  if (!key || typeof ticket !== 'string') return false;
  const parts = ticket.split('.');
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) ||
      !/^[A-Za-z0-9_-]+$/.test(parts[1])) return false;
  const expected = sign(parts[0], key);
  const actual = Buffer.from(parts[1]);
  const expectedBuffer = Buffer.from(expected);
  if (actual.length !== expectedBuffer.length ||
      !timingSafeEqual(actual, expectedBuffer)) return false;
  try {
    const claims = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    return claims?.v === 1 && Number.isInteger(claims.exp) &&
      claims.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}