/**
 * CoachingImpactReportPage — /app/coach/impact-report
 *
 * End-of-season outcome attribution report. Answers: "Did coaching better
 * actually make players better?"
 *
 * Sections:
 *   1. Report Header            — identity + season sentiment headline
 *   2. Season-Over-Season Grid  — 8 metric comparison cards
 *   3. Education Attribution    — module → player outcome linking cards
 *   4. Player Spotlight         — single player development success
 *   5. Areas Still Lagging      — honest, constructive gaps
 *   6. Summary Narrative        — 3-paragraph coach-voice season review
 *   7. Export Actions           — PDF + share with director
 */
import { Link } from "wouter";
import {
  TrendingUp,
  TrendingDown,
  Award,
  BookOpen,
  ArrowRight,
  Download,
  Share2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";
import {
  springImpactReport,
  type SeasonComparison,
  type OutcomeCorrelation,
} from "@/features/coach-metrics/mock";

// ─────────────────────────────────────────────────────────────────────────────
// Colors
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  primary: "oklch(0.72 0.18 290)",
  success: "oklch(0.75 0.12 140)",
  warning: "oklch(0.78 0.16 75)",
  danger:  "oklch(0.68 0.22 25)",
  muted:   "oklch(0.55 0.02 260)",
};

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — Report Header
// ─────────────────────────────────────────────────────────────────────────────

function ReportHeader() {
  const { coachName, season, generatedAt } = springImpactReport;

  return (
    <div className="space-y-4">
      {/* Identity row */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
              Coaching Impact Report
            </div>
            <h1 className="text-[22px] font-bold leading-tight">
              {season} · {coachName}
            </h1>
            <p className="text-[12px] text-muted-foreground mt-1">
              Generated {generatedAt} · Private report
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => toast.info("PDF generation coming soon")}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border text-[12.5px] font-semibold hover:bg-muted/50 transition"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button
              onClick={() => toast.success("Sent to program director")}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md text-[12.5px] font-semibold text-white transition hover:brightness-110"
              style={{ background: C.primary }}
            >
              <Share2 className="w-4 h-4" /> Share with Director
            </button>
          </div>
        </div>
      </div>

      {/* Sentiment headline */}
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: "oklch(0.75 0.12 140 / 0.4)",
          background: "oklch(0.75 0.12 140 / 0.06)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.75 0.12 140 / 0.15)", color: C.success }}
          >
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2
              className="font-bold text-[20px] leading-snug"
              style={{ color: C.success }}
            >
              Strong Season — 3 of 4 key metrics improved year-over-year
            </h2>
            <p className="text-[13px] text-muted-foreground mt-1.5">
              Player retention, IDP quality, and film annotation depth all hit season highs.
              Observation frequency is the one area that needs focus in the fall.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 — Season-Over-Season Comparison Grid
// ─────────────────────────────────────────────────────────────────────────────

function ComparisonCard({ comp }: { comp: SeasonComparison }) {
  const deltaColor = comp.isPositive ? C.success : C.danger;
  const DeltaIcon  = comp.direction === "up" ? TrendingUp : TrendingDown;
  const absDelta   = Math.abs(comp.delta);

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.07em]">
        {comp.metricLabel}
      </div>

      {/* Current value — prominent */}
      <div className="flex items-end gap-1.5">
        <span className="font-bold text-[30px] leading-none font-mono">
          {comp.currentValue}
        </span>
        <span className="text-[13px] text-muted-foreground mb-0.5">{comp.unit}</span>
      </div>

      {/* Prior + delta */}
      <div className="flex items-center justify-between">
        <div className="text-[12px] text-muted-foreground">
          Prior:{" "}
          <span className="font-mono text-[13px]">
            {comp.priorValue} {comp.unit}
          </span>
        </div>
        <div
          className="flex items-center gap-1 text-[13px] font-bold"
          style={{ color: deltaColor }}
        >
          <DeltaIcon className="w-4 h-4" />
          {comp.direction === "up" ? "+" : ""}{absDelta}%
        </div>
      </div>

      {/* Status bar */}
      <div
        className="h-1 rounded-full w-full"
        style={{ background: `${deltaColor.replace(")", " / 0.20)")}` }}
      >
        <div
          className="h-full rounded-full"
          style={{ background: deltaColor, width: `${Math.min(100, absDelta * 2)}%` }}
        />
      </div>
    </div>
  );
}

