# HoopsIQ: Coach HQ Architecture & Scaffolding

This document defines the complete authenticated Coach HQ experience within the `(coach)` route group. It is designed as a dense, high-performance command center for elite programs, prioritizing data density, bulk actions, and keyboard-friendly workflows over generic, padded SaaS UI.

## 1. Information Architecture & Route Tree

The Coach HQ lives entirely within `src/app/(app)/(coach)`. It uses a persistent left sidebar layout on desktop, collapsing to a bottom tab bar with a "More" drawer on mobile.

*   `/(coach)/layout.tsx` - The core shell (sidebar, top nav, Clerk `UserButton`).
*   `/(coach)/onboarding` - First-time setup (profile, team creation/joining, marketplace verification intent).
*   `/(coach)/dashboard` - The command center. Includes parallel slots:
    *   `@queue` - Urgent review items.
    *   `@alerts` - System notifications, expiring assignments, flagged AI uploads.
*   `/(coach)/roster` - Player management, team grouping, parent linking.
*   `/(coach)/assignments` - Creation and tracking of WODs, film, and quizzes.
*   `/(coach)/practice-plans` - Drag-and-drop practice builder with time budgeting.
*   `/(coach)/library` - The coach's personal and org-shared drill/workout templates.
*   `/(coach)/queue` - The central inbox for athlete video uploads awaiting review.
    *   `/(coach)/queue/[uploadId]` - The telestration and timestamped comment interface.
*   `/(coach)/film` - Stub link to the dedicated Film Room module.
*   `/(coach)/playbook` - Stub link to the dedicated Playbook Studio module.
*   `/(coach)/learn` - Coach education courses (included tier).
*   `/(coach)/bookings` - Booking flow for 1:1 consults with elite/famous coaches (Expert Marketplace integration).
*   `/(coach)/messages` - Team broadcasts, per-athlete DMs, and parent-inclusive threads.
*   `/(coach)/settings` - Billing, team plan management, and notification preferences.

## 2. Screen Inventory & Primary Actions

| Route | Purpose | Primary Actions |
| :--- | :--- | :--- |
| **Dashboard** | High-level compliance and urgent action triage. | View compliance metrics; Jump to urgent queue items. |
| **Roster** | Manage the active team and subgroups. | Invite athlete; Create group (e.g., "Guards"); Message parents. |
| **Assignments** | Dispatch work and track completion. | Create assignment (WOD/Film); Bulk assign to group; View completion heatmap. |
| **Practice Plans** | Build structured, time-boxed practice schedules. | Create plan; Drag/drop drills; Print to PDF. |
| **Library** | Store reusable drills and workout templates. | Create template; Browse org library; Import from marketplace. |
| **Queue** | Process athlete uploads systematically. | Filter by position/date; Mark as reviewed; Open telestration canvas. |
| **Queue Details** | Provide elite, frame-accurate feedback. | Add timestamp comment; Draw on frame; Record voiceover; Approve. |
| **Messages** | Centralized, COPPA-compliant communication. | Send team broadcast; DM athlete (auto-cc parent). |

## 3. State Model & Mock Data

The Coach HQ relies heavily on the `TeamMembership` and `WorkoutAssignment` models from the canonical schema.

**Core State Entities:**
*   `activeTeamId`: The currently selected team (coaches can manage multiple).
*   `complianceData`: Aggregated stats (e.g., `completed: 18, pending: 4, missed: 2`).
*   `reviewQueue`: Array of `VideoUpload` objects with `status: PENDING_REVIEW`.

**Mock Data Structure (Zustand/SWR shape):**
```json
{
  "activeTeam": {
    "id": "team_123",
    "name": "Varsity Boys Basketball",
    "season": "2026-2027"
  },
  "compliance": {
    "todayWodId": "wod_456",
    "completionRate": 85,
    "missedAthletes": ["usr_789", "usr_012"]
  },
  "queue": [
    {
      "uploadId": "vid_abc",
      "athleteName": "Marcus Johnson",
      "drillName": "Transition Pull-up",
      "uploadedAt": "2026-05-14T08:30:00Z",
      "aiFlags": ["Low release point", "Off-balance landing"]
    }
  ]
}
```

## 4. Defense-in-Depth Authorization Guards

Every route and server action in Coach HQ enforces strict RBAC rules, primarily ensuring the coach has explicit rights over the requested resource *for the active team*.

*   **Middleware (`middleware.ts`):** Verifies the `globalRole` claim includes `COACH` or `TEAM_ADMIN` before allowing entry to `/(coach)/*`.
*   **Layout Guard (`layout.tsx`):** Fetches the user's `teams` claim. If empty, redirects to `/(coach)/onboarding`.
*   **Route Guards (e.g., `/(coach)/queue/[uploadId]/page.tsx`):**
    *   *Rule:* `video.review.assigned`
    *   *Implementation:* Queries the database to ensure the `uploaderId` of the video is currently on a roster where the requesting user holds a `TEAM_ADMIN` or `ASSISTANT_COACH` role.
