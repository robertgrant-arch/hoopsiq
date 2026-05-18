import { useState } from "react";
import { Link } from "wouter";
import {
  Users,
  UserCheck,
  UserX,
  DollarSign,
  Calendar,
  Bell,
  MessageSquare,
  Shield,
  ChevronRight,
  Plus,
  Mail,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Star,
  TrendingUp,
  Clipboard,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ── Mock data ──────────────────────────────────────────────────────────────────

const TEAM = {
  name: "Barnegat Bengals",
  season: "2024–25",
  tier: "HS Varsity",
  record: "14–6",
  nextGame: { opponent: "Toms River North", date: "Fri May 16", time: "7:00 PM", location: "Away" },
  nextPractice: { date: "Wed May 14", time: "3:30 PM", location: "Main Gym" },
};

const ROSTER = [
  { id: "p1",  name: "Marcus Davis",   initials: "MD", position: "PG", jerseyNumber: 3,  grade: "11", status: "active",  availability: "available",   paymentStatus: "paid",    parentName: "James Davis",    parentContact: "james@email.com",   role: "player" },
  { id: "p2",  name: "Jordan Smith",   initials: "JS", position: "SG", jerseyNumber: 12, grade: "12", status: "active",  availability: "available",   paymentStatus: "paid",    parentName: "Linda Smith",    parentContact: "linda@email.com",   role: "player" },
  { id: "p3",  name: "Tyler Brown",    initials: "TB", position: "SF", jerseyNumber: 23, grade: "10", status: "active",  availability: "limited",     paymentStatus: "overdue", parentName: "Mike Brown",     parentContact: "mike@email.com",    role: "player" },
  { id: "p4",  name: "Devon Williams", initials: "DW", position: "PF", jerseyNumber: 34, grade: "11", status: "active",  availability: "available",   paymentStatus: "paid",    parentName: "Tonya Williams", parentContact: "tonya@email.com",   role: "player" },
  { id: "p5",  name: "Caleb Moore",    initials: "CM", position: "C",  jerseyNumber: 44, grade: "12", status: "active",  availability: "available",   paymentStatus: "partial", parentName: "Cheryl Moore",   parentContact: "cheryl@email.com",  role: "player" },
  { id: "p6",  name: "Isaiah Jones",   initials: "IJ", position: "PG", jerseyNumber: 5,  grade: "10", status: "active",  availability: "available",   paymentStatus: "paid",    parentName: "Darnell Jones",  parentContact: "darnell@email.com", role: "player" },
  { id: "p7",  name: "Nathan Reed",    initials: "NR", position: "SG", jerseyNumber: 11, grade: "11", status: "injured", availability: "unavailable", paymentStatus: "paid",    parentName: "Sandra Reed",    parentContact: "sandra@email.com",  role: "player" },
  { id: "p8",  name: "Chris Evans",    initials: "CE", position: "SF", jerseyNumber: 22, grade: "12", status: "active",  availability: "available",   paymentStatus: "paid",    parentName: "Patricia Evans", parentContact: "pat@email.com",     role: "player" },
  { id: "p9",  name: "Malik Thompson", initials: "MT", position: "PF", jerseyNumber: 32, grade: "11", status: "active",  availability: "limited",     paymentStatus: "overdue", parentName: "Keisha Thompson", parentContact: "keisha@email.com", role: "player" },
  { id: "p10", name: "Dante Garcia",   initials: "DG", position: "C",  jerseyNumber: 50, grade: "10", status: "active",  availability: "available",   paymentStatus: "paid",    parentName: "Rosa Garcia",    parentContact: "rosa@email.com",    role: "player" },
];

const STAFF = [
  { id: "s1", name: "Coach Williams", initials: "CW", role: "Head Coach",       access: "full",         lastActive: "Today" },
  { id: "s2", name: "Coach Martinez", initials: "CM", role: "Asst. Coach",      access: "coaching",     lastActive: "Yesterday" },
  { id: "s3", name: "T. Johnson",     initials: "TJ", role: "S&C Trainer",      access: "conditioning", lastActive: "2d ago" },
  { id: "s4", name: "Admin Harris",   initials: "AH", role: "Team Admin",       access: "admin",        lastActive: "Today" },
];

const ALERTS = [
  { id: "a1", type: "payment",      urgency: "critical", text: "Tyler Brown — dues overdue 14 days",        action: "Send reminder", href: "/app/team/billing" },
  { id: "a2", type: "payment",      urgency: "critical", text: "Malik Thompson — dues overdue 7 days",      action: "Send reminder", href: "/app/team/billing" },
  { id: "a3", type: "availability", urgency: "warning",  text: "2 players haven't confirmed Friday's game", action: "Send nudge",    href: "/app/team/schedule" },
  { id: "a4", type: "roster",       urgency: "warning",  text: "Nathan Reed — medical clearance needed",    action: "Request docs",  href: "/app/team/roster" },
  { id: "a5", type: "message",      urgency: "info",     text: "3 unread parent messages",                  action: "View messages", href: "/app/coach/messages" },
];

const PAYMENT_SUMMARY = {
  totalDue: 3200,
  collected: 2600,
  overdue: 400,
  partial: 200,
  paid: 8,
  overduePlayers: 2,
  partialPlayers: 1,
};

// ── Helper components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  trend,
  icon,
  href,
  accent = "default",
}: {
  label: string;
  value: string;
  trend?: string;
  icon: React.ReactNode;
  href?: string;
  accent?: "default" | "primary" | "success" | "warning" | "danger";
}) {
  const accentClass =
    accent === "primary" ? "text-primary"
    : accent === "success" ? "text-[oklch(0.65_0.18_150)]"
    : accent === "warning" ? "text-[oklch(0.72_0.17_75)]"
    : accent === "danger"  ? "text-[oklch(0.68_0.22_25)]"
    : "text-foreground";

  const inner = (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2 hover:border-primary/30 transition-colors cursor-pointer">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[12px] uppercase tracking-[0.07em] font-semibold">{label}</span>
        <span className={accentClass}>{icon}</span>
      </div>
      <div className={`font-mono text-[22px] font-bold leading-none ${accentClass}`}>{value}</div>
      {trend && <div className="text-[11.5px] text-muted-foreground">{trend}</div>}
    </div>
  );

  if (href) {
    return <Link href={href}><a>{inner}</a></Link>;
  }
  return inner;
}

