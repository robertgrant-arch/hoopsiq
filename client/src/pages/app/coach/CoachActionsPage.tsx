// Coach Actions Dashboard — closed-loop view of all coaching actions across the org.
// Grouped by status (Open → In Progress → Resolved/Dismissed).
// Team-wide actions expand to show a per-athlete response grid.

import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Film,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  RotateCcw,
  ClipboardList,
  Dumbbell,
  Target,
  Calendar,
  TrendingUp,
  Filter,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { apiGet, apiPatch } from "@/lib/api/client";
import { useRoster } from "@/lib/hooks/useRoster";

// ── Types ─────────────────────────────────────────────────────────────────────

type ActionType = "assign_clip" | "recommend_drill" | "add_to_idp" | "add_to_wod" | "request_reupload" | "mark_addressed";
type ActionStatus = "open" | "in_progress" | "resolved" | "dismissed";

interface CoachingAction {
  id:            string;
  orgId:         string;
  sessionId:     string;
  annotationId?: string;
  playerId?:     string | null;
  authorUserId:  string;
  issueCategory?: string;
  issueSeverity?: string;
  timestampMs?:  number;
  coachNote?:    string;
  actionType:    ActionType;
  status:        ActionStatus;
  assignmentId?:      string;
  idpFocusAreaId?:    string;
  followUpSessionId?: string;
  resolvedAt?:   string;
  resolvedNote?: string;
  resolutionScore?: {
    originalCount:  number;
    followUpCount:  number;
    improvement:    number;
    autoResolved:   boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// ── Metadata maps ─────────────────────────────────────────────────────────────

const TYPE_META: Record<ActionType, { label: string; icon: React.ReactNode; dot: string; badge: string }> = {
  assign_clip:      { label: "Clip Assigned",        icon: <Film className="w-3.5 h-3.5" />,         dot: "bg-primary",         badge: "bg-primary/10 text-primary border-primary/30" },
  recommend_drill:  { label: "Drill Prescribed",     icon: <Dumbbell className="w-3.5 h-3.5" />,     dot: "bg-amber-500",       badge: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  add_to_idp:       { label: "Added to IDP",         icon: <Target className="w-3.5 h-3.5" />,       dot: "bg-emerald-500",     badge: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  add_to_wod:       { label: "Added to WOD",         icon: <Calendar className="w-3.5 h-3.5" />,     dot: "bg-orange-500",      badge: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
  request_reupload: { label: "Re-upload Requested",  icon: <RotateCcw className="w-3.5 h-3.5" />,    dot: "bg-violet-500",      badge: "bg-violet-500/15 text-violet-600 border-violet-500/30" },
  mark_addressed:   { label: "Marked Addressed",     icon: <CheckCircle2 className="w-3.5 h-3.5" />, dot: "bg-muted-foreground",badge: "bg-muted text-muted-foreground border-border" },
};

const STATUS_META: Record<ActionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  open:        { label: "Open",        color: "text-primary",        icon: <Clock className="w-3.5 h-3.5" /> },
  in_progress: { label: "In Progress", color: "text-amber-600",      icon: <Clock className="w-3.5 h-3.5" /> },
  resolved:    { label: "Resolved",    color: "text-emerald-600",    icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  dismissed:   { label: "Dismissed",   color: "text-muted-foreground", icon: <XCircle className="w-3.5 h-3.5" /> },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

// ── Resolution Score Badge ────────────────────────────────────────────────────

function ResolutionScoreBadge({ score }: { score: NonNullable<CoachingAction["resolutionScore"]> }) {
  const pct = Math.round(score.improvement * 100);
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2 py-0.5">
      <TrendingUp className="w-3 h-3" />
      AI score: {pct}% improvement · {score.originalCount}→{score.followUpCount} clips
    </div>
  );
}

// ── Group Drill-Down (team-wide per-athlete grid) ─────────────────────────────

function GroupDrillDown({
  action,
  allActions,
}: {
  action: CoachingAction;
  allActions: CoachingAction[];
}) {
  const { roster } = useRoster();

  // Find individual player actions for the same session + category (excluding "team" action itself)
  const related = allActions.filter(
    (a) =>
      a.id !== action.id &&
      a.sessionId === action.sessionId &&
      a.issueCategory?.toLowerCase() === action.issueCategory?.toLowerCase() &&
      a.playerId != null,
  );

  const playersWithResponse = new Set(related.map((a) => a.playerId));

  // Show all non-team roster members
  const players = roster.filter((r) => r.id !== "team");

  if (players.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="text-[10.5px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-2 flex items-center gap-1.5">
        <Users className="w-3 h-3" /> Per-athlete response
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
        {players.map((p) => {
          const res = related.find((a) => a.playerId === p.id);
          const hasResponse = playersWithResponse.has(p.id);
          return (
            <div
              key={p.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md border text-[11.5px] ${
                hasResponse
                  ? "border-emerald-500/30 bg-emerald-500/8"
                  : "border-border bg-muted/20"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${
                  hasResponse ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {p.initials}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">{p.name}</div>
                {res && (
                  <div className={`text-[10px] ${STATUS_META[res.status].color}`}>
                    {STATUS_META[res.status].label}
                  </div>
                )}
                {!hasResponse && (
                  <div className="text-[10px] text-muted-foreground">No action</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Action Card ───────────────────────────────────────────────────────────────

function ActionCard({
  action,
  allActions,
  onDismiss,
}: {
  action: CoachingAction;
  allActions: CoachingAction[];
  onDismiss: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isTeamWide = !action.playerId;
  const tm = TYPE_META[action.actionType];
  const st = STATUS_META[action.status];

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full border font-medium ${tm.badge}`}>
              {tm.icon} {tm.label}
            </span>
            {isTeamWide && (
              <span className="inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 font-medium">
                <Users className="w-3 h-3" /> Team
              </span>
            )}
            {action.issueCategory && (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {action.issueCategory}
                {action.issueSeverity === "major" && (
                  <span className="ml-1 text-rose-500">· Major</span>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground flex-wrap">
            <Film className="w-3 h-3 shrink-0" />
            <Link href={`/app/coach/film/sessions/${action.sessionId}`} asChild>
              <a className="hover:text-foreground transition-colors">Session {action.sessionId}</a>
            </Link>
            {action.timestampMs != null && (
              <span className="font-mono text-primary">
                @ {Math.floor(action.timestampMs / 60000)}:{String(Math.floor((action.timestampMs % 60000) / 1000)).padStart(2, "0")}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className={`flex items-center gap-1 text-[11px] font-semibold ${st.color}`}>
            {st.icon} {st.label}
          </div>
          <span className="text-[10.5px] text-muted-foreground font-mono">{fmtDate(action.createdAt)}</span>
        </div>
      </div>

      {/* Coach note */}
      {action.coachNote && (
        <p className="text-[12.5px] text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3 italic">
          {action.coachNote}
        </p>
      )}

      {/* Resolution score */}
      {action.resolutionScore && (
        <ResolutionScoreBadge score={action.resolutionScore} />
      )}

      {/* Resolved note */}
      {action.resolvedNote && (
        <div className="flex items-start gap-2 rounded-md bg-emerald-500/8 border border-emerald-500/20 px-3 py-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-[12px] text-foreground/80 leading-snug">{action.resolvedNote}</p>
        </div>
      )}

      {/* Team-wide drill-down toggle */}
      {isTeamWide && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground hover:text-foreground transition w-fit"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          Per-athlete responses
        </button>
      )}

      {isTeamWide && expanded && (
        <GroupDrillDown action={action} allActions={allActions} />
      )}

      {/* Footer CTAs */}
      {action.status === "open" && (
        <div className="flex gap-2 pt-1">
          <Link href={`/app/coach/film/sessions/${action.sessionId}`} asChild>
            <a className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-border text-[11.5px] hover:bg-muted transition font-medium">
              <Film className="w-3 h-3" /> Open in Film Room
            </a>
          </Link>
          <button
            onClick={() => onDismiss(action.id)}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-border text-[11.5px] text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

// ── Status Group ──────────────────────────────────────────────────────────────

function StatusGroup({
  status,
  actions,
  allActions,
  onDismiss,
}: {
  status: ActionStatus;
  actions: CoachingAction[];
  allActions: CoachingAction[];
  onDismiss: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(status === "dismissed");
  const st = STATUS_META[status];

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setCollapsed((p) => !p)}
        className="flex items-center gap-2 text-left"
      >
        {collapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        <span className={`font-semibold text-[13px] ${st.color}`}>{st.label}</span>
        <span className="text-[12px] text-muted-foreground">({actions.length})</span>
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-3 pl-6">
          {actions.map((a) => (
            <ActionCard key={a.id} action={a} allActions={allActions} onDismiss={onDismiss} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CoachActionsPage() {
  const [actions, setActions]         = useState<CoachingAction[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filterType, setFilterType]   = useState<ActionType | "all">("all");
  const [filterPlayer, setFilterPlayer] = useState<string>("all");
  const { roster } = useRoster();

  useEffect(() => {
    setLoading(true);
    apiGet<CoachingAction[]>("/coaching-actions/open")
      .then((open) => {
        if (!Array.isArray(open)) return;
        // Also fetch in-progress and resolved for a complete picture
        Promise.all([
          apiGet<CoachingAction[]>("/coaching-actions/open").catch(() => []),
        ]).then(() => {
          setActions(open);
          setLoading(false);
        });
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleDismiss(id: string) {
    try {
      await apiPatch(`/coaching-actions/${id}/dismiss`, {});
      setActions((prev) => prev.map((a) => a.id === id ? { ...a, status: "dismissed" } : a));
    } catch {
      // silent
    }
  }

  const filtered = actions.filter((a) => {
    if (filterType !== "all" && a.actionType !== filterType) return false;
    if (filterPlayer !== "all" && a.playerId !== filterPlayer && !(filterPlayer === "team" && !a.playerId)) return false;
    return true;
  });

  const byStatus = (s: ActionStatus) => filtered.filter((a) => a.status === s);

  const openCount      = actions.filter((a) => a.status === "open").length;
  const inProgCount    = actions.filter((a) => a.status === "in_progress").length;
  const resolvedCount  = actions.filter((a) => a.status === "resolved").length;

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1100px] mx-auto flex flex-col gap-8">
        <PageHeader
          eyebrow="Film · Coaching Actions"
          title="Action Dashboard"
          subtitle="Track every coaching action from clip to resolution."
        />

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Open",        value: openCount,     color: "text-primary",     bg: "bg-primary/8" },
            { label: "In Progress", value: inProgCount,   color: "text-amber-600",   bg: "bg-amber-500/8" },
            { label: "Resolved",    value: resolvedCount, color: "text-emerald-600", bg: "bg-emerald-500/8" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border border-border p-4 ${s.bg}`}>
              <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-1">
                {s.label}
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ActionType | "all")}
            className="h-8 px-2 rounded-md border border-border bg-background text-[12px] text-foreground"
          >
            <option value="all">All types</option>
            {(Object.keys(TYPE_META) as ActionType[]).map((t) => (
              <option key={t} value={t}>{TYPE_META[t].label}</option>
            ))}
          </select>

          {/* Player filter */}
          <select
            value={filterPlayer}
            onChange={(e) => setFilterPlayer(e.target.value)}
            className="h-8 px-2 rounded-md border border-border bg-background text-[12px] text-foreground"
          >
            <option value="all">All athletes</option>
            <option value="team">Team-wide</option>
            {roster.filter((r) => r.id !== "team").map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          {(filterType !== "all" || filterPlayer !== "all") && (
            <button
              onClick={() => { setFilterType("all"); setFilterPlayer("all"); }}
              className="text-[11.5px] text-muted-foreground hover:text-foreground transition"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Action groups */}
        {loading ? (
          <div className="text-center text-muted-foreground text-[13px] py-12">Loading actions…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground text-[13px]">
            No coaching actions found.
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {(["open", "in_progress", "resolved", "dismissed"] as ActionStatus[]).map((s) => (
              <StatusGroup
                key={s}
                status={s}
                actions={byStatus(s)}
                allActions={actions}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
