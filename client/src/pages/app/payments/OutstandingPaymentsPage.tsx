/**
 * OutstandingPaymentsPage — operational exception queue for overdue + partial accounts.
 * Route: /app/payments/outstanding
 *
 * Modeled after AtRiskInterventionPage: sorted queue with bulk actions, priority triage,
 * inline remind/waive/extend, and clear visual escalation by days overdue.
 */

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckSquare,
  MessageSquare,
  Clock,
  ChevronDown,
  ChevronUp,
  Phone,
  MoreHorizontal,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import {
  MOCK_PAYMENT_ACCOUNTS,
  computeStats,
  formatCents,
  daysOverdue,
  type PaymentAccount,
} from "@/features/payments/mock";

/* ─── Priority tier ────────────────────────────────────────────────────────── */

type PriorityTier = "critical" | "high" | "medium";

function getTier(account: PaymentAccount): PriorityTier {
  const d = daysOverdue(account.dueDate);
  if (d >= 30 || account.balanceCents >= 42500) return "critical";
  if (d >= 14 || account.balanceCents >= 20000) return "high";
  return "medium";
}

const TIER_CONFIG: Record<PriorityTier, { label: string; bg: string; text: string; dot: string; border: string }> = {
  critical: {
    label: "Critical",
    bg: "oklch(0.68 0.22 25 / 0.10)",
    text: "oklch(0.50 0.24 25)",
    dot: "oklch(0.50 0.24 25)",
    border: "oklch(0.68 0.22 25 / 0.3)",
  },
  high: {
    label: "High",
    bg: "oklch(0.78 0.16 75 / 0.10)",
    text: "oklch(0.55 0.18 75)",
    dot: "oklch(0.65 0.18 75)",
    border: "oklch(0.78 0.16 75 / 0.3)",
  },
  medium: {
    label: "Medium",
    bg: "oklch(0.72 0.18 290 / 0.08)",
    text: "oklch(0.55 0.18 290)",
    dot: "oklch(0.65 0.18 290)",
    border: "oklch(0.72 0.18 290 / 0.3)",
  },
};

/* ─── Priority badge ───────────────────────────────────────────────────────── */

function PriorityBadge({ tier }: { tier: PriorityTier }) {
  const c = TIER_CONFIG[tier];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}

/* ─── Account card ─────────────────────────────────────────────────────────── */

