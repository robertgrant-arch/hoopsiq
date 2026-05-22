import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Share2, ChevronRight, CheckCircle2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import {
  getPlayerSeasonArc,
  getPlayerTimeline,
  type TimelineEvent,
  type PlayerSeasonSummary,
} from "@/features/club-ops/mock";

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const PRIMARY    = "oklch(0.72 0.18 290)";
const SUCCESS    = "oklch(0.75 0.12 140)";
const WARNING    = "oklch(0.78 0.16 75)";
const MUTED_FG   = "oklch(0.55 0.02 260)";

// Demo: show Malik Henderson's arc
const DEMO_PLAYER_ID = "player_malik";

const SKILL_COLORS: Record<string, string> = {
  Shooting:     "oklch(0.72 0.18 290)",
  Ballhandling: "oklch(0.78 0.16 75)",
  Defense:      "oklch(0.68 0.22 25)",
  Athleticism:  "oklch(0.75 0.12 140)",
  IQ:           "oklch(0.72 0.18 200)",
  Passing:      "oklch(0.78 0.14 320)",
  Post:         "oklch(0.70 0.16 60)",
  Rebounding:   "oklch(0.72 0.14 160)",
};

const EVENT_TYPE_COLORS: Record<TimelineEvent["type"], string> = {
  assessment:   "oklch(0.72 0.18 230)",
  milestone:    SUCCESS,
  idp_goal:     "oklch(0.72 0.18 290)",
  observation:  MUTED_FG,
  film:         "oklch(0.72 0.14 200)",
  achievement:  WARNING,
  season_start: PRIMARY,
  season_end:   MUTED_FG,
};

/* -------------------------------------------------------------------------- */
/* Skill Progression Chart (SVG)                                              */
/* -------------------------------------------------------------------------- */