function SeasonComparisonGrid() {
  const { seasonComparisons } = springImpactReport;

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-[20px]">Season Over Season</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Spring 2026 vs. Fall 2025
        </p>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {seasonComparisons.map((c) => (
          <ComparisonCard key={c.metricLabel} comp={c} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 — Education Attribution
// ─────────────────────────────────────────────────────────────────────────────

const CONFIDENCE_STYLES = {
  strong:   { label: "Strong",   color: C.success },
  moderate: { label: "Moderate", color: C.warning },
  weak:     { label: "Weak",     color: C.muted },
};

function AttributionCard({ item }: { item: OutcomeCorrelation }) {
  const cs = CONFIDENCE_STYLES[item.confidenceLevel];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
        {/* Left — What you learned */}
        <div className="p-5 bg-muted/20">
          <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-2">
            What you learned
          </div>
          <div className="flex items-start gap-2">
            <BookOpen className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.primary }} />
            <p className="text-[13px] leading-snug">{item.coachBehavior}</p>
          </div>
        </div>

        {/* Right — What changed */}
        <div className="p-5">
          <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-2">
            What changed
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.success }} />
            <p className="text-[13px] leading-snug">{item.playerOutcome}</p>
          </div>

          <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] text-muted-foreground">{item.timeLag}</span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: `${cs.color.replace(")", " / 0.12)")}`,
                color: cs.color,
              }}
            >
              {cs.label} correlation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EducationAttributionSection() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-[20px]">What Changed and Why</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Connections between your coaching education and measurable player outcomes.
          These are correlations, not guarantees — but the pattern is clear.
        </p>
      </div>
      <div className="space-y-4">
        {springImpactReport.attributedLearning.map((item, i) => (
          <AttributionCard key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 — Player Spotlight
// ─────────────────────────────────────────────────────────────────────────────

type SkillTrack = { skill: string; start: number; end: number; unit: string };

const SPOTLIGHT_PLAYER = {
  name: "Malik Henderson",
  position: "Guard",
  ageGroup: "15U Elite",
  skills: [
    { skill: "Ball Handling — Left Hand", start: 2.5, end: 4.0, unit: "/ 5.0" },
    { skill: "Off-Ball Reads",            start: 2.0, end: 3.5, unit: "/ 5.0" },
    { skill: "Finishing Under Contact",   start: 2.0, end: 3.0, unit: "/ 5.0" },
  ] as SkillTrack[],
  observationQuote:
    "Malik ran the Euro step clean three times on his left in the Oak Hill game — exactly what we'd been working on in WODs for six weeks. Something clicked this month.",
  timelineHref: "/app/coach/players/p10/idp",
};

function SkillProgressBar({ skill, start, end, unit }: SkillTrack) {
  const max = 5;
  const startPct = (start / max) * 100;
  const gainPct  = ((end - start) / max) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-muted-foreground">{skill}</span>
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-muted-foreground/60">{start}</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
          <span className="font-bold" style={{ color: C.success }}>{end}</span>
          <span className="text-muted-foreground/40 text-[10px]">{unit}</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted/30 relative overflow-hidden">
        {/* Prior level — ghost */}
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ width: `${startPct + gainPct}%`, background: "oklch(0.45 0.02 260 / 0.4)" }}
        />
        {/* Gain — highlight */}
        <div
          className="absolute top-0 h-full rounded-r-full"
          style={{
            left: `${startPct}%`,
            width: `${gainPct}%`,
            background: C.success,
          }}
        />
      </div>
    </div>
  );
}

