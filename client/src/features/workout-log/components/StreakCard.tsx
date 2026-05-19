/**
 * features/workout-log/components/StreakCard.tsx
 *
 * Streak and compliance summary — the motivating "hero number" of the page.
 *
 * Shows: current streak (large), 30-day rate, 7-day rate, and a 14-day
 * dot strip that makes the habit pattern visible at a glance.
 *
 * The 14-day strip maps DayStatus to coloured dots, oldest left to newest right.
 */

import { Flame, TrendingUp } from "lucide-react";
import type { StreakData, DayStatus } from "../types";

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

// ── Status dot config ─────────────────────────────────────────────────────

const DOT_CONFIG: Record<
  DayStatus,
  { bg: string; border: string; label: string }
> = {
  completed: { bg: SUCCESS,  border: SUCCESS,  label: "Completed" },
  partial:   { bg: WARNING,  border: WARNING,  label: "Partial"   },
  skipped:   { bg: DANGER,   border: DANGER,   label: "Skipped"   },
  rest:      { bg: "transparent", border: MUTED, label: "Rest day" },
  no_data:   { bg: "transparent", border: `${MUTED}50`, label: "No data" },
};

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10);
}

// ── Consistency strip ─────────────────────────────────────────────────────

function ConsistencyStrip({
  days,
}: {
  days: { date: string; status: DayStatus }[];
}) {
  return (
    <div>
      <div className="text-[9.5px] font-mono uppercase tracking-[0.12em] mb-2" style={{ color: MUTED }}>
        Last 14 days
      </div>
      <div className="flex items-end gap-1.5 flex-wrap">
        {days.map(({ date, status }) => {
          const cfg   = DOT_CONFIG[status];
          const today = isToday(date);
          const label = getDayLabel(date);

          return (
            <div key={date} className="flex flex-col items-center gap-1">
              {/* Dot */}
              <div
                className="w-6 h-6 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: cfg.bg,
                  borderColor:     cfg.border,
                  boxShadow:       today ? `0 0 0 2px oklch(0.72 0.18 290 / 0.5)` : undefined,
                  opacity:         status === "no_data" ? 0.4 : 1,
                }}
                title={`${date}: ${cfg.label}`}
              />
              {/* Day label */}
              <span
                className="text-[8px] font-mono leading-none"
                style={{ color: today ? PRIMARY : MUTED, fontWeight: today ? 700 : 400 }}
              >
                {today ? "T" : label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2.5 flex-wrap">
        {(["completed", "partial", "skipped", "rest"] as DayStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-full border"
              style={{
                backgroundColor: DOT_CONFIG[s].bg,
                borderColor:     DOT_CONFIG[s].border,
              }}
            />
            <span className="text-[9px]" style={{ color: MUTED }}>
              {DOT_CONFIG[s].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

interface StreakCardProps {
  streak: StreakData;
}

export function StreakCard({ streak }: StreakCardProps) {
  const thirtyPct = Math.round(streak.thirtyDayCompletionRate * 100);
  const sevenPct  = Math.round(streak.sevenDayCompletionRate  * 100);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-5">
      {/* Hero: streak number */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.12em] mb-1" style={{ color: MUTED }}>
            Current Streak
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[48px] font-black leading-none" style={{ color: WARNING }}>
              {streak.currentStreak}
            </span>
            <div>
              <div className="text-[14px] font-semibold leading-tight">
                {streak.currentStreak === 1 ? "day" : "days"}
              </div>
              <div className="text-[11px]" style={{ color: MUTED }}>
                Best: {streak.longestStreak}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 text-right">
          {/* 7-day rate */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] mb-0.5" style={{ color: MUTED }}>
              7-day
            </div>
            <div
              className="text-[20px] font-bold leading-none"
              style={{ color: sevenPct >= 80 ? SUCCESS : sevenPct >= 60 ? WARNING : DANGER }}
            >
              {sevenPct}%
            </div>
          </div>
          {/* 30-day rate */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] mb-0.5" style={{ color: MUTED }}>
              30-day
            </div>
            <div
              className="text-[18px] font-bold leading-none"
              style={{ color: thirtyPct >= 80 ? SUCCESS : thirtyPct >= 60 ? WARNING : DANGER }}
            >
              {thirtyPct}%
            </div>
          </div>
        </div>
      </div>

      {/* Compliance bars */}
      <div className="flex flex-col gap-2">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10.5px]" style={{ color: MUTED }}>7-day compliance</span>
            <span className="text-[10.5px] font-semibold">{sevenPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${sevenPct}%`,
                backgroundColor: sevenPct >= 80 ? SUCCESS : sevenPct >= 60 ? WARNING : DANGER,
              }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10.5px]" style={{ color: MUTED }}>30-day compliance</span>
            <span className="text-[10.5px] font-semibold">{thirtyPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${thirtyPct}%`,
                backgroundColor: thirtyPct >= 80 ? SUCCESS : thirtyPct >= 60 ? WARNING : DANGER,
              }}
            />
          </div>
        </div>
      </div>

      {/* 14-day dot strip */}
      {streak.last14Days.length > 0 && (
        <ConsistencyStrip days={streak.last14Days} />
      )}
    </div>
  );
}
