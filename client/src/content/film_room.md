# HoopsIQ: Film Room Architecture & Scaffolding

This document details the `(film)` route group, the collaborative video analysis engine for teams. It covers the coach's workflow for clipping and assigning film, the player's inbox experience, granular watch-tracking, and comprehension quizzes.

## 1. Route Structure `(film)`

The Film Room is split into two distinct surfaces: the Coach's command center and the Player's inbox.

**Coach Surfaces:**
*   `/(film)` - The team's central repository of uploaded games and practices.
*   `/(film)/rooms/[roomId]` - A specific game or event (e.g., "State Championship vs. West High").
*   `/(film)/rooms/[roomId]/clips/[clipId]` - The telestration and tagging workspace for a specific play.
*   `/(film)/rooms/[roomId]/assignments` - The dashboard tracking who has watched which clips and their quiz scores.

**Player Surfaces:**
*   `/(film)/player/inbox` - The athlete's to-do list of assigned film.
*   `/(film)/player/clips/[clipId]` - The immersive viewing experience with telestration overlays, quizzes, and the "Acknowledge" button.

## 2. Schema Usage

Building on the canonical schema (Prompt 3), the Film Room utilizes the following entities:

*   `FilmRoom`: A container for a game or practice (`id`, `teamId`, `title`, `date`, `fullGameMuxId`).
*   `FilmClip`: A specific segment of a room (`id`, `roomId`, `title`, `startTime`, `endTime`, `muxAssetId`).
*   `TelestrationAnnotation`: Drawing data tied to a clip (`id`, `clipId`, `timestampSec`, `drawDataJson`, `authorId`).
*   `FilmAssignment`: The task given to an athlete (`id`, `clipId`, `assigneeId`, `dueDate`, `status: PENDING | WATCHED | ACKNOWLEDGED`, `score`).
*   `FilmWatchEvent`: Raw telemetry (`id`, `assignmentId`, `eventType: PLAY | PAUSE | SEEK | END`, `timestampSec`, `createdAt`).
*   `FilmQuiz`: A comprehension test attached to a clip (`id`, `clipId`, `question`, `type: MCQ | TIMED_READ`, `optionsJson`, `correctOption`).
*   `FilmQuizAttempt`: The athlete's answer (`id`, `quizId`, `assigneeId`, `selectedOption`, `isCorrect`, `timeTakenMs`).

## 3. Watch-Tracking Event Model

To ensure accountability, coaches need proof that athletes actually watched the assigned film, not just clicked "Mark as Read."

*   **Granular Events:** The Mux player emits events (`playing`, `pause`, `seeked`, `ended`). A custom React hook debounces these events and sends them to a `/api/film/telemetry` endpoint, creating `FilmWatchEvent` records.
*   **Session Aggregation:** A background cron job (or materialized view) aggregates the raw events to calculate the true `percentageWatched`. If an athlete skips from 0:00 to 5:00, the intervening time is not counted.
*   **Resume Position:** The last `PAUSE` or `SEEK` event updates a `lastWatchedPosition` field on the `FilmAssignment`, allowing the athlete to resume exactly where they left off across devices.
*   **Completion Threshold:** An assignment automatically transitions from `PENDING` to `WATCHED` when `percentageWatched` crosses 90%.

## 4. Quiz Model & Grading Logic

Quizzes ensure active comprehension of the film. They interrupt playback at specific timestamps.

*   **Multiple Choice (MCQ):** The standard format. The video pauses, the telestration canvas dims, and a modal asks, "What was the correct rotation here?"
*   **Identify-Action:** The video pauses, and the athlete must click a specific area on the video frame (e.g., "Click the player who missed the box-out"). The `optionsJson` defines a valid `x,y` bounding box.
*   **Timed Reads:** The video plays at full speed, pauses for exactly 2 seconds, and the athlete must answer a read-and-react question (e.g., "Shoot or Pass?") within a time limit, simulating in-game pressure.
*   **Grading:** `FilmQuizAttempt` records are evaluated immediately. The aggregate score is saved to `FilmAssignment.score`. If the score is below a coach-defined threshold (e.g., 80%), the assignment status remains `PENDING` and prompts a re-watch.

## 5. Coach Compliance Dashboards

The `/(film)/rooms/[roomId]/assignments` route is the coach's accountability hub. It provides a dense, scannable overview of team engagement.

*   **The Heatmap:** A data table where rows are athletes and columns are assigned clips. Cells are color-coded:
    *   *Green:* 100% watched, quiz passed, acknowledged.
    *   *Yellow:* Partial watch or quiz failed.
    *   *Red:* Unwatched past the due date.
