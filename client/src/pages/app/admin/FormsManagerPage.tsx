/**
 * FormsManagerPage — /app/admin/forms
 *
 * Form creation, distribution, and completion tracking for program operations.
 * Tabs: Active Forms | Form Builder | Archive
 */
import { useState } from "react";
import {
  FileText,
  Plus,
  Send,
  Edit2,
  Archive,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  ChevronDown,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  Signature,
  Calendar,
  Users,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type FormCategory = "Waiver" | "Medical" | "Consent" | "Registration" | "Custom";
type FormAudience = "All Families" | "Players Only" | "Parents Only" | "17U" | "15U";

interface ActiveForm {
  id: string;
  name: string;
  category: FormCategory;
  dueDate: string;
  dueDateMs: number;
  completedFamilies: number;
  totalFamilies: number;
  audience: FormAudience;
  season: string;
  requiresResigning: boolean;
}

interface ArchivedForm {
  id: string;
  name: string;
  category: FormCategory;
  season: string;
  completedFamilies: number;
  totalFamilies: number;
  archivedDate: string;
}

type FieldType = "short-text" | "long-text" | "checkbox" | "signature" | "date" | "multiple-choice";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];
}

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const now = Date.now();
const day = 86400000;

const ACTIVE_FORMS: ActiveForm[] = [
  {
    id: "f1",
    name: "2026 Liability Waiver",
    category: "Waiver",
    dueDate: "May 20, 2026",
    dueDateMs: now + 5 * day,
    completedFamilies: 38,
    totalFamilies: 42,
    audience: "All Families",
    season: "Spring 2026",
    requiresResigning: true,
  },
  {
    id: "f2",
    name: "Medical Release & Allergy Form",
    category: "Medical",
    dueDate: "May 20, 2026",
    dueDateMs: now + 5 * day,
    completedFamilies: 34,
    totalFamilies: 42,
    audience: "All Families",
    season: "Spring 2026",
    requiresResigning: true,
  },
  {
    id: "f3",
    name: "Photo & Video Consent",
    category: "Consent",
    dueDate: "May 22, 2026",
    dueDateMs: now + 7 * day,
    completedFamilies: 42,
    totalFamilies: 42,
    audience: "All Families",
    season: "Spring 2026",
    requiresResigning: false,
  },
  {
    id: "f4",
    name: "Emergency Contact Update",
    category: "Registration",
    dueDate: "May 18, 2026",
    dueDateMs: now + 3 * day,
    completedFamilies: 29,
    totalFamilies: 42,
    audience: "All Families",
    season: "Spring 2026",
    requiresResigning: false,
  },
  {
    id: "f5",
    name: "Code of Conduct Agreement",
    category: "Waiver",
    dueDate: "May 25, 2026",
    dueDateMs: now + 10 * day,
    completedFamilies: 40,
    totalFamilies: 42,
    audience: "All Families",
    season: "Spring 2026",
    requiresResigning: true,
  },
  {
    id: "f6",
    name: "Spring Invitational Permission Slip",
    category: "Consent",
    dueDate: "May 17, 2026",
    dueDateMs: now + 2 * day,
    completedFamilies: 21,
    totalFamilies: 28,
    audience: "17U",
    season: "Spring 2026",
    requiresResigning: false,
  },
  {
    id: "f7",
    name: "Uniform Sizing & Jersey Number",
    category: "Registration",
    dueDate: "June 1, 2026",
    dueDateMs: now + 17 * day,
    completedFamilies: 42,
    totalFamilies: 42,
    audience: "All Families",
    season: "Spring 2026",
    requiresResigning: false,
  },
  {
    id: "f8",
    name: "Parent Volunteer Interest Survey",
    category: "Custom",
    dueDate: "June 5, 2026",
    dueDateMs: now + 21 * day,
    completedFamilies: 18,
    totalFamilies: 42,
    audience: "Parents Only",
    season: "Spring 2026",
    requiresResigning: false,
  },
];

