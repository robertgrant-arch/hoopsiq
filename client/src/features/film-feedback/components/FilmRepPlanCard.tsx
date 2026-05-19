/**
 * features/film-feedback/components/FilmRepPlanCard.tsx
 *
 * The central player-facing component for the Film Feedback → Rep Plan slice.
 *
 * Displays one coaching action as a connected two-zone card:
 *
 *   Zone A — FILM CONTEXT (why this was prescribed)
 *     Film session title · timestamp · skill category badge
 *     Coach's note (the teachable point)
 *
 *   Zone B — REP PLAN (what to do about it)
 *     Drill title + reps  (recommend_drill)
 *     Watch clip prompt   (assign_clip)
 *     Re-upload prompt    (request_reupload)
 *
 *   Zone C — STATUS TRACK (where the player is)
 *     Segmented track: Assigned → Working on it → Done → Reviewed ✓
 *
 * The visual connection between clip and drill is the key design goal.
 */

import { Film, Dumbbell, Upload, Eye, ChevronRight, Clock } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { PLAYER_STATUS_TRANSITIONS } from "../types";
import type { FilmRepPlan, RepPlanStatus, FilmActionType } from "../types";
import { useUpdateRepPlanStatus } from "../hooks";

// ── Color constants (matches rest of codebase) ────────────────────────────────

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  RepPlanStatus,
  { label: string; color: string; bgColor: string }
> = {
  assigned:      { label: "Assigned",       color: MUTED,    bgColor: "oklch(0.17 0.005 260)" },
  in_progress:   { label: "Working on it",  color: WARNING,  bgColor: `${WARNING}15` },
  completed:     { label: "Done",           color: SUCCESS,  bgColor: `${SUCCESS}12` },
  coach_reviewed:{ label: "Reviewed ✓",     color: PRIMARY,  bgColor: `${PRIMARY}12` },
};

const STATUS_ORDER: RepPlanStatus[] = ["assigned", "in_progress", "completed", "coach_reviewed"];

// ── Action type config ────────────────────────────────────────────────────────

const ACTION_META: Record<
  FilmActionType,
  { label: string; icon: React.ReactNode; ctaLabel: string; ctaIcon: React.ReactNode }
> = {
  recommend_drill: {
    label:    "Drill Prescription",
    icon:     <Dumbbell className="w-3.5 h-3.5" />,
    ctaLabel: "Mark complete",
    ctaIcon:  <Dumbbell className="w-3.5 h-3.5" />,
  },
  assign_clip: {
    label:    "Film Assignment",
    icon:     <Film className="w-3.5 h-3.5" />,
    ctaLabel: "Watch clip",
    ctaIcon:  <Eye className="w-3.5 h-3.5" />,
  },
  request_reupload: {
    label:    "Re-upload Request",
    icon:     <Upload className="w-3.5 h-3.5" />,
    ctaLabel: "Submit clip",
    ctaIcon:  <Upload className="w-3.5 h-3.5" />,
  },
};

// ── Status track ──────────────────────────────────────────────────────────────

