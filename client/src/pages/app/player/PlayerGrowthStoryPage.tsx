import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";
import { useGrowthStory } from "@/features/growth-story";
import { WinCard } from "@/features/growth-story/components/WinCard";
import { WeeklyMomentumCard } from "@/features/growth-story/components/WeeklyMomentumCard";

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

// ─── Data ────────────────────────────────────────────────────────────────────

interface Win {
  title: string;
  before: number;
  after: number;
  delta: number;
  quote: string;
  filmEvidence: string;
  color: string;
  isVDV?: boolean;
}

interface SkillJourney {
  skill: string;
  color: string;
  data: number[];
}

interface ImprovementItem {
  skill: string;
  delta: number;
  note?: string;
}

interface WorkingOnItem {
  skill: string;
  delta: number;
  context: string;
}

const WINS: Win[] = [
  {
    title: "Ball Handling became a weapon",
    before: 5.8,
    after: 7.2,
    delta: 1.4,
    quote: "Marcus went from a hesitation dribbler to someone who can create space against any defender. The consistency improvement is real.",
    filmEvidence: "4 film clips corroborate this improvement",
    color: PRIMARY,
  },
  {
    title: "Defensive IQ crossed the threshold",
    before: 5.4,
    after: 6.8,
    delta: 1.4,
    quote: "Defensive positioning took a real leap this month. Starting to anticipate screens instead of reacting.",
    filmEvidence: "2 clips tagged",
    color: SUCCESS,
  },
  {
    title: "VDV Verified",
    before: 0,
    after: 0,
    delta: 0,
    quote: "You are now a Verified Developing Basketball player. This means 2+ cycles of coach-verified improvement. Your development is real and on record.",
    filmEvidence: "",
    color: SUCCESS,
    isVDV: true,
  },
];

const JOURNEY_LABELS = ["Jan 15", "Feb 3", "Feb 21", "Mar 8", "Mar 28", "Apr 15"];
const JOURNEY_ANNOTATIONS: { index: number; label: string }[] = [
  { index: 1, label: "Left-hand drill focus" },
  { index: 3, label: "Film review session" },
  { index: 4, label: "Tournament performance" },
];

const SKILL_JOURNEY: SkillJourney[] = [
  { skill: "Ball Handling", color: PRIMARY,  data: [5.8, 6.1, 6.5, 6.8, 7.0, 7.2] },
  { skill: "Defensive IQ",  color: SUCCESS,  data: [5.4, 5.6, 5.9, 6.2, 6.5, 6.8] },
  { skill: "Court Vision",  color: WARNING,  data: [6.0, 6.2, 6.3, 6.5, 6.7, 6.8] },
  { skill: "Finishing",     color: MUTED,    data: [7.5, 7.6, 7.7, 7.8, 8.0, 8.1] },
];

const IMPROVED: ImprovementItem[] = [
  { skill: "Ball Handling", delta: 1.4, note: "Most improved" },
  { skill: "Defensive IQ",  delta: 1.4 },
  { skill: "Court Vision",  delta: 0.8 },
  { skill: "Finishing",     delta: 0.6 },
];

