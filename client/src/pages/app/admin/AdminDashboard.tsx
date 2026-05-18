/**
 * AdminDashboard — Club ops command center.
 *
 * Shows the headline KPIs: registrations, billing health,
 * attendance rate, and compliance — all scoped to the active season.
 */
import { useState } from "react";
import {
  Users, DollarSign, CalendarCheck, ClipboardList,
  AlertTriangle, ChevronRight, TrendingUp, UserCheck,
  Clock, CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import { Link } from "wouter";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useAdminOverview, useSeasons, useAdminAttendance,
} from "@/lib/api/hooks/useAdmin";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function cents(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n / 100);
}

function pct(n: number) {
  return `${n}%`;
}

/* -------------------------------------------------------------------------- */
/* KPI Card                                                                    */
/* -------------------------------------------------------------------------- */

function KpiCard({
  label, value, sub, icon: Icon, color, href, alert,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  href?: string;
  alert?: boolean;
}) {
  const inner = (
    <div className={`rounded-xl border bg-card p-4 flex items-start gap-4 transition-all ${href ? "hover:shadow-sm hover:-translate-y-0.5 cursor-pointer" : ""}`}
      style={{ borderColor: alert ? "oklch(0.68 0.22 25 / 0.4)" : undefined }}>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, color }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</div>
        <div className="font-bold text-[22px] leading-none font-mono">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
      </div>
      {href && <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-2" />}
    </div>
  );
  return href ? <Link href={href}><a>{inner}</a></Link> : inner;
}

/* -------------------------------------------------------------------------- */
/* Attendance sparkline proxy (simple bar chart)                               */
/* -------------------------------------------------------------------------- */

