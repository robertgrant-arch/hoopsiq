/**
 * ClipWorkspacePage — /app/coach/film-room/:sessionId
 *
 * The Film Room craft surface: watch, mark, annotate, tag, approve, send.
 * Spec: docs/film-room-clip-workspace.md §1–3 (MVP scope, no zoom).
 * Copy: docs/film-room-copy.md § Clip Workspace.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Film, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { MuxVideoPlayer } from "@/components/film/MuxVideoPlayer";
import {
  useAssignClip,
  useAssignmentQueue,
  useClips,
  useCreateClip,
  useFilmRoster,
  useFilms,
  useUpdateClip,
} from "@/features/film-room/hooks";
import { msToClock, type Clip } from "@/features/film-room/types";
import {
  ACCENT,
  clipStatusColor,
  DANGER,
  MUTED,
  RegionError,
  SkeletonRows,
  StatusPill,
  WARNING,
} from "@/features/film-room/components/shared";
import { IdpEscalatePanel } from "@/features/film-room/components/IdpEscalatePanel";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CHIP: Record<string, string> = {
  game: "GAME",
  practice: "PRACTICE",
  skill_rep: "SKILL REP",
  highlight: "HIGHLIGHT",
};

const CATEGORY_OPTIONS = ["defense", "offense", "transition", "closeout", "spacing", "finishing"];

function defaultDueDate(): string {
  const d = new Date(Date.now() + 3 * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function isTextTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  return (
    t.tagName === "INPUT" ||
    t.tagName === "TEXTAREA" ||
    t.tagName === "SELECT" ||
    t.isContentEditable
  );
}

type SaveState = "idle" | "saving" | "saved";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClipWorkspacePage(): React.ReactElement {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId ?? "";

  const films = useFilms();
  const clipsQuery = useClips(sessionId);
  const rosterQuery = useFilmRoster();
  const queue = useAssignmentQueue();
  const createClip = useCreateClip(sessionId);
  const updateClip = useUpdateClip(sessionId);
  const assignClip = useAssignClip(sessionId);

  const film = films.data?.find((f) => f.id === sessionId);
  const clips = useMemo(
    () => [...(clipsQuery.data ?? [])].sort((a, b) => a.startMs - b.startMs),
    [clipsQuery.data]
  );
  const roster = rosterQuery.data ?? [];
  const durationMs = (film?.durationSeconds ?? 0) * 1000;
  const hasVideo = !!film?.playbackId;

  // ── Playhead ──────────────────────────────────────────────────────────────
  const [playheadMs, setPlayheadMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [seekNonce, setSeekNonce] = useState(0); // remounts Mux player on seek
  const seekStartRef = useRef(0);

  const seek = useCallback(
    (ms: number) => {
      const clamped = Math.max(0, Math.min(ms, durationMs || ms));
      setPlayheadMs(clamped);
      if (hasVideo) {
        seekStartRef.current = clamped;
        setSeekNonce((n) => n + 1);
      }
    },
    [durationMs, hasVideo]
  );

  // Simulated clock (demo mode — no real video).
  useEffect(() => {
    if (!playing || hasVideo) return;
    const t = setInterval(() => {
      setPlayheadMs((ms) => {
        const next = ms + 200;
        if (durationMs && next >= durationMs) {
          setPlaying(false);
          return durationMs;
        }
        return next;
      });
    }, 200);
    return () => clearInterval(t);
  }, [playing, hasVideo, durationMs]);

  // ── Marks + active clip ───────────────────────────────────────────────────
  const [inMs, setInMs] = useState<number | null>(null);
  const [outMs, setOutMs] = useState<number | null>(null);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const activeClip = clips.find((c) => c.id === activeClipId) ?? null;
  const locked = !!activeClip?.lockedAt;

  // ── Editor fields ─────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [requireResponse, setRequireResponse] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const dirtyRef = useRef(false);
  const [idpOpen, setIdpOpen] = useState(false);

  const loadClipIntoEditor = useCallback((clip: Clip) => {
    dirtyRef.current = false;
    setActiveClipId(clip.id);
    setTitle(clip.title);
    setNote(clip.note);
    setCategories(clip.categories);
    setPlayerIds(clip.playerIds);
    setDueDate(defaultDueDate());
    setRequireResponse(true);
    setPrompt("");
    setSaveState("idle");
  }, []);

  const closeEditor = useCallback(() => {
    setActiveClipId(null);
    dirtyRef.current = false;
    setSaveState("idle");
  }, []);

  // Autosave (800ms debounce) on field changes.
  useEffect(() => {
    if (!activeClipId || locked || !dirtyRef.current) return;
    const t = setTimeout(() => {
      dirtyRef.current = false;
      setSaveState("saving");
      updateClip.mutate(
        { id: activeClipId, title, note, categories, playerIds },
        {
          onSuccess: () => setSaveState("saved"),
          onError: () => setSaveState("idle"),
        }
      );
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, note, categories, playerIds, activeClipId, locked]);

  const markDirty = () => {
    dirtyRef.current = true;
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const createFromMarks = useCallback(() => {
    if (inMs == null || outMs == null || createClip.isPending) return;
    const start = Math.min(inMs, outMs); // out < in auto-swaps
    const end = Math.max(inMs, outMs);
    if (end - start < 250) return;
    createClip.mutate(
      { startMs: start, endMs: end, title: "", note: "" },
      {
        onSuccess: (clip) => {
          setInMs(null);
          setOutMs(null);
          loadClipIntoEditor(clip);
        },
      }
    );
  }, [inMs, outMs, createClip, loadClipIntoEditor]);

  const saveDraft = useCallback(() => {
    if (!activeClipId || locked) return;
    dirtyRef.current = false;
    setSaveState("saving");
    updateClip.mutate(
      { id: activeClipId, title, note, categories, playerIds },
      { onSuccess: () => setSaveState("saved"), onError: () => setSaveState("idle") }
    );
  }, [activeClipId, locked, title, note, categories, playerIds, updateClip]);

  const approve = useCallback(() => {
    if (!activeClipId || locked) return;
    dirtyRef.current = false;
    setSaveState("saving");
    updateClip.mutate(
      { id: activeClipId, title, note, categories, playerIds, status: "approved" },
      { onSuccess: () => setSaveState("saved"), onError: () => setSaveState("idle") }
    );
  }, [activeClipId, locked, title, note, categories, playerIds, updateClip]);

  const approveAndSend = useCallback(() => {
    if (!activeClipId || locked || playerIds.length === 0 || assignClip.isPending) return;
    dirtyRef.current = false;
    setSaveState("saving");
    updateClip.mutate(
      { id: activeClipId, title, note, categories, playerIds, status: "approved" },
      {
        onSuccess: () => {
          assignClip.mutate(
            {
              clipId: activeClipId,
              playerIds,
              dueAt: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : null,
              requireResponse,
              responsePrompt: requireResponse ? prompt || "What do you see?" : undefined,
              send: true,
            },
            {
              onSuccess: () => {
                setSaveState("saved");
                toast.success(`Sent to ${playerIds.length} player${playerIds.length === 1 ? "" : "s"}`);
              },
              onError: () => setSaveState("idle"),
            }
          );
        },
        onError: () => setSaveState("idle"),
      }
    );
  }, [
    activeClipId, locked, playerIds, assignClip, updateClip,
    title, note, categories, dueDate, requireResponse, prompt,
  ]);

  const duplicateClip = useCallback(() => {
    if (!activeClip) return;
    createClip.mutate(
      {
        startMs: activeClip.startMs,
        endMs: activeClip.endMs,
        title: activeClip.title,
        note: activeClip.note,
        categories: activeClip.categories,
        playerIds: activeClip.playerIds,
      },
      { onSuccess: (clip) => loadClipIntoEditor(clip) }
    );
  }, [activeClip, createClip, loadClipIntoEditor]);

  const togglePlayer = (id: string) => {
    if (!activeClipId || locked) return;
    markDirty();
    setPlayerIds((ids) => (ids.includes(id) ? ids.filter((p) => p !== id) : [...ids, id]));
  };

  const toggleCategory = (c: string) => {
    if (locked) return;
    markDirty();
    setCategories((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  };

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ⌘/Ctrl+Enter works from anywhere, including text fields.
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        approveAndSend();
        return;
      }
      if (isTextTarget(e)) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (!hasVideo) setPlaying((p) => !p);
          break;
        case "ArrowLeft":
          e.preventDefault();
          seek(playheadMs - (e.shiftKey ? 1000 : 5000));
          break;
        case "ArrowRight":
          e.preventDefault();
          seek(playheadMs + (e.shiftKey ? 1000 : 5000));
          break;
        case "i":
        case "I":
          setInMs(playheadMs);
          break;
        case "o":
        case "O":
          setOutMs(playheadMs);
          break;
        case "Enter":
          e.preventDefault();
          createFromMarks();
          break;
        case "Escape":
          closeEditor();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playheadMs, hasVideo, seek, createFromMarks, closeEditor, approveAndSend]);

  // ── IDP escalation context (workspace shows it only for sent clips) ───────
  const idpRow = useMemo(() => {
    if (!activeClip || activeClip.status !== "assigned") return null;
    const firstPlayer = activeClip.playerIds[0];
    if (!firstPlayer) return null;
    return (
      queue.data?.rows.find(
        (r) => r.clip.id === activeClip.id && r.player.id === firstPlayer
      ) ?? null
    );
  }, [activeClip, queue.data]);

  // ── Loading / error / processing states ───────────────────────────────────
  if (films.isLoading || clipsQuery.isLoading) {
    return (
      <AppShell>
        <div className="px-4 lg:px-8 pt-4 max-w-6xl mx-auto space-y-3">
          <div className="h-10 rounded-md animate-pulse bg-[oklch(0.20_0.01_260)]" />
          <div className="aspect-video rounded-lg animate-pulse bg-[oklch(0.20_0.01_260)]" />
          <SkeletonRows count={3} />
        </div>
      </AppShell>
    );
  }
  if (films.isError || clipsQuery.isError) {
    return (
      <AppShell>
        <div className="px-4 lg:px-8 pt-6 max-w-3xl mx-auto">
          <RegionError
            message="Couldn't load this film."
            onRetry={() => {
              films.refetch();
              clipsQuery.refetch();
            }}
          />
        </div>
      </AppShell>
    );
  }
  if (!film) {
    return (
      <AppShell>
        <div className="px-4 lg:px-8 pt-6 max-w-3xl mx-auto space-y-3">
          <RegionError message="Film not found." />
          <Link href="/app/coach/film-room" className="text-[12px] underline" style={{ color: ACCENT }}>
            Back to Film Room
          </Link>
        </div>
      </AppShell>
    );
  }
  if (film.status === "processing" || film.status === "uploading") {
    return (
      <AppShell>
        <div className="px-4 lg:px-8 pt-6 max-w-3xl mx-auto space-y-4">
          <WorkspaceHeader film={film} saveState="idle" />
          <div className="rounded-lg border border-border px-6 py-10 text-center space-y-3">
            <Loader2 className="w-6 h-6 mx-auto animate-spin" style={{ color: WARNING }} />
            <p className="text-[13px]" style={{ color: MUTED }}>
              Processing film — you can't scrub yet. Usually a few minutes.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  const editorOpen = !!activeClip;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <div className="px-4 lg:px-6 pt-3 pb-10 max-w-[1400px] mx-auto">
        <WorkspaceHeader film={film} saveState={saveState} />

        <div className="flex gap-3 mt-3 items-start">
          {/* LEFT — film info, roster, clip rail */}
          <aside className="hidden lg:flex flex-col w-60 shrink-0 gap-3 max-h-[calc(100vh-10rem)] overflow-y-auto pr-0.5">
            <div className="rounded-lg border border-border px-3 py-2.5 space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="text-[9px] font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded"
                  style={{ color: ACCENT, background: "oklch(0.72 0.18 290 / 0.12)" }}
                >
                  {TYPE_CHIP[film.kind]}
                </span>
                <StatusPill kind="film" status={film.status} />
              </div>
              <div className="text-[12px] font-medium leading-snug">{film.title}</div>
              <div className="text-[11px]" style={{ color: MUTED }}>
                {film.opponent ? `${film.opponent} · ` : ""}
                {film.playedAt &&
                  new Date(film.playedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {film.durationSeconds != null && (
                  <span className="font-mono"> · {msToClock(durationMs)}</span>
                )}
              </div>
              <div className="text-[11px]" style={{ color: MUTED }}>
                {clips.length} clip{clips.length === 1 ? "" : "s"}
              </div>
            </div>

            {/* Roster */}
            <div className="rounded-lg border border-border">
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: MUTED }}>
                Roster{" "}
                {editorOpen && !locked && (
                  <span className="normal-case font-normal tracking-normal" style={{ color: ACCENT }}>
                    · click to tag
                  </span>
                )}
              </div>
              <div className="pb-1.5">
                {rosterQuery.isError ? (
                  <div className="px-3 pb-2">
                    <RegionError message="Couldn't load the roster." onRetry={() => rosterQuery.refetch()} />
                  </div>
                ) : (
                  roster.map((p) => {
                    const tagged = editorOpen && playerIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlayer(p.id)}
                        disabled={!editorOpen || locked}
                        className="w-full flex items-center gap-2 px-3 py-1 text-left text-[12px] transition-colors disabled:cursor-default enabled:hover:bg-[oklch(0.20_0.01_260)]"
                        style={tagged ? { color: ACCENT } : undefined}
                      >
                        <span className="font-mono text-[11px] w-7 shrink-0" style={{ color: tagged ? ACCENT : MUTED }}>
                          #{p.jersey ?? "—"}
                        </span>
                        <span className="truncate flex-1">{p.name}</span>
                        {tagged && <span className="text-[11px]">✓</span>}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Clip rail */}
            <div className="rounded-lg border border-border">
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: MUTED }}>
                Clips ({clips.length})
              </div>
              {clips.length === 0 ? (
                <p className="px-3 pb-2.5 text-[11px]" style={{ color: MUTED }}>
                  Mark a moment on the timeline to start a clip.
                </p>
              ) : (
                <div className="pb-1.5">
                  {clips.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        loadClipIntoEditor(c);
                        seek(c.startMs);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-[oklch(0.20_0.01_260)] ${
                        c.id === activeClipId ? "bg-[oklch(0.22_0.02_290)]" : ""
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: clipStatusColor(c.status) }}
                        title={c.status}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-mono" style={{ color: MUTED }}>
                          {msToClock(c.startMs)}–{msToClock(c.endMs)}
                        </span>
                        <span className="block text-[12px] truncate">
                          {c.title || "Untitled clip"}
                        </span>
                      </span>
                      {c.playerIds.length > 0 && (
                        <span className="text-[10px] font-mono shrink-0" style={{ color: MUTED }}>
                          {c.playerIds.length}p
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* CENTER — video + timeline */}
          <main className="flex-1 min-w-0 space-y-2">
            {hasVideo ? (
              <MuxVideoPlayer
                key={seekNonce}
                playbackId={film.playbackId!}
                startTime={seekStartRef.current / 1000}
                onTimeUpdate={(t) => setPlayheadMs(t * 1000)}
                className="rounded-lg overflow-hidden"
              />
            ) : (
              <div
                className="aspect-video rounded-lg border border-border flex flex-col items-center justify-center gap-2 select-none"
                style={{ background: "oklch(0.16 0.01 260)" }}
                onClick={() => setPlaying((p) => !p)}
                role="button"
                tabIndex={-1}
              >
                <Film className="w-10 h-10" style={{ color: MUTED }} />
                <div className="font-mono text-xl">{msToClock(playheadMs)}</div>
                <div className="text-[11px]" style={{ color: MUTED }}>
                  {playing ? "Playing (demo clock) — space to pause" : "Paused — space to play"}
                </div>
              </div>
            )}

            {/* In/out readout */}
            <div className="flex items-center gap-3 text-[11px] font-mono px-1" style={{ color: MUTED }}>
              <span>{msToClock(playheadMs)}</span>
              <span style={{ color: inMs != null ? WARNING : MUTED }}>
                IN {inMs != null ? msToClock(inMs) : "—"}
              </span>
              <span style={{ color: outMs != null ? WARNING : MUTED }}>
                OUT {outMs != null ? msToClock(outMs) : "—"}
              </span>
              {inMs != null && outMs != null && (
                <span style={{ color: WARNING }}>
                  {msToClock(Math.abs(outMs - inMs))} — Enter to make the clip
                </span>
              )}
            </div>

            {/* Timeline */}
            <div
              className="relative h-16 rounded-md border border-border cursor-pointer overflow-hidden"
              style={{ background: "oklch(0.16 0.01 260)" }}
              onClick={(e) => {
                if (!durationMs) return;
                const rect = e.currentTarget.getBoundingClientRect();
                seek(((e.clientX - rect.left) / rect.width) * durationMs);
              }}
            >
              {/* Marked in/out range */}
              {inMs != null && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{
                    left: `${(Math.min(inMs, outMs ?? inMs) / (durationMs || 1)) * 100}%`,
                    width: `${((Math.abs((outMs ?? inMs) - inMs) || 0) / (durationMs || 1)) * 100}%`,
                    minWidth: 2,
                    background: "oklch(0.78 0.16 75 / 0.22)",
                    borderLeft: `2px solid ${WARNING}`,
                    borderRight: outMs != null ? `2px solid ${WARNING}` : undefined,
                  }}
                />
              )}
              {/* Clip spans */}
              {clips.map((c) => (
                <div
                  key={c.id}
                  className="absolute h-3 rounded-sm top-1/2 -translate-y-1/2 hover:opacity-100"
                  style={{
                    left: `${(c.startMs / (durationMs || 1)) * 100}%`,
                    width: `${Math.max(((c.endMs - c.startMs) / (durationMs || 1)) * 100, 0.4)}%`,
                    background: clipStatusColor(c.status),
                    opacity: c.id === activeClipId ? 1 : 0.75,
                    outline: c.id === activeClipId ? `1px solid oklch(0.95 0 0)` : undefined,
                  }}
                  title={`${c.title || "Untitled clip"} (${msToClock(c.startMs)}–${msToClock(c.endMs)})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    loadClipIntoEditor(c);
                    seek(c.startMs);
                  }}
                />
              ))}
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-px pointer-events-none"
                style={{
                  left: `${(playheadMs / (durationMs || 1)) * 100}%`,
                  background: "oklch(0.95 0 0)",
                  boxShadow: "0 0 4px oklch(0.95 0 0 / 0.6)",
                }}
              />
            </div>
            <div className="text-[10px] px-1 font-mono flex justify-between" style={{ color: MUTED }}>
              <span>0:00</span>
              <span>{msToClock(durationMs)}</span>
            </div>
          </main>

          {/* RIGHT — clip editor */}
          <aside className="w-full max-w-[320px] lg:w-80 shrink-0 rounded-lg border border-border max-h-[calc(100vh-10rem)] overflow-y-auto">
            {!activeClip ? (
              <div className="px-4 py-6 space-y-3">
                <div className="text-[14px] font-semibold">Mark a moment.</div>
                <p className="text-[12px] leading-relaxed" style={{ color: MUTED }}>
                  Press <Kbd>I</Kbd> to set the start, <Kbd>O</Kbd> to set the end, then{" "}
                  <Kbd>Enter</Kbd> to make the clip.
                </p>
                <div className="text-[11px] space-y-1 pt-2 border-t border-border" style={{ color: MUTED }}>
                  <div><Kbd>Space</Kbd> play / pause</div>
                  <div><Kbd>←</Kbd> <Kbd>→</Kbd> ±5s · <Kbd>Shift</Kbd>+<Kbd>←→</Kbd> ±1s</div>
                  <div><Kbd>⌘Enter</Kbd> approve &amp; send</div>
                  <div><Kbd>Esc</Kbd> close editor</div>
                </div>
              </div>
            ) : locked ? (
              <div className="px-4 py-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <StatusPill kind="clip" status={activeClip.status} />
                  <span className="font-mono text-[11px]" style={{ color: MUTED }}>
                    {msToClock(activeClip.startMs)}–{msToClock(activeClip.endMs)}
                  </span>
                </div>
                <div className="text-[13px] font-medium">{activeClip.title || "Untitled clip"}</div>
                {activeClip.note && (
                  <p className="text-[12px] leading-relaxed" style={{ color: MUTED }}>
                    {activeClip.note}
                  </p>
                )}
                <div className="rounded-md border px-3 py-2 text-[12px]" style={{ borderColor: "oklch(0.78 0.16 75 / 0.35)", color: WARNING }}>
                  Sent clips can't be edited — players already saw this version.
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={duplicateClip}
                    disabled={createClip.isPending}
                    className="w-full rounded-md border border-border px-3 py-1.5 text-[12px] font-medium hover:bg-[oklch(0.20_0.01_260)] disabled:opacity-40"
                  >
                    Duplicate to edit
                  </button>
                  <IdpButton
                    enabled={!!idpRow}
                    onClick={() => setIdpOpen(true)}
                  />
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <StatusPill kind="clip" status={activeClip.status} />
                  <span className="text-[11px]" style={{ color: MUTED }}>
                    {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
                  </span>
                </div>
                <div className="font-mono text-[11px]" style={{ color: MUTED }}>
                  {msToClock(activeClip.startMs)}–{msToClock(activeClip.endMs)} ·{" "}
                  {msToClock(activeClip.endMs - activeClip.startMs)}
                </div>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    markDirty();
                    setTitle(e.target.value);
                  }}
                  placeholder="Name this clip — your players will see it"
                  className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-[13px] outline-none focus:border-[oklch(0.72_0.18_290)]"
                />

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
                    Teaching point
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => {
                      markDirty();
                      setNote(e.target.value);
                    }}
                    rows={3}
                    placeholder="What should they see, and what do you want next rep?"
                    className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-[12px] outline-none resize-y focus:border-[oklch(0.72_0.18_290)]"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCategory(c)}
                      className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border transition-colors"
                      style={
                        categories.includes(c)
                          ? { color: ACCENT, borderColor: ACCENT, background: "oklch(0.72 0.18 290 / 0.12)" }
                          : { color: MUTED, borderColor: "oklch(0.28 0.01 260)" }
                      }
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
                    Players
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {roster.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlayer(p.id)}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-full border transition-colors"
                        style={
                          playerIds.includes(p.id)
                            ? { color: ACCENT, borderColor: ACCENT, background: "oklch(0.72 0.18 290 / 0.12)" }
                            : { color: MUTED, borderColor: "oklch(0.28 0.01 260)" }
                        }
                        title={p.name}
                      >
                        #{p.jersey ?? "—"} {p.name.split(" ").pop()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assign block */}
                <div className="rounded-md border border-border px-3 py-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="clip-due" className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
                      Due
                    </label>
                    <input
                      id="clip-due"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="rounded-md border border-border bg-transparent px-2 py-1 text-[12px] outline-none"
                    />
                  </div>
                  <label className="flex items-center justify-between gap-2 text-[12px] cursor-pointer">
                    Ask for a response
                    <input
                      type="checkbox"
                      checked={requireResponse}
                      onChange={(e) => setRequireResponse(e.target.checked)}
                      className="accent-[oklch(0.72_0.18_290)]"
                    />
                  </label>
                  {requireResponse && (
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="What do you see?"
                      className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-[12px] outline-none focus:border-[oklch(0.72_0.18_290)]"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={approveAndSend}
                    disabled={playerIds.length === 0 || assignClip.isPending || updateClip.isPending}
                    title={playerIds.length === 0 ? "Tag at least one player" : undefined}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-[12px] font-semibold text-black disabled:opacity-40"
                    style={{ background: ACCENT }}
                  >
                    {assignClip.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Approve &amp; send <span className="font-mono opacity-70">⌘↵</span>
                  </button>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={approve}
                      className="rounded-md border border-border px-3 py-1.5 text-[12px] font-medium hover:bg-[oklch(0.20_0.01_260)]"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="rounded-md border border-border px-3 py-1.5 text-[12px] font-medium hover:bg-[oklch(0.20_0.01_260)]"
                    >
                      Save draft
                    </button>
                  </div>
                  {playerIds.length > 0 && (
                    <IdpButton enabled={false} onClick={() => {}} />
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {idpRow && (
        <IdpEscalatePanel
          open={idpOpen}
          onOpenChange={setIdpOpen}
          playerName={idpRow.player.name}
          assignmentPlayerId={idpRow.id}
          notePrefill={activeClip?.note ?? ""}
        />
      )}
    </AppShell>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────────────

function WorkspaceHeader({
  film,
  saveState,
}: {
  film: { title: string; kind: string; opponent: string | null; playedAt: string | null; durationSeconds: number | null };
  saveState: SaveState;
}) {
  return (
    <div className="flex items-center gap-3 h-12 border-b border-border">
      <Link
        href="/app/coach/film-room"
        className="inline-flex items-center gap-1 text-[12px] font-medium hover:underline shrink-0"
        style={{ color: MUTED }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Library
      </Link>
      <div className="text-[12px] truncate min-w-0 flex-1">
        <span
          className="text-[9px] font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded mr-2"
          style={{ color: ACCENT, background: "oklch(0.72 0.18 290 / 0.12)" }}
        >
          {TYPE_CHIP[film.kind] ?? film.kind.toUpperCase()}
        </span>
        <span className="font-medium">{film.title}</span>
        {film.durationSeconds != null && (
          <span className="font-mono ml-2" style={{ color: MUTED }}>
            {msToClock(film.durationSeconds * 1000)}
          </span>
        )}
      </div>
      <div className="text-[11px] shrink-0" style={{ color: MUTED }}>
        {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
      </div>
    </div>
  );
}

function IdpButton({ enabled, onClick }: { enabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      title={enabled ? undefined : "Send the clip first"}
      className="w-full rounded-md border border-border px-3 py-1.5 text-[12px] font-medium hover:bg-[oklch(0.20_0.01_260)] disabled:opacity-40 disabled:cursor-not-allowed"
    >
      Add to IDP
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-block px-1.5 py-0.5 rounded border border-border font-mono text-[10px]"
      style={{ background: "oklch(0.20 0.01 260)" }}
    >
      {children}
    </kbd>
  );
}
