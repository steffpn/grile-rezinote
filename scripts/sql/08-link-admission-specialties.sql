-- ─────────────────────────────────────────────────────────────────────────────
-- Link admission_data rows to specialties table (and populate specialties).
-- ─────────────────────────────────────────────────────────────────────────────
-- The existing /admitere page queries (getAdmissionDataForExplorer,
-- getAdmissionChanceForUser, etc.) all use INNER JOIN admission_data → specialties
-- on specialty_id. The seed in 03 inserted rows with specialty_id = NULL, so
-- those queries return zero rows and the UI shows "Nu există date".
--
-- This script:
--   1. Inserts each distinct specialty name from admission_data into the
--      `specialties` table (skipping ones that already exist by name).
--   2. UPDATEs admission_data.specialty_id to point to the matching row.
--
-- After this runs, the existing /admitere page and the new simulation-results
-- AdmissionSection both work — they share the same data through different
-- query paths.
--
-- Idempotent: safe to re-run.
--
-- Usage:
--   psql "<DATABASE_PUBLIC_URL>" -f scripts/sql/08-link-admission-specialties.sql
-- ─────────────────────────────────────────────────────────────────────────────

SET client_encoding TO 'UTF8';

BEGIN;

\echo ''
\echo '── Before: counts ────────────────────────────────────────────────────────'
SELECT
  (SELECT count(*)::int FROM specialties)                                          AS specialties_total,
  (SELECT count(*)::int FROM admission_data)                                       AS admission_total,
  (SELECT count(*)::int FROM admission_data WHERE specialty_id IS NULL)            AS admission_unlinked,
  (SELECT count(*)::int FROM admission_data WHERE specialty_id IS NOT NULL)        AS admission_linked;

\echo ''
\echo '── Inserting missing specialties ─────────────────────────────────────────'
WITH inserted AS (
  INSERT INTO specialties (name, sort_order)
  SELECT DISTINCT ad.specialty,
         (SELECT COALESCE(MAX(sort_order), -1) FROM specialties) + row_number() OVER (ORDER BY ad.specialty)
  FROM admission_data ad
  WHERE ad.specialty IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM specialties s WHERE s.name = ad.specialty
    )
  RETURNING id
)
SELECT count(*)::int AS specialties_created FROM inserted;

\echo ''
\echo '── Linking admission_data rows ───────────────────────────────────────────'
WITH updated AS (
  UPDATE admission_data ad
  SET specialty_id = s.id
  FROM specialties s
  WHERE s.name = ad.specialty
    AND ad.specialty_id IS NULL
  RETURNING ad.id
)
SELECT count(*)::int AS rows_linked FROM updated;

\echo ''
\echo '── After: counts ─────────────────────────────────────────────────────────'
SELECT
  (SELECT count(*)::int FROM specialties)                                          AS specialties_total,
  (SELECT count(*)::int FROM admission_data)                                       AS admission_total,
  (SELECT count(*)::int FROM admission_data WHERE specialty_id IS NULL)            AS admission_unlinked,
  (SELECT count(*)::int FROM admission_data WHERE specialty_id IS NOT NULL)        AS admission_linked;

\echo ''
\echo '── Sanity: specialties ──────────────────────────────────────────────────'
SELECT id, name, sort_order FROM specialties ORDER BY sort_order, name;

\echo ''
\echo '── Sanity: sample of linked admission rows (Pedodonție, all UMFs, 2025) ──'
SELECT s.name AS specialty, ad.umf, ad.year, ad.threshold_score
FROM admission_data ad
JOIN specialties s ON s.id = ad.specialty_id
WHERE s.name = 'Pedodonție' AND ad.year = 2025
ORDER BY ad.umf;

COMMIT;
