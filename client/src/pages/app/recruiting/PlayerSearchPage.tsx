/**
 * PlayerSearchPage — Browse and filter all publicly available verified player profiles.
 * Route: /app/recruiter/search
 */
import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Search,
  BookmarkPlus,
  Film,
  FileText,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type VerifiedPlayer = {
  id: string;
  name: string;
  position: string;
  gradYear: number;
  height: string;
  wingspan?: string;
  programName: string;
  teamTier: "Premier" | "Gold" | "Silver";
  division: string;
  overallTier: "Emerging" | "Developing" | "Advanced" | "Elite";
  skillScores: Record<string, number>;
  skillDeltas: Record<string, number>;
  coachabilityIndex: number;
  attendanceRate: number;
  assessmentCount: number;
  filmClipCount: number;
  badgeCount: number;
  growthRate: "top_10" | "top_25" | "average";
  profileSlug: string;
  gradYearInt: number;
  topGrowthSkill: string;
  topGrowthDelta: number;
  coachNarrativeSummary?: string;
  isAccessible: boolean;
  hasFilmPackage: boolean;
  hasCoachNarrative: boolean;
};

type RecruiterBoard = {
  playerId: string;
  status: "watching" | "interested" | "priority" | "not_a_fit";
  addedAt: string;
  notes?: string;
};

type Filters = {
  positions: string[];
  gradYears: number[];
  tiers: VerifiedPlayer["overallTier"][];
  growthRates: VerifiedPlayer["growthRate"][];
  minCoachability: number;
  teamTiers: VerifiedPlayer["teamTier"][];
  hasFilm: boolean | null;
  hasNarrative: boolean | null;
};

