/**
 * features/growth-story/components/WeeklyMomentumCard.tsx
 *
 * Compact weekly summary showing drill compliance, check-ins,
 * top skill win, and any coach highlight for that week.
 */

import type { WeeklyMomentum } from "../types";

const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const MUTED   = "oklch(0.55 0.02 260)";

interface WeeklyMomentumCardProps {
  week: WeeklyMomentum;
  isCurrentWeek?: boolean;
}

export function WeeklyMomentumCard({ week, isCurrentWeek = false }: WeeklyMomentumCardProps) {
  const completionRate = week.drillsAssigned > 0
    ? week.drillsCompleted / week.drillsAssigned
    : 0;
  const pct = Math.round(completionRate * 100);
  const barColor = pct >= 80 ? SUCCESS : pct >= 60 ? WARNING : MUTED;

  return (
    <div
      className="rounded-2xl border bg-card p-4 flex flex-col gap-3"
      style={{
        borderColor: isCurrentWeek
          ? "oklch(0.72 0.18 290 / 0.4)"
          : "var(--color-border, oklch(0.22 0.005 260))",
        backgroundColor: isCurrentWeek
          ? "oklch(0.72 0.18 290 / 0.05)"
          : undefined,
      }}
    >
      {/* Week label */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold">{week.weekLabel}</span>
        {isCurrentWeek && (
          <span className="text-[9.5px] font-mono uppercase tracking-[0.1em] text-primary">
            This Week
          </span>
        )}
      </div>

      {/* Drill compliance bar */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-[10.5px] text-muted-foreground">
            Drills · {week.drillsCompleted}/{week.drillsAssigned}
          </span>
          <span className="text-[10.5px] font-semibold" style={{ color: barColor }}>
            {pct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
      </div>

      {/* Check-ins */}
      <div className="text-[11px] text-muted-foreground">
        {week.checkInsSubmitted}/5 check-ins · {week.topWin}
      </div>

      {/* Coach highlight */}
      {week.coachHighlight && (
        <div className="text-[11.5px] text-muted-foreground italic border-l-2 border-primary/40 pl-2.5 leading-relaxed">
          "{week.coachHighlight}"
        </div>
      )}
    </div>
  );
}
