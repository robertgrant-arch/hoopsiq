# HoopsIQ: Live Classes Architecture & Scaffolding

This document details the `(live)` route group, providing a Peloton-meets-MasterClass live event experience. It covers discovery, registration, the real-time broadcast room, and the on-demand replay architecture.

## 1. Route Structure `(live)`

The live classes module operates as a distinct premium surface, utilizing edge-to-edge layouts and real-time socket connections.

*   `/(live)` - The discovery grid (Peloton-style posters).
*   `/(live)/[eventId]` - Event detail (countdown, host info, intensity, equipment needed).
*   `/(live)/[eventId]/room` - The actual real-time broadcast surface (LiveKit/Daily).
*   `/(live)/[eventId]/replay` - The on-demand VOD surface with chapter markers.
*   `/(live)/[eventId]/resources` - Downloadable PDFs or workout plans associated with the class.
*   `/(live)/host/[eventId]` - The instructor's command center (start/stop broadcast, manage Q&A, mute all).

## 2. UI States

A `LiveEvent` moves through a strict state machine, dictating the UX for the athlete.

1.  **SCHEDULED:** The event is in the future. The `/[eventId]` page shows a "Register" or "Join Waitlist" button.
2.  **COUNTDOWN:** 15 minutes before start. The `/[eventId]` page transitions to a live countdown timer. Registered athletes can enter the `/[eventId]/room`, which displays a "Starting Soon" holding screen and active chat.
3.  **LIVE:** The host has started the broadcast. The `/[eventId]/room` is active with full-bleed video, reaction rails, and Q&A.
4.  **ENDED:** The host has stopped the broadcast. The room transitions to an "Event Concluded" screen.
5.  **REPLAY_READY:** The recording has been processed by Mux and is available at `/[eventId]/replay`.
6.  **CANCELED:** The event was aborted. Registered athletes receive automated Stripe refunds and push notifications.

## 3. Data Model Confirmations

Building on the canonical schema (Prompt 3), we confirm the following models support the live architecture:

*   `LiveEvent`: The core entity (`id`, `hostId`, `title`, `description`, `scheduledAt`, `status: SCHEDULED | LIVE | ENDED | CANCELED`, `publicPriceCents`, `memberPriceCents`, `capacity`, `intensity`, `equipment`).
*   `Registration`: The attendee record (`id`, `eventId`, `userId`, `status: REGISTERED | WAITLISTED | CANCELED`, `paymentIntentId`, `joinedAt`, `leftAt`).
*   `ReplayAsset`: The VOD artifact (`id`, `eventId`, `muxAssetId`, `muxPlaybackId`, `durationSec`, `chapterMarkers: JSON`).

## 4. Registration & Payment Logic

Live classes utilize the same dual-pricing strategy as the Expert Marketplace to drive core subscriptions.

*   **Member vs. Public Price:** The `LiveEvent` detail page queries the user's JWT claims. If `entitlements.includes("PLAYER_CORE")`, the discounted `memberPriceCents` (or "Included with Membership") is displayed.
*   **Stripe Checkout:** For paid classes, clicking "Register" creates a Stripe Checkout Session. The `success_url` routes back to `/[eventId]` where the UI updates to show "You're In" and adds an "Add to Calendar" button.
*   **Waitlist Promotion:** If `Registration.count >= LiveEvent.capacity`, new users are marked `status: WAITLISTED`. If a registered user cancels, a background worker promotes the next waitlisted user, triggering an email with a 2-hour payment window before moving to the next person.

## 5. Live Room Layout & Component Scaffolding

The `/[eventId]/room` is an immersive, distraction-free environment.

*   **`LiveStage`:** The primary video container. It renders full-bleed on desktop and portrait on mobile. The instructor's feed is pinned as the primary track.
*   **`ChatPanel`:** A real-time scrolling feed of attendee messages. On desktop, it docks to the right side (300px wide). On mobile, it sits below the video or is accessible via swipe.
*   **`ReactionRail`:** A floating horizontal bar of emojis (🔥, 🏀, 💯, 🧠) that float up the screen when clicked, creating a sense of shared energy without cluttering the chat.
*   **`QAQueue`:** A dedicated tab within the `ChatPanel` where athletes submit formal questions. Other attendees can upvote questions. The host can pin a question to the main `LiveStage` while answering it.
*   **`ViewerMetrics` (Optional):** If the class integrates with wearables (e.g., Apple Watch/Whoop), an optional sidebar displays the athlete's current heart rate and calories burned, alongside a leaderboard of effort.
*   **`HostControlBar`:** Visible only to the `hostId`. Contains "Start Broadcast," "Mute All," "End Class," and "Pin Q&A."

