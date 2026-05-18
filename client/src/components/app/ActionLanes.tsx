import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import {
  MOCK_ISSUES, LANE_META, LANE_PRIORITY_ORDER, getTopSeverity,
  type LaneIssue, type LaneId, type DayType, type Severity, type ActionType,
} from "@/features/coach-hq/action-lanes";
import {
  Shield, Activity, Calendar, TrendingUp, Film, Swords, MessageSquare,
  CheckCircle2, X, Zap, MessageCircle, BellOff, ChevronDown, SlidersHorizontal,
  ArrowRight, Clock,
} from "lucide-react";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function relativeDate(iso: string): string {
  const diffMin = Math.floor((new Date("2026-05-17T12:00:00Z").getTime() - new Date(iso).getTime()) / 60_000);
  if (diffMin < 2) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "oklch(0.68 0.22 25)", high: "oklch(0.78 0.16 75)",
  medium: "oklch(0.72 0.18 290)", low: "oklch(0.55 0.02 260)",
};
const SEVERITY_BG: Record<Severity, string> = {
  critical: "oklch(0.68 0.22 25 / 0.12)", high: "oklch(0.78 0.16 75 / 0.12)",
  medium: "oklch(0.72 0.18 290 / 0.12)", low: "oklch(0.55 0.02 260 / 0.10)",
};
const LANE_ICON: Record<LaneId, React.ReactNode> = {
  availability: <Shield size={14} />, readiness: <Activity size={14} />,
  attendance: <Calendar size={14} />, development: <TrendingUp size={14} />,
  film: <Film size={14} />, prep: <Swords size={14} />, comms: <MessageSquare size={14} />,
};
const SOURCE_LABEL: Record<string, string> = {
  health_checkin: "Check-in", wearable: "Wearable", coach: "Coach",
  system: "System", parent: "Parent", film_ai: "AI Film", idp: "IDP",
};
const SEV_ORDER: Severity[] = ["critical", "high", "medium", "low"];
const sortBySev = (arr: LaneIssue[]) =>
  [...arr].sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity));

/* ─── DayTypeBar ──────────────────────────────────────────────────────────── */

const DAY_TABS: { value: DayType; label: string }[] = [
  { value: "practice", label: "Practice Day" }, { value: "game", label: "Game Day" },
  { value: "tournament", label: "Tournament Day" }, { value: "off", label: "Off Day" },
];

function DayTypeBar({ value, onChange }: { value: DayType; onChange: (d: DayType) => void }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 flex items-center gap-2">
      <div className="flex gap-1 flex-wrap flex-1">
        {DAY_TABS.map((tab) => (
          <button key={tab.value} type="button" onClick={() => onChange(tab.value)}
            className="px-3 py-1 rounded-lg text-[12px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={tab.value === value
              ? { background: "oklch(0.72 0.18 290)", color: "#fff" }
              : { color: "oklch(0.55 0.02 260)" }}>
            {tab.label}
          </button>
        ))}
      </div>
      <span className="shrink-0 font-mono uppercase leading-none" style={{ fontSize: "10px", color: "oklch(0.55 0.02 260)" }}>
        Day Mode
      </span>
    </div>
  );
}

/* ─── FilterBar ───────────────────────────────────────────────────────────── */

interface FilterBarProps {
  filterSeverity: Severity | "all"; setFilterSeverity: (v: Severity | "all") => void;
  filterLane: LaneId | "all"; setFilterLane: (v: LaneId | "all") => void;
  filterPosition: string; setFilterPosition: (v: string) => void;
  filterSource: string; setFilterSource: (v: string) => void;
  filterPlayer: string; setFilterPlayer: (v: string) => void;
}

const sel = "rounded-lg border border-border bg-card text-[12px] px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground";

