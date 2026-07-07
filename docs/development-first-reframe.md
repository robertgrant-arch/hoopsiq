# HoopsIQ — Development-First Reframe

Constraint honored throughout: **no feature removals, no rebuild.** Every
existing module keeps living; this changes hierarchy, grouping, labels, and
what leads. Reorganize > reinvent.

---

## 1. Product diagnosis — broad but not development-first

**a. Flat hierarchy = no point of view.** The player nav exposes ~23
destinations at similar visual weight. When My Plan, Marketplace, Live, and
Skill Velocity are peers, the product says "we have many features," not
"we make you better." A development-first product is opinionated about what
comes first; this one currently isn't.

**b. One plan, six doors.** My Plan, Skills, Assessments, Skill Velocity,
Timeline, and Milestones are all facets of a single thing — the player's
development arc — but they present as six sibling features. That fragments
the strongest asset the product has. A player can't feel "my development"
when it's scattered across six nav items.

**c. Nouns describe features; development products speak in actions.**
"Assignments," "Uploads," "Assessments" describe database tables. The
development framing is "what I'm working on," "prove it on film," "how I'm
trending." Same features, different voice.

**d. The home page is a directory, not a directive.** Daily blueprint, focus
area, streak, assignments, skill tracks, film, uploads, wins — all present,
all roughly equal cards. Development-first means the page answers ONE
question loudly — *"what do I do today to get better?"* — and everything
else supports that answer.

**e. Outputs compete with inputs.** Recruiting Profile, Resume, Achievements,
and My Growth Story are *results* of development, but they sit beside the
development work itself. When the showcase is as prominent as the work, the
product reads as a portfolio tool with training attached.

**f. Motivation mechanics outrank mastery signals.** Streaks and XP are
sticky, but when they're visually louder than skill deltas and coach
corrections, the product gamifies attendance instead of celebrating growth.

**g. Coach side leads with operations.** The coach experience opens on
operations (roster admin, schedule, comms) with development distributed
across IDP, film, assessments, and analytics. Coaches manage teams there;
they don't yet *feel* like they're running a development program.

**h. The loop exists but isn't drawn.** Check-in → WOD → film → coach
correction → assessment → velocity is a real loop in the data model. The UI
never shows the player standing inside that loop — each step feels like a
separate app.

## 2. The organizing idea: the Development Loop

Everything reorganizes around one explicit cycle, named in the UI:

```
FOCUS        what I'm working on now (focus area + concept)
  ↓
TRAIN        do the work (WOD, reps, assignments, study plays)
  ↓
PROVE        show it (film, uploads, check-ins, assessments)
  ↓
REVIEW       coach feedback (clips, corrections, IDP notes)
  ↓
PROGRESS     measured growth (velocity, milestones, timeline, VDV)
  ↺ feeds the next FOCUS
```

Every existing feature maps into exactly one loop stage (mapping below).
Nothing is orphaned; nothing is deleted.

## 3. Player information architecture

### Bottom nav — five tabs, development order

| Tab | Contains (existing features, regrouped) |
|---|---|
| **Today** | The redesigned home (§4). Check-In lives here as the day's first action. |
| **My Development** | My Plan (spine) + Skills + Assessments + Skill Velocity + Milestones + Timeline + My VDV Score — one hub, tabbed/sectioned, not six nav items |
| **Train** | Today's WOD + Assignments + Study Plays (relabeled *Basketball IQ*) |
| **Film** | Film (assigned clips inbox) + Uploads + Coach's View |
| **More** | everything else, grouped (below) |

### The More sheet — grouped, not alphabetical

- **My Story** *(outputs of development)*: My Growth Story · Recruiting
  Profile · Resume · Achievements
- **Team life**: Schedule · Messages · Live
- **Grow beyond**: Learn · Marketplace

Rationale: Recruiting/Resume aren't demoted out of existence — they're
reframed as *"where your development gets showcased,"* one level below the
work that produces them. Achievements merges conceptually with Milestones
(the Development hub shows milestones inline; the trophy-case view remains
under My Story).

### Rule that makes it feel different

Every screen in Development/Train/Film shows the player's **current focus
area chip** in its header (e.g., `FOCUS: Closeout footwork`). The focus
follows the player everywhere; the platform never lets them forget what
they're working on. This is one shared component + the existing IDP focus
data — small build, massive framing shift.

## 4. Player Home → "Today"

Same widgets, radically different weighting. Structure top→bottom:

1. **Focus banner** (new arrangement, existing data): current focus area +
   this week's concept + coach's one-line cue from the latest IDP note.
   Visually dominant — this is the wallpaper of the player's brain.
   *"FOCUS: Closeout footwork — 'short choppy steps, high hand' — Coach Grant"*
2. **Today's work** (the daily blueprint, reframed as a 3–5 item checklist
   with completion states): Check in → Today's Training (WOD) → Film to
   review (n) → Assignments due. Each row = one tap to the work. When all
   done: *"Day complete. 4 for 4."*
3. **Coach's latest** — most recent correction/reply/teaching clip note.
   Coach voice appears on the home screen every single day.
4. **Progress strip** (compact, one row): Skill Velocity delta for the focus
   area ("+0.4 this month") · training-day streak (relabel "🔥 12-day streak"
   → **"12 training days in a row"** — the same number, aimed at work not
   attendance) · next milestone distance.
5. **Recent wins** — stays, last. It's dessert.

