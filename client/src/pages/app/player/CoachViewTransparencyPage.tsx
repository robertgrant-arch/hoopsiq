import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";
import { useAssessmentData } from "@/features/assessments";
import { CATEGORY_META } from "@/features/assessments/types";

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

// ─── Data ────────────────────────────────────────────────────────────────────

interface SkillCard {
  skill: string;
  score: number;
  score7: string;
  score8: string;
  trend: "up" | "down" | "flat";
  delta: string;
  observation: string;
  observationDate: string;
}

interface IdpGoal {
  label: string;
  why: string;
  progress: number;
  target: number;
  current: string;
  targetLabel: string;
  color: string;
}

interface QandA {
  question: string;
  answer: string;
  date: string;
}

const SKILL_CARDS: SkillCard[] = [
  {
    skill: "Ball Handling",
    score: 7.2,
    score7: "Handles pressure comfortably in half-court. Attacks downhill with right hand. Crossover is effective but predictable.",
    score8: "Uses both hands equally. Behind-the-back is reliable under pressure. Can create space against any defender.",
    trend: "up",
    delta: "+0.6 this month",
    observation: "Crossover timing improved significantly this week — two straight possessions where he split the trap and found the open man. Right hand still dominant but the intent is there.",
    observationDate: "Coach Grant, Mar 12",
  },
  {
    skill: "Finishing",
    score: 8.1,
    score7: "Finishes effectively with right hand in traffic. Uses body control to absorb contact. Shot selection at the rim is solid.",
    score8: "Ambidextrous finisher. Consistently converts through contact. Uses euro-step and reverse to counter shot blockers.",
    trend: "up",
    delta: "+0.4 this month",
    observation: "Right-hand finishing is now a genuine weapon. Needs to add left-hand options before the next assessment cycle.",
    observationDate: "Coach Grant, Mar 8",
  },
  {
    skill: "Defensive Stance",
    score: 5.9,
    score7: "Maintains low stance for most of a possession. Recovers to help position within 1–2 seconds. Contests shots without fouling.",
    score8: "Stays low through every screen. Reads offensive tendencies before the action. Zero lapses in a full game.",
    trend: "flat",
    delta: "Flat this month",
    observation: "Starts possessions in a great stance — then drifts upright when fatigue sets in. This is the biggest gap right now and the IDP priority.",
    observationDate: "Coach Grant, Mar 15",
  },
  {
    skill: "Basketball IQ",
    score: 7.4,
    score7: "Reads basic actions in real time. Makes the right play 75% of the time in transition. Recognizes common defensive sets.",
    score8: "Anticipates actions before they develop. Directs teammates during live play. Makes complex reads look routine.",
    trend: "down",
    delta: "−0.4 this month",
    observation: "The dip from 7.8 is real but situational — the two-game stretch against pressure defense exposed a gap in reading the floor under stress. Not a regression, more of a calibration.",
    observationDate: "Coach Grant, Mar 18",
  },
  {
    skill: "Court Vision",
    score: 7.0,
    score7: "Sees the floor in half-court offense. Hits the open man on kick-outs. Rarely turns the ball over on predictable reads.",
    score8: "Processes the floor faster than the defense. Throws passes that require teammates to trust before the angle opens.",
    trend: "up",
    delta: "+0.3 this month",
    observation: "The skip pass to the corner has become a reliable read — saw it twice in the tournament. Next step is seeing it before the rotation closes.",
    observationDate: "Coach Grant, Mar 10",
  },
  {
    skill: "Shooting Form",
    score: 6.5,
    score7: "Consistent release point from 15–18 feet. Mechanics hold up late in games. Footwork on catch-and-shoot is reliable.",
    score8: "Elite mechanics from any distance. Can create separation off the dribble and convert. Mechanics survive fatigue and pressure.",
    trend: "flat",
    delta: "Flat this month",
    observation: "Not an IDP focus this cycle — intentionally. Marcus's driving game is the priority. We'll revisit shooting form in the next cycle.",
    observationDate: "Coach Grant, Mar 5",
  },
  {
    skill: "Athleticism",
    score: 7.8,
    score7: "First step is a weapon. Vertical is above 16U average. Lateral quickness tests in top 30%.",
    score8: "Physical tools elevate every skill. Overwhelms defenders athletically at 16U level. Dunk in traffic is a real option.",
    trend: "up",
    delta: "+0.2 this month",
    observation: "The vertical improvement is tracking — 4 inches in 6 months is exceptional. First step has become genuinely elite at this level.",
    observationDate: "Coach Grant, Mar 3",
  },
  {
    skill: "Leadership",
    score: 6.8,
    score7: "Communicates on defense consistently. Sets tone in huddles. Teammates look to him when momentum shifts.",
    score8: "Changes the energy of the game with presence alone. Holds teammates accountable calmly in the moment.",
    trend: "up",
    delta: "+0.5 this month",
    observation: "The timeout conversation in the third quarter of the Westlake game was a 8.0 moment. He kept the team calm when three players were rattled. That's coachable leadership.",
    observationDate: "Coach Grant, Mar 20",
  },
];

