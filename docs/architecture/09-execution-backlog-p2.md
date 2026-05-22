# HoopsIQ — Execution Backlog (Continuation)
## P2 Completions · New Slices · Cross-Cutting Infrastructure

> Continues from the primary backlog.  
> All task IDs continue the existing prefix scheme.  
> New slices: MSG (Messaging), RECR (Recruiting), NAV (Navigation/Search), ONB (Onboarding), MOB (Mobile/PWA)  
> Types: [BE] backend · [FE] frontend · [DS] design · [AX] analytics · [QA] quality

---

## DASHBOARD — P2 Completions

### Epic DASH-E5: Parent Dashboard (P2)

**Release goal**: Parents understand their child's development, schedule, and billing status without calling the coach. The dashboard earns their loyalty to the program.

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| DASH-101 | Implement `GET /api/dashboard/parent` — returns `{children: [{playerId, name, readinessTrend, attendanceRate, idpSummary: {activeFocusAreas, recentMilestone}}], nextEvent, outstandingBalance, unreadMessageCount}` for all linked children | [BE] | [REAL] | Guardian JWT returns only their linked children; no other player data exposed |
| DASH-102 | Wire `ParentDashboard.tsx` — replace all mock imports; `useParentDashboard()` from `GET /api/dashboard/parent`; child summary card shows real attendance rate and readiness trend; billing alert badge if `outstandingBalance > 0` | [FE] | [REAL] | Dashboard cold-loads in under 1.5 seconds; all data real; multi-child parent sees selector |
| DASH-103 | Build `PlayerSummaryCard` — attendance rate (last 30 days), readiness trend (7-day sparkline: READY/FLAGGED/RESTRICTED counts), top active IDP focus area with current and target score | [FE] | [REAL] | Card renders correctly for player with zero check-ins (shows "No data yet"); IDP shows "No active plan" if none |
| DASH-104 | Wire `ParentChildPage` — detailed child view at `/app/parent/child/:playerId`; tabs: Development (IDP read-only), Attendance (event calendar), Schedule (upcoming events) | [FE] | [REAL] | Parent sees IDP focus areas (status, target score) but NOT raw assessment scores or check-in values |
| DASH-105 | Wire `ParentSchedulePage` — `GET /api/events?upcoming=true&limit=10`; calendar view filtered to events player is expected to attend; event type icon, time, location, opponent | [FE] | [REAL] | Schedule shows real events; past events don't appear; iCal export link generated |
| DASH-106 | Wire `ParentWeeklyPulsePage` — `GET /api/announcements?type=weekly_pulse`; coach-authored team-wide update; most recent pulse shown as default | [FE] | [REAL] | Latest pulse loads from real announcements; "No pulse this week" state shown if none published |
| DASH-107 | Wire `ParentDigestPage` — `GET /api/parent/digest/:playerId?week=YYYY-Www`; computed digest: week's events, check-in completion, any milestone completed, new coaching actions created | [BE][FE] | [REAL] | Digest shows real weekly summary; parent can navigate week-by-week |
| DASH-108 | Wire `ParentAnnouncementsPage` — `GET /api/announcements` (role-filtered server-side); list view with read state | [FE] | [REAL] | Only announcements with `audienceRoles` including `parent_guardian` appear; read receipts tracked |
| DASH-109 | Design: Parent dashboard layout at 375px (child card, schedule strip, billing alert, message preview), child detail tabs layout, weekly digest card | [DS] | - | Figma specs for `ChildSummaryCard`, `ParentDigestCard`, `ParentDashboard` at mobile |
| DASH-110 | Analytics: Track `parent_dashboard.opened`, `parent_dashboard.child_tapped`, `parent_digest.opened` with `{orgId, hasOutstandingBalance}` | [AX] | - | Parent engagement heatmap per org visible |
| DASH-111 | QA: Guardian cannot view another family's child — `GET /api/dashboard/parent` with Guardian A's JWT returns only Guardian A's linked children; attempting `/api/parent/digest/:otherChildId` returns 403 | [QA] | - | Cross-guardian access test at route level |

---

### Epic DASH-E6: Director Dashboard (P2)

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| DASH-112 | Implement `GET /api/dashboard/director` — returns `{programHealthScore, healthDelta, warningCount, atRiskCount, enrollmentCount, billingCollectionRate, topWarnings[3]}` | [BE] | [REAL] | Reads from latest `program_health_snapshots` record; returns "no data" flag if no snapshot exists |
| DASH-113 | Wire `ProgramHealthDashboardPage` (Director home) — `useDirectorDashboard()`; `ProgramHealthGauge` for score; 3 top warnings as clickable chips linking to `WarningMetricsDashboardPage`; enrollment count; quick link to at-risk list | [FE] | [REAL] | Director home renders from real health snapshot; "Not enough data" state for orgs with < 30 days history |
| DASH-114 | Wire Director multi-team toggle — if `ctx.teams.length > 1`, show team selector chip; `useDirectorDashboard({ teamId })` filters metrics to that team | [FE][BE] | [REAL] | Director with 3 teams can switch between them; each team shows separate health score |
| DASH-115 | QA: Director dashboard role gate — coach JWT returns 403 on `GET /api/dashboard/director`; admin JWT returns 200 | [QA] | - | Route-level role guard test |

---

### Epic DASH-E7: Admin Dashboard Wiring

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| DASH-116 | Implement `GET /api/dashboard/admin` — returns `{openTasks: {pendingRegistrations, overdueInvoices, unsignedWaivers, unseatedCoaches}, billingSnapshot: {totalBilled, totalCollected, collectionRate}, seasonStatus: {name, enrollmentCount, teamsCount}}` | [BE] | [REAL] | All counts from live data; each `openTasks` count drives a badge |
| DASH-117 | Wire `AdminDashboard.tsx` — replace mock data with `useAdminDashboard()`; open tasks rendered as clickable alert rows (each links to the relevant management page); billing snapshot as KPI cards | [FE] | [REAL] | Task count badges accurate; clicking "4 pending registrations" navigates to `AdminRegistrationsPage` filtered to pending |

---

## COACHING — P2 Completions

### Epic COCH-E7 (Full): Playbook V3

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| COCH-101 | Create `plays` table migration — `id`, `orgId`, `name`, `category` (offense/defense/BLOB/SLOB/press/special), `data` (JSONB — V3 action array), `thumbnailSvg`, `isPublished`, `createdBy`, `createdAt` | [BE] | - | Migration runs; FK on `orgId`; index on `(orgId, category)` |
| COCH-102 | Create `server/modules/playbook/routes.ts` — `GET /api/playbook/plays?category=`, `POST /api/playbook/plays`, `GET /api/playbook/plays/:id`, `PATCH /api/playbook/plays/:id`, `DELETE /api/playbook/plays/:id` | [BE] | [REAL] | CRUD works; plays org-scoped; category filter returns correct subset |
| COCH-103 | Implement thumbnail generation — on `POST /api/playbook/plays`, render V3 play data to SVG thumbnail using `src/playbook/resolver.ts`; store as `thumbnailSvg` on the record | [BE] | [REAL] | Play card in library shows correct formation thumbnail; updated when play is saved |
| COCH-104 | Wire `PlaybookStudioV3` — `usePlay(id)` loads real play data into V3 canvas; auto-save debounced 3 seconds; `useCreatePlay()` and `useUpdatePlay()` mutations | [FE] | [REAL] | New play saves to DB; reload shows same canvas state; thumbnail generates within 5 seconds |
| COCH-105 | Wire play library page — `usePlaybook({ category })` with category tab nav; `PlayCard` grid showing thumbnail, name, category badge; "New Play" button opens blank V3 canvas | [FE] | [REAL] | Play grid loads from real API; filter by category works; creating a play adds it to the grid |
| COCH-106 | Build play category nav — horizontal scroll tab bar: All / Offense / Defense / BLOB / SLOB / Press / Special; URL param `?category=offense` updates filter | [FE] | - | Tab selection updates URL param; back button restores filter |
| COCH-107 | Seed 10 starter plays — `server/seeds/plays.json`; 4 offense (Horns, Elbow, 5-out, Motion), 2 defense (2-3 Zone, M2M), 2 BLOB, 2 SLOB; each with valid V3 action array | [BE] | - | `npm run seed:plays` inserts 10 plays visible to all orgs; marked as `system: true` |
| COCH-108 | Design: Playbook library grid (thumbnail card sizing, category badge), studio toolbar layout (action types, tool modes, undo/redo), play export to PDF spec | [DS] | - | Figma specs for `PlayCard`, `PlaybookToolbar`, `PlayCategoryNav` |
| COCH-109 | Analytics: Track `playbook.play_created`, `playbook.play_saved` (with `{category, actionCount}`), `playbook.play_assigned_to_quiz` | [AX] | - | Play creation rate per org trackable |
| COCH-110 | QA: Play org isolation — play created in Org A not visible to Org B; system seed plays visible to all orgs | [QA] | - | Cross-org playbook access test |