type SortOption = "tier_trajectory" | "recently_assessed" | "grad_year" | "alphabetical";

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const MOCK_PLAYERS: VerifiedPlayer[] = [
  {
    id: "p1",
    name: "Jordan Mills",
    position: "SG",
    gradYear: 2027,
    height: "6'3\"",
    wingspan: "6'5\"",
    programName: "Elevation Basketball",
    teamTier: "Premier",
    division: "17U",
    overallTier: "Advanced",
    skillScores: { ball_handling: 7.8, shooting: 8.4, finishing: 7.2, defense: 6.9, footwork: 7.5, iq_reads: 7.1, athleticism: 8.1, conditioning: 7.8 },
    skillDeltas: { ball_handling: 0.6, shooting: 1.2, finishing: 0.4, defense: 0.8, footwork: 0.9, iq_reads: 0.5, athleticism: 0.3, conditioning: 0.7 },
    coachabilityIndex: 8.7,
    attendanceRate: 94,
    assessmentCount: 6,
    filmClipCount: 4,
    badgeCount: 5,
    growthRate: "top_10",
    profileSlug: "jordan-mills-2027",
    gradYearInt: 2027,
    topGrowthSkill: "shooting",
    topGrowthDelta: 1.2,
    coachNarrativeSummary: "Exceptional court vision and shooting trajectory. Ready for high-major evaluation.",
    isAccessible: true,
    hasFilmPackage: true,
    hasCoachNarrative: true,
  },
  {
    id: "p2",
    name: "Marcus Tate",
    position: "PG",
    gradYear: 2027,
    height: "6'1\"",
    wingspan: "6'3\"",
    programName: "Rise Elite",
    teamTier: "Premier",
    division: "17U",
    overallTier: "Elite",
    skillScores: { ball_handling: 9.1, shooting: 8.2, finishing: 8.6, defense: 7.8, footwork: 8.9, iq_reads: 9.0, athleticism: 8.4, conditioning: 8.8 },
    skillDeltas: { ball_handling: 0.8, shooting: 0.5, finishing: 1.1, defense: 0.6, footwork: 0.7, iq_reads: 1.3, athleticism: 0.4, conditioning: 0.9 },
    coachabilityIndex: 9.2,
    attendanceRate: 98,
    assessmentCount: 8,
    filmClipCount: 5,
    badgeCount: 7,
    growthRate: "top_10",
    profileSlug: "marcus-tate-2027",
    gradYearInt: 2027,
    topGrowthSkill: "iq_reads",
    topGrowthDelta: 1.3,
    coachNarrativeSummary: "Elite floor general. Reads the game two steps ahead. Exceptional IDP compliance.",
    isAccessible: true,
    hasFilmPackage: true,
    hasCoachNarrative: true,
  },
  {
    id: "p3",
    name: "Darius Webb",
    position: "SF",
    gradYear: 2028,
    height: "6'6\"",
    programName: "Triangle Elite",
    teamTier: "Gold",
    division: "16U",
    overallTier: "Developing",
    skillScores: { ball_handling: 6.1, shooting: 6.8, finishing: 7.0, defense: 7.4, footwork: 6.5, iq_reads: 6.3, athleticism: 7.9, conditioning: 7.2 },
    skillDeltas: { ball_handling: 1.1, shooting: 0.8, finishing: 0.9, defense: 0.4, footwork: 1.3, iq_reads: 0.7, athleticism: 0.2, conditioning: 0.6 },
    coachabilityIndex: 7.9,
    attendanceRate: 89,
    assessmentCount: 4,
    filmClipCount: 3,
    badgeCount: 3,
    growthRate: "top_25",
    profileSlug: "darius-webb-2028",
    gradYearInt: 2028,
    topGrowthSkill: "footwork",
    topGrowthDelta: 1.3,
    isAccessible: false,
    hasFilmPackage: true,
    hasCoachNarrative: false,
  },
  {
    id: "p4",
    name: "Caleb Washington",
    position: "PF",
    gradYear: 2028,
    height: "6'8\"",
    wingspan: "7'0\"",
    programName: "Elevation Basketball",
    teamTier: "Premier",
    division: "16U",
    overallTier: "Advanced",
    skillScores: { ball_handling: 5.9, shooting: 6.2, finishing: 8.1, defense: 8.4, footwork: 7.8, iq_reads: 7.0, athleticism: 8.9, conditioning: 8.2 },
    skillDeltas: { ball_handling: 0.4, shooting: 0.7, finishing: 0.8, defense: 1.2, footwork: 1.0, iq_reads: 0.5, athleticism: 0.3, conditioning: 0.8 },
    coachabilityIndex: 8.1,
    attendanceRate: 92,
    assessmentCount: 5,
    filmClipCount: 4,
    badgeCount: 4,
    growthRate: "top_25",
    profileSlug: "caleb-washington-2028",
    gradYearInt: 2028,
    topGrowthSkill: "defense",
    topGrowthDelta: 1.2,
    isAccessible: false,
    hasFilmPackage: true,
    hasCoachNarrative: false,
  },
  {
    id: "p5",
    name: "Tyrese Morgan",
    position: "C",
    gradYear: 2029,
    height: "6'10\"",
    wingspan: "7'2\"",
    programName: "Peak Performance Academy",
    teamTier: "Gold",
    division: "15U",
    overallTier: "Developing",
    skillScores: { ball_handling: 4.8, shooting: 5.1, finishing: 6.9, defense: 7.1, footwork: 6.2, iq_reads: 5.8, athleticism: 7.6, conditioning: 7.0 },
    skillDeltas: { ball_handling: 0.9, shooting: 1.4, finishing: 0.6, defense: 0.7, footwork: 1.1, iq_reads: 0.8, athleticism: 0.5, conditioning: 0.9 },
    coachabilityIndex: 7.5,
    attendanceRate: 87,
    assessmentCount: 3,
    filmClipCount: 2,
    badgeCount: 2,
    growthRate: "top_10",
    profileSlug: "tyrese-morgan-2029",
    gradYearInt: 2029,
    topGrowthSkill: "shooting",
    topGrowthDelta: 1.4,
    isAccessible: false,
    hasFilmPackage: false,
    hasCoachNarrative: false,
  },
  {
    id: "p6",
    name: "Isaiah Parker",
    position: "SG",
    gradYear: 2027,
    height: "6'4\"",
    programName: "Northwest Elite",
    teamTier: "Premier",
    division: "17U",
    overallTier: "Advanced",
    skillScores: { ball_handling: 7.4, shooting: 8.8, finishing: 7.6, defense: 7.2, footwork: 7.8, iq_reads: 7.5, athleticism: 8.0, conditioning: 7.9 },
    skillDeltas: { ball_handling: 0.7, shooting: 1.4, finishing: 0.8, defense: 0.5, footwork: 0.9, iq_reads: 0.6, athleticism: 0.4, conditioning: 0.7 },
    coachabilityIndex: 8.4,
    attendanceRate: 96,
    assessmentCount: 7,
    filmClipCount: 5,
    badgeCount: 6,
    growthRate: "top_10",
    profileSlug: "isaiah-parker-2027",
    gradYearInt: 2027,
    topGrowthSkill: "shooting",
    topGrowthDelta: 1.4,
    isAccessible: false,
    hasFilmPackage: true,
    hasCoachNarrative: true,
  },
  {
    id: "p7",
    name: "Nate Holloway",
    position: "PF",
    gradYear: 2028,
    height: "6'7\"",
    programName: "Central Coast Hoops",
    teamTier: "Gold",
    division: "16U",
    overallTier: "Elite",
    skillScores: { ball_handling: 6.9, shooting: 7.1, finishing: 8.9, defense: 8.7, footwork: 8.2, iq_reads: 8.1, athleticism: 9.1, conditioning: 8.6 },
    skillDeltas: { ball_handling: 0.5, shooting: 0.8, finishing: 1.0, defense: 1.3, footwork: 0.9, iq_reads: 0.7, athleticism: 0.3, conditioning: 0.8 },
    coachabilityIndex: 9.0,
    attendanceRate: 97,
    assessmentCount: 9,
    filmClipCount: 5,
    badgeCount: 8,
    growthRate: "top_10",
    profileSlug: "nate-holloway-2028",
    gradYearInt: 2028,
    topGrowthSkill: "defense",
    topGrowthDelta: 1.3,
    isAccessible: false,
    hasFilmPackage: true,
    hasCoachNarrative: true,
  },
  {
    id: "p8",
    name: "DeShawn Brooks",
    position: "PG",
    gradYear: 2027,
    height: "5'11\"",
    programName: "Southside Select",
    teamTier: "Silver",
    division: "17U",
    overallTier: "Advanced",
    skillScores: { ball_handling: 9.0, shooting: 7.6, finishing: 7.9, defense: 7.3, footwork: 8.5, iq_reads: 8.8, athleticism: 7.7, conditioning: 8.1 },
    skillDeltas: { ball_handling: 1.1, shooting: 0.6, finishing: 0.7, defense: 0.4, footwork: 1.0, iq_reads: 1.5, athleticism: 0.3, conditioning: 0.6 },
    coachabilityIndex: 8.9,
    attendanceRate: 93,
    assessmentCount: 6,
    filmClipCount: 4,
    badgeCount: 5,
    growthRate: "top_10",
    profileSlug: "deshawn-brooks-2027",
    gradYearInt: 2027,
    topGrowthSkill: "iq_reads",
    topGrowthDelta: 1.5,
    isAccessible: false,
    hasFilmPackage: true,
    hasCoachNarrative: false,
  },
  {
    id: "p9",
    name: "Keontae Simmons",
    position: "PG",
    gradYear: 2029,
    height: "6'0\"",
    programName: "Academy of Hoops",
    teamTier: "Silver",
    division: "15U",
    overallTier: "Emerging",
    skillScores: { ball_handling: 6.2, shooting: 5.4, finishing: 5.9, defense: 5.7, footwork: 5.8, iq_reads: 6.1, athleticism: 6.5, conditioning: 6.3 },
    skillDeltas: { ball_handling: 0.9, shooting: 0.7, finishing: 0.8, defense: 0.6, footwork: 0.7, iq_reads: 0.8, athleticism: 0.5, conditioning: 0.6 },
    coachabilityIndex: 7.1,
    attendanceRate: 84,
    assessmentCount: 2,
    filmClipCount: 0,
    badgeCount: 1,
    growthRate: "average",
    profileSlug: "keontae-simmons-2029",
    gradYearInt: 2029,
    topGrowthSkill: "ball_handling",
    topGrowthDelta: 0.9,
    isAccessible: false,
    hasFilmPackage: false,
    hasCoachNarrative: false,
  },
  {
    id: "p10",
    name: "Amir Johnson",
    position: "C",
    gradYear: 2030,
    height: "6'11\"",
    wingspan: "7'3\"",
    programName: "East Bay Elite",
    teamTier: "Gold",
    division: "14U",
    overallTier: "Emerging",
    skillScores: { ball_handling: 3.9, shooting: 4.1, finishing: 5.8, defense: 6.2, footwork: 5.0, iq_reads: 4.8, athleticism: 7.8, conditioning: 6.1 },
    skillDeltas: { ball_handling: 0.7, shooting: 1.1, finishing: 0.8, defense: 0.9, footwork: 1.2, iq_reads: 0.6, athleticism: 0.4, conditioning: 0.7 },
    coachabilityIndex: 7.8,
    attendanceRate: 91,
    assessmentCount: 2,
    filmClipCount: 1,
    badgeCount: 2,
    growthRate: "top_25",
    profileSlug: "amir-johnson-2030",
    gradYearInt: 2030,
    topGrowthSkill: "footwork",
    topGrowthDelta: 1.2,
    isAccessible: false,
    hasFilmPackage: false,
    hasCoachNarrative: false,
  },
];

