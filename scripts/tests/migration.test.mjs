import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { MIGRATION_STATEMENTS, migrateActiveTemplateIdentity } from '../migrate-active-template-identity.mjs';

test('active-template PostgreSQL migration upgrades an old reports schema and is rerun-safe', async () => {
  // A tiny in-memory representation of the pre-migration table lets this
  // test exercise both rollout attempts without requiring a live PostgreSQL
  // service in CI.
  const columns = new Set(['id', 'content', 'status']);
  const queries = [];
  const client = {
    async query(statement) {
      queries.push(statement);
      const match = statement.match(/ADD COLUMN IF NOT EXISTS "([^"]+)"/);
      if (match) columns.add(match[1]);
    }
  };

  await migrateActiveTemplateIdentity(client);
  await migrateActiveTemplateIdentity(client);

  assert.ok(columns.has('active_template_id'));
  assert.ok(columns.has('active_template_name'));
  assert.equal(MIGRATION_STATEMENTS.length, 2);
  assert.ok(MIGRATION_STATEMENTS.every(statement => /ADD COLUMN IF NOT EXISTS/.test(statement)));
  assert.equal(queries.filter(query => query === 'BEGIN').length, 2);
  assert.equal(queries.filter(query => query === 'COMMIT').length, 2);
});

test('Hospital production entrypoints migrate before serving and Solo remains excluded', async () => {
  const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
  const [rootStart, launcher, webOnly, wrapper, packageSource] = await Promise.all([
    read('start.bat'),
    read('scripts/start-krispoint.bat'),
    read('scripts/start-web-only.bat'),
    read('server-https.js'),
    read('package.json')
  ]);

  for (const source of [rootStart, launcher, webOnly]) {
    assert.match(source, /call npm run db:migrate:hospital/);
    assert.match(source, /VITE_KRISPOINT_EDITION.*solo/);
    assert.match(source, /skipping Hospital PostgreSQL migration/);
    const migration = source.indexOf('call npm run db:migrate:hospital');
    const server = source.indexOf('node server-https.js') >= 0
      ? source.indexOf('node server-https.js')
      : source.indexOf('node build\\index.js');
    assert.ok(migration >= 0 && server > migration);
  }
  assert.match(wrapper, /runHospitalDatabaseMigration/);
  assert.match(wrapper, /VITE_KRISPOINT_EDITION !== 'solo'/);
  assert.match(packageSource, /"db:migrate:hospital":\s*"node scripts\/migrate-active-template-identity\.mjs"/);
});

test('Hospital development entrypoints migrate before npm run dev', async () => {
  const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
  const [replit, rootDev, scriptDev] = await Promise.all([
    read('.replit'),
    read('Start-KrisPoint-Dev.bat'),
    read('scripts/start-krispoint-dev.bat')
  ]);

  assert.match(replit, /npm run db:migrate:hospital && VITE_KRISPOINT_EDITION=hospital/);
  assert.ok(
    replit.indexOf('db:migrate:hospital') < replit.indexOf('npm run dev'),
    'Replit migration must precede the SvelteKit dev server'
  );

  for (const source of [rootDev, scriptDev]) {
    assert.match(source, /call npm run db:migrate:hospital/);
    assert.match(source, /VITE_KRISPOINT_EDITION.*solo/);
    assert.match(source, /skipping Hospital PostgreSQL migration/);
    assert.ok(
      source.indexOf('call npm run db:migrate:hospital') < source.indexOf('npm run dev'),
      'Batch migration must precede npm run dev'
    );
  }
});