---

### Epic COCH-E8 (Full): Game Day Mode

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| COCH-111 | Wire `GameDayPage` — reads today's game event from `GET /api/events?type=game&date=today`; if no game, shows "No game today" with link to schedule | [FE] | [REAL] | Page shows real today's game opponent, time, location; no game = graceful empty state |
| COCH-112 | Build starting lineup card — drag-and-drop 5 positions (PG/SG/SF/PF/C) from roster; save lineup to `PATCH /api/events/:id/lineup`; saved lineup loads on return | [FE][BE] | [REAL] | Lineup saves; refreshing page shows saved lineup; changing lineup updates DB |
| COCH-113 | Build play quick-reference panel — list of 5 pinned plays from playbook (coach selects pre-game); play name + thumbnail shown; tapping opens full play animation | [FE] | [MOCK-OK] | 5 plays pinnable per game event; pinned plays load from real API if available |
| COCH-114 | Build scout summary panel — if opponent scout report exists for today's opponent, surface: top 2 tendencies, 2 key plays to defend; link to full scout report | [FE] | [REAL] | If scout report exists, summary shows; if not, "No scout report" prompt with link to create one |
| COCH-115 | Design: Game day mobile layout (fullscreen, single scroll, large touch targets), lineup card with position slots, play quick-ref card, scout summary card | [DS] | - | Figma spec at 375px; all elements visible without horizontal scroll |

---

### Epic COCH-E9: AI Film Analysis (P2)

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| COCH-116 | Complete `analyze-film.ts` Inngest function — the function exists but `playerNames: []` is a TODO; load roster from `GET /api/roster` using `orgId` from event data; pass player names to `analyzeFilmSession()` | [BE] | [REAL] | Analysis job runs with real player names; AI output references players by name when recognizable |
| COCH-117 | Wire `AIFilmAnalysisHub` page — `GET /api/film-analysis/sessions/:id/job` returns latest `AnalysisJob`; show job status (pending/running/complete/error); on complete, render AI-suggested events as corroboration cards | [FE] | [REAL] | Page shows real AI output for analyzed sessions; pending state shows progress spinner |
| COCH-118 | Build corroboration UI — `AICorroborationCard` per detected event: event type label, player name, timestamp (click to seek video), confidence score; coach actions: "Confirm" / "Dispute" / "Skip" | [FE] | [REAL] | "Confirm" creates a coaching action linked to that timestamp; "Dispute" logs a disagreement for model improvement |
| COCH-119 | Implement corroboration endpoint — `POST /api/film-analysis/sessions/:id/corroborate` accepts `{eventId, decision: "confirm" \| "dispute" \| "skip", coachNote}`; on "confirm" creates annotation + coaching action; on "dispute" flags for training data | [BE] | [REAL] | Confirming creates annotation at correct timestamp; disputing stores disagreement record |
| COCH-120 | Add AI usage tracking + cost guard — per-org daily minute limit configurable in org settings; `POST /api/film-analysis/sessions/:id/analyze` checks minutes-analyzed this billing period; returns 429 with `{limit, used, resetAt}` if over limit | [BE] | [REAL] | Org over limit receives 429; limit configurable per billing tier; usage logged per org per day |
| COCH-121 | Wire AI analysis trigger — when Mux webhook fires `video.asset.ready`, check org's `aiAnalysisEnabled` setting; if enabled, fire `film/asset.ready` Inngest event to trigger analysis | [BE] | [REAL] | Analysis auto-starts for enabled orgs; disabled orgs require manual trigger from session detail |
| COCH-122 | Design: AI analysis hub layout (job status banner, corroboration card list), corroboration card (event type icon, player chip, timestamp, confidence bar, action buttons), "AI is analyzing" skeleton state | [DS] | - | Figma specs for `AICorroborationCard`, `AnalysisJobStatusBanner` |
| COCH-123 | Analytics: Track `ai_analysis.triggered`, `ai_analysis.completed` (with `{durationSecs, eventCount}`), `ai_corroboration.confirmed`, `ai_corroboration.disputed` (with `{eventType}`) | [AX] | - | Confirmation rate per event type visible; model quality trackable over time |
| COCH-124 | QA: AI cost guard — org that has used 100% of their minute limit receives 429 on new analysis request; error message shows limit and reset date; existing analyses are not affected | [QA] | - | Limit enforcement test with seeded usage data |

---

## ACADEMY — P2 Completions

### Epic ACAD-E4: Play Study & Quiz (P2)

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ACAD-101 | Create `play_quizzes` table — `id`, `playId`, `orgId`, `createdBy`, `questions` (JSONB array of `{id, text, options[], correctIndex, imageRef?}`), `isActive`; `play_quiz_attempts` table — `quizId`, `playerId`, `answers` (JSONB), `score`, `completedAt` | [BE] | - | Migration runs; one play can have multiple quizzes |
| ACAD-102 | Implement quiz CRUD — `POST /api/academy/quizzes` (coach creates), `GET /api/academy/quizzes/:id`, `POST /api/academy/quizzes/:id/attempts` (player submits); score computed server-side from `correctIndex` vs submitted answers | [BE] | [REAL] | Player cannot see `correctIndex` via API; score computed server-side; attempt stores per-question answers |
| ACAD-103 | Build quiz builder (coach) — opened from play detail page; step through questions; per question: text field, 2-4 answer options, correct answer selector; question can reference a play timestamp (optional) | [FE] | [REAL] | Quiz with 3 questions created and saved; published quiz appears in player's quiz queue |
| ACAD-104 | Wire `PlayQuizRunner` (player) — `usePlayQuiz(id)`; one question per screen; timer optional; on completion `POST /api/academy/quizzes/:id/attempts`; score revealed with correct answers highlighted | [FE] | [REAL] | Player completes quiz; score saved; coach sees result in assignment list within 10 seconds |
| ACAD-105 | Wire `PlayStudyPage` (player) — `GET /api/playbook/plays/:id` loads play; V3 animated canvas in step-through mode; coach annotations overlay at correct step; no edit controls | [FE] | [REAL] | Player sees play animation with coach's annotations; cannot edit canvas |
| ACAD-106 | Build coach quiz results view — per-quiz: list of players who attempted, their score, which questions they got wrong; sortable by score | [FE] | [REAL] | Coach sees 8/12 attempted; average score 74%; Q2 had lowest score (identifies gap) |
| ACAD-107 | Design: Quiz builder step layout, quiz runner single-question layout (large answer taps at mobile), quiz results table, play study canvas view (annotations visible, no toolbar) | [DS] | - | Figma specs for `QuizBuilder`, `QuizRunner`, `QuizResultsTable`, `PlayStudyView` |
| ACAD-108 | QA: Quiz answer integrity — player cannot retrieve correct answers via `GET /api/academy/quizzes/:id`; `correctIndex` field stripped from public response | [QA] | - | API response test confirming `correctIndex` is not in the GET response |

