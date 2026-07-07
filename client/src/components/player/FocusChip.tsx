/**
 * components/player/FocusChip.tsx
 *
 * The focus-chip rule (development-first reframe §3): every screen in
 * Development / Train / Film shows the player's current focus area in its
 * header. One shared component + the existing IDP focus data.
 *
 * `useCurrentFocus()` is mock-backed (MOCK_HUB_DATA) until GET /api/player/hub
 * lands — same contract as usePlayerHub().
 */

import { Target } from "lucide-react";
import { MOCK_HUB_DATA } from "@/features/player-development/mock";

export interface CurrentFocus {
  /** The specific sub-skill being worked, e.g. "Contact Layup". */
  focusArea: string;
  /** Parent skill category, e.g. "Finishing" — used to join velocity data. */
  category: string;
  /** Coach's one-line cue from the latest IDP note. */
  coachCue: string;
  coachName: string;
}

/**
 * The current player's top active focus area (priority 1) from the IDP hub
 * mock. Returns a stable object shape even when no plan exists yet.
 */
export function useCurrentFocus(): CurrentFocus {
  const top = MOCK_HUB_DATA.focusAreas
    .filter((fa) => fa.status === "active")
    .sort((a, b) => a.priority - b.priority)[0];

  return {
    focusArea: top?.subSkill ?? "Not set",
    category: top?.category ?? "",
    coachCue: top?.coachNote ?? "",
    coachName: MOCK_HUB_DATA.recentFeedback[0]?.coachName ?? "Coach",
  };
}

/** Small header pill: `FOCUS: {area}` with the coach cue as a tooltip. */
export function FocusChip({ className = "" }: { className?: string }) {
  const { focusArea, coachCue, coachName } = useCurrentFocus();
  return (
    <span
      title={coachCue ? `"${coachCue}" — ${coachName}` : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10.5px] font-mono uppercase tracking-[0.08em] text-primary whitespace-nowrap max-w-full ${className}`}
    >
      <Target className="w-3 h-3 shrink-0" />
      <span className="truncate">Focus: {focusArea}</span>
    </span>
  );
}
