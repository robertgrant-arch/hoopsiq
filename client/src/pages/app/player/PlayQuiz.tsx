/**
 * PlayQuiz — Athlete-facing study quiz for a Play.
 *
 * Implements all four question types defined in Prompt 14 §"Play Quiz Modes":
 *   1. IDENTIFY_ACTION  — multiple choice over what's happening in a phase.
 *   2. PREDICT_NEXT     — multiple choice over what comes next.
 *   3. PLACE_PLAYER     — drag missing tokens to their correct spots.
 *   4. SEQUENCE         — drag-reorder phases into the correct order.
 *
 * Scores are kept in component state. In production these submit to
 * `POST /api/quizzes/:id/attempt`.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GripVertical,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlayThumbnail } from "@/components/court/PlayThumbnail";
import { HalfCourt } from "@/components/court/HalfCourt";
import {
  getPlay,
  getQuiz,
  type PlayQuizMeta,
  type QuizPlacePlayer,
  type QuizQuestion,
  type Play,
  type PlayToken,
} from "@/features/playbook/mock";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function isMC(q: QuizQuestion): q is Extract<QuizQuestion, { type: "IDENTIFY_ACTION" } | { type: "PREDICT_NEXT" }> {
  return q.type === "IDENTIFY_ACTION" || q.type === "PREDICT_NEXT";
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/* -------------------------------------------------------------------------- */
/* Multiple-choice question (IDENTIFY_ACTION + PREDICT_NEXT)                   */
/* -------------------------------------------------------------------------- */

