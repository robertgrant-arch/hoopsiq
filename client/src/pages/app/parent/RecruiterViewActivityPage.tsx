import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

// ─── Data ────────────────────────────────────────────────────────────────────

type Division = "D1" | "D2" | "D3" | "NAIA";
type ActivityStatus = "Active Interest" | "Initial View" | "Followed Up";

interface RecruiterActivity {
  id: number;
  program: string;
  division: Division;
  coach: string;
  dateViewed: string;
  viewed: string;
  duration: string;
  status: ActivityStatus;
  location: string;
  hasAccessRequest: boolean;
}

interface AccessRequest {
  id: number;
  program: string;
  division: Division;
  location: string;
  recruiterName: string;
  recruiterTitle: string;
  requesting: string;
}

const ACTIVITY_FEED: RecruiterActivity[] = [
  {
    id: 1,
    program: "University of Illinois",
    division: "D1",
    coach: "Recruiting Coordinator - Staff",
    dateViewed: "May 14, 2026",
    viewed: "Skills profile, assessment history, film clips (3)",
    duration: "7 min 23 sec",
    status: "Active Interest",
    location: "Champaign, IL",
    hasAccessRequest: true,
  },
  {
    id: 2,
    program: "Butler University",
    division: "D1",
    coach: "Assistant Recruiting Coach",
    dateViewed: "May 13, 2026",
    viewed: "Skills profile, VDV status",
    duration: "3 min 41 sec",
    status: "Initial View",
    location: "Indianapolis, IN",
    hasAccessRequest: false,
  },
  {
    id: 3,
    program: "Indiana Wesleyan",
    division: "NAIA",
    coach: "Head Recruiting Staff",
    dateViewed: "May 10, 2026",
    viewed: "Assessment history, coach narratives",
    duration: "5 min 12 sec",
    status: "Followed Up",
    location: "Marion, IN",
    hasAccessRequest: false,
  },
  {
    id: 4,
    program: "DePaul University",
    division: "D1",
    coach: "Recruiting Coordinator - Staff",
    dateViewed: "May 7, 2026",
    viewed: "Skills profile, film clips (2), development resume",
    duration: "9 min 04 sec",
    status: "Active Interest",
    location: "Chicago, IL",
    hasAccessRequest: true,
  },
  {
    id: 5,
    program: "Northern Illinois University",
    division: "D1",
    coach: "Assistant Coach",
    dateViewed: "April 30, 2026",
    viewed: "VDV status, assessment history",
    duration: "2 min 55 sec",
    status: "Initial View",
    location: "DeKalb, IL",
    hasAccessRequest: false,
  },
  {
    id: 6,
    program: "Valparaiso University",
    division: "D2",
    coach: "Head Coach Staff",
    dateViewed: "April 24, 2026",
    viewed: "Skills profile, coach narratives, film clips (1)",
    duration: "6 min 18 sec",
    status: "Followed Up",
    location: "Valparaiso, IN",
    hasAccessRequest: false,
  },
  {
    id: 7,
    program: "Lewis University",
    division: "D2",
    coach: "Recruiting Coordinator",
    dateViewed: "April 18, 2026",
    viewed: "Assessment history, development resume",
    duration: "4 min 07 sec",
    status: "Initial View",
    location: "Romeoville, IL",
    hasAccessRequest: false,
  },
  {
    id: 8,
    program: "Wheaton College",
    division: "D3",
    coach: "Head Coaching Staff",
    dateViewed: "April 12, 2026",
    viewed: "Skills profile, VDV status",
    duration: "2 min 31 sec",
    status: "Initial View",
    location: "Wheaton, IL",
    hasAccessRequest: false,
  },
  {
    id: 9,
    program: "Greenville University",
    division: "D3",
    coach: "Recruiting Staff",
    dateViewed: "April 5, 2026",
    viewed: "Coach narratives, film clips (1)",
    duration: "3 min 48 sec",
    status: "Initial View",
    location: "Greenville, IL",
    hasAccessRequest: false,
  },
  {
    id: 10,
    program: "Saint Xavier University",
    division: "D2",
    coach: "Assistant Coach",
    dateViewed: "March 28, 2026",
    viewed: "Assessment history, skills profile",
    duration: "5 min 02 sec",
    status: "Initial View",
    location: "Chicago, IL",
    hasAccessRequest: false,
  },
];

const ACCESS_REQUESTS: AccessRequest[] = [
  {
    id: 1,
    program: "University of Illinois",
    division: "D1",
    location: "Champaign, IL",
    recruiterName: "David Henson",
    recruiterTitle: "Recruiting Coordinator",
    requesting: "Full assessment history, film library, coach narratives",
  },
  {
    id: 2,
    program: "DePaul University",
    division: "D1",
    location: "Chicago, IL",
    recruiterName: "Maria Santos",
    recruiterTitle: "Assistant Recruiting Coach",
    requesting: "Full assessment history, film library, coach narratives",
  },
];

