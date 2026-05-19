/**
 * pages/app/player/PlayerAssessmentIDPPage.tsx
 *
 * Assessment → IDP Hub  ·  Route: /app/player/assessments
 *
 * Three tabs:
 *   Scores  — coach assessment scores across all 8 skill categories
 *   Gaps    — side-by-side self vs coach with gap analysis
 *             (self-assessment form when not yet submitted)
 *   My Plan — 3 active IDP focus areas with milestones and drills
 *
 * Architecture:
 *   - All data via features/assessments/ hooks (API → mock fallback)
 *   - All components from features/assessments/components/ (slice-local)
 *   - No logic in this file; page = composition only
 *
 * Slice: features/assessments/
 */

import { useState } from "react";
import { ClipboardCheck, TrendingUp, Target, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { Badge } from "@/components/ui/badge";

// Slice — public index only
import {
  useAssessmentData,
  useAssessmentGaps,
  useSelfAssessment,
  ALL_CATEGORIES,
} from "@/features/assessments";

// Slice-local components (direct import within same slice is fine for pages)
import { ScoreSummaryRow  } from "@/features/assessments/components/ScoreSummaryRow";
import { GapBar           } from "@/features/assessments/components/GapBar";
import { SelfAssessForm   } from "@/features/assessments/components/SelfAssessForm";
import { IDPFocusCard     } from "@/features/assessments/components/IDPFocusCard";

/* -------------------------------------------------------------------------- */
/* Color constants (matches rest of codebase)                                  */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const MUTED   = "oklch(0.55 0.02 260)";

/* -------------------------------------------------------------------------- */
/* Tab config                                                                   */
/* -------------------------------------------------------------------------- */

type Tab = "scores" | "gaps" | "plan";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "scores", label: "Scores",  icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
  { id: "gaps",   label: "Gaps",    icon: <TrendingUp     className="w-3.5 h-3.5" /> },
  { id: "plan",   label: "My Plan", icon: <Target         className="w-3.5 h-3.5" /> },
];

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                     */
/* -------------------------------------------------------------------------- */

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 py-6 max-w-2xl mx-auto">
      <div className="h-5 w-48 rounded bg-muted animate-pulse" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 flex-1 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
      <SkeletonCard lines={4} />
      <SkeletonCard lines={4} />
      <SkeletonCard lines={4} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tab: Scores                                                                  */
/* -------------------------------------------------------------------------- */

function ScoresTab() {
  const { data, isLoading } = useAssessmentData();

  if (isLoading || !data) return <SkeletonCard lines={8} />;

  const assessed  = data.scores.filter((s) => s.coachScore !== null);
  const avgScore  = assessed.length > 0
    ? Math.round(assessed.reduce((sum, s) => sum + (s.coachScore ?? 0), 0) / assessed.length * 10) / 10
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary card */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
            Coach Assessments · {assessed.length}/{ALL_CATEGORIES.length} skills rated
          </div>
          {avgScore !== null && (
            <span className="text-[20px] font-bold" style={{ color: PRIMARY }}>
              {avgScore}
              <span className="text-[12px] font-normal text-muted-foreground">/10 avg</span>
            </span>
          )}
        </div>
        <p className="text-[12px] text-muted-foreground">
          These scores reflect your coach's most recent evaluation. They update after each assessment session.
        </p>
      </div>

      {/* Score rows */}
      <div className="rounded-2xl border border-border bg-card px-5 divide-y divide-border">
        {data.scores.map((score) => (
          <ScoreSummaryRow key={score.category} score={score} />
        ))}
      </div>

      {/* Last assessed */}
      {data.scores[0]?.lastCoachAssessedAt && (
        <p className="text-[11.5px] text-center text-muted-foreground pb-2">
          Last assessed{" "}
          {new Date(data.scores[0].lastCoachAssessedAt).toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric",
          })}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tab: Gaps                                                                    */
/* -------------------------------------------------------------------------- */

function GapsTab() {
  const { data, isLoading } = useAssessmentData();
  const { gaps, topRecommendations } = useAssessmentGaps();
  const { getRating, setRating, getDraftRating, submitSelfAssessment, isPending, isSuccess } =
    useSelfAssessment();

  if (isLoading || !data) return <SkeletonCard lines={6} />;

  const hasSelfAssessment = data.selfAssessmentSubmittedAt !== null;

  // Self-assessment not yet submitted → show form
  if (!hasSelfAssessment) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-2">
            Self-Assessment
          </div>
          <h2 className="text-[16px] font-semibold mb-1">How do you see your game?</h2>
          <p className="text-[12.5px] text-muted-foreground">
            Rate yourself on each skill before seeing your coach's view. The gap between the two
            reveals your top development priorities.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <SelfAssessForm
            getRating={getDraftRating}
            setRating={setRating}
            onSubmit={() => {
              submitSelfAssessment();
              toast.success("Self-assessment submitted! See your gap analysis below.");
            }}
            isPending={isPending}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-0.5">
              Gap Analysis · {gaps.length} skills compared
            </div>
            <h2 className="text-[15px] font-semibold">Your view vs. your coach's</h2>
          </div>
          <Badge
            variant="outline"
            className="text-[10.5px] shrink-0"
            style={{ borderColor: `${PRIMARY}40`, color: PRIMARY }}
          >
            {topRecommendations.length} priority gaps
          </Badge>
        </div>
        <p className="text-[12px] text-muted-foreground">
          Areas where your coach rates you lower than you rate yourself are your highest development
          opportunities. These feed directly into your IDP.
        </p>
      </div>

      {/* Top recommendations callout */}
      {topRecommendations.length > 0 && (
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: `${WARNING}40`, backgroundColor: `${WARNING}08` }}
        >
          <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] mb-2" style={{ color: WARNING }}>
            Recommended Focus Areas
          </div>
          <div className="flex flex-wrap gap-2">
            {topRecommendations.map((g) => (
              <span
                key={g.category}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium border"
                style={{ borderColor: `${WARNING}50`, backgroundColor: `${WARNING}12`, color: WARNING }}
              >
                {`${g.gap > 0 ? "▲" : "●"} ${g.category.replace(/_/g, " ")}: Coach ${g.coachScore} / You ${g.selfScore}`}
              </span>
            ))}
          </div>
          <Link href="/app/player/assessments" asChild>
            <a
              className="inline-flex items-center gap-1 text-[12px] mt-3 font-medium transition-colors"
              style={{ color: WARNING }}
              onClick={() => {/* navigate to plan tab */}}
            >
              See your IDP <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </Link>
        </div>
      )}

      {/* Gap bars — sorted by priority */}
      <div className="rounded-2xl border border-border bg-card px-5 divide-y divide-border/60">
        {gaps.map((gap) => (
          <GapBar key={gap.category} gap={gap} />
        ))}
      </div>

      {/* Re-assess CTA */}
      <div className="rounded-2xl border border-dashed border-border p-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="text-[13px] font-medium">Update your self-assessment</div>
          <div className="text-[11.5px] text-muted-foreground">
            Re-rate yourself after each assessment session.
          </div>
        </div>
        <button
          onClick={() => {
            // Reset selfAssessmentSubmittedAt in local query cache temporarily
            // so the form re-appears — simpler than a dedicated edit flow
            window.location.reload();
          }}
          className="shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
        >
          Re-rate
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tab: My Plan (IDP)                                                           */
/* -------------------------------------------------------------------------- */

