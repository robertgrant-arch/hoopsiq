/**
 * AssignmentQueuePage — /app/coach/film-room/assignments
 *
 * One row = one clip assignment (clip × player). Attention-order sort.
 * Spec: docs/film-room-assignment-queue.md · copy: docs/film-room-copy.md.
 */

import React, { useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import {
  useAssignmentDetail,
  useAssignmentQueue,
  useFilmRoster,
  useFollowup,
} from "@/features/film-room/hooks";
import type { QueueRow } from "@/features/film-room/types";
import {
  ACCENT,
  DANGER,
  DueChip,
  MUTED,
  RegionError,
  SkeletonRows,
  StatusPill,
  SUCCESS,
  WARNING,
} from "@/features/film-room/components/shared";
import { IdpEscalatePanel } from "@/features/film-room/components/IdpEscalatePanel";

// ─── Filters ──────────────────────────────────────────────────────────────────

type QueueFilter = "all" | "overdue" | "waiting" | "responded" | "closed";

const FILTER_OPTIONS: Array<{ value: QueueFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "waiting", label: "Waiting on players" },
  { value: "responded", label: "Responded" },
  { value: "closed", label: "Closed" },
];

function initialFilter(search: string): QueueFilter {
  const f = new URLSearchParams(search).get("filter");
  if (f === "overdue") return "overdue";
  if (f === "waiting") return "waiting";
  if (f === "responded") return "responded";
  if (f === "closed") return "closed";
  return "all";
}

function matchesFilter(r: QueueRow, f: QueueFilter): boolean {
  switch (f) {
    case "overdue":
      return r.overdue;
    case "waiting":
      return r.status === "assigned" || r.status === "opened";
    case "responded":
      return r.status === "responded";
    case "closed":
      return r.status === "completed" || r.status === "archived";
    case "all":
    default:
      return true;
  }
}

// ─── Attention-order comparator ───────────────────────────────────────────────
// overdue first → responded-awaiting-follow-up → assigned/opened oldest →
// watched → completed newest first. Ties break by due date ascending.

function attentionRank(r: QueueRow): number {
  if (r.overdue) return 0;
  if (r.status === "responded") return 1;
  if (r.status === "assigned" || r.status === "opened") return 2;
  if (r.status === "watched") return 3;
  return 4;
}

export function attentionCompare(a: QueueRow, b: QueueRow): number {
  const ra = attentionRank(a);
  const rb = attentionRank(b);
  if (ra !== rb) return ra - rb;
  if (ra === 2) {
    // staleness rises: oldest sent first
    return (a.sentAt ?? "").localeCompare(b.sentAt ?? "");
  }
  if (ra === 4) {
    // completed, newest first
    return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
  }
  return (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999");
}

// ─── Status glyph cluster ─────────────────────────────────────────────────────

function Glyph({ symbol, label, color }: { symbol: string; label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-mono" title={label} style={{ color }}>
      {symbol}
    </span>
  );
}

function GlyphCluster({ row }: { row: QueueRow }) {
  const watch = row.watchedAt
    ? { symbol: "W✓", label: `Watched ${row.watchPct}%`, color: SUCCESS }
    : row.openedAt
      ? { symbol: "W◐", label: "Opened, not fully watched", color: WARNING }
      : { symbol: "W—", label: "Not opened", color: MUTED };
  const resp = row.respondedAt
    ? { symbol: "R✓", label: "Responded", color: SUCCESS }
    : row.requireResponse
      ? { symbol: "R—", label: "No response yet", color: MUTED }
      : { symbol: "R✗", label: "Response not required", color: MUTED };
  const followup = row.completedAt
    ? { symbol: "F✓", label: "Closed", color: SUCCESS }
    : { symbol: "F—", label: "Not closed", color: MUTED };
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <Glyph {...watch} />
      <Glyph {...resp} />
      <Glyph {...followup} />
      {row.reviewRequested && (
        <span title="Player asked to go over this with coach" className="text-[12px]">
          🙋
        </span>
      )}
      {row.nudgeCount > 0 && (
        <span className="text-[10px]" style={{ color: MUTED }} title={`${row.nudgeCount} reminder${row.nudgeCount === 1 ? "" : "s"} sent`}>
          {row.nudgeCount}× reminded
        </span>
      )}
    </span>
  );
}

