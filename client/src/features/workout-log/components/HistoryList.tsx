/**
 * features/workout-log/components/HistoryList.tsx
 *
 * Compact list of recent WOD completion rows.
 * Shows: date, WOD title, state badge, drills fraction, XP, elapsed time.
 * Renders only active-day records (no rest days in this list).
 */

import { CheckCircle2, XCircle, Clock, Minus, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import type { DayRecord, DayStatus } from "../types";

const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

function relativeDate(dateStr: string): string {
  const today      = new Date().toISOString().slice(0, 10);
  const yesterday  = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today)     return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const dt   = new Date(dateStr + "T12:00:00Z");
  const diff = Math.round((Date.now() - dt.getTime()) / 86400000);
  if (diff < 7) return `${diff} days ago`;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatusIcon({ status }: { status: DayStatus }) {
  if (status === "completed") return <CheckCircle2 className="w-4 h-4" style={{ color: SUCCESS }} />;
  if (status === "skipped")   return <XCircle      className="w-4 h-4" style={{ color: DANGER  }} />;
  if (status === "partial")   return <Clock        className="w-4 h-4" style={{ color: WARNING }} />;
  return                             <Minus        className="w-4 h-4" style={{ color: MUTED   }} />;
}

const STATUS_LABEL: Record<DayStatus, string> = {
  completed: "Done",
  partial:   "Partial",
  skipped:   "Skipped",
  rest:      "Rest",
  no_data:   "—",
};

interface HistoryListProps {
  records: DayRecord[];
  limit?:  number;
}

export function HistoryList({ records, limit = 7 }: HistoryListProps) {
  // Filter to active days only (no rest, no future no_data), sorted newest first
  const active = records
    .filter((r) => r.status !== "rest" && r.wod !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);

  if (active.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-5 py-8 text-center">
        <p className="text-[13px]" style={{ color: MUTED }}>No recent workouts yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card divide-y divide-border/60">
      {active.map((record) => {
        if (!record.wod) return null;
        const { wod, date, status } = record;
        const pct = wod.drillsTotal > 0
          ? Math.round((wod.drillsCompleted / wod.drillsTotal) * 100)
          : 0;

        return (
          <div key={date} className="flex items-center gap-3 px-4 py-3.5">
            <StatusIcon status={status} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-medium leading-tight truncate">{wod.title}</span>
                {wod.xpAwarded && status === "completed" && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${SUCCESS}15`, color: SUCCESS }}>
                    +{wod.xpAwarded} XP
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[11px]" style={{ color: MUTED }}>
                  {relativeDate(date)}
                </span>
                <span style={{ color: MUTED }} className="text-[11px]">·</span>
                <span className="text-[11px]" style={{ color: MUTED }}>
                  {wod.drillsCompleted}/{wod.drillsTotal} drills
                </span>
                {wod.elapsedMinutes && (
                  <>
                    <span style={{ color: MUTED }} className="text-[11px]">·</span>
                    <span className="text-[11px]" style={{ color: MUTED }}>
                      {wod.elapsedMinutes} min
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Progress bar (mini) */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span
                className="text-[10.5px] font-semibold"
                style={{
                  color:
                    status === "completed" ? SUCCESS :
                    status === "partial"   ? WARNING :
                    status === "skipped"   ? DANGER  : MUTED,
                }}
              >
                {STATUS_LABEL[status]}
              </span>
              <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor:
                      status === "completed" ? SUCCESS :
                      status === "partial"   ? WARNING : DANGER,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Link to full history */}
      <div className="px-4 py-3">
        <Link href="/app/player/timeline" asChild>
          <a className="inline-flex items-center gap-1 text-[12px] transition-colors hover:underline" style={{ color: MUTED }}>
            View full development timeline
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </Link>
      </div>
    </div>
  );
}
