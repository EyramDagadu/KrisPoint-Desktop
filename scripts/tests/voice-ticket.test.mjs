import assert from 'node:assert/strict';
import test from 'node:test';
import { issueVoiceTicket, verifyVoiceTicket, VOICE_TICKET_TTL_SECONDS } from '../../src/lib/server/voiceTicket.js';

const key = 'test-only-voice-signing-key';

test('voice tickets verify and expire strictly', () => {
  const original = process.env.VOICE_CLIENT_TOKEN;
  process.env.VOICE_CLIENT_TOKEN = key;
  try {
    const now = 1_700_000_000_000;
    const ticket = issueVoiceTicket(now);
    assert.equal(verifyVoiceTicket(ticket, now), true);
    assert.equal(verifyVoiceTicket(ticket, now + (VOICE_TICKET_TTL_SECONDS * 1000)), false);
  } finally {
    if (original === undefined) delete process.env.VOICE_CLIENT_TOKEN;
    else process.env.VOICE_CLIENT_TOKEN = original;
  }
});

test('voice tickets reject tampering and missing signing configuration', () => {
  const original = process.env.VOICE_CLIENT_TOKEN;
  process.env.VOICE_CLIENT_TOKEN = key;
  try {
    const ticket = issueVoiceTicket(1_700_000_000_000);
    const [payload, signature] = ticket.split('.');
    const altered = `${payload}.${signature.slice(0, -1)}${signature.endsWith('A') ? 'B' : 'A'}`;
    assert.equal(verifyVoiceTicket(altered, 1_700_000_000_001), false);
    delete process.env.VOICE_CLIENT_TOKEN;
    assert.equal(verifyVoiceTicket(ticket), false);
  } finally {
    if (original === undefined) delete process.env.VOICE_CLIENT_TOKEN;
    else process.env.VOICE_CLIENT_TOKEN = original;
  }
});