*   **Quiz Analytics:** A breakdown of `FilmQuiz` performance. If 80% of the team missed the "Identify the low-man rotation" question, the coach knows what to emphasize in the next live practice.
*   **Acknowledge CTA Tracking:** Coaches can see exactly when an athlete clicked the "I understand this read" button, creating an undeniable audit trail of coaching feedback.

## 6. Player Inbox UX

The `/(film)/player/inbox` is designed for low cognitive load. It surfaces only what the athlete needs to do right now.

*   **The Queue:** A prioritized list of `FilmAssignment` cards. Overdue items are pinned to the top with a red warning badge.
*   **The "Acknowledge" Button:** The primary CTA on a clip detail page (`/(film)/player/clips/[clipId]`). It only unlocks *after* the `percentageWatched` hits the required threshold and any attached `FilmQuiz` is passed. Clicking it transitions the assignment to `ACKNOWLEDGED`.
*   **Completion Check:** A prominent progress ring (e.g., "4/5 Clips Reviewed") gamifies the film session, encouraging the athlete to clear their inbox.

## 7. Mux Signed URLs & Privacy Scopes

Game film is highly sensitive proprietary data. HoopsIQ strictly controls access using Mux Signed URLs.

1.  **Private Assets:** When a coach uploads a full game to Mux, the asset is created with `playback_policy: ["signed"]`. The public Mux URL will return a 403 Forbidden.
2.  **Per-Clip Scope:** When an athlete requests a clip, the Next.js server verifies their `FilmAssignment` via Prisma.
3.  **Token Minting:** If authorized, the server generates a short-lived (e.g., 2-hour) JWT using the Mux Signing Key. This token is appended to the playback URL (e.g., `https://stream.mux.com/{PLAYBACK_ID}.m3u8?token={JWT}`).
4.  **Expiration:** Once the token expires, the video stops playing, preventing athletes from sharing links with rival teams.

## 8. Permissions & Authorization

The Film Room enforces strict boundaries between creators (coaches) and consumers (athletes).

*   **Coach-Only Actions:** Only users with `TEAM_ADMIN` or `ASSISTANT_COACH` roles for the specific `teamId` can upload full games, create clips, draw telestration annotations, and create assignments. This is enforced by `Policy.canAssignFilm(sessionClaims, teamId)`.
*   **Read-Only Athletes:** Athletes cannot browse the entire `FilmRoom` library. They only have read access to the specific `FilmClip` entities explicitly assigned to them via a `FilmAssignment`. This prevents overwhelming the athlete and protects sensitive scouting footage.

## 9. Mobile Usability

Athletes consume film primarily on their phones, often on the bus or in the locker room.

*   **Portrait Film View:** The `/(film)/player/clips/[clipId]` page defaults to portrait mode. The video player occupies the top third of the screen.
*   **Chapter List:** The bottom two-thirds displays a scrollable list of timestamps (telestration annotations or quizzes). Tapping a timestamp seeks the video to that exact moment.
*   **Swipe-to-Comment:** Athletes can swipe left on a specific timestamp to open a quick-reply input, allowing them to ask a clarifying question directly to the coach without leaving the playback context.
*   **Landscape Full-Screen:** Rotating the device forces the video to full-screen landscape, hiding the chapter list but keeping telestration overlays active.

## 10. High-Fidelity Next.js Scaffolding

Below is the foundational code for the `(film)` route group, establishing the coach's assignment dashboard and the player's inbox experience.

### `src/app/(app)/(film)/layout.tsx`

```tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { FilmTopNav } from "@/components/film/top-nav";

export default function FilmRoomLayout({ children }: { children: ReactNode }) {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <FilmTopNav />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
```

### `src/app/(app)/(film)/rooms/[roomId]/assignments/page.tsx` (Coach Dashboard)

