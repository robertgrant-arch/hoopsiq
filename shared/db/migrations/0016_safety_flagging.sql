-- Migration: 0016_safety_flagging
-- Adds Layer 4 of the HoopsOS communications safety stack:
-- deterministic rule-based content flagging.
--
-- Design
-- ──────
-- Two tables, intentionally separate in purpose:
--
--   safety_flags        Immutable evidence record.  Written once at detection
--                       time and never modified.  Preserves the original message
--                       body, every matched rule, severity, and thread context.
--                       message_id is null when the message was BLOCKED before
--                       reaching the DB.
--
--   flag_review_items   Mutable triage state.  One row per flag that requires
--                       human review (high + medium severity).  Admins update
--                       status; the corresponding flag row stays immutable.
--
-- This separation means the audit trail is preserved even after an admin
-- dismisses an item.

-- ── 1. Safety flags (evidence, append-only) ────────────────────────────────

CREATE TABLE IF NOT EXISTS safety_flags (
  id                   TEXT        PRIMARY KEY,
  org_id               TEXT        NOT NULL,
  -- Link to the created message, or null when the send was blocked.
  message_id           TEXT,
  thread_id            TEXT,
  sender_id            TEXT        NOT NULL,
  sender_role          TEXT        NOT NULL,
  -- Snapshot of the message body at detection time.  Preserved for evidence
  -- even if the message is later edited or deleted.
  body_snapshot        TEXT        NOT NULL,
  -- JSON array: [{ruleId, category, severity, matchedText, description}]
  matched_rules        JSONB       NOT NULL DEFAULT '[]',
  -- Aggregate severity across all matched rules.
  max_severity         TEXT        NOT NULL,   -- "low" | "medium" | "high"
  -- Deduplicated list of matched flag categories.
  categories           TEXT[]      NOT NULL DEFAULT '{}',
  -- True when the message was rejected by the safety layer.
  was_blocked          BOOLEAN     NOT NULL DEFAULT FALSE,
  has_minor_recipients BOOLEAN     NOT NULL DEFAULT FALSE,
  thread_type          TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS safety_flags_org_idx
  ON safety_flags (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS safety_flags_sender_idx
  ON safety_flags (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS safety_flags_severity_idx
  ON safety_flags (org_id, max_severity, created_at DESC);
CREATE INDEX IF NOT EXISTS safety_flags_message_idx
  ON safety_flags (message_id)
  WHERE message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS safety_flags_blocked_idx
  ON safety_flags (org_id, created_at DESC)
  WHERE was_blocked = TRUE;

-- ── 2. Flag review items (triage queue, mutable) ──────────────────────────

CREATE TABLE IF NOT EXISTS flag_review_items (
  id            TEXT        PRIMARY KEY,
  org_id        TEXT        NOT NULL,
  flag_id       TEXT        NOT NULL,        -- FK → safety_flags.id
  -- Triage status.  Only "open" and "escalated" items appear in the
  -- default admin queue view.
  status        TEXT        NOT NULL DEFAULT 'open',  -- "open" | "dismissed" | "escalated"
  -- Clerk user ID of the admin who reviewed this item.
  reviewed_by   TEXT,
  review_note   TEXT,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS flag_review_items_org_status_idx
  ON flag_review_items (org_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS flag_review_items_flag_idx
  ON flag_review_items (flag_id);
CREATE INDEX IF NOT EXISTS flag_review_items_open_idx
  ON flag_review_items (org_id, created_at DESC)
  WHERE status = 'open';
CREATE INDEX IF NOT EXISTS flag_review_items_escalated_idx
  ON flag_review_items (org_id, created_at DESC)
  WHERE status = 'escalated';
