# Film Room v2 — Information Architecture

Companion to `film-room-v2-spec.md`. Defines the sitemap, object model, section
contracts, and the default landing experience.

---

## Sitemap

```
/app/coach/film                        FILM ROOM (coach)
├── /                                  Film Library  ← default landing
│   │                                  (leads with the "Needs Attention" work strip)
│   ├── ?tab=insights                  Insights Archive — demoted to a filtered
│   │                                  view of past AI suggestion history
│   └── /upload                        Upload flow (modal route)
├── /:sessionId                        Clip Workspace (per source film)
│   └── [AI Summary = collapsible side panel here, not a destination]
├── /assignments                       Assignment Queue
├── /inbox                             Review Inbox
├── /players                           Player Progress
│   └── /players/:playerId             per-player film accountability detail
└── /idp-links                         IDP Links

/app/player/film                       PLAYER FILM (mobile-first)
├── /                                  My Clips inbox
└── /:assignmentId                     Clip viewer + response

Nav labels: "Film Room" opens the Library. "Queue" in the old nav becomes
"Assignments" (points at /assignments). Scouting remains a sibling product
that can deep-link into Clip Workspace for shared sessions.
```

---

## Object model

```
SourceFilm 1 ──< Clip >── M:N ── Player        (clip_players)
                 │
                 └──< ClipAssignment (clip × player, the atomic unit)
                        │
                        ├──< PlayerReview   (view events + response thread)
                        ├──< CoachFollowUp  (ack / reply / nudge / close)
                        └──? IDPEscalation  (0..1 per assignment or clip,
                                             → coaching_actions / IDP evidence)

AISuggestion >── SourceFilm (boundaries) or Clip (tags/notes/duplicates/IDP-rec)
  status: suggested → accepted | dismissed   (coach-only transitions)
```

- **Source Film** — an uploaded session (game / practice / skill rep / highlight).
  States: `uploading → processing → ready → archived`. AI analysis is an overlay
  job on it, never a gate: film is clippable the moment playback is ready.
  (Old "Pending AI" state dies — it made AI a blocking stage.)
- **Clip** — coach-owned timestamped segment. `suggested → draft → approved →
  assigned → archived`. Locks on first assignment; edits fork a duplicate.
- **Clip Assignment** — clip × player + due date + response-required flag.
  `assigned → viewed → responded → closed`, `overdue` derived.
- **Player Review** — the player-side record: view events (% watched,
  timestamps) and the response thread.
- **Coach Follow-Up** — the coach's side of closing the loop: acknowledge,
  reply, nudge, close. Lives on the assignment; surfaced in Review Inbox.
- **IDP Escalation** — a link object from clip/assignment into the IDP system
  (focus area + note + clip reference). Created only by a coach.

---

## Sections

### 1. Film Library — `/app/coach/film`
| | |
|---|---|
| **Purpose** | Home for all Source Film; the Film Room front door. Answers "what film do we have, and what work does it need?" |
| **Key actions** | Upload film · open a session in Clip Workspace · archive · retry failed processing · (from the work strip) jump straight to any pending work |
| **List fields** | thumbnail · title · TYPE chip (GAME/PRACTICE/SKILL REP/HIGHLIGHT) · opponent + date · duration · **clip coverage** ("6 clips · 2 unassigned") · **assignment coverage** ("9 assigned · 3 unwatched · 1 overdue") · status |
| **Filters** | type · status · opponent · season · date range · "has unassigned approved clips" · "no clips yet" |
| **Belongs** | sessions, upload, processing states, the Needs-Attention strip, the demoted Insights Archive tab |
| **Does not belong** | individual clips (Workspace), assignment states (Queue/Inbox), AI insight cards as content |
| **Connects to** | row → Clip Workspace · coverage numbers → Assignment Queue / Review Inbox pre-filtered to that session |

### 2. Clip Workspace — `/app/coach/film/:sessionId`
| | |
|---|---|
| **Purpose** | Where clips are made: watch, mark, annotate, tag, approve. The craft surface. |
| **Key actions** | mark in/out (I/O keys) · edit bounds/title/note · tag players · set categories · accept/edit/dismiss AI suggestions · approve · approve & assign · duplicate a locked clip · escalate to IDP |
| **List fields** (clip rail) | time range · title · player chips · category chips · status color (gray draft / amber suggested / green approved / blue assigned) |
| **Filters** | clip status · player · category · source (coach vs AI-accepted) |
| **Belongs** | the video player, timeline with clip spans, clip rail, clip drawer, **AI Summary as a collapsible side panel** (session-level summary + suggestion list, each row accept/edit/dismiss) |
| **Does not belong** | assignment tracking (Queue), player responses (Inbox), cross-session views |
| **Connects to** | Approve & Assign → creates rows in Assignment Queue · Escalate → IDP Links · suggestions consumed here are what Insights Archive records |

### 3. Assignment Queue — `/app/coach/film/assignments`
| | |
|---|---|
| **Purpose** | Dispatch and delivery tracking: what has been (or should be) sent to whom, and whether it landed. Pre-response accountability. |
| **Key actions** | assign approved clips (bulk) · set/extend due dates · nudge (re-notify) · cancel an assignment · mark-watched override (film watched together in practice) |
| **List fields** | player · clip title (hover-scrub thumb) · session · assigned date · due date · state pill (Assigned / Viewed / **Overdue**) · nudge count |
| **Filters** | player · session · state · overdue-only · due this week · assigned-by (staff) |
| **Belongs** | unsent approved clips ("ready to assign" section at top) and in-flight assignments not yet responded |
| **Does not belong** | responses and closing the loop (Review Inbox) · clip editing (Workspace) |
| **Connects to** | rows graduate to Review Inbox when a player responds (or auto-close matures) · "ready to assign" pulls from Workspace approvals |

