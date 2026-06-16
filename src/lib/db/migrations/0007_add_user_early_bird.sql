-- 0007_add_user_early_bird.sql
--
-- Why this exists:
--   Users who joined the pre-launch waitlist get an early-bird perk: PREMIUM
--   (not just PRO) for the duration of their trial, so the Admission module is
--   unlocked while trialing. We flag those accounts at creation time.
--
-- What this migration does:
--   Adds users.early_bird (boolean, NOT NULL, default false). Set to true by the
--   signup action / Google OAuth callback when the new account's email is found
--   in the waitlist table. Read by checkSubscriptionAccess to grant PREMIUM
--   instead of PRO during an active trial.
--
-- Safe to run on an existing database: NOT NULL with a default backfills
-- existing rows to false. Idempotent via IF NOT EXISTS.
--
-- Apply with: `npm run db:push` (schema-first), or directly:
--   psql "$DATABASE_URL" -f src/lib/db/migrations/0007_add_user_early_bird.sql

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "early_bird" boolean NOT NULL DEFAULT false;
