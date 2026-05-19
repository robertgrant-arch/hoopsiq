/**
 * features/growth-story/components/WinCard.tsx
 *
 * Displays a single verified skill improvement — before/after scores,
 * a coach note, and optional film evidence link. This is the emotional
 * core of the growth story: proof you got better.
 */
import { Film, CheckCircle2 } from "lucide-react";
import type { SkillWin } from "../types";

const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const PRIMARY = "oklch(0.72 0.18 290)";
const MUTED   = "oklch(0.55 0.02 260)";

function scoreColor(score: number): string {
  if (score >= 8) return SUCCESS;
  if (score >= 6) return PRIMARY;
  return WARNING;
}

interface WinCardProps {
  win: SkillWin;
}

export function WinCard({ win }: WinCardProps) {
  const afterColor = scoreColor(win.afterScore);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[22px] leading-none">{win.emoji}</span>
          <div>
            <div className="text-[10.5px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-0.5">
              {win.periodLabel}
            </div>
            <div className="text-[16px] font-semibold leading-tight">{win.skillLabel}</div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div
            className="text-[26px] font-black leading-none tabular-nums"
            style={{ color: afterColor }}
          >
            +{win.delta.toFixed(1)}
          </div>
          <div className="text-[10px] text-muted-foreground">pts</div>
        </div>
      </div>

      {/* Before / After bars */}
      <div className="space-y-2">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10.5px] text-muted-foreground font-mono uppercase tracking-[0.1em]">Before</span>
            <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">{win.beforeScore}/10</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(win.beforeScore / 10) * 100}%`, backgroundColor: MUTED }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10.5px] font-mono uppercase tracking-[0.1em]" style={{ color: afterColor }}>Now</span>
            <span className="text-[11px] font-semibold tabular-nums" style={{ color: afterColor }}>{win.afterScore}/10</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(win.afterScore / 10) * 100}%`, backgroundColor: afterColor }}
            />
          </div>
        </div>
      </div>

      {/* Coach note */}
      <div className="rounded-xl border-l-2 pl-3 py-2 border-primary bg-primary/5">
        <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-primary mb-1">
          From your coach
        </div>
        <p className="text-[12.5px] text-muted-foreground italic leading-relaxed">
          "{win.coachNote}"
        </p>
        <div className="text-[10.5px] text-muted-foreground mt-1.5">— {win.coachName}</div>
      </div>

      {/* Film evidence */}
      {win.filmEvidence && (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <Film className="w-3.5 h-3.5 shrink-0" />
          <span>{win.filmEvidence.label}</span>
        </div>
      )}
    </div>
  );
}
