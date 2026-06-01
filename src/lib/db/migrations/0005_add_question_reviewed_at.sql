-- 0005_add_question_reviewed_at.sql
--
-- Why this exists:
--   The admin "review & retire" bulk action soft-deletes grile in bulk so the
--   active question bank can be replaced without touching any test/simulation
--   history. Soft-deleted grile must never appear in a new test or simulation
--   again, but are kept for historical statistics. We need a way to mark which
--   archived rows were retired by that deliberate review (vs. an ad-hoc single
--   archive) — that is what reviewed_at records.
--
-- What this migration does:
--   Adds questions.reviewed_at (nullable timestamp). It is always stamped
--   together with archived_at by the bulk review action (reviewed ⟹ archived),
--   so the existing `archived_at IS NULL` filters on every practice/simulation
--   pool already keep reviewed grile out of users' tests. The column exists to
--   drive the admin "revizuită" badge/filter and historical reporting.
--   Restoring a question clears both archived_at and reviewed_at.
--
-- Safe to run on an existing database: the column is nullable with no default,
-- so existing rows are simply left NULL (not reviewed). Idempotent via
-- IF NOT EXISTS.
--
-- Apply with: `npm run db:push` (or `npm run db:migrate` if using SQL migrations),
-- or directly:
--   psql "$DATABASE_URL" -f src/lib/db/migrations/0005_add_question_reviewed_at.sql

ALTER TABLE "questions"
  ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp;
