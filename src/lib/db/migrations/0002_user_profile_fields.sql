-- Adds profile fields to users: marketing consent + target-specialty interests
-- + exam goal + graduation year. All safe-to-apply on existing data.
--
-- Apply with: `npm run db:push` (or manually via psql).

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "marketing_opt_in" boolean NOT NULL DEFAULT false;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "target_specialty_ids" text[];

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "target_score" integer;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "graduation_year" integer;