function PlanTab() {
  const { data, isLoading } = useAssessmentData();

  if (isLoading || !data) return <SkeletonCard lines={6} />;

  const active = data.idpFocusAreas
    .filter((fa) => fa.status === "active")
    .sort((a, b) => a.priority - b.priority);

  if (active.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <div className="text-3xl mb-3">🎯</div>
        <div className="text-[15px] font-semibold mb-1">No active focus areas yet.</div>
        <div className="text-[13px] text-muted-foreground">
          Complete your self-assessment in the Gaps tab. Your coach will build your plan from the results.
        </div>
      </div>
    );
  }

  const completedMilestones = active.flatMap((fa) => fa.milestones).filter((m) => m.completedAt !== null).length;
  const totalMilestones     = active.flatMap((fa) => fa.milestones).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Plan header */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-1">
          Individual Development Plan · {active.length} focus areas
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Your Priority Skills</h2>
          <span className="text-[12px] text-muted-foreground">
            {completedMilestones}/{totalMilestones} milestones done
          </span>
        </div>

        {/* Overall milestone progress */}
        {totalMilestones > 0 && (
          <div className="mt-3">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round((completedMilestones / totalMilestones) * 100)}%`,
                  backgroundColor: SUCCESS,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* IDP focus area cards */}
      {active.map((area, i) => (
        <IDPFocusCard key={area.id} area={area} rank={i + 1} />
      ))}

      {/* Link to coach for updates */}
      <p className="text-[11.5px] text-center text-muted-foreground pb-2">
        Your plan is set by your coach based on assessment gaps.{" "}
        <Link href="/app/messages" asChild>
          <a className="underline underline-offset-2 hover:text-primary transition-colors">
            Message your coach
          </a>
        </Link>{" "}
        with questions.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                    */
/* -------------------------------------------------------------------------- */

export function PlayerAssessmentIDPPage() {
  const [activeTab, setActiveTab] = useState<Tab>("scores");
  const { data } = useAssessmentData();

  const hasSelf = data?.selfAssessmentSubmittedAt !== null;
  const activePlanCount = data?.idpFocusAreas.filter((f) => f.status === "active").length ?? 0;

  return (
    <AppShell>
      <div className="px-4 py-6 max-w-2xl mx-auto flex flex-col gap-4 pb-12">

        {/* Header */}
        <PageHeader
          eyebrow="Development"
          title="Assessments & Plan"
          subtitle="See how your coach evaluates your skills, compare your own view, and work through your development plan."
        />

        {/* Tab bar */}
        <div className="flex rounded-xl border border-border bg-card p-1 gap-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            // Show badge hints
            const hint =
              tab.id === "gaps" && !hasSelf ? "Rate yourself" :
              tab.id === "plan" && activePlanCount > 0 ? `${activePlanCount} active` :
              null;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-[12px] font-medium transition-all",
                  active
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <span style={{ color: active ? PRIMARY : undefined }}>{tab.icon}</span>
                <span>{tab.label}</span>
                {hint && (
                  <span
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${WARNING}20`, color: WARNING }}
                  >
                    {hint}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "scores" && <ScoresTab />}
        {activeTab === "gaps"   && <GapsTab   />}
        {activeTab === "plan"   && <PlanTab   />}
      </div>
    </AppShell>
  );
}

export default PlayerAssessmentIDPPage;
