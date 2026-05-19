/**
 * features/player-development/components/ProgressSnapshot.tsx
 *
 * Compact season progress card: week timeline and drills completed.
 * Streak is shown in the hub header — not duplicated here.
 * "See your streak" links to the dedicated progress page.
 */

import { CheckCircle2, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import type { SeasonStats } from "../types";

interface ProgressSnapshotProps {
  season: SeasonStats;
}

export function ProgressSnapshot({ season }: ProgressSnapshotProps) {
  const weekPct  = Math.round((season.week  / season.totalWeeks)      * 100);
  const drillPct = Math.round((season.completedDrills / season.totalDrills) * 100);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-0.5">
            {season.seasonLabel} Season
          </div>
          <div className="text-[14px] font-semibold">
            Week {season.week} of {season.totalWeeks}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[26px] font-black leading-none" style={{ color: "oklch(0.78 0.16 75)" }}>
            {drillPct}%
          </div>
          <div className="text-[10px] text-muted-foreground">drills done</div>
        </div>
      </div>

      {/* Season progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-muted-foreground">Season progress</span>
          <span className="text-[11px] font-semibold">{weekPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${weekPct}%` }}
          />
        </div>
      </div>

      {/* Drills stat */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="text-[12.5px] text-muted-foreground">
          <span className="font-semibold text-foreground">{season.completedDrills}</span>
          {" "}of {season.totalDrills} drills completed this season
        </span>
      </div>

      <Link href="/app/player/progress" asChild>
        <a className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-primary transition-colors mt-4">
          See your streak and consistency
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </Link>
    </div>
  );
}
