/**
 * PlaybookStudio — Coach HQ
 *
 * Faithful build of the Whiteboard / Playbook Studio described in Prompt 14:
 *   • multi-phase plays (ENTRY → TRIGGER → READS → COUNTER → SAFETY)
 *   • tool palette (V/T/P/D/C/S)
 *   • formation library (Horns, 5-out, 4-out 1-in, Box, 1-3-1)
 *   • token + path editing on Konva canvas
 *   • per-phase coach notes
 *   • animation playback across phases
 *   • play list (LHS) with thumbnails
 *   • metadata + version history (RHS)
 *   • presentation mode (full-screen review)
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ChevronRight,
  Copy,
  MousePointer2,
  Play as PlayIcon,
  Pause,
  Plus,
  RotateCcw,
  Save,
  Maximize2,
  X,
  Trash2,
  History,
  ArrowRight,
  Move,
  Slash,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  formations,
  getQuizzesForPlay,
  type PhaseLabel,
  type Play,
  type PlayPhase,
} from "@/features/playbook/mock";
import type {
  CutStyle,
  EditorMode,
  PassType,
  Role,
} from "@/features/playbook/schema";
import { actionForPathId, describeAction } from "@/features/playbook/actions";
import { usePlaybook } from "@/features/playbook/store";
import PlayCanvas from "@/features/playbook/PlayCanvas";
import { PlayThumbnail } from "@/components/court/PlayThumbnail";
import { usePlayback } from "@/features/playbook/usePlayback";

const PHASE_LABELS: { key: PhaseLabel; label: string; color: string }[] = [
  { key: "ENTRY", label: "Entry", color: "oklch(0.7 0.13 200)" },
  { key: "TRIGGER", label: "Trigger", color: "oklch(0.78 0.16 75)" },
  { key: "READ_1", label: "Read 1", color: "oklch(0.75 0.16 30)" },
  { key: "READ_2", label: "Read 2", color: "oklch(0.7 0.18 25)" },
  { key: "COUNTER", label: "Counter", color: "oklch(0.7 0.16 320)" },
  { key: "SAFETY", label: "Safety", color: "oklch(0.7 0.13 140)" },
];

type ToolDef = {
  key: EditorMode;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
  group: "select" | "token" | "path";
};

const TOOLS: ToolDef[] = [
  { key: "SELECT", label: "Select", shortcut: "V", icon: <MousePointer2 className="w-4 h-4" />, group: "select" },
  { key: "ADD_OFFENSE", label: "Offense", shortcut: "O", icon: <span className="font-mono font-bold text-[12px]">O</span>, group: "token" },
  { key: "ADD_DEFENSE", label: "Defense", shortcut: "X", icon: <span className="font-mono font-bold text-[12px]">X</span>, group: "token" },
  { key: "ADD_BALL", label: "Ball", shortcut: "B", icon: <span className="text-[14px]">●</span>, group: "token" },
  { key: "ADD_CONE", label: "Cone", shortcut: "K", icon: <span className="text-[14px]">▲</span>, group: "token" },
  { key: "DRAW_PASS", label: "Pass", shortcut: "P", icon: <Slash className="w-4 h-4 -rotate-12" />, group: "path" },
  { key: "DRAW_DRIBBLE", label: "Dribble", shortcut: "D", icon: <ArrowRight className="w-4 h-4" />, group: "path" },
  { key: "DRAW_CUT", label: "Cut", shortcut: "C", icon: <Move className="w-4 h-4" />, group: "path" },
  { key: "DRAW_SCREEN", label: "Screen", shortcut: "S", icon: <span className="font-mono font-bold text-[12px]">⊥</span>, group: "path" },
  { key: "DRAW_HANDOFF", label: "Handoff", shortcut: "H", icon: <span className="font-mono font-bold text-[12px]">DHO</span>, group: "path" },
];

const KEY_TO_MODE: Record<string, EditorMode> = {
  v: "SELECT",
  o: "ADD_OFFENSE",
  x: "ADD_DEFENSE",
  b: "ADD_BALL",
  k: "ADD_CONE",
  p: "DRAW_PASS",
  d: "DRAW_DRIBBLE",
  c: "DRAW_CUT",
  s: "DRAW_SCREEN",
  h: "DRAW_HANDOFF",
};

/* -------------------------------------------------------------------------- */
/* Sortable phase chip                                                          */
/* -------------------------------------------------------------------------- */

