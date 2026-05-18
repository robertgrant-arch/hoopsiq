import { useState } from "react";
import {
  CreditCard, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, Download, Info,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockBillingItems, type BillingLineItem } from "@/features/parent/mock";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatAmount(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

const STATUS_CONFIG = {
  paid: { label: "Paid", icon: CheckCircle2, color: "oklch(0.75 0.12 140)" },
  pending: { label: "Due", icon: Clock, color: "oklch(0.78 0.17 75)" },
  overdue: { label: "Overdue", icon: AlertCircle, color: "oklch(0.68 0.22 25)" },
  upcoming: { label: "Upcoming", icon: Clock, color: "oklch(0.5 0 0)" },
} as const;

const CAT_LABEL: Record<BillingLineItem["category"], string> = {
  subscription: "Subscription",
  tournament: "Tournament",
  equipment: "Equipment",
  camp: "Camp",
  other: "Other",
};

/* -------------------------------------------------------------------------- */
/* Summary strip                                                                */
/* -------------------------------------------------------------------------- */

function SummaryStrip() {
  const pending = mockBillingItems.filter((b) => b.status === "pending");
  const overdue = mockBillingItems.filter((b) => b.status === "overdue");
  const paid30d = mockBillingItems
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + b.amount, 0);
  const pendingTotal = [...pending, ...overdue].reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        {
          label: "Balance due",
          value: formatAmount(pendingTotal),
          color: pendingTotal > 0 ? "oklch(0.72 0.17 75)" : "oklch(0.75 0.12 140)",
        },
        { label: "Overdue items", value: overdue.length, color: overdue.length > 0 ? "oklch(0.68 0.22 25)" : undefined },
        { label: "Pending items", value: pending.length },
        { label: "Paid (all time)", value: formatAmount(paid30d) },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3 text-center">
          <div
            className="font-mono text-[22px] font-bold leading-none"
            style={s.color ? { color: s.color } : undefined}
          >
            {s.value}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Billing row                                                                  */
/* -------------------------------------------------------------------------- */

function BillingRow({ item }: { item: BillingLineItem }) {
  const cfg = STATUS_CONFIG[item.status];
  const Icon = cfg.icon;

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors">
      <Icon className="w-4 h-4 shrink-0" style={{ color: cfg.color }} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate">{item.description}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5 flex gap-3">
          <span>{CAT_LABEL[item.category]}</span>
          {item.paidDate
            ? <span>Paid {formatDate(item.paidDate)}</span>
            : <span>Due {formatDate(item.dueDate)}</span>
          }
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-mono font-semibold text-[14px]">{formatAmount(item.amount)}</div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
          style={{ color: cfg.color, background: `${cfg.color}15`, borderColor: `${cfg.color}30` }}
        >
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Subscription card                                                            */
/* -------------------------------------------------------------------------- */

function SubscriptionCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[14px] flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Subscription
        </h3>
        <Badge
          variant="secondary"
          style={{ color: "oklch(0.75 0.12 140)", background: "oklch(0.75 0.12 140 / 0.15)" }}
        >
          Active
        </Badge>
      </div>
      <div className="space-y-2 text-[13px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Plan</span>
          <span className="font-medium">Player Core</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Monthly price</span>
          <span className="font-medium tabular-nums">
            $9.99{" "}
            <span className="text-muted-foreground line-through text-[11px]">$19.99</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Team discount</span>
          <span className="font-medium" style={{ color: "oklch(0.75 0.12 140)" }}>50% — active</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Next renewal</span>
          <span className="font-medium tabular-nums">Jun 15, 2026</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment method</span>
          <span className="font-medium">Visa ···· 4411</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
        <Info className="w-3 h-3 shrink-0" />
        Discount is maintained while Jalen is on an active Texas Elite roster.
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                    */
/* -------------------------------------------------------------------------- */

export default function ParentBillingPage() {
  const [showPaid, setShowPaid] = useState(false);

  const actionItems = mockBillingItems.filter((b) => b.status !== "paid" && b.status !== "upcoming");
  const upcomingItems = mockBillingItems.filter((b) => b.status === "upcoming");
  const paidItems = mockBillingItems.filter((b) => b.status === "paid");

  const hasDue = actionItems.length > 0;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Family Portal"
        title="Billing & Dues"
        subtitle="Manage subscription, tournament fees, and payment history."
        actions={
          hasDue ? (
            <Button
              onClick={() => toast.info("Payment flow would open here — connect Stripe in production.")}
              style={{ background: "oklch(0.72 0.18 290)" }}
              className="text-white"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Pay now
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-5">
        <SummaryStrip />

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Action required */}
            {actionItems.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" style={{ color: "oklch(0.72 0.17 75)" }} />
                  <span className="font-semibold text-[13px]">Requires payment</span>
                  <Badge variant="secondary" className="ml-auto">{actionItems.length}</Badge>
                </div>
                <div className="divide-y divide-border/50">
                  {actionItems.map((item) => <BillingRow key={item.id} item={item} />)}
                </div>
                <div className="px-4 py-3 border-t border-border">
                  <Button
                    className="w-full"
                    onClick={() => toast.info("Payment flow — Stripe integration required in production.")}
                    style={{ background: "oklch(0.72 0.18 290)" }}
                  >
                    Pay all outstanding ({formatAmount(actionItems.reduce((s, b) => s + b.amount, 0))})
                  </Button>
                </div>
              </div>
            )}

            {/* Upcoming */}
            {upcomingItems.length > 0 && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <span className="font-semibold text-[13px]">Upcoming charges</span>
                </div>
                <div className="divide-y divide-border/50">
                  {upcomingItems.map((item) => <BillingRow key={item.id} item={item} />)}
                </div>
              </div>
            )}

            {/* Paid history */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 border-b border-border hover:bg-muted/20 transition-colors"
                onClick={() => setShowPaid((v) => !v)}
              >
                <span className="font-semibold text-[13px]">Payment history</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{paidItems.length} payments</span>
                  {showPaid ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              {showPaid && (
                <div className="divide-y divide-border/50">
                  {paidItems.map((item) => <BillingRow key={item.id} item={item} />)}
                </div>
              )}
              {showPaid && (
                <div className="px-4 py-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => toast.info("Receipt export — available in production.")}
                  >
                    <Download className="w-3.5 h-3.5" /> Export receipts
                  </Button>
                </div>
              )}
            </div>
          </div>

          <SubscriptionCard />
        </div>
      </div>
    </AppShell>
  );
}
