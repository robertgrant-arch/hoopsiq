/**
 * Playbook Studio v3 — parallel route, action-based authoring.
 *
 * Mounted at /app/playbook-v3 and /app/coach/playbook-v3. The live
 * /app/playbook route remains unchanged. Once this is verified, the
 * cutover is a one-line route swap.
 */
import { useEffect, useRef, useState } from "react";
import { Play as PlayIcon, Pause, RotateCcw, Plus, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useV3, type ToolMode } from "@/features/playbook/v3/store";
import { PlayCanvasV3 } from "@/features/playbook/v3/PlayCanvasV3";
import { usePlaybackV3 } from "@/features/playbook/v3/usePlaybackV3";

const TOOLS: { key: ToolMode; label: string; shortcut: string }[] = [
  { key: "SELECT", label: "Select", shortcut: "V" },
  { key: "DRAW_CUT", label: "Cut", shortcut: "C" },
  { key: "DRAW_DRIBBLE", label: "Dribble", shortcut: "D" },
  { key: "DRAW_PASS", label: "Pass", shortcut: "P" },
  { key: "DRAW_SCREEN", label: "Screen", shortcut: "S" },
  { key: "DRAW_HANDOFF", label: "Handoff", shortcut: "H" },
];

export function CoachPlaybookStudioV3() {
  const {
    plays,
    selectedPlayId,
    selectedPhaseIndex,
    toolMode,
    selectedPlayerId,
    setToolMode,
    setSelectedPlay,
    setSelectedPhaseIndex,
    setSelectedPlayer,
    createPlay,
    updatePlayMeta,
    deletePlay,
    addPhase,
    duplicatePhase,
    deletePhase,
    addAction,
    removeLastAction,
    undo,
    redo,
    resetSeeds,
  } = useV3();

  const play = plays.find((p) => p.id === selectedPlayId) ?? plays[0];
  const phaseIndex = Math.min(selectedPhaseIndex, (play?.phases.length ?? 1) - 1);
  const phase = play?.phases[phaseIndex];

  /* canvas size */
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      const w = e.contentRect.width;
      const h = Math.min(e.contentRect.height, w * 0.75);
      setCanvasSize({ width: w, height: h });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  /* keyboard shortcuts */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA" || t?.isContentEditable) return;

      const meta = e.metaKey || e.ctrlKey;
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

      if (!meta && !e.altKey) {
        const map: Record<string, ToolMode> = {
          v: "SELECT",
          c: "DRAW_CUT",
          d: "DRAW_DRIBBLE",
          p: "DRAW_PASS",
          s: "DRAW_SCREEN",
          h: "DRAW_HANDOFF",
        };
        const m = map[e.key.toLowerCase()];
        if (m) {
          e.preventDefault();
          setToolMode(m);
          return;
        }
      }
      if (e.key === "Escape") {
        setToolMode("SELECT");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setToolMode, undo, redo]);

  /* playback */
  const playback = usePlaybackV3(play);

  if (!play || !phase) {
    return (
      <AppShell>
        <div className="px-6 lg:px-10 py-8 text-center max-w-sm mx-auto py-16">
          <p className="text-[13px] text-muted-foreground mb-4">No v3 plays yet.</p>
          <Button onClick={() => createPlay()}>
            <Plus className="w-4 h-4 mr-1.5" /> New Play
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 lg:px-8 pt-3 max-w-[1700px] mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          Playbook Studio v3 · Parallel preview · Action-based authoring
        </div>
      </div>
      <div className="px-4 lg:px-8 py-6 max-w-[1700px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ"
          title="Playbook Studio v3"
          subtitle="New action-based authoring. Phases past 0 carry actions only — positions are derived."
          actions={
            <div className="flex items-center gap-2">
              <Button onClick={() => undo()} variant="ghost" size="sm">↶ Undo</Button>
              <Button onClick={() => redo()} variant="ghost" size="sm">↷ Redo</Button>
              <Button onClick={() => resetSeeds()} variant="outline" size="sm">Reset seeds</Button>
            </div>
          }
        />

        <div className="grid grid-cols-[220px_1fr_280px] gap-4">
          {/* Left: play list */}
          <div className="rounded-xl border border-border bg-card p-3 space-y-2 h-fit">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">Plays</div>
              <Button size="sm" onClick={() => createPlay()} className="h-7 px-2"><Plus className="w-3 h-3" /></Button>
            </div>
            {plays.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlay(p.id)}
                className={`w-full text-left rounded-md p-2 text-[12px] transition border ${
                  p.id === play.id
                    ? "bg-primary/10 border-primary/30"
                    : "hover:bg-muted/40 border-transparent"
                }`}
              >
                <div className="font-semibold">{p.name}</div>
                <div className="text-[10.5px] text-muted-foreground">
                  {p.phases.length} phase{p.phases.length !== 1 ? "s" : ""} · {p.version}
                </div>
              </button>
            ))}
          </div>

          {/* Center: canvas + tools + timeline */}
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-card p-2 flex items-center gap-1 flex-wrap">
              {TOOLS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setToolMode(t.key)}
                  title={`${t.label} (${t.shortcut})`}
                  className={`h-9 px-3 rounded-md text-[12px] inline-flex items-center gap-1.5 border transition ${
                    toolMode === t.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  {t.label}
                  <span className="font-mono text-[9px] opacity-60">{t.shortcut}</span>
                </button>
              ))}
            </div>

            <div
              ref={containerRef}
              className="rounded-xl border border-border bg-card overflow-hidden flex items-center justify-center"
              style={{ minHeight: 500 }}
            >
              <PlayCanvasV3
                play={play}
                phaseIndex={phaseIndex}
                toolMode={toolMode}
                selectedPlayerId={selectedPlayerId}
                width={canvasSize.width}
                height={canvasSize.height}
                animatedPositions={playback.isPlaying ? playback.positions : null}
                animatedBallHolder={playback.isPlaying ? playback.ballHolder : null}
                onSelectPlayer={setSelectedPlayer}
                onAddAction={addAction}
              />
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">
                    Play Timeline
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    {play.phases.length} phase{play.phases.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!playback.isPlaying ? (
                    <Button size="sm" onClick={playback.play} disabled={play.phases.length < 2} className="h-8">
                      <PlayIcon className="w-3.5 h-3.5 mr-1" /> Play
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={playback.pause} className="h-8">
                      <Pause className="w-3.5 h-3.5 mr-1" /> Pause
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={playback.stop} className="h-8 px-2">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
                {play.phases.map((ph, i) => (
                  <div
                    key={ph.id}
                    onClick={() => setSelectedPhaseIndex(i)}
                    className={`shrink-0 cursor-pointer rounded-lg border px-3 py-2 transition ${
                      i === phaseIndex
                        ? "border-primary ring-1 ring-primary/40 bg-card"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="text-[12px] font-semibold">{ph.label}</div>
                    <div className="text-[10.5px] text-muted-foreground font-mono">
                      {ph.actions.length} action{ph.actions.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addPhase()}
                  className="shrink-0 h-[60px] w-[44px] rounded-lg border-2 border-dashed border-border hover:border-primary/60 text-muted-foreground hover:text-primary inline-flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: phase detail */}
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5">
              <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">Play</div>
              <Input
                value={play.name}
                onChange={(e) => updatePlayMeta(play.id, { name: e.target.value })}
                className="h-8"
              />
              <div className="text-[10.5px] text-muted-foreground font-mono">
                Schema: {play.schema} · v{play.version}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm(`Delete "${play.name}"?`)) deletePlay(play.id);
                }}
                className="h-7 text-[11px] text-muted-foreground hover:text-destructive w-full justify-start"
              >
                <Trash2 className="w-3 h-3 mr-1" /> Delete play
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">
                  Phase {String(phaseIndex + 1).padStart(2, "0")}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => duplicatePhase(phaseIndex)}>
                    Dup
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                    onClick={() => deletePhase(phaseIndex)}
                    disabled={phaseIndex === 0 || play.phases.length <= 1}
                  >
                    Del
                  </Button>
                </div>
              </div>
              <div className="text-[12px] font-semibold">{phase.label}</div>
              <div className="text-[11px] text-muted-foreground">
                {phase.actions.length} action{phase.actions.length !== 1 ? "s" : ""}
              </div>
              <ActionList actions={phase.actions} />
              {phase.actions.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => removeLastAction(phaseIndex)} className="h-7 text-[11px] w-full">
                  Remove last action
                </Button>
              )}
            </div>

            <div className="rounded-xl border border-border/60 bg-card/40 p-3.5 text-[11.5px] text-muted-foreground">
              <div className="font-semibold text-foreground mb-1">v3 Tips</div>
              <ul className="space-y-1 list-disc pl-4">
                <li>Cut/Dribble: drag from a player; release snaps endpoint.</li>
                <li>Pass: click any player as the target.</li>
                <li>Screen/Handoff: click screener/from → click court → click target.</li>
                <li>Phases past 01 store ACTIONS only — positions derive.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ActionList({
  actions,
}: {
  actions: import("../../../../../src/playbook/types").Action[];
}) {
  if (actions.length === 0) {
    return <div className="text-[11px] text-muted-foreground italic">No actions yet.</div>;
  }
  return (
    <div className="space-y-1">
      {actions.map((a, i) => (
        <div key={i} className="text-[11px] font-mono">
          {a.kind === "cut" && <>cut · {a.player} · {a.style} · {a.path.length} pts</>}
          {a.kind === "dribble" && <>dribble · {a.player} · {a.path.length} pts</>}
          {a.kind === "pass" && <>pass · {a.from} → {a.to}</>}
          {a.kind === "screen" && (
            <>screen · {a.screener} for {a.for} · ({a.at.x.toFixed(2)},{a.at.y.toFixed(2)})</>
          )}
          {a.kind === "handoff" && (
            <>handoff · {a.from} → {a.to} · ({a.at.x.toFixed(2)},{a.at.y.toFixed(2)})</>
          )}
        </div>
      ))}
    </div>
  );
}

export default CoachPlaybookStudioV3;