// ─── Expanded row body ────────────────────────────────────────────────────────

function timeStamp(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ExpandedRow({
  row,
  onOpenIdp,
}: {
  row: QueueRow;
  onOpenIdp: (row: QueueRow) => void;
}) {
  const detail = useAssignmentDetail(row.id);
  const followup = useFollowup(row.id);
  const [reply, setReply] = useState("");
  const [remindBlocked, setRemindBlocked] = useState(false);

  const firstName = row.player.name.split(" ")[0];

  const sendReply = () => {
    if (!reply.trim() || followup.isPending) return;
    followup.mutate(
      { kind: "reply", body: reply.trim() },
      {
        onSuccess: () => {
          setReply("");
          toast.success(`Reply sent to ${firstName}.`);
        },
      }
    );
  };

  const close = () =>
    followup.mutate({ kind: "complete" }, { onSuccess: () => toast.success("Closed.") });

  const remind = () =>
    followup.mutate(
      { kind: "nudge" },
      {
        onSuccess: () => toast.success(`Reminder sent to ${firstName}.`),
        onError: (e) => {
          if (String(e).includes("429") || String(e).toLowerCase().includes("12 hours")) {
            setRemindBlocked(true);
          }
        },
      }
    );

  const events: Array<{ label: string; at: string | null }> = [
    { label: "Sent", at: row.sentAt },
    { label: "Opened", at: row.openedAt },
    { label: row.watchedAt ? `Watched ${row.watchPct}%` : "Watched", at: row.watchedAt },
    { label: "Responded", at: row.respondedAt },
  ];

  const latestResponse = detail.data?.reviews.filter((r) => r.textBody).slice(-1)[0];

  return (
    <div className="px-3 pb-3 pt-1 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)] border-t border-border">
      {/* Coach note */}
      <div className="min-w-0 pt-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: MUTED }}>
          Teaching point
        </div>
        {detail.isLoading ? (
          <div className="h-10 rounded animate-pulse bg-[oklch(0.20_0.01_260)]" />
        ) : detail.isError ? (
          <RegionError message="Couldn't load this assignment." onRetry={() => detail.refetch()} />
        ) : (
          <p className="text-[12px] leading-relaxed" style={{ color: "oklch(0.80 0.02 260)" }}>
            {detail.data?.clip.note || <span style={{ color: MUTED }}>No note.</span>}
          </p>
        )}
      </div>

      {/* Event mini-timeline */}
      <div className="pt-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: MUTED }}>
          Timeline
        </div>
        <ol className="space-y-0.5">
          {events.map((e) => (
            <li key={e.label} className="flex items-center gap-2 text-[11px]">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: e.at ? SUCCESS : "oklch(0.30 0.01 260)" }}
              />
              <span style={{ color: e.at ? "oklch(0.80 0.02 260)" : MUTED }}>{e.label}</span>
              <span className="font-mono ml-auto" style={{ color: MUTED }}>
                {timeStamp(e.at)}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Latest response + actions */}
      <div className="min-w-0 pt-2 space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: MUTED }}>
          Latest response
        </div>
        {detail.isLoading ? (
          <div className="h-8 rounded animate-pulse bg-[oklch(0.20_0.01_260)]" />
        ) : latestResponse ? (
          <p className="text-[12px] leading-relaxed italic" style={{ color: "oklch(0.80 0.02 260)" }}>
            "{latestResponse.textBody}"
          </p>
        ) : (
          <p className="text-[12px]" style={{ color: MUTED }}>
            No response yet.
          </p>
        )}

        <div className="flex gap-1.5">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={1}
            placeholder={`Reply to ${firstName}…`}
            className="flex-1 rounded-md border border-border bg-transparent px-2 py-1 text-[12px] outline-none resize-none focus:border-[oklch(0.72_0.18_290)]"
          />
          <button
            type="button"
            onClick={sendReply}
            disabled={!reply.trim() || followup.isPending}
            className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-black disabled:opacity-40 self-stretch"
            style={{ background: ACCENT }}
          >
            {followup.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reply"}
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={close}
            disabled={followup.isPending || !!row.completedAt}
            className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-[oklch(0.20_0.01_260)] disabled:opacity-40"
          >
            Close
          </button>
          <button
            type="button"
            onClick={remind}
            disabled={followup.isPending || remindBlocked}
            title={remindBlocked ? "Already reminded in the last 12 hours." : undefined}
            className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-[oklch(0.20_0.01_260)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Remind
          </button>
          <button
            type="button"
            onClick={() => onOpenIdp(row)}
            className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-[oklch(0.20_0.01_260)]"
          >
            Add to IDP
          </button>
        </div>
        {followup.isError && !remindBlocked && (
          <RegionError message="Action failed." />
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssignmentQueuePage(): React.ReactElement {
  const search = useSearch();
  const queue = useAssignmentQueue();
  const rosterQuery = useFilmRoster();

  const [filter, setFilter] = useState<QueueFilter>(() => initialFilter(search));
  const [playerFilter, setPlayerFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [idpTarget, setIdpTarget] = useState<QueueRow | null>(null);
  const [idpOpen, setIdpOpen] = useState(false);

  const allRows = queue.data?.rows ?? [];
  const summary = queue.data?.summary ?? null;

  const rows = useMemo(
    () =>
      allRows
        .filter((r) => matchesFilter(r, filter))
        .filter((r) => playerFilter === "all" || r.player.id === playerFilter)
        .sort(attentionCompare),
    [allRows, filter, playerFilter]
  );

  const pct = (n: number) =>
    allRows.length ? Math.round((n / allRows.length) * 100) : 0;

  const openIdp = (row: QueueRow) => {
    setIdpTarget(row);
    setIdpOpen(true);
  };

  const hasFilters = filter !== "all" || playerFilter !== "all";

  return (
    <AppShell>
      <div className="px-4 lg:px-8 pb-24 max-w-5xl mx-auto pt-4 space-y-4">
        <PageHeader eyebrow="Coach · Film Room" title="Assignments" />

        {/* Summary strip */}
        {summary && (
          <div className="text-[12px] font-mono flex items-center gap-1.5 flex-wrap" style={{ color: MUTED }}>
            <span style={{ color: "oklch(0.85 0.02 260)" }}>{summary.active} active</span>
            <span>·</span>
            <span>{pct(summary.watched)}% watched</span>
            <span>·</span>
            <span>{pct(summary.responded)}% responded</span>
            <span>·</span>
            <span style={{ color: summary.overdue > 0 ? DANGER : SUCCESS }}>
              {summary.overdue} overdue
            </span>
          </div>
        )}

        {/* Filters — single horizontally-scrollable chip row on mobile      */}
        {/* (no wrapping), compact player select alongside/below. ≤96px tall. */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex items-center gap-1 flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {FILTER_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setFilter(o.value)}
                className="text-[11px] px-2 py-1 rounded-full border transition-colors shrink-0 whitespace-nowrap"
                style={
                  filter === o.value
                    ? { color: ACCENT, borderColor: ACCENT, background: "oklch(0.72 0.18 290 / 0.12)" }
                    : { color: MUTED, borderColor: "oklch(0.28 0.01 260)" }
                }
              >
                {o.label}
              </button>
            ))}
          </div>
          <select
            value={playerFilter}
            onChange={(e) => setPlayerFilter(e.target.value)}
            className="rounded-md border border-border bg-transparent px-2 py-1 text-[12px] outline-none h-7 self-start sm:self-auto max-w-[180px]"
          >
            <option value="all">All players</option>
            {(rosterQuery.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.jersey ? `#${p.jersey} ` : ""}
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Rows */}
        {queue.isLoading ? (
          <SkeletonRows count={5} />
        ) : queue.isError ? (
          <RegionError message="Couldn't load assignments." onRetry={() => queue.refetch()} />
        ) : allRows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center space-y-2">
            <p className="text-[13px]" style={{ color: MUTED }}>
              Send your first clip from the Film Room and it shows up here.
            </p>
            <Link
              href="/app/coach/film-room"
              className="inline-block text-[12px] font-semibold underline"
              style={{ color: ACCENT }}
            >
              Open Film Room
            </Link>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center space-y-2">
            {filter === "overdue" && playerFilter === "all" ? (
              <p className="text-[13px]" style={{ color: SUCCESS }}>
                Nothing overdue.
              </p>
            ) : (
              <>
                <p className="text-[13px]" style={{ color: MUTED }}>
                  No assignments match these filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    setPlayerFilter("all");
                  }}
                  className="text-[12px] font-medium underline"
                  style={{ color: ACCENT }}
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {rows.map((row) => {
              const expanded = expandedId === row.id;
              return (
                <div
                  key={row.id}
                  className="rounded-lg border transition-colors"
                  style={{
                    borderColor: row.overdue ? "oklch(0.68 0.22 25 / 0.5)" : undefined,
                    borderLeftWidth: row.overdue ? 2 : undefined,
                    borderLeftColor: row.overdue ? DANGER : undefined,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : row.id)}
                    className={`w-full px-3 py-2 text-left hover:bg-[oklch(0.19_0.01_260)] rounded-lg transition-colors ${
                      expanded ? "bg-[oklch(0.19_0.01_260)] rounded-b-none" : ""
                    }`}
                  >
                    {/* Mobile — player primary, clip title secondary, session tertiary */}
                    <span className="flex flex-col gap-0.5 lg:hidden">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="flex-1 min-w-0 text-[13px] font-medium truncate">
                          {row.player.name}
                          {row.player.position && (
                            <span className="font-mono text-[10px] ml-1.5" style={{ color: MUTED }}>
                              {row.player.position}
                            </span>
                          )}
                        </span>
                        <StatusPill kind="assignment" status={row.status} />
                      </span>
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="flex-1 min-w-0 text-[12px] truncate">{row.clip.title}</span>
                        <DueChip dueAt={row.dueAt} done={!!row.completedAt} />
                      </span>
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="flex-1 min-w-0 text-[11px] truncate" style={{ color: MUTED }}>
                          {row.sessionTitle}
                        </span>
                        <GlyphCluster row={row} />
                      </span>
                    </span>

                    {/* Desktop — original 5-column grid */}
                    <span className="hidden lg:grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_auto_auto_auto] items-center gap-x-3 gap-y-0.5">
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium truncate">
                          {row.player.name}
                          {row.player.position && (
                            <span className="font-mono text-[10px] ml-1.5" style={{ color: MUTED }}>
                              {row.player.position}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12px] truncate">{row.clip.title}</span>
                        <span className="block text-[11px] truncate" style={{ color: MUTED }}>
                          {row.sessionTitle}
                        </span>
                      </span>
                      <DueChip dueAt={row.dueAt} done={!!row.completedAt} />
                      <GlyphCluster row={row} />
                      <StatusPill kind="assignment" status={row.status} />
                    </span>
                  </button>
                  {expanded && <ExpandedRow row={row} onOpenIdp={openIdp} />}
                </div>
              );
            })}
          </div>
        )}
        {!queue.isLoading && !queue.isError && allRows.length > 0 && hasFilters && rows.length > 0 && (
          <div className="text-[11px]" style={{ color: MUTED }}>
            {rows.length} of {allRows.length} assignments
          </div>
        )}
      </div>

      {idpTarget && (
        <IdpEscalatePanel
          open={idpOpen}
          onOpenChange={setIdpOpen}
          playerName={idpTarget.player.name}
          assignmentPlayerId={idpTarget.id}
          notePrefill={idpTarget.clip.title}
        />
      )}
    </AppShell>
  );
}
