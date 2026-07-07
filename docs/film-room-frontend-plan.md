# Film Room v2 — Frontend Implementation Plan

React 19 + TypeScript + TanStack Query. Routes are given as paths — they map
1:1 to Next.js app-router pages or the repo's current wouter routes (the live
codebase is Vite + wouter; everything below is identical in either, only the
route registration file differs). Player + video = existing MuxPlayer;
telestration = existing canvas; UI primitives = existing shadcn set.

## Shipping order (each phase deployable)

1. **P1 — Coach can send film work** (smallest viable): Film Library (reuse +
   re-copy) → Clip Workspace with manual clipping + basic drawer → assign
   dialog. No board, no AI, no player UI. Coaches see assignments in a plain
   list at the bottom of the Library.
2. **P2 — Players can complete it:** Player Review page + watch tracking +
   text response. The loop closes.
3. **P3 — Coaches can track it:** Assignment Queue (attention order, row
   expansion, follow-ups, drawer). Landing work strip.
4. **P4 — Escalation + polish:** IDP panel, bulk actions, saved views,
   choice/confidence response types.
5. **P5 — AI assist:** suggestion panel, ghost titles/chips, note drafts.

Deliberately not building: timeline zoom beyond wheel+buttons, lane packing
past 3 lanes, offline queue beyond localStorage draft mirror, virtualized
grids (until >200 rows measured), Storybook for one-off screens.

---

## Surfaces

### 1. Film Room landing = Film Library
- **Route:** `/app/coach/film`
- **Purpose:** front door; sessions list + Needs-Attention work strip.
- **Components:** `NeedsAttentionStrip` (4 stat-link cards) · `FilmTable`
  (rows w/ coverage cells) · `FilmFilters` (URL-param driven) ·
  `UploadFilmDialog` · `FilmStatusChip`.
- **Local state:** none beyond dialog-open; filters live in the URL.
- **Server data:** `GET /api/films?filters` (list + coverage counts) ·
  `GET /api/films/attention-counts`.
