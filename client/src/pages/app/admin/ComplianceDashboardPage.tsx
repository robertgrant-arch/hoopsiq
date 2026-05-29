/**
 * ComplianceDashboardPage — operational safety metrics for admin overview.
 *
 * Presents aggregated compliance metrics for a selected time period, with
 * CSV export links for external review and a status bar surfacing open
 * incidents and review items.
 */

import { useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, Clock, AlertTriangle, FileDown, Eye } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardMetrics {
  protectedThreadsTotal: number;
  blockedSendsCount:     number;
  flaggedMessagesCount:  number;
  emergencySendsCount:   number;
  guardianBlocksCount:   number;
  openReviewItems:       number;
  openIncidentsCount:    number;
}

interface DashboardResponse {
  period:      string;
  periodStart: string;
  metrics:     DashboardMetrics;
}

// ── MetricCard ────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label:       string;
  value:       number;
  icon:        React.ElementType;
  color:       string;
  href?:       string;
  periodLabel: string;
  allTime?:    boolean;
}

function MetricCard({ label, value, icon: Icon, color, href, periodLabel, allTime }: MetricCardProps) {
  const content = (
    <div className="rounded-xl border border-border p-4 bg-card space-y-2.5 hover:border-border/80 transition-colors">
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + "18" }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
        <span className="text-[12px] font-medium text-muted-foreground leading-tight">{label}</span>
      </div>
      <div>
        <span className="text-2xl font-bold font-mono tabular-nums text-foreground">
          {value.toLocaleString()}
        </span>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {allTime ? "All time" : periodLabel}
        </p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ComplianceDashboardPage() {
  const [period, setPeriod] = useState("30d");

  const { data, isLoading } = useQuery<DashboardResponse>({
    queryKey: ["safety-dashboard", period],
    queryFn:  () => apiFetch("/safety/dashboard?period=" + period),
  });

  const metrics = data?.metrics;

  const periodLabel =
    period === "7d"  ? "Last 7 days"  :
    period === "90d" ? "Last 90 days" :
                       "Last 30 days";

  const openIncidentsCount = metrics?.openIncidentsCount ?? 0;
  const openReviewItems    = metrics?.openReviewItems    ?? 0;
  const allClear           = openIncidentsCount === 0 && openReviewItems === 0;

  return (
    <AppShell>
      <PageHeader
        title="Compliance Dashboard"
        description="Operational safety metrics for your organization."
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* Period selector row */}
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-muted-foreground">Showing data for:</span>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-8 w-[160px] text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d"  className="text-[12px]">Last 7 days</SelectItem>
              <SelectItem value="30d" className="text-[12px]">Last 30 days</SelectItem>
              <SelectItem value="90d" className="text-[12px]">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-[12px] text-muted-foreground py-8 text-center">
            Loading metrics…
          </div>
        )}

        {/* Metrics grid */}
        {!isLoading && metrics && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 mt-2">
            <MetricCard
              label="Protected Threads"
              value={metrics.protectedThreadsTotal}
              icon={ShieldCheck}
              color="#10b981"
              href="/app/admin/safety"
              periodLabel={periodLabel}
              allTime
            />
            <MetricCard
              label="Blocked Sends"
              value={metrics.blockedSendsCount}
              icon={ShieldAlert}
              color="#ef4444"
              periodLabel={periodLabel}
            />
            <MetricCard
              label="Flagged Messages"
              value={metrics.flaggedMessagesCount}
              icon={AlertTriangle}
              color="#f59e0b"
              href="/app/admin/safety"
              periodLabel={periodLabel}
            />
            <MetricCard
              label="Emergency Sends"
              value={metrics.emergencySendsCount}
              icon={Clock}
              color="#f97316"
              periodLabel={periodLabel}
            />
            <MetricCard
              label="Guardian Blocks"
              value={metrics.guardianBlocksCount}
              icon={Shield}
              color="#8b5cf6"
              periodLabel={periodLabel}
            />
            <MetricCard
              label="Open Review Items"
              value={metrics.openReviewItems}
              icon={Eye}
              color="#0ea5e9"
              href="/app/admin/safety"
              periodLabel={periodLabel}
            />
            <MetricCard
              label="Open Incidents"
              value={metrics.openIncidentsCount}
              icon={AlertTriangle}
              color="#ef4444"
              href="/app/admin/safety/incidents"
              periodLabel={periodLabel}
            />
          </div>
        )}

        <Separator />

        {/* Status bar */}
        {!isLoading && metrics && (
          allClear ? (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-emerald-500/20 bg-emerald-500/8 text-emerald-300 text-[12.5px]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>All clear — no open incidents or pending review items.</span>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg border border-amber-500/20 bg-amber-500/8 text-amber-300 text-[12.5px]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Attention:{" "}
                {openReviewItems > 0 && (
                  <>
                    <Link href="/app/admin/safety" className="underline underline-offset-2 font-medium">
                      {openReviewItems} review {openReviewItems === 1 ? "item" : "items"} pending
                    </Link>
                    {openIncidentsCount > 0 && " and "}
                  </>
                )}
                {openIncidentsCount > 0 && (
                  <>
                    <Link href="/app/admin/safety/incidents" className="underline underline-offset-2 font-medium">
                      {openIncidentsCount} open {openIncidentsCount === 1 ? "incident" : "incidents"}
                    </Link>
                  </>
                )}
                {" "}require your attention.
              </span>
            </div>
          )
        )}

        <Separator />

        {/* Exports */}
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">Compliance Exports</h3>
          <p className="text-[11.5px] text-muted-foreground mt-0.5">
            Download records as CSV for external review.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              className="text-[12px] gap-1.5"
              onClick={() => { window.location.href = "/api/safety/export/incidents"; }}
            >
              <FileDown className="w-3.5 h-3.5" />
              Incident Timeline
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-[12px] gap-1.5"
              onClick={() => { window.location.href = "/api/safety/export/audit"; }}
            >
              <FileDown className="w-3.5 h-3.5" />
              Policy Audit Log
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-[12px] gap-1.5"
              onClick={() => { window.location.href = "/api/safety/export/blocked"; }}
            >
              <FileDown className="w-3.5 h-3.5" />
              Blocked Send History
            </Button>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
