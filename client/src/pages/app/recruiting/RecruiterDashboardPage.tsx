/**
 * RecruiterDashboardPage — College coach home base.
 * Route: /app/recruiter
 *
 * Sections:
 *   1. Welcome / context banner (dismissible)
 *   2. Your Board (filtered player cards)
 *   3. Recently Viewed + Access Request Status
 *   4. Discover (featured players)
 *   5. Class needs reminder (localStorage)
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  X,
  TrendingUp,
  Star,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  BookmarkPlus,
  SlidersHorizontal,
  ArrowUpRight,
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
};

type RecruiterBoard = {
  playerId: string;
  status: "watching" | "interested" | "priority" | "not_a_fit";
  addedAt: string;
  notes?: string;
};

type AccessRequest = {
  id: string;
  playerId: string;
  playerName: string;
  status: "pending" | "approved" | "denied";
  requestedAt: string;
  respondedAt?: string;
  accessLevel: "profile_only" | "full_profile" | "includes_film";
  requestMessage: string;
};

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
  },
];

const MOCK_BOARD: RecruiterBoard[] = [
  { playerId: "p1", status: "priority",  addedAt: "2026-05-10", notes: "Watching spring circuit — top target for 2027 class" },
  { playerId: "p2", status: "priority",  addedAt: "2026-05-08" },
  { playerId: "p3", status: "interested", addedAt: "2026-05-12" },
  { playerId: "p4", status: "watching",  addedAt: "2026-05-14" },
  { playerId: "p5", status: "watching",  addedAt: "2026-05-15" },
];

const MOCK_ACCESS_REQUESTS: AccessRequest[] = [
  {
    id: "ar1",
    playerId: "p1",
    playerName: "Jordan Mills",
    status: "approved",
    requestedAt: "2026-05-09",
    respondedAt: "2026-05-10",
    accessLevel: "includes_film",
    requestMessage: "Interested in evaluating for our 2027 recruiting class.",
  },
  {
    id: "ar2",
    playerId: "p2",
    playerName: "Marcus Tate",
    status: "approved",
    requestedAt: "2026-05-07",
    respondedAt: "2026-05-08",
    accessLevel: "full_profile",
    requestMessage: "Top priority for our PG evaluation.",
  },
  {
    id: "ar3",
    playerId: "p3",
    playerName: "Darius Webb",
    status: "pending",
    requestedAt: "2026-05-12",
    accessLevel: "full_profile",
    requestMessage: "Interested in evaluating for 2028 wing class.",
  },
];

const RECENTLY_VIEWED: string[] = ["p1", "p2", "p3", "p4", "p5"];

const DISCOVER_PLAYERS: VerifiedPlayer[] = [
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
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const POSITIONS = ["PG", "SG", "SF", "PF", "C"];
const GRAD_YEARS = [2027, 2028, 2029, 2030];

function tierColor(tier: VerifiedPlayer["overallTier"]): string {
  switch (tier) {
    case "Elite":     return PRIMARY;
    case "Advanced":  return SUCCESS;
    case "Developing": return WARNING;
    case "Emerging":  return MUTED;
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
    case "top_10": return "Top 10% growth";
    case "top_25": return "Top 25% growth";
    case "average": return "Avg growth";
  }
}

function growthColor(rate: VerifiedPlayer["growthRate"]): string {
  switch (rate) {
    case "top_10": return SUCCESS;
    case "top_25": return WARNING;
    case "average": return MUTED;
  }
}

function statusLabel(status: RecruiterBoard["status"]): string {
  switch (status) {
    case "priority":   return "Priority";
    case "interested": return "Interested";
    case "watching":   return "Watching";
    case "not_a_fit":  return "Not a fit";
  }
}

function statusColor(status: RecruiterBoard["status"]): string {
  switch (status) {
    case "priority":   return PRIMARY;
    case "interested": return SUCCESS;
    case "watching":   return WARNING;
    case "not_a_fit":  return MUTED;
  }
}

function accessLevelLabel(level: AccessRequest["accessLevel"]): string {
  switch (level) {
    case "profile_only": return "Profile only";
    case "full_profile": return "Full profile";
    case "includes_film": return "Incl. film";
  }
}

/* SVG mini skill bar */
function SkillBar({ label, score, delta }: { label: string; score: number; delta: number }) {
  const pct = (score / 10) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-20 shrink-0" style={{ color: MUTED }}>{label}</span>
      <svg width="80" height="6" viewBox="0 0 80 6" style={{ flexShrink: 0 }}>
        <rect x="0" y="0" width="80" height="6" rx="3" fill="oklch(0.22 0.01 260)" />
        <rect x="0" y="0" width={pct * 0.8} height="6" rx="3" fill={PRIMARY} />
      </svg>
      <span className="text-[10px] font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{score.toFixed(1)}</span>
      {delta !== 0 && (
        <span className="text-[9px] font-medium" style={{ color: delta > 0 ? SUCCESS : DANGER }}>
          {delta > 0 ? "+" : ""}{delta.toFixed(1)}
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Board player card                                                           */
/* -------------------------------------------------------------------------- */

function BoardPlayerCard({
  player,
  board,
  accessRequest,
  onStatusChange,
  onNotes,
}: {
  player: VerifiedPlayer;
  board: RecruiterBoard;
  accessRequest?: AccessRequest;
  onStatusChange: (playerId: string, status: RecruiterBoard["status"]) => void;
  onNotes: (playerId: string) => void;
}) {
  const top2Skills = Object.entries(player.skillScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

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

  return (
    <div
      className="rounded-xl border flex flex-col gap-3 p-4"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[15px] font-bold truncate" style={{ color: "var(--text-primary)" }}>
            {player.name}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span
              className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: `${PRIMARY}22`, color: PRIMARY }}
            >
              {player.position}
            </span>
            <span className="text-[11px]" style={{ color: MUTED }}>
              Class of {player.gradYear}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[11px]" style={{ color: MUTED }}>{player.programName}</span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: `${teamTierColor(player.teamTier)}22`, color: teamTierColor(player.teamTier) }}
            >
              {player.teamTier}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded"
            style={{ background: `${tierColor(player.overallTier)}22`, color: tierColor(player.overallTier) }}
          >
            {player.overallTier}
          </span>
          {player.isAccessible ? (
            <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
              style={{ background: `${SUCCESS}22`, color: SUCCESS }}>
              Full access
            </span>
          ) : accessRequest?.status === "pending" ? (
            <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
              style={{ background: `${WARNING}22`, color: WARNING }}>
              Pending
            </span>
          ) : null}
        </div>
      </div>

      {/* Top 2 skills */}
      <div className="space-y-1.5">
        {top2Skills.map(([key, score]) => (
          <SkillBar
            key={key}
            label={SKILL_LABELS[key] ?? key}
            score={score}
            delta={player.skillDeltas[key] ?? 0}
          />
        ))}
      </div>

      {/* Coachability + growth */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]" style={{ color: MUTED }}>Coachability</span>
          <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {player.coachabilityIndex.toFixed(1)}
          </span>
          <span className="text-[10px]" style={{ color: MUTED }}>/10</span>
        </div>
        <span
          className="text-[10px] font-semibold"
          style={{ color: growthColor(player.growthRate) }}
        >
          ↑ {growthLabel(player.growthRate)}
        </span>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: statusColor(board.status) }}
        />
        <span className="text-[11px] font-semibold" style={{ color: statusColor(board.status) }}>
          {statusLabel(board.status)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
        <Link href={`/app/recruiter/players/${player.id}`} asChild>
          <a
            className="flex-1 text-center text-[12px] font-semibold py-2 rounded-lg transition-colors"
            style={{ background: `${PRIMARY}22`, color: PRIMARY }}
          >
            View Profile
          </a>
        </Link>
        <select
          value={board.status}
          onChange={(e) => onStatusChange(player.id, e.target.value as RecruiterBoard["status"])}
          className="text-[11px] border rounded-lg px-2 py-2 bg-transparent transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <option value="priority">Priority</option>
          <option value="interested">Interested</option>
          <option value="watching">Watching</option>
          <option value="not_a_fit">Not a fit</option>
        </select>
        <button
          onClick={() => onNotes(player.id)}
          className="text-[11px] border rounded-lg px-2.5 py-2 transition-colors hover:border-[var(--text-muted)]"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          Notes
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Discover card (compact)                                                     */
/* -------------------------------------------------------------------------- */

function DiscoverCard({ player }: { player: VerifiedPlayer }) {
  return (
    <div
      className="rounded-xl border flex flex-col gap-3 p-4"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[14px] font-bold truncate" style={{ color: "var(--text-primary)" }}>
            {player.name}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: `${PRIMARY}22`, color: PRIMARY }}
            >
              {player.position}
            </span>
            <span className="text-[11px]" style={{ color: MUTED }}>'{String(player.gradYear).slice(2)}</span>
            <span className="text-[10px]" style={{ color: MUTED }}>{player.height}</span>
          </div>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded shrink-0"
          style={{ background: `${tierColor(player.overallTier)}22`, color: tierColor(player.overallTier) }}
        >
          {player.overallTier}
        </span>
      </div>

      <div className="text-[11px]" style={{ color: MUTED }}>{player.programName}</div>

      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-semibold"
          style={{ color: growthColor(player.growthRate) }}
        >
          ↑ {growthLabel(player.growthRate)}
        </span>
        <span className="text-[10px]" style={{ color: MUTED }}>
          {player.assessmentCount} assessments · {player.badgeCount} badges
        </span>
      </div>

      <Link href={`/app/recruiter/players/${player.id}`} asChild>
        <a
          className="text-center text-[12px] font-semibold py-2 rounded-lg transition-colors"
          style={{ background: `${PRIMARY}22`, color: PRIMARY }}
        >
          View Profile
        </a>
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Recently viewed card (compact strip)                                        */
/* -------------------------------------------------------------------------- */

function RecentCard({ player }: { player: VerifiedPlayer }) {
  return (
    <div
      className="rounded-xl border p-3 flex flex-col gap-2 shrink-0 w-40"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <div>
        <div className="text-[12px] font-bold truncate" style={{ color: "var(--text-primary)" }}>
          {player.name}
        </div>
        <div className="text-[10px]" style={{ color: MUTED }}>
          {player.position} · {player.gradYear}
        </div>
      </div>
      <Link href={`/app/recruiter/players/${player.id}`} asChild>
        <a
          className="text-center text-[11px] font-semibold py-1.5 rounded-lg transition-colors"
          style={{ background: `${PRIMARY}22`, color: PRIMARY }}
        >
          View
        </a>
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ClassNeedsForm                                                              */
/* -------------------------------------------------------------------------- */

type ClassNeeds = {
  positions: string[];
  gradYears: number[];
};

function ClassNeedsForm() {
  const [needs, setNeeds] = useState<ClassNeeds>(() => {
    try {
      const stored = localStorage.getItem("hoopsos_class_needs");
      return stored ? (JSON.parse(stored) as ClassNeeds) : { positions: [], gradYears: [] };
    } catch {
      return { positions: [], gradYears: [] };
    }
  });
  const [saved, setSaved] = useState(false);

  function togglePosition(pos: string) {
    setNeeds((prev) => {
      const next = prev.positions.includes(pos)
        ? prev.positions.filter((p) => p !== pos)
        : [...prev.positions, pos];
      return { ...prev, positions: next };
    });
    setSaved(false);
  }

  function toggleYear(year: number) {
    setNeeds((prev) => {
      const next = prev.gradYears.includes(year)
        ? prev.gradYears.filter((y) => y !== year)
        : [...prev.gradYears, year];
      return { ...prev, gradYears: next };
    });
    setSaved(false);
  }

  function save() {
    localStorage.setItem("hoopsos_class_needs", JSON.stringify(needs));
    setSaved(true);
    toast.success("Class needs saved — search will pre-filter based on your selections.");
  }

  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <div className="text-[13px] font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
        Recruiting for
      </div>
      <div className="text-[11px] font-semibold mb-2" style={{ color: MUTED }}>Positions</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => togglePosition(pos)}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all"
            style={{
              borderColor: needs.positions.includes(pos) ? PRIMARY : "var(--border)",
              background: needs.positions.includes(pos) ? `${PRIMARY}22` : "transparent",
              color: needs.positions.includes(pos) ? PRIMARY : MUTED,
            }}
          >
            {pos}
          </button>
        ))}
      </div>
      <div className="text-[11px] font-semibold mb-2" style={{ color: MUTED }}>Grad Years</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {GRAD_YEARS.map((year) => (
          <button
            key={year}
            onClick={() => toggleYear(year)}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all"
            style={{
              borderColor: needs.gradYears.includes(year) ? PRIMARY : "var(--border)",
              background: needs.gradYears.includes(year) ? `${PRIMARY}22` : "transparent",
              color: needs.gradYears.includes(year) ? PRIMARY : MUTED,
            }}
          >
            {year}
          </button>
        ))}
      </div>
      <button
        onClick={save}
        className="text-[12px] font-semibold px-4 py-2 rounded-lg transition-colors"
        style={{ background: saved ? `${SUCCESS}22` : `${PRIMARY}22`, color: saved ? SUCCESS : PRIMARY }}
      >
        {saved ? "Saved ✓" : "Save preferences"}
      </button>
      {saved && (
        <p className="text-[11px] mt-2" style={{ color: MUTED }}>
          These preferences will pre-filter your player search results.
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

const BOARD_FILTER_TABS = [
  { id: "all",        label: "All"        },
  { id: "priority",   label: "Priority"   },
  { id: "interested", label: "Interested" },
  { id: "watching",   label: "Watching"   },
  { id: "not_a_fit",  label: "Not a fit"  },
] as const;

type BoardFilterTab = typeof BOARD_FILTER_TABS[number]["id"];

export default function RecruiterDashboardPage() {
  const [, navigate] = useLocation();
  const [bannerDismissed, setBannerDismissed] = useState(() =>
    localStorage.getItem("hoopsos_recruiter_banner_dismissed") === "true"
  );
  const [boardFilter, setBoardFilter] = useState<BoardFilterTab>("all");
  const [boardStatuses, setBoardStatuses] = useState<Record<string, RecruiterBoard["status"]>>(
    Object.fromEntries(MOCK_BOARD.map((b) => [b.playerId, b.status]))
  );

  function dismissBanner() {
    setBannerDismissed(true);
    localStorage.setItem("hoopsos_recruiter_banner_dismissed", "true");
  }

  function handleStatusChange(playerId: string, status: RecruiterBoard["status"]) {
    setBoardStatuses((prev) => ({ ...prev, [playerId]: status }));
    toast.success(`Status updated to ${statusLabel(status)}`);
  }

  function handleNotes(playerId: string) {
    const player = MOCK_PLAYERS.find((p) => p.id === playerId);
    toast.info(`Notes for ${player?.name ?? "player"} — notes panel coming soon.`);
  }

  const boardPlayers = MOCK_BOARD
    .filter((b) => boardFilter === "all" || boardStatuses[b.playerId] === boardFilter)
    .map((b) => {
      const player = MOCK_PLAYERS.find((p) => p.id === b.playerId);
      const accessRequest = MOCK_ACCESS_REQUESTS.find((r) => r.playerId === b.playerId);
      return player
        ? { player, board: { ...b, status: boardStatuses[b.playerId] }, accessRequest }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const recentPlayers = RECENTLY_VIEWED.map((id) =>
    MOCK_PLAYERS.find((p) => p.id === id)
  ).filter((p): p is VerifiedPlayer => p !== null);

  const pendingRequests = MOCK_ACCESS_REQUESTS.filter((r) => r.status === "pending");
  const recentResolved = MOCK_ACCESS_REQUESTS.filter(
    (r) => r.status === "approved" || r.status === "denied"
  ).slice(0, 3);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          eyebrow="HoopsIQ Recruiting"
          title="Recruiting Dashboard"
          subtitle="Verified athlete profiles from development-focused programs"
          actions={
            <Link href="/app/recruiter/search" asChild>
              <a
                className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-colors"
                style={{ background: PRIMARY, color: "white" }}
              >
                <Search className="w-4 h-4" />
                Search All Players
              </a>
            </Link>
          }
        />

        {/* Welcome banner */}
        {!bannerDismissed && (
          <div
            className="relative rounded-xl border p-5 mb-8 flex items-start gap-4"
            style={{
              background: `${PRIMARY}0D`,
              borderColor: `${PRIMARY}40`,
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold mb-1" style={{ color: PRIMARY }}>
                What makes HoopsIQ profiles different
              </div>
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                Every profile is generated from coach-recorded assessment data — not self-reported.
                You see skill trajectories across multiple cycles, verified coach badges with evidence,
                and coachability indicators including attendance, IDP completion, and film engagement.
                This is evaluation-grade data you can't find anywhere else.
              </p>
            </div>
            <button
              onClick={dismissBanner}
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: MUTED }}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Board section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
              Your Board
            </h2>
            <Link href="/app/recruiter/access-requests" asChild>
              <a className="flex items-center gap-1 text-[12px] font-medium" style={{ color: MUTED }}>
                Access requests
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </Link>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {BOARD_FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setBoardFilter(tab.id)}
                className="text-[12px] font-semibold px-3.5 py-1.5 rounded-full border transition-all"
                style={{
                  borderColor: boardFilter === tab.id ? PRIMARY : "var(--border)",
                  background: boardFilter === tab.id ? `${PRIMARY}22` : "transparent",
                  color: boardFilter === tab.id ? PRIMARY : MUTED,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {boardPlayers.length === 0 ? (
            <div
              className="rounded-xl border p-10 text-center"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <BookmarkPlus className="w-8 h-8 mx-auto mb-3" style={{ color: MUTED }} />
              <p className="text-[14px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {boardFilter === "all" ? "Your board is empty" : `No ${statusLabel(boardFilter as RecruiterBoard["status"])} players`}
              </p>
              <p className="text-[12px] mb-4" style={{ color: MUTED }}>
                {boardFilter === "all"
                  ? "Search for verified players to start evaluating."
                  : "Try a different filter tab."}
              </p>
              <Link href="/app/recruiter/search" asChild>
                <a
                  className="inline-flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg transition-colors"
                  style={{ background: `${PRIMARY}22`, color: PRIMARY }}
                >
                  <Search className="w-4 h-4" />
                  Search verified players
                </a>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boardPlayers.map(({ player, board, accessRequest }) => (
                <BoardPlayerCard
                  key={player.id}
                  player={player}
                  board={board}
                  accessRequest={accessRequest}
                  onStatusChange={handleStatusChange}
                  onNotes={handleNotes}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section className="mb-10">
          <h2 className="text-[18px] font-bold mb-5" style={{ color: "var(--text-primary)" }}>
            Recent Activity
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recently viewed */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4" style={{ color: MUTED }} />
                <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Recently Viewed
                </span>
              </div>
              <div
                className="flex gap-3 overflow-x-auto pb-2"
                style={{ scrollbarWidth: "none" }}
              >
                {recentPlayers.map((player) => (
                  <RecentCard key={player.id} player={player} />
                ))}
              </div>
            </div>

            {/* Access request status */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4" style={{ color: MUTED }} />
                <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Access Request Status
                </span>
              </div>
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-lg border px-3 py-2.5 flex items-center justify-between gap-3"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                  >
                    <div className="min-w-0">
                      <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {req.playerName}
                      </span>
                      <span className="text-[11px] ml-1.5" style={{ color: MUTED }}>
                        — {MOCK_PLAYERS.find((p) => p.id === req.playerId)?.programName}
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded shrink-0"
                      style={{ background: `${WARNING}22`, color: WARNING }}
                    >
                      Pending
                    </span>
                  </div>
                ))}
                {recentResolved.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-lg border px-3 py-2.5 flex items-center justify-between gap-3"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                  >
                    <div className="min-w-0">
                      <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {req.playerName}
                      </span>
                      <span className="text-[11px] ml-1.5" style={{ color: MUTED }}>
                        — Access {req.status === "approved" ? "approved" : "denied"}{" "}
                        {req.respondedAt ? `on ${req.respondedAt}` : "recently"}
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded shrink-0"
                      style={{
                        background: req.status === "approved" ? `${SUCCESS}22` : `${DANGER}22`,
                        color: req.status === "approved" ? SUCCESS : DANGER,
                      }}
                    >
                      {req.status === "approved" ? "Approved" : "Denied"}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/app/recruiter/access-requests" asChild>
                <a
                  className="inline-flex items-center gap-1 text-[11px] font-medium mt-2"
                  style={{ color: MUTED }}
                >
                  View all requests
                  <ChevronRight className="w-3 h-3" />
                </a>
              </Link>
            </div>
          </div>
        </section>

        {/* Discover */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
                Discover
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
                New verified profiles this week — highest tier + most active
              </p>
            </div>
            <Link href="/app/recruiter/search" asChild>
              <a
                className="flex items-center gap-1 text-[12px] font-semibold"
                style={{ color: PRIMARY }}
              >
                See all
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DISCOVER_PLAYERS.map((player) => (
              <DiscoverCard key={player.id} player={player} />
            ))}
          </div>
        </section>

        {/* Search CTA */}
        <section className="mb-10">
          <Link href="/app/recruiter/search" asChild>
            <a
              className="flex items-center justify-between w-full rounded-xl border px-6 py-5 transition-colors group"
              style={{
                background: `${PRIMARY}0D`,
                borderColor: `${PRIMARY}40`,
              }}
            >
              <div>
                <div className="text-[15px] font-bold" style={{ color: PRIMARY }}>
                  Search All Verified Players
                </div>
                <div className="text-[12px] mt-0.5" style={{ color: MUTED }}>
                  Filter by position, grad year, tier, growth rate, coachability, and more
                </div>
              </div>
              <div
                className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-lg shrink-0"
                style={{ background: PRIMARY, color: "white" }}
              >
                <Search className="w-4 h-4" />
                Search →
              </div>
            </a>
          </Link>
        </section>

        {/* Class needs */}
        <section>
          <h2 className="text-[18px] font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            My Recruiting Needs
          </h2>
          <ClassNeedsForm />
        </section>
      </div>
    </AppShell>
  );
}
