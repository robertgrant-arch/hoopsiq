import { useState, useRef } from "react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = "needs" | "corroborated" | "all";

interface FilmClip {
  id: number;
  name: string;
  date: string;
  duration: string;
  skillTags: string[];
}

interface AssessmentEntry {
  id: number;
  playerId: number;
  playerName: string;
  skill: string;
  score: number;
  date: string;
  observationText: string;
  linkedClipIds: number[];
}

interface SkillCorroboration {
  skill: string;
  pct: number;
  assessed: number;
  linked: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FILM_CLIPS: FilmClip[] = [
  { id: 1,  name: "Practice 5/10 — Full Session",          date: "2025-05-10", duration: "1h 12m", skillTags: ["Ball Handling", "Defense"] },
  { id: 2,  name: "Practice 5/10 — Defensive Drills",      date: "2025-05-10", duration: "18m",    skillTags: ["Defensive Stance", "Help Defense"] },
  { id: 3,  name: "Scrimmage 5/8 — 1st Half",              date: "2025-05-08", duration: "24m",    skillTags: ["Shooting Form", "Finishing", "Court Vision"] },
  { id: 4,  name: "Scrimmage 5/8 — 2nd Half",              date: "2025-05-08", duration: "26m",    skillTags: ["Ball Handling", "Basketball IQ"] },
  { id: 5,  name: "Individual Workout — Devon 5/7",         date: "2025-05-07", duration: "45m",    skillTags: ["Ball Handling", "Finishing"] },
  { id: 6,  name: "Individual Workout — Marcus 5/7",        date: "2025-05-07", duration: "42m",    skillTags: ["Shooting Form", "Coachability"] },
  { id: 7,  name: "Practice 5/5 — Offensive Sets",         date: "2025-05-05", duration: "55m",    skillTags: ["Court Vision", "Basketball IQ", "Shooting Form"] },
  { id: 8,  name: "Practice 5/5 — Shooting Workout",       date: "2025-05-05", duration: "30m",    skillTags: ["Shooting Form"] },
  { id: 9,  name: "Game vs. Rivals 5/3",                   date: "2025-05-03", duration: "1h 28m", skillTags: ["All Skills"] },
  { id: 10, name: "Film Review Session 5/2",                date: "2025-05-02", duration: "1h 5m",  skillTags: ["Basketball IQ", "Court Vision"] },
  { id: 11, name: "Practice 4/30 — Post Work",             date: "2025-04-30", duration: "40m",    skillTags: ["Finishing", "Athleticism"] },
  { id: 12, name: "Individual Workout — Caleb 4/29",        date: "2025-04-29", duration: "38m",    skillTags: ["Finishing", "Defensive Stance"] },
  { id: 13, name: "Scrimmage 4/28",                         date: "2025-04-28", duration: "1h 2m",  skillTags: ["Ball Handling", "Shooting Form", "Defense"] },
  { id: 14, name: "Practice 4/27 — Conditioning",          date: "2025-04-27", duration: "25m",    skillTags: ["Athleticism", "Coachability"] },
  { id: 15, name: "Game vs. Summit 4/25",                  date: "2025-04-25", duration: "1h 31m", skillTags: ["All Skills"] },
];

const ASSESSMENTS_INITIAL: AssessmentEntry[] = [
  {
    id: 1,
    playerId: 1,
    playerName: "Devon Anderson",
    skill: "Ball Handling",
    score: 8.4,
    date: "2025-05-10",
    observationText: "Crossover under pressure: kept dribble alive vs. the trap three consecutive possessions in the halfcourt set. Behind-the-back still breaks down moving right — addressed in post-practice chat.",
    linkedClipIds: [1, 5],
  },
  {
    id: 2,
    playerId: 1,
    playerName: "Devon Anderson",
    skill: "Court Vision",
    score: 8.0,
    date: "2025-05-08",
    observationText: "Saw the skip pass in the 2nd half scrimmage twice — timing is improving. Still telegraphs by dropping his eyes before passing.",
    linkedClipIds: [4],
  },
  {
    id: 3,
    playerId: 2,
    playerName: "Marcus Williams",
    skill: "Shooting Form",
    score: 8.6,
    date: "2025-05-08",
    observationText: "Catch-and-shoot off the pin-down was 6-for-8 today. Release point is now consistent. Struggled with off-the-dribble pull-ups — footwork issue on the gather.",
    linkedClipIds: [3, 6],
  },
  {
    id: 4,
    playerId: 2,
    playerName: "Marcus Williams",
    skill: "Coachability",
    score: 8.5,
    date: "2025-05-07",
    observationText: "Immediately applied the footwork correction from Tuesday. Self-corrected twice during the drill before I said anything. That's the standard.",
    linkedClipIds: [],
  },
  {
    id: 5,
    playerId: 3,
    playerName: "Caleb Harris",
    skill: "Finishing",
    score: 8.1,
    date: "2025-05-05",
    observationText: "Drop-step left is now automatic — 4 of 5 today vs. the sagging defender. Right-shoulder finish still mechanical. More reps needed before it's a real weapon.",
    linkedClipIds: [7],
  },
  {
    id: 6,
    playerId: 3,
    playerName: "Caleb Harris",
    skill: "Defensive Stance",
    score: 7.6,
    date: "2025-04-30",
    observationText: "Lateral shuffle on pick-and-roll coverage improved — hips stayed low for the first time this week. Goes over screens on the top key. Needs reps on the hedge.",
    linkedClipIds: [11, 12],
  },
  {
    id: 7,
    playerId: 1,
    playerName: "Devon Anderson",
    skill: "Finishing",
    score: 7.8,
    date: "2025-04-28",
    observationText: "Off-hand layup conversion dropped in traffic — 3 of 7. Same pattern as last week. Absorbs contact but lift on the off-hand is inconsistent under pressure.",
    linkedClipIds: [],
  },
  {
    id: 8,
    playerId: 2,
    playerName: "Marcus Williams",
    skill: "Athleticism",
    score: 8.2,
    date: "2025-04-27",
    observationText: "Lateral quickness drills — top of the group. First step is noticeably faster than September. Conditioning is holding through the full session now.",
    linkedClipIds: [14],
  },
];

const SKILL_CORROBORATION: SkillCorroboration[] = [
  { skill: "Ball Handling",    pct: 88, assessed: 17, linked: 15 },
  { skill: "Shooting Form",    pct: 83, assessed: 24, linked: 20 },
  { skill: "Coachability",     pct: 72, assessed: 18, linked: 13 },
  { skill: "Court Vision",     pct: 67, assessed: 21, linked: 14 },
  { skill: "Basketball IQ",    pct: 58, assessed: 19, linked: 11 },
  { skill: "Finishing",        pct: 52, assessed: 23, linked: 12 },
  { skill: "Athleticism",      pct: 44, assessed: 16, linked:  7 },
  { skill: "Defensive Stance", pct: 31, assessed: 26, linked:  8 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function corrColor(pct: number): string {
  if (pct >= 75) return SUCCESS;
  if (pct >= 50) return WARNING;
  return DANGER;
}

function corrLabel(pct: number): string {
  if (pct >= 75) return "strong";
  if (pct >= 50) return "developing";
  return "needs work";
}

function clipsForDate(clipDate: string, assessDate: string): FilmClip[] {
  const assessMs = new Date(assessDate).getTime();
  const sevenDays = 7 * 86_400_000;
  return FILM_CLIPS.filter((c) => {
    const clipMs = new Date(c.date).getTime();
    return Math.abs(clipMs - assessMs) <= sevenDays;
  });
}

function isCorroborated(entry: AssessmentEntry): boolean {
  return entry.linkedClipIds.length > 0;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ClipCard({
  clip,
  linked,
  onLink,
}: {
  clip: FilmClip;
  linked: boolean;
  onLink: () => void;
}) {
  return (
    <button
      onClick={onLink}
      disabled={linked}
      style={{
        flexShrink: 0,
        width: 180,
        padding: "12px 14px",
        borderRadius: 10,
        border: `1.5px solid ${linked ? SUCCESS : "var(--border)"}`,
        background: linked ? SUCCESS + "18" : "var(--bg-base)",
        cursor: linked ? "default" : "pointer",
        textAlign: "left",
        transition: "all 0.15s ease",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: linked ? SUCCESS : "var(--text-primary)",
          marginBottom: 4,
          lineHeight: 1.3,
        }}
      >
        {linked && "✓ "}
        {clip.name}
      </div>
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>
        {clip.date} · {clip.duration}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {clip.skillTags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            style={{
              padding: "2px 6px",
              borderRadius: 10,
              background: PRIMARY + "22",
              color: PRIMARY,
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}

function AssessmentRow({
  entry,
  onLinkClip,
}: {
  entry: AssessmentEntry;
  onLinkClip: (entryId: number, clipId: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const availableClips = clipsForDate(
    FILM_CLIPS.find((c) => entry.linkedClipIds.includes(c.id))?.date ?? entry.date,
    entry.date
  );
  const linkedClips = FILM_CLIPS.filter((c) => entry.linkedClipIds.includes(c.id));

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Row header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 20px",
          background: "var(--bg-surface)",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Player + skill */}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 2 }}>
            {entry.playerName} — {entry.skill}
          </div>
          <div style={{ fontSize: 12, color: MUTED }}>{entry.date}</div>
        </div>

        {/* Score */}
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: PRIMARY + "22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 15,
            color: PRIMARY,
            flexShrink: 0,
          }}
        >
          {entry.score.toFixed(1)}
        </div>

        {/* Film count badge */}
        <div
          style={{
            padding: "5px 10px",
            borderRadius: 20,
            background: entry.linkedClipIds.length > 0 ? SUCCESS + "22" : DANGER + "22",
            color: entry.linkedClipIds.length > 0 ? SUCCESS : DANGER,
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {entry.linkedClipIds.length > 0
            ? `${entry.linkedClipIds.length} clip${entry.linkedClipIds.length !== 1 ? "s" : ""}`
            : "No film"}
        </div>

        {/* Chevron */}
        <svg
          width={16}
          height={16}
          viewBox="0 0 16 16"
          fill="none"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }}
        >
          <path d="M3 6l5 5 5-5" stroke={MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div
          style={{
            padding: "0 20px 20px",
            background: "var(--bg-base)",
            borderTop: "1px solid var(--border)",
          }}
        >
          {/* Observation text */}
          <div style={{ paddingTop: 16, marginBottom: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
              Assessment Observation
            </p>
            <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
              "{entry.observationText}"
            </p>
          </div>

          {/* Linked clips */}
          {linkedClips.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                Linked Film Evidence
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {linkedClips.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 20,
                      background: SUCCESS + "18",
                      border: `1px solid ${SUCCESS}`,
                      color: SUCCESS,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    ✓ {c.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available clips to link */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              Available Film (±7 days)
            </p>
            {availableClips.length === 0 ? (
              <p style={{ fontSize: 13, color: MUTED }}>No clips found within 7 days of this assessment.</p>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  overflowX: "auto",
                  paddingBottom: 4,
                }}
              >
                {availableClips.map((clip) => (
                  <ClipCard
                    key={clip.id}
                    clip={clip}
                    linked={entry.linkedClipIds.includes(clip.id)}
                    onLink={() => onLinkClip(entry.id, clip.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CorroborationBarChart({
  skills,
  onSkillClick,
}: {
  skills: SkillCorroboration[];
  onSkillClick: (skill: string) => void;
}) {
  const sorted = [...skills].sort((a, b) => b.pct - a.pct);
  const BAR_H = 22;
  const GAP = 38;
  const W = 500;
  const LABEL_W = 148;
  const BAR_AREA = W - LABEL_W - 70;
  const H = sorted.length * GAP + 8;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ overflow: "visible", cursor: "pointer" }}
      onClick={(e) => {
        const target = e.target as SVGElement;
        const row = target.closest("[data-skill]");
        if (row) onSkillClick(row.getAttribute("data-skill") ?? "");
      }}
    >
      {sorted.map((row, i) => {
        const y = i * GAP + 4;
        const color = corrColor(row.pct);
        const barW = (row.pct / 100) * BAR_AREA;
        return (
          <g key={row.skill} data-skill={row.skill} style={{ cursor: "pointer" }}>
            <rect x={0} y={y - 4} width={W} height={GAP} fill="transparent" />
            <text x={0} y={y + BAR_H * 0.65} fontSize={12} fill="var(--text-primary)" fontWeight={600}>
              {row.skill}
            </text>
            {/* Track */}
            <rect
              x={LABEL_W}
              y={y + 2}
              width={BAR_AREA}
              height={BAR_H - 4}
              rx={5}
              fill="var(--border)"
            />
            {/* Fill */}
            <rect
              x={LABEL_W}
              y={y + 2}
              width={barW}
              height={BAR_H - 4}
              rx={5}
              fill={color}
            />
            <text
              x={LABEL_W + barW + 6}
              y={y + BAR_H * 0.65}
              fontSize={12}
              fill={color}
              fontWeight={700}
            >
              {row.pct}%
            </text>
            <text
              x={W - 2}
              y={y + BAR_H * 0.65}
              textAnchor="end"
              fontSize={10}
              fill={MUTED}
            >
              {row.linked}/{row.assessed}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FilmCorroborationEntryPage() {
  const [filter, setFilter] = useState<FilterTab>("needs");
  const [assessments, setAssessments] = useState<AssessmentEntry[]>(ASSESSMENTS_INITIAL);
  const tableRef = useRef<HTMLDivElement>(null);

  const OVERALL_PCT = 67;

  const filteredAssessments = assessments.filter((a) => {
    if (filter === "needs") return !isCorroborated(a);
    if (filter === "corroborated") return isCorroborated(a);
    return true;
  });

  function handleLinkClip(entryId: number, clipId: number) {
    setAssessments((prev) =>
      prev.map((a) => {
        if (a.id !== entryId) return a;
        if (a.linkedClipIds.includes(clipId)) return a;
        return { ...a, linkedClipIds: [...a.linkedClipIds, clipId] };
      })
    );
    const clip = FILM_CLIPS.find((c) => c.id === clipId);
    toast.success(`Linked "${clip?.name}" to assessment`);
  }

  function handleSkillBarClick(skill: string) {
    setFilter("all");
    // Scroll to table
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
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
        eyebrow="Film Corroboration"
        title="Link Film to Assessments"
        subtitle="Connect your clips to assessment scores to create irrefutable player evidence"
        actions={
          <button
            onClick={() => toast.info("Opening film upload…")}
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
            Upload More Film
          </button>
        }
      />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 16px 60px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Section 1: Corroboration Status Header ────────────────────────── */}
        {card(
          <>
            {sectionLabel("Program Corroboration Status")}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 42, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>
                  {OVERALL_PCT}%
                </div>
                <div style={{ fontSize: 14, color: MUTED, marginTop: 4 }}>
                  of assessments have film evidence
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: MUTED }}>Target</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: SUCCESS }}>80%</div>
              </div>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: 14,
                background: "var(--border)",
                borderRadius: 7,
                overflow: "hidden",
                marginBottom: 8,
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${OVERALL_PCT}%`,
                  background: WARNING,
                  borderRadius: 7,
                  transition: "width 0.8s ease",
                }}
              />
              {/* Target marker */}
              <div
                style={{
                  position: "absolute",
                  left: "80%",
                  top: 0,
                  width: 2,
                  height: "100%",
                  background: SUCCESS,
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
              <span style={{ fontSize: 11, color: SUCCESS, fontWeight: 600 }}>← 80% target</span>
            </div>

            {/* Info callout */}
            <div
              style={{
                background: PRIMARY + "12",
                border: `1px solid ${PRIMARY}44`,
                borderRadius: 10,
                padding: "12px 16px",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <svg width={18} height={18} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx={9} cy={9} r={8} stroke={PRIMARY} strokeWidth={1.5} />
                <line x1={9} y1={7} x2={9} y2={12} stroke={PRIMARY} strokeWidth={2} strokeLinecap="round" />
                <circle cx={9} cy={5} r={1} fill={PRIMARY} />
              </svg>
              <p style={{ fontSize: 13, color: PRIMARY, margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                Film corroboration makes your players' profiles{" "}
                <strong>3.4× more credible to college recruiters.</strong>{" "}
                Linking just 13 more assessments puts you at the 80% threshold.
              </p>
            </div>
          </>
        )}

        {/* ── Section 2: Assessment → Film Linking Table ────────────────────── */}
        <div ref={tableRef}>
          {card(
            <>
              {sectionLabel("Assessment → Film Linking")}

              {/* Filter tabs */}
              <div
                style={{
                  display: "flex",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  marginBottom: 20,
                  width: "fit-content",
                }}
              >
                {(
                  [
                    { key: "needs", label: "Needs Film" },
                    { key: "corroborated", label: "Corroborated" },
                    { key: "all", label: "All" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    style={{
                      padding: "9px 18px",
                      border: "none",
                      background: filter === tab.key ? PRIMARY : "transparent",
                      color: filter === tab.key ? "#fff" : "var(--text-muted)",
                      fontSize: 13,
                      fontWeight: filter === tab.key ? 700 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {tab.label}
                    {tab.key === "needs" && (
                      <span
                        style={{
                          marginLeft: 6,
                          background: DANGER + "44",
                          color: DANGER,
                          borderRadius: 10,
                          padding: "0 6px",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {assessments.filter((a) => !isCorroborated(a)).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredAssessments.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0", color: MUTED }}>
                    {filter === "needs"
                      ? "All assessments have film evidence. Great work!"
                      : "No assessments in this filter."}
                  </div>
                ) : (
                  filteredAssessments.map((entry) => (
                    <AssessmentRow
                      key={entry.id}
                      entry={entry}
                      onLinkClip={handleLinkClip}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Section 3: Corroboration by Skill ────────────────────────────── */}
        {card(
          <>
            {sectionLabel("Corroboration by Skill")}
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Film Coverage per Skill Area
            </p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>
              Click any bar to filter assessments for that skill
            </p>

            <CorroborationBarChart
              skills={SKILL_CORROBORATION}
              onSkillClick={handleSkillBarClick}
            />

            {/* Legend chips */}
            <div style={{ display: "flex", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
              {[
                { color: SUCCESS, label: "75%+ · Strong" },
                { color: WARNING, label: "50–74% · Developing" },
                { color: DANGER,  label: "<50% · Needs Work" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color }} />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Per-skill summary */}
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 6 }}>
              {[...SKILL_CORROBORATION]
                .sort((a, b) => b.pct - a.pct)
                .map((s) => {
                  const color = corrColor(s.pct);
                  return (
                    <div
                      key={s.skill}
                      style={{ fontSize: 13, color: color, fontWeight: 600 }}
                    >
                      {s.skill}: {s.pct}% corroborated ({corrLabel(s.pct)})
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {/* ── Section 4: Why This Matters ──────────────────────────────────── */}
        {card(
          <>
            {sectionLabel("Why This Matters")}
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>
              What happens when a recruiter sees a corroborated profile
            </p>

            {/* 3-step visual */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 16,
                marginBottom: 28,
              }}
            >
              {[
                {
                  icon: (
                    <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
                      <rect x={2} y={4} width={24} height={20} rx={4} stroke={PRIMARY} strokeWidth={2} />
                      <circle cx={14} cy={14} r={5} stroke={PRIMARY} strokeWidth={2} />
                      <circle cx={14} cy={14} r={2} fill={PRIMARY} />
                    </svg>
                  ),
                  step: "1",
                  label: "Profile Viewed",
                  desc: "Recruiter discovers the player through a search or referral",
                },
                {
                  icon: (
                    <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
                      <rect x={4} y={6} width={20} height={16} rx={3} stroke={SUCCESS} strokeWidth={2} />
                      <polygon points="12,10 12,18 20,14" fill={SUCCESS} />
                    </svg>
                  ),
                  step: "2",
                  label: "Film Reviewed",
                  desc: "Corroborated film clips matched to skill scores create instant credibility",
                },
                {
                  icon: (
                    <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
                      <path d="M6 6h16v4l-4 4v8H10v-8L6 10z" stroke={WARNING} strokeWidth={2} strokeLinejoin="round" />
                      <line x1={14} y1={14} x2={14} y2={22} stroke={WARNING} strokeWidth={2} />
                    </svg>
                  ),
                  step: "3",
                  label: "Access Requested",
                  desc: "Recruiter contacts coach through HoopsIQ to request official access",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  style={{
                    background: "var(--bg-base)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "18px 16px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}>{item.icon}</div>
                  <div
                    style={{
                      display: "inline-block",
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: PRIMARY + "22",
                      color: PRIMARY,
                      fontSize: 11,
                      fontWeight: 800,
                      lineHeight: "22px",
                      marginBottom: 8,
                    }}
                  >
                    {item.step}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div
              style={{
                background: PRIMARY + "10",
                border: `1px solid ${PRIMARY}33`,
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: 20,
              }}
            >
              <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.7, margin: 0 }}>
                Profiles with film evidence receive{" "}
                <strong style={{ color: PRIMARY }}>3.4× more access requests.</strong>{" "}
                Programs with 80%+ corroboration are rated as{" "}
                <strong style={{ color: PRIMARY }}>highest credibility</strong>{" "}
                by recruiting coordinators.
              </p>
            </div>

            <button
              onClick={() => toast.info("Opening film upload…")}
              style={{
                width: "100%",
                padding: "16px 24px",
                borderRadius: 12,
                border: "none",
                background: PRIMARY,
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
            >
              Upload More Film
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}
