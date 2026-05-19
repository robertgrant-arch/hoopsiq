/**
 * features/player-development/components/ProgressSnapshot.tsx
 *
 * Compact season progress card: week timeline, drills completed bar,
 * and streak badge. Intentionally concise — full progress lives on
 * /app/player/skills and /app/player/timeline.
 */

import { Flame, CheckCircle2, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
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
            Season Progress
          </div>
          <div className="text-[13.5px] font-semibold">
            Week {season.week} of {season.totalWeeks} · {season.seasonLabel}
          </div>
        </div>
        <Badge className="gap-1.5 bg-amber-500/15 text-amber-500 border-amber-500/30 text-[11px] px-2.5 py-1 shrink-0">
          <Flame className="w-3 h-3" />
          {season.streakDays}-day streak
        </Badge>
      </div>

      {/* Season week bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10.5px] text-muted-foreground font-mono uppercase tracking-[0.1em]">
            Season timeline
          </span>
          <span className="text-[11px] font-semibold">{weekPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${weekPct}%` }}
          />
        </div>
      </div>

      {/* Drills completed */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-[12px] text-muted-foreground">
            <span className="font-semibold text-foreground">
              {season.completedDrills}/{season.totalDrills}
            </span>{" "}
            drills
          </span>
        </div>
        <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${drillPct}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold text-emerald-500 shrink-0">{drillPct}%</span>
      </div>

      {/* Deep-link to full skill/timeline view */}
      <Link href="/app/player/skills" asChild>
        <a className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-primary transition-colors mt-4">
          View full skill overview
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </Link>
    </div>
  );
}
