import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

// ─── Data ────────────────────────────────────────────────────────────────────

type MilestoneType = "SKILL MILESTONE" | "CONSISTENCY MILESTONE" | "DEVELOPMENT MILESTONE" | "RECRUITING MILESTONE";

interface Milestone {
  id: number;
  type: MilestoneType;
  title: string;
  criteria: string;
  dateEarned: string;
  verifiedBy: string;
  color: string;
  isFeatured?: boolean;
}

interface UpcomingMilestone {
  id: number;
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
  pct: number;
}

const MILESTONES: Milestone[] = [
  {
    id: 1,
    type: "DEVELOPMENT MILESTONE",
    title: "VDV Verified",
    criteria: "Verified development across 2+ assessment cycles with consistent growth confirmed by coaching staff",
    dateEarned: "April 2, 2026",
    verifiedBy: "Coach Marcus Grant",
    color: PRIMARY,
    isFeatured: true,
  },
  {
    id: 2,
    type: "CONSISTENCY MILESTONE",
    title: "Consistency Award",
    criteria: "Zero assessment gaps for 90 consecutive days — every scheduled cycle completed on time",
    dateEarned: "March 21, 2026",
    verifiedBy: "HoopsIQ Platform",
    color: SUCCESS,
  },
  {
    id: 3,
    type: "SKILL MILESTONE",
    title: "Ball Handling: Advancing",
    criteria: "Crossed 7.0 ball handling score in a verified assessment cycle",
    dateEarned: "March 8, 2026",
    verifiedBy: "Coach Marcus Grant",
    color: PRIMARY,
  },
  {
    id: 4,
    type: "SKILL MILESTONE",
    title: "Defensive Breakthrough",
    criteria: "Defensive IQ score improved by more than 1.0 points in a single verified assessment cycle",
    dateEarned: "February 14, 2026",
    verifiedBy: "Coach Marcus Grant",
    color: SUCCESS,
  },
  {
    id: 5,
    type: "DEVELOPMENT MILESTONE",
    title: "Coachability Leader",
    criteria: "Maintained a coachability score of 8.0 or above for three consecutive assessment cycles",
    dateEarned: "January 30, 2026",
    verifiedBy: "Coach Marcus Grant",
    color: SUCCESS,
  },
  {
    id: 6,
    type: "RECRUITING MILESTONE",
    title: "First Recruiter View",
    criteria: "A verified college program viewed your HoopsIQ profile for the first time",
    dateEarned: "January 12, 2026",
    verifiedBy: "HoopsIQ Platform",
    color: PRIMARY,
  },
  {
    id: 7,
    type: "CONSISTENCY MILESTONE",
    title: "IDP Champion",
    criteria: "Completed every IDP drill cycle for 60 consecutive days without a gap",
    dateEarned: "December 28, 2025",
    verifiedBy: "Coach Marcus Grant",
    color: WARNING,
  },
  {
    id: 8,
    type: "DEVELOPMENT MILESTONE",
    title: "Season Starter",
    criteria: "Successfully completed your first full verified assessment season on HoopsIQ",
    dateEarned: "December 1, 2025",
    verifiedBy: "HoopsIQ Platform",
    color: MUTED,
  },
];

