# HoopsOS — Principal Product Architecture Plan

> Authored from the perspective of a Principal Product Architect + Staff Application Architect  
> Based on full codebase audit and post-VSA-refactor state  
> May 2026

---

## Table of Contents

1. Market Position
2. Product Pillars
3. Complete Feature Inventory (by Vertical Slice)
4. P0 / P1 / P2 Prioritization
5. App Sitemap and Navigation Hierarchy
6. Core Personas and Jobs to Be Done
7. Differentiators
8. Recommended Vertical-Slice Repo Model
9. Key Risks
10. Practical Roadmap
11. The 6 Feature Slices to Spec Next

---

## 1. Market Position

### The Category to Own: **Coaching Intelligence Platform**

HoopsOS should not position itself as a club management tool, an LMS, or a video platform. It should own a new category: **the operating system for serious basketball programs** — where coaching workflow, player development, team readiness, and program intelligence are unified in one product that every stakeholder touches daily.

### Why this category is wide open

| Incumbent | What they do well | What they cannot do |
|---|---|---|
| **Hudl** | Film storage and tagging | Development tracking, IDP, team ops, readiness, billing |
| **TeamSnap / SportsEngine** | Registration, scheduling, billing | Coaching intelligence, film, development, analytics |
| **DragonFly Athletics** | Player development tracking | Film, operations, recruiting, real-time readiness |
| **Catapult / Polar** | Wearable performance data | Coaching workflow, film, development, club operations |
| **CoachNow** | Coach-athlete video messaging | Team operations, analytics, development, recruiting |
| **Synergy / Genius Sports** | Advanced game analytics | Grassroots/club ops, daily coaching workflow |
| **Canvas / Blackboard** | Structured learning delivery | Anything basketball-specific |

None of these products connect **what happened in film** to **what gets planned for practice** to **how developed the player became** to **what the parent saw** to **what the recruiter finds**. That connection is the moat.

### The positioning statement

> HoopsOS is the coaching intelligence platform that turns every film session, practice rep, and development conversation into compounding athlete growth — with the operations layer to run the whole program from a single product.

### Market tier targets (in order)

1. **Elite AAU / travel programs** (Grassroots Elite, Nike EYBL, Under Armour Association) — heaviest coaching workflow needs, recruiting-sensitive, multi-team structures
2. **High school varsity programs** — film + development + parent communication is the wedge
3. **College programs (D2/D3/NAIA)** — compliance-adjacent needs, recruiting is core, analytics matter
4. **International club programs** — underserved by US-first tools, strong payment/season model fit

---

## 2. Product Pillars

Six pillars, each owning a distinct value proposition. Every feature belongs to exactly one pillar. Every pillar has a clear buyer hook and a measurable outcome.

### Pillar 1 — Film Intelligence
**Hook**: *"Turn every clip into a coaching action in under 60 seconds."*  
Film is not storage. It is the input to every coaching decision. AI-assisted tagging, annotation, clip assignment, and corroboration make film the nervous system of the coaching workflow.

### Pillar 2 — Development Engine
**Hook**: *"Every player has a plan. Every plan has proof of progress."*  
IDPs, skill assessments, benchmarks, and milestone tracking make development legible — to coaches, players, and parents. Development data is the product's stickiest data asset.

### Pillar 3 — Coaching Workflow
**Hook**: *"From film to practice plan in one platform."*  
Practice planning, playbook design, drill library, game day management, and coaching journals are the daily workflow tools. This is where time is spent; this is where retention is won.

### Pillar 4 — Team Readiness
**Hook**: *"Know who's ready before the first rep."*  
Daily check-ins, wearable signals, injury records, and readiness overrides give coaches a real-time picture of team health. This is the highest-frequency touchpoint in the product.

### Pillar 5 — Program Operations
**Hook**: *"Run the entire program from one place."*  
Roster management, scheduling, billing, communications, season management, registrations, and waivers. The administrative backbone that earns the right to be the primary app.

### Pillar 6 — Recruiting Intelligence
**Hook**: *"Build your player's profile. Control who sees it."*  
Dossier builder, scouting reports, recruiter portal, exposure analytics, and privacy controls. A recruiting layer that gives elite programs a tangible reason to pay for premium tiers.

---

## 3. Complete Feature Inventory (by Vertical Slice)

Each slice owns: UI, workflows, business logic, mock data, types, data contracts, server module, and tests.  
Shared code is limited to: auth, design system tokens, the DB repository facade, and cross-cutting primitives (org, user, role).

---

### SLICE 01 — Roster & Identity

**Pillar**: Program Operations  
**Owner role**: Admin / Head Coach  
**Description**: The authoritative player record. Every other slice references it.

| Feature | Description |
|---|---|
| Player profile management | Name, position, jersey, grade, grad year, height/weight, status |
| Status lifecycle | Active → Injured → Suspended → Inactive with audit trail |
| Guardian linking | Parent/guardian accounts linked to player records |
| Roster import / bulk ops | CSV import, mass status updates |
| Staff directory | Coach roles, permissions, contact info |
| Role-based access control | Player, parent, coach, admin, director, recruiter |
| Public player profile | Recruiter-facing profile with privacy controls |

**Boundary rules**: Owns `Player` type and `OrgMember` type. All other slices reference players by ID only and fetch names through the roster service. No business logic about players belongs outside this slice.

---

### SLICE 02 — Events & Scheduling

**Pillar**: Program Operations  
**Owner role**: Admin / Head Coach  
**Description**: The team calendar. Games, practices, tournaments, meetings — with availability and attendance tracking.

| Feature | Description |
|---|---|
| Event creation and management | Type, location, opponent, required/optional |
| Availability polling | Players RSVP before events |
| Attendance recording | Check-in at event, absent/present/excused |
| Absence management | Coach-facing absence patterns, intervention triggers |
| Tournament weekends | Multi-day event grouping with bracket tracking |
| Team calendar view | Month/week view, filterable by event type |
| iCal export | Subscribe from any calendar app |
| Game day mode | Simplified event-day UI for coaches |

---

### SLICE 03 — Readiness & Wellness

**Pillar**: Team Readiness  
**Owner role**: Coach (viewer) / Player (submitter) / Parent (viewer, limited)  
**Description**: The daily health and readiness signal for each player. Highest-frequency interaction in the platform.

| Feature | Description |
|---|---|
| Player daily check-in | Fatigue, sleep, soreness, energy — submitted each morning |
| Team readiness dashboard | Coach view: color-coded status grid, flagged players, summary |
| Readiness score computation | Algorithmic score from wellness signals + wearables + injury + workload |
| Status system | READY / FLAGGED / RESTRICTED / UNKNOWN with confidence level |
| Coach overrides | Manual status override with reason (pre-game decision) |
| Readiness history | Per-player trend lines, week/month view |
| Wearable signal integration | HRV, sleep score, recovery from connected devices |
| Alert system | Inngest-driven coach notifications when players are flagged |
| Readiness ↔ practice plan link | Readiness data surfaces inside practice plan builder |

**Why this slice matters most**: It is the daily active use driver. A program that submits check-ins every morning is a program that opens the app every morning. The data compounds into the most valuable longitudinal wellness dataset in grassroots basketball.

---

### SLICE 04 — Film Room

