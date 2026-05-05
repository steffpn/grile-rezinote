-- 0003_handoff_hardening.sql
--
-- Bundles the schema changes required for the pre-handoff hardening pass:
--   1. New columns:
--        - users.marketing_opt_in_at         (GDPR audit timestamp)
--   2. New table:
--        - email_change_tokens               (verified email-change flow)
--   3. ON DELETE rules so account deletion works without manual cleanup
--   4. UNIQUE constraints on subscription identifiers
--   5. Hot-path indexes
--
-- Idempotent: every statement uses IF NOT EXISTS / DO blocks so re-running on
-- an already-migrated database is safe.
--
-- Run from the repo root:
--   psql "$DATABASE_URL" -f src/lib/db/migrations/0003_handoff_hardening.sql

BEGIN;

-- =============================================================================
-- 1. New columns
-- =============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS marketing_opt_in_at timestamp;

-- Backfill: any user with marketing_opt_in = true but a NULL timestamp gets the
-- created_at as the consent date (best estimate when we didn't track it before).
UPDATE users
   SET marketing_opt_in_at = created_at
 WHERE marketing_opt_in = true
   AND marketing_opt_in_at IS NULL;

-- =============================================================================
-- 2. email_change_tokens
-- =============================================================================

CREATE TABLE IF NOT EXISTS email_change_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_email    text NOT NULL,
  token        text NOT NULL UNIQUE,
  expires_at   timestamp NOT NULL,
  used_at      timestamp,
  created_at   timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_change_tokens_user_id_idx
  ON email_change_tokens(user_id);

-- =============================================================================
-- 3. ON DELETE rules
--    The original schema set FKs without an explicit ON DELETE clause, which
--    means deleting a user errors out with FK violations. Switch to CASCADE on
--    user-owned data so account deletion (GDPR Article 17) works.
-- =============================================================================

DO $$
DECLARE
  fk RECORD;
BEGIN
  FOR fk IN
    SELECT conname, conrelid::regclass AS tbl
      FROM pg_constraint
     WHERE contype = 'f'
       AND conrelid IN (
         'attempts'::regclass,
         'subscriptions'::regclass,
         'audit_logs'::regclass
       )
       AND confrelid = 'users'::regclass
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.tbl, fk.conname);
  END LOOP;
END $$;

ALTER TABLE attempts
  ADD CONSTRAINT attempts_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE audit_logs
  ADD CONSTRAINT audit_logs_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- =============================================================================
-- 4. UNIQUE constraints on subscription identifiers
--    Concurrent getOrCreateCustomer calls could currently insert duplicate
--    subscription rows for the same user. Lock that down.
--    Same for stripe_subscription_id — prevents webhook race confusion.
--    First de-dupe (keep the most recently updated row) before adding UNIQUE.
-- =============================================================================

-- De-dupe subscriptions(user_id): keep one row per user (the one with the most
-- recent created_at; ties broken by id).
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id
           ORDER BY created_at DESC NULLS LAST, id
         ) AS rn
    FROM subscriptions
)
DELETE FROM subscriptions
 WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Add the constraints if not already present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'subscriptions_user_id_unique'
  ) THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'subscriptions_stripe_subscription_id_unique'
  ) THEN
    -- A NULL stripe_subscription_id is fine — only enforce uniqueness on rows
    -- that actually have an ID. Postgres treats NULLs as distinct by default.
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_stripe_subscription_id_unique
      UNIQUE (stripe_subscription_id);
  END IF;
END $$;

-- =============================================================================
-- 5. Hot-path indexes
--    The original schema relied entirely on PK / UNIQUE for indexing, which
--    means the webhook handler does sequential scans on subscriptions and the
--    dashboard scans every user's attempt history. Add btree indexes on the
--    columns we actually filter / join by.
-- =============================================================================

-- Subscriptions: webhook handler joins on stripe_customer_id; reads by user_id
-- (the latter now has a UNIQUE → btree, but we'll add an explicit one for
-- backward-compat in case a future migration drops the UNIQUE).
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx
  ON subscriptions(stripe_customer_id);

-- Attempts: dashboard, history, ranking queries.
CREATE INDEX IF NOT EXISTS attempts_user_id_idx
  ON attempts(user_id);
CREATE INDEX IF NOT EXISTS attempts_user_id_completed_at_idx
  ON attempts(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS attempts_user_id_status_idx
  ON attempts(user_id, status);

-- Attempt answers: every results page joins on attempt_id.
CREATE INDEX IF NOT EXISTS attempt_answers_attempt_id_idx
  ON attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS attempt_answers_question_id_idx
  ON attempt_answers(question_id);

-- Questions: practice/exam composition filters by chapter.
CREATE INDEX IF NOT EXISTS questions_chapter_id_idx
  ON questions(chapter_id);

-- Audit logs: admin tools filter by user.
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx
  ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx
  ON audit_logs(entity_type, entity_id);

-- Sessions: cleanup queries scan by user_id.
CREATE INDEX IF NOT EXISTS sessions_user_id_idx
  ON sessions(user_id);

COMMIT;
