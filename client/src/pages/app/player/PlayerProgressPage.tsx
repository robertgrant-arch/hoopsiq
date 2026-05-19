/**
 * pages/app/player/PlayerProgressPage.tsx
 *
 * Workout, Habits, and Progression Tracking hub.
 * Route: /app/player/progress
 *
 * Information hierarchy (mobile-first):
 *   1. Today's status bar — check-in done? WOD done?
 *   2. StreakCard         — current streak + 14-day consistency dot strip
 *   3. SelfLogForm        — quick log for extra work (collapsed by default)
 *   4. Recent self-logs   — what the player logged outside WOD
 *   5. HistoryList        — last 7 WOD completions
 *
 * Coach visibility note:
 *   Check-in data → GET /api/readiness/today (already flows to coach readiness grid)
 *   WOD completion → will flow to coaching dashboard when server wired
 *   Self-logs → visible here; coach API endpoint is a follow-up
 *
 * Slice: features/workout-log/
 */

import { Link } from "wouter";
import { CheckCircle2, Circle, Dumbbell, Activity, ChevronRight, Flame } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { Badge } from "@/components/ui/badge";

import {
  useWorkoutHistory,
  useStreakData,
  useSelfLog,
} from "@/features/workout-log";

import { StreakCard   } from "@/features/workout-log/components/StreakCard";
import { SelfLogForm  } from "@/features/workout-log/components/SelfLogForm";
import { HistoryList  } from "@/features/workout-log/components/HistoryList";
import { SELF_LOG_CATEGORY_META } from "@/features/workout-log";
import type { SelfLogEntry } from "@/features/workout-log";

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const MUTED   = "oklch(0.55 0.02 260)";

// ── Today's status strip ──────────────────────────────────────────────────

function TodayStrip({ history }: { history: any[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = (history as any[]).find((r: any) => r.date === today);

  const checkInDone = todayRecord?.checkIn !== null && todayRecord?.checkIn !== undefined;
  const wodDone     = todayRecord?.wod?.status === "completed";

  return (
    <div className="flex gap-2">
      <Link href="/app/player/checkin" asChild>
        <a
          className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-colors"
          style={{
            borderColor:     checkInDone ? `${SUCCESS}40` : "var(--color-border)",
            backgroundColor: checkInDone ? `${SUCCESS}08` : "transparent",
          }}
        >
          <Activity
            className="w-4 h-4 shrink-0"
            style={{ color: checkInDone ? SUCCESS : MUTED }}
          />
          <div className="min-w-0">
            <div className="text-[12px] font-semibold leading-tight">Check-In</div>
            <div className="text-[10.5px]" style={{ color: checkInDone ? SUCCESS : MUTED }}>
              {checkInDone ? "Done ✓" : "Not yet"}
            </div>
          </div>
          {!checkInDone && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: MUTED }} />}
        </a>
      </Link>

      <Link href="/app/player/wod" asChild>
        <a
          className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-colors"
          style={{
            borderColor:     wodDone ? `${SUCCESS}40` : `${WARNING}40`,
            backgroundColor: wodDone ? `${SUCCESS}08` : `${WARNING}05`,
          }}
        >
          <Dumbbell
            className="w-4 h-4 shrink-0"
            style={{ color: wodDone ? SUCCESS : WARNING }}
          />
          <div className="min-w-0">
            <div className="text-[12px] font-semibold leading-tight">Today's WOD</div>
            <div className="text-[10.5px]" style={{ color: wodDone ? SUCCESS : WARNING }}>
              {wodDone ? "Done ✓" : "In progress"}
            </div>
          </div>
          {!wodDone && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: WARNING }} />}
        </a>
      </Link>
    </div>
  );
}

// ── Self-log entry row ────────────────────────────────────────────────────

function SelfLogRow({ entry, onRemove }: { entry: SelfLogEntry; onRemove: (id: string) => void }) {
  const meta = SELF_LOG_CATEGORY_META[entry.category];
  const time = new Date(entry.loggedAt).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/60 last:border-0">
      <span className="text-[18px] leading-none shrink-0">{meta.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium leading-tight truncate">{entry.title}</div>
        <div className="text-[11px] mt-0.5" style={{ color: MUTED }}>
          {meta.label} · {entry.durationMinutes} min · {time}
        </div>
      </div>
      <button
        onClick={() => onRemove(entry.id)}
        className="text-[10px] px-2 py-0.5 rounded border border-border transition hover:border-destructive hover:text-destructive"
        style={{ color: MUTED }}
      >
        Remove
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export function PlayerProgressPage() {
  const { data: history = [], isLoading } = useWorkoutHistory();
  const streak                            = useStreakData();
  const { selfLogs, addEntry, removeEntry } = useSelfLog();

  // Today's self-logs only for the compact section
  const today         = new Date().toISOString().slice(0, 10);
  const todaySelfLogs = selfLogs.filter((e) => e.date === today);
  const recentSelfLogs = selfLogs.slice(0, 5);

  if (isLoading) {
    return (
      <AppShell>
        <div className="px-4 py-6 max-w-2xl mx-auto flex flex-col gap-4">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={8} />
          <SkeletonCard lines={5} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 py-6 max-w-2xl mx-auto flex flex-col gap-4 pb-12">

        {/* Header */}
        <PageHeader
          eyebrow="Player Development"
          title="Progress & Habits"
          subtitle="Your consistency, streak, and everything you've put in."
        />

        {/* 1. Today's status */}
        <TodayStrip history={history} />

        {/* 2. Streak card */}
        <StreakCard streak={streak} />

        {/* 3. Self-log form */}
        <div>
          <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] mb-2" style={{ color: MUTED }}>
            Extra work today ({todaySelfLogs.length})
          </div>
          <SelfLogForm onSubmit={addEntry} />
        </div>

        {/* 4. Recent self-logs (if any) */}
        {recentSelfLogs.length > 0 && (
          <div className="rounded-2xl border border-border bg-card">
            <div className="px-4 pt-4 pb-2">
              <div className="text-[10.5px] font-mono uppercase tracking-[0.12em]" style={{ color: MUTED }}>
                Recent extra work ({recentSelfLogs.length})
              </div>
            </div>
            {recentSelfLogs.map((entry) => (
              <SelfLogRow key={entry.id} entry={entry} onRemove={removeEntry} />
            ))}
          </div>
        )}

        {/* 5. WOD history */}
        <div>
          <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] mb-2" style={{ color: MUTED }}>
            Recent workouts
          </div>
          <HistoryList records={history} limit={7} />
        </div>

        {/* Coach visibility note */}
        <p className="text-[11.5px] text-center pb-2" style={{ color: MUTED }}>
          Your check-in and WOD data is visible to your coach in real time.{" "}
          <Link href="/app/player/checkin" asChild>
            <a className="underline underline-offset-2 hover:text-foreground transition-colors">
              Check in now
            </a>
          </Link>
        </p>
      </div>
    </AppShell>
  );
}

export default PlayerProgressPage;
