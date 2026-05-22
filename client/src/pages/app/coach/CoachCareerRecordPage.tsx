import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SeasonCard {
  year: string;
  team: string;
  players: number;
  vdvRate: number;
  avgDelta: number;
  modulesCompleted: number;
  achievement: string;
}

interface RadarSkill {
  label: string;
  percentile: number;
}

interface PlayerEvidence {
  id: number;
  name: string;
  position: string;
  seasonsCoached: number;
  sigSkillBefore: number;
  sigSkillAfter: number;
  sigSkillName: string;
  vdv: boolean;
  college: string | null;
  division: string | null;
}

interface EducationModule {
  id: number;
  platform: string;
  topic: string;
  date: string;
  certification: string | null;
}

interface BenchmarkRow {
  metric: string;
  me: number;
  programAvg: number;
  top25: number;
  unit: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SEASONS: SeasonCard[] = [
  {
    year: "2022",
    team: "Elevation 16U Select",
    players: 18,
    vdvRate: 56,
    avgDelta: 1.4,
    modulesCompleted: 2,
    achievement: "Program's first VDV-verified cohort",
  },
  {
    year: "2023",
    team: "Elevation 16U Premier",
    players: 22,
    vdvRate: 63,
    avgDelta: 1.8,
    modulesCompleted: 3,
    achievement: "1 player committed to D2 program",
  },
  {
    year: "2024",
    team: "Elevation 16U Premier",
    players: 26,
    vdvRate: 69,
    avgDelta: 2.1,
    modulesCompleted: 2,
    achievement: "2 players received D1 interest, 1 D2 commit",
  },
  {
    year: "2025",
    team: "Elevation 16U Premier",
    players: 28,
    vdvRate: 71,
    avgDelta: 2.4,
    modulesCompleted: 1,
    achievement: "3 players committed to D1/D2 programs",
  },
];

const RADAR_SKILLS: RadarSkill[] = [
  { label: "Ball Handling", percentile: 72 },
  { label: "Shooting Form", percentile: 68 },
  { label: "Finishing", percentile: 79 },
  { label: "Def. Stance", percentile: 91 },
  { label: "Basketball IQ", percentile: 85 },
  { label: "Court Vision", percentile: 76 },
  { label: "Athleticism", percentile: 61 },
  { label: "Coachability", percentile: 88 },
];

const SIGNATURE_AREAS = [
  {
    skill: "Defensive Stance",
    percentile: 91,
    note: "Players improve lateral quickness and help-defense positioning at a rate in the top 10% of all HoopsIQ coaches.",
  },
  {
    skill: "Coachability",
    percentile: 88,
    note: "Athletes show measurably faster adaptation to feedback — attributed to film-corroborated coaching conversations.",
  },
  {
    skill: "Basketball IQ",
    percentile: 85,
    note: "Systematic play-reading sessions and structured IDP goals drive above-average cognitive development gains.",
  },
];

const PLAYER_EVIDENCE: PlayerEvidence[] = [
  { id: 1, name: "Devon A.",    position: "PG", seasonsCoached: 3, sigSkillBefore: 6.1, sigSkillAfter: 8.4, sigSkillName: "Ball Handling", vdv: true,  college: "Westfield State",  division: "D3" },
  { id: 2, name: "Marcus W.",   position: "SG", seasonsCoached: 2, sigSkillBefore: 6.4, sigSkillAfter: 8.6, sigSkillName: "Shooting Form", vdv: true,  college: "UMass Dartmouth", division: "D3" },
  { id: 3, name: "Caleb H.",    position: "PF", seasonsCoached: 3, sigSkillBefore: 5.9, sigSkillAfter: 8.1, sigSkillName: "Finishing",     vdv: true,  college: "Stonehill",       division: "D2" },
  { id: 4, name: "Isaiah D.",   position: "SG", seasonsCoached: 2, sigSkillBefore: 6.8, sigSkillAfter: 8.0, sigSkillName: "Shooting Form", vdv: true,  college: "Assumption",      division: "D2" },
  { id: 5, name: "Elijah B.",   position: "PG", seasonsCoached: 1, sigSkillBefore: 6.0, sigSkillAfter: 7.8, sigSkillName: "Court Vision",  vdv: false, college: null,              division: null },
  { id: 6, name: "Jordan T.",   position: "SF", seasonsCoached: 2, sigSkillBefore: 6.3, sigSkillAfter: 7.9, sigSkillName: "Def. Stance",   vdv: false, college: null,              division: null },
];

const EDUCATION: EducationModule[] = [
  { id: 1, platform: "HoopsIQ Academy",     topic: "Assessment Science & VDV Methodology",     date: "Jan 2022", certification: "Certified Assessor" },
  { id: 2, platform: "HoopsIQ Academy",     topic: "Writing High-Quality Observations",         date: "Mar 2022", certification: null },
  { id: 3, platform: "USA Basketball",      topic: "Player Development Fundamentals",           date: "Jun 2022", certification: "Youth Development License" },
  { id: 4, platform: "HoopsIQ Academy",     topic: "IDP Goal Setting & Tracking",               date: "Sep 2023", certification: null },
  { id: 5, platform: "NCAA Eligibility Ctr", topic: "Recruiting Process & Compliance Overview", date: "Jan 2023", certification: null },
  { id: 6, platform: "HoopsIQ Academy",     topic: "Film Corroboration Best Practices",         date: "Mar 2024", certification: "Film-Linked Coach" },
  { id: 7, platform: "USA Basketball",      topic: "Advanced Defensive Systems",                date: "Jun 2024", certification: null },
  { id: 8, platform: "HoopsIQ Academy",     topic: "Peer Benchmarking & Coaching Analytics",    date: "Jan 2025", certification: null },
];

const OBS_QUALITY_TREND = [
  { season: "2022", score: 61 },
  { season: "2023", score: 70 },
  { season: "2024", score: 78 },
  { season: "2025", score: 84 },
];

const BENCHMARK: BenchmarkRow[] = [
  { metric: "VDV Rate",               me: 71, programAvg: 54, top25: 73, unit: "%" },
  { metric: "Assessment Cadence",     me: 88, programAvg: 62, top25: 91, unit: "%" },
  { metric: "IDP Quality Score",      me: 82, programAvg: 65, top25: 88, unit: "/100" },
  { metric: "Observation Specificity",me: 84, programAvg: 59, top25: 87, unit: "%" },
  { metric: "Player Retention Rate",  me: 91, programAvg: 73, top25: 94, unit: "%" },
];

const DEFAULT_PHILOSOPHY =
  "I believe great coaching is specific, verifiable, and player-owned. Every drill has a why. Every observation gets context. Players who understand their own development trajectory compete differently — because they believe in the process, not just the outcome.";

// ─── SVG Charts ───────────────────────────────────────────────────────────────

function VdvTrendChart({ seasons }: { seasons: SeasonCard[] }) {
  const W = 320;
  const H = 80;
  const pad = { l: 0, r: 0, t: 8, b: 0 };
  const xs = seasons.map((_, i) => pad.l + (i / (seasons.length - 1)) * (W - pad.l - pad.r));
  const ys = seasons.map((s) => pad.t + (1 - s.vdvRate / 100) * (H - pad.t - pad.b));
  const pathD = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: "visible" }}>
      <path d={pathD} fill="none" stroke={PRIMARY} strokeWidth={2.5} strokeLinejoin="round" />
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r={5} fill={PRIMARY} />
          <text x={x} y={ys[i] - 10} textAnchor="middle" fontSize={11} fill={PRIMARY} fontWeight={700}>
            {seasons[i].vdvRate}%
          </text>
          <text x={x} y={H + 4} textAnchor="middle" fontSize={10} fill={MUTED}>
            {seasons[i].year}
          </text>
        </g>
      ))}
    </svg>
  );
}

