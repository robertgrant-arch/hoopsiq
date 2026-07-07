-- Film Room v2: coach-created clip assignments (see docs/film-room-schema-api.md)
-- Reuses film_sessions (uuid ids) as the source-film table; players.id is text.

DO $$ BEGIN
  CREATE TYPE clip_status_v2 AS ENUM ('suggested','draft','approved','assigned','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE clip_assignment_status AS ENUM ('draft','assigned','opened','watched','responded','completed','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS clips (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        text NOT NULL,
  session_id    uuid NOT NULL REFERENCES film_sessions(id) ON DELETE CASCADE,
  created_by    text NOT NULL,
  source        text NOT NULL DEFAULT 'coach' CHECK (source IN ('coach','ai_accepted')),
  status        clip_status_v2 NOT NULL DEFAULT 'draft',
  start_ms      integer NOT NULL CHECK (start_ms >= 0),
  end_ms        integer NOT NULL,
  title         text NOT NULL DEFAULT '',
  note          text NOT NULL DEFAULT '',
  note_source   text NOT NULL DEFAULT 'coach' CHECK (note_source IN ('coach','ai_draft_accepted','ai_draft_edited')),
  categories    text[] NOT NULL DEFAULT '{}',
  priority      text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
  locked_at     timestamptz,
  duplicate_of  uuid REFERENCES clips(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,
  CHECK (end_ms > start_ms)
);
CREATE INDEX IF NOT EXISTS clips_session_time_idx ON clips (session_id, start_ms) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS clips_org_status_idx   ON clips (org_id, status)       WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS clip_players (
  clip_id   uuid NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  player_id text NOT NULL,
  PRIMARY KEY (clip_id, player_id)
);
CREATE INDEX IF NOT EXISTS clip_players_player_idx ON clip_players (player_id);

CREATE TABLE IF NOT EXISTS clip_assignments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            text NOT NULL,
  clip_id           uuid NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  assigned_by       text NOT NULL,
  due_at            timestamptz,
  priority          text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
  require_response  boolean NOT NULL DEFAULT true,
  response_prompt   text,
  sent_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);
CREATE INDEX IF NOT EXISTS clip_assignments_org_idx ON clip_assignments (org_id, sent_at) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS clip_assignment_players (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           text NOT NULL,
  assignment_id    uuid NOT NULL REFERENCES clip_assignments(id) ON DELETE CASCADE,
  player_id        text NOT NULL,
  status           clip_assignment_status NOT NULL DEFAULT 'assigned',
  opened_at        timestamptz,
  watched_at       timestamptz,
  watch_pct        smallint NOT NULL DEFAULT 0 CHECK (watch_pct BETWEEN 0 AND 100),
  responded_at     timestamptz,
  completed_at     timestamptz,
  completed_by     text,
  review_requested boolean NOT NULL DEFAULT false,
  nudge_count      smallint NOT NULL DEFAULT 0,
  last_nudged_at   timestamptz,
  archived_reason  text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, player_id)
);
CREATE INDEX IF NOT EXISTS cap_org_status_idx   ON clip_assignment_players (org_id, status);
CREATE INDEX IF NOT EXISTS cap_player_state_idx ON clip_assignment_players (player_id, status);

CREATE TABLE IF NOT EXISTS player_reviews (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                text NOT NULL,
  assignment_player_id  uuid NOT NULL REFERENCES clip_assignment_players(id) ON DELETE CASCADE,
  author_user_id        text NOT NULL,
  kind                  text NOT NULL CHECK (kind IN ('text','choice','confidence','flag_review_request')),
  text_body             text,
  choice_index          smallint,
  confidence            smallint CHECK (confidence BETWEEN 1 AND 3),
  client_created_at     timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS player_reviews_ap_idx ON player_reviews (assignment_player_id, created_at);

CREATE TABLE IF NOT EXISTS coach_followups (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                text NOT NULL,
  assignment_player_id  uuid NOT NULL REFERENCES clip_assignment_players(id) ON DELETE CASCADE,
  author_user_id        text NOT NULL,
  kind                  text NOT NULL CHECK (kind IN ('reply','nudge','due_change','complete','reopen','reassign','escalate','archive')),
  body                  text,
  meta                  jsonb NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coach_followups_ap_idx ON coach_followups (assignment_player_id, created_at);

CREATE TABLE IF NOT EXISTS clip_idp_links (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                text NOT NULL,
  clip_id               uuid NOT NULL REFERENCES clips(id),
  assignment_player_id  uuid REFERENCES clip_assignment_players(id),
  player_id             text NOT NULL,
  focus_area            text NOT NULL,
  note                  text,
  escalated_by          text NOT NULL,
  source                text NOT NULL DEFAULT 'coach' CHECK (source IN ('coach','ai_recommended')),
  unlinked_at           timestamptz,
  unlink_reason         text,
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clip_idp_links_player_idx ON clip_idp_links (player_id) WHERE unlinked_at IS NULL;

CREATE TABLE IF NOT EXISTS film_audit_events (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id       text NOT NULL,
  actor_id     text,
  actor_kind   text NOT NULL CHECK (actor_kind IN ('coach','player','admin','system','ai')),
  entity_type  text NOT NULL,
  entity_id    text NOT NULL,
  action       text NOT NULL,
  detail       jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS film_audit_entity_idx ON film_audit_events (entity_type, entity_id, created_at);

-- Clip lock: bounds/note immutable once assigned (docs/film-room-clip-workspace.md AC10)
CREATE OR REPLACE FUNCTION enforce_clip_lock() RETURNS trigger AS $fn$
BEGIN
  IF OLD.locked_at IS NOT NULL AND (
       NEW.start_ms IS DISTINCT FROM OLD.start_ms OR
       NEW.end_ms   IS DISTINCT FROM OLD.end_ms   OR
       NEW.note     IS DISTINCT FROM OLD.note)
  THEN RAISE EXCEPTION 'CLIP_LOCKED';
  END IF;
  RETURN NEW;
END $fn$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clips_lock_guard ON clips;
CREATE TRIGGER clips_lock_guard BEFORE UPDATE ON clips
  FOR EACH ROW EXECUTE FUNCTION enforce_clip_lock();
