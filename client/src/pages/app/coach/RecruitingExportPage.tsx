/**
 * RecruitingExportPage — Coach builds, manages, and shares recruiting exports.
 * Route: /app/coach/recruiting/export
 * Optional query param: ?player=id
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Trash2,
  X,
  Play,
  Check,
  AlertTriangle,
  Clock,
  Eye,
  Download,
  Send,
  Shield,
  Film,
  Award,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type RecruitingPlayer = {
  id: string;
  name: string;
  position: string;
  gradYear: number;
  height: string;
  programName: string;
  teamTier: string;
  skillScores: Record<string, number>;
  skillDeltas: Record<string, number>;
  overallTier: "Emerging" | "Developing" | "Advanced" | "Elite";
  assessmentCount: number;
  filmClipCount: number;
  badgeCount: number;
  coachabilityIndex: number;
  attendanceRate: number;
  idpOnTrack: boolean;
  profileSlug: string;
};

type FilmClip = {
  id: string;
  playerId: string;
  title: string;
  description: string;
  coachAnnotation: string;
  skillTags: string[];
  eventType: "practice" | "game" | "tournament";
  eventDate: string;
  durationSeconds: number;
  isInRecruitingPackage: boolean;
};

type BadgeInstance = {
  id: string;
  badgeId: string;
  badgeName: string;
  badgeCategory: string;
  playerId: string;
  playerName: string;
  awardedBy: string;
  awardedAt: string;
  evidenceType: "assessment" | "film" | "observation" | "attendance";
  evidenceNote: string;
  iconKey: string;
};

type RecruitingExport = {
  id: string;
  playerId: string;
  playerName: string;
  generatedBy: string;
  generatedAt: string;
  status: "draft" | "pending_approval" | "approved" | "shared";
  familyApprovedAt?: string;
  clipIds: string[];
  coachNarrative: string;
  featuredBadgeIds: string[];
  shareLink?: string;
  downloadCount: number;
  viewCount: number;
};

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER = "oklch(0.68 0.22 25)";

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

const SKILL_KEYS = Object.keys(SKILL_LABELS);

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const MOCK_PLAYERS: RecruitingPlayer[] = [
  {
    id: "p1", name: "Jordan Mills", position: "PG", gradYear: 2027,
    height: "6'1\"", programName: "Texas Elite 17U", teamTier: "AAU Premier",
    skillScores: { ball_handling: 8.4, shooting: 7.2, finishing: 7.8, defense: 8.1, footwork: 7.5, iq_reads: 8.7, athleticism: 7.9, conditioning: 8.2 },
    skillDeltas: { ball_handling: 0.6, shooting: 0.4, finishing: 0.3, defense: 0.8, footwork: 0.2, iq_reads: 0.9, athleticism: 0.1, conditioning: 0.5 },
    overallTier: "Elite", assessmentCount: 14, filmClipCount: 22, badgeCount: 5,
    coachabilityIndex: 9.1, attendanceRate: 97, idpOnTrack: true, profileSlug: "jordan-mills",
  },
  {
    id: "p2", name: "Marcus Webb", position: "SG", gradYear: 2027,
    height: "6'3\"", programName: "Texas Elite 17U", teamTier: "AAU Premier",
    skillScores: { ball_handling: 7.1, shooting: 8.6, finishing: 7.4, defense: 7.0, footwork: 7.2, iq_reads: 7.5, athleticism: 8.3, conditioning: 7.8 },
    skillDeltas: { ball_handling: 0.2, shooting: 0.9, finishing: 0.5, defense: 0.3, footwork: 0.4, iq_reads: 0.6, athleticism: 0.7, conditioning: 0.4 },
    overallTier: "Advanced", assessmentCount: 11, filmClipCount: 18, badgeCount: 3,
    coachabilityIndex: 8.4, attendanceRate: 93, idpOnTrack: true, profileSlug: "marcus-webb",
  },
  {
    id: "p3", name: "Devon Price", position: "SF", gradYear: 2026,
    height: "6'5\"", programName: "Texas Elite 17U", teamTier: "AAU Premier",
    skillScores: { ball_handling: 6.8, shooting: 7.4, finishing: 8.2, defense: 7.9, footwork: 8.0, iq_reads: 7.2, athleticism: 8.5, conditioning: 8.1 },
    skillDeltas: { ball_handling: 0.3, shooting: 0.5, finishing: 0.7, defense: 0.4, footwork: 0.9, iq_reads: 0.2, athleticism: 0.6, conditioning: 0.3 },
    overallTier: "Advanced", assessmentCount: 9, filmClipCount: 14, badgeCount: 2,
    coachabilityIndex: 7.9, attendanceRate: 89, idpOnTrack: false, profileSlug: "devon-price",
  },
  {
    id: "p4", name: "Isaiah Thomas", position: "PF", gradYear: 2027,
    height: "6'7\"", programName: "Texas Elite 17U", teamTier: "AAU Premier",
    skillScores: { ball_handling: 6.2, shooting: 6.8, finishing: 8.1, defense: 8.4, footwork: 7.8, iq_reads: 7.0, athleticism: 8.0, conditioning: 7.5 },
    skillDeltas: { ball_handling: 0.4, shooting: 0.3, finishing: 0.8, defense: 0.7, footwork: 0.5, iq_reads: 0.3, athleticism: 0.4, conditioning: 0.6 },
    overallTier: "Advanced", assessmentCount: 8, filmClipCount: 11, badgeCount: 2,
    coachabilityIndex: 8.2, attendanceRate: 91, idpOnTrack: true, profileSlug: "isaiah-thomas",
  },
  {
    id: "p5", name: "Cameron Lee", position: "C", gradYear: 2027,
    height: "6'9\"", programName: "Texas Elite 17U", teamTier: "AAU Premier",
    skillScores: { ball_handling: 5.5, shooting: 5.9, finishing: 7.8, defense: 8.7, footwork: 7.4, iq_reads: 6.8, athleticism: 7.9, conditioning: 7.2 },
    skillDeltas: { ball_handling: 0.1, shooting: 0.2, finishing: 0.6, defense: 1.1, footwork: 0.7, iq_reads: 0.4, athleticism: 0.3, conditioning: 0.5 },
    overallTier: "Developing", assessmentCount: 7, filmClipCount: 9, badgeCount: 1,
    coachabilityIndex: 8.8, attendanceRate: 95, idpOnTrack: true, profileSlug: "cameron-lee",
  },
  {
    id: "p6", name: "Tyler Brooks", position: "SG", gradYear: 2028,
    height: "6'2\"", programName: "Texas Elite 17U", teamTier: "AAU Premier",
    skillScores: { ball_handling: 7.4, shooting: 7.8, finishing: 7.1, defense: 6.9, footwork: 7.0, iq_reads: 7.3, athleticism: 7.6, conditioning: 7.4 },
    skillDeltas: { ball_handling: 0.5, shooting: 0.8, finishing: 0.4, defense: 0.2, footwork: 0.3, iq_reads: 0.5, athleticism: 0.4, conditioning: 0.3 },
    overallTier: "Developing", assessmentCount: 6, filmClipCount: 8, badgeCount: 1,
    coachabilityIndex: 7.5, attendanceRate: 87, idpOnTrack: false, profileSlug: "tyler-brooks",
  },
  {
    id: "p7", name: "Andre Johnson", position: "PG", gradYear: 2027,
    height: "5'11\"", programName: "Texas Elite 17U", teamTier: "AAU Premier",
    skillScores: { ball_handling: 8.0, shooting: 7.0, finishing: 7.3, defense: 7.6, footwork: 7.2, iq_reads: 8.2, athleticism: 7.4, conditioning: 8.0 },
    skillDeltas: { ball_handling: 0.7, shooting: 0.3, finishing: 0.4, defense: 0.5, footwork: 0.3, iq_reads: 0.8, athleticism: 0.2, conditioning: 0.6 },
    overallTier: "Advanced", assessmentCount: 10, filmClipCount: 16, badgeCount: 3,
    coachabilityIndex: 8.9, attendanceRate: 96, idpOnTrack: true, profileSlug: "andre-johnson",
  },
  {
    id: "p8", name: "Darius King", position: "SF", gradYear: 2026,
    height: "6'4\"", programName: "Texas Elite 17U", teamTier: "AAU Premier",
    skillScores: { ball_handling: 6.5, shooting: 6.8, finishing: 7.6, defense: 7.1, footwork: 7.8, iq_reads: 6.9, athleticism: 8.2, conditioning: 7.7 },
    skillDeltas: { ball_handling: 0.2, shooting: 0.1, finishing: 0.5, defense: 0.3, footwork: 0.8, iq_reads: 0.2, athleticism: 0.5, conditioning: 0.4 },
    overallTier: "Emerging", assessmentCount: 5, filmClipCount: 7, badgeCount: 0,
    coachabilityIndex: 7.2, attendanceRate: 82, idpOnTrack: false, profileSlug: "darius-king",
  },
];

function makeClips(playerId: string, playerName: string): FilmClip[] {
  const base: Omit<FilmClip, "id" | "playerId">[] = [
    {
      title: "Pick-and-Roll Reads — Practice 4/22", description: "Excellent vision reading the coverage and making the right pass to the roll man.", coachAnnotation: "This is exactly the IQ we've been developing all season.", skillTags: ["iq_reads", "ball_handling"], eventType: "practice", eventDate: "2026-04-22", durationSeconds: 87, isInRecruitingPackage: false,
    },
    {
      title: "On-Ball Defense — Regional Semifinal", description: "Held their top scorer to 2/11 FG. Active hands, no bail-out fouls.", coachAnnotation: "Showcase-level defensive rep. Best defensive performance of the season.", skillTags: ["defense", "footwork"], eventType: "game", eventDate: "2026-04-15", durationSeconds: 124, isInRecruitingPackage: true,
    },
    {
      title: "Pull-Up Mid-Range — EYBL Day 2", description: "Hit 5 consecutive pull-up jumpers in game action during a crucial run.", coachAnnotation: "His footwork on the pull-up has transformed since February.", skillTags: ["shooting", "footwork"], eventType: "tournament", eventDate: "2026-03-30", durationSeconds: 65, isInRecruitingPackage: false,
    },
    {
      title: "Drive and Kick Sequence — Practice", description: "Three consecutive possessions attacking and finding shooters. Zero turnovers.", coachAnnotation: "This is why his assist-to-turnover ratio leads the team.", skillTags: ["ball_handling", "iq_reads"], eventType: "practice", eventDate: "2026-04-08", durationSeconds: 110, isInRecruitingPackage: false,
    },
    {
      title: "Full-Court Press Break — State Showcase", description: "Single-handedly broke a 2-2-1 full-court press, resulting in easy layup.", coachAnnotation: "Calm, decisive, and physically impressive under pressure.", skillTags: ["ball_handling", "athleticism", "iq_reads"], eventType: "tournament", eventDate: "2026-03-20", durationSeconds: 42, isInRecruitingPackage: true,
    },
    {
      title: "Conditioning Circuit — Pre-Season Testing", description: "Top mark in the program for the sprint protocol. Elite conditioning baseline.", coachAnnotation: "Numbers verified by our certified trainer. Elite percentile for position.", skillTags: ["conditioning", "athleticism"], eventType: "practice", eventDate: "2026-01-15", durationSeconds: 190, isInRecruitingPackage: false,
    },
  ];
  return base.map((c, i) => ({ ...c, id: `clip-${playerId}-${i + 1}`, playerId }));
}

function makeBadges(player: RecruitingPlayer): BadgeInstance[] {
  const allBadges: Omit<BadgeInstance, "id" | "playerId" | "playerName">[] = [
    { badgeId: "perimeter-defender", badgeName: "Perimeter Defender", badgeCategory: "Defense", awardedBy: "Coach Grant", awardedAt: "2026-04-18", evidenceType: "assessment", evidenceNote: "On-ball D rating ≥ 8.1 over two consecutive assessments in March–April.", iconKey: "shield" },
    { badgeId: "floor-general", badgeName: "Floor General", badgeCategory: "Playmaking", awardedBy: "Coach Grant", awardedAt: "2026-03-25", evidenceType: "film", evidenceNote: "IQ rating 8.7 across all assessments + 4 leadership observations logged.", iconKey: "star" },
    { badgeId: "high-coachability", badgeName: "High Coachability", badgeCategory: "Character", awardedBy: "Coach Grant", awardedAt: "2026-02-10", evidenceType: "attendance", evidenceNote: "97% attendance, all IDP cycles completed on time over 8 months.", iconKey: "clock" },
    { badgeId: "tournament-performer", badgeName: "Tournament Performer", badgeCategory: "Performance", awardedBy: "Coach Grant", awardedAt: "2026-04-01", evidenceType: "observation", evidenceNote: "Observed at Nike EYBL session — elevated performance under evaluation.", iconKey: "trophy" },
    { badgeId: "shot-maker", badgeName: "Shot Maker", badgeCategory: "Shooting", awardedBy: "Coach Grant", awardedAt: "2026-04-10", evidenceType: "film", evidenceNote: "Shooting ≥ 8.0 confirmed with film evidence from regional tournament.", iconKey: "target" },
  ];
  return allBadges.slice(0, player.badgeCount).map((b, i) => ({
    ...b, id: `badge-inst-${player.id}-${i}`, playerId: player.id, playerName: player.name,
  }));
}

function makeExports(player: RecruitingPlayer): RecruitingExport[] {
  if (player.badgeCount < 2) return [];
  return [
    {
      id: `export-${player.id}-1`,
      playerId: player.id,
      playerName: player.name,
      generatedBy: "Coach Marcus Grant",
      generatedAt: "2026-04-28T14:23:00Z",
      status: "approved",
      familyApprovedAt: "2026-04-29T09:11:00Z",
      clipIds: [`clip-${player.id}-2`, `clip-${player.id}-5`],
      coachNarrative: `${player.name} has shown consistent development in both his technical skills and basketball IQ over the past season. His work ethic is evident in the data — he's improved across six of eight skill categories since our January baseline. On the defensive end, he's already demonstrating college-ready awareness and physicality.`,
      featuredBadgeIds: [`badge-inst-${player.id}-0`, `badge-inst-${player.id}-1`],
      shareLink: `https://hoopsiq.com/r/${player.profileSlug}-apr26`,
      downloadCount: 7,
      viewCount: 34,
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function wordCount(text: string) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function tierColor(tier: RecruitingPlayer["overallTier"]) {
  switch (tier) {
    case "Elite":      return PRIMARY;
    case "Advanced":   return SUCCESS;
    case "Developing": return WARNING;
    case "Emerging":   return "oklch(0.55 0.02 260)";
  }
}

function exportStatusMeta(status: RecruitingExport["status"]) {
  switch (status) {
    case "draft":            return { label: "Draft",            color: "oklch(0.55 0.02 260)", bg: "oklch(0.30 0.005 260 / 0.5)" };
    case "pending_approval": return { label: "Pending Approval", color: WARNING,                bg: "oklch(0.78 0.16 75 / 0.12)"  };
    case "approved":         return { label: "Approved",         color: SUCCESS,                bg: "oklch(0.75 0.12 140 / 0.12)" };
    case "shared":           return { label: "Shared",           color: PRIMARY,                bg: "oklch(0.72 0.18 290 / 0.12)" };
  }
}

function eventTypeMeta(t: FilmClip["eventType"]) {
  switch (t) {
    case "practice":   return { label: "Practice",   color: "oklch(0.55 0.02 260)" };
    case "game":       return { label: "Game",        color: SUCCESS };
    case "tournament": return { label: "Tournament",  color: PRIMARY };
  }
}

/* -------------------------------------------------------------------------- */
/* SVG Badge Icon                                                              */
/* -------------------------------------------------------------------------- */

