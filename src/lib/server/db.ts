import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as postgresSchema from '../../../shared/schema';

const isSolo = process.env.VITE_KRISPOINT_EDITION === 'solo';

if (!isSolo && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set for KrisPoint Hospital');
}

let selectedSchema: any;
let selectedDb: any;

if (isSolo) {
  const [{ createSqliteDb }, sqliteSchema] = await Promise.all([
    import('./sqlite'),
    import('../../../shared/sqlite-schema')
  ]);
  selectedSchema = sqliteSchema;
  selectedDb = createSqliteDb();
} else {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  pool.on('error', (err) => console.error('[DB Pool] Unexpected error on idle client:', err));
  selectedSchema = postgresSchema;
  selectedDb = drizzle(pool, { schema: postgresSchema });
}

export const schema: any = selectedSchema;
export const db: any = selectedDb;

export const isSqlite = isSolo;
