/**
 * features/assessments/components/IDPFocusCard.tsx
 *
 * Displays one active IDP focus area with:
 *   - score track (current → target)
 *   - milestone checklist with optimistic completion
 *   - linked drill
 *   - coach note
 *
 * Milestone completion calls useCompleteMilestone() from the slice.
 */
import { toast } from "sonner";
import { CheckCircle2, Circle, Dumbbell } from "lucide-react";
import { CATEGORY_META } from "../types";
import type { IDPFocusArea } from "../types";
import { useCompleteMilestone } from "../hooks";

const PRIMARY  = "oklch(0.72 0.18 290)";
const SUCCESS  = "oklch(0.75 0.12 140)";
const WARNING  = "oklch(0.78 0.16 75)";
const MUTED    = "oklch(0.55 0.02 260)";

function ScoreTrack({ current, target }: { current: number; target: number }) {
  return (
    <div className="flex gap-[3px] flex-wrap">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const isCurrent = n === current;
        const isTarget  = n === target;
        const isBetween = n > current && n < target;
        return (
          <div
            key={n}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors"
            style={{
              backgroundColor: isCurrent
                ? WARNING
                : isTarget
                ? PRIMARY
                : isBetween
                ? PRIMARY + "25"
                : "var(--color-muted, oklch(0.17 0.005 260))",
              borderColor: isCurrent
                ? WARNING
                : isTarget
                ? PRIMARY
                : isBetween
                ? PRIMARY + "45"
                : "var(--color-border, oklch(0.22 0.005 260))",
              color: isCurrent || isTarget ? "#fff" : isBetween ? PRIMARY : MUTED,
            }}
          >
            {n}
          </div>
        );
      })}
    </div>
  );
}

interface IDPFocusCardProps {
  area:     IDPFocusArea;
  rank:     number;       // 1-based display rank
}

const MEDALS = ["🥇", "🥈", "🥉"] as const;

export function IDPFocusCard({ area, rank }: IDPFocusCardProps) {
  const { mutate: completeMilestone } = useCompleteMilestone();
  const meta = CATEGORY_META[area.category];

  const completedCount = area.milestones.filter((m) => m.completedAt !== null).length;
  const totalCount     = area.milestones.length;

  function handleMilestone(milestoneId: string, alreadyDone: boolean) {
    if (alreadyDone) return;
    completeMilestone({ focusAreaId: area.id, milestoneId });
    toast.success("Milestone complete! Keep building.");
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-[22px] leading-none mt-0.5">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-[10.5px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
              {meta.label}
            </span>
            <span className="text-muted-foreground/40 text-[10.5px]">·</span>
            <span className="text-[10.5px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
              Focus #{rank}
            </span>
            {area.deadline && (
              <>
                <span className="text-muted-foreground/40 text-[10.5px]">·</span>
                <span className="text-[10.5px] text-muted-foreground">
                  Due {area.deadline}
                </span>
              </>
            )}
          </div>
          <h3 className="font-semibold text-[16px] leading-tight">{meta.label}</h3>
        </div>
        <span className="text-lg shrink-0">{MEDALS[rank - 1] ?? ""}</span>
      </div>

      {/* Score track */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-2">
          Score tracker · Now{" "}
          <span className="font-bold" style={{ color: WARNING }}>{area.currentScore}</span>
          {" → Goal "}
          <span className="font-bold" style={{ color: PRIMARY }}>{area.targetScore}</span>
          {" / 10"}
        </div>
        <ScoreTrack current={area.currentScore} target={area.targetScore} />
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10.5px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            Plan progress
          </span>
          <span className="text-[11.5px] font-semibold">{area.progressPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${area.progressPct}%`, backgroundColor: PRIMARY }}
          />
        </div>
      </div>

      {/* Milestones */}
      {area.milestones.length > 0 && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-2">
            Milestones · {completedCount}/{totalCount}
          </div>
          <div className="flex flex-col gap-2">
            {area.milestones.map((m) => {
              const done = m.completedAt !== null;
              return (
                <button
                  key={m.id}
                  onClick={() => handleMilestone(m.id, done)}
                  className="flex items-start gap-2.5 text-left group"
                  aria-label={done ? `${m.title} (completed)` : `Mark "${m.title}" complete`}
                >
                  {done ? (
                    <CheckCircle2
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color: SUCCESS }}
                    />
                  ) : (
                    <Circle className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  )}
                  <span
                    className={[
                      "text-[12.5px] leading-snug",
                      done ? "line-through text-muted-foreground" : "",
                    ].join(" ")}
                  >
                    {m.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Linked drill */}
      {area.linkedDrill && (
        <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-1">
            Today's drill
          </div>
          <div className="flex items-center gap-2">
            <Dumbbell className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-[13px] font-medium">{area.linkedDrill}</span>
          </div>
        </div>
      )}

      {/* Coach note */}
      {area.coachNote && (
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
            C
          </div>
          <p className="text-[12.5px] text-muted-foreground italic leading-relaxed">
            "{area.coachNote}"
          </p>
        </div>
      )}
    </div>
  );
}
