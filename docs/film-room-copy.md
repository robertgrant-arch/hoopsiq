# Film Room v2 — UI Copy

Tone rules: verbs first · basketball words where they earn their place · no
"AI-powered," "insights," "unlock," or "magic" · every status is a fact, not
a mood · sentence case everywhere except type chips (GAME, PRACTICE).

---

## Before → after naming

| Before | After | Why |
|---|---|---|
| Film Analysis Hub | **Film Room** | It's the room where film work happens, not a hub for analysis artifacts |
| "AI-powered pattern detection across game film…" | **"Upload film. Cut clips. Send them to your players. See who watched."** | The product in four verbs |
| Insights Archive | **Suggestion history** (a tab, not a place) | Honest name for what it is: a record of AI suggestions and what you did with them |
| AI Summary | **AI assist** (panel) | Assist is the job description |
| Insights | **Suggestions** | An insight claims truth; a suggestion asks for judgment |
| Confirm / Dismiss / Escalate insight | **Use / Dismiss** (suggestions) · **Add to IDP** (clips) | Escalation is a coach action on a clip, not a verdict on AI output |
| Queue | **Assignments** | The queue is of assignments, name the thing |
| Pending AI | *(deleted)* | Film is never waiting on a model |
| Ready for review | **Ready to clip** | Says what a coach can do next |
| Reviewed | **Clipped** (+ counts) | Outcome, not ceremony |

## Status labels

**Film:** `Uploading` · `Processing` · `Ready to clip` · `Upload failed` ·
`Archived`. (Analysis overlay when relevant: `Analyzing` / `Suggestions
ready` / `Analysis unavailable` — never blocks anything.)