**Pillar**: Film Intelligence  
**Owner role**: Coach (primary) / Player (assignee)  
**Description**: Video upload, organization, AI analysis, annotation, clip creation, and assignment — the input layer for all coaching decisions.

| Feature | Description |
|---|---|
| Film session management | Upload, title, tag by game/practice/type |
| AI analysis pipeline | Automated tagging, play detection, player tracking (Gemini/OpenAI) |
| Manual annotation | Timestamped notes, drawings, tags on clip |
| Clip extraction | Create clips from sessions, add to playlists |
| Film queue | Review queue with pending/reviewed state |
| Playlist management | Curated clip collections by theme or player |
| Film assignment | Assign clips to players for study, with quiz capability |
| Clip action creation | Coaching action created directly from clip (linked to film context) |
| Film corroboration | Coach confirms or refutes AI-generated insights |
| Film search | Filter by player, date, play type, tag, session type |
| Film sharing | Export clips, share with parents (controlled) |
| AI Film Analysis Hub | Aggregated AI insights across sessions, trend detection |

**Architecture note**: The AI pipeline is a background job system (Inngest functions). The film slice owns the pipeline orchestration. It does not own the AI providers — those remain in `server/lib/gemini.ts` and `server/lib/openai.ts` as infrastructure wrappers.

---

### SLICE 05 — Coaching Actions

**Pillar**: Film Intelligence + Development Engine  
**Owner role**: Coach  
**Description**: The output of film review and observation. Coaching actions are the connective tissue between what coaches see and what players work on.

| Feature | Description |
|---|---|
| Action creation | From film clip, observation, or standalone |
| Action types | Technique correction, drill assignment, focus area, recognition, escalation |
| Action assignment | Assign to player, with due date and priority |
| Action status | Open → In Progress → Resolved → Dismissed |
| Action feed | Coach view of all open actions across the roster |
| Action ↔ IDP link | Actions can elevate to IDP focus areas |
| Action ↔ Practice link | Actions surface as practice planning suggestions |
| Action ↔ Drill link | Attach drill from library to address the action |
| Coaching journal | Coach's private narrative log, tied to sessions and actions |
| Bulk action review | End-of-session review flow |
| Action analytics | Resolution rate, response time, player breakdown |

---

### SLICE 06 — Player Development (IDP)

**Pillar**: Development Engine  
**Owner role**: Coach (author) / Player (participant) / Parent (viewer)  
**Description**: The individual development plan — the formal developmental contract between coach and player. The most emotionally valuable feature for families.

| Feature | Description |
|---|---|
| IDP creation and management | Coach creates plan: focus areas, milestones, drill links |
| Focus areas | Skill dimensions with target level and timeline |
| Milestone tracking | Discrete objectives with completion date and evidence |
| Drill links | IDP focus areas linked to drill library entries |
| IDP comments | Coach and player asynchronous communication on plan |
| Skill velocity | Rate of improvement per focus area over time |
| Development timeline | Visual milestone history per player |
| Player growth story | Narrative export of development arc (recruiter-friendly) |
| Player milestones | Badge-like recognition for hitting development targets |
| IDP generator | AI-assisted draft generation from assessment + film data |
| Coach IDP overview | Aggregate view of all IDPs with completion health |
| Development synthesis | Cross-player development pattern analysis |

---

### SLICE 07 — Skill Assessment & Benchmarking

**Pillar**: Development Engine  
**Owner role**: Coach  
**Description**: Structured assessment events that generate the data IDP is built on. Benchmarks contextualize individual scores against program or position norms.

| Feature | Description |
|---|---|
| Assessment creation | Define rubric: skills, scoring scale, assessors |
| Quick assess flow | Rapid player-by-player scoring during sessions |
| Assessment history | Per-player score history with trend lines |
| Benchmarking | Program-level and position-level norms |
| Benchmark comparison | Player vs. program, player vs. peer cohort |
| Skill velocity tracking | Rate of change per skill over rolling windows |
| Assessment ↔ IDP link | Assessment scores auto-surface as IDP evidence |
| Core development tracking | Long-arc physical and skill development milestones |

---

### SLICE 08 — Practice Planning

**Pillar**: Coaching Workflow  
**Owner role**: Coach  
**Description**: The primary daily workflow feature. Coaches spend more time planning practices than any other coaching task. This slice must win.

| Feature | Description |
|---|---|
| Practice plan builder | Block-based plan: warm-up, drills, segments, cool-down |
| Plan templates | Saved plan templates by focus area or season phase |
| Drill library | Searchable drill database with diagrams, cues, and tags |
| Drill cue library | Verbal cues that attach to drills for coaching consistency |
| Readiness integration | Flagged players surface inside the plan builder |
| Coaching action integration | Open coaching actions surface as practice suggestions |
| WOD planner | Workout of the day for individual or team conditioning |
| Practice execution | Live mode during practice: timer, checklist, notes |
| Practice review | Post-practice debrief: what worked, adjustments |
| Practice plan analytics | Time allocation, drill frequency, session load tracking |
| Plan sharing | Share plan with staff (read-only or collaborative) |

---

### SLICE 09 — Playbook Studio

**Pillar**: Coaching Workflow  
**Owner role**: Coach  
**Description**: Visual play design and player study tool. V2 for quick diagramming, V3 for animated, action-based play modeling.

| Feature | Description |
|---|---|
| Play canvas (V2) | Drag-drop player tokens, draw paths, cut styles |
| Play canvas (V3) | Action-based model with timeline animation and resolver |
| Formation seeds | Pre-built starting formation library |
| Play categories | Offense / Defense / Special / Press / BLOB / SLOB |
| Play quiz mode | Players study plays and answer questions |
| Play study mode | Annotated play walkthrough for player self-study |
| Playbook organization | Tags, folders, search, play status |
| Opponent playbook | Scout opponent sets and tendencies |
| Animation playback | Step-through or continuous animation |
| Playbook export | Share as PDF or video |

---

### SLICE 10 — Recruiting & Exposure

**Pillar**: Recruiting Intelligence  
**Owner role**: Director / Coach (author) / Player (visibility control)  
**Description**: The platform's premium tier anchor for elite programs. Enables controlled exposure of player profiles to college recruiters.

| Feature | Description |
|---|---|
| Player dossier builder | Coach-curated profile: bio, stats, film clips, assessments |
| Public dossier page | Recruiter-accessible URL with privacy controls |
| Recruiting dashboard (player) | Player sees who viewed their profile, college watchlist |
| Recruiting hub (coach) | All player exposure activity, export tools |
| Scouting hub | Opponent and prospect scouting reports |
| Opponent scout report | Tendencies, personnel, play calls |
| Prospect scouting | Incoming prospect evaluation with structured report |
| Recruiter portal | External recruiter account type with limited access |
| Recruiter access log | Who viewed what, when — full audit trail |
| Director recruiting CRM | Pipeline of prospects across the program |
| Prospect pool | Incoming recruit tracking with notes and status |
| Program reputation page | External-facing program identity and achievement history |
| Privacy controls | Player/parent control over what is public |
| Profile visibility settings | Per-section visibility (film, stats, contact, highlights) |
| Recruiting export | Package dossier as PDF or shareable link |

---

### SLICE 11 — Wearables & Performance Data

**Pillar**: Team Readiness  
**Owner role**: Coach  
**Description**: Integration layer for connected wearable devices. Wearable signals feed the readiness score and longitudinal load management.

