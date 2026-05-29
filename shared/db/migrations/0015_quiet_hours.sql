-- Migration: 0015_quiet_hours
-- Adds send-time enforcement to the communications safety stack.
--
-- Layer 3 of the HoopsOS messaging safety model:
--   Layer 1  guardian-policy     — Is every minor covered by a guardian?
--   Layer 2  thread-type-policy  — Is the thread structure itself safe?
--   Layer 3  quiet-hours         — Is this being sent during allowed hours?
--
-- Design decisions
-- ────────────────
-- • scheduled_at on the messages table is the queue marker.  When set, the
--   message exists in the DB but has not been delivered.  An Inngest function
--   (to be wired in a future slice) fires SMS / push when scheduled_at <= now().
--
-- • Emergency override details are NOT stored on the message row itself —
--   they live exclusively in quiet_hours_log so that the message surface stays
--   clean and audit data is properly separated.
--
-- • The quiet_hours_log is append-only and never modified after insert.

-- ── 1. Queue marker on messages ───────────────────────────────────────────────

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- Sparse index — only queued messages have a value.
CREATE INDEX IF NOT EXISTS messages_scheduled_at_idx
  ON messages (scheduled_at)
  WHERE scheduled_at IS NOT NULL;

-- ── 2. Quiet-hours policy audit log ──────────────────────────────────────────
--
-- One row per enforcement evaluation, recorded before the message is written.
-- When action = 'queued', message_id and thread_id are still stored (created
-- before the message is "released").  When action = 'blocked' there is no
-- message or thread.
--
-- action values:
--   skipped        — policy does not apply (non-staff sender or no minor recipients)
--   allowed        — within allowed window, message sent immediately
--   queued         — outside allowed window, message stored with scheduled_at
--   emergency_send — outside window but emergency override accepted; sent immediately
--
-- policy_window stores the human-readable rule, e.g. "05:00–21:00"
-- local_org_time  stores the sender-local timestamp at attempt, e.g. "22:14 CST"

CREATE TABLE IF NOT EXISTS quiet_hours_log (
  id                   TEXT        PRIMARY KEY,
  org_id               TEXT        NOT NULL,
  sender_id            TEXT        NOT NULL,
  thread_id            TEXT,
  message_id           TEXT,
  attempted_at         TIMESTAMPTZ NOT NULL,
  local_org_time       TEXT        NOT NULL,
  policy_window        TEXT        NOT NULL,
  org_timezone         TEXT        NOT NULL,
  action_taken         TEXT        NOT NULL,
  scheduled_at         TIMESTAMPTZ,
  emergency_reason     TEXT,
  emergency_note       TEXT,
  has_minor_recipients BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiet_hours_log_org_idx
  ON quiet_hours_log (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS quiet_hours_log_sender_idx
  ON quiet_hours_log (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS quiet_hours_log_thread_idx
  ON quiet_hours_log (thread_id)
  WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS quiet_hours_log_emergency_idx
  ON quiet_hours_log (org_id, created_at DESC)
  WHERE action_taken = 'emergency_send';
CREATE INDEX IF NOT EXISTS quiet_hours_log_scheduled_idx
  ON quiet_hours_log (scheduled_at)
  WHERE scheduled_at IS NOT NULL;