---

### Epic ACAD-E5: Learning Paths & Certifications (P2)

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ACAD-109 | Create `learning_paths`, `modules`, `module_progress`, `certification_awards` tables — migrations for all 4; `learning_paths.moduleIds` as ordered array; `modules.type` enum (video/text/quiz); `module_progress.status` enum | [BE] | - | All 4 migrations run cleanly; FK constraints on `pathId → learning_paths.id` |
| ACAD-110 | Implement learning path CRUD — `POST /api/academy/paths` (admin creates), `GET /api/academy/paths?role=`, `PATCH /api/academy/paths/:id`, `POST /api/academy/paths/:id/assign` (assign to user or staff cohort) | [BE] | [REAL] | Paths filterable by `targetRole`; assignment creates `module_progress` records for each module in path |
| ACAD-111 | Implement module progress tracking — `POST /api/academy/modules/:id/start` (sets `status: "in_progress"`, `startedAt`); `POST /api/academy/modules/:id/complete` validates quiz score ≥ `passingScore`; sets `status: "completed"`, `completedAt`; checks if all path modules complete → triggers certification | [BE] | [REAL] | Module cannot be marked complete if quiz score < passingScore; completing last module triggers `academy/path.completed` Inngest event |
| ACAD-112 | Inngest function `award-certification` — on `academy/path.completed` event: create `certification_awards` record; send in-app notification to coach; send email with certificate link | [BE] | [REAL] | Certification created within 60 seconds of path completion; coach receives notification |
| ACAD-113 | Build `CoachEducationHub` — `useLearningPaths()` with tabs: My Paths / All Paths / Staff Learning; path card shows title, module count, estimated hours, completion progress ring | [FE] | [REAL] | Page shows real paths; completion progress reflects actual module_progress records |
| ACAD-114 | Build module player — full-screen view; video modules use MuxVideoPlayer or YouTube embed; text modules render markdown; quiz modules use `QuizRunner`; "Mark Complete" button for video/text modules | [FE] | [REAL] | Video module watches to 80% before "Complete" enables; quiz module requires passing score |
| ACAD-115 | Build `ModulePrescriptionPage` (coach) — prescribe a specific path to an assistant or staff cohort; record prescription with `prescribedBy`, `prescribedAt`, `targetUserId` | [FE][BE] | [REAL] | Prescription creates assignment; target user sees path in "My Paths"; prescriber can monitor progress |
| ACAD-116 | Build `CertificationPage` — list of earned certifications with path name, date, and certificate image (SVG with coach name embedded); shareable link | [FE] | [REAL] | Certified coach sees their certifications; certificate SVG renders correctly with coach name and date |
| ACAD-117 | Seed 3 starter learning paths — "Defensive Fundamentals L1" (6 modules), "Practice Planning Essentials" (4 modules), "Film Breakdown Workflow" (5 modules); each module has `contentMarkdown` (text type for MVP; video URL added in V2) | [BE] | - | `npm run seed:paths` inserts 3 paths; all visible via `GET /api/academy/paths` |
| ACAD-118 | Design: Learning path card (progress ring, module count, time estimate), module player layout (video/text/quiz variants), certification card (SVG badge), prescription modal | [DS] | - | Figma specs for `LearningPathCard`, `ModulePlayer`, `CertificationBadge` |
| ACAD-119 | Analytics: Track `learning_path.assigned`, `module.started`, `module.completed` (with `{moduleType, durationSecs}`), `certification.awarded` with `{pathId, daysToComplete}` | [AX] | - | Certification rate per org and average completion time trackable |

---

### Epic ACAD-E6: WOD Planner (P2)

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ACAD-120 | Create `wods` table — `id`, `orgId`, `coachId`, `date`, `targetPlayers` (playerIds[] or "all"), `blocks` (JSONB), `notes`, `publishedAt` | [BE] | - | Migration runs; FK on `orgId` |
| ACAD-121 | Implement WOD CRUD — `POST /api/wods`, `GET /api/wods?date=&playerId=`, `PATCH /api/wods/:id`, `DELETE /api/wods/:id`; player-facing `GET /api/wods/my` for their assigned WODs | [BE] | [REAL] | Player sees only WODs assigned to them; coach sees all org WODs |
| ACAD-122 | Wire `CoachWodPlanner` — replace mock data; load WODs from `useWods()`; calendar picker for date; block builder (exercise, sets, reps, rest) | [FE] | [REAL] | WOD saves and loads; player assigned sees it on `PlayerWodPage` |
| ACAD-123 | Wire `PlayerWodPage` — `GET /api/wods/my?date=today`; shows today's WOD with exercises; player can mark each exercise complete; completion tracked | [FE] | [REAL] | Player sees assigned WOD; marking exercises complete persists |

---

## ASSESSMENTS — P2 Completions

### Epic ASMT-E6: Advanced Analytics

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ASMT-101 | Implement skill velocity computation — Inngest job `skill-velocity-computation` runs weekly; for each player × sub-skill pair with ≥ 2 data points: compute `(latest_score - score_N_days_ago) / N × 30` for 30/60/90 day windows; store in `skill_velocity_snapshots` table | [BE] | [REAL] | Job runs without error; velocity calculated only when ≥ 2 assessment points exist in window |
| ASMT-102 | Create `skill_velocity_snapshots` table — `playerId`, `orgId`, `category`, `subSkill`, `window30`, `window60`, `window90` (delta scores), `computedAt` | [BE] | - | Migration runs; latest snapshot queryable via `(playerId, category, subSkill)` |
| ASMT-103 | Wire `SkillVelocityPage` (player) — `GET /api/roster/me/skill-velocity`; `SkillSparkline` per sub-skill showing 90-day score history; velocity direction arrow (up/down/flat) per sub-skill | [FE] | [REAL] | Player sees sparklines; "Not enough data" state for sub-skills with < 2 assessments |
| ASMT-104 | Build assessment coverage report (director) — `GET /api/assessments/coverage?orgId=` returns per-player last-assessed date and sub-skills with no score in 30 days; rendered as grid with heat-map coloring | [BE][FE] | [REAL] | Director sees which players haven't been assessed recently; clicking player links to Quick Assess pre-loaded for that player |
| ASMT-105 | Build `DevelopmentResumePage` (player) — coach-curated narrative generated from IDP history; `GET /api/roster/:id/development-resume` returns: top 3 completed focus areas with evidence, season assessment trajectory, coaching actions resolved on player; shareable link that respects privacy settings | [BE][FE] | [REAL] | Resume renders as a printable one-pager; coach can edit narrative text before player views; sharing link works without login |
| ASMT-106 | Build observation calibration session (P2 — coach advanced) — `POST /api/assessments/calibration-sessions`; coach selects a skill + 3-5 players; multiple assessors score independently; results show variance; facilitator runs discussion | [BE][FE] | [MOCK-OK] | Multi-assessor variance calculated; calibration session report shows inter-rater agreement |
| ASMT-107 | Design: Skill velocity sparkline (tiny 90-day chart, velocity arrow, last-updated date), assessment coverage grid (player rows × sub-skill columns, color by recency), development resume one-pager layout | [DS] | - | Figma specs for `SkillSparkline`, `CoverageGrid`, `DevelopmentResume` |
| ASMT-108 | QA: Velocity with 1 data point — player with a single assessment event has no velocity computed; sparkline shows single dot; no velocity arrows displayed | [QA] | - | Edge case test: exactly 1 assessment record produces no velocity |

