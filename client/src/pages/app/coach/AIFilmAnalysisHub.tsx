/**
 * AIFilmAnalysisHub — AI-powered film review and insight engine for HoopsIQ coaches.
 *
 * Sections:
 *   1. AI Processing Queue strip — live status counts + filter tabs
 *   2. Film Library — card grid with status indicators + AI preview
 *   3. Film Analysis View — full panel with AI insights + coach actions
 *   4. Insights Library — searchable archive across all players
 *   5. AI Performance Summary — accuracy/confirmation metrics
 */
import { useState, useMemo } from "react";
import {
  Sparkles,
  Film,
  CheckCircle2,
  Clock,
  X,
  ChevronRight,
  Search,
  Info,
  ArrowLeft,
  Target,
  BarChart2,
  CheckSquare,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";
import {
  useAnalysisClips,
  useSessionAnalysisSummary,
  useCoachReviewClip,
  EVENT_LABELS,
  MOCK_SESSION_SUMMARY,
} from "@/features/film-analysis";
import { AnalysisClipCard } from "@/features/film-analysis/components/AnalysisClipCard";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY  = "oklch(0.72 0.18 290)";
const SUCCESS  = "oklch(0.75 0.12 140)";
const WARNING  = "oklch(0.78 0.16 75)";
const DANGER   = "oklch(0.68 0.22 25)";
const BLUE     = "oklch(0.65 0.15 230)";
const TEAL     = "oklch(0.70 0.13 190)";
const ROSE     = "oklch(0.70 0.18 10)";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type AIInsight = {
  id: string;
  category: "shooting" | "defense" | "ball_handling" | "footwork" | "iq_reads" | "conditioning";
  type: "pattern" | "improvement" | "concern" | "strength";
  title: string;
  description: string;
  confidence: number;
  timestamp?: string;
  clipId: string;
  evidenceCount: number;
};

type FilmSubmission = {
  id: string;
  playerId: string;
  playerName: string;
  type: "game" | "practice" | "skill_rep" | "highlight";
  submittedAt: string;
  duration: number;
  title: string;
  reviewStatus: "pending" | "ai_processing" | "ai_complete" | "coach_reviewed" | "archived";
  aiInsights?: AIInsight[];
  coachAnnotations?: number;
  thumbnail?: string;
  skillTags: string[];
  gameContext?: string;
};

type AnnotationTemplate = {
  id: string;
  category: string;
  label: string;
  emoji: string;
  defaultText: string;
};

type InsightAction = "confirmed" | "dismissed" | "added_to_idp" | null;

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const ANNOTATION_TEMPLATES: AnnotationTemplate[] = [
  { id: "t1", category: "positive",  label: "Good read",            emoji: "🎯", defaultText: "Great basketball IQ — trusted the read." },
  { id: "t2", category: "technical", label: "Reset feet",           emoji: "🦵", defaultText: "Reset your feet before attacking — you're off-balance." },
  { id: "t3", category: "mental",    label: "Trust your shot",      emoji: "💪", defaultText: "That's a green light. Trust the work in the gym." },
  { id: "t4", category: "defense",   label: "Help defense pos.",    emoji: "🛡️", defaultText: "Drop to help-side earlier — you were caught in no-man's land." },
  { id: "t5", category: "offense",   label: "Attack off the catch", emoji: "⚡", defaultText: "Attack the closeout — don't waste the advantage." },
  { id: "t6", category: "positive",  label: "Compete level ↑",     emoji: "🔥", defaultText: "This is the compete level we need every possession." },
];

const MALIK_INSIGHTS: AIInsight[] = [
  {
    id: "mi1",
    category: "shooting",
    type: "concern",
    title: "Release point inconsistency: catch-and-shoot vs off-dribble",
    description: "Malik's shooting release is 12–15% lower on catch-and-shoot situations compared to off-dribble pull-ups. Lower release correlates with 3 contested rejections in Q3–Q4 game situations. Likely caused by insufficient leg load on the catch.",
    confidence: 0.87,
    timestamp: "2:14",
    clipId: "clip_mh_001",
    evidenceCount: 9,
  },
  {
    id: "mi2",
    category: "defense",
    type: "concern",
    title: "Transition defense: ball-watching at half court",
    description: "4 of 6 tracked transition possessions show Malik losing his assignment while watching the ball at half court. Results in late rotations and 2 uncontested layups allowed. Pattern is most pronounced off made baskets.",
    confidence: 0.91,
    timestamp: "4:38",
    clipId: "clip_mh_002",
    evidenceCount: 6,
  },
  {
    id: "mi3",
    category: "iq_reads",
    type: "strength",
    title: "Pick-and-roll reads: correctly identifies ICE coverage",
    description: "Malik makes the correct read on ICE ball-screen coverage in 8 of 9 instances, showing advanced defensive IQ for his age. He communicates coverage to teammates in 6 of those possessions.",
    confidence: 0.83,
    timestamp: "7:02",
    clipId: "clip_mh_003",
    evidenceCount: 9,
  },
  {
    id: "mi4",
    category: "footwork",
    type: "improvement",
    title: "Post footwork improving: jump-stop entry improving",
    description: "Compared to last session, jump-stop entries on the block are more balanced. 6 of 8 are square to the basket vs 3 of 8 previously. Still needs work on pivot foot discipline on drop-step finishes.",
    confidence: 0.79,
    timestamp: "9:45",
    clipId: "clip_mh_004",
    evidenceCount: 8,
  },
  {
    id: "mi5",
    category: "ball_handling",
    type: "pattern",
    title: "Telegraphs drive right: pre-dribble shoulder lean",
    description: "A detectable left-shoulder lean precedes 5 of 7 right-side drives. Defenders begin hedging before the dribble initiates. This tell appears in late-clock situations — likely stress-related motor habit.",
    confidence: 0.76,
    timestamp: "11:20",
    clipId: "clip_mh_005",
    evidenceCount: 7,
  },
  {
    id: "mi6",
    category: "conditioning",
    type: "pattern",
    title: "Late-game shot quality drops: Q4 efficiency decline",
    description: "Shot selection and execution quality noticeably decline after the 5-minute mark of Q4. Off-balance attempts increase by 40% and decision lag increases by ~0.8 seconds. Consistent across 3 of 4 game films in the dataset.",
    confidence: 0.72,
    timestamp: "38:15",
    clipId: "clip_mh_006",
    evidenceCount: 4,
  },
  {
    id: "mi7",
    category: "shooting",
    type: "strength",
    title: "Mid-range pull-up: elite contact absorption",
    description: "Malik absorbs contact on pull-up jumpers better than 90% of comparables at this level. Gets to the line or completes the shot through contact in 6 of 7 mid-range attempts — a genuine weapon.",
    confidence: 0.85,
    timestamp: "15:33",
    clipId: "clip_mh_007",
    evidenceCount: 7,
  },
];

const BRANDON_INSIGHTS: AIInsight[] = [
  {
    id: "bi1",
    category: "ball_handling",
    type: "concern",
    title: "Left-hand finishing gap: 81% right vs 47% left layup rate",
    description: "Brandon completes 81% of right-hand layup attempts but only 47% on left-hand finishes. Discrepancy is consistent across all 12 skill rep clips. Left-hand attempts frequently miss off the near side of the backboard, suggesting a lack of wrist flex on the off hand.",
    confidence: 0.94,
    timestamp: "0:32",
    clipId: "clip_bl_001",
    evidenceCount: 12,
  },
  {
    id: "bi2",
    category: "ball_handling",
    type: "concern",
    title: "Speed dribble: excessive head-down posture",
    description: "Brandon's head drops below a neutral scan angle on 9 of 11 speed dribble sequences. This creates a reaction-time deficit when encountering defensive rotations and is contributing to turnover tendencies in transition.",
    confidence: 0.89,
    timestamp: "1:05",
    clipId: "clip_bl_002",
    evidenceCount: 11,
  },
  {
    id: "bi3",
    category: "ball_handling",
    type: "improvement",
    title: "Crossover pace change: rep quality up 22% vs last session",
    description: "The hesitation-to-burst timing on crossover sequences has improved measurably. Brandon is now generating genuine pace contrast in 7 of 10 reps vs 4 of 10 in the previous skill session three weeks ago.",
    confidence: 0.81,
    timestamp: "2:47",
    clipId: "clip_bl_003",
    evidenceCount: 10,
  },
  {
    id: "bi4",
    category: "footwork",
    type: "pattern",
    title: "Euro-step entry: early plant foot creates off-balance finish",
    description: "Plant foot is landing 6–8 inches too early on euro-step sequences, reducing hip torque through the finish. Brandon's 3 strongest reps all show a later plant foot contact. This is a coachable mechanical fix.",
    confidence: 0.84,
    timestamp: "4:12",
    clipId: "clip_bl_004",
    evidenceCount: 8,
  },
  {
    id: "bi5",
    category: "conditioning",
    type: "strength",
    title: "Drill intensity maintenance: consistent effort floor",
    description: "Brandon maintains above-baseline intensity across 85% of reps even in later sets. His conditioning base is solid — fatigue is not the primary driver of technique breakdowns in this session.",
    confidence: 0.77,
    timestamp: "6:30",
    clipId: "clip_bl_005",
    evidenceCount: 11,
  },
  {
    id: "bi6",
    category: "shooting",
    type: "improvement",
    title: "Pull-up off the dribble: catch-to-set mechanics improving",
    description: "The gather phase on pull-up attempts has become more compact in recent clips. Brandon is generating better upward force transfer — his miss pattern is shifting from short-left to near-rim, indicating mechanics are loading correctly.",
    confidence: 0.73,
    timestamp: "8:00",
    clipId: "clip_bl_006",
    evidenceCount: 7,
  },
  {
    id: "bi7",
    category: "iq_reads",
    type: "pattern",
    title: "Decision-making under time pressure: rushes on 3-second clock",
    description: "In 5 simulated time-pressure reps, Brandon forces his dominant right hand in all 5 cases regardless of defender positioning. When no defender is present, he uses both hands freely. Pressure-specific motor pattern — needs exposure to live reads.",
    confidence: 0.80,
    timestamp: "9:55",
    clipId: "clip_bl_007",
    evidenceCount: 5,
  },
  {
    id: "bi8",
    category: "ball_handling",
    type: "strength",
    title: "Between-the-legs: clean, consistent mechanics",
    description: "BTL dribble execution is among the cleanest in the 15U cohort. Ball contact point, timing, and through-gate clearance are consistent across 10 of 11 reps. This is ready for live-game deployment.",
    confidence: 0.91,
    timestamp: "3:25",
    clipId: "clip_bl_008",
    evidenceCount: 11,
  },
];

const FILM_SUBMISSIONS: FilmSubmission[] = [
  {
    id: "fs1",
    playerId: "p1",
    playerName: "Malik Henderson",
    type: "game",
    submittedAt: "2026-05-13T14:30:00Z",
    duration: 2640,
    title: "Oak Hill — Full Game Film",
    reviewStatus: "ai_complete",
    aiInsights: MALIK_INSIGHTS,
    skillTags: ["shooting", "defense", "footwork", "iq_reads"],
    gameContext: "vs Oak Hill Academy · Q1–Q4",
    thumbnail: "Game film thumbnail — Malik driving baseline",
  },
  {
    id: "fs2",
    playerId: "p2",
    playerName: "Brandon Lee",
    type: "skill_rep",
    submittedAt: "2026-05-12T10:15:00Z",
    duration: 618,
    title: "Ball-Handling Circuit — Session 7",
    reviewStatus: "ai_complete",
    aiInsights: BRANDON_INSIGHTS,
    skillTags: ["ball_handling", "footwork", "conditioning"],
    thumbnail: "Skill rep thumbnail — Brandon dribbling drill",
  },
  {
    id: "fs3",
    playerId: "p1",
    playerName: "Malik Henderson",
    type: "practice",
    submittedAt: "2026-05-10T16:00:00Z",
    duration: 900,
    title: "Half-Court Defense Reps",
    reviewStatus: "coach_reviewed",
    coachAnnotations: 8,
    skillTags: ["defense", "footwork"],
    thumbnail: "Practice film — defensive slide drills",
  },
  {
    id: "fs4",
    playerId: "p3",
    playerName: "Jordan Okafor",
    type: "game",
    submittedAt: "2026-05-09T19:00:00Z",
    duration: 2580,
    title: "Riverside Tournament — Game 2",
    reviewStatus: "coach_reviewed",
    coachAnnotations: 12,
    skillTags: ["shooting", "conditioning", "iq_reads"],
    gameContext: "vs Riverside Prep · Tournament Semifinal",
    thumbnail: "Game film — Jordan post moves",
  },
  {
    id: "fs5",
    playerId: "p4",
    playerName: "Darius Webb",
    type: "highlight",
    submittedAt: "2026-05-08T11:45:00Z",
    duration: 240,
    title: "Spring Season Highlight Reel",
    reviewStatus: "coach_reviewed",
    coachAnnotations: 4,
    skillTags: ["shooting", "ball_handling"],
    thumbnail: "Highlight reel thumbnail",
  },
  {
    id: "fs6",
    playerId: "p3",
    playerName: "Jordan Okafor",
    type: "skill_rep",
    submittedAt: "2026-05-14T09:00:00Z",
    duration: 480,
    title: "Post Footwork — Drop Step Series",
    reviewStatus: "ai_processing",
    skillTags: ["footwork", "conditioning"],
    thumbnail: "Skill rep — post footwork",
  },
  {
    id: "fs7",
    playerId: "p4",
    playerName: "Darius Webb",
    type: "practice",
    submittedAt: "2026-05-14T15:20:00Z",
    duration: 720,
    title: "Three-Point Shooting — Off-Screen Actions",
    reviewStatus: "pending",
    skillTags: ["shooting", "footwork"],
    thumbnail: "Practice film — catch-and-shoot off screens",
  },
  {
    id: "fs8",
    playerId: "p2",
    playerName: "Brandon Lee",
    type: "game",
    submittedAt: "2026-05-11T20:00:00Z",
    duration: 2520,
    title: "Eastside Classic — Full Game",
    reviewStatus: "pending",
    skillTags: ["ball_handling", "defense", "iq_reads"],
    gameContext: "vs Eastside Elite · Regular Season",
    thumbnail: "Game film — Brandon in transition",
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ""}`.trim();
  return `${s}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function categoryColor(cat: AIInsight["category"]): string {
  switch (cat) {
    case "shooting":      return PRIMARY;
    case "defense":       return TEAL;
    case "ball_handling": return BLUE;
    case "footwork":      return WARNING;
    case "iq_reads":      return "oklch(0.70 0.16 310)";
    case "conditioning":  return ROSE;
  }
}

function categoryLabel(cat: AIInsight["category"]): string {
  switch (cat) {
    case "shooting":      return "Shooting";
    case "defense":       return "Defense";
    case "ball_handling": return "Ball Handling";
    case "footwork":      return "Footwork";
    case "iq_reads":      return "IQ / Reads";
    case "conditioning":  return "Conditioning";
  }
}

function typeColor(type: AIInsight["type"]): string {
  switch (type) {
    case "strength":    return SUCCESS;
    case "improvement": return BLUE;
    case "pattern":     return WARNING;
    case "concern":     return DANGER;
  }
}

function typeLabel(type: AIInsight["type"]): string {
  switch (type) {
    case "strength":    return "Strength";
    case "improvement": return "Improving";
    case "pattern":     return "Pattern";
    case "concern":     return "Concern";
  }
}

function filmTypeBadgeColor(type: FilmSubmission["type"]): string {
  switch (type) {
    case "game":      return DANGER;
    case "practice":  return BLUE;
    case "skill_rep": return PRIMARY;
    case "highlight": return WARNING;
  }
}

function filmTypeLabel(type: FilmSubmission["type"]): string {
  switch (type) {
    case "game":      return "Game";
    case "practice":  return "Practice";
    case "skill_rep": return "Skill Rep";
    case "highlight": return "Highlight";
  }
}

function avgConfidence(insights: AIInsight[]): number {
  if (!insights.length) return 0;
  return insights.reduce((a, b) => a + b.confidence, 0) / insights.length;
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function PlayerInitials({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const parts = name.split(" ");
  const initials = (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
  const cls =
    size === "lg"
      ? "w-12 h-12 text-[16px]"
      : size === "sm"
      ? "w-7 h-7 text-[10px]"
      : "w-9 h-9 text-[12px]";
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{ background: "oklch(0.72 0.18 290 / 0.15)", color: PRIMARY, border: `1.5px solid oklch(0.72 0.18 290 / 0.3)` }}
    >
      {initials.toUpperCase()}
    </div>
  );
}

function ConfidenceBar({ value, color }: { value: number; color?: string }) {
  const pct = Math.round(value * 100);
  const c = color ?? PRIMARY;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: c }}
        />
      </div>
      <span className="text-[11px] font-mono font-semibold tabular-nums" style={{ color: c }}>
        {pct}%
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 1: AI Processing Queue Strip                                        */
/* -------------------------------------------------------------------------- */

type QueueFilter = "all" | "pending" | "ai_complete" | "coach_reviewed";

function ProcessingQueueStrip({
  submissions,
  activeFilter,
  onFilterChange,
}: {
  submissions: FilmSubmission[];
  activeFilter: QueueFilter;
  onFilterChange: (f: QueueFilter) => void;
}) {
  const processing = submissions.filter((s) => s.reviewStatus === "ai_processing").length;
  const aiReady    = submissions.filter((s) => s.reviewStatus === "ai_complete").length;

  const now   = new Date("2026-05-15");
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const reviewedThisWeek = submissions.filter(
    (s) => s.reviewStatus === "coach_reviewed" && new Date(s.submittedAt) >= weekAgo,
  ).length;

  const filters: { key: QueueFilter; label: string; count: number }[] = [
    { key: "all",           label: "All",       count: submissions.length },
    { key: "pending",       label: "Pending",   count: submissions.filter((s) => s.reviewStatus === "pending" || s.reviewStatus === "ai_processing").length },
    { key: "ai_complete",   label: "AI Ready",  count: aiReady },
    { key: "coach_reviewed",label: "Reviewed",  count: submissions.filter((s) => s.reviewStatus === "coach_reviewed").length },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Stats row */}
      <div className="flex flex-wrap gap-4">
        {/* Processing */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: WARNING }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ background: WARNING }}
            />
          </span>
          <span className="text-[13px] text-muted-foreground">
            <span className="font-semibold text-foreground">{processing}</span> clips processing
          </span>
        </div>

        <div className="w-px h-4 bg-border self-center" />

        {/* AI Ready */}
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: BLUE }}
          />
          <span className="text-[13px] text-muted-foreground">
            <span className="font-semibold" style={{ color: BLUE }}>{aiReady}</span> ready for review
          </span>
        </div>

        <div className="w-px h-4 bg-border self-center" />

        {/* Reviewed */}
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: SUCCESS }} />
          <span className="text-[13px] text-muted-foreground">
            <span className="font-semibold" style={{ color: SUCCESS }}>{reviewedThisWeek}</span> reviewed this week
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => {
          const active = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all"
              style={{
                minHeight: 32,
                background: active ? `oklch(0.72 0.18 290 / 0.12)` : "transparent",
                color: active ? PRIMARY : "oklch(0.55 0.02 260)",
                border: active ? `1px solid oklch(0.72 0.18 290 / 0.3)` : "1px solid transparent",
              }}
            >
              {f.label}
              <span
                className="rounded-full px-1.5 py-0 text-[10px] font-mono font-bold"
                style={{
                  background: active ? `oklch(0.72 0.18 290 / 0.15)` : "oklch(0.55 0.02 260 / 0.12)",
                  color: active ? PRIMARY : "oklch(0.55 0.02 260)",
                }}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 2: Film Library Card                                                */
/* -------------------------------------------------------------------------- */

function FilmCard({
  submission,
  onClick,
}: {
  submission: FilmSubmission;
  onClick: () => void;
}) {
  const { reviewStatus, aiInsights } = submission;

  const statusDot = () => {
    switch (reviewStatus) {
      case "ai_processing":
        return (
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: WARNING }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: WARNING }} />
          </span>
        );
      case "ai_complete":
        return <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: BLUE }} />;
      case "coach_reviewed":
        return <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: SUCCESS }} />;
      default:
        return <span className="w-2.5 h-2.5 rounded-full bg-muted shrink-0" />;
    }
  };

  const statusText = () => {
    switch (reviewStatus) {
      case "ai_processing":  return <span className="text-[11px]" style={{ color: WARNING }}>Processing…</span>;
      case "ai_complete":    return <span className="text-[11px]" style={{ color: BLUE }}>Ready for review</span>;
      case "coach_reviewed": return <span className="text-[11px]" style={{ color: SUCCESS }}>Reviewed{submission.coachAnnotations ? ` · ${submission.coachAnnotations} annotations` : ""}</span>;
      case "pending":        return <span className="text-[11px] text-muted-foreground">Pending AI</span>;
      default:               return <span className="text-[11px] text-muted-foreground">Archived</span>;
    }
  };

  const topInsightPreview = aiInsights && aiInsights.length > 0 && (
    <div
      className="mt-2 rounded-lg px-2.5 py-1.5 text-[11px]"
      style={{ background: "oklch(0.65 0.15 230 / 0.08)", border: "1px solid oklch(0.65 0.15 230 / 0.2)" }}
    >
      <span style={{ color: BLUE }}>
        <Sparkles className="inline w-3 h-3 mr-1" />
        {aiInsights.length} patterns detected
      </span>
      <span className="text-muted-foreground ml-1.5">
        · {aiInsights.map((i) => categoryLabel(i.category)).filter((v, idx, arr) => arr.indexOf(v) === idx).slice(0, 3).join(" · ")}
      </span>
    </div>
  );

  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-border bg-card p-4 text-left hover:border-[oklch(0.72_0.18_290_/_0.4)] transition-all group w-full"
      style={{ minHeight: 44 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <PlayerInitials name={submission.playerName} size="sm" />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-foreground truncate">{submission.playerName}</div>
            <div className="text-[11px] text-muted-foreground">{formatDate(submission.submittedAt)}</div>
          </div>
        </div>
        <span
          className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
          style={{ background: filmTypeBadgeColor(submission.type) }}
        >
          {filmTypeLabel(submission.type)}
        </span>
      </div>

      {/* Title */}
      <div className="text-[14px] font-medium text-foreground leading-snug mb-0.5">
        {submission.title}
      </div>
      {submission.gameContext && (
        <div className="text-[11px] text-muted-foreground mb-1">{submission.gameContext}</div>
      )}

      {/* Duration + status */}
      <div className="flex items-center gap-2 mt-1.5">
        {statusDot()}
        {statusText()}
        <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatDuration(submission.duration)}
        </div>
      </div>

      {/* Skill tags */}
      {submission.skillTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {submission.skillTags.map((tag) => (
            <span
              key={tag}
              className="rounded-md px-1.5 py-0.5 text-[10px] capitalize"
              style={{ background: "oklch(0.55 0.02 260 / 0.10)", color: "oklch(0.55 0.02 260)" }}
            >
              {tag.replace("_", " ")}
            </span>
          ))}
        </div>
      )}

      {/* AI insight preview */}
      {topInsightPreview}

      {/* Hover arrow */}
      <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 3: Film Analysis View                                               */
