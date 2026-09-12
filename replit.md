# KrisPoint

Hospital multi-user radiology reporting and Solo desktop reporting, with shared signed licensing.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run dev:hospital` — run the Hospital app with its safe additive migration
- `pnpm test:deployment` — validate the Windows Hospital deployment contract
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Hospital production env: `DATABASE_URL`, `ENCRYPTION_KEY`, `VOICE_CLIENT_TOKEN`,
  `LICENSE_SERVER_URL=https://license.krispoint.com.gh`, `HOST`, and `PORT`
- Windows local-server procedure: `HOSPITAL_DEPLOYMENT.md`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

- Hospital uses PostgreSQL and the adapter-node production server.
- Windows releases are immutable Git checkouts selected by an atomic `current.txt` pointer.
- Hospital licensing always uses the existing public licensing authority; never start a local copy.
- Production secrets and TLS files stay outside Git under machine-local administrator-controlled paths.

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Back up PostgreSQL before schema changes.
- Run `server-https.js` in Hospital production; launching the adapter entrypoint directly bypasses the authenticated voice proxy.
- Use `pnpm install --frozen-lockfile`; the repository rejects npm/yarn installs.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
