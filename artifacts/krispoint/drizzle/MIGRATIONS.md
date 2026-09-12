# PostgreSQL migrations

This repository currently has no Drizzle migration journal (`drizzle/meta`)
and does not invoke a Drizzle migrator during Hospital startup. The
executable root script `npm run db:migrate:hospital` is therefore the
authoritative rollout path for the active-template identity migration.

It uses the same `DATABASE_URL` PostgreSQL convention as `src/lib/server/db.ts`,
runs both statements in one transaction, and uses PostgreSQL
`ADD COLUMN IF NOT EXISTS` so retries are safe. The root Hospital startup
wrapper invokes it before accepting requests. The standalone KrisPoint AI gateway
does not import or execute this script.