```tsx
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Policy } from "@/lib/auth/policy";
import { AssignmentHeatmap } from "@/components/film/assignment-heatmap";
import { QuizAnalyticsCard } from "@/components/film/quiz-analytics-card";

export default async function FilmAssignmentsDashboard({ params }: { params: { roomId: string } }) {
  const { sessionClaims } = auth();
  
  const room = await prisma.filmRoom.findUnique({
    where: { id: params.roomId },
    include: { clips: { include: { assignments: { include: { assignee: true, quizAttempts: true } } } } }
  });

  if (!room) notFound();

  // Defense-in-depth: Ensure the user is a coach for this specific team
  if (!Policy.canAssignFilm(sessionClaims, room.teamId)) {
    return <div className="p-12 text-center text-destructive">Unauthorized: Coach access required.</div>;
  }

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="font-heading text-h2 uppercase tracking-tight">Compliance Dashboard</h1>
        <p className="text-muted-foreground">Tracking film study for: {room.title}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: The Heatmap (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-heading text-xl uppercase tracking-tight border-b border-border pb-2">
            Watch Completion
          </h2>
          <AssignmentHeatmap clips={room.clips} />
        </div>

        {/* Right: Quiz Analytics (1/3 width) */}
        <div className="space-y-4">
          <h2 className="font-heading text-xl uppercase tracking-tight border-b border-border pb-2">
            Quiz Performance
          </h2>
          <div className="space-y-4">
            {room.clips.map(clip => (
              <QuizAnalyticsCard key={clip.id} clip={clip} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### `src/app/(app)/(film)/player/inbox/page.tsx` (Player Inbox)

```tsx
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { FilmAssignmentCard } from "@/components/film/film-assignment-card";
import { InboxProgressRing } from "@/components/film/inbox-progress-ring";
import { CheckCircle2Icon } from "lucide-react";

export default async function PlayerFilmInbox() {
  const { userId } = auth();

  // Fetch pending assignments ordered by due date
  const pendingAssignments = await prisma.filmAssignment.findMany({
    where: { assigneeId: userId, status: { in: ["PENDING", "WATCHED"] } },
    orderBy: { dueDate: "asc" },
    include: { clip: { include: { room: true } } }
  });

  const completedCount = await prisma.filmAssignment.count({
    where: { assigneeId: userId, status: "ACKNOWLEDGED" }
  });

  const totalCount = pendingAssignments.length + completedCount;

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-h2 uppercase tracking-tight">Film Inbox</h1>
          <p className="text-muted-foreground">Your assigned study sessions.</p>
        </div>
        <InboxProgressRing completed={completedCount} total={totalCount} />
      </div>

      {pendingAssignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-muted/30 rounded-lg border border-dashed border-border">
          <CheckCircle2Icon className="h-12 w-12 text-emerald-500 mb-4" />
          <h3 className="font-heading text-xl uppercase">All Caught Up</h3>
          <p className="text-muted-foreground text-center max-w-md mt-2">
            You've completed all assigned film study. Great job staying prepared.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingAssignments.map(assignment => (
            <FilmAssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### `src/app/(app)/(film)/player/clips/[clipId]/page.tsx` (Immersive Player View)

```tsx
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import MuxPlayer from "@mux/mux-player-react";
import { TelestrationOverlay } from "@/components/film/telestration-overlay";
import { QuizModal } from "@/components/film/quiz-modal";
import { AcknowledgeButton } from "@/components/film/acknowledge-button";
import { generateMuxSignedToken } from "@/lib/mux/signed-urls";

export default async function PlayerClipView({ params }: { params: { clipId: string } }) {
  const { userId } = auth();

  // 1. Fetch the specific assignment
  const assignment = await prisma.filmAssignment.findFirst({
    where: { clipId: params.clipId, assigneeId: userId },
    include: { 
      clip: { include: { telestrationAnnotations: true, quizzes: true } },
      quizAttempts: true
    }
  });

  // 2. Authorization: Athletes can only view clips explicitly assigned to them
  if (!assignment) notFound();

  // 3. Generate the secure Mux token (valid for 2 hours)
  const muxToken = generateMuxSignedToken(assignment.clip.muxPlaybackId);

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl uppercase tracking-tight">{assignment.clip.title}</h1>
        <AcknowledgeButton assignmentId={assignment.id} currentStatus={assignment.status} />
      </div>

      <div className="relative bg-black rounded-lg overflow-hidden border border-border aspect-video shadow-2xl">
        {/* The secure Mux player */}
        <MuxPlayer
          playbackId={assignment.clip.muxPlaybackId}
          tokens={{ playback: muxToken }}
          startTime={assignment.lastWatchedPosition} // Resume where they left off
          className="w-full h-full"
          metadata={{
            video_id: assignment.clip.id,
            video_title: assignment.clip.title,
            viewer_user_id: userId,
          }}
        />

        {/* Telestration Layer (Read-only for athletes) */}
        <TelestrationOverlay annotations={assignment.clip.telestrationAnnotations} />

        {/* Interactive Quiz Layer */}
        <QuizModal 
          quizzes={assignment.clip.quizzes} 
          previousAttempts={assignment.quizAttempts} 
          assignmentId={assignment.id} 
        />
      </div>

      <div className="mt-8">
        <h3 className="font-heading text-lg uppercase border-b border-border pb-2 mb-4">Coach's Notes</h3>
        {/* List of timestamped comments corresponding to the telestration annotations */}
      </div>
    </div>
  );
}
```
