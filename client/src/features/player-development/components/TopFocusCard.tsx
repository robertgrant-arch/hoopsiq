/**
 * features/player-development/components/TopFocusCard.tsx
 *
 * Displays the #1 (highest priority) active focus area.
 * Shows: score track, progress bar, today's drill status, coach note,
 * and a film clip link if one exists.
 *
 * Secondary focus areas are not shown here — they live on the full
 * /app/player/assessments page linked at the bottom.
 */

import { Link } from "wouter";
import { Clock, ChevronRight, Film } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScoreTrack } from "./ScoreTrack";
import type { FocusArea } from "../types";

const PRIORITY_MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

interface TopFocusCardProps {
  area:       FocusArea;
  moreCount?: number;         // how many other active focus areas exist
}

export function TopFocusCard({ area, moreCount = 0 }: TopFocusCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
      {/* Section label */}
      <div className="flex items-center justify-between">
        <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
          Top Focus Area
        </div>
        {moreCount > 0 && (
          <Link href="/app/player/assessments" asChild>
            <a className="text-[11px] text-primary hover:underline flex items-center gap-0.5">
              +{moreCount} more <ChevronRight className="w-3 h-3" />
            </a>
          </Link>
        )}
      </div>

      {/* Header: emoji + category + priority medal */}
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5">{area.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
              {area.category}
            </span>
            <span className="text-muted-foreground/40 text-[11px]">·</span>
            <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
              Focus #{area.priority}
            </span>
          </div>
          <h3 className="font-semibold text-[16px] leading-tight">{area.subSkill}</h3>
        </div>
        <span className="text-lg leading-none shrink-0">
          {PRIORITY_MEDAL[area.priority] ?? ""}
        </span>
      </div>

      {/* Score track */}
      <div>
        <div className="text-[10.5px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-2">
          Score tracker · Now{" "}
          <span className="text-amber-500 font-bold">{area.currentScore}</span>
          {" → "}
          Target{" "}
          <span className="text-primary font-bold">{area.targetScore}</span>
          {" / 10"}
        </div>
        <ScoreTrack current={area.currentScore} target={area.targetScore} />
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10.5px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            Milestone progress
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-semibold">{area.progressPct}%</span>
            <span className="text-[10.5px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {area.deadline}
            </span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${area.progressPct}%` }}
          />
        </div>
      </div>

      {/* Today's / weekly drill context */}
      {area.todayDrill && (
        <div
          className={[
            "rounded-xl px-4 py-3 border text-[12.5px]",
            area.dueToday
              ? "bg-amber-500/8 border-amber-500/25"
              : "bg-muted/40 border-border",
          ].join(" ")}
        >
          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-0.5">
            {area.dueToday ? "Today's drill" : "This week's drill"}
          </div>
          <div className="font-medium">{area.todayDrill}</div>
        </div>
      )}

      {/* Coach note */}
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
          {area.coachInitials}
        </div>
        <p className="text-[12.5px] text-muted-foreground italic leading-relaxed">
          "{area.coachNote}"
        </p>
      </div>

      {/* Film clip link */}
      {area.linkedClip && (
        <Link href={area.linkedClip.href} asChild>
          <a className="inline-flex items-center gap-1.5 text-[12px] text-primary hover:underline">
            <Film className="w-3.5 h-3.5" />
            {area.linkedClip.title}
            <ChevronRight className="w-3 h-3" />
          </a>
        </Link>
      )}

      {/* Remaining focus areas badge */}
      {area.dueToday && (
        <Badge className="self-start text-[10px] bg-amber-500/15 text-amber-500 border-amber-500/30">
          Due Today
        </Badge>
      )}
    </div>
  );
}
