# HoopsIQ — Product & Engineering Roadmap
## Vertical Slice Delivery Plan for a Category-Defining V1

> Written for a startup team that already has a refactored codebase, strong backend scaffolding,  
> and a VSA-compliant feature structure. The goal: ship a credible market-leading V1 fast.  
> May 2026

---

## The Single Most Important Finding

Before anything else: the codebase is not 10% built. It is 80% built in the wrong direction.

The server backend is strong:
- Roster: 28 routes, 679 lines
- Film analysis: 16 routes, 381 lines
- Invoices: 12 routes, 281 lines
- Mux, Stripe, Gemini, and OpenAI are all integrated at the server layer
- 27 schema files with correct tenant isolation and domain separation
- DB repositories split cleanly by domain after the VSA refactor

The frontend is scaffolded but disconnected:
- 4 of 65+ coach pages call real APIs
- 0 of 13 parent pages are wired
- 0 of 5 director pages are wired
- 26+ pages import mock data that belongs to the features already built on the backend

**The roadmap is therefore not "what to build" — it is "what to connect, in what order, with what real data."** The P0 milestone is achievable much faster than a greenfield build because the backend is ready. The risk is UI quality and data contract discipline, not server implementation.

---

## 1. Roadmap Principles

**Principle 1 — Wire before build.**  
If a server route exists and a page exists but they aren't connected, wiring them is always P0. Building a new feature before wiring an existing one is never correct.

**Principle 2 — One slice ships completely before the next starts.**  
"Complete" means: server routes respond correctly, the UI calls them (no mock data in production), error states are handled, loading states exist, and the acceptance criteria from the slice spec pass. A slice at 80% is not shipped.

**Principle 3 — The daily habit ships first.**  
Any feature a user touches every day beats a feature they use once a month, regardless of how impressive the latter is. Readiness check-in ships before Playbook. Practice planning ships before Manager Labs.

**Principle 4 — The magic moment is the measure.**  
Every phase is validated by whether it produces a specific "that's different" reaction. The magic moment for this platform is: "I finished film review, and the player's issue is already in tomorrow's practice plan." Everything in P0 serves that moment.

**Principle 5 — Manager Labs ships last.**  
Analytics are only credible when there is real data to analyze. Shipping Manager Labs before the platform has 90 days of real check-in, coaching action, and assessment data produces dashboards that show users their own emptiness. That destroys trust in the analytics layer. Ship it when programs have enough data to be surprised by what they find.

**Principle 6 — Mocks are technical debt with an interest rate.**  
Every page still on mock data accrues UX debt (inconsistent data shapes), trust debt (users see the same numbers every time), and engineering debt (the real API call has to be written twice — once as a mock, once as the real thing). Ship the real data connection immediately after the server route stabilizes.

**Principle 7 — The anti-scope is as important as the scope.**  
A startup that builds everything is a startup that ships nothing. The anti-scope list is not a list of bad ideas — it is a list of good ideas whose time has not come. If a feature is not in P0 or P1, it does not appear in any sprint planning document until Phase 2 begins.

---

## 2. The Smallest Launchable Product That Feels Category-Defining

This is the most important design question in the roadmap. The answer must be specific.

### The magic moment

A head coach uploads game film on a Tuesday night, annotates a defensive assignment mistake at the 4:23 mark, tags the player, creates a "Recommend Drill" action in three taps, and when they open the practice plan builder the next morning, that action surfaces as a suggested drill for the defensive segment. The player sees it assigned to them before practice.

**No other product in grassroots basketball does this.** That is the category-defining moment. Everything in the minimum launchable product exists to enable that moment or to capture and retain the users who experience it.

### What the minimum launchable product requires

| Slice | What ships in the minimum product | What does NOT ship |
|---|---|---|
| **Admin/Billing** | Roster (CRUD), Events (calendar, attendance), Season (one active season), basic invoice creation + Stripe card payment | Payment plans, waivers, registrations, re-enrollment, forms manager, document library |
| **Dashboard** | Coach dashboard (real readiness + real actions), Player dashboard (check-in CTA + assignments + one focus area) | Parent dashboard, director dashboard, full action lanes, notification inbox |
| **Coaching** | Film upload (Mux), session annotation (text + player tag), coaching action creation (assign_clip + recommend_drill), practice plan builder (basic blocks, no dnd drag-drop yet), drill library (seeded global drills) | Playbook V3, Game Day, AI analysis, film playlists, practice execution mode, practice review, WOD planner |
| **Assessments** | Player IDP (one focus area per player, basic milestones), skill assessment (Quick Assess with 3 sub-skills), benchmark (program average) | IDP generator wizard, observation calibration, skill velocity charts, AI-assisted scoring |
| **Academy** | Film assignment (coach assigns clip from ClipActionBar), player sees assigned clips, marks as watched | Learning paths, certifications, play quiz, play study, module player |
| **Manager Labs** | **Nothing.** | Everything. |

### What this proves at launch

A program that uses the minimum product will:
1. Submit daily check-ins and see who's flagged before practice
2. Upload and annotate film in the same tool they use for practice planning
3. Create a coaching action from film and have it surface in the next practice plan
4. Track one development focus per player and show it to the player
5. Assign clips to players and know they watched them
6. Run billing for the season without leaving the platform

That is a category-defining product. It is not feature-complete. It is differentiated.

### What makes it feel category-defining despite being small

The Film → Action → Practice connection is the differentiator. It does not require:
- AI film analysis
- Animated playbook canvas
- Certification systems
- Analytics dashboards
- Wearable integrations

