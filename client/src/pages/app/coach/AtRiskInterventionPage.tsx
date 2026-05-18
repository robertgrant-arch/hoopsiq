/**
 * AtRiskInterventionPage — At-Risk Detection & Intervention Workflow
 *
 * Sections:
 *  1. Risk summary strip (4 stat cards with filter)
 *  2. Intervention pipeline (Kanban columns)
 *  3. Player risk detail (expandable / modal)
 *  4. Automated intervention settings (collapsible)
 *  5. Historical interventions (collapsible table)
 */
import { useState, useMemo } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Phone,
  ClipboardList,
  X,
  Send,
  Settings,
  Clock,
  Activity,
  Film,
  Target,
  Calendar,
  SlidersHorizontal,
  Bell,
  UserCheck,
  BarChart2,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type RiskSignal = {
  type: "wod_compliance" | "no_app_open" | "idp_stalled" | "attendance" | "readiness" | "film_missing";
  label: string;
  severity: "warning" | "critical";
  value: string;
  daysSince?: number;
};

type AtRiskPlayer = {
  playerId: string;
  playerName: string;
  ageGroup: string;
  position: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  signals: RiskSignal[];
  daysSinceActivity: number;
  riskScore: number;
  interventionStatus: "none" | "nudge_sent" | "coach_contacted" | "resolved";
  lastCoachContact?: string;
  coachNote?: string;
  parentPhone?: string;
};

type HistoricalCase = {
  playerName: string;
  signals: string;
  daysAtRisk: number;
  resolutionMethod: string;
  daysToResolve: number;
};

/* -------------------------------------------------------------------------- */
/* Mock data — defined inline                                                  */
/* -------------------------------------------------------------------------- */

const AT_RISK_PLAYERS: AtRiskPlayer[] = [
  {
    playerId: "p3",
    playerName: "Tyler Brooks",
    ageGroup: "17U",
    position: "PF",
    riskLevel: "high",
    riskScore: 82,
    daysSinceActivity: 9,
    interventionStatus: "nudge_sent",
    lastCoachContact: "2026-05-12",
    parentPhone: "(609) 555-0143",
    coachNote: "Reached out via app nudge. No response yet. May be dealing with school stress.",
    signals: [
      {
        type: "idp_stalled",
        label: "IDP Stalled",
        severity: "critical",
        value: "No IDP activity in 9 days (threshold: 7)",
        daysSince: 9,
      },
      {
        type: "wod_compliance",
        label: "WOD Compliance",
        severity: "critical",
        value: "42% WOD completion (threshold: 60%)",
      },
      {
        type: "attendance",
        label: "Attendance Declining",
        severity: "warning",
        value: "70% attendance rate this month (was 90%)",
      },
      {
        type: "film_missing",
        label: "Film Submission Low",
        severity: "warning",
        value: "3 film observations vs. team avg 8",
      },
    ],
  },
  {
    playerId: "p9",
    playerName: "DeShawn Morris",
    ageGroup: "15U",
    position: "PF",
    riskLevel: "medium",
    riskScore: 61,
    daysSinceActivity: 7,
    interventionStatus: "none",
    parentPhone: "(732) 555-0187",
    signals: [
      {
        type: "no_app_open",
        label: "No App Activity",
        severity: "warning",
        value: "No skill log in 7 days (threshold: 5)",
        daysSince: 7,
      },
      {
        type: "film_missing",
        label: "Film Rate Low",
        severity: "warning",
        value: "4 film observations vs. team avg 9",
      },
      {
        type: "wod_compliance",
        label: "WOD Compliance Slipping",
        severity: "warning",
        value: "58% WOD completion (threshold: 60%)",
      },
    ],
  },
  {
    playerId: "p4",
    playerName: "Marcus Webb",
    ageGroup: "15U",
    position: "SG",
    riskLevel: "medium",
    riskScore: 54,
    daysSinceActivity: 14,
    interventionStatus: "none",
    parentPhone: "(609) 555-0211",
    signals: [
      {
        type: "film_missing",
        label: "Film Submission Absent",
        severity: "critical",
        value: "No film submission in 14 days",
        daysSince: 14,
      },
      {
        type: "wod_compliance",
        label: "WOD Trending Down",
        severity: "warning",
        value: "71% this week (was 85% last month)",
      },
    ],
  },
  {
    playerId: "p7",
    playerName: "Cam Porter",
    ageGroup: "17U",
    position: "C",
    riskLevel: "low",
    riskScore: 28,
    daysSinceActivity: 3,
    interventionStatus: "resolved",
    lastCoachContact: "2026-05-10",
    signals: [
      {
        type: "readiness",
        label: "Readiness Drop",
        severity: "warning",
        value: "Readiness score dipped to 54 (avg: 73) — 3 consecutive days",
        daysSince: 3,
      },
    ],
  },
  {
    playerId: "p5",
    playerName: "Isaiah Grant",
    ageGroup: "15U",
    position: "SF",
    riskLevel: "low",
    riskScore: 22,
    daysSinceActivity: 2,
    interventionStatus: "none",
    parentPhone: "(732) 555-0302",
    signals: [
      {
        type: "idp_stalled",
        label: "IDP Deadline Approaching",
        severity: "warning",
        value: "IDP milestone due in 5 days — no progress logged",
        daysSince: 2,
      },
    ],
  },
];

