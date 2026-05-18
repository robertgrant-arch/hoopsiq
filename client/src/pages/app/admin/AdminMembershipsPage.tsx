/**
 * AdminMembershipsPage — Membership plan and season package management.
 *
 * Create/edit plans with pricing, payment plan options, and enrollment caps.
 */
import { useState } from "react";
import {
  Tag, Plus, Edit2, Users, CheckCircle2, Loader2, DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useMembershipPlans, useSeasons, useCreateMembershipPlan, useUpdateMembershipPlan,
} from "@/lib/api/hooks/useAdmin";
import type { MembershipPlan } from "@/features/admin/mock";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function cents(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n / 100);
}

const PLAN_TYPES = ["season","monthly","annual","drop_in","tournament","custom"];
const PLAN_STATUS_COLORS = {
  draft:    "oklch(0.5 0 0)",
  active:   "oklch(0.75 0.12 140)",
  archived: "oklch(0.5 0 0)",
};

/* -------------------------------------------------------------------------- */
/* Plan form                                                                    */
/* -------------------------------------------------------------------------- */

function PlanForm({
  initial, seasons, onSubmit, onCancel, loading,
}: {
  initial?: Partial<MembershipPlan>;
  seasons: Array<{ id: string; name: string }>;
  onSubmit: (data: Partial<MembershipPlan>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<string>(initial?.type ?? "season");
  const [seasonId, setSeasonId] = useState(initial?.seasonId ?? "");
  const [price, setPrice] = useState(initial?.priceAmount ? String((initial.priceAmount / 100).toFixed(2)) : "");
  const [paymentPlan, setPaymentPlan] = useState(initial?.allowsPaymentPlan ?? false);
  const [installments, setInstallments] = useState(String(initial?.installmentCount ?? 3));
  const [deposit, setDeposit] = useState(initial?.depositAmount ? String((initial.depositAmount / 100).toFixed(2)) : "0");
  const [maxEnroll, setMaxEnroll] = useState(String(initial?.maxEnrollment ?? ""));
  const [earlyBirdAmt, setEarlyBirdAmt] = useState(initial?.earlyBirdAmount ? String((initial.earlyBirdAmount / 100).toFixed(2)) : "");
  const [earlyBirdDate, setEarlyBirdDate] = useState(initial?.earlyBirdDeadline?.slice(0,10) ?? "");

  function handleSubmit() {
    if (!name || !price) { toast.error("Name and price are required"); return; }
    onSubmit({
      name,
      description: description || undefined,
      type: type as any,
      seasonId: seasonId || undefined,
      priceAmount: Math.round(parseFloat(price) * 100),
      allowsPaymentPlan: paymentPlan,
      installmentCount: paymentPlan ? parseInt(installments) : undefined,
      depositAmount: Math.round(parseFloat(deposit || "0") * 100),
      maxEnrollment: maxEnroll ? parseInt(maxEnroll) : undefined,
      earlyBirdAmount: earlyBirdAmt ? Math.round(parseFloat(earlyBirdAmt) * 100) : undefined,
      earlyBirdDeadline: earlyBirdDate || undefined,
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h3 className="font-semibold text-[14px]">{initial?.id ? "Edit plan" : "New membership plan"}</h3>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-[12px] font-medium block mb-1">Plan name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="17U Fall Season — Full" className="text-[12px]" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[12px] font-medium block mb-1">Description</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description shown to families…" className="text-[12px]" />
        </div>
        <div>
          <label className="text-[12px] font-medium block mb-1">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background text-[12px] px-2">
            {PLAN_TYPES.map((t) => <option key={t} value={t}>{t.replace("_"," ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[12px] font-medium block mb-1">Season</label>
          <select value={seasonId} onChange={(e) => setSeasonId(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background text-[12px] px-2">
            <option value="">— Not season-specific —</option>
            {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[12px] font-medium block mb-1">Price *</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[12px]">$</span>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} className="pl-6 text-[12px]" placeholder="750.00" inputMode="decimal" />
          </div>
        </div>
        <div>
          <label className="text-[12px] font-medium block mb-1">Max enrollment</label>
          <Input value={maxEnroll} onChange={(e) => setMaxEnroll(e.target.value)} className="text-[12px]" placeholder="15 (blank = unlimited)" inputMode="numeric" />
        </div>
      </div>

      {/* Payment plan toggle */}
      <div className="rounded-lg border border-border p-3 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={paymentPlan} onChange={(e) => setPaymentPlan(e.target.checked)} className="w-4 h-4 rounded accent-purple-600" />
          <span className="text-[12px] font-medium">Allow payment plan (installments)</span>
        </label>
        {paymentPlan && (
          <div className="grid sm:grid-cols-2 gap-3 pl-7">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Installments</label>
              <Input value={installments} onChange={(e) => setInstallments(e.target.value)} className="text-[12px]" inputMode="numeric" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Deposit required ($)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[12px]">$</span>
                <Input value={deposit} onChange={(e) => setDeposit(e.target.value)} className="pl-6 text-[12px]" inputMode="decimal" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Early bird */}
      <div className="rounded-lg border border-border p-3">
        <p className="text-[12px] font-medium mb-2">Early bird discount (optional)</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Discount amount ($)</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[12px]">$</span>
              <Input value={earlyBirdAmt} onChange={(e) => setEarlyBirdAmt(e.target.value)} className="pl-6 text-[12px]" inputMode="decimal" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Deadline</label>
            <Input type="date" value={earlyBirdDate} onChange={(e) => setEarlyBirdDate(e.target.value)} className="text-[12px]" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" disabled={!name || !price || loading} onClick={handleSubmit}
          style={{ background: "oklch(0.72 0.18 290)" }} className="gap-1.5 text-white">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {initial?.id ? "Save changes" : "Create plan"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Plan card                                                                    */
/* -------------------------------------------------------------------------- */

function PlanCard({ plan, onEdit }: { plan: MembershipPlan; onEdit: (p: MembershipPlan) => void }) {
  const fillPct = plan.maxEnrollment ? Math.min(100, (plan.enrollmentCount / plan.maxEnrollment) * 100) : 0;
  const statusColor = PLAN_STATUS_COLORS[plan.status];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-bold text-[14px]">{plan.name}</h3>
          {plan.seasonName && <p className="text-[11px] text-muted-foreground">{plan.seasonName}</p>}
          {plan.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{plan.description}</p>}
        </div>
        <button onClick={() => onEdit(plan)} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono font-bold text-[18px]" style={{ color: "oklch(0.72 0.18 290)" }}>
          {cents(plan.priceAmount)}
        </span>
        <span className="text-[10px] text-muted-foreground capitalize">{plan.type.replace("_"," ")}</span>
        <span className="text-[10px] font-semibold ml-auto px-2 py-0.5 rounded-full" style={{ background: `${statusColor}15`, color: statusColor }}>
          {plan.status}
        </span>
      </div>

      <div className="space-y-1.5 text-[11px] text-muted-foreground mb-3">
        {plan.allowsPaymentPlan && (
          <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-600" /> {plan.installmentCount} installments · ${((plan.depositAmount) / 100).toFixed(0)} deposit</div>
        )}
        {plan.earlyBirdAmount && plan.earlyBirdDeadline && (
          <div className="flex items-center gap-1"><Tag className="w-3 h-3" /> Early bird: −${(plan.earlyBirdAmount/100).toFixed(0)} before {new Date(plan.earlyBirdDeadline).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
        )}
      </div>

      {plan.maxEnrollment && (
        <div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {plan.enrollmentCount} / {plan.maxEnrollment} enrolled</span>
            {plan.enrollmentCount >= plan.maxEnrollment && <span style={{ color: "oklch(0.68 0.22 25)" }}>Full</span>}
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${fillPct}%`, background: fillPct >= 90 ? "oklch(0.68 0.22 25)" : "oklch(0.72 0.18 290)" }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main                                                                         */
/* -------------------------------------------------------------------------- */

export default function AdminMembershipsPage() {
  const [seasonFilter, setSeasonFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<MembershipPlan | null>(null);

  const { data: seasons = [] } = useSeasons();
  const { data: plans = [], isLoading } = useMembershipPlans({ seasonId: seasonFilter || undefined });
  const createPlan = useCreateMembershipPlan();
  const updatePlan = useUpdateMembershipPlan();

  async function handleCreate(data: Partial<MembershipPlan>) {
    try {
      await createPlan.mutateAsync(data);
      toast.success("Plan created");
      setShowForm(false);
    } catch { toast.error("Failed to create plan"); }
  }

  async function handleUpdate(data: Partial<MembershipPlan>) {
    if (!editTarget) return;
    try {
      await updatePlan.mutateAsync({ id: editTarget.id!, ...data });
      toast.success("Plan updated");
      setEditTarget(null);
    } catch { toast.error("Failed to update plan"); }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Club Admin"
        title="Membership Plans"
        subtitle="Create season packages and pricing for your program."
        actions={
          <Button size="sm" onClick={() => { setShowForm(true); setEditTarget(null); }} style={{ background: "oklch(0.72 0.18 290)" }} className="gap-1.5 text-white">
            <Plus className="w-3.5 h-3.5" /> New plan
          </Button>
        }
      />

      <div className="flex gap-3 mb-5">
        <select value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)} className="h-8 rounded-md border border-border bg-card text-[12px] px-2">
          <option value="">All seasons</option>
          {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {(showForm && !editTarget) && (
          <PlanForm seasons={seasons} onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={createPlan.isPending} />
        )}
        {editTarget && (
          <PlanForm initial={editTarget} seasons={seasons} onSubmit={handleUpdate} onCancel={() => setEditTarget(null)} loading={updatePlan.isPending} />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-12 flex flex-col items-center text-center gap-3">
            <DollarSign className="w-8 h-8 text-muted-foreground/30" />
            <p className="font-semibold">No plans yet</p>
            <p className="text-[12px] text-muted-foreground">Create your first membership plan to accept registrations.</p>
            <Button size="sm" onClick={() => setShowForm(true)} style={{ background: "oklch(0.72 0.18 290)" }} className="gap-1 text-white">
              <Plus className="w-3.5 h-3.5" /> New plan
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {plans.filter((p) => !editTarget || editTarget.id !== p.id).map((plan) => (
              <PlanCard key={plan.id} plan={plan} onEdit={setEditTarget} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
