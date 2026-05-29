-- Migration: 0014_thread_type_policy
-- Introduces four policy-approved thread types and a dedicated audit log
-- for thread-type classification decisions.
--
-- These types replace ad-hoc "dm" / "broadcast" usage when minors are involved.
-- Every thread that includes a minor must now be one of the approved types,
-- each of which carries explicit semantics about who is copied and why.

-- ── 1. Extend the thread_type enum ───────────────────────────────────────────
--
-- ADD VALUE IF NOT EXISTS is safe on Postgres 9.1+ and is idempotent.
-- Values are appended to the existing enum; existing rows are unaffected.

ALTER TYPE thread_type ADD VALUE IF NOT EXISTS 'coach_to_parent';
ALTER TYPE thread_type ADD VALUE IF NOT EXISTS 'coach_to_minor_with_guardian';
ALTER TYPE thread_type ADD VALUE IF NOT EXISTS 'coach_to_team_with_adult_copy';
ALTER TYPE thread_type ADD VALUE IF NOT EXISTS 'staff_internal';

-- ── 2. Thread type policy audit log ──────────────────────────────────────────
--
-- One row per thread creation attempt (allowed or blocked).
-- Captures the full context so any classification decision can be replayed
-- and audited independently of the messaging_policy_log (which tracks
-- the guardian-copy layer from slice 1).
--
-- Columns
-- ───────
--   sender_id              Clerk user ID of the thread creator
--   thread_id              DB thread ID — null when the attempt was blocked
--   requested_type         Thread type the caller asked for (may be null / legacy)
--   classified_type        Type determined by the policy engine
--   sender_role            org_members.role at time of request
--   has_minor_recipients   True when at least one player recipient is a minor
--   has_guardian_recipients True when at least one guardian is in the audience
--   is_team_thread         True when > 1 player recipient
--   second_adult_present   True when a second staff member was added to the thread
--   allowed                Whether the attempt was permitted
--   blocked_reason         Human-readable reason (non-null only when allowed=false)
--   blocked_code           Machine-readable code for client error handling
--   badges                 UI badge keys that would appear on this thread type
--   org_settings_snapshot  Org messaging settings at time of decision (for replay)

CREATE TABLE IF NOT EXISTS thread_type_policy_log (
  id                       TEXT        PRIMARY KEY,
  org_id                   TEXT        NOT NULL,
  sender_id                TEXT        NOT NULL,
  thread_id                TEXT,
  requested_type           TEXT,
  classified_type          TEXT,
  sender_role              TEXT        NOT NULL,
  has_minor_recipients     BOOLEAN     NOT NULL DEFAULT FALSE,
  has_guardian_recipients  BOOLEAN     NOT NULL DEFAULT FALSE,
  is_team_thread           BOOLEAN     NOT NULL DEFAULT FALSE,
  second_adult_present     BOOLEAN     NOT NULL DEFAULT FALSE,
  allowed                  BOOLEAN     NOT NULL DEFAULT TRUE,
  blocked_reason           TEXT,
  blocked_code             TEXT,
  badges                   TEXT[]      NOT NULL DEFAULT '{}',
  org_settings_snapshot    JSONB       NOT NULL DEFAULT '{}',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS thread_type_policy_log_org_idx
  ON thread_type_policy_log (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS thread_type_policy_log_sender_idx
  ON thread_type_policy_log (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS thread_type_policy_log_thread_idx
  ON thread_type_policy_log (thread_id)
  WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS thread_type_policy_log_blocked_idx
  ON thread_type_policy_log (org_id, created_at DESC)
  WHERE allowed = FALSE;
