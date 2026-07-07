# Clip Workspace — Core Screen Spec

Route: `/app/coach/film/:sessionId`. The craft surface of Film Room v2.
Companion to `film-room-v2-spec.md`, `film-room-ia.md`, `film-room-workflow.md`.

Design stance: a compact editing tool, not a dashboard. Dark theme, 12–13px
data text, keyboard-first, zero decorative padding. Every visible element
either shows work state or accepts an action.

---

## 1. Screen spec

### Layout (three-pane, fixed header)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Library   GAME · vs Oak Hill · Mar 14 · 1:47:22        ● Saved 12s ago     │ 48px
├───────────┬──────────────────────────────────────────────┬───────────────────┤
│ LEFT      │ CENTER                                       │ RIGHT             │
│ 240px     │ fluid (min 560px)                            │ 320px             │
│           │                                              │                   │
│ FILM INFO │  ┌────────────────────────────────────────┐  │ CLIP EDITOR       │
│ type/opp/ │  │                                        │  │ ┌ Title          │
│ date/dur  │  │              VIDEO PLAYER              │  │ ├ Note  [AI draft]│
│ status    │  │         (telestration overlay)         │  │ ├ Categories      │
│───────────│  │                                        │  │ ├ Player tags     │
│ ROSTER    │  └────────────────────────────────────────┘  │ ├ ─────────────   │
│ #23 Moore │  23:41.2 ▐ IN 23:38.0 ─── OUT 23:52.5 ▌0:14.5│ │ ASSIGNMENT      │
│ #5 Hayes  │  ┌────────────────────────────────────────┐  │ │ due · response? │
│ (click =  │  │ TIMELINE  [zoom − ▁▂▄ +]  ├──█──┤      │  │ ├ ─────────────   │
│  filter + │  │ clip spans · suggestion ticks · handles│  │ │ AI ASSIST ▸ (3) │
│  tag)     │  └────────────────────────────────────────┘  │ ├ ─────────────   │
│───────────│  transport: ⏮ ◀ ▶ ⏭   1× ▾   🔊             │ │ [Save draft]     │
│ CLIPS (6) │                                              │ │ [Approve]        │
│ ▸ 02:14   │                                              │ │ [Approve+Assign] │
│ ▸ 23:38 ● │                                              │ └                  │
│ filters   │                                              │                   │
└───────────┴──────────────────────────────────────────────┴───────────────────┘
```

- **Header (48px):** back to Library · session identity line (type chip,
  opponent, date, duration) · autosave indicator ("Saving… / Saved 12s ago /
  ⚠ Offline — changes stored locally") · overflow menu (session settings,
  archive, reprocess).
- **Left sidebar (240px, collapsible to icon rail):**
  - *Film info card:* type chip, opponent, date, duration, status,
    annotation/clip counts.
  - *Roster list:* jersey + name; click filters the clip list to that player;
    click while the editor is open tags the player (one control, two modes —
    mode shown by editor-open state).
  - *Clip list:* every clip on this source film, ordered by start time. Row =
    start time, duration, title, status dot (gray draft / amber suggested /
    green approved / blue assigned), player chips, telestration badge.
    Active clip highlighted; click = seek + load into editor.
  - *Filters:* status, player, category, source (coach/AI).
- **Center:** Mux player with telestration canvas overlay; in/out readout bar
  (IN, OUT, live **duration**); timeline (fixed 64px tall) with zoom control,
  playhead, draggable in/out handles, stacked clip spans (lane-packed when
  overlapping), thin amber AI-suggestion ticks; transport row.
- **Right panel (320px):** the clip editor — title, note (with "Draft with
  AI"), categories (multi-chip), player tags (type-ahead), assignment block
  (due date default = next practice, response-required toggle), collapsible
  AI Assist section (badge = pending suggestion count), action buttons.
  Empty state (no active clip): "Mark I/O on the timeline to start a clip" +
  keyboard cheat-sheet.

### Density rules
- No card shadows/hero spacing; 8px grid; single-line rows everywhere.
- All three panes independently scroll; video + timeline never scroll away.
- ≤1280px: left sidebar auto-collapses to icon rail. ≤1024px: right panel
  becomes a slide-over (workspace is desktop-first; player side is mobile).

---

## 2. Component list

```
ClipWorkspacePage                      route shell, data loading, state machine
├── WorkspaceHeader                    identity, AutosaveIndicator, overflow
├── FilmInfoCard
├── RosterPanel        → RosterRow    (filter / tag dual mode)
├── ClipListPanel      → ClipRow      (status dot, chips, badges)
│   └── ClipListFilters
├── VideoStage
│   ├── MuxPlayer                      (existing component, reused)
│   ├── TelestrationOverlay            (existing annotation canvas, clip-scoped)
│   └── InOutReadout                   (IN / OUT / duration, live)
├── Timeline
│   ├── TimelineZoomControl            (−/+, fit, 1s–full scale)
│   ├── Playhead
│   ├── ClipSpan[]                     (lane-packed, drag ends = adjust bounds)
│   ├── InOutHandles                   (draggable, keyboard-nudgeable)
│   └── SuggestionTick[]               (amber, click/S = snap)
├── TransportBar                       (play, speed, volume, frame-step)
├── ClipEditorPanel                    (right)
│   ├── TitleField
│   ├── NoteEditor                     (+ AIDraftButton, "AI draft" marker)
│   ├── CategoryPicker
│   ├── PlayerTagField                 (type-ahead by number/name)
│   ├── AssignmentBlock                (DueDatePicker, ResponseToggle)
│   ├── AIAssistSection                (SuggestionRow[]: accept/edit/dismiss)
│   └── ActionRow                      (SaveDraft, Approve, ApproveAndAssign)
├── UnsavedChangesGuard                (route-leave + tab-close interception)
├── OfflineBanner
└── hooks: useClipDraft (autosave), useWorkspaceShortcuts,
          useTimelineZoom, useClipMachine (state), useSuggestions
