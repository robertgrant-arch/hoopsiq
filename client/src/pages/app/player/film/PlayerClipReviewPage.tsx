/**
 * PlayerClipReviewPage — S2/S3 Clip Viewer (/app/player/film/:assignmentId).
 *
 * One clip = one screen = under 60 seconds. Vertical full-bleed layout:
 * minimal top bar → video (simulated player in demo; no Mux playbackId on
 * clips yet) → teaching point → response card. Watch progress is tracked as
 * unique seconds (useWatchAccumulator) and synced via useWatchProgress,
 * throttled to once per 5s plus immediately at the ≥90% threshold.
 *
 * Spec: docs/film-room-player-review.md · copy: docs/film-room-copy.md.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Check, ChevronLeft, Pause, Play, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import {
  useAssignmentDetail,
  useSubmitReview,
  useWatchProgress,
} from "@/features/film-room/hooks";
import { useWatchAccumulator } from "@/features/film-room/useWatchAccumulator";
import {
  clipDuration,
  isActionable,
  msToClock,
  type AssignmentDetail,
} from "@/features/film-room/types";

const ACCENT = "oklch(0.72 0.18 290)";
const DANGER = "oklch(0.68 0.22 25)";
const SUCCESS = "oklch(0.75 0.12 140)";

const SOFT_CAP = 120;
const HARD_CAP = 500;
const WATCH_THRESHOLD = 90;
const PROGRESS_SYNC_MS = 5000;

/* ── Due chip (top bar) ───────────────────────────────────────────────────── */

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function DueChip({ detail }: { detail: AssignmentDetail }) {
  if (!detail.dueAt || !isActionable(detail.status)) return null;
  const due = new Date(detail.dueAt);
  const now = new Date();

  if (isSameDay(due, now)) {
    return (
      <span className="text-[12px] font-medium" style={{ color: DANGER }}>
        Due today
      </span>
    );
  }
  if (due.getTime() < now.getTime()) {
    return (
      <span className="text-[12px] font-bold" style={{ color: DANGER }}>
        Overdue
      </span>
    );
  }
  return (
    <span className="text-[12px] font-medium text-muted-foreground">
      Due {due.toLocaleDateString("en-US", { weekday: "short" })}
    </span>
  );
}

/* ── Simulated clip player ────────────────────────────────────────────────── */
/* Demo clips have no Mux playbackId, so playback is simulated: a 16:9 dark  */
/* panel with the clip title and a progress bar that advances while playing. */