It requires: film player, annotation panel, ClipActionBar with 2 action types, practice plan builder with an "open actions" sidebar. That is ~8 weeks of focused work from one full-stack engineer who owns the Coaching slice.

---

## 3. P0 / P1 / P2 Roadmap

### Phase 0 — Foundation (Weeks 1–3)

**Goal**: Every subsequent phase can deploy safely and independently.

| Work item | Owner | Complexity | Status |
|---|---|---|---|
| Auth + multi-tenancy verified (org isolation in all queries) | Founding engineer | High | Needs audit |
| Environment config (dev / staging / prod) | DevOps | Medium | Unknown |
| CI/CD pipeline with per-PR preview deployments | DevOps | Medium | Unknown |
| Drizzle migrations automated (not manual) | Founding engineer | Low | Likely done |
| Error tracking (Sentry or equivalent) | Founding engineer | Low | Unknown |
| Stripe webhooks endpoint tested with Stripe CLI | BE engineer | Medium | Route exists, untested |
| Mux credentials verified in staging | BE engineer | Low | Route exists |
| `features/navigation/config.ts` created (nav single source of truth) | FE engineer | Medium | Does not exist |
| `RequireAuth` + route guards verified for all role prefixes | Founding engineer | Medium | Partially done |
| Design system tokens locked (colors, typography, spacing) | Designer/FE | Low | Largely done |

**Phase 0 exit criteria**: You can deploy a change to production in under 10 minutes. Auth works. Multi-tenancy is verified with a test that attempts cross-org data access. Stripe can receive a test webhook.

---

### Phase 1 — P0: "Programs Can Run" (Weeks 4–14)

**Goal**: A paying basketball program can run their entire season — roster, schedule, billing, daily check-in, and basic film — in HoopsIQ. No other tool required for operations.

**What this phase proves**: The platform is usable as a primary tool, not a companion app. Admin signs up, sets up the season, imports the roster, sends invoices, and coaches start submitting check-ins.

#### Slice delivery order within Phase 1

**Sprint 1–2 (Weeks 4–7): Admin/Billing — Foundation layer**

| Feature | Server status | FE status | Work needed |
|---|---|---|---|
| Roster CRUD (add, edit, archive players) | 28 routes ready | Mock data | Wire `useRoster()` to real API; wire roster pages |
| Player profile page | Routes ready | Mock data | Wire player profile to real player data |
| Events (create game/practice, calendar view) | 9 routes ready | Mock data | Wire event list and calendar; attendance recording |
| Season (create, team assignment, configure) | 7 routes ready | Mock data | Wire `SeasonSetupPage` and `SeasonManagementPage` |
| Roster import (CSV) | Route exists | Mock | Wire import flow; validate CSV parsing |
| Basic invoice creation + send | 12 routes ready | Mock | Wire invoice composer; Stripe checkout session |
| Parent payment portal | Route exists | Unimplemented | Build `ParentBillingPage` connected to real invoices |
| Stripe webhook: payment_intent.succeeded | Exists in routes | N/A | Test with Stripe CLI; verify invoice status update |

**Sprint 3–4 (Weeks 8–10): Readiness — The daily habit**

| Feature | Server status | FE status | Work needed |
|---|---|---|---|
| Player check-in form (fatigue, sleep, soreness, energy) | 6 routes ready | Mock | Wire `PlayerCheckinPage` to POST /readiness/checkin |
| Team readiness grid (READY/FLAGGED/RESTRICTED) | Route exists | Mock | Wire `TeamReadinessPage` to GET /readiness/team/today |
| Readiness score computation | `server/modules/readiness/score.ts` | N/A | Verify thresholds; expose computed status per player |
| Readiness override (coach) | Route needed | Mock | Add PATCH /readiness/override endpoint; wire UI |
| Check-in reminder (Inngest job) | Not built | N/A | Inngest function: 7am push to unchecked-in players |
| Readiness → Dashboard feed | Partial | Mock | Expose readiness summary endpoint for dashboard |

**Sprint 5–6 (Weeks 11–14): Dashboard — The entry point**