const HISTORICAL_CASES: HistoricalCase[] = [
  {
    playerName: "Malik Henderson",
    signals: "WOD compliance, no app activity",
    daysAtRisk: 11,
    resolutionMethod: "Coach personal message + plan adjustment",
    daysToResolve: 4,
  },
  {
    playerName: "Jaylen Scott",
    signals: "Film missing, IDP stalled",
    daysAtRisk: 8,
    resolutionMethod: "Parent call + IDP revision",
    daysToResolve: 6,
  },
  {
    playerName: "Brandon Lee",
    signals: "Attendance declining",
    daysAtRisk: 5,
    resolutionMethod: "Auto-nudge — self-corrected",
    daysToResolve: 2,
  },
  {
    playerName: "Noah Rivera",
    signals: "Low readiness, WOD gap",
    daysAtRisk: 14,
    resolutionMethod: "Coach intervention + modified schedule",
    daysToResolve: 9,
  },
];

/* -------------------------------------------------------------------------- */
/* Color helpers                                                                */
/* -------------------------------------------------------------------------- */

const DANGER  = "oklch(0.68 0.22 25)";
const WARNING = "oklch(0.78 0.16 75)";
const SUCCESS = "oklch(0.75 0.12 140)";
const PRIMARY = "oklch(0.72 0.18 290)";
const YELLOW  = "oklch(0.82 0.16 85)";

function riskColor(level: AtRiskPlayer["riskLevel"]): string {
  switch (level) {
    case "critical": return DANGER;
    case "high":     return "oklch(0.72 0.20 35)";
    case "medium":   return WARNING;
    case "low":      return YELLOW;
  }
}

function riskBg(level: AtRiskPlayer["riskLevel"]): string {
  switch (level) {
    case "critical": return "oklch(0.68 0.22 25 / 0.12)";
    case "high":     return "oklch(0.72 0.20 35 / 0.12)";
    case "medium":   return "oklch(0.78 0.16 75 / 0.12)";
    case "low":      return "oklch(0.82 0.16 85 / 0.10)";
  }
}

