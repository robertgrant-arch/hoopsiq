import { useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Users,
  TrendingUp,
  BarChart2,
  FileText,
  X,
  Plus,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import {
  seasons,
  currentSeason,
  getSeasonYearOverYear,
  type Season,
  type SeasonType,
} from "@/features/club-ops/mock";

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const PRIMARY  = "oklch(0.72 0.18 290)";
const SUCCESS  = "oklch(0.75 0.12 140)";
const WARNING  = "oklch(0.78 0.16 75)";
const DANGER   = "oklch(0.68 0.22 25)";
const MUTED_FG = "oklch(0.55 0.02 260)";

// Today's date per task spec
const TODAY = new Date("2026-05-15");

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
}

function daysRemaining(endDateStr: string): number {
  return Math.max(0, daysUntil(endDateStr));
}

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

const STATUS_COLORS: Record<Season["status"], string> = {
  active:    SUCCESS,
  completed: MUTED_FG,
  upcoming:  WARNING,
  archived:  MUTED_FG,
};

const TYPE_COLORS: Record<SeasonType, string> = {
  fall:   WARNING,
  spring: SUCCESS,
  summer: "oklch(0.72 0.18 200)",
  winter: PRIMARY,
};

/* -------------------------------------------------------------------------- */
/* Status pill                                                                 */
/* -------------------------------------------------------------------------- */

