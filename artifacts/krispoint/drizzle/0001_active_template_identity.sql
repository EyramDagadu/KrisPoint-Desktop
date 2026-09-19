-- Preserve the exact template selected for a report draft.
-- The executable authoritative runner is:
--   npm run db:migrate:hospital
-- IF NOT EXISTS makes this SQL safe to re-run during deployment recovery.
ALTER TABLE "reports"
  ADD COLUMN IF NOT EXISTS "active_template_id" integer;

ALTER TABLE "reports"
  ADD COLUMN IF NOT EXISTS "active_template_name" varchar(255);

-- Allow system and personal macros to target a report modality.
ALTER TABLE "macros"
  ADD COLUMN IF NOT EXISTS "modality" varchar(50);