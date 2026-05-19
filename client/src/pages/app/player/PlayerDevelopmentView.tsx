/**
 * pages/app/player/PlayerDevelopmentView.tsx
 *
 * Player Development Hub — the "My Plan" tab destination.
 *
 * Information hierarchy (mobile-first, single column):
 *   1. Header        — player name + streak + context
 *   2. CheckInPrompt — conditional; shown only if not checked in today
 *   3. TodayWorkCard — PRIMARY: today's drills (one clear action)
 *   4. TopFocusCard  — #1 focus area with score track, coach note, film
 *   5. CoachFeedback — latest 2 coach notes / film notes
 *   6. Progress      — season week + drill completion snapshot
 *
 * Data: usePlayerHub() tries GET /api/player/hub, falls back to
 * MOCK_HUB_DATA. useMarkDrillDone() optimistically updates the cache.
 *
 * Route: /app/player/development (registered in App.tsx — no change needed)
 * Slice: features/player-development/
 */

import { Flame, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { AppShell } from "@/components/app/AppShell";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";

// Slice — public index only
import { usePlayerHub, useMarkDrillDone } from "@/features/player-development";

// Slice-local components — direct import within same slice is allowed
import { TodayWorkCard    } from "@/features/player-development/components/TodayWorkCard";
import { TopFocusCard     } from "@/features/player-development/components/TopFocusCard";
import { CoachFeedbackCard } from "@/features/player-development/components/CoachFeedbackCard";
import { ProgressSnapshot  } from "@/features/player-development/components/ProgressSnapshot";
import { CheckInPrompt     } from "@/features/player-development/components/CheckInPrompt";

/* ─ Analytics ─────────────────────────────────────────────────────────────── */

function trackEvent(name: string, props?: Record<string, unknown>) {
  if (import.meta.env.DEV) console.info("[player-dev]", name, props);
  // TODO: posthog.capture(name, props) or equivalent
}

/* ─ Loading skeleton ───────────────────────────────────────────────────────── */

function HubSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2 animate-pulse">
        <div>
          <div className="h-3 w-28 rounded bg-muted mb-1.5" />
          <div className="h-5 w-40 rounded bg-muted" />
        </div>
        <div className="h-7 w-24 rounded-full bg-muted" />
      </div>
      <SkeletonCard lines={3} />
      <SkeletonCard lines={5} />
      <SkeletonCard lines={4} />
      <SkeletonCard lines={3} />
    </div>
  );
}

/* ─ Empty state ────────────────────────────────────────────────────────────── */

function HubEmpty() {
  return (
    <div className="flex items-start justify-center px-4 pt-16">
      <Empty className="border border-dashed">
        <EmptyMedia><span className="text-4xl">🎯</span></EmptyMedia>
        <EmptyTitle>Your development plan isn't set up yet.</EmptyTitle>
        <EmptyDescription>
          Your coach will create your Individual Development Plan. Once it's
          ready, your focus areas, drills, and progress will appear here.
        </EmptyDescription>
      </Empty>
    </div>
  );
}

/* ─ Error state ────────────────────────────────────────────────────────────── */

function HubError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-start justify-center px-4 pt-16">
      <Empty className="border border-dashed border-destructive/30">
        <EmptyMedia><span className="text-4xl">⚠️</span></EmptyMedia>
        <EmptyTitle>Couldn't load your plan.</EmptyTitle>
        <EmptyDescription>
          There was a problem fetching your development data.{" "}
          <button
            onClick={onRetry}
            className="underline underline-offset-4 hover:text-primary transition-colors"
          >
            Try again
          </button>
        </EmptyDescription>
      </Empty>
    </div>
  );
}

/* ─ Main view ──────────────────────────────────────────────────────────────── */

export function PlayerDevelopmentView() {
  const { data, isLoading, isError, refetch } = usePlayerHub();
  const { mutate: markDrillDone } = useMarkDrillDone();

  if (isLoading) return <AppShell><HubSkeleton /></AppShell>;

  if (isError || !data) {
    trackEvent("player_hub.error");
    return <AppShell><HubError onRetry={() => refetch()} /></AppShell>;
  }

  const activeFocusAreas = data.focusAreas.filter((fa) => fa.status === "active");

  if (activeFocusAreas.length === 0 && data.recentFeedback.length === 0) {
    trackEvent("player_hub.empty");
    return <AppShell><HubEmpty /></AppShell>;
  }

  const topFocus  = activeFocusAreas[0] ?? null;
  const moreCount = Math.max(0, activeFocusAreas.length - 1);

  function handleDrillDone(id: string) {
    trackEvent("player_hub.drill_done", { focusAreaId: id });
    markDrillDone(id);
  }

  trackEvent("player_hub.viewed", {
    focusAreaCount: activeFocusAreas.length,
    checkedInToday: data.checkedInToday,
    streakDays:     data.season.streakDays,
  });

  return (
    <AppShell>
      {/*
       * Single-column, max-w-2xl, centred — intentionally app-like, not
       * a wide admin dashboard. Reads correctly at 375px and 1440px.
       */}
      <div className="px-4 py-6 max-w-2xl mx-auto flex flex-col gap-4 pb-12">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-[12px] text-muted-foreground mb-0.5">
              Good work, {data.player.firstName}.
            </div>
            <h1 className="text-[24px] font-black leading-tight">
              Your Plan
            </h1>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 rounded-full px-3 py-1.5 shrink-0 mt-0.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[12px] font-bold text-amber-500">{data.season.streakDays}</span>
            <span className="text-[11px] text-amber-500/80">days</span>
          </div>
        </div>

        {/* ── Check-in prompt (conditional) ────────────────────────────── */}
        {!data.checkedInToday && <CheckInPrompt />}

        {/* ── 1. TODAY'S WORK — primary action surface ─────────────────── */}
        <TodayWorkCard
          focusAreas={activeFocusAreas}
          onDrillDone={handleDrillDone}
        />

        {/* ── 2. TOP FOCUS AREA ─────────────────────────────────────────── */}
        {topFocus && (
          <TopFocusCard area={topFocus} moreCount={moreCount} />
        )}

        {/* ── 3. COACH FEEDBACK ─────────────────────────────────────────── */}
        {data.recentFeedback.length > 0 && (
          <CoachFeedbackCard feedback={data.recentFeedback} />
        )}

        {/* ── 4. PROGRESS SNAPSHOT ──────────────────────────────────────── */}
        <ProgressSnapshot season={data.season} />

        {/* ── Footer nav links ──────────────────────────────────────────── */}
        <nav className="rounded-2xl border border-border bg-card divide-y divide-border/60" aria-label="Development navigation">
          {[
            { href: "/app/player/assessments",    label: "Skill Scores & Gaps",       sub: "See how your coach rates each skill" },
            { href: "/app/player/progress",       label: "Streak & Consistency",      sub: "Your habit calendar and compliance" },
            { href: "/app/player/skill-velocity", label: "How Fast You're Improving", sub: "Rate of growth across all skills" },
            { href: "/app/player/milestones",     label: "Milestones Hit",            sub: "Achievements in your development" },
          ].map(({ href, label, sub }) => (
            <Link key={href} href={href} asChild>
              <a className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors group first:rounded-t-2xl last:rounded-b-2xl">
                <div>
                  <div className="text-[13.5px] font-semibold group-hover:text-primary transition-colors">{label}</div>
                  <div className="text-[11.5px] text-muted-foreground mt-0.5">{sub}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors ml-3" />
              </a>
            </Link>
          ))}
        </nav>
      </div>
    </AppShell>
  );
}

export default PlayerDevelopmentView;
