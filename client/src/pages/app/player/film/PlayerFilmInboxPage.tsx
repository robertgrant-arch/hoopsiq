/**
 * PlayerFilmInboxPage — S1 Film Inbox (/app/player/film).
 *
 * Player-facing list of clip assignments. Needs-action rows first
 * (assigned/opened, earliest due first), then watched-awaiting-response,
 * then completed collapsed under "Done ✓ (n)". Spec:
 * docs/film-room-player-review.md · copy: docs/film-room-copy.md.
 */

import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { usePlayerFilmInbox } from "@/features/film-room/hooks";
import { clipDuration, isActionable, type QueueRow } from "@/features/film-room/types";

const DANGER = "oklch(0.68 0.22 25)";

/* ── Due chip ─────────────────────────────────────────────────────────────── */

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function DueChip({ row }: { row: QueueRow }) {
  // Once the player acted (responded/completed) they are never "late" in the UI.
  if (!row.dueAt || !isActionable(row.status)) return null;

  const due = new Date(row.dueAt);
  const now = new Date();

  if (isSameDay(due, now)) {
    return (
      <span className="text-[11px] font-medium shrink-0" style={{ color: DANGER }}>
        Due today
      </span>
    );
  }
  if (due.getTime() < now.getTime()) {
    return (
      <span className="text-[11px] font-bold shrink-0" style={{ color: DANGER }}>
        Overdue
      </span>
    );
  }
  const weekday = due.toLocaleDateString("en-US", { weekday: "short" });
  return (
    <span className="text-[11px] font-medium text-muted-foreground shrink-0">
      Due {weekday}
    </span>
  );
}

/* ── Card ─────────────────────────────────────────────────────────────────── */

function InboxCard({ row, done }: { row: QueueRow; done?: boolean }) {
  const unwatched = isActionable(row.status) && !row.watchedAt;

  return (
    <Link href={`/app/player/film/${row.id}`} asChild>
      <a
        className="relative flex items-center h-16 px-4 rounded-xl border border-border bg-card/50 transition-opacity active:opacity-70"
        style={{ WebkitTapHighlightColor: "transparent", opacity: done ? 0.65 : 1 }}
      >
        {/* Unwatched dot on the left edge */}
        {unwatched && (
          <span
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
            style={{ background: DANGER }}
            aria-label="Unwatched"
          />
        )}

        <div className="flex-1 min-w-0 pl-2">
          <div className="text-[14px] font-semibold truncate leading-tight">
            {row.clip.title}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[12px] text-muted-foreground">
            <span className="truncate">Coach</span>
            <span aria-hidden>·</span>
            <span className="tabular-nums shrink-0">{clipDuration(row.clip)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-3 shrink-0">
          <DueChip row={row} />
          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
        </div>
      </a>
    </Link>
  );
}

/* ── Loading / error states ───────────────────────────────────────────────── */

function SkeletonCards() {
  return (
    <div className="space-y-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-16 rounded-xl border border-border bg-muted/30 animate-pulse"
        />
      ))}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function PlayerFilmInboxPage() {
  const { data: rows, isLoading, isError, refetch } = usePlayerFilmInbox();
  const [showDone, setShowDone] = useState(false);

  const groups = useMemo(() => {
    const all = rows ?? [];
    const dueTime = (r: QueueRow) =>
      r.dueAt ? new Date(r.dueAt).getTime() : Number.POSITIVE_INFINITY;

    const needsAction = all
      .filter((r) => r.status === "assigned" || r.status === "opened")
      .sort((a, b) => dueTime(a) - dueTime(b));
    const awaitingResponse = all
      .filter((r) => r.status === "watched")
      .sort((a, b) => dueTime(a) - dueTime(b));
    const done = all.filter(
      (r) => r.status === "responded" || r.status === "completed",
    );
    return { needsAction, awaitingResponse, done };
  }, [rows]);

  const needsActionCount = groups.needsAction.length + groups.awaitingResponse.length;

  return (
    <AppShell>
      <div
        className="max-w-xl mx-auto px-4 pt-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
      >
        {/* Header: "Film" + needs-action count. Nothing else. */}
        <div className="flex items-baseline gap-2 mb-4">
          <h1 className="text-[22px] font-bold tracking-tight">Film</h1>
          {needsActionCount > 0 && (
            <span
              className="min-w-[22px] h-[22px] px-1.5 rounded-full inline-flex items-center justify-center text-[12px] font-bold text-white"
              style={{ background: DANGER }}
              aria-label={`${needsActionCount} to review`}
            >
              {needsActionCount}
            </span>
          )}
        </div>

        {isLoading && <SkeletonCards />}

        {isError && !isLoading && (
          <div className="rounded-xl border border-border p-4 flex items-center justify-between gap-3">
            <span className="text-[13px] text-muted-foreground">
              Couldn't load your film.
            </span>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 min-h-[44px] px-3 rounded-lg text-[13px] font-medium text-foreground border border-border transition-opacity active:opacity-70"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && rows && (
          <>
            {rows.length === 0 ? (
              <div className="py-16 text-center text-[15px] text-muted-foreground">
                No film to review. 🏀
              </div>
            ) : (
              <div className="space-y-2">
                {groups.needsAction.map((r) => (
                  <InboxCard key={r.id} row={r} />
                ))}
                {groups.awaitingResponse.map((r) => (
                  <InboxCard key={r.id} row={r} />
                ))}

                {groups.needsAction.length === 0 &&
                  groups.awaitingResponse.length === 0 && (
                    <div className="py-8 text-center text-[15px] text-muted-foreground">
                      No film to review. 🏀
                    </div>
                  )}

                {groups.done.length > 0 && (
                  <div className="pt-3">
                    <button
                      onClick={() => setShowDone((v) => !v)}
                      aria-expanded={showDone}
                      className="w-full flex items-center gap-1.5 min-h-[44px] px-1 text-[13px] font-medium text-muted-foreground transition-opacity active:opacity-70"
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      {showDone ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      Done ✓ ({groups.done.length})
                    </button>
                    {showDone && (
                      <div className="space-y-2 mt-1">
                        {groups.done.map((r) => (
                          <InboxCard key={r.id} row={r} done />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