## 6. Replay UX

The `/[eventId]/replay` surface transforms the ephemeral live event into a permanent asset.

*   **Chapter Markers:** The host (or an admin) adds timestamps (e.g., `05:12 - Warmup Drills`, `18:45 - The Pick & Roll Read`). These render as visual breaks on the Mux video progress bar.
*   **Resource Downloads:** Any PDFs, drill diagrams, or workout sheets discussed in the class are available for download directly below the player.
*   **Host Notes:** A rich-text summary of key takeaways and the answers to the top Q&A questions from the live session.

## 7. LiveKit Integration Architecture

HoopsIQ uses LiveKit (or Daily.co) for sub-50ms latency broadcasting, essential for interactive sports instruction.

1.  **Token Issuance:** When an athlete hits `/[eventId]/room`, a Server Action verifies their `Registration` and generates a LiveKit JWT token scoped specifically to that room.
2.  **Room Lifecycle:** The room is created dynamically when the host joins. Attendees are placed in a "Waiting Room" state until the host explicitly clicks "Start Broadcast" (which transitions the `LiveEvent` status to `LIVE`).
3.  **Recording Webhook:** When the host clicks "End Class," LiveKit's Egress service automatically records the composite stream (video + screen share) and uploads the MP4 to an S3 bucket.
4.  **Mux Ingestion:** An S3 event trigger (or LiveKit webhook) tells our Next.js backend to ingest that MP4 into Mux. Once Mux returns the `asset_id`, the system creates the `ReplayAsset` record and transitions the event to `REPLAY_READY`.

## 8. Accessibility & Reduced-Motion

A live room can be overwhelming. HoopsIQ adheres to strict accessibility standards.

*   **Reduced-Motion:** If the user's OS has `prefers-reduced-motion` enabled, the `ReactionRail` emojis do not float up the screen; they simply increment a static counter. Chat auto-scrolling is smoothed, and flashing UI elements are disabled.
*   **Screen Readers:** The `ChatPanel` uses `aria-live="polite"` to announce new messages without interrupting the host's audio. The `QAQueue` uses explicit focus management when a question is pinned.

## 9. Mobile Behaviors

The mobile experience (`/(live)/[eventId]/room` on a phone) prioritizes the video feed above all else.

*   **Portrait-First:** The instructor's video is cropped (center-cut) to fill the top half of the portrait screen.
*   **Swipe to Chat/QA:** The bottom half defaults to the `ReactionRail` and a collapsed view of the chat. Swiping up expands the `ChatPanel` to full screen over the video (with the video shrinking to a PiP overlay).
*   **Landscape Mode:** Rotating the phone forces the video full-bleed, hiding all chat and UI elements except a translucent `ReactionRail` that fades out after 3 seconds of inactivity.

## 10. High-Fidelity Next.js Scaffolding

Below is the foundational code for the `(live)` route group, establishing the immersive live room and the discovery grid.

### `src/app/(app)/(live)/layout.tsx`

```tsx
import { ReactNode } from "react";
import { LiveTopNav } from "@/components/live/top-nav";

export default function LiveLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white overflow-hidden">
      {/* Immersive dark theme, distinct from the main app */}
      <LiveTopNav />
      <main className="flex-1 relative">
        {children}
      </main>
    </div>
  );
}
```

### `src/app/(app)/(live)/page.tsx`

```tsx
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { LiveClassPoster } from "@/components/live/live-class-poster";
import { Skeleton } from "@/components/ui/skeleton";

export default async function LiveDiscoveryPage() {
  // Fetch upcoming scheduled events, ordered by soonest
  const upcomingEvents = await prisma.liveEvent.findMany({
    where: { status: "SCHEDULED", scheduledAt: { gt: new Date() } },
    orderBy: { scheduledAt: "asc" },
    include: { host: { include: { user: true } } },
    take: 12
  });

  return (
    <div className="container py-12">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tighter mb-4">
          The Global Hardwood. <span className="text-primary">Live.</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
          Train in real-time with elite coaches and pros from anywhere in the world.
        </p>
      </div>

      <section>
        <h2 className="font-heading text-2xl uppercase tracking-tight mb-6 border-b border-white/10 pb-2">
          Upcoming Sessions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {upcomingEvents.map(event => (
            <LiveClassPoster key={event.id} event={event} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

### `src/app/(app)/(live)/[eventId]/page.tsx` (Detail & Registration)

```tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ClockIcon, UsersIcon, DumbbellIcon, ActivityIcon } from "lucide-react";
import { LiveEventRegistrationForm } from "@/components/live/registration-form";

