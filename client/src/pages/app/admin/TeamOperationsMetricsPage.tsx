/**
 * TeamOperationsMetricsPage — Club admin's operational health dashboard.
 * Route: /app/admin/operations-metrics
 *
 * Sections:
 *   1. Operations efficiency score (4 summary cards)
 *   2. Season setup completion funnel (SVG step-progress arcs)
 *   3. Form lifecycle tracking (table with mini SVG bars)
 *   4. Attendance tracking adoption (progress + by-team breakdown)
 *   5. Calendar & communication (side-by-side panels, SVG bars)
 *   6. Document management (table + unacknowledged callout)
 *   7. Administrative load estimation (SVG stacked bar + time-saved list)
 */
import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Calendar,
  FileText,
  Users,
  Clock,
  BarChart2,
  TrendingUp,
  Send,
  Bell,
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
const BLUE    = "oklch(0.65 0.15 230)";

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

type SetupStep = {
  label: string;
  completion: number;
  missingPrograms: string[];
};

const SETUP_STEPS: SetupStep[] = [
  { label: "Roster import",              completion: 97, missingPrograms: ["14U Select B"] },
  { label: "Forms created",             completion: 89, missingPrograms: ["14U Select B", "12U Development"] },
  { label: "Calendar configured",       completion: 84, missingPrograms: ["14U Select B", "12U Development", "11U Intro"] },
  { label: "Communication templates",   completion: 71, missingPrograms: ["14U Select B", "12U Development", "11U Intro", "10U Intro", "13U Blue"] },
  { label: "Goals/benchmarks set",      completion: 58, missingPrograms: ["14U Select B", "12U Development", "11U Intro", "10U Intro", "13U Blue", "12U Select", "14U Red", "15U B", "16U Gold"] },
];

type Form = {
  id: string;
  name: string;
  distributed: number;
  completed: number;
  deadline: string;
  status: "complete" | "in-progress" | "overdue";
};

const FORMS: Form[] = [
  { id: "f1", name: "Physical/Medical Release",      distributed: 184, completed: 178, deadline: "Sep 15",  status: "complete"    },
  { id: "f2", name: "Emergency Contact Update",      distributed: 184, completed: 162, deadline: "Sep 15",  status: "complete"    },
  { id: "f3", name: "Photo/Video Release",           distributed: 184, completed: 141, deadline: "Oct 1",   status: "complete"    },
  { id: "f4", name: "Season Commitment Agreement",   distributed: 184, completed: 128, deadline: "May 20",  status: "in-progress" },
  { id: "f5", name: "Player Assessment Consent",     distributed: 184, completed: 97,  deadline: "May 1",   status: "overdue"     },
  { id: "f6", name: "Recruiting Profile Opt-In",     distributed: 184, completed: 84,  deadline: "Apr 30",  status: "overdue"     },
  { id: "f7", name: "Summer Camp Registration",      distributed: 184, completed: 61,  deadline: "Jun 1",   status: "in-progress" },
];

type TeamAttendance = {
  name: string;
  pct: number;
  inHoopsIQ: boolean;
};

const TEAM_ATTENDANCE: TeamAttendance[] = [
  { name: "17U Premier",  pct: 100, inHoopsIQ: true  },
  { name: "16U Premier",  pct: 94,  inHoopsIQ: true  },
  { name: "16U Gold",     pct: 82,  inHoopsIQ: true  },
  { name: "15U Premier",  pct: 78,  inHoopsIQ: true  },
  { name: "14U Select",   pct: 61,  inHoopsIQ: true  },
  { name: "13U Select",   pct: 44,  inHoopsIQ: false },
  { name: "12U Dev",      pct: 31,  inHoopsIQ: false },
  { name: "11U Intro",    pct: 12,  inHoopsIQ: false },
];

type CalendarSync = { team: string; pct: number };

const CALENDAR_SYNC: CalendarSync[] = [
  { team: "17U Premier", pct: 89 },
  { team: "16U Premier", pct: 78 },
  { team: "16U Gold",    pct: 71 },
  { team: "15U Premier", pct: 68 },
  { team: "14U Select",  pct: 57 },
  { team: "13U Select",  pct: 44 },
  { team: "12U Dev",     pct: 32 },
];

