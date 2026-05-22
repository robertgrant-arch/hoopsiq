/**
 * FamilyGrowthReportPage — Quarterly family progress report.
 * Route: /app/family/report
 *
 * Designed for parents who aren't coaches. Plain language, warm, motivating.
 *
 * Sections:
 *  1. Quarter in numbers (4 big stat cards)
 *  2. Biggest growth this quarter (top 3 with SVG bars)
 *  3. Coach's assessment (letter-style)
 *  4. Badges earned
 *  5. Development focus / IDP
 *  6. Recruiting profile status
 *  7. Looking ahead
 *  + Footer CTA
 */
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type TrendDir = "up" | "stable" | "needs_attention";

type QuarterStat = {
  label: string;
  value: string;
  sub?: string;
  status: "on_track" | "good" | "neutral";
};

type SkillImprovement = {
  skillName: string;
  plainLabel: string;
  before: number;
  after: number;
  maxScore: number;
  coachQuote: string;
  explanation: string;
};

type EarnedBadge = {
  id: string;
  name: string;
  meaning: string;
  awardedBy: string;
  earnedAt: string;
  colorHue: number;
};

type IDPFocus = {
  id: string;
  area: string;
  plainLabel: string;
  status: TrendDir;
  nextStep: string;
  progressPct: number;
};

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const QUARTER_STATS: QuarterStat[] = [
  {
    label: "Practices attended",
    value: "23 of 25",
    sub: "92% attendance",
    status: "on_track",
  },
  {
    label: "Skill areas improved",
    value: "6 of 8",
    sub: "This quarter",
    status: "good",
  },
  {
    label: "Badges earned",
    value: "2",
    sub: "Q2 total",
    status: "good",
  },
  {
    label: "Film sessions",
    value: "8",
    sub: "Reviewed with coach",
    status: "neutral",
  },
];

const SKILL_IMPROVEMENTS: SkillImprovement[] = [
  {
    skillName: "on_ball_defense",
    plainLabel: "Defense",
    before: 62,
    after: 79,
    maxScore: 100,
    coachQuote:
      "Jordan's positioning has become noticeably more consistent — I'm seeing it every rep.",
    explanation:
      "Jordan's defensive positioning has become noticeably more consistent — coaches noted this in 6 separate sessions this quarter. The footwork improvements from the winter IDP are clearly showing up in games.",
  },
  {
    skillName: "ball_handling",
    plainLabel: "Ball Handling",
    before: 71,
    after: 83,
    maxScore: 100,
    coachQuote:
      "Significant improvement in pressure situations — much more composed.",
    explanation:
      "Under-pressure decision-making with the ball improved substantially. Jordan is no longer reverting to one-handed dribbles when double-teamed, which was a key focus area from last quarter.",
  },
  {
    skillName: "basketball_iq",
    plainLabel: "Court Awareness",
    before: 68,
    after: 76,
    maxScore: 100,
    coachQuote:
      "The film work is paying off. Jordan is seeing the floor much better.",
    explanation:
      "Eight film sessions this quarter paid off in measurable ways. Jordan's read-and-react speed on transition has improved, which coaches measure through a combination of film review and on-court drills.",
  },
];

const EARNED_BADGES: EarnedBadge[] = [
  {
    id: "badge-lockdown",
    name: "Lockdown Defender",
    meaning:
      "Jordan demonstrated elite-level defensive intensity and positioning consistently across a full month of practice and game situations. Coach Marcus officially recognized this after seeing it in 4+ consecutive sessions.",
    awardedBy: "Coach Marcus Webb",
    earnedAt: "2026-04-18",
    colorHue: 140,
  },
  {
    id: "badge-floor-general",
    name: "Floor General",
    meaning:
      "Jordan showed the ability to organize teammates, make correct decisions at pace, and communicate defensive assignments clearly — skills that go beyond individual play.",
    awardedBy: "Coach Marcus Webb",
    earnedAt: "2026-05-02",
    colorHue: 290,
  },
];