- **Mutations:** `createUpload` (returns Mux upload URL; upchunk runs in a
  detached uploader so navigation doesn't kill it) · `archiveFilm`.
- **Loading:** table skeleton rows (6) + strip skeleton. **Error:** inline
  banner + Retry per region (strip and table fail independently).
  **Empty:** first-run "Upload your first film" hero-lite; filtered-empty
  "no matches → clear filters".

### 2. Clip Workspace
- **Route:** `/app/coach/film/:filmId`
- **Purpose:** watch, clip, annotate, tag, approve, assign (core screen —
  full spec in clip-workspace doc).
- **Components:** `WorkspaceShell` (3-pane grid) · `VideoStage` (MuxPlayer +
  `TelestrationOverlay` + `InOutReadout`) · `ClipTimeline` (`ClipSpan`,
  `InOutHandles`, `SuggestionTick`) · `TransportBar` · `ClipRail`/`ClipRow` ·
  `ClipEditor` (Title/Note/CategoryPicker/PlayerTagField/`AssignmentBlock`/
  `ActionRow`) · `RosterPanel` · `AutosaveIndicator` · `ShortcutOverlay`.
- **Local state:** playhead + marks (`useReducer` — one `workbenchReducer`
  for play/mark/zoom, deliberately not a state library) · active clip id ·
  drawer dirty-fields · timeline zoom.
- **Server data:** `GET /api/films/:id` (film + asset + clips + annotation
  counts) · roster (`useRoster`, exists) · P5: suggestions list.
- **Mutations:** `createClip` · `updateClip` (debounced autosave 800ms) ·
  `approveClip` · `createAnnotation` · `createAssignment` · P5:
  `resolveSuggestion`.
- **Loading:** player poster + skeleton rail; workspace interactive as soon
  as playback token arrives (clips can stream in after). **Error:** film
  fetch fail = full-screen retry; autosave fail = indicator state + retry
  (never a modal). **Empty:** zero clips → editor pane shows keyboard
  cheat-sheet CTA. Processing film → progress card, poll/refetch on
  interval until ready.

### 3. Assignment Queue
- **Route:** `/app/coach/film/assignments` (`?open=:id` deep-links drawer)
- **Purpose:** accountability grid + follow-ups (full spec in queue doc).
- **Components:** `QueueSummaryStrip` · `QueueFilterBar` (+`SavedViews`) ·
  `AssignmentGrid` (`AssignmentRow`, `StatusGlyphCluster`, `RowExpansion`) ·
  `BulkActionBar` · `AssignmentDrawer` (thread, event log, settings) ·
  `NudgeButton` · `DueDatePopover`.
- **Local state:** selection set (`useState<Set<string>>`) · expanded row id
  · drawer id (URL) · filters (URL).
- **Server data:** `GET /api/assignments?…` (rows + aggregates, cursor
  pagination) · `GET /api/assignment-players/:id` (drawer detail + events).
- **Mutations:** `followup` (reply/nudge/complete/due-change/archive) ·
  `bulkAction` · `escalate`.
- **Loading:** grid skeleton; drawer skeleton over live grid. **Error:**
  banner + retry; bulk partial-failure toast listing failed rows.
  **Empty:** per-context copy (never assigned / filter-empty / "nothing
  overdue 🟢" / draft tray hidden).

### 4. Player Review page
- **Routes:** `/app/player/film` (inbox) · `/app/player/film/:assignmentId`
- **Purpose:** watch exact segment, read teaching point, respond, done —
  <60s (full spec in player-review doc).
- **Components:** `PlayerFilmInbox`/`AssignmentCard` · `ClipViewer`
  (segment-clamped MuxPlayer + telestration render) · `TeachingPointCard` ·
  `ResponseCard` (`TextReflection`, `ChoiceCheck`, `ConfidenceTap`,
  `ReviewWithCoachFlag`) · `DoneButton` · `AutoAdvanceCard`.
- **Local state:** watch-seconds accumulator (`useWatchProgress`) · response
  draft (localStorage-mirrored) · card step.
- **Server data:** `GET /api/assignments` (player-scoped) ·
  `GET /api/assignment-players/:id` (clip + note + annotations + thread).
- **Mutations:** `postProgress` (throttled 5s) · `submitReview`
  (idempotency-keyed) · both queue offline and flush on reconnect.
- **Loading:** poster + shimmer ≤2s target. **Error:** playback error →
  "report issue" (flags coach); submit fail → "saved, will retry" (local).
  **Empty:** "No film to review. 🏀".

### 5. IDP escalation panel
- **Route:** none — `IdpEscalatePanel` sheet/modal mounted from Workspace,
  Queue drawer, and (P4) pattern summaries.
- **Purpose:** clip/assignment → IDP evidence in one step.
- **Components:** `IdpEscalatePanel` (player select — prefilled ·
  `FocusAreaPicker` (existing-first, create-new inline) · note textarea
  prefilled from clip note · evidence preview).
- **Local state:** form fields only.
- **Server data:** `GET /api/players/:id/idp/focus-areas` (existing module).
- **Mutations:** `escalate` → on success closes + toasts with "View in IDP"
  link.
- **Loading:** focus-area list skeleton. **Error:** inline; keeps fields.
  **Empty:** no active IDP → "create first focus area" inline path.

---

## Reusable components (new, shared across surfaces)

`StatusPill` (all enums, one component, variant maps) · `DueChip` (relative +
overdue red) · `PlayerChip` (jersey+name, removable variant) ·
`CategoryChips` · `ClipThumb` (hover-scrub desktop / tap-play mobile) ·
`EventTimeline` (assignment history; reused drawer + player thread) ·
`ResponseThread` · `ConfirmDialog` · `FilterBar` (URL-param sync wrapper) ·
`SkeletonRows` · `RegionError` (inline banner + retry, wraps any query
region).

## Hooks / state model

Server state = TanStack Query exclusively. Client state = component-local +
two reducers. **No Redux/Zustand additions** — the only cross-cutting client
state is the workbench reducer and selection sets.

- `useFilms(filters)` / `useFilm(id)` / `useAttentionCounts()`
- `useClipAutosave(clipId)` — debounce, dirty tracking, localStorage mirror,
  exposes `saveState: 'saved'|'saving'|'error'|'local'`
- `useWorkbench()` — the reducer (playhead, marks, zoom, activeClip)
- `useAssignmentsQueue(filters)` — infinite query + aggregates
- `useFollowup(assignmentPlayerId)` — all followup kinds, one mutation
- `useWatchProgress(assignmentPlayerId)` — accumulator + throttled post +
  offline flush
- `useSubmitReview(assignmentPlayerId)` — idempotency key, offline queue
- `useEscalate()` · `useSuggestions(filmId)` (P5)
- `useShortcuts(map)` — scoped keyboard handling (workspace/queue)

## Query keys

```ts
['films', filters]            ['film', filmId]        ['film-attention']
['clips', filmId]             ['roster']
['assignments', filters]      ['assignment', apId]    ['assignment-events', apId]
['player-inbox']              ['player-assignment', apId]
['idp-focus-areas', playerId] ['suggestions', filmId, kind?]
```

Invalidation rules: clip mutations → `['clips', filmId]` + `['film-attention']`;
assign → `['assignments']`, `['clips', filmId]`, `['film-attention']`;
followup/review → `['assignment', apId]`, `['assignments']`,
`['player-inbox']`; escalate → `['assignment', apId]`,
`['idp-focus-areas', playerId]`.

## Form strategy

Plain controlled inputs + the autosave hook for the clip editor (it's an
editor, not a form — no submit). `react-hook-form` + zod only where a real
submit exists: UploadFilmDialog, AssignmentBlock, IdpEscalatePanel, choice
question builder. Player ResponseCard is controlled state (3 fields max —
RHF would be overhead). Zod schemas shared with the API layer where the repo
already does so.

## Optimistic updates

| Mutation | Optimistic behavior | Rollback |
|---|---|---|
| updateClip (autosave) | fields are the source of truth already | indicator → error state |
| approveClip | rail row → green instantly | revert + toast |
| assign | rail → blue, toast immediately | revert + error toast |
| followup: complete/nudge | row state/pill updates in place | revert + toast |
| bulk complete/archive | rows update, undo toast (10s) | server result reconciles per-row |
| submitReview (player) | Done → ✓ immediately; sync in background | "will retry" chip, never blocks the player |
| watch progress | local accumulator is truth; server eventually consistent | n/a |

Not optimistic: escalate (creates IDP records — show real result), upload.

## Analytics events

`film_uploaded {type}` · `clip_created {source, duration_ms}` ·
`clip_time_to_create_ms` (I-press → save; **the 30s KPI**) ·
`clip_assigned {players, has_due, response_required}` ·
`suggestion_resolved {kind, action, confidence}` ·
`assignment_opened/watched/responded {latency_from_sent}` ·
`followup {kind}` · `nudge_sent` · `idp_escalated {source}` ·
`queue_bulk_action {action, count}` · `player_review_duration_ms`
(open → done; **the 60s KPI**) · `review_with_coach_flagged`.
Fire from the mutation success handlers (one `track()` util, provider TBD)
— never from render.

## Test plan

- **Unit (vitest, existing setup):** workbench reducer (marks, swap, zoom) ·
  attention-order sort comparator · overdue derivation · watch-seconds
  accumulator (unique seconds, no double-count) · autosave debounce/dirty
  logic · query-key invalidation maps.
- **Component (vitest + testing-library):** ClipEditor (dirty→autosave→saved
  indicator states) · ResponseCard (Done disabled until config satisfied —
  each response-type combo) · AssignmentRow glyph cluster per status ·
  RegionError retry · IdpEscalatePanel prefill.
- **E2E (Playwright, add):** P1 golden path — upload-stub → mark I/O →
  Enter → type → ⌘Enter → assignment row exists; P2 player path — inbox →
  watch (mock progress) → respond → Done → coach queue shows responded;
  keyboard-only workspace run; offline player submit → reconnect → synced.
- **Contract:** zod parsing of all API responses in test mode (schema drift
  fails CI, not production).
- **Manual device pass per release:** iPhone SE + Pro Max in the iOS shell —
  safe areas, autoplay, haptics, keyboard-over-card.
```
