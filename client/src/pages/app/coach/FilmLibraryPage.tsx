/**
 * FilmLibraryPage — /app/coach/film
 *
 * Film library with:
 *  - Upload/import states (uploading, queued, processing, ready, failed, low_confidence)
 *  - Opponent/practice tags and filter bar
 *  - Processing status indicators with progress bars
 *  - Empty state and error states
 *  - Quick links to queue and upload
 */

import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Film,
  Upload,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Filter,
  Plus,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";
import {
  FILM_LIBRARY,
  STATUS_CONFIG,
  type FilmEntry,
  type ProcessingStatus,
  type FilmType,
} from "@/lib/mock/film";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER = "oklch(0.68 0.22 25)";
const MUTED = "oklch(0.55 0.02 260)";
const INFO = "oklch(0.65 0.15 230)";

const TYPE_LABELS: Record<FilmType, string> = {
  game: "Game",
  practice: "Practice",
  drill_session: "Drill",
  scrimmage: "Scrimmage",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (d === 0 && h === 0) return "Just now";
  if (d === 0) return `${h}h ago`;
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProcessingStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Processing progress bar ──────────────────────────────────────────────────

function ProcessingBar({ status, progress }: { status: ProcessingStatus; progress?: number }) {
  if (status === "uploading" || status === "processing") {
    const pct = progress ?? 0;
    const color = status === "uploading" ? INFO : WARNING;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]" style={{ color: MUTED }}>
          <span>{status === "uploading" ? "Uploading…" : "Analyzing with AI…"}</span>
          <span className="font-mono">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-[oklch(0.20_0.01_260)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      </div>
    );
  }
  if (status === "queued") {
    return (
      <p className="text-[11px]" style={{ color: MUTED }}>
        <Clock className="inline w-3 h-3 mr-1" />
        Waiting in queue
      </p>
    );
  }
  return null;
}

// ─── Review progress ─────────────────────────────────────────────────────────

function ReviewProgress({ film }: { film: FilmEntry }) {
  if (film.totalClips === 0) return null;
  const pct = Math.round((film.reviewedClips / film.totalClips) * 100);
  const allDone = film.reviewedClips === film.totalClips;
  return (
    <div className="flex items-center gap-2 text-[11px]">
      {allDone ? (
        <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: SUCCESS }} />
      ) : (
        <Sparkles className="w-3 h-3 shrink-0" style={{ color: ACCENT }} />
      )}
      <span style={{ color: allDone ? SUCCESS : MUTED }}>
        {film.reviewedClips}/{film.totalClips} clips reviewed
      </span>
      <div className="flex-1 h-1 rounded-full overflow-hidden bg-[oklch(0.20_0.01_260)]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: allDone ? SUCCESS : ACCENT,
          }}
        />
      </div>
    </div>
  );
}

// ─── Film card ────────────────────────────────────────────────────────────────