type Announcement = {
  id: string;
  title: string;
  sent: string;
  openRate: number;
};

const ANNOUNCEMENTS: Announcement[] = [
  { id: "a1", title: "Spring season schedule released",       sent: "May 10", openRate: 81 },
  { id: "a2", title: "Tournament weekend logistics",          sent: "May 4",  openRate: 74 },
  { id: "a3", title: "Assessment results published",          sent: "Apr 28", openRate: 68 },
  { id: "a4", title: "Summer camp early registration open",   sent: "Apr 20", openRate: 62 },
  { id: "a5", title: "Coach Thompson coaching clinic invite", sent: "Apr 14", openRate: 49 },
];

type Document = {
  id: string;
  name: string;
  recipients: number;
  acknowledged: number;
  deadline: string;
  deadlinePassed: boolean;
  required: boolean;
};

const DOCUMENTS: Document[] = [
  { id: "d1", name: "2025–26 Code of Conduct",           recipients: 184, acknowledged: 171, deadline: "Sep 30",  deadlinePassed: true,  required: true  },
  { id: "d2", name: "Travel Policy Acknowledgment",      recipients: 184, acknowledged: 158, deadline: "Oct 15",  deadlinePassed: true,  required: true  },
  { id: "d3", name: "Social Media Policy",               recipients: 184, acknowledged: 142, deadline: "Oct 15",  deadlinePassed: true,  required: false },
  { id: "d4", name: "Financial Aid Policy",              recipients: 48,  acknowledged: 41,  deadline: "Nov 1",   deadlinePassed: true,  required: true  },
  { id: "d5", name: "Recruiting Participation Agreement",recipients: 184, acknowledged: 127, deadline: "Jan 15",  deadlinePassed: true,  required: true  },
  { id: "d6", name: "Spring Tournament Waiver",          recipients: 184, acknowledged: 156, deadline: "Apr 1",   deadlinePassed: true,  required: true  },
  { id: "d7", name: "End-of-Season Survey",              recipients: 184, acknowledged: 68,  deadline: "Jun 15",  deadlinePassed: false, required: false },
];

type TimeSaving = {
  label: string;
  hoursPerWeek: number;
  color: string;
};

const TIME_SAVINGS: TimeSaving[] = [
  { label: "Manual attendance tracking",      hoursPerWeek: 2.4, color: PRIMARY  },
  { label: "Form distribution & chasing",     hoursPerWeek: 3.1, color: SUCCESS  },
  { label: "Schedule communications",         hoursPerWeek: 1.8, color: BLUE     },
  { label: "Profile assembly for recruiting", hoursPerWeek: 4.2, color: WARNING  },
];

const TOTAL_HOURS = TIME_SAVINGS.reduce((s, t) => s + t.hoursPerWeek, 0);

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function completionColor(pct: number, target?: number): string {
  const threshold = target ?? 80;
  if (pct >= threshold)      return SUCCESS;
  if (pct >= threshold - 10) return WARNING;
  return DANGER;
}

