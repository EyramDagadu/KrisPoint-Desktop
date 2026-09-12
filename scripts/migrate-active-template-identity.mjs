import 'dotenv/config';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Keep these statements deliberately small and idempotent. The Hospital
// rollout invokes this runner directly because this repository has no Drizzle
// migration journal or migrator entrypoint.
export const MIGRATION_STATEMENTS = Object.freeze([
  `ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "active_template_id" integer`,
  `ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "active_template_name" varchar(255)`
]);

export async function migrateActiveTemplateIdentity(client) {
  await client.query('BEGIN');
  try {
    for (const statement of MIGRATION_STATEMENTS) {
      await client.query(statement);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for the Hospital PostgreSQL migration');
  }
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await migrateActiveTemplateIdentity(pool);
    console.log('Hospital database migration complete: active template identity');
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(`Hospital database migration failed: ${error.message}`);
    process.exitCode = 1;
  });
}