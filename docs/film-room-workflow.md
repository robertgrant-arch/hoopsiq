# Film Room v2 — End-to-End Coach Workflow

Companion to `film-room-v2-spec.md` and `film-room-ia.md`. Maps the 11-step
target workflow onto current system reality (Mux processing pipeline, existing
annotation/telestration support, existing IDP escalation via coaching_actions).

Design target: **once film is open, clip → note → tag → assign in under 30
seconds.** The keystroke budget for that is at the end.

Legend: each step defines actor · goal · UI state · backend · failure states ·
success state · AI may assist · coach-controlled.

---

## Step 1 — Upload film

- **Actor:** Coach
- **Goal:** Get game/practice/skill film into HoopsIQ with minimal ceremony.
- **UI state:** Library → Upload modal: drop zone, type (GAME/PRACTICE/SKILL
  REP/HIGHLIGHT), title (default: "{type} vs {opponent} — {date}"), opponent +
  date (game only). Upload proceeds in background; coach can leave the modal.
- **Backend:** `POST /film/uploads/initiate` → Mux direct-upload URL; create
  `film_sessions` row (`status: uploading`); Mux webhook flips states.
- **Failure:** network drop mid-upload (resumable via Mux upchunk; row stays
  `uploading` with retry CTA) · unsupported codec (Mux rejects → `failed` +
  reason) · duplicate file (AI flags after processing — never blocks upload).
- **Success:** session row visible in Library at `processing` with thumbnail
  placeholder.
- **AI may assist:** nothing at this step (dup detection runs post-processing).
- **Coach-controlled:** everything; metadata is editable later.

## Step 2 — Processing wait

- **Actor:** System (coach is elsewhere).
- **Goal (coach):** Know when film is clippable without babysitting it.
- **UI state:** Library row shows `processing` with elapsed time. **No
  "Pending AI" state exists anymore** — the AI job runs in parallel as an
  overlay ("analysis running" microbadge) and never gates clipping.
- **Backend:** Mux webhook `video.asset.ready` → `film_sessions.status =
  ready`; enqueue analysis job (Inngest) which writes `ai_suggestions` rows as
  it completes; push notification "Film ready to clip."
- **Failure:** Mux processing error → `failed` + retry action · analysis job
  failure → suggestions panel shows "analysis unavailable," **film remains
  fully usable** · webhook missed → reconciliation poll on session open.
- **Success:** `ready`; notification delivered; Needs-Attention strip counts
  it under "ready to clip."
- **AI may assist:** begin boundary/tag analysis in parallel.
- **Coach-controlled:** n/a (no decisions at this step by design).

## Step 3 — Open Clip Workspace

- **Actor:** Coach
- **Goal:** Get from notification/Library to a scrubbing video in one action.
- **UI state:** Workspace loads: player (70%), timeline strip, empty clip
  rail, suggestions panel collapsed with badge count if analysis finished.
  Video is focused for keyboard control immediately — no click-to-arm.
- **Backend:** `GET /film/sessions/:id` (session + signed Mux playback token +
  clips + suggestion count). One round trip.
- **Failure:** playback token expired (auto-refresh, transparent) · session
  still `processing` (deep link shows progress state, auto-enters when ready).
- **Success:** video playing/scrubbing within ~2s; keyboard live.
- **AI may assist:** nothing visible unless the coach opens the panel.
- **Coach-controlled:** whether the suggestions panel opens at all.

## Step 4 — Scrub and set in/out points

- **Actor:** Coach
- **Goal:** Land bounds on a teachable moment in seconds.
- **UI state:** Keyboard-first: space play/pause · ←/→ ±5s · shift+←/→ ±1s ·
  `,`/`.` frame step · 0–9 percentage jump · **I** mark-in · **O** mark-out.
  Marked range renders as a highlighted span; I/O re-press adjusts. Timeline
  also shows existing clip spans and (thin amber ticks) AI-suggested
  boundaries the coach can snap to with **S**.
