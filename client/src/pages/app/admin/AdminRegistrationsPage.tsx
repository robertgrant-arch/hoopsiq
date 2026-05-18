/**
 * AdminRegistrationsPage — Full registration pipeline.
 *
 * Three tabs: Pipeline (status board), Compliance (forms), Waitlist.
 * Actions: accept, deny, waitlist, add note.
 */
import { useState } from "react";
import {
  Users, CheckCircle2, XCircle, Clock, AlertCircle,
  Search, Filter, ChevronDown, ChevronUp, FileText,
  UserCheck, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useRegistrations, useUpdateRegistrationStatus, useSeasons,
  useAdminCompliance,
} from "@/lib/api/hooks/useAdmin";
import type { Registration } from "@/features/admin/mock";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function cents(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_CONFIG = {
  pending:    { label: "Pending",    color: "oklch(0.78 0.17 75)",    bg: "oklch(0.78 0.17 75 / 0.1)" },
  waitlisted: { label: "Waitlisted", color: "oklch(0.65 0.15 230)",   bg: "oklch(0.65 0.15 230 / 0.1)" },
  accepted:   { label: "Accepted",   color: "oklch(0.72 0.18 290)",   bg: "oklch(0.72 0.18 290 / 0.1)" },
  active:     { label: "Active",     color: "oklch(0.75 0.12 140)",   bg: "oklch(0.75 0.12 140 / 0.1)" },
  cancelled:  { label: "Cancelled",  color: "oklch(0.5 0 0)",         bg: "oklch(0.5 0 0 / 0.08)" },
  denied:     { label: "Denied",     color: "oklch(0.68 0.22 25)",    bg: "oklch(0.68 0.22 25 / 0.08)" },
  incomplete: { label: "Incomplete", color: "oklch(0.72 0.17 75)",    bg: "oklch(0.72 0.17 75 / 0.1)" },
} as const;

const INVOICE_STATUS_COLOR: Record<string, string> = {
  paid: "oklch(0.75 0.12 140)",
  open: "oklch(0.65 0.15 230)",
  overdue: "oklch(0.68 0.22 25)",
  partial: "oklch(0.78 0.17 75)",
  void: "oklch(0.5 0 0)",
};

/* -------------------------------------------------------------------------- */
/* Registration row                                                             */
/* -------------------------------------------------------------------------- */

function RegistrationRow({ reg, onAction }: {
  reg: Registration;
  onAction: (id: string, status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[reg.status];

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        {/* Status dot */}
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[13px]">{reg.playerName}</span>
            {reg.teamName && (
              <span className="text-[11px] text-muted-foreground">· {reg.teamName}</span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {reg.guardianName} · {reg.planName ?? "No plan"} · Submitted {formatDate(reg.submittedAt)}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {reg.invoiceStatus && (
            <span className="text-[10px] font-semibold capitalize" style={{ color: INVOICE_STATUS_COLOR[reg.invoiceStatus] }}>
              {reg.invoiceStatus}
            </span>
          )}
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          <div className="grid sm:grid-cols-2 gap-3 mb-3 text-[12px]">
            <div className="space-y-1">
              <div><span className="text-muted-foreground">Season:</span> {reg.seasonName}</div>
              <div><span className="text-muted-foreground">Plan:</span> {reg.planName}</div>
              <div><span className="text-muted-foreground">Amount:</span> {cents(reg.effectiveAmount)}
                {reg.discountAmount > 0 && <span className="text-muted-foreground"> (−{cents(reg.discountAmount)} discount)</span>}
              </div>
            </div>
            <div className="space-y-1">
              <div><span className="text-muted-foreground">Guardian:</span> {reg.guardianName}</div>
              <div><span className="text-muted-foreground">Email:</span> {reg.guardianEmail}</div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Forms:</span>
                {reg.formsComplete
                  ? <span className="text-green-600 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Complete</span>
                  : <span className="text-amber-500 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> Incomplete</span>
                }
              </div>
            </div>
          </div>
          {reg.adminNotes && (
            <div className="mb-3 rounded-lg bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground italic">
              Note: {reg.adminNotes}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {reg.status === "pending" && (
              <>
                <Button size="sm" className="gap-1 text-[11px]" style={{ background: "oklch(0.75 0.12 140)" }}
                  onClick={() => onAction(reg.id, "accepted")}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-[11px]"
                  onClick={() => onAction(reg.id, "waitlisted")}>
                  <Clock className="w-3.5 h-3.5" /> Waitlist
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-[11px] text-destructive"
                  onClick={() => onAction(reg.id, "denied")}>
                  <XCircle className="w-3.5 h-3.5" /> Deny
                </Button>
              </>
            )}
            {reg.status === "accepted" && (
              <Button size="sm" className="gap-1 text-[11px]" style={{ background: "oklch(0.72 0.18 290)" }}
                onClick={() => onAction(reg.id, "active")}>
                <UserCheck className="w-3.5 h-3.5" /> Mark active
              </Button>
            )}
            {reg.status === "waitlisted" && (
              <Button size="sm" className="gap-1 text-[11px]" style={{ background: "oklch(0.75 0.12 140)" }}
                onClick={() => onAction(reg.id, "accepted")}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Move to accepted
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Compliance tab                                                               */
/* -------------------------------------------------------------------------- */

function ComplianceTab() {
  const { data: comp, isLoading } = useAdminCompliance();

  if (isLoading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
  if (!comp) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Compliant", value: comp.compliant, color: "oklch(0.75 0.12 140)" },
          { label: "Incomplete", value: comp.incomplete, color: comp.incomplete > 0 ? "oklch(0.68 0.22 25)" : undefined },
          { label: "Required forms", value: comp.requiredForms },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3 text-center">
            <div className="font-mono font-bold text-[24px] leading-none" style={s.color ? { color: s.color } : undefined}>{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {comp.players.filter((p) => !p.compliant).length > 0 && (
        <div>
          <h3 className="font-semibold text-[13px] mb-3 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" style={{ color: "oklch(0.68 0.22 25)" }} />
            <span style={{ color: "oklch(0.68 0.22 25)" }}>Needs attention ({comp.incomplete})</span>
          </h3>
          <div className="space-y-2">
            {comp.players.filter((p) => !p.compliant).map((p) => (
              <div key={p.playerId} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div>
                  <div className="font-semibold text-[13px]">{p.playerName}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Missing: {p.missingForms.join(", ")}
                  </div>
                </div>
                <Badge variant="secondary" className="ml-auto shrink-0" style={{ color: "oklch(0.68 0.22 25)" }}>
                  {p.missingCount} missing
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main                                                                         */
/* -------------------------------------------------------------------------- */

type Tab = "pipeline" | "compliance";

export default function AdminRegistrationsPage() {
  const [tab, setTab] = useState<Tab>("pipeline");
  const [seasonFilter, setSeasonFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [query, setQuery] = useState("");

  const { data: seasons = [] } = useSeasons();
  const { data: allRegs = [], isLoading } = useRegistrations({
    seasonId: seasonFilter || undefined,
    status: statusFilter || undefined,
  });

  const updateStatus = useUpdateRegistrationStatus();

  const filtered = allRegs.filter((r) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      r.playerName.toLowerCase().includes(q) ||
      (r.guardianName ?? "").toLowerCase().includes(q) ||
      (r.planName ?? "").toLowerCase().includes(q)
    );
  });

  const pendingCount = allRegs.filter((r) => r.status === "pending").length;
  const waitlistedCount = allRegs.filter((r) => r.status === "waitlisted").length;

  async function handleAction(id: string, status: string) {
    try {
      await updateStatus.mutateAsync({ id, status: status as any });
      const labels: Record<string, string> = { accepted: "Accepted", denied: "Denied", waitlisted: "Waitlisted", active: "Marked active" };
      toast.success(labels[status] ?? "Updated");
    } catch {
      toast.error("Action failed");
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Club Admin"
        title="Registrations"
        subtitle="Review, approve, and manage player registrations."
        actions={
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge variant="secondary" style={{ color: "oklch(0.72 0.17 75)" }}>
                {pendingCount} pending
              </Badge>
            )}
            {waitlistedCount > 0 && (
              <Badge variant="secondary" style={{ color: "oklch(0.65 0.15 230)" }}>
                {waitlistedCount} waitlisted
              </Badge>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-muted/40 rounded-lg p-1 w-fit">
        {(["pipeline", "compliance"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all capitalize"
            style={tab === t ? { background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: "oklch(0.5 0 0)" }}
          >
            {t === "pipeline" ? (
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Pipeline</span>
            ) : (
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Compliance</span>
            )}
          </button>
        ))}
      </div>

      {tab === "compliance" ? (
        <ComplianceTab />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search player or guardian…"
                className="pl-8 h-8 text-[12px]"
              />
            </div>
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-card text-[12px] px-2"
            >
              <option value="">All seasons</option>
              {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-card text-[12px] px-2"
            >
              <option value="">All statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-6 py-12 flex flex-col items-center text-center gap-3">
              <Users className="w-8 h-8 text-muted-foreground/30" />
              <p className="font-semibold">No registrations found</p>
              <p className="text-[12px] text-muted-foreground">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((reg) => (
                <RegistrationRow key={reg.id} reg={reg} onAction={handleAction} />
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
