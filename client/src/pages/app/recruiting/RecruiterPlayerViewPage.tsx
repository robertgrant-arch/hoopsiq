/**
 * RecruiterPlayerViewPage — Detailed verified player profile as seen by a college coach.
 * Route: /app/recruiter/players/:id
 *
 * Modes:
 *   - Public access: tier, growth signal, badge count visible. Skills/film locked.
 *   - Full access: everything visible.
 */
import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  Clock,
  Film,
  Award,
  User,
  TrendingUp,
  Play,
  ChevronRight,
  BookmarkPlus,
  Tag,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";

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
  skillPercentiles: Record<string, number>;
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
  coachNarrative?: string;
  coachName: string;
  coachTitle: string;
  coachNarrativeDate: string;
  isAccessible: boolean;
  lastAssessedDate: string;
  idpOnTrack: boolean;
  filmSessionsReviewed: number;
  growthHistory: { label: string; avg: number }[];
  badges: {
    id: string;
    name: string;
    icon: "star" | "shield" | "target" | "zap" | "award";
    threshold: string;
    awardedBy: string;
    awardedDate: string;
    evidenceNote: string;
  }[];
  programDirectorName: string;
  programDirectorEmail: string;
};

type FilmClip = {
  id: string;
  playerId: string;
  title: string;
  coachAnnotation: string;
  skillTags: string[];
  eventType: "practice" | "game" | "tournament";
  eventDate: string;
  durationSeconds: number;
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
    skillScores: {
      ball_handling: 7.8,
      shooting: 8.4,
      finishing: 7.2,
      defense: 6.9,
      footwork: 7.5,
      iq_reads: 7.1,
      athleticism: 8.1,
      conditioning: 7.8,
    },
    skillDeltas: {
      ball_handling: 0.6,
      shooting: 1.2,
      finishing: 0.4,
      defense: 0.8,
      footwork: 0.9,
      iq_reads: 0.5,
      athleticism: 0.3,
      conditioning: 0.7,
    },
    skillPercentiles: {
      shooting: 88,
      athleticism: 82,
      ball_handling: 74,
      conditioning: 71,
    },
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
    coachNarrative:
      "Jordan has demonstrated exceptional development in his shooting mechanics over the past three cycles. His off-ball movement and catch-and-shoot preparation place him among the top shooting guards I've evaluated at this level. What separates Jordan from comparable prospects is his willingness to engage with film — he reviews sessions independently and consistently applies corrections in subsequent practices. His IDP focus area (off-dribble pull-up) has shown measurable improvement (+1.2 delta). He arrives early, stays late, and never needs to be reminded of his responsibilities. At the D1 level, his basketball IQ and coachability profile suggest he will develop further under high-level instruction. High-major programs should be evaluating him now.",
    coachName: "Coach Devon Reeves",
    coachTitle: "Head Coach, Elevation Basketball 17U Premier",
    coachNarrativeDate: "2026-04-15",
    isAccessible: true,
    lastAssessedDate: "2026-04-28",
    idpOnTrack: true,
    filmSessionsReviewed: 11,
    growthHistory: [
      { label: "Sep '25", avg: 6.4 },
      { label: "Nov '25", avg: 6.9 },
      { label: "Feb '26", avg: 7.4 },
      { label: "Apr '26", avg: 7.6 },
    ],
    badges: [
      {
        id: "b1",
        name: "Elite Shooter",
        icon: "star",
        threshold: "Shooting score ≥ 8.0 across 3+ assessments",
        awardedBy: "Coach Devon Reeves",
        awardedDate: "2026-03-10",
        evidenceNote: "Achieved 8.4, 8.2, and 8.1 across the last three cycles. Consistent form under game pressure.",
      },
      {
        id: "b2",
        name: "High Motor",
        icon: "zap",
        threshold: "Conditioning ≥ 7.5 + Attendance ≥ 90%",
        awardedBy: "Coach Devon Reeves",
        awardedDate: "2026-01-22",
        evidenceNote: "Never missed a voluntary session. Conditioning score has climbed to 7.8 with consistent effort.",
      },
      {
        id: "b3",
        name: "IDP Leader",
        icon: "target",
        threshold: "All IDP milestones completed on schedule",
        awardedBy: "Coach Devon Reeves",
        awardedDate: "2026-02-14",
        evidenceNote: "Completed all Q1 and Q2 IDP milestones ahead of schedule. Sets the standard for the team.",
      },
      {
        id: "b4",
        name: "Film Student",
        icon: "award",
        threshold: "10+ independent film review sessions",
        awardedBy: "Coach Devon Reeves",
        awardedDate: "2026-04-01",
        evidenceNote: "Logged 11 independent film sessions. Reviews tendencies of upcoming opponents proactively.",
      },
      {
        id: "b5",
        name: "Lockdown Potential",
        icon: "shield",
        threshold: "Defense delta ≥ 0.7 over two consecutive cycles",
        awardedBy: "Coach Devon Reeves",
        awardedDate: "2026-04-20",
        evidenceNote: "Defense improved from 6.1 to 6.9 over the past two cycles. Commitment to defensive positioning drills is evident.",
      },
    ],
    programDirectorName: "Marcus Reeves",
    programDirectorEmail: "director@elevationbball.org",
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
    skillScores: {
      ball_handling: 9.1,
      shooting: 8.2,
      finishing: 8.6,
      defense: 7.8,
      footwork: 8.9,
      iq_reads: 9.0,
      athleticism: 8.4,
      conditioning: 8.8,
    },
    skillDeltas: {
      ball_handling: 0.8,
      shooting: 0.5,
      finishing: 1.1,
      defense: 0.6,
      footwork: 0.7,
      iq_reads: 1.3,
      athleticism: 0.4,
      conditioning: 0.9,
    },
    skillPercentiles: {
      iq_reads: 97,
      ball_handling: 95,
      footwork: 92,
      conditioning: 91,
    },
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
    coachNarrative:
      "Marcus is the rarest kind of player: elite skill combined with elite coachability. His game IQ places him in the top percentile of every cohort I've tracked in 12 years of program coaching. He processes the floor in real time and makes decisions two possessions ahead. His finishing has improved most dramatically (+1.1) as we worked on contact layup packages this fall. He reviews his own film before I ask. He leads our IDP cohort discussions. He's earned every badge he holds. Any program recruiting at the major level should be scheduling in-person evaluation immediately.",
    coachName: "Coach Alicia Barnett",
    coachTitle: "Director of Player Development, Rise Elite",
    coachNarrativeDate: "2026-05-01",
    isAccessible: false,
    lastAssessedDate: "2026-05-02",
    idpOnTrack: true,
    filmSessionsReviewed: 18,
    growthHistory: [
      { label: "Jul '25", avg: 7.2 },
      { label: "Oct '25", avg: 7.8 },
      { label: "Jan '26", avg: 8.4 },
      { label: "May '26", avg: 8.7 },
    ],
    badges: [
      {
        id: "b1",
        name: "Elite Floor General",
        icon: "star",
        threshold: "IQ/Reads ≥ 9.0 + Ball Handling ≥ 9.0",
        awardedBy: "Coach Alicia Barnett",
        awardedDate: "2026-04-30",
        evidenceNote: "Both scores have remained above threshold for the past three assessment cycles.",
      },
      {
        id: "b2",
        name: "Film Student",
        icon: "award",
        threshold: "10+ independent film review sessions",
        awardedBy: "Coach Alicia Barnett",
        awardedDate: "2025-12-15",
        evidenceNote: "Logged 18 independent sessions over the past two seasons.",
      },
      {
        id: "b3",
        name: "IDP Leader",
        icon: "target",
        threshold: "All IDP milestones completed on schedule",
        awardedBy: "Coach Alicia Barnett",
        awardedDate: "2026-01-10",
        evidenceNote: "100% IDP milestone completion across all three active seasons.",
      },
      {
        id: "b4",
        name: "High Motor",
        icon: "zap",
        threshold: "Conditioning ≥ 7.5 + Attendance ≥ 90%",
        awardedBy: "Coach Alicia Barnett",
        awardedDate: "2025-09-20",
        evidenceNote: "Attendance rate of 98% over 14 months. Conditioning score: 8.8.",
      },
      {
        id: "b5",
        name: "Finishing Specialist",
        icon: "target",
        threshold: "Finishing delta ≥ 1.0 over two consecutive cycles",
        awardedBy: "Coach Alicia Barnett",
        awardedDate: "2026-03-05",
        evidenceNote: "+1.1 finishing delta driven by contact layup package development.",
      },
      {
        id: "b6",
        name: "Lockdown Potential",
        icon: "shield",
        threshold: "Defense delta ≥ 0.7 over two consecutive cycles",
        awardedBy: "Coach Alicia Barnett",
        awardedDate: "2026-02-20",
        evidenceNote: "Defense improved from 7.2 to 7.8. Consistent pick-and-roll coverage improvement.",
      },
      {
        id: "b7",
        name: "Program Leader",
        icon: "award",
        threshold: "Nominated by coaching staff — leadership off the court",
        awardedBy: "Coach Alicia Barnett",
        awardedDate: "2026-04-15",
        evidenceNote: "Leads IDP cohort discussions. Mentors younger players. Arrived 45 min early for every tournament this season.",
      },
    ],
    programDirectorName: "Thomas Barnett",
    programDirectorEmail: "director@riseelite.org",
  },
];

