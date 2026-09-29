import { sql } from 'drizzle-orm';
import { db, schema } from './db';

export function parseAccountEmail(input: unknown): { email: string | null; error?: string } {
  if (input == null || input === '') return { email: null };
  if (typeof input !== 'string') return { email: null, error: 'Enter a valid email address' };
  const email = input.trim().toLowerCase();
  if (!email) return { email: null };
  if (email.length > 255 || !/^[^\s@]+@[^\s@]+$/.test(email)) {
    return { email: null, error: 'Enter a valid email address' };
  }
  return { email };
}

// Match legacy addresses with mixed case or surrounding whitespace too.
export function accountEmailMatches(email: string) {
  return sql`lower(trim(${schema.users.email})) = ${email.toLowerCase()}`;
}

export async function accountEmailInUse(email: string, exceptUserId?: number): Promise<boolean> {
  const matches = await db.select({ id: schema.users.id })
    .from(schema.users)
    .where(accountEmailMatches(email))
    .limit(exceptUserId === undefined ? 1 : 2);
  return matches.some((user: { id: number }) => user.id !== exceptUserId);
}