function PlayerSpotlightSection() {
  const p = SPOTLIGHT_PLAYER;

  return (
    <div>
      <h2 className="font-bold text-[20px] mb-4">Biggest Development Success</h2>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header strip */}
        <div
          className="px-5 py-4 border-b border-border flex items-center gap-4"
          style={{ background: "oklch(0.75 0.12 140 / 0.06)" }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-[15px] font-bold shrink-0"
            style={{ background: "oklch(0.75 0.12 140 / 0.18)", color: C.success }}
          >
            MH
          </div>
          <div>
            <div className="font-bold text-[17px]">{p.name}</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">
              {p.position} · {p.ageGroup}
            </div>
          </div>
          <div className="ml-auto shrink-0">
            <span
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
              style={{
                background: "oklch(0.75 0.12 140 / 0.14)",
                color: C.success,
              }}
            >
              Season Standout
            </span>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Skill trajectories */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-mono mb-3">
              Skill trajectory — start of season to now
            </div>
            <div className="space-y-3">
              {p.skills.map((s) => (
                <SkillProgressBar key={s.skill} {...s} />
              ))}
            </div>
          </div>

          {/* Coach note */}
          <div
            className="rounded-lg border px-4 py-3"
            style={{
              borderColor: "oklch(0.72 0.18 290 / 0.25)",
              background: "oklch(0.72 0.18 290 / 0.04)",
            }}
          >
            <div className="text-[10px] uppercase tracking-[0.1em] font-mono text-muted-foreground mb-2">
              From your observation notes
            </div>
            <blockquote className="text-[13px] leading-relaxed italic">
              "{p.observationQuote}"
            </blockquote>
          </div>

          <Link href={p.timelineHref} asChild>
            <a
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
              style={{ color: C.primary }}
            >
              View full timeline <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 — Areas Still Lagging
// ─────────────────────────────────────────────────────────────────────────────

const MODULE_NAMES: Record<string, string> = {
  course_ai_film:    "Using AI Film Analysis as a Coaching Tool",
  course_practice:   "Practice Design That Actually Develops Players",
  course_ipd:        "Building Individual Player Development Plans",
  course_communication: "Communication That Builds Trust",
};

function LaggingAreasSection() {
  const { laggingAreas } = springImpactReport;

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-[20px]">Areas Still Lagging</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Honest, not harsh. These are the areas where the data suggests the most room to grow.
        </p>
      </div>
      <div className="space-y-3">
        {laggingAreas.map((area, i) => (
          <div
            key={i}
            className="rounded-xl border p-5"
            style={{
              borderColor: "oklch(0.78 0.16 75 / 0.35)",
              background: "oklch(0.78 0.16 75 / 0.04)",
            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{ color: C.warning }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[14px]">{area.metric}</div>
                <p className="text-[13px] text-muted-foreground mt-1 leading-snug">
                  {area.description}
                </p>
                <div
                  className="mt-3 rounded-lg border px-3 py-2.5 flex items-center gap-3"
                  style={{
                    borderColor: "oklch(0.72 0.18 290 / 0.20)",
                    background: "oklch(0.72 0.18 290 / 0.04)",
                  }}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" style={{ color: C.primary }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-muted-foreground">Recommended module</div>
                    <div className="text-[12.5px] font-semibold mt-0.5">
                      {MODULE_NAMES[area.suggestedModule] ?? area.suggestedModule}
                    </div>
                  </div>
                  <Link href={`/app/learn/courses/${area.suggestedModule}`} asChild>
                    <a
                      className="shrink-0 flex items-center gap-1 text-[12px] font-semibold"
                      style={{ color: C.primary }}
                    >
                      Start <ArrowRight className="w-3 h-3" />
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 6 — Summary Narrative
// ─────────────────────────────────────────────────────────────────────────────

function SummaryNarrativeSection() {
  const paragraphs = springImpactReport.overallSummary.split("\n\n");

  const labels = [
    "What went well",
    "What was hard",
    "What to focus on next season",
  ];

  return (
    <div>
      <h2 className="font-bold text-[20px] mb-4">Season Summary</h2>
      <div className="rounded-xl border border-border bg-card p-5 space-y-5">
        {paragraphs.map((para, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="shrink-0 mt-1">
              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                style={{
                  background:
                    i === 0
                      ? "oklch(0.75 0.12 140 / 0.12)"
                      : i === 1
                      ? "oklch(0.78 0.16 75 / 0.12)"
                      : "oklch(0.72 0.18 290 / 0.12)",
                  color:
                    i === 0
                      ? C.success
                      : i === 1
                      ? C.warning
                      : C.primary,
                }}
              >
                {labels[i] ?? `Part ${i + 1}`}
              </span>
            </div>
            <p className="text-[13.5px] leading-relaxed text-foreground flex-1">{para}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 7 — Export Actions
// ─────────────────────────────────────────────────────────────────────────────

function ExportActionsSection() {
  return (
    <div
      className="rounded-xl border p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
      style={{
        borderColor: "oklch(0.72 0.18 290 / 0.25)",
        background: "oklch(0.72 0.18 290 / 0.04)",
      }}
    >
      <div>
        <h3 className="font-semibold text-[15px]">Take this report further</h3>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Download a PDF for your records or send directly to your program director.
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => toast.info("PDF generation coming soon")}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-border text-[13px] font-semibold hover:bg-muted/50 transition"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
        <button
          onClick={() => toast.success("Sent to program director")}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-lg text-[13px] font-semibold text-white transition hover:brightness-110"
          style={{ background: C.primary }}
        >
          <Share2 className="w-4 h-4" /> Share with Director
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CoachingImpactReportPage() {
  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1100px] mx-auto space-y-10">
        <PageHeader
          eyebrow="Coaching Impact · Spring 2026"
          title="Impact Report"
          subtitle="Did coaching better make your players better? Here's the evidence."
          actions={
            <Link href="/app/coach/data-mirror" asChild>
              <a
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border font-semibold text-[12.5px] uppercase tracking-[0.07em] hover:bg-muted/50 transition"
              >
                <TrendingUp className="w-4 h-4" /> Data Mirror
              </a>
            </Link>
          }
        />

        {/* 1 — Report Header + Sentiment */}
        <ReportHeader />

        {/* 2 — Season Over Season */}
        <SeasonComparisonGrid />

        {/* 3 — Education Attribution */}
        <EducationAttributionSection />

        {/* 4 — Player Spotlight */}
        <PlayerSpotlightSection />

        {/* 5 — Lagging Areas */}
        <LaggingAreasSection />

        {/* 6 — Narrative Summary */}
        <SummaryNarrativeSection />

        {/* 7 — Export */}
        <ExportActionsSection />
      </div>
    </AppShell>
  );
}