const MOCK_FILM_CLIPS: FilmClip[] = [
  {
    id: "fc1",
    playerId: "p1",
    title: "Off-dribble pull-up, left baseline",
    coachAnnotation: "Notice the shoulder turn on the catch — a mechanic we worked on specifically in Q1. The footwork is now automatic. This is the IDP skill in action.",
    skillTags: ["Shooting", "Footwork"],
    eventType: "tournament",
    eventDate: "2026-04-12",
    durationSeconds: 34,
  },
  {
    id: "fc2",
    playerId: "p1",
    title: "Help-side rotation, transition stop",
    coachAnnotation: "Reads the skip pass two beats early and closes out without fouling. This is the defensive awareness improvement in real game context.",
    skillTags: ["Defense", "IQ / Reads"],
    eventType: "game",
    eventDate: "2026-03-28",
    durationSeconds: 22,
  },
  {
    id: "fc3",
    playerId: "p1",
    title: "Catch-and-shoot, corner — game speed",
    coachAnnotation: "Zero hesitation. Feet set before the ball arrives. This is consistent across all six games we filmed this season.",
    skillTags: ["Shooting"],
    eventType: "game",
    eventDate: "2026-03-14",
    durationSeconds: 18,
  },
  {
    id: "fc4",
    playerId: "p1",
    title: "Full-court press break — IQ sequence",
    coachAnnotation: "He identifies the double-team formation and makes the correct skip before the trap closes. One of the clearest game IQ moments in our film library this year.",
    skillTags: ["Ball Handling", "IQ / Reads"],
    eventType: "tournament",
    eventDate: "2026-04-19",
    durationSeconds: 41,
  },
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

// Octagon skill chart — 8 axes in a fixed order
const SKILL_KEYS = [
  "shooting",
  "finishing",
  "athleticism",
  "conditioning",
  "defense",
  "footwork",
  "iq_reads",
  "ball_handling",
];

function tierColor(tier: VerifiedPlayer["overallTier"]): string {
  switch (tier) {
    case "Elite":      return PRIMARY;
    case "Advanced":   return SUCCESS;
    case "Developing": return WARNING;
    case "Emerging":   return MUTED;
  }
}

function tierLabel(tier: VerifiedPlayer["overallTier"]): string {
  switch (tier) {
    case "Elite":      return "Elite Athlete";
    case "Advanced":   return "Advanced Athlete";
    case "Developing": return "Developing Athlete";
    case "Emerging":   return "Emerging Athlete";
  }
}

function teamTierColor(tier: VerifiedPlayer["teamTier"]): string {
  switch (tier) {
    case "Premier": return PRIMARY;
    case "Gold":    return WARNING;
    case "Silver":  return MUTED;
  }
}

function growthRateLabel(rate: VerifiedPlayer["growthRate"]): string {
  switch (rate) {
    case "top_10": return "Top 10%";
    case "top_25": return "Top 25%";
    case "average": return "Average";
  }
}

function growthColor(rate: VerifiedPlayer["growthRate"]): string {
  switch (rate) {
    case "top_10": return SUCCESS;
    case "top_25": return WARNING;
    case "average": return MUTED;
  }
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------- */
/* Octagon radar chart (SVG)                                                   */
/* -------------------------------------------------------------------------- */

function OctagonChart({ scores }: { scores: Record<string, number> }) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 90;
  const n = SKILL_KEYS.length;

  function polarToXY(r: number, i: number) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  const gridLevels = [2, 4, 6, 8, 10];

  const dataPoints = SKILL_KEYS.map((key, i) => {
    const score = scores[key] ?? 0;
    const r = (score / 10) * maxR;
    return polarToXY(r, i);
  });

  const dataPath = dataPoints
    .map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
    .join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* Grid */}
      {gridLevels.map((level) => {
        const r = (level / 10) * maxR;
        const pts = SKILL_KEYS.map((_, i) => polarToXY(r, i));
        const path = pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ") + " Z";
        return (
          <path
            key={level}
            d={path}
            fill="none"
            stroke="oklch(0.28 0.01 260)"
            strokeWidth="0.75"
          />
        );
      })}

      {/* Axes */}
      {SKILL_KEYS.map((_, i) => {
        const outer = polarToXY(maxR, i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={outer.x.toFixed(1)}
            y2={outer.y.toFixed(1)}
            stroke="oklch(0.28 0.01 260)"
            strokeWidth="0.75"
          />
        );
      })}

      {/* Data polygon */}
      <path d={dataPath} fill={`${PRIMARY}4D`} stroke={PRIMARY} strokeWidth="2" />

      {/* Data point dots */}
      {dataPoints.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="3" fill={PRIMARY} />
      ))}

      {/* Labels */}
      {SKILL_KEYS.map((key, i) => {
        const outer = polarToXY(maxR + 18, i);
        return (
          <text
            key={key}
            x={outer.x.toFixed(1)}
            y={outer.y.toFixed(1)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fill={MUTED}
          >
            {SKILL_LABELS[key]?.split(" ")[0] ?? key}
          </text>
        );
      })}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Growth trajectory line chart (SVG)                                         */
/* -------------------------------------------------------------------------- */

function GrowthChart({ data }: { data: { label: string; avg: number }[] }) {
  const w = 400;
  const h = 120;
  const padL = 32;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const minVal = Math.min(...data.map((d) => d.avg)) - 0.5;
  const maxVal = Math.max(...data.map((d) => d.avg)) + 0.5;

  function xPos(i: number) {
    return padL + (i / (data.length - 1)) * chartW;
  }

  function yPos(v: number) {
    return padT + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;
  }

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(d.avg).toFixed(1)}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L${xPos(data.length - 1).toFixed(1)},${(padT + chartH).toFixed(1)}` +
    ` L${xPos(0).toFixed(1)},${(padT + chartH).toFixed(1)} Z`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w} ${h}`}
      style={{ maxWidth: w }}
      aria-hidden="true"
    >
      {/* Y axis ticks */}
      {[minVal + 0.5, (minVal + maxVal) / 2, maxVal - 0.5].map((v, i) => {
        const y = yPos(v);
        return (
          <g key={i}>
            <line
              x1={padL}
              y1={y.toFixed(1)}
              x2={w - padR}
              y2={y.toFixed(1)}
              stroke="oklch(0.25 0.01 260)"
              strokeWidth="0.75"
              strokeDasharray="3,3"
            />
            <text
              x={(padL - 4).toFixed(1)}
              y={y.toFixed(1)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="8"
              fill={MUTED}
            >
              {v.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill={`${PRIMARY}22`} />

      {/* Line */}
      <path d={linePath} fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinejoin="round" />

      {/* Data points + labels */}
      {data.map((d, i) => {
        const x = xPos(i);
        const y = yPos(d.avg);
        return (
          <g key={i}>
            <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="4" fill={PRIMARY} />
            <text
              x={x.toFixed(1)}
              y={(y - 9).toFixed(1)}
              textAnchor="middle"
              fontSize="8.5"
              fontWeight="600"
              fill={PRIMARY}
            >
              {d.avg.toFixed(1)}
            </text>
            <text
              x={x.toFixed(1)}
              y={(padT + chartH + 14).toFixed(1)}
              textAnchor="middle"
              fontSize="8"
              fill={MUTED}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Badge icon (SVG)                                                            */
/* -------------------------------------------------------------------------- */

function BadgeIcon({ type }: { type: VerifiedPlayer["badges"][number]["icon"] }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      {type === "star" && (
        <polygon
          points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
          fill={`${WARNING}44`}
          stroke={WARNING}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      )}
      {type === "shield" && (
        <path
          d="M12 2L3 7v6c0 5 3.9 9.5 9 11 5.1-1.5 9-6 9-11V7L12 2z"
          fill={`${PRIMARY}44`}
          stroke={PRIMARY}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      )}
      {type === "target" && (
        <>
          <circle cx="12" cy="12" r="9" fill={`${SUCCESS}22`} stroke={SUCCESS} strokeWidth="1.5" />
          <circle cx="12" cy="12" r="5" fill="none" stroke={SUCCESS} strokeWidth="1.5" />
          <circle cx="12" cy="12" r="2" fill={SUCCESS} />
        </>
      )}
      {type === "zap" && (
        <polygon
          points="13,2 3,14 12,14 11,22 21,10 12,10"
          fill={`${WARNING}44`}
          stroke={WARNING}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      )}
      {type === "award" && (
        <>
          <circle cx="12" cy="8" r="6" fill={`${SUCCESS}33`} stroke={SUCCESS} strokeWidth="1.5" />
          <path
            d="M8.21 13.89L7 22l5-3 5 3-1.21-8.12"
            fill="none"
            stroke={SUCCESS}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Locked overlay                                                              */
/* -------------------------------------------------------------------------- */

function LockedSection({ message, onRequest }: { message: string; onRequest: () => void }) {
  return (
    <div
      className="relative rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Blur placeholder */}
      <div className="h-32 flex items-center justify-center" style={{ background: "oklch(0.16 0.01 260)" }}>
        {[40, 60, 75, 55, 80].map((w, i) => (
          <div
            key={i}
            className="mx-1 rounded"
            style={{ width: w, height: 8, background: "oklch(0.24 0.01 260)" }}
          />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4" style={{ color: MUTED }} />
          <span className="text-[12px]" style={{ color: MUTED }}>{message}</span>
        </div>
        <button
          onClick={onRequest}
          className="text-[12px] font-semibold px-4 py-2 rounded-lg transition-colors"
          style={{ background: PRIMARY, color: "white" }}
        >
          Request Full Access
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function RecruiterPlayerViewPage() {
  const { id } = useParams<{ id: string }>();
  const player = MOCK_PLAYERS.find((p) => p.id === id);

  const [accessRequest, setAccessRequest] = useState<AccessRequest | undefined>(
    MOCK_ACCESS_REQUESTS.find((r) => r.playerId === id)
  );
  const [boardStatus, setBoardStatus] = useState<RecruiterBoard["status"] | null>(
    id === "p1" || id === "p2" ? "priority" : null
  );
  const [boardNotes, setBoardNotes] = useState("");

  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [requestLevel, setRequestLevel] = useState<AccessRequest["accessLevel"]>("full_profile");
  const [requestMessage, setRequestMessage] = useState("");

  if (!player) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-[16px]" style={{ color: MUTED }}>Player profile not found.</p>
          <Link href="/app/recruiter/search" asChild>
            <a className="inline-flex items-center gap-2 mt-4 text-[13px] font-semibold" style={{ color: PRIMARY }}>
              <ArrowLeft className="w-4 h-4" />
              Back to search
            </a>
          </Link>
        </div>
      </AppShell>
    );
  }

  // Re-bind after guard so TypeScript narrows the type inside handler closures
  const p = player;
  const hasAccess = p.isAccessible;
  const isPending = accessRequest?.status === "pending";
  const filmClips = MOCK_FILM_CLIPS.filter((c) => c.playerId === id);

  function handleRequestAccess() {
    if (!requestMessage.trim()) {
      toast.error("Please include a message with your request.");
      return;
    }
    const newRequest: AccessRequest = {
      id: `ar_${Date.now()}`,
      playerId: p.id,
      playerName: p.name,
      status: "pending",
      requestedAt: new Date().toISOString().split("T")[0],
      accessLevel: requestLevel,
      requestMessage,
    };
    setAccessRequest(newRequest);
    setRequestFormOpen(false);
    setRequestMessage("");
    toast.success("Access request sent. The family will be notified within 24 hours.");
  }

  function handleSaveToBoard() {
    if (!boardStatus) {
      setBoardStatus("watching");
      toast.success(`${p.name} added to your board as Watching.`);
    } else {
      toast.info("Already on your board — update the status below.");
    }
  }

  function handleBoardStatusChange(status: RecruiterBoard["status"]) {
    setBoardStatus(status);
    toast.success(`Status updated to ${status.replace("_", " ")}`);
  }

  function handleContactProgram() {
    toast.info(`Contact ${p.programDirectorName} at ${p.programDirectorEmail}`);
  }

  function handleFilmRequest(clipTitle: string) {
    toast.success(`Contact program to arrange film access for: "${clipTitle}"`);
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back nav */}
        <Link href="/app/recruiter/search" asChild>
          <a className="inline-flex items-center gap-2 text-[12px] mb-6" style={{ color: MUTED }}>
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </a>
        </Link>

        {/* Access status banner */}
        {hasAccess && (
          <div
            className="rounded-xl px-4 py-3 mb-6 flex items-center gap-2 text-[12px]"
            style={{ background: `${SUCCESS}18`, border: `1px solid ${SUCCESS}40` }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: SUCCESS }} />
            <span style={{ color: SUCCESS }}>
              Full profile access granted · Expires 2026-11-10
            </span>
          </div>
        )}
        {isPending && !hasAccess && (
          <div
            className="rounded-xl px-4 py-3 mb-6 flex items-center gap-2 text-[12px]"
            style={{ background: `${WARNING}18`, border: `1px solid ${WARNING}40` }}
          >
            <Clock className="w-4 h-4 shrink-0" style={{ color: WARNING }} />
            <span style={{ color: WARNING }}>
              Access request pending — family will be notified within 24 hours
            </span>
          </div>
        )}
        {!hasAccess && !isPending && !accessRequest && (
          <div
            className="rounded-xl px-4 py-3 mb-6 flex items-center justify-between gap-3 text-[12px] flex-wrap"
            style={{ background: `${PRIMARY}12`, border: `1px solid ${PRIMARY}40` }}
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
              <span style={{ color: PRIMARY }}>
                Viewing public profile — request full access to see assessments, film, and observations
              </span>
            </div>
            <button
              onClick={() => setRequestFormOpen(true)}
              className="text-[12px] font-semibold px-3.5 py-1.5 rounded-lg shrink-0 transition-colors"
              style={{ background: PRIMARY, color: "white" }}
            >
              Request Full Access
            </button>
          </div>
        )}

        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* Hero section */}
            <div
              className="rounded-xl border p-6"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-start gap-5 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h1 className="text-[32px] font-black leading-none tracking-tight" style={{ color: "var(--text-primary)" }}>
                    {player.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span
                      className="text-[12px] font-bold px-2 py-1 rounded"
                      style={{ background: `${PRIMARY}22`, color: PRIMARY }}
                    >
                      {player.position}
                    </span>
                    <span
                      className="text-[12px] font-semibold px-2 py-1 rounded border"
                      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                    >
                      Class of {player.gradYear}
                    </span>
                    <span className="text-[12px]" style={{ color: MUTED }}>{player.height}</span>
                    {player.wingspan && (
                      <span className="text-[12px]" style={{ color: MUTED }}>Wingspan {player.wingspan}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      {player.programName}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: `${teamTierColor(player.teamTier)}22`, color: teamTierColor(player.teamTier) }}
                    >
                      {player.teamTier}
                    </span>
                    <span className="text-[11px]" style={{ color: MUTED }}>{player.division}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div
                    className="px-5 py-3 rounded-xl text-center"
                    style={{
                      background: `${tierColor(player.overallTier)}22`,
                      border: `1.5px solid ${tierColor(player.overallTier)}50`,
                    }}
                  >
                    <div
                      className="text-[18px] font-black uppercase tracking-wide"
                      style={{ color: tierColor(player.overallTier) }}
                    >
                      {tierLabel(player.overallTier)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: MUTED }}>
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: SUCCESS }} />
                    HoopsIQ Verified
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Skills Profile */}
            <section>
              <h2 className="text-[17px] font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                Skills Profile
              </h2>
              {hasAccess ? (
                <div
                  className="rounded-xl border p-6"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* Radar chart */}
                    <div className="flex justify-center">
                      <OctagonChart scores={player.skillScores} />
                    </div>

                    {/* Skill table */}
                    <div className="flex-1 min-w-0">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border)" }}>
                            <th className="text-left pb-2 font-semibold" style={{ color: MUTED }}>Skill</th>
                            <th className="text-right pb-2 font-semibold" style={{ color: MUTED }}>Score</th>
                            <th className="text-right pb-2 font-semibold" style={{ color: MUTED }}>Delta</th>
                            <th className="text-right pb-2 font-semibold" style={{ color: MUTED }}>Pct</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(player.skillScores)
                            .sort(([, a], [, b]) => b - a)
                            .map(([key, score]) => {
                              const delta = player.skillDeltas[key] ?? 0;
                              const pct = player.skillPercentiles[key];
                              return (
                                <tr
                                  key={key}
                                  style={{ borderBottom: "1px solid var(--border)" }}
                                >
                                  <td className="py-2 font-medium" style={{ color: "var(--text-primary)" }}>
                                    {SKILL_LABELS[key] ?? key}
                                  </td>
                                  <td className="py-2 text-right font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                                    {score.toFixed(1)}
                                  </td>
                                  <td className="py-2 text-right tabular-nums font-semibold"
                                    style={{ color: delta > 0 ? SUCCESS : delta < 0 ? DANGER : MUTED }}>
                                    {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                                  </td>
                                  <td className="py-2 text-right tabular-nums" style={{ color: pct ? PRIMARY : MUTED }}>
                                    {pct ? `${pct}th` : "—"}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>

                      <p className="text-[11px] mt-3" style={{ color: MUTED }}>
                        Last assessed: {player.lastAssessedDate} · {player.assessmentCount} total assessments
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <LockedSection
                  message="Skill scores and deltas require full access"
                  onRequest={() => setRequestFormOpen(true)}
                />
              )}
            </section>

            {/* Section 2: Growth Trajectory */}
            <section>
              <h2 className="text-[17px] font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                Growth Trajectory
              </h2>
              <div
                className="rounded-xl border p-6"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
              >
                {hasAccess ? (
                  <>
                    <div className="overflow-x-auto">
                      <GrowthChart data={player.growthHistory} />
                    </div>
                    <p className="text-[12px] mt-3 font-medium" style={{ color: growthColor(player.growthRate) }}>
                      Growth rate: {growthRateLabel(player.growthRate)} of {player.gradYear}{" "}
                      {player.position}s in comparable programs
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: MUTED }}>
                      Top improvement: {SKILL_LABELS[player.topGrowthSkill] ?? player.topGrowthSkill} +{player.topGrowthDelta.toFixed(1)} over last 2 cycles
                    </p>
                  </>
                ) : (
                  <>
                    {/* Public: show growth rate only */}
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5" style={{ color: growthColor(player.growthRate) }} />
                      <div>
                        <div className="text-[14px] font-bold" style={{ color: growthColor(player.growthRate) }}>
                          {growthRateLabel(player.growthRate)} growth
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                          Trajectory detail available with full access
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Section 3: Coachability Indicators */}
            <section>
              <h2 className="text-[17px] font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                Coachability Indicators
              </h2>
              {hasAccess ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Attendance",
                      value: `${player.attendanceRate}%`,
                      sub: "over 14 months",
                      color: player.attendanceRate >= 90 ? SUCCESS : player.attendanceRate >= 80 ? WARNING : DANGER,
                    },
                    {
                      label: "IDP Status",
                      value: player.idpOnTrack ? "On Track" : "Behind",
                      sub: "current plan",
                      color: player.idpOnTrack ? SUCCESS : DANGER,
                    },
                    {
                      label: "Film Reviews",
                      value: String(player.filmSessionsReviewed),
                      sub: "sessions reviewed",
                      color: player.filmSessionsReviewed >= 10 ? SUCCESS : WARNING,
                    },
                    {
                      label: "Assessments",
                      value: String(player.assessmentCount),
                      sub: "cycles completed",
                      color: PRIMARY,
                    },
                  ].map(({ label, value, sub, color }) => (
                    <div
                      key={label}
                      className="rounded-xl border p-4 text-center"
                      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                    >
                      <div className="text-[22px] font-black tabular-nums" style={{ color }}>
                        {value}
                      </div>
                      <div className="text-[11px] font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>
                        {label}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: MUTED }}>{sub}</div>
                    </div>
                  ))}
                  {/* Coachability index */}
                  <div
                    className="col-span-2 md:col-span-4 rounded-xl border p-4 flex items-center justify-between"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                  >
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
                        Coachability Index
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                        Composite of attendance, IDP completion, film engagement, and coach evaluations
                      </div>
                    </div>
                    <div className="text-center shrink-0">
                      <div className="text-[32px] font-black tabular-nums" style={{ color: PRIMARY }}>
                        {player.coachabilityIndex.toFixed(1)}
                      </div>
                      <div className="text-[10px]" style={{ color: MUTED }}>/10 · Top 8% of cohort</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-xl border p-5 text-center"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <Lock className="w-5 h-5 mx-auto mb-2" style={{ color: MUTED }} />
                  <p className="text-[12px] font-semibold" style={{ color: MUTED }}>Requires full access</p>
                  <p className="text-[11px] mt-1" style={{ color: MUTED }}>
                    Coachability indicators are only available after access is granted.
                  </p>
                </div>
              )}
            </section>

            {/* Section 4: Verified Badges */}
            <section>
              <h2 className="text-[17px] font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                Verified Badges
                <span
                  className="text-[12px] font-semibold ml-2 px-2 py-0.5 rounded"
                  style={{ background: `${SUCCESS}22`, color: SUCCESS }}
                >
                  {player.badgeCount} earned
                </span>
              </h2>
              {hasAccess ? (
                <div className="space-y-3">
                  {player.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="rounded-xl border p-4 flex items-start gap-4"
                      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                    >
                      <div className="shrink-0 mt-0.5">
                        <BadgeIcon type={badge.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
                            {badge.name}
                          </span>
                          <span className="text-[10px]" style={{ color: MUTED }}>{badge.awardedDate}</span>
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                          Threshold: {badge.threshold}
                        </div>
                        <div className="text-[11px] mt-1.5 italic" style={{ color: "var(--text-muted)" }}>
                          "{badge.evidenceNote}"
                        </div>
                        <div className="text-[10px] mt-1" style={{ color: MUTED }}>
                          Awarded by {badge.awardedBy}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Public: show badge icons + names only */
                <div
                  className="rounded-xl border p-5"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    {player.badges.map((badge) => (
                      <div key={badge.id} className="flex flex-col items-center gap-1.5">
                        <BadgeIcon type={badge.icon} />
                        <span className="text-[10px] text-center font-medium" style={{ color: MUTED }}>
                          {badge.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] mt-4" style={{ color: MUTED }}>
                    Badge thresholds, evidence notes, and awarding coach details are available with full access.
                  </p>
                </div>
              )}
            </section>

            {/* Section 5: Coach Narrative */}
            <section>
              <h2 className="text-[17px] font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                Coach Narrative
              </h2>
              {hasAccess && player.coachNarrative ? (
                <div
                  className="rounded-xl border p-6"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
                    {player.coachNarrative}
                  </p>
                  <div className="mt-4 pt-4 border-t text-[11px]" style={{ borderColor: "var(--border)", color: MUTED }}>
                    <span className="font-semibold">{player.coachName}</span>
                    {" · "}{player.coachTitle}
                    {" · "}{player.coachNarrativeDate}
                  </div>
                </div>
              ) : hasAccess ? (
                <div
                  className="rounded-xl border p-5"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <p className="text-[12px]" style={{ color: MUTED }}>No coach narrative on file for this athlete.</p>
                </div>
              ) : (
                <div
                  className="rounded-xl border p-5"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" style={{ color: MUTED }} />
                    <p className="text-[12px]" style={{ color: MUTED }}>
                      Coach narrative available with full access
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Section 6: Film Package */}
            <section>
              <h2 className="text-[17px] font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                Film Package
                {hasAccess && (
                  <span className="text-[12px] font-normal ml-2" style={{ color: MUTED }}>
                    Curated by coach — {filmClips.length} clips
                  </span>
                )}
              </h2>
              {hasAccess ? (
                filmClips.length > 0 ? (
                  <div className="space-y-3">
                    {filmClips.map((clip) => (
                      <div
                        key={clip.id}
                        className="rounded-xl border p-4 flex gap-4"
                        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                      >
                        {/* Thumbnail placeholder */}
                        <div
                          className="w-20 h-14 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${PRIMARY}22` }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                            <polygon
                              points="5,3 19,12 5,21"
                              fill={PRIMARY}
                            />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                            {clip.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px]" style={{ color: MUTED }}>
                            <span className="capitalize">{clip.eventType}</span>
                            <span>·</span>
                            <span>{clip.eventDate}</span>
                            <span>·</span>
                            <span>{formatDuration(clip.durationSeconds)}</span>
                          </div>
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            {clip.skillTags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                                style={{ background: `${PRIMARY}22`, color: PRIMARY }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] mt-2 italic" style={{ color: "var(--text-muted)" }}>
                            "{clip.coachAnnotation}"
                          </p>
                        </div>

                        <button
                          onClick={() => handleFilmRequest(clip.title)}
                          className="shrink-0 self-center text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                          style={{ borderColor: `${PRIMARY}50`, color: PRIMARY }}
                        >
                          Request to view
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="rounded-xl border p-5"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                  >
                    <p className="text-[12px]" style={{ color: MUTED }}>No film package curated yet.</p>
                  </div>
                )
              ) : (
                <div
                  className="rounded-xl border p-5"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" style={{ color: MUTED }} />
                    <p className="text-[12px]" style={{ color: MUTED }}>
                      Film package available with full access only
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Section 8: Request access form */}
            {!hasAccess && !isPending && requestFormOpen && (
              <section>
                <h2 className="text-[17px] font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                  Request Full Access
                </h2>
                <div
                  className="rounded-xl border p-6 space-y-4"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div>
                    <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                      Access level
                    </label>
                    <select
                      value={requestLevel}
                      onChange={(e) => setRequestLevel(e.target.value as AccessRequest["accessLevel"])}
                      className="w-full text-[13px] border rounded-lg px-3 py-2.5 bg-transparent"
                      style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                    >
                      <option value="profile_only">Profile only</option>
                      <option value="full_profile">Full profile</option>
                      <option value="includes_film">Full profile + film package</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                      Message to family
                    </label>
                    <textarea
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Introduce yourself and explain your interest in evaluating this athlete..."
                      rows={4}
                      className="w-full text-[13px] border rounded-lg px-3 py-2.5 bg-transparent resize-none"
                      style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRequestAccess}
                      className="text-[13px] font-semibold px-5 py-2.5 rounded-lg transition-colors"
                      style={{ background: PRIMARY, color: "white" }}
                    >
                      Send Request
                    </button>
                    <button
                      onClick={() => setRequestFormOpen(false)}
                      className="text-[13px] font-medium px-4 py-2.5 rounded-lg border transition-colors"
                      style={{ borderColor: "var(--border)", color: MUTED }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right sidebar / bottom section: Board + Notes + Contact */}
          <aside className="w-full lg:w-72 shrink-0 space-y-4">
            {/* Add to board */}
            <div
              className="rounded-xl border p-5 space-y-3"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <div className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
                My Board
              </div>
              {boardStatus ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: PRIMARY }} />
                    <span className="text-[12px] font-semibold capitalize" style={{ color: PRIMARY }}>
                      {boardStatus.replace("_", " ")}
                    </span>
                  </div>
                  <select
                    value={boardStatus}
                    onChange={(e) => handleBoardStatusChange(e.target.value as RecruiterBoard["status"])}
                    className="w-full text-[12px] border rounded-lg px-3 py-2 bg-transparent"
                    style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                  >
                    <option value="priority">Priority</option>
                    <option value="interested">Interested</option>
                    <option value="watching">Watching</option>
                    <option value="not_a_fit">Not a fit</option>
                  </select>
                </>
              ) : (
                <button
                  onClick={handleSaveToBoard}
                  className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold py-2.5 rounded-lg border transition-colors"
                  style={{ borderColor: `${PRIMARY}50`, color: PRIMARY }}
                >
                  <BookmarkPlus className="w-4 h-4" />
                  Add to Board
                </button>
              )}
            </div>

            {/* Private notes */}
            <div
              className="rounded-xl border p-5 space-y-3"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <div className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
                Private Notes
              </div>
              <p className="text-[10px]" style={{ color: MUTED }}>Never shared with the player, family, or program.</p>
              <textarea
                value={boardNotes}
                onChange={(e) => setBoardNotes(e.target.value)}
                placeholder="Add private recruiting notes..."
                rows={5}
                className="w-full text-[12px] border rounded-lg px-3 py-2.5 bg-transparent resize-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
              <button
                onClick={() => toast.success("Notes saved locally.")}
                className="w-full text-[12px] font-semibold py-2 rounded-lg transition-colors"
                style={{ background: `${PRIMARY}22`, color: PRIMARY }}
              >
                Save Notes
              </button>
            </div>

            {/* Contact program */}
            {hasAccess && (
              <div
                className="rounded-xl border p-5 space-y-3"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
              >
                <div className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
                  Contact Program
                </div>
                <div>
                  <div className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                    {player.programDirectorName}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: MUTED }}>Program Director</div>
                  <div className="text-[11px] mt-0.5" style={{ color: PRIMARY }}>{player.programDirectorEmail}</div>
                </div>
                <button
                  onClick={handleContactProgram}
                  className="w-full flex items-center justify-center gap-2 text-[12px] font-semibold py-2 rounded-lg border transition-colors"
                  style={{ borderColor: `${PRIMARY}50`, color: PRIMARY }}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Contact Director
                </button>
              </div>
            )}

            {/* Request access if no access and not already shown inline */}
            {!hasAccess && !isPending && !requestFormOpen && (
              <div
                className="rounded-xl border p-5 space-y-3"
                style={{ background: `${PRIMARY}0D`, borderColor: `${PRIMARY}40` }}
              >
                <div className="text-[13px] font-bold" style={{ color: PRIMARY }}>
                  Request Full Access
                </div>
                <p className="text-[11px]" style={{ color: MUTED }}>
                  See all skill scores, growth trajectory, coachability data, film package, and coach narrative.
                </p>
                <button
                  onClick={() => setRequestFormOpen(true)}
                  className="w-full text-[13px] font-semibold py-2.5 rounded-lg transition-colors"
                  style={{ background: PRIMARY, color: "white" }}
                >
                  Request Access
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
