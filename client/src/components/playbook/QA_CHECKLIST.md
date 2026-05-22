# Playbook Studio v2 — Manual QA Checklist

Run through this list after any change to the canvas, store, or playback.

## Token placement
- [ ] Click **Offense** (`O`) and click on the court — a numbered offense
  token appears at the click point with the next available label.
- [ ] Click **Defense** (`X`) and place defenders — auto-labels `X1..X9`.
- [ ] Click **Ball** (`B`) once — places the ball.
- [ ] Click **Ball** (`B`) again on a different point — moves the existing
  ball; **does not create a second ball**.
- [ ] Click **Cone** (`K`) — drops a triangular cone token.
- [ ] Click a token while in any ADD_* mode — selects the token instead of
  stacking a new one on top.

## Draw tools (the high-priority fix)
For each of `P` (Pass), `D` (Dribble), `C` (Cut), `S` (Screen), `H` (Handoff):
- [ ] Choose the tool.
- [ ] Click one token — the source token highlights with a yellow ring,
  and a dashed ghost line follows the cursor.
- [ ] Move the cursor — the ghost line follows.
- [ ] Click a different token — the action is committed and rendered
  immediately. The arrowhead points along the curve's end-tangent.
- [ ] The action is saved into the current phase (stays after switching
  away and back).
- [ ] Repeat 5 times in a row to confirm reliability.

## Draw-mode edge cases
- [ ] Choose Pass, click token A, click token A again — draft cancels with
  no action created.
- [ ] Choose Pass, click token A, switch to Cut — draft is cleared (no
  cross-tool leakage).
- [ ] Choose Pass, click token A, press `Esc` — draft cancels.
- [ ] Choose Pass, click token A, click on empty court area — draft cancels
  cleanly.
- [ ] Choose Pass, click token A, drag mouse off the canvas, release — no
  ghost line remains.

## Token drag
- [ ] In SELECT mode, drag a token to the edge of the court — token is
  clamped to the playable area.
- [ ] Drag a token outside the visible canvas — token stays inside.
- [ ] Drag a token marked `locked: true` — does not move.

## Path selection
- [ ] In SELECT mode, hover near a path — the wide hit area lets you
  select even when not directly on the stroke.
- [ ] Click a path — it highlights and shows up in the right rail.
- [ ] Click empty court — selection clears.

## Delete behavior
- [ ] Select a token, press `Delete` — token is removed; any paths
  starting or ending at that token are also removed.
- [ ] Select a path, press `Delete` — only that path is removed.
- [ ] In phase notes / title input, press `Delete` — does not remove the
  selected token.

## Undo / Redo
- [ ] Add a token, press `Cmd/Ctrl + Z` — token disappears.
- [ ] Press `Cmd/Ctrl + Shift + Z` (or `Cmd/Ctrl + Y`) — token reappears.
- [ ] Toolbar ↶ button works the same as Cmd+Z; ↷ same as Cmd+Shift+Z.
- [ ] After 50+ edits, undo only goes back 50 steps (oldest dropped).
- [ ] After undoing then making a new edit, redo stack is cleared.
- [ ] Undo / redo across play deletion does not throw (entries for the
  deleted play are dropped).

## Save / Restore version
- [ ] Type your name in the **Your name** input.
- [ ] Click **Save version** — toast confirms, version appears in history
  with your name.
- [ ] Make some edits, then **Restore** the saved version — the play
  reverts; phase selection resets to first phase.
- [ ] If `authorName` is left blank, version author is `Unknown coach`.
- [ ] Save version is rejected with an error toast if the snapshot fails
  validation (e.g. corrupted via devtools).

## Playback
- [ ] Click **Play** with 2+ phases — tokens animate smoothly from phase
  to phase.
- [ ] Switch tabs for ~10 seconds, switch back — playback does **not**
  fast-forward; it resumes from where it was when the tab was hidden.
- [ ] Click **Pause** then **Play** — resumes from the same position.
- [ ] Click reset — cursor returns to 0, playback stops.

## Keyboard shortcuts
- [ ] All shortcuts (`V/O/X/B/K/P/D/C/S/H`) switch tools.
- [ ] `Esc` cancels any in-flight draft, then returns to SELECT.
- [ ] `Cmd+Z` / `Cmd+Shift+Z` work.
- [ ] Shortcuts do not fire while typing in any input or textarea.

## Persistence reload
- [ ] Make edits, refresh the browser — edits persist.
- [ ] Open devtools → Application → localStorage → set
  `hoopsiq-playbook` to `garbage` — refresh — editor does not crash and
  loads default plays.
- [ ] In Safari private mode (or any sandboxed iframe), the editor still
  loads (storage adapter degrades silently).

## Visual
- [ ] Selected token has a clear yellow ring and the right rail shows
  selected token info.
- [ ] Selected path has a clear shadow and the right rail shows path
  info.
- [ ] Source token during draft has a yellow glow.
- [ ] Cones render as triangles, balls render distinctly with cross-hairs.