| Feature | Description |
|---|---|
| Wearable device connection | OAuth-style connection to Garmin, Whoop, Apple Health |
| Wearable metric ingestion | HRV, sleep stages, recovery score, resting HR |
| Wearable sharing consent | Player controls which coach can see their data |
| Wearable dashboard | Aggregate team view of recovery and load |
| Signal integration | Wearable signals weighted in readiness computation |
| Load management alerts | Flag players approaching overtraining thresholds |
| Wearable history | Per-player longitudinal wearable trend data |

---

### SLICE 12 — Messaging & Communications

**Pillar**: Program Operations  
**Owner role**: All roles  
**Description**: In-platform messaging for coach-player, coach-parent, and team-wide communication.

| Feature | Description |
|---|---|
| Direct messaging | 1:1 between any two users in the org |
| Group threads | Multi-participant threads |
| Broadcast / announcements | Coach sends to team, position group, or guardians |
| Announcement board | Pinned team-wide announcements with read receipts |
| Message threading | Reply chains within conversations |
| Recipient selector | Smart picker: by role, team, position, or individual |
| File attachments | Send documents, images, clips in messages |
| Coach inbox | Unified inbox with priority and unread state |
| Notification routing | Push/email fallback for unread messages |

---

### SLICE 13 — Parent & Guardian Portal

**Pillar**: Program Operations + Development Engine  
**Owner role**: Parent / Guardian  
**Description**: The stickiest retention layer for families. Parents pay for the program; they deserve meaningful visibility, not just a schedule. This slice turns parents into advocates.

| Feature | Description |
|---|---|
| Parent dashboard | Today's schedule, recent development updates, billing alerts |
| Player summary | Attendance rate, readiness trend, IDP progress summary |
| Schedule view | Family-facing calendar with location and carpool info |
| Development digest | Weekly email/in-app summary of player progress |
| Weekly pulse | Coach-generated team-wide update to parents |
| IDP progress view | Read-only view of player's active development plan |
| Billing portal | Pay fees, view history, payment plans, receipts |
| Forms management | Waivers, registration forms — sign in-app |
| Messages | Direct messaging with coaching staff |
| Announcements | Program-wide announcements |
| Child access linking | One parent can link multiple children |
| Parent engagement metrics | Internal coach view of parent engagement levels |
| Privacy controls | Parent manages what data their child shares |
| Recruiter view activity | Notification when a college recruiter views their child's profile |

---

### SLICE 14 — Club Operations

**Pillar**: Program Operations  
**Owner role**: Admin / Director  
**Description**: The operational backbone of the program. Seasons, teams, registrations, billing, waivers, and staff management.

| Feature | Description |
|---|---|
| Season management | Create seasons, configure teams, set dates |
| Season setup wizard | Step-by-step season configuration |
| Team management | Multiple teams within an org, staff assignment |
| Registration management | Online registration with custom fields |
| Re-enrollment | Returning player fast-track |
| Membership plans | Subscription and one-time fee plans |
| Waivers | Digital waiver templates, player-side signing |
| Document library | Org-level document storage and sharing |
| Onboarding flow | New coach and player guided setup |
| Team operations metrics | Internal ops health dashboard |
| Access request management | External access approvals |

---

### SLICE 15 — Billing & Payments

**Pillar**: Program Operations  
**Owner role**: Admin / Parent  
**Description**: Revenue operations for the program. Fee collection, payment plans, outstanding tracking, payouts.

| Feature | Description |
|---|---|
| Fee creation | Create one-time or recurring fee requests |
| Stripe integration | Checkout, customer portal, webhook handling |
| Payment plans | Installment plans with schedule |
| Outstanding payments | Admin view of unpaid fees with escalation |
| Payments dashboard | Revenue summary, collection rate, projections |
| Invoice management | Per-player invoices, PDF export |
| Expert payouts | Payout tracking for contracted coaches/trainers |
| Seat management | Add/remove staff seats, billing per seat |
| Pricing page | Plan tiers, feature comparison, upgrade flow |
| Billing admin tool | Dev/admin webhook simulator, KPI dashboard |
| Coupon and discounts | Promotional codes, sibling discounts |
| Subscription management | Upgrade, downgrade, cancel flows |

---

### SLICE 16 — Coach Education & Certification

**Pillar**: Coaching Workflow  
**Owner role**: Coach  
**Description**: Structured learning embedded in the coaching context. Not a generic LMS — modules are triggered by workflow events and tied to coaching skill development.

| Feature | Description |
|---|---|
| Learning path catalog | Structured curriculum by coaching level and focus |
| Module player | Video + text + quiz format |
| Module prescription | Coach recommends specific modules to staff members |
| Progress tracking | Completion, quiz scores, time spent |
| Certification system | Digital certifications tied to completed learning tracks |
| Coach career record | Longitudinal record of coaching roles and achievements |
| Coach IDP | Coach's own individual development plan |
| Staff cohort | Group coaching staff into learning cohorts |
| Cue library | Teaching cues coaches can adopt and customize |
| Program terminology | Shared glossary of program-specific terms |
| Observation calibration | Align coach assessors on scoring standards |
| Live observation quality | Real-time quality check during coaching assessments |

---

### SLICE 17 — Analytics & Program Intelligence

**Pillar**: All pillars (meta-layer)  
**Owner role**: Director / Head Coach  
**Description**: The command center that proves the platform's value to buyers and justifies renewal. Analytics is the feature that turns data into decisions.

| Feature | Description |
|---|---|
| North Star Dashboard | Program-level health: development velocity, readiness rate, retention |
| Coach effectiveness dashboard | Coach-specific KPIs: action resolution, IDP completion, engagement |
| Coaching impact report | Season summary of coaching activity and player outcomes |
| VDV Command Center | Value-driven development metrics and goal alignment |
| Player development outcomes | Aggregate view of development trajectories across roster |
| Club analytics | Cross-team program analytics for director |
| Club growth metrics | Enrollment trends, retention, NPS |
| Roster intelligence | Position balance, grade distribution, attrition risk |
| Activation heatmap | Feature adoption across the coaching staff |
| Data quality scorecard | Completeness and freshness of key data signals |
| Warning metrics dashboard | At-risk indicators: low readiness, missed check-ins, overdue IDPs |
| At-risk intervention | Triggered workflow when player meets risk criteria |
| Season report | Exportable season summary for stakeholders |
| Enterprise expansion | Multi-org rollup for enterprise customers |
| Program retention leaders | Who's re-enrolling, who's at risk of churning |

---

### SLICE 18 — Recruiting Portal (External)

**Pillar**: Recruiting Intelligence  
**Owner role**: External Recruiter (not an org member)  
**Description**: The external-facing surface for college programs. Separate auth context, read-only access, privacy-gated.

| Feature | Description |
|---|---|
| Recruiter account | Separate account type, verified institution |
| Player search | Search by position, grad year, location, level |
| Public dossier view | Access coach-published player profiles |
| Recruiter dashboard | Saved players, recent views, watchlist |
| Access request system | Request access to gated player profiles |
| Recruiting profile (public) | Program-level public page for college coaches |
| View activity logging | Every recruiter view is logged for player visibility |

---

### SLICE 19 — Admin & Compliance

**Pillar**: Program Operations  
**Owner role**: Admin / System Admin  
**Description**: Internal governance, audit trails, and access management.