Everything above already exists on the home page. This is a reorder, a
resize, and about six label changes.

## 5. Coach side — from operations console to development program

Keep every module. Change what leads.

### Coach home ("Command Center" stays, contents reweight)

Top section becomes **"Coaching needed today"** — a worklist, not a status
board: players whose readiness flags need a decision · film responses
awaiting reply · reps overdue >3 days · players with a stalled focus area
(no evidence in 14 days — computable from existing data). Practice/schedule
info remains, one tier down. The coach's first screen should feel like a
list of coaching acts, not a dashboard of program state.

### Nav emphasis

- **Development** becomes a first-class coach section (it's currently
  scattered): Player IDPs · Assessments · Skill benchmarks · Development
  outcomes analytics. Mostly re-homing existing pages under one label.
- **Roster rows lead with development state**, not admin data: name →
  current focus area → velocity trend arrow → last coaching touch ("2d ago")
  → readiness. Jersey/grade/contact move into the profile. Same table,
  re-columned.
- **Film Room** (already rebuilt as clip assignments) is the REVIEW engine —
  its IDP escalation is the bridge; surface "Add to IDP" harder in the
  queue's responded rows.
- Practice Plans / Scouting / Program Ops / Comms: untouched, one tier down.

### The coach loop, made visible

On each player's profile, draw the same loop: current focus → work assigned
→ evidence in (film/check-ins/assessments) → your last correction → trend.
Every element exists on PlayerProfilePage today; group them into loop order
with stage labels, so a coach "walks the loop" in every player conversation
(and in every parent meeting — this view *is* the parent-meeting screen).

## 6. Language system (relabel, don't rename the product)

| Current | Development-first | Why |
|---|---|---|
| Home | **Today** | A directive, not a place |
| My Plan | **My Development Plan** (hub title: *My Development*) | Name the thing players/parents buy |
| Today's WOD | **Today's Training** | WOD is gym-bro jargon; training is the identity |
| Study Plays | **Basketball IQ** | Names the capability, not the activity |
| Assignments | **From Coach** (player-side label) | Work has an author; authorship is the value |
| Uploads | **My Proof** *(or keep Uploads, secondary)* | Film = evidence of development |
| Coach's View | **What Coach Sees** | Sharper, same feature |
| Streak | **Training days in a row** | Same mechanic, aimed at work |
| Achievements | **Milestones** (dev hub) / trophy case stays in My Story | Milestones are development; trophies are memory |
| Skill Velocity | keep — it's already the best name in the app | — |
| Check-In | keep | Already development language |
| My VDV Score | **Development Score (VDV)** | Lead with the plain phrase, keep the brand |
| Coach: Roster | keep label; re-column to development state | Familiarity matters for coaches |
| Coach: Queue/Assignments | keep (just rebuilt) | — |

Voice rules (both apps): lead with the verb ("Watch," "Complete," "Prove
it"), name the focus area wherever work appears, coach attribution on
everything coach-authored, numbers over adjectives.

## 7. Development logic — wiring that makes the reframe real

Cheap, high-leverage connections using existing data (no new modules):

1. **Focus-area tagging everywhere.** WODs, assignments, film clips, and
   study plays already carry categories; map categories → IDP focus areas
   (one lookup table). Then every piece of work displays *why it exists*:
   "This clip → Closeout footwork."
2. **Evidence counts on the plan.** Each focus area in My Development shows
   its evidence: "9 reps · 3 clips · 2 assessments this month." All counts
   already exist in their modules; surface them on the plan.
3. **"What's next" is never empty.** The Today checklist always has ≥1 item;
   if nothing is assigned, it falls back to the focus area's default drill
   from the drill library. The product never shrugs.
4. **Velocity ties to focus.** Skill Velocity's headline chart defaults to
   the current focus area (full matrix one tap away).
5. **Coach touch metric.** Surface "days since last coaching touch" per
   player (from existing followups/notes/messages) on the coach roster —
   the single number that keeps a development program honest.

## 8. What explicitly does NOT change

Feature set (all 23 player destinations survive) · Marketplace/Learn/Live
(revenue + engagement; correctly placed one tier down) · Recruiting/Resume
(strategic hooks; reframed as outputs) · the check-in mechanics · Film Room
v2 (already development-first) · coach ops tooling · XP/streak mechanics
(relabeled, not removed) · pricing/portals/roles.

## 9. Implementation phases (each shippable, low blast radius)

1. **P1 — Nav + Today reorder** (pure client, days): 5-tab player nav with
   the More-sheet groups; home reordered per §4. Zero data changes. This
   alone delivers ~60% of the felt shift.
2. **P2 — Language pass** (§6 table + voice rules; copy-only).
3. **P3 — My Development hub**: one route with sections; existing six pages
   become sections/deep links (keep old routes redirecting).
4. **P4 — Focus-chip + focus tagging** (§3 rule + §7.1–7.2): shared header
   chip, category→focus mapping, evidence counts.
5. **P5 — Coach reweight**: "Coaching needed today" worklist on the
   dashboard; roster re-columning; player-profile loop view.
6. **P6 — Polish**: velocity default view, coach-touch metric, "what's
   next" fallback.

**The one-sentence test** for every future change: *does the first screen a
player sees make today's work obvious, and does the first screen a coach
sees make today's coaching obvious?* If yes, it's development-first. If it
merely adds capability, it goes a tier down.
