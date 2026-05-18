import { useState } from "react";
import {
  AlertTriangle, Ban, CheckCircle2, HelpCircle,
  ChevronDown, ChevronUp, RefreshCw, Info,
  SlidersHorizontal, X,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  type PlayerReadiness, type ReadinessStatus,
  MOCK_TEAM_READINESS, REASON_LABELS, statusColor, statusLabel,
} from "@/features/readiness";
import { ReadinessStatusBadge } from "@/features/readiness";

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_ORDER: ReadinessStatus[] = ["RESTRICTED", "FLAGGED", "UNKNOWN", "READY"];

function sortByRisk(a: PlayerReadiness, b: PlayerReadiness) {
  return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
}

const CHECKIN_PCT = Math.round(
  (MOCK_TEAM_READINESS.filter((p) => p.checkinSubmitted).length / MOCK_TEAM_READINESS.length) * 100,
);

// ── Sub-components ─────────────────────────────────────────────────────────

function PlayerInitials({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const parts = name.split(" ");
  const initials = (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
  const dim = size === "sm" ? "w-7 h-7 text-[11px]" : "w-9 h-9 text-[12px]";
  return (
    <div className={`${dim} rounded-full bg-muted border border-border flex items-center justify-center font-bold text-muted-foreground shrink-0`}>
      {initials.toUpperCase()}
    </div>
  );
}

function ConfidenceBar({ confidence }: { confidence: PlayerReadiness["confidence"] }) {
  const levels = ["none", "low", "medium", "high"] as const;
  const idx = levels.indexOf(confidence);
  const colors = ["bg-muted", "bg-[oklch(0.68_0.22_25/0.5)]", "bg-[oklch(0.72_0.17_75/0.7)]", "bg-[oklch(0.75_0.18_150/0.8)]"];
  return (
    <div className="flex items-center gap-0.5" title={`${confidence} confidence`}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-3 rounded-sm ${i <= idx ? colors[idx] : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

interface OverrideDialogProps {
  player: PlayerReadiness | null;
  onClose: () => void;
  onSave: (playerId: string, status: ReadinessStatus, note: string) => void;
}

function OverrideDialog({ player, onClose, onSave }: OverrideDialogProps) {
  const [status, setStatus] = useState<ReadinessStatus>("READY");
  const [note, setNote] = useState("");
  if (!player) return null;
  const STATUSES: ReadinessStatus[] = ["READY", "FLAGGED", "RESTRICTED"];
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Override readiness — {player.playerName}</DialogTitle>
        </DialogHeader>
        <p className="text-[12px] text-muted-foreground mb-3">
          Override lasts 24 hours and replaces automated scoring. Requires a note.
        </p>
        <div className="flex gap-2 mb-3">
          {STATUSES.map((s) => {
            const c = statusColor(s);
            const active = status === s;
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex-1 rounded-lg border py-2 text-[12px] font-semibold transition-all ${active ? "ring-2 ring-offset-1" : "opacity-60 hover:opacity-90"}`}
                style={{
                  color: c.text, background: active ? c.bg : undefined,
                  borderColor: c.border,
                  ...(active ? { ringColor: c.text } : {}),
                }}
              >
                {statusLabel(s)}
              </button>
            );
          })}
        </div>
        <Textarea
          placeholder="Reason for override (required)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="text-[13px] min-h-[80px]"
        />
        <DialogFooter className="mt-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!note.trim()}
            onClick={() => { onSave(player.playerId, status, note); onClose(); }}
          >
            Save override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PlayerRowProps {
  player: PlayerReadiness;
  onOverride: () => void;
  onClearOverride: () => void;
  hasOverride: boolean;
}

function PlayerRow({ player, onOverride, onClearOverride, hasOverride }: PlayerRowProps) {
  const [expanded, setExpanded] = useState(false);
  const c = statusColor(player.status);
  const hasReasons = player.reasons.length > 0 && player.reasons[0] !== "no_data";

  return (
    <div
      className="rounded-xl border border-border bg-card overflow-hidden"
      style={player.status !== "READY" && player.status !== "UNKNOWN" ? { borderColor: c.border } : {}}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => hasReasons && setExpanded((v) => !v)}
      >
        <PlayerInitials name={player.playerName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[14px] truncate">{player.playerName}</span>
            {player.position && (
              <span className="text-[11px] text-muted-foreground font-medium bg-muted rounded px-1.5 py-0.5">
                {player.position}
              </span>
            )}
            {hasOverride && (
              <span className="text-[10px] font-medium text-[oklch(0.65_0.18_290)] bg-[oklch(0.65_0.18_290/0.1)] border border-[oklch(0.65_0.18_290/0.3)] rounded px-1.5 py-0.5">
                Override active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <ConfidenceBar confidence={player.confidence} />
            <span className="text-[11px] text-muted-foreground truncate">{player.summary}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ReadinessStatusBadge status={player.status} confidence={player.confidence} showLabel />
          {!player.checkinSubmitted && (
            <span className="text-[10px] text-muted-foreground">No check-in</span>
          )}
          {hasReasons && (
            <button className="text-muted-foreground hover:text-foreground p-0.5">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {expanded && hasReasons && (
        <div
          className="px-4 pb-3 pt-0 border-t border-border/50"
          style={{ background: `${c.bg}` }}
        >
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 mt-2">
            Flag reasons
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {player.reasons.map((r) => (
              <span
                key={r}
                className="text-[11px] font-medium rounded-full px-2.5 py-0.5 border"
                style={{ color: c.text, background: c.bg, borderColor: c.border }}
              >
                {REASON_LABELS[r]}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-[11px] h-7" onClick={onOverride}>
              <SlidersHorizontal className="w-3 h-3 mr-1" /> Set override
            </Button>
            {hasOverride && (
              <Button size="sm" variant="ghost" className="text-[11px] h-7 text-muted-foreground" onClick={onClearOverride}>
                <X className="w-3 h-3 mr-1" /> Clear override
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Status group header ────────────────────────────────────────────────────

const GROUP_META: Record<ReadinessStatus, { icon: React.ReactNode; label: string; desc: string }> = {
  RESTRICTED: {
    icon: <Ban className="w-4 h-4" />,
    label: "Restricted",
    desc: "Active injury or suspension — do not practice",
  },
  FLAGGED: {
    icon: <AlertTriangle className="w-4 h-4" />,
    label: "Flagged",
    desc: "One or more signals warrant attention",
  },
  UNKNOWN: {
    icon: <HelpCircle className="w-4 h-4" />,
    label: "Unknown",
    desc: "No recent data — treat conservatively",
  },
  READY: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    label: "Ready",
    desc: "All signals clear",
  },
};

// ── Main page ──────────────────────────────────────────────────────────────

export default function TeamReadinessPage() {
  const [players, setPlayers] = useState<PlayerReadiness[]>(
    [...MOCK_TEAM_READINESS].sort(sortByRisk),
  );
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [overrideTarget, setOverrideTarget] = useState<PlayerReadiness | null>(null);
  const [hiddenGroups, setHiddenGroups] = useState<Set<ReadinessStatus>>(
    new Set<ReadinessStatus>(["READY"]),
  );

  const grouped = STATUS_ORDER.reduce(
    (acc, s) => { acc[s] = players.filter((p) => p.status === s); return acc; },
    {} as Record<ReadinessStatus, PlayerReadiness[]>,
  );

  const restricted = grouped.RESTRICTED.length;
  const flagged = grouped.FLAGGED.length;
  const unknown = grouped.UNKNOWN.length;
  const ready = grouped.READY.length;

  function handleSaveOverride(playerId: string, status: ReadinessStatus, note: string) {
    setPlayers((prev) =>
      prev.map((p) =>
        p.playerId === playerId
          ? { ...p, status, confidence: "high" as const, reasons: [], summary: `Coach override: ${note}` }
          : p,
      ).sort(sortByRisk),
    );
    setOverrides((prev) => ({ ...prev, [playerId]: true }));
    toast.success("Override saved — expires in 24 h");
  }

  function handleClearOverride(playerId: string) {
    setOverrides((prev) => { const n = { ...prev }; delete n[playerId]; return n; });
    // Restore original mock status — in prod this would re-fetch
    const original = MOCK_TEAM_READINESS.find((p) => p.playerId === playerId);
    if (original) {
      setPlayers((prev) =>
        prev.map((p) => (p.playerId === playerId ? original : p)).sort(sortByRisk),
      );
    }
    toast.success("Override cleared");
  }

  function toggleGroup(s: ReadinessStatus) {
    setHiddenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  return (
    <AppShell>
      <PageHeader title="Team Readiness" subtitle="Today's practice readiness by player" />

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(
          [
            { label: "Restricted", value: restricted, status: "RESTRICTED" as const },
            { label: "Flagged", value: flagged, status: "FLAGGED" as const },
            { label: "Unknown", value: unknown, status: "UNKNOWN" as const },
            { label: "Ready", value: ready, status: "READY" as const },
          ] as const
        ).map(({ label, value, status }) => {
          const c = statusColor(status);
          return (
            <button
              key={status}
              onClick={() => toggleGroup(status)}
              className="rounded-xl border p-3 text-left transition-opacity hover:opacity-90"
              style={{ borderColor: c.border, background: c.bg }}
            >
              <div className="font-mono text-[28px] font-bold leading-none" style={{ color: c.text }}>
                {value}
              </div>
              <div className="text-[11px] font-semibold mt-1" style={{ color: c.text }}>
                {label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Check-in rate */}
      <div className="flex items-center gap-3 mb-5 rounded-xl border border-border bg-card px-4 py-3">
        <Info className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 text-[13px] text-muted-foreground">
          <span className="font-semibold text-foreground">
            {MOCK_TEAM_READINESS.filter((p) => p.checkinSubmitted).length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground">{MOCK_TEAM_READINESS.length}</span>{" "}
          players submitted morning check-ins today
        </div>
        <div className="text-[12px] font-semibold text-muted-foreground">{CHECKIN_PCT}%</div>
        <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-[oklch(0.65_0.18_290)]"
            style={{ width: `${CHECKIN_PCT}%` }}
          />
        </div>
        <Button size="sm" variant="ghost" className="gap-1 text-[12px] h-7">
          <RefreshCw className="w-3 h-3" /> Refresh
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 mb-5 text-[12px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-2.5 border border-border">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <p>
          Readiness scores are heuristic-based and support — not replace — your coaching judgment.
          Use overrides when you have context the system doesn't.
        </p>
      </div>

      {/* Player groups */}
      <div className="flex flex-col gap-4">
        {STATUS_ORDER.map((status) => {
          const group = grouped[status];
          if (group.length === 0) return null;
          const meta = GROUP_META[status];
          const c = statusColor(status);
          const isHidden = hiddenGroups.has(status);
          return (
            <div key={status}>
              <button
                className="flex items-center gap-2 mb-2 w-full text-left group"
                onClick={() => toggleGroup(status)}
              >
                <span style={{ color: c.text }}>{meta.icon}</span>
                <span className="font-semibold text-[14px]" style={{ color: c.text }}>
                  {meta.label}
                </span>
                <Badge
                  className="text-[10px] h-4 px-1.5 font-mono"
                  style={{ background: c.bg, color: c.text, borderColor: c.border }}
                >
                  {group.length}
                </Badge>
                <span className="text-[12px] text-muted-foreground">{meta.desc}</span>
                <span className="ml-auto text-muted-foreground group-hover:text-foreground">
                  {isHidden ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </span>
              </button>

              {!isHidden && (
                <div className="flex flex-col gap-2">
                  {group.map((player) => (
                    <PlayerRow
                      key={player.playerId}
                      player={player}
                      hasOverride={!!overrides[player.playerId]}
                      onOverride={() => setOverrideTarget(player)}
                      onClearOverride={() => handleClearOverride(player.playerId)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <OverrideDialog
        player={overrideTarget}
        onClose={() => setOverrideTarget(null)}
        onSave={handleSaveOverride}
      />
    </AppShell>
  );
}