const INITIAL_BOARD: RecruiterBoard[] = [
  { playerId: "p1", status: "priority",  addedAt: "2026-05-10" },
  { playerId: "p2", status: "priority",  addedAt: "2026-05-08" },
  { playerId: "p3", status: "interested", addedAt: "2026-05-12" },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const SKILL_LABELS: Record<string, string> = {
  ball_handling: "Ball Handling",
  shooting: "Shooting",
  finishing: "Finishing",
  defense: "Defense",
  footwork: "Footwork",
  iq_reads: "IQ / Reads",
  athleticism: "Athleticism",
  conditioning: "Conditioning",
};

function tierColor(tier: VerifiedPlayer["overallTier"]): string {
  switch (tier) {
    case "Elite":      return PRIMARY;
    case "Advanced":   return SUCCESS;
    case "Developing": return WARNING;
    case "Emerging":   return MUTED;
  }
}

function teamTierColor(tier: VerifiedPlayer["teamTier"]): string {
  switch (tier) {
    case "Premier": return PRIMARY;
    case "Gold":    return WARNING;
    case "Silver":  return MUTED;
  }
}

function growthLabel(rate: VerifiedPlayer["growthRate"]): string {
  switch (rate) {
    case "top_10": return "Top 10%";
    case "top_25": return "Top 25%";
    case "average": return "Avg";
  }
}

function growthColor(rate: VerifiedPlayer["growthRate"]): string {
  switch (rate) {
    case "top_10": return SUCCESS;
    case "top_25": return WARNING;
    case "average": return MUTED;
  }
}

function avgDelta(player: VerifiedPlayer): number {
  const vals = Object.values(player.skillDeltas);
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

function avgScore(player: VerifiedPlayer): number {
  const vals = Object.values(player.skillScores);
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

/* -------------------------------------------------------------------------- */
/* Skill bars (SVG, top 4)                                                    */
/* -------------------------------------------------------------------------- */

function SkillBars({ player }: { player: VerifiedPlayer }) {
  const top4 = Object.entries(player.skillScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <div className="space-y-1.5">
      {top4.map(([key, score]) => {
        const delta = player.skillDeltas[key] ?? 0;
        const pct = (score / 10) * 100;
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="text-[10px] w-[88px] shrink-0 truncate" style={{ color: MUTED }}>
              {SKILL_LABELS[key] ?? key}
            </span>
            <svg width="80" height="5" viewBox="0 0 80 5" style={{ flexShrink: 0 }}>
              <rect x="0" y="0" width="80" height="5" rx="2.5" fill="oklch(0.22 0.01 260)" />
              <rect x="0" y="0" width={pct * 0.8} height="5" rx="2.5" fill={PRIMARY} />
            </svg>
            <span className="text-[10px] font-semibold tabular-nums w-6 text-right" style={{ color: "var(--text-primary)" }}>
              {score.toFixed(1)}
            </span>
            {delta !== 0 && (
              <span className="text-[9px] font-medium w-7 tabular-nums" style={{ color: delta > 0 ? SUCCESS : DANGER }}>
                {delta > 0 ? "+" : ""}{delta.toFixed(1)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Player search result card                                                   */
/* -------------------------------------------------------------------------- */

function PlayerCard({
  player,
  boardStatus,
  onSaveToBoard,
  onRequestAccess,
}: {
  player: VerifiedPlayer;
  boardStatus?: RecruiterBoard["status"];
  onSaveToBoard: (playerId: string) => void;
  onRequestAccess: (playerId: string) => void;
}) {
  const delta = avgDelta(player);

  return (
    <div
      className="rounded-xl border flex flex-col gap-3 p-4"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[15px] font-bold truncate" style={{ color: "var(--text-primary)" }}>
            {player.name}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: `${PRIMARY}22`, color: PRIMARY }}
            >
              {player.position}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded border"
              style={{ borderColor: "var(--border)", color: MUTED }}
            >
              Class of {player.gradYear}
            </span>
            <span className="text-[10px]" style={{ color: MUTED }}>{player.height}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded"
            style={{ background: `${tierColor(player.overallTier)}22`, color: tierColor(player.overallTier) }}
          >
            {player.overallTier}
          </span>
        </div>
      </div>

      {/* Program */}
      <div className="flex items-center gap-1.5 -mt-1">
        <span className="text-[11px]" style={{ color: MUTED }}>{player.programName}</span>
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: `${teamTierColor(player.teamTier)}18`, color: teamTierColor(player.teamTier) }}
        >
          {player.teamTier}
        </span>
      </div>

      {/* Skill bars */}
      <SkillBars player={player} />

      {/* Growth + coachability row */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
        <div style={{ color: growthColor(player.growthRate) }}>
          <span className="text-[11px] font-semibold">
            ↑ {growthLabel(player.growthRate)} growth
          </span>
          <span className="text-[10px] ml-1" style={{ color: MUTED }}>
            +{delta.toFixed(1)} avg delta
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span style={{ color: MUTED }}>Coachability</span>
          <span className="font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {player.coachabilityIndex.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-3 text-[10px]" style={{ color: MUTED }}>
        <span>{player.badgeCount} verified badge{player.badgeCount !== 1 ? "s" : ""}</span>
        <span>·</span>
        {player.hasFilmPackage ? (
          <span className="flex items-center gap-1">
            <Film className="w-3 h-3" />
            {player.filmClipCount} clips
          </span>
        ) : (
          <span className="opacity-50">No film package</span>
        )}
        {player.hasCoachNarrative && (
          <>
            <span>·</span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Narrative
            </span>
          </>
        )}
      </div>

      {/* Board status if on board */}
      {boardStatus && (
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: PRIMARY }} />
          <span className="text-[10px] font-semibold capitalize" style={{ color: PRIMARY }}>
            On your board — {boardStatus.replace("_", " ")}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link href={`/app/recruiter/players/${player.id}`} asChild>
          <a
            className="flex-1 text-center text-[12px] font-semibold py-2 rounded-lg transition-colors"
            style={{ background: PRIMARY, color: "white" }}
          >
            View Profile
          </a>
        </Link>
        {!boardStatus && (
          <button
            onClick={() => onSaveToBoard(player.id)}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-lg border transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            Save
          </button>
        )}
        {!player.isAccessible && (
          <button
            onClick={() => onRequestAccess(player.id)}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-lg border transition-colors"
            style={{ borderColor: `${PRIMARY}60`, color: PRIMARY }}
          >
            Request Access
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Filter panel                                                                */
/* -------------------------------------------------------------------------- */

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
const GRAD_YEARS = [2027, 2028, 2029, 2030] as const;
const OVERALL_TIERS: VerifiedPlayer["overallTier"][] = ["Elite", "Advanced", "Developing", "Emerging"];
const GROWTH_RATES: { value: VerifiedPlayer["growthRate"]; label: string }[] = [
  { value: "top_10", label: "Top 10%" },
  { value: "top_25", label: "Top 25%" },
  { value: "average", label: "Average" },
];
const TEAM_TIERS: VerifiedPlayer["teamTier"][] = ["Premier", "Gold", "Silver"];

function FilterPanel({
  filters,
  onFiltersChange,
  onClear,
}: {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  onClear: () => void;
}) {
  function toggleStringFilter<T extends string>(
    field: keyof Filters,
    value: T
  ) {
    const current = filters[field] as T[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [field]: next });
  }

  return (
    <div
      className="flex flex-col gap-5 p-4 rounded-xl border"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
          Filters
        </span>
        <button
          onClick={onClear}
          className="text-[11px] font-medium"
          style={{ color: MUTED }}
        >
          Clear all
        </button>
      </div>

      {/* Position */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: MUTED }}>
          Position
        </div>
        <div className="flex flex-col gap-1.5">
          {POSITIONS.map((pos) => (
            <label key={pos} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.positions.includes(pos)}
                onChange={() => toggleStringFilter("positions", pos)}
                className="rounded"
                style={{ accentColor: PRIMARY }}
              />
              <span className="text-[12px]" style={{ color: "var(--text-primary)" }}>{pos}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Grad year */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: MUTED }}>
          Grad Year
        </div>
        <div className="flex flex-col gap-1.5">
          {GRAD_YEARS.map((year) => (
            <label key={year} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.gradYears.includes(year)}
                onChange={() => toggleStringFilter("gradYears", year as unknown as string)}
                className="rounded"
                style={{ accentColor: PRIMARY }}
              />
              <span className="text-[12px]" style={{ color: "var(--text-primary)" }}>{year}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Overall tier */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: MUTED }}>
          Overall Tier
        </div>
        <div className="flex flex-col gap-1.5">
          {OVERALL_TIERS.map((tier) => (
            <label key={tier} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.tiers.includes(tier)}
                onChange={() => toggleStringFilter("tiers", tier)}
                className="rounded"
                style={{ accentColor: tierColor(tier) }}
              />
              <span className="text-[12px] font-medium" style={{ color: tierColor(tier) }}>{tier}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Growth rate */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: MUTED }}>
          Growth Rate
        </div>
        <div className="flex flex-col gap-1.5">
          {GROWTH_RATES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.growthRates.includes(value)}
                onChange={() => toggleStringFilter("growthRates", value)}
                className="rounded"
                style={{ accentColor: growthColor(value) }}
              />
              <span className="text-[12px]" style={{ color: "var(--text-primary)" }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Coachability slider */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: MUTED }}>
          Min Coachability: <span style={{ color: "var(--text-primary)" }}>{filters.minCoachability.toFixed(0)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={0.5}
          value={filters.minCoachability}
          onChange={(e) => onFiltersChange({ ...filters, minCoachability: parseFloat(e.target.value) })}
          className="w-full"
          style={{ accentColor: PRIMARY }}
        />
        <div className="flex justify-between text-[10px] mt-1" style={{ color: MUTED }}>
          <span>0</span>
          <span>10</span>
        </div>
      </div>

      {/* Team tier */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: MUTED }}>
          Team Tier
        </div>
        <div className="flex flex-col gap-1.5">
          {TEAM_TIERS.map((tier) => (
            <label key={tier} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.teamTiers.includes(tier)}
                onChange={() => toggleStringFilter("teamTiers", tier)}
                className="rounded"
                style={{ accentColor: teamTierColor(tier) }}
              />
              <span className="text-[12px] font-medium" style={{ color: teamTierColor(tier) }}>{tier}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        <label className="flex items-center justify-between gap-2 cursor-pointer">
          <span className="text-[12px]" style={{ color: "var(--text-primary)" }}>Has film package</span>
          <button
            onClick={() =>
              onFiltersChange({ ...filters, hasFilm: filters.hasFilm === true ? null : true })
            }
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{
              background: filters.hasFilm === true ? PRIMARY : "oklch(0.25 0.01 260)",
            }}
            role="switch"
            aria-checked={filters.hasFilm === true}
          >
            <span
              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
              style={{ transform: filters.hasFilm === true ? "translateX(16px)" : "translateX(0)" }}
            />
          </button>
        </label>
        <label className="flex items-center justify-between gap-2 cursor-pointer">
          <span className="text-[12px]" style={{ color: "var(--text-primary)" }}>Has coach narrative</span>
          <button
            onClick={() =>
              onFiltersChange({ ...filters, hasNarrative: filters.hasNarrative === true ? null : true })
            }
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{
              background: filters.hasNarrative === true ? PRIMARY : "oklch(0.25 0.01 260)",
            }}
            role="switch"
            aria-checked={filters.hasNarrative === true}
          >
            <span
              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
              style={{ transform: filters.hasNarrative === true ? "translateX(16px)" : "translateX(0)" }}
            />
          </button>
        </label>
      </div>

      <button
        className="text-[13px] font-semibold py-2.5 rounded-xl transition-colors"
        style={{ background: PRIMARY, color: "white" }}
        onClick={() => toast.success("Filters applied")}
      >
        Apply Filters
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

const DEFAULT_FILTERS: Filters = {
  positions: [],
  gradYears: [],
  tiers: [],
  growthRates: [],
  minCoachability: 0,
  teamTiers: [],
  hasFilm: null,
  hasNarrative: null,
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "tier_trajectory", label: "Tier + Trajectory" },
  { value: "recently_assessed", label: "Most Recently Assessed" },
  { value: "grad_year", label: "Grad Year" },
  { value: "alphabetical", label: "Alphabetical" },
];

const TIER_ORDER: Record<VerifiedPlayer["overallTier"], number> = {
  Elite: 4, Advanced: 3, Developing: 2, Emerging: 1,
};

export default function PlayerSearchPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>("tier_trajectory");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [board, setBoard] = useState<Record<string, RecruiterBoard>>(
    Object.fromEntries(INITIAL_BOARD.map((b) => [b.playerId, b]))
  );

  const filtered = useMemo(() => {
    let result = MOCK_PLAYERS.filter((p) => {
      if (filters.positions.length > 0 && !filters.positions.includes(p.position)) return false;
      if (filters.gradYears.length > 0 && !filters.gradYears.includes(p.gradYear)) return false;
      if (filters.tiers.length > 0 && !filters.tiers.includes(p.overallTier)) return false;
      if (filters.growthRates.length > 0 && !filters.growthRates.includes(p.growthRate)) return false;
      if (p.coachabilityIndex < filters.minCoachability) return false;
      if (filters.teamTiers.length > 0 && !filters.teamTiers.includes(p.teamTier)) return false;
      if (filters.hasFilm === true && !p.hasFilmPackage) return false;
      if (filters.hasNarrative === true && !p.hasCoachNarrative) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "tier_trajectory": {
          const tierDiff = TIER_ORDER[b.overallTier] - TIER_ORDER[a.overallTier];
          if (tierDiff !== 0) return tierDiff;
          return avgDelta(b) - avgDelta(a);
        }
        case "recently_assessed":
          return b.assessmentCount - a.assessmentCount;
        case "grad_year":
          return a.gradYearInt - b.gradYearInt;
        case "alphabetical":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [filters, sortBy]);

  function handleSaveToBoard(playerId: string) {
    setBoard((prev) => ({
      ...prev,
      [playerId]: { playerId, status: "watching", addedAt: new Date().toISOString().split("T")[0] },
    }));
    const player = MOCK_PLAYERS.find((p) => p.id === playerId);
    toast.success(`${player?.name ?? "Player"} added to your board as Watching.`);
  }

  function handleRequestAccess(playerId: string) {
    const player = MOCK_PLAYERS.find((p) => p.id === playerId);
    toast.success(`Access request sent for ${player?.name ?? "player"}. The family will be notified.`);
  }

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          eyebrow="Recruiting"
          title="Player Search"
          subtitle="Browse HoopsIQ-verified athlete profiles"
        />

        <div className="flex gap-6">
          {/* Filter sidebar — desktop */}
          <aside className="hidden lg:block w-[280px] shrink-0">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              onClear={() => setFilters(DEFAULT_FILTERS)}
            />
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter toggle */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center gap-2 text-[12px] font-semibold px-3.5 py-2 rounded-lg border transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                <ChevronDown
                  className="w-3.5 h-3.5 transition-transform"
                  style={{ transform: filtersOpen ? "rotate(180deg)" : "rotate(0)" }}
                />
              </button>
              {filtersOpen && (
                <div className="mt-3">
                  <FilterPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClear={() => setFilters(DEFAULT_FILTERS)}
                  />
                </div>
              )}
            </div>

            {/* Results header */}
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <div className="text-[14px]" style={{ color: "var(--text-primary)" }}>
                <span className="font-bold">{filtered.length}</span>
                <span style={{ color: MUTED }}> verified athlete{filtered.length !== 1 ? "s" : ""} match your criteria</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-[12px] border rounded-lg px-3 py-2 bg-transparent transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Results grid */}
            {visible.length === 0 ? (
              <div
                className="rounded-xl border p-10 text-center"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
              >
                <Search className="w-8 h-8 mx-auto mb-3" style={{ color: MUTED }} />
                <p className="text-[14px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  No athletes match these filters
                </p>
                <p className="text-[12px] mb-4" style={{ color: MUTED }}>
                  Try removing position restrictions, broadening the tier range, or lowering the coachability threshold.
                </p>
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="inline-flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg transition-colors"
                  style={{ background: `${PRIMARY}22`, color: PRIMARY }}
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visible.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      boardStatus={board[player.id]?.status}
                      onSaveToBoard={handleSaveToBoard}
                      onRequestAccess={handleRequestAccess}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setVisibleCount((n) => n + 12)}
                      className="text-[13px] font-semibold px-6 py-3 rounded-xl border transition-colors"
                      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                    >
                      Load {Math.min(12, filtered.length - visibleCount)} more athletes
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