*   **Action Guards (e.g., `createAssignment`):**
    *   *Rule:* `assignment.create.team`
    *   *Implementation:* Validates that the `teamId` payload matches a team where the user has assignment creation privileges.

## 5. Bulk Actions

Efficiency is paramount. Coach HQ supports robust bulk actions via the `DataTable` component.

*   **Bulk Assign:** Select multiple athletes or a pre-defined "Group" (e.g., "Bigs"), select a `WorkoutTemplate` or `FilmClip`, and dispatch in one click.
*   **Bulk Message:** Select multiple athletes and send a broadcast message (creates individual threads, auto-cc'ing linked parents).
*   **Bulk Mark Reviewed:** For low-priority uploads, coaches can select multiple videos in the Queue and mark them `status: REVIEWED` without opening the telestration canvas.

## 6. High-Fidelity Next.js Scaffolding

Below is the foundational code for the `(coach)` route group, establishing the dense, desktop-primary layout and key screens.

### `src/app/(app)/(coach)/layout.tsx`

```tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { CoachSidebar } from "@/components/coach/sidebar";
import { TopNav } from "@/components/coach/top-nav";
import { Policy } from "@/lib/auth/policy";

export default async function CoachLayout({ children }: { children: ReactNode }) {
  const { sessionClaims } = auth();
  
  // Defense-in-depth: Ensure user has a coach role
  if (!Policy.isCoach(sessionClaims)) {
    redirect("/dashboard"); // Redirect non-coaches to general app home
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <CoachSidebar />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        
        {/* Main Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Tab Bar (hidden on desktop) */}
      <nav className="md:hidden border-t border-border bg-card p-2 flex justify-around">
        {/* Mobile nav items */}
      </nav>
    </div>
  );
}
```

### `src/app/(app)/(coach)/dashboard/page.tsx`

```tsx
import { Suspense } from "react";
import { ComplianceGrid } from "@/components/coach/compliance-grid";
import { QueueSummary } from "@/components/coach/queue-summary";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoachDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-h2 uppercase tracking-tight">Command Center</h1>
        <p className="text-muted-foreground">Overview for Varsity Boys Basketball</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Compliance (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-heading text-xl uppercase tracking-tight border-b border-border pb-2">
            Today's Compliance
          </h2>
          <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
            <ComplianceGrid teamId="current_team" />
          </Suspense>
        </div>

        {/* Right Column: Urgent Action Queue (1/3 width) */}
        <div className="space-y-6">
          <h2 className="font-heading text-xl uppercase tracking-tight border-b border-border pb-2 text-warning">
            Action Required
          </h2>
          <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
            <QueueSummary limit={5} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
```

### `src/app/(app)/(coach)/roster/page.tsx`

```tsx
import { RosterTable } from "@/components/coach/roster-table";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export default function RosterPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-h2 uppercase tracking-tight">Roster Management</h1>
          <p className="text-muted-foreground">Manage athletes, groups, and parent links.</p>
        </div>
        <Button className="font-heading uppercase tracking-wide shadow-glow-primary">
          <PlusIcon className="mr-2 h-4 w-4" /> Invite Athlete
        </Button>
      </div>

      {/* High-density data table with bulk actions */}
      <RosterTable teamId="current_team" />
    </div>
  );
}
```

### `src/app/(app)/(coach)/queue/[uploadId]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { TelestrationCanvas } from "@/components/coach/telestration-canvas";
import { TimestampCommentInput } from "@/components/coach/timestamp-comment-input";
import { ReviewCommentThread } from "@/components/coach/review-comment-thread";
import { Policy } from "@/lib/auth/policy";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export default async function ReviewQueueDetailPage({ params }: { params: { uploadId: string } }) {
  const { sessionClaims } = auth();
  
  // Defense-in-depth: Ensure coach can review THIS specific video
  const canReview = await Policy.canReviewVideo(sessionClaims, params.uploadId);
  if (!canReview) notFound();

  const video = await prisma.videoUpload.findUnique({ where: { id: params.uploadId } });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
      {/* Left: Video & Telestration (3/4 width) */}
      <div className="lg:col-span-3 flex flex-col space-y-4">
        <div className="relative flex-1 bg-black rounded-lg overflow-hidden border border-border">
          {/* Custom Mux wrapper with drawing layer */}
          <TelestrationCanvas videoUrl={video.muxPlaybackUrl} />
        </div>
        <TimestampCommentInput uploadId={video.id} />
      </div>

      {/* Right: Feedback Thread & AI Summary (1/4 width) */}
      <div className="flex flex-col border border-border rounded-lg bg-card overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <h3 className="font-heading text-lg uppercase">AI Observations</h3>
          <ul className="text-sm text-muted-foreground list-disc pl-4 mt-2">
            <li>Release angle: 42° (Optimal: 45°)</li>
            <li>Base slightly narrow on catch</li>
          </ul>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ReviewCommentThread uploadId={video.id} />
        </div>
      </div>
    </div>
  );
}
```

## 7. Remaining Route Stubs

### `src/app/(app)/(coach)/assignments/page.tsx`
*   **Purpose:** Central hub for dispatching WODs and tracking completion.
*   **Key Component:** `AssignmentComposer` (A multi-step `Sheet` component for selecting a template, selecting athletes/groups, setting a due date, and dispatching).

### `src/app/(app)/(coach)/practice-plans/page.tsx`
*   **Purpose:** Drag-and-drop builder for in-person practice sessions.
*   **Key Component:** `PracticePlanBuilder` (A timeline interface where coaches drag `Drill` blocks, allocating time (e.g., 10 mins) to each. Automatically calculates total practice duration).

### `src/app/(app)/(coach)/library/page.tsx`
*   **Purpose:** The coach's personal and organizational content repository.
*   **Key Component:** A tabbed interface separating "My Templates", "Org Shared", and "Marketplace Imports".

### `src/app/(app)/(coach)/messages/page.tsx`
*   **Purpose:** COPPA-compliant communication hub.
*   **Key Component:** `AnnouncementModal` (For team-wide broadcasts) and a dual-pane messaging interface (contacts on left, thread on right). Parents are visibly tagged in threads involving minor athletes.

### `src/app/(app)/(coach)/learn/page.tsx` & `/bookings/page.tsx`
*   **Purpose:** Professional development for the coach.
*   **Key Component:** `BookingCatalog` (A grid of available expert timeslots) and `MediaCard` grids for course consumption.

## 8. Component Library (Coach Specific)

These components extend the foundational design system defined in Prompt 5, optimized for data density.

*   `CoachHero`: A dense header component. Unlike the marketing `CinematicHero`, this is purely functional. It displays the active team name, season, and a quick-action dropdown.
*   `ComplianceGrid`: A heatmap-style `DataTable`. Rows are athletes, columns are the last 7 days of assignments. Cells are color-coded (Emerald = Complete, Amber = Late, Red = Missed).
*   `QueueRow`: A highly scannable list item. Shows the video thumbnail, athlete name, drill type, and a prominent badge if the AI flagged a critical mechanical flaw.
*   `TelestrationCanvas`: A specialized wrapper around the Mux player. It captures `x,y` coordinates and ties them to the current `timestampSec` of the video. Requires `pointer-events-none` on the video element itself so the canvas can capture drawing events.
*   `TimestampCommentInput`: An input field that automatically pauses the video on focus and prepends the current timestamp (e.g., `[01:14]`) to the comment text.
*   `AssignmentComposer`: A complex, stateful `Sheet` that handles the multi-step flow of creating an `WorkoutAssignment` and dispatching notifications.
*   `PracticePlanBuilder`: Uses `dnd-kit` for drag-and-drop drill sequencing.
*   `RosterTable`: A `DataTable` with bulk-selection checkboxes. Actions include "Change Group", "Remove from Roster", and "Send Message".
*   `AnnouncementModal`: A `Dialog` containing a rich-text editor for broadcasting messages to the entire team (and linked parents).
*   `BookingCatalog`: Integrates with the Expert Marketplace, showing a calendar view of available 1:1 slots with elite coaches.
*   `CoachMetricTile`: A small, dense `StatCard` used on the dashboard (e.g., "Pending Reviews: 12").

## 9. Responsive Strategy & States

### Desktop-Primary Focus
Coach HQ is fundamentally a desktop application. Coaches need screen real estate to review film, draw plays, and analyze compliance heatmaps.
*   **Tables:** `DataTable` components use sticky headers and allow horizontal scrolling on smaller screens rather than stacking data (which destroys scannability).
*   **Sidebar:** Persistent on desktop for rapid switching between Roster, Assignments, and Queue.

### Mobile Fallback
While desktop is primary, coaches often check compliance or approve uploads from their phones.
*   **Navigation:** The left sidebar disappears, replaced by a bottom tab bar (`Dashboard`, `Queue`, `Messages`, `More`).
*   **Telestration:** On mobile, telestration defaults to viewing only. Drawing is disabled by default (or hidden behind a specific "Enter Draw Mode" button) to prevent accidental swipes while scrolling the video.

### Empty States, Skeletons, and Optimistic UI
*   **Empty States:** Never a blank screen. An empty Roster shows a "Add your first athlete" illustration. An empty Queue shows a "You're all caught up" success message with a green checkmark.
*   **Skeletons:** Used for the `ComplianceGrid` and `QueueSummary` on the dashboard. They mimic the exact shape of the table rows, preventing layout shift when data loads.
*   **Optimistic UI:** When a coach marks a video as "Reviewed" in the queue, the `QueueRow` instantly slides out of view (`opacity-0 translate-x-full`) before the server mutation completes, keeping the coach in a state of flow. If the mutation fails, a `Toast` appears and the row slides back in.
