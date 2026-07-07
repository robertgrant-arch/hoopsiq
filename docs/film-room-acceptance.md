# Film Room v2 — Product Acceptance Criteria

Given/When/Then scenarios. Product-level: these gate release, phrased to be
executable as Playwright/API tests. Companion to the full spec set.

---

## 1. Film upload and readiness

**1.1 Upload starts and survives navigation**
- Given a coach on the Film Library
- When they upload a 2GB game file and navigate away mid-upload
- Then the upload continues in the background, the film row shows
  `Uploading`, and returning to the Library shows live progress.

**1.2 Ready without AI**
- Given an uploaded film whose media processing has finished
- And the analysis job is still running or has failed
- When the coach opens the film
- Then the status is `Ready to clip`, full scrubbing and clipping work, and
  no AI state ever blocks or delays this.

**1.3 Failure is actionable**
- Given an upload Mux rejects (unsupported codec)
- When processing fails
- Then the row shows `Upload failed — [reason]` with a `Try again` action,
  and retrying reuses the film's metadata without re-entry.

**1.4 Readiness notification**
- Given a coach uploaded film and left the app
- When the film becomes ready
- Then they receive one "ready to clip" notification (subject to quiet
  hours), and the Library work strip counts the film under "ready to clip."

## 2. Clip creation

**2.1 The golden path**
- Given a coach in the Clip Workspace with film playing
- When they press `I` at 23:38, `O` at 23:52, `Enter`, type a title and a
  note, tag "#23", and press `⌘Enter` accepting defaults
- Then a clip exists with bounds 23:38.0–23:52.5 (±1 frame), an assignment
  exists for player #23, and total elapsed time can be ≤30 seconds.

**2.2 Bounds are local until save**
- Given a coach marking in/out points
- When network connectivity is lost during marking
- Then marking, scrubbing, and duration readout continue to work, and only
  `Enter` (save) attempts a request.

**2.3 Stacking without loss**
- Given an open clip editor with unsaved note text
- When the coach marks a new in-point on the timeline
- Then the current clip autosaves as a draft first, then the new range
  begins, and no entered text is lost.

**2.4 Out-before-in**
- Given a playhead at 10:00 with in-point set at 12:00
- When the coach sets the out-point at 10:00
- Then the bounds auto-swap (in 10:00 / out 12:00) with no error.

## 3. Clip editing

**3.1 Autosave**
- Given a draft clip with editor changes
- When 1 second passes after the last keystroke
- Then the changes are persisted, the indicator reads `Saved`, and reloading
  the page shows the same content.

**3.2 Crash recovery**
- Given a coach typing a note when the browser crashes
- When they reopen the workspace
- Then a "Restore unsaved draft?" prompt offers the exact pre-crash content.

**3.3 Sent clips are immutable**
- Given a clip that has been sent to any player
- When the coach attempts to change its bounds or note via UI or API
- Then the UI shows `Sent clips can't be edited` with `Duplicate to edit`,
  the API returns 409 `CLIP_LOCKED`, and a direct DB update raises the lock
  trigger. Title/categories/priority remain editable.

**3.4 Telestration attaches to the clip**
- Given a coach draws on frame at 23:45 inside a clip spanning 23:38–23:52
- When a player later views the clip
- Then the drawing renders at 23:45 during playback, and the clip row shows
  a telestration badge.

## 4. Clip assignment

**4.1 Multi-player fan-out**
- Given an approved clip tagged to 3 players
- When the coach sends with a due date and "response required"
- Then 3 assignment rows exist (one per player), each player receives one
  notification (quiet-hours deferred), the clip locks, and the toast reads
  `Sent to 3 players`.

**4.2 Only approved clips send**
- Given a clip in `draft` or `suggested` state
- When an assignment is attempted via API
- Then the request is rejected with a clear error, and the UI never offers
  send on non-approved clips.

**4.3 Draft tray**
- Given a coach approves a clip without sending
- When they open the Assignments page
- Then the clip appears under `Ready to send (n)` and can be sent from
  there with the same options.

**4.4 Default due date**
- Given a team with a practice on Thursday in the events calendar
- When the assign dialog opens on Tuesday
- Then the due date defaults to Thursday and is editable.