---

## ADMIN/BILLING — P2 Completions

### Epic ADMB-E7 (Full): Advanced Billing

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ADMB-101 | Implement payment plans — `POST /api/invoices/:id/payment-plan` accepts `{installments: [{amount, dueAt}]}`; validates total = invoice amount; creates `payment_plan_installments` records | [BE] | [REAL] | Total validation: sum of installment amounts must equal invoice total ± $0.01; payment plan created and linked to invoice |
| ADMB-102 | Inngest job `payment-plan-reminder` — runs daily; checks `payment_plan_installments` where `dueAt` is 3 days out and `paidAt IS NULL`; sends parent in-app + email reminder | [BE] | [REAL] | Reminder fires exactly once per installment; does not re-fire if installment already paid |
| ADMB-103 | Wire payment plan UI (admin) — `CreatePaymentPlanModal` in invoice detail drawer; installment count selector (2-6); amount splits evenly by default; due dates configurable | [FE] | [REAL] | Payment plan creates correctly; installment schedule visible in invoice detail |
| ADMB-104 | Wire payment plan view (parent) — installment timeline component showing paid (checkmark), upcoming (count-up), and future (grey); "Pay Installment N" CTA for next due item | [FE] | [REAL] | Parent sees correct installment state; paying opens Stripe Checkout for the installment amount |
| ADMB-105 | Implement re-enrollment campaign — `POST /api/seasons/:id/re-enrollment` sends invitation to all players from prior season with a pre-filled registration link; tracks who opened and who completed | [BE][FE] | [REAL] | Invitation email sent; link pre-fills player data; admin sees open/completed counts |
| ADMB-106 | Implement expert payouts — `expert_payouts` table: `expertId`, `orgId`, `sessionDate`, `sessionType`, `ratePerHour`, `durationMinutes`, `totalOwed`, `paidAt`; `POST /api/billing/payouts`, `GET /api/billing/payouts` | [BE][FE] | [REAL] | Payout records track contracted trainer earnings; admin sees unpaid balance per expert |
| ADMB-107 | Build `AdminMembershipsPage` — show org's current HoopsIQ subscription plan, seat count, renewal date; link to Stripe Customer Portal for plan changes | [FE] | [REAL] | Page shows live subscription data from Stripe Customer; seat count accurate |
| ADMB-108 | Implement seat management — `POST /api/team/seats/invite` adds a coaching staff seat; `DELETE /api/team/seats/:userId` removes and cancels the seat subscription | [BE][FE] | [REAL] | Inviting a seat sends email; removing updates Stripe subscription quantity |
| ADMB-109 | Design: Payment plan installment timeline, re-enrollment invitation email template, expert payout table row, seat management roster | [DS] | - | Figma specs for `InstallmentTimeline`, `PayoutRow`, `SeatRoster` |
| ADMB-110 | QA: Payment plan total validation — creating payment plan where installment sum ≠ invoice total returns 422; overpaying an installment is blocked | [QA] | - | Boundary test for payment plan total validation |

---

## SLICE 7: Messaging

### Release Goal
Coaches communicate with players and parents inside the platform. Announcements reach the right audience. Broadcasts go to the whole team in one tap. No coaching decision requires leaving HoopsIQ to send a text.

**Feature flag**: `FLAG_MESSAGING`  
**Phase**: P1 — Weeks 21–22 (basic), P2 for broadcasts

---

### Epics Overview

| Epic | Description | Phase | MOCK? |
|---|---|---|---|
| MSG-E1 | Direct Messaging | P1 | [REAL] — routes already exist |
| MSG-E2 | Announcements | P1 | [REAL] — routes already exist |
| MSG-E3 | Broadcasts | P2 | [REAL] |

---

### Epic MSG-E1: Direct Messaging

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| MSG-001 | Create `features/messaging/` slice from template — `types.ts` (Thread, Message, Recipient), `hooks.ts` (`useThreads`, `useMessages`, `useSendMessage`, `useCreateThread`), `mock.ts`, `index.ts` | [FE] | - | Slice compiles; `useThreads()` calls `GET /api/messaging/threads` |
| MSG-002 | Wire `MessagesPage` (coach) — thread list from `useThreads()`; thread shows participant names, last message preview, unread count badge; search threads | [FE] | [REAL] | Thread list shows real conversations; unread badge count accurate; search filters by participant name |
| MSG-003 | Wire thread detail — `useMessages(threadId)` from `GET /api/messaging/threads/:threadId/messages`; infinite scroll (load older messages); message composer with send on Enter; optimistic update | [FE] | [REAL] | Messages load and send without page refresh; optimistic message appears immediately; confirmed on server response |
| MSG-004 | Build new thread composer — participant selector (players, parents, staff from `useRoster()`); thread subject optional; `POST /api/messaging/threads` then `POST /api/messaging/threads/:id/messages` | [FE] | [REAL] | Thread creates; first message sends; both participants see the thread |
| MSG-005 | Wire `ParentMessagesPage` — same UI as coach messages but guardian-scoped; can only message coaching staff + other guardians linked to same player | [FE] | [REAL] | Guardian cannot start thread with unrelated players; thread with coach works |
| MSG-006 | Wire `CoachInboxPage` — unified inbox showing all threads with unread count; quick reply inline; mark all as read | [FE] | [REAL] | Inbox badge count matches unread threads; marking read updates badge immediately |
| MSG-007 | Add unread count to navigation badge — `GET /api/messaging/unread-count` returns count; feeds `useCoachBadgeCounts()` (hook already exists) for Inbox tab badge | [BE][FE] | [REAL] | Badge count updates within 30 seconds of a new message arriving |
| MSG-008 | Design: Thread list layout (avatar, name, preview, timestamp, unread badge), message bubble (sender left/right, timestamp, read receipt), new thread composer participant selector | [DS] | - | Figma specs for `ThreadList`, `MessageBubble`, `NewThreadComposer` |
| MSG-009 | Analytics: Track `message.thread_created`, `message.sent` (with `{roleFrom, roleTo}`), `message.response_time_hours` | [AX] | - | Coach-to-parent response time trackable per org |
| MSG-010 | QA: Messaging role isolation — player cannot start a thread with another player; guardian cannot message guardians of unrelated players; coach can message anyone in org | [QA] | - | Permission-based recipient filter test at route level |

---

### Epic MSG-E2: Announcements

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| MSG-011 | Wire `CoachAnnouncementsPage` — `useAnnouncements()` from `GET /api/announcements` (coach-scoped: all org announcements); create announcement form with audience selector (all/players/parents/staff) | [FE] | [REAL] | Announcements list from real API; creating one with `audience: "parents"` shows only to parent role |
| MSG-012 | Wire `PlayerAssignmentsPage` announcement section — `GET /api/announcements?audienceRole=player` shows pinned announcements in player home; unread badge | [FE] | [REAL] | Player sees only their-role-targeted announcements; read state persists |
| MSG-013 | Build announcement read receipts — `POST /api/announcements/:id/read` records `{userId, readAt}`; coach sees "8/12 players read" on announcement list | [BE][FE] | [REAL] | Read count accurate; coaches who sent can see who has and hasn't read |
| MSG-014 | Weekly pulse — coach-authored team-wide update type (`type: "weekly_pulse"`); appears on parent dashboard as `ParentWeeklyPulsePage`; only one pulse per week per org shown | [BE][FE] | [REAL] | Creating a weekly pulse replaces prior week's; parent sees most recent on dashboard |

---

