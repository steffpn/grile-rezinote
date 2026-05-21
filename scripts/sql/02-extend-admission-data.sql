-- ─────────────────────────────────────────────────────────────────────────────
-- Extend admission_data with a `umf` column.
-- ─────────────────────────────────────────────────────────────────────────────
-- Original schema stored only (specialty, year, threshold). The real data
-- (Istoric admitere.xlsx) is keyed by specialty × UMF × year — six universities
-- per specialty, each with its own threshold. We add `umf` so each row is the
-- unique tuple we actually need.
--
-- Also relax the FK on specialty_id (some admission rows don't map cleanly to
-- the `specialties` lookup table, and the denormalized `specialty` text is
-- already the canonical name we display).
--
-- Idempotent: safe to run multiple times.
--
-- Usage:
--   psql "<DATABASE_PUBLIC_URL>" -f scripts/sql/02-extend-admission-data.sql
-- ─────────────────────────────────────────────────────────────────────────────

SET client_encoding TO 'UTF8';

BEGIN;

-- 1. Add the column if missing.
ALTER TABLE admission_data
  ADD COLUMN IF NOT EXISTS umf TEXT;

-- 2. Allow specialty_id to be NULL — we key by (umf, specialty, year) and the
--    FK to `specialties` isn't required for display.
ALTER TABLE admission_data
  ALTER COLUMN specialty_id DROP NOT NULL;

-- 3. Index for the query we'll run on the results page: filter by umf, group
--    by specialty, order by year desc.
CREATE INDEX IF NOT EXISTS admission_data_umf_specialty_year_idx
  ON admission_data (umf, specialty, year DESC);

COMMIT;

\echo ''
\echo '── admission_data columns after migration ────────────────────────────────'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admission_data'
ORDER BY ordinal_position;
