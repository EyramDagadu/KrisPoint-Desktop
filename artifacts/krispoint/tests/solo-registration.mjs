// Run with: node artifacts/krispoint/tests/solo-registration.mjs
// Uses a disposable Solo database and its own Vite server, never the preview DB.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { ServerAuthService } from '../src/lib/services/ServerAuthService.js';

const artifactDir = dirname(dirname(fileURLToPath(import.meta.url)));
const tempDir = await mkdtemp(join(tmpdir(), 'krispoint-registration-'));
const dbPath = join(tempDir, 'owner.db');
const username = 'test_owner';
const password = 'TestOwner9!';
const securityQuestion = "What was the name of your first pet?";
const securityAnswer = 'Cobalt';
const freePort = () => new Promise((resolve, reject) => {
  const server = createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    server.close(() => resolve(port));
  });
});

let child;
try {
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  let output = '';
  child = spawn('pnpm', ['run', 'dev'], {
    cwd: artifactDir,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: String(port),
      VITE_KRISPOINT_EDITION: 'solo',
      DATABASE_URL: `sqlite://${dbPath}`,
      KRISPOINT_SOLO_DB_PATH: dbPath,
      SOLO_ENCRYPTION_KEY: 'registration-test-encryption-key-32-characters',
      SOLO_AUDIT_KEY: 'registration-test-audit-key-32-characters'
    }
  });
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', chunk => {
      output = (output + chunk.toString()).slice(-5000);
    });
  }

  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(`${base}/api/auth/check-users`);
      if (response.ok) {
        assert.equal((await response.json()).userCount, 0);
        ready = true;
        break;
      }
    } catch { /* Server is still starting. */ }
    await delay(500);
  }
  assert.ok(ready, `Solo test server did not start:\n${output}`);

  const post = (path, body) => fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: base },
    body: JSON.stringify(body)
  });
  let response = await post('/api/auth/register', {});
  assert.equal(response.status, 400);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.match((await response.json()).error, /required/);

  response = await post('/api/auth/register', {
    username, password, fullName: 'Test Owner',
    institution: 'Test Facility', email: 'not an email'
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /valid email/);

  response = await post('/api/auth/register', {
    username, password, fullName: 'Test Owner',
    institution: 'Test Facility', roleId: null, email: '  Owner@Example.COM  ',
    securityQuestion, securityAnswer
  });
  assert.equal(response.status, 201);
  assert.match(response.headers.get('content-type'), /application\/json/);
  const created = await response.json();
  assert.equal(created.success, true);
  assert.equal(created.user.roleName, 'owner');
  assert.equal(created.user.email, 'owner@example.com');
  assert.equal(created.user.password, undefined);

  response = await post('/api/auth/login', { username, password });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie?.startsWith('session_token='));
  const session = await fetch(`${base}/api/auth/session`, { headers: { cookie } });
  assert.equal((await session.json()).user.username, username);

  response = await post('/api/auth/security-question', { username });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).question, securityQuestion);

  response = await post('/api/auth/reset-password', { username, newPassword: 'NewOwner9!' });
  assert.equal(response.status, 400, 'Reset without a verified answer must be refused');

  response = await post('/api/auth/verify-security-answer', { username, answer: 'wrong' });
  assert.equal(response.status, 401);
  response = await post('/api/auth/verify-security-answer', { username, answer: ` ${securityAnswer.toUpperCase()} ` });
  assert.equal(response.status, 200);
  const oldProof = (await response.json()).recoveryToken;
  assert.ok(oldProof);

  const updatedQuestion = 'What is your favorite book?';
  response = await fetch(`${base}/api/auth/update-security-question`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: base, cookie },
    body: JSON.stringify({ securityQuestion: updatedQuestion, securityAnswer: 'Aurora' })
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
  response = await post('/api/auth/security-question', { username });
  assert.equal((await response.json()).question, updatedQuestion);
  response = await post('/api/auth/reset-password', { username, newPassword: 'NewOwner9!', recoveryToken: oldProof });
  assert.equal(response.status, 401, 'Updating the answer must invalidate previous recovery proofs');

  response = await post('/api/auth/verify-security-answer', { username, answer: 'Aurora' });
  const proof = (await response.json()).recoveryToken;
  assert.ok(proof);
  response = await post('/api/auth/reset-password', { username, newPassword: 'NewOwner9!', recoveryToken: proof });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
  response = await post('/api/auth/reset-password', { username, newPassword: 'AnotherOwner9!', recoveryToken: proof });
  assert.equal(response.status, 401, 'A recovery proof must only work once');
  response = await post('/api/auth/login', { username, password: 'NewOwner9!' });
  assert.equal(response.status, 200);

  response = await post('/api/auth/login', { username: ' OWNER@EXAMPLE.COM ', password: 'NewOwner9!' });
  assert.equal(response.status, 200, 'Email sign-in should ignore case and surrounding whitespace');
  const emailCookie = response.headers.get('set-cookie')?.split(';')[0];
  assert.ok(emailCookie?.startsWith('session_token='));

  response = await fetch(`${base}/api/users/${created.user.id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', origin: base, cookie: emailCookie },
    body: JSON.stringify({ email: '  Updated@Example.COM  ' })
  });
  assert.equal(response.status, 200, 'Owner can update the address used to sign in');
  response = await post('/api/auth/login', { username: 'owner@example.com', password: 'NewOwner9!' });
  assert.equal(response.status, 401, 'Previous email should stop working after profile update');
  response = await post('/api/auth/login', { username: 'UPDATED@example.com', password: 'NewOwner9!' });
  assert.equal(response.status, 200);
  response = await post('/api/auth/login', { username, password: 'NewOwner9!' });
  assert.equal(response.status, 200, 'Username sign-in must continue to work');

  const guesses = await Promise.all(Array.from({ length: 8 }, () =>
    post('/api/auth/verify-security-answer', { username, answer: 'wrong guess' })
  ));
  const guessStatuses = guesses.map(result => result.status);
  assert.equal(guessStatuses.filter(status => status === 401).length, 2,
    `Only two more attempts should be allowed in this window: ${guessStatuses}`);
  assert.equal(guessStatuses.filter(status => status === 429).length, 6,
    `Concurrent answer guesses must not bypass the limit: ${guessStatuses}`);

  response = await post('/api/auth/register', {
    username: 'another_owner', password, fullName: 'Another Owner'
  });
  assert.equal(response.status, 403);
  assert.match((await response.json()).error, /already has an owner/);
  assert.equal((await (await fetch(`${base}/api/auth/check-users`)).json()).userCount, 1);

  // Response-format failures must not be confused with a failed network request.
  const originalFetch = globalThis.fetch;
  const client = Object.create(ServerAuthService.prototype);
  try {
    globalThis.fetch = async () => new Response('<html>Unavailable</html>', { status: 502 });
    const invalidResponse = await client.register({ username });
    assert.match(invalidResponse.error, /server response 502/);
    assert.doesNotMatch(invalidResponse.error, /Network error/);
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
    assert.match((await client.register({ username })).error, /Could not reach the server/);
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log('Solo registration, email sign-in and recovery: normalized and updated email, username compatibility, verified reset and concurrent guess limit passed.');
} finally {
  if (child?.pid) {
    try { process.kill(-child.pid, 'SIGTERM'); } catch { /* Already stopped. */ }
    await delay(500);
    try { process.kill(-child.pid, 'SIGKILL'); } catch { /* Already stopped. */ }
  }
  await rm(tempDir, { recursive: true, force: true });
}