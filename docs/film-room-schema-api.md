# Film Room v2 — Database Schema & API Model

Postgres DDL (works on Supabase or Neon unchanged) + REST API surface
(expressed as route handlers — mounts in Next.js `app/api/*` or the existing
Express module layout identically).

> Stack note: the current HoopsIQ repo is Express + Drizzle on Neon. This doc
> is written Supabase/Next-compatible as requested; every policy in the RLS
> section has a query-layer equivalent (`requireOrg`/`requireRole`) already
> present in the repo, so the design ports in either direction.

Conventions: `uuid` PKs (`gen_random_uuid()`), `org_id` on every row
(tenancy), `created_at`/`updated_at timestamptz` on every table
(`updated_at` via trigger), soft delete = `deleted_at timestamptz` (partial
indexes exclude it). `audit_events` is append-only, never deleted.

---

## 1. Enums

```sql
CREATE TYPE film_status        AS ENUM ('uploading','processing','ready','failed','archived');
CREATE TYPE film_type          AS ENUM ('game','practice','skill_rep','highlight');
CREATE TYPE asset_provider     AS ENUM ('mux','storage');       -- storage = Supabase Storage / S3
CREATE TYPE asset_status       AS ENUM ('pending','ready','errored');
CREATE TYPE clip_status        AS ENUM ('suggested','draft','approved','assigned','archived');
CREATE TYPE clip_source        AS ENUM ('coach','ai_accepted');
CREATE TYPE annotation_kind    AS ENUM ('telestration','text','marker');
CREATE TYPE assignment_status  AS ENUM ('draft','assigned','opened','watched','responded','completed','archived');
CREATE TYPE response_kind      AS ENUM ('text','choice','confidence','flag_review_request');
CREATE TYPE followup_kind      AS ENUM ('reply','nudge','due_change','complete','reopen','reassign','escalate','archive');
CREATE TYPE suggestion_kind    AS ENUM ('clip_boundary','tags','note_draft','duplicate','idp_recommend','pattern_summary');
CREATE TYPE suggestion_status  AS ENUM ('suggested','accepted','dismissed','expired');
CREATE TYPE priority_level     AS ENUM ('low','normal','high');
```

`overdue` and `escalated_to_idp` are **derived**, not enum members: overdue =
`due_at < now() AND status IN ('assigned','opened','watched')`;
escalated = `EXISTS (idp_links …)`. Derived flags can't drift.

## 2. Tables