const WORKING_ON: WorkingOnItem[] = [
  {
    skill: "Shooting Form",
    delta: 0.1,
    context: "Not an IDP focus this period. Coach is intentionally holding this for next cycle.",
  },
  {
    skill: "Athleticism",
    delta: 0.0,
    context: "Physical attributes take longer; this is expected.",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckmarkSVG() {
  return (
    <svg width={56} height={56} viewBox="0 0 56 56" style={{ display: "block" }}>
      <circle cx={28} cy={28} r={26} fill={SUCCESS} fillOpacity={0.15} stroke={SUCCESS} strokeWidth={2} />
      <polyline
        points="16,28 24,36 40,20"
        fill="none"
        stroke={SUCCESS}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BeforeAfterBar({ before, after, max = 10, color }: { before: number; after: number; max?: number; color: string }) {
  const W = 200;
  const H = 44;
  const barH = 14;
  const gap = 8;
  const beforeW = (before / max) * W;
  const afterW = (after / max) * W;

  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      {/* Before */}
      <rect x={0} y={0} width={beforeW} height={barH} rx={barH / 2} fill={MUTED} fillOpacity={0.4} />
      <text x={beforeW + 6} y={barH - 2} fill={MUTED} fontSize={11} fontWeight={700}>
        {before.toFixed(1)}
      </text>
      {/* After */}
      <rect x={0} y={barH + gap} width={afterW} height={barH} rx={barH / 2} fill={color} />
      <text x={afterW + 6} y={barH + gap + barH - 2} fill={color} fontSize={11} fontWeight={700}>
        {after.toFixed(1)}
      </text>
    </svg>
  );
}

function MultiSkillChart() {
  const W = 820;
  const H = 200;
  const padL = 44;
  const padR = 120;
  const padT = 36;
  const padB = 36;
  const minVal = 5.0;
  const maxVal = 8.5;
  const pts = JOURNEY_LABELS.length;
  const xStep = (W - padL - padR) / (pts - 1);

  function toX(i: number) { return padL + i * xStep; }
  function toY(v: number) { return padT + ((maxVal - v) / (maxVal - minVal)) * (H - padT - padB); }

  const gridVals = [5.5, 6.0, 6.5, 7.0, 7.5, 8.0];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
      {/* Grid */}
      {gridVals.map((v) => (
        <g key={v}>
          <line x1={padL} y1={toY(v)} x2={W - padR} y2={toY(v)} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 5" />
          <text x={padL - 6} y={toY(v) + 4} textAnchor="end" fill={MUTED} fontSize={10} fontWeight={600}>{v.toFixed(1)}</text>
        </g>
      ))}

      {/* Annotations */}
      {JOURNEY_ANNOTATIONS.map((ann) => {
        const cx = toX(ann.index);
        return (
          <g key={ann.index}>
            <line x1={cx} y1={padT - 6} x2={cx} y2={H - padB} stroke="var(--border)" strokeWidth={1} strokeDasharray="4 4" />
            <rect x={cx - 58} y={padT - 28} width={116} height={20} rx={5} fill="var(--bg-base)" stroke="var(--border)" strokeWidth={1} />
            <text x={cx} y={padT - 14} textAnchor="middle" fill={MUTED} fontSize={10} fontWeight={700}>
              {ann.label}
            </text>
          </g>
        );
      })}

      {/* Skill lines */}
      {SKILL_JOURNEY.map((skill) => {
        const linePts = skill.data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
        const lastX = toX(pts - 1);
        const lastY = toY(skill.data[pts - 1]);

        return (
          <g key={skill.skill}>
            <polyline
              points={linePts}
              fill="none"
              stroke={skill.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {skill.data.map((v, i) => (
              <circle key={i} cx={toX(i)} cy={toY(v)} r={3.5} fill={skill.color} stroke="var(--bg-surface)" strokeWidth={1.5} />
            ))}
            <text x={lastX + 10} y={lastY + 4} fill={skill.color} fontSize={12} fontWeight={800}>
              {skill.skill}
            </text>
          </g>
        );
      })}

      {/* X labels */}
      {JOURNEY_LABELS.map((label, i) => (
        <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fill={MUTED} fontSize={11} fontWeight={600}>
          {label}
        </text>
      ))}
    </svg>
  );
}

function DeltaBar({ delta, maxDelta = 1.6, color }: { delta: number; maxDelta?: number; color: string }) {
  const pct = Math.min(100, (delta / maxDelta) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, background: "var(--bg-base)", borderRadius: 99, height: 7, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color, minWidth: 36, textAlign: "right" }}>
        +{delta.toFixed(1)}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlayerGrowthStoryPage() {
  const { data: story } = useGrowthStory();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Your Story"
        title={`${story?.playerFirstName ?? "Marcus"}'s Growth Story`}
        subtitle={story ? `${story.periodLabel} · ${Math.round(story.drillCompletionRate * 100)}% drill compliance · ${story.checkInStreak}-day streak` : "Last 30 Days"}
      />

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 0 80px", display: "flex", flexDirection: "column", gap: 48 }}>

        {/* ── Slice: Recent Wins (development-first, real data) ── */}
        {story && story.wins.length > 0 && (
          <section>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 6px" }}>
                Verified Improvements
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
                Coach-confirmed skill gains from the last {story.periodLabel.toLowerCase()}.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {story.wins.map((win) => (
                <WinCard key={win.id} win={win} />
              ))}
            </div>
          </section>
        )}

        {/* ── Slice: Weekly Momentum ── */}
        {story && story.weeklyMomentum.length > 0 && (
          <section>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 6px" }}>
                Weekly Momentum
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
                Consistency builds results. Here's what the last few weeks looked like.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {story.weeklyMomentum.map((week, i) => (
                <WeeklyMomentumCard key={week.weekLabel} week={week} isCurrentWeek={i === 0} />
              ))}
            </div>
          </section>
        )}

        {/* ── Section 1: Journey Header ── */}
        <section>
          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "44px 48px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Background accent */}
            <div style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: PRIMARY,
              opacity: 0.05,
            }} />

            <p style={{
              fontSize: 22,
              fontWeight: 400,
              color: "var(--text-primary)",
              lineHeight: 1.6,
              maxWidth: 640,
              margin: "0 0 28px",
              fontStyle: "italic",
            }}>
              "You came in as a strong ball handler with defensive questions. You leave this period as something more complete."
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: `oklch(0.75 0.12 140 / 0.12)`,
                border: `1px solid ${SUCCESS}`,
                borderRadius: 10,
                padding: "8px 14px",
              }}>
                <svg width={14} height={14} viewBox="0 0 14 14">
                  <circle cx={7} cy={7} r={6} fill="none" stroke={SUCCESS} strokeWidth={1.5} />
                  <polyline points="4,7 6,9 10,5" fill="none" stroke={SUCCESS} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: SUCCESS }}>
                  Verified by Coach Marcus Grant · Elevation Basketball
                </span>
              </div>
              <span style={{ fontSize: 13, color: MUTED }}>January 15 – April 15, 2026</span>
            </div>
          </div>
        </section>

        {/* ── Section 2: Three Big Wins ── */}
        <section>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 8px" }}>
              The Three Big Wins
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-muted)", margin: 0 }}>
              These aren't just numbers. These are real changes in how you play.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {WINS.map((win, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 18,
                  padding: "28px 32px",
                  display: "flex",
                  gap: 32,
                  alignItems: "flex-start",
                }}
              >
                {win.isVDV ? (
                  <div style={{ flexShrink: 0, paddingTop: 4 }}>
                    <CheckmarkSVG />
                  </div>
                ) : (
                  <div style={{ flexShrink: 0, paddingTop: 4 }}>
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: `${win.color}1a`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `2px solid ${win.color}`,
                    }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: win.color }}>{idx + 1}</span>
                    </div>
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 12px", lineHeight: 1.2 }}>
                    {win.isVDV && <span style={{ color: SUCCESS }}>VDV Verified ✓ — </span>}
                    {win.title}
                  </h3>

                  {win.isVDV ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <p style={{ fontSize: 15, color: "var(--text-primary)", margin: 0, lineHeight: 1.7 }}>
                        {win.quote}
                      </p>
                      <div style={{
                        background: `oklch(0.75 0.12 140 / 0.1)`,
                        border: `1px solid ${SUCCESS}`,
                        borderRadius: 10,
                        padding: "12px 16px",
                        fontSize: 14,
                        color: "var(--text-primary)",
                        lineHeight: 1.6,
                      }}>
                        <strong style={{ color: SUCCESS }}>What this means for recruiting:</strong>{" "}
                        Your profile now shows the VDV badge — <strong>3.4× more recruiter engagement</strong> compared to unverified profiles at your skill level.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                            Before → After
                          </div>
                          <BeforeAfterBar before={win.before} after={win.after} color={win.color} />
                          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 22, fontWeight: 900, color: win.color }}>+{win.delta.toFixed(1)}</span>
                            <span style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>overall improvement</span>
                          </div>
                        </div>
                        {win.filmEvidence && (
                          <div style={{ fontSize: 12, color: MUTED, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 14 }}>🎬</span>
                            {win.filmEvidence}
                          </div>
                        )}
                      </div>
                      <div style={{
                        flex: 1,
                        minWidth: 220,
                        background: "var(--bg-base)",
                        borderRadius: 12,
                        padding: "14px 16px",
                        borderLeft: `3px solid ${win.color}`,
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                          Coach Grant says
                        </div>
                        <p style={{ fontSize: 14, color: "var(--text-primary)", margin: 0, lineHeight: 1.7, fontStyle: "italic" }}>
                          "{win.quote}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: Full Skill Journey Chart ── */}
        <section>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 8px" }}>
              The Full Skill Journey
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
              6 assessment points across 90 days. Every line is a skill. Every rise is earned.
            </p>
          </div>

          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 18,
            padding: "28px 28px 20px",
          }}>
            <MultiSkillChart />

            {/* Legend */}
            <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
              {SKILL_JOURNEY.map((skill) => (
                <div key={skill.skill} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 20, height: 3, background: skill.color, borderRadius: 2 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{skill.skill}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 4: What Changed ── */}
        <section>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 8px" }}>
              The Honest Picture
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
              What improved, and what still has runway. Both matter.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Improved */}
            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "24px 26px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: SUCCESS }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  What Improved
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {IMPROVED.map((item) => (
                  <div key={item.skill}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                        {item.skill}
                        {item.note && (
                          <span style={{ marginLeft: 8, fontSize: 11, color: SUCCESS, fontWeight: 700 }}>
                            · {item.note}
                          </span>
                        )}
                      </span>
                    </div>
                    <DeltaBar delta={item.delta} color={SUCCESS} />
                  </div>
                ))}
              </div>
            </div>

            {/* Still working on */}
            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "24px 26px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: WARNING }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  Still Building
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {WORKING_ON.map((item) => (
                  <div key={item.skill}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{item.skill}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: MUTED }}>
                        {item.delta === 0 ? "No change" : `+${item.delta.toFixed(1)}`}
                      </span>
                    </div>
                    <div style={{
                      background: "var(--bg-base)",
                      borderRadius: 8,
                      padding: "10px 12px",
                      fontSize: 13,
                      color: "var(--text-muted)",
                      lineHeight: 1.6,
                    }}>
                      {item.context}
                    </div>
                  </div>
                ))}
                <div style={{
                  marginTop: 4,
                  padding: "12px 14px",
                  background: `oklch(0.78 0.16 75 / 0.08)`,
                  border: `1px solid oklch(0.78 0.16 75 / 0.25)`,
                  borderRadius: 10,
                  fontSize: 13,
                  color: "var(--text-primary)",
                  lineHeight: 1.6,
                }}>
                  These aren't failures. They're scheduled. Coach Grant intentionally stages development — you can't sprint on every front at once.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 5: What Comes Next ── */}
        <section>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 8px" }}>
              What Comes Next
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
              Coach Grant's plan for the next 90 days, spelled out.
            </p>
          </div>

          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 18,
            padding: "28px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Coach Grant's Plan for You
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                {
                  label: "Primary Focus",
                  detail: "Defensive consistency — stay low through the full possession. You're at 5.9 on defensive stance right now. Target: 6.5 by July.",
                  color: DANGER,
                  tag: "Primary",
                },
                {
                  label: "IDP Goal Update",
                  detail: "Left-hand finishing: move from 41% → 55%. Every drive left in practice is a data point.",
                  color: PRIMARY,
                  tag: "Updated",
                },
                {
                  label: "Assessment Schedule",
                  detail: "April 2  ·  May 14  ·  June 28",
                  color: SUCCESS,
                  tag: "Locked In",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                    padding: "16px 18px",
                    background: "var(--bg-base)",
                    borderRadius: 12,
                    borderLeft: `4px solid ${item.color}`,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{item.label}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 800, color: item.color,
                        border: `1px solid ${item.color}`,
                        borderRadius: 4, padding: "1px 6px",
                        textTransform: "uppercase", letterSpacing: "0.06em",
                      }}>
                        {item.tag}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 6: Share ── */}
        <section>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 8px" }}>
              Share This Story
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
              Your growth is real. Share it.
            </p>
          </div>

          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 18,
            padding: "32px 36px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <button
                onClick={() => toast.success("Shared with family — they'll be proud.")}
                style={{
                  background: PRIMARY,
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  lineHeight: 1.3,
                }}
              >
                Share with Family
              </button>
              <button
                onClick={() => toast.success("Growth summary added to your recruiting profile.")}
                style={{
                  background: "var(--bg-base)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "14px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  lineHeight: 1.3,
                }}
              >
                Add to Recruiting Profile
              </button>
              <button
                onClick={() => toast.success("Your growth story PDF is downloading.")}
                style={{
                  background: "var(--bg-base)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "14px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  lineHeight: 1.3,
                }}
              >
                Download as PDF
              </button>
            </div>

            <div style={{
              padding: "12px 16px",
              background: "var(--bg-base)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}>
              <svg width={14} height={14} viewBox="0 0 14 14" style={{ marginTop: 1, flexShrink: 0 }}>
                <circle cx={7} cy={7} r={6} fill="none" stroke={MUTED} strokeWidth={1.2} />
                <text x={7} y={11} textAnchor="middle" fill={MUTED} fontSize={9} fontWeight={900}>i</text>
              </svg>
              <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.65 }}>
                Shared versions only show verified data and never expose coach's private observations.
                Recruiter-facing profiles show your scores, trends, and VDV status — nothing internal.
              </p>
            </div>
          </div>
        </section>

      </div>
    </AppShell>
  );
}
