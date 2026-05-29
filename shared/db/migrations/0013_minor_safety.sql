-- Migration: 0013_minor_safety
-- Adds minor age classification to player records and a full audit log
-- for every messaging policy decision (guardian-copy enforcement).
--
-- Business rule: any coach/staff message to a minor must automatically
-- include the minor's guardian. This migration creates the data layer
-- that makes that enforcement possible and auditable.

-- ── 1. Age classification on players ─────────────────────────────────────────

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS is_minor    BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Seed is_minor from grad_year where available.
-- Anyone who graduated in 2026 or earlier is treated as an adult.
-- The safe default (TRUE) is kept for players with no grad_year so that
-- the policy engine errs toward protection.
UPDATE players
  SET is_minor = CASE
    WHEN grad_year IS NOT NULL AND grad_year <= 2026 THEN FALSE
    ELSE TRUE
  END
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS players_is_minor_org_idx
  ON players (org_id, is_minor)
  WHERE deleted_at IS NULL;

-- ── 2. Policy action enum ─────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'policy_action'
  ) THEN
    CREATE TYPE policy_action AS ENUM (
      'allowed',
      'blocked',
      'guardian_auto_included'
    );
  END IF;
END$$;

-- ── 3. Messaging policy audit log ─────────────────────────────────────────────
--
-- One row per policy evaluation. Captures exactly what participants were
-- considered, which guardians were added, and why a send was blocked.
-- Never deleted — append-only audit trail.

CREATE TABLE IF NOT EXISTS messaging_policy_log (
  id                  TEXT        PRIMARY KEY,
  org_id              TEXT        NOT NULL,
  sender_id           TEXT        NOT NULL,           -- Clerk user ID of sender
  thread_id           TEXT,                           -- null for blocked (no thread created)
  minor_present       BOOLEAN     NOT NULL DEFAULT FALSE,
  guardians_added     TEXT[]      NOT NULL DEFAULT '{}',  -- guardian IDs added by policy
  participants_before TEXT[]      NOT NULL DEFAULT '{}',  -- player IDs in original spec
  participants_after  TEXT[]      NOT NULL DEFAULT '{}',  -- player IDs + added guardian IDs
  blocked_reason      TEXT,                           -- human-readable reason when blocked
  action              policy_action NOT NULL DEFAULT 'allowed',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messaging_policy_log_org_idx
  ON messaging_policy_log (org_id);
CREATE INDEX IF NOT EXISTS messaging_policy_log_sender_idx
  ON messaging_policy_log (sender_id);
CREATE INDEX IF NOT EXISTS messaging_policy_log_thread_idx
  ON messaging_policy_log (thread_id)
  WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS messaging_policy_log_created_at_idx
  ON messaging_policy_log (created_at DESC);
CREATE INDEX IF NOT EXISTS messaging_policy_log_blocked_idx
  ON messaging_policy_log (org_id, created_at DESC)
  WHERE action = 'blocked';
