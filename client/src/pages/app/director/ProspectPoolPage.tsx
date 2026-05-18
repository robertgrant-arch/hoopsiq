/**
 * ProspectPoolPage — Director's full recruiting prospect pool view.
 * Route: /app/director/prospects
 *
 * Sections:
 *   1. Summary stat strip (4 cards)
 *   2. Filter bar (position, grad year, tier, sort, gaps toggle)
 *   3. Prospect table (desktop) / cards (mobile)
 *   4. Profile gaps expandable section
 *   5. Quick stats panel (SVG donut, position breakdown, averages)
 */
import { useState, useMemo } from "react";
import {
  Download,
  Eye,
  FileText,
  Film,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  TrendingUp,
  Minus,
  AlertCircle,
  CheckCircle2,
  Users,
  Link as LinkIcon,
} from "lucide-react";
import { Link } from "wouter";
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

type ProspectPlayer = {
  id: string;
  name: string;
  position: string;
  gradYear: number;
  height: string;
  teamTier: "Premier" | "Gold" | "Silver";
  overallTier: "Emerging" | "Developing" | "Advanced" | "Elite";
  topSkill: string;
  topSkillScore: number;
  topSkillDelta: number;
  coachabilityIndex: number;
  attendanceRate: number;
  badgeCount: number;
  assessmentCount: number;
  filmClipCount: number;
  profileComplete: boolean;
  hasApprovedExport: boolean;
  recruiterViewCount: number;
  pendingAccessRequests: number;
  profileSlug: string;
  isPublic: boolean;
};

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const PROSPECTS: ProspectPlayer[] = [
  {
    id: "p1",
    name: "Malik Henderson",
    position: "PG",
    gradYear: 2027,
    height: "6'1\"",
    teamTier: "Premier",
    overallTier: "Elite",
    topSkill: "Ball Handling",
    topSkillScore: 91,
    topSkillDelta: 4,
    coachabilityIndex: 94,
    attendanceRate: 97,
    badgeCount: 8,
    assessmentCount: 6,
    filmClipCount: 12,
    profileComplete: true,
    hasApprovedExport: true,
    recruiterViewCount: 47,
    pendingAccessRequests: 3,
    profileSlug: "malik-henderson",
    isPublic: true,
  },
  {
    id: "p2",
    name: "Jaylen Scott",
    position: "SG",
    gradYear: 2027,
    height: "6'3\"",
    teamTier: "Premier",
    overallTier: "Advanced",
    topSkill: "Shooting",
    topSkillScore: 87,
    topSkillDelta: 6,
    coachabilityIndex: 88,
    attendanceRate: 92,
    badgeCount: 6,
    assessmentCount: 5,
    filmClipCount: 9,
    profileComplete: true,
    hasApprovedExport: true,
    recruiterViewCount: 31,
    pendingAccessRequests: 2,
    profileSlug: "jaylen-scott",
    isPublic: true,
  },
  {
    id: "p3",
    name: "Noah Rivera",
    position: "SF",
    gradYear: 2027,
    height: "6'5\"",
    teamTier: "Premier",
    overallTier: "Advanced",
    topSkill: "Defense",
    topSkillScore: 83,
    topSkillDelta: 3,
    coachabilityIndex: 79,
    attendanceRate: 88,
    badgeCount: 5,
    assessmentCount: 4,
    filmClipCount: 6,
    profileComplete: false,
    hasApprovedExport: false,
    recruiterViewCount: 18,
    pendingAccessRequests: 1,
    profileSlug: "noah-rivera",
    isPublic: true,
  },
  {
    id: "p4",
    name: "Tyler Brooks",
    position: "PF",
    gradYear: 2027,
    height: "6'7\"",
    teamTier: "Gold",
    overallTier: "Developing",
    topSkill: "Rebounding",
    topSkillScore: 78,
    topSkillDelta: 8,
    coachabilityIndex: 72,
    attendanceRate: 81,
    badgeCount: 3,
    assessmentCount: 3,
    filmClipCount: 0,
    profileComplete: false,
    hasApprovedExport: false,
    recruiterViewCount: 4,
    pendingAccessRequests: 0,
    profileSlug: "tyler-brooks",
    isPublic: false,
  },
  {
    id: "p5",
    name: "Cam Porter",
    position: "C",
    gradYear: 2027,
    height: "6'9\"",
    teamTier: "Gold",
    overallTier: "Developing",
    topSkill: "Post Moves",
    topSkillScore: 74,
    topSkillDelta: 5,
    coachabilityIndex: 85,
    attendanceRate: 90,
    badgeCount: 4,
    assessmentCount: 3,
    filmClipCount: 3,
    profileComplete: false,
    hasApprovedExport: false,
    recruiterViewCount: 11,
    pendingAccessRequests: 0,
    profileSlug: "cam-porter",
    isPublic: true,
  },
  {
    id: "p6",
    name: "DeShawn Mills",
    position: "PG",
    gradYear: 2028,
    height: "5'11\"",
    teamTier: "Gold",
    overallTier: "Developing",
    topSkill: "Court Vision",
    topSkillScore: 76,
    topSkillDelta: 7,
    coachabilityIndex: 91,
    attendanceRate: 95,
    badgeCount: 5,
    assessmentCount: 4,
    filmClipCount: 5,
    profileComplete: true,
    hasApprovedExport: true,
    recruiterViewCount: 8,
    pendingAccessRequests: 1,
    profileSlug: "deshawn-mills",
    isPublic: true,
  },
  {
    id: "p7",
    name: "Jordan Okafor",
    position: "SF",
    gradYear: 2028,
    height: "6'4\"",
    teamTier: "Premier",
    overallTier: "Advanced",
    topSkill: "Athleticism",
    topSkillScore: 85,
    topSkillDelta: 2,
    coachabilityIndex: 80,
    attendanceRate: 86,
    badgeCount: 4,
    assessmentCount: 4,
    filmClipCount: 7,
    profileComplete: true,
    hasApprovedExport: false,
    recruiterViewCount: 14,
    pendingAccessRequests: 0,
    profileSlug: "jordan-okafor",
    isPublic: true,
  },
  {
    id: "p8",
    name: "Brandon Lee",
    position: "PG",
    gradYear: 2029,
    height: "5'10\"",
    teamTier: "Silver",
    overallTier: "Emerging",
    topSkill: "Speed",
    topSkillScore: 69,
    topSkillDelta: 9,
    coachabilityIndex: 88,
    attendanceRate: 93,
    badgeCount: 2,
    assessmentCount: 2,
    filmClipCount: 2,
    profileComplete: false,
    hasApprovedExport: false,
    recruiterViewCount: 2,
    pendingAccessRequests: 0,
    profileSlug: "brandon-lee",
    isPublic: false,
  },
  {
    id: "p9",
    name: "Marcus Chen",
    position: "SG",
    gradYear: 2029,
    height: "6'1\"",
    teamTier: "Silver",
    overallTier: "Emerging",
    topSkill: "Shooting",
    topSkillScore: 71,
    topSkillDelta: 11,
    coachabilityIndex: 82,
    attendanceRate: 89,
    badgeCount: 3,
    assessmentCount: 2,
    filmClipCount: 1,
    profileComplete: false,
    hasApprovedExport: false,
    recruiterViewCount: 1,
    pendingAccessRequests: 0,
    profileSlug: "marcus-chen",
    isPublic: false,
  },
  {
    id: "p10",
    name: "Tyrese Morgan",
    position: "PF",
    gradYear: 2028,
    height: "6'6\"",
    teamTier: "Gold",
    overallTier: "Advanced",
    topSkill: "Mid-Range",
    topSkillScore: 82,
    topSkillDelta: -1,
    coachabilityIndex: 74,
    attendanceRate: 84,
    badgeCount: 4,
    assessmentCount: 3,
    filmClipCount: 4,
    profileComplete: true,
    hasApprovedExport: false,
    recruiterViewCount: 9,
    pendingAccessRequests: 0,
    profileSlug: "tyrese-morgan",
    isPublic: true,
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function tierColor(tier: ProspectPlayer["overallTier"]) {
  switch (tier) {
    case "Elite":      return PRIMARY;
    case "Advanced":   return SUCCESS;
    case "Developing": return WARNING;
    case "Emerging":   return MUTED;
  }
}

function tierBg(tier: ProspectPlayer["overallTier"]) {
  switch (tier) {
    case "Elite":      return "oklch(0.72 0.18 290 / 0.12)";
    case "Advanced":   return "oklch(0.75 0.12 140 / 0.12)";
    case "Developing": return "oklch(0.78 0.16 75 / 0.12)";
    case "Emerging":   return "oklch(0.55 0.02 260 / 0.15)";
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

/* -------------------------------------------------------------------------- */
/* SVG Donut Chart                                                             */
/* -------------------------------------------------------------------------- */

type DonutSegment = { label: string; value: number; color: string };

function DonutChart({ segments, size = 96 }: { segments: DonutSegment[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.38;
  const strokeW = size * 0.16;

  let cumAngle = -90;
  const arcs = segments.map((seg) => {
    const pct   = seg.value / total;
    const angle = pct * 360;
    const start = cumAngle;
    cumAngle   += angle;
    return { ...seg, startAngle: start, sweepAngle: angle };
  });

  function describeArc(startDeg: number, sweepDeg: number) {
    if (sweepDeg >= 360) sweepDeg = 359.99;
    const rad = (d: number) => (d * Math.PI) / 180;
    const x1  = cx + r * Math.cos(rad(startDeg));
    const y1  = cy + r * Math.sin(rad(startDeg));
    const x2  = cx + r * Math.cos(rad(startDeg + sweepDeg));
    const y2  = cy + r * Math.sin(rad(startDeg + sweepDeg));
    const lg  = sweepDeg > 180 ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${lg} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc) => (
        <path
          key={arc.label}
          d={describeArc(arc.startAngle, arc.sweepAngle)}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeW}
          strokeLinecap="butt"
        />
      ))}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.18}
        fontWeight="700"
        fill="currentColor"
      >
        {total}
      </text>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Profile Readiness Dot                                                       */
/* -------------------------------------------------------------------------- */

function ReadinessDot({ filled, label }: { filled: boolean; label: string }) {
  return (
    <span
      title={label}
      className="inline-block w-2.5 h-2.5 rounded-full"
      style={{ background: filled ? SUCCESS : "oklch(0.30 0.01 260)" }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Quick Stats Panel                                                           */
/* -------------------------------------------------------------------------- */

function QuickStatsPanel({ players }: { players: ProspectPlayer[] }) {
  const gradYearCounts = useMemo(() => {
    const m = new Map<number, number>();
    players.forEach((p) => m.set(p.gradYear, (m.get(p.gradYear) ?? 0) + 1));
    return Array.from(m.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, count]) => ({ year, count }));
  }, [players]);

  const positionCounts = useMemo(() => {
    const m = new Map<string, number>();
    players.forEach((p) => m.set(p.position, (m.get(p.position) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [players]);

  const avgCoachability = players.length
    ? Math.round(players.reduce((s, p) => s + p.coachabilityIndex, 0) / players.length)
    : 0;

  const avgComplete = players.length
    ? Math.round((players.filter((p) => p.profileComplete).length / players.length) * 100)
    : 0;

  const donutSegments: DonutSegment[] = gradYearCounts.map((g, i) => ({
    label: `Class of ${g.year}`,
    value: g.count,
    color: [PRIMARY, SUCCESS, WARNING][i % 3],
  }));

  return (
    <div className="rounded-xl border border-border bg-[var(--bg-surface)] p-5 space-y-5">
      <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Pool Breakdown</h3>

      {/* Grad year donut */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">By Grad Year</div>
        <div className="flex items-center gap-4">
          <DonutChart segments={donutSegments} size={80} />
          <div className="space-y-1.5">
            {gradYearCounts.map((g, i) => (
              <div key={g.year} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: [PRIMARY, SUCCESS, WARNING][i % 3] }}
                />
                <span className="text-[12px] text-[var(--text-muted)]">
                  {g.year} — <span className="font-semibold text-[var(--text-primary)]">{g.count}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Position breakdown */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">By Position</div>
        <div className="space-y-1.5">
          {positionCounts.map(([pos, count]) => (
            <div key={pos} className="flex items-center gap-2">
              <span className="text-[12px] font-mono w-6 shrink-0" style={{ color: PRIMARY }}>{pos}</span>
              <div className="flex-1 h-1.5 bg-[var(--bg-base)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(count / players.length) * 100}%`, background: PRIMARY }}
                />
              </div>
              <span className="text-[12px] text-[var(--text-muted)] w-4 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Averages */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[var(--border)] p-3 text-center">
          <div className="text-[20px] font-black" style={{ color: PRIMARY }}>{avgCoachability}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Avg Coachability</div>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-3 text-center">
          <div className="text-[20px] font-black" style={{ color: SUCCESS }}>{avgComplete}%</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Profile Complete</div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Profile Gaps Panel                                                          */
/* -------------------------------------------------------------------------- */

function ProfileGapsPanel({ players }: { players: ProspectPlayer[] }) {
  const [open, setOpen] = useState(false);

  const needsFilm      = players.filter((p) => p.filmClipCount === 0);
  const needsNarrative = players.filter((p) => !p.profileComplete);
  const noExport       = players.filter((p) => !p.hasApprovedExport);
  const isPrivate      = players.filter((p) => !p.isPublic);

  const totalGaps = needsFilm.length + needsNarrative.length + noExport.length + isPrivate.length;

  const groups: { label: string; players: ProspectPlayer[]; href: string; color: string }[] = [
    { label: "Needs film package",    players: needsFilm,      href: "/app/coach/film",     color: WARNING },
    { label: "Needs coach narrative", players: needsNarrative, href: "/app/coach/recruiting", color: WARNING },
    { label: "No approved export",    players: noExport,       href: "/app/director/prospects", color: DANGER },
    { label: "Profile set to private",players: isPrivate,      href: "/app/director/prospects", color: MUTED  },
  ];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[var(--bg-base)] transition-colors"
        style={{ minHeight: 56 }}
      >
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" style={{ color: totalGaps > 0 ? WARNING : SUCCESS }} />
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">Profile Gaps</span>
          {totalGaps > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: "oklch(0.78 0.16 75 / 0.14)", color: WARNING }}
            >
              {totalGaps} issues
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
      </button>

      {open && (
        <div className="border-t border-[var(--border)] px-5 pb-5 pt-4 space-y-4">
          {groups.map((group) => {
            if (group.players.length === 0) return null;
            return (
              <div key={group.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold" style={{ color: group.color }}>
                    {group.label}
                    <span className="text-[var(--text-muted)] font-normal ml-1.5">({group.players.length})</span>
                  </span>
                  <Link href={group.href} asChild>
                    <a className="text-[11px] font-medium flex items-center gap-1" style={{ color: PRIMARY }}>
                      <LinkIcon className="w-3 h-3" /> Fix
                    </a>
                  </Link>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.players.map((p) => (
                    <span
                      key={p.id}
                      className="rounded-full px-2.5 py-1 text-[12px] border"
                      style={{
                        borderColor: `${group.color}33`,
                        color: "var(--text-primary)",
                        background: `${group.color}08`,
                      }}
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {totalGaps === 0 && (
            <div className="flex items-center gap-2 text-[13px]" style={{ color: SUCCESS }}>
              <CheckCircle2 className="w-4 h-4" />
              All profiles are complete and public
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Prospect Row (desktop table)                                                */
/* -------------------------------------------------------------------------- */

function ProspectTableRow({ player }: { player: ProspectPlayer }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const tc  = tierColor(player.overallTier);
  const bg  = tierBg(player.overallTier);
  const positive = player.topSkillDelta >= 0;

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--bg-surface)] transition-colors group">
      {/* Player */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ background: bg, color: tc }}
          >
            {getInitials(player.name)}
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">{player.name}</div>
            <div className="text-[11px] text-[var(--text-muted)]">
              {player.position} · {player.height} · {player.gradYear}
            </div>
          </div>
        </div>
      </td>

      {/* Tier */}
      <td className="px-4 py-3">
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: bg, color: tc }}
        >
          {player.overallTier}
        </span>
      </td>

      {/* Top skill + score */}
      <td className="px-4 py-3">
        <div className="text-[13px] font-medium text-[var(--text-primary)]">{player.topSkill}</div>
        <div className="text-[11px] font-mono" style={{ color: tc }}>{player.topSkillScore}</div>
      </td>

      {/* Growth indicator */}
      <td className="px-4 py-3">
        <span
          className="flex items-center gap-1 text-[12px] font-medium"
          style={{ color: positive ? SUCCESS : player.topSkillDelta < 0 ? DANGER : MUTED }}
        >
          {positive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : player.topSkillDelta < 0 ? (
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
              <path d="M2 5L8 11L14 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <Minus className="w-3.5 h-3.5" />
          )}
          {positive ? "+" : ""}{player.topSkillDelta}%
        </span>
      </td>

      {/* Coachability */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-[var(--bg-base)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${player.coachabilityIndex}%`,
                background: player.coachabilityIndex >= 85 ? SUCCESS : player.coachabilityIndex >= 70 ? WARNING : DANGER,
              }}
            />
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">{player.coachabilityIndex}</span>
        </div>
      </td>

      {/* Profile status dots */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <ReadinessDot filled={player.assessmentCount > 0} label="Assessment data" />
          <ReadinessDot filled={player.filmClipCount > 0}   label="Film package" />
          <ReadinessDot filled={player.profileComplete}      label="Coach narrative" />
          <ReadinessDot filled={player.hasApprovedExport}    label="Export ready" />
        </div>
      </td>

      {/* Recruiter activity */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="text-[13px] font-mono text-[var(--text-primary)]">{player.recruiterViewCount}</span>
          {player.pendingAccessRequests > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
              style={{ background: "oklch(0.78 0.16 75 / 0.18)", color: WARNING }}
            >
              {player.pendingAccessRequests}
            </span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/app/director/prospects/${player.profileSlug}`} asChild>
            <a
              className="px-2.5 py-1.5 rounded-md text-[11px] font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              style={{ minHeight: 32 }}
            >
              View
            </a>
          </Link>
          <button
            onClick={() => toast.success(`Export queued for ${player.name}`)}
            className="px-2.5 py-1.5 rounded-md text-[11px] font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            style={{ minHeight: 32 }}
          >
            Export
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-8 w-40 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg z-10 overflow-hidden"
                onBlur={() => setMenuOpen(false)}
              >
                {[
                  { label: "Edit Profile",      action: () => toast.info("Opening profile editor") },
                  { label: "Toggle Visibility",  action: () => toast.success(`${player.name}'s profile ${player.isPublic ? "hidden" : "made public"}`) },
                  { label: "Request Assessment", action: () => toast.success("Assessment request sent to coach") },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { item.action(); setMenuOpen(false); }}
                    className="w-full text-left px-3.5 py-2.5 text-[12px] text-[var(--text-primary)] hover:bg-[var(--bg-base)] transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile Prospect Card                                                        */
/* -------------------------------------------------------------------------- */

function ProspectCard({ player }: { player: ProspectPlayer }) {
  const tc = tierColor(player.overallTier);
  const bg = tierBg(player.overallTier);
  const positive = player.topSkillDelta >= 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ background: bg, color: tc }}
          >
            {getInitials(player.name)}
          </div>
          <div>
            <div className="text-[14px] font-semibold text-[var(--text-primary)]">{player.name}</div>
            <div className="text-[12px] text-[var(--text-muted)]">
              {player.position} · {player.height} · {player.gradYear}
            </div>
          </div>
        </div>
        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0" style={{ background: bg, color: tc }}>
          {player.overallTier}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-[var(--bg-base)] p-2 text-center">
          <div className="text-[13px] font-bold text-[var(--text-primary)]">{player.topSkillScore}</div>
          <div className="text-[10px] text-[var(--text-muted)]">{player.topSkill}</div>
        </div>
        <div className="rounded-lg bg-[var(--bg-base)] p-2 text-center">
          <div className="text-[13px] font-bold" style={{ color: positive ? SUCCESS : DANGER }}>
            {positive ? "+" : ""}{player.topSkillDelta}%
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">Growth</div>
        </div>
        <div className="rounded-lg bg-[var(--bg-base)] p-2 text-center">
          <div className="text-[13px] font-bold text-[var(--text-primary)]">{player.recruiterViewCount}</div>
          <div className="text-[10px] text-[var(--text-muted)]">Views</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ReadinessDot filled={player.assessmentCount > 0} label="Assessment data" />
          <ReadinessDot filled={player.filmClipCount > 0}   label="Film package" />
          <ReadinessDot filled={player.profileComplete}      label="Narrative" />
          <ReadinessDot filled={player.hasApprovedExport}    label="Export" />
          <span className="text-[11px] text-[var(--text-muted)] ml-1">Readiness</span>
        </div>
        {player.pendingAccessRequests > 0 && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: "oklch(0.78 0.16 75 / 0.18)", color: WARNING }}
          >
            {player.pendingAccessRequests} pending
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Link href={`/app/director/prospects/${player.profileSlug}`} asChild>
          <a
            className="flex-1 py-2 text-center rounded-lg border border-[var(--border)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            style={{ minHeight: 40 }}
          >
            View Profile
          </a>
        </Link>
        <button
          onClick={() => toast.success(`Export queued for ${player.name}`)}
          className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-colors"
          style={{ background: PRIMARY, color: "white", minHeight: 40 }}
        >
          Generate Export
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

type Position = "All" | "PG" | "SG" | "SF" | "PF" | "C";
type GradFilter = "All" | "2027" | "2028" | "2029";
type TierFilter = "All" | "Elite" | "Advanced" | "Developing" | "Emerging";
type SortOption = "activity" | "tier" | "trajectory" | "alpha";

const TIER_ORDER: Record<ProspectPlayer["overallTier"], number> = {
  Elite: 0, Advanced: 1, Developing: 2, Emerging: 3,
};

export default function ProspectPoolPage() {
  const [posFilter, setPosFilter]     = useState<Position>("All");
  const [gradFilter, setGradFilter]   = useState<GradFilter>("All");
  const [tierFilter, setTierFilter]   = useState<TierFilter>("All");
  const [sort, setSort]               = useState<SortOption>("activity");
  const [gapsOnly, setGapsOnly]       = useState(false);

  const filtered = useMemo(() => {
    let result = [...PROSPECTS];

    if (posFilter !== "All")  result = result.filter((p) => p.position === posFilter);
    if (gradFilter !== "All") result = result.filter((p) => String(p.gradYear) === gradFilter);
    if (tierFilter !== "All") result = result.filter((p) => p.overallTier === tierFilter);
    if (gapsOnly)             result = result.filter((p) => !p.profileComplete || !p.hasApprovedExport || p.filmClipCount === 0 || !p.isPublic);

    switch (sort) {
      case "activity":
        result.sort((a, b) => b.recruiterViewCount - a.recruiterViewCount);
        break;
      case "tier":
        result.sort((a, b) => TIER_ORDER[a.overallTier] - TIER_ORDER[b.overallTier]);
        break;
      case "trajectory":
        result.sort((a, b) => b.topSkillDelta - a.topSkillDelta);
        break;
      case "alpha":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [posFilter, gradFilter, tierFilter, sort, gapsOnly]);

  const publicCount         = PROSPECTS.filter((p) => p.isPublic).length;
  const exportReadyCount    = PROSPECTS.filter((p) => p.hasApprovedExport).length;
  const pendingRequestCount = PROSPECTS.reduce((s, p) => s + p.pendingAccessRequests, 0);
  const viewsThisWeek       = PROSPECTS.reduce((s, p) => s + Math.floor(p.recruiterViewCount * 0.3), 0);

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6">
        <PageHeader
          eyebrow="Recruiting Intelligence"
          title="Prospect Pool"
          subtitle="Your athletes' recruiting profiles — track readiness, activity, and placement"
          actions={
            <button
              onClick={() => toast.success("Roster PDF queued — you'll receive it shortly")}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold border border-[var(--border)] hover:border-[oklch(0.72_0.18_290_/_0.4)] transition-all text-[var(--text-primary)]"
              style={{ minHeight: 40 }}
            >
              <Download className="w-4 h-4" />
              Export Roster PDF
            </button>
          }
        />

        {/* Summary strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Public Profiles",         value: publicCount,         icon: <Eye className="w-4 h-4" />,      color: PRIMARY  },
            { label: "Export-Ready Players",     value: exportReadyCount,    icon: <FileText className="w-4 h-4" />, color: SUCCESS  },
            { label: "Active Recruiter Interest",value: pendingRequestCount, icon: <Users className="w-4 h-4" />,   color: WARNING  },
            { label: "Profile Views This Week",  value: viewsThisWeek,       icon: <Film className="w-4 h-4" />,    color: PRIMARY  },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5"
            >
              <span style={{ color: card.color }}>{card.icon}</span>
              <div className="text-[28px] font-black leading-none mt-2" style={{ color: card.color }}>
                {card.value}
              </div>
              <div className="text-[12px] text-[var(--text-muted)] mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          {/* Position chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-[var(--text-muted)] w-16 shrink-0">Position</span>
            {(["All", "PG", "SG", "SF", "PF", "C"] as Position[]).map((pos) => (
              <button
                key={pos}
                onClick={() => setPosFilter(pos)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                style={{
                  background: posFilter === pos ? PRIMARY : "oklch(0.20 0.005 260)",
                  color: posFilter === pos ? "white" : "var(--text-muted)",
                }}
              >
                {pos}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Grad year */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[var(--text-muted)] w-16 shrink-0">Grad Year</span>
              {(["All", "2027", "2028", "2029"] as GradFilter[]).map((y) => (
                <button
                  key={y}
                  onClick={() => setGradFilter(y)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                  style={{
                    background: gradFilter === y ? "oklch(0.75 0.12 140 / 0.18)" : "oklch(0.20 0.005 260)",
                    color: gradFilter === y ? SUCCESS : "var(--text-muted)",
                    border: gradFilter === y ? `1px solid ${SUCCESS}40` : "1px solid transparent",
                  }}
                >
                  {y}
                </button>
              ))}
            </div>

            {/* Tier */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[var(--text-muted)] w-8 shrink-0">Tier</span>
              {(["All", "Elite", "Advanced", "Developing", "Emerging"] as TierFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                  style={{
                    background: tierFilter === t ? "oklch(0.72 0.18 290 / 0.14)" : "oklch(0.20 0.005 260)",
                    color: tierFilter === t ? PRIMARY : "var(--text-muted)",
                    border: tierFilter === t ? `1px solid ${PRIMARY}33` : "1px solid transparent",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Sort + gaps toggle */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--text-muted)]">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[12px] text-[var(--text-primary)] px-2.5 py-1.5"
              >
                <option value="activity">Recruiter Activity</option>
                <option value="tier">Tier</option>
                <option value="trajectory">Assessment Trajectory</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>

            <button
              onClick={() => setGapsOnly(!gapsOnly)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[12px] font-medium"
              style={{
                borderColor: gapsOnly ? WARNING : "var(--border)",
                background: gapsOnly ? "oklch(0.78 0.16 75 / 0.12)" : "transparent",
                color: gapsOnly ? WARNING : "var(--text-muted)",
              }}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Profile gaps only
            </button>
          </div>
        </div>

        {/* Content + sidebar layout */}
        <div className="flex gap-5 items-start">
          <div className="flex-1 min-w-0 space-y-4">
            {/* Desktop table */}
            <div className="hidden lg:block rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["Player", "Tier", "Top Skill", "Growth", "Coachability", "Profile Status", "Recruiter Activity", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((p) => <ProspectTableRow key={p.id} player={p} />)
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-[13px] text-[var(--text-muted)]">
                        No players match the current filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {filtered.length > 0 ? (
                filtered.map((p) => <ProspectCard key={p.id} player={p} />)
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center text-[13px] text-[var(--text-muted)]">
                  No players match the current filters
                </div>
              )}
            </div>

            {/* Profile gaps */}
            <ProfileGapsPanel players={PROSPECTS} />
          </div>

          {/* Right sidebar (desktop) */}
          <aside className="hidden xl:block w-64 shrink-0">
            <QuickStatsPanel players={PROSPECTS} />
          </aside>
        </div>

        {/* Mobile quick stats */}
        <div className="xl:hidden">
          <QuickStatsPanel players={PROSPECTS} />
        </div>
      </div>
    </AppShell>
  );
}