const UPCOMING_MILESTONES: UpcomingMilestone[] = [
  {
    id: 1,
    title: "Ball Handling Elite",
    description: "Reach 8.0 in Ball Handling across 2 consecutive verified cycles",
    current: 7.2,
    target: 8.0,
    unit: "score",
    pct: 90,
  },
  {
    id: 2,
    title: "Multi-Season VDV",
    description: "Earn VDV verification in 2 consecutive seasons",
    current: 1,
    target: 2,
    unit: "seasons",
    pct: 50,
  },
  {
    id: 3,
    title: "Top 25% Growth Rate",
    description: "Reach the 75th percentile in overall development velocity",
    current: 71,
    target: 75,
    unit: "percentile",
    pct: 95,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function milestoneTypeColor(type: MilestoneType): string {
  if (type === "SKILL MILESTONE") return PRIMARY;
  if (type === "CONSISTENCY MILESTONE") return SUCCESS;
  if (type === "RECRUITING MILESTONE") return PRIMARY;
  return SUCCESS;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconStar({ color }: { color: string }) {
  return (
    <svg width={36} height={36} viewBox="0 0 36 36">
      <polygon
        points="18,3 22,14 34,14 25,21 28,33 18,26 8,33 11,21 2,14 14,14"
        fill={color}
        opacity={0.9}
      />
    </svg>
  );
}

function IconShield({ color }: { color: string }) {
  return (
    <svg width={36} height={36} viewBox="0 0 36 36">
      <path d="M18 3 L30 8 L30 20 Q30 28 18 33 Q6 28 6 20 L6 8 Z" fill={color} opacity={0.9} />
      <polyline points="12,18 16,22 24,13" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrend({ color }: { color: string }) {
  return (
    <svg width={36} height={36} viewBox="0 0 36 36">
      <rect x={0} y={0} width={36} height={36} rx={8} fill={color} opacity={0.15} />
      <polyline points="4,26 12,18 20,22 32,10" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="27,10 32,10 32,15" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCircle({ color }: { color: string }) {
  return (
    <svg width={36} height={36} viewBox="0 0 36 36">
      <circle cx={18} cy={18} r={15} fill={color} opacity={0.15} stroke={color} strokeWidth={2} />
      <circle cx={18} cy={18} r={6} fill={color} opacity={0.8} />
    </svg>
  );
}

function IconRecruit({ color }: { color: string }) {
  return (
    <svg width={36} height={36} viewBox="0 0 36 36">
      <rect x={2} y={6} width={32} height={24} rx={4} fill={color} opacity={0.15} stroke={color} strokeWidth={1.5} />
      <circle cx={18} cy={16} r={5} fill={color} opacity={0.8} />
      <path d="M9 28 Q12 22 18 22 Q24 22 27 28" fill={color} opacity={0.8} />
    </svg>
  );
}

function IconCheck({ color }: { color: string }) {
  return (
    <svg width={36} height={36} viewBox="0 0 36 36">
      <rect x={2} y={2} width={32} height={32} rx={8} fill={color} opacity={0.15} />
      <polyline points="9,18 15,24 27,12" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBall({ color }: { color: string }) {
  return (
    <svg width={36} height={36} viewBox="0 0 36 36">
      <circle cx={18} cy={18} r={14} fill={color} opacity={0.15} stroke={color} strokeWidth={1.5} />
      <path d="M4 18 Q18 10 32 18" fill="none" stroke={color} strokeWidth={1.5} />
      <path d="M4 18 Q18 26 32 18" fill="none" stroke={color} strokeWidth={1.5} />
      <line x1={18} y1={4} x2={18} y2={32} stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

function IconAward({ color }: { color: string }) {
  return (
    <svg width={36} height={36} viewBox="0 0 36 36">
      <circle cx={18} cy={15} r={11} fill={color} opacity={0.15} stroke={color} strokeWidth={2} />
      <text x={18} y={20} textAnchor="middle" style={{ fontSize: 14, fontWeight: 800, fill: color }}>1</text>
      <line x1={12} y1={25} x2={9} y2={34} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <line x1={24} y1={25} x2={27} y2={34} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <line x1={9} y1={34} x2={27} y2={34} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function milestoneIcon(id: number, color: string) {
  if (id === 1) return <IconStar color={color} />;
  if (id === 2) return <IconCheck color={color} />;
  if (id === 3) return <IconBall color={color} />;
  if (id === 4) return <IconShield color={color} />;
  if (id === 5) return <IconCircle color={color} />;
  if (id === 6) return <IconRecruit color={color} />;
  if (id === 7) return <IconTrend color={color} />;
  return <IconAward color={color} />;
}

// ─── SVG Progress Bar ─────────────────────────────────────────────────────────

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <svg width="100%" height={12} viewBox="0 0 300 12" preserveAspectRatio="none">
      <rect x={0} y={0} width={300} height={12} rx={6} fill="var(--border)" />
      <rect x={0} y={0} width={Math.min(pct * 3, 300)} height={12} rx={6} fill={color} />
    </svg>
  );
}

// ─── Milestone Card ───────────────────────────────────────────────────────────

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  const color = milestone.color;
  const typeColor = milestoneTypeColor(milestone.type);

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: `1px solid ${color}44`,
      borderRadius: 16,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      boxShadow: `0 2px 12px ${color}18`,
    }}>
      {/* Top stripe */}
      <div style={{ height: 4, background: color, width: "100%" }} />

      <div style={{ padding: "20px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Type badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <span style={{
            fontSize: 9,
            fontWeight: 800,
            color: typeColor,
            background: `${typeColor}18`,
            border: `1px solid ${typeColor}33`,
            borderRadius: 4,
            padding: "3px 8px",
            letterSpacing: "0.08em",
          }}>
            {milestone.type}
          </span>
          <div style={{ opacity: 0.9 }}>
            {milestoneIcon(milestone.id, color)}
          </div>
        </div>

        {/* Title */}
        <h3 style={{
          margin: "0 0 8px",
          fontSize: 18,
          fontWeight: 800,
          color: "var(--text-primary)",
          lineHeight: 1.25,
        }}>
          {milestone.title}
        </h3>

        {/* Criteria */}
        <p style={{
          margin: "0 0 16px",
          fontSize: 12,
          color: "var(--text-muted)",
          lineHeight: 1.6,
          flex: 1,
        }}>
          {milestone.criteria}
        </p>

        {/* Footer */}
        <div style={{
          paddingTop: 14,
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}>
          <div>
            <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 2 }}>EARNED</div>
            <div style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 600 }}>{milestone.dateEarned}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 2 }}>VERIFIED BY</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{milestone.verifiedBy}</div>
          </div>
        </div>

        {/* Share button */}
        <button
          onClick={() => toast.success(`"${milestone.title}" milestone shared!`)}
          style={{
            marginTop: 12,
            width: "100%",
            fontSize: 12,
            fontWeight: 700,
            color: color,
            background: `${color}14`,
            border: `1px solid ${color}44`,
            borderRadius: 8,
            padding: "8px 0",
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          Share
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlayerMilestonePage() {
  const [selectedMilestone, setSelectedMilestone] = useState<number>(MILESTONES[0].id);
  const featured = MILESTONES.find((m) => m.isFeatured) ?? MILESTONES[0];

  function handleShare() {
    const ms = MILESTONES.find((m) => m.id === selectedMilestone);
    toast.success(`"${ms?.title ?? "Milestone"}" shared with your family!`);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Player Profile · Marcus Thompson"
        title="Development Milestones"
        subtitle="Every breakthrough moment in your basketball development — verified, permanent, yours."
        actions={
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: PRIMARY,
            background: `${PRIMARY}14`,
            border: `1px solid ${PRIMARY}44`,
            borderRadius: 20,
            padding: "6px 16px",
          }}>
            {MILESTONES.length} Earned
          </div>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 48, paddingBottom: 60 }}>

        {/* ── Section 1: Milestone Hero ── */}
        <section>
          <div style={{
            background: `linear-gradient(135deg, ${PRIMARY}22 0%, ${PRIMARY}0a 100%)`,
            border: `2px solid ${PRIMARY}55`,
            borderRadius: 20,
            padding: "32px 36px",
            display: "flex",
            gap: 28,
            alignItems: "center",
            flexWrap: "wrap",
            boxShadow: `0 4px 24px ${PRIMARY}22`,
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: `${PRIMARY}22`,
              border: `2px solid ${PRIMARY}66`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <IconStar color={PRIMARY} />
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: PRIMARY, letterSpacing: "0.1em", marginBottom: 6 }}>
                NEWEST MILESTONE
              </div>
              <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>
                {featured.title}
              </h2>
              <p style={{ margin: "0 0 10px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
                {featured.criteria}
              </p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Earned <strong style={{ color: "var(--text-primary)" }}>{featured.dateEarned}</strong>
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Verified by <strong style={{ color: "var(--text-primary)" }}>{featured.verifiedBy}</strong>
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: PRIMARY, lineHeight: 1 }}>
                {MILESTONES.length}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>total earned</div>
            </div>
          </div>
        </section>

        {/* ── Section 2: Milestone Cards Grid ── */}
        <section>
          <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            Your Milestones
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 20,
          }}>
            {MILESTONES.map((ms) => (
              <MilestoneCard key={ms.id} milestone={ms} />
            ))}
          </div>
        </section>

        {/* ── Section 3: Next Milestones ── */}
        <section>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            What You're Working Toward
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--text-muted)" }}>
            These are your next milestones — keep going.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {UPCOMING_MILESTONES.map((um) => (
              <div
                key={um.id}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "20px 24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h3 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                      {um.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>{um.description}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: um.pct >= 80 ? SUCCESS : PRIMARY,
                    }}>
                      {um.pct}%
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <ProgressBar pct={um.pct} color={um.pct >= 80 ? SUCCESS : PRIMARY} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Current: <strong style={{ color: "var(--text-primary)" }}>{um.current} {um.unit}</strong>
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Target: <strong style={{ color: "var(--text-primary)" }}>{um.target} {um.unit}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 4: Share A Milestone ── */}
        <section>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            Share a Milestone
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--text-muted)" }}>
            Your milestones can be shared with family and added to your recruiting profile.
          </p>

          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "24px 28px",
          }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, letterSpacing: "0.04em" }}>
                  SELECT MILESTONE
                </label>
                <select
                  value={selectedMilestone}
                  onChange={(e) => setSelectedMilestone(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: 14,
                    color: "var(--text-primary)",
                    background: "var(--bg-base)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    cursor: "pointer",
                    appearance: "auto",
                  }}
                >
                  {MILESTONES.map((ms) => (
                    <option key={ms.id} value={ms.id}>
                      {ms.title} — {ms.dateEarned}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleShare}
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--bg-base)",
                  background: PRIMARY,
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 24px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Share with Family
              </button>
            </div>

            <p style={{
              margin: "16px 0 0",
              fontSize: 12,
              color: "var(--text-muted)",
              fontStyle: "italic",
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
            }}>
              Sharing only shows the milestone and verification — never your private assessment scores or coach observations.
            </p>
          </div>
        </section>

      </div>
    </AppShell>
  );
}
