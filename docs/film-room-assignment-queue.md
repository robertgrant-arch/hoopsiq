# Assignment Queue — Spec

Route: `/app/coach/film/assignments`. One row = **one clip assignment**
(clip × player). Never a source film, never an AI artifact. Companion to the
Film Room v2 spec set.

Purpose: player accountability (did they open, watch, respond?) and coach
follow-up (what's my move, what's overdue, what escalated?).

---

## Status model

Stored pipeline status (one at a time):

```
draft → assigned → opened → watched → responded → completed → archived
```

Overlay flags (combinable with any pipeline status, shown as badges not
columns of their own):

- **overdue** — derived: `due_at < now` and status ∈ {assigned, opened,
  watched}. Never stored; can't drift.
- **escalated_to_idp** — set when an IDP escalation links this assignment;
  coexists with watched/responded/completed (escalation doesn't stop the
  pipeline).

Notes: `draft` rows are staged assignments (clip approved, recipients chosen,
not yet sent — the "ready to send" tray). `opened` = player loaded the clip;
`watched` = ≥90% playback or coach override. `completed` = coach closed the
loop (auto after N days when no response is required — org setting).

## Queue UX

Layout: full-width data grid under a fixed control bar; summary strip above.

```
┌ Summary:  142 active · 78% watched · 61% responded · 9 OVERDUE · 4 escalated ┐
├ Controls: [saved views ▾] [team ▾][player ▾][coach ▾][status ▾][priority ▾]  │
│           [category ▾][date range][⬤ overdue only]     search…   [⚙ columns] │
├──┬────────────┬─────────┬───────────┬────────┬──────┬────┬──────┬───────────┤
│☐ │ Clip       │ Player  │ Source    │ By/Date│ Due  │ Pri│ Cat  │ W · R · F · IDP │
│☐ │ Late close…│ #23 Moo…│ vs Oak Hi…│ RG 3/14│ 3/16 │ ▲H │ DEF  │ ✓ · ✓ · — · ↗   │
│☐ │ Spacing @4…│ #5 Haye…│ Practice …│ RG 3/14│ 3/15 │ —  │ OFF  │ ✓ · — · — · —   │ ← red left edge: overdue
└──┴────────────┴─────────┴───────────┴────────┴──────┴────┴──────┴───────────┘
```

**Columns** (all 12 required, organized to fit):
clip title (with 3s hover-scrub thumbnail) · player (jersey + name) · source
film title · assigned by (initials chip) · assigned date · due date ·
priority (▲High / — Normal / ▽Low) · category chips · then a compact
**status cluster**: Watch (— not opened / ◐ opened / ✓ watched) · Response
(— / ✓ / ✗ not required) · Follow-up (— open / ✓ completed) · IDP (— / ↗
linked, click-through). Full words in a tooltip and in the drawer; glyphs
keep 12 columns on one 1440px row. Column picker (⚙) lets coaches hide any
non-essential column; choices persist per coach.

**Row treatments:** overdue = 2px red left edge + red due date; draft rows
grouped in a collapsible "Ready to send (n)" tray pinned above the grid;
archived hidden by default (filter reveals).

**Selection & bulk bar:** checkbox column; shift-click ranges;
"select all matching filter" (server-side, count shown). Selecting ≥1 slides
up the bulk bar: **Reassign · Change due date · Mark complete · Escalate to
IDP · Archive**. Every bulk action shows a preview count, applies server-side
in one call, reports partial failures row-by-row, and offers a 10s undo toast
(except escalations, which confirm per-player in a modal because they create
IDP records).

**Filters** (control bar, URL-persisted so views are shareable/bookmarkable):
team · player (multi) · assigned-by coach · status (multi) · overdue toggle ·
priority · category · date range (assigned or due — selector). Saved views
dropdown ships with presets: *My overdue* · *Awaiting response* · *Sent this
week* · *Escalated*.

## Sorting logic

Default sort is **attention order**, a computed rank — not a column:

1. overdue (most overdue first)
2. due within 24h
3. responded-awaiting-follow-up (coach's move)
4. assigned/opened, oldest first (staleness rises)
5. watched (awaiting response or auto-close)
6. completed, newest first
7. archived (only when filtered in)

Ties break by priority (High > Normal > Low), then due date ascending.
Clicking any column header switches to explicit sort (asc/desc, third click
returns to attention order). Explicit sort choice persists per saved view.
Rationale: a queue's default order should answer "what do I deal with
first?" — chronology is one click away, triage is zero clicks.

## Row expansion behavior

Single click on a row (not on a link/checkbox) expands it **inline** —
accordion, one row open at a time, 240px:

- left: clip player (muted autoplay from clip start, click for sound)
- middle: coaching note · category/priority · timeline of events (assigned →
  opened → watched 94% → responded), each timestamped
- right: latest response (first 300 chars) + quick actions: **Reply · Mark
  complete · Nudge · Escalate · Open full drawer**

Expansion is for triage — see enough to act without leaving the list.
Keyboard: ↑/↓ move row focus, Enter/→ expands, Esc/← collapses, E = mark
complete, N = nudge on the focused row.

## Detail drawer behavior

Double-click, "Open full drawer," or deep link
(`/assignments?open={id}`) opens a right-side drawer (480px, over the grid,
grid stays interactive behind it):

- header: clip title, player, status pill + overlay badges, priority editor
- full clip player with telestration
- full coaching note
- complete response thread (player + coach messages) with composer
- event log (every state change, nudge, due-date change, who + when)
- assignment settings: due date (edit), response required (edit while not
  responded), reassign, archive
- IDP block: linked item (status + link) or "Escalate to IDP" action
- footer nav: ←/→ move through the current filtered list without closing —
  the drawer is a review mode, not a dead end

URL reflects the open drawer, so a coach can send a colleague a link to one
assignment.

## Empty states

| Context | Message + action |
|---|---|
| No assignments ever | "Assignments appear here once you send clips from the Clip Workspace." → **Open Film Library** |
| Filters match nothing | "No assignments match these filters." → **Clear filters** (shows the diff from last non-empty view) |
| Overdue-only, none overdue | "Nothing overdue. 🟢" (positive state, no CTA — this is the goal) |
| Draft tray empty | tray hidden entirely |
| All completed in range | "All caught up — 34 completed this range." → link to Player Progress |

## Coach follow-up actions

Row-level (expansion + drawer): **Reply** (thread) · **Mark complete** (E) ·
**Nudge** (re-notify, respects quiet hours; nudge count + last-nudged shown;
rate-limited to 1/12h per assignment) · **Change due date** · **Reassign**
(same clip → different/additional player; original row archived with
"reassigned" reason, new row created — history stays honest) · **Escalate to
IDP** (picker: focus area + note prefilled from clip note; sets the ↗ badge)
· **Archive** (with reason: completed elsewhere / no longer relevant /
reassigned).

Automation guardrails: auto-complete of watched-no-response-required rows
after N days is the only automatic transition, it's org-configurable, and it
logs "auto-completed" in the event log. Nothing else moves without a coach.

## Mobile behavior (coach)

Same route, responsive — coaches triage from gyms and buses:

- Grid becomes a **card list**: line 1 = clip title + status pill; line 2 =
  player · due (red when overdue); line 3 = W/R/F/IDP glyph cluster.
  Sorted by the same attention order.
- Summary strip compresses to horizontally scrollable stat chips; tapping a
  chip applies the corresponding filter.
- Filters live in a bottom-sheet (button shows active-filter count).
- Tap card = full-screen detail (drawer content, full-bleed); swipe left/right
  = next/previous in filtered order.
- Swipe actions on cards: right = Mark complete, left = Nudge (both
  undoable via toast).
- Bulk mode via long-press → checkboxes + bottom action bar (same five
  actions; escalate still confirms per player).
- No hover-scrub on touch: thumbnail taps play inline muted.

## Connections

- Draft tray ← Clip Workspace "Approve" (without assign)
- Response previews ↔ the same thread the player sees in the mobile app
- ↗ IDP badge → IDP Links ledger entry → player's IDP timeline
- Summary strip numbers = same queries as the Film Library Needs-Attention
  strip (one source of truth)
```
