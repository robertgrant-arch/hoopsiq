# HoopsIQ: Information Architecture & Route Map

## 1. Product Sitemap

```text
HoopsIQ
├── Public / Marketing
│   ├── Home
│   ├── Pricing & Entitlements
│   ├── Features (Player, Coach, Team, Expert)
│   ├── Expert Directory
│   └── Authentication (Sign In, Sign Up, Password Reset)
├── Player App
│   ├── Dashboard (WODs, Streaks, XP)
│   ├── Workouts & Drills
│   ├── My Film (Uploads, AI Feedback, Coach Reviews)
│   ├── Classes (Live & VOD)
│   └── Profile & Achievements
├── Coach HQ
│   ├── Dashboard (Pending Reviews, Upcoming Sessions)
│   ├── Roster & Athlete Progression
│   ├── Film Reviews (Telestration & Comments)
│   ├── Playbook Studio (Whiteboard & Animations)
│   └── Education (Course Library)
├── Team / Org Management
│   ├── Dashboard
│   ├── Roster Management (Athletes, Coaches, Parents)
│   ├── Team Film Room & Assignments
│   └── Billing & Entitlements (50% Athlete Discount)
├── Expert Marketplace
│   ├── Dashboard (Revenue, Bookings)
│   ├── Availability & Scheduling
│   ├── Content Management (Courses, Live Sessions)
│   └── Payouts (Stripe Connect)
└── Admin / Back-Office
    ├── User & Org Oversight
    ├── Content Moderation
    └── Financials & Platform Metrics
```

## 2. Next.js App Router Route Map

```text
src/app/
├── (marketing)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── pricing/page.tsx
│   ├── experts/page.tsx
│   └── experts/[expertId]/page.tsx
├── (auth)/
│   ├── layout.tsx
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
├── (app)/
│   ├── layout.tsx
│   ├── (player)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── workouts/
│   │   │   ├── page.tsx
│   │   │   └── [workoutId]/page.tsx
│   │   ├── film/
│   │   │   ├── page.tsx
│   │   │   ├── upload/page.tsx
│   │   │   └── [videoId]/page.tsx
│   │   ├── classes/page.tsx
│   │   └── profile/page.tsx
│   ├── (coach)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── athletes/
│   │   │   ├── page.tsx
│   │   │   └── [athleteId]/page.tsx
│   │   ├── reviews/
│   │   │   ├── page.tsx
│   │   │   └── [reviewId]/page.tsx
│   │   ├── playbook/
│   │   │   ├── page.tsx
│   │   │   └── [playId]/page.tsx
│   │   └── learn/
│   │       ├── page.tsx
│   │       └── [courseId]/page.tsx
│   ├── (team)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── roster/page.tsx
│   │   ├── film-room/
│   │   │   ├── page.tsx
│   │   │   └── [assignmentId]/page.tsx
│   │   └── billing/page.tsx
│   ├── (marketplace)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── schedule/page.tsx
│   │   ├── content/page.tsx
│   │   └── payouts/page.tsx
│   ├── (live)/
│   │   ├── layout.tsx
│   │   └── [roomId]/page.tsx
│   └── (admin)/
│       ├── layout.tsx
│       ├── users/page.tsx
│       ├── orgs/page.tsx
│       ├── content/page.tsx
│       └── financials/page.tsx
```

## 3. Purpose Statements

### Marketing & Auth
*   `/(marketing)/page.tsx`: Sells the unified HoopsIQ vision to all target personas.
*   `/(marketing)/pricing/page.tsx`: Details subscription tiers and highlights the 50% athlete discount entitlement.
*   `/(marketing)/experts/page.tsx`: Public directory showcasing premium experts available for booking.
*   `/(auth)/sign-in/page.tsx`: Entry point for returning users.
*   `/(auth)/sign-up/page.tsx`: Role-based registration funnel.

### Player App
*   `/(player)/dashboard/page.tsx`: Daily hub for WODs, streaks, and XP progression.
*   `/(player)/workouts/[workoutId]/page.tsx`: Immersive player for executing 30-minute programs and drills.
*   `/(player)/film/[videoId]/page.tsx`: Detailed view of AI feedback and coach telestration on a specific upload.
*   `/(player)/classes/page.tsx`: Discovery and access to live and VOD classes.
*   `/(player)/profile/page.tsx`: Gamified skill tracks and achievement showcase.

### Coach HQ
*   `/(coach)/dashboard/page.tsx`: Command center for pending reviews and athlete activity.
*   `/(coach)/athletes/[athleteId]/page.tsx`: Deep dive into a specific athlete's progression and film.
*   `/(coach)/reviews/[reviewId]/page.tsx`: Workspace for telestration and timestamped video comments.
*   `/(coach)/playbook/page.tsx`: Whiteboard studio for creating animated sequences.
*   `/(coach)/learn/page.tsx`: Access to premium coach education courses.

