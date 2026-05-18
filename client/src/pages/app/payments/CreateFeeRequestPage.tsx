/**
 * CreateFeeRequestPage — 3-step fee obligation creation flow.
 * Route: /app/payments/create
 *
 * Step 1 — Fee definition: name, type, structure, amount, due date
 * Step 2 — Scope: team-wide / subgroup / individual player selection
 * Step 3 — Review: impact preview, confirm
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Users,
  User,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { MOCK_FEE_REQUESTS, formatCents, type FeeType, type FeeScope, type FeeStructure } from "@/features/payments/mock";

/* ─── Mock roster for scope selection ─────────────────────────────────────── */

const MOCK_TEAMS = [
  { id: "team-17u", name: "17U Gold", playerCount: 15 },
  { id: "team-16u", name: "16U Blue", playerCount: 13 },
  { id: "team-15u", name: "15U Elite", playerCount: 12 },
];

const MOCK_PLAYERS = [
  { id: "player-001", name: "Trevon Williams",  team: "17U Gold" },
  { id: "player-002", name: "Jordan Thompson",  team: "17U Gold" },
  { id: "player-003", name: "DeShawn Carter",   team: "17U Gold" },
  { id: "player-004", name: "Isaiah Reeves",    team: "16U Blue" },
  { id: "player-005", name: "Caleb Morrison",   team: "17U Gold" },
  { id: "player-006", name: "Ryan Davis",       team: "17U Gold" },
  { id: "player-007", name: "Darius Webb",      team: "16U Blue" },
  { id: "player-008", name: "Marcus Johnson",   team: "17U Gold" },
  { id: "player-009", name: "Jaylen Foster",    team: "16U Blue" },
  { id: "player-010", name: "Andre Martinez",   team: "17U Gold" },
];

/* ─── Form state ───────────────────────────────────────────────────────────── */

interface FeeFormState {
  name: string;
  description: string;
  type: FeeType | "";
  structure: FeeStructure | "";
  amountDollars: string;
  dueDate: string;
  installmentCount: string;
  // Step 2
  scope: FeeScope | "";
  targetTeamIds: string[];
  targetPlayerIds: string[];
}

const EMPTY_FORM: FeeFormState = {
  name: "",
  description: "",
  type: "",
  structure: "one_time",
  amountDollars: "",
  dueDate: "",
  installmentCount: "2",
  scope: "team",
  targetTeamIds: [],
  targetPlayerIds: [],
};

/* ─── Step indicators ──────────────────────────────────────────────────────── */