```sql
-- 1 ── films: the logical film record (metadata layer)
CREATE TABLE films (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  team_id        uuid REFERENCES teams(id),
  created_by     uuid NOT NULL REFERENCES app_users(id),
  title          text NOT NULL,
  type           film_type NOT NULL DEFAULT 'game',
  status         film_status NOT NULL DEFAULT 'uploading',
  opponent       text,
  home_away      text CHECK (home_away IN ('home','away','neutral')),
  played_at      timestamptz,
  duration_ms    integer,                       -- from the ready asset
  categories     text[] NOT NULL DEFAULT '{}',
  metadata       jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz                    -- soft delete; 'archived' status is the user-facing tier
);
CREATE INDEX films_org_status_idx    ON films (org_id, status)    WHERE deleted_at IS NULL;
CREATE INDEX films_org_played_idx    ON films (org_id, played_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX films_org_type_idx      ON films (org_id, type)      WHERE deleted_at IS NULL;

-- 2 ── video_assets: provider-level media (1:N — re-uploads, renditions)
CREATE TABLE video_assets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  film_id        uuid NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  provider       asset_provider NOT NULL DEFAULT 'mux',
  provider_asset_id   text,                    -- Mux asset id
  provider_upload_id  text,                    -- Mux direct-upload id
  playback_id    text,                          -- signed playback
  status         asset_status NOT NULL DEFAULT 'pending',
  duration_ms    integer,
  aspect_ratio   text,
  error_reason   text,
  is_primary     boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX video_assets_provider_idx ON video_assets (provider, provider_asset_id);
CREATE UNIQUE INDEX video_assets_primary_idx  ON video_assets (film_id) WHERE is_primary;
CREATE INDEX video_assets_film_idx            ON video_assets (film_id);

-- 3 ── clips: coach-owned timestamped segments
CREATE TABLE clips (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  film_id        uuid NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  created_by     uuid NOT NULL REFERENCES app_users(id),
  source         clip_source NOT NULL DEFAULT 'coach',
  suggestion_id  uuid REFERENCES ai_suggestions(id),   -- provenance when ai_accepted
  status         clip_status NOT NULL DEFAULT 'draft',
  start_ms       integer NOT NULL CHECK (start_ms >= 0),
  end_ms         integer NOT NULL,
  title          text NOT NULL DEFAULT '',
  note           text NOT NULL DEFAULT '',
  note_source    text NOT NULL DEFAULT 'coach'
                 CHECK (note_source IN ('coach','ai_draft_accepted','ai_draft_edited')),
  categories     text[] NOT NULL DEFAULT '{}',
  priority       priority_level NOT NULL DEFAULT 'normal',
  locked_at      timestamptz,                  -- set on first assignment; bounds/note immutable after
  duplicate_of   uuid REFERENCES clips(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz,
  CHECK (end_ms > start_ms)
);
CREATE INDEX clips_film_time_idx   ON clips (film_id, start_ms) WHERE deleted_at IS NULL;
CREATE INDEX clips_org_status_idx  ON clips (org_id, status)    WHERE deleted_at IS NULL;
CREATE INDEX clips_categories_idx  ON clips USING gin (categories);

-- clip ↔ player tags (who the clip is about; assignment recipients prefill from this)
CREATE TABLE clip_players (
  clip_id   uuid NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  PRIMARY KEY (clip_id, player_id)
);
CREATE INDEX clip_players_player_idx ON clip_players (player_id);

-- 4 ── clip_annotations: telestration / frame notes, time-anchored inside a clip
CREATE TABLE clip_annotations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  clip_id     uuid NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES app_users(id),
  kind        annotation_kind NOT NULL,
  at_ms       integer NOT NULL,               -- offset within the FILM (same clock as clip bounds)
  duration_ms integer NOT NULL DEFAULT 0,     -- 0 = single frame
  body        text,                            -- text kinds
  drawing     jsonb,                           -- telestration vector data {shapes:[…], canvas:{w,h}}
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
CREATE INDEX clip_annotations_clip_idx ON clip_annotations (clip_id, at_ms) WHERE deleted_at IS NULL;

-- 5 ── clip_assignments: one send batch (clip + settings). Per-player state lives in 6.
CREATE TABLE clip_assignments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  clip_id           uuid NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  assigned_by       uuid NOT NULL REFERENCES app_users(id),
  due_at            timestamptz,
  priority          priority_level NOT NULL DEFAULT 'normal',
  require_response  boolean NOT NULL DEFAULT true,
  response_prompt   text,                      -- coach's custom reflection prompt
  choice_question   jsonb,                     -- {q, options[2..4], correct?} understanding check
  confidence_check  boolean NOT NULL DEFAULT false,
  sent_at           timestamptz,               -- NULL = draft (ready-to-send tray)
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);
CREATE INDEX clip_assignments_org_idx  ON clip_assignments (org_id, sent_at) WHERE deleted_at IS NULL;
CREATE INDEX clip_assignments_clip_idx ON clip_assignments (clip_id);

-- 6 ── clip_assignment_players: the accountability row (queue rows render from here)
CREATE TABLE clip_assignment_players (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  assignment_id  uuid NOT NULL REFERENCES clip_assignments(id) ON DELETE CASCADE,
  player_id      uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status         assignment_status NOT NULL DEFAULT 'assigned',
  opened_at      timestamptz,
  watched_at     timestamptz,
  watch_pct      smallint NOT NULL DEFAULT 0 CHECK (watch_pct BETWEEN 0 AND 100),
  responded_at   timestamptz,
  completed_at   timestamptz,
  completed_by   uuid REFERENCES app_users(id),   -- NULL = auto-complete
  review_requested boolean NOT NULL DEFAULT false, -- "I want to review this with coach"
  nudge_count    smallint NOT NULL DEFAULT 0,
  last_nudged_at timestamptz,
  archived_reason text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, player_id)
);
CREATE INDEX cap_org_status_idx   ON clip_assignment_players (org_id, status);
CREATE INDEX cap_player_state_idx ON clip_assignment_players (player_id, status);
-- the overdue scan:
CREATE INDEX cap_overdue_idx      ON clip_assignment_players (org_id)
  WHERE status IN ('assigned','opened','watched');

-- 7 ── player_reviews: what the player actually did (events + responses)
CREATE TABLE player_reviews (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  assignment_player_id  uuid NOT NULL REFERENCES clip_assignment_players(id) ON DELETE CASCADE,
  kind                  response_kind NOT NULL,
  text_body             text,                  -- kind=text (≤500 enforced in API)
  choice_index          smallint,              -- kind=choice
  confidence            smallint CHECK (confidence BETWEEN 1 AND 3),  -- kind=confidence
  client_created_at     timestamptz,           -- offline-capture time
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX player_reviews_ap_idx ON player_reviews (assignment_player_id, created_at);

-- 8 ── coach_followups: every coach action closing the loop (also the reply thread)
CREATE TABLE coach_followups (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  assignment_player_id  uuid NOT NULL REFERENCES clip_assignment_players(id) ON DELETE CASCADE,
  author_id             uuid NOT NULL REFERENCES app_users(id),
  kind                  followup_kind NOT NULL,
  body                  text,                  -- reply text
  meta                  jsonb NOT NULL DEFAULT '{}',  -- e.g. {old_due, new_due} for due_change
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX coach_followups_ap_idx ON coach_followups (assignment_player_id, created_at);

-- 9 ── ai_suggestions: every AI output, suggest-only contract
CREATE TABLE ai_suggestions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  film_id        uuid REFERENCES films(id) ON DELETE CASCADE,
  clip_id        uuid REFERENCES clips(id) ON DELETE CASCADE,
  player_id      uuid REFERENCES players(id),           -- idp_recommend / pattern_summary
  kind           suggestion_kind NOT NULL,
  payload        jsonb NOT NULL,               -- validated against kind's schema (see ai-layer doc)
  confidence     numeric(3,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  status         suggestion_status NOT NULL DEFAULT 'suggested',
  resolved_by    uuid REFERENCES app_users(id),
  resolved_at    timestamptz,
  model_version  text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz,                  -- suggestions go stale; auto 'expired'
  CHECK (film_id IS NOT NULL OR clip_id IS NOT NULL OR player_id IS NOT NULL)
);
CREATE INDEX ai_suggestions_film_idx   ON ai_suggestions (film_id, kind, status);
CREATE INDEX ai_suggestions_player_idx ON ai_suggestions (player_id, kind, status);

-- 10 ── idp_links: the film → development ledger (bidirectional index)
CREATE TABLE idp_links (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  clip_id               uuid NOT NULL REFERENCES clips(id),
  assignment_player_id  uuid REFERENCES clip_assignment_players(id),
  player_id             uuid NOT NULL REFERENCES players(id),
  idp_item_id           uuid NOT NULL,          -- FK into existing IDP focus-area/evidence table
  escalated_by          uuid NOT NULL REFERENCES app_users(id),
  source                text NOT NULL DEFAULT 'coach'
                        CHECK (source IN ('coach','ai_recommended')),  -- ai_recommended still coach-executed
  suggestion_id         uuid REFERENCES ai_suggestions(id),
  note                  text,
  unlinked_at           timestamptz,
  unlink_reason         text,
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idp_links_player_idx ON idp_links (player_id) WHERE unlinked_at IS NULL;
CREATE INDEX idp_links_clip_idx   ON idp_links (clip_id);
CREATE UNIQUE INDEX idp_links_unique_idx ON idp_links (clip_id, player_id, idp_item_id)
  WHERE unlinked_at IS NULL;

-- 11 ── audit_events: append-only history of every state change (the event log UI + webhook source)
CREATE TABLE audit_events (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id       uuid NOT NULL,
  actor_id     uuid,                            -- NULL = system (webhook, auto-complete)
  actor_kind   text NOT NULL CHECK (actor_kind IN ('coach','player','admin','system','ai')),
  entity_type  text NOT NULL,                   -- 'film'|'clip'|'assignment_player'|'suggestion'|'idp_link'
  entity_id    uuid NOT NULL,
  action       text NOT NULL,                   -- 'created'|'status_changed'|'nudged'|'accepted'|…
  before       jsonb,
  after        jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_entity_idx ON audit_events (entity_type, entity_id, created_at);
CREATE INDEX audit_events_org_time_idx ON audit_events (org_id, created_at DESC);
-- No UPDATE/DELETE grants on this table for any app role.
```