function PhaseChip({
  phase,
  index,
  isActive,
  onClick,
  onDuplicate,
  onDelete,
}: {
  phase: PlayPhase;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: phase.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const meta = PHASE_LABELS.find((p) => p.key === phase.phase) ?? PHASE_LABELS[0];
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`relative shrink-0 w-[148px] cursor-pointer rounded-lg border transition group ${
        isActive ? "border-primary ring-1 ring-primary/40 bg-card" : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="px-2 py-1.5 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
          <span
            className="font-mono text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded truncate"
            style={{ background: `${meta.color.replace(")", " / 0.15)")}`, color: meta.color }}
          >
            {meta.label}
          </span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-0.5 rounded hover:bg-background text-muted-foreground hover:text-foreground"
            aria-label="Duplicate phase"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Delete this phase?")) onDelete();
            }}
            className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            aria-label="Delete phase"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="px-1.5 pb-1.5">
        <PlayThumbnail phase={phase} width={132} height={99} showLabels={false} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Play list (left rail)                                                       */
/* -------------------------------------------------------------------------- */

function PlayList({
  plays,
  activeId,
  onPick,
  onCreate,
  onDuplicate,
  onDelete,
}: {
  plays: Play[];
  activeId: string | null;
  onPick: (id: string) => void;
  onCreate: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card flex flex-col h-fit max-h-[calc(100vh-180px)]">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">Plays</div>
          <div className="font-display text-base mt-0.5">{plays.length}</div>
        </div>
        <Button size="sm" onClick={onCreate} className="h-8 px-3">
          <Plus className="w-3.5 h-3.5 mr-1" /> New
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {plays.map((p) => {
            const isActive = p.id === activeId;
            return (
              <div key={p.id} className="group relative">
                <button
                  onClick={() => onPick(p.id)}
                  className={`w-full text-left rounded-md p-2 transition flex gap-2 ${
                    isActive ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/40 border border-transparent"
                  }`}
                >
                  <div className="shrink-0 rounded overflow-hidden border border-border/60">
                    <PlayThumbnail phase={p.phases[0]} width={64} height={48} showLabels={false} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[12.5px] truncate">{p.title}</div>
                    <div className="text-[10.5px] text-muted-foreground font-mono mt-0.5">
                      {p.category} · {p.phases.length} phase{p.phases.length !== 1 ? "s" : ""}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{p.versionLabel}</div>
                  </div>
                </button>
                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(p.id);
                    }}
                    className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground"
                    aria-label="Duplicate"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${p.title}"?`)) onDelete(p.id);
                    }}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export function CoachPlaybookStudio() {
  const {
    plays,
    selectedPlayId,
    selectedPhaseId,
    selectedTokenId,
    selectedPathId,
    versionHistory,
    editorMode,
    cutStyleSelection,
    passTypeSelection,
    snapEnabled,
    playbackSpeed,
    playbackLoop,
    authorName,
    setEditorMode,
    setCutStyleSelection,
    setPassTypeSelection,
    setSnapEnabled,
    setPlaybackSpeed,
    setPlaybackLoop,
    setSelectedPlay,
    setSelectedPhase,
    setSelectedToken,
    setSelectedPath,
    setAuthorName,
    createPlay,
    duplicatePlay,
    deletePlay,
    updatePlayMeta,
    addPhase,
    duplicatePhase,
    deletePhase,
    updatePhase,
    reorderPhase,
    addToken,
    updateToken,
    removeToken,
    addPath,
    removePath,
    saveVersion,
    restoreVersion,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePlaybook();

  const [presentOpen, setPresentOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const play = plays.find((p) => p.id === selectedPlayId) ?? plays[0];
  const phase = play?.phases.find((ph) => ph.id === selectedPhaseId) ?? play?.phases[0];

  // Canvas size — measure container
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const w = entry.contentRect.width;
      const h = Math.min(entry.contentRect.height, w * 0.75);
      setCanvasSize({ width: w, height: h });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      const meta = e.metaKey || e.ctrlKey;
      // Undo / Redo
      if (meta && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        undo();
        return;
      }
      if (
        (meta && e.shiftKey && (e.key === "z" || e.key === "Z")) ||
        (meta && (e.key === "y" || e.key === "Y"))
      ) {
        e.preventDefault();
        redo();
        return;
      }

      if (e.key === "Escape") {
        setEditorMode("SELECT");
        return;
      }

      // Tool shortcuts (no modifier)
      if (!meta && !e.altKey) {
        const mode = KEY_TO_MODE[e.key.toLowerCase()];
        if (mode) {
          e.preventDefault();
          setEditorMode(mode);
          return;
        }
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedTokenId && play && phase) {
          removeToken(play.id, phase.id, selectedTokenId);
        } else if (selectedPathId && play && phase) {
          removePath(play.id, phase.id, selectedPathId);
        }
        return;
      }

      // Arrow-key nudge: when a token is selected, move by 5 stage units
      // (or 1 with Shift). Wraps within [0, STAGE_W] × [0, STAGE_H].
      if (
        selectedTokenId &&
        play &&
        phase &&
        (e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight")
      ) {
        e.preventDefault();
        const t = phase.tokens.find((tk) => tk.id === selectedTokenId);
        if (!t) return;
        const step = e.shiftKey ? 1 : 5;
        let dx = 0,
          dy = 0;
        if (e.key === "ArrowUp") dy = -step;
        if (e.key === "ArrowDown") dy = step;
        if (e.key === "ArrowLeft") dx = -step;
        if (e.key === "ArrowRight") dx = step;
        const nx = Math.max(0, Math.min(800, t.x + dx));
        const ny = Math.max(0, Math.min(600, t.y + dy));
        updateToken(play.id, phase.id, selectedTokenId, { x: nx, y: ny });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    selectedTokenId,
    selectedPathId,
    play,
    phase,
    removeToken,
    removePath,
    setEditorMode,
    undo,
    redo,
  ]);

  // Playback (speed + loop come from store-level prefs)
  const playback = usePlayback(play, {
    speed: playbackSpeed,
    loop: playbackLoop,
  });

  // Phase reorder via dnd-kit
  function handlePhaseDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id || !play) return;
    const from = play.phases.findIndex((p) => p.id === active.id);
    const to = play.phases.findIndex((p) => p.id === over.id);
    if (from === -1 || to === -1) return;
    reorderPhase(play.id, from, to);
  }

  if (!play || !phase) {
    return (
      <AppShell>
        <div className="px-6 lg:px-10 py-8">
          <div className="text-center max-w-sm mx-auto py-16">
            <Plus className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <h2 className="font-display text-xl mb-1">No plays yet</h2>
            <p className="text-[13px] text-muted-foreground mb-4">Create your first play to start designing.</p>
            <Button onClick={() => createPlay()}>
              <Plus className="w-4 h-4 mr-1.5" /> New Play
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div data-v2-indicator className="px-4 lg:px-8 pt-3 max-w-[1700px] mx-auto"><div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/>Playbook Studio v2 · Enterprise build · SPEC-bound</div></div>
      <div className="px-4 lg:px-8 py-6 max-w-[1700px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ"
          title="Playbook Studio"
          subtitle="Diagram every phase of every play. Animate it, version it, ship it to your team."
          actions={
            <div className="flex items-center gap-2">
              <Link href="/app/coach" asChild>
                <a className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  Coach HQ <ChevronRight className="w-3 h-3" />
                </a>
              </Link>
              {(() => {
                const quizzes = getQuizzesForPlay(play.id);
                if (quizzes.length === 0) return null;
                return (
                  <Link href={`/app/player/quizzes/${quizzes[0].id}`}>
                    <a>
                      <Button variant="ghost" size="sm" className="h-9">
                        Preview quiz
                      </Button>
                    </a>
                  </Link>
                );
              })()}
              <Input
                value={authorName ?? ""}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your name"
                className="h-9 w-[140px] text-[12px]"
                aria-label="Author name for version history"
              />
              <Button
                onClick={() => {
                  const ok = saveVersion(play.id);
                  if (ok) toast.success("Saved version");
                  else toast.error("Couldn't save: snapshot failed validation");
                }}
                variant="outline"
                size="sm"
                className="h-9"
              >
                <Save className="w-4 h-4 mr-1.5" /> Save version
              </Button>
              <Button onClick={() => setPresentOpen(true)} className="h-9">
                <Maximize2 className="w-4 h-4 mr-1.5" /> Present
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-[240px_1fr_300px] gap-4">
          {/* Left: play list */}
          <PlayList
            plays={plays}
            activeId={play.id}
            onPick={setSelectedPlay}
            onCreate={() => {
              createPlay();
              toast.success("New play created");
            }}
            onDuplicate={(id) => {
              duplicatePlay(id);
              toast.success("Play duplicated");
            }}
            onDelete={(id) => {
              deletePlay(id);
              toast.success("Play deleted");
            }}
          />

          {/* Center: canvas + tools + phase timeline */}
          <div className="space-y-3">
            {/* Tool palette */}
            <div className="rounded-xl border border-border bg-card p-2 flex items-center gap-1 flex-wrap">
              {TOOLS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setEditorMode(t.key)}
                  title={`${t.label} (${t.shortcut})`}
                  aria-pressed={editorMode === t.key}
                  className={`h-9 px-2.5 rounded-md text-[12px] inline-flex items-center gap-1.5 border transition ${
                    editorMode === t.key
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_0_0_2px_rgba(251,191,36,0.25)]"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  {t.icon}
                  <span className="hidden md:inline">{t.label}</span>
                  <span className="font-mono text-[9px] opacity-60 ml-0.5 hidden lg:inline">{t.shortcut}</span>
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <Button
                  onClick={() => undo()}
                  size="sm"
                  variant="ghost"
                  className="h-9 px-2"
                  disabled={!canUndo()}
                  title="Undo (⌘Z)"
                >
                  ↶
                </Button>
                <Button
                  onClick={() => redo()}
                  size="sm"
                  variant="ghost"
                  className="h-9 px-2"
                  disabled={!canRedo()}
                  title="Redo (⌘⇧Z)"
                >
                  ↷
                </Button>
                <FormationDrawer
                  onPick={(formationId) => {
                    addPhase(play.id, formationId);
                    toast.success("Phase added from formation");
                  }}
                />
                <Button
                  onClick={() => addPhase(play.id)}
                  size="sm"
                  variant="outline"
                  className="h-9"
                  title="Add phase (clones current)"
                >
                  <Plus className="w-4 h-4 mr-1" /> Phase
                </Button>
                <button
                  onClick={() => setSnapEnabled(!snapEnabled)}
                  title="Snap path endpoints + token drops to court key spots"
                  aria-pressed={snapEnabled}
                  className={`h-9 px-2.5 rounded-md text-[11px] inline-flex items-center gap-1.5 border transition ${
                    snapEnabled
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  Snap
                </button>
              </div>
            </div>

            {/* Style pickers — show only when relevant draw mode is active */}
            {editorMode === "DRAW_CUT" && (
              <CutStylePicker
                value={cutStyleSelection}
                onChange={setCutStyleSelection}
              />
            )}
            {editorMode === "DRAW_PASS" && (
              <PassTypePicker
                value={passTypeSelection}
                onChange={setPassTypeSelection}
              />
            )}

            {/* Canvas */}
            <div ref={containerRef} className="rounded-xl border border-border bg-card overflow-hidden flex items-center justify-center" style={{ minHeight: 500 }}>
              <PlayCanvas
                phase={phase}
                editorMode={editorMode}
                cutStyle={cutStyleSelection}
                passType={passTypeSelection}
                snapEnabled={snapEnabled}
                selectedTokenId={selectedTokenId}
                selectedPathId={selectedPathId}
                width={canvasSize.width}
                height={canvasSize.height}
                animatedTokens={playback.isPlaying ? playback.tokens : null}
                onSelectToken={setSelectedToken}
                onSelectPath={setSelectedPath}
                onMoveToken={(id, x, y) => updateToken(play.id, phase.id, id, { x, y })}
                onAddToken={(t) => {
                  addToken(play.id, phase.id, t);
                }}
                onAddPath={(pa) => {
                  addPath(play.id, phase.id, pa);
                }}
                onRemoveToken={(id) => removeToken(play.id, phase.id, id)}
                onRemovePath={(id) => removePath(play.id, phase.id, id)}
                onCancelMode={() => setEditorMode("SELECT")}
              />
            </div>

            {/* Phase timeline */}
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">
                    Play Timeline
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    {play.phases.length} phase{play.phases.length !== 1 ? "s" : ""} · drag to reorder
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Speed picker */}
                  <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
                    {[0.5, 1, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => setPlaybackSpeed(s)}
                        aria-pressed={playbackSpeed === s}
                        className={`h-7 px-2 rounded text-[10.5px] font-mono ${
                          playbackSpeed === s
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {s}×
                      </button>
                    ))}
                  </div>
                  {/* Loop toggle */}
                  <button
                    onClick={() => setPlaybackLoop(!playbackLoop)}
                    title="Loop playback"
                    aria-pressed={playbackLoop}
                    className={`h-7 px-2 rounded-md text-[10.5px] font-mono border ${
                      playbackLoop
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    Loop
                  </button>
                  {!playback.isPlaying ? (
                    <Button
                      size="sm"
                      onClick={playback.play}
                      disabled={play.phases.length < 1}
                      className="h-8"
                    >
                      <PlayIcon className="w-3.5 h-3.5 mr-1" /> Play
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={playback.pause} className="h-8">
                      <Pause className="w-3.5 h-3.5 mr-1" /> Pause
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={playback.reset} className="h-8 px-2">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePhaseDragEnd}>
                <SortableContext items={play.phases.map((p) => p.id)} strategy={horizontalListSortingStrategy}>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
                    {play.phases.map((ph, i) => (
                      <PhaseChip
                        key={ph.id}
                        phase={ph}
                        index={i}
                        isActive={ph.id === phase.id}
                        onClick={() => setSelectedPhase(ph.id)}
                        onDuplicate={() => {
                          duplicatePhase(play.id, ph.id);
                          toast.success("Phase duplicated");
                        }}
                        onDelete={() => {
                          if (play.phases.length <= 1) {
                            toast.error("A play must have at least one phase");
                            return;
                          }
                          deletePhase(play.id, ph.id);
                        }}
                      />
                    ))}
                    <button
                      onClick={() => addPhase(play.id)}
                      className="shrink-0 h-[148px] w-[60px] rounded-lg border-2 border-dashed border-border hover:border-primary/60 text-muted-foreground hover:text-primary inline-flex items-center justify-center"
                      aria-label="Add phase"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>

          {/* Right: meta + phase notes + selection */}
          <RightRail
            play={play}
            phase={phase}
            selectedTokenId={selectedTokenId}
            selectedPathId={selectedPathId}
            onUpdatePlay={(patch) => updatePlayMeta(play.id, patch)}
            onUpdatePhase={(patch) => updatePhase(play.id, phase.id, patch)}
            onUpdateToken={(id, patch) => updateToken(play.id, phase.id, id, patch)}
            onRemoveToken={(id) => removeToken(play.id, phase.id, id)}
            onRemovePath={(id) => removePath(play.id, phase.id, id)}
            onOpenHistory={() => setHistoryOpen(true)}
          />
        </div>

        {/* Presentation mode */}
        <Dialog open={presentOpen} onOpenChange={setPresentOpen}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle className="font-display uppercase tracking-tight">{play.title}</DialogTitle>
            </DialogHeader>
            <PresentationView play={play} />
          </DialogContent>
        </Dialog>

        {/* Version history */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Version history — {play.title}</DialogTitle>
            </DialogHeader>
            <VersionList
              versions={versionHistory[play.id] ?? []}
              onRestore={(versionId) => {
                if (confirm("Restore this version? Your current edits will be replaced (you can save a version first).")) {
                  const ok = restoreVersion(play.id, versionId);
                  setHistoryOpen(false);
                  if (ok) toast.success("Version restored");
                  else toast.error("Couldn't restore: stored snapshot is invalid");
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Right rail — tabs: Play meta · Phase · Selection                            */
/* -------------------------------------------------------------------------- */

function RightRail({
  play,
  phase,
  selectedTokenId,
  selectedPathId,
  onUpdatePlay,
  onUpdatePhase,
  onUpdateToken,
  onRemoveToken,
  onRemovePath,
  onOpenHistory,
}: {
  play: Play;
  phase: PlayPhase;
  selectedTokenId: string | null;
  selectedPathId: string | null;
  onUpdatePlay: (p: Partial<Play>) => void;
  onUpdatePhase: (p: Partial<PlayPhase>) => void;
  onUpdateToken: (id: string, p: Partial<PlayPhase["tokens"][number]>) => void;
  onRemoveToken: (id: string) => void;
  onRemovePath: (id: string) => void;
  onOpenHistory: () => void;
}) {
  const selectedToken = phase.tokens.find((t) => t.id === selectedTokenId);
  const selectedPath = phase.paths.find((p) => p.id === selectedPathId);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5">
        <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">Play</div>
        <Input value={play.title} onChange={(e) => onUpdatePlay({ title: e.target.value })} className="font-display text-sm h-8" />
        <Textarea value={play.description} onChange={(e) => onUpdatePlay({ description: e.target.value })} placeholder="What is this play and when do we use it?" rows={2} className="text-[12px] resize-none" />
        <div className="grid grid-cols-2 gap-2">
          <Select value={play.category} onValueChange={(v) => onUpdatePlay({ category: v as Play["category"] })}>
            <SelectTrigger className="h-8 text-[11.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRIMARY">Primary</SelectItem>
              <SelectItem value="MOTION">Motion</SelectItem>
              <SelectItem value="ZONE_OFFENSE">Zone Offense</SelectItem>
              <SelectItem value="PRESS_BREAK">Press Break</SelectItem>
              <SelectItem value="BLOB">BLOB</SelectItem>
              <SelectItem value="SLOB">SLOB</SelectItem>
              <SelectItem value="ATO">ATO</SelectItem>
            </SelectContent>
          </Select>
          <Select value={play.courtType} onValueChange={(v) => onUpdatePlay({ courtType: v as Play["courtType"] })}>
            <SelectTrigger className="h-8 text-[11.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HALF">Half court</SelectItem>
              <SelectItem value="FULL">Full court</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between text-[10.5px] text-muted-foreground">
          <span className="font-mono">{play.versionLabel}</span>
          <button onClick={onOpenHistory} className="inline-flex items-center gap-1 hover:text-foreground">
            <History className="w-3 h-3" /> history
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">Phase</div>
          <Select value={phase.phase} onValueChange={(v) => onUpdatePhase({ phase: v as PhaseLabel })}>
            <SelectTrigger className="h-7 text-[11px] w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PHASE_LABELS.map((p) => (
                <SelectItem key={p.key} value={p.key}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          value={phase.notes}
          onChange={(e) => onUpdatePhase({ notes: e.target.value })}
          placeholder="What happens in this phase?"
          rows={4}
          className="text-[12.5px] resize-none"
        />
        <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground font-mono">
          <span>{phase.tokens.filter((t) => t.type === "OFFENSE").length} offense</span>
          <span>·</span>
          <span>{phase.tokens.filter((t) => t.type === "DEFENSE").length} defense</span>
          <span>·</span>
          <span>{phase.paths.length} action{phase.paths.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {selectedToken && (
        <div className="rounded-xl border border-primary/40 bg-card p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-primary">Selected token</div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemoveToken(selectedToken.id)}
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="text-[12px] font-mono text-muted-foreground">
            {selectedToken.type} · ({Math.round(selectedToken.x)}, {Math.round(selectedToken.y)})
          </div>
          {(selectedToken.type === "OFFENSE" || selectedToken.type === "DEFENSE") && (
            <div>
              <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1">Label</div>
              <Input
                value={selectedToken.label}
                onChange={(e) => onUpdateToken(selectedToken.id, { label: e.target.value })}
                className="h-8 font-mono text-center"
                maxLength={3}
              />
            </div>
          )}
          {selectedToken.type === "OFFENSE" && (
            <RolePicker
              value={selectedToken.role}
              onChange={(r) => onUpdateToken(selectedToken.id, { role: r })}
            />
          )}
        </div>
      )}

      {selectedPath && (
        <div className="rounded-xl border border-primary/40 bg-card p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-primary">Selected action</div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemovePath(selectedPath.id)}
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          {(() => {
            const action = actionForPathId(phase, selectedPath.id);
            if (!action) {
              return (
                <div className="text-[12px] font-mono text-muted-foreground">
                  {selectedPath.type} <span className="opacity-60">· (not attributed)</span>
                </div>
              );
            }
            return (
              <>
                <div className="text-[13px] font-semibold">{describeAction(action, phase.tokens)}</div>
                <div className="text-[10.5px] font-mono text-muted-foreground">
                  {selectedPath.type}
                  {selectedPath.cutStyle ? ` · ${selectedPath.cutStyle}` : ""}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {!selectedToken && !selectedPath && (
        <div className="rounded-xl border border-border/60 bg-card/40 p-3.5 text-[11.5px] text-muted-foreground">
          <div className="font-semibold text-foreground mb-1">Tips</div>
          <ul className="space-y-1 list-disc pl-4">
            <li>Press <span className="font-mono text-foreground">V</span> to select, then drag tokens.</li>
            <li>Press <span className="font-mono text-foreground">P</span> (Pass) / <span className="font-mono text-foreground">H</span> (Handoff): click passer, click receiver.</li>
            <li>Press <span className="font-mono text-foreground">C</span> (Cut) / <span className="font-mono text-foreground">D</span> (Dribble): drag from a player to anywhere.</li>
            <li>Press <span className="font-mono text-foreground">S</span> (Screen): click the screener, then click the spot on the floor where the screen is set.</li>
            <li>Press <span className="font-mono text-foreground">Delete</span> to remove a selection.</li>
            <li>Press <span className="font-mono text-foreground">Play</span> to animate — passes follow the arc, cuts trace the polyline.</li>
          </ul>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Cut style picker                                                            */
/* -------------------------------------------------------------------------- */

const CUT_STYLE_OPTIONS: { key: CutStyle; label: string; hint: string }[] = [
  { key: "STRAIGHT", label: "Straight", hint: "Direct, no bend" },
  { key: "CURVE", label: "Curl", hint: "Curve toward the ball" },
  { key: "VCUT", label: "V-cut", hint: "Plant + sharp change of direction" },
  { key: "LCUT", label: "L-cut", hint: "Right-angle cut" },
  { key: "BACKDOOR", label: "Backdoor", hint: "Reverse cut behind defender" },
  { key: "FLARE", label: "Flare", hint: "Cut away from the ball" },
];

function CutStylePicker({
  value,
  onChange,
}: {
  value: CutStyle;
  onChange: (s: CutStyle) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-2 flex items-center gap-1 flex-wrap">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground px-2">
        Cut style
      </span>
      {CUT_STYLE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          title={opt.hint}
          aria-pressed={value === opt.key}
          className={`h-8 px-2.5 rounded-md text-[11.5px] inline-flex items-center gap-1.5 border transition ${
            value === opt.key
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border bg-background hover:border-primary/50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pass type picker                                                            */
/* -------------------------------------------------------------------------- */

const PASS_TYPE_OPTIONS: { key: PassType; label: string; hint: string }[] = [
  { key: "CHEST", label: "Chest", hint: "Direct chest pass" },
  { key: "BOUNCE", label: "Bounce", hint: "Bounce pass — hard to deflect" },
  { key: "LOB", label: "Lob", hint: "High lob — over a defender" },
  { key: "SKIP", label: "Skip", hint: "Skip pass — across the floor" },
];

function PassTypePicker({
  value,
  onChange,
}: {
  value: PassType;
  onChange: (v: PassType) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-2 flex items-center gap-1 flex-wrap">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground px-2">
        Pass type
      </span>
      {PASS_TYPE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          title={opt.hint}
          aria-pressed={value === opt.key}
          className={`h-8 px-2.5 rounded-md text-[11.5px] inline-flex items-center gap-1.5 border transition ${
            value === opt.key
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border bg-background hover:border-primary/50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Role picker (selected offense token)                                        */
/* -------------------------------------------------------------------------- */

const ROLE_OPTIONS: Role[] = ["PG", "SG", "SF", "PF", "C"];

function RolePicker({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (v: Role | undefined) => void;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1">
        Role
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => onChange(undefined)}
          className={`h-7 px-2 rounded text-[11px] font-mono border ${
            !value
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border bg-background hover:border-primary/50"
          }`}
        >
          —
        </button>
        {ROLE_OPTIONS.map((r) => (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={`h-7 px-2 rounded text-[11px] font-mono border ${
              value === r
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-background hover:border-primary/50"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Formation drawer                                                            */
/* -------------------------------------------------------------------------- */

function FormationDrawer({ onPick }: { onPick: (formationId: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="h-9">
          From formation…
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-border">
          <SheetTitle className="font-display uppercase tracking-tight">Formation Library</SheetTitle>
          <p className="text-[12.5px] text-muted-foreground">Pick a starting alignment to add as a new phase.</p>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {formations.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  onPick(f.id);
                  setOpen(false);
                }}
                className="w-full text-left rounded-lg border border-border hover:border-primary/50 bg-card overflow-hidden group"
              >
                <PlayThumbnail
                  phase={{ id: "_p", order: 0, phase: "ENTRY", notes: "", tokens: f.tokens, paths: [] }}
                  width={400}
                  height={300}
                />
                <div className="p-3">
                  <div className="font-semibold text-[13px]">{f.name}</div>
                  <div className="text-[12px] text-muted-foreground">{f.description}</div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* Presentation mode                                                           */
/* -------------------------------------------------------------------------- */

function PresentationView({ play }: { play: Play }) {
  const [idx, setIdx] = useState(0);
  const playback = usePlayback(play);
  const phase = play.phases[idx] ?? play.phases[0];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div style={{ aspectRatio: "4/3" }} className="relative">
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <PlayThumbnail
              phase={
                playback.isPlaying
                  ? { ...phase, tokens: playback.tokens }
                  : phase
              }
              width={760}
              height={570}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>
          ← Prev
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={idx === play.phases.length - 1}
          onClick={() => setIdx((i) => Math.min(play.phases.length - 1, i + 1))}
        >
          Next →
        </Button>
        <div className="text-[12px] text-muted-foreground font-mono ml-2">
          Phase {idx + 1} / {play.phases.length} · {phase.phase}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {!playback.isPlaying ? (
            <Button size="sm" onClick={playback.play}>
              <PlayIcon className="w-3.5 h-3.5 mr-1" /> Auto-play
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={playback.pause}>
              <Pause className="w-3.5 h-3.5 mr-1" /> Pause
            </Button>
          )}
        </div>
      </div>
      <div className="rounded-md border border-border bg-card/40 p-3 text-[13px] leading-relaxed">
        {phase.notes || "—"}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Versions list                                                               */
/* -------------------------------------------------------------------------- */

function VersionList({
  versions,
  onRestore,
}: {
  versions: { id: string; label: string; savedAt: string; authorName: string }[];
  onRestore: (id: string) => void;
}) {
  if (versions.length === 0) {
    return (
      <div className="text-center py-8 text-[13px] text-muted-foreground">
        No versions saved yet. Click <span className="font-mono text-foreground">Save version</span> on the toolbar to snapshot the current play.
      </div>
    );
  }
  return (
    <div className="divide-y divide-border max-h-[400px] overflow-auto">
      {versions.map((v) => (
        <div key={v.id} className="flex items-center justify-between gap-3 py-2.5">
          <div>
            <div className="font-semibold text-[13.5px]">{v.label}</div>
            <div className="text-[11.5px] text-muted-foreground">
              {new Date(v.savedAt).toLocaleString()} · {v.authorName}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => onRestore(v.id)}>
            Restore
          </Button>
        </div>
      ))}
    </div>
  );
}

export default CoachPlaybookStudio;

// Suppress unused arrayMove warning (kept for future free reorder)
void arrayMove;
