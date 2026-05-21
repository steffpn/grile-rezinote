-- ─────────────────────────────────────────────────────────────────────────────
-- Backfill is_correct on completed simulation attempt_answers.
-- ─────────────────────────────────────────────────────────────────────────────
-- Problem: older simulation submissions stored is_correct = (score > 0),
-- which counts partial CM credit (e.g. 4 out of 5 points) as "correct".
-- The new rule (matching practice mode) is strict: is_correct = (score === maxScore),
-- where maxScore is 4 for CS and 5 for CM.
--
-- This script fixes ONLY simulation attempts that are already completed.
-- Practice attempts use a separate code path and have always been strict.
--
-- Usage (PowerShell or bash):
--   psql "<DATABASE_PUBLIC_URL>" -f scripts/sql/01-backfill-exam-iscorrect.sql
--
-- The whole thing runs in a single transaction. Inspect the printed counts
-- before the `COMMIT;`. If anything looks wrong, change COMMIT to ROLLBACK at
-- the bottom and re-run.
-- ─────────────────────────────────────────────────────────────────────────────

SET client_encoding TO 'UTF8';

BEGIN;

-- ── 1. Show what will change ────────────────────────────────────────────────
\echo ''
\echo '── Rows that will be affected ────────────────────────────────────────────'
SELECT
  count(*)::int AS total_scored_answers,
  count(*) FILTER (
    WHERE aa.is_correct = true
      AND aa.score IS DISTINCT FROM CASE q.type WHEN 'CS' THEN 4 WHEN 'CM' THEN 5 END
  )::int AS will_flip_to_false,
  count(*) FILTER (
    WHERE (aa.is_correct = false OR aa.is_correct IS NULL)
      AND aa.score = CASE q.type WHEN 'CS' THEN 4 WHEN 'CM' THEN 5 END
  )::int AS will_flip_to_true
FROM attempt_answers aa
JOIN attempts a ON a.id = aa.attempt_id
JOIN questions q ON q.id = aa.question_id
WHERE a.type = 'simulation'
  AND a.status = 'completed'
  AND aa.score IS NOT NULL;

-- ── 2. Sample of rows that will flip (max 10) ───────────────────────────────
\echo ''
\echo '── Sample of rows that will flip (first 10) ──────────────────────────────'
SELECT
  aa.id,
  q.type,
  aa.score,
  CASE q.type WHEN 'CS' THEN 4 WHEN 'CM' THEN 5 END AS max_score,
  aa.is_correct AS was,
  (aa.score = CASE q.type WHEN 'CS' THEN 4 WHEN 'CM' THEN 5 END) AS will_be
FROM attempt_answers aa
JOIN attempts a ON a.id = aa.attempt_id
JOIN questions q ON q.id = aa.question_id
WHERE a.type = 'simulation'
  AND a.status = 'completed'
  AND aa.score IS NOT NULL
  AND aa.is_correct IS DISTINCT FROM (
    aa.score = CASE q.type WHEN 'CS' THEN 4 WHEN 'CM' THEN 5 END
  )
LIMIT 10;

-- ── 3. Apply the fix ────────────────────────────────────────────────────────
\echo ''
\echo '── Applying UPDATE ───────────────────────────────────────────────────────'
WITH updated AS (
  UPDATE attempt_answers AS aa
  SET is_correct = (
    aa.score = CASE q.type WHEN 'CS' THEN 4 WHEN 'CM' THEN 5 END
  )
  FROM attempts AS a, questions AS q
  WHERE aa.attempt_id = a.id
    AND aa.question_id = q.id
    AND a.type = 'simulation'
    AND a.status = 'completed'
    AND aa.score IS NOT NULL
    AND aa.is_correct IS DISTINCT FROM (
      aa.score = CASE q.type WHEN 'CS' THEN 4 WHEN 'CM' THEN 5 END
    )
  RETURNING aa.id
)
SELECT count(*)::int AS rows_updated FROM updated;

-- ── 4. Per-attempt summary after the fix ────────────────────────────────────
\echo ''
\echo '── Per-attempt summary (latest 10 completed simulations) ─────────────────'
SELECT
  a.id,
  a.completed_at::date AS finalized,
  a.score AS total_score,
  a.max_score,
  count(*) FILTER (WHERE aa.is_correct = true)::int AS truly_correct,
  count(*) FILTER (WHERE aa.is_correct = false)::int AS wrong,
  count(*) FILTER (WHERE aa.is_correct IS NULL)::int AS unscored
FROM attempts a
LEFT JOIN attempt_answers aa ON aa.attempt_id = a.id
WHERE a.type = 'simulation'
  AND a.status = 'completed'
GROUP BY a.id
ORDER BY a.completed_at DESC NULLS LAST
LIMIT 10;

-- ── 5. Commit (change to ROLLBACK if anything above looks wrong) ────────────
COMMIT;
