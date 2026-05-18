/**
 * AdminBillingPage — Dues collection and invoice management.
 *
 * Tabs: Invoices list, Record payment modal, Revenue summary.
 */
import { useState } from "react";
import {
  DollarSign, AlertTriangle, CheckCircle2, Clock, Search,
  ChevronDown, ChevronUp, Plus, Loader2, CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInvoices, useSeasons, useRecordPayment } from "@/lib/api/hooks/useAdmin";
import type { Invoice } from "@/features/admin/mock";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function cents(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const INV_STATUS = {
  draft:     { label: "Draft",     color: "oklch(0.5 0 0)" },
  open:      { label: "Open",      color: "oklch(0.65 0.15 230)" },
  paid:      { label: "Paid",      color: "oklch(0.75 0.12 140)" },
  partial:   { label: "Partial",   color: "oklch(0.72 0.18 290)" },
  overdue:   { label: "Overdue",   color: "oklch(0.68 0.22 25)" },
  void:      { label: "Void",      color: "oklch(0.5 0 0)" },
  refunded:  { label: "Refunded",  color: "oklch(0.5 0 0)" },
  write_off: { label: "Write-off", color: "oklch(0.5 0 0)" },
} as const;

/* -------------------------------------------------------------------------- */
/* Payment modal                                                                */
/* -------------------------------------------------------------------------- */

function RecordPaymentModal({
  invoice, onClose,
}: {
  invoice: Invoice;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String((invoice.amountDue / 100).toFixed(2)));
  const [method, setMethod] = useState("cash");
  const [ref, setRef] = useState("");
  const recordPayment = useRecordPayment();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!amountCents || amountCents <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await recordPayment.mutateAsync({
        invoiceId: invoice.id,
        amount: amountCents,
        method,
        referenceNote: ref || undefined,
      });
      toast.success("Payment recorded");
      onClose();
    } catch {
      toast.error("Failed to record payment");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-md p-5">
        <h3 className="font-bold text-[16px] mb-1">Record payment</h3>
        <p className="text-[12px] text-muted-foreground mb-4">
          Invoice {invoice.invoiceNumber} · {invoice.playerName}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[12px] font-medium block mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[12px]">$</span>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-6 text-[13px]"
                inputMode="decimal"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Balance due: {cents(invoice.amountDue)}</p>
          </div>
          <div>
            <label className="text-[12px] font-medium block mb-1">Payment method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background text-[12px] px-2"
            >
              {["cash","check","zelle","venmo","paypal","stripe_card","stripe_ach","other"].map((m) => (
                <option key={m} value={m}>{m.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-medium block mb-1">Reference note (optional)</label>
            <Input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="Check #1042, Zelle conf: XYZ…"
              className="text-[12px]"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1 gap-1.5" style={{ background: "oklch(0.75 0.12 140)" }}
              disabled={recordPayment.isPending}>
              {recordPayment.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Record payment
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Invoice row                                                                  */
/* -------------------------------------------------------------------------- */

function InvoiceRow({ inv, onRecordPayment }: { inv: Invoice; onRecordPayment: (inv: Invoice) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = INV_STATUS[inv.status];
  const isActionable = ["open", "partial", "overdue"].includes(inv.status);

  return (
    <div className="border border-border rounded-xl overflow-hidden" style={inv.status === "overdue" ? { borderColor: "oklch(0.68 0.22 25 / 0.4)" } : undefined}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        <div>
          <div className="font-semibold text-[13px]">{inv.playerName}</div>
          <div className="text-[11px] text-muted-foreground">{inv.invoiceNumber} · {inv.memo ?? inv.seasonName}</div>
        </div>
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="font-mono font-bold text-[14px]" style={{ color: isActionable ? cfg.color : undefined }}>
              {isActionable ? cents(inv.amountDue) : cents(inv.totalAmount)}
            </div>
            <div className="text-[10px] text-muted-foreground">{isActionable ? "due" : "total"}</div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${cfg.color}15`, color: cfg.color }}>
            {cfg.label}
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          <div className="grid sm:grid-cols-2 gap-2 mb-3 text-[12px]">
            <div className="space-y-1">
              <div><span className="text-muted-foreground">Total:</span> {cents(inv.totalAmount)}</div>
              <div><span className="text-muted-foreground">Paid:</span> {cents(inv.amountPaid)}</div>
              <div><span className="text-muted-foreground">Balance:</span> <span style={{ color: inv.amountDue > 0 ? cfg.color : undefined }}>{cents(inv.amountDue)}</span></div>
            </div>
            <div className="space-y-1">
              {inv.dueDate && <div><span className="text-muted-foreground">Due:</span> {formatDate(inv.dueDate)}</div>}
              {inv.issuedAt && <div><span className="text-muted-foreground">Issued:</span> {formatDate(inv.issuedAt)}</div>}
              {inv.paidAt && <div><span className="text-muted-foreground">Paid:</span> {formatDate(inv.paidAt)}</div>}
            </div>
          </div>
          {isActionable && (
            <Button size="sm" className="gap-1.5 text-[11px]" onClick={() => onRecordPayment(inv)}
              style={{ background: "oklch(0.72 0.18 290)" }}>
              <CreditCard className="w-3.5 h-3.5" /> Record payment
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary strip                                                                */
/* -------------------------------------------------------------------------- */

function SummaryStrip({ invoices }: { invoices: Invoice[] }) {
  const totalBilled = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalCollected = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const totalDue = invoices.reduce((s, i) => s + i.amountDue, 0);
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Total billed", value: cents(totalBilled) },
        { label: "Collected", value: cents(totalCollected), color: "oklch(0.75 0.12 140)" },
        { label: "Outstanding", value: cents(totalDue), color: totalDue > 0 ? "oklch(0.72 0.17 75)" : undefined },
        { label: "Overdue", value: overdueCount, color: overdueCount > 0 ? "oklch(0.68 0.22 25)" : undefined },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3 text-center">
          <div className="font-mono font-bold text-[20px] leading-none" style={s.color ? { color: s.color } : undefined}>{s.value}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main                                                                         */
/* -------------------------------------------------------------------------- */

export default function AdminBillingPage() {
  const [seasonFilter, setSeasonFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null);

  const { data: seasons = [] } = useSeasons();
  const { data: invoices = [], isLoading } = useInvoices({
    seasonId: seasonFilter || undefined,
    status: statusFilter || undefined,
  });

  const filtered = invoices.filter((inv) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return inv.playerName.toLowerCase().includes(q) || inv.invoiceNumber.toLowerCase().includes(q);
  });

  const overdueCount = filtered.filter((i) => i.status === "overdue").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Club Admin"
        title="Billing & Dues"
        subtitle="Track invoices, record payments, and monitor collection."
        actions={
          overdueCount > 0 ? (
            <Badge variant="secondary" style={{ color: "oklch(0.68 0.22 25)" }}>
              {overdueCount} overdue
            </Badge>
          ) : undefined
        }
      />

      <div className="space-y-5">
        {!isLoading && <SummaryStrip invoices={filtered} />}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search player or invoice #…" className="pl-8 h-8 text-[12px]" />
          </div>
          <select value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)} className="h-8 rounded-md border border-border bg-card text-[12px] px-2">
            <option value="">All seasons</option>
            {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 rounded-md border border-border bg-card text-[12px] px-2">
            <option value="">All statuses</option>
            {Object.entries(INV_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-12 flex flex-col items-center text-center gap-3">
            <DollarSign className="w-8 h-8 text-muted-foreground/30" />
            <p className="font-semibold">No invoices found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Overdue first */}
            {filtered.filter((i) => i.status === "overdue").length > 0 && (
              <div className="mb-4">
                <h2 className="font-semibold text-[12px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" style={{ color: "oklch(0.68 0.22 25)" }} />
                  Overdue
                </h2>
                {filtered.filter((i) => i.status === "overdue").map((inv) => (
                  <InvoiceRow key={inv.id} inv={inv} onRecordPayment={setPaymentTarget} />
                ))}
              </div>
            )}
            {/* Remaining */}
            {filtered.filter((i) => i.status !== "overdue").map((inv) => (
              <InvoiceRow key={inv.id} inv={inv} onRecordPayment={setPaymentTarget} />
            ))}
          </div>
        )}
      </div>

      {paymentTarget && (
        <RecordPaymentModal invoice={paymentTarget} onClose={() => setPaymentTarget(null)} />
      )}
    </AppShell>
  );
}