**Clip:** `Suggested` · `Draft` · `Approved` · `Sent` · `Archived`.
("Sent" beats "Assigned" on chips — it's what the coach did.)

**Assignment (coach view):** `Not sent` (draft tray) · `Sent` · `Opened` ·
`Watched` · `Responded` · `Closed` · overlay: `Overdue` · badge: `In IDP`.

**Player view (only these three ever):** `To do` (+ due chip) · `Done` ·
`Coach replied`.

## Button labels

| Context | Label |
|---|---|
| Primary, Library | `Upload film` |
| Clip drawer primary | `Approve & send` (⌘↵) |
| Clip drawer secondary | `Approve` · `Save draft` |
| Note editor AI | `Draft note` (result banner: `AI draft — edit or send as is`) |
| Suggestion row | `Use` · `Dismiss` (boundary rows: `Make clip`) |
| Assign dialog confirm | `Send to 3 players` (always the count) |
| Queue row actions | `Reply` · `Close` · `Remind` · `Add to IDP` |
| Bulk bar | `Change due date` · `Close` · `Reassign` · `Add to IDP` · `Archive` |
| Player primary | `Done` (`Send & done` when a response is required) |
| Player flag | `I'd like to go over this with coach` |
| IDP panel confirm | `Add to [player]'s IDP` |
| Destructive confirms | `Delete clip` / `Archive film` (never bare "Confirm") |

Never: "Submit," "OK," "Get insights," "Analyze now," "Leverage."

---

## Per-surface copy

### Film Room landing (Library + work strip)
- Page title: **Film Room**
- Subhead (first run only): *Upload film, cut clips, send them to players.*
- Work strip cards: `2 films ready to clip` · `5 clips ready to send` ·
  `7 waiting on players` · `3 overdue — follow up` (each is a link, phrased
  as the work itself)
- Strip zero state: `All caught up.`
- Upload CTA (empty library): **Upload your first film** / helper: *Game,
  practice, or skill work — clips come next.*
- Filter empty: `No film matches these filters.` → `Clear filters`
- Coverage cell examples: `6 clips · 2 not sent` · `9 sent · 3 unwatched ·
  1 overdue`
- Processing row helper: `Processing — usually a few minutes. We'll notify
  you.`
- Failed row: `Upload failed — [reason].` → `Try again`

### Film Library specifics
- Suggestion history tab label: **Suggestion history** · header: *Every AI
  suggestion and what you did with it.* · empty: `No suggestions yet.
  They'll appear after film is analyzed.`
- Archive confirm: `Archive this film? Clips and assignments stay intact.`

### Clip Workspace
- Empty editor (no active clip): **Mark a moment.** *Press* `I` *to set the
  start,* `O` *to set the end, then* `Enter` *to make the clip.*
- Title placeholder: `Name this clip — your players will see it`
- Note label: **Teaching point** · placeholder: `What should they see, and
  what do you want next rep?`
- AI draft marker: `AI draft — make it yours or send as is`
- Draft note unavailable tooltip: `No analysis for this stretch yet.`
- Tag field placeholder: `Add players — number or name`
- Suggested-player chips helper: `Detected in this clip — tap to tag.`
- Assign block: due label `Due` (default chip: `Next practice · Thu`) ·
  toggle `Ask for a response` · prompt placeholder: `What do you see?`
- Autosave states: `Saving…` · `Saved` · `Not saved — retrying` · `Offline —
  saved on this device`
- Locked clip: `Sent clips can't be edited — players already saw this
  version.` → `Duplicate to edit`
- Duplicate flag: `Looks like Clip 4 (78% overlap).` → `Compare`
- Long-clip nudge: `1:40 is long for a teaching clip. Sending anyway is
  fine.`
- Processing state: `Processing film — you can't scrub yet. Usually a few
  minutes.`

### Assignment Queue
- Page title: **Assignments**
- Summary strip: `142 active · 78% watched · 61% responded · 9 overdue`
- Draft tray header: `Ready to send (5)`
- Saved views: `My overdue` · `Waiting on a reply` · `Sent this week` ·
  `In IDP`
- Row tooltip cluster: `Watched 94% · Responded · Not closed · In IDP`
- Nudge confirmation: `Reminder sent to Marcus.` · rate-limit: `Already
  reminded in the last 12 hours.`
- Reassign helper: `The original assignment is archived and kept in history.`
- Empty (never sent): `Send your first clip from the Film Room and it shows
  up here.` → `Open Film Room`
- Empty (overdue filter): `Nothing overdue.`
- Empty (all closed): `All caught up — 34 closed this month.`
- Auto-close event-log line: `Closed automatically — watched, no response
  required.`

### Player Review
- Inbox title: **Film** · empty: `No film to review.`
- Card due chips: `Due Thu` · `Due today` · `Overdue`
- Gate under video: `Watch the clip to respond.`
- Teaching point header: `Coach [name]`
- Reflection prompt default: `What do you see?`
- Confidence prompt: `How confident are you fixing this?`
- Flag: `I'd like to go over this with coach`
- Offline chip: `Saved — sends when you're back online.`
- After done: `Done ✓` → auto-advance: `Next: Spacing @4:12 (0:09)` ·
  `Not now`
- Coach reply badge: `Coach replied`

### IDP escalation panel
- Title: **Add to IDP**
- Helper: *This clip becomes evidence on [player]'s development plan.*
- Focus area label: `Focus area` · empty: `No active focus areas — create
  one:` (inline field)
- Note label: `Why this clip` (prefilled from the teaching point)
- AI-origin badge (when applicable): `Suggested from 4 similar clips` —
  tooltip lists them
- Success toast: `Added to Marcus's IDP.` → `View IDP`
- Duplicate warning: `This clip is already on Marcus's IDP for Closeouts.
  Add it again?`

### AI assist panel
- Panel title: **AI assist** · collapsed badge: `(6)`
- Section intro (first open only): *Suggestions from film analysis. Nothing
  is sent or saved until you use it.*
- Row verbs: boundary → `Make clip` · tags → `Use tags` · note → `Use draft`
  · duplicate → `Compare` · IDP → `Review` — plus `Dismiss` on every row
- Rationale lines (examples of calibrated tone): `Turnover at 23:41` (high
  conf) · `Looks like a late rotation at 31:05` (mid) · `Possible switch
  miscue at 44:12 — worth a look?` (low)
- Low-confidence group: `12 more low-confidence moments` (collapsed)
- Analysis states: `Analyzing film…` · `Analysis unavailable for this film.
  Everything else works normally.` · `No suggestions for this film.`
- Empty after all resolved: `All suggestions handled.`
- IDP recommendation badge on rows: `Suggested for IDP` · tooltip: `4 clips,
  same category, 14 days` (evidence, not adjectives)

---

## Voice guardrails (for future copy)

- Say what happened: `Sent to 3 players`, not `Success!`
- Say what to do: `Mark a moment`, not `Get started with clips`
- Numbers over adjectives: `4 clips in 14 days`, not `frequently`
- The coach owns verbs; AI owns suggestions: AI copy never says `I found` —
  it says what's on the film with a timestamp
- Player-facing text: coach's words only. The system never coaches.
```