function FilmCard({ film }: { film: FilmEntry }) {
  const isActionable = film.processingStatus === "ready" || film.processingStatus === "low_confidence";
  const isFailed = film.processingStatus === "failed";
  const isActive = film.processingStatus === "uploading" || film.processingStatus === "processing";

  const typeColor = film.type === "game" ? DANGER : film.type === "scrimmage" ? WARNING : SUCCESS;

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-150"
      style={{
        borderColor:
          film.processingStatus === "low_confidence"
            ? WARNING.replace(")", " / 0.30)")
            : film.processingStatus === "failed"
            ? DANGER.replace(")", " / 0.25)")
            : "oklch(0.22 0.01 260)",
        background:
          film.processingStatus === "low_confidence"
            ? WARNING.replace(")", " / 0.04)")
            : film.processingStatus === "failed"
            ? DANGER.replace(")", " / 0.04)")
            : "oklch(0.12 0.005 260)",
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: typeColor.replace(")", " / 0.12)"),
                  color: typeColor,
                }}
              >
                {TYPE_LABELS[film.type]}
              </span>
              <StatusBadge status={film.processingStatus} />
            </div>
            <h3 className="text-[14px] font-bold leading-tight">{film.title}</h3>
            {film.opponent && (
              <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                vs. {film.opponent}
              </p>
            )}
          </div>

          {/* AI confidence ring (only when ready) */}
          {film.aiConfidence !== undefined && isActionable && (
            <div className="shrink-0 text-center">
              <p
                className="text-[16px] font-bold tabular-nums"
                style={{
                  color:
                    film.aiConfidence >= 0.75
                      ? SUCCESS
                      : film.aiConfidence >= 0.65
                      ? WARNING
                      : DANGER,
                }}
              >
                {Math.round(film.aiConfidence * 100)}%
              </p>
              <p className="text-[9px] uppercase tracking-wide" style={{ color: MUTED }}>
                AI conf
              </p>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px]" style={{ color: MUTED }}>
          <span>{formatDate(film.date)}</span>
          {film.duration && <><span>·</span><span>{film.duration}</span></>}
          {film.fileSizeMb && (
            <><span>·</span><span>{(film.fileSizeMb / 1024).toFixed(1)} GB</span></>
          )}
        </div>

        {/* Tags */}
        {film.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {film.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: ACCENT.replace(")", " / 0.10)"), color: ACCENT }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pb-3 space-y-2">
        {/* Processing bar */}
        <ProcessingBar status={film.processingStatus} progress={film.processingProgress} />

        {/* Review progress */}
        <ReviewProgress film={film} />

        {/* Error message */}
        {isFailed && film.errorMessage && (
          <div
            className="rounded-lg border px-3 py-2 flex items-start gap-2"
            style={{
              borderColor: DANGER.replace(")", " / 0.25)"),
              background: DANGER.replace(")", " / 0.06)"),
            }}
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: DANGER }} />
            <p className="text-[11.5px] leading-snug">{film.errorMessage}</p>
          </div>
        )}

        {/* Low confidence alert */}
        {film.processingStatus === "low_confidence" && (
          <div
            className="rounded-lg border px-3 py-2 flex items-center gap-2"
            style={{
              borderColor: WARNING.replace(")", " / 0.30)"),
              background: WARNING.replace(")", " / 0.06)"),
            }}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: WARNING }} />
            <p className="text-[11.5px] leading-snug">
              <span className="font-semibold">Coach review required</span> before clips can be actioned.
              AI confidence below threshold.
            </p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-[oklch(0.20_0.01_260)] px-4 py-2.5 flex items-center justify-between gap-2">
        <span className="text-[10px]" style={{ color: MUTED }}>
          {timeAgo(film.uploadedAt)} · {film.uploadedBy}
        </span>
        <div className="flex items-center gap-2">
          {isFailed && (
            <button
              type="button"
              onClick={() => toast("Re-upload initiated.")}
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/30 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Retry
            </button>
          )}
          {isActive && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: WARNING }}>
              <Loader2 className="w-3 h-3 animate-spin" />
              In progress
            </span>
          )}
          {isActionable && (
            <Link href={`/app/coach/queue/${film.id}`}>
              <a
                className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: ACCENT.replace(")", " / 0.12)"), color: ACCENT }}
              >
                Review clips
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

type StatusFilter = ProcessingStatus | "all";
type TypeFilter = FilmType | "all";