| Feature | Description |
|---|---|
| Audit log | Full event log of sensitive actions |
| Staff roles and permissions | Role assignment, custom permissions |
| Family privacy management | COPPA compliance, data deletion requests |
| Family growth reporting | Internal metric on parent engagement |
| Admin dashboard | Health indicators for the org |
| Admin billing oversight | Unpaid seats, plan status |
| Admin memberships | Seat count, plan tier, feature access |

---

### SLICE 20 — Notifications & Alerts

**Pillar**: Program Operations (infrastructure)  
**Owner role**: System  
**Description**: The async notification layer that drives re-engagement. This is infrastructure but should be owned as a feature slice because its business logic is domain-aware.

| Feature | Description |
|---|---|
| Readiness flag alerts | Coach notified when player is flagged |
| Coaching action reminders | Nudge when overdue actions exist |
| IDP milestone due reminders | Approaching milestone deadline |
| Payment due notifications | Upcoming or overdue payment alerts |
| Practice plan reminders | Remind coaches to publish plan before practice |
| Film assignment nudges | Players who haven't reviewed assigned clips |
| Weekly digest emails | Parent and player weekly summaries |
| Recruiter view alerts | Player notified when recruiter views profile |
| At-risk player alerts | Director notified when player meets at-risk criteria |

---

## 4. P0 / P1 / P2 Prioritization

Priority logic:
- **P0**: Required for the product to function at all. Without this, there is no daily use.
- **P1**: Differentiators. Makes the product meaningfully better than what teams currently use.
- **P2**: Moat builders. Creates switching costs, network effects, or premium tier justification.

| Slice | Priority | Rationale |
|---|---|---|
| 01 — Roster & Identity | **P0** | Every other feature references players |
| 02 — Events & Scheduling | **P0** | Every program needs a schedule |
| 03 — Readiness & Wellness | **P0** | Daily active use driver |
| 04 — Film Room | **P0** | Core differentiation, entry wedge for elite programs |
| 05 — Coaching Actions | **P1** | The output of film — differentiator |
| 06 — Player Development (IDP) | **P1** | Most emotionally valuable for families |
| 07 — Skill Assessment & Benchmarking | **P1** | Powers IDP, coaching credibility |
| 08 — Practice Planning | **P0** | Primary daily coaching workflow |
| 09 — Playbook Studio | **P1** | Unique capability, strong coach hook |
| 10 — Recruiting & Exposure | **P2** | Premium tier anchor, not needed at launch |
| 11 — Wearables & Performance | **P2** | Differentiated but complex; requires device ecosystem |
| 12 — Messaging & Communications | **P0** | Table stakes for any team platform |
| 13 — Parent & Guardian Portal | **P1** | Retention driver, billing relationship owner |
| 14 — Club Operations | **P0** | Season/team/registration structure required |
| 15 — Billing & Payments | **P0** | Required for revenue from day one |
| 16 — Coach Education & Certification | **P2** | Strong moat; not day-one critical |
| 17 — Analytics & Intelligence | **P1** | Director-buyer hook; required for renewal |
| 18 — Recruiting Portal (External) | **P2** | Requires player data scale to be valuable |
| 19 — Admin & Compliance | **P0** (subset) | Roles, permissions, audit — required |
| 20 — Notifications & Alerts | **P1** | Required for engagement; not day-one complete |

### The irreducible P0 core (launch requirements)

Roster → Events → Readiness → Messaging → Billing → Practice Planning → Film (basic) → Club Ops → Admin (roles/permissions)

This is the complete minimum that makes HoopsOS useful to a paying program on day one. Everything else is sequenced from here.

---

## 5. App Sitemap and Navigation Hierarchy

### Coach Portal

```
Coach Home (Dashboard)
│
├── Film Room
│   ├── Film Library
│   ├── Film Queue (review pending)
│   ├── Session Detail
│   │   ├── Annotations
│   │   └── Clip extraction
│   ├── Playlists
│   ├── AI Analysis Hub
│   └── Film Assignments
│
├── Practice
│   ├── Practice Planner
│   │   ├── New Plan
│   │   ├── Templates
│   │   └── Plan History
│   ├── Practice Execution (live)
│   ├── Practice Review
│   ├── Drill Library
│   ├── Cue Library
│   └── WOD Planner
│
├── Playbook
│   ├── Studio (V3)
│   ├── Play Library
│   ├── Opponent Sets
│   └── Quiz Manager
│
├── Players
│   ├── Roster
│   │   └── Player Profile
│   │       ├── IDP
│   │       ├── Assessments
│   │       ├── Readiness History
│   │       ├── Attendance
│   │       └── Film (player-tagged)
│   ├── Team Readiness
│   ├── Coaching Actions (feed)
│   ├── Skill Assessments
│   └── Benchmarks
│
├── Schedule
│   ├── Team Calendar
│   ├── Event Detail
│   ├── Attendance
│   ├── Absence Management
│   └── Tournament Weekends
│
├── Scouting
│   ├── Scouting Hub
│   ├── Opponent Scout Reports
│   └── Recruiting Hub
│       └── Dossier Builder
│
├── Education
│   ├── My Learning Path
│   ├── Module Library
│   ├── My Certifications
│   └── Staff Cohorts
│
├── Inbox
│   ├── Messages
│   └── Announcements
│
└── Program
    ├── Analytics
    │   ├── Coaching Impact Report
    │   ├── Player Development Outcomes
    │   └── Warning Metrics
    └── Settings (season, team, roles)
```

### Player Portal

```
Player Home
├── My Development
│   ├── My IDP
│   ├── Skill Progress
│   ├── Milestone History
│   └── Development Resume
├── Film Study
│   ├── Assigned Clips
│   ├── Play Study
│   └── Play Quiz
├── Daily Check-In
├── My Schedule
│   ├── Calendar
│   └── Availability
├── My Profile
│   ├── Recruiting Profile
│   └── Visibility Settings
├── Wearables
└── Inbox
```

### Parent / Guardian Portal

```
Parent Home
├── [Child Name] Summary
│   ├── Development Progress
│   ├── Readiness Trend
│   └── Attendance Rate
├── Schedule
├── Development
│   ├── IDP (read-only)
│   └── Weekly Digest
├── Billing
│   ├── Pay Fees
│   ├── Payment History
│   └── Receipts
├── Forms & Waivers
├── Inbox
│   ├── Messages
│   └── Announcements
└── Privacy Settings
```

### Director / Multi-Team Portal

```
Director Home (Program Health Dashboard)
├── Program Analytics
│   ├── Club Analytics
│   ├── Roster Intelligence
│   ├── Retention Leaders
│   └── Growth Metrics
├── Recruiting CRM
│   ├── Prospect Pool
│   └── Recruiter Access Log
├── Operations
│   ├── Season Management
│   ├── Team Management
│   ├── Staff Roles
│   └── Re-Enrollment
├── Billing Overview
└── Admin
    ├── Memberships
    ├── Registrations
    ├── Waivers
    ├── Audit Log
    └── Family Privacy
```

### Navigation Principles