function MultipleChoice({
  q,
  play,
  selected,
  onSelect,
  showFeedback,
}: {
  q: Extract<QuizQuestion, { type: "IDENTIFY_ACTION" } | { type: "PREDICT_NEXT" }>;
  play: Play;
  selected: number | null;
  onSelect: (idx: number) => void;
  showFeedback: boolean;
}) {
  const phase = play.phases.find((p) => p.id === q.upToPhaseId) ?? play.phases[0];
  return (
    <div className="grid md:grid-cols-[420px_1fr] gap-5">
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-2">
          Phase shown: {phase.phase}
        </div>
        <div className="rounded-xl border border-border overflow-hidden bg-background">
          <PlayThumbnail phase={phase} width={420} height={315} />
        </div>
        {phase.notes && (
          <div className="mt-2 text-[12px] text-muted-foreground italic">{phase.notes}</div>
        )}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-2">
          {q.type === "IDENTIFY_ACTION" ? "Identify the action" : "Predict the next read"}
        </div>
        <h3 className="font-display text-xl uppercase tracking-tight mb-4 leading-tight">{q.prompt}</h3>
        <div className="space-y-2">
          {q.options.map((opt, idx) => {
            const isSelected = selected === idx;
            const isCorrect = idx === q.correctIdx;
            const showRight = showFeedback && isCorrect;
            const showWrong = showFeedback && isSelected && !isCorrect;
            return (
              <button
                key={idx}
                disabled={showFeedback}
                onClick={() => onSelect(idx)}
                className={`w-full text-left rounded-lg border p-3 transition flex items-center justify-between gap-3 ${
                  showRight
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : showWrong
                    ? "border-destructive/60 bg-destructive/10"
                    : isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 bg-card"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-[13.5px]">{opt}</span>
                </div>
                {showRight && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                {showWrong && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Place-the-player                                                            */
/* -------------------------------------------------------------------------- */

function PlacePlayer({
  q,
  play,
  placements,
  onPlace,
  showFeedback,
}: {
  q: QuizPlacePlayer;
  play: Play;
  placements: Record<string, { x: number; y: number }>;
  onPlace: (tokenId: string, pos: { x: number; y: number }) => void;
  showFeedback: boolean;
}) {
  const phase = play.phases.find((p) => p.id === q.phaseId) ?? play.phases[0];
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Tokens already pre-placed (everything except the ones the user must place)
  const fixed = phase.tokens.filter((t) => !q.placeTokenIds.includes(t.id));
  const toPlace = phase.tokens.filter((t) => q.placeTokenIds.includes(t.id));

  // We render a HalfCourt and a separate SVG for tokens with HTML drag handlers
  function handleStageClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!draggedId || showFeedback) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 600;
    onPlace(draggedId, { x, y });
    setDraggedId(null);
  }

  const W = 600;
  const H = 450;

  return (
    <div className="grid md:grid-cols-[1fr_280px] gap-5">
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-2">
          Place the players
        </div>
        <h3 className="font-display text-xl uppercase tracking-tight mb-3 leading-tight">{q.prompt}</h3>
        <div
          className="relative rounded-xl border border-border overflow-hidden bg-background"
          style={{ width: W, height: H, cursor: draggedId ? "crosshair" : "default" }}
        >
          <HalfCourt width={W} height={H} className="absolute inset-0 pointer-events-none" />
          <svg
            viewBox="0 0 800 600"
            width={W}
            height={H}
            preserveAspectRatio="xMidYMid meet"
            onClick={handleStageClick}
            className="absolute inset-0"
          >
            {/* Fixed tokens */}
            {fixed.map((t) =>
              t.type === "BALL" ? (
                <circle key={t.id} cx={t.x} cy={t.y} r={12} fill="#facc15" stroke="#7c2d12" strokeWidth={2} />
              ) : (
                <g key={t.id}>
                  <circle cx={t.x} cy={t.y} r={20} fill="#fef3c7" stroke="#92400e" strokeWidth={2} />
                  <text x={t.x} y={t.y + 6} textAnchor="middle" fontSize={18} fontWeight={700} fill="#451a03" fontFamily="monospace">
                    {t.label}
                  </text>
                </g>
              )
            )}

            {/* User placements */}
            {toPlace.map((t) => {
              const pos = placements[t.id];
              if (!pos) return null;
              const correctPos = phase.tokens.find((x) => x.id === t.id);
              const ok = correctPos && distance(pos, correctPos) <= q.toleranceRadius;
              const stroke = showFeedback ? (ok ? "#34d399" : "#f87171") : "#fbbf24";
              return (
                <g key={t.id}>
                  <circle cx={pos.x} cy={pos.y} r={22} fill="#fef3c7" stroke={stroke} strokeWidth={3} />
                  <text x={pos.x} y={pos.y + 6} textAnchor="middle" fontSize={18} fontWeight={700} fill="#451a03" fontFamily="monospace">
                    {t.label}
                  </text>
                  {showFeedback && correctPos && !ok && (
                    <g>
                      <circle cx={correctPos.x} cy={correctPos.y} r={22} fill="none" stroke="#34d399" strokeWidth={3} strokeDasharray="6 4" />
                      <text x={correctPos.x} y={correctPos.y + 6} textAnchor="middle" fontSize={18} fontWeight={700} fill="#34d399" fontFamily="monospace">
                        {t.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Show-correct overlay during feedback for unplaced tokens */}
            {showFeedback &&
              toPlace
                .filter((t) => !placements[t.id])
                .map((t) => (
                  <g key={`miss_${t.id}`}>
                    <circle cx={t.x} cy={t.y} r={22} fill="none" stroke="#34d399" strokeWidth={3} strokeDasharray="6 4" />
                    <text x={t.x} y={t.y + 6} textAnchor="middle" fontSize={18} fontWeight={700} fill="#34d399" fontFamily="monospace">
                      {t.label}
                    </text>
                  </g>
                ))}
          </svg>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
          Drag onto the court ({Object.keys(placements).length}/{toPlace.length})
        </div>
        {toPlace.map((t) => {
          const placed = !!placements[t.id];
          const isDrag = draggedId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setDraggedId(isDrag ? null : t.id)}
              disabled={showFeedback}
              className={`w-full text-left rounded-lg border p-2.5 transition flex items-center gap-2.5 ${
                isDrag
                  ? "border-primary bg-primary/10"
                  : placed
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-border hover:border-primary/40 bg-card"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-amber-300/90 border-2 border-amber-700 flex items-center justify-center font-mono font-bold text-amber-950">
                {t.label}
              </div>
              <div className="flex-1">
                <div className="text-[12.5px] font-semibold">Player {t.label}</div>
                <div className="text-[10.5px] text-muted-foreground font-mono">
                  {placed ? "placed · click court to move" : isDrag ? "click court to drop" : "click to pick up"}
                </div>
              </div>
            </button>
          );
        })}
        <div className="text-[11px] text-muted-foreground mt-1.5">
          Tolerance: {q.toleranceRadius}px (within ~5 ft).
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sequence quiz                                                               */
/* -------------------------------------------------------------------------- */

function SortablePhaseItem({
  id,
  index,
  label,
  notes,
  thumbnail,
  status,
}: {
  id: string;
  index: number;
  label: string;
  notes: string;
  thumbnail: React.ReactNode;
  status: "neutral" | "correct" | "wrong";
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const border =
    status === "correct" ? "border-emerald-500/60" : status === "wrong" ? "border-destructive/60" : "border-border";
  const bg = status === "correct" ? "bg-emerald-500/10" : status === "wrong" ? "bg-destructive/10" : "bg-card";

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 rounded-lg border ${border} ${bg} p-2.5`}>
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        aria-label="Drag"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="font-mono text-[11px] text-muted-foreground w-6">{String(index + 1).padStart(2, "0")}</span>
      <div className="rounded overflow-hidden border border-border/60">{thumbnail}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[13px]">{label}</div>
        <div className="text-[11.5px] text-muted-foreground line-clamp-1">{notes}</div>
      </div>
      {status === "correct" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
      {status === "wrong" && <XCircle className="w-4 h-4 text-destructive" />}
    </div>
  );
}

function SequenceQuiz({
  q,
  play,
  order,
  setOrder,
  showFeedback,
}: {
  q: Extract<QuizQuestion, { type: "SEQUENCE" }>;
  play: Play;
  order: string[];
  setOrder: (next: string[]) => void;
  showFeedback: boolean;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const correctOrder = play.phases.map((p) => p.id);

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = order.indexOf(active.id as string);
    const to = order.indexOf(over.id as string);
    if (from === -1 || to === -1) return;
    setOrder(arrayMove(order, from, to));
  }

  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-2">
        Put the play in order
      </div>
      <h3 className="font-display text-xl uppercase tracking-tight mb-3 leading-tight">{q.prompt}</h3>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 max-w-xl">
            {order.map((id, i) => {
              const ph = play.phases.find((p) => p.id === id)!;
              const status: "neutral" | "correct" | "wrong" = !showFeedback
                ? "neutral"
                : correctOrder[i] === id
                ? "correct"
                : "wrong";
              return (
                <SortablePhaseItem
                  key={id}
                  id={id}
                  index={i}
                  label={`${ph.phase}`}
                  notes={ph.notes}
                  thumbnail={<PlayThumbnail phase={ph} width={80} height={60} showLabels={false} />}
                  status={status}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

type Answer =
  | { type: "MC"; selected: number | null }
  | { type: "PLACE"; placements: Record<string, { x: number; y: number }> }
  | { type: "SEQUENCE"; order: string[] };

export function PlayQuizRunner() {
  const [, params] = useRoute("/app/player/quizzes/:id");
  const quizId = params?.id ?? "quiz_horns_flex";
  const quiz: PlayQuizMeta | undefined = getQuiz(quizId);
  const play: Play | undefined = quiz ? getPlay(quiz.playId) : undefined;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const q = quiz?.questions[idx];

  // Initialize the answer object on first view of a question
  useEffect(() => {
    if (!q) return;
    if (answers[q.id]) return;
    if (q.type === "IDENTIFY_ACTION" || q.type === "PREDICT_NEXT") {
      setAnswers((a) => ({ ...a, [q.id]: { type: "MC", selected: null } }));
    } else if (q.type === "PLACE_PLAYER") {
      setAnswers((a) => ({ ...a, [q.id]: { type: "PLACE", placements: {} } }));
    } else if (q.type === "SEQUENCE") {
      setAnswers((a) => ({ ...a, [q.id]: { type: "SEQUENCE", order: [...q.phaseIds] } }));
    }
  }, [q, answers]);

  // Per-question scoring (memoized; safe-guards against missing quiz/play).
  const scores = useMemo(() => {
    if (!quiz || !play) return [] as { id: string; ok: boolean; attempted: boolean }[];
    const safePlay = play;
    return quiz.questions.map((qq) => {
      const a = answers[qq.id];
      if (!a) return { id: qq.id, ok: false, attempted: false };
      if (qq.type === "IDENTIFY_ACTION" || qq.type === "PREDICT_NEXT") {
        const sel = (a as { type: "MC"; selected: number | null }).selected;
        return { id: qq.id, ok: sel === qq.correctIdx, attempted: sel !== null };
      }
      if (qq.type === "PLACE_PLAYER") {
        const placements = (a as { type: "PLACE"; placements: Record<string, { x: number; y: number }> }).placements;
        const phase = safePlay.phases.find((p) => p.id === qq.phaseId)!;
        const allPlaced = qq.placeTokenIds.every((id) => placements[id]);
        if (!allPlaced) return { id: qq.id, ok: false, attempted: Object.keys(placements).length > 0 };
        const okAll = qq.placeTokenIds.every((id) => {
          const target = phase.tokens.find((t) => t.id === id)!;
          return distance(placements[id], target) <= qq.toleranceRadius;
        });
        return { id: qq.id, ok: okAll, attempted: true };
      }
      if (qq.type === "SEQUENCE") {
        const order = (a as { type: "SEQUENCE"; order: string[] }).order;
        const correct = safePlay.phases.map((p) => p.id);
        return { id: qq.id, ok: order.length === correct.length && order.every((id, i) => id === correct[i]), attempted: true };
      }
      // Should be unreachable due to exhaustive union—kept for safety.
      const fallbackId = (qq as { id: string }).id;
      return { id: fallbackId, ok: false, attempted: false };
    });
  }, [answers, quiz, play]);

  // After hooks: render guards.
  if (!quiz || !play || !q) {
    return (
      <AppShell>
        <div className="px-6 lg:px-10 py-12 text-center">
          <h2 className="font-display text-xl mb-2">Quiz not found</h2>
          <p className="text-muted-foreground">Try one of the available play quizzes.</p>
        </div>
      </AppShell>
    );
  }

  // Capture a non-null alias so closures (event handlers) keep narrowing.
  const currentQ = q;

  const correctCount = scores.filter((s) => s.ok).length;
  const totalCount = quiz.questions.length;
  const passed = correctCount / totalCount >= quiz.passThreshold;
  const isRevealed = !!revealed[q.id];

  const isLast = idx === totalCount - 1;

  function commitAnswer(qid: string, partial: Partial<Answer>) {
    setAnswers((a) => ({ ...a, [qid]: { ...(a[qid] as any), ...partial } }));
  }

  function check() {
    setRevealed((r) => ({ ...r, [currentQ.id]: true }));
  }

  function next() {
    if (isLast) {
      setSubmitted(true);
      return;
    }
    setIdx((i) => i + 1);
  }

  function reset() {
    setAnswers({});
    setRevealed({});
    setSubmitted(false);
    setIdx(0);
  }

  if (submitted) {
    return (
      <AppShell>
        <div className="px-6 lg:px-10 py-8 max-w-3xl mx-auto">
          <PageHeader eyebrow="Play Quiz" title="Quiz complete" subtitle={`${quiz.title} — review your results below.`} />
          <div className={`rounded-xl border p-5 mb-4 ${passed ? "border-emerald-500/50 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
            <div className="flex items-center gap-3">
              {passed ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              ) : (
                <XCircle className="w-7 h-7 text-amber-400" />
              )}
              <div>
                <div className="font-display text-xl">
                  {correctCount} / {totalCount} correct ({Math.round((correctCount / totalCount) * 100)}%)
                </div>
                <div className="text-[12.5px] text-muted-foreground">
                  Passing: {Math.round(quiz.passThreshold * 100)}% · {passed ? "Passed — nice work." : "Below pass — review and retry."}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {quiz.questions.map((qq, i) => {
              const s = scores.find((x) => x.id === qq.id)!;
              return (
                <div
                  key={qq.id}
                  className={`rounded-lg border p-3 flex items-center gap-3 ${
                    s.ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5"
                  }`}
                >
                  {s.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-destructive" />}
                  <div className="flex-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Q{i + 1} · {qq.type.replace("_", " ")}
                    </div>
                    <div className="text-[13px] mt-0.5">{qq.prompt}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-5">
            <Button onClick={reset} variant="outline">
              <RotateCcw className="w-4 h-4 mr-1.5" /> Retry
            </Button>
            <Link href="/app/playbook">
              <a>
                <Button>Back to Playbook</Button>
              </a>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-5xl mx-auto">
        <PageHeader
          eyebrow={`Play Quiz · ${play.title}`}
          title={quiz.title}
          subtitle={quiz.description}
        />
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="font-mono">
              Q{idx + 1} of {totalCount}
            </Badge>
            <Progress value={((idx + 1) / totalCount) * 100} className="w-32 h-1.5" />
          </div>

          {(q.type === "IDENTIFY_ACTION" || q.type === "PREDICT_NEXT") && answers[q.id]?.type === "MC" && (
            <MultipleChoice
              q={q}
              play={play}
              selected={(answers[q.id] as any).selected}
              onSelect={(i) => commitAnswer(q.id, { type: "MC", selected: i } as any)}
              showFeedback={isRevealed}
            />
          )}

          {q.type === "PLACE_PLAYER" && answers[q.id]?.type === "PLACE" && (
            <PlacePlayer
              q={q}
              play={play}
              placements={(answers[q.id] as any).placements}
              onPlace={(tokenId, pos) =>
                commitAnswer(q.id, {
                  type: "PLACE",
                  placements: { ...(answers[q.id] as any).placements, [tokenId]: pos },
                } as any)
              }
              showFeedback={isRevealed}
            />
          )}

          {q.type === "SEQUENCE" && answers[q.id]?.type === "SEQUENCE" && (
            <SequenceQuiz
              q={q}
              play={play}
              order={(answers[q.id] as any).order}
              setOrder={(o) => commitAnswer(q.id, { type: "SEQUENCE", order: o } as any)}
              showFeedback={isRevealed}
            />
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <Button variant="ghost" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="flex items-center gap-2">
              {!isRevealed && (q.type === "IDENTIFY_ACTION" || q.type === "PREDICT_NEXT") && isMC(q) && (
                <Button
                  disabled={(answers[q.id] as any)?.selected == null}
                  onClick={check}
                  variant="outline"
                >
                  Check
                </Button>
              )}
              {!isRevealed && q.type === "PLACE_PLAYER" && (
                <Button
                  disabled={Object.keys((answers[q.id] as any)?.placements ?? {}).length < q.placeTokenIds.length}
                  onClick={check}
                  variant="outline"
                >
                  Check
                </Button>
              )}
              {!isRevealed && q.type === "SEQUENCE" && <Button onClick={check} variant="outline">Check</Button>}
              <Button onClick={next} disabled={!isRevealed}>
                {isLast ? "Finish" : "Next"} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default PlayQuizRunner;
