/**
 * CustomDrillEditor
 * --------------------------------------------------------------------------
 * Modal dialog for creating + editing a coach's custom drills.
 *
 * Source: Prompt 16 addendum.
 *
 * Fields per spec:
 *   - name (title), description, category
 *   - default duration, intensity, surface, player range, coaches needed
 *   - equipment (chips), coaching points (bullets)
 *   - optional Mux video URL, optional diagram URL
 *   - visibility: private | org | public
 *
 * Implementation notes from code review:
 *   • Numeric fields (duration, coaches, min/max players) live in a single
 *     `numStr` raw-string buffer and are not duplicated on the form object.
 *     We derive their parsed integer values at submit time only.
 *   • `canSave` reads live raw-string values via `normalizePositiveInt` so
 *     the Save button never reflects stale state mid-typing.
 *   • Every input/select uses a real <label htmlFor=> with a stable id for
 *     screen readers. Visibility option buttons expose `aria-pressed`.
 *     Equipment/coaching-point delete buttons expose `aria-label`.
 */

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumericInput, normalizePositiveInt } from "@/components/ui/numeric-input";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import {
  drillCategories,
  type Drill,
  type DrillIntensity,
  type DrillSurface,
  type DrillVisibility,
} from "@/features/practice-plan/mock";
import {
  useCustomDrillsStore,
  type CustomDrillInput,
} from "@/lib/customDrillsStore";

const INTENSITIES: DrillIntensity[] = ["LOW", "MEDIUM", "HIGH", "MAX"];
const SURFACES: DrillSurface[] = [
  "HALF_COURT",
  "FULL_COURT",
  "BASELINE",
  "STATIONARY",
];
const VISIBILITIES: { value: DrillVisibility; label: string; hint: string }[] = [
  { value: "private", label: "Private", hint: "Only you can see this drill" },
  { value: "org", label: "Org", hint: "Shared with every coach in your org" },
  { value: "public", label: "Public", hint: "Visible to all HoopsIQ coaches" },
];

/* -------------------------------------------------------------------------- */
/* Form shape                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Non-numeric portion of the drill form. Numeric fields are managed via the
 * `numStr` raw-string buffer so we have a single source of truth for editing.
 */
type DrillFormShape = Omit<
  CustomDrillInput,
  "defaultDurationMin" | "coachesNeeded" | "minPlayers" | "maxPlayers"
>;

const emptyFormShape: DrillFormShape = {
  title: "",
  description: "",
  categoryId: "cat_warmup",
  intensity: "MEDIUM",
  surface: "HALF_COURT",
  equipment: [],
  videoUrl: undefined,
  diagramUrl: undefined,
  coachingPoints: [],
  tags: [],
  visibility: "private",
};

const emptyNumStr = {
  duration: "10",
  coaches: "1",
  minPlayers: "1",
  maxPlayers: "12",
};

