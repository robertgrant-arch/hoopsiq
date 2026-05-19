# HoopsOS — Vertical Slice Product Specs
## Six Production Build Specs for the Core Platform

> Written for a startup engineering team  
> Grounded in the existing codebase schema, routes, and scaffolded pages  
> May 2026

---

# SLICE 1: Dashboard

## Purpose

**Business outcome**: The Dashboard is the daily active use driver. Every role should open it before doing anything else. If it earns that habit, feature adoption across every other slice follows automatically. It is not a reporting surface — it is an action surface.

**User problem**: Coaches come into practice preparation with five different questions: Who's flagged today? What's still open from last film session? What's on the schedule this week? What hasn't been done that should have been? They currently answer these by texting players, checking a separate scheduling app, and scrolling through notes. The Dashboard collapses all five into one triage interface.

**Platform moat**: The Dashboard is the entry point that makes HoopsOS feel like "the place to go," not a tool you visit for a specific task. It compounds in value as more slices are used because each new slice adds a new signal that surfaces here. A program using all six slices will have a dramatically richer dashboard than one using two — creating retention pressure to stay complete.

---

## Primary Users

| Role | Motivation | Success criteria |
|---|---|---|
| **Head Coach** | Know what needs attention before practice starts | Opens app, gets oriented in under 90 seconds, acts on at least one item |
| **Assistant Coach** | Know what the head coach expects and what's outstanding | Sees assigned actions, film reviews, and practice contributions |
| **Player** | Know what they need to do today and where they stand | Submits check-in, sees IDP progress, knows today's event |
| **Parent** | Get a clear picture of their child without needing to ask | Sees child status, schedule, billing, coach messages at a glance |
| **Director** | See program health without calling anyone | Gets aggregate signal on enrollment, readiness, billing health |

---

## Core Jobs to Be Done

1. **Coach**: "Show me who's flagged, what's open, and what I need to do before practice."
2. **Coach**: "Give me a shortcut to start today's most urgent task without navigating menus."
3. **Player**: "Let me submit my check-in and see my next assignment without hunting for it."
4. **Parent**: "Tell me what my child is doing today and whether there are any billing issues."
5. **Director**: "Give me a program-level health signal I can act on without opening five pages."

---

## Feature Set

### MVP

- **Coach Command Strip**: Today's date, next event (type + time + opponent if game), days until next game countdown
- **Team Readiness Snapshot**: Compact grid — each player as a colored dot (READY/FLAGGED/RESTRICTED/UNKNOWN). Tap a dot to see player detail. Shows check-in submission rate for today.
- **Action Lanes**: Grouped attention items by lane — Film Queue (pending reviews), Open Coaching Actions (by priority), IDP Gaps (players with overdue milestones), Upcoming Events (next 3). Each item is tappable and leads directly to the work.
- **Quick Actions Bar**: 4 fixed coach shortcuts — "Start Film Review", "Create Practice Plan", "Log Observation", "View Roster"
- **Player Dashboard**: Today's check-in CTA (if not submitted), next event, most recent coach note, top active IDP focus area
- **Parent Dashboard**: Child status card (readiness + attendance trend), next event, outstanding billing amount, last coach message preview
- **Director Dashboard**: Program health score (single number), enrollment count, readiness completion rate today, outstanding invoices count

### Strong V1

- **Development Alerts**: IDP-specific sidebar — players who haven't had a development conversation in 14+ days, overdue milestones, assessment gaps
- **Film Queue sidebar**: Top 3 pending film reviews with AI confidence signal, session title, date uploaded
- **Streak indicators**: Players who have submitted check-ins 5+ days in a row get a streak badge (positive reinforcement). Players who have missed 3+ days show a warning dot.
- **Coach broadcast shortcut**: One-tap to send a message to the full team from the dashboard
- **Personalized greeting**: "Good morning, Coach Taylor — 3 players are flagged today. Practice is in 4 hours." Time-aware copy.
- **Today's plan preview**: If a practice plan exists for today, it shows as a collapsible block with time, block count, focus areas
- **Parent weekly digest badge**: Parent dashboard shows "New this week" badge when new digest content exists
- **Notification inbox**: Bell icon surfaces unread system alerts (payment due, IDP milestone reached, film assignment reviewed)

### Future Moat

- **Smart priority scoring**: The Dashboard ranks Action Lane items by a computed urgency score combining staleness + player risk + game proximity. Not just chronological.
- **Director multi-team toggle**: Directors with multiple teams can switch between team dashboards or view an aggregate program view
- **Coach effectiveness nudge**: "You haven't created a coaching action from film in 8 days. Your last film session was Monday." Behavioral nudge triggered by inactivity.
- **Contextual drill suggestions**: Dashboard surfaces a drill recommendation based on what's trending in open coaching actions (e.g., "4 players flagged for finishing — here's a drill")
- **Daily summary push notification**: Coach receives mobile push at 7am with today's readiness summary and top 2 action items

---

## Main User Flows

### Flow 1: Coach morning pre-practice triage (happy path)

1. Coach opens app. Dashboard loads with today's date + "Practice at 3:30pm" in the Command Strip.
2. Team Readiness Snapshot shows 10 green dots, 2 yellow (flagged), 1 red (restricted). Check-in completion: 11/13 (85%).
3. Coach taps the red dot — player detail drawer opens. Player has an active injury. Coach notes the status, closes drawer.
4. Coach taps the first yellow dot — player reported fatigue 8/10 and soreness 7/10. Coach types a quick note: "Light today — no contact drills" and saves. This creates a coaching action.
5. Action Lanes show 3 open coaching actions and 1 film review pending. Coach taps "Film Review" to jump to the queue.
6. Coach uses Quick Action "Create Practice Plan" to begin today's plan with the flagged players already noted.

### Flow 2: Coach morning triage — no check-ins submitted yet

1. Coach opens app at 7am. Check-in completion: 0/13 (0%).
2. Dashboard shows a yellow banner: "No check-ins yet. Send a reminder?" with one-tap send.
3. Coach taps send. All players receive a push notification.
4. Coach revisits at 9am — 9/13 submitted. Dashboard updates dynamically.

### Flow 3: Player morning flow (happy path)

1. Player opens app. Dashboard shows: "Check in for today" CTA prominently at top (if not yet submitted).
2. Player taps — check-in form opens as a bottom sheet (fatigue, sleep, soreness, energy — 4 sliders). Submits in 20 seconds.
3. Dashboard updates to show their status (READY/FLAGGED based on submission).
4. Below the check-in, player sees: Today's event (3:30pm Practice, Johnson Gym), their top IDP focus area ("Contact Finishing — 6/10 → 8/10 by May 15"), and one film assignment ("Watch clip: Box-Out Breakdown — due by tonight").
5. Player taps the film assignment — goes directly to the assigned clip.

### Flow 4: Parent dashboard — sees billing alert

1. Parent opens app. Child summary card shows: attendance 8/10 practices (80%), readiness trend "Mostly Ready," no active flags.
2. Below, a billing alert: "Invoice #12 — $350 due in 3 days." Orange badge.
3. Parent taps the billing card — goes to the billing portal payment flow.
4. Parent pays, returns to dashboard. Billing alert is gone.

### Flow 5: Director — program health concern

1. Director opens app. Program health score is 64/100 (down from 72 last week).
2. Director sees the contributing factors: "Readiness completion 58% (↓ from 82%)", "3 overdue invoices", "2 players with no IDP activity in 30 days."
3. Director taps "Readiness completion" — navigates to Manager Labs readiness breakdown.
4. Director taps "Overdue invoices" — navigates to Admin/Billing outstanding payments view.

---

## UI Surfaces

### Pages

- `/coach/dashboard` — `CoachDashboard.tsx` (exists, needs API wiring)
- `/player/dashboard` — `PlayerDashboard.tsx` (to be created from `PlayerPages.tsx`)
- `/parent/dashboard` — `ParentDashboard.tsx` (exists, mock data)
- `/admin/dashboard` — `AdminDashboard.tsx` (exists, mock data)
- `/director/dashboard` — `ProgramHealthDashboardPage.tsx` (exists, mock data)

### Modals / Drawers

- **Player readiness detail drawer** — opens on readiness dot tap; shows check-in scores, status reason, recent trend, coach note field
- **Quick broadcast modal** — compose message to all players/parents; opened from Quick Actions bar
- **Notification inbox drawer** — slides from right; list of system alerts with mark-as-read
- **Check-in bottom sheet** (player) — full-screen modal on mobile for the 4-slider check-in form

### Reusable Local Components (owned by Dashboard slice)

```
features/dashboard/components/
  CommandStrip.tsx          — today's session context, countdown
  ReadinessDotGrid.tsx      — compact team readiness grid
  ActionLane.tsx            — single scrollable lane with priority items
  ActionLaneContainer.tsx   — multi-lane layout manager
  QuickActionsBar.tsx       — 4-button shortcut bar
  PlayerStatusCard.tsx      — child card for parent dashboard
  ProgramHealthGauge.tsx    — single-score gauge with contributing factors
  DevelopmentAlerts.tsx     — IDP + streak gap sidebar
  FilmQueueSidebar.tsx      — top pending reviews sidebar
  DailyPlanPreview.tsx      — collapsible today's practice plan card
  ReadinessDetailDrawer.tsx — player detail on dot tap
```

---

## Data Model

### Entities used by Dashboard slice (read-only — owned by other slices)

| Entity | Source slice | Fields read |
|---|---|---|
| `ReadinessCheckin` | Readiness | `playerId`, `fatigue`, `sleep`, `soreness`, `flagged`, `checkedInAt` |
| `CoachingAction` | Coaching | `id`, `playerId`, `type`, `status`, `priority`, `dueAt` |
| `PracticePlan` | Coaching | `date`, `status`, `blocks[].name`, `blocks[].durationMinutes` |
| `FilmSession` | Coaching | `id`, `title`, `status`, `createdAt` |
| `Event` | Events | `type`, `date`, `startTime`, `opponentId` |
| `IdpFocusArea` | Assessments | `playerId`, `category`, `subSkill`, `status`, `deadline` |
| `Invoice` | Admin/Billing | `status`, `dueDate`, `amount`, `playerId` |

### Dashboard-owned entities

```typescript
// Persisted alert log — drives the notification inbox
AlertItem {
  id:           string (nanoid)
  orgId:        string
  userId:       string         // recipient
  type:         'readiness_flag' | 'coaching_action_overdue' | 'payment_due' 
                | 'film_assigned' | 'idp_milestone_due' | 'check_in_reminder'
  severity:     'info' | 'warning' | 'critical'
  targetId:     string         // id of the related entity
  targetSlice:  string         // 'readiness' | 'coaching' | 'billing' etc.
  message:      string
  actionUrl:    string         // deep link into the relevant page
  createdAt:    timestamp
  readAt:       timestamp | null
  dismissedAt:  timestamp | null
}

// Program health snapshot — computed nightly by Inngest job
ProgramHealthSnapshot {
  id:           string
  orgId:        string
  computedAt:   timestamp
  overallScore: integer (0-100)
  components: {
    readinessCompletionRate: number  // 0-1
    idpCoverageRate:         number  // players with active IDP / total
    actionResolutionRate:    number  // resolved / (resolved + open) last 30d
    enrollmentRetentionRate: number  // last-season players re-enrolled
    billingCollectionRate:   number  // paid / total invoiced
    attendanceRate:          number  // last 14 days average
  }
  deltas: {    // change since last snapshot
    [key: string]: number
  }
}
```

---

## Business Logic

### Core rules

- **Check-in cutoff**: A check-in submitted after 2pm on a practice day does not count toward that day's completion rate (configurable per org).
- **Program health score**: Weighted sum — readiness completion (25%), action resolution rate (20%), IDP coverage (20%), billing collection (15%), attendance (15%), enrollment retention (5%). Weights are configurable by system admin.
- **Alert deduplication**: The same alert type for the same target cannot fire more than once per 24 hours per user.
- **Dashboard staleness**: If data is older than 4 hours, a "Refresh" prompt appears. Dashboard auto-refreshes on focus.

### Permissions

- Coaches see their team's readiness grid, their open actions, their film queue.
- Assistants see the same as coaches but cannot override readiness status.
- Directors see program health snapshot and can drill into any team's dashboard.
- Parents see only their child's data — never other players' names or scores.
- Players see only their own dashboard — not teammates' readiness scores.

### Notifications triggered

- **7:00am daily**: Inngest job fires `daily-checkin-reminder` — sends push to players who haven't submitted. Only fires if the org has practice or game that day.
- **9:30am daily**: If check-in completion rate < 50%, coach receives a "Low check-in rate" alert.
- **Nightly**: `program-health-snapshot` job runs and persists a new `ProgramHealthSnapshot`.
- **On invoice creation**: Parent and player receive a `payment_due` alert.

---

## Integrations

| Adjacent slice | What Dashboard needs from it |
|---|---|
| **Readiness** | `readinessCheckins` for today; computed status per player |
| **Coaching** | Open actions count + priority; today's practice plan; film queue |
| **Assessments** | IDP focus areas with status + deadline for development alerts |
| **Admin/Billing** | Outstanding invoices; enrollment counts |
| **Academy** | Pending film assignments for player dashboard |
| **Manager Labs** | Program health snapshot (computed by Manager Labs, read by Dashboard) |

---

## Analytics

| Signal | Why it matters |
|---|---|
| Dashboard sessions per week per coach | Primary engagement metric |
| Time to first action from dashboard open | Measures how useful the layout is |
| Check-in submission rate per org | North star daily habit metric |
| Quick Action click distribution | Tells us which shortcuts matter |
| Alert dismiss rate vs. action rate | Are alerts useful or noise? |
| Days since last dashboard open by role | Identifies churning users early |