function StepBar({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Define Fee", "Select Scope", "Review & Confirm"];
  return (
    <div className="flex items-center gap-0 border-b" style={{ borderColor: "var(--border)" }}>
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = step === n;
        const done = step > n;
        return (
          <div
            key={label}
            className="flex-1 flex items-center gap-2 px-4 py-3 border-r last:border-r-0"
            style={{
              borderColor: "var(--border)",
              background: active
                ? "oklch(0.72 0.18 290 / 0.08)"
                : "var(--bg-surface)",
              borderBottom: active ? "2px solid oklch(0.72 0.18 290)" : "2px solid transparent",
            }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background: done
                  ? "oklch(0.75 0.12 140)"
                  : active
                  ? "oklch(0.72 0.18 290)"
                  : "var(--border)",
                color: done || active ? "white" : "var(--text-muted)",
              }}
            >
              {done ? <Check className="w-3 h-3" /> : n}
            </div>
            <span
              className="text-xs font-medium hidden sm:block"
              style={{ color: active ? "oklch(0.72 0.18 290)" : "var(--text-muted)" }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Field primitives ─────────────────────────────────────────────────────── */

const fieldStyle: React.CSSProperties = {
  background: "var(--bg-surface)",
  borderColor: "var(--border)",
  color: "var(--text-primary)",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</label>
      {hint && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{hint}</p>}
      {children}
    </div>
  );
}

/* ─── Step 1 — Define Fee ──────────────────────────────────────────────────── */

function Step1({
  form,
  onChange,
  onNext,
}: {
  form: FeeFormState;
  onChange: (f: FeeFormState) => void;
  onNext: () => void;
}) {
  const FEE_TYPES: { value: FeeType; label: string }[] = [
    { value: "season_dues", label: "Season Dues" },
    { value: "tournament",  label: "Tournament Fee" },
    { value: "uniform",     label: "Uniform / Equipment" },
    { value: "camp",        label: "Camp" },
    { value: "travel",      label: "Travel" },
    { value: "other",       label: "Other" },
  ];

  const valid =
    form.name.trim() &&
    form.type &&
    form.structure &&
    Number(form.amountDollars) > 0 &&
    form.dueDate;

  const amountCents = Math.round(Number(form.amountDollars) * 100);
  const installmentCents = form.structure === "installment" && Number(form.installmentCount) > 0
    ? Math.round(amountCents / Number(form.installmentCount))
    : 0;

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col gap-5">
      <Field label="Fee Name" hint="Shown to parents on payment requests.">
        <input
          type="text"
          value={form.name}
          onChange={e => onChange({ ...form, name: e.target.value })}
          placeholder="e.g. Spring Season Dues 2026"
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
          style={fieldStyle}
        />
      </Field>

      <Field label="Description" hint="Optional. Appears in the payment receipt.">
        <textarea
          value={form.description}
          onChange={e => onChange({ ...form, description: e.target.value })}
          rows={2}
          placeholder="What does this fee cover?"
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
          style={fieldStyle}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Fee Type">
          <select
            value={form.type}
            onChange={e => onChange({ ...form, type: e.target.value as FeeType })}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={fieldStyle}
          >
            <option value="">Select type…</option>
            {FEE_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </Field>

        <Field label="Structure">
          <div className="flex gap-2">
            {([
              { value: "one_time",    label: "One-time" },
              { value: "installment", label: "Installments" },
            ] as { value: FeeStructure; label: string }[]).map(s => (
              <button
                key={s.value}
                onClick={() => onChange({ ...form, structure: s.value })}
                className="flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all"
                style={{
                  background: form.structure === s.value ? "oklch(0.72 0.18 290)" : "var(--bg-surface)",
                  borderColor: form.structure === s.value ? "oklch(0.72 0.18 290)" : "var(--border)",
                  color: form.structure === s.value ? "white" : "var(--text-primary)",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Amount per Player">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amountDollars}
              onChange={e => onChange({ ...form, amountDollars: e.target.value })}
              placeholder="425.00"
              className="w-full pl-7 pr-3 py-2 rounded-lg border text-sm outline-none"
              style={fieldStyle}
            />
          </div>
        </Field>

        <Field label="Due Date">
          <input
            type="date"
            value={form.dueDate}
            onChange={e => onChange({ ...form, dueDate: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={fieldStyle}
          />
        </Field>
      </div>

      {form.structure === "installment" && (
        <Field label="Number of Installments" hint="Total amount will be split equally.">
          <div className="flex gap-2">
            {[2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => onChange({ ...form, installmentCount: String(n) })}
                className="px-4 py-2 rounded-lg border text-sm font-medium"
                style={{
                  background: form.installmentCount === String(n) ? "oklch(0.72 0.18 290)" : "var(--bg-surface)",
                  borderColor: form.installmentCount === String(n) ? "oklch(0.72 0.18 290)" : "var(--border)",
                  color: form.installmentCount === String(n) ? "white" : "var(--text-primary)",
                }}
              >
                {n}×
              </button>
            ))}
          </div>
          {installmentCents > 0 && (
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {formatCents(installmentCents)} per installment, spaced 30 days apart
            </p>
          )}
        </Field>
      )}

      {/* Preview */}
      {amountCents > 0 && (
        <div
          className="rounded-lg border px-4 py-3 flex items-center gap-3"
          style={{ borderColor: "oklch(0.72 0.18 290 / 0.3)", background: "oklch(0.72 0.18 290 / 0.05)" }}
        >
          <DollarSign className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.72 0.18 290)" }} />
          <div className="text-sm" style={{ color: "var(--text-primary)" }}>
            <strong>{formatCents(amountCents)}</strong> per player
            {form.structure === "installment" && installmentCents > 0
              ? ` · ${form.installmentCount} installments of ${formatCents(installmentCents)}`
              : " · one-time charge"}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40"
          style={{ background: "oklch(0.72 0.18 290)", color: "white" }}
        >
          Continue to Scope <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Step 2 — Select Scope ────────────────────────────────────────────────── */

function Step2({
  form,
  onChange,
  onNext,
  onBack,
}: {
  form: FeeFormState;
  onChange: (f: FeeFormState) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const toggleTeam = (id: string) => {
    const ids = form.targetTeamIds.includes(id)
      ? form.targetTeamIds.filter(t => t !== id)
      : [...form.targetTeamIds, id];
    onChange({ ...form, targetTeamIds: ids });
  };

  const togglePlayer = (id: string) => {
    const ids = form.targetPlayerIds.includes(id)
      ? form.targetPlayerIds.filter(p => p !== id)
      : [...form.targetPlayerIds, id];
    onChange({ ...form, targetPlayerIds: ids });
  };

  const affectedCount = form.scope === "team"
    ? MOCK_TEAMS.filter(t => form.targetTeamIds.includes(t.id)).reduce((s, t) => s + t.playerCount, 0)
    : form.scope === "individual"
    ? form.targetPlayerIds.length
    : 0;

  const valid =
    (form.scope === "team" && form.targetTeamIds.length > 0) ||
    (form.scope === "individual" && form.targetPlayerIds.length > 0);

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col gap-5">
      {/* Scope selector */}
      <div>
        <div className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>Who is this fee for?</div>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: "team",       label: "Entire Team(s)",   icon: <Users className="w-4 h-4" />,   hint: "All players on selected teams" },
            { value: "individual", label: "Specific Players", icon: <User className="w-4 h-4" />,    hint: "Hand-pick players from roster" },
          ] as { value: FeeScope; label: string; icon: React.ReactNode; hint: string }[]).map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...form, scope: opt.value })}
              className="flex flex-col items-start gap-1.5 p-3 rounded-lg border text-left transition-all"
              style={{
                background: form.scope === opt.value ? "oklch(0.72 0.18 290 / 0.1)" : "var(--bg-surface)",
                borderColor: form.scope === opt.value ? "oklch(0.72 0.18 290)" : "var(--border)",
              }}
            >
              <div className="flex items-center gap-2" style={{ color: form.scope === opt.value ? "oklch(0.65 0.18 290)" : "var(--text-primary)" }}>
                {opt.icon}
                <span className="text-sm font-medium">{opt.label}</span>
              </div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{opt.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Team selection */}
      {form.scope === "team" && (
        <div>
          <div className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>Select Teams</div>
          <div className="flex flex-col gap-2">
            {MOCK_TEAMS.map(team => (
              <label
                key={team.id}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                style={{
                  background: form.targetTeamIds.includes(team.id) ? "oklch(0.72 0.18 290 / 0.08)" : "var(--bg-surface)",
                  borderColor: form.targetTeamIds.includes(team.id) ? "oklch(0.72 0.18 290 / 0.5)" : "var(--border)",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.targetTeamIds.includes(team.id)}
                  onChange={() => toggleTeam(team.id)}
                  className="rounded"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{team.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{team.playerCount} players</div>
                </div>
                {form.targetTeamIds.includes(team.id) && (
                  <Check className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.65 0.14 140)" }} />
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Individual player selection */}
      {form.scope === "individual" && (
        <div>
          <div className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>Select Players</div>
          <div className="flex flex-col gap-1">
            {MOCK_PLAYERS.map(player => (
              <label
                key={player.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all"
                style={{
                  background: form.targetPlayerIds.includes(player.id) ? "oklch(0.72 0.18 290 / 0.08)" : "transparent",
                  borderColor: form.targetPlayerIds.includes(player.id) ? "oklch(0.72 0.18 290 / 0.4)" : "var(--border)",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.targetPlayerIds.includes(player.id)}
                  onChange={() => togglePlayer(player.id)}
                  className="rounded"
                />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>{player.name}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{player.team}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Impact indicator */}
      {affectedCount > 0 && (
        <div
          className="rounded-lg border px-4 py-3 flex items-center gap-3"
          style={{ borderColor: "oklch(0.75 0.12 140 / 0.4)", background: "oklch(0.75 0.12 140 / 0.06)" }}
        >
          <Users className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.65 0.14 140)" }} />
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            <strong>{affectedCount}</strong> player{affectedCount !== 1 ? "s" : ""} will receive this fee request
          </span>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40"
          style={{ background: "oklch(0.72 0.18 290)", color: "white" }}
        >
          Review <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Step 3 — Review ──────────────────────────────────────────────────────── */

function Step3({
  form,
  onBack,
  onSubmit,
}: {
  form: FeeFormState;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const amountCents = Math.round(Number(form.amountDollars) * 100);
  const teams = MOCK_TEAMS.filter(t => form.targetTeamIds.includes(t.id));
  const players = MOCK_PLAYERS.filter(p => form.targetPlayerIds.includes(p.id));
  const affectedCount = form.scope === "team"
    ? teams.reduce((s, t) => s + t.playerCount, 0)
    : players.length;
  const totalObligationCents = amountCents * affectedCount;

  const rows: { label: string; value: string }[] = [
    { label: "Fee Name",   value: form.name },
    { label: "Type",       value: form.type.replace("_", " ").replace(/^\w/, c => c.toUpperCase()) },
    { label: "Structure",  value: form.structure === "installment" ? `${form.installmentCount} installments` : "One-time" },
    { label: "Amount",     value: formatCents(amountCents) + " per player" },
    { label: "Due Date",   value: form.dueDate ? new Date(form.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—" },
    { label: "Scope",      value: form.scope === "team" ? teams.map(t => t.name).join(", ") : `${players.length} individual player${players.length !== 1 ? "s" : ""}` },
    { label: "Accounts",   value: `${affectedCount} player${affectedCount !== 1 ? "s" : ""}` },
    { label: "Total Obligation", value: formatCents(totalObligationCents) },
  ];

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col gap-5">
      <div>
        <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Fee Request Summary</div>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          Review before publishing. This will create payment accounts for all affected players.
        </div>
      </div>

      <div className="rounded-lg border divide-y text-sm" style={{ borderColor: "var(--border)" }}>
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
            <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
            <span
              className="font-medium text-right"
              style={{
                color: row.label === "Total Obligation"
                  ? "oklch(0.72 0.18 290)"
                  : "var(--text-primary)",
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Warning if large obligation */}
      {totalObligationCents > 1000000 && (
        <div
          className="rounded-lg border px-4 py-3 text-sm flex items-start gap-2"
          style={{ borderColor: "oklch(0.65 0.18 75 / 0.4)", color: "oklch(0.55 0.18 75)", background: "oklch(0.78 0.16 75 / 0.08)" }}
        >
          <span className="mt-0.5 flex-shrink-0">⚠</span>
          <span>
            This creates a total obligation of <strong>{formatCents(totalObligationCents)}</strong> across {affectedCount} accounts.
            Confirm this is correct before publishing.
          </span>
        </div>
      )}

      <div
        className="rounded-lg border px-4 py-3 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)", color: "var(--text-muted)" }}
      >
        <strong style={{ color: "var(--text-primary)" }}>What happens next:</strong>{" "}
        Payment accounts will be created for each affected player. Their linked guardian/parent will be notified.
        Accounts will appear immediately in the Payments dashboard.
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onSubmit}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: "oklch(0.72 0.18 290)", color: "white" }}
        >
          <FileText className="w-4 h-4" /> Publish Fee Request
        </button>
      </div>
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────────────────────── */

export default function CreateFeeRequestPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FeeFormState>(EMPTY_FORM);

  function handleSubmit() {
    toast.success(`Fee request "${form.name}" published — payment accounts created`);
    navigate("/app/payments");
  }

  return (
    <AppShell>
      <div className="flex flex-col min-h-0" style={{ background: "var(--bg-base)" }}>
        <PageHeader
          title="Create Fee Request"
          subtitle="Define a payment obligation for players and families"
        />
        <StepBar step={step} />
        <div className="flex-1 overflow-y-auto">
          {step === 1 && <Step1 form={form} onChange={setForm} onNext={() => setStep(2)} />}
          {step === 2 && <Step2 form={form} onChange={setForm} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <Step3 form={form} onBack={() => setStep(2)} onSubmit={handleSubmit} />}
        </div>
      </div>
    </AppShell>
  );
}
