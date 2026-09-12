import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";

// For desktop builds: DATABASE_URL is optional (uses localStorage instead)
// For web builds: DATABASE_URL is required
const DATABASE_URL = process.env.DATABASE_URL;

// Only create pool and db if DATABASE_URL is set (web mode)
export const pool = DATABASE_URL ? new pg.Pool({ connectionString: DATABASE_URL }) : null;
export const db = DATABASE_URL && pool ? drizzle(pool, { schema }) : null;

// Helper to check if database is available
export const isDatabaseAvailable = () => !!DATABASE_URL;
