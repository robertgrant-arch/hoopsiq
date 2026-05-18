/**
 * DirectorOverviewPage — Program director's command center.
 * Route: /app/club/director
 *
 * Sections:
 *   1. Program Health Dashboard — 6 KPI cards with sparklines
 *   2. Team Status Grid         — one row per active team
 *   3. Compliance & Operations  — background checks, forms, payments, action items
 *   4. Recent Activity Feed     — 7-day timeline of significant program events
 */
import { useState } from "react";
import {
  Users,
  TrendingUp,
  TrendingDown,
  FileText,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  ShieldCheck,
  ChevronRight,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  Activity,
  ClipboardList,
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

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

type KpiCard = {
  id: string;
  label: string;
  value: string;
  delta: string;
  deltaPositive: boolean;
  deltaLabel: string;
  sparkline: number[];
  color: string;
  icon: "users" | "trending" | "filetext" | "dollar" | "target" | "alert";
};

const KPI_CARDS: KpiCard[] = [
  {
    id: "enrolled",
    label: "Total Enrolled Athletes",
    value: "82",
    delta: "+7",
    deltaPositive: true,
    deltaLabel: "vs last season",
    sparkline: [68, 71, 72, 75, 78, 82],
    color: PRIMARY,
    icon: "users",
  },
  {
    id: "attendance",
    label: "Overall Attendance Rate",
    value: "87%",
    delta: "+4pp",
    deltaPositive: true,
    deltaLabel: "4-week trend",
    sparkline: [79, 81, 83, 84, 86, 87],
    color: SUCCESS,
    icon: "trending",
  },
  {
    id: "forms",
    label: "Form Completion Rate",
    value: "91%",
    delta: "+6pp",
    deltaPositive: true,
    deltaLabel: "vs start of season",
    sparkline: [72, 77, 81, 85, 88, 91],
    color: SUCCESS,
    icon: "filetext",
  },
  {
    id: "payments",
    label: "Payment Current Rate",
    value: "78%",
    delta: "-3pp",
    deltaPositive: false,
    deltaLabel: "vs last month",
    sparkline: [84, 83, 82, 80, 79, 78],
    color: WARNING,
    icon: "dollar",
  },
  {
    id: "idp",
    label: "Active IDP Coverage",
    value: "74%",
    delta: "+12pp",
    deltaPositive: true,
    deltaLabel: "vs last season",
    sparkline: [48, 54, 59, 64, 70, 74],
    color: PRIMARY,
    icon: "target",
  },
  {
    id: "atrisk",
    label: "At-Risk Players",
    value: "6",
    delta: "-3",
    deltaPositive: true,
    deltaLabel: "vs last month",
    sparkline: [12, 11, 10, 9, 7, 6],
    color: DANGER,
    icon: "alert",
  },
];

type TeamRow = {
  id: string;
  name: string;
  coach: string;
  rosterSize: number;
  avgAttendance: number;
  formsComplete: number;
  lastPractice: string;
  status: "on-track" | "needs-attention";
  href: string;
};

const TEAMS: TeamRow[] = [
  {
    id: "t15u",
    name: "15U Barnegat",
    coach: "Marcus Williams",
    rosterSize: 14,
    avgAttendance: 89,
    formsComplete: 93,
    lastPractice: "May 14",
    status: "on-track",
    href: "/app/coach/roster",
  },
  {
    id: "t17u",
    name: "17U Barnegat",
    coach: "Terri Jackson",
    rosterSize: 16,
    avgAttendance: 81,
    formsComplete: 87,
    lastPractice: "May 13",
    status: "needs-attention",
    href: "/app/coach/roster",
  },
];

type ActionItem = {
  id: string;
  task: string;
  owner: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
};

const ACTION_ITEMS: ActionItem[] = [
  { id: "a1", task: "Follow up on 17 outstanding health forms",       owner: "Director",       dueDate: "May 18", priority: "high"   },
  { id: "a2", task: "Devon Reese background check expires in 22 days", owner: "Admin",          dueDate: "May 20", priority: "high"   },
  { id: "a3", task: "17U payment delinquency outreach (5 families)",   owner: "Director",       dueDate: "May 22", priority: "medium" },
  { id: "a4", task: "Q2 IDP review cycle — assign review dates",       owner: "Coach Williams", dueDate: "May 25", priority: "medium" },
  { id: "a5", task: "Spring Invitational roster confirmation",         owner: "Admin",          dueDate: "May 30", priority: "low"    },
];

type FeedEvent = {
  id: string;
  text: string;
  time: string;
  type: "practice" | "risk" | "onboarding" | "event" | "form";
  href?: string;
};

const FEED_EVENTS: FeedEvent[] = [
  {
    id: "f1",
    text: "Coach Marcus Williams submitted a practice plan for May 16",
    time: "Today, 8:14 AM",
    type: "practice",
    href: "/app/coach/practice-plans",
  },
  {
    id: "f2",
    text: "Tyler Brooks flagged as at-risk — attendance dropped below 50% this month",
    time: "Yesterday, 4:22 PM",
    type: "risk",
    href: "/app/coach/at-risk",
  },
  {
    id: "f3",
    text: "3 new families completed onboarding (Chen, Okafor, Washington families)",
    time: "May 14, 11:08 AM",
    type: "onboarding",
  },
  {
    id: "f4",
    text: "Spring Invitational registration confirmed — 12 athletes attending",
    time: "May 13, 3:45 PM",
    type: "event",
  },
  {
    id: "f5",
    text: "Angela Diaz completed background check renewal",
    time: "May 12, 9:00 AM",
    type: "form",
  },
];

/* -------------------------------------------------------------------------- */
/* SVG sparkline                                                               */
/* -------------------------------------------------------------------------- */

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const w = 80;
  const h = 28;
  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = (h - pad) - ((v - min) / range) * (h - pad * 2) + pad;
    return [x, y] as [number, number];
  });

  const pointsStr = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `M ${pts[0][0]},${h} ${pts.map(([x, y]) => `L ${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} L ${pts[pts.length - 1][0]},${h} Z`;
  const [lx, ly] = pts[pts.length - 1];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="shrink-0">
      <path d={area} fill={color} fillOpacity="0.12" />
      <polyline points={pointsStr} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx={lx.toFixed(1)} cy={ly.toFixed(1)} r="2.5" fill={color} />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 1: Program Health Dashboard                                         */
/* -------------------------------------------------------------------------- */

const ICON_MAP = {
  users:    <Users className="w-4 h-4" />,
  trending: <TrendingUp className="w-4 h-4" />,
  filetext: <FileText className="w-4 h-4" />,
  dollar:   <DollarSign className="w-4 h-4" />,
  target:   <Target className="w-4 h-4" />,
  alert:    <AlertTriangle className="w-4 h-4" />,
};

function ProgramHealthDashboard() {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
        <h2 className="text-[15px] font-bold text-foreground">Program Health</h2>
        <span className="text-[12px] text-muted-foreground">Spring 2026 · live</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {KPI_CARDS.map((kpi) => (
          <div
            key={kpi.id}
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5" style={{ color: kpi.color }}>
                {ICON_MAP[kpi.icon]}
                <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-[26px] font-bold font-mono leading-none" style={{ color: kpi.color }}>
                  {kpi.value}
                </div>
                <div
                  className="flex items-center gap-0.5 mt-1 text-[11px] font-medium"
                  style={{ color: kpi.deltaPositive ? SUCCESS : DANGER }}
                >
                  {kpi.deltaPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {kpi.delta}
                  <span className="text-muted-foreground ml-1 font-normal">{kpi.deltaLabel}</span>
                </div>
              </div>
              <MiniSparkline values={kpi.sparkline} color={kpi.color} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 2: Team Status Grid                                                 */
/* -------------------------------------------------------------------------- */

function TeamStatusGrid() {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
        <h2 className="text-[15px] font-bold text-foreground">Team Status</h2>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div
          className="hidden sm:grid gap-3 px-4 py-2.5 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          style={{ gridTemplateColumns: "1fr 140px 80px 100px 120px 100px 110px" }}
        >
          <span>Team</span>
          <span>Coach</span>
          <span>Roster</span>
          <span>Avg Att.</span>
          <span>Forms Done</span>
          <span>Last Practice</span>
          <span>Status</span>
        </div>

        {/* Rows */}
        {TEAMS.map((team) => {
          const statusColor = team.status === "on-track" ? SUCCESS : WARNING;
          return (
            <Link key={team.id} href={team.href} asChild>
              <a className="block border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                {/* Desktop row */}
                <div
                  className="hidden sm:grid gap-3 px-4 py-3 items-center"
                  style={{ gridTemplateColumns: "1fr 140px 80px 100px 120px 100px 110px", minHeight: 52 }}
                >
                  <span className="text-[13px] font-semibold text-foreground">{team.name}</span>
                  <span className="text-[13px] text-muted-foreground truncate">{team.coach}</span>
                  <span className="text-[13px] font-mono text-foreground">{team.rosterSize}</span>
                  <span
                    className="text-[13px] font-mono"
                    style={{ color: team.avgAttendance >= 85 ? SUCCESS : team.avgAttendance >= 75 ? WARNING : DANGER }}
                  >
                    {team.avgAttendance}%
                  </span>
                  <span
                    className="text-[13px] font-mono"
                    style={{ color: team.formsComplete >= 90 ? SUCCESS : team.formsComplete >= 75 ? WARNING : DANGER }}
                  >
                    {team.formsComplete}%
                  </span>
                  <span className="text-[13px] text-muted-foreground">{team.lastPractice}</span>
                  <span>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{ background: `${statusColor}18`, color: statusColor }}
                    >
                      {team.status === "on-track" ? "On Track" : "Needs Attention"}
                    </span>
                  </span>
                </div>

                {/* Mobile card */}
                <div className="sm:hidden p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[14px] font-semibold text-foreground">{team.name}</div>
                      <div className="text-[12px] text-muted-foreground">{team.coach}</div>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
                      style={{ background: `${statusColor}18`, color: statusColor }}
                    >
                      {team.status === "on-track" ? "On Track" : "Needs Attention"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[12px]">
                    <div><span className="text-muted-foreground">Roster: </span><span className="font-mono text-foreground">{team.rosterSize}</span></div>
                    <div><span className="text-muted-foreground">Att: </span><span className="font-mono" style={{ color: team.avgAttendance >= 85 ? SUCCESS : WARNING }}>{team.avgAttendance}%</span></div>
                    <div><span className="text-muted-foreground">Forms: </span><span className="font-mono" style={{ color: team.formsComplete >= 90 ? SUCCESS : WARNING }}>{team.formsComplete}%</span></div>
                  </div>
                </div>
              </a>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 3: Compliance & Operations                                          */
/* -------------------------------------------------------------------------- */

function ComplianceOperations() {
  const priorityColor = (p: ActionItem["priority"]) => {
    if (p === "high")   return DANGER;
    if (p === "medium") return WARNING;
    return SUCCESS;
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
        <h2 className="text-[15px] font-bold text-foreground">Compliance & Operations</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Background Checks */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider font-semibold">Background Checks</span>
          </div>
          <div className="text-[22px] font-bold font-mono" style={{ color: SUCCESS }}>4 / 5</div>
          <div className="text-[12px] text-muted-foreground">coaches verified</div>
          <div
            className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
            style={{ background: `${WARNING}14`, color: WARNING }}
          >
            1 expiring within 22 days
          </div>
        </div>

        {/* Outstanding Forms */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider font-semibold">Forms Outstanding</span>
          </div>
          <div className="text-[22px] font-bold font-mono" style={{ color: WARNING }}>17</div>
          <div className="text-[12px] text-muted-foreground">across all teams</div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between"><span className="text-muted-foreground">15U:</span><span className="text-foreground font-mono">8 forms</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">17U:</span><span className="text-foreground font-mono">9 forms</span></div>
          </div>
        </div>

        {/* Payments Overdue */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider font-semibold">Payments Overdue</span>
          </div>
          <div className="text-[22px] font-bold font-mono" style={{ color: DANGER }}>5</div>
          <div className="text-[12px] text-muted-foreground">families · 30+ days past due</div>
          <div
            className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold"
            style={{ background: `${DANGER}10`, color: DANGER }}
          >
            $1,250 total outstanding
          </div>
        </div>

        {/* IDP Status */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Target className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider font-semibold">IDP Coverage</span>
          </div>
          <div className="text-[22px] font-bold font-mono" style={{ color: PRIMARY }}>61 / 82</div>
          <div className="text-[12px] text-muted-foreground">players have active IDPs</div>
          <div
            className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
            style={{ background: `${WARNING}14`, color: WARNING }}
          >
            21 players need IDP setup
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[13px] font-semibold text-foreground">Action Items</span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: `${DANGER}14`, color: DANGER }}
          >
            {ACTION_ITEMS.filter(a => a.priority === "high").length} high priority
          </span>
        </div>

        <div className="divide-y divide-border">
          {ACTION_ITEMS.map((item) => {
            const pc = priorityColor(item.priority);
            return (
              <div key={item.id} className="px-4 py-3 flex items-center gap-3" style={{ minHeight: 52 }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: pc }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-foreground">{item.task}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Owner: {item.owner}</div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {item.dueDate}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 4: Recent Activity Feed                                             */
/* -------------------------------------------------------------------------- */

const FEED_ICON_MAP: Record<FeedEvent["type"], React.ReactNode> = {
  practice:   <Calendar className="w-3.5 h-3.5" />,
  risk:       <AlertTriangle className="w-3.5 h-3.5" />,
  onboarding: <CheckCircle2 className="w-3.5 h-3.5" />,
  event:      <Activity className="w-3.5 h-3.5" />,
  form:       <FileText className="w-3.5 h-3.5" />,
};

const FEED_COLOR_MAP: Record<FeedEvent["type"], string> = {
  practice:   PRIMARY,
  risk:       DANGER,
  onboarding: SUCCESS,
  event:      WARNING,
  form:       SUCCESS,
};

function RecentActivityFeed() {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
        <h2 className="text-[15px] font-bold text-foreground">Recent Activity</h2>
        <span className="text-[12px] text-muted-foreground">Last 7 days</span>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {FEED_EVENTS.map((event, i) => {
            const color = FEED_COLOR_MAP[event.type];
            const icon  = FEED_ICON_MAP[event.type];
            return (
              <div key={event.id} className="px-4 py-3 flex items-start gap-3 group">
                {/* Timeline dot + line */}
                <div className="flex flex-col items-center shrink-0 mt-0.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: `${color}14`, color }}
                  >
                    {icon}
                  </div>
                  {i < FEED_EVENTS.length - 1 && (
                    <div className="w-px flex-1 mt-1 min-h-[16px]" style={{ background: "oklch(0.55 0.02 260 / 0.15)" }} />
                  )}
                </div>

                <div className="flex-1 min-w-0 pb-1">
                  <div className="text-[13px] text-foreground leading-snug">
                    {event.text}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted-foreground">{event.time}</span>
                    {event.href && (
                      <Link href={event.href} asChild>
                        <a className="text-[11px] font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: PRIMARY }}>
                          View <ChevronRight className="w-3 h-3" />
                        </a>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Main export                                                                 */
/* -------------------------------------------------------------------------- */

export default function DirectorOverviewPage() {
  function handleExport() {
    toast.success("Report queued — you'll receive it by email within 5 minutes");
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        <PageHeader
          eyebrow="Director · Spring 2026"
          title="Program Overview"
          subtitle="Full program visibility — health, compliance, and team status at a glance."
          actions={
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold border border-border hover:border-[oklch(0.72_0.18_290_/_0.4)] transition-all"
              style={{ minHeight: 40 }}
            >
              <Download className="w-4 h-4" />
              Generate Program Report
            </button>
          }
        />

        <ProgramHealthDashboard />
        <TeamStatusGrid />
        <ComplianceOperations />
        <RecentActivityFeed />
      </div>
    </AppShell>
  );
}