function BadgeIcon({ iconKey, size = 20, color = PRIMARY }: { iconKey: string; size?: number; color?: string }) {
  const s = size;
  switch (iconKey) {
    case "shield":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
          <path d="M10 2L3 5v5c0 4.4 3 7.4 7 8 4-0.6 7-3.6 7-8V5L10 2z" fill={color} fillOpacity={0.18} stroke={color} strokeWidth={1.5} />
          <path d="M7 10l2 2 4-4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "star":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
          <path d="M10 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L10 14l-4.8 2.6.9-5.3L2.3 7.6l5.3-.8L10 2z" fill={color} fillOpacity={0.2} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
        </svg>
      );
    case "trophy":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
          <path d="M6 3h8v6a4 4 0 01-8 0V3z" fill={color} fillOpacity={0.18} stroke={color} strokeWidth={1.5} />
          <path d="M6 6H3a2 2 0 002 2h1M14 6h3a2 2 0 01-2 2h-1" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <path d="M10 13v3M7 17h6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </svg>
      );
    case "target":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke={color} strokeWidth={1.5} fill={color} fillOpacity={0.1} />
          <circle cx="10" cy="10" r="4" stroke={color} strokeWidth={1.5} />
          <circle cx="10" cy="10" r="1.5" fill={color} />
        </svg>
      );
    case "clock":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke={color} strokeWidth={1.5} fill={color} fillOpacity={0.1} />
          <path d="M10 6v4l2.5 2.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke={color} strokeWidth={1.5} fill={color} fillOpacity={0.1} />
          <path d="M10 7v3M10 13v.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </svg>
      );
  }
}