| Feature | Server status | FE status | Work needed |
|---|---|---|---|
| Coach dashboard (real readiness + real actions) | Partial | Mock | Aggregate endpoint: GET /dashboard/coach |
| Player dashboard (check-in CTA + today's events) | Partial | Mock | Wire `PlayerDashboard` to real events + check-in status |
| Action lanes (film queue count, open actions count) | Route data exists | Mock | Count endpoints for badge system |
| Notification bell + alert inbox | Not built | Not built | Add `AlertItem` table; basic in-app alerts |
| `features/navigation/config.ts` live | N/A | Not built | Build nav system — all roles, all routes, guards |

**Phase 1 exit criteria**:
- [ ] Admin can set up a season, import 15 players, and create invoices within 30 minutes of signing up
- [ ] Parent can pay an invoice via Stripe; admin sees payment reflected in 60 seconds
- [ ] Players can submit check-in from mobile in under 30 seconds
- [ ] Coach sees real team readiness grid (not mock) before practice
- [ ] Coach dashboard shows real data from today's check-ins and real open actions count
- [ ] Zero pages in Admin/Billing, Readiness, or Dashboard use mock data in production
- [ ] Stripe payment_intent.succeeded webhook correctly marks invoice as paid

---

### Phase 2 — P1: "The Loop Is Alive" (Weeks 15–28)

**Goal**: The film → coaching action → practice plan → player development loop is live with real data. Coaches can see measurable evidence that using HoopsIQ makes them better coaches.

**What this phase proves**: The platform is demonstrably better than the combination of tools it replaces. Coaches who use the full loop show higher player development data quality than those who don't. The product earns word-of-mouth.

#### Slice delivery order within Phase 2

**Sprint 7–8 (Weeks 15–18): Coaching — Film Room**

| Feature | Server status | FE status | Work needed |
|---|---|---|---|
| Film upload (Mux direct upload) | `createDirectUpload()` built | Partial | Wire `FilmSessionDetail` upload flow end-to-end; test in staging |
| Film session list + filtering | 16 routes ready | Mock | Wire `FilmLibraryPage` to real sessions |
| Session player (Mux embed + keyboard shortcuts) | MuxVideoPlayer component exists | Partial | Verify Mux playback URLs; test seek + annotation sync |
| Annotation panel (timestamped text + player tag) | Route exists | Partial | Wire annotation save; verify player tag autocomplete from real roster |
| ClipActionBar (assign_clip + recommend_drill) | 8 coaching-action routes ready | Partial in `CoachActionsPage` | Wire ClipActionBar to POST /coaching-actions; test full flow |
| Film queue (pending reviews) | Route exists | Mock | Wire `FilmQueuePage` to real queue |
| Coaching actions feed | 8 routes ready | Partially wired (1 page) | Wire feed with filters; test status updates |

**Sprint 9–10 (Weeks 19–22): Coaching — Practice Planning**

| Feature | Server status | FE status | Work needed |
|---|---|---|---|
| Practice plan builder (block CRUD) | 6 routes ready | Partially wired | Wire plan save/load; test block ordering persistence |
| Open actions sidebar in plan builder | Actions routes ready | Not built | Add "open actions for my roster" sidebar to plan builder |
| Flagged readiness in plan builder | Readiness endpoint ready | Not built | Surface flagged players in practice plan context |
| Drill library (seeded global drills) | Not built | Mock | Seed 50 global drills; expose GET /drills with filters |
| Drill → practice block link | Not built | Not built | Add drillId to practice block; drill picker drawer |
| Practice plan publish | Route exists | Partial | Wire publish action; assistant coaches see plan |
| Practice execution mode | Route exists | Partial | Wire to real plan data; test timer |
| Practice review | Route exists | Mock | Wire post-practice review form |

**Sprint 11–12 (Weeks 23–26): Assessments — Development Engine**

| Feature | Server status | FE status | Work needed |
|---|---|---|---|
| Quick Assess flow | POST /roster/:id/skill-assessments ready | Mock | Wire Quick Assess to real roster + POST |
| Assessment history per player | GET /roster/:id/skill-assessments ready | Mock | Wire `AssessmentHistoryPage` |
| IDP CRUD (focus areas, milestones) | Routes in roster module | Mock | Wire `PlayerIDPPage`; test focus area status transitions |
| IDP → player dashboard | IDP routes ready | Mock | Expose one active focus area in player dashboard |
| Basic benchmarks (program average per sub-skill) | Nightly job needed | Mock | Build Inngest benchmark computation; wire `BenchmarkingPage` |
| IDP generator (gaps from assessment scores) | POST /roster/:id/idp/generate ready | Mock | Wire `IDPGeneratorPage` to real assessment data |

**Sprint 13 (Weeks 27–28): Academy — Minimum (Film Assignments)**

| Feature | Server status | FE status | Work needed |
|---|---|---|---|
| Film assignment creation (from ClipActionBar) | Coaching-actions assign_clip type exists | Partial | Create `film_assignments` table + routes; wire ClipActionBar |
| Film assignment list (player-facing) | Not built | Mock | Build player assignments list wired to real data |
| Assignment completion tracking | Not built | Mock | Add watchedPct tracking; wire player "Done watching" |
| Coach sees completion status | Not built | Mock | Wire coach-facing assignment status per player |
| Drill library (player-facing, assigned drills) | Drills seeded | Mock | Player sees assigned drill from recommend_drill action |

**Phase 2 exit criteria**:
- [ ] Film uploads, processes through Mux, and plays back in the film session player (real video, not placeholder)
- [ ] Coach annotates film, creates a coaching action, and it appears in the actions feed within 5 seconds
- [ ] Coaching action of type `recommend_drill` surfaces as a suggested drill in the practice plan builder sidebar
- [ ] Practice plan saves, publishes, and persists correctly with block order and drill links
- [ ] Quick Assess scores 12 players in under 4 minutes and stores results correctly
- [ ] Player IDP shows real focus areas and milestones (not mock data)
- [ ] Player dashboard shows their real top IDP focus area and real film assignments
- [ ] Film assignment is created from ClipActionBar; player receives notification; completion is tracked
- [ ] Zero pages in Coaching, Assessments, or Academy (MVP scope) use mock data in production
- [ ] The full loop is verifiable: film session → annotation → coaching action → practice plan drill suggestion

---

### Phase 3 — P2: "The Moat" (Weeks 29–52)

**Goal**: Features that create switching costs, justify price increases, and make programs reluctant to leave. Three seasons of longitudinal data becomes the primary retention mechanism.

**What this phase proves**: HoopsIQ is not replaceable. Programs that have 2+ seasons of assessment data, certified coaching staff, parent-transparent development records, and an established recruiting dossier will not migrate to a competitor. The cost of leaving is too high.

#### Slice delivery in Phase 3

**Manager Labs (Weeks 29–36)**  
*Unlock condition: minimum 60 days of real readiness, assessment, and coaching action data in at least 5 active programs.*

| Feature | Priority in Phase 3 |
|---|---|
| Program health score (6-component composite) | First |
| At-risk player detection + intervention log | First |
| Warning metrics dashboard | First |
| Coach effectiveness metrics (director-only) | Second |
| Development synthesis (aggregate skill trends) | Second |
| Season report export (PDF) | Second |
| VDV command center | Third |
| Club growth metrics + retention | Third |

**Academy — Full (Weeks 33–40)**

| Feature | Priority in Phase 3 |
|---|---|
| Play study (animated V3 playback) | First (depends on Playbook) |
| Play quiz (question builder + player attempts) | First |
| Drill WOD planner | Second |
| Learning path module player | Second |
| Coach certification system | Third |
| Staff cohort management | Third |
| Observation calibration | Fourth |

**Coaching — Moat features (Weeks 35–44)**

| Feature | Priority in Phase 3 |
|---|---|
| Playbook V3 (animated canvas) | First |
| Game day mode | Second |
| AI film analysis (Gemini background job) | Third — after billing per-org is locked |
| Film playlists | Third |
| Opponent scout report | Second |

**Admin/Billing — Advanced (Weeks 29–35)**

| Feature | Priority in Phase 3 |
|---|---|
| Parent dashboard (full) | First |
| Payment plans (installment schedules) | First |
| Re-enrollment campaign | First |
| Waiver templates + digital signing | Second |
| Forms manager | Second |
| Document library | Third |
| Expert payouts | Third |

**Assessments — Advanced (Weeks 37–44)**

| Feature | Priority in Phase 3 |
|---|---|
| Skill velocity charts (30/60/90 day) | First |
| Development timeline (visual milestone history) | First |
| Development resume (recruiter-facing) | Second |
| Player growth story | Second |
| Assessment coverage report (director) | Second |

**Recruiting (Weeks 41–52)**  
*Unlock condition: recruiting module is only built after 3+ programs request it explicitly and are willing to pay for it.*

---

## 4. What Each Release Should Prove

| Release | Label | Proof point | Measured by |
|---|---|---|---|
| Phase 0 | Infrastructure | "We can ship safely" | Deploy time < 10 min; no cross-org data leaks in security test |
| Phase 1 | Operations | "A program can run their season in HoopsIQ without any other tool" | Admin completes season setup + first billing in < 60 min; check-in completion rate > 0% within 48 hours of first org onboarding |
| Phase 2 early | Film loop | "The film → action → practice plan connection works" | Coaching action created from film within 48 hours of film upload for 80% of active programs |
| Phase 2 late | Development | "Coaches are building IDPs from real data and players are engaging with them" | 60% of active players have an IDP with at least one focus area; 40% of IDPs have an open film assignment |
| Phase 3 early | Analytics | "Directors can see program health without calling anyone" | Director opens Manager Labs at least once per week in the first month after launch |
| Phase 3 late | Moat | "Switching cost is real" | Programs in their second season have longitudinal data they cannot easily export or recreate elsewhere |

---

## 5. Slice Dependency Map

### Hard dependencies (blocking)

```
Roster (Admin/Billing)
  └── Readiness (needs player list)
  └── Coaching/Film (needs player list for tagging)
  └── Coaching/Actions (needs player list as targets)
  └── Assessments/IDP (needs player list)
  └── Academy/Assignments (needs player list)
  └── Dashboard (needs player data for all cards)

Events (Admin/Billing)
  └── Dashboard/Coach (upcoming events on command strip)
  └── Dashboard/Player (today's event on home screen)
  └── Coaching/Game Day (game event context)

Coaching/Film → Coaching/Actions → Coaching/Practice
  Film sessions must exist before annotations can be created.
  Annotations must exist before coaching actions can be created.
  Coaching actions must exist before the practice plan "open actions" sidebar works.
  This is the critical path. It must be delivered in order with no gaps.

Coaching/Actions → Assessments/IDP
  The add_to_idp action type creates an IDP focus area.
  IDP focus areas should exist before this action type ships.
  Ship IDP (Assessments) before or simultaneously with the full ClipActionBar.

Assessments/Quick Assess → Assessments/Benchmarks
  Benchmarks require at least 5 assessment data points per sub-skill to be meaningful.
  Do not ship the benchmark UI until there is real data. Ship the Quick Assess first,
  let 2-3 programs assess their rosters, then unlock benchmarks.

Readiness (daily) → Dashboard (meaningful)
  The coach dashboard is only valuable when it shows real check-in data.
  Ship Readiness (check-in + team grid) before wiring the Dashboard.

All slices → Manager Labs
  Manager Labs is the meta-analytics layer. It requires data from every other slice
  to produce meaningful outputs. It is the last slice to ship, not the first.
  Minimum pre-condition: 60+ days of live data from at least 5 active programs.
```

### Soft dependencies (ordering matters but not blocking)

```
Academy/Drill Library → Coaching/Practice Planning
  The drill library can be seeded globally before practice planning ships.
  However, the drill picker inside the plan builder only adds value if there
  are real drills to pick. Seed 50 global drills before wiring the plan builder.

Assessments/IDP → Academy/Film Assignments
  Film assignments are more impactful when tied to an IDP focus area.
  Can ship independently but is more compelling when IDP data exists.

Admin/Billing (waivers) → Parent Portal (forms signing)
  Parent forms signing requires waiver templates to exist.
  Ship waivers admin before wiring parent-side form signing.

Coaching/Playbook → Academy/Play Study
  Play study is animated playback of plays in the playbook.
  Playbook V3 must ship before play study is meaningful.
```

### No dependency (can ship in parallel)

```
Admin/Billing billing features ↔ Coaching film features
  These share only Roster (player IDs). Otherwise fully independent.

Readiness ↔ Assessments
  Both depend on Roster but not on each other.
  Can be developed in parallel by two engineers.

Dashboard/Parent ↔ Dashboard/Coach
  Share the same Dashboard slice but are independent page implementations.
  Can be built simultaneously if team size allows.
```

---

## 6. Mock-First vs. Real Backend Required

### Real backend required from day 1 (never mock in production)

| Feature | Why it must be real | Risk if mocked |
|---|---|---|
| Auth + org isolation | Security — cross-org access is a breach | Fatal |
| Roster (players) | All other features reference player IDs | Every feature breaks when you switch |
| Events (schedule) | Date-sensitive; mock data is always "yesterday" | Users distrust the calendar immediately |
| Stripe payments | Real money; mock = no revenue | Can't charge customers |
| Readiness check-in submission | The daily habit must persist; mock = data disappears | Users stop submitting when they see no effect |
| Film upload (Mux) | Video must persist across sessions | Upload → refresh → file gone = catastrophic UX |
| Coaching actions | The loop depends on persistent actions | Actions lost between sessions = feature doesn't exist |

### Can be mocked initially, replaced in Phase 2

| Feature | Acceptable mock duration | Why mock is okay short-term |
|---|---|---|
| Drill library content | Mock global drills for Phase 1; real seed data for Phase 2 | Users don't know if drills are "from the server" or seeded |
| Benchmark data | Mock program averages for Phase 1 demo; real computed for Phase 2 | Not enough real data to compute real benchmarks at launch |
| Notification inbox | Mock alerts are cosmetic; real alerts require Inngest setup | No coaching decisions depend on notification history |
| Program health score | Mock composite score for demos | Director dashboard not in Phase 1 scope |
| Development timeline | Mock milestones are fine for early IDP display | Visual history requires 60+ days of data anyway |

### Should never be mocked in production (only in demo mode)

| Feature | Risk |
|---|---|
| Film session list (showing same sessions to all coaches) | Coaches immediately recognize shared mock data |
| Invoice amounts and payment status | Parents will see wrong amounts; financial trust breaks |
| Player readiness status | If a coach makes a practice decision from mock data, it could affect player health |
| IDP focus areas and milestone status | Coaches and parents comparing data across sessions will see inconsistency |

---

## 7. Staffing Recommendation by Slice Ownership

### Recommended startup team (minimum for V1)

A team of 4 engineers can ship Phase 1 and Phase 2 in 28 weeks if slice ownership is clear and integration interfaces are agreed upon in advance.

| Role | Slice ownership | Phase focus |
|---|---|---|
| **Founding Engineer / CTO** | Foundation, Auth, Nav system, Shared layer, Inngest jobs, integrations (Mux, Stripe, Gemini APIs) | P0 through all phases |
| **Engineer 1** (full-stack, data-strong) | Admin/Billing + Assessments | P0 billing → P1 IDP and assessment engine |
| **Engineer 2** (frontend-strong) | Dashboard + Academy | P0 dashboard wiring → P1 film assignments, play study |
| **Engineer 3** (full-stack, product-minded) | Coaching (the largest and most differentiated slice) | P1 film loop → practice planning → playbook |

**No dedicated BE or FE specialists.** Every engineer owns a slice end-to-end. This is the VSA model. An engineer who only does frontend on the Coaching slice will block every backend change that slice needs.

### Slice ownership assignments

| Slice | Primary owner | Collaborators | Backend-heavy or FE-heavy |
|---|---|---|---|
| Foundation + Nav | Founding engineer | All | Backend-heavy |
| Admin/Billing | Engineer 1 | Founding (Stripe webhook infra) | Balanced |
| Readiness | Engineer 3 | Founding (Inngest job) | Mostly FE |
| Dashboard | Engineer 2 | All (reads data from all slices) | FE-heavy |
| Coaching (Film + Actions) | Engineer 3 | Founding (Mux integration) | Balanced |
| Coaching (Practice + Playbook) | Engineer 3 | Engineer 2 (dnd-kit UI) | FE-heavy |
| Assessments (IDP + Quick Assess) | Engineer 1 | Founding (benchmark Inngest job) | Balanced |
| Academy (Assignments) | Engineer 2 | Engineer 3 (clip source data) | FE-heavy |
| Academy (Learning Paths) | Engineer 2 | Founding (content seeding) | FE-heavy |
| Manager Labs | Founding engineer | Engineer 1 (data sources) | Backend-heavy |
| Manager Labs (UI) | Engineer 2 | Founding | FE-heavy |

### Slice interface contracts (what each pair of engineers must agree on before their slices integrate)

Before Engineer 3 builds the ClipActionBar `add_to_idp` action type, Engineer 1 must have defined the IDP focus area creation API contract (endpoint URL, request schema, response shape). This contract is documented in `shared/db/schema/` and `features/assessments/types.ts` before either engineer writes a line of UI code.

**Interface contracts required before Phase 2 begins:**

1. **Coaching → Assessments**: How does `add_to_idp` action type create a focus area? (IDP routes + focus area shape)
2. **Coaching → Academy**: How does `assign_clip` action type create a film assignment? (FilmAssignment type + POST endpoint)
3. **Readiness → Dashboard**: What does the dashboard summary endpoint return? (readiness completion rate + flagged count)
4. **Assessments → Dashboard**: How does the IDP gap alert surface? (alert type + target payload)
5. **Admin/Billing → Dashboard**: How does outstanding invoice count surface? (count endpoint or included in dashboard summary)

### Scaling the team (Phase 3)

For Phase 3, add:
- **Engineer 4** (AI/infra focus): Gemini film analysis pipeline, Inngest job reliability, Manager Labs computation
- **Engineer 5** (mobile-native, optional): Capacitor wrapper, push notification delivery, mobile-specific UX

Do not add generalist engineers to a VSA team without assigning them a slice. A sixth engineer with no clear ownership creates coordination debt that costs more than their contribution.

---

## 8. Biggest Delivery Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **Mux upload reliability** — video upload fails silently or Mux processing hangs; film session appears "uploaded" but never plays | High (infra risk) | Fatal for Coaching slice | Implement a Mux webhook listener for `video.asset.ready` and `video.asset.errored` events before any coach sees the film upload UI. Session status must reflect Mux's actual state. |
| **Check-in UX on mobile** — the readiness form takes 45+ seconds to complete on first attempt; coaches see low completion rates and blame the product instead of the UX | High (UX risk) | Kills the daily habit permanently | The check-in form must be tested with real users on real phones before Phase 1 launches. Target: 4 taps, 20 seconds, one hand. A/B test the slider vs. tap-to-score interaction. |
| **ClipActionBar cognitive overload** — 6 action types overwhelm coaches during film review; they use "mark_addressed" for everything and bypass the development loop | Medium (product risk) | Kills the differentiated loop | Launch with 2 action types only: `assign_clip` and `recommend_drill`. `add_to_idp` and others ship after the 2-type version is validated. |
| **Nav system fragmentation** — each role's nav grows independently; by Phase 2, there are 5 different AppShell implementations that all diverge | High (technical risk) | Maintenance cost explodes | `features/navigation/config.ts` as the single source of truth must be implemented in Phase 0, before any role-specific nav work begins. This is the highest-priority Phase 0 deliverable. |
| **Stripe webhook race condition** — `payment_intent.succeeded` fires before invoice is in the DB; webhook processor throws; invoice stays `open` despite being paid | Medium (technical risk) | Financial trust breakdown | Implement idempotency keys on all Stripe webhook handlers. Test with Stripe CLI's replay feature. Implement a reconciliation job that checks Stripe payment status against invoice status nightly. |
| **IDP created but never used** — coaches create IDPs for players but never update them; players and parents see stagnant data; IDP feature looks broken | High (adoption risk) | Kills parent retention value | Require at least one milestone when an IDP is created. Add a "Last IDP update" field to the at-risk player detection criteria. Nightly alert fires to coach when any player's IDP hasn't been touched in 14 days. |
| **Practice plan builder is too complex to ship on mobile** — dnd-kit drag-and-drop doesn't work well on touch screens; the plan builder only works on desktop | Medium (UX risk) | Limits daily adoption | Build two modes: a desktop-primary drag-drop mode and a mobile-primary sequential append mode. The sequential mode ships in Phase 2. The drag-drop mode ships in Phase 3 after mobile testing. |
| **AI film analysis COGS** — Gemini API cost per minute of video; elite programs upload 4-6 hours of film per week; COGS exceeds revenue per program | Medium (financial risk) | Makes AI feature unsustainable | AI analysis is a Phase 3 premium feature with per-org usage limits tied to plan tier. No AI analysis in Phase 1 or Phase 2. Manual annotation is the full MVP. |
| **Mock data contamination in production** — a page that ships with mock data is perceived as broken when users see the same numbers every login | High (trust risk) | Users churn immediately | Every page must pass an acceptance criterion before it ships: "No mock data imports in this page component." This is a PR review checklist item, enforced by the tech lead. |
| **Manager Labs ships too early** — analytics with 3 weeks of data from 2 programs looks empty and unimpressive; director churns before the dashboard becomes valuable | Low if roadmap is followed, High if not | Wastes engineering effort; damages analytics credibility | Hard lock: Manager Labs does not appear in any sprint plan until Phase 3, and only after 60+ days of live data from 5+ programs is confirmed. |

---

## 9. Resourcing Model

### Phase-by-phase engineer allocation

```
Phase 0 (Weeks 1-3): All 4 engineers on infra and foundation
  Founding Eng: Auth audit, CI/CD, multi-tenancy test, Inngest setup
  Engineer 1:   Stripe webhook test, billing schema review
  Engineer 2:   Nav config system, design system audit, route guards
  Engineer 3:   Mux webhook setup, film session state machine

Phase 1 (Weeks 4-14): Parallel tracks, sync weekly on interfaces
  Founding Eng: Shared endpoints, alert system, Inngest daily jobs
  Engineer 1:   Admin/Billing (roster → events → season → invoices)
  Engineer 2:   Dashboard (wiring, not building — uses Phase 1 data)
  Engineer 3:   Readiness (check-in → team grid → override → alert)

  Weeks 11-14: Dashboard sprint after Readiness and Admin ship
  Engineer 2 + Founding Eng: Dashboard aggregation endpoint + coach/player UI

Phase 2 (Weeks 15-28): Coaching is the critical path
  Engineer 3:   Coaching (Film → Actions → Practice → Drill Library)
  Engineer 1:   Assessments (Quick Assess → IDP → Benchmarks)
  Engineer 2:   Academy MVP (film assignments → player view)
  Founding Eng: Integration support for all three; Inngest benchmark job

Phase 3 (Weeks 29-52): Add specialization as needed
  Founding Eng: Manager Labs (computation, snapshots, reporting)
  Engineer 1:   Assessments advanced (velocity, timeline); Admin advanced
  Engineer 2:   Academy full (learning paths, certifications); Parent portal full
  Engineer 3:   Coaching moat (Playbook V3, Game Day, AI analysis)
  Engineer 4:   AI pipeline + Inngest reliability + Manager Labs UI
```

### Time allocation within each engineer's week

| Activity | % of time | Rationale |
|---|---|---|
| Slice feature delivery | 60% | Primary delivery |
| Code review (other slices) | 15% | Catch mock data contamination; enforce slice boundaries |
| Integration testing with adjacent slice owners | 10% | Interface contracts verified manually before API is locked |
| Shim cleanup and tech debt | 10% | VSA refactor left `@deprecated` shims; each engineer clears their slice's shims weekly |
| Documentation and types | 5% | Public types in `index.ts` must be documented before other engineers consume them |

---

## 10. Anti-Scope List

These features are not in V1. Not because they are bad ideas — several are excellent ideas. They are excluded because:
- They require data scale that V1 will not have
- They require external partnerships or integrations not yet contracted
- Their absence does not prevent programs from getting value
- Their inclusion would slow Phase 1 or Phase 2 by 30-50%

Any engineer who raises one of these features before Phase 3 is in scope should be asked: "What Phase 1 or Phase 2 feature does this replace, and why is this higher priority?"

| Feature | Why it's not in V1 | When to reconsider |
|---|---|---|
| **AI film analysis (Gemini pipeline)** | Expensive per-minute COGS; manual annotation is the MVP; adds significant backend complexity | Phase 3, after per-org billing tiers lock in. Never free. |
| **Wearable integrations (Garmin, Whoop, Apple Health)** | Requires OAuth partnerships; wearable data is additive, not core to the coaching loop; most grassroots programs don't have wearable budgets | Phase 3, only after wearable ownership is validated in user research |
| **Animated Playbook V3 canvas** | Impressive but not part of the daily coaching workflow; the Film → Action → Practice loop does not require a playbook | Phase 3, when Coaching slice Phase 2 features are complete and adopted |
| **Play quiz and play study** | Depends on Playbook V3; players need plays in the playbook before they can study them | Phase 3, after Playbook V3 ships |
| **Coach learning paths and certifications** | Valuable for retention but not a hook for initial adoption; coaches don't sign up for a platform because of certifications | Phase 3, after film + practice + IDP are adopted |
| **Observation calibration** | Niche feature for large multi-coach staffs; most V1 programs have 1-3 coaches | Phase 3, if director feedback identifies this as a specific blocker |
| **Manager Labs (all of it)** | Requires 60+ days of real data to be meaningful; empty analytics dashboards hurt credibility | Phase 3, minimum 60 days of real data from 5+ programs |
| **Cross-org benchmarks** | Requires scale (50+ programs) to produce meaningful anonymized norms | Post-Series A, when program count justifies |
| **Predictive churn model** | Requires historical data across multiple seasons; first-season programs have no historical signal | Post-Series A, after 3+ cohorts of programs complete a season |
| **Recruiting portal (external recruiter access)** | Builds significant complexity (separate auth context, privacy controls, recruiter verification); requires enough player dossiers to be useful | Phase 3, only if 5+ programs explicitly request it and are willing to pay for it |
| **Custom content marketplace** | Turning HoopsIQ into a content company changes the business model; the platform's value is the connected workflow, not the content | Never in V1; separate business model discussion |
| **Mobile native app (iOS/Android via Capacitor)** | The codebase supports Capacitor (haptic feedback already referenced) but the web PWA is sufficient for V1 | Phase 3, after web experience is validated |
| **Public API for third-party integrations** | Premature; adds significant security surface and documentation burden | Post-Series A, driven by enterprise customer requirements |
| **Video conferencing** | Zoom exists; don't build what exists | Never |
| **Live game scoring** | A completely different product category (scorekeeping app); would fragment the product identity | Never in V1; consider as a separate product |
| **Parent community / social features** | HoopsIQ is a coaching intelligence tool, not a social network; community features dilute the identity | Never in V1 |
| **Strength and conditioning program design** | Different expertise domain; the WOD planner is sufficient for grassroots programs | Phase 3, only if strength coaches become a primary user persona |
| **Tournament bracket management** | TeamSnap does this; it is administrative overhead with no coaching intelligence value | Never a priority; link to Challonge if needed |
| **Email campaign builder** | Admin/Billing already has invoice + reminder emails; a full campaign builder is marketing software | Never; use a dedicated email tool |
| **Chat / messaging as a primary feature** | Messaging exists as a communication layer but should never become the main reason to open the app | Never grow it beyond its current role |
| **Multi-sport support (football, soccer, etc.)** | The product vocabulary (positions, play types, film tagging, assessment rubrics) is basketball-specific; abstracting it to multi-sport creates significant complexity with no near-term customer value | Post-Series A, only after basketball market is owned |

---

## 11. Why Each of the Six Slices Should (or Should Not) Be in V1

### Dashboard — In V1 (P0, simplified)
**Yes, because**: It is the daily entry point. Without a real dashboard, users navigate menus to find their work. The coach dashboard (real readiness + real actions) is the proof-of-concept for the entire platform — it shows that HoopsIQ knows what's happening today.

**But**: Only the coach and player variants ship in Phase 1. The parent dashboard ships in Phase 3 (requires full parent portal). The director dashboard ships in Phase 3 (requires Manager Labs data). Shipping a dashboard with four roles on mock data is worse than shipping two roles with real data.

**The one thing that must not ship mocked**: The team readiness grid on the coach dashboard. The moment a coach sees the same 11 green dots and 2 yellow dots every time they open the app, the dashboard loses all credibility.

---

### Coaching — In V1 (P1, Film + Actions + Practice only)
**Yes, because**: This is the differentiated feature. No grassroots basketball product connects film to coaching decisions to practice planning. Coaching is the category-defining capability. If it doesn't ship in V1, HoopsIQ is not category-defining — it is a better TeamSnap.

**But**: Ship in layers. Phase 1 ships Readiness (which is part of the Coaching slice conceptually). Phase 2 ships Film + Actions + Practice. Playbook V3 is Phase 3. The coaching loop is the priority, not the animated canvas.

**The one thing that must not ship mocked**: The ClipActionBar action creation flow. If creating a coaching action from film doesn't persist, coaches will test it once, find it doesn't save, and never use it again.

---

### Assessments — In V1 (P1, IDP + Quick Assess only)
**Yes, because**: IDP is the most emotionally valuable feature for families. Parents ask "is my child getting better?" and IDP makes that question answerable. Without Assessments, the parent retention argument is "we have a nice schedule app." With Assessments, it becomes "we show you exactly what your child is working on and how they're improving."

**But**: Ship Quick Assess (rapid scoring) and IDP (one focus area per player) only. Benchmarks require data scale to be meaningful. Skill velocity requires 60+ days of assessment history. IDP generator requires benchmark data. Ship in sequence: Quick Assess → IDP → Benchmarks → IDP Generator.

**The one thing that must not ship mocked**: Assessment scores. If coach scores a player 6/10 on Contact Finishing and the IDP shows a different number, the IDP is immediately distrusted.

---

### Academy — In V1 (P1, film assignments only)
**Partial yes, because**: Film assignments are the minimum unit of the Academy that creates daily player engagement. A player who has been assigned a clip has a reason to open the app that is not just "check-in." Film assignments are also a natural output of the ClipActionBar flow, so they complete the loop without requiring new infrastructure.

**What should not be in V1**: Learning paths, module players, certifications, play quiz, play study, WOD planner, and all other Academy features. These are Phase 3 features that require content infrastructure (video hosting for modules, quiz question builders, certification logic) that adds weeks of complexity with low V1 ROI.

**The one thing that must not ship mocked**: Film assignment completion tracking. If a player marks a clip as watched and the coach doesn't see it, the assignment feature is worse than texting a video link.

---

### Manager Labs — NOT in V1 (P2, full phase 3)
**No, because**: Manager Labs is the meta-analytics layer. It produces insights from data. At launch, there is no data. Shipping Manager Labs in Phase 1 or Phase 2 produces dashboards that show directors empty charts and zero-percent completion rates. That destroys trust in the analytics layer permanently.

**The hard unlock condition**: Manager Labs does not appear in any sprint plan until: (a) at least 5 programs have been active for 60+ days, AND (b) those programs have at least 80% check-in completion rate and 10+ film sessions each. Until those conditions are met, analytics dashboards are noise.

**What is allowed in Phase 1–2**: The program health score can be displayed on the director dashboard as a "not enough data yet" state. But no charts, no comparisons, no at-risk flags until real data exists.

---

### Admin/Billing — In V1 (P0, core operations only)
**Yes, because**: Without Admin/Billing, there is no roster (everything breaks). Without billing, there is no revenue. Without season management, there is no program context. Admin/Billing is not a differentiator — it is infrastructure. But it is required infrastructure that must ship before any other slice.

**But**: Scope tightly for Phase 1. Roster, events, basic invoicing, Stripe card payment. Payment plans, re-enrollment, waivers, forms manager, and document library are Phase 3. The goal in Phase 1 is: admin can get a program into HoopsIQ and bill the families.

**The one thing that must not ship mocked**: Stripe payment intent creation and webhook handling. If a parent pays and the invoice doesn't update, you have a billing dispute on your hands in week two of the product.

---

## Summary: The Sequencing Opinion

```
Week 1–3:   Foundation (auth, CI/CD, nav system, Stripe + Mux webhooks)
Week 4–7:   Admin/Billing — Roster + Events + Season + Basic Invoice + Stripe
Week 8–10:  Readiness — Daily check-in + Team grid + Override + Coach alert
Week 11–14: Dashboard — Coach (real) + Player (real) + Parent (week 11-14 if team allows)
Week 15–18: Coaching — Film upload + Mux playback + Annotation + 2 action types
Week 19–22: Coaching — Practice planning + Drill library (seeded) + Open actions sidebar
Week 23–26: Assessments — Quick Assess + IDP (one focus area) + Basic benchmark
Week 27–28: Academy — Film assignment create + player receive + completion tracking
Week 29+:   Manager Labs, full Academy, advanced Admin, Playbook V3, recruiting
```

The product that ships at Week 28 is: teams can run their season, coaches review film and create actions that surface in practice plans, players have a development focus and see their assignments, and parents can pay online. That is enough. That is category-defining. That is V1.

---

*End of HoopsIQ Product & Engineering Roadmap*