- **Backend:** none — bounds are client state until save. Zero latency.
- **Failure:** out < in (auto-swap) · range > 3 min (soft warn: "long for a
  teaching clip" — allowed).
- **Success:** visible in/out span; HUD shows duration ("0:14").
- **AI may assist:** pre-marked suggested boundaries to snap to.
- **Coach-controlled:** the bounds. Snapping is opt-in per clip; suggestions
  never auto-apply.

## Step 5 — Create the clip

- **Actor:** Coach
- **Goal:** Persist the segment without losing playhead context.
- **UI state:** **Enter** (or "New clip" button) → clip drawer slides over the
  rail, video keeps playing behind it. Drawer is pre-filled: bounds, title
  autostub ("Clip @ 23:41"), empty note, empty tags, category picker. Focus
  lands in the title field.
- **Backend:** `POST /film/sessions/:id/clips` → `clips` row (`status: draft`,
  `source: coach`). Optimistic insert into the rail.
- **Failure:** save conflict/network → drawer persists locally with retry
  toast; nothing lost · overlapping identical bounds (AI dup-flag appears in
  drawer, non-blocking).
- **Success:** draft clip in the rail (gray), drawer open for enrichment.
- **AI may assist:** duplicate/similar-clip flag ("resembles Clip 4 —
  compare?").
- **Coach-controlled:** creation itself; a duplicate flag never blocks save.

## Step 6 — Note + optional telestration

- **Actor:** Coach
- **Goal:** Attach the teaching point.
- **UI state:** Note textarea in drawer. "Draft with AI" button fills the
  field with an editable draft (never sends as-is). Telestration: "Annotate"
  opens the existing canvas overlay (reuses annotations infra, kind
  `telestration`) at the clip's start frame; draws are saved against the clip
  time range.
- **Backend:** `PATCH /film/clips/:id` (note) · `POST
  /film/sessions/:id/annotations` with `clip_id` + `kind: telestration`.
- **Failure:** AI draft unavailable (button disabled with tooltip; typing
  unaffected) · canvas save failure (retry; note saves independently).
- **Success:** note on clip; telestration badge on the rail row.
- **AI may assist:** draft the note from play context (always lands in the
  editable field, visibly marked "AI draft" until the coach edits or saves).
- **Coach-controlled:** final note text — AI drafts are never player-visible
  without an explicit coach save.

## Step 7 — Tag players

- **Actor:** Coach
- **Goal:** Attach the right players in ~2 seconds.
- **UI state:** Tag field in drawer: type-ahead over roster (jersey number or
  name — "23" or "mo" both hit), enter to add, supports multiple. Recent-tag
  chips for the session shown as one-tap shortcuts.
- **Backend:** `PATCH /film/clips/:id` with player ids → `clip_players` rows.
- **Failure:** player not on roster (offer "add to roster" inline for admins,
  else omit) · roster fetch failure (retry inline; drawer still usable).
- **Success:** player chips on the drawer and rail row.
- **AI may assist:** suggest players detected in the segment (jersey/tracking
  from analysis) as pre-listed *unselected* chips.
- **Coach-controlled:** selection. AI-suggested chips require a tap; nothing
  is pre-selected.

## Step 8 — Approve & assign

- **Actor:** Coach
- **Goal:** Send the clip as an accountable assignment.
- **UI state:** Drawer primary action **"Approve & Assign"** (⌘Enter). Assign
  popover: players prefilled from tags, due date (default: next practice from
  the events calendar, else +3 days), "response required" toggle (default
  from coach preference). Confirm → drawer closes, rail row turns blue, toast
  "Assigned to 3 players." A plain **Approve** (no assign) exists for
  batch-assign-later flows.
- **Backend:** `PATCH /film/clips/:id` (`status: approved`; bounds/note lock)
  → `POST /film/clip-assignments` (one row per player) → emit `assignments`
  row (type `film_review`) per player → notification fan-out (respecting
  quiet-hours policy).
- **Failure:** notification delivery failure (assignment persists; delivery
  retries; Queue shows delivery state) · player account inactive (row
  created, flagged "player has no active account" in Queue).
- **Success:** rows live in Assignment Queue as `assigned`; player inboxes
  badge.
- **AI may assist:** nothing. **This transition is the hard AI boundary — no
  AI code path may create or trigger a clip assignment.**
- **Coach-controlled:** approval, recipients, due date, response requirement.

## Step 9 — Player watches and responds

- **Actor:** Player (mobile)
- **Goal:** See what coach flagged, watch it, answer the prompt, get the
  badge gone.
- **UI state:** Inbox card → full-bleed viewer; coach note as caption card at
  the clip's timestamps; telestration renders on the video; response box
  below (blocks "Done" when required). Swipe to next clip from the same
  session.
- **Backend:** `POST /clip-assignments/:id/view` on playback progress
  (`viewed` at ≥90% or explicit mark) → `POST /clip-assignments/:id/responses`
  (`status: responded`). View events store % watched + timestamps.
- **Failure:** offline mid-watch (progress cached client-side, synced on
  reconnect) · playback error (report issue action → flags the assignment for
  the coach rather than leaving silent non-compliance).
- **Success:** assignment `viewed` → `responded`; coach's Review Inbox picks
  it up; player badge clears.
- **AI may assist:** nothing on the player surface. Players get the coach's
  words only.
- **Coach-controlled:** n/a (player step) — but all content shown was
  coach-approved upstream.

## Step 10 — Coach reviews completion / reflection

- **Actor:** Coach
- **Goal:** Close the loop fast; catch the answers that need a real reply.
- **UI state:** Review Inbox, unread-first. Row expands inline to the full
  response + clip re-watch. Actions per row: **Reply** (thread) · **Ack &
  Close** (one key: E) · **Escalate**. Bulk "close all viewed-only" for
  no-response-required items.
- **Backend:** `POST .../responses` (coach reply) · `PATCH
  /clip-assignments/:id` (`status: closed`, `closed_at`).
- **Failure:** none critical — closed items are reopenable; nothing is
  destructive.
- **Success:** assignment `closed`; Player Progress rollups update.
- **AI may assist:** flag responses that look like low-effort ("ok") vs
  substantive, as a sort option — never auto-close.
- **Coach-controlled:** every close, every reply.

## Step 11 — Follow-up complete or escalate to IDP

- **Actor:** Coach
- **Goal:** Decide whether this moment ends here or becomes development work.
- **UI state:** From Inbox row or clip drawer: **"Add to IDP"** → picker:
  player (prefilled), focus area (existing IDP focus areas + create-new),
  note (prefilled from clip note, editable). If AI recommended escalation, the
  entry point shows a "suggested for IDP" badge with the rationale — the flow
  is identical either way.
- **Backend:** create IDP evidence / coaching_action linking clip_id +
  assignment_id (reuses existing escalation infra) → `idp_escalations` link
  row → appears in IDP Links ledger and on the player's IDP timeline.
- **Failure:** player has no active IDP (offer to create focus area or drop
  into IDP generator) · duplicate escalation of same clip (warn, allow).
- **Success:** bidirectional link: IDP item shows the clip; IDP Links ledger
  logs who escalated, when, and from what source (coach vs
  AI-recommended-coach-approved).
- **AI may assist:** recommend escalation with a reason ("3rd late closeout
  clip for this player in 2 weeks").
- **Coach-controlled:** the escalation decision, the focus area, the note.
  AI recommendation is a badge, never an action.

---

## The 30-second path (keystroke budget)

Film open, moment spotted at 23:41. Clock starts:

| t | Action | Input |
|---|--------|-------|
| 0s | scrub to moment | →/shift+→ (or click timeline) |
| 6s | mark in/out | **I** … **O** |
| 8s | open drawer | **Enter** |
| 12s | title (or keep autostub) | type ~4 words |
| 20s | note (or accept AI draft: 2s) | type 1 sentence |
| 24s | tag players | "23⏎ 5⏎" |
| 26s | assign | **⌘Enter**, defaults accepted |
| ~28s | toast: "Assigned to 2 players" | — |

What makes the budget: zero-latency client-side bounds (step 4 has no network),
drawer prefill + autofocus order (title → note → tags → assign matches typing
flow), smart defaults (due = next practice, response toggle remembered),
type-ahead by jersey number, and ⌘Enter to accept the whole default assign
config. Telestration and AI panels are deliberately off the hot path —
enrichment, not gate.

## State synchronization summary

```
film_sessions: uploading → processing → ready → archived   (failed anywhere)
clips:         [suggested]→ draft → approved → assigned → archived
clip_assignments: assigned → viewed → responded → closed   (overdue derived)
ai_suggestions: suggested → accepted | dismissed
Legacy mapping: "Ready for review" → ready · "Reviewed" → has clips/assignments
(coverage, not a state) · "Pending AI" → deleted (analysis is an overlay job)
```
