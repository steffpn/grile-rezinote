-- 0004_dedup_unique_specialties.sql
--
-- Why this exists:
--   Multiple insert paths (seed.ts in lowercase, SQL scripts 03+08 in Title
--   Case, manual createSpecialty calls, xlsx imports) all write to
--   specialties.name without any UNIQUE constraint. After a few re-runs the
--   table has many near-duplicate rows (different casing / spacing / trailing
--   whitespace), and admission_data rows split across them.
--
-- What this migration does:
--   1. Picks ONE canonical row per lower(trim(name)) group — the one with the
--      lowest sort_order (then earliest created_at, then smallest id).
--   2. Re-points everything that referenced a duplicate to the canonical id:
--        - admission_data.specialty_id  (FK)
--        - admission_data.specialty     (denormalized name → re-sync)
--        - users.target_specialty_ids   (text array of UUIDs)
--        - audit_logs.entity_id         (so future audit lookups still resolve)
--   3. Deletes the duplicate rows.
--   4. Trims trailing whitespace on the remaining names.
--   5. Adds CREATE UNIQUE INDEX on lower(trim(name)) so the bug can't return.
--
-- Idempotent: the dedup CTE collapses to zero rows on a clean DB, and the
-- index uses IF NOT EXISTS. Safe to re-run.
--
-- Run from the repo root:
--   psql "$DATABASE_PUBLIC_URL" -f src/lib/db/migrations/0004_dedup_unique_specialties.sql

BEGIN;

-- =============================================================================
-- 1. Build the dupe → canonical map
-- =============================================================================

CREATE TEMP TABLE specialty_dedup_map ON COMMIT DROP AS
WITH ranked AS (
  SELECT id,
         name,
         lower(trim(name)) AS key,
         row_number() OVER (
           PARTITION BY lower(trim(name))
           ORDER BY sort_order ASC NULLS LAST, created_at ASC, id
         ) AS rn
    FROM specialties
),
canon AS (
  SELECT key, id AS canonical_id, name AS canonical_name
    FROM ranked
   WHERE rn = 1
)
SELECT r.id           AS dupe_id,
       c.canonical_id,
       c.canonical_name,
       c.key
  FROM ranked r
  JOIN canon c USING (key)
 WHERE r.id <> c.canonical_id;

\echo ''
\echo '── Diagnostic: duplicates detected ───────────────────────────────────────'
SELECT count(*) AS duplicates_to_remove FROM specialty_dedup_map;

\echo ''
\echo '── Sample of dupe groups (max 20) ─────────────────────────────────────────'
SELECT key,
       count(*) + 1 AS total_rows_in_group,  -- +1 for the survivor
       string_agg(dupe_id::text, ', ' ORDER BY dupe_id) AS dupe_ids
  FROM specialty_dedup_map
 GROUP BY key
 ORDER BY count(*) DESC
 LIMIT 20;

-- =============================================================================
-- 2. Re-point referencing tables to the canonical id
-- =============================================================================

\echo ''
\echo '── Re-pointing admission_data ────────────────────────────────────────────'
WITH updated AS (
  UPDATE admission_data ad
     SET specialty_id = dm.canonical_id,
         specialty    = dm.canonical_name
    FROM specialty_dedup_map dm
   WHERE ad.specialty_id = dm.dupe_id
  RETURNING ad.id
)
SELECT count(*)::int AS admission_rows_repointed FROM updated;

\echo ''
\echo '── Re-pointing users.target_specialty_ids (array of UUID text) ──────────'
WITH affected AS (
  SELECT u.id
    FROM users u
   WHERE u.target_specialty_ids IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM unnest(u.target_specialty_ids) AS sid
              JOIN specialty_dedup_map dm ON dm.dupe_id::text = sid
     )
),
rewritten AS (
  UPDATE users u
     SET target_specialty_ids = sub.new_ids
    FROM (
      SELECT u2.id,
             ARRAY(
               SELECT DISTINCT COALESCE(dm.canonical_id::text, sid)
                 FROM unnest(u2.target_specialty_ids) AS sid
                 LEFT JOIN specialty_dedup_map dm ON dm.dupe_id::text = sid
             ) AS new_ids
        FROM users u2
       WHERE u2.id IN (SELECT id FROM affected)
    ) AS sub
   WHERE u.id = sub.id
  RETURNING u.id
)
SELECT count(*)::int AS users_repointed FROM rewritten;

\echo ''
\echo '── Re-pointing audit_logs(entity_type=specialty) ─────────────────────────'
WITH updated AS (
  UPDATE audit_logs al
     SET entity_id = dm.canonical_id
    FROM specialty_dedup_map dm
   WHERE al.entity_type = 'specialty'
     AND al.entity_id   = dm.dupe_id
  RETURNING al.id
)
SELECT count(*)::int AS audit_rows_repointed FROM updated;

-- =============================================================================
-- 3. Delete the duplicate specialty rows
-- =============================================================================

\echo ''
\echo '── Deleting duplicate specialties ────────────────────────────────────────'
WITH deleted AS (
  DELETE FROM specialties s
   USING specialty_dedup_map dm
   WHERE s.id = dm.dupe_id
  RETURNING s.id
)
SELECT count(*)::int AS specialties_deleted FROM deleted;

-- =============================================================================
-- 4. Trim trailing/leading whitespace on remaining names
-- =============================================================================

\echo ''
\echo '── Trimming whitespace on remaining names ────────────────────────────────'
WITH trimmed AS (
  UPDATE specialties
     SET name = trim(name)
   WHERE name <> trim(name)
  RETURNING id
)
SELECT count(*)::int AS names_trimmed FROM trimmed;

-- =============================================================================
-- 5. Add UNIQUE INDEX on lower(trim(name)) so this can't happen again
-- =============================================================================

\echo ''
\echo '── Adding UNIQUE INDEX on lower(trim(name)) ──────────────────────────────'
CREATE UNIQUE INDEX IF NOT EXISTS specialties_name_ci_unique
  ON specialties (lower(trim(name)));

\echo ''
\echo '── Final state ───────────────────────────────────────────────────────────'
SELECT
  (SELECT count(*)::int FROM specialties)                              AS specialties_total,
  (SELECT count(*)::int FROM admission_data WHERE specialty_id IS NULL) AS admission_orphans;

\echo ''
\echo '── Current specialties (after dedup) ─────────────────────────────────────'
SELECT id, name, sort_order, (archived_at IS NOT NULL) AS archived
  FROM specialties
 ORDER BY sort_order, name;

COMMIT;