function FilterBar({
  status,
  type,
  onStatus,
  onType,
}: {
  status: StatusFilter;
  type: TypeFilter;
  onStatus: (s: StatusFilter) => void;
  onType: (t: TypeFilter) => void;
}) {
  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "low_confidence", label: "Review needed" },
    { value: "ready", label: "Ready" },
    { value: "processing", label: "Processing" },
    { value: "failed", label: "Failed" },
  ];
  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: "all", label: "All types" },
    { value: "game", label: "Game" },
    { value: "practice", label: "Practice" },
    { value: "scrimmage", label: "Scrimmage" },
    { value: "drill_session", label: "Drill" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex rounded-xl overflow-hidden border border-border">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onStatus(opt.value)}
            className="px-3 py-1.5 text-[11px] font-semibold transition-colors"
            style={
              status === opt.value
                ? { background: ACCENT, color: "white" }
                : { color: MUTED }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex rounded-xl overflow-hidden border border-border">
        {typeOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onType(opt.value)}
            className="px-3 py-1.5 text-[11px] font-semibold transition-colors"
            style={
              type === opt.value
                ? { background: ACCENT, color: "white" }
                : { color: MUTED }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  const [, setLocation] = useLocation();
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center space-y-4">
      <Film className="w-10 h-10 mx-auto text-muted-foreground" />
      <p className="text-[15px] font-semibold">
        {hasFilters ? "No film matches these filters" : "No film uploaded yet"}
      </p>
      <p className="text-[13px] text-muted-foreground max-w-xs mx-auto">
        {hasFilters
          ? "Try adjusting your filters or clear them to see all film."
          : "Upload your first game or practice film to start generating AI insights."}
      </p>
      {!hasFilters && (
        <button
          type="button"
          onClick={() => setLocation("/app/coach/film/upload")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
          style={{ background: ACCENT, color: "white" }}
        >
          <Upload className="w-4 h-4" />
          Upload Film
        </button>
      )}
    </div>
  );
}

// ─── Stats strip ─────────────────────────────────────────────────────────────

function StatsStrip() {
  const ready = FILM_LIBRARY.filter((f) => f.processingStatus === "ready").length;
  const lowConf = FILM_LIBRARY.filter((f) => f.processingStatus === "low_confidence").length;
  const inProgress = FILM_LIBRARY.filter(
    (f) => f.processingStatus === "processing" || f.processingStatus === "uploading"
  ).length;
  const totalUnreviewed = FILM_LIBRARY.filter(
    (f) => f.processingStatus === "ready" || f.processingStatus === "low_confidence"
  ).reduce((sum, f) => sum + (f.totalClips - f.reviewedClips), 0);

  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: "Ready", value: ready, color: SUCCESS },
        { label: "Review needed", value: lowConf, color: WARNING },
        { label: "Processing", value: inProgress, color: INFO },
        { label: "Clips unreviewed", value: totalUnreviewed, color: ACCENT },
      ].map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-border bg-card px-3 py-2.5 text-center"
        >
          <p className="text-[20px] font-bold tabular-nums" style={{ color: s.color }}>
            {s.value}
          </p>
          <p className="text-[10px] uppercase tracking-wide" style={{ color: MUTED }}>
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FilmLibraryPage(): React.ReactElement {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = FILM_LIBRARY.filter((f) => {
    if (statusFilter !== "all" && f.processingStatus !== statusFilter) return false;
    if (typeFilter !== "all" && f.type !== typeFilter) return false;
    if (
      search &&
      !f.title.toLowerCase().includes(search.toLowerCase()) &&
      !f.tags.some((t) => t.includes(search.toLowerCase())) &&
      !(f.opponent ?? "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const hasFilters = statusFilter !== "all" || typeFilter !== "all" || search !== "";

  return (
    <AppShell>
      <div className="px-4 lg:px-8 pb-24 max-w-4xl mx-auto pt-4 space-y-5">
        <PageHeader
          eyebrow="Coach · Film"
          title="Film Library"
          subtitle="Upload game and practice film. AI extracts clips, flags issues, and surfaces actions."
          actions={
            <button
              type="button"
              onClick={() => setLocation("/app/coach/film/upload")}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold"
              style={{ background: ACCENT, color: "white" }}
            >
              <Plus className="w-4 h-4" />
              Upload
            </button>
          }
        />

        <StatsStrip />

        {/* Search + filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: MUTED }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, tag, or opponent…"
              className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
            />
          </div>
          <FilterBar
            status={statusFilter}
            type={typeFilter}
            onStatus={setStatusFilter}
            onType={setTypeFilter}
          />
        </div>

        {/* Queue shortcut */}
        <Link href="/app/coach/queue">
          <a
            className="flex items-center justify-between rounded-xl border px-4 py-3 transition-all hover:border-primary/40"
            style={{
              borderColor: ACCENT.replace(")", " / 0.25)"),
              background: ACCENT.replace(")", " / 0.04)"),
            }}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4" style={{ color: ACCENT }} />
              <div>
                <p className="text-[13px] font-semibold">Review Queue</p>
                <p className="text-[11px]" style={{ color: MUTED }}>
                  AI-prioritized — low-confidence clips reviewed first
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: MUTED }} />
          </a>
        </Link>

        {/* Film grid */}
        {filtered.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground px-1">
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
            </p>
            {filtered.map((film) => (
              <FilmCard key={film.id} film={film} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