function AccountCard({
  account,
  selected,
  onSelect,
  onRemind,
  onWaive,
  onExtend,
}: {
  account: PaymentAccount;
  selected: boolean;
  onSelect: () => void;
  onRemind: () => void;
  onWaive: () => void;
  onExtend: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const tier = getTier(account);
  const c = TIER_CONFIG[tier];
  const days = daysOverdue(account.dueDate);
  const pctPaid = account.totalOwedCents > 0
    ? Math.round((account.totalPaidCents / account.totalOwedCents) * 100)
    : 0;

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: selected ? "oklch(0.72 0.18 290 / 0.6)" : c.border,
        background: selected ? "oklch(0.72 0.18 290 / 0.04)" : "var(--bg-surface)",
      }}
    >
      {/* Priority stripe */}
      <div
        className="h-0.5 w-full"
        style={{ background: c.dot }}
      />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="mt-1 rounded flex-shrink-0"
          />

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {account.playerName}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{account.playerTeam}</span>
                  <PriorityBadge tier={tier} />
                </div>
                <div className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Guardian: {account.guardianName}
                  {account.guardianPhone && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5" /> {account.guardianPhone}
                    </span>
                  )}
                </div>
              </div>

              {/* Balance + days */}
              <div className="text-right flex-shrink-0">
                <div
                  className="text-lg font-bold tabular-nums"
                  style={{ color: tier === "critical" ? "oklch(0.50 0.24 25)" : "var(--text-primary)" }}
                >
                  {formatCents(account.balanceCents)}
                </div>
                <div className="text-xs" style={{ color: c.text }}>
                  {account.status === "overdue" ? `${days}d overdue` : "Partial"}
                </div>
              </div>
            </div>

            {/* Progress bar for partial payments */}
            {account.totalPaidCents > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                  <span>{formatCents(account.totalPaidCents)} collected</span>
                  <span>{pctPaid}% of {formatCents(account.totalOwedCents)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pctPaid}%`, background: "oklch(0.65 0.18 75)" }}
                  />
                </div>
              </div>
            )}

            {/* Fee + reminder info */}
            <div className="flex items-center gap-3 mt-2 text-xs flex-wrap" style={{ color: "var(--text-muted)" }}>
              <span>{account.feeName}</span>
              {account.reminderCount > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {account.reminderCount} reminder{account.reminderCount > 1 ? "s" : ""} sent
                </span>
              )}
              {account.internalNotes && (
                <button
                  onClick={() => setExpanded(e => !e)}
                  className="flex items-center gap-1 underline"
                >
                  Staff note {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            {/* Expanded note */}
            {expanded && account.internalNotes && (
              <div
                className="mt-2 text-xs p-2.5 rounded border"
                style={{ borderColor: "var(--border)", background: "var(--bg-base)", color: "var(--text-primary)" }}
              >
                {account.internalNotes}
              </div>
            )}
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={onRemind}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border font-medium flex-1 justify-center"
            style={{ borderColor: "oklch(0.72 0.18 290 / 0.4)", color: "oklch(0.65 0.18 290)", background: "oklch(0.72 0.18 290 / 0.06)" }}
          >
            <MessageSquare className="w-3 h-3" /> Send Reminder
          </button>
          <button
            onClick={onExtend}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border font-medium flex-1 justify-center"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <Clock className="w-3 h-3" /> Extend Due Date
          </button>
          <button
            onClick={onWaive}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border font-medium flex-1 justify-center"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <CheckSquare className="w-3 h-3" /> Mark Waived
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Bulk action bar ──────────────────────────────────────────────────────── */

function BulkActionBar({
  count,
  onRemind,
  onExtend,
  onWaive,
  onClear,
}: {
  count: number;
  onRemind: () => void;
  onExtend: () => void;
  onWaive: () => void;
  onClear: () => void;
}) {
  if (count === 0) return null;
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 border-b sticky top-0 z-10"
      style={{ background: "oklch(0.72 0.18 290 / 0.08)", borderColor: "oklch(0.72 0.18 290 / 0.3)" }}
    >
      <span className="text-xs font-semibold" style={{ color: "oklch(0.65 0.18 290)" }}>
        {count} selected
      </span>
      <button
        onClick={onRemind}
        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border font-medium"
        style={{ borderColor: "oklch(0.72 0.18 290 / 0.4)", color: "oklch(0.65 0.18 290)", background: "oklch(0.72 0.18 290 / 0.1)" }}
      >
        <MessageSquare className="w-3 h-3" /> Send Reminder
      </button>
      <button
        onClick={onExtend}
        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border font-medium"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        <Clock className="w-3 h-3" /> Extend Due Date
      </button>
      <button
        onClick={onWaive}
        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border font-medium"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        <CheckSquare className="w-3 h-3" /> Mark Waived
      </button>
      <button
        onClick={onClear}
        className="ml-auto text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        Clear
      </button>
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────────────────────── */

export default function OutstandingPaymentsPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<"days" | "balance">("days");

  const outstanding = useMemo(() => {
    return MOCK_PAYMENT_ACCOUNTS.filter(
      a => a.status === "overdue" || a.status === "partial"
    );
  }, []);

  const sorted = useMemo(() => {
    return [...outstanding].sort((a, b) => {
      if (sortKey === "days") return daysOverdue(b.dueDate) - daysOverdue(a.dueDate);
      return b.balanceCents - a.balanceCents;
    });
  }, [outstanding, sortKey]);

  const stats = computeStats(MOCK_PAYMENT_ACCOUNTS);

  const toggleAll = () => {
    if (selected.size === outstanding.length) setSelected(new Set());
    else setSelected(new Set(outstanding.map(a => a.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  function bulkRemind() {
    toast.success(`Reminders queued for ${selected.size} account${selected.size > 1 ? "s" : ""}`);
    setSelected(new Set());
  }
  function bulkExtend() {
    toast.success(`Due dates extended +14 days for ${selected.size} account${selected.size > 1 ? "s" : ""}`);
    setSelected(new Set());
  }
  function bulkWaive() {
    toast.success(`Waiver applied to ${selected.size} account${selected.size > 1 ? "s" : ""}`);
    setSelected(new Set());
  }

  const criticalCount = sorted.filter(a => getTier(a) === "critical").length;
  const highCount = sorted.filter(a => getTier(a) === "high").length;

  return (
    <AppShell>
      <div className="flex flex-col min-h-0" style={{ background: "var(--bg-base)" }}>
        <PageHeader
          title="Outstanding Payments"
          subtitle="Overdue and partial accounts requiring follow-up"
        />

        {/* Summary rail */}
        <div
          className="grid grid-cols-3 gap-px border-b"
          style={{ background: "var(--border)" }}
        >
          {[
            {
              label: "Outstanding Balance",
              value: formatCents(stats.overdueAmountCents + MOCK_PAYMENT_ACCOUNTS.filter(a => a.status === "partial").reduce((s, a) => s + a.balanceCents, 0)),
              sub: `${outstanding.length} accounts`,
              color: "oklch(0.55 0.24 25)",
            },
            {
              label: "Critical (30d+)",
              value: String(criticalCount),
              sub: "need immediate action",
              color: "oklch(0.50 0.24 25)",
            },
            {
              label: "High Priority (14d+)",
              value: String(highCount),
              sub: "follow up this week",
              color: "oklch(0.55 0.18 75)",
            },
          ].map(t => (
            <div key={t.label} className="p-4 flex flex-col gap-1" style={{ background: "var(--bg-surface)" }}>
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{t.label}</span>
              <span className="text-2xl font-bold tabular-nums" style={{ color: t.color }}>{t.value}</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t.sub}</span>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
        >
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--text-muted)" }}>
            <input type="checkbox" checked={selected.size === outstanding.length} onChange={toggleAll} className="rounded" />
            Select all
          </label>

          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Sort:</span>
            {[
              { key: "days" as const, label: "Days Overdue" },
              { key: "balance" as const, label: "Balance" },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setSortKey(s.key)}
                className="text-xs px-2.5 py-1 rounded border"
                style={{
                  background: sortKey === s.key ? "oklch(0.72 0.18 290 / 0.15)" : "transparent",
                  borderColor: sortKey === s.key ? "oklch(0.72 0.18 290 / 0.5)" : "var(--border)",
                  color: sortKey === s.key ? "oklch(0.65 0.18 290)" : "var(--text-muted)",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk action bar */}
        <BulkActionBar
          count={selected.size}
          onRemind={bulkRemind}
          onExtend={bulkExtend}
          onWaive={bulkWaive}
          onClear={() => setSelected(new Set())}
        />

        {/* Queue */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {sorted.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              style={{ color: "var(--text-muted)" }}
            >
              <CheckSquare className="w-8 h-8 mb-3" style={{ opacity: 0.4 }} />
              <div className="text-sm font-medium">No outstanding accounts</div>
              <div className="text-xs mt-1">All payment accounts are current.</div>
            </div>
          ) : (
            sorted.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                selected={selected.has(account.id)}
                onSelect={() => toggleOne(account.id)}
                onRemind={() => toast.success(`Reminder sent to ${account.guardianName}`)}
                onWaive={() => toast.success(`Waiver recorded for ${account.playerName}`)}
                onExtend={() => toast.success(`Due date extended for ${account.playerName}`)}
              />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
