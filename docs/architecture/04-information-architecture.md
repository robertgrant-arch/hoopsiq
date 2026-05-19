# HoopsOS — Information Architecture Specification
## Navigation, Sitemap, Routes, Search, and Cross-Linking Design

> Principal IA Design  
> Grounded in the VSA slice specs and existing codebase  
> May 2026

---

## Design Principles

Before the spec: these principles override every individual decision.

1. **Nav reflects goals, not features.** A coach nav item is not "Film" — it is "Coach" (the coaching workflow). The feature lives inside the goal.
2. **Maximum five L1 items.** Every role sees exactly five primary nav items. Never six. Overflow lives in a More sheet or settings.
3. **The primary nav item tells you where you are.** You should be able to orient yourself in the app by reading one word in the nav.
4. **Cross-links follow workflow, not information hierarchy.** A link from a coaching action to an IDP is legitimate. A link from an invoice to a readiness chart is not.
5. **Isolation protects mental models.** Billing does not contaminate coaching tools. Admin settings do not appear inside development views. When in doubt, do not add the cross-link.
6. **Role changes the whole nav, not just which items are visible.** A player and a head coach are in fundamentally different apps that happen to share a backend.

---

## 1. Top-Level Navigation by Role

### Nav slot assignments (L1)

Each role owns exactly five L1 slots. The label names user goals.

| Role | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Slot 5 |
|---|---|---|---|---|---|
| **Player** | Home | Grow | Learn | Schedule | Inbox |
| **Assistant Coach** | Home | Film | Practice | Players | Learn |
| **Head Coach** | Home | Coach | Team | Grow | Inbox |
| **Director / Club Director** | Home | Program | Teams | Ops | Staff |
| **Org Admin** | Home | Seasons | Billing | Members | Settings |
| **Content Admin** | Home | Content | Programs | Certs | Settings |
| **Parent / Guardian** | Home | Child | Billing | Schedule | Inbox |
| **Recruiter (external)** | Home | Search | Saved | Requests | — |

**Icons** are chosen to be recognizable without the label on mobile. Each L1 slot maps to exactly one icon that never changes across contexts.

| Slot label | Icon | Rationale |
|---|---|---|
| Home | `LayoutDashboard` | Universal "dashboard" meaning |
| Coach | `Film` | The coaching workflow starts with film |
| Team | `Users` | People — the roster |
| Grow | `TrendingUp` | Upward development |
| Learn | `BookOpen` | Education and study |
| Film | `Film` | Same as Coach for assistant role |
| Practice | `ClipboardList` | The practice plan format |
| Players | `Users` | Assigned players |
| Program | `Activity` | Program-level analytics/health |
| Teams | `Flag` | Multi-team management |
| Ops | `Package` | Operations machinery |
| Staff | `Shield` | Staff management and accountability |
| Seasons | `CalendarDays` | Time-bounded seasons |
| Billing | `CreditCard` | Money and payments |
| Members | `Database` | Record-keeping |
| Settings | `Settings` | Configuration |
| Child | `Heart` | Parent's child — care |
| Schedule | `Calendar` | Time and events |
| Inbox | `Inbox` | Messages and notifications |
| Search | `Search` | Player discovery for recruiters |
| Saved | `Star` | Watchlist |
| Requests | `Bell` | Access requests |
| Content | `Layers` | Curriculum content |
| Programs | `Building` | Client programs |
| Certs | `Award` | Certifications |

---

## 2. Secondary Navigation (L2) per Section

### HEAD COACH nav (full specification)

**L1: Home**
No L2. Single page — the Command Center dashboard.

**L1: Coach** (the coaching workflow loop)
```
L2:
  Film Room      → film library, upload, AI queue
  Actions        → open coaching actions feed + journal
  Practice       → plan builder, drill library, WOD, execution, review
  Playbook       → V3 studio, play library, opponent scout, game day
```

**L1: Team**
```
L2:
  Readiness      → team readiness grid + overrides
  Roster         → player list → player profiles
  Assess         → quick assess, assessment events, benchmarks
  Schedule       → team calendar, events, absences, tournaments
```

**L1: Grow** (development + education)
```
L2:
  Development    → IDP overview, IDP generator, development synthesis
  Academy        → learning paths, certifications, cues, terminology
  Recruiting     → dossier builder, scouting hub
  Program        → at-risk interventions, coaching impact (subset)
```

**L1: Inbox**
No L2. Single page with tabs: Direct Messages · Announcements · Broadcasts.

---

### ASSISTANT COACH nav

**L1: Home** — simplified coach dashboard (film queue, open actions for assigned players only)
No L2.

**L1: Film** 
```
L2:
  Library        → all sessions
  My Queue       → sessions assigned to me for review
  Playlists      → curated clip collections
  AI Hub         → AI analysis corroboration view
```

**L1: Practice**
```
L2:
  Plans          → practice plans I've authored or been added to
  Drills         → drill library
  WOD            → workout planner
  Cues           → my cue library
```

**L1: Players** (assigned players only)
```
L2:
  Roster         → my assigned players
  Readiness      → readiness status for my players
  Assessments    → assessments I've run
  Development    → IDP status for my players
```

**L1: Learn** (my own education)
```
L2:
  My Paths       → my assigned learning paths
  Certifications → my certifications
  Terminology    → program terminology glossary
  Journal        → my coaching journal
```

---

### PLAYER nav

**L1: Home** — today view: check-in CTA, today's event, top assignment, top IDP focus

**L1: Grow** (my development)
```
L2:
  My Plan        → active IDP — focus areas, milestones, drill links
  Skills         → skill history, velocity charts, assessment scores
  Timeline       → development timeline — visual milestone history
  Resume         → development resume (recruiter-facing summary)
```

