/**
 * ExpertPayouts — `/app/expert/payouts`
 * --------------------------------------------------------------------------
 * Source: Prompt 16 §4 — Stripe Connect Express, 15% platform fee, weekly
 * payouts. In production the "Update onboarding" + "Open dashboard" buttons
 * call `stripe.accounts.createLoginLink` and redirect.
 */

import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Percent,
  Settings2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { useBillingStore, formatCents } from "@/lib/billing";



const PLATFORM_FEE_PCT = 15;

export function ExpertPayouts() {
  const { user } = useAuth();
  const payouts = useBillingStore((s) => s.payouts);

  // For the demo: take the first payout account if signed-in user has none.
  const account = useMemo(
    () =>
      payouts.find((p) => p.expertUserId === user?.id) ?? payouts[0],
    [payouts, user?.id],
  );

  if (!account) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Expert Connect"
          title="Payouts"
          subtitle="No payout account yet — start onboarding to accept payments."
          actions={
            <Button onClick={() => toast.success("Stripe Connect onboarding (mock)")}>
              Start onboarding
            </Button>
          }
        />
      </AppShell>
    );
  }

  const lastWeek = account.lifetimeNetCents * 0.07; // mock: 7% of LTV last 7d
  const nextPayout = new Date();
  nextPayout.setDate(nextPayout.getDate() + ((5 - nextPayout.getDay() + 7) % 7 || 7));

  return (
    <AppShell>
      <PageHeader
        eyebrow={`Stripe Connect · ${account.stripeAccountId}`}
        title="Marketplace Payouts"
        subtitle="Sell async reviews, live classes, and courses. We retain a 15% platform fee. Stripe handles tax forms, KYC, and 1099-K issuance."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("Opening Stripe Express dashboard (mock)")}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Stripe Express
            </Button>
            <Button
              size="sm"
              onClick={() => toast.success("Onboarding update opened (mock)")}
            >
              <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Manage
            </Button>
          </div>
        }
      />

      {/* Account status */}
      <div
        className={`mb-6 rounded-xl border p-4 flex items-start gap-3 ${
          account.payoutsEnabled
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-amber-500/30 bg-amber-500/5"
        }`}
      >
        {account.payoutsEnabled ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base uppercase tracking-tight">
              Account {account.payoutsEnabled ? "enabled" : "in review"}
            </h3>
            <Badge
              variant="outline"
              className={`text-[9.5px] uppercase tracking-wider ${
                account.payoutsEnabled
                  ? "text-emerald-400 border-emerald-500/40"
                  : "text-amber-400 border-amber-500/40"
              }`}
            >
              {account.status}
            </Badge>
          </div>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            {account.payoutsEnabled
              ? "Weekly payouts every Friday to your bank account on file. KYC complete."
              : `Stripe needs ${account.requirements.length || "additional"} items before releasing funds.`}
          </p>
          {account.requirements.length > 0 && (
            <ul className="text-[12px] text-amber-400 mt-2 space-y-0.5 list-disc pl-5">
              {account.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Money stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat
          icon={<CircleDollarSign className="w-4 h-4" />}
          label="Lifetime gross"
          value={formatCents(account.lifetimeGrossCents)}
          sublabel="from athlete + coach buyers"
        />
        <Stat
          icon={<Percent className="w-4 h-4" />}
          label="Platform fee"
          value={formatCents(account.lifetimePlatformFeeCents)}
          sublabel={`${PLATFORM_FEE_PCT}% of every sale`}
          tone="muted"
        />
        <Stat
          icon={<ShieldCheck className="w-4 h-4 text-primary" />}
          label="Lifetime net"
          value={formatCents(account.lifetimeNetCents)}
          sublabel="paid to you after fees"
          tone="primary"
        />
        <Stat
          icon={<ArrowDownToLine className="w-4 h-4" />}
          label="Next payout"
          value={formatCents(lastWeek)}
          sublabel={`Scheduled ${nextPayout.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
        />
      </div>

      {/* Recent transactions (mock) */}
      <section className="rounded-xl border border-border bg-card overflow-hidden mb-6">
        <header className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">
              Recent transactions
            </div>
            <h3 className="font-display text-base uppercase tracking-tight">
              Last 7 days
            </h3>
          </div>
          <span className="text-[12px] text-muted-foreground font-mono">
            <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
            +18% vs prior week
          </span>
        </header>
        <div className="divide-y divide-border">
          {[
            ["Async review · Jamal R.", 25_00, "tx_001"],
            ["Live class · Pickup IQ", 75_00, "tx_002"],
            ["Async review · Marcus L.", 25_00, "tx_003"],
            ["Course · 1v1 Footwork", 49_00, "tx_004"],
            ["Live class · Defensive Reads", 75_00, "tx_005"],
          ].map(([name, gross, id]) => {
            const fee = Math.round((gross as number) * (PLATFORM_FEE_PCT / 100));
            const net = (gross as number) - fee;
            return (
              <div
                key={id as string}
                className="flex items-center gap-3 px-5 py-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 grid place-items-center text-primary text-[11px]">
                  ▶
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium">{name as string}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {id as string}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-sm">
                    {formatCents(gross as number)}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground font-mono">
                    -{formatCents(fee)} fee · net {formatCents(net)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Fee disclosure */}
      <div className="rounded-xl border border-border bg-muted/20 p-4 text-[12.5px] text-muted-foreground">
        <strong className="text-foreground">How payouts work:</strong> Buyers
        check out via Stripe directly; HoopsIQ receives the platform fee, and
        Stripe Connect routes the rest into your Express account. Funds settle
        in 2 business days; bank transfers post every Friday by default.
      </div>
    </AppShell>
  );
}

function Stat({
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
  tone?: "primary" | "muted";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1.5">
        {icon}
        {label}
      </div>
      <div
        className={`font-display text-2xl ${
          tone === "primary"
            ? "text-primary"
            : tone === "muted"
              ? "text-muted-foreground"
              : ""
        }`}
      >
        {value}
      </div>
      <div className="text-[11.5px] text-muted-foreground mt-0.5">{sublabel}</div>
    </div>
  );
}