### 4. Review Inbox — `/app/coach/film/inbox`
| | |
|---|---|
| **Purpose** | The coach's response desk: everything a player has sent back and every loop awaiting coach closure. Post-response accountability. |
| **Key actions** | read response · reply (thread) · acknowledge & close · reopen · escalate to IDP from a response · bulk-close viewed-only items |
| **List fields** | player · clip title · response preview (first line) · responded-at · thread length · state (Responded / Replied / Closed) · IDP-linked badge |
| **Filters** | player · session · unread-first · awaiting-my-reply · closed (history) |
| **Belongs** | response threads, coach follow-up actions, close/ack |
| **Does not belong** | unviewed assignments (Queue) · creating clips |
| **Connects to** | Escalate → IDP Links · closed items feed Player Progress stats |

### 5. Player Progress — `/app/coach/film/players`
| | |
|---|---|
| **Purpose** | Per-player accountability rollup over time. Answers "who engages with film, who doesn't?" — the retention view coaches use in player meetings. |
| **Key actions** | open player detail (assignment history + response quality) · nudge all overdue for a player · jump to that player's IDP |
| **List fields** | player · assigned (30d) · watched % · avg time-to-view · responded % · overdue now · last activity · IDP links count |
| **Filters** | team · date window (7/30/season) · sort by any metric · "falling behind" preset (watched % < threshold or ≥2 overdue) |
| **Belongs** | aggregates, trends, per-player drill-down timeline |
| **Does not belong** | individual assignment management (Queue/Inbox handle actions; this view links into them) |
| **Connects to** | every number is a link into Queue/Inbox pre-filtered to that player · player detail links to IDP |

### 6. IDP Links — `/app/coach/film/idp-links`
| | |
|---|---|
| **Purpose** | Ledger of every film → development escalation: which clips became IDP evidence, for which focus areas, and what happened next. |
| **Key actions** | open the clip · open the IDP focus area · unlink (with reason) · create follow-up coaching action |
| **List fields** | player · clip title · focus area · escalated-by + date · source (coach / AI-recommended-coach-approved badge) · IDP item status |
| **Filters** | player · focus area · date range · source · open vs resolved IDP items |
| **Belongs** | the escalation record and its bidirectional links |
| **Does not belong** | IDP management itself (that stays in the IDP product; this is the film-side index) |
| **Connects to** | rows link both directions (Workspace clip ↔ IDP item) · escalations originate in Workspace and Review Inbox |

---

## Recommended default landing page

**Film Library, led by a "Needs Attention" work strip** — not a separate
dashboard page, and emphatically not Insights Archive.

The strip is four counters, always visible at the top of the Library, each a
one-tap jump into pre-filtered work:

```
┌─────────────────┬─────────────────┬──────────────────┬──────────────────┐
│ 2 sessions      │ 5 approved clips│ 7 awaiting       │ 3 overdue        │
│ ready to clip   │ ready to assign │ player review    │ follow-ups       │
│ → Workspace     │ → Assignment Q  │ → Assignment Q   │ → Review Inbox   │
└─────────────────┴─────────────────┴──────────────────┴──────────────────┘
```

Zero-state collapses to a single Upload CTA. The strip is computed from the
same queries the sections use — no bespoke dashboard data model.

**AI Summary placement:** collapsible right-hand panel inside Clip Workspace,
scoped to the open session — a summary paragraph plus the suggestion list
(accept/edit/dismiss). It has no nav entry and no route of its own.

**Insights Archive placement:** `?tab=insights` under Film Library — a
read-only history of AI suggestions and their outcomes (accepted/dismissed,
by whom). Useful for auditing AI quality; never a landing surface.

---

## Rationale

1. **The IA mirrors the value chain.** Source Film → Clip → Assignment →
   Review → Follow-Up → IDP is a pipeline; each nav section owns exactly one
   stage, so "where am I?" always equals "which stage of the work am I in."
   The old IA (Library / Insights Archive / AI Summary) organized around AI
   artifacts instead of coach work — that's why it demoed well and coached
   poorly.
2. **Two accountability surfaces, split by whose move it is.** Assignment
   Queue = waiting on players; Review Inbox = waiting on the coach. Merging
   them (one "queue") buries the coach's own to-dos under player laggards —
   the split makes "your move" unambiguous.
3. **Landing on actionable work, computed not curated.** The Needs-Attention
   strip is derived from real state (sessions with zero clips, approved ∧
   unassigned, assigned ∧ ¬viewed, overdue) so it can never drift from the
   truth the sections show. A separate dashboard page would duplicate state
   and rot.
4. **AI is demoted structurally, not just verbally.** No AI surface has a nav
   entry or a route. The panel lives inside the coach's craft surface where
   accepting a suggestion is one keystroke away from editing it — assistive
   exactly where assistance is consumed, invisible everywhere else.
5. **"Pending AI" dies as a state.** Film is clippable at `ready`; analysis is
   an overlay job. A coach on a Sunday night after a Saturday game should
   never wait on a model to start clipping.
6. **Player Progress earns its slot** because assignment-level views can't
   answer the question coaches actually escalate ("does this kid ever watch
   film?"). It's an aggregate lens over the same objects, all links, no new
   actions — cheap to build, high leverage in player/parent meetings.
```