function FilterBar({ filterSeverity, setFilterSeverity, filterLane, setFilterLane,
  filterPosition, setFilterPosition, filterSource, setFilterSource,
  filterPlayer, setFilterPlayer }: FilterBarProps) {
  const players = useMemo(() =>
    Array.from(new Map(MOCK_ISSUES.map((i) => [i.playerId, i.playerName])).entries()), []);
  const hasFilter = [filterSeverity, filterLane, filterPosition, filterSource, filterPlayer].some(v => v !== "all");

  return (
    <div className="flex flex-wrap items-center gap-2 px-1">
      <select className={sel} value={filterSeverity} onChange={e => setFilterSeverity(e.target.value as Severity | "all")}>
        <option value="all">All Severities</option>
        {(["critical","high","medium","low"] as Severity[]).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
      </select>
      <select className={sel} value={filterLane} onChange={e => setFilterLane(e.target.value as LaneId | "all")}>
        <option value="all">All Lanes</option>
        {LANE_META.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
      </select>
      <select className={sel} value={filterPosition} onChange={e => setFilterPosition(e.target.value)}>
        <option value="all">All Positions</option>
        {["PG","SG","SF","PF","C"].map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <select className={sel} value={filterSource} onChange={e => setFilterSource(e.target.value)}>
        <option value="all">All Sources</option>
        {Object.entries(SOURCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <select className={sel} value={filterPlayer} onChange={e => setFilterPlayer(e.target.value)}>
        <option value="all">All Players</option>
        {players.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
      {hasFilter && (
        <button type="button" className="text-[12px] underline" style={{ color: "oklch(0.72 0.18 290)" }}
          onClick={() => { setFilterSeverity("all"); setFilterLane("all"); setFilterPosition("all"); setFilterSource("all"); setFilterPlayer("all"); }}>
          Clear filters
        </button>
      )}
    </div>
  );
}

/* ─── AllClearCard ────────────────────────────────────────────────────────── */

function AllClearCard({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-10 flex flex-col items-center gap-3 text-center">
      <CheckCircle2 size={48} style={{ color: "oklch(0.75 0.12 140)" }} />
      <p className="font-bold text-[16px]">All clear — no issues need attention</p>
      <p className="text-[13px] text-muted-foreground">Next event: Practice · Today · 3:30 PM · Barnegat HS</p>
      <button type="button" onClick={onReset} className="mt-1 text-[12px] px-3 py-1.5 rounded-lg border border-border hover:bg-muted/40 transition-colors">
        Reset all
      </button>
    </div>
  );
}

/* ─── PlayerCard ──────────────────────────────────────────────────────────── */

interface PlayerCardProps {
  playerId: string; playerName: string; position: string; initials: string;
  issues: LaneIssue[]; laneId: LaneId;
  onResolve: (id: string) => void; onSnooze: (id: string) => void;
  onMessage: () => void; onModifyWod: () => void;
  onAssignFilm: () => void; onAddNote: () => void;
}

function PlayerCard({ playerId, playerName, position, initials, issues, laneId,
  onResolve, onSnooze, onMessage, onModifyWod, onAssignFilm, onAddNote }: PlayerCardProps) {
  const sorted = sortBySev(issues);
  const topSeverity = getTopSeverity(issues);
  const topIssue = sorted[0];
  const topColor = SEVERITY_COLOR[topSeverity];
  const lastUpdated = sorted.reduce((l, i) => i.lastUpdated > l.lastUpdated ? i : l).lastUpdated;

  const ghost = "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const primary = "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  function handlePrimary() {
    const a = topIssue.recommendedAction;
    if (a === "resolve") onResolve(topIssue.id);
    else if (a === "snooze") onSnooze(topIssue.id);
    else if (a === "message") onMessage();
    else if (a === "modify_wod") onModifyWod();
    else if (a === "assign_film") onAssignFilm();
    else if (a === "add_note") onAddNote();
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ borderLeft: `3px solid ${topColor}` }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
          style={{ background: "oklch(0.72 0.18 290 / 0.15)", color: "oklch(0.72 0.18 290)" }}>
          {initials}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-[13px] truncate">{playerName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0"
            style={{ background: "oklch(0.55 0.02 260 / 0.1)", color: "oklch(0.55 0.02 260)" }}>
            {position}
          </span>
        </div>
        <div className="flex-1" />
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize"
          style={{ background: SEVERITY_BG[topSeverity], color: topColor }}>
          {topSeverity}
        </span>
        {issues.length > 1 && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
            style={{ background: "oklch(0.55 0.02 260 / 0.08)", color: "oklch(0.55 0.02 260)" }}>
            {issues.length} issues
          </span>
        )}
        <span className="text-[11px] text-muted-foreground shrink-0">{relativeDate(lastUpdated)}</span>
      </div>

      {/* Issue chips */}
      <div className="px-4 pb-2 flex flex-wrap gap-1.5">
        {sorted.map((issue) => (
          <div key={issue.id} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px]"
            style={{ borderColor: SEVERITY_COLOR[issue.severity], background: SEVERITY_BG[issue.severity] }}>
            <span className="font-mono text-[9px] uppercase px-1 py-px rounded"
              style={{ background: SEVERITY_COLOR[issue.severity] + " / 0.15", color: SEVERITY_COLOR[issue.severity] }}>
              {SOURCE_LABEL[issue.source]}
            </span>
            <span style={{ color: SEVERITY_COLOR[issue.severity] }}>{issue.reason}</span>
            <button type="button" onClick={() => onResolve(issue.id)}
              className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity focus:outline-none" aria-label={`Dismiss: ${issue.reason}`}>
              <X size={10} />
            </button>
          </div>
        ))}
      </div>

      {/* Detail */}
      <p className="px-4 pb-2 text-[12px] text-muted-foreground leading-relaxed">{topIssue.detail}</p>

      {/* Action bar */}
      <div className="px-4 py-2.5 bg-muted/30 border-t border-border flex gap-1.5 flex-wrap items-center">
        {topIssue.recommendedAction === "open_idp" ? (
          <Link href={`/app/coach/players/${playerId}/idp`} asChild>
            <a className={primary} style={{ background: "oklch(0.72 0.18 290)" }}>
              <ArrowRight size={12} />{topIssue.recommendedActionLabel}
            </a>
          </Link>
        ) : (
          <button type="button" onClick={handlePrimary} className={primary} style={{ background: "oklch(0.72 0.18 290)" }}>
            {topIssue.recommendedActionLabel}
          </button>
        )}
        <button type="button" onClick={() => sorted.forEach(i => onSnooze(i.id))} className={ghost}>
          <Clock size={11} />Snooze
        </button>
        {(laneId === "comms") && (
          <button type="button" onClick={onMessage} className={ghost}><MessageCircle size={11} />Message</button>
        )}
        {(laneId === "availability" || laneId === "readiness") && (
          <button type="button" onClick={onModifyWod} className={ghost}><Zap size={11} />Modify WOD</button>
        )}
        {laneId === "film" && (
          <button type="button" onClick={onAssignFilm} className={ghost}><Film size={11} />Assign Film</button>
        )}
        {laneId === "development" && (
          <Link href={`/app/coach/players/${playerId}/idp`} asChild>
            <a className={ghost}><ArrowRight size={11} />Open IDP</a>
          </Link>
        )}
        <button type="button" onClick={onAddNote} className={ghost}><MessageSquare size={11} />Add Note</button>
      </div>
    </div>
  );
}

/* ─── SnoozedSection ──────────────────────────────────────────────────────── */

function SnoozedSection({ issues, onUnsnooze }: { issues: LaneIssue[]; onUnsnooze: (id: string) => void }) {
  return (
    <CollapsibleSection title="Snoozed" count={issues.length} defaultOpen={false}
      actionsSlot={<BellOff size={14} className="text-muted-foreground" />}>
      <div className="divide-y divide-border">
        {issues.map((issue) => (
          <div key={issue.id} className="px-4 py-2.5 flex items-center gap-3 text-[12px]">
            <BellOff size={13} className="text-muted-foreground shrink-0" />
            <span className="font-medium">{issue.playerName}</span>
            <span className="text-muted-foreground flex-1 truncate">{issue.reason}</span>
            <button type="button" onClick={() => onUnsnooze(issue.id)}
              className="shrink-0 text-[11px] px-2 py-0.5 rounded border border-border hover:bg-muted/40 transition-colors">
              Un-snooze
            </button>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

/* ─── ActionLanes ─────────────────────────────────────────────────────────── */

export function ActionLanes() {
  const [dayType, setDayType] = useState<DayType>("practice");
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [snoozed, setSnoozed] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [filterLane, setFilterLane] = useState<LaneId | "all">("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterPlayer, setFilterPlayer] = useState<string>("all");

  const activeFilterCount = [filterSeverity, filterLane, filterPosition, filterSource, filterPlayer]
    .filter(v => v !== "all").length;

  const { activeIssues, snoozedIssues, filteredActive, laneOrder, isAllClear } = useMemo(() => {
    const active = MOCK_ISSUES.filter(i => !resolved.has(i.id) && !snoozed.has(i.id));
    const snzd = MOCK_ISSUES.filter(i => snoozed.has(i.id));
    const filtered = active.filter(i =>
      (filterSeverity === "all" || i.severity === filterSeverity) &&
      (filterPosition === "all" || i.position === filterPosition) &&
      (filterLane === "all" || i.laneId === filterLane) &&
      (filterSource === "all" || i.source === filterSource) &&
      (filterPlayer === "all" || i.playerId === filterPlayer)
    );
    return { activeIssues: active, snoozedIssues: snzd, filteredActive: filtered,
      laneOrder: LANE_PRIORITY_ORDER[dayType], isAllClear: active.length === 0 };
  }, [resolved, snoozed, dayType, filterSeverity, filterPosition, filterLane, filterSource, filterPlayer]);

  const handleResolve = (id: string, name: string) => {
    setResolved(p => new Set(Array.from(p).concat(id)));
    toast.success(`Issue resolved for ${name}`);
  };
  const handleSnooze = (id: string, name: string) => {
    setSnoozed(p => new Set(Array.from(p).concat(id)));
    toast.success(`Snoozed for ${name} — reappears in 24h`);
  };
  const handleMessage = (name: string) => toast.success(`Message sent to ${name}`);
  const handleModifyWod = (name: string) => toast.info(`Opening WOD for ${name}`);
  const handleAssignFilm = (name: string) => toast.info(`Film assignment opened for ${name}`);
  const handleAddNote = (name: string) => toast.success(`Note added for ${name}`);

  return (
    <div className="space-y-4">
      <DayTypeBar value={dayType} onChange={setDayType} />

      <div className="space-y-2">
        <button type="button" onClick={() => setShowFilters(s => !s)}
          className="flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <SlidersHorizontal size={13} className="text-muted-foreground" />
          Filters
          {activeFilterCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
              style={{ background: "oklch(0.72 0.18 290 / 0.15)", color: "oklch(0.72 0.18 290)" }}>
              {activeFilterCount}
            </span>
          )}
          <ChevronDown size={12} className="text-muted-foreground transition-transform"
            style={{ transform: showFilters ? "rotate(0deg)" : "rotate(-90deg)" }} />
        </button>
        {showFilters && (
          <FilterBar filterSeverity={filterSeverity} setFilterSeverity={setFilterSeverity}
            filterLane={filterLane} setFilterLane={setFilterLane}
            filterPosition={filterPosition} setFilterPosition={setFilterPosition}
            filterSource={filterSource} setFilterSource={setFilterSource}
            filterPlayer={filterPlayer} setFilterPlayer={setFilterPlayer} />
        )}
      </div>

      {isAllClear ? (
        <AllClearCard onReset={() => { setResolved(new Set()); setSnoozed(new Set()); toast.info("All issues reset"); }} />
      ) : (
        <div className="space-y-3">
          {laneOrder.map((laneId) => {
            const meta = LANE_META.find(l => l.id === laneId)!;
            const laneIssues = filteredActive.filter(i => i.laneId === laneId);
            if (laneIssues.length === 0 && activeFilterCount === 0) return null;
            const playerMap = new Map<string, LaneIssue[]>();
            laneIssues.forEach(i => { playerMap.set(i.playerId, (playerMap.get(i.playerId) ?? []).concat(i)); });
            return (
              <CollapsibleSection key={laneId} title={meta.title} count={playerMap.size}
                defaultOpen={meta.priority[dayType] <= 3}
                actionsSlot={<span className="text-muted-foreground">{LANE_ICON[laneId]}</span>}>
                {laneIssues.length === 0 ? (
                  <div className="px-5 py-4 text-[12px] text-muted-foreground">No issues match your filters</div>
                ) : (
                  <div className="p-3 space-y-2">
                    {Array.from(playerMap.entries()).map(([pid, pIssues]) => {
                      const f = pIssues[0];
                      return (
                        <PlayerCard key={pid} playerId={pid} playerName={f.playerName}
                          position={f.position} initials={f.initials} issues={pIssues} laneId={laneId}
                          onResolve={id => handleResolve(id, f.playerName)}
                          onSnooze={id => handleSnooze(id, f.playerName)}
                          onMessage={() => handleMessage(f.playerName)}
                          onModifyWod={() => handleModifyWod(f.playerName)}
                          onAssignFilm={() => handleAssignFilm(f.playerName)}
                          onAddNote={() => handleAddNote(f.playerName)} />
                      );
                    })}
                  </div>
                )}
              </CollapsibleSection>
            );
          })}
        </div>
      )}

      {snoozedIssues.length > 0 && (
        <SnoozedSection issues={snoozedIssues} onUnsnooze={id => {
          setSnoozed(p => { const n = new Set(Array.from(p)); n.delete(id); return n; });
          toast.success(`Un-snoozed issue for ${MOCK_ISSUES.find(i => i.id === id)?.playerName ?? "player"}`);
        }} />
      )}
    </div>
  );
}

export default ActionLanes;
