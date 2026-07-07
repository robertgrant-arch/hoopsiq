/**
 * PlayerVDVContributionPage — Player's own view of their VDV contribution.
 * Route: /app/player/vdv
 */
import { AppShell, PageHeader } from "@/components/app/AppShell";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const IS_VERIFIED = true; // toggle to show "not yet" state

interface SkillScore {
  skill: string;
  current: number;
  prior: number;
  idpFocus: boolean;
}

const SKILLS: SkillScore[] = [
  { skill: "Defense",        current: 7.8, prior: 6.0, idpFocus: false },
  { skill: "Ball Handling",  current: 6.4, prior: 5.8, idpFocus: true  },
  { skill: "Court Vision",   current: 7.2, prior: 6.5, idpFocus: false },
  { skill: "Shooting Form",  current: 6.9, prior: 6.4, idpFocus: false },
  { skill: "Off-Ball Move",  current: 6.1, prior: 5.9, idpFocus: false },
  { skill: "Conditioning",   current: 7.5, prior: 7.1, idpFocus: false },
  { skill: "Rebounding",     current: 6.8, prior: 6.5, idpFocus: false },
  { skill: "IQ / Decision",  current: 7.0, prior: 6.7, idpFocus: false },
];

// Assessment dates and scores for top 3 skills
const ASSESSMENT_DATES = ["Sep 4", "Oct 2", "Oct 30", "Dec 1", "Jan 6", "Feb 3", "Mar 4"];

interface SkillHistory {
  skill: string;
  color: string;
  scores: number[];
}