function fromDrillShape(d: Drill): { shape: DrillFormShape; numStr: typeof emptyNumStr } {
  return {
    shape: {
      title: d.title,
      description: d.description,
      categoryId: d.categoryId,
      intensity: d.intensity,
      surface: d.surface,
      equipment: d.equipment,
      videoUrl: d.videoUrl,
      diagramUrl: d.diagramUrl,
      coachingPoints: d.coachingPoints ?? [],
      tags: d.tags,
      visibility: d.visibility ?? "private",
    },
    numStr: {
      duration: String(d.defaultDurationMin),
      coaches: String(d.coachesNeeded),
      minPlayers: String(d.minPlayers),
      maxPlayers: String(d.maxPlayers),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export function CustomDrillEditor({
  open,
  onOpenChange,
  editing,
  ownerCoachId,
  orgId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Drill currently being edited, or `null` for new. */
  editing: Drill | null;
  ownerCoachId: string;
  orgId?: string;
  onSaved?: (drill: Drill) => void;
}) {
  const create = useCustomDrillsStore((s) => s.create);
  const update = useCustomDrillsStore((s) => s.update);

  const [form, setForm] = useState<DrillFormShape>(emptyFormShape);
  const [numStr, setNumStr] = useState(emptyNumStr);
  const [equipDraft, setEquipDraft] = useState("");
  const [pointDraft, setPointDraft] = useState("");

  // Stable ids for label association. useId guarantees uniqueness across
  // multiple instances of the editor on the same page.
  const idScope = useId();
  const id = (key: string) => `${idScope}-${key}`;

  // Sync form whenever the editor reopens.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      const { shape, numStr } = fromDrillShape(editing);
      setForm(shape);
      setNumStr(numStr);
    } else {
      setForm(emptyFormShape);
      setNumStr(emptyNumStr);
    }
    setEquipDraft("");
    setPointDraft("");
  }, [open, editing]);

  /**
   * Live save-validity check. Reads numStr directly so the Save button
   * reflects what the user is typing, not a stale snapshot of `form`.
   */
  const canSave = useMemo(() => {
    const duration = normalizePositiveInt(numStr.duration);
    const minPlayers = normalizePositiveInt(numStr.minPlayers);
    const maxPlayers = normalizePositiveInt(numStr.maxPlayers, {
      min: minPlayers,
      fallback: minPlayers,
    });
    return (
      form.title.trim().length >= 3 &&
      form.description.trim().length >= 6 &&
      duration >= 1 &&
      maxPlayers >= minPlayers
    );
  }, [
    form.title,
    form.description,
    numStr.duration,
    numStr.minPlayers,
    numStr.maxPlayers,
  ]);

  const set = <K extends keyof DrillFormShape>(k: K, v: DrillFormShape[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function addEquipment() {
    const v = equipDraft.trim();
    if (!v) return;
    if (form.equipment.includes(v)) {
      setEquipDraft("");
      return;
    }
    set("equipment", [...form.equipment, v]);
    setEquipDraft("");
  }

  function addCoachingPoint() {
    const v = pointDraft.trim();
    if (!v) return;
    set("coachingPoints", [...form.coachingPoints, v]);
    setPointDraft("");
  }

  function handleSave() {
    // Final coercion of the raw-string number fields. This handles the case
    // where the user is still focused on a number input and clicks Save.
    const duration = normalizePositiveInt(numStr.duration);
    const coaches = normalizePositiveInt(numStr.coaches);
    const minPlayers = normalizePositiveInt(numStr.minPlayers);
    const maxPlayers = normalizePositiveInt(numStr.maxPlayers, {
      min: minPlayers,
      fallback: minPlayers,
    });

    const payload: CustomDrillInput = {
      ...form,
      defaultDurationMin: duration,
      coachesNeeded: coaches,
      minPlayers,
      maxPlayers,
    };

    const isValid =
      payload.title.trim().length >= 3 &&
      payload.description.trim().length >= 6 &&
      payload.defaultDurationMin >= 1 &&
      payload.maxPlayers >= payload.minPlayers;
    if (!isValid) {
      toast.error("Title, description, duration, and player range are required.");
      return;
    }

    if (editing) {
      update(editing.id, payload);
      toast.success(`Updated "${payload.title}"`);
      onSaved?.({ ...editing, ...payload });
    } else {
      const created = create(payload, ownerCoachId, orgId);
      toast.success(`Saved "${payload.title}" to My Drills`);
      onSaved?.(created);
    }
    onOpenChange(false);
  }

  // Pre-compute the live min for maxPlayers' clamp. Reads raw string so the
  // user can see the constraint update as they type the floor.
  const maxPlayersMin = normalizePositiveInt(numStr.minPlayers);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-tight">
            {editing ? "Edit drill" : "New custom drill"}
          </DialogTitle>
          <DialogDescription>
            Saved drills appear under the <strong>My Drills</strong> tab and can
            be dropped into any practice plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title + Category */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr,200px] gap-3">
            <FieldLabel htmlFor={id("title")}>Drill name</FieldLabel>
            <FieldLabel htmlFor={id("category")}>Category</FieldLabel>
            <Input
              id={id("title")}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Spain PnR — Live"
              className="h-9"
            />
            <Select
              value={form.categoryId}
              onValueChange={(v) => set("categoryId", v)}
            >
              <SelectTrigger id={id("category")} className="h-9 text-[12.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {drillCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: c.color }}
                      />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <FieldLabel htmlFor={id("description")}>Description</FieldLabel>
            <Textarea
              id={id("description")}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Setup, execution, scoring conditions…"
              rows={3}
              className="text-[12.5px] resize-none"
            />
          </div>

          {/* Duration / intensity / surface / coaches */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumericInput
              id={id("duration")}
              label="Duration (min)"
              value={normalizePositiveInt(numStr.duration)}
              onChange={(n) => setNumStr((p) => ({ ...p, duration: String(n) }))}
              min={1}
              max={120}
            />
            <div>
              <FieldLabel htmlFor={id("intensity")}>Intensity</FieldLabel>
              <Select
                value={form.intensity}
                onValueChange={(v) => set("intensity", v as DrillIntensity)}
              >
                <SelectTrigger id={id("intensity")} className="h-9 text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTENSITIES.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor={id("surface")}>Surface</FieldLabel>
              <Select
                value={form.surface}
                onValueChange={(v) => set("surface", v as DrillSurface)}
              >
                <SelectTrigger id={id("surface")} className="h-9 text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SURFACES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <NumericInput
              id={id("coaches")}
              label="Coaches"
              value={normalizePositiveInt(numStr.coaches)}
              onChange={(n) => setNumStr((p) => ({ ...p, coaches: String(n) }))}
              min={1}
              max={10}
            />
          </div>

          {/* Player range */}
          <div className="grid grid-cols-2 gap-3">
            <NumericInput
              id={id("minPlayers")}
              label="Min players"
              value={normalizePositiveInt(numStr.minPlayers)}
              onChange={(n) =>
                setNumStr((p) => ({ ...p, minPlayers: String(n) }))
              }
              min={1}
              max={50}
            />
            <NumericInput
              id={id("maxPlayers")}
              label="Max players"
              value={normalizePositiveInt(numStr.maxPlayers, {
                min: maxPlayersMin,
                fallback: maxPlayersMin,
              })}
              onChange={(n) =>
                setNumStr((p) => ({ ...p, maxPlayers: String(n) }))
              }
              min={maxPlayersMin}
              max={50}
              fallback={maxPlayersMin}
            />
          </div>

          {/* Equipment chips */}
          <div>
            <FieldLabel htmlFor={id("equipment")}>Equipment</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id={id("equipment")}
                value={equipDraft}
                onChange={(e) => setEquipDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEquipment();
                  }
                }}
                placeholder="e.g. 4 cones, 2 balls, agility ladder"
                className="h-9"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addEquipment}
                aria-label="Add equipment"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
            </div>
            {form.equipment.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.equipment.map((e) => (
                  <span
                    key={e}
                    className="inline-flex items-center gap-1 text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-muted/40 border border-border"
                  >
                    {e}
                    <button
                      type="button"
                      aria-label={`Remove ${e}`}
                      onClick={() =>
                        set(
                          "equipment",
                          form.equipment.filter((x) => x !== e),
                        )
                      }
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Coaching points */}
          <div>
            <FieldLabel htmlFor={id("coachingPoint")}>Coaching points</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id={id("coachingPoint")}
                value={pointDraft}
                onChange={(e) => setPointDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCoachingPoint();
                  }
                }}
                placeholder="e.g. Hands ready, low stance, communicate switches"
                className="h-9"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addCoachingPoint}
                aria-label="Add coaching point"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
            </div>
            {form.coachingPoints.length > 0 && (
              <ul className="mt-2 space-y-1">
                {form.coachingPoints.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[12.5px] bg-muted/30 border border-border rounded px-2 py-1.5"
                  >
                    <span className="text-primary font-bold" aria-hidden="true">
                      •
                    </span>
                    <span className="flex-1">{p}</span>
                    <button
                      type="button"
                      aria-label="Remove coaching point"
                      onClick={() =>
                        set(
                          "coachingPoints",
                          form.coachingPoints.filter((_, idx) => idx !== i),
                        )
                      }
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Optional media */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor={id("videoUrl")}>
                Video URL (Mux / YouTube — optional)
              </FieldLabel>
              <Input
                id={id("videoUrl")}
                value={form.videoUrl ?? ""}
                onChange={(e) =>
                  set("videoUrl", e.target.value || undefined)
                }
                placeholder="https://stream.mux.com/…"
                className="h-9"
              />
            </div>
            <div>
              <FieldLabel htmlFor={id("diagramUrl")}>
                Diagram URL (optional)
              </FieldLabel>
              <Input
                id={id("diagramUrl")}
                value={form.diagramUrl ?? ""}
                onChange={(e) =>
                  set("diagramUrl", e.target.value || undefined)
                }
                placeholder="https://…"
                className="h-9"
              />
            </div>
          </div>

          {/* Visibility */}
          <div>
            <FieldLabel as="div">Visibility</FieldLabel>
            <div
              role="radiogroup"
              aria-label="Visibility"
              className="grid grid-cols-3 gap-2"
            >
              {VISIBILITIES.map((v) => {
                const active = form.visibility === v.value;
                return (
                  <button
                    key={v.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-pressed={active}
                    onClick={() => set("visibility", v.value)}
                    className={`text-left p-2.5 rounded-md border transition ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="text-[12.5px] font-semibold uppercase tracking-wide">
                      {v.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {v.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {editing ? "Save changes" : "Create drill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Field label                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Real <label htmlFor=> for screen-reader association. Falls back to a styled
 * <div> when no input id is available (e.g. group-level captions like the
 * Visibility radio group, which uses role="radiogroup" + aria-label).
 */
function FieldLabel({
  htmlFor,
  as = "label",
  children,
}: {
  htmlFor?: string;
  as?: "label" | "div";
  children: ReactNode;
}) {
  const className =
    "text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1 block";
  if (as === "div" || !htmlFor) {
    return <div className={className}>{children}</div>;
  }
  return (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  );
}