## 5. Player review

**5.1 Segment fidelity**
- Given a player opens an assigned clip (bounds 23:38–23:52)
- Then playback starts at 23:38 ±0.5s, scrubbing cannot leave the segment,
  and the coach note is visible without scrolling on a 375×812 viewport.

**5.2 Watched threshold**
- Given a player watching an assigned clip
- When their unique watched seconds reach 90% of the segment
- Then the assignment becomes `Watched` (visible to the coach), and looping
  the same seconds does not inflate progress.

**5.3 Response gating**
- Given an assignment requiring a text response
- When the player attempts `Done` before watching or before typing
- Then `Done` is disabled with `Watch the clip to respond` (pre-watch) and
  enabled only when the required response is present.

**5.4 Offline completion**
- Given a player watches and responds while offline
- When connectivity returns
- Then progress and the response sync automatically without duplication,
  and the coach sees `Responded` with the player's original timestamp.

**5.5 Review-with-coach flag**
- Given any assigned clip
- When the player taps "I'd like to go over this with coach"
- Then the coach's queue row visibly shows the flag within one refresh.

## 6. Overdue reminders

**6.1 Derivation**
- Given an assignment due yesterday with status `Sent` or `Opened` or `Watched`
- Then it renders as `Overdue` in the queue and counts in the work strip —
  and an assignment that reached `Responded` before the deadline never
  shows as overdue anywhere.

**6.2 Bundling and caps**
- Given a player with 3 clips due tomorrow
- When the T-24h reminder fires
- Then exactly one notification is sent ("3 clips due tomorrow"), and no
  player receives more than one automatic film notification per day.

**6.3 Reminders stop at watched**
- Given a player who watched a clip but hasn't responded
- Then no automatic reminders are sent for it; only a manual coach nudge
  can re-notify, and nudges are rate-limited to one per 12h per assignment.

**6.4 Quiet hours**
- Given org quiet hours 9pm–7am
- When any assignment/reminder/nudge notification is generated at 10pm
- Then delivery is deferred to 7am and the send is logged with its deferral.

## 7. Coach follow-up

**7.1 Attention order**
- Given a queue containing an overdue row, a responded-unclosed row, and a
  fresh sent row
- When the coach opens Assignments with default sort
- Then the order is: overdue, then responded-awaiting-follow-up, then sent —
  and any column click switches to explicit sort.

**7.2 Close the loop**
- Given a responded assignment
- When the coach replies and closes it
- Then the player sees the reply (`Coach replied` badge), the row reads
  `Closed`, the event log records both actions with actor and time.

**7.3 Auto-close is bounded and labeled**
- Given an org auto-close window of 7 days
- When a watched, no-response-required assignment passes 7 days
- Then it closes automatically and its event log line reads
  `Closed automatically — watched, no response required`.

**7.4 Bulk partial failure**
- Given 10 selected rows where 2 cannot be closed (already archived)
- When the coach bulk-closes
- Then 8 close, the 2 failures are listed by row with reasons, and an undo
  restores the 8 within 10 seconds.

## 8. IDP escalation

**8.1 Manual escalation**
- Given a responded assignment for player Marcus
- When the coach chooses `Add to IDP`, picks focus area "Closeouts," and
  confirms
- Then an IDP evidence item exists linking the clip, the ledger records
  escalated-by/when/source=coach, the queue row shows `In IDP`, and the
  IDP item links back to the clip.

**8.2 No silent escalation**
- Given any AI recommendation state
- Then no IDP item is ever created without an explicit coach confirm in the
  escalation panel — verified by the absence of any API path from
  suggestion resolution to IDP creation.

**8.3 Duplicate guard**
- Given a clip already on Marcus's IDP for Closeouts
- When the coach escalates the same clip to the same focus area
- Then a warning names the existing link and requires explicit confirmation.

**8.4 Unlink is auditable**
- Given a linked IDP item
- When a coach unlinks it with a reason
- Then the ledger retains the record with `unlinked_at` and reason — history
  is never deleted.

## 9. Audit trail