1. **Role-specific home pages** — coaches see coaching intelligence; parents see their child; players see their development. No shared "find your feature" navigation.
2. **Film → Action → Practice as a flow** — the three most important coach workflows are connected steps, not isolated features. Navigation should make this path frictionless.
3. **Today-first design** — every role's home page surfaces what is actionable today (practice plan, pending check-ins, open actions, upcoming events).
4. **Player profile as a hub** — all information about a specific player (readiness, IDP, film, assessments, attendance) lives at `Players → [Player Name]`. Never duplicated elsewhere.
5. **Mobile-first for players and parents** — check-in, schedule, messaging, film study must work on mobile. Coach planning tools can be desktop-primary.

---

## 6. Core Personas and Top Jobs to Be Done

### Persona 1 — The Head Coach

**Profile**: 30–55 years old, runs 1–3 teams, 20–30 players per team. Deeply basketball-literate but inconsistently technical. Judges tools by how much they reduce chaos, not by feature count.

**Top jobs to be done:**

| Job | Current workaround | How HoopsOS solves it |
|---|---|---|
| Know who's available and healthy before practice | Group text, manual roster check | Readiness dashboard with READY/FLAGGED status |
| Turn film observations into player action | Paper notes, voice memos, forgotten | Clip → Coaching Action in one flow |
| Plan a practice that addresses what I saw on film | Separate Google Doc disconnected from film | Practice planner surfacing open coaching actions |
| Know if my players are actually developing | Gut feel, report cards | IDP progress, skill velocity charts |
| Communicate with parents without consuming my day | Group texts, email threads | Broadcast and announcement tools |
| Know who's at risk of quitting | Intuition | Warning metrics, attendance, engagement signals |

**Must-have features**: Readiness Dashboard, Film Queue, Coaching Actions, Practice Planner, Team Roster view  
**Success metric**: Coach opens the app before every practice. Coach creates at least one coaching action after every film session.

---

### Persona 2 — The Assistant Coach / Film Coordinator

**Profile**: 22–35 years old, often a former player. Owns film breakdown, specific player groups, drill design. Heavy film user, often the most technical coach on staff.

**Top jobs to be done:**

| Job | Current workaround | How HoopsOS solves it |
|---|---|---|
| Break down film efficiently before the next day's practice | Hudl with no downstream workflow | Annotation + clip + action creation in one session |
| Surface key clips for the head coach's review | Shared Google Drive or Hudl playlist | Film queue with coach-facing review status |
| Assign specific clips to players | Individual text messages with video links | Film assignment with delivery tracking |
| Design drills that address what we're seeing on film | Separate whiteboard or Google Doc | Drill library integrated with practice planner |
| Track which players are improving in their assignment areas | No formal system | IDP focus areas + coaching action resolution rate |

---

### Persona 3 — The Club / Program Director

**Profile**: 40–60 years old, oversees multiple teams and coaches. Primary buyer. Values program-level visibility over individual coaching workflow. Manages staff, finances, reputation.

**Top jobs to be done:**

| Job | Current workaround | How HoopsOS solves it |
|---|---|---|
| See program health without asking every coach | Spreadsheets, coach check-ins | Program Health Dashboard |
| Know which players are at risk of not returning | Nothing | Retention Leaders + churn risk signals |
| Manage season registrations and billing | SportsEngine or custom forms | Integrated registration + billing |
| Evaluate coaching staff effectiveness | Intuition | Coach effectiveness dashboard |
| Expose players to college recruiters | Separate recruiting service | Dossier builder + recruiter portal |
| Maintain program reputation online | Separate website | Public program page + dossier ecosystem |

**Must-have features**: Program Analytics, Season Management, Billing Dashboard, Roster Intelligence  
**Success metric**: Director reviews program health dashboard at least weekly. Director does not need to call coaches to get a program status update.

---

### Persona 4 — The Player (High School / AAU)

**Profile**: 14–22 years old, extremely mobile-native. Motivated by growth and opportunity. Monitors their own development. Cares about being seen by college coaches.

**Top jobs to be done:**

| Job | Current workaround | How HoopsOS solves it |
|---|---|---|
| Know what I'm working on and why | Coach conversation, forgotten | My IDP with focus areas and milestones |
| See my improvement over time | Nothing | Skill velocity, development timeline |
| Study film and plays before games | Separate Hudl login | Film assignments + play study in-app |
| Control my recruiting profile | Nothing or external site | Dossier + visibility controls |
| Know when I'm actually available | Group text chaos | Schedule + availability system |
| See when colleges are looking at me | Nothing | Recruiter view activity notifications |

---

### Persona 5 — The Parent / Guardian

**Profile**: 35–55 years old, pays for the program. High trust investment, expects transparency. Wants their child to develop and be seen. Frustrated by information asymmetry.

**Top jobs to be done:**

| Job | Current workaround | How HoopsOS solves it |
|---|---|---|
| Know my child is developing, not just playing | Coach conversation 2x per year | Development digest, IDP visibility |
| Know the schedule and not miss events | Group texts, TeamSnap | Family calendar, push notifications |
| Pay fees without friction | Checks, Venmo, bank transfers | Billing portal with payment plans |
| Communicate with the coaching staff | Coach's cell phone | In-app messaging |
| Understand what coaches see in my child | Annual conversation | Player summary with readiness, attendance, development |
| Know if college coaches are looking | No visibility | Recruiter view activity log |

---

### Persona 6 — The External College Recruiter

**Profile**: 24–45, college assistant coach. Evaluates hundreds of players annually. Values efficiency, credibility of data, and quick access to highlight content.

**Top jobs to be done:**

| Job | Current workaround | How HoopsOS solves it |
|---|---|---|
| Find players by position, year, and geography | NCSA, Hudl recruiting, manual contact | Player search with filtered results |
| Evaluate a player quickly from verified data | Random highlight videos | Coach-curated dossier with assessments and film |
| Know if a player has coachability signals | Nothing | Coaching action resolution, IDP engagement |
| Log my interest without exposing my interest | None | Save to watchlist (visible to player, not other recruiters) |
| Request access to gated content | Email the coach directly | In-app access request workflow |

---

## 7. Differentiators

### vs. Traditional LMS (Canvas, Blackboard, Google Classroom, Thinkific)

| Dimension | LMS | HoopsOS |
|---|---|---|
| Content model | Course/module tree | Development plan tied to coaching observations |
| Trigger for learning | Scheduled enrollment | Coaching action after film review |
| Assessment | Quiz/rubric against curriculum | Real-world skill assessment on court |
| Progress visibility | Grade book | Skill velocity, IDP milestone completion |
| Physical readiness | None | Daily check-in, wearable integration |
| Video | Upload/embed | Film analysis, annotation, AI tagging |
| Team context | Class roster | Roster with positions, status, attendance |
| Game-day relevance | None | Readiness → practice plan → playbook → game day |

**Bottom line**: LMS products have no concept of physical readiness, coaching observations, film, or real-world skill measurement. They are built for curriculum delivery, not performance development.

---

### vs. Team Management Platforms (TeamSnap, SportsEngine, Stack Sports)

| Dimension | Team Management | HoopsOS |
|---|---|---|
| Primary workflow | Scheduling + billing | Film review + development planning |
| Player data | Name, contact, emergency info | IDP, assessments, readiness, film, actions |
| Coach workflow | Event creation | Film → action → practice plan → debrief |
| Parent engagement | Schedule and payment | Development digest, recruiter activity, IDP visibility |
| Analytics | Attendance, payment status | Development velocity, coaching effectiveness, program health |
| Film | None | Core feature |
| Recruiting | None | Dossier, recruiter portal, exposure analytics |