**Lock enforcement (DB-level, not just UI):**
```sql
CREATE OR REPLACE FUNCTION enforce_clip_lock() RETURNS trigger AS $$
BEGIN
  IF OLD.locked_at IS NOT NULL AND (
       NEW.start_ms IS DISTINCT FROM OLD.start_ms OR
       NEW.end_ms   IS DISTINCT FROM OLD.end_ms   OR
       NEW.note     IS DISTINCT FROM OLD.note)
  THEN RAISE EXCEPTION 'clip % is locked (assigned); duplicate to edit', OLD.id;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER clips_lock_guard BEFORE UPDATE ON clips
  FOR EACH ROW EXECUTE FUNCTION enforce_clip_lock();
```

---

## 3. API routes

REST, JSON, bearer auth. Next.js: `app/api/film/...`; Express: the same paths
under the existing `/api` mount. All routes org-scoped by session.

| # | Route | Auth | Behavior |
|---|-------|------|----------|
| 1 | `POST /api/films/uploads` | coach+ | body `{title, type, opponent?, played_at?}` → creates `films` (uploading) + `video_assets` (pending) → returns `{film, upload_url}` (Mux direct upload). Webhook flips states. |
| 2 | `POST /api/films/:filmId/clips` | coach+ | body `{start_ms, end_ms, title?, note?, categories?, player_ids?}` → clip (`draft`) + `clip_players`. 201 `{clip}`. |
| 3 | `PATCH /api/clips/:clipId` | coach+ | partial update incl. `status: 'approved'`. 409 with `{code:'CLIP_LOCKED'}` if bound/note change on a locked clip (trigger backs this). Autosave target. |
| 4 | `POST /api/clips/:clipId/annotations` | coach+ | body `{kind, at_ms, duration_ms?, body?, drawing?}` → 201. `PATCH/DELETE /api/annotations/:id` for edits. |
| 5 | `POST /api/clips/:clipId/assignments` | coach+ | body `{player_ids[], due_at?, priority?, require_response, response_prompt?, choice_question?, confidence_check?, send: bool}` → `clip_assignments` + one `clip_assignment_players` per player; `send:false` leaves the draft tray; `send:true` sets `sent_at`, locks the clip, fans out notifications. Rejects if clip.status ≠ 'approved'. **The only route that creates player-visible work; requires human coach session — no service-role bypass.** |
| 6 | `GET /api/assignments` | coach+ | queue query: `?team&player&assigned_by&status[]&overdue&priority&category&from&to&sort&cursor`. Returns rows joined (clip, film title, player, response preview, derived overdue/escalated flags) + summary aggregates. Cursor-paginated. Players calling this get only their own rows (RLS). |
| 7 | `POST /api/assignment-players/:id/review` | player (own row) | body `{kind, text_body?/choice_index?/confidence?, client_created_at?}` → `player_reviews` row; transitions status (`watched→responded`). Separate lightweight `POST .../progress {watch_pct}` drives `opened/watched`. Idempotency key honored (offline replay). |
| 8 | `POST /api/assignment-players/:id/followups` | coach+ | body `{kind, body?, meta?}` → reply/nudge/due_change/complete/reopen/archive. `kind:'complete'` sets `completed_at/by` + status. Nudge enforces 12h rate limit → 429. |
| 9 | `POST /api/assignment-players/:id/escalate` | coach+ | body `{idp_item_id | new_focus_area, note?}` → `idp_links` row (+ IDP evidence via existing module), `followups` row (`kind:'escalate'`). Works from clip too: `POST /api/clips/:clipId/escalate` with `player_id`. |
| 10 | `POST /api/films/:filmId/suggestions` | coach+ | body `{kinds?: [...]}` → enqueues generation; 202 `{job_id}`. `GET /api/films/:filmId/suggestions?kind&status` lists; `POST /api/suggestions/:id/accept` / `:id/dismiss` resolve (accept materializes per kind — boundary→draft clip, note→returns draft text for the editor). |

