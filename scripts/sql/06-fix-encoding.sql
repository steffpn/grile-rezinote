-- ─────────────────────────────────────────────────────────────────────────────
-- Fix UTF-8-as-WIN1252 mojibake in any text column populated by an earlier
-- import that was run without `SET client_encoding TO 'UTF8'`.
-- ─────────────────────────────────────────────────────────────────────────────
-- Symptom: "Pedodonție" appears in the UI as "PedodonÈ›ie". The bytes for "ț"
-- (0xC8 0x9B in UTF-8) were treated by psql as two separate WIN1252 characters
-- (0xC8 → "È", 0x9B → "›") before being re-encoded as UTF-8 into the DB.
--
-- The round-trip `convert_from(convert_to(t, 'WIN1252'), 'UTF8')` reverses
-- this: it encodes each char back to a single WIN1252 byte, then decodes the
-- resulting byte stream as UTF-8 — giving us the original Romanian text.
--
-- Idempotent: we only touch rows whose text contains a character that doesn't
-- occur in correctly-encoded Romanian medical text:
--   Ã (capital A tilde)     — appears in mojibake of "â", "î", "Â", "Î"
--   Ä (capital A diaeresis) — appears in mojibake of "ă", "Ă"
--   Å (capital A ring)      — appears in mojibake of "ţ", "ş", "Ţ", "Ş"
--                             (cedilla variants — older ISO 8859-2 convention)
--   È (capital E grave)     — appears in mojibake of "ț", "ș", "Ț", "Ș"
--                             (comma-below variants — newer Unicode convention)
-- Re-running this script on already-clean data is a no-op.
--
-- Usage:
--   psql "<DATABASE_PUBLIC_URL>" -f scripts/sql/06-fix-encoding.sql
-- ─────────────────────────────────────────────────────────────────────────────

SET client_encoding TO 'UTF8';

BEGIN;

\echo ''
\echo '── chapters.name ─────────────────────────────────────────────────────────'
WITH fixed AS (
  UPDATE chapters
  SET name = convert_from(convert_to(name, 'WIN1252'), 'UTF8')
  WHERE name ~ '[ÃÄÅÈ]'
  RETURNING id
)
SELECT count(*)::int AS chapters_fixed FROM fixed;

\echo ''
\echo '── chapters.description ──────────────────────────────────────────────────'
WITH fixed AS (
  UPDATE chapters
  SET description = convert_from(convert_to(description, 'WIN1252'), 'UTF8')
  WHERE description IS NOT NULL AND description ~ '[ÃÄÅÈ]'
  RETURNING id
)
SELECT count(*)::int AS chapters_description_fixed FROM fixed;

\echo ''
\echo '── questions.text ────────────────────────────────────────────────────────'
WITH fixed AS (
  UPDATE questions
  SET text = convert_from(convert_to(text, 'WIN1252'), 'UTF8')
  WHERE text ~ '[ÃÄÅÈ]'
  RETURNING id
)
SELECT count(*)::int AS questions_text_fixed FROM fixed;

\echo ''
\echo '── questions.subchapter ──────────────────────────────────────────────────'
WITH fixed AS (
  UPDATE questions
  SET subchapter = convert_from(convert_to(subchapter, 'WIN1252'), 'UTF8')
  WHERE subchapter IS NOT NULL AND subchapter ~ '[ÃÄÅÈ]'
  RETURNING id
)
SELECT count(*)::int AS questions_subchapter_fixed FROM fixed;

\echo ''
\echo '── questions.source_book ─────────────────────────────────────────────────'
WITH fixed AS (
  UPDATE questions
  SET source_book = convert_from(convert_to(source_book, 'WIN1252'), 'UTF8')
  WHERE source_book IS NOT NULL AND source_book ~ '[ÃÄÅÈ]'
  RETURNING id
)
SELECT count(*)::int AS questions_source_book_fixed FROM fixed;