### Epic MSG-E3: Broadcasts (P2)

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| MSG-015 | Build `BroadcastPage` — coach composes message to: All Players / All Parents / Position Group / Team; `POST /api/messaging/broadcasts` creates a thread per recipient group | [BE][FE] | [REAL] | Broadcast to "All Parents" creates one thread per parent; 20-player team → 20 threads |
| MSG-016 | Batch thread creation — `broadcastService.create()` uses `resolveRecipients()` (already exists in `messaging/recipient-resolver.ts`) then batch-inserts threads; Inngest function handles delivery to avoid timeout | [BE] | [REAL] | Broadcast to 30 parents completes within 10 seconds; no timeout on large orgs |
| MSG-017 | Design: Broadcast composer (recipient group selector, message body, send confirmation with "You are messaging N people"), broadcast history list | [DS] | - | Figma spec for `BroadcastComposer` |

---

## SLICE 8: Recruiting

### Release Goal
Elite programs can build player dossiers that college recruiters can access with privacy controls fully in the player's hands. The platform earns its premium tier by creating verified development portfolios that are more credible than highlight reels.

**Feature flag**: `FLAG_RECRUITING`  
**Phase**: P2 — Weeks 41–52  
**Unlock condition**: Only available to orgs on premium tier; player and guardian consent required before any dossier is visible.

---

### Epics Overview

| Epic | Description | Phase | MOCK? |
|---|---|---|---|
| RECR-E1 | Player Dossier Builder | P2 | [REAL] |
| RECR-E2 | Player Privacy Controls | P2 | [REAL] |
| RECR-E3 | Recruiter Portal | P2 | [REAL] — separate auth context |
| RECR-E4 | Recruiting Analytics | P2 | [REAL] |

---

### Epic RECR-E1: Player Dossier Builder

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| RECR-001 | Create `player_dossiers` table — `playerId`, `orgId`, `isPublished`, `slug` (unique URL), `sections` (JSONB: bio, stats, filmClips[], assessmentHighlights[], coachNarrative), `publishedAt`, `updatedAt` | [BE] | - | Migration runs; unique constraint on `slug`; slug generated from player name + nanoid |
| RECR-002 | Implement dossier CRUD — `GET /api/recruiting/dossier/:playerId`, `PUT /api/recruiting/dossier/:playerId` (full replace), `POST /api/recruiting/dossier/:playerId/publish`, `POST /api/recruiting/dossier/:playerId/unpublish` | [BE] | [REAL] | Publishing sets `isPublished = true`; unpublishing immediately makes public URL return 404 |
| RECR-003 | Build `DossierBuilderPage` — sections: Bio (text), Grad Year/Position (from player profile), Film Highlights (clip picker from film library), Assessment Highlights (top scores from assessments), Coach Narrative (rich text), Contact Preference | [FE] | [REAL] | Each section edits independently; changes auto-save; "Preview" shows public dossier view |
| RECR-004 | Build public dossier page — `/p/:slug` (unauthenticated route); renders published dossier sections; Mux video embeds for film clips; coach narrative; development resume summary; contact request button | [FE] | [REAL] | Public page renders correctly without login; unpublished slug returns 404; no raw IDP data or check-in scores visible |
| RECR-005 | Build `RecruitingHubPage` (coach) — list of all players with dossier status (draft/published/no dossier); quick "Generate" action to pre-populate from assessment data | [FE] | [REAL] | Coach sees all players' dossier status; one-click pre-populate fills sections from real assessment + film data |
| RECR-006 | Design: Dossier builder section editor layout, public dossier page at 375px and desktop, coach recruiting hub table | [DS] | - | Figma specs; public dossier is print-friendly (CSS print media query) |

---

### Epic RECR-E2: Player Privacy Controls

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| RECR-007 | Build privacy consent flow — player (if ≥ 16) or guardian (if < 16) must explicitly consent to each section being public; `POST /api/recruiting/dossier/:playerId/consent` with `{sections: {bio: true, film: true, ...}, consentedBy, consentedAt}` | [BE][FE] | [REAL] | Dossier cannot be published without consent record; consent stored with IP, timestamp, userId |
| RECR-008 | Build `ProfileVisibilityPage` (player) — toggle each section on/off; shows who has viewed the profile; "Pause visibility" to temporarily hide all public content | [FE] | [REAL] | Toggling a section off immediately removes it from public dossier (within 30 seconds) |
| RECR-009 | QA: Consent enforcement — attempting to publish dossier without player/guardian consent returns 409; section toggled private renders as hidden on public page within 5 seconds | [QA] | - | Consent gate test; visibility toggle test |

---

### Epic RECR-E3: Recruiter Portal

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| RECR-010 | Implement recruiter account type — separate Clerk user type with `role: "external_recruiter"`; limited JWT scope (cannot access `/api/roster`, `/api/readiness`, or any coaching endpoints); can only access `GET /api/recruiting/search` and `/api/recruiting/dossier/:slug` | [BE] | [REAL] | Recruiter JWT returns 403 on all non-recruiting endpoints; verified via automated test suite |
| RECR-011 | Implement player search — `GET /api/recruiting/search?position=&gradYear=&location=&level=`; returns published dossiers matching filters; excludes private sections per consent | [BE] | [REAL] | Search returns only published dossiers; private sections not included in results; pagination supported |
| RECR-012 | Build `RecruiterDashboardPage` — saved searches, watchlist (bookmarked players), recent views, access request queue | [FE] | [REAL] | Recruiter sees their personalized dashboard; watchlist shows bookmarked players' status |
| RECR-013 | Implement recruiter view logging — every `GET /api/recruiting/dossier/:slug` by a recruiter JWT creates a `recruiter_view_logs` record: `recruiterId`, `institution`, `playerId`, `viewedAt`, `sectionsViewed[]` | [BE] | [REAL] | Player and guardian see recruiter view activity on `RecruiterViewActivityPage`; institution name shown |
| RECR-014 | Implement access request — some dossier sections gated behind consent; recruiter can `POST /api/recruiting/access-requests` to request access; player/guardian receives notification; approving reveals section | [BE][FE] | [REAL] | Request queues for guardian approval; approval immediately reveals section to requesting recruiter |
| RECR-015 | Wire `RecruiterViewActivityPage` (player/parent) — list of recruiter views: institution name, date, sections viewed; "N recruiters viewed this month" summary | [FE] | [REAL] | Player sees real view activity; parent sees same for child's profile |
| RECR-016 | Build `DirectorRecruitingCRMPage` — cross-program view: all players with published dossiers, view counts, access requests pending; filter by grad year; export to CSV | [FE] | [REAL] | Director sees program-wide recruiting activity; CSV export includes all columns |
| RECR-017 | Design: Recruiter dashboard layout, player search results card, dossier public page print layout, recruiter view activity log | [DS] | - | Figma specs; public dossier print-ready |
| RECR-018 | Analytics: Track `recruiting.dossier_published`, `recruiting.dossier_viewed` (with `{viewerRole}` — recruiter vs. other), `recruiting.access_requested`, `recruiting.access_granted` | [AX] | - | Funnel from publish → viewed → access requested → granted trackable |
| RECR-019 | QA: Recruiter JWT scope — recruiter attempting `GET /api/roster` returns 403; recruiter attempting `GET /api/recruiting/dossier/:slug` for unpublished dossier returns 404; consent section blocked from recruiter view | [QA] | - | JWT scope test; unpublished dossier test; consent gating test |

---

## SLICE 9: Navigation System

### Release Goal
Every role sees exactly the right nav items, with live badge counts, and can reach any feature in two taps. The nav system is built from a single config file and never diverges between mobile and desktop.

**Feature flag**: Part of PRIM — always on  
**Phase**: P0 — Weeks 1–3 (must precede all slice work)

