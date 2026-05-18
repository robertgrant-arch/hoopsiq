/**
 * PaymentsDashboardPage — HoopsOS Payments Operations Dashboard
 * Route: /app/payments
 *
 * Operational model: actionable queues, not passive dashboards.
 * Top stat rail → exception queue (overdue) → full account table.
 * Matches Coach HQ density and enterprise feel throughout.
 */

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronRight,
  Download,
  Filter,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import {
  MOCK_PAYMENT_ACCOUNTS,
  MOCK_TRANSACTIONS,
  MOCK_AUDIT_EVENTS,
  MOCK_PLANS,
  computeStats,
  formatCents,
  daysOverdue,
  statusLabel,
  type PaymentAccount,
  type PaymentStatus,
  type FeeType,
} from "@/features/payments/mock";

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface FilterState {
  team: string;
  feeType: string;
  status: string;
  search: string;
}

/* ─── PaymentStatusChip ────────────────────────────────────────────────────── */

function PaymentStatusChip({ status }: { status: PaymentStatus }) {
  const cfg: Record<PaymentStatus, { label: string; bg: string; text: string; dot: string }> = {
    paid:    { label: "Paid",    bg: "oklch(0.75 0.12 140 / 0.15)", text: "oklch(0.65 0.14 140)", dot: "oklch(0.65 0.14 140)" },
    partial: { label: "Partial", bg: "oklch(0.78 0.16 75 / 0.15)",  text: "oklch(0.65 0.18 75)",  dot: "oklch(0.65 0.18 75)"  },
    overdue: { label: "Overdue", bg: "oklch(0.68 0.22 25 / 0.15)",  text: "oklch(0.55 0.24 25)",  dot: "oklch(0.55 0.24 25)"  },
    pending: { label: "Pending", bg: "oklch(0.55 0.02 260 / 0.12)", text: "oklch(0.55 0.02 260)", dot: "oklch(0.55 0.02 260)" },
    waived:  { label: "Waived",  bg: "oklch(0.55 0.02 260 / 0.10)", text: "oklch(0.50 0.02 260)", dot: "oklch(0.50 0.02 260)" },
    plan:    { label: "On Plan", bg: "oklch(0.72 0.18 290 / 0.15)", text: "oklch(0.65 0.18 290)", dot: "oklch(0.65 0.18 290)" },
  };
  const c = cfg[status];

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      <span
        className="inline-block rounded-full flex-shrink-0"
        style={{
          width: 6,
          height: 6,
          background: c.dot,
          opacity: status === "pending" ? 0.5 : 1,
        }}
      />
      {c.label}
    </span>
  );
}

/* ─── Stat rail ────────────────────────────────────────────────────────────── */

