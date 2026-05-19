/**
 * features/assessments/components/SelfAssessForm.tsx
 *
 * Player self-assessment form — rate your own skills 1-10 across all 8 categories.
 * Submitted ratings feed into the gap analysis and IDP generation.
 *
 * Design principle: honest self-reflection, not a test.
 * Copy reinforces that lower scores = more focused coaching, not judgment.
 */
import { useState } from "react";
import { ALL_CATEGORIES, CATEGORY_META } from "../types";
import type { AssessmentCategory, SelfAssessmentInput } from "../types";

interface SelfAssessFormProps {
  /** Current ratings (from draft or existing self scores). */
  getRating:   (cat: AssessmentCategory) => number;
  setRating:   (cat: AssessmentCategory, value: number) => void;
  onSubmit:    () => void;
  isPending:   boolean;
}

const SCALE_LABELS: Record<number, string> = {
  1:  "1 — Just starting",
  3:  "3 — Getting there",
  5:  "5 — Solid",
  7:  "7 — Strong",
  10: "10 — Elite",
};

function ScaleLabel({ value }: { value: number }) {
  const closest = [1, 3, 5, 7, 10].reduce((prev, cur) =>
    Math.abs(cur - value) < Math.abs(prev - value) ? cur : prev
  );
  return (
    <span className="text-[10.5px] text-muted-foreground tabular-nums">
      {value}/10 — {SCALE_LABELS[closest]?.split(" — ")[1] ?? ""}
    </span>
  );
}

export function SelfAssessForm({
  getRating,
  setRating,
  onSubmit,
  isPending,
}: SelfAssessFormProps) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Framing copy */}
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Rate yourself honestly across each skill. Lower ratings mean{" "}
          <span className="text-foreground font-medium">more focused coaching</span>, not judgment.
          Your coach will compare your view with theirs to build your plan.
        </p>
      </div>

      {/* Category sliders */}
      <div className="flex flex-col gap-5">
        {ALL_CATEGORIES.map((cat) => {
          const meta  = CATEGORY_META[cat];
          const value = getRating(cat);
          const pct   = ((value - 1) / 9) * 100;

          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[18px] leading-none">{meta.emoji}</span>
                  <div>
                    <div className="text-[13.5px] font-semibold leading-tight">{meta.label}</div>
                    <div className="text-[11px] text-muted-foreground">{meta.description}</div>
                  </div>
                </div>
                <ScaleLabel value={value} />
              </div>

              {/* Slider */}
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={value}
                onChange={(e) => setRating(cat, Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--color-primary, oklch(0.72 0.18 290)) ${pct}%, oklch(0.2 0.01 260) ${pct}%)`,
                }}
                aria-label={`Rate your ${meta.label}`}
              />

              {/* Scale ticks */}
              <div className="flex justify-between mt-1 px-0.5">
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(cat, n)}
                    className={[
                      "text-[10px] tabular-nums transition-colors leading-none",
                      value === n ? "font-bold text-primary" : "text-muted-foreground/50",
                    ].join(" ")}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm + submit */}
      <div className="flex items-start gap-3 pt-2">
        <button
          type="button"
          onClick={() => setConfirmed((c) => !c)}
          aria-checked={confirmed}
          role="checkbox"
          className={[
            "w-5 h-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors",
            confirmed
              ? "bg-primary border-primary"
              : "border-border",
          ].join(" ")}
        >
          {confirmed && (
            <svg viewBox="0 0 12 10" className="w-3 h-2.5 text-primary-foreground fill-current">
              <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <label className="text-[12.5px] text-muted-foreground leading-relaxed cursor-pointer select-none" onClick={() => setConfirmed((c) => !c)}>
          I rated myself honestly. I understand my coach's view may differ, and the gaps will shape my development plan.
        </label>
      </div>

      <button
        onClick={onSubmit}
        disabled={!confirmed || isPending}
        className={[
          "w-full h-11 rounded-xl text-[13.5px] font-semibold transition-all",
          confirmed && !isPending
            ? "bg-primary text-primary-foreground hover:brightness-110"
            : "bg-muted text-muted-foreground cursor-not-allowed",
        ].join(" ")}
      >
        {isPending ? "Submitting…" : "Submit Self-Assessment"}
      </button>
    </div>
  );
}
