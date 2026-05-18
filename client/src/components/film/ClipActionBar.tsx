// ClipActionBar — inline Film-to-Action controls
//
// Design constraint: NO modal stacks. Every action expands inline as a compact
// form (≤3 fields) that collapses on submit. This keeps the queue view fast.
//
// Usage:
//   <ClipActionBar
//     clipId="c1"           — annotation / clip id
//     sessionId="s1"
//     playerId="p1"         — pre-fills player; omit for team clips
//     playerName="Marcus Davis"
//     timestamp="1:23"
//     issueCategory="Finishing"
//     issueSeverity="major"
//     onActionCreated={() => refetch()}
//   />

import { useState, useEffect } from "react";
import {
  ClipboardList,
  Dumbbell,
  Target,
  Flame,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  X,
  Send,
  Check,
  BookmarkPlus,
  BookOpen,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiPost, apiGet } from "@/lib/api/client";
import { useDrillTemplateStore } from "@/lib/drillTemplateStore";
import { useRosterForFilm } from "@/lib/api/hooks/useRoster";

// ── Types ────────────────────────────────────────────────────────────────────

type ActionType =
  | "assign_clip"
  | "recommend_drill"
  | "add_to_idp"
  | "add_to_wod"
  | "request_reupload"
  | "mark_addressed";

export interface ClipActionBarProps {
  clipId?:        string;
  sessionId:      string;
  playerId?:      string | null;
  playerName?:    string;
  timestamp?:     string;
  issueCategory?: string;
  issueSeverity?: string;
  /** Called after any action is successfully created */
  onActionCreated?: (actionType: ActionType) => void;
  /** Compact single-row layout for the queue detail list */
  compact?: boolean;
}

// ── Action meta ───────────────────────────────────────────────────────────────

const ACTION_META: Record<ActionType, { label: string; icon: React.ReactNode; color: string }> = {
  assign_clip: {
    label: "Assign Clip",
    icon:  <ClipboardList className="w-3.5 h-3.5" />,
    color: "text-primary hover:bg-primary/10",
  },
  recommend_drill: {
    label: "Recommend Drill",
    icon:  <Dumbbell className="w-3.5 h-3.5" />,
    color: "text-amber-500 hover:bg-amber-500/10",
  },
  add_to_idp: {
    label: "Add to IDP",
    icon:  <Target className="w-3.5 h-3.5" />,
    color: "text-emerald-500 hover:bg-emerald-500/10",
  },
  add_to_wod: {
    label: "Add to WOD",
    icon:  <Flame className="w-3.5 h-3.5" />,
    color: "text-orange-500 hover:bg-orange-500/10",
  },
  request_reupload: {
    label: "Request Re-upload",
    icon:  <RotateCcw className="w-3.5 h-3.5" />,
    color: "text-violet-500 hover:bg-violet-500/10",
  },
  mark_addressed: {
    label: "Mark Addressed",
    icon:  <CheckCircle2 className="w-3.5 h-3.5" />,
    color: "text-muted-foreground hover:bg-muted",
  },
};

// ── Roster helpers ────────────────────────────────────────────────────────────
import type { RosterEntry } from "@/lib/api/hooks/useRoster";

function rosterLabel(p: RosterEntry) {
  return p.position ? `${p.name} · ${p.position}` : p.name;
}

// When "team" is selected by the coach, we send playerId: null to the API
function apiPlayerId(pid: string): string | null {
  return pid === "team" ? null : pid;
}

function playerDisplayName(pid: string, roster: RosterEntry[]): string {
  if (pid === "team") return "the full team";
  return roster.find((p) => p.id === pid)?.name ?? "athlete";
}

// ── Sub-forms ─────────────────────────────────────────────────────────────────