---

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| NAV-001 | Create `features/navigation/config.ts` — `ROLE_NAV: Record<StaffRole, AppNav>` defining 5 L1 items per role with icon, href, badge hook ref, and `isActive` function; import path aliases established | [FE] | - | `ROLE_NAV` exported from `@/features/navigation`; all roles have exactly 5 L1 items; no role's items array has 4 or 6 |
| NAV-002 | Refactor `AppShell.tsx` — `CoachDesktopSidebar`, `BottomTabBar`, and `L2SubNav` all read from `ROLE_NAV[role]`; no hardcoded nav items remain in `AppShell.tsx` | [FE] | - | All nav items in `AppShell` come from `ROLE_NAV`; adding a new L1 item to config immediately appears in nav |
| NAV-003 | Implement `useCoachBadgeCounts()` refinement — current hook exists; wire `filmQueueCount` to `GET /api/film-analysis/queue/count`, `openActionsCount` to `GET /api/coaching-actions/open/count`, `inboxCount` to `GET /api/messaging/unread-count`; poll every 60 seconds | [FE][BE] | [REAL] | Badge counts accurate within 60 seconds of changes; three `GET /count` endpoints added |
| NAV-004 | Build `RouteGuard` component — wraps each `<Route>` in `app/router.tsx`; reads `ROUTE_GUARDS` from `features/navigation/guards.ts`; redirects unauthorized users | [FE] | - | Navigating to `/app/director/*` as a coach redirects to `/app/coach`; no flash of unauthorized content |
| NAV-005 | Implement `features/navigation/guards.ts` — `ROUTE_GUARDS` array covering all role-restricted routes; roles mapped to redirect paths | [FE] | - | All P0 pages have a guard entry; attempting access with wrong role always redirects |
| NAV-006 | Build mobile bottom tab bar `BottomTabBar.tsx` — 5 tabs from `ROLE_NAV[role]`; active tab highlighted; badge count shown on tab; haptic feedback on tap (Capacitor `Haptics.impact`); safe-area-inset-bottom applied | [FE] | - | Bottom bar renders correctly at 375px; active state correct on all routes; haptic fires on native |
| NAV-007 | Build L2 sub-nav `L2SubNav.tsx` — horizontal scroll bar below page header on mobile; items from active L1's `children` array; shows only when L1 has `children` defined | [FE] | - | Coach's "Coach" L1 shows Film / Actions / Practice / Playbook sub-nav; tapping item navigates correctly |
| NAV-008 | Build `DesktopSidebar.tsx` — grouped sections (from `ROLE_NAV[role]`) with section labels; active item highlighted; collapsed mode (icon only) at <1280px | [FE] | - | Desktop sidebar at 1440px shows labels; at 1280px collapses to icon-only; active route highlighted |
| NAV-009 | QA: Nav config completeness — automated test verifying every route in `app/router.tsx` has a corresponding entry in `ROLE_NAV` or `ROUTE_GUARDS`; no orphaned routes | [QA] | - | Script runs in CI; fails if any route in `App.tsx` has no nav or guard entry |

---

## SLICE 10: Global Search & Command Palette

### Release Goal
Coaches can find any player, session, action, or drill in under 3 keystrokes. Power users can trigger any action from the keyboard without navigating menus.

**Feature flag**: `FLAG_SEARCH`  
**Phase**: P1 — Weeks 23–24

---

### Epics Overview

| Epic | Description | Phase | MOCK? |
|---|---|---|---|
| SRCH-E1 | Global Search | P1 | [REAL] |
| SRCH-E2 | Command Palette | P1 | [REAL] |

---

### Epic SRCH-E1: Global Search

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| SRCH-001 | Implement `POST /api/search` — accepts `{query, role}` (role from JWT); returns merged results across: players (name, position, team), film sessions (title, date, type), coaching actions (player name, category, open only), drills (name, focus, sub-skills), events (type, date, opponent); role-filtered server-side | [BE] | [REAL] | Player search returns within 300ms; coach cannot search invoices; parent cannot search film sessions |
| SRCH-002 | Build search index — `tsvector` index on player `name` column; `tsvector` on film session `title`; full-text search via Postgres `to_tsquery`; drill search uses Postgres `ILIKE` on `name || subSkills` | [BE] | [REAL] | "Marcus" returns matching players in < 100ms on 500-player org |
| SRCH-003 | Refactor `SearchDialog.tsx` — exists but likely mocked; wire to `POST /api/search`; result groups by entity type (Players, Sessions, Actions, Drills, Events); keyboard navigation with arrow keys | [FE] | [REAL] | `Cmd+K` opens search dialog; typing returns grouped results; arrow keys navigate; Enter follows result link |
| SRCH-004 | Build result card renderer — per entity type: `[Player]` shows name + position + team + status badge; `[Session]` shows title + type + date; `[Action]` shows player name + category + status; `[Drill]` shows name + focus; `[Event]` shows type + date + opponent | [FE] | - | Each entity type has a distinct visual treatment; icon identifies type without reading label |
| SRCH-005 | Add recent searches — last 5 searches stored in `localStorage`; shown when search opens with empty query | [FE] | - | Recent searches appear on open; clicking a recent search populates query |
| SRCH-006 | Design: Search dialog layout (trigger bar, results grouped by type, keyboard nav indicator), empty state, "No results" state with suggestions | [DS] | - | Figma spec for `SearchDialog` at 375px and 1440px |
| SRCH-007 | Analytics: Track `search.opened`, `search.query_submitted` (with `{queryLength, entityTypes: resultTypes}`), `search.result_clicked` (with `{entityType}`) | [AX] | - | Zero-result rate identifies content gaps; most-searched entity type guides future prioritization |
| SRCH-008 | QA: Search role isolation — guardian JWT returning player results from other orgs returns empty; coach searching "Marcus" only returns players from their org | [QA] | - | Cross-org search isolation test; role filtering test |

---

### Epic SRCH-E2: Command Palette

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| SRCH-009 | Build `CommandPalette.tsx` — uses existing `command.tsx` (shadcn/cmdk); opens on `Cmd+K` (second press or `>` prefix switches from search to command mode); role-aware command list from `features/navigation/commands.ts` | [FE] | - | `Cmd+K` then `>` switches to command mode; commands filter as user types |
| SRCH-010 | Create `features/navigation/commands.ts` — `ROLE_COMMANDS: Record<StaffRole, Command[]>` defining quick actions per role; each command has `label`, `shortcut`, `action: NavigationIntent \| (() => void)` | [FE] | - | Coach commands: "Log Action" (opens action composer), "New Practice Plan", "Send Broadcast", "Quick Assess", "View Readiness"; Player commands: "Submit Check-in", "View My Assignments" |
| SRCH-011 | Wire command actions to navigation intents — `resolveIntent(intent, role)` from `features/navigation/types.ts`; commands that open modals call `useCommandModalStore().open(modalType)` | [FE] | - | "Log Action" command opens action composer without navigating away from current page |
| SRCH-012 | Design: Command palette layout (search + command mode toggle indicator), command list item (label, shortcut badge, category), action confirmation for destructive commands | [DS] | - | Figma spec for `CommandPalette` |
| SRCH-013 | QA: Command palette keyboard navigation — Tab and arrow keys navigate items; Enter executes; Escape closes; Cmd+K re-opens at same mode | [QA] | - | Keyboard navigation test (automated with `@testing-library/user-event`) |

---

## SLICE 11: Onboarding

### Release Goal
A new org admin can complete season setup, import a roster, and have their first coach login-ready within 30 minutes of signing up. A new coach completes their profile and knows what to do before their first practice. A new player submits their first check-in on day one.

**Feature flag**: `FLAG_ONBOARDING`  
**Phase**: P0 — concurrent with Admin/Billing

