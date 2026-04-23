-- Adds plan_tier enum and column for 3-tier subscription model (FREE/PRO/PREMIUM).
--
-- Safe to run on an existing database: new column defaults to 'FREE' for all
-- existing rows, and the enum is created only if it does not already exist.
--
-- Apply with: `npm run db:push` (or `npm run db:migrate` if using SQL migrations).

DO $$ BEGIN
  CREATE TYPE "plan_tier" AS ENUM ('FREE', 'PRO', 'PREMIUM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "plan_tier" "plan_tier" NOT NULL DEFAULT 'FREE';
