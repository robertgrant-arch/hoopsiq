/**
 * AppPricingPage — interactive, catalog-driven, demo-checkout.
 * --------------------------------------------------------------------------
 * Source: Prompt 16 §1, §6, §11.
 */

import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Check, Loader2, Tag, Sparkles, Users } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { NumericInput } from "@/components/ui/numeric-input";
import { toast } from "sonner";




import { useAuth } from "@/lib/auth";
import { formatCents, prices, products, useBillingStore, createCheckout } from "@/lib/billing";

const TIER_ORDER: ReturnType<typeof getTierOrder> = getTierOrder();

function getTierOrder() {
  return [
    "PLAYER_SOLO",
    "COACH_PRO",
    "TEAM_PRO",
    "EXPERT_CONNECT",
    "AI_CREDIT_PACK",
  ] as const;
}

export function AppPricingPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [billingCadence, setBillingCadence] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [seatCount, setSeatCount] = useState(20);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Compute whether the current player is COACH50-eligible.
  const coachLinks = useBillingStore((s) => s.coachLinks);
  const coach50Eligible = useMemo(
    () =>
      !!user &&
      coachLinks.some(
        (l) => l.playerUserId === user.id && l.status !== "REVOKED",
      ),
    [coachLinks, user],
  );

  const ordered = useMemo(
    () =>
      TIER_ORDER.map((tier) => products.find((p) => p.tier === tier)).filter(
        Boolean,
      ) as typeof products,
    [],
  );

  function handleBuy(productId: string) {
    if (!user) {
      navigate("/sign-in");
      return;
    }
    const productPrices = prices.filter((p) => p.productId === productId);
    let chosen = productPrices.find((p) =>
      billingCadence === "MONTHLY" ? p.cadence === "MONTHLY" : p.cadence === "ANNUAL",
    );
    if (!chosen)
      chosen = productPrices.find((p) => p.cadence === "ONE_TIME") ?? productPrices[0];
    if (!chosen) return;

    setBusyId(productId);
    setTimeout(() => {
      try {
        const result = createCheckout({
          customerId: user.id,
          priceId: chosen!.id,
          seatCount: productId === "prod_team_pro" ? seatCount : undefined,
        });
        toast.success(
          `Checkout complete · ${formatCents(result.invoice.amountPaid)} charged${
            result.invoice.appliedCoupons.length
              ? ` · ${result.invoice.appliedCoupons.join(", ")} applied`
              : ""
          }`,
        );
        navigate("/app/billing");
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setBusyId(null);
      }
    }, 600);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="HoopsIQ · Billing"
        title="Pricing"
        subtitle="Stripe-hosted Checkout. Tax & 3DS are handled in the Stripe layer; this view shows the demo flow end-to-end."
      />

      {/* Cadence toggle + COACH50 banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="inline-flex rounded-md border border-border p-0.5 bg-card">
          {(["MONTHLY", "ANNUAL"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setBillingCadence(c)}
              className={`h-8 px-4 rounded text-[12px] font-mono uppercase tracking-wider transition ${
                billingCadence === c
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c} {c === "ANNUAL" && <span className="opacity-70">· save 17%</span>}
            </button>
          ))}
        </div>

        {coach50Eligible && (
          <div className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-[12px] text-primary">
            <Tag className="w-3.5 h-3.5" />
            <span>
              <strong>COACH50</strong> auto-applies on Player Solo —
              your coach has Coach Pro / your team has Team Pro.
            </span>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ordered.map((product) => {
          const productPrices = prices.filter((p) => p.productId === product.id);
          const monthly = productPrices.find((p) => p.cadence === "MONTHLY");
          const annual = productPrices.find((p) => p.cadence === "ANNUAL");
          const oneTime = productPrices.find((p) => p.cadence === "ONE_TIME");
          const headlinePrice =
            billingCadence === "ANNUAL" && annual
              ? annual
              : monthly ?? oneTime ?? productPrices[0];

          if (!headlinePrice) return null;

          // Effective price after engine adjustments (Player Solo + COACH50, Team Pro seats)
          let effective = headlinePrice.amount;
          if (
            product.tier === "PLAYER_SOLO" &&
            coach50Eligible &&
            headlinePrice.cadence !== "ONE_TIME"
          ) {
            effective = Math.round(effective / 2);
          }
          if (product.tier === "TEAM_PRO" && headlinePrice.includedSeats) {
            const extra = Math.max(0, seatCount - headlinePrice.includedSeats);
            effective += extra * (headlinePrice.perExtraUnitAmount ?? 0);
          }

          const cadenceLabel =
            headlinePrice.cadence === "ANNUAL"
              ? "/yr"
              : headlinePrice.cadence === "MONTHLY"
                ? "/mo"
                : headlinePrice.cadence === "METERED"
                  ? "/clip"
                  : "one-time";

          const popular = product.tier === "COACH_PRO";

          return (
            <div
              key={product.id}
              className={`relative rounded-2xl p-6 flex flex-col border bg-card ${
                popular
                  ? "border-primary/60 shadow-[0_0_50px_-20px] shadow-primary/40"
                  : "border-border"
              }`}
            >
              {popular && (
                <div className="absolute -top-2.5 left-6 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9.5px] font-mono uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div
                className="text-[10px] uppercase tracking-[0.15em] font-mono mb-2"
                style={{ color: product.accent }}
              >
                {product.tier.replace(/_/g, " ")}
              </div>
              <h3 className="font-display text-2xl uppercase tracking-tight">
                {product.name}
              </h3>
              <p className="text-[12.5px] text-muted-foreground mt-1.5 leading-snug">
                {product.description}
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                {product.tier === "PLAYER_SOLO" && coach50Eligible && headlinePrice.cadence !== "ONE_TIME" && (
                  <span className="font-display text-[18px] text-muted-foreground line-through mr-1">
                    {formatCents(headlinePrice.amount)}
                  </span>
                )}
                <span className="font-display text-[42px] leading-none text-primary">
                  {formatCents(effective)}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  {cadenceLabel}
                </span>
              </div>
              {product.tier === "TEAM_PRO" && (
                <div className="mt-2 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <NumericInput
                    aria-label="Team Pro seat count"
                    value={seatCount}
                    onChange={setSeatCount}
                    min={20}
                    max={200}
                    className="w-14 h-7 px-1.5 rounded-md border border-border bg-background text-foreground text-[12px] font-mono"
                  />
                  seats · 20 included · ${formatCents(headlinePrice.perExtraUnitAmount ?? 0)}/extra
                </div>
              )}

              <ul className="mt-5 space-y-2 flex-1">
                {product.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[12.5px] leading-relaxed"
                  >
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-1" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-6 w-full font-mono uppercase tracking-wider"
                onClick={() => handleBuy(product.id)}
                disabled={busyId === product.id}
                variant={popular ? "default" : "outline"}
              >
                {busyId === product.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Charging…
                  </>
                ) : product.tier === "EXPERT_CONNECT" ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Apply to sell
                  </>
                ) : (
                  <>Buy with Stripe (demo)</>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-[12px] text-muted-foreground max-w-2xl">
        <strong>Demo mode.</strong> Checkout, webhooks, and entitlements run in
        the browser. Swap <code className="text-primary">lib/billing/service.ts</code>{" "}
        for the real Stripe SDK to take live payments — every other surface
        stays the same.
      </p>
    </AppShell>
  );
}
