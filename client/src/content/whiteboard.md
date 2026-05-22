# HoopsIQ: Whiteboard & Playbook Studio

This document defines the `(whiteboard)` route group, an advanced tactical authoring and learning environment. It allows coaches to design multi-phase plays, present them with voiceover, and test athlete comprehension through interactive quizzes.

## 1. Product Architecture (Canvas Approach)

Building a high-performance, multi-frame playbook editor requires choosing the right rendering engine.

**Recommendation: `react-konva` (HTML5 Canvas)**
*   *Why not raw SVG?* While SVG is great for static diagrams, manipulating hundreds of nodes (tokens, paths, arrowheads, dashed lines) across multiple frames in real-time can cause DOM bloat and performance lag on mobile devices.
*   *Why not tldraw?* Tldraw is excellent for freeform whiteboarding, but a basketball playbook requires strict constraints (e.g., tokens snapping to paths, specific arrow styles for passes vs. dribbles, strict frame-by-frame timelines).
*   *Why Konva?* `react-konva` provides a declarative React API over a highly optimized HTML5 Canvas. It handles drag-and-drop, complex path rendering (quadratic bezier curves for passes), and z-index layering effortlessly, while keeping the React component tree clean.

## 2. State Model (Zustand)

A playbook is a complex document. We use `zustand` for state management to avoid React Context re-render cascades during high-frequency drag events. We use a **CRDT-free optimistic save** model because playbook authoring in HoopsIQ is single-player (the coach authors, the players consume).

**Play Document Schema (`PlayJSON`)**
```typescript
type PlayJSON = {
  id: string;
  title: string;
  courtType: "HALF" | "FULL";
  frames: Frame[];
};

type Frame = {
  id: string;
  order: number;
  phase: "ENTRY" | "TRIGGER" | "READ_1" | "READ_2" | "COUNTER" | "SAFETY";
  notes: string;
  tokens: Token[];
  paths: Path[];
};

type Token = {
  id: string;
  type: "OFFENSE" | "DEFENSE" | "BALL" | "CONE";
  label: string; // e.g., "1", "X2"
  x: number;
  y: number;
};

type Path = {
  id: string;
  type: "PASS" | "DRIBBLE" | "CUT" | "SCREEN" | "HANDOFF";
  points: number[]; // [x1, y1, cx, cy, x2, y2] for curves
  startTokenId?: string;
  endTokenId?: string;
};
```

**Zustand Store (`usePlaybookStore`)**
*   `play`: The current `PlayJSON`.
*   `activeFrameId`: The frame currently being edited.
*   `selectedElementIds`: Array of selected tokens/paths.
*   `toolMode`: "SELECT" | "TOKEN" | "PATH_PASS" | "PATH_DRIBBLE" | "PATH_CUT" | "PATH_SCREEN".
*   `actions`: `addToken`, `moveToken`, `addPath`, `updatePath`, `addFrame`, `undo`, `redo`.

## 3. Route Structure `(whiteboard)`

The module is split between the authoring environment (Coach) and the consumption/testing environment (Athlete).

*   `/(whiteboard)` - The studio dashboard. Recent plays, team playbooks.
*   `/(whiteboard)/playbooks` - Directory of organized playbooks (e.g., "Zone Offense 2026").
*   `/(whiteboard)/playbooks/[bookId]` - The contents of a specific playbook.
*   `/(whiteboard)/plays/[playId]` - **The Authoring Studio.** The complex drag-and-drop editor.
*   `/(whiteboard)/plays/[playId]/study` - **Athlete Study Mode.** A read-only, step-through player for the play.
*   `/(whiteboard)/plays/[playId]/quiz` - **Athlete Testing Mode.** Interactive comprehension checks.
*   `/(whiteboard)/plays/[playId]/analytics` - **Coach Analytics.** Dashboard showing team comprehension scores.

## 4. Component Inventory

The Playbook Studio is a dense, desktop-first editor.

*   **`CourtCanvas`:** The core `react-konva` `Stage`. Renders the background image (half/full court) and manages the `Layer` for tokens and paths.
*   **`Token`:** A draggable Konva `Group` (circle + text) representing O1, X2, Ball, etc.
*   **`PathTool`:** A custom Konva component that draws bezier curves with specific styling based on the path type (e.g., solid line with arrow for pass, dashed line for cut, zig-zag for dribble, perpendicular flat line for screen).
*   **`SequenceTimeline`:** A horizontal bar at the bottom of the editor. Shows each `Frame` as a thumbnail. Coaches can drag to reorder frames or click "Add Frame" (which duplicates the previous frame's end state as the new frame's start state).
*   **`PlayPalette`:** The left sidebar containing draggable tokens and path tools.
*   **`PhaseTagger`:** A dropdown attached to each frame allowing the coach to label the tactical intent (Entry, Trigger, Read 1, Read 2, Counter, Safety).
*   **`StudyMode`:** The athlete-facing component. It replaces the editor palette with a simple "Play/Pause/Next" controller, animating tokens along their paths between frames.
*   **`QuizMode`:** The testing interface. Overlays the canvas with interactive prompts.
*   **`UnderstandingScoreCard`:** A coach dashboard component showing which athletes passed/failed the quiz for a specific play.