/* -------------------------------------------------------------------------- */
/* Octagon Radar Chart SVG                                                     */
/* -------------------------------------------------------------------------- */

function RadarChart({ scores }: { scores: Record<string, number> }) {
  const skills = SKILL_KEYS;
  const n = skills.length;
  const cx = 90, cy = 90, maxR = 72;

  function polar(i: number, val: number) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const r = (val / 10) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  function polarGrid(r: number) {
    return skills.map((_, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(" ");
  }

  const polygon = skills.map((k, i) => polar(i, scores[k] ?? 5)).map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={180} height={180} viewBox="0 0 180 180" className="shrink-0">
      {/* Grid rings */}
      {[2, 4, 6, 8, 10].map((v) => (
        <polygon key={v} points={polarGrid((v / 10) * maxR)} fill="none" stroke="oklch(0.30 0.01 260)" strokeWidth={0.8} />
      ))}
      {/* Spokes */}
      {skills.map((_, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        return (
          <line key={i} x1={cx} y1={cy} x2={cx + maxR * Math.cos(angle)} y2={cy + maxR * Math.sin(angle)}
            stroke="oklch(0.28 0.01 260)" strokeWidth={0.8} />
        );
      })}
      {/* Filled skill polygon */}
      <polygon points={polygon} fill={`${PRIMARY.replace(")", " / 0.18)")}`} stroke={PRIMARY} strokeWidth={1.5} />
      {/* Dot at each vertex */}
      {skills.map((k, i) => {
        const p = polar(i, scores[k] ?? 5);
        return <circle key={k} cx={p.x} cy={p.y} r={2.5} fill={PRIMARY} />;
      })}
      {/* Labels */}
      {skills.map((k, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const lr = maxR + 14;
        const lx = cx + lr * Math.cos(angle);
        const ly = cy + lr * Math.sin(angle);
        const label = SKILL_LABELS[k]?.split(" / ")[0]?.split(" ")[0] ?? k;
        return (
          <text key={k} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize={7} fill="oklch(0.55 0.02 260)" fontFamily="system-ui">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Player selector row                                                         */
/* -------------------------------------------------------------------------- */

function PlayerRow({
  player,
  selected,
  hasApprovedExport,
  onClick,
}: {
  player: RecruitingPlayer;
  selected: boolean;
  hasApprovedExport: boolean;
  onClick: () => void;
}) {
  const tc = tierColor(player.overallTier);
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-3 rounded-xl transition-all border"
      style={{
        borderColor: selected ? PRIMARY : "transparent",
        background: selected ? "oklch(0.72 0.18 290 / 0.08)" : "transparent",
        minHeight: 44,
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
          style={{ background: `${tc.replace(")", " / 0.14)")}`, color: tc }}
        >
          {player.name.split(" ").map(w => w[0]).join("")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold truncate">{player.name}</span>
            {hasApprovedExport && (
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SUCCESS }} title="Approved export exists" />
            )}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {player.position} · {player.gradYear} · {player.badgeCount} badges
          </div>
        </div>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
          style={{ background: `${tc.replace(")", " / 0.12)")}`, color: tc }}
        >
          {player.overallTier}
        </span>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Export card                                                                 */
/* -------------------------------------------------------------------------- */

function ExportCard({
  exp,
  onRevoke,
}: {
  exp: RecruitingExport;
  onRevoke: (id: string) => void;
}) {
  const meta = exportStatusMeta(exp.status);
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: meta.bg, color: meta.color }}
          >
            {meta.label}
          </span>
          <div className="text-[12px] text-[var(--text-muted)] mt-1">
            Generated {formatDate(exp.generatedAt)} by {exp.generatedBy}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-[var(--text-muted)] shrink-0">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> {exp.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> {exp.downloadCount}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {exp.shareLink && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(exp.shareLink!);
              toast.success("Share link copied");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            style={{ minHeight: 36 }}
          >
            <Copy className="w-3.5 h-3.5" /> Copy Link
          </button>
        )}
        <a
          href={`/r/${exp.playerId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          style={{ minHeight: 36 }}
        >
          <ExternalLink className="w-3.5 h-3.5" /> View as Recruiter
        </a>
        <button
          onClick={() => onRevoke(exp.id)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-medium transition-colors"
          style={{ borderColor: DANGER, color: DANGER, minHeight: 36 }}
        >
          <Trash2 className="w-3.5 h-3.5" /> Revoke Access
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Film clip selector card                                                     */
/* -------------------------------------------------------------------------- */

function ClipCard({
  clip,
  selected,
  onToggle,
}: {
  clip: FilmClip;
  selected: boolean;
  onToggle: () => void;
}) {
  const et = eventTypeMeta(clip.eventType);
  return (
    <div
      className="rounded-xl border cursor-pointer transition-all"
      style={{
        borderColor: selected ? PRIMARY : "var(--border)",
        background: selected ? "oklch(0.72 0.18 290 / 0.06)" : "var(--bg-surface)",
      }}
      onClick={onToggle}
    >
      {/* Thumbnail placeholder */}
      <div
        className="relative rounded-t-xl overflow-hidden flex items-center justify-center"
        style={{ height: 88, background: "oklch(0.18 0.02 260)" }}
      >
        <svg width={36} height={36} viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="16" fill="oklch(0.72 0.18 290 / 0.2)" />
          <polygon points="15,12 15,24 26,18" fill={PRIMARY} />
        </svg>
        <span
          className="absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: `${et.color.replace(")", " / 0.20)")}`, color: et.color }}
        >
          {et.label}
        </span>
        <span className="absolute bottom-2 right-2 text-[10px] font-mono text-white/60">
          {formatDuration(clip.durationSeconds)}
        </span>
        <div
          className="absolute top-2 left-2 w-5 h-5 rounded flex items-center justify-center"
          style={{ background: selected ? PRIMARY : "oklch(0.25 0.01 260 / 0.9)" }}
        >
          {selected ? <Check className="w-3 h-3 text-white" /> : null}
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        <div className="text-[12px] font-semibold leading-tight">{clip.title}</div>
        <div className="flex flex-wrap gap-1">
          {clip.skillTags.map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "oklch(0.72 0.18 290 / 0.10)", color: PRIMARY }}>
              {SKILL_LABELS[t] ?? t}
            </span>
          ))}
        </div>
        <div className="text-[11px] text-[var(--text-muted)] italic line-clamp-2">"{clip.coachAnnotation}"</div>
        <div className="text-[11px] text-[var(--text-muted)]">{formatDate(clip.eventDate)}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function RecruitingExportPage() {
  const [location] = useLocation();
  const queryPlayer = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("player");

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(queryPlayer ?? MOCK_PLAYERS[0].id);
  const [exportsMap, setExportsMap] = useState<Record<string, RecruitingExport[]>>(
    Object.fromEntries(MOCK_PLAYERS.map(p => [p.id, makeExports(p)]))
  );
  const [builderOpen, setBuilderOpen] = useState(false);

  // Builder state
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());
  const [selectedBadges, setSelectedBadges] = useState<Set<string>>(new Set());
  const [narrative, setNarrative] = useState("");
  const [savedTime, setSavedTime] = useState<Date | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const player = MOCK_PLAYERS.find(p => p.id === selectedPlayerId)!;
  const clips = makeClips(player.id, player.name);
  const badges = makeBadges(player);
  const exports = exportsMap[player.id] ?? [];
  const hasApprovedExport = (pid: string) => (exportsMap[pid] ?? []).some(e => e.status === "approved" || e.status === "shared");

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!builderOpen) return;
    autoSaveRef.current = setInterval(() => {
      setSavedTime(new Date());
    }, 30000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [builderOpen]);

  function openBuilder() {
    const existingNarrative = exports[0]?.coachNarrative ?? "";
    setNarrative(existingNarrative);
    setSelectedClips(new Set());
    setSelectedBadges(new Set());
    setStep(1);
    setBuilderOpen(true);
  }

  function toggleClip(id: string) {
    setSelectedClips(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleBadge(id: string) {
    setSelectedBadges(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleNextStep() {
    if (step === 1) {
      if (selectedClips.size < 3) {
        toast.warning("Select at least 3 film clips before continuing.");
        return;
      }
      if (selectedClips.size > 5) {
        toast.warning("Maximum 5 clips per export. Please deselect some clips.");
        return;
      }
    }
    setStep(s => Math.min(4, s + 1) as 1 | 2 | 3 | 4);
  }

  function handleSubmit() {
    const wc = wordCount(narrative);
    if (wc < 10) {
      toast.warning("Please write a coach narrative before submitting.");
      return;
    }
    const newExport: RecruitingExport = {
      id: `export-${player.id}-${Date.now()}`,
      playerId: player.id,
      playerName: player.name,
      generatedBy: "Coach Marcus Grant",
      generatedAt: new Date().toISOString(),
      status: "pending_approval",
      clipIds: Array.from(selectedClips),
      coachNarrative: narrative,
      featuredBadgeIds: Array.from(selectedBadges),
      downloadCount: 0,
      viewCount: 0,
    };
    setExportsMap(prev => ({
      ...prev,
      [player.id]: [newExport, ...(prev[player.id] ?? [])],
    }));
    setBuilderOpen(false);
    toast.success(`Export sent to ${player.name.split(" ")[0]}'s family for approval`);
  }

  function handleRevoke(exportId: string) {
    setExportsMap(prev => ({
      ...prev,
      [player.id]: (prev[player.id] ?? []).filter(e => e.id !== exportId),
    }));
    toast.success("Export access revoked");
  }

  const wc = wordCount(narrative);

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        <PageHeader
          eyebrow="Recruiting"
          title="Export Builder"
          subtitle="Build verified recruiting packages for your athletes"
          actions={
            <Button
              onClick={openBuilder}
              style={{ background: PRIMARY, color: "white", minHeight: 44 }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> New Export
            </Button>
          }
        />

        <div className="flex gap-6 mt-2">
          {/* ── Left panel: Player selector ── */}
          <div className="w-[280px] shrink-0 space-y-1 hidden lg:block">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] font-mono mb-3 px-1">
              Roster ({MOCK_PLAYERS.length})
            </div>
            {MOCK_PLAYERS.map(p => (
              <PlayerRow
                key={p.id}
                player={p}
                selected={p.id === selectedPlayerId}
                hasApprovedExport={hasApprovedExport(p.id)}
                onClick={() => { setSelectedPlayerId(p.id); setBuilderOpen(false); }}
              />
            ))}
          </div>

          {/* ── Mobile player selector ── */}
          <div className="lg:hidden w-full mb-4">
            <select
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-[13px]"
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
            >
              {MOCK_PLAYERS.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.position} · {p.gradYear}</option>
              ))}
            </select>
          </div>

          {/* ── Right panel: Export workspace ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Section A — Player snapshot */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <div className="flex items-start gap-5 flex-wrap">
                <RadarChart scores={player.skillScores} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-2">
                    <span className="text-[22px] font-black leading-tight">{player.name}</span>
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${tierColor(player.overallTier).replace(")", " / 0.14)")}`, color: tierColor(player.overallTier) }}
                    >
                      {player.overallTier}
                    </span>
                  </div>
                  <div className="text-[13px] text-[var(--text-muted)] mb-4">
                    {player.position} · Class of {player.gradYear} · {player.height} · {player.programName}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Assessments", value: player.assessmentCount, color: PRIMARY },
                      { label: "Film Clips", value: player.filmClipCount, color: SUCCESS },
                      { label: "Badges", value: player.badgeCount, color: WARNING },
                      { label: "Coachability", value: `${player.coachabilityIndex}/10`, color: "oklch(0.72 0.20 35)" },
                    ].map(s => (
                      <div key={s.label} className="rounded-lg border border-[var(--border)] p-3 text-center">
                        <div className="text-[18px] font-black leading-none" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section B — Existing exports */}
            {exports.length > 0 && (
              <div className="space-y-3">
                <div className="text-[13px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  Prior Exports ({exports.length})
                </div>
                {exports.map(exp => (
                  <ExportCard key={exp.id} exp={exp} onRevoke={handleRevoke} />
                ))}
              </div>
            )}

            {/* Section C — Export builder */}
            {builderOpen && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                  <div>
                    <div className="text-[14px] font-bold">New Export — {player.name}</div>
                    {savedTime && (
                      <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> Saved {savedTime.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setBuilderOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Step tabs */}
                <div className="flex border-b border-[var(--border)]">
                  {([1, 2, 3, 4] as const).map(s => {
                    const labels = { 1: "Film Clips", 2: "Badges", 3: "Narrative", 4: "Review" };
                    const done = s < step;
                    return (
                      <button
                        key={s}
                        onClick={() => setStep(s)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-medium transition-all border-b-2"
                        style={{
                          borderColor: step === s ? PRIMARY : "transparent",
                          color: step === s ? PRIMARY : done ? SUCCESS : "oklch(0.45 0.01 260)",
                          minHeight: 44,
                        }}
                      >
                        {done ? <Check className="w-3.5 h-3.5" /> : <span style={{ color: "inherit" }}>{s}.</span>}
                        {labels[s]}
                      </button>
                    );
                  })}
                </div>

                <div className="p-5">
                  {/* Step 1 — Film clips */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[14px] font-semibold">Select Film Clips</div>
                          <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
                            Choose 3–5 clips that best represent this player's development.
                          </div>
                        </div>
                        <span
                          className="text-[12px] font-semibold px-2 py-1 rounded-full"
                          style={{
                            background: selectedClips.size >= 3 && selectedClips.size <= 5 ? "oklch(0.75 0.12 140 / 0.12)" : "oklch(0.78 0.16 75 / 0.12)",
                            color: selectedClips.size >= 3 && selectedClips.size <= 5 ? SUCCESS : WARNING,
                          }}
                        >
                          {selectedClips.size}/5 selected
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {clips.map(clip => (
                          <ClipCard
                            key={clip.id}
                            clip={clip}
                            selected={selectedClips.has(clip.id)}
                            onToggle={() => {
                              if (!selectedClips.has(clip.id) && selectedClips.size >= 5) {
                                toast.warning("Maximum 5 clips allowed. Remove one first.");
                                return;
                              }
                              toggleClip(clip.id);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2 — Badges */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div>
                        <div className="text-[14px] font-semibold">Feature Badges</div>
                        <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
                          Select badges to highlight. Tip: feature your most specific, evidence-backed badges.
                        </div>
                      </div>
                      {badges.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-[13px] text-[var(--text-muted)]">
                          <Award className="w-8 h-8 mx-auto mb-3 opacity-30" />
                          No badges awarded yet. Visit Badge Awards to add some.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {badges.map(badge => {
                            const sel = selectedBadges.has(badge.id);
                            return (
                              <button
                                key={badge.id}
                                onClick={() => toggleBadge(badge.id)}
                                className="flex items-start gap-3 p-4 rounded-xl border text-left transition-all"
                                style={{
                                  borderColor: sel ? PRIMARY : "var(--border)",
                                  background: sel ? "oklch(0.72 0.18 290 / 0.07)" : "var(--bg-surface)",
                                  minHeight: 44,
                                }}
                              >
                                <div className="shrink-0 mt-0.5">
                                  <BadgeIcon iconKey={badge.iconKey} size={22} color={sel ? PRIMARY : "oklch(0.50 0.02 260)"} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[13px] font-semibold">{badge.badgeName}</div>
                                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{badge.evidenceNote}</div>
                                  <div className="text-[11px] text-[var(--text-muted)] mt-1">{formatDate(badge.awardedAt)}</div>
                                </div>
                                <div className="shrink-0">
                                  {sel
                                    ? <CheckSquare className="w-4 h-4" style={{ color: PRIMARY }} />
                                    : <Square className="w-4 h-4 text-[var(--text-muted)]" />
                                  }
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3 — Narrative */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div>
                        <div className="text-[14px] font-semibold">Coach Narrative</div>
                        <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
                          Write a professional narrative about {player.name}'s development. Focus on what you've observed, not just stats.
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Textarea
                          value={narrative}
                          onChange={e => setNarrative(e.target.value)}
                          placeholder={`Write a professional narrative about ${player.name}'s development. Focus on what you've observed, not just stats.`}
                          className="resize-none text-[13px] min-h-[180px]"
                          rows={8}
                        />
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[12px] font-medium"
                            style={{ color: wc > 300 ? DANGER : wc > 250 ? WARNING : "var(--text-muted)" }}
                          >
                            {wc} / 300 words
                            {wc > 300 && <span className="ml-1.5">— Please trim to 300 words</span>}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            Appears verbatim on recruiting profile
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4 — Review */}
                  {step === 4 && (
                    <div className="space-y-5">
                      <div className="text-[14px] font-semibold">Review & Submit</div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="rounded-xl border border-[var(--border)] p-4">
                          <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                            <Film className="w-3.5 h-3.5" /> Film Clips
                          </div>
                          <div className="text-[22px] font-black" style={{ color: PRIMARY }}>{selectedClips.size}</div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-1">
                            {clips.filter(c => selectedClips.has(c.id)).map(c => c.title).join(", ").slice(0, 60)}…
                          </div>
                        </div>
                        <div className="rounded-xl border border-[var(--border)] p-4">
                          <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                            <Award className="w-3.5 h-3.5" /> Featured Badges
                          </div>
                          <div className="text-[22px] font-black" style={{ color: SUCCESS }}>{selectedBadges.size}</div>
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            {badges.filter(b => selectedBadges.has(b.id)).map(b => (
                              <BadgeIcon key={b.id} iconKey={b.iconKey} size={18} color={SUCCESS} />
                            ))}
                          </div>
                        </div>
                        <div className="rounded-xl border border-[var(--border)] p-4">
                          <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                            <Shield className="w-3.5 h-3.5" /> Narrative
                          </div>
                          <div className="text-[22px] font-black" style={{ color: WARNING }}>{wc}</div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-1">words written</div>
                        </div>
                      </div>

                      {narrative && (
                        <div className="rounded-xl border border-[var(--border)] p-4 bg-[var(--bg-base)]">
                          <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-semibold mb-2">Narrative Preview</div>
                          <p className="text-[13px] leading-relaxed italic text-[var(--text-primary)]">"{narrative}"</p>
                          <div className="text-[11px] text-[var(--text-muted)] mt-2">— Coach Marcus Grant</div>
                        </div>
                      )}

                      <div
                        className="flex items-start gap-3 rounded-xl p-4"
                        style={{ background: "oklch(0.72 0.18 290 / 0.08)", border: `1px solid ${PRIMARY.replace(")", " / 0.20)")}` }}
                      >
                        <Send className="w-4 h-4 mt-0.5 shrink-0" style={{ color: PRIMARY }} />
                        <div>
                          <div className="text-[13px] font-semibold" style={{ color: PRIMARY }}>Family Approval Required</div>
                          <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
                            Submitting will send this package to {player.name}'s family for consent before it can be shared with any recruiter.
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleSubmit}
                        style={{ background: PRIMARY, color: "white", minHeight: 44 }}
                        className="gap-2 w-full sm:w-auto"
                      >
                        <Send className="w-4 h-4" /> Submit for Family Approval
                      </Button>
                    </div>
                  )}

                  {/* Step navigation */}
                  {step < 4 && (
                    <div className="flex justify-between mt-6 pt-4 border-t border-[var(--border)]">
                      <Button
                        variant="outline"
                        onClick={() => setStep(s => Math.max(1, s - 1) as 1 | 2 | 3 | 4)}
                        disabled={step === 1}
                        style={{ minHeight: 44 }}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleNextStep}
                        style={{ background: PRIMARY, color: "white", minHeight: 44 }}
                      >
                        Continue
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No exports + builder not open */}
            {!builderOpen && exports.length === 0 && (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center">
                <Film className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
                <div className="text-[14px] font-semibold text-[var(--text-muted)] mb-1">No exports yet for {player.name}</div>
                <div className="text-[12px] text-[var(--text-muted)] mb-4">Create a verified recruiting package to share with college programs.</div>
                <Button onClick={openBuilder} style={{ background: PRIMARY, color: "white", minHeight: 44 }} className="gap-2">
                  <Plus className="w-4 h-4" /> Create First Export
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