**Bottom line**: Team management platforms are administrative tools. HoopsOS is a coaching and development tool with the administration built in.

---

### vs. Video / Film Platforms (Hudl, Synergy, Coach's Eye)

| Dimension | Film Platform | HoopsOS |
|---|---|---|
| Film → development link | None | Clip → Coaching Action → IDP focus area |
| Film → practice link | None | Film observations surface in practice planner |
| Player development | None | IDP, assessments, benchmarks, skill velocity |
| Team operations | None | Roster, billing, scheduling, season management |
| Parent transparency | None | Development digest, film assignment visibility |
| Recruiting | Highlights only | Full dossier with assessments, development data, film |
| Coach education | None | Embedded learning paths tied to coaching context |

**Bottom line**: Film platforms treat video as the endpoint. HoopsOS treats film as the starting point of a development loop.

---

### The Compounding Advantage

The differentiator is not any single feature — it is the **connected data flywheel**:

```
Daily Check-In → Readiness Score
                      ↓
Film Review → Coaching Actions → Practice Planning → Game Day
                      ↓
           Player Development Plan → Skill Assessments → Benchmarks
                      ↓
                Recruiting Dossier ← Film Clips ← Highlights
                      ↓
              Parent Digest ← IDP Progress ← Milestone Completion
```

Every piece of data generated in one part of the platform makes every other part smarter. No incumbent can replicate this because they own only one node in this graph.

---

## 8. Recommended Vertical-Slice Repo Model

### The canonical feature slice directory

Every feature slice follows this internal structure. Deviation requires a documented reason.

```
client/src/features/<slice-name>/
│
├── types.ts          # Domain types, Zod schemas, enums for this feature
├── hooks.ts          # React Query hooks (useFeatureX, useMutateFeatureX)
├── store.ts          # Zustand client state (only if needed — prefer hooks)
├── compute.ts        # Client-side business logic (derivations, scoring, formatting)
├── mock.ts           # Development and demo seed data for this feature
├── index.ts          # Public barrel: what other slices may import
│
├── components/       # Feature-owned UI components (not in /components/global)
│   ├── FeatureWidget.tsx
│   └── FeatureDetail.tsx
│
├── pages/            # Feature-owned page components
│   ├── FeatureListPage.tsx
│   └── FeatureDetailPage.tsx
│
└── tests/            # Feature-scoped tests
    ├── compute.test.ts
    └── FeatureWidget.test.tsx
```

```
server/modules/<slice-name>/
│
├── routes.ts         # Express/Hono route definitions for this feature
├── service.ts        # Business logic: validation, orchestration, domain rules
├── score.ts          # Domain algorithms (if feature has scoring/computation)
├── notifications.ts  # Domain-specific notification logic (uses lib/sms.ts)
├── schema.ts         # Zod request/response validation schemas
└── tests/
    └── service.test.ts
```

```
shared/db/
│
├── schema/           # Drizzle table definitions (one file per domain entity)
├── repositories/     # Per-domain repository objects (post-VSA split)
│   ├── film.ts
│   ├── roster.ts
│   └── ...
└── repository.ts     # Thin composer — DO NOT add business logic here
```

### Boundary enforcement rules

| Rule | Rationale |
|---|---|
| Features import from `index.ts` only — never from internal files of another feature | Prevents tight coupling, makes refactoring safe |
| `shared/` contains only: design tokens, auth primitives, DB schema, `createRepository` | Anything domain-specific belongs to the feature that owns it |
| No page component imports from `lib/mock/*` directly — only via `features/<name>/mock.ts` | Maintains feature ownership of its own test data |
| Server routes call `service.ts` — never query the DB directly | Keeps business logic testable and out of HTTP handlers |
| `RepoContext` (orgId, userId) is passed to every repository call — never inferred globally | Enforces tenant isolation at the data layer |
| A coaching action is created by the coaching-actions slice, not by film or IDP | Each slice owns its own write operations |
| Cross-feature reads use the repository facade, not direct Drizzle queries | Preserves the org-scoping guarantee |

### What belongs in `shared/`

```
shared/
├── db/               # Schema, repository facade — ONLY these
├── lib/              # auth, tenant context, HttpError — ONLY these
└── types/            # Org, User, Role — ONLY these
```

If you find yourself adding a new file to `shared/` that is not one of the above categories, it belongs in a feature slice.

### The index.ts contract

Every feature's `index.ts` defines its public API. This is the only import other features or pages may use.

```typescript
// features/readiness/index.ts — example
export type { ReadinessStatus, ReadinessConfidence, PlayerReadiness } from "./types";
export { REASON_LABELS, statusColor } from "./types";
export { computePlayerReadiness, computeCheckinScore } from "./compute";
export { ReadinessStatusBadge } from "./components/ReadinessStatusBadge";
// NOT exported: mock.ts, team-mock.ts, internal computation details
```

If a feature needs something from another feature, it imports from that feature's `index.ts`. If the required export doesn't exist there, it either belongs in the requesting feature or is a sign of genuine shared primitives that belong in `shared/`.

### Migration rule for existing shims

Every `@deprecated` shim written during the VSA refactor should be deleted within 30 days of the feature's first post-refactor consumer migration. Run this monthly:

```bash
grep -r "@deprecated" client/src/lib --include="*.ts" | grep -v node_modules
```

Any shim still alive after 60 days with zero non-deprecated consumers is a bug, not a technical decision.

---

## 9. Key Risks

### Risk 1 — Building showcase features instead of habit-forming features

**What happens**: The team prioritizes Recruiting Intelligence (P2, impressive to demo) before Readiness (P0, used daily). Programs sign up for the demo, get a month in, and churn because the daily workflow isn't there.

**Signal to watch**: Are coaches opening the app on practice days without being prompted? If not, the habit loop is broken.

**Mitigation**: Hold P2 features behind a strict gate. P0 must have demonstrably sticky usage before P1 ships. Readiness daily check-in completion rate is the north star metric for the first six months.

---

### Risk 2 — Wrong primary persona

**What happens**: The product is built for the Director persona (who buys) instead of the Coach persona (who uses daily). Directors buy software coaches don't use; the program churns at renewal.

**Signal to watch**: Are head coaches the ones requesting demos, or are directors and admins the requesters? Directors buy, but coaches drive retention.

**Mitigation**: Every P0 feature must be evaluated against "Does a head coach need this on a Tuesday afternoon before practice?" If no, it is not P0.

---

### Risk 3 — Film AI cost spiral

**What happens**: AI film analysis via Gemini/OpenAI is priced per-minute of video. Elite programs upload hours of film weekly. COGS explodes before revenue scales.

**Signal to watch**: Cost per active program per month vs. revenue per active program per month.

**Mitigation**: AI analysis is an opt-in premium feature with usage limits. Default film experience is manual annotation with AI as an accelerator. Build cost controls into the billing layer before enabling AI at scale.

---

### Risk 4 — Recruiting creates privacy and compliance exposure

**What happens**: Player profiles with assessment data, readiness history, and film clips are exposed to external recruiters. A COPPA issue (players under 13), a data breach, or an NCAA compliance question creates legal and reputational risk.

**Mitigation**: Recruiting features require explicit player AND guardian consent per-section before any data is exposed. Age gate at 13. Every recruiter view is logged. Legal review before GA of recruiting portal. Treat this slice with the same scrutiny as healthcare data.

