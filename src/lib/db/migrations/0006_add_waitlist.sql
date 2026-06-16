-- 0006_add_waitlist.sql
--
-- Why this exists:
--   Pre-launch the platform keeps public sign-ups closed (see REGISTRATION_OPEN
--   / lib/launch.ts). Visitors can leave their email on a waitlist so we can
--   notify them at launch. This table stores those addresses.
--
-- What this migration does:
--   Creates the `waitlist` table: one row per email (unique, stored lowercased
--   by the server action), with an optional `source` tag for analytics and a
--   created_at timestamp. Inserts use ON CONFLICT DO NOTHING so re-submitting
--   the same address is a harmless no-op.
--
-- Safe to run on an existing database: CREATE TABLE IF NOT EXISTS is idempotent.
--
-- Apply with: `npm run db:push` (schema-first; schema.ts is the source of truth),
-- or directly:
--   psql "$DATABASE_URL" -f src/lib/db/migrations/0006_add_waitlist.sql

CREATE TABLE IF NOT EXISTS "waitlist" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "source" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "waitlist_email_unique" UNIQUE ("email")
);