\echo ''
\echo '── questions.source_page ─────────────────────────────────────────────────'
WITH fixed AS (
  UPDATE questions
  SET source_page = convert_from(convert_to(source_page, 'WIN1252'), 'UTF8')
  WHERE source_page IS NOT NULL AND source_page ~ '[ÃÄÅÈ]'
  RETURNING id
)
SELECT count(*)::int AS questions_source_page_fixed FROM fixed;

\echo ''
\echo '── options.text ──────────────────────────────────────────────────────────'
WITH fixed AS (
  UPDATE options
  SET text = convert_from(convert_to(text, 'WIN1252'), 'UTF8')
  WHERE text ~ '[ÃÄÅÈ]'
  RETURNING id
)
SELECT count(*)::int AS options_fixed FROM fixed;

\echo ''
\echo '── admission_data.specialty ──────────────────────────────────────────────'
WITH fixed AS (
  UPDATE admission_data
  SET specialty = convert_from(convert_to(specialty, 'WIN1252'), 'UTF8')
  WHERE specialty ~ '[ÃÄÅÈ]'
  RETURNING id
)
SELECT count(*)::int AS admission_specialty_fixed FROM fixed;

\echo ''
\echo '── admission_data.umf ────────────────────────────────────────────────────'
WITH fixed AS (
  UPDATE admission_data
  SET umf = convert_from(convert_to(umf, 'WIN1252'), 'UTF8')
  WHERE umf IS NOT NULL AND umf ~ '[ÃÄÅÈ]'
  RETURNING id
)
SELECT count(*)::int AS admission_umf_fixed FROM fixed;

\echo ''
\echo '── specialties.name ──────────────────────────────────────────────────────'
WITH fixed AS (
  UPDATE specialties
  SET name = convert_from(convert_to(name, 'WIN1252'), 'UTF8')
  WHERE name ~ '[ÃÄÅÈ]'
  RETURNING id
)
SELECT count(*)::int AS specialties_name_fixed FROM fixed;

\echo ''
\echo '── specialties.description ───────────────────────────────────────────────'
WITH fixed AS (
  UPDATE specialties
  SET description = convert_from(convert_to(description, 'WIN1252'), 'UTF8')
  WHERE description IS NOT NULL AND description ~ '[ÃÄÅÈ]'
  RETURNING id
)
SELECT count(*)::int AS specialties_description_fixed FROM fixed;

\echo ''
\echo '── Sanity: all chapters after fix ────────────────────────────────────────'
SELECT id, name, sort_order
FROM chapters
ORDER BY sort_order, name;

\echo ''
\echo '── Sanity: distinct subchapters per chapter (top 30) ─────────────────────'
SELECT
  c.name AS chapter,
  q.subchapter,
  count(*)::int AS questions
FROM questions q
JOIN chapters c ON c.id = q.chapter_id
GROUP BY c.name, q.subchapter
ORDER BY c.name, q.subchapter
LIMIT 30;

\echo ''
\echo '── Sanity: any remaining mojibake markers (should all be 0) ──────────────'
SELECT 'chapters.name'             AS column, count(*)::int AS rows_with_mojibake FROM chapters         WHERE name        ~ '[ÃÄÅÈ]'
UNION ALL SELECT 'questions.text',            count(*)::int FROM questions        WHERE text        ~ '[ÃÄÅÈ]'
UNION ALL SELECT 'questions.subchapter',      count(*)::int FROM questions        WHERE subchapter  ~ '[ÃÄÅÈ]'
UNION ALL SELECT 'questions.source_book',     count(*)::int FROM questions        WHERE source_book ~ '[ÃÄÅÈ]'
UNION ALL SELECT 'options.text',              count(*)::int FROM options          WHERE text        ~ '[ÃÄÅÈ]'
UNION ALL SELECT 'admission_data.specialty',  count(*)::int FROM admission_data   WHERE specialty   ~ '[ÃÄÅÈ]'
UNION ALL SELECT 'admission_data.umf',        count(*)::int FROM admission_data   WHERE umf         ~ '[ÃÄÅÈ]'
UNION ALL SELECT 'specialties.name',          count(*)::int FROM specialties      WHERE name        ~ '[ÃÄÅÈ]'
;

COMMIT;
