/**
 * BillingAdmin — `/app/admin/billing`
 * --------------------------------------------------------------------------
 * Source: Prompt 16 §10 (analytics) + §2 (webhook simulator).
 *
 * Internal-only. Surfaces MRR/ARR/churn/LTV/ARPU and lets a developer fire
 * synthetic Stripe webhooks against the in-memory store to verify the
 * entitlement engine end-to-end.
 */

import { useMemo, useState } from "react";
import {
  ActivityIcon,
  BellRing,
  Bug,
  CircleDollarSign,
  CreditCard,
  Crown,
  Layers,
  Repeat2,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { computeKPIs, useBillingStore, dispatchWebhook, type SimulatedEvent, formatCents, expireGrandfathers, grantCoachLink, revokeCoachLink } from "@/lib/billing";







export function BillingAdmin() {
  const subs = useBillingStore((s) => s.subscriptions);
  const events = useBillingStore((s) => s.webhookEvents);
  const audit = useBillingStore((s) => s.audit);
  const reset = useBillingStore((s) => s.reset);

  const kpis = useMemo(() => computeKPIs(), [subs, events, audit]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppShell>
      <PageHeader
        eyebrow="Internal · Billing"
        title="Billing & Entitlements Console"
        subtitle="MRR, churn, LTV, payout pool, and a Stripe webhook simulator. Read-only in production except for the simulator."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              reset();
              toast.success("Billing store reset to seed data");
            }}
          >
            <Repeat2 className="w-3.5 h-3.5 mr-1.5" />
            Reset to seed
          </Button>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPI
          icon={<CircleDollarSign className="w-4 h-4" />}
          label="MRR"
          value={formatCents(kpis.mrr)}
          sublabel={`${formatCents(kpis.arr)}/yr ARR`}
          tone="primary"
        />
        <KPI
          icon={<Users className="w-4 h-4" />}
          label="Active subs"
          value={kpis.activeSubscriptions.toString()}
          sublabel={`${kpis.payingCustomers} paying customers`}
        />
        <KPI
          icon={<Target className="w-4 h-4" />}
          label="ARPU"
          value={`${formatCents(kpis.arpu)}/mo`}
          sublabel={`LTV ≈ ${formatCents(kpis.ltv)}`}
        />
        <KPI
          icon={<Zap className="w-4 h-4 text-amber-400" />}
          label="Monthly churn"
          value={`${(kpis.monthlyChurnRate * 100).toFixed(1)}%`}
          sublabel={`${kpis.monthlyChurnCount} cancels this period`}
          tone="amber"
        />
      </div>

      {/* Product mix + revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <section className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
          <header className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h3 className="font-display text-base uppercase tracking-tight">
              MRR by product
            </h3>
            <span className="text-[11.5px] text-muted-foreground font-mono">
              {kpis.activeSubscriptions} subs total
            </span>
          </header>
          <div className="divide-y divide-border">
            {kpis.productMix.map((p) => {
              const pct =
                kpis.mrr === 0 ? 0 : Math.round((p.mrr / kpis.mrr) * 100);
              return (
                <div
                  key={p.productId}
                  className="px-5 py-3 flex items-center gap-3"
                >
                  <Crown className="w-3.5 h-3.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium">{p.name}</span>
                      <span className="font-mono text-muted-foreground">
                        {p.subs} subs · {pct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="font-display text-sm w-24 text-right">
                    {formatCents(p.mrr)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <header className="px-5 py-3 border-b border-border">
            <h3 className="font-display text-base uppercase tracking-tight">
              Revenue
            </h3>
          </header>
          <div className="p-5 space-y-3">
            <Stat label="This month" value={formatCents(kpis.monthlyRevenue)} />
            <Stat label="Lifetime" value={formatCents(kpis.lifetimeRevenue)} />
            <Stat
              label="Marketplace gross"
              value={formatCents(kpis.marketplaceGross)}
            />
            <Stat
              label="Platform fees (15%)"
              value={formatCents(kpis.marketplacePlatformFee)}
              tone="primary"
            />
            <Stat
              label="Paid to experts"
              value={formatCents(kpis.marketplacePayoutsToExperts)}
            />
          </div>
        </section>
      </div>

      {/* Subscription status histogram + simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <header className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h3 className="font-display text-base uppercase tracking-tight">
              Subscription status
            </h3>
          </header>
          <div className="divide-y divide-border">
            {Object.entries(kpis.byStatus)
              .filter(([, count]) => count > 0)
              .map(([status, count]) => (
                <div
                  key={status}
                  className="px-5 py-2.5 flex items-center justify-between text-[13px]"
                >
                  <span className="font-mono uppercase tracking-wider text-[10.5px] text-muted-foreground">
                    {status.replace(/_/g, " ")}
                  </span>
                  <span className="font-display text-base">{count}</span>
                </div>
              ))}
          </div>
        </section>

        <WebhookSimulator />
      </div>

      {/* Webhook log */}
      <section className="rounded-xl border border-border bg-card overflow-hidden mb-6">
        <header className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="font-display text-base uppercase tracking-tight">
            Webhook log
          </h3>
          <span className="text-[11.5px] text-muted-foreground font-mono">
            {events.length} events
          </span>
        </header>
        <div className="divide-y divide-border max-h-72 overflow-y-auto">
          {events.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No webhook events yet. Use the simulator above to fire test events.
            </div>
          )}
          {events.slice(0, 30).map((e) => (
            <div
              key={e.id}
              className="px-5 py-2.5 flex items-center gap-3 text-[12.5px]"
            >
              <ActivityIcon className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-mono text-[11px] uppercase tracking-wider w-48 shrink-0">
                {e.type}
              </span>
              <span className="font-mono text-[10.5px] text-muted-foreground truncate flex-1">
                {JSON.stringify(e.payload)}
              </span>
              <Badge
                variant="outline"
                className={`text-[9.5px] uppercase tracking-wider ${
                  e.signatureVerified
                    ? "text-emerald-400 border-emerald-500/40"
                    : "text-destructive border-destructive/40"
                }`}
              >
                {e.signatureVerified ? "VERIFIED" : "INVALID SIG"}
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */

function WebhookSimulator() {
  const [eventType, setEventType] = useState<SimulatedEvent["type"]>(
    "invoice.payment_failed",
  );
  const [target, setTarget] = useState("sub_player_lopez");
  const subs = useBillingStore((s) => s.subscriptions);
  const invs = useBillingStore((s) => s.invoices);
  const payouts = useBillingStore((s) => s.payouts);

  function fire() {
    let payload: SimulatedEvent;
    switch (eventType) {
      case "invoice.payment_failed":
        payload = { type: eventType, data: { subscriptionId: target } };
        break;
      case "invoice.paid":
        payload = { type: eventType, data: { subscriptionId: target } };
        break;
      case "customer.subscription.deleted":
        payload = { type: eventType, data: { subscriptionId: target } };
        break;
      case "customer.subscription.updated":
        payload = {
          type: eventType,
          data: { subscriptionId: target, status: "ACTIVE" },
        };
        break;
      case "checkout.session.completed":
        payload = {
          type: eventType,
          data: {
            customerId: "user_player_demo",
            productId: "prod_player_solo",
            priceId: "price_player_solo_monthly",
          },
        };
        break;
      case "charge.refunded":
        payload = { type: eventType, data: { invoiceId: target } };
        break;
      case "account.updated":
        payload = {
          type: eventType,
          data: {
            payoutAccountId: target,
            status: "ENABLED",
            payoutsEnabled: true,
          },
        };
        break;
    }
    dispatchWebhook(payload);
    toast.success(`Webhook ${eventType} processed`);
  }

  const targetOptions =
    eventType === "charge.refunded"
      ? invs.map((i) => ({ id: i.id, label: i.stripeInvoiceId }))
      : eventType === "account.updated"
        ? payouts.map((p) => ({ id: p.id, label: p.stripeAccountId }))
        : eventType === "checkout.session.completed"
          ? [{ id: "n/a", label: "creates new subscription for user_player_demo" }]
          : subs.map((s) => ({
              id: s.id,
              label: `${s.stripeSubscriptionId} (${s.status})`,
            }));

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <Bug className="w-3.5 h-3.5 text-amber-400" />
        <h3 className="font-display text-base uppercase tracking-tight">
          Webhook simulator
        </h3>
      </header>
      <div className="p-5 space-y-3">
        <div>
          <label className="text-[10.5px] uppercase tracking-wider font-mono text-muted-foreground">
            Event type
          </label>
          <Select
            value={eventType}
            onValueChange={(v) => setEventType(v as SimulatedEvent["type"])}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checkout.session.completed">
                checkout.session.completed
              </SelectItem>
              <SelectItem value="invoice.paid">invoice.paid</SelectItem>
              <SelectItem value="invoice.payment_failed">
                invoice.payment_failed
              </SelectItem>
              <SelectItem value="customer.subscription.updated">
                customer.subscription.updated
              </SelectItem>
              <SelectItem value="customer.subscription.deleted">
                customer.subscription.deleted
              </SelectItem>
              <SelectItem value="charge.refunded">charge.refunded</SelectItem>
              <SelectItem value="account.updated">account.updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {eventType !== "checkout.session.completed" && (
          <div>
            <label className="text-[10.5px] uppercase tracking-wider font-mono text-muted-foreground">
              Target
            </label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {targetOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={fire} size="sm">
            <BellRing className="w-3.5 h-3.5 mr-1.5" />
            Fire event
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              expireGrandfathers(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
              toast.success("All grandfather windows expired (cron simulation)");
            }}
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Expire grandfathers
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              grantCoachLink("user_player_demo", {
                kind: "COACH_PRO",
                coachUserId: "user_coach_reed",
              });
              toast.success("COACH50 link granted to user_player_demo");
            }}
          >
            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
            Grant COACH50
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              revokeCoachLink("user_player_demo", {
                kind: "COACH_PRO",
                coachUserId: "user_coach_reed",
              });
              toast.success("COACH50 link revoked → grandfathered");
            }}
          >
            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
            Revoke COACH50
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function KPI({
  icon,
  label,
  value,
  sublabel,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  tone?: "primary" | "amber";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1.5">
        {icon}
        {label}
      </div>
      <div
        className={`font-display text-3xl ${
          tone === "primary"
            ? "text-primary"
            : tone === "amber"
              ? "text-amber-400"
              : ""
        }`}
      >
        {value}
      </div>
      <div className="text-[11.5px] text-muted-foreground mt-0.5">
        {sublabel}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "primary";
}) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-display ${tone === "primary" ? "text-primary" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
