/**
 * SafetyIncidentsPage — admin interface for managing safety incidents.
 *
 * Admins can:
 *   • View incidents filtered by status
 *   • Triage incidents (change status)
 *   • Report new incidents via a structured form
 */

import { useState } from "react";
import { Plus, ShieldCheck, AlertOctagon } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── Types ─────────────────────────────────────────────────────────────────────

type IncidentStatus = "open" | "under_review" | "resolved" | "escalated_external";
type IncidentSeverity = "low" | "medium" | "high" | "critical";

interface SafetyIncident {
  id:             string;
  reporterRole:   string;
  subjectType:    string;
  subjectId:      string | null;
  category:       string;
  severity:       string;
  notes:          string;
  status:         string;
  resolvedBy:     string | null;
  resolutionNote: string | null;
  resolvedAt:     string | null;
  createdAt:      string;
}

interface IncidentForm {
  subjectType: string;
  subjectId:   string;
  category:    string;
  severity:    string;
  notes:       string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<string, string> = {
  critical: "text-red-400 border-red-500/30 bg-red-500/10",
  high:     "text-orange-400 border-orange-500/30 bg-orange-500/10",
  medium:   "text-amber-400 border-amber-500/30 bg-amber-500/10",
  low:      "text-slate-400 border-slate-500/30 bg-slate-500/10",
};

const STATUS_STYLES: Record<string, string> = {
  open:                "text-sky-400 border-sky-500/30 bg-sky-500/10",
  under_review:        "text-violet-400 border-violet-500/30 bg-violet-500/10",
  resolved:            "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  escalated_external:  "text-red-400 border-red-500/30 bg-red-500/10",
};

const STATUS_LABELS: Record<string, string> = {
  open:               "Open",
  under_review:       "Under Review",
  resolved:           "Resolved",
  escalated_external: "Escalated",
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high:     "High",
  medium:   "Medium",
  low:      "Low",
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month:  "short",
      day:    "numeric",
      hour:   "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const DEFAULT_FORM: IncidentForm = {
  subjectType: "",
  subjectId:   "",
  category:    "",
  severity:    "medium",
  notes:       "",
};

// ── Severity badge ────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10.5px] font-medium ${
        SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.low
      }`}
    >
      {SEVERITY_LABELS[severity] ?? formatLabel(severity)}
    </span>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10.5px] font-medium ${
        STATUS_STYLES[status] ?? STATUS_STYLES.open
      }`}
    >
      {STATUS_LABELS[status] ?? formatLabel(status)}
    </span>
  );
}

// ── Incident row ──────────────────────────────────────────────────────────────

interface IncidentRowProps {
  incident: SafetyIncident;
  onTriage: (id: string, status: IncidentStatus) => void;
  triaging: boolean;
}