function StatusTrack({
  current,
  onAdvance,
  isPending,
}: {
  current:   RepPlanStatus;
  onAdvance: (next: RepPlanStatus) => void;
  isPending: boolean;
}) {
  const next = PLAYER_STATUS_TRANSITIONS[current];

  return (
    <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-border/50">
      {/* Status dots */}
      <div className="flex items-center gap-0 relative">
        {STATUS_ORDER.map((s, i) => {
          const cfg     = STATUS_CONFIG[s];
          const reached = STATUS_ORDER.indexOf(current) >= i;
          const isCur   = s === current;

          return (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                  style={{
                    borderColor:     reached ? cfg.color : "var(--color-border, oklch(0.22 0.005 260))",
                    backgroundColor: isCur   ? cfg.color : reached ? `${cfg.color}20` : "transparent",
                  }}
                >
                  {reached && !isCur && (
                    <svg viewBox="0 0 8 7" className="w-2.5 h-2 fill-current" style={{ color: cfg.color }}>
                      <path d="M1 3.5l2 2L7 1" stroke="currentColor" strokeWidth="1.2" fill="none"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span
                  className="text-[9.5px] font-medium whitespace-nowrap leading-none"
                  style={{ color: isCur ? cfg.color : reached ? `${cfg.color}80` : MUTED }}
                >
                  {cfg.label}
                </span>
              </div>
              {/* Connector line */}
              {i < STATUS_ORDER.length - 1 && (
                <div
                  className="flex-1 h-[2px] mb-4 mx-1 rounded-full transition-all"
                  style={{
                    backgroundColor:
                      STATUS_ORDER.indexOf(current) > i
                        ? STATUS_CONFIG[STATUS_ORDER[i + 1]].color
                        : "var(--color-border, oklch(0.22 0.005 260))",
                    opacity: STATUS_ORDER.indexOf(current) > i ? 0.4 : 0.2,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Advance button */}
      {next && (
        <button
          onClick={() => onAdvance(next)}
          disabled={isPending}
          className="self-start inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          style={{ backgroundColor: STATUS_CONFIG[next].color, color: "#fff" }}
        >
          {isPending ? (
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            STATUS_META[next]
          )}
        </button>
      )}
    </div>
  );
}

// Label shown on the advance button
const STATUS_META: Partial<Record<RepPlanStatus, React.ReactNode>> = {
  in_progress: "I'm working on this",
  completed:   "Mark as done ✓",
};

// ── Main card ─────────────────────────────────────────────────────────────────

interface FilmRepPlanCardProps {
  plan: FilmRepPlan;
}

export function FilmRepPlanCard({ plan }: FilmRepPlanCardProps) {
  const { mutate: updateStatus, isPending } = useUpdateRepPlanStatus();
  const actionMeta = ACTION_META[plan.actionType];
  const isDone     = plan.status === "completed" || plan.status === "coach_reviewed";

  function handleAdvance(next: RepPlanStatus) {
    updateStatus({ id: plan.id, nextStatus: next });
    if (next === "in_progress") toast("Started — you've got this.");
    if (next === "completed")   toast.success("Marked done — coach will review this.");
  }

  return (
    <div
      className="rounded-2xl border bg-card overflow-hidden"
      style={{
        borderColor: isDone
          ? `${SUCCESS}40`
          : plan.status === "in_progress"
          ? `${WARNING}40`
          : "var(--color-border, oklch(0.22 0.005 260))",
        opacity: plan.status === "coach_reviewed" ? 0.7 : 1,
      }}
    >
      {/* ── Zone A: Film context ──────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4">
        {/* Film session header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Film className="w-3.5 h-3.5 shrink-0" style={{ color: MUTED }} />
            <span className="text-[11px] font-mono uppercase tracking-[0.1em]" style={{ color: MUTED }}>
              From film
            </span>
            {plan.film.timestamp && (
              <>
                <span style={{ color: MUTED }} className="text-[11px]">·</span>
                <Clock className="w-3 h-3 shrink-0" style={{ color: MUTED }} />
                <span className="text-[11.5px] font-semibold tabular-nums"
                  style={{ color: MUTED }}>
                  {plan.film.timestamp}
                </span>
              </>
            )}
          </div>
          <Badge
            variant="outline"
            className="text-[10px] shrink-0 font-medium"
            style={{ borderColor: `${PRIMARY}40`, color: PRIMARY }}
          >
            {plan.skillCategory}
          </Badge>
        </div>

        {/* Session title */}
        <div className="text-[13px] font-semibold leading-tight mb-3">
          {plan.film.sessionTitle}
        </div>

        {/* Coach's note — the teachable point */}
        <div className="rounded-xl border-l-2 pl-3 py-2"
          style={{ borderColor: PRIMARY, backgroundColor: `${PRIMARY}08` }}>
          <div className="text-[10px] font-mono uppercase tracking-[0.1em] mb-1" style={{ color: PRIMARY }}>
            From your coach
          </div>
          <p className="text-[12.5px] leading-relaxed text-muted-foreground italic">
            "{plan.coachNote}"
          </p>
        </div>

        {/* View clip link */}
        {plan.film.clipHref && (
          <Link href={plan.film.clipHref} asChild>
            <a className="inline-flex items-center gap-1 text-[11.5px] mt-2 transition-colors hover:underline"
              style={{ color: PRIMARY }}>
              <Film className="w-3 h-3" />
              View clip
              <ChevronRight className="w-3 h-3" />
            </a>
          </Link>
        )}
      </div>

      {/* ── Zone B: Rep plan ─────────────────────────────────────────────── */}
      <div
        className="px-5 py-4 border-t"
        style={{
          borderColor:     "var(--color-border, oklch(0.22 0.005 260))",
          backgroundColor: isDone ? `${SUCCESS}06` : "transparent",
        }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <span style={{ color: WARNING }}>{actionMeta.icon}</span>
          <span className="text-[10.5px] font-mono uppercase tracking-[0.1em]" style={{ color: WARNING }}>
            {actionMeta.label}
          </span>
        </div>

        {/* Drill prescription */}
        {plan.drill && (
          <div>
            <div className="text-[16px] font-bold leading-tight">{plan.drill.title}</div>
            {plan.drill.reps && (
              <div className="text-[12.5px] text-muted-foreground mt-0.5">{plan.drill.reps}</div>
            )}
          </div>
        )}

        {/* Clip-watch instruction */}
        {plan.actionType === "assign_clip" && !plan.drill && (
          <div className="text-[14px] font-semibold">Watch the assigned clip</div>
        )}

        {/* Re-upload instruction */}
        {plan.actionType === "request_reupload" && !plan.drill && (
          <div>
            <div className="text-[14px] font-semibold">Record and submit a corrective rep</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">
              Coach will compare your new clip against the original.
            </div>
            {plan.status === "assigned" && (
              <Link href="/app/player/uploads" asChild>
                <a
                  className="inline-flex items-center gap-1.5 mt-2 h-8 px-3.5 rounded-lg text-[12px] font-semibold transition"
                  style={{ backgroundColor: `oklch(0.72 0.18 290 / 0.15)`, color: PRIMARY }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload clip
                </a>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Zone C: Status track ──────────────────────────────────────────── */}
      <div className="px-5 pb-5">
        <StatusTrack
          current={plan.status}
          onAdvance={handleAdvance}
          isPending={isPending}
        />
      </div>
    </div>
  );
}
