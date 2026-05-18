/**
 * ParentRegistrationPage — Family-facing season registration flow.
 *
 * 3-step wizard:
 *   1. Select season + plan
 *   2. Select team (if multiple available for the plan)
 *   3. Review & submit
 *
 * On submit, creates a Registration (status: pending). Admin reviews and accepts.
 * Once accepted, an invoice is auto-generated server-side.
 */
import { useState } from "react";
import {
  ChevronRight, ChevronLeft, CheckCircle2, Tag, Users,
  DollarSign, Calendar, Loader2, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useGuardianChildren } from "@/lib/api/hooks/useParent";
import { useSeasons, useMembershipPlans, useTeams, useSubmitRegistration } from "@/lib/api/hooks/useAdmin";
import type { Season, MembershipPlan, Team } from "@/features/admin/mock";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function cents(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n / 100);
}

function formatDateRange(start?: string, end?: string) {
  if (!start && !end) return null;
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return start ? `Starts ${fmt(start)}` : `Ends ${fmt(end!)}`;
}

/* -------------------------------------------------------------------------- */
/* Step indicator                                                               */
/* -------------------------------------------------------------------------- */

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all"
            style={i < step
              ? { background: "oklch(0.72 0.18 290)", color: "white" }
              : i === step
                ? { background: "oklch(0.72 0.18 290 / 0.15)", color: "oklch(0.72 0.18 290)", border: "2px solid oklch(0.72 0.18 290)" }
                : { background: "oklch(0.9 0 0)", color: "oklch(0.5 0 0)" }
            }
          >
            {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
          </div>
          {i < total - 1 && <div className="w-8 h-0.5 rounded-full" style={{ background: i < step ? "oklch(0.72 0.18 290)" : "oklch(0.9 0 0)" }} />}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 1: Select season + plan                                                 */
/* -------------------------------------------------------------------------- */

function StepSelectPlan({
  selectedSeason, onSelectSeason,
  selectedPlan, onSelectPlan,
  onNext,
}: {
  selectedSeason: Season | null; onSelectSeason: (s: Season) => void;
  selectedPlan: MembershipPlan | null; onSelectPlan: (p: MembershipPlan) => void;
  onNext: () => void;
}) {
  const { data: seasons = [] } = useSeasons();
  const openSeasons = seasons.filter((s) => s.status === "open" || s.status === "active");
  const { data: plans = [] } = useMembershipPlans({
    seasonId: selectedSeason?.id,
    status: "active",
  });

  const now = new Date();
  const earlyBirdActive = (plan: MembershipPlan) =>
    plan.earlyBirdAmount && plan.earlyBirdDeadline && new Date(plan.earlyBirdDeadline) >= now;

  return (
    <div className="space-y-5">
      {/* Season selection */}
      <div>
        <h2 className="font-semibold text-[14px] mb-3">Choose a season</h2>
        <div className="space-y-2">
          {openSeasons.length === 0 && (
            <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-[13px] text-muted-foreground">
              No open seasons right now. Check back soon.
            </div>
          )}
          {openSeasons.map((s) => (
            <button
              key={s.id}
              onClick={() => { onSelectSeason(s); onSelectPlan(null as any); }}
              className="w-full rounded-xl border bg-card p-4 text-left hover:shadow-sm transition-all flex items-center gap-3"
              style={selectedSeason?.id === s.id
                ? { borderColor: "oklch(0.72 0.18 290)", background: "oklch(0.72 0.18 290 / 0.05)" }
                : { borderColor: "hsl(var(--border))" }
              }
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: selectedSeason?.id === s.id ? "oklch(0.72 0.18 290)" : "oklch(0.85 0 0)" }}
              />
              <div className="flex-1">
                <div className="font-semibold text-[13px]">{s.name}</div>
                {s.description && <div className="text-[11px] text-muted-foreground">{s.description}</div>}
                {(s.startsAt || s.endsAt) && (
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" /> {formatDateRange(s.startsAt, s.endsAt)}
                  </div>
                )}
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0 capitalize">{s.status}</Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Plan selection */}
      {selectedSeason && (
        <div>
          <h2 className="font-semibold text-[14px] mb-3">Choose a membership plan</h2>
          <div className="space-y-3">
            {plans.length === 0 && (
              <div className="rounded-xl border border-border bg-card px-4 py-6 text-center text-[13px] text-muted-foreground">
                No plans available for this season yet.
              </div>
            )}
            {plans.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectPlan(p)}
                className="w-full rounded-xl border bg-card p-4 text-left hover:shadow-sm transition-all"
                style={selectedPlan?.id === p.id
                  ? { borderColor: "oklch(0.72 0.18 290)", background: "oklch(0.72 0.18 290 / 0.05)" }
                  : { borderColor: "hsl(var(--border))" }
                }
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="font-semibold text-[13px]">{p.name}</div>
                    {p.description && <div className="text-[11px] text-muted-foreground mt-0.5">{p.description}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    {earlyBirdActive(p) ? (
                      <div>
                        <div className="font-mono font-bold text-[16px]" style={{ color: "oklch(0.72 0.18 290)" }}>
                          {cents(p.priceAmount - (p.earlyBirdAmount ?? 0))}
                        </div>
                        <div className="text-[10px] text-muted-foreground line-through">{cents(p.priceAmount)}</div>
                      </div>
                    ) : (
                      <div className="font-mono font-bold text-[16px]" style={{ color: "oklch(0.72 0.18 290)" }}>
                        {cents(p.priceAmount)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  {earlyBirdActive(p) && (
                    <span className="flex items-center gap-1 text-green-600"><Tag className="w-3 h-3" /> Early bird discount</span>
                  )}
                  {p.allowsPaymentPlan && (
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {p.installmentCount} installments available</span>
                  )}
                  {p.maxEnrollment && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {p.maxEnrollment - p.enrollmentCount} spots remaining
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button disabled={!selectedSeason || !selectedPlan} onClick={onNext} style={{ background: "oklch(0.72 0.18 290)" }} className="gap-1.5 text-white">
          Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 2: Select team                                                          */
/* -------------------------------------------------------------------------- */

function StepSelectTeam({
  selectedPlan, selectedTeam, onSelectTeam, onNext, onBack,
}: {
  selectedPlan: MembershipPlan;
  selectedTeam: Team | null;
  onSelectTeam: (t: Team | null) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { data: teams = [] } = useTeams({ seasonId: selectedPlan.seasonId });
  const relevantTeams = teams.filter((t) => t.isActive && (!selectedPlan.maxEnrollment || t.rosterCount < 99));

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-[14px] mb-3">Select a team</h2>
      <p className="text-[12px] text-muted-foreground -mt-2">
        If unsure, you can skip this step — the admin will assign your child to a team.
      </p>

      <div className="space-y-2">
        <button
          onClick={() => onSelectTeam(null)}
          className="w-full rounded-xl border bg-card p-3.5 text-left hover:bg-muted/20 transition-all flex items-center gap-3"
          style={!selectedTeam ? { borderColor: "oklch(0.72 0.18 290)" } : { borderColor: "hsl(var(--border))" }}
        >
          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: !selectedTeam ? "oklch(0.72 0.18 290)" : "oklch(0.85 0 0)" }} />
          <span className="text-[12px] text-muted-foreground italic">Admin will assign</span>
        </button>

        {relevantTeams.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectTeam(t)}
            className="w-full rounded-xl border bg-card p-3.5 text-left hover:bg-muted/20 transition-all flex items-center gap-3"
            style={selectedTeam?.id === t.id ? { borderColor: "oklch(0.72 0.18 290)" } : { borderColor: "hsl(var(--border))" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[11px] shrink-0"
              style={{ background: t.colorPrimary ?? "oklch(0.72 0.18 290)" }}
            >
              {t.name.split(" ").slice(0,2).map((w) => w[0]).join("")}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-[13px]">{t.name}</div>
              <div className="text-[11px] text-muted-foreground">{t.headCoachName} · {t.rosterCount} players</div>
            </div>
            {selectedTeam?.id === t.id && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "oklch(0.72 0.18 290)" }} />}
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</Button>
        <Button onClick={onNext} style={{ background: "oklch(0.72 0.18 290)" }} className="gap-1.5 text-white">
          Review <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 3: Review & submit                                                      */
/* -------------------------------------------------------------------------- */

function StepReview({
  season, plan, team, playerName, onSubmit, onBack, loading,
}: {
  season: Season; plan: MembershipPlan; team: Team | null;
  playerName: string; onSubmit: () => void; onBack: () => void; loading: boolean;
}) {
  const now = new Date();
  const earlyBird = plan.earlyBirdAmount && plan.earlyBirdDeadline && new Date(plan.earlyBirdDeadline) >= now;
  const effectiveAmount = earlyBird ? plan.priceAmount - (plan.earlyBirdAmount ?? 0) : plan.priceAmount;

  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-[14px] mb-1">Review your registration</h2>
      <p className="text-[12px] text-muted-foreground">Confirm the details below before submitting.</p>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3 text-[13px]">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Player</span>
          <span className="font-semibold">{playerName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Season</span>
          <span className="font-semibold">{season.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Plan</span>
          <span className="font-semibold">{plan.name}</span>
        </div>
        {team && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Team preference</span>
            <span className="font-semibold">{team.name}</span>
          </div>
        )}
        <div className="pt-2 border-t border-border/50 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Base price</span>
            <span>{cents(plan.priceAmount)}</span>
          </div>
          {earlyBird && (
            <div className="flex items-center justify-between" style={{ color: "oklch(0.75 0.12 140)" }}>
              <span>Early bird discount</span>
              <span>−{cents(plan.earlyBirdAmount!)}</span>
            </div>
          )}
          <div className="flex items-center justify-between font-bold text-[15px]">
            <span>Total</span>
            <span style={{ color: "oklch(0.72 0.18 290)" }}>{cents(effectiveAmount)}</span>
          </div>
          {plan.allowsPaymentPlan && (
            <p className="text-[11px] text-muted-foreground">
              Payment plan available: {plan.installmentCount} installments starting with {cents(plan.depositAmount)} deposit.
              Admin will follow up with payment details.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[12px] text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">What happens next?</p>
        <ol className="space-y-1 list-decimal list-inside">
          <li>Your registration is submitted as <span className="font-medium">pending</span></li>
          <li>Program staff reviews and accepts your registration</li>
          <li>An invoice is generated — you'll receive payment instructions</li>
          <li>Forms and waivers must be completed before the season starts</li>
        </ol>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0 rounded accent-purple-600" />
        <span className="text-[12px] text-foreground leading-snug">
          I confirm this information is accurate and I understand that registration is subject to admin approval and payment.
        </span>
      </label>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</Button>
        <Button
          disabled={!agreed || loading}
          onClick={onSubmit}
          style={{ background: "oklch(0.72 0.18 290)" }}
          className="gap-1.5 text-white"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Submit registration
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Success state                                                                */
/* -------------------------------------------------------------------------- */

function SuccessState({ season }: { season: Season }) {
  return (
    <div className="flex flex-col items-center text-center py-8 gap-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: "oklch(0.75 0.12 140 / 0.15)" }}
      >
        <CheckCircle2 className="w-8 h-8" style={{ color: "oklch(0.75 0.12 140)" }} />
      </div>
      <div>
        <h2 className="font-bold text-[18px] mb-1">Registration submitted!</h2>
        <p className="text-[13px] text-muted-foreground max-w-xs">
          Your registration for <span className="font-semibold">{season.name}</span> is pending review.
          You'll be notified once it's accepted.
        </p>
      </div>
      <div className="flex gap-3 mt-2">
        <Link href="/app/parent/forms">
          <a>
            <Button variant="outline" className="gap-1.5 text-[12px]">
              <ClipboardList className="w-3.5 h-3.5" /> Complete forms
            </Button>
          </a>
        </Link>
        <Link href="/app/parent">
          <a>
            <Button style={{ background: "oklch(0.72 0.18 290)" }} className="gap-1.5 text-[12px] text-white">
              Back to portal <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </a>
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main                                                                         */
/* -------------------------------------------------------------------------- */

export default function ParentRegistrationPage() {
  const { user } = useAuth();
  const { data: children = [] } = useGuardianChildren();
  const child = children[0] ?? null;

  const [step, setStep] = useState(0);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submitRegistration = useSubmitRegistration();

  async function handleSubmit() {
    if (!child || !selectedSeason || !selectedPlan) return;
    try {
      await submitRegistration.mutateAsync({
        playerId: child.id,
        seasonId: selectedSeason.id,
        planId: selectedPlan.id,
        teamId: selectedTeam?.id,
      });
      setSubmitted(true);
    } catch {
      toast.error("Registration failed. Please try again.");
    }
  }

  if (!child) {
    return (
      <AppShell>
        <PageHeader eyebrow="Family Portal" title="Register" />
        <div className="rounded-xl border border-border bg-card px-6 py-12 flex flex-col items-center text-center gap-3">
          <p className="font-semibold">No linked athlete found</p>
          <p className="text-[12px] text-muted-foreground">Contact your program admin to link your athlete account.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Family Portal"
        title="Season Registration"
        subtitle={`Register ${child.name} for an upcoming season or program.`}
      />

      {submitted && selectedSeason ? (
        <SuccessState season={selectedSeason} />
      ) : (
        <div className="max-w-xl">
          <StepIndicator step={step} total={3} />

          {step === 0 && (
            <StepSelectPlan
              selectedSeason={selectedSeason} onSelectSeason={setSelectedSeason}
              selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && selectedPlan && (
            <StepSelectTeam
              selectedPlan={selectedPlan}
              selectedTeam={selectedTeam}
              onSelectTeam={setSelectedTeam}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && selectedSeason && selectedPlan && (
            <StepReview
              season={selectedSeason}
              plan={selectedPlan}
              team={selectedTeam}
              playerName={child.name}
              onSubmit={handleSubmit}
              onBack={() => setStep(1)}
              loading={submitRegistration.isPending}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}