function RadarChart({ skills }: { skills: RadarSkill[] }) {
  const cx = 160;
  const cy = 160;
  const r = 120;
  const n = skills.length;

  function point(pct: number, idx: number): [number, number] {
    const angle = (idx / n) * 2 * Math.PI - Math.PI / 2;
    const dist = (pct / 100) * r;
    return [cx + dist * Math.cos(angle), cy + dist * Math.sin(angle)];
  }

  function labelPoint(idx: number): [number, number] {
    const angle = (idx / n) * 2 * Math.PI - Math.PI / 2;
    const dist = r + 22;
    return [cx + dist * Math.cos(angle), cy + dist * Math.sin(angle)];
  }

  const gridLevels = [25, 50, 75, 100];

  const polygonPoints = skills
    .map((s, i) => point(s.percentile, i).join(","))
    .join(" ");

  return (
    <svg viewBox="0 0 320 320" width="100%" style={{ maxWidth: 320, display: "block", margin: "0 auto" }}>
      {/* Grid */}
      {gridLevels.map((lvl) => {
        const pts = Array.from({ length: n }, (_, i) => point(lvl, i).join(",")).join(" ");
        return (
          <polygon
            key={lvl}
            points={pts}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
          />
        );
      })}
      {/* Spokes */}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = point(100, i);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth={1} />;
      })}
      {/* Data */}
      <polygon points={polygonPoints} fill={PRIMARY + "33"} stroke={PRIMARY} strokeWidth={2} />
      {/* Points */}
      {skills.map((s, i) => {
        const [x, y] = point(s.percentile, i);
        return <circle key={i} cx={x} cy={y} r={4} fill={PRIMARY} />;
      })}
      {/* Labels */}
      {skills.map((s, i) => {
        const [x, y] = labelPoint(i);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill="var(--text-muted)"
            fontWeight={600}
          >
            {s.label}
          </text>
        );
      })}
    </svg>
  );
}