const MONTHLY_VIEWS = [
  { month: "Dec", views: 2 },
  { month: "Jan", views: 5 },
  { month: "Feb", views: 11 },
  { month: "Mar", views: 24 },
  { month: "Apr", views: 38 },
  { month: "May", views: 47 },
];

const CONTENT_TIME = [
  { label: "Assessment history", pct: 67 },
  { label: "Film clips", pct: 54 },
  { label: "Coach narratives", pct: 41 },
  { label: "VDV status", pct: 38 },
  { label: "Development resume", pct: 29 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function divisionColor(div: Division): string {
  if (div === "D1") return PRIMARY;
  if (div === "D2") return SUCCESS;
  if (div === "D3") return WARNING;
  return MUTED;
}

function statusColor(status: ActivityStatus): string {
  if (status === "Active Interest") return PRIMARY;
  if (status === "Followed Up") return SUCCESS;
  return MUTED;
}

// ─── SVG Charts ──────────────────────────────────────────────────────────────

function DonutChart() {
  const total = 9;
  const segments = [
    { label: "D1", count: 3, color: PRIMARY },
    { label: "D2", count: 4, color: SUCCESS },
    { label: "D3", count: 2, color: WARNING },
  ];

  const R = 54;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * R;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = seg.count / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const arc = { ...seg, pct, dash, gap, offset };
    offset += dash;
    return arc;
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke={arc.color}
            strokeWidth={20}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: "var(--text-primary)" }}>9</text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 10, fill: "var(--text-muted)" }}>programs</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {arcs.map((arc) => (
          <div key={arc.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: arc.color, flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600 }}>{arc.label}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{arc.count} programs ({Math.round(arc.pct * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ViewsBarChart() {
  const maxViews = Math.max(...MONTHLY_VIEWS.map((m) => m.views));
  const chartH = 100;
  const chartW = 280;
  const barW = 32;
  const gap = (chartW - MONTHLY_VIEWS.length * barW) / (MONTHLY_VIEWS.length + 1);

  return (
    <svg width={chartW} height={chartH + 28} viewBox={`0 0 ${chartW} ${chartH + 28}`}>
      {MONTHLY_VIEWS.map((m, i) => {
        const barH = (m.views / maxViews) * chartH;
        const x = gap + i * (barW + gap);
        const y = chartH - barH;
        return (
          <g key={m.month}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill={PRIMARY} opacity={0.85} />
            <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" style={{ fontSize: 11, fill: "var(--text-muted)" }}>{m.month}</text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" style={{ fontSize: 10, fill: "var(--text-primary)", fontWeight: 600 }}>{m.views}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ContentTimeChart() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {CONTENT_TIME.map((item) => (
        <div key={item.label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{item.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{item.pct}%</span>
          </div>
          <svg width="100%" height={10} viewBox="0 0 300 10" preserveAspectRatio="none">
            <rect x={0} y={0} width={300} height={10} rx={5} fill="var(--border)" />
            <rect x={0} y={0} width={item.pct * 3} height={10} rx={5} fill={PRIMARY} />
          </svg>
        </div>
      ))}
    </div>
  );
}

function PrivacyDiagram() {
  return (
    <svg width={220} height={220} viewBox="0 0 220 220">
      {/* Public ring */}
      <circle cx={110} cy={110} r={100} fill="none" stroke={MUTED} strokeWidth={1.5} strokeDasharray="4 3" />
      <circle cx={110} cy={110} r={100} fill={MUTED} fillOpacity={0.06} />
      {/* Approved recruiters ring */}
      <circle cx={110} cy={110} r={68} fill="none" stroke={PRIMARY} strokeWidth={1.5} strokeDasharray="4 3" />
      <circle cx={110} cy={110} r={68} fill={PRIMARY} fillOpacity={0.07} />
      {/* Family + Coach ring */}
      <circle cx={110} cy={110} r={36} fill="none" stroke={SUCCESS} strokeWidth={1.5} />
      <circle cx={110} cy={110} r={36} fill={SUCCESS} fillOpacity={0.12} />
      {/* Labels */}
      <text x={110} y={18} textAnchor="middle" style={{ fontSize: 9, fill: MUTED, fontWeight: 600 }}>PUBLIC</text>
      <text x={110} y={50} textAnchor="middle" style={{ fontSize: 8, fill: PRIMARY, fontWeight: 600 }}>APPROVED</text>
      <text x={110} y={60} textAnchor="middle" style={{ fontSize: 8, fill: PRIMARY, fontWeight: 600 }}>RECRUITERS</text>
      <text x={110} y={107} textAnchor="middle" style={{ fontSize: 8, fill: SUCCESS, fontWeight: 700 }}>FAMILY</text>
      <text x={110} y={118} textAnchor="middle" style={{ fontSize: 8, fill: SUCCESS, fontWeight: 700 }}>+ COACH</text>
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActivityCard({ entry }: { entry: RecruiterActivity }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "16px 20px",
        position: "relative",
        transition: "box-shadow 0.15s",
        boxShadow: hovered ? `0 0 0 2px ${divisionColor(entry.division)}33` : "none",
      }}
    >
      {hovered && (
        <div
          style={{
            position: "absolute",
            top: -4,
            left: "50%",
            transform: "translateX(-50%) translateY(-100%)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "10px 14px",
            zIndex: 10,
            width: 240,
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{entry.program}</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)" }}>{entry.division} · {entry.location}</p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-muted)" }}>Verified HoopsIQ recruiter agreement</p>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{entry.program}</span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--bg-base)",
              background: divisionColor(entry.division),
              borderRadius: 4,
              padding: "2px 7px",
              letterSpacing: "0.04em",
            }}>{entry.division}</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>{entry.coach}</p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>Viewed:</span> {entry.viewed}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, minWidth: 140 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{entry.dateViewed}</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{entry.duration}</span>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: statusColor(entry.status),
            background: `${statusColor(entry.status)}18`,
            borderRadius: 20,
            padding: "2px 10px",
          }}>{entry.status}</span>
        </div>
      </div>

      {entry.hasAccessRequest && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => toast.info(`Reviewing access request from ${entry.program}`)}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: PRIMARY,
              background: `${PRIMARY}14`,
              border: `1px solid ${PRIMARY}44`,
              borderRadius: 6,
              padding: "5px 12px",
              cursor: "pointer",
            }}
          >
            They submitted an access request — Review request
          </button>
        </div>
      )}

      {!entry.hasAccessRequest && entry.status === "Initial View" && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No action yet</span>
        </div>
      )}
    </div>
  );
}

function AccessRequestCard({ req, onApprove, onDecline }: {
  req: AccessRequest;
  onApprove: (id: number) => void;
  onDecline: (id: number) => void;
}) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: `1px solid ${PRIMARY}44`,
      borderRadius: 12,
      padding: "20px 24px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{req.program}</span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--bg-base)",
              background: divisionColor(req.division),
              borderRadius: 4,
              padding: "2px 7px",
            }}>{req.division}</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>{req.location}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{req.recruiterName}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>{req.recruiterTitle}</p>
        </div>
      </div>

      <div style={{
        background: "var(--bg-base)",
        borderRadius: 8,
        padding: "10px 14px",
        marginBottom: 12,
        fontSize: 12,
        color: "var(--text-muted)",
      }}>
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Requesting access to:</span> {req.requesting}
      </div>

      <p style={{ margin: "0 0 14px", fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
        Approving gives them read-only access for 90 days. You can revoke at any time.
      </p>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => onApprove(req.id)}
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--bg-base)",
            background: SUCCESS,
            border: "none",
            borderRadius: 8,
            padding: "8px 20px",
            cursor: "pointer",
          }}
        >
          Approve
        </button>
        <button
          onClick={() => onDecline(req.id)}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
            background: "var(--bg-base)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px 20px",
            cursor: "pointer",
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecruiterViewActivityPage() {
  const [declinedIds, setDeclinedIds] = useState<number[]>([]);
  const [approvedIds, setApprovedIds] = useState<number[]>([]);

  const pendingRequests = ACCESS_REQUESTS.filter(
    (r) => !declinedIds.includes(r.id) && !approvedIds.includes(r.id)
  );

  function handleApprove(id: number) {
    const req = ACCESS_REQUESTS.find((r) => r.id === id);
    setApprovedIds((prev) => [...prev, id]);
    toast.success(`Access approved for ${req?.program ?? "program"}. 90-day read-only access granted.`);
  }

  function handleDecline(id: number) {
    const req = ACCESS_REQUESTS.find((r) => r.id === id);
    setDeclinedIds((prev) => [...prev, id]);
    toast("Access request declined.", { description: `${req?.program ?? "Program"} will not have access to Marcus's profile.` });
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Parent Portal · 2024–25 Season"
        title="Recruiter Activity"
        subtitle="See exactly who has viewed Marcus's profile, what they looked at, and what to do next."
        actions={
          <button
            onClick={() => toast.info("Opening privacy settings")}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: PRIMARY,
              background: `${PRIMARY}14`,
              border: `1px solid ${PRIMARY}44`,
              borderRadius: 8,
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Privacy Settings
          </button>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 40, paddingBottom: 60 }}>

        {/* ── Section 1: Visibility Summary ── */}
        <section>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
              Who Has Seen Marcus This Season
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
              Marcus Thompson · 16U · 2024–25
            </p>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {/* Big stat */}
            <div style={{
              flex: "1 1 200px",
              background: "var(--bg-surface)",
              border: `2px solid ${PRIMARY}`,
              borderRadius: 16,
              padding: "28px 32px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 56, fontWeight: 800, color: PRIMARY, lineHeight: 1 }}>9</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginTop: 6 }}>College Programs</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>have viewed Marcus's profile</div>
            </div>

            <div style={{ flex: "1 1 160px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>127</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginTop: 6 }}>Total Profile Views</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>this season</div>
            </div>

            <div style={{ flex: "1 1 160px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>2 days ago</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginTop: 10 }}>Last Viewed</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>University of Illinois</div>
            </div>
          </div>

          <div style={{
            marginTop: 16,
            background: `${PRIMARY}0d`,
            border: `1px solid ${PRIMARY}33`,
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 13,
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <span>
              You control who can see Marcus's data. All viewers have signed HoopsIQ's recruiter agreement and are verified college programs.{" "}
              <button
                onClick={() => toast.info("Opening privacy settings")}
                style={{ color: PRIMARY, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0 }}
              >
                Manage privacy settings →
              </button>
            </span>
          </div>
        </section>

        {/* ── Section 2: Recruiter Activity Feed ── */}
        <section>
          <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            Recruiter Activity Feed
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ACTIVITY_FEED.map((entry) => (
              <ActivityCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>

        {/* ── Section 3: Division Interest Breakdown ── */}
        <section>
          <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            Division Interest Breakdown
          </h2>

          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <div style={{
              flex: "1 1 280px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "28px 24px",
            }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Programs by Division</h3>
              <DonutChart />
            </div>

            <div style={{
              flex: "1 1 280px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "28px 24px",
            }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Profile Views by Month</h3>
              <ViewsBarChart />
            </div>
          </div>
        </section>

        {/* ── Section 4: What Recruiters Are Looking At ── */}
        <section>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            What Recruiters Are Looking At
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--text-muted)" }}>
            When they visit Marcus's profile, this is what they spend the most time on:
          </p>

          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "28px 24px",
          }}>
            <ContentTimeChart />

            <div style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: "1px solid var(--border)",
              background: `${SUCCESS}0d`,
              border: `1px solid ${SUCCESS}33`,
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 13,
              color: "var(--text-muted)",
            }}>
              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>What this tells you: </span>
              Recruiters care most about the data behind the scores, not just the scores themselves.
              Marcus's assessment history is his strongest asset.
            </div>
          </div>
        </section>

        {/* ── Section 5: Pending Access Requests ── */}
        {pendingRequests.length > 0 && (
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                Pending Access Requests
              </h2>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--bg-base)",
                background: PRIMARY,
                borderRadius: 20,
                padding: "2px 10px",
              }}>
                {pendingRequests.length}
              </span>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted)" }}>
              {pendingRequests.length} {pendingRequests.length === 1 ? "program has" : "programs have"} requested full access to Marcus's profile.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {pendingRequests.map((req) => (
                <AccessRequestCard
                  key={req.id}
                  req={req}
                  onApprove={handleApprove}
                  onDecline={handleDecline}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Section 6: Privacy At A Glance ── */}
        <section>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            Privacy At A Glance
          </h2>
          <p style={{ margin: "0 0 24px", fontSize: 13, color: "var(--text-muted)" }}>
            Here's what each group can see when they visit Marcus's profile.
          </p>

          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "28px 32px",
            display: "flex",
            gap: 40,
            alignItems: "center",
            flexWrap: "wrap",
          }}>
            <PrivacyDiagram />

            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: MUTED }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Public</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", paddingLeft: 18 }}>
                    Name, position, VDV status, grade year
                  </p>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: PRIMARY }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Approved Recruiters</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", paddingLeft: 18 }}>
                    Assessment history, film clips, coach narratives
                  </p>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: SUCCESS }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Family + Coach Only</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", paddingLeft: 18 }}>
                    Full observation text, IDP goals, personal notes
                  </p>
                </div>
              </div>

              <div style={{
                marginTop: 20,
                background: `${PRIMARY}0d`,
                border: `1px solid ${PRIMARY}22`,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 12,
                color: "var(--text-muted)",
              }}>
                Marcus's privacy settings are set to <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Standard</span>.{" "}
                <button
                  onClick={() => toast.info("Opening privacy settings")}
                  style={{ color: PRIMARY, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0 }}
                >
                  Adjust in Privacy Settings →
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </AppShell>
  );
}