function StatusPill({ status }: { status: Season["status"] }) {
  const color = STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.08em]"
      style={{
        background: `${color.replace(")", " / 0.12)")}`,
        color,
        border: `1px solid ${color.replace(")", " / 0.30)")}`,
      }}
    >
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: SeasonType }) {
  const color = TYPE_COLORS[type];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium capitalize"
      style={{
        background: `${color.replace(")", " / 0.10)")}`,
        color,
      }}
    >
      {type}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat bar                                                                   */
/* -------------------------------------------------------------------------- */

function StatBar({ value, color = PRIMARY }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.01 260)" }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.round(Math.min(1, value) * 100)}%`, background: color }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Assessment window card                                                     */
/* -------------------------------------------------------------------------- */

function AssessmentWindowCard({ window: win }: { window: Season["assessmentWindows"][number] }) {
  const statusColor =
    win.status === "open"     ? SUCCESS :
    win.status === "upcoming" ? WARNING : MUTED_FG;

  const statusLabel =
    win.status === "open"     ? "Open Now" :
    win.status === "upcoming" ? "Upcoming" : "Closed";

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[15px] font-semibold">{win.label}</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            {formatDateRange(win.openDate, win.closeDate)}
          </div>
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.08em] shrink-0"
          style={{
            background: `${statusColor.replace(")", " / 0.12)")}`,
            color: statusColor,
            border: `1px solid ${statusColor.replace(")", " / 0.30)")}`,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {win.status !== "upcoming" && (
        <div>
          <div className="flex justify-between text-[12px] mb-1.5">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-semibold" style={{ color: win.completionRate >= 0.8 ? SUCCESS : WARNING }}>
              {pct(win.completionRate)}
            </span>
          </div>
          <StatBar value={win.completionRate} color={win.completionRate >= 0.8 ? SUCCESS : WARNING} />
        </div>
      )}

      {win.status !== "upcoming" && win.completionRate < 1 && (
        <button
          className="w-full text-[12px] font-medium py-2 rounded-lg transition-colors"
          style={{
            background: "oklch(0.18 0.005 260)",
            color: MUTED_FG,
            minHeight: 36,
          }}
          onClick={() => toast.info(`Showing players who have not completed ${win.label}`)}
        >
          View incomplete players →
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Close season confirm dialog                                                */
/* -------------------------------------------------------------------------- */

function CloseSeasonDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div
        className="relative rounded-2xl border border-border bg-card p-6 w-full max-w-sm space-y-4"
        style={{ boxShadow: "0 20px 60px oklch(0 0 0 / 0.5)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${DANGER.replace(")", " / 0.12)")}` }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: DANGER }} />
          </div>
          <div>
            <div className="text-[15px] font-bold">Close Spring 2026?</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">This action cannot be undone.</div>
          </div>
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Closing the season will lock all assessment windows, generate final player reports,
          and mark the season as completed. Players will no longer be able to submit film or
          check-ins against this season.
        </p>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl text-[13px] font-semibold transition-colors"
            style={{
              background: "oklch(0.18 0.005 260)",
              color: MUTED_FG,
              minHeight: 44,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-xl text-[13px] font-bold transition-colors"
            style={{
              background: DANGER,
              color: "oklch(0.98 0.005 25)",
              minHeight: 44,
            }}
          >
            Close Season
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* New season modal                                                            */
/* -------------------------------------------------------------------------- */

type NewSeasonForm = {
  name: string;
  type: SeasonType | "";
  startDate: string;
  endDate: string;
  ageGroups: string[];
  windows: { label: string; openDate: string; closeDate: string }[];
};

const BLANK_FORM: NewSeasonForm = {
  name: "",
  type: "",
  startDate: "",
  endDate: "",
  ageGroups: [],
  windows: [{ label: "Baseline Assessment", openDate: "", closeDate: "" }],
};

const AGE_GROUPS = ["13U", "15U", "17U", "18U"];
const SEASON_TYPES: SeasonType[] = ["fall", "spring", "summer", "winter"];

function NewSeasonModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<NewSeasonForm>(BLANK_FORM);

  function toggleAgeGroup(ag: string) {
    setForm((f) => ({
      ...f,
      ageGroups: f.ageGroups.includes(ag)
        ? f.ageGroups.filter((g) => g !== ag)
        : [...f.ageGroups, ag],
    }));
  }

  function addWindow() {
    if (form.windows.length >= 3) return;
    setForm((f) => ({
      ...f,
      windows: [...f.windows, { label: "", openDate: "", closeDate: "" }],
    }));
  }

  function updateWindow(i: number, field: string, value: string) {
    setForm((f) => {
      const windows = [...f.windows];
      windows[i] = { ...windows[i], [field]: value };
      return { ...f, windows };
    });
  }

  function handleSave() {
    if (!form.name.trim() || !form.type || !form.startDate || !form.endDate) {
      toast.error("Please fill in all required fields.");
      return;
    }
    toast.success(`Season "${form.name}" created successfully`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border bg-card flex flex-col max-h-[92dvh]"
        style={{ boxShadow: "0 24px 80px oklch(0 0 0 / 0.5)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="text-[16px] font-bold">New Season</div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

          {/* Season name */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
              Season Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Winter 2027"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl px-3.5 py-2.5 text-[14px] bg-background border border-border focus:outline-none focus:border-[oklch(0.72_0.18_290)] transition-colors"
              style={{ minHeight: 44, color: "inherit" }}
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
              Season Type *
            </label>
            <div className="flex gap-2 flex-wrap">
              {SEASON_TYPES.map((t) => {
                const active = form.type === t;
                const color  = TYPE_COLORS[t];
                return (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className="px-4 py-2 rounded-full text-[13px] font-medium capitalize transition-all"
                    style={{
                      minHeight: 44,
                      background: active ? `${color.replace(")", " / 0.15)")}` : "oklch(0.18 0.005 260)",
                      color:      active ? color : MUTED_FG,
                      border: active
                        ? `1.5px solid ${color.replace(")", " / 0.35)")}`
                        : "1.5px solid oklch(0.22 0.01 260)",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                Start Date *
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-[13px] bg-background border border-border focus:outline-none focus:border-[oklch(0.72_0.18_290)] transition-colors"
                style={{ minHeight: 44, color: "inherit" }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                End Date *
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-[13px] bg-background border border-border focus:outline-none focus:border-[oklch(0.72_0.18_290)] transition-colors"
                style={{ minHeight: 44, color: "inherit" }}
              />
            </div>
          </div>

          {/* Age groups */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
              Age Groups
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AGE_GROUPS.map((ag) => {
                const checked = form.ageGroups.includes(ag);
                return (
                  <button
                    key={ag}
                    onClick={() => toggleAgeGroup(ag)}
                    className="px-3 py-2 rounded-xl text-[13px] font-medium transition-all"
                    style={{
                      minHeight: 44,
                      background: checked ? `${PRIMARY.replace(")", " / 0.14)")}` : "oklch(0.18 0.005 260)",
                      color:      checked ? PRIMARY : MUTED_FG,
                      border: checked
                        ? `1.5px solid ${PRIMARY.replace(")", " / 0.35)")}`
                        : "1.5px solid oklch(0.22 0.01 260)",
                      fontWeight: checked ? 600 : 400,
                    }}
                  >
                    {ag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assessment windows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                Assessment Windows
              </label>
              {form.windows.length < 3 && (
                <button
                  onClick={addWindow}
                  className="flex items-center gap-1 text-[12px] font-medium transition-colors"
                  style={{ color: PRIMARY, minHeight: 28 }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add window
                </button>
              )}
            </div>
            {form.windows.map((win, i) => (
              <div key={i} className="rounded-xl border border-border bg-background p-3 space-y-2.5">
                <input
                  type="text"
                  placeholder="Window name (e.g. Baseline Assessment)"
                  value={win.label}
                  onChange={(e) => updateWindow(i, "label", e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-[13px] bg-card border border-border focus:outline-none transition-colors"
                  style={{ minHeight: 38, color: "inherit" }}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    placeholder="Open date"
                    value={win.openDate}
                    onChange={(e) => updateWindow(i, "openDate", e.target.value)}
                    className="rounded-lg px-3 py-2 text-[12px] bg-card border border-border focus:outline-none transition-colors"
                    style={{ minHeight: 38, color: "inherit" }}
                  />
                  <input
                    type="date"
                    placeholder="Close date"
                    value={win.closeDate}
                    onChange={(e) => updateWindow(i, "closeDate", e.target.value)}
                    className="rounded-lg px-3 py-2 text-[12px] bg-card border border-border focus:outline-none transition-colors"
                    style={{ minHeight: 38, color: "inherit" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4 shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl text-[13px] font-semibold transition-colors"
            style={{ background: "oklch(0.18 0.005 260)", color: MUTED_FG, minHeight: 44 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 rounded-xl text-[13px] font-bold transition-all"
            style={{ background: PRIMARY, color: "oklch(0.98 0.005 290)", minHeight: 44 }}
          >
            Create Season
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Year-over-year comparison                                                  */
/* -------------------------------------------------------------------------- */

function YearOverYearPanel() {
  const [seasonAId, setSeasonAId] = useState("season_fall_2025");
  const [seasonBId, setSeasonBId] = useState("season_spring_2026");

  const comparison = getSeasonYearOverYear(seasonAId, seasonBId);

  const completedOrActive = seasons.filter(
    (s) => s.status === "completed" || s.status === "active"
  );

  function DeltaValue({ delta, formatter = (v: number) => `${v > 0 ? "+" : ""}${v}` }: { delta: number; formatter?: (v: number) => string }) {
    const color = delta > 0 ? SUCCESS : delta < 0 ? DANGER : MUTED_FG;
    return (
      <span className="text-[13px] font-bold" style={{ color }}>
        {formatter(delta)}
      </span>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[15px] font-bold">Year-over-Year</div>
      </div>

      {/* Season selectors */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { id: seasonAId, setId: setSeasonAId, label: "Season A" },
          { id: seasonBId, setId: setSeasonBId, label: "Season B" },
        ].map(({ id, setId, label }) => (
          <div key={label} className="space-y-1">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
              {label}
            </div>
            <div className="relative">
              <select
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full appearance-none rounded-xl px-3.5 py-2.5 pr-8 text-[13px] bg-background border border-border focus:outline-none transition-colors"
                style={{ minHeight: 44, color: "inherit" }}
              >
                {completedOrActive.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: MUTED_FG }}
              />
            </div>
          </div>
        ))}
      </div>

      {comparison && (
        <>
          {/* Summary banner */}
          <div
            className="rounded-xl px-4 py-3 text-[13px] leading-relaxed"
            style={{
              background: `${PRIMARY.replace(")", " / 0.08)")}`,
              border: `1px solid ${PRIMARY.replace(")", " / 0.20)")}`,
              color: "oklch(0.80 0.04 290)",
            }}
          >
            {comparison.summary}
          </div>

          {/* Comparison grid */}
          <div className="space-y-3">
            {[
              {
                label: "Avg Skill Delta",
                a: comparison.seasonA.stats.avgSkillDelta,
                b: comparison.seasonB.stats.avgSkillDelta,
                delta: comparison.deltas.avgSkillDelta,
                format: (v: number) => v.toFixed(2),
                deltaFormat: (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)}`,
              },
              {
                label: "WOD Completion",
                a: comparison.seasonA.stats.avgWodCompletion,
                b: comparison.seasonB.stats.avgWodCompletion,
                delta: comparison.deltas.avgWodCompletion,
                format: (v: number) => pct(v),
                deltaFormat: (v: number) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}pp`,
              },
              {
                label: "IDP Completion",
                a: comparison.seasonA.stats.idpGoalsTotal > 0
                  ? comparison.seasonA.stats.idpGoalsCompleted / comparison.seasonA.stats.idpGoalsTotal
                  : 0,
                b: comparison.seasonB.stats.idpGoalsTotal > 0
                  ? comparison.seasonB.stats.idpGoalsCompleted / comparison.seasonB.stats.idpGoalsTotal
                  : 0,
                delta: comparison.deltas.idpCompletionRate,
                format: (v: number) => pct(v),
                deltaFormat: (v: number) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}pp`,
              },
              {
                label: "Player Retention",
                a: comparison.seasonA.stats.playerRetentionRate,
                b: comparison.seasonB.stats.playerRetentionRate,
                delta: comparison.deltas.playerRetentionRate,
                format: (v: number) => pct(v),
                deltaFormat: (v: number) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}pp`,
              },
            ].map((row) => (
              <div key={row.label} className="rounded-xl bg-background border border-border p-4">
                <div className="text-[11px] text-muted-foreground uppercase tracking-[0.08em] mb-2">
                  {row.label}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-center">
                    <div className="text-[11px] text-muted-foreground mb-1">{comparison.seasonA.name}</div>
                    <div className="text-[18px] font-bold">{row.format(row.a)}</div>
                  </div>
                  <div className="text-[11px]" style={{ color: MUTED_FG }}>→</div>
                  <div className="flex-1 text-center">
                    <div className="text-[11px] text-muted-foreground mb-1">{comparison.seasonB.name}</div>
                    <div className="text-[18px] font-bold">{row.format(row.b)}</div>
                  </div>
                  <div className="w-14 text-right">
                    <DeltaValue
                      delta={row.delta}
                      formatter={row.deltaFormat}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function SeasonManagementPage() {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showNewSeason, setShowNewSeason]       = useState(false);

  const remaining = daysRemaining(currentSeason.endDate);
  const idpPct    = currentSeason.stats.idpGoalsTotal > 0
    ? currentSeason.stats.idpGoalsCompleted / currentSeason.stats.idpGoalsTotal
    : 0;

  function handleCloseSeason() {
    setShowCloseConfirm(false);
    toast.success("Season closed. Final reports are being generated.");
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">

        {/* Page header */}
        <PageHeader
          eyebrow="Admin"
          title="Season Management"
          subtitle="Manage development seasons, assessment windows, and year-over-year analytics."
          actions={
            <button
              onClick={() => setShowNewSeason(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all"
              style={{
                background: PRIMARY,
                color: "oklch(0.98 0.005 290)",
                minHeight: 44,
              }}
            >
              <Plus className="w-4 h-4" />
              New Season
            </button>
          }
        />

        {/* Active season hero */}
        <div
          className="rounded-xl border p-6 space-y-5"
          style={{
            background: `${PRIMARY.replace(")", " / 0.06)")}`,
            borderColor: `${PRIMARY.replace(")", " / 0.25)")}`,
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-[24px] font-bold">{currentSeason.name}</h2>
                <span
                  className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.1em]"
                  style={{
                    background: `${SUCCESS.replace(")", " / 0.15)")}`,
                    color: SUCCESS,
                    border: `2px solid ${SUCCESS.replace(")", " / 0.40)")}`,
                  }}
                >
                  ACTIVE
                </span>
              </div>
              <div className="text-[13px] text-muted-foreground mt-1">
                {formatDateRange(currentSeason.startDate, currentSeason.endDate)}
              </div>
            </div>

            {/* Days remaining */}
            <div
              className="rounded-xl px-5 py-3 text-center shrink-0"
              style={{
                background: "oklch(0.18 0.005 260)",
                border: "1px solid oklch(0.22 0.01 260)",
              }}
            >
              <div className="text-[32px] font-black" style={{ color: WARNING }}>
                {remaining}
              </div>
              <div className="text-[11px] text-muted-foreground">days left</div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <Users className="w-4 h-4" />, value: currentSeason.totalPlayers, label: "Players", color: PRIMARY },
              { icon: <Users className="w-4 h-4" />, value: currentSeason.activeCoaches, label: "Coaches", color: "oklch(0.72 0.14 200)" },
              { icon: <TrendingUp className="w-4 h-4" />, value: pct(currentSeason.stats.avgWodCompletion), label: "WOD Completion", color: SUCCESS },
              { icon: <BarChart2 className="w-4 h-4" />, value: pct(idpPct), label: "IDP Progress", color: WARNING },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-card border border-border p-3.5 flex flex-col gap-1"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">{stat.icon}
                  <span className="text-[11px]">{stat.label}</span>
                </div>
                <div className="text-[22px] font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex gap-3 flex-wrap">
            {[
              {
                label: "View Analytics",
                icon: <BarChart2 className="w-4 h-4" />,
                color: PRIMARY,
                onClick: () => toast.info("Opening season analytics"),
              },
              {
                label: "Generate Reports",
                icon: <FileText className="w-4 h-4" />,
                color: SUCCESS,
                onClick: () => toast.success("Generating player reports…"),
              },
              {
                label: "Close Season",
                icon: <Calendar className="w-4 h-4" />,
                color: DANGER,
                onClick: () => setShowCloseConfirm(true),
              },
            ].map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                style={{
                  minHeight: 44,
                  background: `${action.color.replace(")", " / 0.10)")}`,
                  color: action.color,
                  border: `1px solid ${action.color.replace(")", " / 0.25)")}`,
                }}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assessment windows */}
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] font-semibold mb-3" style={{ color: MUTED_FG }}>
            Assessment Windows — {currentSeason.name}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {currentSeason.assessmentWindows.map((win) => (
              <AssessmentWindowCard key={win.id} window={win} />
            ))}
          </div>
        </div>

        {/* Season list */}
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] font-semibold mb-3" style={{ color: MUTED_FG }}>
            All Seasons
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-card">
                  {["Season", "Type", "Status", "Dates", "Stats", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seasons.map((season, i) => {
                  const isLast = i === seasons.length - 1;
                  return (
                    <tr
                      key={season.id}
                      className={`${!isLast ? "border-b border-border" : ""} bg-background hover:bg-card transition-colors`}
                    >
                      {/* Name */}
                      <td className="px-4 py-3.5 font-semibold whitespace-nowrap">{season.name}</td>

                      {/* Type */}
                      <td className="px-4 py-3.5">
                        <TypeBadge type={season.type} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusPill status={season.status} />
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap hidden md:table-cell">
                        {new Date(season.startDate).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                        {" – "}
                        {new Date(season.endDate).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                      </td>

                      {/* Stats — only for completed seasons */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        {season.status === "completed" ? (
                          <div className="flex items-center gap-3 text-[12px]">
                            <span className="text-muted-foreground">
                              +{season.stats.avgSkillDelta.toFixed(1)} skill
                            </span>
                            <span className="text-muted-foreground">
                              {pct(season.stats.idpGoalsTotal > 0
                                ? season.stats.idpGoalsCompleted / season.stats.idpGoalsTotal
                                : 0)} IDP
                            </span>
                            <span className="text-muted-foreground">
                              {pct(season.stats.playerRetentionRate)} ret.
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[12px]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toast.info(`Viewing ${season.name}`)}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                            style={{
                              background: `${PRIMARY.replace(")", " / 0.10)")}`,
                              color: PRIMARY,
                              minHeight: 32,
                            }}
                          >
                            View
                          </button>
                          {season.status !== "archived" && (
                            <button
                              onClick={() => toast.info(`Editing ${season.name}`)}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                              style={{
                                background: "oklch(0.18 0.005 260)",
                                color: MUTED_FG,
                                minHeight: 32,
                              }}
                            >
                              Edit
                            </button>
                          )}
                          {season.status === "completed" && (
                            <button
                              onClick={() => toast.success(`${season.name} archived`)}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                              style={{
                                background: "oklch(0.18 0.005 260)",
                                color: MUTED_FG,
                                minHeight: 32,
                              }}
                            >
                              Archive
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Year-over-year comparison */}
        <YearOverYearPanel />

      </div>

      {/* Dialogs */}
      {showCloseConfirm && (
        <CloseSeasonDialog
          onConfirm={handleCloseSeason}
          onCancel={() => setShowCloseConfirm(false)}
        />
      )}
      {showNewSeason && <NewSeasonModal onClose={() => setShowNewSeason(false)} />}

    </AppShell>
  );
}