---

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ONB-001 | Wire `OnboardingPage` (admin) — multi-step: Org setup (name, timezone, logo) → Season setup (redirects to ADMB-019 wizard) → Invite first coach → Done; stores `onboardingStep` in org settings; resumes from last step on return | [FE][BE] | [REAL] | Admin cannot be "stuck" mid-onboarding; returning after browser close resumes at last completed step |
| ONB-002 | Wire `CoachOnboardingFlow.tsx` — exists; steps: Profile photo + bio → Team confirmed → Watch 2-min explainer video → "Your first practice plan" CTA; marks `coachOnboardingComplete: true` in user settings | [FE] | [REAL] | Coach who completes onboarding sees main dashboard; coach who skips still sees all features |
| ONB-003 | Wire `PlayerOnboardingPage` — exists; steps: Profile photo → Position + jersey number confirmed → "Your first check-in" CTA (opens check-in form) → Done | [FE] | [REAL] | Player completes onboarding in under 2 minutes; first check-in submitted as part of onboarding |
| ONB-004 | Build empty state system — every list page (roster, film library, practice plans, actions) has an empty state with: illustration, "No [items] yet" headline, primary CTA for the first action; empty states should not all look the same | [FE][DS] | - | 8 distinct empty states created (roster, film, actions, plans, assessments, drills, announcements, IDP); each has a unique illustration and CTA |
| ONB-005 | Build new org checklist widget — coach dashboard shows "Getting started" checklist for orgs with `setupScore < 100%`; items: Roster imported (N players), First film uploaded, First practice plan created, First check-in submitted; each item green when complete | [FE][BE] | [REAL] | Checklist items reflect real data; completing all items hides the widget permanently |
| ONB-006 | Build invite email system — `POST /api/admin/invite` sends templated invitation email with magic link; role-specific subject line ("Your coach account is ready" / "Your player account is ready"); link expires after 7 days | [BE] | [REAL] | Invite email arrives within 2 minutes; expired link shows "This link has expired — contact your coach" |
| ONB-007 | Design: Onboarding step indicator (N of 4 progress bar), admin onboarding layout, coach onboarding layout, player onboarding layout, "Getting started" checklist widget | [DS] | - | Figma specs for all 3 onboarding flows; checklist widget in both collapsed and expanded states |
| ONB-008 | QA: Onboarding resume — admin closes browser mid-step 2; reopening sends them back to step 2 (not step 1); completing onboarding and refreshing does not re-show onboarding | [QA] | - | State persistence test using `onboardingStep` field; completion flag test |

---

## SLICE 12: Mobile / PWA

### Release Goal
Check-in, film assignment review, coaching actions, and dashboard are fully functional on a phone screen with native-quality interactions. The app installs as a PWA and works offline for read-only views.

**Feature flag**: `FLAG_MOBILE_NATIVE` (for Capacitor-specific features only; PWA always on)  
**Phase**: P1 for PWA, P2 for Capacitor native

---

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| MOB-001 | Implement PWA manifest — `manifest.json` with name, short_name, icons (192/512px), theme_color, background_color, display: standalone; register service worker | [FE] | - | App installable on iOS Safari and Android Chrome; shows app icon on home screen |
| MOB-002 | Implement offline caching strategy — service worker caches: app shell (CSS/JS), player roster, today's events, current practice plan; `CacheFirst` for assets; `NetworkFirst` for API with offline fallback to cache | [FE] | - | Coach opening app with no internet sees last-cached roster and today's plan; no blank page |
| MOB-003 | Implement push notification delivery — Inngest functions that create `AlertItem` records also call `POST /api/push/send` with player/user device tokens; use Web Push API (VAPID keys) | [BE][FE] | [REAL] | Player receives push notification within 60 seconds of film assignment; notification taps open to correct page |
| MOB-004 | Implement push notification permission request — request permission after second app open (not on first open); store device token in `user_devices` table; respect system-level do-not-disturb | [FE][BE] | [REAL] | Permission prompt shown on second app open; granting stores token; denying does not block app use |
| MOB-005 | Mobile gesture refinements — swipe right on film session detail navigates to film library; swipe down on bottom sheets dismisses; long-press on coaching action opens context menu | [FE] | - | Swipe and long-press gestures work on real iPhone; do not conflict with system gestures |
| MOB-006 | Minimum touch target audit — all interactive elements ≥ 44×44px; tab bar items, action buttons, form controls; use `min-h-[44px] min-w-[44px]` Tailwind constraint | [FE] | - | Automated accessibility test (`jest-axe` or Playwright) confirms no element < 44px in interactive pages |
| MOB-007 | Capacitor build setup (P2 native) — `npm run build:ios` and `npm run build:android` produce installable packages; Capacitor plugins: `@capacitor/haptics`, `@capacitor/push-notifications`, `@capacitor/app` | [FE] | - | App builds for iOS without code signing errors; runs in Simulator; pushes from TestFlight pipeline |
| MOB-008 | Design: Mobile-specific layout audit — all 6 primary pages at 375px without horizontal scroll; bottom sheet max height 85vh; safe area insets applied; iOS home bar gap respected | [DS] | - | Figma audit of every P0 and P1 page at 375px; issues logged as FE bugs |
| MOB-009 | QA: Mobile regression suite — Playwright mobile viewport test for: check-in submission, film library grid, coaching action resolution, practice plan builder (mobile mode), team readiness grid; runs in CI | [QA] | - | Playwright mobile suite runs on each PR; 0 failures required to merge |

---

## MANAGER LABS — P2 Completions

### Epic MGRL-E7: VDV Command Center

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| MGRL-101 | Define VDV (Value-Driven Development) score — computed per player: `VDV = (idpFocusAreasCompleted × 10) + (assessmentScoreDelta × 5) + (coachingActionsResolved × 3) + (filmAssignmentsCompleted × 2)`; normalized 0–100 | [BE] | [REAL] | VDV computation function in `features/manager-labs/compute.ts`; unit tested with known inputs |
| MGRL-102 | Compute VDV per player weekly — Inngest job runs with `coach-effectiveness-snapshot`; stores `vdv_snapshots` table: `playerId`, `orgId`, `vdvScore`, `components` (JSONB), `computedAt` | [BE] | [REAL] | Snapshots accumulate weekly; 8-week trend available |
| MGRL-103 | Wire `VDVCommandCenterPage` — scatter plot: x-axis = IDP completion rate, y-axis = assessment improvement velocity; bubble size = VDV score; each bubble = one player; click bubble to open player profile | [FE] | [REAL] | Scatter plot renders real data after first snapshot computation; clicking player navigates correctly |
| MGRL-104 | Build player VDV detail — `PlayerVDVContributionPage`; player's own VDV score with component breakdown; week-over-week trend line | [FE] | [REAL] | Player can see their own VDV score; cannot see other players' VDV |
| MGRL-105 | Design: VDV scatter plot (bubble chart with color coding by quadrant), player VDV breakdown card (component bars), VDV trend sparkline | [DS] | - | Figma specs using recharts bubble chart |

---

### Epic MGRL-E8: Data Quality Scorecard

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| MGRL-106 | Implement `GET /api/manager-labs/data-quality` — returns per-feature completeness: `{checkinCompletionRate, idpCoverageRate, assessmentFrequency, filmUploadFrequency, billingCollectionRate}`; computed from last 30 days | [BE] | [REAL] | Endpoint returns real completeness metrics; all rates are 0–1 floats |
| MGRL-107 | Wire `DataQualityScorecardPage` — horizontal bar per metric with color coding (red <50%, amber 50-80%, green >80%); "Why this matters" tooltip per metric; "How to improve" action link | [FE] | [REAL] | Page shows real data quality scores; clicking "How to improve" for check-ins links to readiness page |
| MGRL-108 | Design: Data quality scorecard bars (label, percentage, color bar, action link), "No data" state for new orgs | [DS] | - | Figma spec; "Not enough data yet" state prominent for orgs < 30 days old |