const IDP_GOALS: IdpGoal[] = [
  {
    label: "Left-hand finishing",
    why: "Your right-hand finishing is already excellent (8.1). Adding a consistent left opens up the entire right side of the floor for you.",
    progress: 41,
    target: 50,
    current: "41%",
    targetLabel: "Target: 50% by April",
    color: WARNING,
  },
  {
    label: "Pick-and-roll decision time",
    why: "Slow decisions on P&R coverage allow the ball handler to reset and run the action again. Sub-2-second reads close that window entirely.",
    progress: 60,
    target: 100,
    current: "~2.4 sec avg",
    targetLabel: "Target: under 2 seconds",
    color: PRIMARY,
  },
  {
    label: "Defensive stance consistency",
    why: "You start every possession correctly. The gap is the 4th quarter — fatigue pulls you upright. Fixing this makes your 5.9 a 6.5+ in one cycle.",
    progress: 30,
    target: 100,
    current: "Inconsistent",
    targetLabel: "Target: full possession, every possession",
    color: DANGER,
  },
];

const GROWTH_DATA = [5.2, 5.6, 5.8, 6.1, 6.4, 6.7, 7.0, 7.2];
const GROWTH_LABELS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
const GROWTH_ANNOTATIONS: { index: number; label: string }[] = [
  { index: 2, label: "Started IDP focus" },
  { index: 5, label: "Film session w/ Coach" },
  { index: 6, label: "Elite competition tournament" },
];

