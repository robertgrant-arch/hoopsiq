/**
 * features/assessments/components/GapBar.tsx
 *
 * Visualizes the gap between coach score and self-assessment score
 * for one skill category. This is the core of the gap analysis view.
 *
 * Layout:
 *   [emoji label]  [coach bar ████░░░░░░  7]
 *                  [self  bar ████████░░  8]
 *                  [gap badge: "Slight overestimate"]
 */
import { CATEGORY_META } from "../types";
import type { AssessmentGap, GapPriority } from "../types";

const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const PRIMARY = "oklch(0.72 0.18 290)";
const MUTED   = "oklch(0.55 0.02 260)";

const PRIORITY_STYLE: Record<GapPriority, { color: string; label: string }> = {
  critical: { color: DANGER,   label: "Critical gap" },
  high:     { color: WARNING,  label: "High priority" },
  moderate: { color: PRIMARY,  label: "Moderate"      },
  low:      { color: SUCCESS,  label: "On track"      },
};

interface GapBarProps {
  gap: AssessmentGap;
}

export function GapBar({ gap }: GapBarProps) {
  const meta   = CATEGORY_META[gap.category];
  const pStyle = PRIORITY_STYLE[gap.priority];

  const coachPct = (gap.coachScore / 10) * 100;
  const selfPct  = (gap.selfScore  / 10) * 100;

  // If player overestimates self (positive gap), self bar is longer → warning color
  // If player underestimates self (negative gap), coach bar is longer → fine / green tint
  const selfColor  = gap.gap > 1 ? WARNING : SUCCESS;
  const coachColor = PRIMARY;

  return (
    <div className="py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[18px] leading-none">{meta.emoji}</span>
          <span className="text-[13.5px] font-semibold">{meta.label}</span>
        </div>
        <span
          className="text-[10.5px] font-medium px-2 py-0.5 rounded-full border"
          style={{
            color:           pStyle.color,
            borderColor:     pStyle.color + "40",
            backgroundColor: pStyle.color + "12",
          }}
        >
          {pStyle.label}
        </span>
      </div>

      {/* Coach bar */}
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-[0.1em] w-12 shrink-0" style={{ color: MUTED }}>
          Coach
        </span>
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${coachPct}%`, backgroundColor: coachColor }}
          />
        </div>
        <span className="text-[12px] font-bold w-5 text-right tabular-nums" style={{ color: coachColor }}>
          {gap.coachScore}
        </span>
      </div>

      {/* Self bar */}
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] font-mono uppercase tracking-[0.1em] w-12 shrink-0" style={{ color: MUTED }}>
          You
        </span>
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${selfPct}%`, backgroundColor: selfColor }}
          />
        </div>
        <span className="text-[12px] font-bold w-5 text-right tabular-nums" style={{ color: selfColor }}>
          {gap.selfScore}
        </span>
      </div>

      {/* Gap message */}
      <p className="text-[11.5px] mt-2 leading-relaxed" style={{ color: MUTED }}>
        {gap.message}
      </p>
    </div>
  );
}
