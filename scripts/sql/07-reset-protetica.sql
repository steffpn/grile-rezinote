-- ─────────────────────────────────────────────────────────────────────────────
-- Wipe everything imported under chapter "Protetica" — chapter row + all
-- questions linked to it + all options under those questions. Used to recover
-- from a partial / failed 05-import-protetica run before re-running it cleanly.
--
-- Idempotent: if Protetica doesn't exist, this is a no-op.
--
-- Usage:
--   psql "<DATABASE_PUBLIC_URL>" -f scripts/sql/07-reset-protetica.sql
-- ─────────────────────────────────────────────────────────────────────────────

SET client_encoding TO 'UTF8';

BEGIN;

\echo ''
\echo '── Before: Protetica rows in each table ─────────────────────────────────'
SELECT 'chapters'  AS tbl, count(*)::int AS rows FROM chapters  WHERE name = 'Protetica'
UNION ALL SELECT 'questions',    count(*)::int      FROM questions WHERE source_book = 'Protetica' OR chapter_id IN (SELECT id FROM chapters WHERE name = 'Protetica')
UNION ALL SELECT 'options',      count(*)::int      FROM options o JOIN questions q ON q.id = o.question_id WHERE q.source_book = 'Protetica' OR q.chapter_id IN (SELECT id FROM chapters WHERE name = 'Protetica')
;

\echo ''
\echo '── Deleting options ──────────────────────────────────────────────────────'
WITH deleted AS (
  DELETE FROM options
  WHERE question_id IN (
    SELECT id FROM questions
    WHERE source_book = 'Protetica'
       OR chapter_id IN (SELECT id FROM chapters WHERE name = 'Protetica')
  )
  RETURNING id
)
SELECT count(*)::int AS options_deleted FROM deleted;

\echo ''
\echo '── Deleting questions ────────────────────────────────────────────────────'
WITH deleted AS (
  DELETE FROM questions
  WHERE source_book = 'Protetica'
     OR chapter_id IN (SELECT id FROM chapters WHERE name = 'Protetica')
  RETURNING id
)
SELECT count(*)::int AS questions_deleted FROM deleted;

\echo ''
\echo '── Deleting chapter ──────────────────────────────────────────────────────'
WITH deleted AS (
  DELETE FROM chapters
  WHERE name = 'Protetica'
  RETURNING id
)
SELECT count(*)::int AS chapter_deleted FROM deleted;

\echo ''
\echo '── After: should all be 0 ────────────────────────────────────────────────'
SELECT 'chapters'  AS tbl, count(*)::int AS rows FROM chapters  WHERE name = 'Protetica'
UNION ALL SELECT 'questions',    count(*)::int      FROM questions WHERE source_book = 'Protetica'
UNION ALL SELECT 'options',      count(*)::int      FROM options o JOIN questions q ON q.id = o.question_id WHERE q.source_book = 'Protetica'
;

COMMIT;
