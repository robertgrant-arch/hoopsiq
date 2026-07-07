# Film Room v2 — Coach-Controlled Clip Workflow

**Thesis:** the unit of value is a **coach-approved clip assignment** — a timestamped
segment, annotated by a coach, tagged to players, assigned for review, with visible
accountability. AI suggests; the coach decides; nothing reaches a player without
coach approval.

---

## 1. Product architecture

```
FILM ROOM (coach)
├── Library            all sessions: filter by type/status/opponent/date
├── Session Workbench  player + timeline + clip rail — where clips are made
├── Assignment Board   every clip assignment × player, accountability grid
└── (AI services)      suggest-only: boundaries, tags, draft notes,
                       duplicates, IDP recommendation

PLAYER FILM (player, mobile-first)
├── My Clips inbox     assigned clips, due dates, unwatched badge
└── Clip viewer        watch → respond → done

Existing modules repositioned:
- "Film Analysis Hub" copy dies. Film Room's front door is the Library.
- Queue becomes the Assignment Board (coach's accountability view).
- Scouting keeps its own flows; can source clips from the same sessions.
- IDP escalation reuses coaching_actions — "promote clip → IDP item" is a
  coach action on an approved clip, never automatic.
```

**AI boundary (hard rule):** every AI output lands as a `suggestion` attached to a
session or clip in `suggested` state. The only transitions out are coach `accept`
(materializes/edits the thing) or `dismiss`. No AI path writes to
`clip_assignments`.

---

## 2. UX flows

**F1 — Upload → clip → assign (coach, the golden path)**
1. Library → Upload (Mux direct upload; type, opponent, date). Session shows
   `uploading → processing → ready`; usable the moment playback is ready.
2. Open Workbench. Video left; timeline underneath; clip rail right.
3. Scrub → `[I]` mark in, `[O]` mark out → clip drawer opens pre-filled
   (bounds, blank title/note, tag picker).
4. Optional: "Suggest" panel lists AI boundary/tag/note suggestions — each row
   is Accept / Edit / Dismiss.
5. Tag 1–n players, pick categories, write/accept note → **Approve**.
6. Select approved clips → **Assign** (players prefilled from tags, due date,
   response required? y/n) → one assignment row per player.
7. Player gets a notification + inbox item.

**F2 — Player review (mobile)**
Inbox → tap clip → full-screen player with coach note overlayed at the clip's
timestamps → mark watched (auto at ≥90% playback) → respond (text, MVP) if
required → done. Badge count decrements.

**F3 — Accountability (coach)**
Assignment Board: rows = assignments, columns = state. Filters: player, session,
overdue-only. A glance answers "who hasn't watched the Tuesday game clips?" Tap
row → clip + response thread → acknowledge response (closes loop) or reply.

**F4 — Escalate to IDP**
On any approved clip (AI may recommend, coach decides): "Add to IDP" → picks
player + focus area → creates coaching_action / IDP evidence linking back to
the clip.

---

## 3. Screen specs

**S1 Library** (`/app/coach/film`) — dense table/card hybrid. Row: thumbnail,
title, TYPE chip (GAME/PRACTICE/SKILL REP/HIGHLIGHT), opponent/date, duration,
clip count, assignment coverage ("8 clips · 12 assigned · 3 unwatched"),
status. Primary action: Upload. Filters persist in URL params.

**S2 Session Workbench** (`/app/coach/film/:sessionId`) — the core screen.
- Left 70%: video (Mux player), keyboard-first: space, ←/→ ±5s, I/O bounds,
  Enter = save clip.
- Under video: timeline strip with clip spans (color by status: gray draft,
  amber suggested, green approved, blue assigned).
- Right 30%: clip rail — compact rows (time range, title, player chips,
  category chips, status). Click = seek + open drawer. Multi-select →
  bulk Approve / Assign.
- Suggestion panel (collapsible, badge count): AI rows with confidence,
  Accept/Edit/Dismiss. Accept creates a `draft` clip owned by the coach.
- Clip drawer (right overlay): bounds (nudge ±0.5s), title, note (with
  "Draft with AI" button that fills the field for editing), categories,
  player tags, Approve / Approve & Assign.

**S3 Assignment Board** (`/app/coach/film/assignments`) — grid, one row per
assignment: player, clip title + 3s hover-scrub thumbnail, session, assigned
date, due, state pill (Assigned / Viewed / Responded / Closed / **Overdue** in
red), response preview. Bulk nudge (re-notify). Summary header: total, watched
%, responded %, overdue count.

**S4 Player inbox** (`/app/player/film`, mobile-first) — card list: coach
avatar, clip title, duration, due chip, state. Unwatched sort-first.

**S5 Player clip viewer** — full-bleed video, coach note as caption card,
response box under (required flag blocks "Done" until submitted), previous
clips from same session swipeable.

---

## 4. Data model

Reuse: `film_sessions` (as-is), `film_assets` (Mux), `annotations`
(free-floating telestration/notes stay), `analysis_jobs` (feeds suggestions),
`coaching_actions`/IDP tables (escalation), `app_users`/`players`.

