/**
 * SafetyFlagsPage — admin review queue for rule-based safety flags.
 *
 * Presents flagged messages in a triage table.  Admins can:
 *   • Filter by status (open / escalated / dismissed / all)
 *   • Read the preserved message body snapshot
 *   • See which rules fired and at what severity
 *   • Dismiss or escalate each item
 *
 * This is an intentionally minimal v1 surface — no bulk actions, no full
 * case-management UI, no LLM analysis.  The goal is a first line of admin
 * visibility without building a full trust-and-safety platform.
 */

import { useState } from "react";
import { ShieldAlert, ShieldCheck, ChevronDown, Eye, AlertTriangle, Info } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Badge }  from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── Types (mirrors server response) ──────────────────────────────────────────

type ReviewStatus = "open" | "escalated" | "dismissed";
type FlagSeverity = "low" | "medium" | "high";

interface MatchedRule {
  ruleId:      string;
  category:    string;
  severity:    FlagSeverity;
  matchedText: string;
  description: string;
}

interface SafetyFlag {
  id:                  string;
  orgId:               string;
  messageId:           string | null;
  threadId:            string | null;
  senderId:            string;
  senderRole:          string;
  bodySnapshot:        string;
  matchedRules:        MatchedRule[];
  maxSeverity:         FlagSeverity;
  categories:          string[];
  wasBlocked:          boolean;
  hasMinorRecipients:  boolean;
  threadType:          string | null;
  createdAt:           string;
}

interface ReviewItem {
  id:          string;
  flagId:      string;
  status:      ReviewStatus;
  reviewedBy:  string | null;
  reviewNote:  string | null;
  reviewedAt:  string | null;
  createdAt:   string;
  flag:        SafetyFlag | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<FlagSeverity, { label: string; color: string; icon: React.ElementType }> = {
  high:   { label: "High",   color: "text-red-400 border-red-500/30 bg-red-500/10",    icon: ShieldAlert },
  medium: { label: "Medium", color: "text-amber-400 border-amber-500/30 bg-amber-500/10", icon: AlertTriangle },
  low:    { label: "Low",    color: "text-slate-400 border-slate-500/30 bg-slate-500/10", icon: Info },
};

const STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string }> = {
  open:       { label: "Open",       color: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
  escalated:  { label: "Escalated",  color: "text-red-400 border-red-500/30 bg-red-500/10" },
  dismissed:  { label: "Dismissed",  color: "text-slate-400 border-slate-500/30 bg-slate-500/10" },
};

function formatCategory(cat: string): string {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function truncate(text: string, max = 180): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// ── Severity badge ────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: FlagSeverity }) {
  const cfg = SEVERITY_CONFIG[severity];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10.5px] font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3 shrink-0" />
      {cfg.label}
    </span>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReviewStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10.5px] font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ── Category chip ─────────────────────────────────────────────────────────────

function CategoryChip({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border">
      {formatCategory(category)}
    </span>
  );
}

// ── Review item row ───────────────────────────────────────────────────────────

interface ReviewRowProps {
  item:       ReviewItem;
  onTriage:   (id: string, status: ReviewStatus) => void;
  triaging:   boolean;
}