## 5. Persistence Model

Playbooks require frequent saving without interrupting the coach's flow.

*   **Auto-Save:** Every time the `zustand` store mutates (a token is dropped, a path is drawn), a debounced function (e.g., 2000ms) serializes the `PlayJSON` and sends a `PUT /api/plays/[playId]` request.
*   **History Snapshots:** Every 5 minutes, the server creates a new row in a `PlayVersionHistory` table, allowing the coach to revert destructive changes.
*   **Optimistic Saves:** The UI never blocks on a save request. If a save fails (e.g., network drop), a small red indicator appears in the header, and the changes are queued in `localStorage` to be retried.

## 6. Quiz & Testing Interaction Model

To truly learn a playbook, athletes must prove they understand the reads, not just memorize the lines.

*   **Identify-the-Action:** The play animates up to a specific frame and pauses. A modal asks, "What is the primary action here?" (Options: Flex Screen, Flare Screen, DHO, Pick & Roll).
*   **Predict-Next-Read:** The play animates through the "Trigger" phase. The ball handler comes off a ball screen. The play pauses. The modal asks, "If X5 drops, what is the read?" (Options: Pull-up jumper, Pocket pass to 5, Skip pass to 2).
*   **Place-the-Player:** The canvas clears all offensive tokens except the ball handler. The athlete must drag O2, O3, O4, and O5 to their correct spacing spots based on the play call.
*   **Grading:** Each correct answer increments the `UnderstandingScore`. A score below 80% requires the athlete to re-take the quiz before the play is marked "Mastered" in their dashboard.

## 7. Keyboard Shortcuts (Rapid Authoring)

Coaches need to build playbooks quickly. The editor supports standard vector-graphics shortcuts.

*   `V`: Select tool (default)
*   `T`: Token tool (click to drop an offensive player, shift-click for defense)
*   `P`: Pass tool (click and drag to draw a solid line)
*   `D`: Dribble tool (click and drag to draw a zig-zag line)
*   `C`: Cut tool (click and drag to draw a dashed line)
*   `S`: Screen tool (click and drag to draw a flat-ended line)
*   `Spacebar + Drag`: Pan the canvas
*   `Cmd/Ctrl + Z`: Undo
*   `Cmd/Ctrl + Shift + Z`: Redo
*   `Arrow Keys`: Nudge selected token by 1px (Shift + Arrow for 10px)
*   `Backspace / Delete`: Remove selected token or path

## 8. Mobile Behavior

Playbook authoring is strictly a desktop/tablet experience. The screen real estate required for a canvas, timeline, and palette makes phone authoring impossible.

*   **Read-Only Study Mode:** On mobile phones, the `/(whiteboard)/plays/[playId]` route redirects to `/(whiteboard)/plays/[playId]/study`.
*   **Pinch Zoom:** The `CourtCanvas` supports native pinch-to-zoom and two-finger panning for athletes reviewing complex plays on small screens.
*   **Touch Tokens:** In `QuizMode` (Place-the-Player), tokens are enlarged slightly to accommodate imprecise finger taps, snapping aggressively to predefined "zones" on the court to reduce frustration.

## 9. High-Fidelity Next.js Scaffolding

Below is the foundational code for the `(whiteboard)` route group, establishing the canvas architecture and the distinct authoring vs. study environments.

### `src/app/(app)/(whiteboard)/layout.tsx`

```tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { WhiteboardTopNav } from "@/components/whiteboard/top-nav";

export default function WhiteboardLayout({ children }: { children: ReactNode }) {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex flex-col h-screen bg-zinc-50 text-zinc-900 overflow-hidden">
      {/* Light theme for the canvas editor to mimic a real whiteboard */}
      <WhiteboardTopNav />
      <main className="flex-1 relative">
        {children}
      </main>
    </div>
  );
}
```

### `src/app/(app)/(whiteboard)/plays/[playId]/page.tsx` (Authoring Studio)

```tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Policy } from "@/lib/auth/policy";
import { PlaybookEditor } from "@/components/whiteboard/editor/playbook-editor";
import { PlayPalette } from "@/components/whiteboard/editor/play-palette";
import { SequenceTimeline } from "@/components/whiteboard/editor/sequence-timeline";

export default async function PlayAuthoringPage({ params }: { params: { playId: string } }) {
  const { sessionClaims } = auth();
  
  const play = await prisma.play.findUnique({
    where: { id: params.playId },
    include: { playbook: true }
  });

  if (!play) notFound();

  // Defense-in-depth: Ensure the user is a coach for the team that owns this playbook
  if (!Policy.canEditPlaybook(sessionClaims, play.playbook.teamId)) {
    // If they are just an athlete on the team, redirect to study mode
    if (Policy.canViewPlaybook(sessionClaims, play.playbook.teamId)) {
      redirect(`/whiteboard/plays/${play.id}/study`);
    }
    return <div className="p-12 text-center text-destructive">Unauthorized</div>;
  }

  return (
    <div className="flex h-full w-full">
      {/* Left Sidebar: Tools & Tokens */}
      <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col">
        <PlayPalette />
      </aside>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col relative bg-zinc-100">
        {/* The Konva Canvas (Client Component) */}
        <div className="flex-1 relative overflow-hidden">
          <PlaybookEditor initialData={play.documentJson} playId={play.id} />
        </div>

        {/* Bottom Timeline */}
        <div className="h-48 border-t border-zinc-200 bg-white">
          <SequenceTimeline playId={play.id} />
        </div>
      </div>
    </div>
  );
}
```

### `src/app/(app)/(whiteboard)/plays/[playId]/study/page.tsx` (Athlete Study Mode)

```tsx
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Policy } from "@/lib/auth/policy";
import { PlayViewer } from "@/components/whiteboard/study/play-viewer";
import { PlaybackControls } from "@/components/whiteboard/study/playback-controls";
import { PhaseNotes } from "@/components/whiteboard/study/phase-notes";

export default async function PlayStudyPage({ params }: { params: { playId: string } }) {
  const { sessionClaims } = auth();
  
  const play = await prisma.play.findUnique({
    where: { id: params.playId },
    include: { playbook: true }
  });

  if (!play) notFound();

  // Defense-in-depth: Ensure user is on the roster
  if (!Policy.canViewPlaybook(sessionClaims, play.playbook.teamId)) {
    return <div className="p-12 text-center text-destructive">Unauthorized</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row h-full w-full">
      {/* Main Canvas Area (Read-Only) */}
      <div className="flex-1 flex flex-col relative bg-zinc-100">
        <div className="flex-1 relative overflow-hidden">
          {/* Renders the Konva canvas but disables all drag/select events */}
          <PlayViewer playData={play.documentJson} />
        </div>
        
        {/* Simple Play/Pause/Next/Prev Controls */}
        <div className="h-20 border-t border-zinc-200 bg-white flex items-center justify-center">
          <PlaybackControls />
        </div>
      </div>

      {/* Right Sidebar: Coach Notes per Phase */}
      <aside className="w-full lg:w-80 border-l border-zinc-200 bg-white p-6 overflow-y-auto">
        <h2 className="font-heading text-xl uppercase tracking-tight mb-6">{play.title}</h2>
        <PhaseNotes playData={play.documentJson} />
      </aside>
    </div>
  );
}
```

### `src/components/whiteboard/editor/playbook-editor.tsx` (Konva Client Stub)

```tsx
"use client";

import { useEffect, useRef } from "react";
import { Stage, Layer, Image as KonvaImage, Circle, Text, Line } from "react-konva";
import useImage from "use-image";
import { usePlaybookStore } from "@/lib/stores/playbook-store";

// This is a simplified stub of the complex Konva implementation
export function PlaybookEditor({ initialData, playId }: { initialData: any, playId: string }) {
  const { play, setPlay, activeFrameId, toolMode } = usePlaybookStore();
  const [courtImage] = useImage("/images/half-court-diagram.png");
  const stageRef = useRef<any>(null);

  // Initialize store on mount
  useEffect(() => {
    if (initialData && !play) {
      setPlay(initialData);
    }
  }, [initialData, play, setPlay]);

  if (!play) return null;

  const activeFrame = play.frames.find(f => f.id === activeFrameId) || play.frames[0];

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* The Stage must be sized exactly to the court aspect ratio */}
      <Stage width={800} height={750} ref={stageRef} className="shadow-lg border border-zinc-300">
        <Layer>
          {/* Background Court */}
          <KonvaImage image={courtImage} width={800} height={750} />
          
          {/* Render Paths (Passes, Cuts, Screens) */}
          {activeFrame.paths.map(path => (
            <Line
              key={path.id}
              points={path.points}
              stroke={path.type === "PASS" ? "#000" : "#6D28D9"}
              strokeWidth={3}
              dash={path.type === "CUT" ? [10, 5] : []}
              tension={0.5} // Curves the line through the points
            />
          ))}

          {/* Render Tokens (Players, Ball) */}
          {activeFrame.tokens.map(token => (
            <Circle
              key={token.id}
              x={token.x}
              y={token.y}
              radius={16}
              fill={token.type === "OFFENSE" ? "#F59E0B" : "transparent"}
              stroke={token.type === "DEFENSE" ? "#EF4444" : "#F59E0B"}
              strokeWidth={3}
              draggable={toolMode === "SELECT"}
              onDragEnd={(e) => {
                // Update zustand store with new x,y coordinates
                // usePlaybookStore.getState().updateTokenPosition(...)
              }}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
```
