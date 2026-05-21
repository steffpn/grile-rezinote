-- ─────────────────────────────────────────────────────────────────────────────
-- Diagnostic: list all tables visible to the current connection.
-- ─────────────────────────────────────────────────────────────────────────────
-- Run this first if you see "relation does not exist" errors.
--
-- Usage:
--   psql "<DATABASE_PUBLIC_URL>" -f scripts/sql/00-list-tables.sql
-- ─────────────────────────────────────────────────────────────────────────────

SET client_encoding TO 'UTF8';

\echo ''
\echo '── Current database / user / search_path ─────────────────────────────────'
SELECT
  current_database() AS database,
  current_user      AS db_user,
  current_schema()  AS default_schema,
  current_setting('search_path') AS search_path;

\echo ''
\echo '── All schemas ───────────────────────────────────────────────────────────'
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schema_name;

\echo ''
\echo '── All tables across user schemas ────────────────────────────────────────'
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;
