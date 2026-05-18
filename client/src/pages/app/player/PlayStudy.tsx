/**
 * PlayStudy — Player-facing playbook study mode.
 *
 * Routes:
 *   /app/player/plays           → PlayStudyList  (grid of available plays)
 *   /app/player/plays/:id/study → PlayStudyPage  (phase-by-phase walkthrough)
 */
import { useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlayThumbnail } from "@/components/court/PlayThumbnail";
import { allPlays, getPlay, getQuizzesForPlay } from "@/features/playbook/mock";
import type { PlayPath } from "@/features/playbook/mock";

/* -------------------------------------------------------------------------- */
/* Path legend helpers                                                         */
/* -------------------------------------------------------------------------- */

type PathType = PlayPath["type"];

const PATH_LEGEND: Record<PathType, { label: string; color: string }> = {
  PASS: { label: "Pass", color: "oklch(0.85 0.18 80)" },         // amber
  CUT: { label: "Cut", color: "oklch(0.75 0.05 220)" },           // slate
  DRIBBLE: { label: "Dribble", color: "oklch(0.78 0.16 30)" },   // orange
  SCREEN: { label: "Screen", color: "oklch(0.80 0.16 320)" },    // pink
  HANDOFF: { label: "Hand-off", color: "oklch(0.82 0.16 75)" },  // yellow
};

function getPathTypesInPhase(paths: PlayPath[]): PathType[] {
  const seen = new Set<PathType>();
  for (const p of paths) seen.add(p.type);
  return Array.from(seen);
}

/* -------------------------------------------------------------------------- */
/* PlayStudyList                                                               */
/* -------------------------------------------------------------------------- */

export function PlayStudyList() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1200px] mx-auto">
        <PageHeader
          eyebrow="Study Mode"
          title="Playbook Study"
          subtitle="Walk through every play phase by phase. Master the reads, then prove it with a quiz."
        />

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {allPlays.map((play) => {
            const quizzes = getQuizzesForPlay(play.id);
            const hasQuiz = quizzes.length > 0;
            const phaseCount = play.phases.length;

            return (
              <div
                key={play.id}
                className="rounded-xl border border-border bg-card flex flex-col overflow-hidden transition hover:border-primary/40"
              >
                {/* Thumbnail — show phase 0 */}
                <div className="border-b border-border/60 bg-background flex items-center justify-center py-5">
                  <div className="rounded-lg border border-border/60 overflow-hidden">
                    <PlayThumbnail
                      phase={play.phases[0]}
                      width={240}
                      height={180}
                      showLabels
                    />
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1 gap-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base leading-tight">
                        {play.title}
                      </h3>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {phaseCount} phase{phaseCount !== 1 ? "s" : ""}
                        </Badge>
                        {hasQuiz && (
                          <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Quiz available
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">
                      {play.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-auto pt-1">
                    <Badge variant="secondary" className="text-[10.5px]">
                      {play.category}
                    </Badge>
                    {play.tags.slice(0, 2).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[10px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Link href={`/app/player/plays/${play.id}/study`}>
                    <a>
                      <Button className="w-full mt-1" size="sm">
                        <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                        Study →
                      </Button>
                    </a>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/* PlayStudyPage                                                               */
/* -------------------------------------------------------------------------- */

export function PlayStudyPage() {
  const [, params] = useRoute("/app/player/plays/:id/study");
  const playId = params?.id ?? "";
  const play = getPlay(playId);

  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);

  // After hooks — render guards
  if (!play) {
    return (
      <AppShell>
        <div className="px-6 lg:px-10 py-12 max-w-xl mx-auto text-center">
          <h2 className="font-display text-xl mb-2">Play not found</h2>
          <p className="text-[13.5px] text-muted-foreground mb-5">
            This play doesn't exist in the playbook.
          </p>
          <Link href="/app/player/plays">
            <a>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Plays
              </Button>
            </a>
          </Link>
        </div>
      </AppShell>
    );
  }

  const totalPhases = play.phases.length;
  const phase = play.phases[currentPhaseIndex];
  const isFirst = currentPhaseIndex === 0;
  const isLast = currentPhaseIndex === totalPhases - 1;
  const progressValue = ((currentPhaseIndex + 1) / totalPhases) * 100;

  const pathTypesPresent = getPathTypesInPhase(phase.paths);
  const quizzes = getQuizzesForPlay(play.id);
  const firstQuiz = quizzes[0];

  function prev() {
    setCurrentPhaseIndex((i) => Math.max(0, i - 1));
  }

  function next() {
    setCurrentPhaseIndex((i) => Math.min(totalPhases - 1, i + 1));
  }

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[860px] mx-auto">
        {/* Back link */}
        <Link href="/app/player/plays" asChild>
          <a className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors mb-5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Plays
          </a>
        </Link>

        {/* Header */}
        <PageHeader
          eyebrow={`Study Mode · ${play.category}`}
          title={play.title}
          subtitle={play.description}
        />

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11.5px] text-muted-foreground font-mono uppercase tracking-[0.1em]">
              Phase {currentPhaseIndex + 1} of {totalPhases}
            </span>
            <span className="text-[11.5px] text-muted-foreground font-mono">
              {Math.round(progressValue)}%
            </span>
          </div>
          <Progress value={progressValue} className="h-1.5" />
        </div>

        {/* Phase viewer card */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Phase label bar */}
          <div className="px-5 py-3.5 border-b border-border bg-muted/40 flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-[10.5px]">
              Phase {currentPhaseIndex + 1}
            </Badge>
            <span className="text-[13px] font-semibold">
              Phase {currentPhaseIndex + 1} — {phase.phase.replace("_", " ")}
            </span>
          </div>

          {/* Court diagram */}
          <div className="flex justify-center py-6 px-5 bg-background">
            <div className="rounded-xl border border-border/70 overflow-hidden shadow-sm">
              <PlayThumbnail phase={phase} width={560} height={420} showLabels />
            </div>
          </div>

          {/* Phase notes */}
          <div className="px-5 pb-4">
            {phase.notes ? (
              <p className="text-[13px] text-muted-foreground italic leading-relaxed">
                {phase.notes}
              </p>
            ) : (
              <p className="text-[13px] text-muted-foreground italic">
                No notes for this phase.
              </p>
            )}
          </div>

          {/* Path legend */}
          {pathTypesPresent.length > 0 && (
            <div className="px-5 pb-5">
              <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-2">
                Legend
              </div>
              <div className="flex flex-wrap gap-3">
                {pathTypesPresent.map((type) => {
                  const info = PATH_LEGEND[type];
                  return (
                    <div key={type} className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: info.color }}
                      />
                      <span className="text-[12px] text-muted-foreground">
                        {info.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5">
          <Button
            variant="outline"
            onClick={prev}
            disabled={isFirst}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1.5">
            {play.phases.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPhaseIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentPhaseIndex
                    ? "bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
                aria-label={`Go to phase ${i + 1}`}
              />
            ))}
          </div>

          {isLast ? (
            firstQuiz ? (
              <Link href={`/app/player/quizzes/${firstQuiz.id}`}>
                <a>
                  <Button className="gap-1.5">
                    Take Quiz →
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                </a>
              </Link>
            ) : (
              <Button disabled className="gap-1.5">
                Take Quiz →
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            )
          ) : (
            <Button onClick={next} disabled={isLast} className="gap-1.5">
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default PlayStudyPage;