function ReviewRow({ item, onTriage, triaging }: ReviewRowProps) {
  const [expanded, setExpanded] = useState(false);
  const flag = item.flag;
  if (!flag) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="flex items-start gap-3 p-3 bg-card">
        <div className="mt-0.5 shrink-0">
          <SeverityBadge severity={flag.maxSeverity} />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          {/* Categories */}
          <div className="flex flex-wrap gap-1">
            {flag.categories.map((c) => (
              <CategoryChip key={c} category={c} />
            ))}
            {flag.wasBlocked && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20">
                Blocked
              </span>
            )}
            {flag.hasMinorRecipients && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Minor Thread
              </span>
            )}
          </div>

          {/* Message preview */}
          <p className="text-[12.5px] text-foreground/80 leading-relaxed font-mono bg-muted/30 px-2.5 py-1.5 rounded border border-border">
            "{truncate(flag.bodySnapshot)}"
          </p>

          {/* Meta */}
          <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground">
            <span>Role: <span className="font-medium text-foreground/70">{flag.senderRole}</span></span>
            <span>·</span>
            <span>{formatDate(flag.createdAt)}</span>
            {flag.threadType && (
              <>
                <span>·</span>
                <span>{formatCategory(flag.threadType)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={item.status} />

          {/* Triage actions */}
          {item.status !== "dismissed" && (
            <Select
              value=""
              onValueChange={(v) => onTriage(item.id, v as ReviewStatus)}
              disabled={triaging}
            >
              <SelectTrigger className="h-7 w-[110px] text-[11.5px] gap-1">
                <span className="text-muted-foreground">Triage…</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </SelectTrigger>
              <SelectContent>
                {item.status !== "open"       && <SelectItem value="open"      className="text-[12px]">Mark Open</SelectItem>}
                {item.status !== "escalated"  && <SelectItem value="escalated" className="text-[12px]">Escalate</SelectItem>}
                {item.status !== "dismissed"  && <SelectItem value="dismissed" className="text-[12px]">Dismiss</SelectItem>}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Expanded matched rules */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 p-3 space-y-2">
          <p className="text-[10.5px] uppercase tracking-widest text-muted-foreground font-mono mb-2">
            Matched rules ({flag.matchedRules.length})
          </p>
          {flag.matchedRules.map((rule) => (
            <div key={rule.ruleId} className="flex items-start gap-2 text-[11.5px]">
              <SeverityBadge severity={rule.severity} />
              <div>
                <span className="font-medium text-foreground/80">{rule.ruleId}</span>
                <span className="text-muted-foreground mx-1">·</span>
                <span className="text-muted-foreground">{rule.description}</span>
                <div className="mt-0.5 font-mono text-[10.5px] text-amber-400/80 bg-amber-500/5 px-1.5 py-0.5 rounded inline-block">
                  "{rule.matchedText}"
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SafetyFlagsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("open,escalated");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey:  ["safety-review-queue", statusFilter],
    queryFn:   () => apiFetch<{ items: ReviewItem[] }>(`/safety/review-queue?status=${statusFilter}`),
  });

  const { mutate: triage, isPending: triaging } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReviewStatus }) =>
      apiFetch(`/safety/review-queue/${id}`, {
        method: "PATCH",
        body:   JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["safety-review-queue"] });
      toast.success("Item updated");
    },
    onError: () => toast.error("Failed to update item"),
  });

  const items = data?.items ?? [];

  const openCount     = items.filter((i) => i.status === "open").length;
  const escalatedCount = items.filter((i) => i.status === "escalated").length;

  return (
    <AppShell>
      <PageHeader
        title="Safety Review Queue"
        description="Flagged messages requiring administrator review."
      />

      <div className="p-6 max-w-4xl mx-auto space-y-5">

        {/* Summary bar */}
        <div className="flex items-center gap-3 text-[12px]">
          {escalatedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="font-medium">{escalatedCount} escalated</span>
            </div>
          )}
          {openCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-medium">{openCount} open</span>
            </div>
          )}
          <div className="ml-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[180px] text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open,escalated" className="text-[12px]">Open + Escalated</SelectItem>
                <SelectItem value="open"           className="text-[12px]">Open only</SelectItem>
                <SelectItem value="escalated"      className="text-[12px]">Escalated only</SelectItem>
                <SelectItem value="dismissed"      className="text-[12px]">Dismissed</SelectItem>
                <SelectItem value="all"            className="text-[12px]">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Queue */}
        {isLoading ? (
          <div className="text-[12px] text-muted-foreground py-8 text-center">
            Loading flagged messages…
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <ShieldCheck className="w-8 h-8 text-emerald-400/60" />
            <p className="text-[13px] text-muted-foreground">
              No flagged messages in this view.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <ReviewRow
                key={item.id}
                item={item}
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
