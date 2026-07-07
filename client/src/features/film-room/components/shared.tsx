/**
 * Film Room v2 — shared presentational atoms.
 * Labels follow docs/film-room-copy.md verbatim.
 */

import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import type {
  AssignmentStatus,
  ClipStatus,
  FilmStatus,
  RosterPlayer,
} from "../types";

// ── Palette (matches coach-page idiom) ─────────────────────────────────────

export const ACCENT = "oklch(0.72 0.18 290)";
export const SUCCESS = "oklch(0.75 0.12 140)";
export const WARNING = "oklch(0.78 0.16 75)";
export const DANGER = "oklch(0.68 0.22 25)";
export const MUTED = "oklch(0.55 0.02 260)";
export const INFO = "oklch(0.65 0.15 230)";

type PillTone = { label: string; color: string; bg: string };

const tone = (label: string, color: string): PillTone => ({
  label,
  color,
  bg: color.replace(")", " / 0.14)").replace("oklch(", "oklch("),
});

// docs/film-room-copy.md — "Status labels"
const FILM_PILLS: Record<FilmStatus, PillTone> = {
  uploading: tone("Uploading", INFO),
  processing: tone("Processing", WARNING),
  ready: tone("Ready to clip", SUCCESS),
  failed: tone("Upload failed", DANGER),
  archived: tone("Archived", MUTED),
};

const CLIP_PILLS: Record<ClipStatus, PillTone> = {
  suggested: tone("Suggested", WARNING),
  draft: tone("Draft", MUTED),
  approved: tone("Approved", SUCCESS),
  assigned: tone("Sent", INFO),
  archived: tone("Archived", MUTED),
};

const ASSIGNMENT_PILLS: Record<AssignmentStatus, PillTone> = {
  draft: tone("Not sent", MUTED),
  assigned: tone("Sent", INFO),
  opened: tone("Opened", INFO),
  watched: tone("Watched", WARNING),
  responded: tone("Responded", SUCCESS),
  completed: tone("Closed", MUTED),
  archived: tone("Archived", MUTED),
};

export function StatusPill(
  props:
    | { kind: "film"; status: FilmStatus }
    | { kind: "clip"; status: ClipStatus }
    | { kind: "assignment"; status: AssignmentStatus }
) {
  const t =
    props.kind === "film"
      ? FILM_PILLS[props.status]
      : props.kind === "clip"
        ? CLIP_PILLS[props.status]
        : ASSIGNMENT_PILLS[props.status];
  return (
    <span
      className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: t.color, background: t.bg }}
    >
      {t.label}
    </span>
  );
}

/** Status → dot color, for clip-rail rows and timeline spans. */
export function clipStatusColor(status: ClipStatus): string {
  switch (status) {
    case "suggested":
      return WARNING;
    case "approved":
      return SUCCESS;
    case "assigned":
      return INFO;
    case "draft":
    case "archived":
    default:
      return MUTED;
  }
}

// ── DueChip ─────────────────────────────────────────────────────────────────

const DAY = 86_400_000;
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function dueLabel(dueAt: string): { label: string; overdue: boolean } {
  const due = new Date(dueAt);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const dayDiff = Math.floor((due.getTime() - startOfToday.getTime()) / DAY);
  if (due.getTime() < Date.now() && dayDiff < 0) return { label: "Overdue", overdue: true };
  if (dayDiff <= 0) return { label: "Due today", overdue: false };
  if (dayDiff === 1) return { label: "Due tomorrow", overdue: false };
  if (dayDiff < 7) return { label: `Due ${WEEKDAY[due.getDay()]}`, overdue: false };
  return {
    label: `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    overdue: false,
  };
}

export function DueChip({ dueAt, done }: { dueAt: string | null; done?: boolean }) {
  if (!dueAt) return <span className="text-[11px]" style={{ color: MUTED }}>—</span>;
  const { label, overdue } = dueLabel(dueAt);
  const showOverdue = overdue && !done;
  return (
    <span
      className="inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap"
      style={
        showOverdue
          ? { color: DANGER, background: "oklch(0.68 0.22 25 / 0.14)" }
          : { color: MUTED }
      }
    >
      {done && overdue
        ? new Date(dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : label}
    </span>
  );
}

// ── Chips ───────────────────────────────────────────────────────────────────

export function PlayerChips({
  playerIds,
  roster,
  max = 3,
}: {
  playerIds: string[];
  roster: RosterPlayer[];
  max?: number;
}) {
  if (!playerIds.length) return null;
  const shown = playerIds.slice(0, max);
  const extra = playerIds.length - shown.length;
  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {shown.map((id) => {
        const p = roster.find((r) => r.id === id);
        return (
          <span
            key={id}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[oklch(0.22_0.01_260)]"
            style={{ color: "oklch(0.85 0.02 260)" }}
            title={p?.name}
          >
            {p?.jersey ? `#${p.jersey}` : (p?.name ?? id)}
          </span>
        );
      })}
      {extra > 0 && (
        <span className="text-[10px]" style={{ color: MUTED }}>
          +{extra}
        </span>
      )}
    </span>
  );
}

export function CategoryChips({ categories }: { categories: string[] }) {
  if (!categories.length) return null;
  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {categories.map((c) => (
        <span
          key={c}
          className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded"
          style={{ color: ACCENT, background: "oklch(0.72 0.18 290 / 0.12)" }}
        >
          {c}
        </span>
      ))}
    </span>
  );
}

// ── Region error + skeletons ────────────────────────────────────────────────

export function RegionError({
  message = "Something went wrong loading this.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[12px]"
      style={{ borderColor: "oklch(0.68 0.22 25 / 0.35)", color: DANGER }}
    >
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span className="flex-1 min-w-0">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded hover:bg-[oklch(0.68_0.22_25_/_0.12)] transition-colors"
          style={{ color: DANGER }}
        >
          <RotateCcw className="w-3 h-3" />
          Retry
        </button>
      )}
    </div>
  );
}

export function SkeletonRows({
  count = 4,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-10 rounded-md animate-pulse bg-[oklch(0.20_0.01_260)]"
        />
      ))}
    </div>
  );
}