**L1: Learn** (academy — what I'm working on)
```
L2:
  Assignments    → film clips assigned to me
  Plays          → play study + quizzes
  WOD            → my workout of the day
  Highlights     → my uploaded film and highlight clips
```

**L1: Schedule**
```
L2:
  Calendar       → team calendar view
  Availability   → my availability submissions
  Absences       → my absence requests
```

**L1: Inbox**
No L2. Single page: Direct Messages · Announcements.

---

### DIRECTOR nav

**L1: Home** — program health dashboard

**L1: Program** (Manager Labs)
```
L2:
  Health         → program health score + components
  Warnings       → warning metrics dashboard
  At-Risk        → at-risk player interventions
  Development    → development synthesis, VDV command center
  Reports        → season reports, coaching impact reports
```

**L1: Teams** (multi-team view)
```
L2:
  Overview       → all teams at a glance — readiness, billing, enrollment
  [Team 1]       → drill into individual team view
  [Team 2]       → drill into individual team view
  [+ more teams dynamically]
```

**L1: Ops** (operational backbone)
```
L2:
  Seasons        → season management, setup wizard
  Billing        → payments dashboard, outstanding, plans
  Enrollment     → registrations, re-enrollment
  Waivers        → waiver status, compliance
```

**L1: Staff** (coaching staff management)
```
L2:
  Overview       → all staff — roles, teams, activity
  Effectiveness  → coach effectiveness dashboard
  Learning       → staff learning path progress, certifications
  Roster Setup   → who coaches which team
```

---

### ORG ADMIN nav

**L1: Home** — admin dashboard: open tasks, billing alerts, pending registrations

**L1: Seasons**
```
L2:
  Active Season  → current season overview
  Setup          → season setup wizard
  Past Seasons   → archived seasons
  Re-enrollment  → re-enrollment campaign management
```

**L1: Billing**
```
L2:
  Invoices       → all invoices with status
  Outstanding    → overdue and unpaid
  Payment Plans  → installment plans
  Plans          → membership plan definitions
  Payouts        → expert / trainer payouts
  Dashboard      → revenue KPIs
```

**L1: Members**
```
L2:
  Roster         → all players with status
  Accounts       → user accounts management
  Registrations  → pending and approved registrations
  Waivers        → waiver templates + signature status
  Forms          → custom forms manager
  Documents      → org document library
```

**L1: Settings**
```
L2:
  Org Profile    → org name, logo, timezone, contact
  Roles          → role definitions + permission matrix
  Seats          → coaching staff seats on platform subscription
  Integrations   → connected services (Stripe, Mux, wearables)
  Audit Log      → full action audit trail
  Billing        → HoopsOS subscription management
```

---

### PARENT nav

**L1: Home** — parent dashboard: child summary card, billing alert, today's schedule
**L1: Child** — development view: IDP read-only, attendance, readiness trend, recent notes
**L1: Billing** — billing portal: pay invoices, view history, receipts, payment plans
**L1: Schedule** — family calendar with event details and location
**L1: Inbox** — direct messages + announcements

---

## 3. Dashboard Variants by User Type

### Coach Dashboard (Home)
```
┌─────────────────────────────────────────────────────┐
│ Command Strip: [Today's date] · [Next event] · [4d] │
├───────────────────────┬─────────────────────────────┤
│ READINESS GRID        │ FILM QUEUE (sidebar)         │
│ ●●●●●●●●○○○ 11/13    │ · Barnegat vs TR — 3 clips  │
│ 2 flagged · 1 restr.  │ · Tri-State Showcase        │
├───────────────────────┤ · Monday Practice            │
│ ACTION LANES          ├─────────────────────────────┤
│ ┌ Open Actions (4) ─┐ │ DEV ALERTS (sidebar)        │
│ │ Marcus — stance   │ │ · Marcus: IDP gap 18d       │
│ │ Jordan — release  │ │ · Devon: no checkin 3d      │
│ └───────────────────┘ │ · Tyler: milestone overdue  │
│ ┌ Film Queue (3) ───┐ ├─────────────────────────────┤
│ │ Barnegat — review │ │ QUICK ACTIONS               │
│ │ Showcase — 2 new  │ │ [Film Review] [Plan]        │
│ └───────────────────┘ │ [Observe]   [Readiness]    │
│ ┌ Upcoming (2) ─────┐ └─────────────────────────────┘
│ │ Practice 3:30pm   │
│ │ Game @ TR Fri 6pm │
│ └───────────────────┘
└─────────────────────────────────────────────────────┘
```
**Primary metric**: Check-in completion rate for today.  
**First action**: Tapping a readiness dot opens the player detail drawer without leaving the dashboard.

---

### Player Dashboard (Home)
```
┌─────────────────────────────────────────────────────┐
│ Good morning, Marcus 👋                              │
│ [CHECK IN FOR TODAY — tap to submit]                │
├─────────────────────────────────────────────────────┤
│ TODAY                                               │
│ 📍 Practice · 3:30pm · Johnson Gym                 │
├─────────────────────────────────────────────────────┤
│ MY FOCUS (from IDP)                                 │
│ Contact Finishing  6→8  due May 15                 │
│ [Drill assigned: Chair Drill]                       │
├─────────────────────────────────────────────────────┤
│ ASSIGNMENTS                                         │
│ 📽 Coach Taylor assigned a clip — due tonight       │
│ 📋 Play Quiz: Horns — due before game Friday        │
└─────────────────────────────────────────────────────┘
```
**Primary metric**: Check-in submitted today (yes/no).  
**First action**: Check-in CTA is the biggest element on the screen if not yet submitted.

---

### Parent Dashboard (Home)
```
┌─────────────────────────────────────────────────────┐
│ Marcus Johnson · U16 Boys                           │
│ ● READY today · Attendance 80% this month          │
├─────────────────────────────────────────────────────┤
│ UPCOMING                                            │
│ Practice today · 3:30pm · Johnson Gym              │
│ Game Friday · 6:00pm · vs Toms River               │
├─────────────────────────────────────────────────────┤
│ DEVELOPMENT THIS WEEK                               │
│ Coach Taylor updated Marcus's IDP · 2 days ago     │
│ Contact Finishing: 5 → 6 ↑                        │
├─────────────────────────────────────────────────────┤
│ BILLING ALERT ⚠️                                    │
│ Invoice #12 — $350 due in 3 days                   │
│ [Pay Now]                                           │
└─────────────────────────────────────────────────────┘
```
**Primary metric**: Child's readiness status today and outstanding billing.  
**First action**: Billing CTA or message preview.

---

### Director Dashboard (Home)
```
┌─────────────────────────────────────────────────────┐
│ Program Health                    71/100 (↓3 vs wk) │
│ ████████████████████░░░░░░░                        │
├──────────┬──────────┬──────────┬────────────────────┤
│ Readiness│ IDP      │ Actions  │ Billing            │
│ 61% ↓   │ 58% ↓   │ 82% →   │ 94% →              │
│ [drill ↗]│ [drill ↗]│          │                    │
├─────────────────────────────────────────────────────┤
│ ⚠ WARNING FLAGS                                     │
│ · 3 players at risk — no activity 30d              │
│ · Coach Martinez: check-in compliance 48%          │
│ · 4 overdue invoices — total $1,800                │
├─────────────────────────────────────────────────────┤
│ ENROLLMENT                                          │
│ 47 active · 12 in registration pipeline            │
└─────────────────────────────────────────────────────┘
```
**Primary metric**: Program health score with week-over-week delta.  
**First action**: Any warning flag tapped opens the relevant Manager Labs view.

---

### Admin Dashboard (Home)
```
┌─────────────────────────────────────────────────────┐
│ OPEN TASKS                                          │
│ · 4 pending registrations to review                │
│ · 6 overdue invoices ($2,400)                      │
│ · 8 waivers unsigned (deadline in 5 days)          │
├─────────────────────────────────────────────────────┤
│ BILLING SNAPSHOT                                    │
│ $42,300 billed · $40,100 collected · 95% rate      │
├─────────────────────────────────────────────────────┤
│ SEASON STATUS: Spring 2026                         │
│ Registration open · 47 enrolled · 3 teams          │
└─────────────────────────────────────────────────────┘
```
**Primary metric**: Open tasks that need admin action.  
**Design rule**: Admin dashboard shows a to-do list, not a health dashboard.

---

## 4. Key Page Inventory

Full page catalog with role access, primary action, and slice owner.

### Dashboard slice

| Page | URL | Roles | Primary action | Notes |
|---|---|---|---|---|
| Coach Dashboard | `/app/coach` | head_coach | Triage action lanes | Command center |
| Player Dashboard | `/app/player` | player | Submit check-in | Check-in CTA is #1 element |
| Parent Dashboard | `/app/parent` | parent_guardian | Pay invoice / read message | |
| Director Dashboard | `/app/director` | director_of_ops | Click into warnings | Links to Manager Labs |
| Admin Dashboard | `/app/admin` | admin | Action open tasks | To-do list format |
| Assistant Dashboard | `/app/assistant` | assistant_coach | Film queue + my actions | Simplified coach home |

---

### Coaching slice

| Page | URL | Roles | Primary action | Notes |
|---|---|---|---|---|
| Film Library | `/app/coach/film` | head_coach, assistant, video_coordinator | Open a session | Grid view |
| Film Session Detail | `/app/coach/film/:sessionId` | head_coach, assistant, video_coordinator | Annotate and create action | Mux player + TelestrationCanvas |
| Film Queue | `/app/coach/film/queue` | head_coach, assistant, video_coordinator | Mark reviewed | Priority-sorted |
| Film Queue Detail | `/app/coach/film/queue/:id` | head_coach, assistant | Review and act | Session-level review view |
| Film Playlists | `/app/coach/film/playlists` | head_coach, assistant | Open playlist | Themed clip collections |
| AI Analysis Hub | `/app/coach/film/ai` | head_coach | Corroborate AI suggestions | Separate from film player |
| Coaching Actions Feed | `/app/coach/actions` | head_coach, assistant | Resolve or update action | Grouped by player |
| Coaching Journal | `/app/coach/journal` | head_coach, assistant | Write journal entry | Private to the coach |
| Practice Plan Builder | `/app/coach/practice` | head_coach, assistant, strength_coach | Build and publish plan | dnd-kit blocks |
| Practice Execution | `/app/coach/practice/:planId/execute` | head_coach, assistant | Advance blocks + take notes | Live mode |
| Practice Review | `/app/coach/practice/:planId/review` | head_coach | Rate session + debrief | Post-practice |
| Drill Library | `/app/coach/drills` | head_coach, assistant, strength_coach | Add drill to plan | Accessible from plan builder |
| WOD Planner | `/app/coach/wod` | head_coach, strength_coach | Create WOD | Conditioning-specific |
| Playbook Studio V3 | `/app/coach/playbook` | head_coach, assistant | Design / animate play | Canonical play tool |
| Play Library | `/app/coach/playbook/plays` | head_coach, assistant | Open play | Filterable by category |
| Opponent Scout | `/app/coach/scout/:opponentId` | head_coach, assistant | Fill scouting report | Linked to events |
| Game Day | `/app/coach/game-day` | head_coach, assistant | Reference plays + lineup | Simplified game-day view |
| Cue Library | `/app/coach/cues` | head_coach, assistant, player_dev_coach | Save or use cue | Linked from drills |

---

### Assessments slice

| Page | URL | Roles | Primary action | Notes |
|---|---|---|---|---|
| Assessment Hub | `/app/coach/assess` | head_coach, assistant, player_dev_coach | Start assessment or Quick Assess | |
| Quick Assess Flow | `/app/coach/assess/quick` | head_coach, assistant, player_dev_coach | Score players | Full-screen mobile mode |
| Benchmarks | `/app/coach/assess/benchmarks` | head_coach, player_dev_coach | View position distributions | |
| IDP Generator | `/app/coach/idp/generate` | head_coach, player_dev_coach | Create IDP from assessment data | Step-by-step wizard |
| Player IDP (Coach view) | `/app/coach/team/players/:id/idp` | head_coach, player_dev_coach | Edit focus areas + milestones | |
| Goal Detail | `/app/coach/team/players/:id/idp/goals/:goalId` | head_coach, player_dev_coach | Update milestone | |
| Coach IDP (Self) | `/app/coach/idp` | head_coach, assistant | View own coach development plan | Coach is also a learner |
| Player Assessment History | `/app/player/skills` | player | View skill trends | Read-only |
| Player Skill Velocity | `/app/player/skill-velocity` | player | See rate of improvement | |
| Player Development Timeline | `/app/player/timeline` | player | Milestone history | |
| Player Development Resume | `/app/player/resume` | player | Recruiter-ready summary | Public-facing export |
| Player Milestones | `/app/player/milestones` | player | Achievement badges | |

---

### Academy slice

| Page | URL | Roles | Primary action | Notes |
|---|---|---|---|---|
| Coach Education Hub | `/app/coach/academy` | head_coach, assistant | Start a module | Prescribe to staff |
| Learning Path Detail | `/app/coach/academy/paths/:id` | head_coach, assistant | Complete module | Sequential progress |
| Module Player | `/app/coach/academy/module/:id` | all coaching roles | Watch + quiz | Video + quiz format |
| Module Prescriptions | `/app/coach/academy/prescriptions` | head_coach, director_of_ops | Assign path to staff | |
| Staff Cohort | `/app/coach/academy/cohort` | head_coach | Manage staff learning group | |
| Certification Page | `/app/coach/academy/certifications` | head_coach, assistant | View earned certs | |
| Observation Calibration | `/app/coach/academy/calibration` | head_coach | Align staff assessment scoring | Advanced tool |
| Program Terminology | `/app/coach/academy/terminology` | all coaching roles | Reference glossary | |
| Film Assignments (Player) | `/app/player/learn/assignments` | player | Watch assigned clip | Player-facing |
| Play Study List | `/app/player/learn/plays` | player | Study a play | |
| Play Study Detail | `/app/player/learn/plays/:id/study` | player | Step through play | |
| Play Quiz | `/app/player/learn/quizzes/:id` | player | Answer questions | |
| Player WOD | `/app/player/learn/wod` | player | View today's workout | |
| Player Highlights | `/app/player/learn/highlights` | player | Manage uploaded clips | |

---

### Manager Labs slice

| Page | URL | Roles | Primary action | Notes |
|---|---|---|---|---|
| Program Health | `/app/director/program` | director_of_ops | Drill into component | Composite score |
| Warning Metrics | `/app/director/program/warnings` | director_of_ops | Act on a warning | Active alerts |
| At-Risk Interventions | `/app/director/program/at-risk` | director_of_ops, head_coach | Log intervention | Risk flag list |
| VDV Command Center | `/app/director/program/vdv` | director_of_ops, head_coach | Identify development priority | Velocity × volume scatter |
| Development Synthesis | `/app/director/program/development` | director_of_ops, head_coach | Identify program patterns | Aggregate skill trends |
| Coach Effectiveness | `/app/director/staff/effectiveness` | director_of_ops | Compare coaching staff | Never visible to coaches themselves |
| Coaching Impact Report | `/app/director/program/impact` | director_of_ops, head_coach | Review season narrative | |
| Data Quality Scorecard | `/app/director/program/data-quality` | director_of_ops, admin | Identify data gaps | |
| Club Analytics | `/app/club/analytics` | director_of_ops | Program-level rollup | |
| Club Growth Metrics | `/app/club/growth` | director_of_ops | Enrollment and retention trends | |
| Roster Intelligence | `/app/club/roster-intel` | director_of_ops, head_coach | Position + grade analysis | |
| Season Report | `/app/director/program/reports` | director_of_ops, admin | Export season PDF | |
| Activation Heatmap | `/app/director/program/activation` | director_of_ops | Feature adoption by staff | Internal product health |

---

### Admin / Billing slice

| Page | URL | Roles | Primary action | Notes |
|---|---|---|---|---|
| Season Management | `/app/admin/seasons` | admin, director_of_ops | Open a season | List of seasons |
| Season Setup Wizard | `/app/admin/seasons/setup` | admin | Complete season setup steps | Guided wizard |
| Billing Dashboard | `/app/admin/billing` | admin, director_of_ops | View revenue KPIs | |
| Outstanding Payments | `/app/admin/billing/outstanding` | admin | Send reminder or log payment | Priority list |
| Invoice Detail | `/app/admin/billing/invoices/:id` | admin | View, send, void | |
| Create Fee Request | `/app/admin/billing/create` | admin | Issue ad-hoc fee | |
| Payment Plans | `/app/admin/billing/plans` | admin | Manage installments | |
| Admin Memberships | `/app/admin/settings/membership` | admin | Platform subscription status | |
| Seat Manager | `/app/admin/settings/seats` | admin | Add/remove staff seats | |
| Admin Registrations | `/app/admin/members/registrations` | admin | Approve / reject | |
| Re-enrollment | `/app/admin/seasons/re-enrollment` | admin | Campaign for returning players | |
| Waivers | `/app/admin/members/waivers` | admin | Manage templates + view signatures | |
| Forms Manager | `/app/admin/members/forms` | admin | Custom form builder | |
| Document Library | `/app/admin/members/documents` | admin | Upload/manage org docs | |
| Audit Log | `/app/admin/settings/audit` | admin | Review action history | |
| Staff Roles | `/app/admin/settings/roles` | admin | Manage role assignments | |
| Parent Billing Portal | `/app/parent/billing` | parent_guardian | Pay invoice | Stripe checkout |
| Parent Registration | `/app/parent/register` | parent_guardian | Submit registration | |
| Parent Forms | `/app/parent/forms` | parent_guardian | Sign waivers | |
| HoopsOS Billing Portal | `/app/settings/billing` | admin | Manage HoopsOS subscription | External Stripe Customer Portal |

---

### Recruiting slice (not in original six — isolate)

| Page | URL | Roles | Access |
|---|---|---|---|
| Recruiting Hub (Coach) | `/app/coach/recruiting` | head_coach, director_of_ops | Coach-side management |
| Dossier Builder | `/app/coach/team/players/:id/dossier` | head_coach, director_of_ops | Per-player dossier editor |
| Scouting Hub | `/app/coach/scout` | head_coach, assistant | Scout report list |
| Player Recruiting Dashboard | `/app/player/recruiting` | player | Exposure + recruiter activity |
| Recruiter Dashboard | `/app/recruiter` | external_recruiter | External-only |
| Recruiter Player Search | `/app/recruiter/search` | external_recruiter | |
| Public Dossier | `/p/:slug` | unauthenticated | Public-facing |

---

## 5. Object Model for Navigation and URLs

### URL schema

```
/                          Marketing home
/sign-in                   Auth
/sign-up                   Auth
/app                       Post-auth redirect → role home
/app/{role}                Role home (dashboard)
/app/{role}/{section}      L2 section index
/app/{role}/{section}/{resource}        Resource list
/app/{role}/{section}/{resource}/:id    Resource detail
/app/{role}/{section}/{resource}/:id/{sub}  Sub-resource

# Examples:
/app/coach/film/:sessionId                  Film session detail
/app/coach/team/players/:playerId/idp       Player IDP (coach view)
/app/coach/practice/:planId/execute         Practice execution mode
/app/director/program/at-risk               At-risk player list
/app/admin/billing/invoices/:invoiceId      Invoice detail
/app/parent/child/:playerId                 Child summary (parent view)
```

### Role segments

| URL role segment | Maps to StaffRole(s) |
|---|---|
| `coach` | `head_coach` |
| `assistant` | `assistant_coach`, `video_coordinator`, `player_dev_coach`, `strength_coach`, `athletic_trainer` |
| `player` | `player` |
| `parent` | `parent_guardian` |
| `director` | `director_of_ops` |
| `admin` | `admin` |
| `recruiter` | `external_recruiter` (not in StaffRole — separate auth context) |

### Shared resource URLs (viewed by multiple roles, rendered differently)

Some resources are viewed by multiple roles with the same URL but role-aware rendering:

```typescript
// Server returns role-filtered payload based on authenticated user
GET /api/players/:id
→ head_coach:        full profile (IDP, assessments, film, billing status)
→ assistant_coach:   profile + IDP + assessments (no billing)
→ player:            self-only; redirect to /app/player if not own profile
→ parent_guardian:   child-only; simplified summary (no assessment raw scores)
→ recruiter:         public dossier only (if published)
```

The client router directs to a single page component. The component reads the `viewer_role` from the auth context and renders the appropriate view.

### Navigation config type model

```typescript
// The data model powering the nav system
type NavItem = {
  id:         string
  label:      string
  icon:       LucideIcon
  href:       string
  roles:      StaffRole[]          // who sees this item
  badge?:     () => number | null  // live badge count (from hook)
  children?:  NavItem[]            // L2 items
  isActive:   (pathname: string) => boolean
  isVisible:  (ctx: NavContext) => boolean  // e.g., hide if no active season
}

type NavContext = {
  role:          StaffRole
  orgId:         string
  hasActiveSeason: boolean
  isMultiTeam:   boolean           // director sees all teams
  teamIds:       string[]
}

type AppNav = {
  primary:  NavItem[]    // L1 — max 5
  utility:  {            // always visible regardless of role
    search:         NavItem
    notifications:  NavItem
    profile:        NavItem
  }
}

// Role nav registry — the single source of truth for all role navs
const ROLE_NAV: Record<StaffRole, AppNav> = { ... }
```

### Route guard model

```typescript
type RouteGuard = {
  path:         string
  requiredRole: StaffRole[]
  redirect:     string       // where to send unauthorized users
  condition?:   (ctx: RouteContext) => boolean  // e.g., billing guard
}

const ROUTE_GUARDS: RouteGuard[] = [
  {
    path:         "/app/director/*",
    requiredRole: ["director_of_ops", "admin"],
    redirect:     "/app/coach",
  },
  {
    path:         "/app/admin/*",
    requiredRole: ["admin"],
    redirect:     "/app/coach",
  },
  {
    path:         "/app/coach/film/ai",
    requiredRole: ["head_coach", "assistant_coach", "video_coordinator"],
    redirect:     "/app/coach/film",
  },
  {
    path:         "/app/director/staff/effectiveness",
    requiredRole: ["director_of_ops"],
    redirect:     "/app/director",
    // Note: never redirect to /app/coach — coaches must not see this page
  },
]
```

---

## 6. Role-Based Nav Visibility Logic

### Visibility rules

```typescript
function getNavForRole(role: StaffRole, ctx: NavContext): AppNav {
  const base = ROLE_NAV[role];

  // Dynamic visibility conditions
  const filtered = base.primary.map(item => ({
    ...item,
    isVisible: () => {
      // Recruiting section only visible if org has recruiting enabled
      if (item.id === "recruiting") return ctx.org.hasRecruitingEnabled;
      // Multi-team view only meaningful for directors with 2+ teams
      if (item.id === "teams") return ctx.teamIds.length > 1;
      // Wearables section only visible if any player has connected a device
      if (item.id === "wearables") return ctx.org.hasWearablesEnabled;
      return true;
    }
  }));

  return { ...base, primary: filtered };
}
```

### Item-level permission matrix

| Feature | player | assistant | head_coach | director | admin |
|---|---|---|---|---|---|
| Film library (view) | ✗ | ✓ | ✓ | ✗ | ✗ |
| Film session annotate | ✗ | ✓ | ✓ | ✗ | ✗ |
| AI analysis hub | ✗ | ✓ | ✓ | ✗ | ✗ |
| Coaching actions feed | ✗ | own only | ✓ | ✗ | ✗ |
| Practice plan builder | ✗ | ✓ | ✓ | ✗ | ✗ |
| Playbook studio | ✗ | ✓ | ✓ | ✗ | ✗ |
| Team readiness grid | ✗ | own teams | ✓ | summary | ✗ |
| Readiness override | ✗ | ✗ | ✓ | ✗ | ✗ |
| Quick Assess | ✗ | ✓ | ✓ | ✗ | ✗ |
| IDP generator | ✗ | ✓ | ✓ | ✗ | ✗ |
| Player IDP (edit) | ✗ | ✓ | ✓ | ✗ | ✗ |
| Learning paths (own) | ✗ | ✓ | ✓ | ✓ | ✗ |
| Prescribe modules | ✗ | ✗ | ✓ | ✓ | ✗ |
| Coach effectiveness | ✗ | ✗ | ✗ | ✓ | ✗ |
| At-risk interventions | ✗ | ✗ | read | ✓ | ✗ |
| Program health score | ✗ | ✗ | partial | ✓ | partial |
| Season management | ✗ | ✗ | ✗ | read | ✓ |
| Invoice management | ✗ | ✗ | ✗ | read | ✓ |
| Member accounts | ✗ | ✗ | ✗ | ✗ | ✓ |
| Audit log | ✗ | ✗ | ✗ | ✗ | ✓ |
| Recruiting | read own | ✗ | ✓ | ✓ | ✗ |
| Dossier builder | ✗ | ✗ | ✓ | ✓ | ✗ |
| Daily check-in submit | ✓ | ✗ | ✗ | ✗ | ✗ |
| My IDP (view own) | ✓ | ✓ | ✓ | ✗ | ✗ |
| Play study (assigned) | ✓ | ✓ | ✓ | ✗ | ✗ |
| Highlights upload | ✓ | ✓ | ✓ | ✗ | ✗ |

---

## 7. Cross-Links Between Slices

Cross-links are explicit connections between pages in different slices, triggered by user workflow. Each cross-link is intentional. If it isn't in this list, it should not exist.

### Approved cross-links

| From (page / component) | To (page) | Trigger | Slice A → Slice B |
|---|---|---|---|
| Film Session (annotation panel) | Coaching Actions Feed | "Create Action" button | Coaching → Coaching |
| Film Session (ClipActionBar) | Player IDP | "Add to IDP" action | Coaching → Assessments |
| Film Session (ClipActionBar) | Drill Library | "Recommend Drill" action | Coaching → Academy |
| Film Session (ClipActionBar) | Player profile (film tab) | "Assign Clip" action | Coaching → Academy |
| Coaching Actions Feed | Player IDP | "Add to IDP" from action card | Coaching → Assessments |
| Coaching Actions Feed | Practice Plan Builder | "Add to plan" from action card | Coaching → Coaching |
| Practice Plan (block) | Drill Library | "View drill" from block | Coaching → Academy |
| Team Readiness Grid | Practice Plan Builder | "Flagged players — see plan" | Coaching → Coaching |
| Player Profile (coach view) | IDP Generator | "Generate IDP" button | Coaching → Assessments |
| Assessment History | IDP Generator | "Create IDP from these scores" | Assessments → Assessments |
| IDP Focus Area | Drill Library entry | "See linked drill" | Assessments → Academy |
| IDP Focus Area | Coaching Actions Feed | "See open actions for this skill" | Assessments → Coaching |
| At-Risk Player Card | Player Profile | "View player" | Manager Labs → Coaching |
| At-Risk Player Card | Coaching Actions Feed | "See open actions" | Manager Labs → Coaching |
| Warning Metrics | Readiness Grid | "View readiness breakdown" | Manager Labs → Coaching |
| Warning Metrics | Admin Billing Outstanding | "View overdue invoices" | Manager Labs → Admin |
| Coach Effectiveness Dashboard | Coaching Actions (per coach) | "View this coach's actions" | Manager Labs → Coaching |
| Dashboard Action Lane | Target page | "Tap any action item" | Dashboard → any slice |
| Film Assignment (player) | Film Session Detail | "View source session" | Academy → Coaching |
| Play Quiz (player) | Play Study | "Study this play first" | Academy → Academy |
| Player Check-in | Dashboard | "Back to home" | Player → Dashboard |
| Parent Invoice | Billing Portal | "Pay now" | Dashboard → Admin |
| Billing Dashboard | Player Profile | "Invoice belongs to..." | Admin → Coaching |

### Link patterns to never create

| From | To | Why forbidden |
|---|---|---|
| Practice Plan | Billing | Billing contaminates coaching workflow |
| Player profile | Invoice detail | Coach should never see billing amounts |
| Film session | Program Health dashboard | Too much context switching |
| Academy module | Coaching Actions | Learning and managing are separate contexts |
| Wearable metrics | Invoice history | Completely unrelated |
| Audit log | Any coaching page | Audit is admin-only context |
| At-risk flag | Billing outstanding | These are separate risk types |
| Assessment score | Raw check-in data | Assessment and wellness are distinct models |

---

## 8. Feature Isolation Rules

Some features should never appear as cross-links, secondary items, or inline components in other slices. They must be accessed only through their own first-class nav entry or a deliberate deep link.

| Feature | Isolation rule | Rationale |
|---|---|---|
| **Billing amounts** | Never shown in coaching workflow pages | Coaches should not mentally mix development work with money |
| **Coach effectiveness metrics** | Never linked from coaching pages; director-only nav | Would create a surveillance dynamic that chills coaching behavior |
| **AI analysis corroboration UI** | Accessible only from `/app/coach/film/ai` — not embedded in the film player | AI review is a separate workflow from live annotation; mixing them creates cognitive overload |
| **Audit log** | Admin-only page; never linked from any non-admin page | Audit data is governance, not operational |
| **Waiver content** | Admin section only; parents access through a push-driven form link | Waivers are legal documents; they should not appear as suggestions |
| **Observation calibration** | Academy section, accessible only to head coaches; never in the main film UI | Calibration is an occasional staff alignment activity |
| **Content admin tools** | Separate Content Admin role only; never visible to coaching staff | Separates platform operations from coaching operations |
| **Wearable raw data** | Not shown in the main readiness grid; accessible only from player profile wearables tab | Raw HRV/sleep data is not actionable in the team readiness context |
| **IDP history for other players** | Player A cannot see Player B's IDP at any point in the UI | Privacy boundary |
| **Parent billing history** | Parents see only their own history; admin sees all — no shared view | Billing is personal financial data |
| **Recruiting access log** | Visible to player (their own recruiter views) and director; never accessible to parents by default | Recruiting data is player-owned |

---

## 9. App Sitemap

Full tree. Items marked `[D]` are dashboard entrypoints; `[M]` are modal/drawer; `[E]` are external or public-facing.

### Unauthenticated

```
/                           Marketing Home [E]
/players                    Audience: Players [E]
/coaches                    Audience: Coaches [E]
/teams                      Audience: Teams [E]
/experts                    Audience: Experts [E]
/pricing                    Pricing page [E]
/sign-in                    Sign in
/sign-up                    Sign up
/docs                       Documentation
/docs/:slug                 Doc page
/p/:slug                    Public player dossier [E]
/profile/:id                Public player profile [E]
/profile/program/:slug      Public program profile [E]
/recruiting/:slug           Public recruiting profile [E]
```

---

### Player app

```
/app/player                       Home [D] — check-in CTA + today + focus + assignments
  /app/player/check-in              Daily check-in form [M]
  /app/player/onboarding            First-run onboarding flow

/app/player/grow                  Grow hub
  /app/player/grow/idp              My IDP — focus areas + milestones
  /app/player/grow/idp/goals/:id    Goal detail
  /app/player/grow/skills           Skill history + velocity
  /app/player/grow/timeline         Development timeline
  /app/player/grow/milestones       Achievement milestones
  /app/player/grow/resume           Development resume (coach-curated)
  /app/player/grow/story            Player growth story (self-narrative)
  /app/player/grow/wearables        Wearable data + connections

/app/player/learn                 Learn hub
  /app/player/learn/assignments     Film assignments + completion status
  /app/player/learn/plays           Play study library
  /app/player/learn/plays/:id/study  Play study detail
  /app/player/learn/quizzes         Quiz queue
  /app/player/learn/quizzes/:id     Quiz runner
  /app/player/learn/wod             Today's workout
  /app/player/learn/highlights      My uploaded film highlights
  /app/player/learn/highlights/:id  Highlight detail

/app/player/schedule              Schedule
  /app/player/schedule/calendar     Team calendar view
  /app/player/schedule/availability  My availability submissions
  /app/player/schedule/absence      Absence requests
  /app/player/coach-view            What my coach can see (transparency page)

/app/player/recruiting            Recruiting profile (if enabled)
  /app/player/recruiting/visibility  Privacy + visibility controls
  /app/player/recruiting/activity   Recruiter view activity log
  /app/player/vdv                   My VDV contribution score

/app/player/messages              Direct messages + announcements
```

---

### Head Coach app

```
/app/coach                        Home [D] — command center

/app/coach/coaching               Coaching hub (L2 sub-nav: Film · Actions · Practice · Playbook)

  # Film
  /app/coach/coaching/film                  Film library
  /app/coach/coaching/film/upload           Upload session
  /app/coach/coaching/film/:sessionId       Session detail (Mux player + annotate + ClipActionBar)
  /app/coach/coaching/film/queue            Film review queue
  /app/coach/coaching/film/queue/:id        Queue item detail
  /app/coach/coaching/film/playlists        Playlist library
  /app/coach/coaching/film/playlists/:id    Playlist detail
  /app/coach/coaching/film/ai               AI analysis hub (corroboration)
  /app/coach/coaching/film/clips/:clipId    Clip detail

  # Actions
  /app/coach/coaching/actions               Coaching actions feed (grouped by player)
  /app/coach/coaching/journal               Coaching journal (private)

  # Practice
  /app/coach/coaching/practice              Practice plan list
  /app/coach/coaching/practice/new          New plan (redirects to builder)
  /app/coach/coaching/practice/:planId      Plan detail / builder
  /app/coach/coaching/practice/:planId/execute   Execution mode [fullscreen]
  /app/coach/coaching/practice/:planId/review    Post-practice review
  /app/coach/coaching/drills                Drill library
  /app/coach/coaching/drills/:drillId       Drill detail
  /app/coach/coaching/cues                  Cue library
  /app/coach/coaching/wod                   WOD planner
  /app/coach/coaching/game-day              Game day mode [fullscreen]

  # Playbook
  /app/coach/coaching/playbook              Playbook studio (V3 canvas)
  /app/coach/coaching/playbook/plays        Play library
  /app/coach/coaching/playbook/plays/:playId  Play detail + quiz management
  /app/coach/coaching/playbook/scout        Scouting hub (opponent reports list)
  /app/coach/coaching/playbook/scout/:opponentId  Opponent scout report

/app/coach/team                   Team hub (L2: Readiness · Roster · Assess · Schedule)

  # Readiness
  /app/coach/team/readiness         Team readiness grid
  /app/coach/team/readiness/:playerId  Player readiness detail [drawer]

  # Roster
  /app/coach/team/roster            Roster list
  /app/coach/team/roster/import     Roster import
  /app/coach/team/players/:id       Player profile
  /app/coach/team/players/:id/idp   Player IDP (coach edit view)
  /app/coach/team/players/:id/idp/goals/:goalId  Goal detail
  /app/coach/team/players/:id/assessments  Assessment history (for this player)
  /app/coach/team/players/:id/film  Film tagged with this player
  /app/coach/team/players/:id/dossier  Dossier builder (if recruiting enabled)

  # Assess
  /app/coach/team/assess            Assessment hub
  /app/coach/team/assess/quick      Quick Assess flow [fullscreen]
  /app/coach/team/assess/benchmarks Benchmarks view

  # Schedule
  /app/coach/team/schedule          Team calendar
  /app/coach/team/schedule/:eventId  Event detail
  /app/coach/team/schedule/tournament/:id  Tournament weekend
  /app/coach/team/absences          Absence management
  /app/coach/team/parents           Parent engagement overview

/app/coach/grow                   Development + Education hub (L2: Development · Academy · Recruiting · Program)

  # Development
  /app/coach/grow/development       Development synthesis (aggregate)
  /app/coach/grow/development/outcomes  Player development outcomes
  /app/coach/grow/idp               IDP overview (all players)
  /app/coach/grow/idp/generate      IDP generator wizard

  # Academy (coach's own education)
  /app/coach/grow/academy           Coach education hub
  /app/coach/grow/academy/paths     Learning path catalog
  /app/coach/grow/academy/paths/:id Learning path detail
  /app/coach/grow/academy/module/:id  Module player
  /app/coach/grow/academy/prescriptions  Prescriptions I've given/received
  /app/coach/grow/academy/certifications  My certifications
  /app/coach/grow/academy/cohort    Staff learning cohort
  /app/coach/grow/academy/calibration  Observation calibration
  /app/coach/grow/academy/terminology  Program terminology
  /app/coach/grow/idp/self          My coach IDP

  # Recruiting (if enabled)
  /app/coach/grow/recruiting        Recruiting hub
  /app/coach/grow/recruiting/scouting  Scouting hub
  /app/coach/grow/recruiting/export  Recruiting export

  # Program (subset of Manager Labs)
  /app/coach/grow/program           Coaching impact report (own teams)
  /app/coach/grow/program/at-risk   At-risk interventions
  /app/coach/grow/program/effectiveness  Own effectiveness metrics (read-only)

/app/coach/messages               Inbox (L2: Messages · Announcements · Broadcasts)
  /app/coach/messages/broadcast     Broadcast to team/parents
  /app/coach/messages/announcements  Announcements
```

---

### Director app

```
/app/director                     Program health dashboard [D]

/app/director/program             Program intelligence (Manager Labs)
  /app/director/program/health    Health score detail
  /app/director/program/warnings  Warning metrics
  /app/director/program/at-risk   At-risk interventions
  /app/director/program/vdv       VDV command center
  /app/director/program/development  Development synthesis
  /app/director/program/impact    Coaching impact report
  /app/director/program/activation  Feature activation heatmap
  /app/director/program/data-quality  Data quality scorecard
  /app/director/program/reports   Season reports + export

/app/director/teams               Multi-team view
  /app/director/teams/overview    All teams at a glance
  /app/director/teams/:teamId     Team-specific overview

/app/director/ops                 Operations (subset of Admin)
  /app/director/ops/seasons       Season management (read + configure)
  /app/director/ops/billing       Billing dashboard (read)
  /app/director/ops/registrations  Registration pipeline
  /app/director/ops/retention     Program retention leaders
  /app/director/ops/growth        Club growth metrics

/app/director/staff               Staff management
  /app/director/staff/overview    All coaching staff
  /app/director/staff/effectiveness  Coach effectiveness dashboard
  /app/director/staff/roles       Role assignments
  /app/director/staff/learning    Staff learning progress
  /app/director/staff/:userId     Individual staff member profile + metrics
```

---

### Admin app

```
/app/admin                        Admin dashboard [D] — open tasks list

/app/admin/seasons                Season management
  /app/admin/seasons/setup        Season setup wizard
  /app/admin/seasons/:seasonId    Season detail
  /app/admin/seasons/re-enrollment  Re-enrollment campaign

/app/admin/billing                Billing management
  /app/admin/billing/dashboard    Revenue KPIs
  /app/admin/billing/invoices     All invoices
  /app/admin/billing/invoices/:id  Invoice detail
  /app/admin/billing/outstanding  Overdue and unpaid
  /app/admin/billing/create       Create fee request
  /app/admin/billing/plans        Membership plan definitions
  /app/admin/billing/payouts      Expert / trainer payouts

/app/admin/members                Member management
  /app/admin/members/roster       Full player roster
  /app/admin/members/accounts     User accounts
  /app/admin/members/registrations  Registration queue
  /app/admin/members/waivers      Waiver templates + signature status
  /app/admin/members/forms        Custom forms manager
  /app/admin/members/documents    Document library

/app/admin/settings               Org settings
  /app/admin/settings/org         Org profile
  /app/admin/settings/roles       Role definitions + permissions
  /app/admin/settings/seats       Coaching staff seats
  /app/admin/settings/integrations  Connected services
  /app/admin/settings/audit       Audit log
  /app/admin/settings/billing     HoopsOS subscription
```

---

### Parent app

```
/app/parent                       Parent dashboard [D]
/app/parent/child/:playerId       Child summary (development + attendance + readiness trend)
  /app/parent/child/:playerId/development  IDP read-only
/app/parent/schedule              Family calendar
/app/parent/billing               Billing portal (pay, history, receipts)
/app/parent/forms                 Waivers + forms to sign
/app/parent/register              Registration form
/app/parent/messages              Direct messages + announcements
/app/parent/weekly-pulse          Weekly team pulse from coach
/app/parent/digest/:weekId        Weekly development digest
/app/parent/recruiter-activity    Recruiter view log (for their child)
/app/parent/privacy               Privacy settings
```

---

### Recruiter app (external auth context)

```
/app/recruiter                    Recruiter dashboard [D]
/app/recruiter/search             Player search with filters
/app/recruiter/players/:id        Player dossier view (gated by privacy settings)
/app/recruiter/saved              Watchlist
/app/recruiter/requests           Pending access requests
/app/recruiter/profile            Recruiter profile (institution, verification)
```

---

## 10. Mobile Nav Behavior

### Coach (head coach) — mobile

**Bottom tab bar** — 5 tabs, always visible, haptic feedback on tap:

```
┌──────┬──────┬──────┬──────┬──────┐
│ Home │Coach │ Team │ Grow │Inbox │
│  🏠  │ 🎬  │ 👥  │ 📈  │ ✉️  │
│      │[3]   │[2]   │      │[4]   │
└──────┴──────┴──────┴──────┴──────┘
```

- `[n]` = live badge count (coaching actions, readiness flags, unread messages)
- Badges powered by `useCoachBadgeCounts()` — already exists in codebase
- Tapping an active tab scrolls to top of the current section (not re-navigate)
- Long-press on **Coach** tab shows a quick-action sheet: "New Film Review / New Action / New Practice Plan"

**L2 within sections** — horizontal scroll sub-nav below the header:
```
Coach section sub-nav: [Film ▸] [Actions] [Practice] [Playbook]
Team section sub-nav:  [Readiness ▸] [Roster] [Assess] [Schedule]
```

**Swipe gestures**: Left-right swipe between sections within the same L1 section.

---

### Player — mobile

**Bottom tab bar** — 5 tabs:

```
┌──────┬──────┬──────┬──────┬──────┐
│ Home │ Grow │Learn │Sched │Inbox │
│  🏠  │ 📈  │ 📚  │ 📅  │ ✉️  │
│[1]   │      │[2]   │      │[1]   │
└──────┴──────┴──────┴──────┴──────┘
```

- Home badge: check-in not yet submitted = 1 (urgent indicator)
- Learn badge: pending film assignments + quizzes
- Inbox badge: unread messages

**Check-in behavior**: If check-in not yet submitted, the Home tab shows a pulsing dot indicator. Tapping Home opens the check-in bottom sheet immediately if before the cutoff time.

---

### Parent — mobile

**Bottom tab bar** — 5 tabs:

```
┌──────┬──────┬──────┬──────┬──────┐
│ Home │Child │Billing│Sched│Inbox │
│  🏠  │ ❤️  │ 💳  │ 📅  │ ✉️  │
│      │      │[1]   │      │[3]   │
└──────┴──────┴──────┴──────┴──────┘
```

- Billing badge: outstanding invoices count
- Inbox badge: unread messages + announcements

---

### Director — mobile

**Bottom tab bar** — 5 tabs:

```
┌──────┬──────┬──────┬──────┬──────┐
│ Home │Progm │Teams │ Ops  │Staff │
│  🏠  │ 📊  │ 🚩  │ 📦  │ 🛡  │
│      │[2]   │      │[3]   │      │
└──────┴──────┴──────┴──────┴──────┘
```

- Program badge: active warning flags count
- Ops badge: outstanding tasks (overdue invoices + pending registrations)

---

### Admin — mobile

**Bottom tab bar** — 5 tabs:

```
┌──────┬──────┬──────┬──────┬──────┐
│ Home │Season│Billing│Membrs│ More │
│  🏠  │ 📅  │ 💳  │ 🗄  │ ···  │
│[4]   │      │[6]   │[2]   │      │
└──────┴──────┴──────┴──────┴──────┘
```

- Home badge: total open tasks
- Billing badge: overdue invoices count
- Members badge: pending registration approvals
- More sheet: Settings, Audit Log, Org Profile, Integrations

---

### Universal mobile behaviors

- **Safe area insets**: `env(safe-area-inset-bottom)` always applied to tab bar. Capacitor-compatible.
- **Minimum tap target**: 44 × 44 px for all interactive elements. Badge counts do not count toward the tap target.
- **Pull-to-refresh**: All list views support pull-to-refresh. Dashboard refreshes on app foreground event.
- **Bottom sheet pattern**: All modals on mobile use bottom sheets (not full-screen modals) unless the content requires full viewport (film player, play canvas, practice execution).
- **Swipe to dismiss**: All bottom sheets dismiss on downward swipe.
- **Offline state**: Nav renders with a yellow "offline" banner. Read-only pages still display cached data. Write operations queue for sync.

---

## 11. Global Search

### Trigger

- Desktop: `⌘K` or the search icon in the utility nav bar
- Mobile: Tap the search icon in the header (top right)

### What is indexed (by role)

| Entity type | Indexed fields | Roles that can find it |
|---|---|---|
| **Player** | name, jersey #, position, team, grad year | coach, assistant, director, admin |
| **Film session** | title, type, opponent, date | coach, assistant, video_coordinator |
| **Coaching action** | player name, category, type, notes (partial) | head_coach, assistant (own only) |
| **Drill** | name, focus category, sub-skills, description | coach, assistant, strength_coach, player |
| **Play** | name, category, formation | coach, assistant, player (assigned only) |
| **Event** | type, opponent, date, location | all roles |
| **Practice plan** | date, focus, block names | coach, assistant |
| **Learning path** | title, topic, description | coach, assistant |
| **Invoice** | player name, amount, status | admin, director |
| **Player dossier** | player name (published only) | recruiter, director |
| **Team** | name, level | director, admin |
| **Season** | name, date range | admin, director |

### Result card format

```
[Icon] Entity type label
[Bold] Primary identifier (name, title, date)
[Muted] Secondary context (position · team, or date · type, etc.)
[Action] Right-side chip: "Open" | "Review" | "Pay" (context-dependent)
```

### Search ranking

1. **Exact name match** — highest priority
2. **Recent interaction** — pages visited in the last 7 days surface higher
3. **Relevance to role** — a coach's search for "Marcus" surfaces the player before a drill named "Marcus Drill"
4. **Urgency signal** — flagged, overdue, or at-risk entities rank above neutral ones

### What global search should NOT include

- Audit log entries (sensitive governance data)
- Invoice amounts (coaches should not find billing data by searching)
- Other users' private journal entries
- Wearable raw data (too noisy and technical)
- AI analysis corroboration queue items (tool-specific context)

---

## 12. Command Palette and Quick Actions

### Trigger

- Desktop: `⌘K` (same as search, with a toggle between "Search" and "Actions" modes)
- Mobile: Long-press on the Home tab, or accessible from profile menu as "Quick Actions"

### By role

**Head Coach quick actions**

| Action | Keyboard | What it does |
|---|---|---|
| Log coaching action | `A` | Opens action composer with player picker |
| Start film review | `F` | Opens film queue, jumps to first pending item |
| New practice plan | `P` | Opens practice plan builder for today's date |
| Send team message | `M` | Opens message composer with "All Players" pre-selected |
| Quick Assess | `Q` | Opens Quick Assess flow with player list |
| View team readiness | `R` | Navigates to team readiness grid |
| Generate IDP | `I` | Opens player picker → IDP generator |
| Override readiness | `O` | Opens player picker → override modal |

**Player quick actions**

| Action | What it does |
|---|---|
| Submit check-in | Opens check-in bottom sheet |
| View my assignments | Navigates to Learn → Assignments |
| Study a play | Opens play study list |
| View today's event | Opens today's event detail |
| Message my coach | Opens new direct message composer |

**Admin quick actions**

| Action | What it does |
|---|---|
| Create invoice | Opens invoice composer with player picker |
| Send payment reminder | Opens reminder composer (bulk or individual) |
| Approve registration | Opens pending registration queue |
| Add player | Opens new player form |
| View outstanding | Navigates to Billing → Outstanding |

**Director quick actions**

| Action | What it does |
|---|---|
| View program health | Navigates to Program → Health |
| See at-risk players | Navigates to Program → At-Risk |
| Run season report | Opens report generator |
| Check coach effectiveness | Navigates to Staff → Effectiveness |

---

## 13. Recommendations: What Does NOT Belong in Global Nav

These features are real and important, but they should be accessed through contextual entry points — not via top-level nav or global search. Adding them to the primary structure would violate the "no more than five primary items" rule and create the "too many tools" problem.

| Feature | Why it's not in primary nav | How it's accessed instead |
|---|---|---|
| Wearable connections | Too advanced for daily use | Player profile → Wearables tab |
| AI film corroboration | A specialized workflow, not daily | Film Library → AI badge → AI hub |
| Observation calibration | Occasional staff activity | Academy → Advanced Tools |
| Coach career record | Reference document | Profile → Career |
| Program terminology glossary | Reference document | Academy → Terminology |
| Onboarding flow | One-time | Triggered on first login |
| Re-enrollment campaign | Seasonal | Admin → Seasons → Re-enrollment |
| Recruiting access log | Rarely accessed | Player profile → Recruiting tab |
| Family access requests | Admin approval workflow | Admin → Members → Registrations |
| Expert payouts | Periodic task | Admin → Billing → Payouts |
| Seat management | Infrequent admin task | Admin → Settings → Seats |
| Tournament brackets | Event-specific context | Schedule → Tournament |
| Broadcast / mass message | Accessed from Inbox | Inbox → Broadcast tab |
| Document library | Reference | Admin → Members → Documents |

---

## 14. IA Implementation Notes

### Navigation slice folder structure

```
client/src/features/navigation/
  types.ts          — NavItem, NavContext, AppNav, RouteGuard types
  config.ts         — ROLE_NAV: the full role-to-nav mapping
  guards.ts         — ROUTE_GUARDS: array of route guard rules
  search.ts         — SEARCH_ENTITIES: what's indexed per role
  commands.ts       — QUICK_COMMANDS: command palette entries per role
  hooks.ts          — useNavForRole(), useActiveNav(), useCommandPalette()
  compute.ts        — getNavForRole(), resolveBadgeCounts(), rankSearchResults()
  index.ts          — public exports

client/src/components/nav/
  AppShell.tsx             — main shell wrapper (exists, needs refactor)
  BottomTabBar.tsx         — mobile 5-tab bar
  DesktopSidebar.tsx       — desktop L1 + L2 nav
  L2SubNav.tsx             — horizontal secondary nav bar (mobile + desktop)
  GlobalSearch.tsx         — search overlay (Cmd+K)
  CommandPalette.tsx       — action palette (Cmd+K in action mode)
  NotificationBell.tsx     — utility nav bell + count
  ProfileMenu.tsx          — avatar + profile sheet
  NavBadge.tsx             — badge count component
```

### Single source of truth rule

`features/navigation/config.ts` is the only file that defines which nav items exist, what their labels are, and which roles can see them. AppShell, BottomTabBar, and DesktopSidebar all import from `config.ts`. They do not define their own nav items.

### Route registration convention

Every new page must be registered in three places:
1. `App.tsx` — the wouter Route definition
2. `features/navigation/config.ts` — if it appears in nav
3. `features/navigation/guards.ts` — the role guard for that path

Without a guard entry, any authenticated user can access any URL. No exceptions.

### Cross-link implementation pattern

Cross-links between slices are implemented as typed `NavigationIntent` objects, not hardcoded strings:

```typescript
// In features/navigation/types.ts
type NavigationIntent =
  | { type: "open_player_idp";      playerId: string }
  | { type: "open_action_detail";   actionId: string }
  | { type: "open_film_session";    sessionId: string; timestampMs?: number }
  | { type: "open_practice_plan";   planId: string }
  | { type: "open_drill";           drillId: string }

function resolveIntent(intent: NavigationIntent, role: StaffRole): string {
  switch (intent.type) {
    case "open_player_idp":
      return role === "player"
        ? `/app/player/grow/idp`
        : `/app/coach/team/players/${intent.playerId}/idp`;
    // ...
  }
}
```

This ensures cross-links resolve to the correct role-specific URL even when the same resource (e.g., a player IDP) has different URLs for different roles.

---

*End of HoopsOS Information Architecture Specification*