const IDP_FOCUS: IDPFocus[] = [
  {
    id: "idp-mid-range",
    area: "mid_range_shooting",
    plainLabel: "Mid-Range Shooting",
    status: "up",
    nextStep:
      "Complete 500 mid-range shots from the elbow by end of May with at least 42% conversion rate.",
    progressPct: 68,
  },
  {
    id: "idp-transition-defense",
    area: "transition_defense",
    plainLabel: "Transition Defense",
    status: "stable",
    nextStep:
      "Review 2 additional film clips of transition defense before next practice.",
    progressPct: 45,
  },
  {
    id: "idp-left-hand",
    area: "weak_hand_dribbling",
    plainLabel: "Left-Hand Dribbling",
    status: "needs_attention",
    nextStep:
      "Add 10 minutes of isolated left-hand dribbling to daily warmup routine.",
    progressPct: 28,
  },
];

const COACH_NARRATIVE = `Jordan has had a standout quarter. The effort I've seen in defensive drills has translated directly into game performance — this isn't just practice improvement, it's real. The film sessions have been a big part of that. Jordan has shown a willingness to see the uncomfortable moments honestly and work through them, which is a quality you can't coach.

The ball-handling gains are real and measurable. What impresses me most is that Jordan is making better decisions under pressure without slowing down — that's a sign of genuine skill internalization, not just pattern repetition.

Looking ahead, the mid-range game is the clearest opportunity. Jordan has the athleticism and the court awareness to become dangerous from 15-17 feet, and that's what separates developing players from Advanced players in our system. We'll spend significant time there in Q3.

I'm proud of what Jordan has accomplished this quarter. The two badges earned are both well-deserved.`;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_CONFIG: Record<
  TrendDir,
  { label: string; color: string; bg: string }
> = {
  up: {
    label: "On track",
    color: "oklch(0.75 0.12 140)",
    bg: "oklch(0.75 0.12 140 / 0.10)",
  },
  stable: {
    label: "In progress",
    color: "oklch(0.78 0.16 75)",
    bg: "oklch(0.78 0.16 75 / 0.10)",
  },
  needs_attention: {
    label: "Needs attention",
    color: "oklch(0.68 0.22 25)",
    bg: "oklch(0.68 0.22 25 / 0.10)",
  },
};

/* -------------------------------------------------------------------------- */
/* SVG before/after comparison bars                                            */
/* -------------------------------------------------------------------------- */

