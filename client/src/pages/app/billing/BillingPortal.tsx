/**
 * BillingPortal — `/app/billing`
 * --------------------------------------------------------------------------
 * Source: Prompt 16 §6, §7, §8, §9.
 *
 * The in-app counterpart of Stripe's hosted Customer Portal: shows the user's
 * subscription, payment method, invoices, dunning state, and cancel/resume/
 * pause actions. Also exposes a refund flow against any paid invoice.
 *
 * In production, the "Open Customer Portal" button calls the Stripe SDK's
 * `billingPortal.sessions.create` and redirects to the hosted portal — this
 * page is the demo equivalent.
 */

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CreditCard,
  ExternalLink,
  FileText,
  History,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Tag,
  XCircle,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { useBillingStore, cancelAtPeriodEnd, openPortal, pauseSubscription, refundInvoice, resumeSubscription, findPrice, findProduct, formatCents, Invoice, Subscription } from "@/lib/billing";





function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusColor(status: Subscription["status"]) {
  switch (status) {
    case "ACTIVE":
      return "oklch(0.78 0.16 145)";
    case "TRIALING":
      return "oklch(0.78 0.16 75)";
    case "PAST_DUE":
      return "oklch(0.7 0.22 25)";
    case "PAUSED":
      return "oklch(0.62 0.04 240)";
    case "CANCELED":
    case "INCOMPLETE_EXPIRED":
      return "oklch(0.6 0.02 240)";
    default:
      return "oklch(0.7 0.06 240)";
  }
}