function SimulatedClipPlayer({
  title,
  durationMs,
  halfSpeed,
  replaySignal,
  onSecond,
}: {
  title: string;
  durationMs: number;
  halfSpeed: boolean;
  /** Increment to restart playback from 0. */
  replaySignal: number;
  onSecond: (second: number) => void;
}) {
  const durSec = durationMs / 1000;
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timeRef = useRef(0);

  // Replay: restart from 0 and play.
  useEffect(() => {
    if (replaySignal > 0) {
      timeRef.current = 0;
      setTime(0);
      setPlaying(true);
    }
  }, [replaySignal]);

  useEffect(() => {
    if (!playing) return;
    const rate = halfSpeed ? 0.5 : 1;
    const id = setInterval(() => {
      const next = Math.min(timeRef.current + 0.1 * rate, durSec);
      timeRef.current = next;
      // Mark the second currently on screen (clamped to the last bucket).
      onSecond(Math.min(Math.floor(next), Math.ceil(durSec) - 1));
      setTime(next);
      if (next >= durSec) setPlaying(false);
    }, 100);
    return () => clearInterval(id);
  }, [playing, halfSpeed, durSec, onSecond]);

  const ended = time >= durSec;

  function togglePlay() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (ended) {
      timeRef.current = 0;
      setTime(0);
    }
    setPlaying(true);
  }

  return (
    <button
      onClick={togglePlay}
      aria-label={playing ? "Pause clip" : "Play clip"}
      className="relative w-full aspect-video max-h-[40vh] mx-auto flex items-center justify-center overflow-hidden select-none"
      style={{
        background: "oklch(0.13 0.005 260)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div className="px-6 text-center">
        <div className="text-[13px] font-semibold text-white/80 leading-snug">
          {title}
        </div>
        <div className="text-[11px] text-white/40 mt-1 tabular-nums">
          {msToClock(Math.min(time, durSec) * 1000)} / {msToClock(durationMs)}
        </div>
      </div>

      {/* Big play overlay when paused */}
      {!playing && (
        <span
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <span
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "oklch(1 0 0 / 0.12)", backdropFilter: "blur(4px)" }}
          >
            {ended ? (
              <RotateCcw className="w-7 h-7 text-white" />
            ) : (
              <Play className="w-7 h-7 text-white translate-x-0.5" fill="currentColor" />
            )}
          </span>
        </span>
      )}
      {playing && (
        <span className="absolute top-3 right-3 opacity-40" aria-hidden>
          <Pause className="w-4 h-4 text-white" fill="currentColor" />
        </span>
      )}

      {/* Segment-clamped progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10" aria-hidden>
        <div
          className="h-full"
          style={{
            width: `${durSec > 0 ? Math.min(100, (time / durSec) * 100) : 0}%`,
            background: ACCENT,
            transition: "width 100ms linear",
          }}
        />
      </div>
    </button>
  );
}

/* ── Confidence row ───────────────────────────────────────────────────────── */

const CONFIDENCE_OPTS = [
  { value: 1, emoji: "😕" },
  { value: 2, emoji: "😐" },
  { value: 3, emoji: "💪" },
] as const;

function ConfidenceRow({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="mt-4">
      <div className="text-[13px] text-muted-foreground mb-2">
        How confident are you fixing this?
      </div>
      <div className="flex gap-2">
        {CONFIDENCE_OPTS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(selected ? null : opt.value)}
              aria-pressed={selected}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] border transition-all active:scale-95"
              style={{
                borderColor: selected ? ACCENT : "oklch(0.28 0.01 260)",
                background: selected ? ACCENT.replace(")", " / 0.14)") : "transparent",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {opt.emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main review surface ──────────────────────────────────────────────────── */

function ClipReview({ detail }: { detail: AssignmentDetail }) {
  const [, navigate] = useLocation();
  const durationMs = detail.clip.endMs - detail.clip.startMs;

  const { pct, markSecond } = useWatchAccumulator(durationMs);
  const progress = useWatchProgress(detail.id);
  const submitReview = useSubmitReview(detail.id);

  // Revisit mode is decided once, on load — a fresh submit shows the
  // confirmation state instead.
  const [revisit] = useState(
    detail.status === "responded" || detail.status === "completed",
  );

  const watched = revisit || !!detail.watchedAt || pct >= WATCH_THRESHOLD;

  // ── Watch-progress sync: at most once per 5s, plus instantly at ≥90%. ────
  const lastSentRef = useRef(0);
  const sent90Ref = useRef(!!detail.watchedAt || revisit);
  const progressMutate = progress.mutate;
  useEffect(() => {
    if (pct <= 0 || revisit) return;
    const now = Date.now();
    if (pct >= WATCH_THRESHOLD && !sent90Ref.current) {
      sent90Ref.current = true;
      lastSentRef.current = now;
      progressMutate(Math.round(pct));
    } else if (now - lastSentRef.current >= PROGRESS_SYNC_MS) {
      lastSentRef.current = now;
      progressMutate(Math.round(pct));
    }
  }, [pct, revisit, progressMutate]);

  // ── Player controls ───────────────────────────────────────────────────────
  const [halfSpeed, setHalfSpeed] = useState(false);
  const [replaySignal, setReplaySignal] = useState(0);
  const onSecond = useCallback((s: number) => markSecond(s), [markSecond]);

  // ── Response state ────────────────────────────────────────────────────────
  const [text, setText] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [flagged, setFlagged] = useState(detail.reviewRequested);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  function autoGrow() {
    const el = taRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }

  const requireResponse = detail.requireResponse;
  const canSubmit =
    watched && !submitting && (!requireResponse || text.trim().length > 0);

  async function handleDone() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      if (requireResponse) {
        await submitReview.mutateAsync({
          kind: "text",
          textBody: text.trim(),
          ...(confidence != null ? { confidence } : {}),
          clientCreatedAt: new Date().toISOString(),
        });
      }
      if (flagged && !detail.reviewRequested) {
        await submitReview.mutateAsync({ kind: "flag_review_request" });
      }
      setSubmitted(true);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Revisit data ──────────────────────────────────────────────────────────
  const reflection = detail.reviews.find((r) => r.kind === "text")?.textBody ?? null;
  const coachReply = detail.followups.find((f) => f.kind === "reply" && f.body)?.body ?? null;

  const overSoftCap = text.length > SOFT_CAP;

  return (
    <div
      className="max-w-xl mx-auto"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
    >
      {/* ── Minimal top bar ── */}
      <div className="flex items-center justify-between px-2 h-12">
        <button
          onClick={() => navigate("/app/player/film")}
          aria-label="Back to Film"
          className="flex items-center gap-0.5 min-h-[44px] min-w-[44px] px-2 text-[14px] font-medium text-muted-foreground transition-opacity active:opacity-70"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <ChevronLeft className="w-5 h-5" />
          Film
        </button>
        <div className="flex items-center gap-1.5 pr-3">
          <DueChip detail={detail} />
          <span className="text-[12px] text-muted-foreground" aria-hidden>·</span>
          <span className="text-[12px] text-muted-foreground tabular-nums">
            {clipDuration(detail.clip)}
          </span>
        </div>
      </div>

      {/* ── Video (full-bleed) ── */}
      <SimulatedClipPlayer
        title={detail.clip.title}
        durationMs={durationMs}
        halfSpeed={halfSpeed}
        replaySignal={replaySignal}
        onSecond={onSecond}
      />

      {/* ── Playback controls ── */}
      <div className="flex gap-2 px-4 mt-3">
        <button
          onClick={() => setReplaySignal((n) => n + 1)}
          className="flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl border border-border text-[13px] font-medium transition-opacity active:opacity-70"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <RotateCcw className="w-4 h-4" />
          Replay
        </button>
        <button
          onClick={() => setHalfSpeed((v) => !v)}
          aria-pressed={halfSpeed}
          className="min-h-[44px] px-4 rounded-xl border text-[13px] font-semibold transition-opacity active:opacity-70"
          style={{
            borderColor: halfSpeed ? ACCENT : "oklch(0.28 0.01 260)",
            color: halfSpeed ? ACCENT : undefined,
            background: halfSpeed ? ACCENT.replace(")", " / 0.10)") : "transparent",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          0.5×
        </button>
      </div>

      {/* ── Teaching point ── */}
      <div className="mx-4 mt-4 rounded-xl border border-border bg-card/50 p-4">
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-1.5"
          style={{ color: ACCENT }}
        >
          Coach
        </div>
        <p className="text-[16px] leading-relaxed">{detail.clip.note}</p>
      </div>

      {/* ── Response / summary ── */}
      {revisit ? (
        <div className="mx-4 mt-3 space-y-3">
          {reflection && (
            <div className="rounded-xl border border-border p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1.5">
                Your reflection
              </div>
              <p className="text-[14px] leading-relaxed">{reflection}</p>
            </div>
          )}
          {coachReply && (
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: ACCENT.replace(")", " / 0.35)") }}
            >
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-1.5"
                style={{ color: ACCENT }}
              >
                Coach replied
              </div>
              <p className="text-[14px] leading-relaxed">{coachReply}</p>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground px-1 py-2">
            <Check className="w-4 h-4" style={{ color: SUCCESS }} />
            Done ✓
          </div>
        </div>
      ) : submitted ? (
        <div className="mx-4 mt-6 flex flex-col items-center text-center py-8">
          <span
            className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
            style={{ background: SUCCESS.replace(")", " / 0.15)") }}
          >
            <Check className="w-7 h-7" style={{ color: SUCCESS }} />
          </span>
          <div className="text-[16px] font-semibold mb-4">Done ✓</div>
          <Link href="/app/player/film" asChild>
            <a
              className="min-h-[44px] px-5 rounded-xl flex items-center text-[14px] font-semibold"
              style={{ background: ACCENT.replace(")", " / 0.14)"), color: ACCENT }}
            >
              Back to Film
            </a>
          </Link>
        </div>
      ) : !watched ? (
        <div className="mx-4 mt-3 rounded-xl border border-border/60 p-4">
          <p className="text-[14px] text-muted-foreground/60">
            Watch the clip to respond.
          </p>
        </div>
      ) : (
        <div className="mx-4 mt-3 rounded-xl border border-border p-4">
          {requireResponse && (
            <>
              <label
                htmlFor="reflection"
                className="block text-[14px] font-medium mb-2"
              >
                {detail.responsePrompt ?? "What do you see?"}
              </label>
              <textarea
                id="reflection"
                ref={taRef}
                value={text}
                maxLength={HARD_CAP}
                rows={2}
                onChange={(e) => {
                  setText(e.target.value);
                  autoGrow();
                }}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-[15px] leading-relaxed resize-none outline-none focus:border-foreground/40"
                style={{ minHeight: 64 }}
              />
              <div
                className="text-right text-[11px] tabular-nums mt-1"
                style={{
                  color: overSoftCap ? "oklch(0.78 0.16 75)" : "oklch(0.55 0.02 260)",
                }}
              >
                {text.length}/{SOFT_CAP}
              </div>
              <ConfidenceRow value={confidence} onChange={setConfidence} />
            </>
          )}

          {/* Flag toggle — always available */}
          <button
            onClick={() => setFlagged((v) => !v)}
            aria-pressed={flagged}
            className="flex items-center gap-2 min-h-[44px] mt-2 text-[13px] underline underline-offset-4 transition-opacity active:opacity-70"
            style={{
              color: flagged ? ACCENT : "oklch(0.60 0.02 260)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {flagged && <Check className="w-4 h-4" />}
            I'd like to go over this with coach
          </button>

          {submitError && (
            <p className="text-[12px] mt-2" style={{ color: DANGER }}>
              Couldn't send — try again.
            </p>
          )}

          <button
            onClick={handleDone}
            disabled={!canSubmit}
            className="w-full min-h-[48px] rounded-xl mt-4 text-[15px] font-bold text-white transition-opacity active:opacity-80 disabled:opacity-40"
            style={{ background: ACCENT, WebkitTapHighlightColor: "transparent" }}
          >
            {submitting ? "Sending…" : requireResponse ? "Send & done" : "Done"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Page shell: loading / error / found ──────────────────────────────────── */

export default function PlayerClipReviewPage() {
  const params = useParams<{ assignmentId: string }>();
  const { data, isLoading, isError, refetch } = useAssignmentDetail(
    params.assignmentId,
  );

  return (
    <AppShell>
      {isLoading && (
        <div className="max-w-xl mx-auto px-4 pt-4 space-y-3" aria-hidden>
          <div className="h-8 w-24 rounded-lg bg-muted/30 animate-pulse" />
          <div className="w-full aspect-video rounded-xl bg-muted/30 animate-pulse" />
          <div className="h-24 rounded-xl bg-muted/30 animate-pulse" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="max-w-xl mx-auto px-4 pt-8">
          <div className="rounded-xl border border-border p-4 flex items-center justify-between gap-3">
            <span className="text-[13px] text-muted-foreground">
              Couldn't load this clip.
            </span>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 min-h-[44px] px-3 rounded-lg text-[13px] font-medium border border-border transition-opacity active:opacity-70"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
          <Link href="/app/player/film" asChild>
            <a className="inline-flex items-center gap-1 min-h-[44px] mt-2 px-1 text-[13px] text-muted-foreground">
              <ChevronLeft className="w-4 h-4" />
              Back to Film
            </a>
          </Link>
        </div>
      )}

      {!isLoading && !isError && data && <ClipReview detail={data} />}
    </AppShell>
  );
}