**Product KPI**: 80% of active coaches open the dashboard on practice days. **Quality signal**: Average time from app open to first productive action < 45 seconds.

---

## Risks

| Type | Risk | Mitigation |
|---|---|---|
| **Complexity** | Aggregating from 6 slices creates N+1 query problems — dashboard becomes slow | Single `GET /dashboard/summary` endpoint that runs one optimized query per role; cache aggressively at the edge |
| **Scope creep** | Every team member wants their feature on the dashboard | Dashboard only surfaces action items, not every metric. Hard limit: no more than 4 Action Lanes. Additional data lives in its home slice. |
| **UX** | Different roles need radically different layouts, leading to 5 separate pages with diverging maintenance burden | Build a Dashboard composition system — each widget is a registered component. Role config determines which widgets appear and in what order. |
| **Technical** | Real-time readiness updates (players checking in during the morning) must reflect without page reload | Use SWR with 30-second polling on the readiness endpoint during 6am–12pm window only |

---

## Acceptance Criteria

- [ ] Coach dashboard loads in under 1.5 seconds on a cold connection
- [ ] Readiness grid reflects today's actual check-in data (not mock) with last-updated timestamp
- [ ] Tapping any Action Lane item navigates to the correct page/drawer with the correct entity pre-loaded
- [ ] Check-in reminder can be sent by coach with one tap; players receive the push notification within 60 seconds
- [ ] Player dashboard shows their actual check-in status for today
- [ ] Parent dashboard shows correct child status and outstanding invoice amount
- [ ] Alert inbox shows unread count badge; marking all as read clears the badge
- [ ] Program health score renders on director dashboard with correct component breakdown
- [ ] No mock data imports remaining in any Dashboard page component
- [ ] All dashboard data fetched through `features/dashboard/hooks.ts` hooks with proper loading and error states

---

## Vertical Slice Implementation Notes

```
client/src/features/dashboard/
  types.ts           — AlertItem, ProgramHealthSnapshot, DashboardConfig types
  hooks.ts           — useCoachDashboard(), usePlayerDashboard(), useParentDashboard(),
                       useDirectorDashboard(), useAlerts(), useProgramHealth()
  compute.ts         — computeHealthScore(), prioritizeActionItems(), groupByLane()
  mock.ts            — mock dashboard state for all roles (dev/demo mode)
  index.ts           — public exports only
  components/        — local components listed above
  pages/
    CoachDashboard.tsx
    PlayerDashboard.tsx
    ParentDashboard.tsx
    DirectorDashboard.tsx

server/modules/dashboard/
  routes.ts          — GET /dashboard/coach, /dashboard/player, /dashboard/parent, /dashboard/director
  service.ts         — aggregation logic, pulls from all domain repos
  snapshot.ts        — program health snapshot computation (called by Inngest)
```