function formStatusColor(s: Form["status"]): string {
  if (s === "complete")    return SUCCESS;
  if (s === "in-progress") return WARNING;
  return DANGER;
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

/** Large efficiency summary card. */
function EfficiencyCard({
  icon: Icon,
  label,
  value,
  unit,
  note,
  met,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit: string;
  note: string;
  met: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <span
          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={
            met
              ? { background: `${SUCCESS.replace(")", " / 0.14)")}`, color: SUCCESS }
              : { background: `${WARNING.replace(")", " / 0.14)")}`, color: WARNING }
          }
        >
          {met ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          {met ? "On target" : "Needs attention"}
        </span>
      </div>
      <div>
        <div
          className="text-[32px] font-bold leading-none"
          style={{ color: met ? SUCCESS : WARNING, fontFamily: "Oswald, system-ui" }}
        >
          {value}
          <span className="text-[16px] ml-1 opacity-70">{unit}</span>
        </div>
        <div className="text-[13px] font-semibold mt-1">{label}</div>
        <div className="text-[12px] text-muted-foreground mt-0.5">{note}</div>
      </div>
    </div>
  );
}

/** SVG arc for setup step completion. */
function SetupArc({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const r   = (size - 8) / 2;
  const cx  = size / 2;
  const cy  = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="oklch(0.22 0.005 260)" strokeWidth={6} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
      />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="oklch(0.96 0.003 260)" fontFamily="Oswald, system-ui">
        {pct}%
      </text>
    </svg>
  );
}

/** Mini inline SVG completion bar for forms table. */
function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <svg width={80} height={8} viewBox="0 0 80 8" aria-hidden>
      <rect x={0} y={0} width={80} height={8} rx={4} fill="oklch(0.22 0.005 260)" />
      <rect x={0} y={0} width={Math.max(4, pct * 0.8)} height={8} rx={4} fill={color} opacity={0.9} />
    </svg>
  );
}

/** SVG horizontal bar for calendar sync / open rates. */
function HBar({
  value,
  max = 100,
  color,
  width = 200,
  benchmarkPct,
}: {
  value: number;
  max?: number;
  color: string;
  width?: number;
  benchmarkPct?: number;
}) {
  const barW = (value / max) * width;
  const benchX = benchmarkPct !== undefined ? (benchmarkPct / max) * width : undefined;

  return (
    <svg width={width} height={16} viewBox={`0 0 ${width} 16`} aria-hidden>
      <rect x={0} y={4} width={width} height={8} rx={4} fill="oklch(0.22 0.005 260)" />
      <rect x={0} y={4} width={Math.max(4, barW)} height={8} rx={4} fill={color} opacity={0.88} />
      {benchX !== undefined && (
        <line x1={benchX} y1={0} x2={benchX} y2={16} stroke={MUTED} strokeWidth={1.5} strokeDasharray="2 2" />
      )}
    </svg>
  );
}