function AttendanceBars() {
  const { data: att } = useAdminAttendance();
  if (!att) return null;
  const recent = att.events.slice(0, 6).reverse();
  return (
    <div className="flex items-end gap-1.5 h-12">
      {recent.map((e) => {
        const h = e.rate != null ? Math.max(8, Math.round((e.rate / 100) * 48)) : 8;
        const color = (e.rate ?? 0) >= 90 ? "oklch(0.75 0.12 140)" : (e.rate ?? 0) >= 75 ? "oklch(0.78 0.17 75)" : "oklch(0.68 0.22 25)";
        return (
          <div key={e.eventId} className="flex-1 rounded-sm" style={{ height: `${h}px`, background: color }} title={`${e.eventTitle}: ${e.rate}%`} />
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Alert strip                                                                  */
/* -------------------------------------------------------------------------- */

function AlertStrip({ overview }: { overview: ReturnType<typeof useAdminOverview>["data"] }) {
  if (!overview) return null;
  const alerts: Array<{ label: string; href: string; urgent: boolean }> = [];

  if (overview.alerts.pendingRegistrations > 0) {
    alerts.push({ label: `${overview.alerts.pendingRegistrations} registration${overview.alerts.pendingRegistrations > 1 ? "s" : ""} pending review`, href: "/app/admin/registrations", urgent: false });
  }
  if (overview.alerts.overdueInvoices > 0) {
    alerts.push({ label: `${overview.alerts.overdueInvoices} overdue invoice${overview.alerts.overdueInvoices > 1 ? "s" : ""} (${cents(overview.alerts.overdueAmount)})`, href: "/app/admin/billing", urgent: true });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4" style={{ color: "oklch(0.72 0.17 75)" }} />
        <span className="font-semibold text-[13px]">Action needed</span>
        <Badge variant="secondary" className="ml-auto">{alerts.length}</Badge>
      </div>
      <div className="space-y-2">
        {alerts.map((a) => (
          <Link key={a.label} href={a.href} asChild>
            <a className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:bg-muted/30 transition-colors">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: a.urgent ? "oklch(0.68 0.22 25)" : "oklch(0.72 0.17 75)" }}
              />
              <span className="text-[12px] font-medium flex-1">{a.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main                                                                         */
/* -------------------------------------------------------------------------- */

export default function AdminDashboard() {
  const { data: seasons = [] } = useSeasons();
  const [activeSeason, setActiveSeason] = useState<string | undefined>(
    seasons.find((s) => s.status === "active")?.id
  );
  const { data: overview, isLoading } = useAdminOverview(activeSeason);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Club Admin"
        title="Operations Dashboard"
        subtitle="Registration, billing, and program health at a glance."
        actions={
          seasons.length > 0 ? (
            <select
              className="h-8 rounded-md border border-border bg-card text-[12px] px-2 pr-7 focus:outline-none"
              value={activeSeason ?? ""}
              onChange={(e) => setActiveSeason(e.target.value || undefined)}
            >
              <option value="">All seasons</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-5">
          <AlertStrip overview={overview} />

          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Registered"
              value={overview?.registrations.active ?? 0}
              sub={`${overview?.registrations.pending ?? 0} pending · ${overview?.registrations.waitlisted ?? 0} waitlisted`}
              icon={Users}
              color="oklch(0.72 0.18 290)"
              href="/app/admin/registrations"
            />
            <KpiCard
              label="Collected"
              value={cents(overview?.billing.totalCollected ?? 0)}
              sub={`${cents(overview?.billing.totalOutstanding ?? 0)} outstanding`}
              icon={DollarSign}
              color="oklch(0.75 0.12 140)"
              href="/app/admin/billing"
              alert={(overview?.billing.overdueCount ?? 0) > 0}
            />
            <KpiCard
              label="Attendance rate"
              value={pct(overview?.attendance?.rate ?? 0)}
              sub="Last 30 days"
              icon={CalendarCheck}
              color="oklch(0.65 0.15 230)"
              href="/app/admin/attendance"
            />
            <KpiCard
              label="Forms complete"
              value={`${overview?.compliance?.compliant ?? 0}/${overview?.compliance?.total ?? 0}`}
              sub={`${(overview?.compliance?.total ?? 0) - (overview?.compliance?.compliant ?? 0)} athletes incomplete`}
              icon={ClipboardList}
              color="oklch(0.78 0.17 75)"
              href="/app/admin/registrations?tab=compliance"
              alert={(overview?.compliance?.incomplete ?? 0) > 0}
            />
          </div>

          {/* Middle row: Registration pipeline + Billing health */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Registration pipeline */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[13px] flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Registration Pipeline
                </h3>
                <Link href="/app/admin/registrations" asChild>
                  <a className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
                    Manage <ChevronRight className="w-3 h-3" />
                  </a>
                </Link>
              </div>
              {([
                { label: "Active", value: overview?.registrations.active ?? 0, color: "oklch(0.75 0.12 140)" },
                { label: "Accepted", value: overview?.registrations.accepted ?? 0, color: "oklch(0.65 0.15 230)" },
                { label: "Pending review", value: overview?.registrations.pending ?? 0, color: "oklch(0.78 0.17 75)" },
                { label: "Waitlisted", value: overview?.registrations.waitlisted ?? 0, color: "oklch(0.72 0.17 75)" },
              ] as const).map((row) => (
                <div key={row.label} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
                  <span className="text-[12px] flex-1">{row.label}</span>
                  <span className="font-mono font-bold text-[14px]" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}

              <div className="mt-3">
                <Link href="/app/admin/registrations">
                  <a>
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-[12px]">
                      Review pending registrations <ChevronRight className="w-3 h-3" />
                    </Button>
                  </a>
                </Link>
              </div>
            </div>

            {/* Billing health */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[13px] flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" /> Billing Health
                </h3>
                <Link href="/app/admin/billing" asChild>
                  <a className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
                    Full view <ChevronRight className="w-3 h-3" />
                  </a>
                </Link>
              </div>

              {/* Collection bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                  <span>Collection rate</span>
                  <span className="font-medium text-foreground">
                    {overview?.billing.totalBilled ? Math.round((overview.billing.totalCollected / overview.billing.totalBilled) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: overview?.billing.totalBilled
                        ? `${Math.round((overview.billing.totalCollected / overview.billing.totalBilled) * 100)}%`
                        : "0%",
                      background: "oklch(0.75 0.12 140)",
                    }}
                  />
                </div>
              </div>

              {([
                { label: "Total billed", value: cents(overview?.billing.totalBilled ?? 0), color: undefined },
                { label: "Collected", value: cents(overview?.billing.totalCollected ?? 0), color: "oklch(0.75 0.12 140)" },
                { label: "Outstanding", value: cents(overview?.billing.totalOutstanding ?? 0), color: "oklch(0.78 0.17 75)" },
                { label: "Overdue invoices", value: overview?.billing.overdueCount ?? 0, color: (overview?.billing.overdueCount ?? 0) > 0 ? "oklch(0.68 0.22 25)" : undefined },
              ]).map((row) => (
                <div key={row.label} className="flex items-center py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-[12px] flex-1">{row.label}</span>
                  <span className="font-mono font-semibold text-[13px]" style={row.color ? { color: row.color } : undefined}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom row: Attendance + Teams */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Attendance */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[13px] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Attendance (last 30 days)
                </h3>
              </div>
              <AttendanceBars />
              <div className="mt-3 text-[11px] text-muted-foreground">
                Overall rate: <span className="font-semibold text-foreground">{pct(overview?.attendance?.rate ?? 0)}</span> · {overview?.attendance?.eventCount ?? 0} events
              </div>
            </div>

            {/* Teams */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[13px] flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Active Teams
                </h3>
                <Link href="/app/admin/teams" asChild>
                  <a className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
                    Manage <ChevronRight className="w-3 h-3" />
                  </a>
                </Link>
              </div>
              <div className="space-y-2">
                {(overview?.teams as any)?.list?.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-2 text-[12px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    <span className="flex-1 font-medium">{t.name}</span>
                    <span className="text-muted-foreground capitalize">{t.ageGroup.replace("u","U")} · {t.gender}</span>
                  </div>
                )) ?? (
                  <p className="text-[12px] text-muted-foreground">{overview?.teams.count ?? 0} teams active</p>
                )}
              </div>
              <div className="mt-3">
                <Link href="/app/admin/teams">
                  <a>
                    <Button variant="outline" size="sm" className="w-full text-[12px] gap-1">
                      Manage teams <ChevronRight className="w-3 h-3" />
                    </Button>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