/* -------------------------------------------------------------------------- */

function FilmAnalysisView({
  submission,
  onBack,
}: {
  submission: FilmSubmission;
  onBack: () => void;
}) {
  const [insightActions, setInsightActions] = useState<Record<string, InsightAction>>({});
  const [annotationText, setAnnotationText] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [annotations, setAnnotations] = useState<{ text: string; timestamp?: string; createdAt: string }[]>([]);
  const [reviewComplete, setReviewComplete] = useState(submission.reviewStatus === "coach_reviewed");
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // ── Structured analysis (new slice) ─────────────────────────────────────
  // Uses session_001 as mock session ID — in production, map submission.id → session ID
  const MOCK_SESSION_ID = "session_001";
  const { data: analysisClips = [], isLoading: clipsLoading } = useAnalysisClips(MOCK_SESSION_ID);
  const { data: analysisSummary } = useSessionAnalysisSummary(MOCK_SESSION_ID);
  const { mutate: reviewClip, isPending: reviewPending } = useCoachReviewClip(MOCK_SESSION_ID);
  // ────────────────────────────────────────────────────────────────────────

  const insights = submission.aiInsights ?? [];
  const avgConf = avgConfidence(insights);

  const categories = ["all", ...Array.from(new Set(insights.map((i) => i.category)))];

  const filteredInsights = activeCategory === "all"
    ? insights
    : insights.filter((i) => i.category === activeCategory);

  function handleInsightAction(insightId: string, action: "confirmed" | "dismissed" | "added_to_idp") {
    setInsightActions((prev) => ({ ...prev, [insightId]: action }));
    if (action === "confirmed") {
      toast.success("Insight confirmed and added to player record.");
    } else if (action === "dismissed") {
      toast("Insight dismissed.", { icon: "✕" });
    } else if (action === "added_to_idp") {
      toast.success("Concern added to player IDP as a development goal.");
    }
  }

  function addAnnotationFromTemplate(tmpl: AnnotationTemplate) {
    const a = { text: tmpl.defaultText, timestamp: timestamp || undefined, createdAt: new Date().toISOString() };
    setAnnotations((prev) => [...prev, a]);
    toast.success(`"${tmpl.label}" annotation added.`);
    setTimestamp("");
  }

  function submitAnnotation() {
    if (!annotationText.trim()) return;
    const a = { text: annotationText.trim(), timestamp: timestamp || undefined, createdAt: new Date().toISOString() };
    setAnnotations((prev) => [...prev, a]);
    setAnnotationText("");
    setTimestamp("");
    toast.success("Annotation saved.");
  }

  function completeReview() {
    setReviewComplete(true);
    toast.success(`Review complete — ${submission.playerName}'s film marked as reviewed.`, { duration: 4000 });
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          style={{ minHeight: 44 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Film Library
        </button>
      </div>

      {/* ── STRUCTURED ANALYSIS PANEL ─────────────────────────────────────── */}
      {/* This replaces free-form prose insights with bounded, evidence-backed clips */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-[14px] font-bold">Structured Analysis</span>
              <span className="text-[10.5px] font-mono text-muted-foreground uppercase tracking-[0.1em]">
                — observation · inference · evidence
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground mt-1">
              Each clip shows what was detected, how it was interpreted, and why.
              Approve, edit, or flag each one before it affects player records.
            </p>
          </div>
          {analysisSummary && (
            <div className="flex items-center gap-4 text-right shrink-0 pl-4">
              <div>
                <div className="text-[18px] font-bold">{analysisSummary.pendingReview}</div>
                <div className="text-[10px] text-muted-foreground">pending</div>
              </div>
              <div>
                <div className="text-[18px] font-bold" style={{ color: "oklch(0.78 0.16 75)" }}>
                  {analysisSummary.requiresAttention}
                </div>
                <div className="text-[10px] text-muted-foreground">needs attention</div>
              </div>
              <div>
                <div className="text-[18px] font-bold" style={{ color: "oklch(0.75 0.12 140)" }}>
                  {analysisSummary.confirmed}
                </div>
                <div className="text-[10px] text-muted-foreground">confirmed</div>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col gap-4">
          {clipsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            analysisClips.map((clip) => (
              <AnalysisClipCard
                key={clip.id}
                clip={clip}
                onReview={(clipId, status, note, editedType) =>
                  reviewClip({ clipId, status, note, editedEventType: editedType })
                }
                isPending={reviewPending}
              />
            ))
          )}
          <div className="text-center text-[11px] text-muted-foreground/50 pt-2 border-t border-border/40">
            Analysis scope: shot attempts · drives · turnovers · closeouts · on-ball defense · transition.
            Off-ball reads and weak-side scheme decisions are not classified by this pipeline.
          </div>
        </div>
      </div>
      {/* ── END STRUCTURED ANALYSIS PANEL ─────────────────────────────────── */}

      {/* Film info strip */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <PlayerInitials name={submission.playerName} size="lg" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[17px] font-bold text-foreground">{submission.playerName}</span>
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                  style={{ background: filmTypeBadgeColor(submission.type) }}
                >
                  {filmTypeLabel(submission.type)}
                </span>
              </div>
              <div className="text-[13px] font-medium text-foreground mt-0.5">{submission.title}</div>
              {submission.gameContext && (
                <div className="text-[12px] text-muted-foreground">{submission.gameContext}</div>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(submission.duration)}</span>
                <span>Submitted {formatDate(submission.submittedAt)}</span>
              </div>
            </div>
          </div>

          {reviewComplete && (
            <div
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium"
              style={{ background: `${SUCCESS}18`, color: SUCCESS, border: `1px solid ${SUCCESS}40` }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Review Complete
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis section */}
      {insights.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          {/* Section header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
                <span className="text-[15px] font-bold text-foreground">AI Analysis</span>
                <span
                  className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: `${PRIMARY}14`, color: PRIMARY }}
                >
                  {Math.round(avgConf * 100)}% avg confidence
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {insights.length} insights identified across {submission.skillTags.length} skill categories
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowTooltip((v) => !v)}
                className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {showTooltip && (
                <div
                  className="absolute right-0 top-9 z-20 w-64 rounded-xl p-3 text-[12px] leading-relaxed shadow-lg"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <strong className="text-foreground block mb-1">About AI Analysis</strong>
                  <span className="text-muted-foreground">
                    AI identifies patterns across multiple clips from this submission and similar sessions. Confidence reflects evidence strength. All insights require coach confirmation before appearing in player records.
                  </span>
                  <button
                    className="mt-2 text-[11px] font-semibold"
                    style={{ color: PRIMARY }}
                    onClick={() => setShowTooltip(false)}
                  >
                    Got it
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const active = activeCategory === cat;
              const color = cat === "all" ? PRIMARY : categoryColor(cat as AIInsight["category"]);
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-medium capitalize transition-all"
                  style={{
                    minHeight: 32,
                    background: active ? `${color}18` : "transparent",
                    color: active ? color : "oklch(0.55 0.02 260)",
                    border: active ? `1px solid ${color}40` : "1px solid transparent",
                  }}
                >
                  {cat === "all" ? "All" : categoryLabel(cat as AIInsight["category"])}
                  {cat !== "all" && (
                    <span className="ml-1 opacity-60">
                      {insights.filter((i) => i.category === cat).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Insight cards */}
          <div className="space-y-3">
            {filteredInsights.map((insight) => {
              const action = insightActions[insight.id] ?? null;
              const catColor = categoryColor(insight.category);
              const tColor = typeColor(insight.type);
              const isDone = action !== null;

              return (
                <div
                  key={insight.id}
                  className="rounded-lg p-4 transition-all"
                  style={{
                    background: isDone ? "oklch(0.55 0.02 260 / 0.04)" : "oklch(0.55 0.02 260 / 0.06)",
                    border: `1px solid ${isDone ? "oklch(0.55 0.02 260 / 0.15)" : `${catColor}30`}`,
                    opacity: action === "dismissed" ? 0.55 : 1,
                  }}
                >
                  <div className="flex items-start gap-3 flex-wrap">
                    {/* Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: `${catColor}18`, color: catColor }}
                      >
                        {categoryLabel(insight.category)}
                      </span>
                      <span
                        className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: `${tColor}18`, color: tColor }}
                      >
                        {typeLabel(insight.type)}
                      </span>
                      {insight.timestamp && (
                        <span className="text-[10px] text-muted-foreground font-mono">@ {insight.timestamp}</span>
                      )}
                    </div>

                    {/* Action status badge */}
                    {action === "confirmed" && (
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${SUCCESS}18`, color: SUCCESS }}>
                        ✓ Confirmed
                      </span>
                    )}
                    {action === "dismissed" && (
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: "oklch(0.55 0.02 260 / 0.12)", color: "oklch(0.55 0.02 260)" }}>
                        Dismissed
                      </span>
                    )}
                    {action === "added_to_idp" && (
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${PRIMARY}18`, color: PRIMARY }}>
                        Added to IDP
                      </span>
                    )}
                  </div>

                  {/* Title + description */}
                  <div className="mt-2 mb-2">
                    <div className="text-[13px] font-semibold text-foreground leading-snug">{insight.title}</div>
                    <div className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{insight.description}</div>
                  </div>

                  {/* Confidence + evidence */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground w-20 shrink-0">Confidence</span>
                      <div className="flex-1">
                        <ConfidenceBar value={insight.confidence} color={catColor} />
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Seen in <strong className="text-foreground">{insight.evidenceCount}</strong> clips
                    </div>
                  </div>

                  {/* Coach actions */}
                  {!isDone ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleInsightAction(insight.id, "confirmed")}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
                        style={{ minHeight: 36, background: `${SUCCESS}18`, color: SUCCESS, border: `1px solid ${SUCCESS}30` }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirm
                      </button>
                      <button
                        onClick={() => handleInsightAction(insight.id, "dismissed")}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
                        style={{ minHeight: 36, background: "oklch(0.55 0.02 260 / 0.08)", color: "oklch(0.55 0.02 260)", border: "1px solid oklch(0.55 0.02 260 / 0.2)" }}
                      >
                        <X className="w-3.5 h-3.5" />
                        Dismiss
                      </button>
                      {(insight.type === "concern" || insight.type === "pattern") && (
                        <button
                          onClick={() => handleInsightAction(insight.id, "added_to_idp")}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
                          style={{ minHeight: 36, background: `${PRIMARY}14`, color: PRIMARY, border: `1px solid ${PRIMARY}30` }}
                        >
                          <Target className="w-3.5 h-3.5" />
                          Add to IDP
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setInsightActions((prev) => ({ ...prev, [insight.id]: null }))}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Undo
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Coach Annotation section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="text-[15px] font-bold text-foreground">Coach Annotations</div>

        {/* Quick templates */}
        <div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">Quick Tap</div>
          <div className="flex flex-wrap gap-2">
            {ANNOTATION_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => addAnnotationFromTemplate(tmpl)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium border border-border hover:border-[oklch(0.72_0.18_290_/_0.4)] hover:bg-[oklch(0.72_0.18_290_/_0.06)] transition-all"
                style={{ minHeight: 44 }}
              >
                <span>{tmpl.emoji}</span>
                <span>{tmpl.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Timestamp + text */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="w-24 shrink-0">
              <label className="text-[11px] text-muted-foreground block mb-1">Timestamp</label>
              <input
                type="text"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                placeholder="e.g. :47"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.72_0.18_290_/_0.6)]"
                style={{ minHeight: 44 }}
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-muted-foreground block mb-1">Note</label>
              <textarea
                value={annotationText}
                onChange={(e) => setAnnotationText(e.target.value)}
                placeholder="Add a coaching note…"
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.72_0.18_290_/_0.6)] resize-none"
              />
            </div>
          </div>
          <button
            onClick={submitAnnotation}
            className="rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-all"
            style={{ minHeight: 44, background: PRIMARY, opacity: annotationText.trim() ? 1 : 0.5 }}
          >
            Add Annotation
          </button>
        </div>

        {/* Saved annotations */}
        {annotations.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Session Notes</div>
            {annotations.map((a, idx) => (
              <div key={idx} className="rounded-lg px-3 py-2 flex gap-2 items-start" style={{ background: "oklch(0.55 0.02 260 / 0.06)", border: "1px solid oklch(0.55 0.02 260 / 0.15)" }}>
                {a.timestamp && (
                  <span className="text-[11px] font-mono font-semibold shrink-0 mt-0.5" style={{ color: PRIMARY }}>
                    @{a.timestamp}
                  </span>
                )}
                <span className="text-[13px] text-foreground">{a.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Review */}
      {!reviewComplete && (
        <button
          onClick={completeReview}
          className="w-full rounded-xl py-3.5 text-[15px] font-bold text-white transition-all"
          style={{ minHeight: 52, background: PRIMARY }}
        >
          Complete Review
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 4: Insights Library                                                 */
/* -------------------------------------------------------------------------- */

type InsightSortKey = "newest" | "confidence" | "evidence";

function InsightsLibrary({ submissions }: { submissions: FilmSubmission[] }) {
  const [search, setSearch] = useState("");
  const [filterPlayer, setFilterPlayer] = useState("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortKey, setSortKey] = useState<InsightSortKey>("newest");

  // Flatten all insights across all submissions
  const allInsights = useMemo(() => {
    const flat: (AIInsight & { playerName: string; submittedAt: string; submissionTitle: string; usedInIdp: boolean })[] = [];
    submissions.forEach((s) => {
      if (s.aiInsights) {
        s.aiInsights.forEach((ins) => {
          flat.push({
            ...ins,
            playerName: s.playerName,
            submittedAt: s.submittedAt,
            submissionTitle: s.title,
            usedInIdp: ins.type === "concern" && ins.confidence > 0.85,
          });
        });
      }
    });
    return flat;
  }, [submissions]);

  const players = ["all", ...Array.from(new Set(allInsights.map((i) => i.playerName)))];
  const categories = ["all", "shooting", "defense", "ball_handling", "footwork", "iq_reads", "conditioning"];
  const types = ["all", "concern", "pattern", "strength", "improvement"];

  const filtered = useMemo(() => {
    let list = [...allInsights];
    if (filterPlayer !== "all") list = list.filter((i) => i.playerName === filterPlayer);
    if (filterCategory !== "all") list = list.filter((i) => i.category === filterCategory);
    if (filterType !== "all") list = list.filter((i) => i.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.playerName.toLowerCase().includes(q),
      );
    }
    switch (sortKey) {
      case "confidence": list.sort((a, b) => b.confidence - a.confidence); break;
      case "evidence":   list.sort((a, b) => b.evidenceCount - a.evidenceCount); break;
      case "newest":
      default:           list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()); break;
    }
    return list;
  }, [allInsights, filterPlayer, filterCategory, filterType, search, sortKey]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search insights…"
            className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.72_0.18_290_/_0.5)]"
            style={{ minHeight: 44 }}
          />
        </div>

        <select
          value={filterPlayer}
          onChange={(e) => setFilterPlayer(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground focus:outline-none"
          style={{ minHeight: 44 }}
        >
          {players.map((p) => (
            <option key={p} value={p}>{p === "all" ? "All players" : p}</option>
          ))}
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground focus:outline-none"
          style={{ minHeight: 44 }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === "all" ? "All skills" : categoryLabel(c as AIInsight["category"])}</option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground focus:outline-none"
          style={{ minHeight: 44 }}
        >
          {types.map((t) => (
            <option key={t} value={t}>{t === "all" ? "All types" : typeLabel(t as AIInsight["type"])}</option>
          ))}
        </select>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as InsightSortKey)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground focus:outline-none"
          style={{ minHeight: 44 }}
        >
          <option value="newest">Newest</option>
          <option value="confidence">Confidence</option>
          <option value="evidence">Most evidence</option>
        </select>
      </div>

      <div className="text-[12px] text-muted-foreground">{filtered.length} insight{filtered.length !== 1 ? "s" : ""}</div>

      {/* Insight list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-[14px] text-muted-foreground">
            No insights match your filters.
          </div>
        ) : (
          filtered.map((ins, idx) => {
            const catColor = categoryColor(ins.category);
            const tColor = typeColor(ins.type);
            return (
              <div key={`${ins.id}-${idx}`} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <PlayerInitials name={ins.playerName} size="sm" />
                      <span className="text-[13px] font-semibold text-foreground">{ins.playerName}</span>
                      <span className="text-[11px] text-muted-foreground">·</span>
                      <span className="text-[11px] text-muted-foreground">{formatDate(ins.submittedAt)}</span>
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase"
                        style={{ background: `${catColor}18`, color: catColor }}
                      >
                        {categoryLabel(ins.category)}
                      </span>
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase"
                        style={{ background: `${tColor}18`, color: tColor }}
                      >
                        {typeLabel(ins.type)}
                      </span>
                      {ins.usedInIdp && (
                        <span
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase"
                          style={{ background: `${PRIMARY}14`, color: PRIMARY }}
                        >
                          In IDP
                        </span>
                      )}
                    </div>
                    <div className="text-[13px] font-medium text-foreground">{ins.title}</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{ins.description}</div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="font-mono" style={{ color: catColor }}>{Math.round(ins.confidence * 100)}% confidence</span>
                      <span>·</span>
                      <span>{ins.evidenceCount} clips</span>
                      <span>·</span>
                      <span className="truncate">{ins.submissionTitle}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 5: AI Performance Summary                                           */
/* -------------------------------------------------------------------------- */

function AIPerformanceSummary() {
  const stats = [
    { label: "Confirmed by coaches", value: "73%", sub: "AI accuracy rate", color: SUCCESS, icon: CheckSquare },
    { label: "Dismissed insights",   value: "18%", sub: "Disagreement rate", color: WARNING, icon: X },
    { label: "Pending review",       value: "9%",  sub: "Awaiting decision", color: BLUE,    icon: Clock },
    { label: "Avg clips / submission",value: "8.3", sub: "Analysis depth",   color: PRIMARY, icon: Film },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
        <span className="text-[15px] font-bold text-foreground">AI Performance Summary</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg p-3" style={{ background: `${s.color}0C`, border: `1px solid ${s.color}20` }}>
            <div className="text-[22px] font-bold font-mono leading-none mb-0.5" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[12px] font-medium text-foreground">{s.label}</div>
            <div className="text-[11px] text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg p-3 space-y-2" style={{ background: "oklch(0.55 0.02 260 / 0.05)", border: "1px solid oklch(0.55 0.02 260 / 0.15)" }}>
        <div className="text-[12px] font-semibold text-foreground">Most flagged skill areas</div>
        {[
          { label: "Ball Handling", count: 34, pct: 0.87 },
          { label: "Defense",       count: 28, pct: 0.72 },
          { label: "Shooting",      count: 21, pct: 0.54 },
          { label: "Footwork",      count: 18, pct: 0.46 },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="w-24 text-[12px] text-muted-foreground shrink-0">{item.label}</div>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${item.pct * 100}%`, background: PRIMARY }} />
            </div>
            <div className="text-[11px] font-mono font-semibold text-muted-foreground w-8 text-right">{item.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main export                                                                 */
/* -------------------------------------------------------------------------- */

type HubTab = "library" | "insights" | "summary";

export default function AIFilmAnalysisHub() {
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("all");
  const [selectedFilm, setSelectedFilm] = useState<FilmSubmission | null>(null);
  const [activeTab, setActiveTab] = useState<HubTab>("library");

  const filteredSubmissions = useMemo(() => {
    switch (queueFilter) {
      case "pending":        return FILM_SUBMISSIONS.filter((s) => s.reviewStatus === "pending" || s.reviewStatus === "ai_processing");
      case "ai_complete":    return FILM_SUBMISSIONS.filter((s) => s.reviewStatus === "ai_complete");
      case "coach_reviewed": return FILM_SUBMISSIONS.filter((s) => s.reviewStatus === "coach_reviewed");
      default:               return FILM_SUBMISSIONS;
    }
  }, [queueFilter]);

  const tabs: { key: HubTab; label: string }[] = [
    { key: "library",  label: "Film Library" },
    { key: "insights", label: "Insights Archive" },
    { key: "summary",  label: "AI Summary" },
  ];

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <PageHeader
          eyebrow="AI Film Analysis"
          title="Film Analysis Hub"
          subtitle="AI-powered pattern detection across game film, practice, and skill reps. Confirm, dismiss, or escalate insights to player IDPs."
        />

        {/* Processing queue strip — always visible */}
        <ProcessingQueueStrip
          submissions={FILM_SUBMISSIONS}
          activeFilter={queueFilter}
          onFilterChange={(f) => {
            setQueueFilter(f);
            setSelectedFilm(null);
            setActiveTab("library");
          }}
        />

        {/* Film analysis view — full panel when film selected */}
        {selectedFilm ? (
          <FilmAnalysisView
            submission={selectedFilm}
            onBack={() => setSelectedFilm(null)}
          />
        ) : (
          <>
            {/* Tab nav */}
            <div className="flex gap-1 border-b border-border">
              {tabs.map((t) => {
                const active = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className="px-4 py-2.5 text-[13px] font-medium transition-all relative"
                    style={{
                      minHeight: 44,
                      color: active ? PRIMARY : "oklch(0.55 0.02 260)",
                    }}
                  >
                    {t.label}
                    {active && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                        style={{ background: PRIMARY }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            {activeTab === "library" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubmissions.map((sub) => (
                  <FilmCard
                    key={sub.id}
                    submission={sub}
                    onClick={() => {
                      setSelectedFilm(sub);
                    }}
                  />
                ))}
                {filteredSubmissions.length === 0 && (
                  <div className="col-span-full rounded-xl border border-border bg-card p-10 text-center text-[14px] text-muted-foreground">
                    No film submissions match this filter.
                  </div>
                )}
              </div>
            )}

            {activeTab === "insights" && (
              <InsightsLibrary submissions={FILM_SUBMISSIONS} />
            )}

            {activeTab === "summary" && (
              <div className="max-w-md">
                <AIPerformanceSummary />
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