```

Reuse: MuxPlayer, telestration canvas, roster hooks (`useRoster`), the
existing session fetch. New: everything under Timeline and ClipEditorPanel.

---

## 3. Interaction model

### Keyboard map (active whenever the workspace has focus; disabled in text fields except where noted)

| Key | Action |
|---|---|
| `Space` | play / pause |
| `←` / `→` | −5s / +5s |
| `Shift+←/→` | −1s / +1s |
| `,` / `.` | **previous frame / next frame** (pauses first) |
| `I` | **set in point** at playhead |
| `O` | **set out point** at playhead |
| `S` | snap nearest AI suggestion ticks to in/out |
| `Enter` | **save clip** (create draft from marked range, open editor) |
| `⌘/Ctrl+Enter` | **send assignment** (Approve & Assign with current settings) — works from text fields |
| `⌘/Ctrl+S` | save draft explicitly — works from text fields |
| `Esc` | close editor (draft autosaved) / cancel marking |
| `[` / `]` | nudge active handle −/+ 1 frame |
| `Z` / `Shift+Z` | timeline zoom in / out · `F` fit |
| `↑` / `↓` | previous / next clip in list (seeks + loads editor) |
| `?` | shortcut overlay |

### Timeline
- **Zoom:** scroll-wheel over timeline (cursor-anchored), Z/Shift+Z, and the
  −/+ control; range full-film → 1s/100px. Zoom state per session, remembered.
- **Handles:** in/out draggable with frame tooltip; drag a ClipSpan edge to
  adjust a saved clip's bounds (draft/approved-unassigned only — assigned
  clips are locked; attempting shows "locked — duplicate to edit").
- **Stacking:** unlimited clips per film; overlapping spans lane-pack (max 3
  visible lanes, then +N indicator). Marking a new range while the editor has
  unsaved content: content autosaves as a draft first, then the new range
  begins — stacking clips never destroys work.

### Autosave + unsaved changes
- Draft clip state (bounds, title, note, tags, categories, assignment
  settings) autosaves 800ms after last keystroke to
  `PATCH /film/clips/:id` (or creates the draft on first save).
- AutosaveIndicator: `Saving… → Saved {relative}` · failures flip to
  `⚠ Not saved — retrying` with exponential backoff.
- UnsavedChangesGuard triggers only when autosave is failing or in-flight —
  under normal operation navigation is always safe and unprompted.
- Local mirror: the active draft is also written to localStorage
  (`hoopsiq.clipDraft.{sessionId}`) on every change; on reopen after a crash
  or offline period, a "Restore unsaved draft?" bar appears.

### AI assist (right panel section, collapsible)
- Rows: kind icon (boundary/tag/note/dup/IDP), one-line preview, confidence.
- Actions per row: **Accept** (materializes into the editor fields, marked),
  **Edit** (accept + focus the field), **Dismiss**.
- Never modal, never auto-applied, never blocking. Section closed by default;
  badge shows count.

---

## 4. State diagram

```
WORKSPACE (session level)
  loading ──ok──▶ film_ready
     │              │
     │              ├── film has 0 clips ──▶ empty (editor shows cheat-sheet)
     ▼              ▼
   error         film_processing ◀─(deep link while Mux not done)
  (retry)           │ poll/webhook
                    └──ready──▶ film_ready
  network lost (any state) ──▶ offline_overlay ──reconnect──▶ resume + sync