Bulk variants: `POST /api/assignments/bulk` `{ids[], action: 'reassign'|'due_change'|'complete'|'escalate'|'archive', params}` → per-id result array.

---

## 4. Row-level security

Helper (Supabase): membership claims resolved once per request.

```sql
CREATE FUNCTION current_org_role(check_org uuid) RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT role FROM org_members
  WHERE org_id = check_org AND user_id = auth.uid() AND deleted_at IS NULL
$$;
```

Policy pattern per table (films shown; clips/annotations/suggestions identical):

```sql
ALTER TABLE films ENABLE ROW LEVEL SECURITY;
CREATE POLICY films_read  ON films FOR SELECT
  USING (current_org_role(org_id) IS NOT NULL AND deleted_at IS NULL);
CREATE POLICY films_write ON films FOR INSERT WITH CHECK
  (current_org_role(org_id) IN ('coach','admin','owner'));
CREATE POLICY films_update ON films FOR UPDATE
  USING (current_org_role(org_id) IN ('coach','admin','owner'));
-- no DELETE policy: soft delete via UPDATE only
```

Player-scoped tables get ownership predicates:

```sql
CREATE POLICY cap_player_read ON clip_assignment_players FOR SELECT
  USING (
    current_org_role(org_id) IN ('coach','admin','owner')
    OR player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    OR player_id IN (SELECT player_id FROM guardians WHERE user_id = auth.uid())  -- parent read-only
  );
CREATE POLICY reviews_player_write ON player_reviews FOR INSERT WITH CHECK (
  assignment_player_id IN (
    SELECT cap.id FROM clip_assignment_players cap
    JOIN players p ON p.id = cap.player_id
    WHERE p.user_id = auth.uid()
  )
);
```

