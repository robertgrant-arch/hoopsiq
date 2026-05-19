/**
 * features/assessments/components/ScoreSummaryRow.tsx
 *
 * One row in the Scores tab — shows coach score bar, label, and tier colour.
 * Used in the ScoreGrid overview.
 */
import { CATEGORY_META } from "../types";
import type { AssessmentScore } from "../types";

const PRIMARY  = "oklch(0.72 0.18 290)";
const SUCCESS  = "oklch(0.75 0.12 140)";
const WARNING  = "oklch(0.78 0.16 75)";
const DANGER   = "oklch(0.68 0.22 25)";
const MUTED    = "oklch(0.55 0.02 260)";

function scoreColor(score: number | null): string {
  if (score === null) return MUTED;
  if (score >= 8)  return SUCCESS;
  if (score >= 6)  return PRIMARY;
  if (score >= 4)  return WARNING;
  return DANGER;
}

function scoreLabel(score: number | null): string {
  if (score === null) return "Not assessed";
  if (score >= 9)  return "Elite";
  if (score >= 7)  return "Proficient";
  if (score >= 5)  return "Developing";
  if (score >= 3)  return "Foundational";
  return "Needs work";
}

interface ScoreSummaryRowProps {
  score: AssessmentScore;
}

export function ScoreSummaryRow({ score }: ScoreSummaryRowProps) {
  const meta  = CATEGORY_META[score.category];
  const color = scoreColor(score.coachScore);
  const pct   = score.coachScore !== null ? (score.coachScore / 10) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-2.5">
      {/* Emoji + label */}
      <span className="text-xl w-7 text-center shrink-0 leading-none">
        {meta.emoji}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[13px] font-medium leading-tight">{meta.label}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px]" style={{ color }}>
              {scoreLabel(score.coachScore)}
            </span>
            <span
              className="text-[13px] font-bold tabular-nums w-6 text-right"
              style={{ color }}
            >
              {score.coachScore ?? "—"}
            </span>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}
