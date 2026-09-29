import { and, like, lt, sql } from 'drizzle-orm';
import { db, schema } from './db';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
let reservations = 0;

// Reserve the attempt in the shared database before comparing the answer.
// A unique key per user and time window makes the increment atomic on both
// SQLite and PostgreSQL without coupling recovery lockout to normal login.
export async function reserveRecoveryAttempt(userId: number): Promise<boolean> {
  const now = new Date();
  const bucket = Math.floor(now.getTime() / WINDOW_MS);
  const [entry] = await db.insert(schema.organizationSettings).values({
    key: `auth-recovery-attempts:${userId}:${bucket}`,
    value: '1',
    description: 'Password recovery attempt limit',
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: schema.organizationSettings.key,
    set: {
      value: sql`CAST(CAST(${schema.organizationSettings.value} AS INTEGER) + 1 AS TEXT)`,
      updatedAt: now
    }
  }).returning({ value: schema.organizationSettings.value });

  if (++reservations % 100 === 0) {
    await db.delete(schema.organizationSettings).where(and(
      like(schema.organizationSettings.key, 'auth-recovery-attempts:%'),
      lt(schema.organizationSettings.updatedAt, new Date(now.getTime() - WINDOW_MS * 4))
    ));
  }
  return Number(entry.value) <= MAX_ATTEMPTS;
}