function AssignClipForm({
  playerId,
  roster,
  onSubmit,
  onCancel,
}: {
  playerId?: string | null;
  roster: RosterEntry[];
  onSubmit: (data: { playerId: string; dueDate: string; note: string }) => void;
  onCancel: () => void;
}) {
  const [pid,  setPid]  = useState(playerId ?? "");
  const [due,  setDue]  = useState("");
  const [note, setNote] = useState("");

  return (
    <div className="flex flex-col gap-2.5 pt-2.5 border-t border-border mt-2">
      <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-primary">
        Assign Film Clip
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <div className="text-[10px] text-muted-foreground mb-1">Athlete</div>
          <select
            value={pid}
            onChange={(e) => setPid(e.target.value)}
            className="w-full h-8 px-2 text-[12px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select…</option>
            {roster.map((p) => (
              <option key={p.id} value={p.id}>{rosterLabel(p)}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <div className="text-[10px] text-muted-foreground mb-1">Due date</div>
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="w-full h-8 px-2 text-[12px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
      </div>
      <label className="block">
        <div className="text-[10px] text-muted-foreground mb-1">Coaching point (optional)</div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What should the athlete focus on when reviewing this?"
          className="w-full h-8 px-2.5 text-[12px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs flex-1"
          disabled={!pid}
          onClick={() => onSubmit({ playerId: pid, dueDate: due, note })}>
          <Send className="w-3 h-3 mr-1" /> Create Assignment
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function RecommendDrillForm({
  issueCategory,
  playerId,
  roster,
  onSubmit,
  onCancel,
}: {
  issueCategory?: string;
  playerId?: string | null;
  roster: RosterEntry[];
  onSubmit: (data: { drillName: string; playerId: string; reps: string }) => void;
  onCancel: () => void;
}) {
  const [drill,         setDrill]         = useState("");
  const [pid,           setPid]           = useState(playerId ?? "");
  const [reps,          setReps]          = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [tplName,       setTplName]       = useState("");
  const [savingTpl,     setSavingTpl]     = useState(false);

  const { templates, save: saveTemplate, remove: removeTemplate } = useDrillTemplateStore();

  const SUGGESTIONS: Record<string, string[]> = {
    Finishing:       ["Mikan Drill", "Euro Step Series", "Contact Layup (left hand)"],
    Balance:         ["Balance Board Jumpers", "1-2 Step Form Shooting"],
    Release:         ["Form Shooting (index only)", "Wall Shooting"],
    Footwork:        ["Lateral Shuffle Drill", "Defensive Slide Series"],
    Defense:         ["Close-out Drill", "Shell Drill", "Help-side Rotations"],
    Posture:         ["Pound Dribble Stance Drill", "Low Stance Slides"],
    "Change of Pace":["Hesitation Dribble Series", "Speed-to-Slow Reps"],
    Stance:          ["Active Hands Drill", "Mirror Drill"],
    default:         ["Skill work drill"],
  };
  const suggestions = SUGGESTIONS[issueCategory ?? ""] ?? SUGGESTIONS.default;

  function handleSaveTemplate() {
    if (!drill || !tplName.trim()) return;
    saveTemplate({ name: tplName.trim(), drillName: drill, reps, issueCategory });
    setSavingTpl(false);
    setTplName("");
    toast.success(`Template "${tplName.trim()}" saved`);
  }

  return (
    <div className="flex flex-col gap-2.5 pt-2.5 border-t border-border mt-2">
      <div className="flex items-center justify-between">
        <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-amber-500">
          Recommend Drill
        </div>
        <div className="flex gap-1">
          {templates.length > 0 && (
            <button
              onClick={() => { setShowTemplates((s) => !s); setSavingTpl(false); }}
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border transition"
            >
              <BookOpen className="w-2.5 h-2.5" /> Templates
            </button>
          )}
          <button
            onClick={() => { setSavingTpl((s) => !s); setShowTemplates(false); }}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border transition"
          >
            <BookmarkPlus className="w-2.5 h-2.5" /> Save
          </button>
        </div>
      </div>

      {/* Load template picker */}
      {showTemplates && templates.length > 0 && (
        <div className="flex flex-col gap-1 p-2 rounded-md border border-border bg-muted/30">
          <div className="text-[10px] text-muted-foreground mb-0.5">Saved templates</div>
          {templates.map((t) => (
            <div key={t.id} className="flex items-center gap-2 group">
              <button
                onClick={() => { setDrill(t.drillName); setReps(t.reps); setShowTemplates(false); }}
                className="flex-1 text-left text-[11px] hover:text-primary truncate"
              >
                {t.name}
                <span className="text-muted-foreground ml-1.5">{t.drillName}</span>
              </button>
              <button
                onClick={() => removeTemplate(t.id)}
                className="opacity-0 group-hover:opacity-100 text-destructive transition"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save-as-template row */}
      {savingTpl && (
        <div className="flex gap-2 items-center p-2 rounded-md border border-amber-500/20 bg-amber-500/5">
          <input
            autoFocus
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
            placeholder="Template name (e.g. Post footwork fix)…"
            className="flex-1 h-7 px-2 text-[11px] rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-600 hover:bg-amber-500/10 px-2"
            disabled={!drill || !tplName.trim()}
            onClick={handleSaveTemplate}>
            Save
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSavingTpl(false)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => setDrill(s)}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition ${
              drill === s
                ? "bg-amber-500/15 border-amber-500/50 text-amber-600"
                : "border-border text-muted-foreground hover:border-amber-500/40"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <div className="text-[10px] text-muted-foreground mb-1">Drill name</div>
          <input
            value={drill}
            onChange={(e) => setDrill(e.target.value)}
            placeholder="Or type custom…"
            className="w-full h-8 px-2.5 text-[12px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="block">
          <div className="text-[10px] text-muted-foreground mb-1">Athlete</div>
          <select
            value={pid}
            onChange={(e) => setPid(e.target.value)}
            className="w-full h-8 px-2 text-[12px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select…</option>
            {roster.map((p) => (
              <option key={p.id} value={p.id}>{rosterLabel(p)}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <div className="text-[10px] text-muted-foreground mb-1">Reps / sets</div>
        <input
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="e.g. 5 sets of 10, daily"
          className="w-full h-8 px-2.5 text-[12px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs flex-1 bg-amber-500 hover:bg-amber-600 text-white"
          disabled={!drill || !pid}
          onClick={() => onSubmit({ drillName: drill, playerId: pid, reps })}>
          <Dumbbell className="w-3 h-3 mr-1" /> Add to Plan
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function AddToIdpForm({
  playerId,
  issueCategory,
  roster,
  onSubmit,
  onCancel,
}: {
  playerId?: string | null;
  issueCategory?: string;
  roster: RosterEntry[];
  onSubmit: (data: { playerId: string; subSkill: string; note: string }) => void;
  onCancel: () => void;
}) {
  const [pid,      setPid]      = useState(playerId ?? "");
  const [subSkill, setSubSkill] = useState(issueCategory ?? "");
  const [note,     setNote]     = useState("");

  return (
    <div className="flex flex-col gap-2.5 pt-2.5 border-t border-border mt-2">
      <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-emerald-600">
        Add to Development Plan
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <div className="text-[10px] text-muted-foreground mb-1">Athlete</div>
          <select
            value={pid}
            onChange={(e) => setPid(e.target.value)}
            className="w-full h-8 px-2 text-[12px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select…</option>
            {roster.map((p) => (
              <option key={p.id} value={p.id}>{rosterLabel(p)}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <div className="text-[10px] text-muted-foreground mb-1">Skill area</div>
          <input
            value={subSkill}
            onChange={(e) => setSubSkill(e.target.value)}
            placeholder="e.g. Contact Layup"
            className="w-full h-8 px-2.5 text-[12px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
      </div>
      <label className="block">
        <div className="text-[10px] text-muted-foreground mb-1">Coach note (shown to athlete)</div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Context for this development focus…"
          className="w-full h-8 px-2.5 text-[12px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={!pid || !subSkill}
          onClick={() => onSubmit({ playerId: pid, subSkill, note })}>
          <Target className="w-3 h-3 mr-1" /> Link to IDP
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

type PracticeEvent = { id: string; title: string; startsAt: string };

function AddToWodForm({
  playerId,
  issueCategory,
  roster,
  onSubmit,
  onCancel,
}: {
  playerId?: string | null;
  issueCategory?: string;
  roster: RosterEntry[];
  onSubmit: (data: { playerId: string; drillName: string; wodDate: string }) => void;
  onCancel: () => void;
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const [pid,       setPid]       = useState(playerId ?? "team");
  const [drillName, setDrillName] = useState(issueCategory ? `${issueCategory} work` : "");
  const [wodDate,   setWodDate]   = useState(tomorrowStr);
  const [events,    setEvents]    = useState<PracticeEvent[]>([]);

  // Fetch upcoming practice events to populate the date picker options
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    apiGet<PracticeEvent[]>(`/events?from=${today}`)
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          setEvents(items.slice(0, 5)); // show next 5
          // Pre-select the nearest one
          const nearest = items[0];
          if (nearest?.startsAt) setWodDate(nearest.startsAt.split("T")[0]);
        }
      })
      .catch(() => { /* keep manual date entry */ });
  }, []);

  return (
    <div className="flex flex-col gap-2.5 pt-2.5 border-t border-border mt-2">
      <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-orange-500">
        Add to WOD
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <div className="text-[10px] text-muted-foreground mb-1">Athlete / Team</div>
          <select
            value={pid}
            onChange={(e) => setPid(e.target.value)}
            className="w-full h-8 px-2 text-[12px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select…</option>
            {roster.map((p) => (
              <option key={p.id} value={p.id}>{rosterLabel(p)}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <div className="text-[10px] text-muted-foreground mb-1">
            {events.length > 0 ? "Practice session" : "WOD date"}
          </div>
          {events.length > 0 ? (
            <select
              value={wodDate}
              onChange={(e) => setWodDate(e.target.value)}
              className="w-full h-8 px-2 text-[12px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {events.map((ev) => {
                const d = ev.startsAt.split("T")[0];
                return (
                  <option key={ev.id} value={d}>
                    {ev.title} · {d}
                  </option>
                );
              })}
              <option value={tomorrowStr}>Custom date…</option>
            </select>
          ) : (
            <input
              type="date"
              value={wodDate}
              onChange={(e) => setWodDate(e.target.value)}
              className="w-full h-8 px-2 text-[12px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
        </label>
      </div>
      <label className="block">
        <div className="text-[10px] text-muted-foreground mb-1">Drill / exercise</div>
        <input
          value={drillName}
          onChange={(e) => setDrillName(e.target.value)}
          placeholder="e.g. Mikan Drill, 5×10"
          className="w-full h-8 px-2.5 text-[12px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          disabled={!pid || !drillName.trim()}
          onClick={() => onSubmit({ playerId: pid, drillName, wodDate })}>
          <Flame className="w-3 h-3 mr-1" /> Add to WOD
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function RequestReuploadForm({
  playerId,
  roster,
  onSubmit,
  onCancel,
}: {
  playerId?: string | null;
  roster: RosterEntry[];
  onSubmit: (data: { playerId: string; message: string }) => void;
  onCancel: () => void;
}) {
  const [pid,     setPid]     = useState(playerId ?? "");
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-col gap-2.5 pt-2.5 border-t border-border mt-2">
      <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-violet-600">
        Request Next Rep
      </div>
      <label className="block">
        <div className="text-[10px] text-muted-foreground mb-1">Athlete</div>
        <select
          value={pid}
          onChange={(e) => setPid(e.target.value)}
          className="w-full h-8 px-2 text-[12px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Select…</option>
          {roster.filter((p) => p.id !== "team").map((p) => (
            <option key={p.id} value={p.id}>{rosterLabel(p)}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <div className="text-[10px] text-muted-foreground mb-1">Message to athlete</div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="Record this move again focusing on… Upload within 48h."
          className="w-full px-2.5 py-1.5 text-[12px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </label>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs flex-1 bg-violet-600 hover:bg-violet-700 text-white"
          disabled={!pid || !message.trim()}
          onClick={() => onSubmit({ playerId: pid, message })}>
          <Send className="w-3 h-3 mr-1" /> Send Request
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ClipActionBar({
  clipId,
  sessionId,
  playerId,
  playerName,
  timestamp,
  issueCategory,
  issueSeverity,
  onActionCreated,
  compact = false,
}: ClipActionBarProps) {
  const [openAction,   setOpenAction]   = useState<ActionType | null>(null);
  const [takenActions, setTakenActions] = useState<Set<ActionType>>(new Set());
  const { roster } = useRosterForFilm();

  function toggleAction(type: ActionType) {
    if (type === "mark_addressed") {
      handleMarkAddressed();
      return;
    }
    setOpenAction((prev) => (prev === type ? null : type));
  }

  function addTaken(type: ActionType) {
    setTakenActions((prev) => new Set(Array.from(prev).concat(type)));
  }

  // Shared body fields for every coaching-action POST
  function basePayload(actionType: ActionType, extra: Record<string, unknown> = {}) {
    return {
      sessionId,
      annotationId:  clipId,
      issueCategory,
      issueSeverity,
      actionType,
      ...extra,
    };
  }

  async function handleMarkAddressed() {
    addTaken("mark_addressed");
    try {
      await apiPost("/coaching-actions", basePayload("mark_addressed", { playerId: playerId ?? null }));
    } catch { /* demo mode — silent */ }
    toast.success("Marked as addressed — loop closed.");
    onActionCreated?.("mark_addressed");
  }

  async function handleAssignClip(data: { playerId: string; dueDate: string; note: string }) {
    addTaken("assign_clip");
    setOpenAction(null);
    try {
      await apiPost("/coaching-actions", basePayload("assign_clip", {
        playerId: apiPlayerId(data.playerId),
        coachNote: data.note || undefined,
      }));
    } catch { /* demo mode — silent */ }
    toast.success(`Film clip assigned to ${playerDisplayName(data.playerId, roster)}`);
    onActionCreated?.("assign_clip");
  }

  async function handleRecommendDrill(data: { drillName: string; playerId: string; reps: string }) {
    addTaken("recommend_drill");
    setOpenAction(null);
    try {
      await apiPost("/coaching-actions", basePayload("recommend_drill", {
        playerId: apiPlayerId(data.playerId),
        coachNote: [data.drillName, data.reps].filter(Boolean).join(" — ") || undefined,
      }));
    } catch { /* demo mode — silent */ }
    toast.success(`"${data.drillName}" added to ${playerDisplayName(data.playerId, roster)}'s plan`);
    onActionCreated?.("recommend_drill");
  }

  async function handleAddToIdp(data: { playerId: string; subSkill: string; note: string }) {
    addTaken("add_to_idp");
    setOpenAction(null);
    try {
      await apiPost("/coaching-actions", basePayload("add_to_idp", {
        playerId: apiPlayerId(data.playerId),
        coachNote: data.note || undefined,
      }));
    } catch { /* demo mode — silent */ }
    toast.success(`"${data.subSkill}" linked to ${playerDisplayName(data.playerId, roster)}'s development plan`);
    onActionCreated?.("add_to_idp");
  }

  async function handleAddToWod(data: { playerId: string; drillName: string; wodDate: string }) {
    addTaken("add_to_wod");
    setOpenAction(null);
    try {
      await apiPost("/coaching-actions", basePayload("add_to_wod", {
        playerId: apiPlayerId(data.playerId),
        coachNote: `${data.drillName} — WOD ${data.wodDate}`,
      }));
    } catch { /* demo mode — silent */ }
    toast.success(`"${data.drillName}" added to ${playerDisplayName(data.playerId, roster)}'s WOD (${data.wodDate})`);
    onActionCreated?.("add_to_wod");
  }

  async function handleRequestReupload(data: { playerId: string; message: string }) {
    addTaken("request_reupload");
    setOpenAction(null);
    try {
      await apiPost("/coaching-actions", basePayload("request_reupload", {
        playerId: apiPlayerId(data.playerId),
        coachNote: data.message,
      }));
    } catch { /* demo mode — silent */ }
    toast.success(`Re-upload request sent to ${playerDisplayName(data.playerId, roster)}`);
    onActionCreated?.("request_reupload");
  }

  const isAddressed = takenActions.has("mark_addressed");
  const ACTION_ORDER: ActionType[] = [
    "assign_clip", "recommend_drill", "add_to_idp", "add_to_wod", "request_reupload", "mark_addressed",
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* Action buttons row */}
      <div className={`flex items-center gap-1 flex-wrap ${compact ? "" : "pt-2"}`}>
        {ACTION_ORDER.map((type) => {
          const meta   = ACTION_META[type];
          const active = openAction === type;
          const taken  = takenActions.has(type);

          if (isAddressed && type !== "mark_addressed") return null;

          return (
            <button
              key={type}
              onClick={() => toggleAction(type)}
              disabled={isAddressed && type !== "mark_addressed"}
              className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-md text-[11px] font-medium border transition-all ${
                taken
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 cursor-default"
                  : active
                  ? "bg-muted border-primary/40 text-foreground"
                  : `border-border ${meta.color}`
              }`}
            >
              {taken ? <Check className="w-3 h-3" /> : meta.icon}
              {compact ? null : meta.label}
              {!taken && !compact && type !== "mark_addressed" && (
                <ChevronDown className={`w-2.5 h-2.5 transition-transform ${active ? "rotate-180" : ""}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Inline expanded forms */}
      {openAction === "assign_clip" && !isAddressed && (
        <AssignClipForm
          playerId={playerId}
          roster={roster}
          onSubmit={handleAssignClip}
          onCancel={() => setOpenAction(null)}
        />
      )}
      {openAction === "recommend_drill" && !isAddressed && (
        <RecommendDrillForm
          issueCategory={issueCategory}
          playerId={playerId}
          roster={roster}
          onSubmit={handleRecommendDrill}
          onCancel={() => setOpenAction(null)}
        />
      )}
      {openAction === "add_to_idp" && !isAddressed && (
        <AddToIdpForm
          playerId={playerId}
          issueCategory={issueCategory}
          roster={roster}
          onSubmit={handleAddToIdp}
          onCancel={() => setOpenAction(null)}
        />
      )}
      {openAction === "add_to_wod" && !isAddressed && (
        <AddToWodForm
          playerId={playerId}
          issueCategory={issueCategory}
          roster={roster}
          onSubmit={handleAddToWod}
          onCancel={() => setOpenAction(null)}
        />
      )}
      {openAction === "request_reupload" && !isAddressed && (
        <RequestReuploadForm
          playerId={playerId}
          roster={roster}
          onSubmit={handleRequestReupload}
          onCancel={() => setOpenAction(null)}
        />
      )}
    </div>
  );
}