**9.1 Full coverage**
- Given any state change (film status, clip approve/lock, assignment
  transitions, nudges, due changes, escalations, suggestion resolutions)
- Then an audit event exists with actor (or `system`/`ai`), entity, action,
  before/after, and timestamp.

**9.2 Append-only**
- Given any application role or service credential
- When an UPDATE or DELETE is attempted on audit events
- Then it is refused at the database permission level.

**9.3 Visible history**
- Given a coach opens an assignment drawer
- Then the event log shows the complete ordered history of that assignment,
  human-readable, including auto-actions labeled as automatic.

## 10. Permissions and access control

**10.1 Player isolation**
- Given player A authenticated on any API endpoint or page
- When they request assignments, clips, or responses
- Then they receive only rows where they are the assigned player — player
  B's data is never returned (verified at the API with direct requests,
  not just UI).

**10.2 Coach boundary**
- Given a coach in org X
- When they request any film, clip, or assignment in org Y
- Then the request returns 403/404 and nothing about org Y's existence.

**10.3 Role gates on writes**
- Given an authenticated player session
- When it attempts to create a clip, send an assignment, resolve a
  suggestion, or escalate to IDP
- Then every such request is rejected with 403.

**10.4 Parent read-only**
- Given a guardian linked to player Marcus
- When they view film assignments
- Then they can see Marcus's assignment states but cannot respond, and see
  no other player's data.

**10.5 AI invisibility to players**
- Given any player or parent session
- Then no AI suggestion content is ever returned by any endpoint available
  to that session.

## 11. AI assist suggestions

**11.1 Optionality**
- Given the AI panel is never opened and no suggestion is ever resolved
- Then every scenario in sections 1–10 passes unchanged.

**11.2 Nothing auto-applies**
- Given suggestions exist for a film (boundaries, tags, note draft)
- When the coach performs the golden path without touching the panel
- Then no suggestion content appears in the created clip, its note, its
  tags, or the timeline marks.

**11.3 Accept is explicit and marked**
- Given a note draft suggestion
- When the coach clicks `Use draft`
- Then the editor fills with the draft visibly marked `AI draft`, the
  marker clears on edit or save, and the clip records
  `note_source: ai_draft_accepted` when saved unedited.

**11.4 Evidence requirement**
- Given any rendered suggestion
- Then it displays at least one timestamp reference into the source film,
  and suggestions failing schema or evidence validation are absent (logged
  server-side, never rendered).

**11.5 No path to players**
- Given any sequence of suggestion accept/dismiss operations
- Then no player notification, assignment, or IDP item results without the
  standard coach send/escalate flows — verified by code audit and API tests
  that suggestion endpoints cannot produce those side effects.

**11.6 Analysis failure is quiet**
- Given the analysis job fails for a film
- Then the panel shows `Analysis unavailable for this film. Everything else
  works normally.` and no other surface degrades.

## 12. Failure states

**12.1 Autosave failure**
- Given autosave requests failing (server 500 or offline)
- Then the indicator reads `Not saved — retrying` (or `Offline — saved on
  this device`), field content is never cleared, retry succeeds without
  re-entry, and leaving the page warns exactly once.

**12.2 Send failure**
- Given assignment creation fails mid-fan-out (2 of 3 players succeed)
- Then the coach sees exactly which player failed with a retry for that
  player only; no duplicate assignments result from the retry.

**12.3 Notification failure**
- Given a push delivery fails
- Then the assignment still exists, the queue shows its delivery state, and
  delivery retries in the background — a player opening the app sees the
  assignment regardless.

**12.4 Playback failure (player)**
- Given a player's clip fails to play
- When they tap "report issue"
- Then the coach's queue row is flagged with the playback issue, and the
  player is not marked overdue while the flag is open.

**12.5 Webhook loss**
- Given the Mux ready webhook is never delivered
- When the coach opens the film
- Then a reconciliation check runs and the film transitions to
  `Ready to clip` without manual intervention.

**12.6 Concurrent edit safety**
- Given the same draft clip open in two tabs
- When both edit and autosave
- Then last-write-wins is applied field-consistently (no interleaved
  corruption), and both tabs converge to the same saved state on refetch.
```