function StatRail({ stats }: { stats: ReturnType<typeof computeStats> }) {
  const tiles = [
    {
      label: "Outstanding",
      value: formatCents(stats.totalOutstandingCents),
      sub: `${stats.overdueCount + stats.partialCount} accounts with balances`,
      accent: "var(--text-primary)",
      href: "?status=overdue,partial",
    },
    {
      label: "Overdue",
      value: String(stats.overdueCount),
      sub: formatCents(stats.overdueAmountCents) + " past due",
      accent: "oklch(0.55 0.24 25)",
      href: "?status=overdue",
    },
    {
      label: "Due This Week",
      value: String(stats.dueThisWeekCount),
      sub: formatCents(stats.dueThisWeekAmountCents) + " expected",
      accent: "oklch(0.65 0.18 75)",
      href: "?due=week",
    },
    {
      label: "Collected MTD",
      value: formatCents(stats.collectedMtdCents),
      sub: `${stats.fullyPaidCount} accounts fully cleared`,
      accent: "oklch(0.65 0.14 140)",
      href: "?status=paid",
    },
  ];

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-px"
      style={{ background: "var(--border)" }}
    >
      {tiles.map((t) => (
        <div
          key={t.label}
          className="p-4 flex flex-col gap-1"
          style={{ background: "var(--bg-surface)" }}
        >
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            {t.label}
          </span>
          <span className="text-2xl font-bold tabular-nums" style={{ color: t.accent }}>
            {t.value}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t.sub}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Filter bar ───────────────────────────────────────────────────────────── */

function FilterBar({
  filters,
  onChange,
  total,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  total: number;
}) {
  const teams = Array.from(new Set(MOCK_PAYMENT_ACCOUNTS.map(a => a.playerTeam)));
  const feeTypes: { value: string; label: string }[] = [
    { value: "", label: "All fee types" },
    { value: "season_dues", label: "Season Dues" },
    { value: "tournament", label: "Tournament" },
    { value: "camp", label: "Camp" },
    { value: "travel", label: "Travel" },
    { value: "uniform", label: "Uniform" },
  ];
  const statuses: { value: string; label: string }[] = [
    { value: "", label: "All statuses" },
    { value: "overdue", label: "Overdue" },
    { value: "partial", label: "Partial" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
    { value: "waived", label: "Waived" },
    { value: "plan", label: "On Plan" },
  ];

  const selectStyle: React.CSSProperties = {
    background: "var(--bg-surface)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
    fontSize: 13,
  };

  const hasFilters = filters.team || filters.feeType || filters.status || filters.search;

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-4 py-3 border-b"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <Filter className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />

      {/* Search */}
      <div className="relative flex-1 min-w-[160px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
        <input
          type="text"
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          placeholder="Player or guardian…"
          className="w-full pl-8 pr-3 py-1.5 rounded border text-sm outline-none"
          style={selectStyle}
        />
      </div>

      {/* Team */}
      <select
        value={filters.team}
        onChange={e => onChange({ ...filters, team: e.target.value })}
        className="px-2 py-1.5 rounded border text-sm outline-none"
        style={selectStyle}
      >
        <option value="">All teams</option>
        {teams.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      {/* Fee type */}
      <select
        value={filters.feeType}
        onChange={e => onChange({ ...filters, feeType: e.target.value })}
        className="px-2 py-1.5 rounded border text-sm outline-none"
        style={selectStyle}
      >
        {feeTypes.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>

      {/* Status */}
      <select
        value={filters.status}
        onChange={e => onChange({ ...filters, status: e.target.value })}
        className="px-2 py-1.5 rounded border text-sm outline-none"
        style={selectStyle}
      >
        {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      {hasFilters && (
        <button
          onClick={() => onChange({ team: "", feeType: "", status: "", search: "" })}
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded border"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <X className="w-3 h-3" /> Clear
        </button>
      )}

      <span className="ml-auto text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
        {total} account{total !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

/* ─── Overdue exception queue ──────────────────────────────────────────────── */

function OverdueQueue({
  accounts,
  onRemind,
  onView,
  onWaive,
}: {
  accounts: PaymentAccount[];
  onRemind: (id: string) => void;
  onView: (id: string) => void;
  onWaive: (id: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  if (accounts.length === 0) return null;

  const toggleAll = () => {
    if (selected.size === accounts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(accounts.map(a => a.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  function bulkRemind() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    ids.forEach(id => onRemind(id));
    toast.success(`Reminders queued for ${ids.length} account${ids.length > 1 ? "s" : ""}`);
    setSelected(new Set());
  }

  function bulkExtend() {
    if (selected.size === 0) return;
    toast.success(`Due date extended for ${selected.size} account${selected.size > 1 ? "s" : ""} (+14 days)`);
    setSelected(new Set());
  }

  return (
    <div className="border-b" style={{ borderColor: "var(--border)" }}>
      {/* Queue header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none"
        style={{ background: "oklch(0.68 0.22 25 / 0.06)" }}
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.24 25)" }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.55 0.24 25)" }}>
            Overdue — {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && !collapsed && (
            <>
              <button
                onClick={e => { e.stopPropagation(); bulkRemind(); }}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border font-medium"
                style={{ borderColor: "oklch(0.55 0.24 25 / 0.4)", color: "oklch(0.55 0.24 25)", background: "oklch(0.68 0.22 25 / 0.08)" }}
              >
                <MessageSquare className="w-3 h-3" /> Remind ({selected.size})
              </button>
              <button
                onClick={e => { e.stopPropagation(); bulkExtend(); }}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border font-medium"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-surface)" }}
              >
                Extend Due Date
              </button>
            </>
          )}
          <ChevronRight
            className="w-3.5 h-3.5 transition-transform"
            style={{ color: "var(--text-muted)", transform: collapsed ? "rotate(0deg)" : "rotate(90deg)" }}
          />
        </div>
      </div>

      {!collapsed && (
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid var(--border)`, background: "var(--bg-surface)" }}>
              <th className="w-8 px-4 py-2">
                <input
                  type="checkbox"
                  checked={selected.size === accounts.length}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Player</th>
              <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Guardian</th>
              <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Fee</th>
              <th className="text-right px-3 py-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Balance</th>
              <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Overdue</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {accounts
              .slice()
              .sort((a, b) => daysOverdue(b.dueDate) - daysOverdue(a.dueDate))
              .map(account => (
                <tr
                  key={account.id}
                  className="border-b transition-colors hover:bg-opacity-50"
                  style={{
                    borderColor: "var(--border)",
                    background: selected.has(account.id) ? "oklch(0.68 0.22 25 / 0.06)" : "transparent",
                  }}
                >
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(account.id)}
                      onChange={() => toggleOne(account.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>{account.playerName}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{account.playerTeam}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div style={{ color: "var(--text-primary)" }}>{account.guardianName}</div>
                    {account.guardianPhone && (
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{account.guardianPhone}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div style={{ color: "var(--text-primary)" }}>{account.feeName}</div>
                    <div className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                      {account.feeType.replace("_", " ")}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-semibold tabular-nums" style={{ color: "oklch(0.55 0.24 25)" }}>
                      {formatCents(account.balanceCents)}
                    </span>
                    {account.totalPaidCents > 0 && (
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatCents(account.totalPaidCents)} paid
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-medium" style={{ color: "oklch(0.55 0.24 25)" }}>
                      {daysOverdue(account.dueDate)}d overdue
                    </span>
                    {account.reminderCount > 0 && (
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {account.reminderCount} reminder{account.reminderCount > 1 ? "s" : ""} sent
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => { onRemind(account.id); toast.success(`Reminder sent to ${account.guardianName}`); }}
                        className="text-xs px-2 py-1 rounded border font-medium transition-opacity hover:opacity-70"
                        style={{ borderColor: "var(--border)", color: "oklch(0.65 0.18 290)" }}
                      >
                        Remind
                      </button>
                      <button
                        onClick={() => onView(account.id)}
                        className="text-xs px-2 py-1 rounded border font-medium transition-opacity hover:opacity-70"
                        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => { onWaive(account.id); toast.success(`Waiver recorded for ${account.playerName}`); }}
                        className="text-xs px-2 py-1 rounded border font-medium transition-opacity hover:opacity-70"
                        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                      >
                        Waive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ─── Full account table ───────────────────────────────────────────────────── */

function AccountTable({
  accounts,
  onView,
  onRemind,
}: {
  accounts: PaymentAccount[];
  onView: (id: string) => void;
  onRemind: (id: string) => void;
}) {
  const [sortKey, setSortKey] = useState<"playerName" | "balanceCents" | "dueDate" | "status">("status");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = useMemo(() => {
    const statusOrder: Record<PaymentStatus, number> = { overdue: 0, partial: 1, plan: 2, pending: 3, paid: 4, waived: 5 };
    return [...accounts].sort((a, b) => {
      let v = 0;
      if (sortKey === "playerName") v = a.playerName.localeCompare(b.playerName);
      else if (sortKey === "balanceCents") v = a.balanceCents - b.balanceCents;
      else if (sortKey === "dueDate") v = a.dueDate.localeCompare(b.dueDate);
      else if (sortKey === "status") v = statusOrder[a.status] - statusOrder[b.status];
      return sortDir === "asc" ? v : -v;
    });
  }, [accounts, sortKey, sortDir]);

  function SortHeader({ label, key }: { label: string; key: typeof sortKey }) {
    const active = sortKey === key;
    return (
      <button
        onClick={() => toggleSort(key)}
        className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide"
        style={{ color: active ? "oklch(0.72 0.18 290)" : "var(--text-muted)" }}
      >
        {label}
        <span style={{ opacity: active ? 1 : 0.3 }}>{sortDir === "asc" ? "↑" : "↓"}</span>
      </button>
    );
  }

  return (
    <div>
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: "var(--bg-surface)", borderBottom: `1px solid var(--border)` }}
      >
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          All Accounts — {accounts.length}
        </span>
        <button
          onClick={() => toast.info("Exporting payment report…")}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <Download className="w-3 h-3" /> Export
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: `1px solid var(--border)`, background: "var(--bg-surface)" }}>
            <th className="text-left px-4 py-2">
              <SortHeader label="Player" key="playerName" />
            </th>
            <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Guardian
            </th>
            <th className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Fee
            </th>
            <th className="text-right px-3 py-2">
              <SortHeader label="Balance" key="balanceCents" />
            </th>
            <th className="text-left px-3 py-2">
              <SortHeader label="Due Date" key="dueDate" />
            </th>
            <th className="text-left px-3 py-2">
              <SortHeader label="Status" key="status" />
            </th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {sorted.map(account => (
            <tr
              key={account.id}
              className="border-b transition-colors cursor-pointer"
              style={{ borderColor: "var(--border)" }}
              onClick={() => onView(account.id)}
            >
              <td className="px-4 py-2.5">
                <div className="font-medium" style={{ color: "var(--text-primary)" }}>{account.playerName}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{account.playerTeam}</div>
              </td>
              <td className="px-3 py-2.5" style={{ color: "var(--text-primary)" }}>
                {account.guardianName}
                {account.guardianPhone && (
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{account.guardianPhone}</div>
                )}
              </td>
              <td className="px-3 py-2.5" style={{ color: "var(--text-primary)" }}>
                {account.feeName}
                <div className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                  {account.feeType.replace("_", " ")}
                </div>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                <div
                  className="font-semibold"
                  style={{
                    color: account.balanceCents === 0
                      ? "oklch(0.65 0.14 140)"
                      : account.status === "overdue"
                      ? "oklch(0.55 0.24 25)"
                      : "var(--text-primary)",
                  }}
                >
                  {formatCents(account.balanceCents)}
                </div>
                {account.totalPaidCents > 0 && account.status !== "paid" && (
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatCents(account.totalPaidCents)} paid
                  </div>
                )}
              </td>
              <td className="px-3 py-2.5">
                <div style={{ color: "var(--text-primary)" }}>
                  {new Date(account.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
                {account.status === "overdue" && (
                  <div className="text-xs" style={{ color: "oklch(0.55 0.24 25)" }}>
                    {daysOverdue(account.dueDate)}d ago
                  </div>
                )}
              </td>
              <td className="px-3 py-2.5">
                <PaymentStatusChip status={account.status} />
              </td>
              <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  {account.status === "overdue" || account.status === "partial" ? (
                    <button
                      onClick={() => { onRemind(account.id); toast.success(`Reminder sent to ${account.guardianName}`); }}
                      className="text-xs px-2 py-1 rounded border font-medium"
                      style={{ borderColor: "var(--border)", color: "oklch(0.65 0.18 290)" }}
                    >
                      Remind
                    </button>
                  ) : null}
                  <button
                    onClick={() => onView(account.id)}
                    className="text-xs px-2 py-1 rounded border"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    View
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Payment detail drawer ────────────────────────────────────────────────── */

function PaymentDetailDrawer({
  accountId,
  onClose,
}: {
  accountId: string;
  onClose: () => void;
}) {
  const account = MOCK_PAYMENT_ACCOUNTS.find(a => a.id === accountId);
  const transactions = MOCK_TRANSACTIONS.filter(t => t.accountId === accountId);
  const auditEvents = MOCK_AUDIT_EVENTS.filter(e => e.accountId === accountId);
  const plan = MOCK_PLANS.find(p => p.accountId === accountId);
  const [note, setNote] = useState("");
  const [tab, setTab] = useState<"overview" | "history" | "audit">("overview");

  if (!account) return null;

  const collected = account.totalOwedCents - account.balanceCents - account.totalWaivedCents;
  const pctPaid = account.totalOwedCents > 0
    ? Math.round((account.totalPaidCents / account.totalOwedCents) * 100)
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="relative h-full w-full max-w-lg flex flex-col overflow-hidden"
        style={{ background: "var(--bg-base)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
        >
          <div>
            <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{account.playerName}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {account.guardianName} · {account.playerTeam}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PaymentStatusChip status={account.status} />
            <button onClick={onClose} className="p-1.5 rounded" style={{ color: "var(--text-muted)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Balance summary */}
        <div
          className="grid grid-cols-3 gap-px border-b flex-shrink-0"
          style={{ background: "var(--border)" }}
        >
          {[
            { label: "Total Owed", value: formatCents(account.totalOwedCents), muted: false },
            { label: "Paid", value: formatCents(account.totalPaidCents), muted: false },
            {
              label: "Balance",
              value: formatCents(account.balanceCents),
              muted: account.balanceCents === 0,
              accent: account.status === "overdue"
                ? "oklch(0.55 0.24 25)"
                : account.balanceCents > 0
                ? "oklch(0.65 0.18 75)"
                : "oklch(0.65 0.14 140)",
            },
          ].map(t => (
            <div key={t.label} className="p-3 flex flex-col gap-0.5" style={{ background: "var(--bg-surface)" }}>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t.label}</span>
              <span
                className="text-lg font-bold tabular-nums"
                style={{ color: "accent" in t && t.accent ? t.accent : "var(--text-primary)" }}
              >
                {t.value}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {account.totalOwedCents > 0 && (
          <div className="px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              <span>Collection progress</span>
              <span className="tabular-nums">{pctPaid}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pctPaid}%`,
                  background: pctPaid === 100
                    ? "oklch(0.65 0.14 140)"
                    : pctPaid > 0
                    ? "oklch(0.65 0.18 75)"
                    : "oklch(0.55 0.24 25)",
                }}
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          {(["overview", "history", "audit"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-xs font-medium capitalize border-b-2 transition-colors"
              style={{
                borderBottomColor: tab === t ? "oklch(0.72 0.18 290)" : "transparent",
                color: tab === t ? "oklch(0.72 0.18 290)" : "var(--text-muted)",
              }}
            >
              {t === "history" ? "Transactions" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {tab === "overview" && (
            <div className="p-5 flex flex-col gap-5">
              {/* Fee details */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
                  Fee Details
                </div>
                <div
                  className="rounded-lg border divide-y text-sm"
                  style={{ borderColor: "var(--border)" }}
                >
                  {[
                    { label: "Fee Name", value: account.feeName },
                    { label: "Due Date", value: new Date(account.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
                    { label: "Fee Type", value: account.feeType.replace("_", " ").replace(/^\w/, c => c.toUpperCase()) },
                    { label: "Reminders Sent", value: String(account.reminderCount) },
                    ...(account.lastPaymentDate ? [{ label: "Last Payment", value: new Date(account.lastPaymentDate).toLocaleDateString() }] : []),
                    ...(account.totalWaivedCents > 0 ? [{ label: "Amount Waived", value: formatCents(account.totalWaivedCents) }] : []),
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-3 py-2">
                      <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Installment plan */}
              {plan && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
                    Installment Plan
                  </div>
                  <div className="rounded-lg border overflow-hidden text-sm" style={{ borderColor: "var(--border)" }}>
                    {plan.installments.map((inst, i) => (
                      <div
                        key={inst.id}
                        className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <div>
                          <div style={{ color: "var(--text-primary)" }}>Installment {inst.sequenceNumber}</div>
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Due {new Date(inst.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>
                            {formatCents(inst.amountCents)}
                          </span>
                          <PaymentStatusChip status={inst.status === "paid" ? "paid" : inst.status === "overdue" ? "overdue" : "pending"} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Guardian */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
                  Payment Responsibility
                </div>
                <div
                  className="rounded-lg border px-3 py-3 flex items-center justify-between text-sm"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div>
                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>{account.guardianName}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{account.guardianEmail}</div>
                    {account.guardianPhone && (
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{account.guardianPhone}</div>
                    )}
                  </div>
                  <button
                    onClick={() => toast.success(`Reminder sent to ${account.guardianName}`)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border font-medium"
                    style={{ borderColor: "oklch(0.72 0.18 290 / 0.4)", color: "oklch(0.65 0.18 290)" }}
                  >
                    <MessageSquare className="w-3 h-3" /> Remind
                  </button>
                </div>
              </div>

              {/* Internal notes */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
                  Internal Notes
                </div>
                {account.internalNotes && (
                  <div
                    className="text-sm p-3 rounded-lg border mb-2"
                    style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-surface)" }}
                  >
                    {account.internalNotes}
                  </div>
                )}
                <div className="flex gap-2">
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Add a staff note…"
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                  />
                  <button
                    disabled={!note.trim()}
                    onClick={() => { setNote(""); toast.success("Note saved"); }}
                    className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                    style={{ background: "oklch(0.72 0.18 290 / 0.15)", color: "oklch(0.72 0.18 290)" }}
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Log Manual Payment", color: "oklch(0.75 0.12 140)", fn: () => toast.success("Manual payment logged") },
                  { label: "Apply Waiver / Credit", color: "oklch(0.65 0.18 75)", fn: () => toast.success("Waiver applied") },
                  { label: "Extend Due Date", color: "oklch(0.65 0.18 290)", fn: () => toast.success("Due date extended +14 days") },
                  { label: "Resend Payment Link", color: "var(--text-muted)", fn: () => toast.success("Payment link resent to " + account.guardianEmail) },
                ].map(a => (
                  <button
                    key={a.label}
                    onClick={a.fn}
                    className="px-3 py-2 rounded-lg border text-xs font-medium text-left"
                    style={{ borderColor: "var(--border)", color: a.color }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "history" && (
            <div className="p-5">
              <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
                Transaction History
              </div>
              {transactions.length === 0 ? (
                <div className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                  No transactions recorded yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {transactions.map(tx => (
                    <div
                      key={tx.id}
                      className="rounded-lg border px-3 py-3 text-sm"
                      style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold tabular-nums" style={{ color: "oklch(0.65 0.14 140)" }}>
                          +{formatCents(tx.amountCents)}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded capitalize"
                          style={{ background: "var(--border)", color: "var(--text-muted)" }}
                        >
                          {tx.method}
                        </span>
                      </div>
                      <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        {new Date(tx.processedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {" · "}{tx.processedBy}
                      </div>
                      {tx.notes && <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{tx.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "audit" && (
            <div className="p-5">
              <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
                Audit Log
              </div>
              {auditEvents.length === 0 ? (
                <div className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                  No audit events recorded.
                </div>
              ) : (
                <div className="flex flex-col gap-0">
                  {auditEvents.map((evt, i) => (
                    <div
                      key={evt.id}
                      className="flex gap-3 pb-4"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                          style={{ background: "oklch(0.72 0.18 290)" }}
                        />
                        {i < auditEvents.length - 1 && (
                          <div className="flex-1 w-px mt-1" style={{ background: "var(--border)" }} />
                        )}
                      </div>
                      <div className="flex-1 pb-0">
                        <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                          {evt.detail}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {evt.performedBy} · {new Date(evt.performedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────────────────────── */

export default function PaymentsDashboardPage() {
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState<FilterState>({ team: "", feeType: "", status: "", search: "" });
  const [detailAccountId, setDetailAccountId] = useState<string | null>(null);

  const allAccounts = MOCK_PAYMENT_ACCOUNTS;
  const stats = useMemo(() => computeStats(allAccounts), [allAccounts]);

  const overdueAccounts = useMemo(
    () => allAccounts.filter(a => a.status === "overdue"),
    [allAccounts]
  );

  const filteredAccounts = useMemo(() => {
    return allAccounts.filter(a => {
      if (filters.team && a.playerTeam !== filters.team) return false;
      if (filters.feeType && a.feeType !== filters.feeType) return false;
      if (filters.status && a.status !== filters.status) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!a.playerName.toLowerCase().includes(q) && !a.guardianName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allAccounts, filters]);

  // Non-overdue for the full table (overdue shown in queue above)
  const nonOverdueFiltered = useMemo(
    () => filteredAccounts.filter(a => !(a.status === "overdue" && !filters.status)),
    [filteredAccounts, filters.status]
  );

  return (
    <AppShell>
      <div className="flex flex-col min-h-0" style={{ background: "var(--bg-base)" }}>
        <PageHeader
          title="Payments"
          subtitle="Season fee collection and account management"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/app/payments/create")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                style={{ background: "oklch(0.72 0.18 290)", color: "white" }}
              >
                <Plus className="w-3.5 h-3.5" /> Create Fee Request
              </button>
            </div>
          }
        />

        {/* Stat rail */}
        <StatRail stats={stats} />

        {/* Second-row quick status summary */}
        <div
          className="flex items-center gap-4 px-4 py-2 border-b text-xs"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)", color: "var(--text-muted)" }}
        >
          <span>
            <span className="font-semibold" style={{ color: "oklch(0.65 0.14 140)" }}>{stats.fullyPaidCount}</span> paid
          </span>
          <span>
            <span className="font-semibold" style={{ color: "oklch(0.65 0.18 75)" }}>{stats.partialCount}</span> partial
          </span>
          <span>
            <span className="font-semibold" style={{ color: "oklch(0.55 0.24 25)" }}>{stats.overdueCount}</span> overdue
          </span>
          <span>
            <span className="font-semibold" style={{ color: "oklch(0.65 0.18 290)" }}>{stats.planCount}</span> on plan
          </span>
          <span>
            <span className="font-semibold" style={{ color: "var(--text-muted)" }}>{stats.pendingCount}</span> pending
          </span>
          <span>
            <span className="font-semibold" style={{ color: "var(--text-muted)" }}>{stats.waivedCount}</span> waived
          </span>
          <span className="ml-auto">
            <button
              onClick={() => navigate("/app/payments/outstanding")}
              className="flex items-center gap-1 font-medium"
              style={{ color: "oklch(0.72 0.18 290)" }}
            >
              View outstanding queue <ChevronRight className="w-3 h-3" />
            </button>
          </span>
        </div>

        {/* Filter bar */}
        <FilterBar filters={filters} onChange={setFilters} total={filteredAccounts.length} />

        {/* Overdue exception queue — always shown at top, unaffected by filters unless status filter is active */}
        {!filters.status && (
          <OverdueQueue
            accounts={overdueAccounts}
            onRemind={id => { /* logged in toast handler */ }}
            onView={setDetailAccountId}
            onWaive={id => { /* handler */ }}
          />
        )}

        {/* Full table */}
        <div className="flex-1 overflow-auto">
          <AccountTable
            accounts={filters.status === "overdue" ? filteredAccounts : nonOverdueFiltered}
            onView={setDetailAccountId}
            onRemind={id => toast.success(`Reminder sent`)}
          />
        </div>
      </div>

      {/* Detail drawer */}
      {detailAccountId && (
        <PaymentDetailDrawer
          accountId={detailAccountId}
          onClose={() => setDetailAccountId(null)}
        />
      )}
    </AppShell>
  );
}