function SkillProgressionChart({ seasons }: { seasons: PlayerSeasonSummary[] }) {
  if (seasons.length === 0) return null;

  const W = 520;
  const H = 220;
  const PAD_LEFT   = 40;
  const PAD_RIGHT  = 100;
  const PAD_TOP    = 24;
  const PAD_BOTTOM = 36;

  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP  - PAD_BOTTOM;

  // Gather all skill keys across seasons
  const allSkills = Array.from(
    new Set(seasons.flatMap((s) => Object.keys(s.skillLevels)))
  );

  // X positions — one per season
  const xPositions = seasons.map((_, i) =>
    PAD_LEFT + (i / Math.max(seasons.length - 1, 1)) * chartW
  );

  // Y for a skill level (1-5)
  function yFor(level: number): number {
    return PAD_TOP + chartH - ((level - 1) / 4) * chartH;
  }

  // Grid lines for levels 1-5
  const gridLevels = [1, 2, 3, 4, 5];

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ maxWidth: W, minWidth: 280, display: "block" }}
        aria-label="Skill progression chart"
      >
        {/* Grid lines */}
        {gridLevels.map((lvl) => {
          const y = yFor(lvl);
          return (
            <g key={lvl}>
              <line
                x1={PAD_LEFT} y1={y} x2={PAD_LEFT + chartW} y2={y}
                stroke="oklch(0.30 0.01 260)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={PAD_LEFT - 6} y={y + 4}
                fill={MUTED_FG}
                fontSize="10"
                textAnchor="end"
                fontFamily="monospace"
              >
                {lvl}
              </text>
            </g>
          );
        })}

        {/* X axis labels */}
        {seasons.map((s, i) => (
          <text
            key={s.seasonId}
            x={xPositions[i]}
            y={H - 6}
            fill={MUTED_FG}
            fontSize="10"
            textAnchor="middle"
          >
            {s.seasonName}
          </text>
        ))}

        {/* Lines per skill */}
        {allSkills.map((skill) => {
          const color = SKILL_COLORS[skill] ?? MUTED_FG;
          const points = seasons.map((s, i) => {
            const lvl = s.skillLevels[skill] ?? null;
            if (lvl == null) return null;
            return { x: xPositions[i], y: yFor(lvl), lvl };
          });

          // Build path from non-null consecutive points
          const validPoints = points.filter(Boolean) as { x: number; y: number; lvl: number }[];
          if (validPoints.length < 1) return null;

          const d = validPoints
            .map((p, pi) => `${pi === 0 ? "M" : "L"} ${p.x} ${p.y}`)
            .join(" ");

          const lastPt = validPoints[validPoints.length - 1];

          return (
            <g key={skill}>
              {validPoints.length > 1 && (
                <path
                  d={d}
                  stroke={color}
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
              )}
              {/* Dots */}
              {validPoints.map((pt, pi) => (
                <circle
                  key={pi}
                  cx={pt.x}
                  cy={pt.y}
                  r={pi === validPoints.length - 1 ? 5 : 3.5}
                  fill={color}
                  stroke="oklch(0.14 0.01 260)"
                  strokeWidth="1.5"
                />
              ))}
              {/* End label */}
              <text
                x={lastPt.x + 8}
                y={lastPt.y + 4}
                fill={color}
                fontSize="10"
                fontWeight="600"
              >
                {skill}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat bar                                                                   */
/* -------------------------------------------------------------------------- */

function StatBar({ value, color = PRIMARY }: { value: number; color?: string }) {
  return (
    <div
      className="h-2 rounded-full overflow-hidden"
      style={{ background: "oklch(0.22 0.01 260)" }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.round(value * 100)}%`, background: color }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Season Summary Card                                                        */
/* -------------------------------------------------------------------------- */

function SeasonSummaryCard({ summary }: { summary: PlayerSeasonSummary }) {
  const skills = Object.entries(summary.skillLevels);
  const idpPct = summary.idpGoalsTotal > 0
    ? summary.idpGoalsCompleted / summary.idpGoalsTotal
    : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-6">

      {/* Skills start → end */}
      <div>
        <div className="text-[11px] uppercase tracking-[0.1em] font-semibold mb-3" style={{ color: MUTED_FG }}>
          Skill Levels
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {skills.map(([skill, level]) => {
            const color = SKILL_COLORS[skill] ?? PRIMARY;
            return (
              <div key={skill} className="flex items-center justify-between gap-2">
                <span className="text-[13px] text-muted-foreground">{skill}</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((pip) => (
                    <div
                      key={pip}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: pip <= level ? color : "oklch(0.22 0.01 260)",
                        boxShadow: pip <= level ? `0 0 4px ${color}60` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* IDP Goals */}
      <div>
        <div className="text-[11px] uppercase tracking-[0.1em] font-semibold mb-2" style={{ color: MUTED_FG }}>
          IDP Goals — {summary.idpGoalsCompleted} of {summary.idpGoalsTotal} completed
        </div>
        <div className="flex items-center gap-2 mb-2">
          {Array.from({ length: summary.idpGoalsTotal }).map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <CheckCircle2
                className="w-4 h-4"
                style={{ color: i < summary.idpGoalsCompleted ? SUCCESS : MUTED_FG }}
              />
              {i < summary.idpGoalsCompleted && (
                <span className="text-[11px]" style={{ color: SUCCESS }}>Goal {i + 1}</span>
              )}
            </div>
          ))}
        </div>
        <StatBar value={idpPct} color={SUCCESS} />
      </div>

      {/* WOD + Attendance */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] font-semibold mb-1.5" style={{ color: MUTED_FG }}>
            WOD Completion
          </div>
          <div className="text-[22px] font-bold mb-1" style={{ color: PRIMARY }}>
            {Math.round(summary.wodCompletion * 100)}%
          </div>
          <StatBar value={summary.wodCompletion} />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] font-semibold mb-1.5" style={{ color: MUTED_FG }}>
            Attendance
          </div>
          <div className="text-[22px] font-bold mb-1" style={{ color: SUCCESS }}>
            {Math.round(summary.attendanceRate * 100)}%
          </div>
          <StatBar value={summary.attendanceRate} color={SUCCESS} />
        </div>
      </div>

      {/* Coach summary */}
      <div>
        <div className="text-[11px] uppercase tracking-[0.1em] font-semibold mb-2" style={{ color: MUTED_FG }}>
          Coach Summary
        </div>
        <blockquote
          className="pl-4 py-0.5 text-[13px] text-foreground leading-relaxed italic"
          style={{ borderLeft: `3px solid ${PRIMARY}` }}
        >
          &ldquo;{summary.coachSummary}&rdquo;
        </blockquote>
      </div>

      {/* Milestone callout */}
      {summary.milestone && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            background: `${WARNING.replace(")", " / 0.12)")}`,
            border: `1px solid ${WARNING.replace(")", " / 0.30)")}`,
          }}
        >
          <span className="text-[20px]">🏆</span>
          <span className="text-[13px] font-semibold" style={{ color: WARNING }}>
            {summary.milestone}
          </span>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Timeline Event Card                                                        */
/* -------------------------------------------------------------------------- */

function TimelineEventCard({ event }: { event: TimelineEvent }) {
  const dotColor = EVENT_TYPE_COLORS[event.type] ?? MUTED_FG;
  const isHigh = event.significance === "high";

  return (
    <div className="flex gap-4">
      {/* Date */}
      <div className="w-[72px] shrink-0 pt-1 text-right">
        <span className="text-[11px]" style={{ color: MUTED_FG }}>
          {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>

      {/* Dot + line — rendered by parent */}
      <div className="w-4 shrink-0 flex flex-col items-center">
        <div
          className="w-3.5 h-3.5 rounded-full mt-1 shrink-0 z-10"
          style={{
            background: dotColor,
            boxShadow: isHigh ? `0 0 8px ${dotColor}` : "none",
            border: "2px solid oklch(0.14 0.01 260)",
          }}
        />
      </div>

      {/* Card */}
      <div
        className="flex-1 rounded-xl mb-4 p-4"
        style={
          isHigh
            ? {
                background: "oklch(0.16 0.01 260)",
                border: `1px solid ${dotColor.replace(")", " / 0.35)")}`,
              }
            : {
                background: "oklch(0.155 0.008 260)",
                border: "1px solid oklch(0.22 0.01 260)",
              }
        }
      >
        <div className="flex items-start gap-2.5">
          <span className="text-[18px] leading-tight mt-0.5 shrink-0">{event.icon}</span>
          <div className="flex-1 min-w-0">
            <div
              className="text-[13px] font-semibold leading-snug"
              style={{ color: isHigh ? "oklch(0.92 0.01 260)" : "oklch(0.80 0.01 260)" }}
            >
              {event.title}
            </div>
            <div className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
              {event.description}
            </div>
            {event.coachNote && (
              <div
                className="mt-2 pl-3 text-[11.5px] italic leading-relaxed"
                style={{
                  color: "oklch(0.72 0.04 260)",
                  borderLeft: `2px solid ${dotColor.replace(")", " / 0.40)")}`,
                }}
              >
                {event.coachNote}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function DevelopmentTimelinePage() {
  const { user } = useAuth();
  const playerId = DEMO_PLAYER_ID;

  const arc      = getPlayerSeasonArc(playerId);
  const timeline = getPlayerTimeline(playerId);

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(
    arc?.seasons[arc.seasons.length - 1]?.seasonId ?? ""
  );

  if (!arc) {
    return (
      <AppShell>
        <div className="p-6 text-center text-muted-foreground text-[14px]">
          No development data found.
        </div>
      </AppShell>
    );
  }

  const selectedSummary = arc.seasons.find((s) => s.seasonId === selectedSeasonId);

  // Career totals
  const totalFilm          = timeline.filter((e) => e.type === "film").length;
  const totalIdpCompleted  = arc.seasons.reduce((sum, s) => sum + s.idpGoalsCompleted, 0);
  const totalIdpGoals      = arc.seasons.reduce((sum, s) => sum + s.idpGoalsTotal, 0);
  const currentStreak      = user?.streak ?? 14;
  const totalSessions      = arc.seasons.reduce((sum, s) => sum + Math.round(s.wodCompletion * 60), 0);

  function handleShareTimeline() {
    const url = `${window.location.origin}/profile/${playerId}`;
    void navigator.clipboard.writeText(url).then(() => {
      toast.success("Profile link copied to clipboard");
    });
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">

        {/* Page header */}
        <PageHeader
          eyebrow="Development Timeline"
          title={arc.playerName}
          subtitle={`${arc.position} · ${arc.seasons.length} season${arc.seasons.length !== 1 ? "s" : ""} with HoopsIQ`}
          actions={
            <button
              onClick={handleShareTimeline}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
              style={{
                background: `${PRIMARY.replace(")", " / 0.12)")}`,
                color: PRIMARY,
                border: `1px solid ${PRIMARY.replace(")", " / 0.30)")}`,
                minHeight: 44,
              }}
            >
              <Share2 className="w-4 h-4" />
              Share My Timeline
            </button>
          }
        />

        {/* Career stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Sessions",    value: totalSessions,    color: PRIMARY  },
            { label: "Film Submissions",  value: totalFilm,         color: "oklch(0.72 0.14 200)" },
            { label: "IDP Goals Done",    value: `${totalIdpCompleted}/${totalIdpGoals}`, color: SUCCESS },
            { label: "Current Streak",    value: `${currentStreak}d`, color: WARNING  },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1"
            >
              <div className="text-[24px] font-bold" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-[11px] text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Skill progression chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-[11px] uppercase tracking-[0.1em] font-semibold mb-4" style={{ color: MUTED_FG }}>
            Skill Progression
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
            {Array.from(
              new Set(arc.seasons.flatMap((s) => Object.keys(s.skillLevels)))
            ).map((skill) => (
              <div key={skill} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: SKILL_COLORS[skill] ?? MUTED_FG }}
                />
                <span className="text-[11px] text-muted-foreground">{skill}</span>
              </div>
            ))}
          </div>

          <SkillProgressionChart seasons={arc.seasons} />
        </div>

        {/* Season selector tabs */}
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] font-semibold mb-3" style={{ color: MUTED_FG }}>
            Season Summary
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {arc.seasons.map((s) => {
              const active = s.seasonId === selectedSeasonId;
              return (
                <button
                  key={s.seasonId}
                  onClick={() => setSelectedSeasonId(s.seasonId)}
                  className="px-4 py-2 rounded-full text-[13px] font-medium transition-all"
                  style={{
                    minHeight: 44,
                    background: active ? `${PRIMARY.replace(")", " / 0.15)")}` : "oklch(0.18 0.005 260)",
                    color: active ? PRIMARY : MUTED_FG,
                    border: active ? `1.5px solid ${PRIMARY.replace(")", " / 0.35)")}` : "1.5px solid oklch(0.22 0.01 260)",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {s.seasonName}
                </button>
              );
            })}
          </div>

          {selectedSummary && <SeasonSummaryCard summary={selectedSummary} />}
        </div>

        {/* Full timeline */}
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] font-semibold mb-4" style={{ color: MUTED_FG }}>
            Full Career Timeline
          </div>

          {/* Container with vertical line */}
          <div className="relative">
            {/* Vertical line — positioned behind the dots */}
            <div
              className="absolute top-2 bottom-2 w-[2px] rounded-full"
              style={{
                left: 72 + 16 + 5,  // date col (72) + gap (16) + half dot width (5) — approximate center
                background: `${PRIMARY.replace(")", " / 0.20)")}`,
              }}
            />

            <div className="space-y-0">
              {timeline.map((event) => (
                <TimelineEventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </div>

        {/* Share CTA */}
        <div
          className="rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            background: `${PRIMARY.replace(")", " / 0.07)")}`,
            border: `1px solid ${PRIMARY.replace(")", " / 0.20)")}`,
          }}
        >
          <div>
            <div className="text-[15px] font-semibold">Your journey. Own it.</div>
            <div className="text-[13px] text-muted-foreground mt-0.5">
              Share your development timeline with coaches, scouts, and family.
            </div>
          </div>
          <button
            onClick={handleShareTimeline}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-[14px] font-bold shrink-0 transition-all"
            style={{
              background: PRIMARY,
              color: "oklch(0.98 0.005 290)",
              minHeight: 44,
            }}
          >
            Share My Timeline
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </AppShell>
  );
}