const RECENT_QA: QandA = {
  question: "Coach, why did my IQ score go from 7.8 to 7.4?",
  answer: "Great question — I'm glad you asked. The dip came from two back-to-back games where the defensive pressure exposed a gap in your floor reads under stress. It's not a regression in what you know, it's a calibration of how you perform that knowledge in high-pressure situations. We're going to work on that specifically this month. The fact that you noticed and asked about it is itself a basketball IQ signal.",
  date: "March 19",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrendArrow({ trend, delta }: { trend: "up" | "down" | "flat"; delta: string }) {
  const color = trend === "up" ? SUCCESS : trend === "down" ? DANGER : MUTED;
  const arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  return (
    <span style={{ fontSize: 13, fontWeight: 600, color, display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 16 }}>{arrow}</span>
      {delta}
    </span>
  );
}

function SkillCardComponent({ card }: { card: SkillCard }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
            {card.skill}
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, color: PRIMARY, lineHeight: 1 }}>
            {card.score.toFixed(1)}
          </div>
          <div style={{ marginTop: 6 }}>
            <TrendArrow trend={card.trend} delta={card.delta} />
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
          }}
        >
          {expanded ? "Less" : "See rubric"}
        </button>
      </div>

      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "var(--bg-base)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: WARNING, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Score 7 means
              </div>
              <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>
                {card.score7}
              </p>
            </div>
            <div style={{ background: "var(--bg-base)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: SUCCESS, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Score 8 means
              </div>
              <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>
                {card.score8}
              </p>
            </div>
          </div>
          <div style={{ background: "var(--bg-base)", borderRadius: 10, padding: "12px 14px", borderLeft: `3px solid ${PRIMARY}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Coach's last note — {card.observationDate}
            </div>
            <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.65, margin: 0, fontStyle: "italic" }}>
              "{card.observation}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function GrowthChart() {
  const W = 680;
  const H = 180;
  const padL = 44;
  const padR = 20;
  const padT = 20;
  const padB = 32;
  const minVal = 5.0;
  const maxVal = 8.0;

  const xStep = (W - padL - padR) / (GROWTH_DATA.length - 1);

  function toX(i: number) {
    return padL + i * xStep;
  }
  function toY(v: number) {
    return padT + ((maxVal - v) / (maxVal - minVal)) * (H - padT - padB);
  }

  const points = GROWTH_DATA.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const areaPoints = [
    `${toX(0).toFixed(1)},${toY(minVal).toFixed(1)}`,
    ...GROWTH_DATA.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`),
    `${toX(GROWTH_DATA.length - 1).toFixed(1)},${toY(minVal).toFixed(1)}`,
  ].join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
      {/* Grid lines */}
      {[5.0, 6.0, 7.0, 8.0].map((v) => (
        <g key={v}>
          <line
            x1={padL} y1={toY(v)} x2={W - padR} y2={toY(v)}
            stroke="var(--border)" strokeWidth={1} strokeDasharray="4 4"
          />
          <text x={padL - 6} y={toY(v) + 4} textAnchor="end" fill={MUTED} fontSize={10} fontWeight={600}>
            {v.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <polygon points={areaPoints} fill={PRIMARY} fillOpacity={0.08} />

      {/* Line */}
      <polyline points={points} fill="none" stroke={PRIMARY} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

      {/* Data points */}
      {GROWTH_DATA.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r={4} fill={PRIMARY} stroke="var(--bg-surface)" strokeWidth={2} />
      ))}

      {/* Annotations */}
      {GROWTH_ANNOTATIONS.map((ann) => {
        const cx = toX(ann.index);
        const cy = toY(GROWTH_DATA[ann.index]);
        return (
          <g key={ann.index}>
            <line x1={cx} y1={cy - 6} x2={cx} y2={cy - 30} stroke={PRIMARY} strokeWidth={1} strokeDasharray="3 3" />
            <rect x={cx - 60} y={cy - 50} width={120} height={22} rx={5} fill={PRIMARY} fillOpacity={0.12} />
            <text x={cx} y={cy - 35} textAnchor="middle" fill={PRIMARY} fontSize={10} fontWeight={700}>
              {ann.label}
            </text>
          </g>
        );
      })}

      {/* X-axis labels */}
      {GROWTH_LABELS.map((label, i) => (
        <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fill={MUTED} fontSize={11} fontWeight={600}>
          {label}
        </text>
      ))}
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CoachViewTransparencyPage() {
  const [message, setMessage] = useState("");
  const { data: assessmentData } = useAssessmentData();

  function handleSend() {
    if (!message.trim()) return;
    toast.success("Message sent to Coach Grant");
    setMessage("");
  }

  // Build a quick lookup from real assessment scores
  const realScores = assessmentData
    ? Object.fromEntries(
        assessmentData.scores
          .filter((s) => s.coachScore !== null)
          .map((s) => [s.category, s.coachScore as number])
      )
    : {};

  return (
    <AppShell>
      <PageHeader
        eyebrow="Your Development"
        title="What Coach Sees"
        subtitle="Radical transparency — exactly what Coach Grant is tracking, what each score means, and what your plan looks like."
      />

      {/* Real score strip from assessments slice */}
      {assessmentData && (
        <div className="max-w-3xl mx-auto px-4 mb-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-4">
              Your Current Coach Scores · All 8 Skills
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {assessmentData.scores.map((score) => {
                const meta = CATEGORY_META[score.category];
                const val  = score.coachScore;
                const color =
                  val === null ? MUTED :
                  val >= 8    ? SUCCESS :
                  val >= 6    ? PRIMARY :
                  val >= 4    ? WARNING : DANGER;
                return (
                  <div key={score.category} className="flex items-center gap-2.5 p-3 rounded-xl border border-border">
                    <span className="text-[18px] leading-none shrink-0">{meta.emoji}</span>
                    <div>
                      <div className="text-[11px] text-muted-foreground leading-tight">{meta.label}</div>
                      <div className="text-[15px] font-bold leading-tight tabular-nums" style={{ color }}>
                        {val !== null ? `${val}/10` : "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 0 72px", display: "flex", flexDirection: "column", gap: 56 }}>

        {/* ── Section 1: Hero ── */}
        <section>
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: "36px 40px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Elevation Basketball 16U Premier · Season 2024–25
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)", margin: 0, lineHeight: 1.2 }}>
              Here's what Coach Grant is looking at.
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-primary)", lineHeight: 1.7, margin: 0, maxWidth: 620 }}>
              Your coach isn't a mystery. Here's exactly what they're tracking for you, what they see, and what they're trying to help you build. This page belongs to you, <strong>Marcus Thompson</strong>.
            </p>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", paddingTop: 8 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
                  Player
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Marcus Thompson</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
                  Coach
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Coach Grant</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
                  Team
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Elevation Basketball 16U Premier</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 2: Assessment Rubric ── */}
        <section>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>
              The Assessment Rubric
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
              Here's every skill Coach Grant scores, what your number means right now, and exactly what a higher score requires. No black box.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {SKILL_CARDS.map((card) => (
              <SkillCardComponent key={card.skill} card={card} />
            ))}
          </div>
        </section>

        {/* ── Section 3: What Coach Is Looking For ── */}
        <section>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>
              What Coach Grant Watches Most
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
              The 3 things Coach Grant pays closest attention to during practice and games — in his words.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                number: "01",
                question: "Do you stay low in your defensive stance when a screen hits you?",
                note: "This is your biggest growth opportunity right now. The way you start a possession is excellent — the question is whether that stance survives contact.",
              },
              {
                number: "02",
                question: "How quickly do you recognize the floor and make decisions in transition?",
                note: "Your half-court reads are strong. The edge will come from processing speed in open space — seeing 3 passes ahead, not 1.",
              },
              {
                number: "03",
                question: "Are your crossovers getting you to the rim or just moving the defense laterally?",
                note: "An effective crossover creates a lane, not just space. Right now yours is creating space. Next level is using that space to attack.",
              },
            ].map((item) => (
              <div
                key={item.number}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "20px 24px",
                  display: "flex",
                  gap: 20,
                  alignItems: "flex-start",
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 900, color: PRIMARY, opacity: 0.3, lineHeight: 1, minWidth: 40 }}>
                  {item.number}
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px", lineHeight: 1.4 }}>
                    "{item.question}"
                  </p>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.65 }}>
                    {item.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 4: IDP ── */}
        <section>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>
              Your Individual Development Plan
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
              Coach Grant built this plan specifically for you. Here's what's in it and why each goal was chosen.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {IDP_GOALS.map((goal, index) => {
              const barPct = Math.min(100, (goal.progress / goal.target) * 100);
              return (
                <div
                  key={goal.label}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    padding: "20px 24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    {index === 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, color: PRIMARY, background: "oklch(0.72 0.18 290 / 0.12)",
                        border: `1px solid ${PRIMARY}`, borderRadius: 5, padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.07em",
                      }}>
                        Primary Goal
                      </span>
                    )}
                    <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      Goal {index + 1}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>
                    {goal.label}
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 14px", lineHeight: 1.65 }}>
                    <strong style={{ color: "var(--text-primary)" }}>Why Coach chose this:</strong> {goal.why}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ flex: 1, background: "var(--bg-base)", borderRadius: 99, height: 8, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${barPct}%`,
                          background: goal.color,
                          borderRadius: 99,
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: goal.color, minWidth: 80, textAlign: "right" }}>
                      {goal.current}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>{goal.targetLabel}</div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16, padding: "14px 18px", background: "var(--bg-surface)", borderRadius: 10, border: "1px solid var(--border)", fontSize: 14, color: "var(--text-muted)" }}>
            Coach Grant last reviewed this plan on <strong style={{ color: "var(--text-primary)" }}>March 8</strong>. Your next reassessment is <strong style={{ color: "var(--text-primary)" }}>April 2</strong>.
          </div>
        </section>

        {/* ── Section 5: Growth Chart ── */}
        <section>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>
              What Getting Better Looks Like
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
              Your ball handling score across 8 assessment cycles — with the moments that mattered.
            </p>
          </div>

          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "24px 28px",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>
              Ball Handling · Assessment History
            </div>
            <GrowthChart />
          </div>

          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                At current pace
              </div>
              <p style={{ fontSize: 14, color: "var(--text-primary)", margin: 0, lineHeight: 1.65 }}>
                You'll reach <strong>8.0 ball handling by end of season</strong> — that's elite at 16U level.
              </p>
            </div>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: SUCCESS, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                What that unlocks
              </div>
              <p style={{ fontSize: 14, color: "var(--text-primary)", margin: 0, lineHeight: 1.65 }}>
                Ball handling at 8.0 means you're a <strong>primary ball handler in late-game situations</strong> and a credible recruiting profile asset.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 6: Ask Coach ── */}
        <section>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>
              Ask Coach A Question
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
              Got a question about your development plan, your scores, or what Coach is looking for? Ask directly.
            </p>
          </div>

          {/* Recent Q&A */}
          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "20px 24px",
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
              Recent Conversation · {RECENT_QA.date}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "var(--bg-base)", borderRadius: 10, padding: "12px 16px", alignSelf: "flex-end", maxWidth: "75%" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, marginBottom: 4 }}>Marcus</div>
                <p style={{ fontSize: 14, color: "var(--text-primary)", margin: 0, lineHeight: 1.6 }}>
                  {RECENT_QA.question}
                </p>
              </div>
              <div style={{ background: `oklch(0.72 0.18 290 / 0.08)`, border: `1px solid oklch(0.72 0.18 290 / 0.2)`, borderRadius: 10, padding: "12px 16px", maxWidth: "85%" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, marginBottom: 4 }}>Coach Grant</div>
                <p style={{ fontSize: 14, color: "var(--text-primary)", margin: 0, lineHeight: 1.65 }}>
                  {RECENT_QA.answer}
                </p>
              </div>
            </div>
          </div>

          {/* Compose */}
          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "20px 24px",
          }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask Coach Grant anything about your scores, your plan, or your development…"
              rows={3}
              style={{
                width: "100%",
                background: "var(--bg-base)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 14,
                color: "var(--text-primary)",
                resize: "vertical",
                fontFamily: "inherit",
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleSend}
                style={{
                  background: PRIMARY,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 22px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Send to Coach Grant
              </button>
            </div>
          </div>
        </section>

      </div>
    </AppShell>
  );
}
