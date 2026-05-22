import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

// ─── Data ────────────────────────────────────────────────────────────────────

interface SkillVelocity {
  skill: string;
  score: number;
  velocity: number;
  velocityLabel: string;
  color: string;
  sparkline: number[];
  badge?: "fastest" | "focus";
}

const SKILLS: SkillVelocity[] = [
  {
    skill: "Ball Handling",
    score: 7.2,
    velocity: 0.8,
    velocityLabel: "+0.8/cycle",
    color: SUCCESS,
    sparkline: [6.0, 6.3, 6.5, 6.8, 7.0, 7.2],
    badge: "fastest",
  },
  {
    skill: "Leadership",
    score: 6.8,
    velocity: 0.5,
    velocityLabel: "+0.5/cycle",
    color: SUCCESS,
    sparkline: [5.8, 6.0, 6.1, 6.4, 6.5, 6.8],
  },
  {
    skill: "Athleticism",
    score: 7.8,
    velocity: 0.4,
    velocityLabel: "+0.4/cycle",
    color: PRIMARY,
    sparkline: [7.0, 7.2, 7.3, 7.4, 7.6, 7.8],
  },
  {
    skill: "Court Vision",
    score: 7.0,
    velocity: 0.3,
    velocityLabel: "+0.3/cycle",
    color: PRIMARY,
    sparkline: [6.2, 6.4, 6.5, 6.7, 6.8, 7.0],
  },
  {
    skill: "Finishing",
    score: 8.1,
    velocity: 0.2,
    velocityLabel: "+0.2/cycle",
    color: WARNING,
    sparkline: [7.7, 7.8, 7.8, 7.9, 8.0, 8.1],
  },
  {
    skill: "Basketball IQ",
    score: 7.4,
    velocity: 0.0,
    velocityLabel: "Flat",
    color: MUTED,
    sparkline: [7.6, 7.5, 7.8, 7.4, 7.5, 7.4],
  },
  {
    skill: "Shooting Form",
    score: 6.5,
    velocity: 0.0,
    velocityLabel: "Flat",
    color: MUTED,
    sparkline: [6.4, 6.5, 6.5, 6.4, 6.5, 6.5],
  },
  {
    skill: "Defensive Stance",
    score: 5.9,
    velocity: -0.1,
    velocityLabel: "−0.1/cycle",
    color: DANGER,
    sparkline: [6.2, 6.1, 6.0, 5.9, 6.0, 5.9],
    badge: "focus",
  },
];

const MAX_VELOCITY = 0.8;

interface TrajectorySkill {
  skill: string;
  history: number[];
  velocity: number;
  color: string;
  projectedEnd: number;
  elite16u: number;
}

const TRAJECTORY_SKILLS: TrajectorySkill[] = [
  {
    skill: "Ball Handling",
    history: [6.0, 6.3, 6.5, 6.8, 7.0, 7.2, 7.4, 7.6],
    velocity: 0.24,
    color: PRIMARY,
    projectedEnd: 8.1,
    elite16u: 7.8,
  },
  {
    skill: "Defensive Stance",
    history: [6.2, 6.1, 6.0, 5.9, 6.0, 5.9, 5.9, 5.9],
    velocity: 0.06,
    color: WARNING,
    projectedEnd: 6.4,
    elite16u: 7.0,
  },
  {
    skill: "Basketball IQ",
    history: [7.2, 7.4, 7.6, 7.8, 7.4, 7.5, 7.4, 7.5],
    velocity: 0.04,
    color: SUCCESS,
    projectedEnd: 8.3,
    elite16u: 7.6,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 44;
  const H = 22;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const xStep = W / (data.length - 1);

  const pts = data.map((v, i) =>
    `${(i * xStep).toFixed(1)},${(H - ((v - min) / range) * H).toFixed(1)}`
  ).join(" ");

  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function VelocityProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return (
    <svg width={80} height={80} viewBox="0 0 80 80">
      <circle cx={40} cy={40} r={r} fill="none" stroke="var(--border)" strokeWidth={6} />
      <circle
        cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ.toFixed(2)}
        strokeDashoffset={offset.toFixed(2)}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
      />
      <text x={40} y={46} textAnchor="middle" fill={color} fontSize={14} fontWeight={900}>1</text>
    </svg>
  );
}

