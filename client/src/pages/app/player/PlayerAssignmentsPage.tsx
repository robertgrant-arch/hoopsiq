import { useState } from "react";
import {
  ClipboardList, Film, Dumbbell, BookOpen, Zap, CheckCircle2,
  Circle, Clock, AlertCircle, Star, ChevronRight, Trophy,
  MessageSquare, Crosshair,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockPlayerAssignments, type PlayerAssignment, type AssignmentType, type AssignmentStatus } from "@/features/player/mock";

// ── Film Feedback slice ───────────────────────────────────────────────────────
import { useFilmRepPlans } from "@/features/film-feedback";
import { FilmRepPlanCard } from "@/features/film-feedback/components/FilmRepPlanCard";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = d.getTime() - today.getTime();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

const TYPE_META: Record<AssignmentType, { label: string; icon: React.ComponentType<any>; color: string }> = {
  film_review:  { label: "Film review",    icon: Film,          color: "oklch(0.7 0.18 310)"  },
  drill:        { label: "Drill",           icon: Dumbbell,      color: "oklch(0.72 0.18 290)" },
  quiz:         { label: "Quiz",            icon: BookOpen,      color: "oklch(0.78 0.17 75)"  },
  conditioning: { label: "Conditioning",    icon: Zap,           color: "oklch(0.75 0.12 140)" },
  check_in:     { label: "Check-in",        icon: CheckCircle2,  color: "oklch(0.65 0.15 230)" },
  note:         { label: "Note",            icon: MessageSquare, color: "oklch(0.5 0 0)"       },
  scout_team:   { label: "Scout team role", icon: Crosshair,     color: "oklch(0.68 0.22 25)"  },
};

const STATUS_ORDER: AssignmentStatus[] = ["open", "in_progress", "submitted", "graded"];

function statusIcon(status: AssignmentStatus) {
  if (status === "graded" || status === "submitted") {
    return <CheckCircle2 className="w-4 h-4" style={{ color: "oklch(0.75 0.12 140)" }} />;
  }
  if (status === "in_progress") {
    return <Clock className="w-4 h-4" style={{ color: "oklch(0.78 0.17 75)" }} />;
  }
  return <Circle className="w-4 h-4 text-muted-foreground" />;
}

function statusLabel(status: AssignmentStatus) {
  return {
    open: "Open",
    in_progress: "In progress",
    submitted: "Submitted",
    graded: "Graded",
  }[status];
}

/* -------------------------------------------------------------------------- */
/* Summary strip                                                                */
/* -------------------------------------------------------------------------- */