function StackedTimeBarFixed() {
  const W = 420;
  const H = 32;
  const segments = TIME_SAVINGS.map((t, idx) => ({
    ...t,
    idx,
    w: (t.hoursPerWeek / TOTAL_HOURS) * W,
  }));

  let cx = 0;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 280 }}>
      {segments.map((seg) => {
        const xStart = cx;
        cx += seg.w;
        const isFirst = seg.idx === 0;
        const isLast  = seg.idx === segments.length - 1;
        return (
          <rect
            key={seg.label}
            x={xStart}
            y={0}
            width={seg.w - (isLast ? 0 : 2)}
            height={H}
            rx={isFirst || isLast ? 6 : 0}
            fill={seg.color}
            opacity={0.88}
          />
        );
      })}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function TeamOperationsMetricsPage() {
  const [expandedForm, setExpandedForm] = useState<string | null>(null);

  function handleAction(msg: string) {
    toast.success(msg);
  }

  // Programs completed all 5 steps
  const allStepsCount = 14;
  const totalPrograms = 47;

  const criticalUnacknowledged = DOCUMENTS.filter(
    (d) => d.required && d.acknowledged / d.recipients < 0.8,
  );

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-10">
        <PageHeader
          eyebrow="Operations"
          title="Team Operations Metrics"
          subtitle="Platform efficiency — is HoopsIQ reducing your administrative overhead?"
        />

        {/* ── Section 1: Efficiency Score Cards ────────────────────────────── */}
        <section aria-labelledby="efficiency-heading">
          <h2 id="efficiency-heading" className="text-[15px] font-semibold mb-4">
            Operations Efficiency
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <EfficiencyCard
              icon={Clock}
              label="Time-to-Roster"
              value="5.2"
              unit="days avg"
              note="Target: < 7 days from signup"
              met={true}
            />
            <EfficiencyCard
              icon={FileText}
              label="Form Completion Rate"
              value="84%"
              unit="on time"
              note="Target: 85% — just below"
              met={false}
            />
            <EfficiencyCard
              icon={Calendar}
              label="Calendar Sync Rate"
              value="71%"
              unit="families"
              note="Target: 60% — exceeded"
              met={true}
            />
            <EfficiencyCard
              icon={CheckCircle2}
              label="Document Acknowledgment"
              value="78%"
              unit="in window"
              note="Target: 80% — close"
              met={false}
            />
          </div>
        </section>

        {/* ── Section 2: Season Setup Funnel ───────────────────────────────── */}
        <section aria-labelledby="setup-funnel-heading">
          <h2 id="setup-funnel-heading" className="text-[15px] font-semibold mb-2">
            Season Setup — Step Completion
          </h2>
          <p className="text-[13px] text-muted-foreground mb-5">
            Programs that complete all 5 steps have 40% lower early churn. Currently{" "}
            <strong style={{ color: SUCCESS }}>{allStepsCount}</strong> of {totalPrograms} programs (
            {Math.round((allStepsCount / totalPrograms) * 100)}%) have completed all steps.
          </p>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-0 sm:justify-between">
              {SETUP_STEPS.map((step, i) => {
                const col = completionColor(step.completion, 75);
                const isLast = i === SETUP_STEPS.length - 1;
                return (
                  <div key={step.label} className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 flex-1 min-w-0">
                    <SetupArc pct={step.completion} color={col} size={60} />
                    <div className="sm:text-center min-w-0">
                      <div className="text-[12px] font-semibold leading-tight">{step.label}</div>
                      {step.completion < 80 && (
                        <div
                          className="text-[10px] mt-0.5"
                          style={{ color: col }}
                          title={`Missing: ${step.missingPrograms.join(", ")}`}
                        >
                          {step.missingPrograms.length} program
                          {step.missingPrograms.length > 1 ? "s" : ""} missing
                          {isLast && <span style={{ color: DANGER }}> ← needs attention</span>}
                        </div>
                      )}
                    </div>
                    {i < SETUP_STEPS.length - 1 && (
                      <div className="hidden sm:block h-px flex-1 bg-border" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Section 3: Form Lifecycle ─────────────────────────────────────── */}
        <section aria-labelledby="forms-heading">
          <h2 id="forms-heading" className="text-[15px] font-semibold mb-4">
            Active Forms Status
          </h2>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    {["Form Name", "Distributed", "Completed", "Rate", "Deadline", "Status"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {FORMS.map((f, i) => {
                    const pct      = Math.round((f.completed / f.distributed) * 100);
                    const statusC  = formStatusColor(f.status);
                    const isOverdue = f.status === "overdue";

                    return (
                      <tr
                        key={f.id}
                        className={`${i < FORMS.length - 1 ? "border-b border-border" : ""} ${isOverdue ? "bg-danger/5" : ""}`}
                        style={isOverdue ? { background: `${DANGER.replace(")", " / 0.05)")}` } : undefined}
                      >
                        <td className="px-4 py-3.5 font-medium max-w-[180px]">
                          <span className="block truncate">{f.name}</span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-muted-foreground">{f.distributed}</td>
                        <td className="px-4 py-3.5 font-mono">{f.completed}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <MiniBar pct={pct} color={completionColor(pct)} />
                            <span className="font-mono text-[12px]" style={{ color: completionColor(pct) }}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">{f.deadline}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{
                              background: `${statusC.replace(")", " / 0.14)")}`,
                              color:       statusC,
                            }}
                          >
                            {f.status.replace("-", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {isOverdue && (
                            <button
                              onClick={() => handleAction(`Reminder sent for: ${f.name}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-border hover:bg-muted/40 transition-colors whitespace-nowrap"
                            >
                              <Send className="w-3 h-3" />
                              Send reminder
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Section 4: Attendance Tracking Adoption ───────────────────────── */}
        <section aria-labelledby="attendance-heading">
          <h2 id="attendance-heading" className="text-[15px] font-semibold mb-2">
            Attendance Tracking Adoption
          </h2>
          <p className="text-[13px] text-muted-foreground mb-5">
            Are coaches using HoopsIQ as the attendance system of record?
          </p>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            {/* Overall */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <div className="text-[32px] font-bold leading-none" style={{ color: WARNING, fontFamily: "Oswald, system-ui" }}>
                  74%
                </div>
                <div className="text-[13px] font-semibold mt-1">
                  of practices/events have attendance recorded in HoopsIQ
                </div>
                <div className="text-[12px] text-muted-foreground mt-0.5">Target: 80%</div>
              </div>
              <div className="flex-1 max-w-xs">
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: "74%", background: WARNING }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>0%</span>
                  <span className="font-semibold" style={{ color: MUTED }}>80% target</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div
              className="rounded-lg px-4 py-3 text-[12px] border"
              style={{
                borderColor: `${WARNING.replace(")", " / 0.30)")}`,
                background:  `${WARNING.replace(")", " / 0.07)")}`,
                color:       "oklch(0.85 0.05 80)",
              }}
            >
              Attendance data powers the coachability index. Gaps mean inaccurate player profiles and
              unreliable IDP status calculations.
            </div>

            {/* By-team breakdown */}
            <div>
              <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-3">
                By Team
              </div>
              <div className="space-y-2.5">
                {TEAM_ATTENDANCE.map((t) => {
                  const col = t.inHoopsIQ ? (t.pct >= 80 ? SUCCESS : WARNING) : DANGER;
                  return (
                    <div key={t.name} className="flex items-center gap-3">
                      <span className="text-[12px] w-28 shrink-0 text-muted-foreground">{t.name}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[200px]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${t.pct}%`, background: col }}
                        />
                      </div>
                      <span className="font-mono text-[12px] w-10 shrink-0" style={{ color: col }}>
                        {t.pct}%
                      </span>
                      {!t.inHoopsIQ && (
                        <span className="text-[10px] text-muted-foreground italic">tracking elsewhere</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 5: Calendar & Communication ──────────────────────────── */}
        <section aria-labelledby="cal-comm-heading">
          <h2 id="cal-comm-heading" className="text-[15px] font-semibold mb-4">
            Calendar &amp; Communication
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Calendar sync */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 text-[14px] font-semibold">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Calendar Sync Rate
              </div>
              <div className="space-y-3">
                {CALENDAR_SYNC.map((cs) => {
                  const col = completionColor(cs.pct, 60);
                  return (
                    <div key={cs.team} className="flex items-center gap-3">
                      <span className="text-[12px] w-28 shrink-0 text-muted-foreground">{cs.team}</span>
                      <HBar value={cs.pct} color={col} width={160} benchmarkPct={60} />
                      <span className="font-mono text-[12px] shrink-0" style={{ color: col }}>
                        {cs.pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                <span className="inline-block w-8 h-px bg-muted" />
                60% target benchmark
              </div>
            </div>

            {/* Communication open rates */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 text-[14px] font-semibold">
                <Bell className="w-4 h-4 text-muted-foreground" />
                Communication Open Rates
              </div>
              <div className="space-y-3">
                {ANNOUNCEMENTS.map((a) => {
                  const col = completionColor(a.openRate, 65);
                  return (
                    <div key={a.id} className="space-y-1">
                      <div className="flex justify-between text-[12px]">
                        <span className="truncate text-muted-foreground pr-2" title={a.title}>
                          {a.title}
                        </span>
                        <span className="shrink-0 font-mono" style={{ color: col }}>
                          {a.openRate}%
                        </span>
                      </div>
                      <HBar value={a.openRate} color={col} width={220} benchmarkPct={65} />
                    </div>
                  );
                })}
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                <span className="inline-block w-8 h-px bg-muted" />
                65% benchmark open rate
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 6: Document Management ───────────────────────────────── */}
        <section aria-labelledby="docs-heading">
          <h2 id="docs-heading" className="text-[15px] font-semibold mb-4">
            Document Management
          </h2>

          {/* Critical unacknowledged */}
          {criticalUnacknowledged.length > 0 && (
            <div
              className="rounded-xl border px-4 py-3 mb-4 space-y-2"
              style={{
                borderColor: `${DANGER.replace(")", " / 0.30)")}`,
                background:  `${DANGER.replace(")", " / 0.07)")}`,
              }}
            >
              <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: DANGER }}>
                <AlertTriangle className="w-4 h-4" />
                Unacknowledged Critical Documents
              </div>
              {criticalUnacknowledged.map((d) => {
                const pct = Math.round((d.acknowledged / d.recipients) * 100);
                return (
                  <div key={d.id} className="flex items-center justify-between text-[12px]">
                    <span>
                      {d.name} —{" "}
                      <span style={{ color: DANGER }}>{pct}% acknowledged</span>{" "}
                      <span className="text-muted-foreground">
                        ({d.recipients - d.acknowledged} outstanding)
                      </span>
                    </span>
                    <button
                      onClick={() => handleAction(`Reminder sent for unacknowledged: ${d.name}`)}
                      className="flex items-center gap-1.5 ml-4 px-3 py-1 rounded-lg border border-border text-[11px] font-medium hover:bg-muted/40 transition-colors shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      Send to unacknowledged
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    {["Document", "Recipients", "Acknowledged", "Rate", "Deadline Passed?"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {DOCUMENTS.map((d, i) => {
                    const pct  = Math.round((d.acknowledged / d.recipients) * 100);
                    const col  = completionColor(pct);
                    const warn = d.required && pct < 80;
                    return (
                      <tr
                        key={d.id}
                        className={i < DOCUMENTS.length - 1 ? "border-b border-border" : ""}
                        style={warn ? { background: `${DANGER.replace(")", " / 0.04)")}` } : undefined}
                      >
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{d.name}</span>
                            {d.required && (
                              <span
                                className="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-semibold"
                                style={{ background: `${PRIMARY.replace(")", " / 0.14)")}`, color: PRIMARY }}
                              >
                                Required
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-muted-foreground">{d.recipients}</td>
                        <td className="px-4 py-3.5 font-mono">{d.acknowledged}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <MiniBar pct={pct} color={col} />
                            <span className="font-mono text-[12px]" style={{ color: col }}>{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {d.deadlinePassed ? (
                            <span className="text-[12px] text-muted-foreground">Yes — {d.deadline}</span>
                          ) : (
                            <span className="text-[12px]" style={{ color: SUCCESS }}>No — due {d.deadline}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {warn && (
                            <button
                              onClick={() => handleAction(`Reminder sent for unacknowledged: ${d.name}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-border hover:bg-muted/40 transition-colors whitespace-nowrap"
                            >
                              <Send className="w-3 h-3" />
                              Send to unacknowledged
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Section 7: Administrative Load Estimation ─────────────────────── */}
        <section aria-labelledby="admin-load-heading">
          <h2 id="admin-load-heading" className="text-[15px] font-semibold mb-2">
            What HoopsIQ Replaced
          </h2>
          <p className="text-[13px] text-muted-foreground mb-5">
            Estimated administrative overhead eliminated. Based on program size and activity.
          </p>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
            {/* Total headline */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <div
                  className="text-[40px] font-bold leading-none"
                  style={{ color: PRIMARY, fontFamily: "Oswald, system-ui" }}
                >
                  ~{TOTAL_HOURS.toFixed(1)}
                </div>
                <div className="text-[14px] font-semibold mt-1">
                  hours/week of administrative overhead eliminated
                </div>
                <div className="text-[12px] text-muted-foreground mt-0.5">
                  Plus 4.2 hrs/week saved per recruiting season for profile assembly
                </div>
              </div>
            </div>

            {/* Stacked bar */}
            <div className="overflow-x-auto">
              <StackedTimeBarFixed />
            </div>

            {/* Legend + breakdown */}
            <div className="grid sm:grid-cols-2 gap-3">
              {TIME_SAVINGS.map((t) => (
                <div key={t.label} className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ background: t.color }}
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium">{t.label}</div>
                    <div className="text-[12px] text-muted-foreground">
                      {t.hoursPerWeek} hrs/week saved
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