### Team Management
*   `/(team)/dashboard/page.tsx`: Overview of team health, upcoming events, and recent activity.
*   `/(team)/roster/page.tsx`: Management of athletes, assistant coaches, and linked parents.
*   `/(team)/film-room/[assignmentId]/page.tsx`: Collaborative film review and comprehension tracking.
*   `/(team)/billing/page.tsx`: Management of team subscriptions and athlete discount entitlements.

### Marketplace & Live
*   `/(marketplace)/dashboard/page.tsx`: Financial and operational overview for experts.
*   `/(marketplace)/schedule/page.tsx`: Availability management for 1:1 bookings.
*   `/(marketplace)/payouts/page.tsx`: Stripe Connect dashboard for earnings and transfers.
*   `/(live)/[roomId]/page.tsx`: Immersive LiveKit/Daily room for real-time sessions.

### Admin
*   `/(admin)/users/page.tsx`: Global oversight and support tools for user accounts.

## 4. Role-Based Navigation Model

| Role | Primary Nav | Secondary Nav | Role-Specific Shortcuts |
| :--- | :--- | :--- | :--- |
| **Athlete** | Dashboard, Workouts, Film, Classes | Profile, Settings, Billing | "Upload Film", "Start WOD" |
| **Coach** | Dashboard, Athletes, Reviews, Playbook | Education, Profile, Settings | "New Review", "Draw Play" |
| **Team Admin** | Dashboard, Roster, Film Room, Billing | Org Settings, Profile | "Invite Athlete", "Assign Film" |
| **Expert** | Dashboard, Schedule, Content, Payouts | Public Profile, Settings | "Set Availability", "Go Live" |
| **Parent** | Dashboard (Child View), Billing | Settings | "Add Child", "Upgrade Plan" |
| **Super Admin** | Users, Orgs, Content, Financials | System Settings | "Impersonate User" |

## 5. Shared vs. Role-Specific Routes & Access Rules

*   **Shared Routes**: `/(marketing)/*`, `/(auth)/*`, `/(live)/[roomId]`. Accessible based on authentication state and specific event registration.
*   **Role-Specific Routes**:
    *   `/(player)/*`: Restricted to `ATHLETE` and `PARENT` (read-only child view).
    *   `/(coach)/*`: Restricted to `COACH`, `ASSISTANT_COACH`, `EXPERT`.
    *   `/(team)/*`: Restricted to `TEAM_ADMIN`, `ORG_ADMIN`, `COACH`.
    *   `/(marketplace)/*`: Restricted to `EXPERT`.
    *   `/(admin)/*`: Restricted to `SUPER_ADMIN`.
*   **Access Rules**: Enforced via Next.js Middleware for route protection and Prisma extensions for tenant/data isolation.

## 6. Onboarding Route Flows

1.  **Athlete**: Sign Up → `/(onboarding)/athlete/goals` (Age, Skill Level, Goals) → `/(player)/dashboard` (First WOD highlighted).
2.  **Coach**: Sign Up → `/(onboarding)/coach/setup` (Experience, Focus) → `/(coach)/dashboard` → Prompt to "Create Team" or "Invite Athletes".
3.  **Team Admin**: Sign Up → `/(onboarding)/team/org` (Org Setup) → `/(onboarding)/team/create` (Team Creation) → `/(team)/roster` (Roster Import/Invites).
4.  **Expert**: Sign Up → `/(onboarding)/expert/verify` (Verification/Stripe Connect) → `/(marketplace)/dashboard` → Prompt to "Publish Offers".
5.  **Parent**: Sign Up → `/(onboarding)/parent/link` (Link Child via Email/Code) → `/(player)/dashboard` (Read-only view).

## 7. Deep-Link & Notification Patterns

*   **New Coach Comment**: Links directly to the specific timestamp in the film room.
    *   URL: `/app/player/film/vid_123?t=45&commentId=cmt_456`
*   **Live Class Starting**: Links directly to the live room.
    *   URL: `/app/live/room_789`
*   **New Film Assignment**: Links to the team film room assignment.
    *   URL: `/app/team/film-room/assign_012`
*   **Discount Entitlement Granted**: Links to the athlete's billing page with the discount applied.
    *   URL: `/app/player/profile?tab=billing&discount=team_50`

## 8. Mobile-First Responsive Considerations

*   **Mobile-Primary Surfaces**:
    *   **Player App**: Designed for on-court use. Large touch targets, portrait video for drills, swipe gestures for WOD progression.
    *   **Live Classes (Viewer)**: Optimized for mobile viewing, chat overlay.
*   **Desktop-Primary Surfaces (Coach/Admin)**:
    *   **Coach HQ (Reviews & Playbook)**: Telestration and whiteboard animations require precision (mouse/stylus) and larger screens.
    *   **Team Management & Admin**: Data-heavy tables, roster management, and financial dashboards are optimized for desktop/tablet.
    *   **Expert Marketplace**: Content creation and scheduling are complex tasks suited for larger screens.