function IncidentRow({ incident, onTriage, triaging }: IncidentRowProps) {
  return (
    <div className="border border-border rounded-lg p-3 mb-2 bg-card">
      <div className="flex items-start gap-3">
        {/* Left: badges + date */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <SeverityBadge severity={incident.severity} />
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border">
              {formatLabel(incident.category)}
            </span>
            <span className="text-[10.5px] text-muted-foreground">
              {formatDate(incident.createdAt)}
            </span>
            {incident.subjectType && (
              <span className="text-[10.5px] text-muted-foreground">
                · {formatLabel(incident.subjectType)}
                {incident.subjectId && (
                  <span className="font-mono ml-1 text-foreground/50">
                    #{incident.subjectId}
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Notes preview */}
          <p className="text-[12px] text-muted-foreground font-mono leading-relaxed">
            {incident.notes.slice(0, 150)}
            {incident.notes.length > 150 && "…"}
          </p>
        </div>

        {/* Right: status + triage */}
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={incident.status} />

          <Select
            value=""
            onValueChange={(v) => onTriage(incident.id, v as IncidentStatus)}
            disabled={triaging}
          >
            <SelectTrigger className="h-7 w-[120px] text-[11.5px]">
              <span className="text-muted-foreground">Triage…</span>
            </SelectTrigger>
            <SelectContent>
              {incident.status !== "open" && (
                <SelectItem value="open" className="text-[12px]">
                  Mark Open
                </SelectItem>
              )}
              {incident.status !== "under_review" && (
                <SelectItem value="under_review" className="text-[12px]">
                  Under Review
                </SelectItem>
              )}
              {incident.status !== "resolved" && (
                <SelectItem value="resolved" className="text-[12px]">
                  Resolve
                </SelectItem>
              )}
              {incident.status !== "escalated_external" && (
                <SelectItem value="escalated_external" className="text-[12px]">
                  Escalate External
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SafetyIncidentsPage() {
  const [isReporting, setIsReporting]     = useState(false);
  const [statusFilter, setStatusFilter]   = useState("open,under_review");
  const [form, setForm]                   = useState<IncidentForm>(DEFAULT_FORM);

  const queryClient = useQueryClient();

  // ── Queries / mutations ───────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ["safety-incidents", statusFilter],
    queryFn:  () =>
      apiFetch<{ items: SafetyIncident[] }>(
        `/safety/incidents?status=${statusFilter}`
      ),
  });

  const { mutate: triage, isPending: triaging } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: IncidentStatus }) =>
      apiFetch(`/safety/incidents/${id}`, {
        method: "PATCH",
        body:   JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["safety-incidents"] });
      toast.success("Incident updated");
    },
    onError: () => toast.error("Failed to update incident"),
  });

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (body: Omit<IncidentForm, "subjectId"> & { subjectId?: string }) =>
      apiFetch("/safety/incidents", {
        method: "POST",
        body:   JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success("Incident reported");
      queryClient.invalidateQueries({ queryKey: ["safety-incidents"] });
      setIsReporting(false);
      setForm(DEFAULT_FORM);
    },
    onError: () => toast.error("Failed to submit incident"),
  });

  // ── Derived state ─────────────────────────────────────────────────────────

  const items      = data?.items ?? [];
  const canSubmit  =
    form.subjectType.length > 0 &&
    form.category.length > 0 &&
    form.severity.length > 0 &&
    form.notes.trim().length >= 20;

  const handleSubmit = () => {
    create({
      subjectType: form.subjectType,
      ...(form.subjectId ? { subjectId: form.subjectId } : {}),
      category:    form.category,
      severity:    form.severity,
      notes:       form.notes.trim(),
    });
  };

  // ── Form view ─────────────────────────────────────────────────────────────

  if (isReporting) {
    return (
      <AppShell>
        <div className="p-6 max-w-2xl mx-auto space-y-5">
          <Button
            variant="ghost"
            size="sm"
            className="text-[12px] text-muted-foreground -ml-1 mb-1"
            onClick={() => setIsReporting(false)}
          >
            ← Back to incidents
          </Button>

          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Report a Safety Incident
            </h2>
            <p className="text-[12.5px] text-muted-foreground mt-1">
              Use this form to document a safety concern that requires administrator attention.
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            {/* Subject Type */}
            <div className="space-y-1.5">
              <Label className="text-[12px]">
                Subject Type <span className="text-red-400">*</span>
              </Label>
              <Select
                value={form.subjectType}
                onValueChange={(v) => setForm((f) => ({ ...f, subjectType: v }))}
              >
                <SelectTrigger className="text-[12px]">
                  <SelectValue placeholder="Select subject type…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message"          className="text-[12px]">Message</SelectItem>
                  <SelectItem value="thread"           className="text-[12px]">Thread</SelectItem>
                  <SelectItem value="user"             className="text-[12px]">Coach or Staff Member</SelectItem>
                  <SelectItem value="athlete_concern"  className="text-[12px]">Athlete Safety Concern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject ID */}
            <div className="space-y-1.5">
              <Label className="text-[12px]">Subject ID (optional)</Label>
              <Input
                className="text-[12px]"
                placeholder="ID of the specific item, or leave blank if unknown"
                value={form.subjectId}
                onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-[12px]">
                Category <span className="text-red-400">*</span>
              </Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger className="text-[12px]">
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inappropriate_contact" className="text-[12px]">Inappropriate Contact</SelectItem>
                  <SelectItem value="policy_violation"      className="text-[12px]">Policy Violation</SelectItem>
                  <SelectItem value="grooming_concern"      className="text-[12px]">Grooming Concern</SelectItem>
                  <SelectItem value="harassment"            className="text-[12px]">Harassment</SelectItem>
                  <SelectItem value="boundary_violation"    className="text-[12px]">Boundary Violation</SelectItem>
                  <SelectItem value="other"                 className="text-[12px]">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div className="space-y-1.5">
              <Label className="text-[12px]">
                Severity <span className="text-red-400">*</span>
              </Label>
              <Select
                value={form.severity}
                onValueChange={(v) => setForm((f) => ({ ...f, severity: v }))}
              >
                <SelectTrigger className="text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low"      className="text-[12px]">Low</SelectItem>
                  <SelectItem value="medium"   className="text-[12px]">Medium</SelectItem>
                  <SelectItem value="high"     className="text-[12px]">High</SelectItem>
                  <SelectItem value="critical" className="text-[12px]">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-[12px]">
                Notes <span className="text-red-400">*</span>
              </Label>
              <Textarea
                className="text-[12px] resize-none"
                placeholder="Describe the incident in detail — what occurred, when, and who was involved."
                rows={5}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
              <p
                className={`text-[10.5px] ${
                  form.notes.trim().length >= 20
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {form.notes.trim().length} / 20 min
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button
              className="w-full"
              disabled={!canSubmit || creating}
              onClick={handleSubmit}
            >
              {creating ? "Submitting…" : "Submit Incident Report"}
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <PageHeader
        title="Safety Incidents"
        description="Track and triage safety incidents reported within your organization."
      />

      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[200px] text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open,under_review"   className="text-[12px]">Open + Under Review</SelectItem>
              <SelectItem value="open"                className="text-[12px]">Open only</SelectItem>
              <SelectItem value="under_review"        className="text-[12px]">Under Review</SelectItem>
              <SelectItem value="resolved"            className="text-[12px]">Resolved</SelectItem>
              <SelectItem value="escalated_external"  className="text-[12px]">Escalated</SelectItem>
              <SelectItem value="all"                 className="text-[12px]">All</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            className="h-8 text-[12px] gap-1.5"
            onClick={() => setIsReporting(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Report Incident
          </Button>
        </div>

        {/* Incident list */}
        {isLoading ? (
          <div className="text-[12px] text-muted-foreground py-8 text-center">
            Loading incidents…
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <ShieldCheck className="w-8 h-8 text-emerald-400/60" />
            <p className="text-[13px] text-muted-foreground">
              No incidents match this filter.
            </p>
          </div>
        ) : (
          <div>
            {items.map((incident) => (
              <IncidentRow
                key={incident.id}
                incident={incident}
                onTriage={(id, status) => triage({ id, status })}
                triaging={triaging}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