function BellCurveChart() {
  const W = 680;
  const H = 160;
  const padL = 16;
  const padR = 16;
  const padT = 20;
  const padB = 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // Generate bell curve points
  const steps = 80;
  const mean = 0.5;
  const sigma = 0.18;
  const bellPts: string[] = [];
  const areaPts: string[] = [`${padL},${padT + innerH}`];

  for (let i = 0; i <= steps; i++) {
    const x = i / steps;
    const exponent = -Math.pow(x - mean, 2) / (2 * sigma * sigma);
    const y = Math.exp(exponent);
    const px = padL + x * innerW;
    const py = padT + innerH - y * innerH * 0.92;
    bellPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    areaPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  areaPts.push(`${padL + innerW},${padT + innerH}`);

  // Player position (71st percentile → x ≈ 0.71)
  const playerX = padL + 0.71 * innerW;
  const playerY = padT + innerH - Math.exp(-Math.pow(0.71 - mean, 2) / (2 * sigma * sigma)) * innerH * 0.92;

  const zoneBoundaries = [
    { x: 0.25, label: "Bottom 25%", align: "middle" as const, labelX: 0.125 },
    { x: 0.5, label: "Average", align: "middle" as const, labelX: 0.375 },
    { x: 0.75, label: "Top 25%", align: "middle" as const, labelX: 0.625 },
    { x: 1.0, label: "Elite", align: "end" as const, labelX: 0.875 },
  ];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
      {/* Area */}
      <polygon points={areaPts.join(" ")} fill={MUTED} fillOpacity={0.18} />
      {/* Curve */}
      <polyline points={bellPts.join(" ")} fill="none" stroke={MUTED} strokeWidth={2} strokeLinejoin="round" />

      {/* Zone dividers */}
      {zoneBoundaries.slice(0, 3).map((z) => (
        <line
          key={z.x}
          x1={padL + z.x * innerW} y1={padT}
          x2={padL + z.x * innerW} y2={padT + innerH}
          stroke="var(--border)" strokeWidth={1} strokeDasharray="4 4"
        />
      ))}

      {/* Zone labels */}
      {zoneBoundaries.map((z) => (
        <text
          key={z.label}
          x={padL + z.labelX * innerW}
          y={H - 8}
          textAnchor="middle"
          fill={MUTED}
          fontSize={11}
          fontWeight={600}
        >
          {z.label}
        </text>
      ))}

      {/* Player line */}
      <line
        x1={playerX} y1={padT - 4}
        x2={playerX} y2={padT + innerH}
        stroke={PRIMARY} strokeWidth={2.5}
      />

      {/* Player marker */}
      <circle cx={playerX} cy={playerY - 8} r={6} fill={PRIMARY} />
      <text x={playerX} y={playerY - 22} textAnchor="middle" fill={PRIMARY} fontSize={12} fontWeight={800}>
        Marcus
      </text>
      <text x={playerX} y={playerY - 10} textAnchor="middle" fill="var(--bg-surface)" fontSize={9} fontWeight={900}>71</text>
    </svg>
  );
}