function InitialsAvatar({
  initials,
  className = "bg-primary/15 text-primary",
  size = "md",
}: {
  initials: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "sm" ? "w-7 h-7 text-[10px]" : size === "lg" ? "w-10 h-10 text-[13px]" : "w-8 h-8 text-[11px]";
  return (
    <span className={`${sizeClass} rounded-full font-bold flex items-center justify-center shrink-0 ${className}`}>
      {initials}
    </span>
  );
}

function AvailabilityCell({ availability, status }: { availability: string; status: string }) {
  if (status === "injured") {
    return (
      <Badge className="bg-[oklch(0.55_0.2_25)]/15 text-[oklch(0.68_0.22_25)] border-[oklch(0.55_0.2_25)]/30 font-semibold text-[10.5px]">
        Injured
      </Badge>
    );
  }
  if (availability === "available") {
    return (
      <span className="flex items-center gap-1 text-[oklch(0.65_0.18_150)] text-[12px]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Available
      </span>
    );
  }
  if (availability === "limited") {
    return (
      <span className="flex items-center gap-1 text-[oklch(0.72_0.17_75)] text-[12px]">
        <Clock className="w-3.5 h-3.5" />
        Limited
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[oklch(0.68_0.22_25)] text-[12px]">
      <UserX className="w-3.5 h-3.5" />
      Unavailable
    </span>
  );
}

function PaymentCell({ paymentStatus }: { paymentStatus: string }) {
  if (paymentStatus === "paid") {
    return <span className="text-[oklch(0.65_0.18_150)] font-semibold text-[12px]">Paid</span>;
  }
  if (paymentStatus === "partial") {
    return (
      <span className="flex items-center gap-1 text-[oklch(0.72_0.17_75)] font-semibold text-[12px]">
        <AlertTriangle className="w-3 h-3" />
        Partial
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[oklch(0.68_0.22_25)] font-bold text-[12px]">
      <AlertTriangle className="w-3 h-3" />
      Overdue !
    </span>
  );
}

function AccessBadge({ access }: { access: string }) {
  const map: Record<string, { label: string; className: string }> = {
    full:         { label: "Full Access",    className: "bg-primary/15 text-primary border-primary/30" },
    coaching:     { label: "Coaching",       className: "bg-[oklch(0.55_0.18_150)]/15 text-[oklch(0.65_0.18_150)] border-[oklch(0.55_0.18_150)]/30" },
    conditioning: { label: "S&C Only",       className: "bg-[oklch(0.72_0.17_75)]/15 text-[oklch(0.65_0.17_75)] border-[oklch(0.72_0.17_75)]/30" },
    admin:        { label: "Admin",          className: "bg-[oklch(0.68_0.22_25)]/15 text-[oklch(0.68_0.22_25)] border-[oklch(0.68_0.22_25)]/30" },
  };
  const m = map[access] ?? { label: access, className: "" };
  return (
    <Badge variant="outline" className={`text-[10px] font-semibold ${m.className}`}>
      {m.label}
    </Badge>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function TeamDashboard() {
  const [rosterTab, setRosterTab] = useState<"active" | "injured" | "inactive">("active");
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const activeRoster   = ROSTER.filter((p) => p.status === "active");
  const injuredRoster  = ROSTER.filter((p) => p.status === "injured");
  const inactiveRoster = ROSTER.filter((p) => p.status === "inactive");

  const tabRoster =
    rosterTab === "active"   ? activeRoster
    : rosterTab === "injured" ? injuredRoster
    : inactiveRoster;

  const confirmedCount = activeRoster.filter((p) => p.availability === "available").length;
  const pctCollected = Math.round((PAYMENT_SUMMARY.collected / PAYMENT_SUMMARY.totalDue) * 100);

  const visibleAlerts = ALERTS.filter((a) => !dismissedAlerts.has(a.id));

  function dismissAlert(id: string) {
    setDismissedAlerts((prev) => new Set(Array.from(prev).concat(id)));
  }

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow={`${TEAM.tier} · ${TEAM.season}`}
          title={TEAM.name}
          actions={
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-3 text-[12.5px] gap-1.5"
                onClick={() => toast.success("Broadcast sent to all team members")}
              >
                <Bell className="w-3.5 h-3.5" />
                Send Broadcast
              </Button>
              <Link href="/app/team/roster" asChild>
                <a className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.07em] hover:brightness-110 transition">
                  <Plus className="w-3.5 h-3.5" />
                  Add Player
                </a>
              </Link>
            </>
          }
        />

        {/* Season badges */}
        <div className="flex items-center gap-2 -mt-3 mb-7">
          <Badge variant="outline" className="font-mono text-[11px]">{TEAM.record}</Badge>
          <Badge variant="outline" className="text-[11px]">{TEAM.tier}</Badge>
          <Badge variant="outline" className="text-[11px]">{TEAM.season}</Badge>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard
            label="Roster"
            value={`${activeRoster.length} active`}
            trend={`${injuredRoster.length} injured`}
            icon={<Users className="w-4 h-4" />}
            href="/app/team/roster"
            accent="primary"
          />
          <StatCard
            label="Availability"
            value={`${confirmedCount} confirmed`}
            trend="For Friday's game"
            icon={<UserCheck className="w-4 h-4" />}
            href="/app/team/schedule"
            accent="success"
          />
          <StatCard
            label="Payments"
            value={`${pctCollected}% collected`}
            trend={`$${PAYMENT_SUMMARY.collected.toLocaleString()} of $${PAYMENT_SUMMARY.totalDue.toLocaleString()}`}
            icon={<DollarSign className="w-4 h-4" />}
            href="/app/team/billing"
            accent={PAYMENT_SUMMARY.overduePlayers > 0 ? "warning" : "success"}
          />
          <StatCard
            label="Staff"
            value={`${STAFF.length} members`}
            trend="All roles covered"
            icon={<Shield className="w-4 h-4" />}
            accent="default"
          />
        </div>

        {/* Three-column grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left — 2 cols ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Roster section */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="display text-[17px]">Roster</h3>
                  <span className="font-mono text-[11px] text-muted-foreground">{ROSTER.length} total</span>
                </div>
                <Link href="/app/team/roster" asChild>
                  <a className="text-[12px] text-primary hover:underline flex items-center gap-1">
                    Manage <ChevronRight className="w-3 h-3" />
                  </a>
                </Link>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border px-5">
                {(["active", "injured", "inactive"] as const).map((tab) => {
                  const count =
                    tab === "active"   ? activeRoster.length
                    : tab === "injured" ? injuredRoster.length
                    : inactiveRoster.length;
                  return (
                    <button
                      key={tab}
                      onClick={() => setRosterTab(tab)}
                      className={`px-3 py-2.5 text-[12.5px] font-semibold capitalize border-b-2 -mb-px transition-colors ${
                        rosterTab === tab
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab}
                      <span className="ml-1.5 font-mono text-[10px]">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-[11px] uppercase tracking-[0.06em]">
                      <th className="text-left px-5 py-2.5 font-semibold w-8">#</th>
                      <th className="text-left px-3 py-2.5 font-semibold">Player</th>
                      <th className="text-left px-3 py-2.5 font-semibold">Pos</th>
                      <th className="text-left px-3 py-2.5 font-semibold">Gr</th>
                      <th className="text-left px-3 py-2.5 font-semibold">Availability</th>
                      <th className="text-left px-3 py-2.5 font-semibold">Payment</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabRoster.map((player) => (
                      <tr key={player.id} className="border-b border-border/50 hover:bg-muted/30 transition">
                        <td className="px-5 py-3 font-mono text-muted-foreground text-[11px]">
                          {player.jerseyNumber}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <InitialsAvatar initials={player.initials} />
                            <div>
                              <div className="font-medium">{player.name}</div>
                              <div className="text-[11px] text-muted-foreground">{player.parentName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                            {player.position}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{player.grade}</td>
                        <td className="px-3 py-3">
                          <AvailabilityCell availability={player.availability} status={player.status} />
                        </td>
                        <td className="px-3 py-3">
                          <PaymentCell paymentStatus={player.paymentStatus} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/app/coach/players/${player.id}`} asChild>
                              <a className="text-[11.5px] text-primary hover:underline">View</a>
                            </Link>
                            <button
                              className="text-[11.5px] text-muted-foreground hover:text-foreground transition"
                              onClick={() => toast.success(`Message sent to ${player.parentName}`)}
                            >
                              Message
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {tabRoster.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-6 text-center text-muted-foreground text-[13px]">
                          No players in this category
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-3 border-t border-border">
                <button
                  className="text-[12px] text-muted-foreground hover:text-foreground transition"
                  onClick={() => toast.success("Roster CSV downloaded")}
                >
                  Export roster CSV →
                </button>
              </div>
            </div>

            {/* Staff section */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="display text-[17px]">Staff &amp; Access</h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-[11.5px] gap-1.5"
                  onClick={() => toast.success("Invite sent")}
                >
                  <Plus className="w-3 h-3" />
                  Invite Staff
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 p-5">
                {STAFF.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-[oklch(0.15_0.005_260)] hover:border-primary/20 transition"
                  >
                    <InitialsAvatar
                      initials={member.initials}
                      size="lg"
                      className="bg-primary/15 text-primary shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px]">{member.name}</div>
                      <div className="text-[11.5px] text-muted-foreground mb-1.5">{member.role}</div>
                      <div className="flex items-center justify-between gap-2">
                        <AccessBadge access={member.access} />
                        <span className="text-[10.5px] text-muted-foreground">{member.lastActive}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10.5px] shrink-0 mt-0.5"
                      onClick={() => toast.success("Access settings updated")}
                    >
                      Edit Access
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right col ─────────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Upcoming Events */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="display text-[16px] mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Upcoming Events
              </h3>
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg border border-border bg-[oklch(0.15_0.005_260)]">
                  <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-1.5">
                    Next Practice
                  </div>
                  <div className="font-semibold text-[13.5px] mb-0.5">{TEAM.nextPractice.date}</div>
                  <div className="text-[12px] text-muted-foreground">
                    {TEAM.nextPractice.time} · {TEAM.nextPractice.location}
                  </div>
                  <Link href="/app/coach/practice-plans" asChild>
                    <a className="mt-2.5 inline-block text-[11.5px] text-primary hover:underline">
                      View Plan →
                    </a>
                  </Link>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-[oklch(0.15_0.005_260)]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">
                      Next Game
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9.5px] px-1.5 py-0 ${
                        TEAM.nextGame.location === "Away"
                          ? "text-[oklch(0.72_0.17_75)] border-[oklch(0.72_0.17_75)]/40"
                          : "text-[oklch(0.65_0.18_150)] border-[oklch(0.65_0.18_150)]/40"
                      }`}
                    >
                      {TEAM.nextGame.location}
                    </Badge>
                  </div>
                  <div className="font-semibold text-[13.5px] mb-0.5">vs. {TEAM.nextGame.opponent}</div>
                  <div className="text-[12px] text-muted-foreground">
                    {TEAM.nextGame.date} · {TEAM.nextGame.time}
                  </div>
                  <Button
                    size="sm"
                    className="mt-2.5 h-7 px-3 text-[11.5px]"
                    onClick={() => toast.success("Opening lineup manager")}
                  >
                    Manage Lineup
                  </Button>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="display text-[16px] mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[oklch(0.72_0.17_75)]" />
                Action Required
                {visibleAlerts.length > 0 && (
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">{visibleAlerts.length}</span>
                )}
              </h3>

              {visibleAlerts.length === 0 ? (
                <div className="flex items-center gap-2 text-[13px] text-[oklch(0.65_0.18_150)] py-1">
                  <CheckCircle2 className="w-4 h-4" />
                  All clear — no pending actions
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleAlerts.map((alert) => {
                    const borderColor =
                      alert.urgency === "critical" ? "border-l-[oklch(0.55_0.2_25)]"
                      : alert.urgency === "warning" ? "border-l-[oklch(0.72_0.17_75)]"
                      : "border-l-[oklch(0.55_0.2_280)]";
                    const bgColor =
                      alert.urgency === "critical" ? "bg-[oklch(0.55_0.2_25)]/5"
                      : alert.urgency === "warning" ? "bg-[oklch(0.72_0.17_75)]/5"
                      : "bg-[oklch(0.55_0.2_280)]/5";

                    return (
                      <div
                        key={alert.id}
                        className={`flex items-start gap-2 pl-3 pr-2 py-2.5 rounded-r-md border-l-2 ${borderColor} ${bgColor}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] leading-snug">{alert.text}</div>
                          <button
                            className="mt-1.5 text-[11px] text-primary hover:underline"
                            onClick={() => toast.success(`${alert.action} — done`)}
                          >
                            {alert.action} →
                          </button>
                        </div>
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="text-muted-foreground hover:text-foreground transition shrink-0 mt-0.5 text-[16px] leading-none"
                          aria-label="Dismiss"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment Status */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="display text-[16px] mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[oklch(0.65_0.18_150)]" />
                Payment Status
              </h3>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11.5px] text-muted-foreground mb-1.5">
                  <span>${PAYMENT_SUMMARY.collected.toLocaleString()} collected</span>
                  <span className="font-mono font-semibold text-foreground">{pctCollected}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[oklch(0.22_0.005_260)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[oklch(0.65_0.18_150)] transition-all"
                    style={{ width: `${pctCollected}%` }}
                  />
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  of ${PAYMENT_SUMMARY.totalDue.toLocaleString()} total due
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between py-1.5 text-[12.5px]">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[oklch(0.65_0.18_150)] shrink-0" />
                    Paid
                  </span>
                  <span className="font-mono text-[oklch(0.65_0.18_150)] font-semibold">
                    {PAYMENT_SUMMARY.paid} players
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 text-[12.5px]">
                  <Link href="/app/team/roster" asChild>
                    <a className="flex items-center gap-2 hover:underline">
                      <span className="w-2 h-2 rounded-full bg-[oklch(0.72_0.17_75)] shrink-0" />
                      Partial
                    </a>
                  </Link>
                  <span className="font-mono text-[oklch(0.72_0.17_75)] font-semibold">
                    {PAYMENT_SUMMARY.partialPlayers} player
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 text-[12.5px]">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[oklch(0.55_0.2_25)] shrink-0" />
                    <span className="text-[oklch(0.68_0.22_25)] font-semibold">Overdue</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[oklch(0.68_0.22_25)] font-semibold">
                      {PAYMENT_SUMMARY.overduePlayers} players
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10.5px] border-[oklch(0.55_0.2_25)]/40 text-[oklch(0.68_0.22_25)] hover:bg-[oklch(0.55_0.2_25)]/10"
                      onClick={() =>
                        toast.success(
                          `Payment reminders sent to ${PAYMENT_SUMMARY.overduePlayers} families`
                        )
                      }
                    >
                      Send Reminders
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="display text-[16px] mb-3">Quick Actions</h3>
              <div className="space-y-0.5">
                <button
                  className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-muted transition text-[13px] text-left"
                  onClick={() => toast.success("Opening attendance tracker")}
                >
                  <span className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-primary" />
                    Take Attendance
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>

                <Link href="/app/team/schedule" asChild>
                  <a className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted transition text-[13px]">
                    <span className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      Schedule Event
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </a>
                </Link>

                <Link href="/app/coach/messages" asChild>
                  <a className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted transition text-[13px]">
                    <span className="flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Message Parents
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </a>
                </Link>

                <button
                  className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-muted transition text-[13px] text-left"
                  onClick={() => toast.info("Coming soon")}
                >
                  <span className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    View Analytics
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default TeamDashboard;
