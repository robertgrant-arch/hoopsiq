/**
 * ParentEngagementMetricsPage — Parent's own engagement dashboard.
 * Route: /app/parent/engagement
 *
 * Sections:
 *   1. Engagement summary (SVG donut gauge + 4 contributing factors)
 *   2. What you've done (engagement timeline)
 *   3. What you might be missing (positively-framed opportunity cards)
 *   4. Jordan's development this season (plain-language summary)
 *   5. Privacy and access overview
 *   6. Communication history (last 6 with open status)
 */
import {
  CheckCircle2,
  Clock,
  Shield,
  MessageSquare,
  Film,
  ChevronRight,
  Eye,
  Lock,
  AlertCircle,
  TrendingUp,
  Award,
  Star,
  Mail,
  MailOpen,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
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

type EngagementFactor = {
  label: string;
  value: string;
  status: "good" | "note";
  note?: string;
};

const ENGAGEMENT_FACTORS: EngagementFactor[] = [
  { label: "Reports opened",                 value: "5 of 6 (83%)", status: "good" },
  { label: "Access requests responded",      value: "3 of 3 (100%)", status: "good" },
  { label: "Privacy settings configured",    value: "Yes",           status: "good" },
  {
    label: "Coach messages initiated",
    value: "1 this season",
    status: "note",
    note: "Consider checking in more often",
  },
];

type EngagementAction = {
  id: string;
  icon: "report" | "access-approved" | "access-denied" | "privacy" | "film";
  label: string;
  date: string;
  outcome?: string;
};

const ENGAGEMENT_ACTIONS: EngagementAction[] = [
  { id: "a1", icon: "report",          label: "Opened Q1 Progress Report",                    date: "March 12"    },
  { id: "a2", icon: "access-approved", label: "Approved access request from Vermont (D2)",    date: "March 8",  outcome: "Access granted — expires Sep 1" },
  { id: "a3", icon: "privacy",         label: "Updated privacy settings",                     date: "February 20" },
  { id: "a4", icon: "report",          label: "Opened Q2 Progress Report",                    date: "April 30"    },
  { id: "a5", icon: "access-denied",   label: "Denied access request from unknown program",   date: "April 14", outcome: "Reason: Division not a fit"      },
];

type Opportunity = {
  id: string;
  title: string;
  body: string;
  action: string;
  href?: string;
};

const OPPORTUNITIES: Opportunity[] = [
  {
    id: "o1",
    title: "2 new film sessions with coach annotations",
    body: "Jordan has 2 new film sessions with coach annotations you haven't reviewed yet. Watching together helps reinforce coaching cues at home.",
    action: "Watch film sessions",
    href: "/app/parent/child",
  },
  {
    id: "o2",
    title: "Jordan's IDP has a new focus area",
    body: "Since you last logged in, Coach Grant updated Jordan's Individual Development Plan with a new defensive focus area. See what's being prioritized.",
    action: "View Jordan's IDP",
    href: "/app/parent/child",
  },
  {
    id: "o3",
    title: "3 recruiter requests pending — expire in 12 days",
    body: "3 recruiting programs have requested access to Jordan's profile. Unanswered requests expire automatically — you'll want to review them.",
    action: "Review requests",
    href: "/app/family/access-requests",
  },
];

type SkillGain = { skill: string; gain: number; note: string };

const TOP_SKILL: SkillGain = {
  skill: "Defense",
  gain:  1.8,
  note:  "Jordan's defensive positioning has been the biggest area of growth this season.",
};

const BADGES_EARNED: string[] = ["Court Vision Elite", "Defensive Specialist"];

type AccessGrant = {
  id: string;
  school: string;
  division: string;
  expires: string;
};

const ACCESS_GRANTS: AccessGrant[] = [
  { id: "ag1", school: "Vermont (D2)",        division: "D2",   expires: "Sep 1, 2026"  },
  { id: "ag2", school: "Quinnipiac (D1)",     division: "D1",   expires: "Aug 15, 2026" },
  { id: "ag3", school: "Fairfield Univ (D1)", division: "D1",   expires: "Jul 30, 2026" },
];

type Communication = {
  id: string;
  type: "announcement" | "message";
  title: string;
  from: string;
  date: string;
  opened: boolean;
};

const COMMUNICATIONS: Communication[] = [
  { id: "c1", type: "announcement", title: "Spring season schedule released",        from: "Coach Grant",    date: "May 10",  opened: true  },
  { id: "c2", type: "message",      title: "Quick note on Jordan's progress",        from: "Coach Grant",    date: "May 8",   opened: true  },
  { id: "c3", type: "announcement", title: "Tournament weekend logistics",           from: "Program Admin",  date: "May 4",   opened: true  },
  { id: "c4", type: "message",      title: "Film session from Tuesday — check out Jordan's defense", from: "Coach Rivera", date: "Apr 29", opened: false },
  { id: "c5", type: "announcement", title: "Assessment results published",           from: "Coach Grant",    date: "Apr 28",  opened: true  },
  { id: "c6", type: "announcement", title: "Summer camp early registration open",    from: "Program Admin",  date: "Apr 20",  opened: false },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function actionIcon(type: EngagementAction["icon"]) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center shrink-0";
  switch (type) {
    case "report":
      return <div className={base} style={{ background: `${PRIMARY.replace(")", " / 0.15)")}`, color: PRIMARY }}><Eye className="w-4 h-4" /></div>;
    case "access-approved":
      return <div className={base} style={{ background: `${SUCCESS.replace(")", " / 0.15)")}`, color: SUCCESS }}><CheckCircle2 className="w-4 h-4" /></div>;
    case "access-denied":
      return <div className={base} style={{ background: `${WARNING.replace(")", " / 0.15)")}`, color: WARNING }}><Shield className="w-4 h-4" /></div>;
    case "privacy":
      return <div className={base} style={{ background: `${BLUE.replace(")", " / 0.15)")}`, color: BLUE }}><Lock className="w-4 h-4" /></div>;
    case "film":
      return <div className={base} style={{ background: `${MUTED.replace(")", " / 0.20)")}`, color: MUTED }}><Film className="w-4 h-4" /></div>;
    default:
      return <div className={base} style={{ background: "oklch(0.22 0.005 260)" }}><Clock className="w-4 h-4 text-muted-foreground" /></div>;
  }
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

/** SVG donut gauge (180px). */
function EngagementDonut({ score }: { score: number }) {
  const SIZE  = 180;
  const cx    = SIZE / 2;
  const cy    = SIZE / 2;
  const r     = 70;
  const circ  = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;

  let color = DANGER;
  if (score >= 80) color = SUCCESS;
  else if (score >= 60) color = PRIMARY;
  else if (score >= 40) color = WARNING;

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-label={`Engagement score ${score} of 100`}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="oklch(0.22 0.005 260)" strokeWidth={14} />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className="text-[36px] font-bold leading-none"
          style={{ color, fontFamily: "Oswald, system-ui" }}
        >
          {score}
        </span>
        <span className="text-[12px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

/** Season comparison bar for skills. */
function SkillBar({ gain, maxGain = 3 }: { gain: number; maxGain?: number }) {
  const W   = 200;
  const pct = (gain / maxGain) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 max-w-[200px] h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: SUCCESS }}
        />
      </div>
      <span className="font-mono text-[13px] font-semibold" style={{ color: SUCCESS }}>
        +{gain}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function ParentEngagementMetricsPage() {
  const ENGAGEMENT_SCORE = 74;

  function handleAction(msg: string) {
    toast.success(msg);
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-10">
        <PageHeader
          eyebrow="Your Engagement"
          title="Family Dashboard"
          subtitle="How you're engaging with Jordan's development — and what you might be missing"
        />

        {/* ── Section 1: Engagement Summary ────────────────────────────────── */}
        <section aria-labelledby="engagement-summary-heading">
          <h2 id="engagement-summary-heading" className="text-[15px] font-semibold mb-4">
            Your family engagement score
          </h2>

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
              {/* Gauge */}
              <div className="flex flex-col items-center gap-3">
                <EngagementDonut score={ENGAGEMENT_SCORE} />
                <div className="text-center">
                  <div className="text-[14px] font-semibold">Good</div>
                  <div className="text-[13px] text-muted-foreground mt-0.5">
                    You're engaged with Jordan's development.
                  </div>
                </div>
              </div>

              {/* Contributing factors */}
              <div className="flex-1 w-full space-y-4">
                <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-2">
                  Contributing Factors
                </div>
                {ENGAGEMENT_FACTORS.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-start gap-3 rounded-xl border border-border px-4 py-3"
                  >
                    {f.status === "good" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: SUCCESS }} />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: WARNING }} />
                    )}
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium">{f.label}</div>
                      <div
                        className="text-[12px] mt-0.5"
                        style={{ color: f.status === "good" ? SUCCESS : WARNING }}
                      >
                        {f.value}
                      </div>
                      {f.note && (
                        <div className="text-[11px] text-muted-foreground mt-0.5 italic">{f.note}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 2: What You've Done ───────────────────────────────────── */}
        <section aria-labelledby="engagement-history-heading">
          <h2 id="engagement-history-heading" className="text-[15px] font-semibold mb-4">
            What You've Done
          </h2>

          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {ENGAGEMENT_ACTIONS.map((a) => (
              <div key={a.id} className="flex items-start gap-4 px-5 py-4">
                {actionIcon(a.icon)}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium">{a.label}</div>
                  {a.outcome && (
                    <div className="text-[12px] text-muted-foreground mt-0.5">{a.outcome}</div>
                  )}
                </div>
                <div className="shrink-0 text-[12px] text-muted-foreground whitespace-nowrap pt-0.5">
                  {a.date}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: What You Might Be Missing ─────────────────────────── */}
        <section aria-labelledby="opportunities-heading">
          <h2 id="opportunities-heading" className="text-[15px] font-semibold mb-2">
            Opportunities to Be More Involved
          </h2>
          <p className="text-[13px] text-muted-foreground mb-4">
            These aren't problems — just ways to deepen your engagement with Jordan's journey.
          </p>

          <div className="space-y-3">
            {OPPORTUNITIES.map((o) => (
              <div
                key={o.id}
                className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                style={{ borderLeft: `3px solid ${PRIMARY}` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold">{o.title}</div>
                  <div className="text-[13px] text-muted-foreground mt-1">{o.body}</div>
                </div>
                <Link href={o.href ?? "#"} asChild>
                  <a
                    onClick={() => handleAction(`Navigating to: ${o.action}`)}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap"
                    style={{
                      background: `${PRIMARY.replace(")", " / 0.14)")}`,
                      color:       PRIMARY,
                    }}
                  >
                    {o.action}
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 4: Jordan's Development ──────────────────────────────── */}
        <section aria-labelledby="development-heading">
          <h2 id="development-heading" className="text-[15px] font-semibold mb-4">
            Jordan's Development This Season
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Top skill */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                <TrendingUp className="w-4 h-4" />
                Top Skill Improved
              </div>
              <div>
                <div className="text-[22px] font-bold" style={{ fontFamily: "Oswald, system-ui", color: SUCCESS }}>
                  {TOP_SKILL.skill}
                </div>
                <SkillBar gain={TOP_SKILL.gain} />
              </div>
              <div className="text-[13px] text-muted-foreground">{TOP_SKILL.note}</div>
            </div>

            {/* Coachability */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                <Star className="w-4 h-4" />
                Coachability Index
              </div>
              <div>
                <span
                  className="text-[36px] font-bold leading-none"
                  style={{ fontFamily: "Oswald, system-ui", color: SUCCESS }}
                >
                  8.6
                </span>
                <span className="text-[16px] text-muted-foreground ml-1">/10</span>
              </div>
              <div className="text-[13px] text-muted-foreground">
                Jordan is consistent, engaged, and responds well to feedback.
              </div>
            </div>

            {/* Badges */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                <Award className="w-4 h-4" />
                Badges Earned This Season
              </div>
              <div className="text-[28px] font-bold leading-none" style={{ fontFamily: "Oswald, system-ui", color: PRIMARY }}>
                {BADGES_EARNED.length}
              </div>
              <div className="flex flex-wrap gap-2">
                {BADGES_EARNED.map((b) => (
                  <span
                    key={b}
                    className="px-3 py-1 rounded-full text-[12px] font-semibold"
                    style={{
                      background: `${PRIMARY.replace(")", " / 0.14)")}`,
                      color:       PRIMARY,
                    }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Program comparison */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                <Users className="w-4 h-4" />
                Program Comparison
              </div>
              <div>
                <span
                  className="text-[36px] font-bold leading-none"
                  style={{ fontFamily: "Oswald, system-ui", color: SUCCESS }}
                >
                  72%
                </span>
              </div>
              <div className="text-[13px] text-muted-foreground">
                Jordan is developing faster than <strong style={{ color: SUCCESS }}>72%</strong> of
                2027 shooting guards in comparable AAU programs.
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 5: Privacy & Access Overview ─────────────────────────── */}
        <section aria-labelledby="privacy-heading">
          <h2 id="privacy-heading" className="text-[15px] font-semibold mb-4">
            Privacy &amp; Access Overview
          </h2>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
            {/* Status row */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                  Profile Visibility
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" style={{ color: SUCCESS }} />
                  <span className="text-[14px] font-semibold" style={{ color: SUCCESS }}>Public</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                  Active Access Grants
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" style={{ color: PRIMARY }} />
                  <span className="text-[14px] font-semibold">{ACCESS_GRANTS.length} schools</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                  Pending Requests
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" style={{ color: WARNING }} />
                  <span className="text-[14px] font-semibold" style={{ color: WARNING }}>1 pending</span>
                  <Link href="/app/family/access-requests" asChild>
                    <a
                      className="text-[12px] font-medium underline"
                      style={{ color: PRIMARY }}
                    >
                      Review
                    </a>
                  </Link>
                </div>
              </div>
            </div>

            {/* Active grants table */}
            <div>
              <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-2">
                Active Grants
              </div>
              <div className="space-y-2">
                {ACCESS_GRANTS.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: SUCCESS }} />
                      <span className="text-[13px] font-medium">{g.school}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                        style={{
                          background: `${PRIMARY.replace(")", " / 0.14)")}`,
                          color:       PRIMARY,
                        }}
                      >
                        {g.division}
                      </span>
                    </div>
                    <span className="text-[12px] text-muted-foreground">Expires {g.expires}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy review prompt */}
            <div
              className="flex items-center justify-between rounded-xl border px-4 py-3"
              style={{
                borderColor: `${WARNING.replace(")", " / 0.30)")}`,
                background:  `${WARNING.replace(")", " / 0.07)")}`,
              }}
            >
              <div className="flex items-center gap-2 text-[13px]" style={{ color: WARNING }}>
                <Clock className="w-4 h-4 shrink-0" />
                Last privacy review: <strong>45 days ago</strong> — consider reviewing your settings
              </div>
              <Link href="/app/family/privacy" asChild>
                <a
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors whitespace-nowrap"
                  style={{
                    borderColor: `${WARNING.replace(")", " / 0.35)")}`,
                    color:        WARNING,
                  }}
                >
                  Review settings
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </Link>
            </div>

            <div className="text-right">
              <Link href="/app/family/privacy" asChild>
                <a className="text-[13px] font-medium" style={{ color: PRIMARY }}>
                  View full privacy settings →
                </a>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Section 6: Communication History ─────────────────────────────── */}
        <section aria-labelledby="comms-heading">
          <h2 id="comms-heading" className="text-[15px] font-semibold mb-4">
            Communication History
          </h2>

          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {COMMUNICATIONS.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-4 px-5 py-4"
                style={!c.opened ? { background: `${WARNING.replace(")", " / 0.04)")}` } : undefined}
              >
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: c.opened
                      ? "oklch(0.20 0.005 260)"
                      : `${WARNING.replace(")", " / 0.16)")}`,
                    color: c.opened ? MUTED : WARNING,
                  }}
                >
                  {c.opened ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <span className="text-[13px] font-medium leading-snug flex-1">{c.title}</span>
                    {!c.opened && (
                      <span
                        className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: `${WARNING.replace(")", " / 0.18)")}`,
                          color:       WARNING,
                        }}
                      >
                        Unopened
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">
                    {c.from} · {c.date}
                  </div>
                </div>

                {/* Action */}
                <div className="shrink-0">
                  {c.type === "message" ? (
                    <button
                      onClick={() => handleAction(`Compose reply to: ${c.title}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-border hover:bg-muted/40 transition-colors whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Reply to coach
                    </button>
                  ) : !c.opened ? (
                    <button
                      onClick={() => handleAction(`Opening: ${c.title}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-border hover:bg-muted/40 transition-colors whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Read
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