const SKILL_HISTORIES: SkillHistory[] = [
  { skill: "Defense",       color: PRIMARY, scores: [5.2, 5.8, 6.0, 6.5, 7.0, 7.4, 7.8] },
  { skill: "Ball Handling", color: WARNING, scores: [5.0, 5.2, 5.4, 5.7, 5.9, 6.1, 6.4] },
  { skill: "Court Vision",  color: SUCCESS, scores: [5.5, 5.9, 6.2, 6.4, 6.6, 6.9, 7.2] },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function deltaColor(d: number): string {
  if (d > 0.4) return SUCCESS;
  if (d > 0)   return "oklch(0.72 0.08 140)";
  if (d === 0) return "oklch(0.55 0.02 260)";
  return DANGER;
}

function deltaArrow(d: number): string {
  if (d > 0) return "↑";
  if (d < 0) return "↓";
  return "→";
}

/* -------------------------------------------------------------------------- */
/* VDV Step Diagram                                                            */
/* -------------------------------------------------------------------------- */

function VDVStepDiagram() {
  const steps = [
    { n: 1, title: "Coach Assesses",  body: "Structured rubric across 8 skill categories. No guesswork." },
    { n: 2, title: "Coach Verifies",  body: "Coach confirms the data is accurate and representative." },
    { n: 3, title: "Scores Improve",  body: "Your scores show measurable growth across two consecutive cycles." },
    { n: 4, title: "You're Counted",  body: "You contribute to VDV — a verified signal college programs trust." },
  ];

  const W = 540;
  const H = 64;
  const boxW = 110;
  const boxH = 52;
  const gap = (W - 4 * boxW) / 3;

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" aria-label="VDV step diagram">
      {steps.map((step, i) => {
        const x = i * (boxW + gap);
        const isLast = i === steps.length - 1;
        const color = isLast ? SUCCESS : PRIMARY;

        return (
          <g key={step.n}>
            {/* Box */}
            <rect x={x} y={0} width={boxW} height={boxH} rx="8"
              fill={`${color.replace(")", " / 0.12)")}`} stroke={color} strokeWidth="1.2" />

            {/* Step number */}
            <text x={x + 10} y={16} fill={color} fontSize="10" fontWeight="800">
              {step.n}
            </text>

            {/* Title */}
            <text x={x + boxW / 2} y={26} textAnchor="middle"
              fill="oklch(0.85 0.02 260)" fontSize="10.5" fontWeight="700">
              {step.title}
            </text>

            {/* Body — wrap at ~18 chars */}
            {step.body.length > 26 ? (
              <>
                <text x={x + boxW / 2} y={38} textAnchor="middle"
                  fill="oklch(0.55 0.02 260)" fontSize="8.5">
                  {step.body.slice(0, Math.floor(step.body.length / 2))}…
                </text>
              </>
            ) : (
              <text x={x + boxW / 2} y={40} textAnchor="middle"
                fill="oklch(0.55 0.02 260)" fontSize="8.5">
                {step.body}
              </text>
            )}

            {/* Arrow between boxes */}
            {!isLast && (
              <path
                d={`M ${x + boxW + 6} ${boxH / 2} L ${x + boxW + gap - 6} ${boxH / 2}`}
                stroke={PRIMARY} strokeWidth="1.5" markerEnd="url(#arrow)"
                fill="none"
              />
            )}
          </g>
        );
      })}

      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={PRIMARY} />
        </marker>
      </defs>

      {/* Label under step 4 */}
      <text x={540 - boxW / 2} y={H + 18} textAnchor="middle"
        fill={SUCCESS} fontSize="9" fontWeight="700">
        ← College programs see this
      </text>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Skill Bars                                                                  */
/* -------------------------------------------------------------------------- */

function SkillVelocityBars() {
  const maxDelta = Math.max(...SKILLS.map((s) => Math.abs(s.current - s.prior)));

  return (
    <div className="space-y-3">
      {SKILLS.sort((a, b) => (b.current - b.prior) - (a.current - a.prior)).map((s) => {
        const delta = s.current - s.prior;
        const color = deltaColor(delta);
        const barW = (s.current / 10) * 100;

        return (
          <div key={s.skill}
            className="bg-[var(--bg-base)] rounded-xl p-3 flex items-center gap-4"
          >
            <div className="w-28 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-[var(--text-primary)]">{s.skill}</span>
                {s.idpFocus && (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                    style={{ color: WARNING, background: `${WARNING.replace(")", " / 0.14)")}` }}>
                    IDP
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1">
              <div className="h-6 rounded-lg bg-[var(--bg-surface)] relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full rounded-lg"
                  style={{ width: `${barW}%`, background: `${color.replace(")", " / 0.20)")}`, border: `1px solid ${color.replace(")", " / 0.30)")}` }} />
                <div className="absolute left-0 top-0 h-full rounded-lg flex items-center pl-3">
                  <span className="text-[12px] font-bold" style={{ color }}>{s.current}</span>
                </div>
              </div>
            </div>

            <div className="w-16 text-right shrink-0">
              <span className="text-[14px] font-bold" style={{ color }}>
                {deltaArrow(delta)}{Math.abs(delta).toFixed(1)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Assessment History Line Chart                                               */
/* -------------------------------------------------------------------------- */

function AssessmentHistoryChart() {
  const W = 540;
  const H = 180;
  const PAD_L = 36;
  const PAD_R = 16;
  const PAD_T = 20;
  const PAD_B = 32;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const minY = 4;
  const maxY = 10;

  function toX(i: number) { return PAD_L + (i / (ASSESSMENT_DATES.length - 1)) * chartW; }
  function toY(v: number) { return PAD_T + chartH - ((v - minY) / (maxY - minY)) * chartH; }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Assessment history chart">
      <defs>
        {SKILL_HISTORIES.map((sh) => (
          <linearGradient key={sh.skill} id={`grad-${sh.skill.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sh.color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={sh.color} stopOpacity="0.02" />
          </linearGradient>
        ))}
      </defs>

      {/* Y gridlines */}
      {[5, 6, 7, 8, 9, 10].map((v) => (
        <g key={v}>
          <line x1={PAD_L} y1={toY(v)} x2={W - PAD_R} y2={toY(v)}
            stroke="oklch(0.28 0.01 260)" strokeWidth="0.5" />
          <text x={PAD_L - 4} y={toY(v) + 3} textAnchor="end"
            fill="oklch(0.50 0.02 260)" fontSize="9">{v}</text>
        </g>
      ))}

      {/* Skill lines */}
      {SKILL_HISTORIES.map((sh) => {
        const pts = sh.scores.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
        const areaPath =
          `M ${toX(0)} ${toY(sh.scores[0])} ` +
          sh.scores.map((v, i) => `L ${toX(i)} ${toY(v)}`).join(" ") +
          ` L ${toX(sh.scores.length - 1)} ${H - PAD_B} L ${PAD_L} ${H - PAD_B} Z`;

        return (
          <g key={sh.skill}>
            <path d={areaPath} fill={`url(#grad-${sh.skill.replace(/\s+/g, "")})`} />
            <polyline points={pts} fill="none" stroke={sh.color} strokeWidth="2" strokeLinejoin="round" />
            {sh.scores.map((v, i) => (
              <circle key={i} cx={toX(i)} cy={toY(v)} r="3.5"
                fill={sh.color} />
            ))}
          </g>
        );
      })}

      {/* X labels */}
      {ASSESSMENT_DATES.map((d, i) => (
        <text key={d} x={toX(i)} y={H - 6} textAnchor="middle"
          fill="oklch(0.50 0.02 260)" fontSize="9">{d}</text>
      ))}

      {/* Legend */}
      {SKILL_HISTORIES.map((sh, i) => (
        <g key={sh.skill} transform={`translate(${PAD_L + i * 120}, ${PAD_T - 6})`}>
          <line x1="0" y1="4" x2="14" y2="4" stroke={sh.color} strokeWidth="2" />
          <text x="18" y="8" fill="oklch(0.65 0.02 260)" fontSize="9" fontWeight="600">{sh.skill}</text>
        </g>
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Growth Rate Distribution Curve                                              */
/* -------------------------------------------------------------------------- */

function GrowthDistributionCurve() {
  const W = 480;
  const H = 120;
  const PAD_L = 24;
  const PAD_R = 24;
  const PAD_T = 16;
  const PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  // Normal distribution approximation
  const n = 80;
  const mean = 0.5;  // normalized
  const std = 0.22;
  const playerPos = 0.71; // player is at 71st percentile

  const curve = Array.from({ length: n }, (_, i) => {
    const x = i / (n - 1);
    const y = Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
    return { x, y };
  });

  const maxY = Math.max(...curve.map((p) => p.y));
  function toX(v: number) { return PAD_L + v * chartW; }
  function toY(v: number) { return PAD_T + chartH - (v / maxY) * chartH; }

  const curvePath = curve.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${toX(p.x)} ${toY(p.y)}`
  ).join(" ");

  const areaFillPath =
    curve.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.x)} ${toY(p.y)}`).join(" ") +
    ` L ${toX(1)} ${PAD_T + chartH} L ${PAD_L} ${PAD_T + chartH} Z`;

  const playerX = toX(playerPos);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Player growth rate vs. cohort distribution">
      <defs>
        <linearGradient id="dist-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={PRIMARY} stopOpacity="0.08" />
          <stop offset={`${playerPos * 100}%`} stopColor={SUCCESS} stopOpacity="0.18" />
          <stop offset="100%" stopColor="oklch(0.50 0.02 260)" stopOpacity="0.06" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaFillPath} fill="url(#dist-grad)" />

      {/* Curve */}
      <path d={curvePath} fill="none" stroke="oklch(0.50 0.03 260)" strokeWidth="1.5" />

      {/* Player vertical line */}
      <line x1={playerX} y1={PAD_T} x2={playerX} y2={PAD_T + chartH}
        stroke={SUCCESS} strokeWidth="2" />
      <circle cx={playerX} cy={PAD_T + chartH * 0.15} r="5"
        fill={SUCCESS} />

      {/* Labels */}
      <text x={playerX + 7} y={PAD_T + 14} fill={SUCCESS} fontSize="10" fontWeight="800">You</text>
      <text x={playerX + 7} y={PAD_T + 25} fill={SUCCESS} fontSize="9">71st pct</text>

      {/* X axis labels */}
      <text x={PAD_L} y={H - 6} textAnchor="middle" fill="oklch(0.45 0.02 260)" fontSize="9">
        Slower
      </text>
      <text x={W / 2} y={H - 6} textAnchor="middle" fill="oklch(0.45 0.02 260)" fontSize="9">
        Improvement rate
      </text>
      <text x={W - PAD_R} y={H - 6} textAnchor="end" fill="oklch(0.45 0.02 260)" fontSize="9">
        Faster
      </text>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* VDV Status Hero                                                             */
/* -------------------------------------------------------------------------- */

function VDVStatusHero() {
  if (IS_VERIFIED) {
    return (
      <div
        className="rounded-2xl border border-[var(--border)] p-8 flex flex-col sm:flex-row items-center gap-6"
        style={{ background: `${SUCCESS.replace(")", " / 0.08)")}` }}
      >
        {/* Checkmark SVG */}
        <div className="shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
            <circle cx="36" cy="36" r="34" fill={`${SUCCESS.replace(")", " / 0.15)")}`}
              stroke={SUCCESS} strokeWidth="2" />
            <path d="M20 36 L30 46 L52 24" fill="none" stroke={SUCCESS} strokeWidth="4"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-widest font-bold mb-1" style={{ color: SUCCESS }}>
            Verified Status — Active
          </div>
          <div className="text-[24px] sm:text-[30px] font-black text-[var(--text-primary)] leading-tight">
            You are verified as actively improving.
          </div>
          <p className="text-[13px] text-[var(--text-muted)] mt-2 leading-relaxed max-w-lg">
            Your skill data has been assessed twice in the last 90 days and shows measurable growth.
            Recruiters who view your profile see this verification signal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-[var(--border)] p-8 flex flex-col sm:flex-row items-center gap-6"
      style={{ background: `${WARNING.replace(")", " / 0.08)")}` }}
    >
      <div className="shrink-0">
        <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
          <circle cx="36" cy="36" r="34" fill={`${WARNING.replace(")", " / 0.15)")}`}
            stroke={WARNING} strokeWidth="2" />
          <text x="36" y="44" textAnchor="middle" fill={WARNING} fontSize="28" fontWeight="900">?</text>
        </svg>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-widest font-bold mb-1" style={{ color: WARNING }}>
          Not Yet Verified
        </div>
        <div className="text-[24px] sm:text-[30px] font-black text-[var(--text-primary)] leading-tight">
          Your profile needs updated assessment data.
        </div>
        <p className="text-[13px] text-[var(--text-muted)] mt-2 leading-relaxed max-w-lg">
          To count toward Verified Development Velocity, you need two assessments within 90 days
          showing measurable improvement. Talk to your coach about scheduling one.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function PlayerVDVContributionPage() {
  const fastestSkill = [...SKILLS].sort((a, b) => (b.current - b.prior) - (a.current - a.prior))[0];
  const idpSkill = SKILLS.find((s) => s.idpFocus);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-12">
        <PageHeader
          eyebrow="My Development"
          title="Development Score (VDV)"
          subtitle="How your progress is verified — and what it means for your future"
        />

        {/* ── Section 1: VDV Status ── */}
        <section>
          <VDVStatusHero />
        </section>

        {/* ── Section 2: What VDV Means ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">What "Verified Improvement" Means</h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Four steps from practice to a credibility signal college programs can trust.
            </p>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6">
            <VDVStepDiagram />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { step: "1", label: "Assessment",  desc: "Coach scores you on 8 skill categories using a standardized rubric." },
                { step: "2", label: "Verification", desc: "Coach confirms the data is an accurate representation of your current ability." },
                { step: "3", label: "Improvement",  desc: "Your scores rise across at least two consecutive assessment cycles." },
                { step: "4", label: "VDV",          desc: "You're counted as verified — a signal that travels to recruiting profiles." },
              ].map((item) => (
                <div key={item.step}
                  className="bg-[var(--bg-base)] rounded-xl p-4">
                  <div className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: PRIMARY }}>
                    Step {item.step}
                  </div>
                  <div className="text-[13px] font-bold text-[var(--text-primary)] mb-1">{item.label}</div>
                  <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 3: Skill Velocity ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your Development This Season</h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Current score and change since last assessment. Sorted by fastest growth.
            </p>
          </div>
          <SkillVelocityBars />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <div
              className="rounded-xl p-4 border border-[var(--border)]"
              style={{ background: `${SUCCESS.replace(")", " / 0.08)")}` }}
            >
              <div className="text-[11px] uppercase tracking-widest font-bold mb-1" style={{ color: SUCCESS }}>
                Fastest growing skill
              </div>
              <div className="text-[22px] font-black text-[var(--text-primary)]">{fastestSkill.skill}</div>
              <div className="text-[13px] text-[var(--text-muted)] mt-0.5">
                +{(fastestSkill.current - fastestSkill.prior).toFixed(1)} points this season
              </div>
            </div>
            {idpSkill && (
              <div
                className="rounded-xl p-4 border border-[var(--border)]"
                style={{ background: `${WARNING.replace(")", " / 0.08)")}` }}
              >
                <div className="text-[11px] uppercase tracking-widest font-bold mb-1" style={{ color: WARNING }}>
                  IDP focus area
                </div>
                <div className="text-[22px] font-black text-[var(--text-primary)]">{idpSkill.skill}</div>
                <div className="text-[13px] text-[var(--text-muted)] mt-0.5">
                  Improving at +{(idpSkill.current - idpSkill.prior).toFixed(1)} points/cycle
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 4: Assessment History ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Assessment History</h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Your top 3 skills across all assessment cycles this season. Scale: 1–10.
            </p>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6">
            <AssessmentHistoryChart />

            {/* Latest assessment callout */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {SKILL_HISTORIES.map((sh) => {
                const latest = sh.scores[sh.scores.length - 1];
                const prior  = sh.scores[sh.scores.length - 2];
                const delta  = latest - prior;
                return (
                  <div key={sh.skill} className="bg-[var(--bg-base)] rounded-xl p-3 text-center">
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-1"
                      style={{ color: sh.color }}>{sh.skill}</div>
                    <div className="text-[24px] font-black text-[var(--text-primary)]">{latest}</div>
                    <div className="text-[11px] font-semibold mt-0.5" style={{ color: deltaColor(delta) }}>
                      {deltaArrow(delta)}{Math.abs(delta).toFixed(1)} this cycle
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Section 5: Growth Rate vs. Cohort ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">How You Compare (Anonymized)</h2>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6">
            <GrowthDistributionCurve />

            <div
              className="mt-5 p-4 rounded-xl border border-[var(--border)]"
              style={{ background: `${SUCCESS.replace(")", " / 0.07)")}` }}
            >
              <p className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">
                You're improving faster than 71% of 2027 shooting guards in programs similar to yours.
              </p>
              <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                This doesn't mean you're better than 71% — it means you're improving at a faster rate.
                College coaches care about trajectory as much as current skill level.
                A player trending up is a more attractive recruiting target than one who has plateaued.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 6: What This Means for Recruiting ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">What This Means for Recruiting</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                color:   SUCCESS,
                icon:    "✓",
                title:   "Active Verification Status",
                body:    "Your profile shows verified improvement — recruiters see this as a credibility signal. It distinguishes you from unverified profiles.",
              },
              {
                color:   PRIMARY,
                icon:    "↑",
                title:   "Growth Rate Signal",
                body:    "You're in the top 25% for improvement rate in your position and grad year. This is the trajectory signal coaches look for.",
              },
              {
                color:   WARNING,
                icon:    "→",
                title:   "Next Steps",
                body:    "Your next assessment is in approximately 3 weeks. Consistent improvement over 3+ cycles strengthens your profile significantly.",
              },
            ].map((card) => (
              <div key={card.title}
                className="rounded-2xl border border-[var(--border)] p-5"
                style={{ background: `${card.color.replace(")", " / 0.07)")}` }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] font-black mb-3"
                  style={{ background: `${card.color.replace(")", " / 0.18)")}`, color: card.color }}
                >
                  {card.icon}
                </div>
                <div className="text-[13px] font-bold text-[var(--text-primary)] mb-1.5">{card.title}</div>
                <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 7: What to Focus On ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">What to Focus On</h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Based on your IDP and current scores — from Coach Grant.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5">
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0"
                  style={{ background: `${WARNING.replace(")", " / 0.14)")}` }}
                >
                  🏀
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: WARNING }}>
                      IDP Priority #1
                    </span>
                    <span className="text-[13px] font-bold text-[var(--text-primary)]">Ball Handling</span>
                  </div>
                  <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                    Coach Grant wants you to focus on <strong className="text-[var(--text-primary)]">off-hand dribble control under defensive pressure</strong>.
                    In your last two assessments, you lose possession rate increases when defenders engage your left side.
                    Drill: 2-ball stationary x 8 minutes daily, then cone-weave off-hand only.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5">
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0"
                  style={{ background: `${PRIMARY.replace(")", " / 0.14)")}` }}
                >
                  🛡️
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: PRIMARY }}>
                      Build on Strength
                    </span>
                    <span className="text-[13px] font-bold text-[var(--text-primary)]">Defense</span>
                  </div>
                  <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                    Defense is your highest-growth skill this season (+1.8 points).
                    Coach Grant notes your on-ball pressure has improved significantly.
                    Focus now: <strong className="text-[var(--text-primary)]">help-side positioning</strong> —
                    your next assessment will specifically test weak-side rotation reads.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