New tables:

```sql
clips (
  id uuid PK, org_id FK, session_id FK film_sessions,
  created_by_user_id text,           -- coach
  source text,                        -- 'coach' | 'ai_accepted'
  status text,                        -- see §5
  start_ms int, end_ms int,
  title text, note text,
  categories text[],                  -- e.g. {defense, closeout}
  suggestion_id uuid NULL,            -- provenance when accepted from AI
  created_at/updated_at/deleted_at
)
clip_players (clip_id FK, player_id FK, PK(clip_id, player_id))

clip_assignments (
  id uuid PK, org_id, clip_id FK, player_id FK,
  assigned_by_user_id text, assigned_at, due_at NULL,
  require_response bool,
  status text,                        -- see §5
  first_viewed_at NULL, view_count int default 0,
  responded_at NULL, closed_at NULL,
  UNIQUE(clip_id, player_id)
)

clip_responses (
  id uuid PK, assignment_id FK, author_user_id text,
  body text, created_at                -- coach replies + player responses; thread
)

ai_suggestions (
  id uuid PK, org_id, session_id FK, job_id FK NULL,
  kind text,        -- 'clip_boundary' | 'tags' | 'note_draft' | 'duplicate' | 'idp_recommend'
  target_clip_id NULL,               -- for per-clip suggestions
  payload jsonb,    -- bounds/labels/text/confidence
  status text,      -- 'suggested' | 'accepted' | 'dismissed'
  resolved_by_user_id NULL, resolved_at NULL
)
```

Player dashboards: emit a lightweight `assignments` row (existing module,
`type: film_review`, payload → clip_assignment_id) so film review shows up in
the player's unified assignment list without a second inbox system.

---

## 5. State model

```
SESSION   uploading → processing → ready → archived      (failed from any)
          AI analysis is an overlay job, not a session state: none|running|done|failed

CLIP      suggested (AI only) ─accept→ draft            ─dismiss→ (gone)
          draft ─approve→ approved ─assign→ assigned
          approved/assigned ─archive→ archived
          Only 'approved' clips are assignable. Editing an approved clip
          returns it to draft if bounds/note change after assignment? No —
          bounds/note lock once any assignment exists; changes require
          duplicate-and-reassign (keeps what players saw auditable).

ASSIGNMENT assigned → viewed → responded → closed
           - viewed: ≥90% playback or explicit "mark watched"
           - responded: only when require_response (else viewed→closed on coach ack or auto after N days)
           - closed: coach acknowledges (or bulk-closes)
           - overdue: derived (due_at < now && status ∈ {assigned, viewed})
           - nudged_at timestamp for re-notification, not a state
```

---

## 6. MVP scope

**In:** Library (existing, re-copy); Workbench with manual clipping (I/O keys,
drawer, tags, categories, approve); assign flow + Assignment Board; player
inbox + viewer + watched tracking + text response; coach ack/close;
`clips/clip_players/clip_assignments/clip_responses` tables + routes;
AI level 1 only — **suggest clip boundaries + tags** from the existing
analysis_jobs output, rendered in the suggestion panel with accept/dismiss.

**Out (fast follows):** note drafting (AI), duplicate detection, IDP
recommendation (manual escalate stays in), video responses, highlight reel
composition, bulk cross-session assignment, telestration-on-clip (existing
annotations keep working at session level), parent visibility.

**Kill:** "AI-powered pattern detection" hub copy, auto-generated insight
cards, confirm/dismiss/escalate framing at hub level.

---

## 7. Implementation plan

Each phase ships independently behind the existing Film nav.

1. **Schema + API** — migration for the four tables; `server/modules/clips/`
   routes: clips CRUD (org+role guarded, coach-only writes), assignment
   create/list/patch, response create, view-tracking endpoint
   (`POST /clip-assignments/:id/view` with playback %). Emit `assignments`
   row on assign. ~1 migration, ~15 endpoints.
2. **Workbench** — rebuild FilmSessionDetail into the 70/30 layout; clipping
   interactions on the existing Mux player; clip rail + drawer; approve flow.
   Reuse the wired session fetching.
3. **Assign + Board** — assign dialog (bulk), Assignment Board page replacing
   FilmQueuePage's current framing; state pills, filters, nudge.
4. **Player side** — inbox + viewer (mobile-first, safe-area aware — this is
   the screen that must feel native in the iOS shell); watched tracking;
   response thread; player dashboard assignment integration.
5. **AI suggestions v1** — adapter from existing analysis_jobs segments →
   ai_suggestions rows; suggestion panel; accept→draft-clip path. Copy
   rewrite across Film surfaces ("suggestions, coach-approved" language).
6. **Polish/accountability** — board summary stats, overdue notifications via
   the messaging module (respecting quiet hours), duplicate-and-reassign for
   locked clips, IDP escalate action.

Sequencing rationale: 1–4 deliver the entire coach-controlled loop with zero
AI dependency; 5 layers the assistive AI on top of a working product instead
of being its foundation.