Special cases: `ai_suggestions` — SELECT/UPDATE(resolve) coach+ only; players
have **no** policy (AI is invisible player-side). `audit_events` — INSERT via
`SECURITY DEFINER` function only; SELECT coach+ scoped to org; no
UPDATE/DELETE for anyone. Clip lock: the trigger runs regardless of role, so
even service-role writes can't mutate assigned clips.

## 5. Permission model

| Capability | Player | Parent | Coach | Org admin/owner |
|---|---|---|---|---|
| View own assignments/clips | ✅ | ✅ (child, read-only) | ✅ all | ✅ all |
| Submit review/response | ✅ own | — | — | — |
| Upload film / create clips / annotate | — | — | ✅ | ✅ |
| Assign clips / follow-ups / nudge | — | — | ✅ | ✅ |
| Escalate to IDP | — | — | ✅ | ✅ |
| Resolve AI suggestions | — | — | ✅ | ✅ |
| Bulk actions / archive | — | — | ✅ | ✅ |
| Org settings (auto-complete window, notification caps) | — | — | — | ✅ |
| View audit log | — | — | ✅ (own org) | ✅ |

Assistant-coach nuance (uses existing staff-role matrix): `analyst` role =
coach powers minus assign/escalate (prep clips, can't send).

## 6. Webhooks / events model

**Inbound:** `POST /api/webhooks/mux` (HMAC-verified, existing) —
`video.asset.ready` → asset `ready`, film `ready`, notify uploader;
`video.asset.errored` → `failed` + reason.

**Internal event spine:** every mutation writes `audit_events` inside the
same transaction; a queue consumer (Inngest, already in the stack) tails it
for side effects — notification fan-out (assignment sent, nudge, coach
reply, due-soon digests), auto-complete sweeps, suggestion expiry, and
webhook delivery. Rule: **route handlers write state + audit row; all fan-out
is async from the spine.** Retries never double-send because delivery is
keyed on `audit_events.id`.

**Outbound org webhooks** (admin-configured, HMAC-signed, versioned):
`film.ready` · `clip.assigned` · `assignment.responded` ·
`assignment.completed` · `assignment.overdue` (daily sweep) ·
`idp.linked`. Payload = `{event, occurred_at, org_id, data:{…}}`, retried
with exponential backoff for 24h, auto-disabled after 100 consecutive
failures.

**Scheduled jobs:** overdue sweep (hourly, notification-capped per player
per day) · auto-complete (org-configurable N days) · suggestion expiry
(14d) · weekly AI calibration batch (accept/dismiss rates → capability
priors).
```