---

### Risk 5 — Feature scope exceeds team capacity

**What happens**: 20 vertical slices sounds manageable until each one has its own service, schema, hooks, components, tests, and mock data. A team of 4 engineers cannot maintain 20 production-quality slices simultaneously.

**Mitigation**: At a startup team size, target 8–10 fully-built slices at launch. Scaffold the others with mock data and non-functional UIs clearly marked as "Coming Soon." Ship depth over breadth. Two amazing features beat twelve mediocre ones.

---

### Risk 6 — Parent portal becomes friction without athlete buy-in

**What happens**: The parent portal surfaces IDP, readiness, and attendance data that players haven't consented to sharing with parents. Players disengage from check-ins because they fear parental scrutiny.

**Mitigation**: Players above 16 control which data their parents see. Default is aggregate summary only (not individual check-in scores). Coaches can override to full visibility for compliance. The player's engagement with the platform must be protected.

---

### Risk 7 — The repository facade becomes a bottleneck again

**What happens**: The VSA refactor split the repository into domain sub-repos, but new engineers add methods to `shared/db/repository.ts` directly because it's the easiest path. The god object regrows.

**Mitigation**: Lint rule: no new exports from `repository.ts` — only imports from `repositories/`. PR review checklist includes "Did you add a new domain method to `shared/db/repositories/<domain>.ts`?" The orchestrator file should never change except to add a new domain import.

---

## 10. Practical Roadmap

### Phase 1 — Foundation (Months 1–3)

**Goal**: A paying program can run their entire season on HoopsOS.

| Work stream | Deliverables |
|---|---|
| **Slice 01 — Roster** | Complete player profiles, status lifecycle, staff roles |
| **Slice 02 — Events** | Calendar, availability polling, attendance recording |
| **Slice 03 — Readiness** | Daily check-in, team dashboard, status computation |
| **Slice 08 — Practice Planning** | Plan builder, drill library, template system |
| **Slice 12 — Messaging** | Direct messages, broadcast, announcements |
| **Slice 14 — Club Ops** | Season setup, team management, registration |
| **Slice 15 — Billing** | Fee creation, Stripe checkout, payment plans |
| **Slice 19 — Admin** | Roles, permissions, audit log |
| **Infrastructure** | Auth (Clerk), multi-tenancy, error tracking, mobile PWA |

**Exit criteria for Phase 1**: A program has run a full season (registration → season setup → events → billing → final report). Coaches check in the app at least 3x per week.

---

### Phase 2 — Intelligence Layer (Months 4–6)

**Goal**: HoopsOS is clearly better than the combination of tools it replaces.

| Work stream | Deliverables |
|---|---|
| **Slice 04 — Film Room** | Upload, annotation, clip creation, film queue |
| **Slice 05 — Coaching Actions** | Action creation from film, action feed, resolution |
| **Slice 06 — Player Development** | IDP creation, focus areas, milestones, drill links |
| **Slice 07 — Assessments** | Assessment rubrics, quick assess flow, history |
| **Slice 09 — Playbook** | V3 canvas, formation library, play quiz |
| **Slice 13 — Parent Portal** | Dashboard, development digest, billing, messaging |
| **Slice 17 — Analytics** | Coach effectiveness dashboard, at-risk intervention |
| **Slice 20 — Notifications** | Readiness alerts, action reminders, weekly digest |

**Exit criteria for Phase 2**: Coaches create at least one coaching action per film session. Parents open the digest weekly. At least one program reports a development conversation that started because of IDP data.

---

### Phase 3 — Moat Building (Months 7–12)

**Goal**: Features that create switching costs, network effects, and premium pricing justification.

| Work stream | Deliverables |
|---|---|
| **Slice 10 — Recruiting** | Dossier builder, privacy controls, director CRM |
| **Slice 11 — Wearables** | Garmin/Whoop integration, load management |
| **Slice 16 — Coach Education** | Learning paths, module player, certifications |
| **Slice 17 — Analytics (advanced)** | North Star Dashboard, VDV Command Center, enterprise rollup |
| **Slice 18 — Recruiting Portal (external)** | Recruiter account, player search, access request |
| **Slice 04 — Film (AI)** | AI tagging pipeline, corroboration, trend detection |
| **Marketing site** | Audience-specific landing pages, demo flow |
| **API / integrations** | Public API for third-party integrations |

**Exit criteria for Phase 3**: At least one program has had a player receive a college scholarship and attributes HoopsOS dossier data to the conversation. At least one program cites HoopsOS analytics in a staff evaluation.

---

### Engineering team structure at each phase

| Phase | Recommended team structure |
|---|---|
| Phase 1 | 2 FE, 2 BE, 1 designer, 1 PM/founder |
| Phase 2 | 3 FE, 2 BE, 1 AI/infra, 1 designer, 1 PM |
| Phase 3 | 4 FE, 3 BE, 1 AI/ML, 1 mobile, 1 designer, 1 PM |

Each Phase 2 engineer should own at least two feature slices end-to-end (UI through DB). Avoid horizontal specialization within a slice (no "the routing guy" and "the DB guy" for the same feature).

---

## 11. The 6 Feature Slices to Spec Next

These are ranked by: daily active use impact × competitive differentiation × implementation readiness.

---

### SPEC 1 — Readiness & Wellness *(highest priority)*

**Why**: This is the daily habit that determines whether the app gets opened every day or once a week. Every other feature benefits from the data it generates.

**Spec scope**:
- Player-facing check-in form: fatigue (1–10), sleep (hours), soreness (1–10), energy (1–10), optional note — submit in under 30 seconds
- Readiness score algorithm: weighted combination of wellness inputs + wearable signals + injury status + attendance streak + assignment load — fully documented with configurable thresholds
- Team dashboard: READY / FLAGGED / RESTRICTED / UNKNOWN grid with confidence indicators, sort by status, drill to individual
- Override system: coach can manually override a player's status with reason code and expiry
- Alert system: Inngest function fires when a player crosses threshold; coach receives in-app + optional SMS
- Readiness → Practice Plan integration: flagged players surface in the plan builder as a sidebar warning
- Longitudinal trend: per-player 14-day and 30-day trend line, exportable

**Key design questions to resolve in spec**:
1. What is the minimum check-in that still generates signal? (Avoid abandonment from long forms)
2. Should coaches see individual check-in answers or only the derived status? (Privacy tradeoff)
3. How do we handle players who game the system with optimistic self-reporting?
4. What is the cutoff time for check-in submission before it counts as missing?

---

### SPEC 2 — Film Room + Coaching Actions *(highest differentiation)*

**Why**: The film → action → practice connection is the core loop that no competitor has built. This is where the product's identity is made or lost.

**Spec scope**:
- Film session creation: upload (Mux), title, type (game/practice/scouting), team, date
- Session player: playback with timeline, keyboard shortcuts, A/B loop
- Annotation layer: timestamped text notes, drawing canvas, player tag, play tag
- Clip extraction: select start/end, create named clip with tags
- AI analysis: background Inngest job — sends video segment to Gemini, returns play type, player IDs, event labels — coach confirms or refutes
- Coaching action creation: from clip context — player, action type, priority, note, due date — one flow, max 4 taps
- Action feed: coach sees all open actions sorted by player and priority
- Action → IDP link: action can be promoted to IDP focus area
- Action → Practice link: open actions surface as suggestions in practice planner
- Film assignment: assign clip to player with instructions; player marks reviewed; coach sees read status
- Play quiz: coach creates question on a clip; player answers from memory in study mode

