/**
 * GameDayPage — /app/coach/scouting/:opponentId/game-plan
 *
 * Game-day quick view for coaches:
 *  - Countdown to tip-off
 *  - Three keys to the game
 *  - Primary matchup assignments at a glance
 *  - Scout tendencies ranked by severity
 *  - Last-minute notes (editable)
 *  - Link to full scout report + practice plan
 *
 * Acceptance criterion: dashboard game-prep lane links here when report is
 * incomplete and game is within 48 hours.
 */

import React, { useState } from "react";
import { Link, useParams } from "wouter";
import {
  ChevronLeft,
  Trophy,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Shield,
  Zap,
  Users,
  Target,
  BookOpen,
  Crosshair,
  Dumbbell,
  ArrowRight,
  Printer,
  Edit3,
  Check,
  Flame,
  Star,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { toast } from "sonner";
import {
  mockOpponents,
  mockScoutReports,
  teamColor,
  SEVERITY_COLOR,
  TENDENCY_CAT_LABEL,
  type ScoutReport,
  type Severity,
  type TendencyCategory,
} from "@/features/scouting/mock";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT  = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatGameDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function hoursUntil(iso: string): number {
  const gameMs = new Date(iso + "T19:00:00").getTime(); // assume 7 PM tip-off
  return Math.max(0, Math.round((gameMs - Date.now()) / (1000 * 60 * 60)));
}

function countdownLabel(hours: number): string {
  if (hours < 1)  return "TIP-OFF IMMINENT";
  if (hours < 24) return `${hours}h to tip-off`;
  const days = Math.floor(hours / 24);
  const rem  = hours % 24;
  return `${days}d ${rem}h to tip-off`;
}

function countdownColor(hours: number): string {
  if (hours < 12)  return DANGER;
  if (hours < 36)  return WARNING;
  return ACCENT;
}

function threatStars(level: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className="w-3 h-3"
      style={i < level
        ? { fill: "oklch(0.78 0.16 75)", color: "oklch(0.78 0.16 75)" }
        : { color: "oklch(0.30 0.01 260)" }}
    />
  ));
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHead({
  label,
  icon,
  count,
}: {
  label: string;
  icon: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{ color: MUTED }}>{icon}</span>
      <span className="text-[10px] font-mono uppercase tracking-[0.12em]" style={{ color: MUTED }}>
        {label}
      </span>
      {count != null && (
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{ background: "oklch(0.20 0.01 260)", color: MUTED }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

// ─── Countdown hero ────────────────────────────────────────────────────────────

function CountdownHero({
  report,
  opponentName,
  hue,
}: {
  report: ScoutReport;
  opponentName: string;
  hue: number;
}) {
  const c = teamColor(hue);
  const hours = report.gameDate ? hoursUntil(report.gameDate) : null;
  const color = hours != null ? countdownColor(hours) : MUTED;

  return (
    <div
      className="rounded-2xl border p-6 relative overflow-hidden"
      style={{ borderColor: c.border, background: `oklch(0.12 0.01 ${hue})` }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, oklch(0.35 0.12 ${hue} / 0.15) 0%, transparent 60%)`,
        }}
      />

      <div className="relative space-y-3">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 text-[11px]" style={{ color: MUTED }}>
          <Trophy className="w-3.5 h-3.5" />
          Game Day Quick View
        </div>

        {/* Opponent */}
        <div>
          <h1 className="text-[28px] font-bold leading-tight" style={{ color: c.dot }}>
            vs. {opponentName}
          </h1>
          {report.gameDate && (
            <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
              {formatGameDate(report.gameDate)}
            </p>
          )}
        </div>

        {/* Countdown */}
        {hours != null && (
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[20px] tabular-nums"
              style={{ background: `${color} / 0.10`, color, borderColor: `${color} / 0.25` }}
            >
              <Clock className="w-5 h-5" />
              {countdownLabel(hours)}
            </div>
            {hours <= 48 && report.status === "draft" && (
              <div
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-semibold"
                style={{
                  borderColor: WARNING.replace(")", " / 0.30)"),
                  background: WARNING.replace(")", " / 0.06)"),
                  color: WARNING,
                }}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Report is draft — finalize before tip-off
              </div>
            )}
          </div>
        )}

        {/* Status row */}
        <div className="flex items-center gap-3 pt-1 flex-wrap text-[12px]">
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold"
            style={
              report.status === "final"
                ? { background: SUCCESS.replace(")", " / 0.12)"), color: SUCCESS }
                : { background: WARNING.replace(")", " / 0.10)"), color: WARNING }
            }
          >
            {report.status === "final"
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> Final</>
              : <><AlertTriangle className="w-3.5 h-3.5" /> Draft</>
            }
          </span>
          <span style={{ color: MUTED }}>
            {report.keyPlayers.length} key players · {report.offenseTendencies.length + report.defenseTendencies.length} tendencies · {report.keysToWin.length} keys to win
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Three keys ───────────────────────────────────────────────────────────────

function ThreeKeys({ keys }: { keys: string[] }) {
  const top3 = keys.slice(0, 3);

  if (top3.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed px-4 py-6 text-center"
        style={{ borderColor: "oklch(0.25 0.01 260)" }}
      >
        <p className="text-[12px]" style={{ color: MUTED }}>
          No keys to the game set. Add them in the scout report.
        </p>
      </div>
    );
  }

  const priorityColors = [DANGER, WARNING, ACCENT];

  return (
    <div className="space-y-2">
      {top3.map((key, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl border px-4 py-3"
          style={{
            borderColor: priorityColors[i].replace(")", " / 0.25)"),
            background: priorityColors[i].replace(")", " / 0.04)"),
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-black shrink-0 mt-0.5"
            style={{ background: priorityColors[i].replace(")", " / 0.15)"), color: priorityColors[i] }}
          >
            {i + 1}
          </div>
          <p className="text-[13px] leading-snug font-medium">{key}</p>
        </div>
      ))}
      {keys.length > 3 && (
        <p className="text-[11px] px-1" style={{ color: MUTED }}>
          +{keys.length - 3} more keys — open the full report.
        </p>
      )}
    </div>
  );
}

// ─── Matchup assignments ──────────────────────────────────────────────────────

function MatchupRow({
  our,
  their,
  jersey,
  note,
  isPrimary,
}: {
  our: string;
  their: string;
  jersey: string;
  note: string;
  isPrimary: boolean;
}) {
  return (
    <div
      className="rounded-xl border px-4 py-3 space-y-2"
      style={{
        borderColor: isPrimary ? ACCENT.replace(")", " / 0.25)") : "oklch(0.22 0.01 260)",
        background: isPrimary ? ACCENT.replace(")", " / 0.04)") : "oklch(0.12 0.005 260)",
      }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: SUCCESS.replace(")", " / 0.15)"), color: SUCCESS }}
          >
            {our.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <span className="text-[13px] font-semibold">{our}</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: MUTED }} />
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: DANGER.replace(")", " / 0.15)"), color: DANGER }}
          >
            #{jersey}
          </div>
          <span className="text-[13px] font-semibold">{their}</span>
        </div>
        {isPrimary && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
            style={{ background: ACCENT.replace(")", " / 0.10)"), color: ACCENT }}
          >
            Primary
          </span>
        )}
      </div>
      <p className="text-[12px] leading-snug" style={{ color: MUTED }}>{note}</p>
    </div>
  );
}

// ─── Tendencies quick-scan ────────────────────────────────────────────────────

function TendencyPill({
  title,
  severity,
  side,
}: {
  title: string;
  severity: Severity;
  side: "offense" | "defense";
}) {
  const sc = SEVERITY_COLOR[severity];
  return (
    <div
      className="flex items-center gap-2.5 rounded-lg border px-3 py-2"
      style={{ borderColor: sc.border, background: sc.bg }}
    >
      <span style={{ color: sc.text, flexShrink: 0 }}>
        {side === "offense" ? <Flame className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
      </span>
      <span className="text-[12px] font-medium">{title}</span>
      <span
        className="text-[10px] font-semibold ml-auto shrink-0 capitalize px-1.5 py-0.5 rounded-full"
        style={{ color: sc.text, background: sc.bg }}
      >
        {severity}
      </span>
    </div>
  );
}

// ─── Last-minute notes ────────────────────────────────────────────────────────

function LastMinuteNotes() {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(
    "Remind Marcus to trail on every Hill catch.\nConfirm Jordan's foul situation before 4th quarter — limit his minutes if 4+ fouls.\nWeather report: gym might be hot — sub more in 2nd half."
  );
  const [draft, setDraft] = useState(text);

  function save() {
    setText(draft);
    setEditing(false);
    toast.success("Notes saved.");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <SectionHead label="Last-minute notes" icon={<Edit3 className="w-3.5 h-3.5" />} />
        <button
          type="button"
          onClick={() => { setEditing(!editing); setDraft(text); }}
          className="text-[11px] font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border hover:bg-muted/30 transition-colors"
        >
          <Edit3 className="w-3 h-3" />
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            rows={5}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[12.5px] leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={save}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold"
            style={{ background: ACCENT, color: "white" }}
          >
            <Check className="w-3.5 h-3.5" /> Save notes
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {text.split("\n").filter(Boolean).map((line, i) => (
            <div key={i} className="flex items-start gap-2 text-[12.5px] leading-snug">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ACCENT }} />
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Not found ────────────────────────────────────────────────────────────────

function NotFoundCard() {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center space-y-3">
      <AlertCircle className="w-8 h-8 mx-auto" style={{ color: DANGER }} />
      <p className="text-[16px] font-semibold">Scout report not found</p>
      <p className="text-[13px] text-muted-foreground">
        No scout report exists for this opponent, or the opponent wasn't found.
      </p>
      <Link href="/app/coach/scouting" asChild>
        <a className="text-[13px] font-semibold" style={{ color: ACCENT }}>
          ← Back to scouting
        </a>
      </Link>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GameDayPage(): React.ReactElement {
  const params = useParams<{ opponentId: string }>();
  const opponentId = params.opponentId ?? "";

  const opponent = mockOpponents.find((o) => o.id === opponentId);
  const report   = mockScoutReports.find((r) => r.opponentId === opponentId) ?? null;

  if (!opponent || !report) {
    return (
      <AppShell>
        <div className="px-4 pt-4 max-w-3xl mx-auto">
          <NotFoundCard />
        </div>
      </AppShell>
    );
  }

  const hue = opponent.primaryColor ? Number(opponent.primaryColor) : 220;

  // Critical + high tendencies only for quick-scan
  const criticalTendencies = [
    ...report.offenseTendencies
      .filter((t) => t.severity === "critical" || t.severity === "high")
      .map((t) => ({ ...t, side: "offense" as const })),
    ...report.defenseTendencies
      .filter((t) => t.severity === "critical" || t.severity === "high")
      .map((t) => ({ ...t, side: "defense" as const })),
  ].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1 };
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
  });

  return (
    <AppShell>
      <div className="px-4 lg:px-8 pb-24 max-w-4xl mx-auto pt-4 space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] flex-wrap" style={{ color: MUTED }}>
          <Link href="/app/coach/scouting" asChild>
            <a className="hover:text-foreground transition-colors flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              Scouting
            </a>
          </Link>
          <span>·</span>
          <Link href={`/app/coach/scouting/${opponentId}`} asChild>
            <a className="hover:text-foreground transition-colors">{opponent.name}</a>
          </Link>
          <span>·</span>
          <span className="text-foreground font-medium">Game Day</span>
        </div>

        {/* Countdown hero */}
        <CountdownHero report={report} opponentName={opponent.name} hue={hue} />

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-5">
          {/* Left */}
          <div className="space-y-5">
            {/* Three keys */}
            <div className="rounded-xl border border-border bg-card p-5">
              <SectionHead
                label="Three keys to the game"
                icon={<Target className="w-3.5 h-3.5" />}
                count={report.keysToWin.length}
              />
              <ThreeKeys keys={report.keysToWin} />
            </div>

            {/* Matchup assignments */}
            {report.matchupNotes.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <SectionHead
                  label="Matchup assignments"
                  icon={<Users className="w-3.5 h-3.5" />}
                  count={report.matchupNotes.length}
                />
                <div className="space-y-2">
                  {report.matchupNotes.map((m) => (
                    <MatchupRow
                      key={m.id}
                      our={m.ourPlayerName}
                      their={m.theirPlayerName}
                      jersey={m.theirJerseyNumber}
                      note={m.coachNote}
                      isPrimary={m.priority === "primary"}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Last-minute notes */}
            <LastMinuteNotes />
          </div>

          {/* Right */}
          <div className="space-y-4">
            {/* Threat scan */}
            {criticalTendencies.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <SectionHead
                  label="Critical tendencies"
                  icon={<AlertTriangle className="w-3.5 h-3.5" />}
                  count={criticalTendencies.length}
                />
                <div className="space-y-1.5">
                  {criticalTendencies.map((t) => (
                    <TendencyPill key={t.id} title={t.title} severity={t.severity} side={t.side} />
                  ))}
                </div>
              </div>
            )}

            {/* Key players quick-scan */}
            {report.keyPlayers.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <SectionHead
                  label="Watch list"
                  icon={<Star className="w-3.5 h-3.5" />}
                  count={report.keyPlayers.length}
                />
                <div className="space-y-3">
                  {report.keyPlayers.map((p) => (
                    <div key={p.id} className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{ background: DANGER.replace(")", " / 0.12)"), color: DANGER }}
                        >
                          #{p.jerseyNumber}
                        </div>
                        <span className="text-[13px] font-semibold">{p.name}</span>
                        <span className="text-[11px]" style={{ color: MUTED }}>{p.position}</span>
                        <div className="flex items-center gap-0.5 ml-auto">
                          {threatStars(p.threatLevel)}
                        </div>
                      </div>
                      {p.defensivePlan && (
                        <p className="text-[11.5px] leading-snug pl-9" style={{ color: MUTED }}>
                          {p.defensivePlan}
                        </p>
                      )}
                      {p.defensiveAssignment && (
                        <p className="text-[11px] pl-9 font-medium" style={{ color: SUCCESS }}>
                          Assigned: {p.defensiveAssignment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <SectionHead label="Quick actions" icon={<Zap className="w-3.5 h-3.5" />} />
              <Link href={`/app/coach/scouting/${opponentId}`} asChild>
                <a
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border hover:bg-muted/20 transition-colors text-[12px] font-medium"
                >
                  <Crosshair className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
                  Open full scout report
                  <ArrowRight className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: MUTED }} />
                </a>
              </Link>
              <Link href="/app/coach/practice-plans" asChild>
                <a
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border hover:bg-muted/20 transition-colors text-[12px] font-medium"
                >
                  <Dumbbell className="w-4 h-4 shrink-0" style={{ color: WARNING }} />
                  View practice plan
                  <ArrowRight className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: MUTED }} />
                </a>
              </Link>
              <button
                type="button"
                onClick={() => toast.success("Game-day packet ready to print.")}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border hover:bg-muted/20 transition-colors text-[12px] font-medium text-left"
              >
                <Printer className="w-4 h-4 shrink-0" style={{ color: MUTED }} />
                Print scout packet
                <ArrowRight className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: MUTED }} />
              </button>
              {report.status === "draft" && (
                <button
                  type="button"
                  onClick={() => toast.success("Report marked as final.")}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-[12px] font-semibold text-left transition-colors"
                  style={{
                    borderColor: SUCCESS.replace(")", " / 0.30)"),
                    background: SUCCESS.replace(")", " / 0.06)"),
                    color: SUCCESS,
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Mark report as final
                </button>
              )}
            </div>

            {/* Completeness indicator */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <SectionHead label="Report completeness" icon={<BookOpen className="w-3.5 h-3.5" />} />
              {[
                { label: "Game plan summary",   done: !!report.gamePlanSummary },
                { label: "Keys to the game",    done: report.keysToWin.length > 0 },
                { label: "Tendencies logged",   done: (report.offenseTendencies.length + report.defenseTendencies.length) > 0 },
                { label: "Key players added",   done: report.keyPlayers.length > 0 },
                { label: "Matchups assigned",   done: report.matchupNotes.length > 0 },
                { label: "Practice plan linked",done: !!report.linkedPracticePlanId },
                { label: "Report finalized",    done: report.status === "final" },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2.5 text-[12px]">
                  {done
                    ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: SUCCESS }} />
                    : <div className="w-4 h-4 rounded-full border-2 shrink-0" style={{ borderColor: MUTED }} />
                  }
                  <span style={{ color: done ? "inherit" : MUTED }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