CLIP (editor level)
  (no active clip)
      │ I/O marked + Enter
      ▼
  clip_draft ──autosave──▶ draft_saved ──▶ (edits) ⟳ clip_draft
      │                        │
      │ Approve                │ Approve & Assign (⌘Enter)
      ▼                        ▼
   approved ──assign──▶ assignment_sent   [terminal for this screen;
      │                                    clip locks: bounds/note frozen]
      │ edit bounds/note
      └──▶ back to clip_draft (allowed only while unassigned)

  failed_save (from any save) ──retry ok──▶ previous state
      │ offline
      ▼
  local_only (localStorage mirror) ──reconnect──▶ sync ──▶ draft_saved
```

**State × UI matrix**

| State | Center | Right panel | Left |
|---|---|---|---|
| loading | player skeleton | skeleton | skeletons |
| empty (ready, 0 clips) | video live | cheat-sheet CTA | empty clip list w/ hint |
| film_processing | progress card (% + elapsed), no scrub | disabled + explainer | info card only |
| film_ready | full interactivity | editor or empty-state | full |
| clip_draft | span highlighted, handles live | fields active, "Draft" badge | row (gray) |
| saved clip (approved) | span green | read view + Assign CTA | row (green) |
| assignment_sent | span blue, locked handles | confirmation + "View in Queue" link, editor clears | row (blue) |
| failed_save | unchanged | ⚠ banner in panel + retry | row marked ⚠ |
| offline | playback continues (buffered) | fields editable, "local only" chip | reads cached |
```

---

## 5. Acceptance criteria

**Golden path**
1. With film open, a coach can create, annotate, tag, and assign a clip in
   ≤30s using only `I O Enter [type] ⌘Enter` — measured cold, no AI.
2. Marking bounds produces zero network requests; drawer open → first
   keystroke ≤100ms.

**Clipping**
3. I/O set at playhead within ±1 frame; `,`/`.` step exactly one frame.
4. Duration readout updates live during marking and handle drags.
5. Out < in auto-swaps; clips may overlap; ≥20 clips on one film render
   without timeline degradation (lane packing engages).
6. Timeline zooms from full-film to 1s/100px; playhead stays anchored under
   cursor during wheel-zoom.

**Draft safety**
7. Any editor change persists within 1s (autosave) and survives: route
   change, tab close, browser crash (localStorage restore), and offline
   editing followed by reconnect.
8. The unsaved-changes prompt appears **only** when autosave has failed or is
   in flight — never during normal navigation.
9. A failed save never discards field content; retry succeeds without re-entry.

**Assignment**
10. Approve & Assign creates one assignment per tagged player, defaults due
    date to the next calendar practice, and confirms with a toast naming the
    count; the clip's bounds and note are immutable afterward (UI blocks +
    API rejects), with "duplicate to edit" offered.
11. ⌘Enter works from within any editor text field.

**AI containment**
12. With the AI panel never opened, the entire workflow is fully functional.
13. No AI suggestion mutates editor fields or timeline marks without an
    explicit per-row Accept; accepted note drafts show an "AI draft" marker
    until edited or saved by the coach.
14. No code path exists from suggestion → assignment (enforced at API level:
    assignments require an authenticated coach session and an `approved`
    clip whose approver is a human user).

**States**
15. All nine design states (empty / loading / processing / ready / draft /
    saved / sent / failed save / offline) are visually distinct and reachable
    in Storybook or a dev-state switcher.
16. Processing state auto-transitions to ready without reload (webhook or
    ≤10s poll).
17. Offline: playback of buffered video continues, edits mark "local only,"
    reconnect syncs within 5s and reconciles the autosave indicator.

**Ergonomics**
18. Full keyboard operability of the golden path (mouse only needed for
    telestration drawing); `?` shows the shortcut overlay.
19. Left sidebar collapses at ≤1280px; all three panes scroll independently;
    video/timeline remain fixed in view at all supported widths.
20. Roster click tags the player when the editor is open and filters clips
    when it is not, with the current mode visibly indicated.
```