export function BillingPortal() {
  const { user } = useAuth();
  const subs = useBillingStore((s) => s.subscriptions);
  const invs = useBillingStore((s) => s.invoices);
  const audit = useBillingStore((s) => s.audit);
  const aiCredits = useBillingStore((s) => s.aiCredits);

  if (!user) return null;

  // The user's primary subscription (most-recently-updated active row).
  const sub = useMemo(
    () =>
      subs
        .filter((s) => s.customerId === user.id && s.status !== "CANCELED")
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0],
    [subs, user.id],
  );

  const userInvoices = useMemo(
    () =>
      invs
        .filter((i) => i.customerId === user.id)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [invs, user.id],
  );

  const userAudit = useMemo(
    () =>
      audit
        .filter((a) => a.subjectUserId === user.id)
        .slice(0, 12),
    [audit, user.id],
  );

  const credits = aiCredits.find((m) => m.userId === user.id);

  return (
    <AppShell>
      <PageHeader
        eyebrow="HoopsIQ · Billing"
        title="Billing & Subscriptions"
        subtitle="Active plan, invoices, and account state. Same surface as Stripe's Customer Portal — wired to the demo entitlement engine."
        actions={
          <div className="flex gap-2">
            <Link href="/app/billing/pricing">
              <Button variant="outline" size="sm">
                <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />
                Upgrade plan
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => {
                const r = openPortal(user.id);
                toast.success("Opening Stripe Customer Portal (mock)…", {
                  description: r.hostedUrl,
                });
              }}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Open Stripe Portal
            </Button>
          </div>
        }
      />

      {/* Dunning banner */}
      {sub?.dunning && (
        <div className="mb-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-destructive">
              Payment failed — your access stays on through {formatDate(sub.dunning.graceUntil)}
            </div>
            <div className="text-[12.5px] text-muted-foreground mt-1">
              We'll retry the payment {sub.dunning.attempts < 3 ? `${3 - sub.dunning.attempts} more time${sub.dunning.attempts === 2 ? "" : "s"}` : "again soon"}.
              Update your payment method in the Stripe Portal to avoid losing access.
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/40 text-destructive"
            onClick={() => toast.success("Stripe Portal opened to update card (mock)")}
          >
            Update card
          </Button>
        </div>
      )}

      {/* Subscription card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          {sub ? (
            <ActiveSubscriptionCard sub={sub} />
          ) : (
            <div className="text-center py-12">
              <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-display text-lg uppercase tracking-tight mb-2">
                No active subscription
              </h3>
              <p className="text-[13px] text-muted-foreground mb-4">
                Pick a plan to unlock the full HoopsIQ experience.
              </p>
              <Link href="/app/billing/pricing">
                <Button>See plans</Button>
              </Link>
            </div>
          )}
        </div>

        {/* AI credits + payment method */}
        <div className="space-y-4">
          {credits && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-2">
                AI feedback credits
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl text-primary">
                  {credits.balance}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  remaining
                </span>
              </div>
              <div className="mt-2 text-[11.5px] text-muted-foreground">
                {credits.totalConsumed} consumed lifetime
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => toast.info("Opening Stripe Checkout for credit pack (mock)")}
              >
                Buy more credits
              </Button>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-2">
              Payment method
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="font-mono text-[12.5px]">Visa •••• 4242</span>
            </div>
            <div className="text-[11.5px] text-muted-foreground mt-1">
              Expires 12/27
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => toast.info("Stripe Portal opened to update card (mock)")}
            >
              Update
            </Button>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <section className="rounded-xl border border-border bg-card overflow-hidden mb-6">
        <header className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">
              Invoices
            </div>
            <h3 className="font-display text-base uppercase tracking-tight">
              {userInvoices.length} on record
            </h3>
          </div>
          <Button variant="ghost" size="sm">
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Download all
          </Button>
        </header>
        <div className="divide-y divide-border">
          {userInvoices.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No invoices yet.
            </div>
          )}
          {userInvoices.map((inv) => (
            <InvoiceRow key={inv.id} invoice={inv} />
          ))}
        </div>
      </section>

      {/* Audit log */}
      {userAudit.length > 0 && (
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <header className="flex items-center gap-2 px-5 py-3 border-b border-border">
            <History className="w-3.5 h-3.5 text-muted-foreground" />
            <h3 className="font-display text-base uppercase tracking-tight">
              Account activity
            </h3>
          </header>
          <div className="divide-y divide-border">
            {userAudit.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 px-5 py-2.5 text-[12.5px]"
              >
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground w-44 shrink-0">
                  {a.action.replace(/_/g, " ")}
                </span>
                <span className="flex-1 text-muted-foreground">
                  {Object.entries(a.metadata)
                    .filter(([k]) => k !== "source")
                    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                    .join(" · ") || "—"}
                </span>
                <span className="font-mono text-[10.5px] text-muted-foreground">
                  {new Date(a.occurredAt).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */

function ActiveSubscriptionCard({ sub }: { sub: Subscription }) {
  const product = findProduct(sub.productId);
  const price = findPrice(sub.priceId);
  if (!product || !price) return null;
  const color = statusColor(sub.status);

  function handleCancel() {
    cancelAtPeriodEnd(sub.id);
    toast.success(`Will cancel at the end of the period · ${formatDate(sub.currentPeriodEnd)}`);
  }
  function handleResume() {
    resumeSubscription(sub.id);
    toast.success("Subscription resumed");
  }
  function handlePause() {
    pauseSubscription(sub.id);
    toast.success("Subscription paused");
  }

  const baseAmount = price.amount;
  const couponDiscount =
    sub.couponCode === "COACH50" ? Math.round(baseAmount * 0.5) : 0;
  const seatExtras =
    product.tier === "TEAM_PRO" && sub.seatCount && price.includedSeats
      ? Math.max(0, sub.seatCount - price.includedSeats) *
        (price.perExtraUnitAmount ?? 0)
      : 0;
  const net = baseAmount - couponDiscount + seatExtras;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className="text-[10px] uppercase tracking-[0.14em] font-mono mb-1.5"
            style={{ color: product.accent }}
          >
            {product.tier.replace(/_/g, " ")}
          </div>
          <h2 className="font-display text-2xl uppercase tracking-tight">
            {product.name}
          </h2>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            {product.description}
          </p>
        </div>
        <Badge
          className="font-mono uppercase tracking-wider text-[10px] shrink-0"
          style={{ background: `${color.replace(")", " / 0.18)")}`, color }}
        >
          {sub.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Pricing breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        <Stat
          label="Base"
          value={`${formatCents(baseAmount)}/${price.cadence === "ANNUAL" ? "yr" : "mo"}`}
        />
        {sub.couponCode && (
          <Stat
            label={`Coupon ${sub.couponCode}`}
            value={`-${formatCents(couponDiscount)}`}
            tone="primary"
            icon={<Tag className="w-3 h-3" />}
          />
        )}
        {seatExtras > 0 && (
          <Stat label="Seat overages" value={formatCents(seatExtras)} />
        )}
        <Stat
          label="Net per cycle"
          value={formatCents(net)}
          tone="primary"
        />
      </div>

      {/* Period + actions */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <CalendarClock className="w-3.5 h-3.5" />
          <span>
            Current period:{" "}
            <strong className="text-foreground">
              {formatDate(sub.currentPeriodStart)}
            </strong>{" "}
            →{" "}
            <strong className="text-foreground">
              {formatDate(sub.currentPeriodEnd)}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sub.status === "PAUSED" ? (
            <Button size="sm" variant="outline" onClick={handleResume}>
              <Play className="w-3.5 h-3.5 mr-1.5" /> Resume
            </Button>
          ) : sub.cancelAtPeriodEnd ? (
            <Button size="sm" variant="outline" onClick={handleResume}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Don't cancel
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={handlePause}>
                <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/40 hover:bg-destructive/10"
                onClick={handleCancel}
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" /> Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {sub.cancelAtPeriodEnd && (
        <div className="mt-3 rounded-md bg-muted/30 border border-border px-3 py-2 text-[12px] text-muted-foreground">
          Cancellation is queued. You'll keep access through{" "}
          <strong className="text-foreground">
            {formatDate(sub.currentPeriodEnd)}
          </strong>
          .
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const isPaid = invoice.status === "PAID";
  const isRefunded = !!invoice.refundedAt;

  function handleRefund() {
    if (!confirm(`Refund ${formatCents(invoice.amountPaid)} to the customer?`)) return;
    refundInvoice(invoice.id);
    toast.success(`Refund processed · ${formatCents(invoice.amountPaid)}`);
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <FileText className="w-4 h-4 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11.5px] text-muted-foreground">
            {invoice.stripeInvoiceId}
          </span>
          <Badge
            variant="outline"
            className={`text-[9.5px] uppercase tracking-wider ${
              isRefunded
                ? "text-blue-400 border-blue-500/40"
                : isPaid
                  ? "text-emerald-400 border-emerald-500/40"
                  : "text-destructive border-destructive/40"
            }`}
          >
            {isRefunded ? "REFUNDED" : invoice.status}
          </Badge>
          {invoice.appliedCoupons.map((c) => (
            <Badge
              key={c}
              variant="outline"
              className="text-[9.5px] uppercase tracking-wider text-primary border-primary/40"
            >
              {c}
            </Badge>
          ))}
        </div>
        <div className="text-[11.5px] text-muted-foreground mt-0.5">
          {formatDate(invoice.createdAt)} · {formatCents(invoice.amountDue)}
          {isPaid && invoice.amountPaid !== invoice.amountDue
            ? ` · paid ${formatCents(invoice.amountPaid)}`
            : ""}
        </div>
      </div>
      {isPaid && !isRefunded && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefund}
          className="text-muted-foreground hover:text-destructive"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refund
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: "primary";
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div
        className={`font-display text-lg ${tone === "primary" ? "text-primary" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