**Public exports** (what other slices may import from `features/dashboard`):
- `AlertItem` type
- `ProgramHealthSnapshot` type
- `ReadinessDotGrid` (reused by Coaching slice's team view)

**What stays internal**:
- `computeHealthScore` — no other slice should compute this
- `DashboardConfig` — widget registration is internal
- Mock data — never imported by other slices

**Do not share yet**: The Action Lane system. It will be tempting to make it a generic "notification list" — resist. It should be Dashboard-owned and opinionated about basketball-specific action types.

---
---

# SLICE 2: Academy

## Purpose

**Business outcome**: Academy earns the platform a recurring learning behavior — coaches and players come back not just for operations, but for growth. This unlocks a certification monetization layer and makes HoopsOS a career development tool, not just a team tool.

**User problem**: Coaches have no structured path for their own development. They watch YouTube, attend occasional clinics, and learn by doing. Mistakes get repeated across seasons because there's no system for capturing and building on what worked. Players receive film assignments and play diagrams by text message with no accountability or comprehension check.

**Platform moat**: Academy content that is triggered by in-workflow events (a coaching action recommends a drill, a film observation prescribes a module) cannot be replicated by a standalone LMS. The learning is contextually embedded in the moment of need, not a separate tab the user forgets to visit.

---

## Primary Users

| Role | Motivation | Success criteria |
|---|---|---|
| **Coach** | Get better at coaching — specifically in areas where film reveals gaps | Completes modules relevant to their current player challenges |
| **Assistant Coach** | Build credentials and develop a specialty | Earns certifications; gets prescribed modules by head coach |
| **Player** | Study plays and film to be better prepared | Completes film assignments before practice; improves quiz scores over time |
| **Director** | Ensure staff are developing; use certification as a hiring and retention signal | All staff have active learning paths; certifications on file |

---

## Core Jobs to Be Done

1. **Coach**: "Prescribe specific learning to an assistant who needs to develop in a coaching area."
2. **Coach**: "Assign a film clip to a player with specific instructions and know they actually watched it."
3. **Player**: "Study the plays I'm expected to know before the game without needing the coach to walk me through them."
4. **Coach**: "Access a drill when I need one, organized by what I'm trying to fix."
5. **Director**: "Verify that coaching staff are developing, not just operating."

---

## Feature Set

### MVP

- **Drill Library**: Searchable library of drills by skill focus (shooting, finishing, ball handling, defense, conditioning), player count (1, 2, 3, full team), duration (5/10/15/20 min), court surface (half/full). Each drill: name, description, diagram (SVG), setup notes, verbal cues list.
- **Cue Library**: Saved verbal coaching cues tied to drills or skill categories. Coach creates their own cues. Shareable with assistant coaches.
- **Film Assignment**: Coach selects a clip from the film library, assigns to one or more players, adds written instructions, sets a due date. Player receives notification.
- **Film Assignment Review**: Player marks clip as watched. System records timestamp. Coach sees read status + time-watched percentage.
- **Play Study mode**: Player-facing animated play walkthrough with coach annotations visible. Step through the action or play it continuously.
- **Play Quiz**: Coach creates 1–5 questions on a play (multiple choice, player position identification). Player answers from memory. Coach sees score.

### Strong V1

- **Learning Paths**: Structured curriculum for coaches — ordered sequence of modules with a defined outcome ("Zone Defense Mastery," "Player Development Fundamentals"). Head coach assigns a path to an assistant; director assigns paths to all staff.
- **Module Player**: In-app video + text module with checkpoint quizzes. Tracks: started, in progress, completed, quiz score. Module types: video, text+diagrams, drill walkthrough, case study.
- **Module Prescription**: Coach (or director) prescribes a specific module to an assistant based on a coaching gap. System records the prescription and its outcome. Connects to coaching actions: "You flagged balance issues in 3 players — here's a module on footwork coaching."
- **Certification System**: On completing a learning path + passing a final assessment, coach receives a digital certification. Stored on coach profile. Director can verify status.
- **Coach IDP**: Coach has their own Individual Development Plan — focus areas (e.g., "Improve my ability to teach post footwork"), linked modules, milestones. Mirrors the player IDP structure.
- **Program Terminology**: Shared glossary of org-specific terms (play names, defensive schemes, signals). Coaches and players can reference it. Coaches create and own the content.
- **Drill assignment from coaching action**: When a coach creates a "recommend_drill" coaching action, they select from the drill library. The drill is delivered to the player as an assignment in their Academy section.

### Future Moat

- **Adaptive module prescription**: Based on assessment data and open coaching actions, the system suggests which module a coach should take or assign next. "Your players are scoring 4.2/10 on Contact Finishing — this 20-min finishing module addresses the 3 most common errors."
- **Drill video uploads**: Coaches record and upload their own drill demonstrations. Stored in the drill library as custom org content.
- **External content marketplace**: HoopsOS-curated library of paid learning content from recognized coaches. Revenue share model.
- **Observation calibration**: Multi-rater assessment calibration — coaches score the same player independently, system shows variance, facilitates discussion. Ensures assessment reliability across a staff.
- **Player film annotation**: Players can annotate their own assigned clips — add notes, flag moments — and submit back to coach. Coach reviews annotations as a comprehension signal.

---

## Main User Flows

### Flow 1: Coach assigns film clip to player after session review (happy path)

1. Coach is in the Film Room reviewing a session. Identifies a clip where player #12 loses their defensive assignment.
2. Coach creates a coaching action: type = `assign_clip`. The ClipActionBar opens — coach selects player Marcus Davis, adds instructions: "Watch how your feet are positioned at 0:23. What should you have done differently?"
3. Marcus receives a push notification: "Coach Taylor assigned you a film clip — due by tomorrow 7pm."
4. Marcus opens Academy → "Film Assignments" tab → sees the clip with the coach's instructions.
5. Marcus watches the clip. The app records the completion percentage. Marcus taps "Done watching."
6. Coach opens Academy → "Film Assignments" → sees Marcus marked as Reviewed. Optional: Coach adds a follow-up note.

### Flow 2: Play quiz assignment before game

1. Coach opens Playbook → selects "Horns" play → taps "Create Quiz."
2. Quiz builder opens: Coach adds 3 questions. Q1: "Who sets the first screen?" (4 multiple choice). Q2: "What's the primary action after the ball reversal?" Q3: "Where does the point guard end up after the hand-off?"
3. Coach assigns quiz to all players, due date: tonight 8pm.
4. Players receive notification. Each opens quiz separately, answers 3 questions.
5. Coach sees results table: 8/12 players completed, average score 72%. Marcus scored 33% (got Q1 wrong).
6. Coach flags Marcus for an individual walkthrough at tomorrow's shootaround.

### Flow 3: Director prescribes learning path to assistant coach

1. Director opens Academy → "Staff Learning" tab. Sees assistant coach Ryan has no active learning path.
2. Director taps "Assign Path" → selects "Defensive Fundamentals — Level 1" (6 modules, estimated 3 hours).
3. Ryan receives a notification. Opens his Learning Path — sees 6 modules listed with estimated time.
4. Ryan completes Module 1 (video + quiz). Progress updates. Director can see 1/6 complete on staff overview.
5. Ryan completes all 6. Passes final assessment. Certification "Defensive Fundamentals — Level 1" is issued.
6. Certification appears on Ryan's coach profile. Director sees it on the staff development report.

### Flow 4: Coach uses drill library during practice planning (integration path)

1. Coach is building a practice plan (Coaching slice). In the drill selection sidebar, they search "finishing contact."
2. Academy drill library surfaces 4 matching drills. Coach selects "Chair Drill — Contact Finishing."
3. Drill is added to the practice block with its built-in cues and setup notes.
4. During practice execution mode, coach taps the drill — full drill detail opens as a reference sheet.

### Flow 5: Coaching action triggers module prescription (edge path)

1. Coach has 4 open coaching actions all tagged with `issueCategory: "Balance"`.
2. Inngest function detects a threshold (3+ actions in same category in 7 days) and generates an alert.
3. Academy alert appears on Coach Dashboard: "4 players flagged for balance issues — here's a relevant module."
4. Coach taps → Module "Footwork Fundamentals: Teaching Balance" opens. Coach completes it.
5. Coach then prescribes the same module to an assistant: "I want you to do this too."

---

## UI Surfaces

### Pages

- `/coach/academy` — Academy home with tabs: Drill Library, Cue Library, My Learning, Staff Learning
- `/coach/academy/drills` — Full drill library with filters
- `/coach/academy/drills/:id` — Drill detail with diagram, cues, video
- `/coach/academy/cues` — Cue library (create, edit, tag, search)
- `/coach/academy/paths` — Learning path catalog
- `/coach/academy/paths/:id` — Path detail with module sequence + progress
- `/coach/academy/modules/:id` — Module player
- `/coach/academy/certifications` — Coach's earned certifications + staff overview
- `/coach/academy/assignments` — Film + drill assignments sent to players
- `/coach/education/prescribe` — `ModulePrescriptionPage` (exists)
- `/player/study` — Player's film assignments, play assignments, quiz queue
- `/player/study/:clipId` — Film clip study view
- `/player/playbook/study/:playId` — `PlayStudy.tsx` (exists)
- `/player/playbook/quiz/:playId` — `PlayQuiz.tsx` (exists)

### Modals / Drawers

- **Drill detail drawer** — opens from drill library or practice plan; shows diagram, cues, video link, "Add to plan" button
- **Film assignment composer** — opened from ClipActionBar or Film Library; player selector, instructions textarea, due date
- **Quiz builder modal** — stepped modal on a play; create up to 5 questions with answer options
- **Module quiz modal** — inline quiz that appears between video and completion; must pass to mark complete
- **Certification detail modal** — shows certificate image, path name, completed date, coach name

### Reusable Local Components (owned by Academy slice)

```
features/academy/components/
  DrillCard.tsx            — compact drill card with skill tags and duration
  DrillDetailSheet.tsx     — full drill view as a bottom sheet
  CueTag.tsx               — pill tag for a coaching cue
  ModuleProgressBar.tsx    — visual progress through a learning path
  ModulePlayerCard.tsx     — module in a path (with status: locked/available/complete)
  FilmAssignmentCard.tsx   — player-facing assignment card with due date + status
  QuizQuestion.tsx         — renders one quiz question with answer options
  QuizResults.tsx          — post-quiz score display with correct answers revealed
  CertificationBadge.tsx   — digital cert badge (SVG-based, coach name, date, path)
  StaffLearningRow.tsx     — director view: one row per staff member with path progress
```

---

## Data Model

```typescript
// Drill library entry
DrillLibraryEntry {
  id:              string
  orgId:           string         // null = HoopsOS global drill; non-null = org custom
  name:            string
  description:     string
  focusCategory:   string         // 'Shooting' | 'Finishing' | 'Ball Handling' | 'Defense' | 'Conditioning'
  focusSubSkills:  string[]       // ['Contact Layup', 'Drop Step']
  playerCount:     'individual' | 'pairs' | 'small_group' | 'full_team'
  durationMinutes: integer
  diagramSvg:      text           // raw SVG string
  cues:            string[]       // verbal coaching cues
  setupNotes:      text
  videoUrl:        string | null
  createdBy:       string         // userId or 'hoopsos_system'
  isPublished:     boolean
  createdAt:       timestamp
}

// Coaching cue library
CueLibraryEntry {
  id:        string
  orgId:     string
  coachId:   string
  text:      string               // the actual cue: "Shoulder to their hip before you go up"
  context:   string               // when to use it
  drillId:   string | null        // linked drill if specific
  category:  string               // skill category
  tags:      string[]
  createdAt: timestamp
}

// Learning path
LearningPath {
  id:               string
  title:            string
  description:      string
  targetRole:       'head_coach' | 'assistant_coach' | 'trainer'
  estimatedHours:   number
  modules:          ModuleRef[]   // ordered array
  certificationId:  string | null
  isPublished:      boolean
  createdBy:        string        // 'hoopsos_system' or coachId
}

// Module
Module {
  id:              string
  pathId:          string
  title:           string
  type:            'video' | 'text' | 'drill_walkthrough' | 'case_study'
  contentUrl:      string | null  // video URL
  contentMarkdown: text | null    // for text modules
  durationMinutes: integer
  order:           integer
  quizQuestions:   QuizQuestion[]
  passingScore:    integer        // 0-100, 0 = no quiz required
}

// Module progress (per coach)
ModuleProgress {
  id:          string
  userId:      string
  moduleId:    string
  pathId:      string
  status:      'not_started' | 'in_progress' | 'completed'
  quizScore:   integer | null
  startedAt:   timestamp | null
  completedAt: timestamp | null
}

// Film assignment (coaching → player)
FilmAssignment {
  id:            string
  orgId:         string
  sessionId:     string           // source film_sessions.id
  clipId:        string | null    // specific clip if clipped, null for full session
  assignedTo:    string[]         // playerIds
  assignedBy:    string           // coachId
  instructions:  text
  dueAt:         timestamp
  createdAt:     timestamp
}

// Film assignment completion (per player)
FilmAssignmentCompletion {
  id:              string
  assignmentId:    string
  playerId:        string
  watchedPct:      integer        // 0-100
  markedDoneAt:    timestamp | null
  coachNote:       text | null    // coach follow-up note
}

// Play quiz attempt
PlayQuizAttempt {
  id:          string
  quizId:      string
  playerId:    string
  answers:     { questionId: string; answer: string }[]
  score:       integer            // 0-100
  completedAt: timestamp
}

// Certification award
CertificationAward {
  id:              string
  pathId:          string
  userId:          string
  orgId:           string
  awardedAt:       timestamp
  expiresAt:       timestamp | null
}
```

---

## Business Logic

### Core rules

- **Film assignment completion threshold**: A player is considered to have "reviewed" a clip when `watchedPct >= 80`. Below that, status stays "In Progress."
- **Quiz passing**: A module quiz requires `score >= passingScore` to mark the module complete. Default passing score is 70. Coach can set it per path.
- **Certification eligibility**: All modules in the path must be `completed` AND the final assessment score must be >= the path's `passingScore`. Cannot skip modules.
- **Module unlock sequencing**: By default, modules unlock sequentially. Coach can configure a path as "open" (all modules available from day one).
- **Drill library visibility**: Global drills (orgId = null) are visible to all orgs. Org-custom drills are visible only within the org.
- **Film assignment due date**: Players who have not submitted by the due date show a "Overdue" badge on the coach's assignment view.

### Permissions

- Head coach can create/edit drills, paths, and assign all content to anyone in the org.
- Assistant coaches can create personal cues but cannot create org-wide drills without head coach approval.
- Players can only see content assigned to them — not the full drill library or other players' assignments.
- Directors can view all staff learning progress across all teams. Cannot create content unless also a coach.

### Validation

- Drill name must be unique within the org.
- Film assignment must have at least one player assigned and a due date >= today.
- Quiz question must have 2–4 answer options with exactly one correct answer marked.
- Module video URL must be a valid URL to an allowed host (Mux, YouTube, Vimeo).

### Notifications triggered

- **On film assignment created**: All assigned players receive push + in-app notification.
- **At due date - 2 hours**: Players who haven't completed receive a reminder push.
- **On film assignment overdue**: Coach receives an in-app alert listing non-completers.
- **On module completed**: Coach who prescribed the module receives an in-app notification.
- **On certification awarded**: Coach receives in-app notification + email with certificate link.

---

## Integrations

| Adjacent slice | What Academy needs |
|---|---|
| **Coaching (Film)** | Session and clip data to create film assignments; `assign_clip` action type triggers here |
| **Coaching (Practice)** | Drill library is accessible from the practice plan builder sidebar |
| **Coaching (Actions)** | `recommend_drill` action type creates a drill assignment in Academy |
| **Assessments** | Assessment scores inform module prescription (low score in a category → suggest relevant module) |
| **Dashboard** | Film assignment due today surfaces on player dashboard; pending certifications surface on director dashboard |

---

## Analytics

| Signal | Why it matters |
|---|---|
| Film assignment completion rate per team | Measures player accountability to coaching directives |
| Average quiz score per play | Identifies which plays players don't understand |
| Module completion rate per prescribed path | Are learning assignments actually being done? |
| Days from film assignment to completion | Response time to coaching directives |
| Drill library usage frequency | Which drills are actually used in practices |
| Certification rate across staff | Director KPI for staff development investment |

**Product KPI**: 75% of film assignments completed before due date. **Quality signal**: Play quiz average score increases by 10+ points after film assignment completes.

---

## Risks

| Type | Risk | Mitigation |
|---|---|---|
| **Scope creep** | Building a full LMS with content authoring takes 6 months — platform becomes a content company | Launch with curated HoopsOS global drill library + simple video module player. Custom content authoring is V2. |
| **UX** | Players don't engage with "homework" — film assignments ignored | Make completion visible to parents. Show streak indicator on player dashboard for consecutive completed assignments. Frame as preparation, not punishment. |
| **Complexity** | Certification logic (sequential modules + quiz scoring + expiry) is more complex than it appears | Build certification as a simple state machine. Don't add expiry, CPD credits, or multi-path merges until V2. |
| **Technical** | Video module hosting costs at scale (if HoopsOS hosts the content) | Use Mux or YouTube unlisted for module video hosting. HoopsOS never stores raw video — only the URL. |

---

## Acceptance Criteria

- [ ] Coach can create a film assignment from the Film Room in under 4 taps
- [ ] Player receives push notification within 60 seconds of assignment creation
- [ ] Player film assignment shows watched percentage updating in real time as they watch
- [ ] Coach sees completion status for all assigned players with accurate watched percentage
- [ ] Drill library returns results in under 500ms for any search query across the full library
- [ ] Play quiz records all answers, computes score, and shows coach results broken down by player and question
- [ ] Learning path progress updates correctly after each module completion
- [ ] Certification is awarded automatically when all modules complete + quiz passed; no manual step required
- [ ] No mock data in any Academy page; all data fetched from real API endpoints

---

## Vertical Slice Implementation Notes

```
client/src/features/academy/
  types.ts       — DrillLibraryEntry, Module, LearningPath, FilmAssignment,
                   FilmAssignmentCompletion, CertificationAward types
  hooks.ts       — useDrillLibrary(), useFilmAssignments(), useLearningPath(),
                   useModuleProgress(), useCertifications(), usePlayQuiz()
  compute.ts     — computePathProgress(), computeQuizScore(), isDrillMatch()
  mock.ts        — seed drills, learning paths, sample assignments
  index.ts       — public exports
  components/    — as listed above
  pages/         — as listed above

server/modules/academy/
  routes.ts      — CRUD for drills, assignments, paths, modules, progress, certs
  service.ts     — assignment delivery, certification evaluation, prescription logic
  schema.ts      — Zod validators for all API payloads
```

**Public exports**: `DrillLibraryEntry` type, `useDrillLibrary()` hook (imported by Coaching/Practice slice), `FilmAssignment` type (imported by Coaching/Film slice for the ClipActionBar).

**What stays internal**: Quiz scoring logic, certification state machine, module unlock sequencing.

**Do not share yet**: The learning path structure. The Assessments slice will want to use it to prescribe content based on skill gaps — wait until Assessments is stable before creating that integration contract.

---
---

# SLICE 3: Assessments

## Purpose

**Business outcome**: Assessments convert subjective coaching opinions into structured data that drives development plans, justifies program investment to parents, and creates the longitudinal record that makes players recruitable. It is the data engine underneath everything else.

**User problem**: Coaches assess players constantly — every rep, every drill — but none of it is captured. IDPs are written from memory. Development conversations have no data to reference. Parents ask "is my child getting better?" and coaches answer with generalities. Assessments make that question answerable with numbers and trends.

**Platform moat**: Three seasons of skill assessment data per player, organized by sub-skill with trend lines, creates a switching cost that no other platform can replicate. That longitudinal record cannot be exported or recreated — it stays with HoopsOS.

---

## Primary Users

| Role | Motivation | Success criteria |
|---|---|---|
| **Head Coach** | Have defensible data for development conversations and IDP creation | Assessment data used in every IDP; development conversations reference scores |
| **Assistant Coach** | Score players quickly during live sessions without breaking flow | Quick Assess flow completed in under 2 minutes per player |
| **Player** | See concrete evidence of improvement and know exactly what to work on | Checks skill velocity chart weekly; knows their top 2 areas of focus |
| **Parent** | Understand objectively where their child stands | Reads the development digest and understands the assessment summary |
| **Director** | Validate that coaching staff are assessing consistently and frequently | Assessment frequency meets minimum thresholds per season |

---

## Core Jobs to Be Done

1. **Coach**: "Score my whole roster on 5 skills in 10 minutes without leaving the gym floor."
2. **Coach**: "Create an IDP for a player using their assessment scores as the foundation."
3. **Coach**: "Compare this player's finishing score to the program average and their peers."
4. **Player**: "See how much I've improved in shooting over the last 3 months."
5. **Director**: "Know that all players have been assessed at least twice this season."

---

## Feature Set

### MVP

- **Assessment rubric**: Coach-defined rubric with up to 8 skill categories. Each category has up to 5 sub-skills. Scoring is 1–10. Rubric saved and reused across assessment events.
- **Assessment event**: A discrete assessment session — date, assessor, rubric used, players assessed. Multiple events can use the same rubric.
- **Quick Assess flow**: Mobile-optimized rapid scoring. Players listed one at a time (or in a list). Coach taps a score (1–10) per sub-skill. Auto-advances to next player. Can skip and return.
- **Assessment history**: Per-player view of all scores across all events, sorted by date. Each sub-skill shows its own score history.
- **IDP generator integration**: After an assessment event, coach can tap "Generate IDP" for any player. System pre-populates focus areas from the lowest-scoring sub-skills relative to program benchmarks.

### Strong V1

- **Benchmark system**: Program-level and position-level norms per sub-skill. Computed from all assessment events in the org. Coach can also set manual target benchmarks.
- **Benchmark comparison**: Player's score shown against program average (as a percentile or Z-score visual). Position-specific comparison where sample size allows.
- **Skill velocity**: Per-player, per-sub-skill rate of change over rolling 30/60/90-day windows. Shown as a sparkline on the player profile.
- **Assessment coverage report**: Which players have been assessed, how recently, which sub-skills are missing scores. Director-facing.
- **Multi-assessor events**: Multiple coaches score the same player independently. System shows variance between assessors. Used for calibration.
- **Score validation guard**: Flags assessments where a player's score jumped more than 3 points in a single event (potential scoring error).

### Future Moat

- **AI-assisted scoring**: Coach plays a film clip, selects a sub-skill, AI suggests a score based on the video with a reasoning sentence. Coach confirms or adjusts.
- **Observation calibration session**: Structured tool for a coaching staff to align on what a "7" vs. an "8" looks like for a given sub-skill. Uses film clips as calibration anchors.
- **Cross-org benchmarks**: Anonymized aggregate benchmarks across all HoopsOS programs by age group and position. "Your player scores in the 78th percentile for U16 PG shooting."
- **Predictive development windows**: Based on skill velocity and historical patterns, surface predictions: "At current pace, Marcus will reach a 7 in Contact Finishing by July 15."

---

## Main User Flows

### Flow 1: Coach runs Quick Assess during practice (happy path)

1. Practice is ongoing. Coach finishes a finishing drill. Opens app → Assessments → "Quick Assess."
2. Quick Assess flow opens. Coach selects today's focus: "Finishing" (3 sub-skills: Floater, Contact Layup, Drop Step).
3. First player card appears: Marcus Davis. Three sub-skill rows each with a 1–10 slider. Coach taps 6, 5, 7. Taps "Next."
4. Second player: Jordan Smith. Coach taps 8, 7, 8. Taps "Next." Repeat for all 12 players. Total time: ~3 minutes.
5. Review screen shows all scores. Coach spots a typo — Marcus's floater shows 9, not 6. Taps to correct.
6. Coach submits. All scores are saved to assessment history. Dashboard shows "12 players assessed today."

### Flow 2: Coach creates IDP from assessment data

1. Coach opens player profile for Marcus Davis → "Create IDP" button.
2. IDP Generator opens. Step 1 shows Marcus's most recent assessment scores across all sub-skills, benchmarked against program average.
3. System highlights the 3 largest gaps below benchmark: Contact Layup (-2.1), Floater (-1.8), Defensive Footwork (-1.4).
4. Coach selects "Contact Layup" and "Defensive Footwork" as focus areas (rejects floater — low program priority).
5. Step 2: For each focus area, coach sets: current score (5), target score (7), target date (May 15), notes.
6. Step 3: System suggests 2 drills per focus area from the Academy drill library. Coach selects one per focus area.
7. Coach publishes IDP. Player and parent receive notification.

### Flow 3: Player checks skill velocity

1. Player opens app → Development → "My Skills."
2. Skill velocity chart shows all assessed sub-skills as sparklines over the last 90 days.
3. Player sees Contact Finishing trending upward (+1.2 over 60 days). Ball handling flat. Defense slightly down.
4. Player taps Contact Finishing — detail view shows score history per assessment event with dates and notes.
5. Player sees the drill that was assigned in their IDP is correlated with the upward trend (reinforcement visible).

### Flow 4: Director checks assessment coverage

1. Director opens Manager Labs → "Assessment Coverage."
2. Grid shows all players and when they were last assessed. Players not assessed in 30+ days show in red.
3. 3 players haven't been assessed in 45 days. Director taps to see which coach is responsible.
4. Director sends an in-app message to the coach: "Marcus, Jordan, and Tyler need assessments this week."

---

## UI Surfaces

### Pages

- `/coach/assessments` — Assessment hub: Recent events, coverage summary, Quick Assess CTA
- `/coach/assessments/quick` — Quick Assess flow (full-screen mobile mode)
- `/coach/assessments/rubrics` — Rubric management (create/edit/archive)
- `/coach/assessments/history/:playerId` — Per-player score history (`AssessmentHistoryPage` exists)
- `/coach/assessments/benchmarks` — `BenchmarkingPage` (exists)
- `/coach/idp/generate/:playerId` — `IDPGeneratorPage` (exists)
- `/coach/players/:id/idp` — `PlayerIDPPage` (exists)
- `/player/skills` — `SkillVelocityPage` (exists)
- `/player/assessments` — `AssessmentHistoryPage` (exists, player-facing view)

### Modals / Drawers

- **Quick Assess flow** — full-screen mobile overlay; player-by-player scoring
- **Rubric editor modal** — create/edit rubric: add categories, sub-skills, scoring descriptions
- **Score correction drawer** — edit a specific score after submission with reason note
- **IDP focus area editor** — slide-in panel: current score, target, date, coach notes, linked drill
- **Benchmark detail modal** — shows distribution of scores for a sub-skill across the program

### Reusable Local Components (owned by Assessments slice)

```
features/assessments/components/
  SkillScoreSlider.tsx        — 1-10 scoring widget (large tap targets for gym use)
  SkillSparkline.tsx          — mini trend chart for a single sub-skill
  SkillVelocityCard.tsx       — player's velocity for one sub-skill with direction arrow
  BenchmarkBar.tsx            — player score vs. program average visual
  AssessmentCoverageGrid.tsx  — all players + last assessed date + status color
  IdpFocusAreaCard.tsx        — one focus area with score, target, deadline, drill link
  IdpProgressRing.tsx         — circular progress indicator for IDP milestone completion
  QuickAssessPlayerCard.tsx   — single player card in the Quick Assess flow
  ScoreHistoryTimeline.tsx    — chronological score history for one sub-skill
```

---

## Data Model

All entities defined in existing schema. Key additions needed:

```typescript
// Assessment rubric (org-defined)
AssessmentRubric {
  id:           string
  orgId:        string
  name:         string
  description:  string
  categories:   AssessmentCategory[]
  isDefault:    boolean     // one default rubric per org
  isArchived:   boolean
  createdBy:    string
  createdAt:    timestamp
}

AssessmentCategory {
  name:      string       // 'Shooting', 'Finishing', etc.
  subSkills: string[]     // ['Catch & Shoot', 'Off-Dribble', '3PT']
}

// Assessment event (one scoring session)
AssessmentEvent {
  id:          string
  orgId:       string
  rubricId:    string
  sessionDate: date
  assessorId:  string
  teamId:      string | null
  playerIds:   string[]    // who was assessed
  status:      'draft' | 'submitted'
  notes:       string | null
  createdAt:   timestamp
  submittedAt: timestamp | null
}

// Existing: skillAssessments — one row per (event, player, subSkill)
// Unchanged from current schema

// Benchmark — computed nightly from all org assessment data
ProgramBenchmark {
  id:           string
  orgId:        string
  category:     string
  subSkill:     string
  position:     string | null  // null = all positions
  sampleSize:   integer
  mean:         number          // 1-10
  stdDev:       number
  p25:          number
  p75:          number
  computedAt:   timestamp
}

// IDP focus area — extends existing idp_structured schema
// Already exists in shared/db/schema/idp_structured.ts:
// idpFocusAreas, idpMilestones, idpDrillLinks, idpComments
```

**State transitions for `idpFocusAreaStatusEnum`**:
```
draft → active     (coach publishes the IDP)
active → completed (coach marks the focus area achieved)
active → paused    (coach pauses due to injury or reprioritization)
paused → active    (coach resumes)
completed → active (edge case: regression, coach reopens)
```

---

## Business Logic

### Core rules

- **Score range enforcement**: All scores must be integers 1–10. Fractional scores are rejected.
- **Benchmark minimum sample**: A benchmark is only displayed when `sampleSize >= 5`. Below 5, show "Insufficient data."
- **Skill velocity calculation**: `velocity = (latest_score - score_N_days_ago) / N_days * 30`. Normalized to a "points per 30 days" scale.
- **IDP auto-generation gap logic**: Focus areas are suggested when `player_score < program_mean - 1.0`. If more than 3 sub-skills qualify, only the top 3 gaps are offered (by gap magnitude).
- **Assessment event draft state**: An event can be saved as `draft` (scores editable, not yet committed). Submitted events are immutable except for a 15-minute correction window.
- **Duplicate submission guard**: If the same assessor submits scores for the same player on the same sub-skill within 6 hours, prompt "You already scored this player today — replace or keep both?"

### Permissions

- Any coach can create assessment events and score players within their org.
- Only the assessor can edit their own event within the 15-minute correction window.
- Players see their own scores and trends — not other players' scores.
- Parents see their child's scores in a simplified summary — not the full rubric breakdown.
- Directors see all events, all players, coverage report.

### Validation

- An assessment event cannot be submitted with 0 scores.
- Score jumps of more than 3 points from the same sub-skill within 14 days trigger a "Confirm this score" prompt.
- IDP cannot be published with 0 focus areas.
- An IDP focus area cannot have `targetScore <= currentScore`.

### Notifications triggered

- **On IDP published**: Player receives push + in-app: "Your coach has updated your development plan." Parent receives a simplified version.
- **On focus area marked completed**: Player receives a congratulations notification. Coach receives confirmation.
- **On IDP milestone overdue**: Coach receives a reminder: "Marcus's Contact Finishing milestone was due 3 days ago."
- **Nightly**: Benchmark computation job runs; `ProgramBenchmark` records updated.

---

## Integrations

| Adjacent slice | What Assessments needs |
|---|---|
| **Roster** | Player list, position data (for position-specific benchmarks) |
| **Academy** | Drill library (linked from IDP focus areas) |
| **Coaching** | Coaching actions of type `add_to_idp` create IDP focus areas here |
| **Dashboard** | IDP milestone alerts; assessment coverage alert for director |
| **Manager Labs** | Assessment coverage data; development outcome reporting |

---

## Analytics

| Signal | Why it matters |
|---|---|
| Assessment events per program per month | Is the rubric being used regularly? |
| Average players assessed per event | Is the whole roster being evaluated or just a few? |
| IDP creation rate after assessment events | Are assessments being actioned? |
| IDP focus area completion rate | Are development plans producing outcomes? |
| Skill velocity distribution | Is the platform producing measurable player improvement? |
| Time from assessment to IDP creation | Speed of the development feedback loop |

**Product KPI**: Each player is assessed at least twice per season. **Quality signal**: 60%+ of IDP focus areas reach `completed` status.

---

## Risks

| Type | Risk | Mitigation |
|---|---|---|
| **UX** | Scoring 12 players across 5 sub-skills = 60 taps during a live practice — coaches won't do it | Quick Assess must work with one hand, large tap targets, auto-advance. Maximum 3 sub-skills per Quick Assess session. Full rubric scoring is a separate, post-practice flow. |
| **Complexity** | Benchmark computation with small sample sizes produces misleading data | Show "Insufficient data" below 5 samples. Never show benchmark comparisons for programs with fewer than 8 players. |
| **Scope creep** | Every coach wants their own custom rubric with different scales | Standard 1–10 scale is enforced platform-wide. Custom rubrics are allowed but must use the same scale. Score labels can be customized per sub-skill. |
| **Technical** | Skill velocity requires sufficient historical data to be meaningful — new orgs see empty charts | Show a "Building your baseline" state for the first 60 days. After first two assessment events, velocity becomes available. |

---

## Acceptance Criteria

- [ ] Quick Assess completes scoring for 12 players across 3 sub-skills in under 4 minutes
- [ ] All scores are persisted correctly with assessor, event, date, and orgId
- [ ] Benchmark computation runs nightly and reflects all submitted events
- [ ] IDP Generator pre-populates focus areas from real assessment gaps (not mock data)
- [ ] Skill velocity sparkline renders correctly with at least 2 assessment data points
- [ ] Player can view their own score history; cannot see other players' scores
- [ ] IDP focus area state transitions (draft → active → completed) persist correctly
- [ ] Score correction within 15-minute window works; updates immediately
- [ ] Assessment coverage report shows accurate last-assessed date per player

---

## Vertical Slice Implementation Notes

```
client/src/features/assessments/
  types.ts         — AssessmentRubric, AssessmentEvent, ProgramBenchmark,
                     IdpFocusArea (re-exported from shared schema), SkillVelocity
  hooks.ts         — useAssessmentHistory(), useQuickAssess(), useBenchmarks(),
                     useIdp(), useIdpFocusAreas(), useSkillVelocity()
  compute.ts       — computeSkillVelocity(), computeBenchmarkPercentile(),
                     identifyIdpGaps(), validateScoreJump()
  mock.ts          — sample rubrics, assessment events, benchmark data, IDP stubs
  index.ts
  components/      — as listed above

server/modules/assessments/
  routes.ts        — CRUD for rubrics, events, scores, IDPs, focus areas
  service.ts       — IDP gap identification, benchmark query, velocity computation
  benchmark.ts     — nightly benchmark aggregation (called by Inngest)
  schema.ts        — Zod validators
```

**Public exports**: `IdpFocusArea` type (used by Coaching/Actions for `add_to_idp` action type), `useSkillVelocity()` hook (used by Player Development pages), `ProgramBenchmark` type (used by Manager Labs).

**What stays internal**: Score validation logic, benchmark computation algorithm, IDP gap selection logic.

---
---

# SLICE 4: Manager Labs

## Purpose

**Business outcome**: Manager Labs is the renewal justification. It answers the director's annual question: "Did this platform produce outcomes?" If it does that clearly, the renewal is automatic. If it can't answer that question, no amount of feature richness saves the contract.

**User problem**: Program directors operate on instinct and anecdote. They know their star players are developing because they can see it. They don't know which coach is most effective, which players are at risk of quitting, or whether the program is healthier this year than last. They make retention and hiring decisions without data.

**Platform moat**: Manager Labs derives its value from the data generated across all other slices. It cannot be replicated by a standalone analytics product because it requires integrated film, readiness, assessment, and billing data to produce meaningful insights. The more slices a program uses, the richer Manager Labs becomes.

---

## Primary Users

| Role | Motivation | Success criteria |
|---|---|---|
| **Director / Program Director** | Run a better program; make data-driven staffing and retention decisions | Reviews program health weekly; takes at least one action per month from a Manager Labs insight |
| **Head Coach** | Understand their coaching impact; identify at-risk players before they quit | Opens coaching effectiveness dashboard monthly; acts on at-risk intervention alerts |
| **Club Admin** | Report program outcomes to board or stakeholders | Generates season report without manual data compilation |

---

## Core Jobs to Be Done

1. **Director**: "Tell me which players are most likely to not re-enroll so I can intervene."
2. **Director**: "Show me how the program has improved year over year."
3. **Director**: "Evaluate my coaching staff based on what the data shows, not just what I observe."
4. **Coach**: "Identify players who need immediate attention before they disengage or quit."
5. **Admin**: "Generate a season summary I can present to the board without building a spreadsheet."

---

## Feature Set

### MVP

- **Program Health Dashboard**: Single composite score (0–100) with 6 component indicators. Week-over-week delta. Tap any component to drill into the underlying metric.
- **Warning Metrics Dashboard**: List of active warning flags across the program — players with 3+ consecutive missed check-ins, players with no IDP activity in 30 days, overdue invoices, assessment coverage gaps. Each flag has a "Take action" button.
- **At-Risk Player Intervention**: Players who meet 2+ risk criteria (missed check-ins, attendance decline, no IDP activity, behavior flags) surface with a risk score and suggested action. Coach can log an intervention with notes and outcome.
- **Coaching Effectiveness Dashboard**: Per-coach metrics — coaching action resolution rate, IDP completion rate, film sessions created per month, assessment frequency, player check-in submission rate on their teams.

### Strong V1

- **Roster Intelligence**: Position distribution by grade/grad year, injury incidence rate, multi-year retention rate, roster depth by position. Used for planning future recruitment.
- **Development Synthesis**: Aggregate view across the roster — which skill categories are trending up or down program-wide? Are players in certain positions developing faster? Identifies coaching system strengths and gaps.
- **Club Growth Metrics**: Enrollment trend by season, retention rate (returning players / eligible players), NPS proxy (parent engagement score from digest interactions), revenue per enrolled player.
- **VDV Command Center** (Value-Driven Development): Cross-player view of development velocity. Which players are in accelerating growth phases vs. plateauing? Prioritization tool for coaching attention allocation.
- **Season Report**: Exportable PDF summary covering: enrollment, attendance, assessment coverage, IDP completion rate, billing collection rate, readiness health. Auto-generated from live data at end of season.

### Future Moat

- **Predictive churn model**: ML model trained on behavioral signals to predict with 3-week lead time which players are likely to not re-enroll. Surfaced as a risk score with contributing factors.
- **Coach effectiveness benchmarking**: Anonymized comparison of a coach's effectiveness metrics against similar programs on HoopsOS (opt-in).
- **Multi-org enterprise rollup**: For organizations managing multiple programs (e.g., an AAU organization with 5 regional programs), a single dashboard aggregating across all programs.
- **Stakeholder reporting portal**: External-facing report link that can be shared with a board or sponsor — no login required, pre-formatted.
- **Development ROI calculator**: "In this season, your program invested X coaching hours. Players improved an average of Y points across their focus skills. That's Z improvement per hour of coaching investment."

---

## Main User Flows

### Flow 1: Director weekly health review (happy path)

1. Director opens Manager Labs on Monday morning. Program Health score: 71/100.
2. Director sees the 6 components. Two are orange: "Readiness completion: 61%" and "IDP coverage: 58% of players have an active IDP."
3. Director taps "Readiness completion" → drills to the readiness breakdown. Coach Martinez's teams are averaging 48% completion; Coach Thompson's teams are at 85%.
4. Director sends Coach Martinez an in-app message: "Let's talk about check-in compliance — what's the blocker?"
5. Director taps back, taps "IDP coverage" → sees 8 players with no active IDP. 5 are on Coach Martinez's roster.
6. Director notes both issues trace to the same coach. Schedules a 1:1.

### Flow 2: At-risk intervention triggered

1. Inngest job runs nightly risk assessment. Player Devon Carter triggers 3 risk criteria: missed 4 consecutive check-ins, attendance 40% in last 2 weeks, no coaching action resolved in 30 days.
2. Manager Labs → "At-Risk Interventions" surfaces Devon with risk score 82/100.
3. Coach taps Devon's card — sees contributing factors listed. Taps "Log Intervention."
4. Intervention drawer opens: what was done (called family, one-on-one conversation, adjusted training load), outcome notes, follow-up date.
5. System marks Devon as "Intervention Active." Risk score is suppressed for 7 days. A follow-up reminder fires after 7 days.
6. Coach checks in 10 days later — Devon's check-in compliance has returned to 80%. Risk flag is auto-resolved.

### Flow 3: Season report generation

1. End of season. Admin opens Manager Labs → "Season Report."
2. Report generator runs — pulls data from all slices for the season date range.
3. Preview renders: 47 players enrolled, 94% attendance rate, 38/47 players with completed IDPs, average skill improvement +1.4 points across assessed sub-skills, $42,300 billed, $40,100 collected (95.5% collection rate).
4. Admin reviews, adds a custom director's note, taps "Export PDF."
5. PDF downloads. Admin shares with board. No spreadsheet built.

### Flow 4: Director evaluates coaching staff before contract renewal

1. Director opens Coaching Effectiveness Dashboard. Wants to evaluate 3 assistant coaches.
2. Side-by-side comparison: Coach Ryan — 87% action resolution rate, 4 film sessions/month, 100% IDP completion on his players. Coach Marcus — 42% action resolution, 1 film session/month, 60% IDP completion. Coach Tanya — 91% resolution, 6 film sessions, 95% IDP completion.
3. Director sees Coach Marcus is significantly below the others. Drills into his data — his players also have the lowest readiness completion rate and worst assessment coverage.
4. Director schedules a performance conversation with Coach Marcus, bringing the dashboard data as the agenda.

---

## UI Surfaces

### Pages

- `/analytics/north-star` — `NorthStarDashboardPage.tsx` (exists, mock data)
- `/analytics/warnings` — `WarningMetricsDashboardPage.tsx` (exists, mock data)
- `/analytics/vdv` — `VDVCommandCenterPage.tsx` (exists, mock data)
- `/analytics/data-quality` — `DataQualityScorecardPage.tsx` (exists, mock data)
- `/analytics/enterprise` — `EnterpriseExpansionPage.tsx` (exists, mock data)
- `/coach/at-risk` — `AtRiskInterventionPage.tsx` (exists, mock data)
- `/coach/effectiveness` — `CoachEffectivenessDashboardPage.tsx` (exists, mock data)
- `/coach/development-synthesis` — `DevelopmentSynthesisPage.tsx` (exists, mock data)
- `/coach/season-report` — `CoachSeasonReportPage.tsx` (exists)
- `/director/program-health` — `ProgramHealthDashboardPage.tsx` (exists, mock data)
- `/club/analytics` — `ClubAnalyticsPage.tsx` (exists, mock data)
- `/club/growth` — `ClubGrowthMetricsPage.tsx` (exists, mock data)
- `/club/roster-intelligence` — `RosterIntelligencePage.tsx` (exists, mock data)

### Modals / Drawers

- **Risk factor detail drawer** — opens from at-risk player card; shows each contributing factor with the metric value and threshold
- **Intervention log modal** — log an intervention with type, notes, outcome, follow-up date
- **Metric drill-down drawer** — any program health component card opens a drawer with the full underlying data
- **Season report preview modal** — full-page preview of the PDF before export; shows all sections
- **Coach comparison modal** — side-by-side view of up to 3 coaches on the same metrics

### Reusable Local Components (owned by Manager Labs slice)

```
features/manager-labs/components/
  HealthScoreGauge.tsx        — the main 0-100 gauge with delta indicator
  ComponentIndicator.tsx      — one health score component as a colored bar
  RiskPlayerCard.tsx          — at-risk player card with score + factors
  InterventionLog.tsx         — chronological intervention history for a player
  CoachMetricsRow.tsx         — one coach's metrics in the effectiveness dashboard
  MetricTrendChart.tsx        — any metric over time (uses recharts)
  DevelopmentHeatmap.tsx      — skill categories × player grid colored by velocity
  RosterPyramid.tsx           — age/grade distribution visual
  SeasonReportSection.tsx     — one section of the PDF report template
  VDVScatterPlot.tsx          — velocity × volume scatter for all players
```

---

## Data Model

```typescript
// At-risk flag (system-generated)
AtRiskFlag {
  id:              string
  orgId:           string
  playerId:        string
  riskScore:       integer          // 0-100
  triggers:        RiskTrigger[]
  status:          'active' | 'intervention_active' | 'resolved' | 'dismissed'
  detectedAt:      timestamp
  resolvedAt:      timestamp | null
  suppressedUntil: timestamp | null
}

RiskTrigger {
  type:       'missed_checkins' | 'attendance_decline' | 'no_idp_activity'
            | 'no_coaching_action_resolved' | 'payment_overdue' | 'behavior_flag'
  value:      number          // the actual metric value
  threshold:  number          // what triggered the flag
  severity:   'low' | 'medium' | 'high'
}

// Intervention log (coach-authored)
Intervention {
  id:          string
  orgId:       string
  flagId:      string
  playerId:    string
  coachId:     string
  type:        'call' | 'meeting' | 'email' | 'schedule_adjustment' | 'referral' | 'other'
  notes:       text
  outcome:     'improving' | 'neutral' | 'escalated' | 'withdrew'
  followUpAt:  timestamp | null
  loggedAt:    timestamp
}

// Coach effectiveness snapshot (computed weekly)
CoachEffectivenessMetric {
  id:                      string
  orgId:                   string
  coachId:                 string
  periodStart:             date
  periodEnd:               date
  actionResolutionRate:    number    // 0-1
  idpCompletionRate:       number    // 0-1 (IDPs on their roster that are completed)
  filmSessionsCreated:     integer
  assessmentEventsRun:     integer
  playerCheckinRate:       number    // avg check-in compliance on their teams
  computedAt:              timestamp
}

// Program health snapshot — defined in Dashboard slice, read here
// ProgramHealthSnapshot is the source; Manager Labs adds the component drill-downs

// Season report — not stored, computed on demand from live data
// Only the generated PDF is stored (as a signed S3 URL)
SeasonReportExport {
  id:          string
  orgId:       string
  seasonId:    string
  generatedAt: timestamp
  reportUrl:   string    // signed S3 URL, expires in 7 days
  generatedBy: string    // userId
}
```

---

## Business Logic

### Core rules

- **Risk score computation**: Weighted sum of trigger severities. `high` = 30 points, `medium` = 20, `low` = 10. Cap at 100. A player with a score >= 60 surfaces in the at-risk list.
- **Risk suppression**: Once an intervention is logged, the player's risk score is suppressed for 7 days. After suppression expires, risk is re-evaluated from live data.
- **Coach effectiveness computation**: Run weekly on Sunday night for the prior 7-day period and cumulative season-to-date. Only coaches with at least 5 players on their roster are evaluated.
- **Program health weighting**: Readiness completion (25%), action resolution rate (20%), IDP coverage (20%), billing collection (15%), attendance (15%), enrollment retention (5%). Not configurable by coaches — only by system admin.
- **Season report generation**: Report locks to the season's `startDate` → `endDate` date range. Cannot be generated for a season with no `submittedAt` date on the enrollment.

### Permissions

- Directors see all program health data, all coaches' effectiveness metrics, all at-risk flags.
- Head coaches see their own teams' at-risk flags and effectiveness metrics. Cannot see other head coaches' metrics without director role.
- Assistant coaches see at-risk flags for their assigned players only. Cannot see effectiveness comparisons.
- Players and parents cannot access any Manager Labs page.

### Notifications triggered

- **Nightly**: Inngest runs risk assessment for all active players. New risk flags generate `at_risk_player` alerts to the responsible coach.
- **Weekly (Sunday)**: Coach effectiveness snapshot computed and stored.
- **On intervention logged**: Follow-up reminder scheduled at `followUpAt` timestamp.
- **On risk flag resolved**: Coach receives a "Devon is back on track" notification.
- **On program health score drops 10+ points week-over-week**: Director receives an alert.

---

## Integrations

| Adjacent slice | What Manager Labs reads |
|---|---|
| **Readiness** | Check-in completion rates, daily flag counts |
| **Assessments** | Assessment event frequency, IDP coverage and completion |
| **Coaching** | Action resolution rates, film session frequency |
| **Admin/Billing** | Invoice collection rates, enrollment counts |
| **Dashboard** | Program health snapshot (Manager Labs computes it, Dashboard displays it) |
| **Academy** | Film assignment completion rates, learning path progress |

---

## Analytics

| Signal | Why it matters |
|---|---|
| Director dashboard sessions per month | Is the buyer engaged with the analytics layer? |
| At-risk interventions logged per month | Are insights being actioned, not just viewed? |
| Season reports generated per season | Measures use as a stakeholder communication tool |
| Time from risk flag creation to intervention logged | Speed of response to at-risk signals |
| Program health score trend (all orgs) | Platform-level health of customer programs |

**Product KPI**: Directors take at least one action from a Manager Labs insight per month. **Quality signal**: At-risk intervention rate (interventions logged / flags generated) >= 70%.

---

## Risks

| Type | Risk | Mitigation |
|---|---|---|
| **Complexity** | Computing 6 health components from 6 different slices in real time creates a slow dashboard | All health metrics are pre-computed nightly and cached. Dashboard reads from snapshots, not live queries. |
| **UX** | Showing coaches their effectiveness scores creates a surveillance dynamic that hurts trust | Frame as "coaching activity" not "performance review." No ranking between coaches visible to each other. Only directors see comparisons. |
| **Scope creep** | Every metric someone suggests becomes a "Manager Labs feature" — the page becomes overwhelming | Strict limit: 6 program health components, maximum 10 warning metric types, 6 risk trigger types. Any addition requires removing something. |
| **Technical** | At-risk model produces too many false positives — coaches get alert fatigue | Require 2+ triggers before a flag is created. Set suppression to 7 days. Monitor intervention-to-flag ratio; tune thresholds monthly. |

---

## Acceptance Criteria

- [ ] Program health score updates within 24 hours of any change to underlying data
- [ ] At-risk flags fire correctly based on documented trigger thresholds (verified with test data)
- [ ] Interventions log correctly and suppress the risk flag for 7 days
- [ ] Coach effectiveness metrics compute correctly for a 7-day and season-to-date period
- [ ] Season report generates a valid PDF with real data for all 7 sections
- [ ] Director can see all coaches' effectiveness metrics; coaches cannot see each other's
- [ ] Warning metrics dashboard shows no false positives on a fully compliant test org
- [ ] All Manager Labs pages load from pre-computed data — no real-time queries on page load

---

## Vertical Slice Implementation Notes

```
client/src/features/manager-labs/
  types.ts         — AtRiskFlag, RiskTrigger, Intervention, CoachEffectivenessMetric,
                     SeasonReportExport types
  hooks.ts         — useProgramHealth(), useAtRiskPlayers(), useCoachEffectiveness(),
                     useWarningMetrics(), useDevelopmentSynthesis(), useSeasonReport()
  compute.ts       — computeRiskScore(), computeEffectivenessScore(),
                     identifyWarnings(), filterByThreshold()
  mock.ts          — mock health snapshots, at-risk flags, effectiveness data
  index.ts
  components/      — as listed above

server/modules/manager-labs/
  routes.ts        — GET endpoints for all analytics views; POST for interventions
  service.ts       — aggregation logic pulling from all domain repos
  risk.ts          — risk score computation (called by nightly Inngest job)
  effectiveness.ts — coach effectiveness computation (called by weekly Inngest job)
  report.ts        — season report generation + PDF export (puppeteer or similar)
```

**Public exports**: `ProgramHealthSnapshot` type (used by Dashboard), `AtRiskFlag` type (used by Dashboard for alert counts), `useAtRiskPlayers()` (imported by Dashboard coach view).

**What stays internal**: Risk computation algorithm, effectiveness weighting formula, report template structure.

---
---

# SLICE 5: Coaching

## Purpose

**Business outcome**: Coaching is the primary daily use driver for coaches — the slice that justifies the subscription on its own. If this slice is excellent, coaches evangelize the platform to other coaches. If it's mediocre, they continue using Hudl for film and a Google Doc for practice planning, and HoopsOS is just another admin tool.

**User problem**: Coaching workflow is currently fragmented across 4–6 tools: a video platform, a whiteboard app, a note-taking app, a scheduling app, and a communication tool. Observations made during film are disconnected from what gets planned for practice. What gets planned for practice is disconnected from player development. Coaches spend more time managing the tools than coaching.

**Platform moat**: The Film → Coaching Action → Practice Plan → IDP connection is what no other product has built. Each of those is a valuable feature alone. Connected, they create a coaching intelligence loop that produces measurably better development outcomes. The loop is the moat.

---

## Primary Users

| Role | Motivation | Success criteria |
|---|---|---|
| **Head Coach** | Turn film observations into player improvements with minimal administrative overhead | Creates at least 1 coaching action per film session; practice plans reflect open actions |
| **Assistant Coach** | Break down film quickly and surface key clips for the head coach | Film queue reviewed and annotated before the next day's practice |
| **Player** | See and act on the feedback coming from their coach | Coaching actions are understood and responded to |

---

## Core Jobs to Be Done

1. **Coach**: "Watch film, tag a moment, create an action for a player — all in one flow without leaving the video."
2. **Coach**: "Build a practice plan that reflects what I saw on film and who is healthy enough to participate."
3. **Coach**: "Know my playbook is current and that my players actually know the plays."
4. **Coach**: "Have a real-time view of my team's readiness before practice starts."
5. **Coach**: "Run practice with the plan in hand — timer, checklist, and notes — without paper."

---

## Feature Set

### MVP

- **Film Library**: Grid of uploaded sessions. Filter by: type (game/practice/scouting), date, team. Upload via Mux direct upload. Processing status indicator.
- **Film Session Detail**: Mux video player with keyboard shortcuts (space = play/pause, J/L = ±10s, I/O = mark in/out). Timeline with annotation markers. Annotation panel: timestamped text notes with player tags. TelestrationCanvas overlay for drawing.
- **ClipActionBar**: Persistent bar that appears when annotations exist. Actions: assign_clip, recommend_drill, add_to_idp, add_to_wod, request_reupload, mark_addressed. Selecting an action opens a targeted form.
- **Film Queue**: Pending film review items. Shows: session title, uploaded date, AI analysis status, assignee. Coach can filter by status (pending/in_review/reviewed).
- **Coaching Actions Feed**: All open coaching actions across the roster. Grouped by player. Sortable by priority, due date, creation date. Bulk close option.
- **Practice Plan Builder**: Block-based plan with drag-and-drop ordering (dnd-kit). Blocks: warm-up, drill, scrimmage, walkthrough, conditioning, break. Each block: name, duration, linked drill, focus note. Running total duration with budget warning.
- **Practice Execution Mode**: Live view of the plan during practice. Block timer (countdown). Tap to advance. Quick note capture. Readiness grid visible as a sidebar.
- **Practice Review**: Post-session debrief form: what worked, what to adjust, player performance notes, session rating.
- **Team Readiness Dashboard**: Full-team readiness grid with player status, check-in details, override capability.

### Strong V1

- **AI Film Analysis**: Background Inngest job processes film segments through Gemini API. Returns: detected events, player activity, suggested tags. Coach reviews AI output ("corroborate" or "dispute"). Disputed observations are logged and feed model improvement.
- **Film Playlists**: Curated clip collections by theme (defensive lapses, offensive sets, highlight moments). Shareable within the org.
- **Playbook Studio V3**: Action-based animated play canvas. Player tokens, movement paths, cut styles, ball movement. Animation timeline with step-through and continuous play. Play organized by category (offense, defense, BLOB, SLOB, press).
- **Play Quiz + Study**: Already covered in Academy slice — Coaching slice creates the quiz and links plays.
- **Coaching Journal**: Private coach notes tied to sessions, players, or standalone. Not visible to players or parents. Separate from coaching actions.
- **Practice Templates**: Save a plan as a template. Apply template to a new date. Edit from template. Common templates: Game Day Walkthrough, Post-Game Recovery, Defensive Focus.
- **Game Day Mode**: Simplified game-day view — opponent scout, starting lineup card, play quick-reference, live substitution tracking.
- **Opponent Scout Report**: Structured scouting report for an upcoming opponent. Sections: personnel, tendencies, key plays, defensive schemes.

### Future Moat

- **AI practice plan generation**: Based on open coaching actions, readiness data, and season phase, AI generates a practice plan draft. Coach edits and publishes.
- **Film search across sessions**: Semantic search across all film annotations in the org. "Show me all clips where Marcus lost his defensive assignment." Returns timestamped clips across multiple sessions.
- **Live observation during practice**: Coach uses the app during live practice to log real-time observations (voice-to-text or quick tap form). Observations auto-convert to coaching actions.
- **Session load analytics**: Tracks planned vs. actual practice load. Over-season load curve to manage fatigue.
- **Playbook export to PDF**: Generate a formatted playbook PDF — cover, all plays by category, diagrams, descriptions. Used for team binders.

---

## Main User Flows

### Flow 1: Film session review → coaching action → practice impact (primary loop)

1. Coach uploads game film. Mux processes it. Film Library shows "Analyzed" status after AI job completes.
2. Coach opens session. Watches the first quarter.
3. At 4:23, coach notices Marcus's defensive stance is too upright. Coach clicks the annotation timeline → types "Stance — too upright, reaching instead of moving feet." Tags Marcus.
4. ClipActionBar appears. Coach taps "Recommend Drill." A form opens: player (Marcus, pre-filled), drill selector (opens drill library), priority (medium), due date.
5. Coach selects "Defensive Slide Drill" from the library. Submits.
6. The coaching action is created: type = `recommend_drill`, player = Marcus, status = `open`.
7. Next day, coach opens Practice Planner. Open coaching actions sidebar shows: "Marcus — Defensive stance drill." Coach adds the drill to the practice plan's defensive block.
8. After practice, coach marks the action as `resolved` with a note: "Marcus's stance improved significantly during drills today."
9. Action resolution rate ticks up. Manager Labs records it.

### Flow 2: Practice plan build → execution → review

1. Day before practice. Coach opens Practice Plan Builder. Creates new plan for tomorrow.
2. Adds blocks: 10-min warm-up, 15-min ball handling, 20-min defensive slides (Marcus's open action surfaced here), 20-min 5v5, 10-min free throws. Total: 75 minutes.
3. Readiness sidebar shows: 2 flagged players (light duty), 1 restricted (no contact). Coach adjusts — restricted player gets individual skill work block.
4. Coach saves and publishes plan. Assistant coaches receive a notification.
5. At practice, coach opens Execution Mode. First block timer starts. Tap "Done" after each block. Coach logs a note: "Ball handling drill — Marcus struggled with weak hand. Flag this."
6. After practice, coach opens Practice Review. Rates session 8/10. Notes: "Defensive intensity was high. Marcus's weak hand is a pattern — add to his IDP next week."
7. The practice review note surfaces as a coaching observation available for IDP creation later.

### Flow 3: Team Readiness Dashboard pre-practice

1. 60 minutes before practice. Coach opens Team Readiness.
2. Grid shows: 11 READY, 2 FLAGGED (fatigue 8+), 1 RESTRICTED (injury).
3. Coach taps Flagged player Jordan. Detail drawer: sleep 4.5hrs, soreness 8/10, fatigue 9/10. Yesterday had a game.
4. Coach taps "Override" — selects "Light Duty Today" as override type. Adds note: "Post-game fatigue — no contact drills." Saves.
5. Jordan's status updates to RESTRICTED (coach override). The override is visible to all coaching staff.
6. Coach opens Practice Planner — Jordan's override flag appears on her block assignments. Coach removes her from contact drills.

### Flow 4: Opponent scout report → game day

1. Three days before the game. Coach opens Scouting → "New Scout Report."
2. Fills in: opponent name (Toms River North), key personnel, tendencies (favors pick-and-roll, weak 3PT defense), key plays to prepare for.
3. Adds opponent film (if available) linked to the scout report.
4. Game day. Coach opens Game Day Mode. Sees: scout report summary, starting lineup card, quick-reference plays (swipe through).
5. Coach makes substitution notes during the game. References opponent plays when they run sets.

---

## UI Surfaces

### Pages

- `/coach/film` — `FilmLibraryPage.tsx` (exists)
- `/coach/film/queue` — `FilmQueuePage.tsx` (exists)
- `/coach/film/queue/:id` — `FilmQueueDetailPage.tsx` (exists)
- `/coach/film/:sessionId` — `FilmSessionDetail.tsx` (exists, has real Mux player + API call)
- `/coach/film/playlists` — `FilmPlaylistPage.tsx` (exists)
- `/coach/film/ai` — `AIFilmAnalysisHub.tsx` (exists)
- `/coach/film/corroborate` — `FilmCorroborationEntryPage.tsx` (exists)
- `/coach/actions` — `CoachActionsPage.tsx` (exists)
- `/coach/practice` — `PracticePlanBuilder.tsx` (exists, dnd-kit implemented)
- `/coach/practice/execute` — `PracticeExecutionPage.tsx` (exists)
- `/coach/practice/review` — `PracticeReviewPage.tsx` (exists)
- `/coach/playbook` — `PlaybookStudioV3.tsx` (exists, V3 animated canvas)
- `/coach/readiness` — `TeamReadinessPage.tsx` (exists)
- `/coach/journal` — `CoachingJournalPage.tsx` (exists)
- `/coach/scout/:opponentId` — `OpponentScoutPage.tsx` (exists)
- `/coach/game-day` — `GameDayPage.tsx` (exists)

### Modals / Drawers

- **ClipActionBar** — persistent bottom bar in film session; action type selector → contextual form
- **TelestrationCanvas** — drawing overlay on video (exists as component)
- **Player readiness detail drawer** — from readiness grid; shows full check-in + override controls
- **Readiness override modal** — type selector (Light Duty / No Contact / Full Rest / Medical Hold), note, expiry
- **Drill library drawer** — opens from practice plan block; searchable, filterable drill picker
- **Coaching action detail drawer** — full action detail, status update, note, IDP link
- **Film annotation panel** — right panel in session detail; annotation list + new annotation form
- **Corroboration review modal** — AI suggestion presented with "Confirm" / "Dispute" / "Skip"

### Reusable Local Components (owned by Coaching slice)

```
features/coaching/components/
  film/
    MuxVideoPlayer.tsx        — Mux embed with custom controls (exists in /components/film/)
    TelestrationCanvas.tsx    — drawing overlay (exists)
    ClipActionBar.tsx         — action type bar (exists)
    AnnotationPanel.tsx       — annotation list + composer
    FilmSessionCard.tsx       — library grid card
    AICorroborationCard.tsx   — AI suggestion with confirm/dispute
  practice/
    PlanBlock.tsx             — draggable practice block
    DrillPickerDrawer.tsx     — drill library in context
    BlockTimer.tsx            — countdown timer for execution mode
    ReadinessSidebar.tsx      — compact readiness grid in plan context
    PracticeLoadBar.tsx       — running total + budget warning
  readiness/
    TeamReadinessGrid.tsx     — full team status grid
    PlayerStatusPill.tsx      — compact READY/FLAGGED/RESTRICTED indicator
    ReadinessDetailDrawer.tsx — player drill-down
    OverrideModal.tsx         — coach override form
  playbook/
    PlayCanvasV3.tsx          — animated play canvas (exists in features/playbook/v3/)
    PlayCard.tsx              — play library card
    PlayCategoryNav.tsx       — category navigation sidebar
  actions/
    CoachingActionCard.tsx    — single action with status controls
    ActionsFeed.tsx           — grouped, filterable action list
    ActionDetailDrawer.tsx    — full action edit/resolve flow
```

---

## Data Model

All primary entities exist in schema. Key relationships:

```
FilmSession → FilmAnnotation (1:many)
FilmAnnotation → CoachingAction (1:many, via annotationId)
CoachingAction → IdpFocusArea (many:1, via idpFocusAreaId)
CoachingAction → DrillLibraryEntry (many:1, via add_to_wod type)
PracticePlan → PracticeBlock (1:many)
PracticeBlock → DrillLibraryEntry (many:1)
PracticePlan → PracticeExecution (1:1, after execution)
PracticeExecution → PracticeReview (1:1, after review)

// ReadinessOverride — needed to model coach overrides
ReadinessOverride {
  id:             string
  orgId:          string
  playerId:       string
  coachId:        string
  overrideType:   'light_duty' | 'no_contact' | 'full_rest' | 'medical_hold'
  reason:         string
  expiresAt:      timestamp    // override auto-expires
  createdAt:      timestamp
}

// Coaching action status transitions:
open → in_progress  (when assign_clip or recommend_drill is delivered)
open → resolved     (coach marks addressed)
open → dismissed    (coach decides not to pursue)
in_progress → resolved
in_progress → dismissed

// Practice plan status transitions:
draft → published   (coach publishes — assistants can now see)
published → executing (coach starts execution mode)
executing → executed
executed → reviewed (coach completes practice review)
```

---

## Business Logic

### Core rules

- **Film upload size limit**: Maximum 10GB per session file. Larger files require chunked upload via Mux's direct upload API.
- **AI analysis trigger**: AI analysis job fires automatically when a session status changes to `uploaded`. It does not re-run unless coach explicitly requests a re-analysis.
- **Coaching action auto-advance to `in_progress`**: When an `assign_clip` action is created, it moves to `in_progress` immediately (the assignment has been delivered). All other types stay `open` until the coach manually advances.
- **Readiness override expiry**: An override without an explicit expiry date expires after 24 hours. `medical_hold` overrides require a coach to explicitly remove them — they do not auto-expire.
- **Practice plan lock**: Once a plan moves to `executing` status, blocks cannot be deleted. They can only have notes added. This preserves an accurate record of what was actually planned.
- **Playbook play categories**: Each play must belong to exactly one category (offense, defense, BLOB, SLOB, press, special). No uncategorized plays.

### Permissions

- Any coaching staff member can create, edit, and annotate film sessions.
- Only the head coach can create readiness overrides of type `medical_hold`.
- Assistant coaches can create coaching actions but cannot resolve them — only mark as `in_progress`.
- Players cannot access the coaching actions feed, film library, or practice planner.
- Players can only see film assigned to them, their own readiness status, and plays assigned for study.

### Validation

- A coaching action of type `assign_clip` requires `playerId` and `clipId` (cannot assign a full session, only a clip).
- A coaching action of type `add_to_idp` requires an existing `IdpFocusArea` to link to.
- Practice plan blocks must have a duration > 0 minutes. Total plan duration must be > 10 minutes to be published.
- A readiness override cannot be applied to a player with status `READY` unless the coach adds an explicit reason.

### Notifications triggered

- **On coaching action created**: Target player receives a push + in-app notification.
- **On readiness override applied**: All coaching staff receive an in-app alert.
- **On practice plan published**: All assigned coaching staff receive a notification.
- **On film session AI analysis complete**: Coach who uploaded receives: "AI analysis ready for [session name]."
- **On coaching action overdue (3 days past due date)**: Coach receives a reminder.

---

## Integrations

| Adjacent slice | What Coaching needs |
|---|---|
| **Readiness** | Today's readiness status per player; override API |
| **Assessments** | IDP focus areas (for `add_to_idp` action type) |
| **Academy** | Drill library (for practice plan builder and `recommend_drill` action); film assignment creation |
| **Dashboard** | Open action count; film queue count; today's practice plan |
| **Manager Labs** | Action resolution rates; film session frequency; practice execution records |

**External services**:
- **Mux** — video upload, processing, streaming. Webhook for processing status.
- **OpenAI / Gemini** — AI film analysis. Called via Inngest background job, not in-request.

---

## Analytics

| Signal | Why it matters |
|---|---|
| Coaching actions created per film session | Primary product engagement metric |
| Action resolution rate and average time to resolve | Quality of the coaching loop |
| Practice plans published per week | Daily workflow adoption |
| Film sessions uploaded per month | Film feature engagement |
| AI corroboration rate (confirm vs. dispute) | AI quality signal |
| Practice execution mode usage rate | Are plans actually used in practice or just created? |
| Playbook plays created per org | Playbook adoption |

**Product KPI**: Coaches who use film create 3x more coaching actions than those who don't. **Quality signal**: AI corroboration confirmation rate > 70% (AI suggestions are accurate).

---

## Risks

| Type | Risk | Mitigation |
|---|---|---|
| **Complexity** | Mux integration + AI pipeline + telestration + dnd-kit practice builder is enormous — too much for one slice | Ship Film (upload + annotate + action) first. Playbook and Game Day are separate sub-releases. Practice builder ships before AI analysis. |
| **Technical** | AI film analysis at scale (1hr of game film per session × active teams) creates COGS pressure | AI analysis is opt-in. Default film experience is manual annotation only. AI is a premium feature with usage limits per tier. |
| **UX** | ClipActionBar with 6 action types is too many choices at the moment of observation | Group into 2 tiers: primary actions (assign clip, recommend drill) are always visible. Secondary actions (add to IDP, add to WOD, request reupload) are in an overflow menu. |
| **Scope creep** | Game Day Mode is a product of its own — live substitution tracking, score tracking, opponent adjustments | Game Day ships as a read-only view of scout report + play quick-reference. Live substitution tracking is a separate future feature. |

---

## Acceptance Criteria

- [ ] Film upload → Mux processing → playback working end-to-end with real video
- [ ] Coach can create a timestamped annotation with a player tag in under 30 seconds
- [ ] ClipActionBar creates a coaching action linked to the correct annotation and player; action appears in the actions feed immediately
- [ ] Practice plan builder saves blocks with correct order, durations, and linked drills
- [ ] Practice execution mode timer counts down correctly; tap-to-advance works on mobile
- [ ] Team readiness dashboard shows actual check-in data; override applies and persists correctly
- [ ] Coaching actions feed shows all open actions grouped by player with correct status
- [ ] AI analysis job fires after upload; corroboration UI presents AI results correctly
- [ ] No mock data in any Coaching page; all data from real API endpoints

---

## Vertical Slice Implementation Notes

```
client/src/features/coaching/
  types.ts         — FilmSession, FilmAnnotation, CoachingAction, PracticePlan,
                     PracticeBlock, PracticeExecution, ReadinessOverride types
  hooks.ts         — useFilmSessions(), useFilmSession(), useFilmQueue(),
                     useCoachingActions(), usePracticePlan(), useTeamReadiness(),
                     useReadinessOverride(), usePlaybook()
  store.ts         — Zustand store for practice plan builder state (drag-drop, local edits)
  compute.ts       — computePracticeDuration(), groupActionsByPlayer(),
                     derivePracticeLoad(), validatePlanReadiness()
  mock.ts          — film sessions, coaching actions, practice plans, readiness overrides
  index.ts
  components/      — all local components listed above

server/modules/
  film-analysis/   — already exists with 16 routes (most complete server module)
  coaching-actions/ — 8 routes; add resolve, dismiss, bulk actions
  practice-plans/  — 6 routes; add execution and review endpoints
  readiness/       — 6 routes; add override CRUD
```

**Public exports**: `CoachingAction` type and `useCoachingActions()` hook (used by Dashboard and Manager Labs), `ReadinessOverride` type (used by Readiness feature), `PracticePlan` type (used by Dashboard).

**What stays internal**: ClipActionBar form logic, practice plan drag-drop store, AI corroboration state, telestration canvas.

---
---

# SLICE 6: Admin / Billing

## Purpose

**Business outcome**: Admin and Billing is the operational backbone that justifies HoopsOS as the single system of record for a program. If coaches love the product but billing is still done in spreadsheets, the program director will never commit fully. Owning billing means owning the financial relationship — which is the stickiest possible integration.

**User problem**: Club programs currently manage billing through a patchwork of tools — bank transfers, Venmo, paper checks, SportsEngine payment forms. Families complain about unclear fee structures and missed receipts. Admins track payments manually in spreadsheets. Seasons are set up in one tool, rosters in another, billing in a third. Nothing talks to anything.

**Platform moat**: Once billing, registration, and season management are live in HoopsOS, switching costs become financial. Migrating billing history, open invoices, payment plans, and registration forms out of the platform is a significant operational event that programs will avoid.

---

## Primary Users

| Role | Motivation | Success criteria |
|---|---|---|
| **Club Admin** | Run the program's business operations without needing a separate accounting tool | All billing managed in HoopsOS; zero outstanding invoices older than 30 days without a reason |
| **Director** | Have financial visibility into program health | Can see collection rate, outstanding amounts, and season revenue in real time |
| **Parent / Guardian** | Pay easily, understand what they owe, and have a record of payments | Pays invoice in under 2 minutes; receives receipt automatically |
| **Head Coach** | Know who's paid up; not be involved in billing conversations | Sees a simple "paid/unpaid" indicator on the roster — no amounts |

---

## Core Jobs to Be Done

1. **Admin**: "Create and send a fee for the new season and collect payment online — no checks."
2. **Admin**: "Know which families haven't paid and follow up without building a spreadsheet."
3. **Admin**: "Set up a new season with teams, rosters, and registration in under an hour."
4. **Parent**: "Pay what I owe, see my payment history, and download a receipt."
5. **Director**: "See how much revenue the program has collected this season at a glance."

---

## Feature Set

### MVP

- **Season setup**: Create a season (name, date range, teams). Configure team-level details (level, capacity, assigned coaches). Associate a roster with each team.
- **Membership plans**: Define the fee structure for the season — one-time, monthly recurring, installment. Plan name, amount, due date logic.
- **Invoice creation**: Create an invoice for one or multiple players. Attach line items (membership fee, equipment, travel). Set due date. Invoice status: `draft → open → paid/overdue/void`.
- **Parent payment portal**: Parents see outstanding invoices, payment history. Pay via Stripe card or ACH. Download receipts.
- **Outstanding payments view**: Admin sees all unpaid invoices, filterable by due date, status, amount. One-tap "Send reminder" to the family.
- **Manual payment recording**: Admin can record cash, check, Zelle, Venmo payments. Updates invoice status without Stripe.
- **Season registration**: Simple registration form (name, grade, position, emergency contact, medical notes). Linked to a season and team. Admin reviews and approves.
- **Waiver templates**: Admin creates digital waiver content. Players/parents sign in-app. Timestamp and IP logged. Admin can verify signature status.

### Strong V1

- **Payment plans**: Create an installment schedule for a single invoice (e.g., $600 split into 3 × $200 monthly). Automatic payment reminders at each installment due date.
- **Re-enrollment flow**: Players from the previous season can re-enroll in the new season with a single click — pre-filled form with prior year's data.
- **Fee requests (one-time)**: Admin creates an ad-hoc fee for a specific player or the whole team (e.g., tournament fee, equipment replacement). Not tied to a membership plan.
- **Payments dashboard**: Total billed, total collected, collection rate, overdue balance. Revenue trend chart by month.
- **Seat management**: Manage coaching staff seats on the platform subscription. Add/remove seats. Billing per seat tied to org's HoopsOS subscription.
- **Admin memberships**: Org's own HoopsOS subscription status, plan tier, feature access, renewal date.
- **Forms manager**: Admin creates custom forms beyond waivers — medical history, emergency contacts, travel consent. Assigned to players at registration.
- **Document library**: Upload and manage org-level documents (team handbook, practice schedule PDF, tournament bracket). All team members can access.

### Future Moat

- **Stripe ACH pull debit**: Auto-collect on payment plan dates without parent action required (with consent captured at registration).
- **Sibling discounts**: Discount logic when the same family has multiple players enrolled.
- **Early payment discount**: Admin configures a discount percentage for families who pay the full amount before a cutoff date.
- **Expert/trainer payouts**: Track compensation owed to contracted coaches or trainers. Admin logs training sessions; payout calculated automatically.
- **Tax reporting export**: 1099 export for contracted coaches. Total amounts by coach for the calendar year.
- **Multi-season reporting**: Revenue comparison across seasons. Year-over-year growth in enrollment and revenue.

---

## Main User Flows

### Flow 1: Admin sets up a new season (happy path)

1. Admin opens Admin → "New Season." Enters season name ("Spring 2026"), start date (March 1), end date (June 30).
2. Adds 3 teams: U14 Boys, U16 Boys, U16 Girls. Sets capacity for each.
3. Assigns head coaches and assistant coaches to each team.
4. Creates a membership plan: "Spring 2026 Season — $650 due March 15."
5. Sends registration invitations to families from last season (re-enrollment flow).
6. Opens registration to new families via a shareable link.

### Flow 2: Admin creates and sends invoice (happy path)

1. Admin opens Billing → "Create Invoice." Selects player Marcus Davis.
2. Adds line item: "Spring Season Membership" — $650. Due: March 15.
3. Previews invoice. Clicks "Send." Marcus's parent receives an email + in-app notification.
4. 3 days before due date, automatic reminder fires. Parent receives push notification.
5. Parent opens billing portal. Sees the invoice. Taps "Pay Now." Stripe card form appears. Pays $650.
6. Invoice status changes to `paid`. Parent receives receipt email automatically.
7. Admin's outstanding payments view updates — Marcus's row is gone.

### Flow 3: Admin chases overdue invoices

1. March 16 (day after due date). Admin opens Outstanding Payments. Filters: "Overdue."
2. 6 families show overdue invoices. Total overdue: $3,200.
3. Admin selects all 6. Taps "Send Reminder." System sends a templated reminder to each family.
4. Admin sees one family (Carter family) has been overdue for 3 previous seasons. Adds a note: "Call directly — history of late payment." Logs the note against the invoice.
5. Over the next week, 4 of 6 pay. Admin manually records a cash payment for one family.
6. One invoice is still unpaid at 30 days. Admin changes status to "Payment Plan" and creates a 2-installment plan.

### Flow 4: Parent pays installment on a payment plan

1. Parent opens HoopsOS app. Dashboard shows billing alert: "Installment #2 due in 3 days — $200."
2. Parent taps the billing card → goes to billing portal.
3. Sees the payment plan: Installment 1 (paid March 15, $200), Installment 2 (due April 15, $200 — due soon), Installment 3 (due May 15, $200).
4. Parent taps "Pay Installment 2." Stripe form appears (card on file from installment 1 is shown). Taps "Pay."
5. $200 charged. Invoice status updates: "2/3 installments paid — $200 remaining."
6. Receipt generated automatically.

### Flow 5: New player registers for the season

1. Coach shares a registration link with a prospective new family.
2. Family opens the link — public registration form. No login required for the initial form.
3. Form asks: player name, birth date, grade, position, parent name, email, phone, emergency contact, medical notes, preferred team (if multiple options).
4. Family submits. Admin receives in-app notification: "New registration — Devon Carter."
5. Admin opens Admin → Registrations. Reviews Devon's form. Taps "Approve" and assigns to the U16 Boys team.
6. An account creation invitation is sent to the family's email. They set a password. Devon appears on the U16 Boys roster.
7. Admin creates an invoice for Devon. First invoice in the system for this family.

### Flow 6: Waiver signing

1. Admin creates a waiver template: "Season Participation Liability Waiver — Spring 2026."
2. Assigns the waiver to all players on all teams. Deadline: February 28.
3. Each player's parent receives a notification: "Waiver signature required."
4. Parent opens app → Forms & Waivers → sees the waiver. Reads. Taps "Sign." Types their full name. Confirms.
5. Signature is stored with timestamp, IP, signed-by user ID, and waiver version.
6. Admin opens Forms Manager → sees 43/47 signed. The 4 unsigned are highlighted. Sends a reminder to those 4 families.

---

## UI Surfaces

### Pages

- `/admin` — `AdminDashboard.tsx` (exists)
- `/admin/season/setup` — `SeasonSetupPage.tsx` (exists)
- `/admin/seasons` — `SeasonManagementPage.tsx` (exists)
- `/admin/teams` — `AdminTeamsPage.tsx` (exists)
- `/admin/registrations` — `AdminRegistrationsPage.tsx` (exists)
- `/admin/billing` — `AdminBillingPage.tsx` (exists)
- `/admin/billing/outstanding` — `OutstandingPaymentsPage.tsx` (exists)
- `/admin/billing/dashboard` — `PaymentsDashboardPage.tsx` (exists)
- `/admin/memberships` — `AdminMembershipsPage.tsx` (exists)
- `/admin/forms` — `FormsManagerPage.tsx` (exists)
- `/admin/onboarding` — `OnboardingPage.tsx` (exists)
- `/admin/re-enrollment` — `ReEnrollmentPage.tsx` (exists)
- `/billing/portal` — `BillingPortal.tsx` (exists; coach's own HoopsOS subscription)
- `/billing/seats` — `SeatManager.tsx` (exists)
- `/billing/pricing` — `PricingPage.tsx` (exists)
- `/billing/payouts` — `ExpertPayouts.tsx` (exists)
- `/parent/billing` — `ParentBillingPage.tsx` (exists)
- `/parent/forms` — `ParentFormsPage.tsx` (exists)
- `/parent/registration` — `ParentRegistrationPage.tsx` (exists)
- `/payments/outstanding` — `OutstandingPaymentsPage.tsx`
- `/payments/create-fee` — `CreateFeeRequestPage.tsx` (exists)
- `/team/documents` — `DocumentLibraryPage.tsx` (exists)

### Modals / Drawers

- **Invoice composer modal** — player selector, line items, due date, send or save draft
- **Payment plan setup modal** — number of installments, amounts, due dates, auto-charge opt-in
- **Manual payment recorder modal** — amount, method (cash/check/Zelle/etc.), reference note, date
- **Invoice detail drawer** — full invoice, line items, payment history, status, notes
- **Fee request modal** — ad-hoc fee for one player or team-wide
- **Waiver signer modal** — full waiver text, signature input, confirm button
- **Registration review drawer** — admin reviews a new registration with approve/reject/request changes
- **Reminder composer modal** — customizable reminder message sent to overdue families
- **Payment plan installment detail** — shows all installments, which are paid, which upcoming

### Reusable Local Components (owned by Admin/Billing slice)

```
features/admin-billing/components/
  InvoiceCard.tsx           — invoice summary card (amount, status, due date)
  InvoiceStatusBadge.tsx    — color-coded status: draft/open/paid/overdue/void
  PaymentPlanTimeline.tsx   — visual installment schedule with paid/upcoming states
  OutstandingRow.tsx        — one overdue invoice in the outstanding table
  WaiverSignatureStatus.tsx — signed/unsigned indicator per player
  RegistrationReviewCard.tsx— new registration with approve/reject actions
  SeasonCard.tsx            — season overview card with team count and dates
  TeamSetupRow.tsx          — one team in the season setup form
  PaymentMethodBadge.tsx    — cash/card/ACH/Zelle/etc. indicator
  BillingKPICard.tsx        — single metric card (total billed, collection rate, etc.)
  DocumentCard.tsx          — org document in the library with download link
```

---

## Data Model

All primary billing entities exist in `shared/db/schema/billing.ts`. Key additions:

```typescript
// Registration (extends existing memberships schema)
Registration {
  id:            string
  orgId:         string
  seasonId:      string
  teamId:        string | null   // assigned on approval
  playerId:      string | null   // created on approval
  status:        'pending' | 'approved' | 'rejected' | 'withdrawn'
  formData: {
    playerName:       string
    birthDate:        date
    grade:            string
    position:         string
    parentName:       string
    email:            string
    phone:            string
    emergencyContact: string
    medicalNotes:     string
    preferredTeam:    string | null
  }
  submittedAt:   timestamp
  reviewedAt:    timestamp | null
  reviewedBy:    string | null
}

// Waiver template and signature (exists in schema/waivers.ts)
// Already modeled — see shared/db/schema/waivers.ts

// Fee request (ad-hoc, outside membership plan)
FeeRequest {
  id:          string
  orgId:       string
  createdBy:   string        // coachId or adminId
  scope:       'individual' | 'team' | 'all'
  playerIds:   string[]      // specific players if individual
  teamId:      string | null // if team scope
  description: string
  amount:      integer       // cents
  dueAt:       timestamp
  createdAt:   timestamp
}
```

**Invoice status state machine**:
```
draft → open           (admin sends)
open → paid            (full payment received)
open → partial         (partial payment received)
open → overdue         (past due date, nightly Inngest job)
open → void            (admin voids)
partial → paid         (remaining balance collected)
partial → overdue      (past due date)
overdue → paid
overdue → write_off    (admin decision)
paid → refunded        (Stripe refund processed)
```

---

## Business Logic

### Core rules

- **Invoice creation requires a player**: Invoices cannot exist without a linked `playerId`. This ensures every financial obligation is traceable to a family.
- **Payment plan constraint**: Total installment amounts must equal the invoice amount exactly. No rounding tolerance.
- **Overdue computation**: Nightly Inngest job runs at midnight; any invoice with `dueDate < today` and `status = 'open'` or `status = 'partial'` transitions to `overdue`.
- **Stripe webhooks**: Payment intent succeeded → invoice marked `paid` or `partial`. Payment failed → alert sent to parent and admin. Dispute created → invoice flagged with `disputed` status on the payment record.
- **Manual payment recording**: When an admin records a manual payment, the payment is added but the invoice doesn't automatically move to `paid` — the admin must confirm the total balance is settled. Prevents premature closure.
- **Waiver version control**: When admin updates a waiver template, it creates a new version. All prior signatures remain valid against the version they signed. New players must sign the current version.
- **Registration approval creates player record**: On admin approval of a registration, if no `playerId` exists for the email, a new player account is created and the family receives an invitation.

### Permissions

- Club Admin can create/edit all invoices, payment plans, and seasons. Can see all payment data.
- Director can view all billing data but cannot create invoices or send reminders without Admin role.
- Head Coaches see a simplified "paid/unpaid" flag on roster — no dollar amounts.
- Parents see only their own invoices, payment history, and forms. Never see other families' data.
- Players see the same as parents for billing — simplified, no amounts (age-appropriate).

### Validation

- Invoice total must be > $0.
- Payment plan must have 2–12 installments.
- Season must have a start date before end date.
- A waiver cannot be signed on behalf of a player over 18 by a parent — must be self-signed.
- Registration form email must be unique within the org for new registrations.

### Notifications triggered

- **On invoice sent**: Parent receives push + email with invoice amount and due date.
- **3 days before due date**: Automatic reminder push to parent.
- **On invoice overdue (nightly)**: Admin receives alert listing newly overdue invoices.
- **On successful payment**: Parent receives receipt email with PDF attachment.
- **On Stripe payment failed**: Parent receives immediate push + email; admin receives alert.
- **On registration submitted**: Admin receives in-app notification.
- **On waiver signature due in 7 days**: Parent receives reminder.
- **On registration approved**: Family receives email invitation to create account.

---

## Integrations

| Adjacent slice / service | What Admin/Billing needs |
|---|---|
| **Roster** | `playerId` for all invoice creation; player status from roster |
| **Dashboard** | Outstanding invoice count and amount surfaces on parent and director dashboard |
| **Manager Labs** | Collection rate, enrollment counts, season revenue for analytics |
| **Stripe** | Checkout Sessions, Payment Intents, Customer Portal, Webhooks, ACH |
| **Mux** | None — not used in this slice |
| **Email** | Transactional emails for invoices, receipts, registration confirmations (Resend or SendGrid) |

---

## Analytics

| Signal | Why it matters |
|---|---|
| Invoice collection rate per season | Primary Admin/Billing health metric |
| Days to payment from invoice sent | Measures how frictionless the payment experience is |
| Stripe vs. manual payment ratio | Measures digital payment adoption |
| Registration approval time (submission → approved) | Admin efficiency metric |
| Waiver completion rate per season | Compliance metric |
| Re-enrollment rate (prior season → new season) | Program retention metric |

**Product KPI**: 90% of invoices collected within 30 days of due date. **Quality signal**: Average days to payment < 7 for families with Stripe payment methods on file.

---

## Risks

| Type | Risk | Mitigation |
|---|---|---|
| **Complexity** | Stripe integration (checkout, webhooks, customer portal, ACH, disputes) is significant engineering investment | Ship card payment first (Stripe Checkout is minimal integration). Payment plans, ACH, and the customer portal are V1.1 additions. |
| **UX** | Billing features designed for admins don't translate to the parent-facing experience | Parent billing portal is a separate design track from admin billing tools. Two audiences, two UX patterns. |
| **Technical** | Overdue computation and webhook handling must be idempotent — Stripe may retry webhook events | All webhook handlers check for idempotency key before processing. Overdue Inngest job is idempotent (checks current status before updating). |
| **Scope creep** | Every program wants custom billing features — multi-pay, discounts, proration, tax | Scope-gate hard: core billing is flat fee, installment plans, and manual recording. Discounts, proration, and tax are V2. |

---

## Acceptance Criteria

- [ ] Admin can create a season with 3 teams and assign coaches in under 10 minutes
- [ ] Invoice is created, sent, and received by parent as an email + in-app notification within 60 seconds
- [ ] Parent can pay via Stripe card in under 4 taps; receipt email received within 2 minutes of payment
- [ ] Stripe webhook correctly updates invoice status on successful payment
- [ ] Nightly Inngest job correctly marks overdue invoices; no false positives on paid invoices
- [ ] Manual payment recording updates invoice status correctly without triggering a Stripe event
- [ ] Payment plan installments track correctly as each installment is paid
- [ ] Waiver signatures are stored with timestamp, IP, signer userId, and waiver version
- [ ] Registration form submission creates an admin review item; approval creates a player record and sends invitation
- [ ] Admin outstanding payments view shows accurate data refreshed within 5 minutes of any payment
- [ ] Coach roster view shows only "paid/unpaid" indicator — no dollar amounts visible

---

## Vertical Slice Implementation Notes

```
client/src/features/admin-billing/
  types.ts         — Season, Team, Registration, FeeRequest, Invoice, Payment,
                     PaymentPlan, WaiverTemplate, WaiverSignature types
  hooks.ts         — useSeason(), useTeams(), useRegistrations(), useInvoices(),
                     usePayments(), usePaymentPlan(), useWaivers(), useFeeRequests()
  compute.ts       — computeCollectionRate(), computeInstallmentSchedule(),
                     isInvoiceOverdue(), groupInvoicesByStatus()
  mock.ts          — sample seasons, invoices, registrations, payment plans
  index.ts
  components/      — as listed above

server/modules/
  seasons/         — 7 routes (exists); add season setup wizard endpoint
  teams/           — 8 routes (exists)
  registrations/   — 6 routes (exists)
  invoices/        — 12 routes (exists); add payment plan endpoints
  payments/        — add payment recording, Stripe webhook handler
  waivers/         — 4 routes (exists); add version management
```

**Public exports**: `Invoice` type (used by Dashboard for parent billing alert), `Season` type (used by Coaching and Assessments for season-scoping queries), collection rate metric (used by Manager Labs).

**What stays internal**: Stripe webhook processing logic, installment schedule computation, overdue detection logic, waiver version comparison.

**Do not share yet**: The billing `BillingAdmin` dev tool and the webhook simulator. These are internal tools that should never be accessible to org-level users. Gate behind a system admin role, not org admin.

---

*End of HoopsOS Vertical Slice Product Specs*  
*Six slices: Dashboard · Academy · Assessments · Manager Labs · Coaching · Admin/Billing*  
*May 2026*