**Key design questions to resolve in spec**:
1. How does the AI pipeline handle latency? (Async processing — what does the coach see while waiting?)
2. What is the minimum viable manual annotation experience for coaches who won't use AI?
3. How are clips shared with parents — is there a separate parent-safe copy, or visibility controls on the original?
4. How does film assignment completion factor into player engagement scoring?

---

### SPEC 3 — Player Development (IDP + Assessments) *(highest emotional value)*

**Why**: This is the feature that parents tell other parents about. It is the strongest expansion and referral driver. It also creates the longitudinal data that makes the platform irreplaceable after 12 months.

**Spec scope**:
- IDP structure: player → focus areas (skill dimensions) → milestones → drill links → evidence links
- Focus area: name, current level (1–5), target level, target date, coaching cues
- Milestone: description, due date, completion status, evidence (film clip, assessment score, coach note)
- IDP generator: coach selects player, AI drafts IDP from most recent assessment scores + open coaching actions — coach edits and publishes
- Skill assessment: rubric creation (skills + scoring scale), quick assess flow (player-by-player rapid scoring during session), result storage
- Skill velocity: rolling 30/60/90 day rate of change per focus area, visualized as sparkline
- Benchmarks: program average and position average per skill, player score overlaid
- Development timeline: visual milestone history — what was worked on, when, what the outcome was
- Development resume: coach-curated narrative summary of development arc, designed for recruiter viewing
- Growth story: player-facing version of the development narrative
- Parent IDP view: read-only access to active IDP with focus areas and milestone completion
- IDP comments: async coach ↔ player communication thread on the plan

**Key design questions to resolve in spec**:
1. Who creates the IDP — coach only, or collaborative with player? (Ownership and accountability)
2. How often should an IDP be reviewed and updated? (What triggers a review?)
3. What is the relationship between skill assessments and IDP focus areas — can one auto-inform the other?
4. How do we prevent IDPs from being created and never looked at again? (Engagement forcing functions)

---

### SPEC 4 — Practice Planning *(highest daily frequency)*

**Why**: Coaches plan practice every day of the season. If this feature is excellent, HoopsOS is opened every single day. If it's mediocre, coaches plan elsewhere and only visit the app for administrative tasks.

**Spec scope**:
- Plan builder: block-based structure — warm-up, segments, cool-down. Each block has: name, duration, type (drill/scrimmage/film/walkthrough/conditioning), notes, player groups
- Drill library: searchable by skill focus, player count, duration, position. Each drill has: diagram, verbal cues, setup, variations
- Cue library: coach can save and reuse verbal coaching cues attached to drills
- Template system: save plan as template, apply to new date, edit from template
- Readiness integration: sidebar shows today's readiness grid — RESTRICTED players automatically flagged in plan
- Coaching action integration: open actions surface as "suggested focus" items
- WOD planner: conditioning-specific plan builder with load tracking
- Load calculation: total practice minutes, intensity weighting, cumulative weekly load
- Practice execution mode: live mode — timer per block, checklist, quick note capture, pause capability
- Practice review: post-session form — what worked, what to adjust, player performance notes
- Plan sharing: share draft with assistant coaches for collaborative editing
- Practice analytics: segment time allocation by type over season, drill frequency, load trend

**Key design questions to resolve in spec**:
1. Should the plan builder be a drag-drop canvas or a structured form? (Canvas is richer but harder on mobile)
2. How do we handle last-minute practice changes (injury, weather)? (Live editing vs. draft vs. published)
3. How much does the readiness data influence the plan? (Advisory vs. prescriptive)
4. What is the relationship between a drill in the plan and a coaching action in the system?

---

### SPEC 5 — Parent & Guardian Portal *(highest retention leverage)*

**Why**: Programs that keep families engaged retain players. Parents who understand their child's development advocate for the platform and reduce churn. The parent portal is not a courtesy feature — it is a retention machine.

**Spec scope**:
- Parent dashboard: today's summary card (schedule, child's readiness status, billing alert, recent coach update)
- Player summary: attendance rate (last 30 days), readiness trend (last 14 days), open milestones, IDP focus areas (3 most recent)
- Development digest: weekly in-app and email summary — what was worked on, any milestones hit, upcoming events
- Weekly pulse: coach-authored team-wide update (not individual) pushed to all parents
- IDP view: read-only access to child's active IDP — focus areas only, not raw check-in scores
- Schedule: family-facing calendar with event type, location, opponent, required/optional
- Billing: pay fees, view payment history, download receipts, payment plan status
- Forms: sign waivers and registration forms in-app with timestamp and IP logging
- Messages: direct messaging with coaching staff — separate thread from player messages
- Announcements: broadcast messages from coaches or admins
- Child linking: one parent can link multiple children, switch between views
- Privacy settings: parent can request restriction of child's public data (recruiting section)
- Recruiter view activity: notification when a recruiter accesses child's profile (name of institution, date)

**Key design questions to resolve in spec**:
1. How much readiness detail can parents see? (Raw scores vs. status only — player consent model)
2. Should parents be able to message coaches, or only receive messages? (Boundary and volume control)
3. At what age does the player gain control over parent visibility settings?
4. How do we prevent the parent portal from creating helicopter parent behaviors? (Design guardrails)

---

### SPEC 6 — Program Analytics / Director Dashboard *(highest buyer satisfaction)*

**Why**: Directors and ADs make the renewal decision. If they cannot quickly see that the platform is producing outcomes, they do not renew. This slice is the CFO dashboard of the product — built to justify the investment.

**Spec scope**:
- Program Health Dashboard: top-level health score — development completion rate, readiness average, attendance rate, payment collection rate, IDP coverage, coaching action resolution rate
- Coach effectiveness dashboard: per-coach metrics — average action resolution time, IDP completion rate, film sessions created, assessment frequency, player engagement
- Player development outcomes: aggregate view — what percentage of players improved in their top focus area this season; distribution of skill velocity scores
- Roster intelligence: position distribution, grade/grad-year distribution, injury incidence rate, multi-year retention rate
- At-risk intervention: players meeting at-risk criteria (missed 3+ check-ins, attendance below threshold, no IDP activity) — surfaced to coach with escalation option
- Warning metrics dashboard: system-wide alerts — low check-in completion, overdue IDPs, unfilled roster positions, unpaid invoices
- Season report: exportable PDF summary of the season — enrollment, attendance, development, billing, coaching activity
- Club growth metrics: enrollment trend YoY, retention rate, NPS proxy, revenue per program
- Program retention leaders: players most likely to re-enroll; players at churn risk with contributing factors

**Key design questions to resolve in spec**:
1. What is the single number that tells a director if the season is going well? (North Star metric definition)
2. How do we present coaching effectiveness without creating a surveillance dynamic for coaches?
3. What is the export format — PDF only, or integration with stakeholder reporting systems?
4. How early in the season can we surface meaningful signals? (Day 1 has no data — what shows first?)

---

*End of HoopsOS Product Architecture Plan*  
*Principal Product Architect + Staff Application Architect perspective*  
*May 2026*