function TrajectoryChart({ skill }: { skill: TrajectorySkill }) {
  const W = 280;
  const H = 110;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 24;
  const minVal = 5.0;
  const maxVal = 9.0;

  const histLen = skill.history.length;
  const projLen = 5;
  const totalPoints = histLen + projLen;
  const xStep = (W - padL - padR) / (totalPoints - 1);

  function toX(i: number) { return padL + i * xStep; }
  function toY(v: number) { return padT + ((maxVal - v) / (maxVal - minVal)) * (H - padT - padB); }

  const lastVal = skill.history[histLen - 1];
  const projVals = Array.from({ length: projLen }, (_, i) => Math.min(9.0, lastVal + skill.velocity * (i + 1)));

  const histPts = skill.history.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const projPts = [
    `${toX(histLen - 1).toFixed(1)},${toY(lastVal).toFixed(1)}`,
    ...projVals.map((v, i) => `${toX(histLen + i).toFixed(1)},${toY(v).toFixed(1)}`),
  ].join(" ");

  const eliteY = toY(skill.elite16u);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {/* Elite reference */}
      <line x1={padL} y1={eliteY} x2={W - padR} y2={eliteY} stroke={SUCCESS} strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
      <text x={W - padR - 2} y={eliteY - 4} textAnchor="end" fill={SUCCESS} fontSize={9} fontWeight={700}>Top 25%</text>

      {/* Grid */}
      {[6, 7, 8].map((v) => (
        <g key={v}>
          <line x1={padL} y1={toY(v)} x2={W - padR} y2={toY(v)} stroke="var(--border)" strokeWidth={1} strokeDasharray="2 4" />
          <text x={padL - 4} y={toY(v) + 4} textAnchor="end" fill={MUTED} fontSize={9}>{v}.0</text>
        </g>
      ))}

      {/* Historical solid */}
      <polyline points={histPts} fill="none" stroke={skill.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

      {/* Projection dashed */}
      <polyline points={projPts} fill="none" stroke={skill.color} strokeWidth={2} strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />

      {/* End label */}
      <text
        x={toX(totalPoints - 1) - 2}
        y={toY(projVals[projLen - 1]) - 6}
        textAnchor="end"
        fill={skill.color}
        fontSize={11}
        fontWeight={800}
      >
        {skill.projectedEnd.toFixed(1)}
      </text>
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SkillVelocityPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Your Development"
        title="Growth Engine"
        subtitle="How fast you're improving, where you rank among peers, and where you're headed."
      />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 0 72px", display: "flex", flexDirection: "column", gap: 56 }}>

        {/* ── Section 1: Hero Stats ── */}
        <section>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {/* Fastest Skill */}
            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "24px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Fastest Skill
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: PRIMARY, lineHeight: 1 }}>
                +0.8
                <span style={{ fontSize: 16, fontWeight: 700, color: MUTED }}>/cycle</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Ball Handling</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Your single highest growth rate this season</div>
            </div>

            {/* Growth Percentile */}
            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "24px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Growth Rate Percentile
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: SUCCESS, lineHeight: 1 }}>
                71st
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Versus all 16U players</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Growing faster than 71% of players on HoopsIQ</div>
            </div>

            {/* VDV Cycles */}
            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "24px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-start",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Cycles Until VDV
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <VelocityProgressRing pct={0.5} color={PRIMARY} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.3 }}>
                    1 more verified cycle
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    You're halfway to VDV status
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 2: Velocity Bars ── */}
        <section>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>
              Skill Velocity
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
              Each bar shows your rate of improvement per assessment cycle — not just where you are, but how fast you're moving.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SKILLS.map((skill) => {
              const barWidth = skill.velocity <= 0
                ? 0
                : Math.min(100, (skill.velocity / MAX_VELOCITY) * 100);

              return (
                <div
                  key={skill.skill}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  {/* Skill name + score */}
                  <div style={{ width: 140, flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                        {skill.skill}
                      </span>
                      {skill.badge === "fastest" && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, color: SUCCESS,
                          background: "oklch(0.75 0.12 140 / 0.12)",
                          border: `1px solid ${SUCCESS}`,
                          borderRadius: 4, padding: "1px 5px",
                          textTransform: "uppercase", letterSpacing: "0.06em",
                        }}>
                          Fastest
                        </span>
                      )}
                      {skill.badge === "focus" && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, color: WARNING,
                          background: "oklch(0.78 0.16 75 / 0.12)",
                          border: `1px solid ${WARNING}`,
                          borderRadius: 4, padding: "1px 5px",
                          textTransform: "uppercase", letterSpacing: "0.06em",
                        }}>
                          Focus
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>
                      Current: {skill.score.toFixed(1)}
                    </span>
                  </div>

                  {/* Velocity bar */}
                  <div style={{ flex: 1, background: "var(--bg-base)", borderRadius: 99, height: 10, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${barWidth}%`,
                      background: skill.color,
                      borderRadius: 99,
                      transition: "width 0.5s ease",
                    }} />
                  </div>

                  {/* Label */}
                  <div style={{ width: 100, textAlign: "right", fontSize: 13, fontWeight: 800, color: skill.color, flexShrink: 0 }}>
                    {skill.velocityLabel}
                  </div>

                  {/* Sparkline */}
                  <div style={{ flexShrink: 0 }}>
                    <Sparkline data={skill.sparkline} color={skill.color} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 3: Bell Curve ── */}
        <section>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>
              Growth Rate vs. Your Cohort
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
              Where your improvement rate falls among all 16U players on HoopsIQ this season.
            </p>
          </div>

          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "28px 28px 20px",
          }}>
            <BellCurveChart />
            <div style={{
              marginTop: 20,
              padding: "14px 18px",
              background: `oklch(0.72 0.18 290 / 0.08)`,
              border: `1px solid oklch(0.72 0.18 290 / 0.25)`,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.6,
            }}>
              You're growing faster than <strong style={{ color: PRIMARY }}>71% of 16U players</strong> on HoopsIQ this season. That puts you in the top quartile of player development trajectories at your level.
            </div>
          </div>
        </section>

        {/* ── Section 4: Trajectory Projection ── */}
        <section>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>
              Where You'll Be by End of Season
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
              Solid lines are your history. Dashed lines are your projection at current velocity. The green reference shows the Top 25% threshold at 16U.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {TRAJECTORY_SKILLS.map((skill) => (
              <div
                key={skill.skill}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "18px 18px 14px",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
                  {skill.skill}
                </div>
                <TrajectoryChart skill={skill} />
                <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 700, color: skill.color }}>
                    {skill.history[skill.history.length - 1].toFixed(1)} → {skill.projectedEnd.toFixed(1)}
                  </span>
                  {" "}
                  <span style={{ color: MUTED }}>by April</span>
                  {skill.projectedEnd >= skill.elite16u && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: SUCCESS, fontWeight: 700 }}>
                      ↑ Top 25%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Ball Handling", detail: "Projects above Top 25% at 16U by end of season.", color: SUCCESS },
              { label: "Defensive Stance", detail: "Closes gap to average — from 5.9 toward 6.4.", color: WARNING },
              { label: "Basketball IQ", detail: "Stays in the top 10% — a durable advantage.", color: PRIMARY },
            ].map((item) => (
              <div key={item.label} style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", minWidth: 140 }}>{item.label}</span>
                <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{item.detail}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 5: Velocity Blockers ── */}
        <section>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>
              What's Slowing You Down
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
              Honest, direct, actionable. These are the two things most likely to limit your velocity right now.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                number: "01",
                title: "2 missed assessments this month",
                detail: "Gaps in assessment cycles reduce projection accuracy and may delay VDV verification. Consistent cycles matter — both for your data and for coach trust.",
                color: WARNING,
              },
              {
                number: "02",
                title: "Defensive Stance is your lowest-velocity skill",
                detail: "Coach Grant has this as an IDP priority. Research shows 3 focused practice reps per session on stance consistency can move a skill from flat to +0.3/cycle within 6 weeks.",
                color: DANGER,
              },
            ].map((blocker) => (
              <div
                key={blocker.number}
                style={{
                  background: "var(--bg-surface)",
                  border: `1px solid var(--border)`,
                  borderLeft: `4px solid ${blocker.color}`,
                  borderRadius: 12,
                  padding: "18px 22px",
                  display: "flex",
                  gap: 18,
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 900, color: blocker.color, opacity: 0.4, lineHeight: 1, minWidth: 36 }}>
                  {blocker.number}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
                    {blocker.title}
                  </div>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.65 }}>
                    {blocker.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 6: Motivation ── */}
        <section>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>
              What High Velocity Looks Like
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
              Two anonymized players who started where you are and put in the work. Privacy-safe — no names, just outcomes.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              {
                avatar: "16U Guard",
                story: "A 16U guard with similar starting scores went from 6.2 to 8.0 ball handling in 14 months by focusing every IDP cycle on attack angles. She committed to a D2 program.",
                stat: "6.2 → 8.0",
                statLabel: "Ball Handling in 14 months",
                outcome: "D2 commitment",
                color: PRIMARY,
              },
              {
                avatar: "16U Forward",
                story: "A 16U forward who plateaued at 5.8 defensive stance for 6 months — then made one IDP shift to stance drills. Score jumped to 6.7 in 8 weeks.",
                stat: "5.8 → 6.7",
                statLabel: "Defensive Stance in 8 weeks",
                outcome: "One IDP change",
                color: SUCCESS,
              },
            ].map((story) => (
              <div
                key={story.avatar}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "22px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--bg-base)",
                  borderRadius: 8,
                  padding: "6px 10px",
                  alignSelf: "flex-start",
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: story.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: MUTED }}>{story.avatar} · Anonymized</span>
                </div>

                <p style={{ fontSize: 14, color: "var(--text-primary)", margin: 0, lineHeight: 1.7 }}>
                  {story.story}
                </p>

                <div style={{ display: "flex", gap: 16, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: story.color }}>{story.stat}</div>
                    <div style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{story.statLabel}</div>
                  </div>
                  <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>What it took:</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{story.outcome}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button
              onClick={() => toast.success("Your velocity report has been shared")}
              style={{
                background: PRIMARY,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px 28px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Share My Growth Rate
            </button>
          </div>
        </section>

      </div>
    </AppShell>
  );
}
