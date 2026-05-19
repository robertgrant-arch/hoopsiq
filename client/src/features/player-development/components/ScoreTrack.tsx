/**
 * features/player-development/components/ScoreTrack.tsx
 *
 * A 1–10 numbered score track showing current score (amber),
 * target score (primary), and the gap between them.
 * Extracted from PlayerDevelopmentView; now slice-owned.
 */

export function ScoreTrack({
  current,
  target,
  max = 10,
}: {
  current: number;
  target:  number;
  max?:    number;
}) {
  return (
    <div className="flex items-center gap-[3px] flex-wrap">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const isCurrent = n === current;
        const isTarget  = n === target;
        const isBetween = n > current && n < target;

        return (
          <div
            key={n}
            className={[
              "w-[26px] h-[26px] rounded-full flex items-center justify-center",
              "text-[10px] font-bold border transition-colors",
              isCurrent
                ? "bg-amber-500 border-amber-400 text-white shadow-sm shadow-amber-500/40"
                : isTarget
                ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30"
                : isBetween
                ? "bg-primary/15 border-primary/25 text-primary/60"
                : "bg-muted border-border text-muted-foreground/40",
            ].join(" ")}
          >
            {n}
          </div>
        );
      })}
    </div>
  );
}
