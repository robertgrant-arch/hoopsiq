/**
 * features/player-development/components/TodayWorkCard.tsx
 *
 * PRIMARY card — today's assigned drills with one-tap Done buttons.
 * This is always the first content below the header on mobile.
 * Uses amber/fire accent to signal urgency and momentum.
 */

import { useState } from "react";
import { Flame, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { FocusArea } from "../types";

interface TodayWorkCardProps {
  focusAreas:    FocusArea[];
  onDrillDone:   (id: string) => void;
}

export function TodayWorkCard({ focusAreas, onDrillDone }: TodayWorkCardProps) {
  const todayItems = focusAreas.filter((a) => a.dueToday && a.status === "active");
  const [done, setDone] = useState<Set<string>>(new Set());

  const allDone = todayItems.length > 0 && todayItems.every((a) => done.has(a.id));

  function handleDone(id: string) {
    if (done.has(id)) return;
    const next = new Set(done);
    next.add(id);
    setDone(next);
    onDrillDone(id);

    if (todayItems.every((a) => next.has(a.id))) {
      toast.success("All done for today 🎉 You put in the work.");
    } else {
      toast.success("Drill logged. Keep building.");
    }
  }

  // Empty state — no drills due today
  if (todayItems.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-muted-foreground" />
          <span className="text-[13px] font-semibold">Today's Work</span>
        </div>
        <p className="text-[13px] text-muted-foreground">
          No drills due today. Rest day or check with your coach.
        </p>
      </div>
    );
  }

  // All done state
  if (allDone) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-6 text-center">
        <div className="text-3xl mb-2">🎉</div>
        <p className="font-semibold text-[15px]">All done for today.</p>
        <p className="text-[13px] text-muted-foreground mt-1">
          You put in the work. Rest up and come back tomorrow.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/35 bg-amber-500/5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500" />
          <span className="text-[13px] font-semibold">Today's Work</span>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.1em]">
          {done.size}/{todayItems.length} done
        </span>
      </div>

      {/* Drill list */}
      <div className="flex flex-col gap-2.5">
        {todayItems.map((area) => {
          const isDone = done.has(area.id);
          return (
            <div
              key={area.id}
              className={[
                "flex items-center gap-3 rounded-xl px-3.5 py-3 border transition-all",
                isDone
                  ? "border-emerald-500/30 bg-emerald-500/5 opacity-60"
                  : "border-border bg-background",
              ].join(" ")}
            >
              <span className="text-xl shrink-0 leading-none">{area.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10.5px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-0.5">
                  {area.subSkill}
                </div>
                <div
                  className={[
                    "text-[13px] font-medium leading-snug",
                    isDone ? "line-through text-muted-foreground" : "",
                  ].join(" ")}
                >
                  {area.todayDrill}
                </div>
              </div>
              <Button
                size="sm"
                variant={isDone ? "outline" : "default"}
                className="shrink-0 h-8 px-3 text-[12px]"
                onClick={() => handleDone(area.id)}
                disabled={isDone}
                aria-label={isDone ? `${area.subSkill} done` : `Mark ${area.subSkill} done`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  "Done"
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