function SkillComparisonBars({
  before,
  after,
  maxScore,
}: {
  before: number;
  after: number;
  maxScore: number;
}) {
  const beforePct = (before / maxScore) * 100;
  const afterPct = (after / maxScore) * 100;
  const BAR_W = 220;
  const BAR_H = 20;
  const GAP = 10;
  const LABEL_W = 36;

  return (
    <svg
      width={LABEL_W + BAR_W + 8}
      height={(BAR_H + GAP) * 2}
      viewBox={`0 0 ${LABEL_W + BAR_W + 8} ${(BAR_H + GAP) * 2}`}
      aria-label={`Before: ${before}, After: ${after}`}
    >
      {/* Before bar */}
      <text
        x={0}
        y={BAR_H / 2 + 5}
        fontSize="11"
        fill="oklch(0.55 0.02 260)"
        fontFamily="sans-serif"
      >
        Before
      </text>
      <rect
        x={LABEL_W}
        y={0}
        width={BAR_W}
        height={BAR_H}
        rx={BAR_H / 2}
        fill="oklch(0.22 0.01 260)"
      />
      <rect
        x={LABEL_W}
        y={0}
        width={(beforePct / 100) * BAR_W}
        height={BAR_H}
        rx={BAR_H / 2}
        fill="oklch(0.55 0.05 260)"
      />
      <text
        x={LABEL_W + (beforePct / 100) * BAR_W + 5}
        y={BAR_H / 2 + 4}
        fontSize="11"
        fill="oklch(0.55 0.02 260)"
        fontFamily="sans-serif"
      >
        {before}
      </text>

      {/* After bar */}
      <text
        x={0}
        y={BAR_H + GAP + BAR_H / 2 + 5}
        fontSize="11"
        fill="oklch(0.75 0.12 140)"
        fontFamily="sans-serif"
        fontWeight="600"
      >
        Now
      </text>
      <rect
        x={LABEL_W}
        y={BAR_H + GAP}
        width={BAR_W}
        height={BAR_H}
        rx={BAR_H / 2}
        fill="oklch(0.22 0.01 260)"
      />
      <rect
        x={LABEL_W}
        y={BAR_H + GAP}
        width={(afterPct / 100) * BAR_W}
        height={BAR_H}
        rx={BAR_H / 2}
        fill="oklch(0.75 0.12 140)"
      />
      <text
        x={LABEL_W + (afterPct / 100) * BAR_W + 5}
        y={BAR_H + GAP + BAR_H / 2 + 4}
        fontSize="11"
        fill="oklch(0.75 0.12 140)"
        fontFamily="sans-serif"
        fontWeight="600"
      >
        {after}
      </text>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Badge SVG icon                                                              */
/* -------------------------------------------------------------------------- */

function BadgeIcon({ hue }: { hue: number }) {
  const color = `oklch(0.72 0.18 ${hue})`;
  return (
    <svg width="52" height="60" viewBox="0 0 52 60" fill="none">
      <path
        d="M26 4L6 12v16c0 14 8.5 26.5 20 30 11.5-3.5 20-16 20-30V12L26 4z"
        fill={`oklch(0.72 0.18 ${hue} / 0.15)`}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M18 30l5 5 11-11"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function FamilyGrowthReportPage() {
  const [narrativeExpanded, setNarrativeExpanded] = useState(false);

  function handleDownloadPDF() {
    toast.info("PDF export coming soon.");
  }

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto">
        <PageHeader
          eyebrow="Q2 2026 Progress Report"
          title="Jordan's Development"
          subtitle="A summary of Jordan's growth this quarter — written for you, not just coaches"
          actions={
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="text-[13px]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="mr-2"
              >
                <path
                  d="M12 16l-4-4h2.5V4h3v8H16l-4 4z"
                  fill="currentColor"
                />
                <path
                  d="M20 18v2H4v-2"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
              Download PDF
            </Button>
          }
        />

        {/* ── Section 1: Quarter in numbers ── */}
        <section className="mb-10">
          <h2
            className="text-[13px] uppercase tracking-[0.12em] font-semibold mb-4"
            style={{ color: "oklch(0.72 0.18 290)" }}
          >
            Quarter in numbers
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUARTER_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border p-4 flex flex-col items-center text-center"
                style={{
                  background: "var(--bg-surface)",
                  borderColor:
                    stat.status === "on_track"
                      ? "oklch(0.75 0.12 140 / 0.25)"
                      : "var(--border)",
                }}
              >
                <div
                  className="leading-none font-bold mb-1"
                  style={{
                    fontSize: "40px",
                    color:
                      stat.status === "on_track"
                        ? "oklch(0.75 0.12 140)"
                        : stat.status === "good"
                        ? "oklch(0.72 0.18 290)"
                        : "var(--text-primary)",
                  }}
                >
                  {stat.value.includes("of") ? (
                    <>
                      <span>{stat.value.split(" of ")[0]}</span>
                      <span
                        style={{
                          fontSize: "22px",
                          color: "var(--text-muted)",
                          fontWeight: 400,
                        }}
                      >
                        /{stat.value.split(" of ")[1]}
                      </span>
                    </>
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-[12px] font-medium text-[var(--text-primary)] leading-tight">
                  {stat.label}
                </div>
                {stat.sub && (
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {stat.sub}
                  </div>
                )}
                {stat.status === "on_track" && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "oklch(0.75 0.12 140)" }}
                    />
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: "oklch(0.75 0.12 140)" }}
                    >
                      On track
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 2: Biggest growth ── */}
        <section className="mb-10">
          <h2
            className="text-[13px] uppercase tracking-[0.12em] font-semibold mb-1"
            style={{ color: "oklch(0.72 0.18 290)" }}
          >
            Biggest growth this quarter
          </h2>
          <p className="text-[13px] text-[var(--text-muted)] mb-4">
            These are the areas where Jordan improved the most, in plain
            language.
          </p>
          <div className="space-y-4">
            {SKILL_IMPROVEMENTS.map((skill, idx) => (
              <div
                key={skill.skillName}
                className="rounded-2xl border p-5"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "oklch(0.75 0.12 140 / 0.20)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wide w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      background: "oklch(0.75 0.12 140 / 0.15)",
                      color: "oklch(0.75 0.12 140)",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <h3 className="text-[16px] font-bold text-[var(--text-primary)]">
                    {skill.plainLabel}
                  </h3>
                  <span
                    className="ml-auto text-[13px] font-bold"
                    style={{ color: "oklch(0.75 0.12 140)" }}
                  >
                    +{skill.after - skill.before} pts
                  </span>
                </div>

                <div className="mb-4 overflow-x-auto">
                  <SkillComparisonBars
                    before={skill.before}
                    after={skill.after}
                    maxScore={skill.maxScore}
                  />
                </div>

                <p className="text-[13px] leading-relaxed text-[var(--text-muted)] mb-3">
                  {skill.explanation}
                </p>

                <blockquote
                  className="border-l-2 pl-3 text-[12px] italic leading-relaxed"
                  style={{
                    borderColor: "oklch(0.72 0.18 290 / 0.35)",
                    color: "var(--text-muted)",
                  }}
                >
                  "{skill.coachQuote}"
                  <span className="not-italic ml-1 text-[11px]">
                    — Coach Marcus Webb
                  </span>
                </blockquote>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: Coach's assessment ── */}
        <section className="mb-10">
          <h2
            className="text-[13px] uppercase tracking-[0.12em] font-semibold mb-1"
            style={{ color: "oklch(0.72 0.18 290)" }}
          >
            Coach's assessment
          </h2>
          <p className="text-[13px] text-[var(--text-muted)] mb-4">
            Coach Marcus Webb's full narrative for Q2 2026.
          </p>
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "var(--bg-surface)",
              borderColor: "oklch(0.72 0.18 290 / 0.15)",
            }}
          >
            {/* Opening quote */}
            <svg
              width="28"
              height="20"
              viewBox="0 0 28 20"
              fill="none"
              className="mb-3"
            >
              <path
                d="M0 12C0 5.37 4.5 1.5 9 0l1.5 2C7.5 3.5 6 6 6 8h4v12H0V12zM18 12C18 5.37 22.5 1.5 27 0l1.5 2C25.5 3.5 24 6 24 8h4v12H18V12z"
                fill="oklch(0.72 0.18 290 / 0.20)"
              />
            </svg>

            <div
              className="text-[14px] leading-[1.8] whitespace-pre-line"
              style={{ color: "var(--text-primary)" }}
            >
              {narrativeExpanded
                ? COACH_NARRATIVE
                : COACH_NARRATIVE.split("\n\n").slice(0, 1).join("\n\n") +
                  "\n\n" +
                  COACH_NARRATIVE.split("\n\n").slice(1, 2).join("\n\n")}
            </div>

            {!narrativeExpanded && (
              <button
                type="button"
                onClick={() => setNarrativeExpanded(true)}
                className="mt-3 text-[13px] font-medium"
                style={{ color: "oklch(0.72 0.18 290)" }}
              >
                Read full assessment →
              </button>
            )}

            <div
              className="mt-5 pt-4 border-t flex items-center justify-between"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Coach Marcus Webb
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Head Coach · Elevation Basketball
                </div>
              </div>
              <div className="text-[12px] text-[var(--text-muted)]">
                May 10, 2026
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 4: Badges earned ── */}
        <section className="mb-10">
          <h2
            className="text-[13px] uppercase tracking-[0.12em] font-semibold mb-1"
            style={{ color: "oklch(0.72 0.18 290)" }}
          >
            Badges earned this quarter
          </h2>
          <p className="text-[13px] text-[var(--text-muted)] mb-4">
            Badges are only awarded when a coach officially recognizes
            consistently demonstrated skill — not from a single session.
          </p>
          <div className="space-y-3">
            {EARNED_BADGES.map((badge) => (
              <div
                key={badge.id}
                className="rounded-2xl border p-5 flex items-start gap-5"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: `oklch(0.72 0.18 ${badge.colorHue} / 0.20)`,
                }}
              >
                <div className="shrink-0">
                  <BadgeIcon hue={badge.colorHue} />
                </div>
                <div className="min-w-0">
                  <div
                    className="text-[16px] font-bold mb-1"
                    style={{
                      color: `oklch(0.72 0.18 ${badge.colorHue})`,
                    }}
                  >
                    {badge.name}
                  </div>
                  <p className="text-[13px] leading-relaxed text-[var(--text-muted)] mb-2">
                    {badge.meaning}
                  </p>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Awarded by {badge.awardedBy} · {formatDate(badge.earnedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 5: Development focus ── */}
        <section className="mb-10">
          <h2
            className="text-[13px] uppercase tracking-[0.12em] font-semibold mb-1"
            style={{ color: "oklch(0.72 0.18 290)" }}
          >
            What Jordan is working on
          </h2>
          <p className="text-[13px] text-[var(--text-muted)] mb-4">
            Current Individual Development Plan focus areas.
          </p>
          <div className="space-y-3">
            {IDP_FOCUS.map((focus) => {
              const cfg = STATUS_CONFIG[focus.status];
              return (
                <div
                  key={focus.id}
                  className="rounded-xl border p-4"
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                      {focus.plainLabel}
                    </h3>
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                      style={{
                        background: cfg.bg,
                        color: cfg.color,
                      }}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    className="w-full h-2 rounded-full overflow-hidden mb-3"
                    style={{ background: "oklch(0.22 0.01 260)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${focus.progressPct}%`,
                        background: cfg.color,
                      }}
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="shrink-0 mt-0.5"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="oklch(0.72 0.18 290)"
                        strokeWidth="1.5"
                        fill="oklch(0.72 0.18 290 / 0.10)"
                      />
                      <path
                        d="M12 8v5l3 2"
                        stroke="oklch(0.72 0.18 290)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <p className="text-[12px] leading-relaxed text-[var(--text-muted)]">
                      <strong className="text-[var(--text-primary)]">
                        Next step:{" "}
                      </strong>
                      {focus.nextStep}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 6: Recruiting profile status ── */}
        <section className="mb-10">
          <h2
            className="text-[13px] uppercase tracking-[0.12em] font-semibold mb-1"
            style={{ color: "oklch(0.72 0.18 290)" }}
          >
            Jordan's recruiting profile
          </h2>
          <div
            className="rounded-2xl border p-5"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div
                  className="text-[28px] font-bold"
                  style={{ color: "oklch(0.75 0.12 140)" }}
                >
                  Public
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Profile visibility
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-[28px] font-bold"
                  style={{ color: "oklch(0.72 0.18 290)" }}
                >
                  3
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Programs viewed this quarter
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-[28px] font-bold"
                  style={{ color: "oklch(0.78 0.16 75)" }}
                >
                  1
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Pending request
                </div>
              </div>
            </div>

            <p className="text-[13px] leading-relaxed text-[var(--text-muted)] mb-4">
              3 college programs have requested to see Jordan's full profile
              this quarter. You have{" "}
              <strong
                className="font-semibold"
                style={{ color: "oklch(0.78 0.16 75)" }}
              >
                1 pending request to review
              </strong>
              . All full-profile access requires your individual approval.
            </p>

            <Link href="/app/family/access-requests" asChild>
              <a
                className="inline-flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors"
                style={{
                  background: "oklch(0.72 0.18 290 / 0.10)",
                  color: "oklch(0.72 0.18 290)",
                }}
              >
                Manage access requests →
              </a>
            </Link>
          </div>
        </section>

        {/* ── Section 7: Looking ahead ── */}
        <section className="mb-10">
          <h2
            className="text-[13px] uppercase tracking-[0.12em] font-semibold mb-1"
            style={{ color: "oklch(0.72 0.18 290)" }}
          >
            Next quarter
          </h2>
          <div
            className="rounded-2xl border p-5"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
          >
            <p className="text-[14px] leading-[1.75] text-[var(--text-primary)]">
              Q3 2026 kicks off June 1st with a full skills reassessment — this
              will be Jordan's 15th assessment on HoopsIQ, giving us the
              clearest view yet of long-term trajectory. Coach Marcus has
              planned a heavy focus on mid-range shooting and transition
              defense, with the AAU tournament circuit in July providing
              real-game evaluation opportunities. Two film sessions are already
              scheduled for early June. Jordan's next badge milestone — the{" "}
              <strong>"Shot Creator"</strong> badge — requires consistent
              mid-range conversion across 3 evaluated sessions.
            </p>
          </div>
        </section>

        {/* ── Footer CTA ── */}
        <div
          className="rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{
            background: "oklch(0.72 0.18 290 / 0.06)",
            borderColor: "oklch(0.72 0.18 290 / 0.20)",
          }}
        >
          <div>
            <div className="text-[14px] font-semibold text-[var(--text-primary)] mb-0.5">
              Questions about Jordan's development?
            </div>
            <div className="text-[13px] text-[var(--text-muted)]">
              Coach Marcus Webb is available to discuss this report.
            </div>
          </div>
          <Button
            onClick={() => toast.info("Opening messaging...")}
            className="shrink-0"
            style={{ background: "oklch(0.72 0.18 290)", color: "white" }}
          >
            Message Coach Webb →
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