function signalIcon(type: RiskSignal["type"]) {
  switch (type) {
    case "wod_compliance": return <Activity className="w-4 h-4" />;
    case "no_app_open":    return <Bell className="w-4 h-4" />;
    case "idp_stalled":    return <Target className="w-4 h-4" />;
    case "attendance":     return <Calendar className="w-4 h-4" />;
    case "readiness":      return <Zap className="w-4 h-4" />;
    case "film_missing":   return <Film className="w-4 h-4" />;
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

/* -------------------------------------------------------------------------- */
/* Risk Score Gauge (SVG arc)                                                  */
/* -------------------------------------------------------------------------- */

function RiskGauge({ score }: { score: number }) {
  const R = 52;
  const cx = 64;
  const cy = 64;
  const startAngle = -210;
  const sweepTotal = 240;

  function polarToXY(angle: number) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + R * Math.cos(rad),
      y: cy + R * Math.sin(rad),
    };
  }

  function describeArc(start: number, end: number) {
    const s = polarToXY(start);
    const e = polarToXY(end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const trackStart = startAngle;
  const trackEnd = startAngle + sweepTotal;
  const fillEnd = startAngle + (score / 100) * sweepTotal;

  const fillColor =
    score >= 75 ? DANGER :
    score >= 50 ? WARNING :
    score >= 25 ? YELLOW : SUCCESS;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="128" height="96" viewBox="0 0 128 96" aria-label={`Risk score: ${score} out of 100`}>
        {/* Track */}
        <path
          d={describeArc(trackStart, trackEnd)}
          fill="none"
          stroke="oklch(0.25 0.01 260)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={describeArc(trackStart, fillEnd)}
          fill="none"
          stroke={fillColor}
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Score text */}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="22" fontWeight="700" fill={fillColor}>
          {score}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize="9" fill="oklch(0.55 0.02 260)">
          RISK SCORE
        </text>
        {/* Scale labels */}
        <text x="20" y="84" textAnchor="middle" fontSize="9" fill="oklch(0.45 0.01 260)">0</text>
        <text x="108" y="84" textAnchor="middle" fontSize="9" fill="oklch(0.45 0.01 260)">100</text>
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Activity Calendar (14-day grid)                                             */
/* -------------------------------------------------------------------------- */

function ActivityCalendar({ daysSinceActivity }: { daysSinceActivity: number }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const daysAgo = 13 - i;
    const hasActivity = daysAgo >= daysSinceActivity ? false : Math.random() > 0.3;
    return { daysAgo, hasActivity };
  });

  return (
    <div>
      <div className="text-[11px] text-muted-foreground mb-2 font-medium uppercase tracking-wide">Last 14 Days</div>
      <div className="flex gap-1.5 items-center">
        {days.map((d) => (
          <div key={d.daysAgo} className="flex flex-col items-center gap-1">
            <div
              className="w-5 h-5 rounded-full border flex items-center justify-center"
              style={{
                background: d.hasActivity ? "oklch(0.75 0.12 140 / 0.25)" : "transparent",
                borderColor: d.hasActivity ? SUCCESS : "oklch(0.28 0.01 260)",
              }}
              title={`${d.daysAgo === 0 ? "Today" : `${d.daysAgo}d ago`}: ${d.hasActivity ? "active" : "no activity"}`}
            >
              {d.hasActivity && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: SUCCESS }}
                />
              )}
            </div>
            {(d.daysAgo === 0 || d.daysAgo === 7 || d.daysAgo === 13) && (
              <span className="text-[8px] text-muted-foreground">
                {d.daysAgo === 0 ? "Today" : `${d.daysAgo}d`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Risk level badge                                                            */
/* -------------------------------------------------------------------------- */

function RiskBadge({ level }: { level: AtRiskPlayer["riskLevel"] }) {
  const label = level.charAt(0).toUpperCase() + level.slice(1);
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide"
      style={{ background: riskBg(level), color: riskColor(level) }}
    >
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Player detail modal                                                         */
/* -------------------------------------------------------------------------- */

function PlayerDetailModal({
  player,
  onClose,
  onUpdateStatus,
}: {
  player: AtRiskPlayer;
  onClose: () => void;
  onUpdateStatus: (id: string, status: AtRiskPlayer["interventionStatus"]) => void;
}) {
  const [note, setNote] = useState(player.coachNote ?? "");
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState(
    `Hey ${player.playerName.split(" ")[0]}, just checking in — how are you feeling about your training this week? Let's connect before Thursday's practice.`
  );
  const [noteSaved, setNoteSaved] = useState(false);

  function handleSaveNote() {
    setNoteSaved(true);
    toast.success("Coach note saved");
    setTimeout(() => setNoteSaved(false), 2000);
  }

  function handleSendMessage() {
    toast.success(`Message sent to ${player.playerName}`);
    onUpdateStatus(player.playerId, "coach_contacted");
    setShowMessage(false);
  }

  function handleMarkResolved() {
    onUpdateStatus(player.playerId, "resolved");
    toast.success(`${player.playerName} marked as resolved`);
    onClose();
  }

  const interventionLog = [
    { day: 1, text: "Auto-nudge sent via in-app notification" },
    ...(player.interventionStatus !== "none" ? [{ day: 3, text: "Coach alerted by system" }] : []),
    ...(player.interventionStatus === "coach_contacted" ? [{ day: 5, text: "Personal message sent by coach" }] : []),
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                style={{ background: riskBg(player.riskLevel), color: riskColor(player.riskLevel) }}
              >
                {getInitials(player.playerName)}
              </div>
              <div>
                <DialogTitle className="text-[17px] font-bold leading-tight">{player.playerName}</DialogTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[12px] text-muted-foreground">{player.position} · {player.ageGroup}</span>
                  <RiskBadge level={player.riskLevel} />
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">
          {/* Gauge + signals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center">
              <RiskGauge score={player.riskScore} />
              <div className="text-[12px] text-muted-foreground text-center mt-1">
                {player.daysSinceActivity} days since last activity
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Risk Signals ({player.signals.length})
              </div>
              <div className="space-y-2">
                {player.signals.map((sig, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg"
                    style={{ background: sig.severity === "critical" ? "oklch(0.68 0.22 25 / 0.08)" : "oklch(0.78 0.16 75 / 0.08)" }}
                  >
                    <span style={{ color: sig.severity === "critical" ? DANGER : WARNING, marginTop: 1 }}>
                      {signalIcon(sig.type)}
                    </span>
                    <div className="min-w-0">
                      <div
                        className="text-[12px] font-semibold"
                        style={{ color: sig.severity === "critical" ? DANGER : WARNING }}
                      >
                        {sig.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground leading-snug">{sig.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity calendar */}
          <div className="rounded-xl border border-border bg-card p-5">
            <ActivityCalendar daysSinceActivity={player.daysSinceActivity} />
          </div>

          {/* Intervention log */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Intervention Log
            </div>
            <div className="space-y-2">
              {interventionLog.map((entry) => (
                <div key={entry.day} className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ background: "oklch(0.72 0.18 290 / 0.15)", color: PRIMARY }}
                  >
                    {entry.day}
                  </div>
                  <span className="text-[13px]">
                    <span className="text-muted-foreground font-medium">Day {entry.day}: </span>
                    {entry.text}
                  </span>
                </div>
              ))}
              {interventionLog.length === 0 && (
                <p className="text-[13px] text-muted-foreground">No interventions yet.</p>
              )}
            </div>
          </div>

          {/* Message compose */}
          {showMessage ? (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="text-[13px] font-semibold">Personal Message</div>
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="resize-none text-[13px]"
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  style={{ background: PRIMARY, color: "white", minHeight: 44 }}
                  className="gap-2"
                >
                  <Send className="w-3.5 h-3.5" /> Send Message
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowMessage(false)} style={{ minHeight: 44 }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          {/* Quick actions */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Quick Actions
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setShowMessage(true)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-[oklch(0.72_0.18_290/0.5)] transition-colors text-center"
                style={{ minHeight: 44 }}
              >
                <MessageSquare className="w-5 h-5" style={{ color: PRIMARY }} />
                <span className="text-[11px] font-medium leading-tight">Send Personal Message</span>
              </button>
              <Link href="/app/coach/wods" asChild>
                <a
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-[oklch(0.78_0.16_75/0.5)] transition-colors text-center"
                  style={{ minHeight: 44 }}
                >
                  <ClipboardList className="w-5 h-5" style={{ color: WARNING }} />
                  <span className="text-[11px] font-medium leading-tight">Modify Plan</span>
                </a>
              </Link>
              <button
                onClick={() => {
                  toast.info(`Parent contact: ${player.parentPhone ?? "Not on file"}`);
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-[oklch(0.75_0.12_140/0.5)] transition-colors text-center"
                style={{ minHeight: 44 }}
              >
                <Phone className="w-5 h-5" style={{ color: SUCCESS }} />
                <span className="text-[11px] font-medium leading-tight">Call Parent</span>
              </button>
              <button
                onClick={handleMarkResolved}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-[oklch(0.75_0.12_140/0.5)] transition-colors text-center"
                style={{ minHeight: 44 }}
              >
                <CheckCircle2 className="w-5 h-5" style={{ color: SUCCESS }} />
                <span className="text-[11px] font-medium leading-tight">Mark Resolved</span>
              </button>
            </div>
          </div>

          {/* Coach note */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="text-[13px] font-semibold">Coach Note</div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a private note about this player's situation..."
              className="resize-none text-[13px]"
              rows={3}
            />
            <Button
              size="sm"
              variant={noteSaved ? "outline" : "default"}
              onClick={handleSaveNote}
              style={{ minHeight: 44 }}
            >
              {noteSaved ? "Saved" : "Save Note"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Kanban player card                                                          */
/* -------------------------------------------------------------------------- */

function KanbanCard({
  player,
  onClick,
  onQuickAction,
}: {
  player: AtRiskPlayer;
  onClick: () => void;
  onQuickAction: (id: string, action: "nudge" | "contact" | "resolve") => void;
}) {
  const topSignal = player.signals[0];

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-[oklch(0.72_0.18_290/0.4)] transition-all duration-150 space-y-3"
      style={{ minHeight: 44 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ background: riskBg(player.riskLevel), color: riskColor(player.riskLevel) }}
          >
            {getInitials(player.playerName)}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold truncate">{player.playerName}</div>
            <div className="text-[11px] text-muted-foreground">{player.position} · {player.ageGroup}</div>
          </div>
        </div>
        <RiskBadge level={player.riskLevel} />
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Clock className="w-3 h-3 shrink-0" />
        <span>{player.daysSinceActivity}d since activity</span>
      </div>

      {topSignal && (
        <div
          className="flex items-start gap-2 p-2 rounded-lg text-[11px]"
          style={{ background: topSignal.severity === "critical" ? "oklch(0.68 0.22 25 / 0.08)" : "oklch(0.78 0.16 75 / 0.08)" }}
        >
          <span style={{ color: topSignal.severity === "critical" ? DANGER : WARNING, marginTop: 1 }}>
            {signalIcon(topSignal.type)}
          </span>
          <span className="text-muted-foreground leading-snug">{topSignal.label}</span>
        </div>
      )}

      <div
        className="flex gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {player.interventionStatus === "none" && (
          <button
            onClick={() => onQuickAction(player.playerId, "nudge")}
            className="flex-1 text-[11px] font-medium py-1.5 rounded-lg border border-border hover:border-[oklch(0.78_0.16_75/0.5)] transition-colors"
            style={{ color: WARNING, minHeight: 44 }}
          >
            Send Nudge
          </button>
        )}
        {player.interventionStatus === "nudge_sent" && (
          <button
            onClick={() => onQuickAction(player.playerId, "contact")}
            className="flex-1 text-[11px] font-medium py-1.5 rounded-lg border border-border hover:border-[oklch(0.72_0.18_290/0.5)] transition-colors"
            style={{ color: PRIMARY, minHeight: 44 }}
          >
            Personal Outreach
          </button>
        )}
        {player.interventionStatus !== "resolved" && (
          <button
            onClick={() => onQuickAction(player.playerId, "resolve")}
            className="flex-1 text-[11px] font-medium py-1.5 rounded-lg border border-border hover:border-[oklch(0.75_0.12_140/0.5)] transition-colors"
            style={{ color: SUCCESS, minHeight: 44 }}
          >
            Resolve
          </button>
        )}
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Automated settings section                                                  */
/* -------------------------------------------------------------------------- */

function AutomatedSettings() {
  const [open, setOpen] = useState(false);
  const [wodFloor, setWodFloor] = useState(60);
  const [noAppDays, setNoAppDays] = useState(5);
  const [idpDays, setIdpDays] = useState(7);
  const [autoNudge, setAutoNudge] = useState(true);

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
        style={{ minHeight: 44 }}
      >
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-4 h-4" style={{ color: PRIMARY }} />
          <span className="text-[14px] font-semibold">Automated Intervention Settings</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-6 border-t border-border pt-5">
          {/* Auto-nudge toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px] font-medium">Auto-send nudge messages</div>
              <div className="text-[12px] text-muted-foreground">Sends an in-app notification when thresholds are crossed</div>
            </div>
            <button
              onClick={() => {
                setAutoNudge(!autoNudge);
                toast.success(`Auto-nudge ${!autoNudge ? "enabled" : "disabled"}`);
              }}
              className="relative w-12 h-6 rounded-full transition-colors shrink-0"
              style={{ background: autoNudge ? PRIMARY : "oklch(0.28 0.01 260)" }}
              aria-checked={autoNudge}
              role="switch"
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                style={{ transform: autoNudge ? "translateX(26px)" : "translateX(2px)" }}
              />
            </button>
          </div>

          {/* Threshold sliders */}
          <div className="space-y-4">
            <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Thresholds</div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[13px] font-medium">WOD Compliance Floor</label>
                <span className="text-[13px] font-mono" style={{ color: PRIMARY }}>{wodFloor}%</span>
              </div>
              <input
                type="range"
                min={30}
                max={90}
                value={wodFloor}
                onChange={(e) => setWodFloor(Number(e.target.value))}
                className="w-full h-1.5 rounded-full accent-current cursor-pointer"
                style={{ accentColor: PRIMARY }}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>30%</span><span>90%</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[13px] font-medium">No-App Days Trigger</label>
                <span className="text-[13px] font-mono" style={{ color: WARNING }}>{noAppDays} days</span>
              </div>
              <input
                type="range"
                min={2}
                max={14}
                value={noAppDays}
                onChange={(e) => setNoAppDays(Number(e.target.value))}
                className="w-full h-1.5 rounded-full cursor-pointer"
                style={{ accentColor: WARNING }}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>2 days</span><span>14 days</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[13px] font-medium">IDP Stalled Trigger</label>
                <span className="text-[13px] font-mono" style={{ color: DANGER }}>{idpDays} days</span>
              </div>
              <input
                type="range"
                min={3}
                max={21}
                value={idpDays}
                onChange={(e) => setIdpDays(Number(e.target.value))}
                className="w-full h-1.5 rounded-full cursor-pointer"
                style={{ accentColor: DANGER }}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>3 days</span><span>21 days</span>
              </div>
            </div>
          </div>

          {/* Escalation sequence */}
          <div>
            <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Escalation Sequence
            </div>
            <div className="space-y-2">
              {[
                { day: 1, label: "In-app nudge sent to player", icon: <Bell className="w-3.5 h-3.5" />, color: PRIMARY },
                { day: 3, label: "Coach alerted in dashboard", icon: <AlertTriangle className="w-3.5 h-3.5" />, color: WARNING },
                { day: 5, label: "Coach prompted to send personal message", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "oklch(0.72 0.20 35)" },
                { day: 7, label: "Program director alerted", icon: <AlertCircle className="w-3.5 h-3.5" />, color: DANGER },
              ].map((step) => (
                <div key={step.day} className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ background: `${step.color.replace(")", " / 0.15)")}`, color: step.color }}
                  >
                    {step.day}
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: step.color }}>{step.icon}</span>
                    <span className="text-[13px]">{step.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={() => toast.success("Settings saved")}
            style={{ background: PRIMARY, color: "white", minHeight: 44 }}
          >
            Save Settings
          </Button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Historical interventions section                                            */
/* -------------------------------------------------------------------------- */

function HistoricalInterventions() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
        style={{ minHeight: 44 }}
      >
        <div className="flex items-center gap-2.5">
          <BarChart2 className="w-4 h-4" style={{ color: PRIMARY }} />
          <span className="text-[14px] font-semibold">Historical Interventions</span>
          <span className="text-[11px] text-muted-foreground">({HISTORICAL_CASES.length} resolved)</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Player</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Signals</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Days at Risk</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Resolution</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Days to Resolve</th>
              </tr>
            </thead>
            <tbody>
              {HISTORICAL_CASES.map((c, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium">{c.playerName}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.signals}</td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ background: "oklch(0.68 0.22 25 / 0.10)", color: DANGER }}
                    >
                      {c.daysAtRisk}d
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{c.resolutionMethod}</td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ background: "oklch(0.75 0.12 140 / 0.10)", color: SUCCESS }}
                    >
                      {c.daysToResolve}d
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function AtRiskInterventionPage() {
  const [players, setPlayers] = useState<AtRiskPlayer[]>(AT_RISK_PLAYERS);
  const [filterLevel, setFilterLevel] = useState<AtRiskPlayer["riskLevel"] | "all">("all");
  const [selectedPlayer, setSelectedPlayer] = useState<AtRiskPlayer | null>(null);

  function updateStatus(playerId: string, status: AtRiskPlayer["interventionStatus"]) {
    setPlayers((prev) =>
      prev.map((p) => (p.playerId === playerId ? { ...p, interventionStatus: status } : p))
    );
  }

  function handleQuickAction(playerId: string, action: "nudge" | "contact" | "resolve") {
    const player = players.find((p) => p.playerId === playerId);
    if (!player) return;
    if (action === "nudge") {
      updateStatus(playerId, "nudge_sent");
      toast.success(`Nudge sent to ${player.playerName}`);
    } else if (action === "contact") {
      updateStatus(playerId, "coach_contacted");
      toast.success(`Marked as personally contacted`);
    } else {
      updateStatus(playerId, "resolved");
      toast.success(`${player.playerName} marked as resolved`);
    }
  }

  const summary = useMemo(() => ({
    critical: players.filter((p) => p.riskLevel === "critical").length,
    high:     players.filter((p) => p.riskLevel === "high").length,
    medium:   players.filter((p) => p.riskLevel === "medium").length,
    low:      players.filter((p) => p.riskLevel === "low").length,
  }), [players]);

  const filteredPlayers = useMemo(() =>
    filterLevel === "all" ? players : players.filter((p) => p.riskLevel === filterLevel),
    [players, filterLevel]
  );

  const kanbanColumns: Array<{
    id: AtRiskPlayer["interventionStatus"];
    label: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    { id: "none",            label: "Not Contacted",   icon: <AlertTriangle className="w-3.5 h-3.5" />, color: DANGER  },
    { id: "nudge_sent",      label: "Nudge Sent",      icon: <Bell className="w-3.5 h-3.5" />,          color: WARNING },
    { id: "coach_contacted", label: "Coach Reached Out", icon: <MessageSquare className="w-3.5 h-3.5" />, color: PRIMARY },
    { id: "resolved",        label: "Resolved",        icon: <CheckCircle2 className="w-3.5 h-3.5" />,  color: SUCCESS },
  ];

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-8">
        <PageHeader
          eyebrow="Coach HQ · Intervention"
          title="At-Risk Intervention"
          subtitle="Monitor engagement signals and act before players disengage. Early intervention keeps more athletes in the program."
          actions={
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.info("Running signal scan...")}
              className="gap-2"
              style={{ minHeight: 44 }}
            >
              <Activity className="w-3.5 h-3.5" />
              Scan Now
            </Button>
          }
        />

        {/* 1. Risk summary strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { level: "critical" as const, label: "Critical",     count: summary.critical, icon: <AlertCircle className="w-4 h-4" />,   color: DANGER,  bg: "oklch(0.68 0.22 25 / 0.08)"  },
            { level: "high"     as const, label: "High Risk",    count: summary.high,     icon: <AlertTriangle className="w-4 h-4" />, color: "oklch(0.72 0.20 35)", bg: "oklch(0.72 0.20 35 / 0.08)" },
            { level: "medium"   as const, label: "Medium Risk",  count: summary.medium,   icon: <Info className="w-4 h-4" />,           color: WARNING, bg: "oklch(0.78 0.16 75 / 0.08)" },
            { level: "low"      as const, label: "Low Risk",     count: summary.low,      icon: <Activity className="w-4 h-4" />,       color: YELLOW,  bg: "oklch(0.82 0.16 85 / 0.08)" },
          ].map((card) => (
            <button
              key={card.level}
              onClick={() => setFilterLevel(filterLevel === card.level ? "all" : card.level)}
              className="rounded-xl border p-5 text-left transition-all duration-150 hover:shadow-sm"
              style={{
                background: filterLevel === card.level ? card.bg : "var(--card)",
                borderColor: filterLevel === card.level ? card.color.replace(")", " / 0.5)") : "var(--border)",
                minHeight: 44,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: card.color }}>{card.icon}</span>
                {filterLevel === card.level && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: card.color }}>
                    Filtered
                  </span>
                )}
              </div>
              <div className="text-[28px] font-black leading-none" style={{ color: card.color }}>
                {card.count}
              </div>
              <div className="text-[12px] font-medium text-muted-foreground mt-1">{card.label}</div>
              {filterLevel !== card.level && (
                <div className="text-[11px] mt-1.5" style={{ color: card.color }}>
                  View →
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 2. Intervention pipeline (kanban) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold">Intervention Pipeline</h2>
            {filterLevel !== "all" && (
              <button
                onClick={() => setFilterLevel("all")}
                className="text-[12px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto">
            {kanbanColumns.map((col) => {
              const colPlayers = filteredPlayers.filter((p) => p.interventionStatus === col.id);
              return (
                <div key={col.id} className="min-w-[240px]">
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
                    style={{ background: `${col.color.replace(")", " / 0.08)")}` }}
                  >
                    <span style={{ color: col.color }}>{col.icon}</span>
                    <span className="text-[12px] font-semibold" style={{ color: col.color }}>{col.label}</span>
                    <span
                      className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: `${col.color.replace(")", " / 0.15)")}`, color: col.color }}
                    >
                      {colPlayers.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {colPlayers.map((player) => (
                      <KanbanCard
                        key={player.playerId}
                        player={player}
                        onClick={() => setSelectedPlayer(player)}
                        onQuickAction={handleQuickAction}
                      />
                    ))}
                    {colPlayers.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border p-4 text-center text-[12px] text-muted-foreground">
                        No players here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Automated intervention settings */}
        <AutomatedSettings />

        {/* 5. Historical interventions */}
        <HistoricalInterventions />
      </div>

      {/* 3. Player detail modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onUpdateStatus={updateStatus}
        />
      )}
    </AppShell>
  );
}