---

### Epic MGRL-E9: Enterprise Rollup (P2 — multi-org)

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| MGRL-109 | Design multi-org data model — `enterprise_accounts` table linking multiple `orgs`; enterprise admin role scoped to the enterprise account, not an individual org | [BE] | - | Migration allows N orgs under one enterprise account; existing orgs not affected |
| MGRL-110 | Implement `GET /api/enterprise/rollup` — aggregates health scores, enrollment counts, billing collection rates across all member orgs; available only to enterprise admin role | [BE] | [REAL] | Enterprise admin sees aggregate dashboard; individual org data not cross-visible to other orgs |
| MGRL-111 | Wire `EnterpriseExpansionPage` — enrollment trend across all orgs; top-performing programs by health score; programs with warnings | [FE] | [REAL] | Page loads from real aggregate data; links to individual org programs |

---

## Cross-Cutting: Release Readiness

### Pre-Launch Checklist (P0 → V1 Release)

| ID | Task | Type | AC |
|---|---|---|---|
| REL-001 | Security audit — cross-org data isolation test for every server module; automated test using 2-org fixture; any route returning data from wrong org is a P0 blocker | [QA][BE] | Zero cross-org data leaks in automated test run |
| REL-002 | API error surface audit — every server route catches errors and returns structured `{error: string, code?: string}`; no `500 Internal Server Error` with stack traces in production | [BE] | `grep -r "res.status(500)" server/modules/` returns zero results |
| REL-003 | Environment variable audit — all required env vars documented in `README.md`; app fails gracefully at startup with clear error if required env vars missing | [BE] | Removing `MUX_TOKEN_ID` produces clear startup error; app does not boot |
| REL-004 | Database migration audit — all migrations idempotent; running migrations twice does not corrupt data; rollback script exists for each migration | [BE] | `npm run db:migrate` runs twice without error |
| REL-005 | Load testing — `k6` script runs 50 concurrent coaches opening coach dashboard; p95 response time < 2 seconds; error rate < 1% | [QA] | Load test passes in staging with production-shaped data (1000 players, 500 sessions) |
| REL-006 | Mobile device testing — coach dashboard, player check-in, film library on: iPhone 14 (Safari), iPhone SE (Safari), Pixel 7 (Chrome), Samsung Galaxy (Chrome); all functional | [QA] | Manual test sign-off from QA on 4 real devices |
| REL-007 | Accessibility audit — WCAG 2.1 AA on P0 pages; automated `jest-axe` check on dashboard, check-in form, roster list, invoice payment flow | [QA] | Zero `critical` or `serious` axe violations on P0 pages |
| REL-008 | Mock data contamination check — `grep -r "MOCK_\|mock[A-Z]" client/src/pages --include="*.tsx" \| grep -v test \| grep -v DemoModeProvider` returns zero results | [QA] | CI check passes; zero production pages import mock data |
| REL-009 | VSA check — `scripts/check-vsa.sh` passes with zero violations | [QA] | CI check passes on main branch |
| REL-010 | Stripe production mode validation — test mode keys not committed to any repo; production Stripe keys load from environment; webhook signing secret configured | [BE] | `grep -r "sk_test_\|pk_test_" server/` returns zero results |
| REL-011 | Analytics event coverage — every P0 user journey has at least one analytics event; verify `dashboard.opened`, `checkin.submitted`, `invoice.paid`, `film.session_uploaded`, `coaching_action.created` fire in staging | [AX] | All 5 events visible in analytics dashboard with correct properties |
| REL-012 | Documentation — `README.md` covers: environment setup, local dev, test run, database migration, Stripe test webhook, Mux test upload; new engineer can run the app in < 30 minutes | [BE][FE] | Internal test: hand the README to a new team member; they are running locally in < 30 min |

---

## Full Implementation Order Summary

```
Weeks 1-3:   PRIM-001..009 + NAV-001..009 (foundation before anything else)

Weeks 4-7:   ADMB-E1 (Roster) + ADMB-E2 (Events) + ADMB-E3 (Season setup)

Weeks 8-10:  ADMB-E4 (Invoice + Stripe) + ADMB-E5 (Parent payment portal)
             ONB-001..008 (Onboarding flows — parallel to billing)
             MOB-001..002 (PWA manifest + service worker — cheap to add early)

Weeks 11-14: COCH-E4 (Readiness — check-in + team grid)
             DASH-E1..E3 (Dashboard aggregation + coach + player dashboards)

Weeks 15-16: COCH-E1 (Film library + Mux upload)
             ACAD-E1 (Drill library seeding — parallel to film)

Weeks 17-18: COCH-E2 (Film session detail + annotation)
             MSG-E1..E2 (Direct messaging + announcements — parallel)

Weeks 19-22: COCH-E3 (Coaching actions — THE WEDGE — highest priority)
             COCH-E4 (Practice plan builder — depends on actions + drills)

Weeks 23-24: ASMT-E1 (Quick Assess) + ASMT-E2 (IDP CRUD)
             SRCH-E1..E2 (Global search + command palette — parallel)

Weeks 25-26: ASMT-E3 (Benchmarks — needs 30 days data)
             ASMT-E4 (IDP Generator — needs benchmarks)
             ASMT-E5 (Player development views)

Weeks 27-28: ACAD-E2 (Film assignments — needs film live)
             ACAD-E3 (Player assignments dashboard)
             COCH-E6 (Practice execution + review)
             COCH-E9 (Coaching journal)

             ═══ V1 RELEASE GATE ═══
             REL-001..012 (Release readiness checklist)

Weeks 29-33: ADMB-E7 (Payment plans + re-enrollment)
             DASH-E5..E7 (Parent + director + admin dashboards)
             MGRL-E1..E3 (Health score + at-risk + warnings)

Weeks 33-40: COCH-E7 (Playbook V3 full)
             COCH-E8 (Game Day)
             COCH-E9 (AI film analysis — gated by cost control)
             ACAD-E4 (Play Study + Quiz — needs Playbook V3)
             ACAD-E5 (Learning Paths + Certifications)
             ACAD-E6 (WOD Planner)

Weeks 37-44: MGRL-E4..E9 (Coach effectiveness, synthesis, VDV, enterprise)
             ASMT-E6 (Skill velocity + development resume)
             MSG-E3 (Broadcasts)
             MOB-007..009 (Capacitor native build)

Weeks 41-52: RECR-E1..E4 (Recruiting — premium tier unlock)
```

---

## Task Count Summary

| Slice | P0 Tasks | P1 Tasks | P2 Tasks | Total |
|---|---|---|---|---|
| Admin/Billing | 38 | 6 | 10 | **54** |
| Coaching | 18 | 21 | 22 | **61** |
| Assessments | 0 | 20 | 8 | **28** |
| Academy | 0 | 11 | 20 | **31** |
| Dashboard | 17 | 3 | 7 | **27** |
| Manager Labs | 0 | 0 | 24 | **24** |
| Messaging | 0 | 14 | 3 | **17** |
| Recruiting | 0 | 0 | 19 | **19** |
| Navigation | 9 | 0 | 0 | **9** |
| Search / Palette | 0 | 13 | 0 | **13** |
| Onboarding | 8 | 0 | 0 | **8** |
| Mobile / PWA | 0 | 6 | 3 | **9** |
| Release Readiness | 12 | 0 | 0 | **12** |
| **TOTAL** | **102** | **94** | **116** | **312** |

---

*End of HoopsIQ Execution Backlog (Continuation)*  
*312 total tasks across 13 categories · Complete backlog: 212 (primary) + 100 (continuation) = 312*