const ARCHIVED_FORMS: ArchivedForm[] = [
  { id: "af1", name: "2025 Fall Liability Waiver",   category: "Waiver",       season: "Fall 2025",   completedFamilies: 39, totalFamilies: 39, archivedDate: "Jan 15, 2026" },
  { id: "af2", name: "Medical Release Fall 2025",    category: "Medical",      season: "Fall 2025",   completedFamilies: 37, totalFamilies: 39, archivedDate: "Jan 15, 2026" },
  { id: "af3", name: "Photo Consent Fall 2025",      category: "Consent",      season: "Fall 2025",   completedFamilies: 39, totalFamilies: 39, archivedDate: "Jan 15, 2026" },
  { id: "af4", name: "Summer 2025 Registration",     category: "Registration", season: "Summer 2025", completedFamilies: 45, totalFamilies: 45, archivedDate: "Aug 30, 2025" },
  { id: "af5", name: "Code of Conduct Fall 2025",    category: "Waiver",       season: "Fall 2025",   completedFamilies: 38, totalFamilies: 39, archivedDate: "Jan 15, 2026" },
];

const SAMPLE_FIELDS: FormField[] = [
  { id: "sf1", type: "short-text",     label: "Player Full Name",                  required: true  },
  { id: "sf2", type: "date",           label: "Date of Birth",                     required: true  },
  { id: "sf3", type: "multiple-choice",label: "Has your child had a concussion in the last 12 months?", required: true, options: ["Yes", "No", "Unsure"] },
  { id: "sf4", type: "long-text",      label: "Known medical conditions / allergies (if none, write N/A)", required: true },
  { id: "sf5", type: "checkbox",       label: "I authorize emergency medical treatment if I cannot be reached", required: true },
  { id: "sf6", type: "signature",      label: "Parent / Guardian Signature",        required: true  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function categoryStyle(cat: FormCategory): React.CSSProperties {
  switch (cat) {
    case "Waiver":       return { background: "oklch(0.68 0.22 25 / 0.10)",  color: "oklch(0.68 0.22 25)"  };
    case "Medical":      return { background: "oklch(0.72 0.18 290 / 0.10)", color: "oklch(0.72 0.18 290)" };
    case "Consent":      return { background: "oklch(0.75 0.12 140 / 0.10)", color: "oklch(0.75 0.12 140)" };
    case "Registration": return { background: "oklch(0.78 0.16 75 / 0.10)",  color: "oklch(0.78 0.16 75)"  };
    case "Custom":       return { background: "oklch(0.65 0.02 260 / 0.10)", color: "oklch(0.60 0.02 260)" };
  }
}

function urgencyColor(dueDateMs: number): string {
  const daysLeft = Math.floor((dueDateMs - Date.now()) / 86400000);
  if (daysLeft <= 3)  return "oklch(0.68 0.22 25)";
  if (daysLeft <= 7)  return "oklch(0.78 0.16 75)";
  return "oklch(0.75 0.12 140)";
}

function completionPct(completed: number, total: number) {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

function ProgressBar({ pct }: { pct: number }) {
  const color =
    pct === 100 ? "oklch(0.75 0.12 140)" :
    pct < 80    ? "oklch(0.68 0.22 25)"  :
                  "oklch(0.78 0.16 75)";
  return (
    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function fieldTypeIcon(type: FieldType) {
  switch (type) {
    case "short-text":     return <FileText className="w-3.5 h-3.5" />;
    case "long-text":      return <FileText className="w-3.5 h-3.5 opacity-60" />;
    case "checkbox":       return <CheckCircle2 className="w-3.5 h-3.5" />;
    case "signature":      return <Signature className="w-3.5 h-3.5" />;
    case "date":           return <Calendar className="w-3.5 h-3.5" />;
    case "multiple-choice":return <Tag className="w-3.5 h-3.5" />;
  }
}

function fieldTypeLabel(type: FieldType) {
  switch (type) {
    case "short-text":     return "Short text";
    case "long-text":      return "Long text";
    case "checkbox":       return "Checkbox";
    case "signature":      return "Signature";
    case "date":           return "Date";
    case "multiple-choice":return "Multiple choice";
  }
}

/* -------------------------------------------------------------------------- */
/* StatsBar                                                                    */
/* -------------------------------------------------------------------------- */

function StatsBar() {
  const totalForms = ACTIVE_FORMS.length;
  const avgCompletion = Math.round(
    ACTIVE_FORMS.reduce((sum, f) => sum + completionPct(f.completedFamilies, f.totalFamilies), 0) / totalForms
  );
  const dueSoon = ACTIVE_FORMS.filter((f) => f.dueDateMs - Date.now() <= 7 * 86400000).length;
  const outstandingSigs = ACTIVE_FORMS.filter((f) => f.category === "Waiver" && f.completedFamilies < f.totalFamilies)
    .reduce((sum, f) => sum + (f.totalFamilies - f.completedFamilies), 0);

  const stats = [
    { label: "Active forms",          value: String(totalForms),       sub: "Spring 2026",                        color: "oklch(0.72 0.18 290)" },
    { label: "Avg completion rate",   value: `${avgCompletion}%`,      sub: "across all active forms",            color: "oklch(0.75 0.12 140)" },
    { label: "Due this week",         value: String(dueSoon),          sub: "forms needing attention",            color: "oklch(0.78 0.16 75)"  },
    { label: "Outstanding signatures",value: String(outstandingSigs),  sub: "waiver & consent forms",             color: "oklch(0.68 0.22 25)"  },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card p-4">
          <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          <div className="text-[12px] font-medium mt-0.5">{s.label}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FormCard                                                                    */
/* -------------------------------------------------------------------------- */

function FormCard({ form }: { form: ActiveForm }) {
  const pct = completionPct(form.completedFamilies, form.totalFamilies);
  const daysLeft = Math.floor((form.dueDateMs - Date.now()) / 86400000);
  const dueColor = urgencyColor(form.dueDateMs);
  const missing = form.totalFamilies - form.completedFamilies;

  function handleReminder() {
    toast.success(`Reminders sent to ${missing} ${missing === 1 ? "family" : "families"}`, {
      description: form.name,
    });
  }

  function handleArchive() {
    toast.success("Form archived", { description: form.name });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-[14px] truncate">{form.name}</span>
            {form.requiresResigning && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "oklch(0.72 0.18 290 / 0.10)", color: "oklch(0.72 0.18 290)" }}>
                Re-signs each season
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={categoryStyle(form.category)}>
              {form.category}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {form.audience}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[12px] font-semibold" style={{ color: dueColor }}>
            {daysLeft <= 0 ? "Overdue" : daysLeft === 1 ? "Due tomorrow" : `${daysLeft} days left`}
          </div>
          <div className="text-[10px] text-muted-foreground">{form.dueDate}</div>
        </div>
      </div>

      {/* Completion progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] text-muted-foreground">
            <span className="font-semibold text-foreground">{form.completedFamilies}</span> of {form.totalFamilies} families complete
          </span>
          <span
            className="text-[12px] font-bold"
            style={{ color: pct === 100 ? "oklch(0.75 0.12 140)" : pct < 80 ? "oklch(0.68 0.22 25)" : "oklch(0.78 0.16 75)" }}
          >
            {pct}%
          </span>
        </div>
        <ProgressBar pct={pct} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          className="flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          onClick={() => toast.info("Viewing responses…")}
        >
          <Eye className="w-3.5 h-3.5" />
          Responses
        </button>
        {missing > 0 && (
          <button
            onClick={handleReminder}
            className="flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded-lg border transition-all"
            style={{ background: "oklch(0.72 0.18 290 / 0.10)", color: "oklch(0.72 0.18 290)", borderColor: "oklch(0.72 0.18 290 / 0.25)" }}
          >
            <Send className="w-3.5 h-3.5" />
            Remind ({missing})
          </button>
        )}
        <button
          className="flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => toast.info("Opening form editor…")}
        >
          <Edit2 className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          className="flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleArchive}
        >
          <Archive className="w-3.5 h-3.5" />
          Archive
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ActiveFormsTab                                                              */
/* -------------------------------------------------------------------------- */

function ActiveFormsTab() {
  const [filterCat, setFilterCat] = useState<FormCategory | "all">("all");

  const needsAttention = ACTIVE_FORMS.filter(
    (f) => completionPct(f.completedFamilies, f.totalFamilies) < 80
  );

  const filtered = ACTIVE_FORMS.filter(
    (f) => filterCat === "all" || f.category === filterCat
  );

  const cats: Array<FormCategory | "all"> = ["all", "Waiver", "Medical", "Consent", "Registration", "Custom"];

  return (
    <div>
      {/* Needs Attention callout */}
      {needsAttention.length > 0 && (
        <div
          className="rounded-xl border p-4 mb-5"
          style={{ borderColor: "oklch(0.78 0.16 75 / 0.30)", background: "oklch(0.78 0.16 75 / 0.05)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" style={{ color: "oklch(0.78 0.16 75)" }} />
            <span className="font-semibold text-[14px]">Needs Attention</span>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "oklch(0.78 0.16 75 / 0.15)", color: "oklch(0.78 0.16 75)" }}
            >
              {needsAttention.length} forms below 80% completion
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {needsAttention.map((f) => {
              const pct = completionPct(f.completedFamilies, f.totalFamilies);
              return (
                <div key={f.id} className="flex items-center justify-between gap-3 bg-background rounded-lg p-3 border border-border">
                  <div className="min-w-0">
                    <div className="font-medium text-[12px] truncate">{f.name}</div>
                    <div className="text-[11px] text-muted-foreground">{f.completedFamilies} / {f.totalFamilies} families · due {f.dueDate}</div>
                  </div>
                  <div
                    className="text-[14px] font-bold shrink-0"
                    style={{ color: pct < 60 ? "oklch(0.68 0.22 25)" : "oklch(0.78 0.16 75)" }}
                  >
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all"
            style={
              filterCat === c
                ? { background: "oklch(0.72 0.18 290 / 0.12)", color: "oklch(0.72 0.18 290)", borderColor: "oklch(0.72 0.18 290 / 0.30)" }
                : { borderColor: "oklch(0.20 0.01 260)", color: "oklch(0.60 0.02 260)" }
            }
          >
            {c === "all" ? "All categories" : c}
          </button>
        ))}
      </div>

      {/* Form cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((f) => <FormCard key={f.id} form={f} />)}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FormBuilderTab                                                              */
/* -------------------------------------------------------------------------- */

function FormBuilderTab() {
  const [formTitle, setFormTitle] = useState("Medical Release & Allergy Form");
  const [fields, setFields] = useState<FormField[]>(SAMPLE_FIELDS);
  const [audience, setAudience] = useState<FormAudience>("All Families");
  const [dueDate, setDueDate] = useState("2026-05-20");
  const [resigning, setResigning] = useState(true);
  const [newFieldType, setNewFieldType] = useState<FieldType>("short-text");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const fieldTypes: FieldType[] = ["short-text", "long-text", "checkbox", "signature", "date", "multiple-choice"];
  const audiences: FormAudience[] = ["All Families", "Players Only", "Parents Only", "17U", "15U"];

  function addField() {
    const newField: FormField = {
      id: `sf${Date.now()}`,
      type: newFieldType,
      label: `New ${fieldTypeLabel(newFieldType)} field`,
      required: false,
    };
    setFields((prev) => [...prev, newField]);
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }

  function updateFieldLabel(id: string, label: string) {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, label } : f));
  }

  function toggleRequired(id: string) {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, required: !f.required } : f));
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setDragOverIdx(idx);
  }

  function handleDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const next = [...fields];
    const [removed] = next.splice(dragIdx, 1);
    next.splice(idx, 0, removed);
    setFields(next);
    setDragIdx(null);
    setDragOverIdx(null);
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      {/* Left: form builder */}
      <div>
        {/* Form title */}
        <div className="mb-4">
          <label className="text-[12px] font-semibold block mb-1.5">Form title</label>
          <Input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Untitled form"
            className="text-[15px] font-semibold h-11"
          />
        </div>

        {/* Fields */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[12px] font-semibold">Fields</label>
            <span className="text-[11px] text-muted-foreground">{fields.length} fields</span>
          </div>

          <div className="space-y-2">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                className="rounded-xl border bg-card p-3 flex items-start gap-2.5 transition-all cursor-grab active:cursor-grabbing"
                style={
                  dragOverIdx === idx && dragIdx !== idx
                    ? { borderColor: "oklch(0.72 0.18 290 / 0.50)", background: "oklch(0.72 0.18 290 / 0.04)" }
                    : {}
                }
              >
                <button className="mt-1 text-muted-foreground/40 hover:text-muted-foreground shrink-0">
                  <GripVertical className="w-4 h-4" />
                </button>

                <div className="shrink-0 mt-0.5 text-muted-foreground">
                  {fieldTypeIcon(field.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <input
                    value={field.label}
                    onChange={(e) => updateFieldLabel(field.id, e.target.value)}
                    className="w-full text-[13px] font-medium bg-transparent border-none outline-none focus:outline-none placeholder:text-muted-foreground/50"
                    placeholder="Field label"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {fieldTypeLabel(field.type)}
                    </span>
                    {field.options && (
                      <span className="text-[10px] text-muted-foreground">
                        {field.options.join(" / ")}
                      </span>
                    )}
                    <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer ml-auto">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={() => toggleRequired(field.id)}
                        className="accent-primary w-3 h-3"
                      />
                      Required
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => removeField(field.id)}
                  className="shrink-0 mt-0.5 text-muted-foreground/40 hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add field */}
          <div className="mt-3 flex gap-2">
            <select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value as FieldType)}
              className="flex-1 text-[12px] bg-background border border-border rounded-lg px-3 py-2 outline-none"
            >
              {fieldTypes.map((t) => (
                <option key={t} value={t}>{fieldTypeLabel(t)}</option>
              ))}
            </select>
            <button
              onClick={addField}
              className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-2 rounded-lg border transition-all"
              style={{ background: "oklch(0.72 0.18 290 / 0.10)", color: "oklch(0.72 0.18 290)", borderColor: "oklch(0.72 0.18 290 / 0.25)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add field
            </button>
          </div>
        </div>
      </div>

      {/* Right: form settings */}
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold text-[13px] mb-3">Form settings</h3>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold block mb-1 text-muted-foreground uppercase tracking-wider">Target audience</label>
              <div className="flex flex-col gap-1">
                {audiences.map((a) => (
                  <label key={a} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={audience === a}
                      onChange={() => setAudience(a)}
                      className="accent-primary"
                    />
                    <span className="text-[12px]">{a}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold block mb-1 text-muted-foreground uppercase tracking-wider">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-[12px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[12px] font-medium">Requires re-signing each season</span>
                <button
                  onClick={() => setResigning((p) => !p)}
                  className="transition-colors"
                  style={{ color: resigning ? "oklch(0.72 0.18 290)" : "oklch(0.55 0.02 260)" }}
                >
                  {resigning ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => toast.success("Draft saved", { description: formTitle })}
            className="w-full flex items-center justify-center gap-2 text-[13px] font-medium py-2.5 rounded-xl border transition-all"
            style={{ background: "oklch(0.72 0.18 290 / 0.10)", color: "oklch(0.72 0.18 290)", borderColor: "oklch(0.72 0.18 290 / 0.25)" }}
          >
            <FileText className="w-4 h-4" />
            Save as draft
          </button>
          <button
            onClick={() => toast.success("Form published", { description: `Sent to ${audience}` })}
            className="w-full flex items-center justify-center gap-2 text-[13px] font-medium py-2.5 rounded-xl text-white transition-all"
            style={{ background: "oklch(0.72 0.18 290)" }}
          >
            <Send className="w-4 h-4" />
            Publish & send
          </button>
        </div>

        {/* Field count summary */}
        <div className="rounded-xl border border-border bg-card p-3 text-[12px] text-muted-foreground">
          <div className="flex justify-between"><span>Total fields</span><span className="font-medium text-foreground">{fields.length}</span></div>
          <div className="flex justify-between mt-1"><span>Required</span><span className="font-medium text-foreground">{fields.filter((f) => f.required).length}</span></div>
          <div className="flex justify-between mt-1"><span>Has signature</span><span className="font-medium text-foreground">{fields.some((f) => f.type === "signature") ? "Yes" : "No"}</span></div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ArchiveTab                                                                  */
/* -------------------------------------------------------------------------- */

function ArchiveTab() {
  const seasons = Array.from(new Set(ARCHIVED_FORMS.map((f) => f.season)));
  const [filterSeason, setFilterSeason] = useState<string>("all");

  const filtered = ARCHIVED_FORMS.filter((f) => filterSeason === "all" || f.season === filterSeason);

  function handleDownload(name: string) {
    toast.success("Download started", { description: name });
  }

  return (
    <div>
      {/* Season filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", ...seasons] as string[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilterSeason(s)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all capitalize"
            style={
              filterSeason === s
                ? { background: "oklch(0.72 0.18 290 / 0.12)", color: "oklch(0.72 0.18 290)", borderColor: "oklch(0.72 0.18 290 / 0.30)" }
                : { borderColor: "oklch(0.20 0.01 260)", color: "oklch(0.60 0.02 260)" }
            }
          >
            {s === "all" ? "All seasons" : s}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Form name</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Category</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Season</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Completion</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Archived</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((f) => {
              const pct = completionPct(f.completedFamilies, f.totalFamilies);
              return (
                <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={categoryStyle(f.category)}>
                      {f.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{f.season}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <span>{pct}%</span>
                      <span className="text-muted-foreground text-[11px]">({f.completedFamilies}/{f.totalFamilies})</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{f.archivedDate}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDownload(f.name)}
                      className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg border border-border"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground mt-3">
        {filtered.length} archived form{filtered.length !== 1 ? "s" : ""} · Responses retained per data retention policy
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FormsManagerPage                                                            */
/* -------------------------------------------------------------------------- */

type TabId = "active" | "builder" | "archive";

export default function FormsManagerPage() {
  const [activeTab, setActiveTab] = useState<TabId>("active");

  const tabs: { id: TabId; label: string }[] = [
    { id: "active",  label: "Active Forms" },
    { id: "builder", label: "Form Builder" },
    { id: "archive", label: "Archive" },
  ];

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <PageHeader
          eyebrow="Admin · Operations"
          title="Forms Manager"
          subtitle="Create, distribute, and track completion of program forms across all families and players."
          actions={
            <Button
              size="sm"
              onClick={() => setActiveTab("builder")}
              className="gap-1.5"
              style={{ background: "oklch(0.72 0.18 290)", color: "white" }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Form
            </Button>
          }
        />

        <StatsBar />

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2.5 text-[13px] font-medium transition-all relative"
              style={
                activeTab === tab.id
                  ? { color: "oklch(0.72 0.18 290)" }
                  : { color: "oklch(0.55 0.02 260)" }
              }
            >
              {tab.label}
              {activeTab === tab.id && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                  style={{ background: "oklch(0.72 0.18 290)" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "active"  && <ActiveFormsTab />}
        {activeTab === "builder" && <FormBuilderTab />}
        {activeTab === "archive" && <ArchiveTab />}
      </div>
    </AppShell>
  );
}
