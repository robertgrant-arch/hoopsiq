/**
 * FilmQueuePage — /app/coach/queue
 *
 * Sorted by AI priority:
 *  1. Low-confidence entries first (need human confirmation before action)
 *  2. Then by unreviewed clip count descending
 *
 * Acceptance criterion: low-confidence clips are visually prioritized
 * with a warning badge and "Review needed" label.
 */

import React from "react";
import { Link } from "wouter";
import {
  Film,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Clock,
  Eye,
  Target,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import {
  getSortedQueue,
  STATUS_CONFIG,
  EXTRACTED_CLIPS,
  type FilmEntry,
} from "@/lib/mock/film";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER = "oklch(0.68 0.22 25)";
const MUTED = "oklch(0.55 0.02 260)";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── Queue row ────────────────────────────────────────────────────────────────

function QueueRow({ film, rank }: { film: FilmEntry; rank: number }) {
  const isLowConf = film.processingStatus === "low_confidence";
  const clips = EXTRACTED_CLIPS.filter((c) => c.filmId === film.id);
  const unreviewedClips = clips.filter((c) => !c.actionState.isReviewed);
  const needsConfirmation = clips.filter((c) => c.needsConfirmation && !c.actionState.isReviewed);
  const cfg = STATUS_CONFIG[film.processingStatus];

  const borderColor = isLowConf
    ? WARNING.replace(")", " / 0.35)")
    : unreviewedClips.length > 0
    ? ACCENT.replace(")", " / 0.20)")
    : "oklch(0.22 0.01 260)";

  const bgColor = isLowConf
    ? WARNING.replace(")", " / 0.04)")
    : "oklch(0.12 0.005 260)";

  return (
    <Link href={`/app/coach/queue/${film.id}`} asChild>
      <a
        className="flex items-start gap-4 rounded-2xl border px-4 py-4 hover:brightness-110 transition-all active:scale-[0.99]"
        style={{ borderColor, background: bgColor }}
      >
        {/* Rank + thumbnail placeholder */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
            style={
              rank <= 2
                ? { background: isLowConf ? WARNING : ACCENT, color: "white" }
                : { background: "oklch(0.20 0.01 260)", color: MUTED }
            }
          >
            {rank}
          </span>
          <div
            className="w-16 h-12 rounded-lg flex items-center justify-center"
            style={{ background: "oklch(0.18 0.01 260)" }}
          >
            <Film className="w-5 h-5" style={{ color: MUTED }} />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-bold truncate">{film.title}</p>
            {isLowConf && (
              <span
                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: WARNING.replace(")", " / 0.14)"), color: WARNING }}
              >
                <AlertTriangle className="w-3 h-3" />
                Review required
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 text-[11px]" style={{ color: MUTED }}>
            <span>{formatDate(film.date)}</span>
            {film.duration && <><span>·</span><span>{film.duration}</span></>}
            {film.aiConfidence !== undefined && (
              <>
                <span>·</span>
                <span
                  style={{
                    color:
                      film.aiConfidence >= 0.75 ? SUCCESS : film.aiConfidence >= 0.65 ? WARNING : DANGER,
                  }}
                >
                  {Math.round(film.aiConfidence * 100)}% confidence
                </span>
              </>
            )}
          </div>

          {/* Clip stats */}
          <div className="flex items-center gap-3 text-[11.5px]">
            <span style={{ color: MUTED }}>
              <Sparkles className="inline w-3 h-3 mr-1" />
              {clips.length} clips
            </span>
            {needsConfirmation.length > 0 && (
              <span style={{ color: WARNING }}>
                <AlertTriangle className="inline w-3 h-3 mr-1" />
                {needsConfirmation.length} need confirmation
              </span>
            )}
            {unreviewedClips.length > 0 && (
              <span style={{ color: ACCENT }}>
                <Eye className="inline w-3 h-3 mr-1" />
                {unreviewedClips.length} unreviewed
              </span>
            )}
            {unreviewedClips.length === 0 && clips.length > 0 && (
              <span style={{ color: SUCCESS }}>
                <CheckCircle2 className="inline w-3 h-3 mr-1" />
                All reviewed
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {film.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: ACCENT.replace(")", " / 0.09)"), color: ACCENT }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right: status + chevron */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
          <ChevronRight className="w-4 h-4" style={{ color: MUTED }} />
        </div>
      </a>
    </Link>
  );
}

// ─── All-clear state ──────────────────────────────────────────────────────────

function AllClearCard() {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center space-y-3">
      <CheckCircle2 className="w-10 h-10 mx-auto" style={{ color: SUCCESS }} />
      <p className="text-[16px] font-bold">Queue is clear</p>
      <p className="text-[13px] text-muted-foreground max-w-xs mx-auto">
        All clips have been reviewed and actioned. Check back after your next upload.
      </p>
      <Link href="/app/coach/film" asChild>
        <a
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
          style={{ background: ACCENT, color: "white" }}
        >
          <Film className="w-4 h-4" />
          View Film Library
        </a>
      </Link>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FilmQueuePage(): React.ReactElement {
  const queue = getSortedQueue();

  const lowConfCount = queue.filter((f) => f.processingStatus === "low_confidence").length;
  const totalUnreviewed = queue.reduce((sum, f) => sum + (f.totalClips - f.reviewedClips), 0);

  return (
    <AppShell>
      <div className="px-4 lg:px-8 pb-24 max-w-3xl mx-auto pt-4 space-y-5">
        <PageHeader
          eyebrow="Coach · Film"
          title="Review Queue"
          subtitle={
            queue.length > 0
              ? `${totalUnreviewed} clips to review · AI-prioritized · low-confidence entries first`
              : "All clips reviewed."
          }
          actions={
            <Link href="/app/coach/film" asChild>
              <a className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border text-[13px] font-medium hover:bg-muted/30 transition-colors">
                <Film className="w-3.5 h-3.5" />
                Library
              </a>
            </Link>
          }
        />

        {/* Priority callout */}
        {lowConfCount > 0 && (
          <div
            className="rounded-xl border px-4 py-3 flex items-start gap-3"
            style={{
              borderColor: WARNING.replace(")", " / 0.30)"),
              background: WARNING.replace(")", " / 0.06)"),
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: WARNING }} />
            <div>
              <p className="text-[13px] font-semibold">
                {lowConfCount} session{lowConfCount !== 1 ? "s" : ""} need confirmation
              </p>
              <p className="text-[12px] leading-relaxed" style={{ color: MUTED }}>
                AI confidence was below threshold. Review clips and confirm or override labels before
                assigning to players.
              </p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] px-1">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" style={{ color: WARNING }} />
            <span style={{ color: MUTED }}>Review required first</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" style={{ color: ACCENT }} />
            <span style={{ color: MUTED }}>Unreviewed clips</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="w-3 h-3" style={{ color: SUCCESS }} />
            <span style={{ color: MUTED }}>Actioned</span>
          </div>
        </div>

        {/* Queue list */}
        {queue.length === 0 ? (
          <AllClearCard />
        ) : (
          <div className="space-y-3">
            {queue.map((film, i) => (
              <QueueRow key={film.id} film={film} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