export default async function LiveEventDetailPage({ params }: { params: { eventId: string } }) {
  const { userId, sessionClaims } = auth();
  
  const event = await prisma.liveEvent.findUnique({
    where: { id: params.eventId },
    include: { host: { include: { user: true } }, registrations: true }
  });

  if (!event) notFound();

  const isRegistered = userId ? event.registrations.some(r => r.userId === userId) : false;
  const isFull = event.registrations.length >= event.capacity;
  const isMember = sessionClaims?.entitlements?.includes("PLAYER_CORE") || false;

  // If the event is live and the user is registered, redirect them straight to the room
  if (event.status === "LIVE" && isRegistered) {
    redirect(`/live/${event.id}/room`);
  }

  // If the event is ended/replay ready, redirect to the replay page
  if (event.status === "ENDED" || event.status === "REPLAY_READY") {
    redirect(`/live/${event.id}/replay`);
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex items-center">
      {/* Cinematic Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30" 
        style={{ backgroundImage: `url(${event.heroImageUrl || '/images/default-live-bg.jpg'})` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

      <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 py-12">
        {/* Left: Event Details */}
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary border border-primary/30">
            <ClockIcon className="mr-2 h-4 w-4" />
            {new Date(event.scheduledAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </div>
          
          <h1 className="font-heading text-5xl md:text-7xl uppercase tracking-tighter leading-none">
            {event.title}
          </h1>
          
          <p className="text-xl text-zinc-300 font-light leading-relaxed">
            {event.description}
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center text-zinc-400 bg-white/5 px-4 py-2 rounded-md border border-white/10">
              <ActivityIcon className="mr-2 h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium uppercase tracking-wider">{event.intensity} Intensity</span>
            </div>
            <div className="flex items-center text-zinc-400 bg-white/5 px-4 py-2 rounded-md border border-white/10">
              <DumbbellIcon className="mr-2 h-5 w-5 text-indigo-400" />
              <span className="text-sm font-medium uppercase tracking-wider">{event.equipment}</span>
            </div>
          </div>
        </div>

        {/* Right: Registration Card */}
        <div className="lg:pl-12 flex flex-col justify-center">
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <img src={event.host.user.imageUrl} alt={event.host.user.name} className="h-12 w-12 rounded-full border-2 border-primary" />
                <div>
                  <p className="text-sm text-zinc-400 uppercase tracking-wider font-bold">Instructor</p>
                  <p className="font-heading text-xl">{event.host.user.name}</p>
                </div>
              </div>
            </div>

            {isRegistered ? (
              <div className="text-center space-y-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 mb-2">
                  <CheckCircle2Icon className="h-8 w-8" />
                </div>
                <h3 className="font-heading text-2xl uppercase">You're In</h3>
                <p className="text-zinc-400">We'll notify you 15 minutes before the session begins.</p>
                <Button variant="outline" className="w-full mt-4 border-white/20 hover:bg-white/10">
                  Add to Calendar
                </Button>
              </div>
            ) : (
              <LiveEventRegistrationForm 
                eventId={event.id} 
                isMember={isMember} 
                publicPrice={event.publicPriceCents} 
                memberPrice={event.memberPriceCents}
                isFull={isFull}
                userId={userId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### `src/app/(app)/(live)/[eventId]/room/page.tsx` (The Broadcast Surface)

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2Icon } from "lucide-react";

export default function LiveRoomPage() {
  const params = useParams();
  const { user, isLoaded } = useUser();
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Fetch the LiveKit JWT token scoped to this specific event and user
    const fetchToken = async () => {
      try {
        const resp = await fetch(`/api/live/${params.eventId}/token`);
        if (!resp.ok) throw new Error("Failed to get token (Not registered or event ended)");
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
        // Handle error state (e.g., redirect to detail page)
      }
    };

    fetchToken();
  }, [user, isLoaded, params.eventId]);

  if (token === "") {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-black">
        <div className="text-center">
          <Loader2Icon className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="font-heading text-xl uppercase tracking-widest animate-pulse">Connecting to Court...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-black">
      <LiveKitRoom
        video={false} // Attendees don't broadcast video by default
        audio={false}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        className="h-full w-full custom-livekit-theme" // We override styles in globals.css to match HoopsIQ branding
      >
        {/* 
          VideoConference provides the core layout.
          In a full implementation, we'd replace this with a highly customized layout 
          featuring the ReactionRail and QAQueue components as defined in the spec.
        */}
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
```
