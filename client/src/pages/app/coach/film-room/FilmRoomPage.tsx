/**
 * FilmRoomPage — /app/coach/film-room
 *
 * Film Room landing = Library with the Needs-Attention work strip.
 * Spec: docs/film-room-ia.md · copy: docs/film-room-copy.md.
 */

import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { ChevronRight, Film, Upload } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useAttention, useFilms } from "@/features/film-room/hooks";
import type { FilmKind, FilmStatus, FilmSummary } from "@/features/film-room/types";
import {
  ACCENT,
  DANGER,
  MUTED,
  RegionError,
  SkeletonRows,
  StatusPill,
  SUCCESS,
  WARNING,
} from "@/features/film-room/components/shared";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CHIP: Record<FilmKind, string> = {
  game: "GAME",
  practice: "PRACTICE",
  skill_rep: "SKILL REP",
  highlight: "HIGHLIGHT",
};

const TYPE_FILTERS: Array<{ value: FilmKind | "all"; label: string }> = [
  { value: "all", label: "All types" },
  { value: "game", label: "Game" },
  { value: "practice", label: "Practice" },
  { value: "skill_rep", label: "Skill rep" },
  { value: "highlight", label: "Highlight" },
];

const STATUS_FILTERS: Array<{ value: FilmStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "ready", label: "Ready to clip" },
  { value: "processing", label: "Processing" },
  { value: "uploading", label: "Uploading" },
  { value: "failed", label: "Upload failed" },
  { value: "archived", label: "Archived" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Coverage cells per copy doc: "6 clips · 2 not sent" · "9 sent · 3 unwatched · 1 overdue" */
function clipCoverage(f: FilmSummary): string {
  if (f.clipCount === 0) return "No clips yet";
  return `${f.clipCount} clip${f.clipCount === 1 ? "" : "s"}`;
}

function assignmentCoverage(f: FilmSummary): React.ReactNode {
  if (f.sentCount === 0) return <span style={{ color: MUTED }}>—</span>;
  return (
    <span>
      {f.sentCount} sent
      {f.unwatchedCount > 0 && <span style={{ color: WARNING }}> · {f.unwatchedCount} unwatched</span>}
      {f.overdueCount > 0 && <span style={{ color: DANGER }}> · {f.overdueCount} overdue</span>}
    </span>
  );
}

// ─── Needs-Attention strip ────────────────────────────────────────────────────

function AttentionStrip() {
  const attention = useAttention();

  if (attention.isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[68px] rounded-lg animate-pulse bg-[oklch(0.20_0.01_260)]" />
        ))}
      </div>
    );
  }
  if (attention.isError) {
    return <RegionError message="Couldn't load your work strip." onRetry={() => attention.refetch()} />;
  }

  const a = attention.data!;
  const cards: Array<{ count: number; label: string; href: string; color: string }> = [
    { count: a.readyToClip, label: "films ready to clip", href: "/app/coach/film-room", color: SUCCESS },
    { count: a.readyToSend, label: "clips ready to send", href: "/app/coach/film-room/assignments?filter=ready", color: ACCENT },
    { count: a.awaitingPlayers, label: "waiting on players", href: "/app/coach/film-room/assignments?filter=waiting", color: WARNING },
    { count: a.overdue, label: "overdue — follow up", href: "/app/coach/film-room/assignments?filter=overdue", color: DANGER },
  ];

  if (cards.every((c) => c.count === 0)) {
    return (
      <div className="rounded-lg border border-border px-3 py-2.5 text-[12px]" style={{ color: SUCCESS }}>
        All caught up.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {cards.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className="group rounded-lg border border-border px-3 py-2.5 hover:border-[oklch(0.35_0.02_260)] transition-colors"
        >
          <div className="text-lg font-bold leading-none font-mono" style={{ color: c.color }}>
            {c.count}
          </div>
          <div className="text-[11px] mt-1 flex items-center gap-1" style={{ color: MUTED }}>
            {c.label}
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className="text-[11px] px-2 py-1 rounded-full border transition-colors"
          style={
            value === o.value
              ? { color: ACCENT, borderColor: ACCENT, background: "oklch(0.72 0.18 290 / 0.12)" }
              : { color: MUTED, borderColor: "oklch(0.28 0.01 260)" }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Film row ─────────────────────────────────────────────────────────────────

function FilmRow({ film }: { film: FilmSummary }) {
  const [, navigate] = useLocation();
  const openable = film.status === "ready";

  return (
    <div
      role={openable ? "button" : undefined}
      tabIndex={openable ? 0 : undefined}
      onClick={() => openable && navigate(`/app/coach/film-room/${film.id}`)}
      onKeyDown={(e) => {
        if (openable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          navigate(`/app/coach/film-room/${film.id}`);
        }
      }}
      className={`grid grid-cols-[1fr_auto] lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-2.5 rounded-lg border border-border transition-colors ${
        openable ? "cursor-pointer hover:border-[oklch(0.38_0.02_260)] hover:bg-[oklch(0.19_0.01_260)]" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[9px] font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded shrink-0"
            style={{ color: ACCENT, background: "oklch(0.72 0.18 290 / 0.12)" }}
          >
            {TYPE_CHIP[film.kind]}
          </span>
          <span className="text-[13px] font-medium truncate">{film.title}</span>
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: MUTED }}>
          {film.opponent ? `${film.opponent} · ` : ""}
          {formatDate(film.playedAt)}
          {film.durationSeconds != null && (
            <span className="font-mono"> · {formatDuration(film.durationSeconds)}</span>
          )}
        </div>
        {film.status === "processing" && (
          <div className="text-[11px] mt-1" style={{ color: WARNING }}>
            Processing — usually a few minutes. We'll notify you.
          </div>
        )}
        {film.status === "failed" && (
          <div className="text-[11px] mt-1" style={{ color: DANGER }}>
            Upload failed — something went wrong. <span className="underline">Try again</span>
          </div>
        )}
      </div>

      <div className="hidden lg:block text-[12px]" style={{ color: MUTED }}>
        {clipCoverage(film)}
      </div>
      <div className="hidden lg:block text-[12px]" style={{ color: MUTED }}>
        {assignmentCoverage(film)}
      </div>

      <div className="flex items-center gap-2 justify-self-end">
        <StatusPill kind="film" status={film.status} />
        {openable && <ChevronRight className="w-4 h-4" style={{ color: MUTED }} />}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FilmRoomPage(): React.ReactElement {
  const films = useFilms();
  const [, navigate] = useLocation();
  const [typeFilter, setTypeFilter] = useState<FilmKind | "all">("all");
  const [statusFilter, setStatusFilter] = useState<FilmStatus | "all">("all");

  const hasFilters = typeFilter !== "all" || statusFilter !== "all";
  const filtered = (films.data ?? []).filter(
    (f) =>
      (typeFilter === "all" || f.kind === typeFilter) &&
      (statusFilter === "all" || f.status === statusFilter)
  );

  const uploadCta = () => {
    toast("Upload flows through the existing Film Upload page");
    navigate("/app/coach/film/upload");
  };

  return (
    <AppShell>
      <div className="px-4 lg:px-8 pb-24 max-w-5xl mx-auto pt-4 space-y-5">
        <PageHeader
          eyebrow="Coach · Film"
          title="Film Room"
          subtitle="Upload film, cut clips, send them to players."
          actions={
            <button
              type="button"
              onClick={uploadCta}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold text-black"
              style={{ background: ACCENT }}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload film
            </button>
          }
        />

        <AttentionStrip />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <FilterChips options={TYPE_FILTERS} value={typeFilter} onChange={setTypeFilter} />
          <FilterChips options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
        </div>

        {films.isLoading ? (
          <SkeletonRows count={5} />
        ) : films.isError ? (
          <RegionError message="Couldn't load your film library." onRetry={() => films.refetch()} />
        ) : (films.data ?? []).length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center space-y-2">
            <Film className="w-8 h-8 mx-auto" style={{ color: MUTED }} />
            <button
              type="button"
              onClick={uploadCta}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold text-black"
              style={{ background: ACCENT }}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload your first film
            </button>
            <p className="text-[12px]" style={{ color: MUTED }}>
              Game, practice, or skill work — clips come next.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center space-y-2">
            <p className="text-[13px]" style={{ color: MUTED }}>
              No film matches these filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setTypeFilter("all");
                setStatusFilter("all");
              }}
              className="text-[12px] font-medium underline"
              style={{ color: ACCENT }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">{filtered.map((f) => <FilmRow key={f.id} film={f} />)}</div>
        )}
      </div>
    </AppShell>
  );
}