function SummaryStrip({ items }: { items: PlayerAssignment[] }) {
  const open = items.filter((a) => a.status === "open").length;
  const inProgress = items.filter((a) => a.status === "in_progress").length;
  const done = items.filter((a) => a.status === "submitted" || a.status === "graded").length;
  const totalXp = items
    .filter((a) => a.status === "submitted" || a.status === "graded")
    .reduce((s, a) => s + a.xpReward, 0);
  const highPriority = items.filter((a) => a.priority === "high" && a.status === "open").length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Open", value: open, color: open > 0 ? "oklch(0.72 0.17 75)" : undefined },
        { label: "In progress", value: inProgress },
        { label: "Completed", value: done, color: "oklch(0.75 0.12 140)" },
        { label: "XP earned", value: `+${totalXp}`, color: "oklch(0.78 0.17 75)" },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3 text-center">
          <div
            className="font-mono text-[24px] font-bold leading-none"
            style={s.color ? { color: s.color } : undefined}
          >
            {s.value}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Assignment card                                                              */
/* -------------------------------------------------------------------------- */

function AssignmentCard({
  assignment,
  onStart,
  onSubmit,
}: {
  assignment: PlayerAssignment;
  onStart: (id: string) => void;
  onSubmit: (id: string) => void;
}) {
  const meta = TYPE_META[assignment.type];
  const Icon = meta.icon;
  const done = assignment.status === "submitted" || assignment.status === "graded";
  const isOverdue = !done && new Date(assignment.dueDate) < new Date();

  return (
    <div
      className="rounded-xl border bg-card overflow-hidden transition-all"
      style={{
        borderColor: assignment.priority === "high" && !done
          ? "oklch(0.68 0.22 25 / 0.4)"
          : undefined,
        opacity: done ? 0.7 : 1,
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">{statusIcon(assignment.status)}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <div className="font-semibold text-[13.5px] leading-snug">{assignment.title}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span
                    className="text-[10px] font-medium flex items-center gap-0.5"
                    style={{ color: meta.color }}
                  >
                    <Icon className="w-3 h-3" />
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">by {assignment.assignedBy}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {assignment.priority === "high" && !done && (
                  <AlertCircle className="w-3.5 h-3.5" style={{ color: "oklch(0.68 0.22 25)" }} />
                )}
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                  style={isOverdue
                    ? { color: "oklch(0.68 0.22 25)", borderColor: "oklch(0.68 0.22 25 / 0.3)" }
                    : { color: "oklch(0.5 0 0)", borderColor: "hsl(var(--border))" }
                  }
                >
                  {isOverdue ? "Overdue" : formatDate(assignment.dueDate)}
                </span>
              </div>
            </div>

            <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed line-clamp-2">
              {assignment.description}
            </p>

            {/* Scout-team role callout */}
            {assignment.type === "scout_team" && (
              <div
                className="mt-2 rounded-lg border px-3 py-2 space-y-1"
                style={{
                  borderColor: "oklch(0.68 0.22 25 / 0.25)",
                  background: "oklch(0.68 0.22 25 / 0.05)",
                }}
              >
                <div
                  className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: "oklch(0.68 0.22 25)" }}
                >
                  <Crosshair className="w-3 h-3" />
                  Scout team assignment — simulate the opponent
                </div>
                <p className="text-[11.5px]" style={{ color: "oklch(0.55 0.02 260)" }}>
                  Study your opponent's tendencies before practice. Your job is to make
                  our defense's reads automatic.
                </p>
              </div>
            )}

            {assignment.coachFeedback && (
              <div className="mt-2 rounded-lg bg-muted/50 border-l-2 border-muted px-3 py-2 text-[11.5px] text-muted-foreground italic">
                Coach: "{assignment.coachFeedback}"
              </div>
            )}

            <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "oklch(0.78 0.17 75)" }}>
                <Star className="w-3 h-3" />
                +{assignment.xpReward} XP
              </div>

              <div className="flex items-center gap-2">
                {assignment.status === "graded" && (
                  <span className="text-[11px]" style={{ color: "oklch(0.75 0.12 140)" }}>
                    ✓ Graded
                  </span>
                )}
                {assignment.status === "submitted" && (
                  <span className="text-[11px] text-muted-foreground">Awaiting review</span>
                )}
                {assignment.status === "open" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={() => onStart(assignment.id)}
                  >
                    Start
                  </Button>
                )}
                {assignment.status === "in_progress" && (
                  <Button
                    size="sm"
                    className="h-7 text-[11px]"
                    style={{ background: "oklch(0.75 0.12 140)" }}
                    onClick={() => onSubmit(assignment.id)}
                  >
                    Submit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                  */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-12 flex flex-col items-center text-center gap-3">
      <Trophy className="w-8 h-8 text-muted-foreground/30" />
      <p className="font-semibold">All caught up!</p>
      <p className="text-[12px] text-muted-foreground max-w-xs">
        No open assignments right now. New work from your coach will appear here.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                    */
/* -------------------------------------------------------------------------- */

type FilterTab = "all" | AssignmentStatus | AssignmentType;

export default function PlayerAssignmentsPage() {
  const [assignments, setAssignments] = useState(mockPlayerAssignments);
  const [filter, setFilter] = useState<"film" | "active" | "done">("film");

  // Film Feedback slice — from coaching actions
  const { data: filmRepPlans = [], isLoading: filmLoading } = useFilmRepPlans();
  const activeFilmPlans = filmRepPlans.filter(
    (p) => p.status === "assigned" || p.status === "in_progress"
  );
  const doneFilmPlans = filmRepPlans.filter(
    (p) => p.status === "completed" || p.status === "coach_reviewed"
  );

  function handleStart(id: string) {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "in_progress" as const } : a)),
    );
    toast.success("Assignment started — good luck!");
  }

  function handleSubmit(id: string) {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: "submitted" as const, completedAt: new Date().toISOString() }
          : a,
      ),
    );
    const assignment = assignments.find((a) => a.id === id);
    toast.success(`Submitted! +${assignment?.xpReward ?? 0} XP earned`);
  }

  const active = assignments.filter((a) => a.status === "open" || a.status === "in_progress");
  const done = assignments.filter((a) => a.status === "submitted" || a.status === "graded");

  const sortedActive = [...active].sort((a, b) => {
    if (a.priority === "high" && b.priority !== "high") return -1;
    if (b.priority === "high" && a.priority !== "high") return 1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  return (
    <AppShell>
      <div className="px-4 py-6 max-w-2xl mx-auto flex flex-col gap-4 pb-12">
        <PageHeader
          eyebrow="Athlete Portal"
          title="My Assignments"
          subtitle="Coach-assigned film reviews, drills, and tasks — all in one place."
        />

        {/* ── Tab bar ─────────────────────────────────────────────────────── */}
        <div className="flex gap-1.5">
          {(["film", "active", "done"] as const).map((f) => {
            const labels = {
              film:   `From Film (${activeFilmPlans.length})`,
              active: `Other (${active.length})`,
              done:   `Done (${done.length + doneFilmPlans.length})`,
            };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all flex items-center gap-1.5"
                style={
                  filter === f
                    ? { background: "oklch(0.72 0.18 290)", borderColor: "oklch(0.72 0.18 290)", color: "white" }
                    : { borderColor: "transparent" }
                }
              >
                {f === "film" && <Film className="w-3 h-3" />}
                {f === "active" && <Circle className="w-3 h-3" />}
                {f === "done" && <CheckCircle2 className="w-3 h-3" />}
                {labels[f]}
              </button>
            );
          })}
        </div>

        {/* ── Film Feedback tab ────────────────────────────────────────────── */}
        {filter === "film" && (
          <div className="flex flex-col gap-3">
            {filmLoading ? (
              <div className="rounded-2xl border border-border bg-card p-6 animate-pulse h-40" />
            ) : activeFilmPlans.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-6 py-10 flex flex-col items-center text-center gap-2">
                <Film className="w-7 h-7 text-muted-foreground/30" />
                <p className="font-semibold text-[14px]">No film assignments yet.</p>
                <p className="text-[12.5px] text-muted-foreground max-w-xs">
                  When your coach prescribes a drill or assigns a clip from film review, it will appear here with full context.
                </p>
              </div>
            ) : (
              activeFilmPlans.map((plan) => (
                <FilmRepPlanCard key={plan.id} plan={plan} />
              ))
            )}
          </div>
        )}

        {/* ── Other assignments tab ────────────────────────────────────────── */}
        {filter === "active" && (
          <div className="space-y-3">
            {sortedActive.length === 0 ? (
              <EmptyState />
            ) : (
              sortedActive.map((a) => (
                <AssignmentCard
                  key={a.id}
                  assignment={a}
                  onStart={handleStart}
                  onSubmit={handleSubmit}
                />
              ))
            )}
          </div>
        )}

        {/* ── Done tab ─────────────────────────────────────────────────────── */}
        {filter === "done" && (
          <div className="flex flex-col gap-3">
            {/* Completed film assignments */}
            {doneFilmPlans.length > 0 && (
              <>
                <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
                  From Film
                </div>
                {doneFilmPlans.map((plan) => (
                  <FilmRepPlanCard key={plan.id} plan={plan} />
                ))}
              </>
            )}
            {/* Completed generic assignments */}
            {done.length > 0 && (
              <>
                {doneFilmPlans.length > 0 && (
                  <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-muted-foreground mt-2">
                    Other
                  </div>
                )}
                {done.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    onStart={handleStart}
                    onSubmit={handleSubmit}
                  />
                ))}
              </>
            )}
            {doneFilmPlans.length === 0 && done.length === 0 && (
              <div className="rounded-2xl border border-border bg-card px-6 py-10 flex flex-col items-center text-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-[13px] text-muted-foreground">No completed assignments yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