function ObsQualityLineChart({ data }: { data: typeof OBS_QUALITY_TREND }) {
  const W = 300;
  const H = 80;
  const padL = 10;
  const padR = 10;
  const padT = 12;
  const padB = 16;
  const xs = data.map((_, i) => padL + (i / (data.length - 1)) * (W - padL - padR));
  const ys = data.map((d) => padT + (1 - d.score / 100) * (H - padT - padB));
  const pathD = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H + 8}`} width="100%" height={H + 8} style={{ overflow: "visible" }}>
      <path d={pathD} fill="none" stroke={SUCCESS} strokeWidth={2.5} strokeLinejoin="round" />
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r={4} fill={SUCCESS} />
          <text x={x} y={ys[i] - 8} textAnchor="middle" fontSize={10} fill={SUCCESS} fontWeight={700}>
            {data[i].score}
          </text>
          <text x={x} y={H + 8} textAnchor="middle" fontSize={9} fill={MUTED}>
            {data[i].season}
          </text>
        </g>
      ))}
    </svg>
  );
}

function BenchmarkChart({ rows }: { rows: BenchmarkRow[] }) {
  const BAR_H = 10;
  const GAP = 34;
  const W = 400;
  const LABEL_W = 170;
  const BAR_W = W - LABEL_W - 8;
  const totalH = rows.length * GAP + 8;

  return (
    <svg viewBox={`0 0 ${W} ${totalH}`} width="100%" style={{ overflow: "visible" }}>
      {rows.map((row, i) => {
        const y = i * GAP + 4;
        return (
          <g key={i}>
            <text x={0} y={y + BAR_H * 1.5} fontSize={12} fill="var(--text-primary)" fontWeight={600}>
              {row.metric}
            </text>
            {/* Program avg */}
            <rect
              x={LABEL_W}
              y={y + 2}
              width={(row.programAvg / 100) * BAR_W}
              height={BAR_H}
              rx={4}
              fill={MUTED + "55"}
            />
            {/* Top 25% */}
            <rect
              x={LABEL_W}
              y={y + 2}
              width={(row.top25 / 100) * BAR_W}
              height={BAR_H}
              rx={4}
              fill={SUCCESS + "55"}
            />
            {/* Me */}
            <rect
              x={LABEL_W}
              y={y + 2}
              width={(row.me / 100) * BAR_W}
              height={BAR_H}
              rx={4}
              fill={PRIMARY}
            />
            <text
              x={LABEL_W + (row.me / 100) * BAR_W + 4}
              y={y + BAR_H * 1.1}
              fontSize={11}
              fill={PRIMARY}
              fontWeight={700}
            >
              {row.me}{row.unit}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachCareerRecordPage() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [philosophyText, setPhilosophyText] = useState(DEFAULT_PHILOSOPHY);
  const [editingPhilosophy, setEditingPhilosophy] = useState(false);
  const [draftPhilosophy, setDraftPhilosophy] = useState(DEFAULT_PHILOSOPHY);

  function savePhilosophy() {
    setPhilosophyText(draftPhilosophy);
    setEditingPhilosophy(false);
    toast.success("Coaching philosophy saved");
  }

  const card = (children: React.ReactNode, style?: React.CSSProperties) => (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "24px 28px",
        ...style,
      }}
    >
      {children}
    </div>
  );

  const sectionLabel = (text: string) => (
    <p
      style={{
        fontSize: 11,
        fontWeight: 800,
        color: MUTED,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        marginBottom: 16,
      }}
    >
      {text}
    </p>
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Professional Record"
        title="Coach Marcus Grant"
        subtitle="Head Coach · Elevation Basketball · 16U Premier"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => toast.success("Profile link copied to clipboard")}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                border: `1.5px solid ${PRIMARY}`,
                background: "transparent",
                color: PRIMARY,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Share My Record
            </button>
            <button
              onClick={() => toast.info("Generating PDF export…")}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                border: "none",
                background: PRIMARY,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Export PDF
            </button>
          </div>
        }
      />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px 60px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Section 1: Career Hero ─────────────────────────────────────────── */}
        {card(
          <>
            {/* Verification badge */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 20,
                    border: `1.5px solid ${SUCCESS}`,
                    background: SUCCESS + "18",
                    color: SUCCESS,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "default",
                  }}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                    <path d="M7 1l1.5 3 3.5.5-2.5 2.5.6 3.5L7 9l-3.1 1.5.6-3.5L2 4.5 5.5 4z" fill={SUCCESS} />
                  </svg>
                  HoopsIQ Verified Coach
                </button>
                {showTooltip && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      width: 260,
                      fontSize: 12,
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                      zIndex: 10,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    }}
                  >
                    This record is based on structured assessments, observed over 4 seasons of data collected through the HoopsIQ platform.
                  </div>
                )}
              </div>
            </div>

            {/* Giant stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
              }}
            >
              {[
                { value: "4 Seasons", label: "Coached on Platform" },
                { value: "94 Players", label: "Developed" },
                { value: "71% VDV", label: "Program Development Rate" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    textAlign: "center",
                    padding: "24px 12px",
                    borderRadius: 12,
                    background: "var(--bg-base)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: 34, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 13, color: MUTED, marginTop: 8 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Section 2: Season-by-Season ──────────────────────────────────────── */}
        {card(
          <>
            {sectionLabel("Season-by-Season Breakdown")}

            {/* VDV trend mini chart */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 10 }}>VDV Rate Trend</p>
              <VdvTrendChart seasons={SEASONS} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...SEASONS].reverse().map((s) => (
                <div
                  key={s.year}
                  style={{
                    background: "var(--bg-base)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "18px 20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>{s.year}</div>
                      <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{s.team} · {s.players} players</div>
                    </div>
                    <div
                      style={{
                        padding: "4px 10px",
                        borderRadius: 20,
                        background: s.vdvRate >= 70 ? SUCCESS + "22" : WARNING + "22",
                        color: s.vdvRate >= 70 ? SUCCESS : WARNING,
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {s.vdvRate}% VDV
                    </div>
                  </div>

                  {/* VDV bar */}
                  <div
                    style={{
                      height: 6,
                      background: "var(--border)",
                      borderRadius: 3,
                      marginBottom: 12,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${s.vdvRate}%`,
                        background: s.vdvRate >= 70 ? SUCCESS : WARNING,
                        borderRadius: 3,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ fontSize: 12, color: MUTED }}>
                      <strong style={{ color: "var(--text-primary)", display: "block" }}>+{s.avgDelta.toFixed(1)}</strong>
                      Avg Skill Delta
                    </div>
                    <div style={{ fontSize: 12, color: MUTED }}>
                      <strong style={{ color: "var(--text-primary)", display: "block" }}>{s.modulesCompleted}</strong>
                      Modules Completed
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: PRIMARY,
                      fontWeight: 600,
                      background: PRIMARY + "12",
                      padding: "6px 10px",
                      borderRadius: 6,
                      display: "inline-block",
                    }}
                  >
                    ★ {s.achievement}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Section 3: Skill Impact Signature ─────────────────────────────── */}
        {card(
          <>
            {sectionLabel("Skill Impact Signature")}
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>
              Where I Make Players Better Most
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
                alignItems: "start",
              }}
            >
              <RadarChart skills={RADAR_SKILLS} />

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {SIGNATURE_AREAS.map((area) => (
                  <div
                    key={area.skill}
                    style={{
                      background: "var(--bg-base)",
                      border: `1px solid ${PRIMARY}44`,
                      borderRadius: 12,
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{area.skill}</span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: PRIMARY,
                        }}
                      >
                        {area.percentile}th %ile
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5, margin: 0 }}>{area.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Section 4: Development Evidence ──────────────────────────────── */}
        {card(
          <>
            {sectionLabel("Development Evidence")}
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Players I've Verified
            </p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>
              Names anonymized for privacy. Recruiting outcomes self-reported and platform-verified.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Player", "Pos", "Seasons", "Sig Skill", "Before", "After", "VDV", "College Outcome"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "8px 10px",
                          color: MUTED,
                          fontWeight: 700,
                          fontSize: 11,
                          letterSpacing: 0.8,
                          textTransform: "uppercase",
                          borderBottom: "1px solid var(--border)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLAYER_EVIDENCE.map((p, i) => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: i < PLAYER_EVIDENCE.length - 1 ? "1px solid var(--border)" : "none",
                        background: i % 2 === 0 ? "transparent" : "var(--bg-base)",
                      }}
                    >
                      <td style={{ padding: "12px 10px", fontWeight: 700, color: "var(--text-primary)" }}>{p.name}</td>
                      <td style={{ padding: "12px 10px", color: MUTED }}>{p.position}</td>
                      <td style={{ padding: "12px 10px", color: MUTED }}>{p.seasonsCoached}</td>
                      <td style={{ padding: "12px 10px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{p.sigSkillName}</td>
                      <td style={{ padding: "12px 10px", color: MUTED }}>{p.sigSkillBefore.toFixed(1)}</td>
                      <td style={{ padding: "12px 10px", color: SUCCESS, fontWeight: 700 }}>{p.sigSkillAfter.toFixed(1)}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 20,
                            background: p.vdv ? SUCCESS + "22" : WARNING + "22",
                            color: p.vdv ? SUCCESS : WARNING,
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        >
                          {p.vdv ? "Verified" : "Developing"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        {p.college ? (
                          <span style={{ color: PRIMARY, fontWeight: 600 }}>
                            {p.college} ({p.division})
                          </span>
                        ) : (
                          <span style={{ color: MUTED }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Section 5: Professional Development ──────────────────────────── */}
        {card(
          <>
            {sectionLabel("Professional Development")}

            {/* Education modules */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>
                Education Completed ({EDUCATION.length} modules)
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {EDUCATION.map((mod) => (
                  <div
                    key={mod.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: "var(--bg-base)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 2 }}>
                        {mod.topic}
                      </div>
                      <div style={{ fontSize: 12, color: MUTED }}>{mod.platform} · {mod.date}</div>
                    </div>
                    {mod.certification && (
                      <div
                        style={{
                          padding: "4px 10px",
                          borderRadius: 20,
                          background: SUCCESS + "18",
                          color: SUCCESS,
                          fontSize: 11,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          marginLeft: 12,
                        }}
                      >
                        {mod.certification}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Observation quality trend */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                Observation Quality Score
              </p>
              <p style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>Trending upward across all 4 seasons</p>
              <ObsQualityLineChart data={OBS_QUALITY_TREND} />
            </div>

            {/* Philosophy */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Coaching Philosophy Statement
                </p>
                {!editingPhilosophy && (
                  <button
                    onClick={() => { setDraftPhilosophy(philosophyText); setEditingPhilosophy(true); }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--text-muted)",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>

              {editingPhilosophy ? (
                <div>
                  <textarea
                    value={draftPhilosophy}
                    onChange={(e) => setDraftPhilosophy(e.target.value)}
                    rows={5}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1.5px solid ${PRIMARY}`,
                      background: "var(--bg-base)",
                      color: "var(--text-primary)",
                      fontSize: 14,
                      lineHeight: 1.6,
                      resize: "vertical",
                      outline: "none",
                      boxSizing: "border-box",
                      marginBottom: 10,
                    }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={savePhilosophy}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: PRIMARY,
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPhilosophy(false)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "transparent",
                        color: "var(--text-muted)",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--text-primary)",
                    lineHeight: 1.7,
                    fontStyle: "italic",
                    borderLeft: `3px solid ${PRIMARY}`,
                    paddingLeft: 16,
                    margin: 0,
                  }}
                >
                  "{philosophyText}"
                </p>
              )}
            </div>
          </>
        )}

        {/* ── Section 6: Peer Benchmarking ──────────────────────────────────── */}
        {card(
          <>
            {sectionLabel("Peer Benchmarking")}
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              How You Compare
            </p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>
              You vs. program average vs. platform top 25%
            </p>

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { color: PRIMARY, label: "You" },
                { color: SUCCESS + "88", label: "Platform Top 25%" },
                { color: MUTED + "55", label: "Program Average" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color }} />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.label}</span>
                </div>
              ))}
            </div>

            <BenchmarkChart rows={BENCHMARK} />
          </>
        )}
      </div>
    </AppShell>
  );
}
