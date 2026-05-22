/**
 * AccessRequestPage — Recruiter's view of all their access requests.
 * Route: /app/recruiter/access-requests
 *
 * Sections:
 *   1. Summary strip (Pending / Active / Expiring)
 *   2. Requests list with tabs
 *   3. New request CTA
 *   4. Privacy reminder
 */
import { useState } from "react";
import { Link } from "wouter";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Send,
  X,
  ChevronRight,
  Film,
  FileText,
  User,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type AccessRequest = {
  id: string;
  playerId: string;
  playerName: string;
  position: string;
  gradYear: number;
  programName: string;
  status: "pending" | "approved" | "denied" | "expired";
  requestedAt: string;
  respondedAt?: string;
  expiresAt?: string;
  accessLevel: "profile_only" | "full_profile" | "includes_film";
  requestMessage: string;
  viewCount?: number;
  sections?: string[];
};

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const MOCK_REQUESTS: AccessRequest[] = [
  {
    id: "ar1",
    playerId: "p1",
    playerName: "Jordan Mills",
    position: "SG",
    gradYear: 2027,
    programName: "Elevation Basketball",
    status: "approved",
    requestedAt: "2026-05-09",
    respondedAt: "2026-05-10",
    expiresAt: "2026-11-10",
    accessLevel: "includes_film",
    requestMessage: "Interested in evaluating for our 2027 recruiting class.",
    viewCount: 7,
    sections: ["Skill Scores", "Growth Trajectory", "Coachability Indicators", "Verified Badges", "Coach Narrative", "Film Package"],
  },
  {
    id: "ar2",
    playerId: "p2",
    playerName: "Marcus Tate",
    position: "PG",
    gradYear: 2027,
    programName: "Rise Elite",
    status: "approved",
    requestedAt: "2026-05-07",
    respondedAt: "2026-05-08",
    expiresAt: "2026-09-12",
    accessLevel: "full_profile",
    requestMessage: "Top priority for our PG evaluation this cycle.",
    viewCount: 12,
    sections: ["Skill Scores", "Growth Trajectory", "Coachability Indicators", "Verified Badges", "Coach Narrative"],
  },
  {
    id: "ar3",
    playerId: "p3",
    playerName: "Darius Webb",
    position: "SF",
    gradYear: 2028,
    programName: "Triangle Elite",
    status: "pending",
    requestedAt: "2026-05-12",
    accessLevel: "full_profile",
    requestMessage: "Interested in evaluating for 2028 wing class. Would love to see full development data.",
  },
  {
    id: "ar4",
    playerId: "p6",
    playerName: "Isaiah Parker",
    position: "SG",
    gradYear: 2027,
    programName: "Northwest Elite",
    status: "pending",
    requestedAt: "2026-05-14",
    accessLevel: "includes_film",
    requestMessage: "2027 SG evaluation — film package requested for coaching staff review.",
  },
  {
    id: "ar5",
    playerId: "p9",
    playerName: "Keontae Simmons",
    position: "PG",
    gradYear: 2029,
    programName: "Academy of Hoops",
    status: "denied",
    requestedAt: "2026-04-20",
    respondedAt: "2026-04-24",
    accessLevel: "full_profile",
    requestMessage: "Evaluating 2029 PG class.",
  },
  {
    id: "ar6",
    playerId: "p10",
    playerName: "Amir Johnson",
    position: "C",
    gradYear: 2030,
    programName: "East Bay Elite",
    status: "expired",
    requestedAt: "2025-10-01",
    respondedAt: "2025-10-03",
    expiresAt: "2026-04-03",
    accessLevel: "profile_only",
    requestMessage: "Initial evaluation of 2030 center class.",
    viewCount: 3,
    sections: ["Skill Scores", "Verified Badges"],
  },
  {
    id: "ar7",
    playerId: "p4",
    playerName: "Caleb Washington",
    position: "PF",
    gradYear: 2028,
    programName: "Elevation Basketball",
    status: "approved",
    requestedAt: "2026-05-01",
    respondedAt: "2026-05-03",
    expiresAt: "2026-05-23",
    accessLevel: "full_profile",
    requestMessage: "Evaluating 2028 big men — top priority.",
    viewCount: 4,
    sections: ["Skill Scores", "Growth Trajectory", "Coachability Indicators", "Verified Badges", "Coach Narrative"],
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function daysUntil(dateStr: string): number {
  const now = new Date("2026-05-16");
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function accessLevelLabel(level: AccessRequest["accessLevel"]): string {
  switch (level) {
    case "profile_only": return "Profile only";
    case "full_profile": return "Full profile";
    case "includes_film": return "Full profile + film";
  }
}

function statusColor(status: AccessRequest["status"]): string {
  switch (status) {
    case "pending":  return WARNING;
    case "approved": return SUCCESS;
    case "denied":   return DANGER;
    case "expired":  return MUTED;
  }
}

function statusLabel(status: AccessRequest["status"]): string {
  switch (status) {
    case "pending":  return "Pending";
    case "approved": return "Approved";
    case "denied":   return "Denied";
    case "expired":  return "Expired";
  }
}

function formatDate(str: string): string {
  const d = new Date(str);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* -------------------------------------------------------------------------- */
/* Summary stat card                                                           */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border p-5 flex items-center gap-4"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}22` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="text-[28px] font-black tabular-nums leading-none" style={{ color }}>
          {value}
        </div>
        <div className="text-[12px] mt-0.5" style={{ color: MUTED }}>{label}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Request card                                                                */
/* -------------------------------------------------------------------------- */

function RequestCard({
  request,
  onWithdraw,
  onExtend,
  onMessage,
}: {
  request: AccessRequest;
  onWithdraw: (id: string) => void;
  onExtend: (id: string) => void;
  onMessage: (id: string) => void;
}) {
  const expiringDays = request.expiresAt ? daysUntil(request.expiresAt) : null;
  const isExpiringSoon = expiringDays !== null && expiringDays > 0 && expiringDays <= 7;

  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/app/recruiter/players/${request.playerId}`} asChild>
              <a className="text-[15px] font-bold hover:underline" style={{ color: "var(--text-primary)" }}>
                {request.playerName}
              </a>
            </Link>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: `${PRIMARY}22`, color: PRIMARY }}
            >
              {request.position}
            </span>
            <span className="text-[11px]" style={{ color: MUTED }}>Class of {request.gradYear}</span>
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: MUTED }}>{request.programName}</div>
        </div>
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
          style={{
            background: `${statusColor(request.status)}22`,
            color: statusColor(request.status),
          }}
        >
          {statusLabel(request.status)}
        </span>
      </div>

      {/* Request details */}
      <div className="space-y-1.5 text-[11px]" style={{ color: MUTED }}>
        <div>
          Requested on {formatDate(request.requestedAt)}
          {request.respondedAt && ` · Responded ${formatDate(request.respondedAt)}`}
        </div>
        <div>
          Access level: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {accessLevelLabel(request.accessLevel)}
          </span>
        </div>
        {request.requestMessage && (
          <div className="text-[10px] italic" style={{ color: MUTED }}>
            "{request.requestMessage}"
          </div>
        )}
      </div>

      {/* Expiry / sections (approved) */}
      {(request.status === "approved" || request.status === "expired") && (
        <div className="space-y-2">
          {request.expiresAt && (
            <div
              className="flex items-center gap-1.5 text-[11px] font-medium"
              style={{ color: isExpiringSoon ? WARNING : request.status === "expired" ? MUTED : SUCCESS }}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {request.status === "expired"
                ? `Expired ${formatDate(request.expiresAt)}`
                : isExpiringSoon
                ? `Expires in ${expiringDays} day${expiringDays !== 1 ? "s" : ""}`
                : `Expires ${formatDate(request.expiresAt)}`}
            </div>
          )}

          {request.sections && request.sections.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-semibold" style={{ color: MUTED }}>Accessible:</span>
              {request.sections.map((sec) => (
                <span
                  key={sec}
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: `${SUCCESS}18`, color: SUCCESS }}
                >
                  {sec}
                </span>
              ))}
            </div>
          )}

          {request.viewCount !== undefined && (
            <div className="text-[10px]" style={{ color: MUTED }}>
              <Eye className="w-3 h-3 inline mr-1" />
              Viewed {request.viewCount} time{request.viewCount !== 1 ? "s" : ""}
              {" — "}view activity is visible to the family and program director
            </div>
          )}
        </div>
      )}

      {/* Pending notice */}
      {request.status === "pending" && (
        <div
          className="rounded-lg px-3 py-2 text-[11px]"
          style={{ background: `${WARNING}12`, color: WARNING }}
        >
          <Clock className="w-3.5 h-3.5 inline mr-1.5" />
          Families typically respond within 1–2 days
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t" style={{ borderColor: "var(--border)" }}>
        {request.status === "approved" && (
          <Link href={`/app/recruiter/players/${request.playerId}`} asChild>
            <a
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-lg transition-colors"
              style={{ background: PRIMARY, color: "white" }}
            >
              <Eye className="w-3.5 h-3.5" />
              View Profile
            </a>
          </Link>
        )}

        {isExpiringSoon && request.status === "approved" && (
          <button
            onClick={() => onExtend(request.id)}
            className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-lg border transition-colors"
            style={{ borderColor: `${WARNING}50`, color: WARNING }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Request Extension
          </button>
        )}

        {request.status === "expired" && (
          <button
            onClick={() => toast.info("Re-request flow — contact the program directly or submit a new access request.")}
            className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-lg border transition-colors"
            style={{ borderColor: `${PRIMARY}50`, color: PRIMARY }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-request Access
          </button>
        )}

        {request.status === "denied" && (
          <button
            onClick={() => onMessage(request.id)}
            className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-lg border transition-colors"
            style={{ borderColor: `${PRIMARY}50`, color: PRIMARY }}
          >
            <Send className="w-3.5 h-3.5" />
            Message Program
          </button>
        )}

        {request.status === "pending" && (
          <button
            onClick={() => onWithdraw(request.id)}
            className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-colors ml-auto"
            style={{ borderColor: `${DANGER}40`, color: DANGER }}
          >
            <X className="w-3 h-3" />
            Withdraw request
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tab types                                                                   */
/* -------------------------------------------------------------------------- */

type TabId = "pending" | "active" | "expiring" | "expired" | "denied";

const TABS: { id: TabId; label: string }[] = [
  { id: "pending",  label: "Pending"  },
  { id: "active",   label: "Active"   },
  { id: "expiring", label: "Expiring" },
  { id: "expired",  label: "Expired"  },
  { id: "denied",   label: "Denied"   },
];

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function AccessRequestPage() {
  const [activeTab, setActiveTab] = useState<TabId>("pending");
  const [requests, setRequests] = useState<AccessRequest[]>(MOCK_REQUESTS);

  function handleWithdraw(id: string) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    toast.success("Access request withdrawn.");
  }

  function handleExtend(id: string) {
    const req = requests.find((r) => r.id === id);
    toast.success(
      `Extension requested for ${req?.playerName ?? "player"} — the family will be notified.`
    );
  }

  function handleMessage(id: string) {
    const req = requests.find((r) => r.id === id);
    toast.info(
      `Opening message to ${req?.programName ?? "program"} — messaging feature in full product.`
    );
  }

  const pending  = requests.filter((r) => r.status === "pending");
  const active   = requests.filter((r) => r.status === "approved" && r.expiresAt && daysUntil(r.expiresAt) > 0);
  const expiring = active.filter((r) => r.expiresAt && daysUntil(r.expiresAt) <= 7);
  const expired  = requests.filter((r) => r.status === "expired" || (r.status === "approved" && r.expiresAt && daysUntil(r.expiresAt) <= 0));
  const denied   = requests.filter((r) => r.status === "denied");

  function tabRequests(tab: TabId): AccessRequest[] {
    switch (tab) {
      case "pending":  return pending;
      case "active":   return active;
      case "expiring": return expiring;
      case "expired":  return expired;
      case "denied":   return denied;
    }
  }

  const tabCount = (tab: TabId): number => tabRequests(tab).length;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          eyebrow="Recruiting"
          title="Access Requests"
          subtitle="Track your profile access requests and active grants"
          actions={
            <Link href="/app/recruiter/search" asChild>
              <a
                className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-colors"
                style={{ background: `${PRIMARY}22`, color: PRIMARY }}
              >
                Search Players
                <ChevronRight className="w-4 h-4" />
              </a>
            </Link>
          }
        />

        {/* Summary strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <SummaryCard
            label="Pending — awaiting response"
            value={pending.length}
            color={WARNING}
            icon={<Clock className="w-5 h-5" />}
          />
          <SummaryCard
            label="Active access grants"
            value={active.length}
            color={SUCCESS}
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <SummaryCard
            label="Expiring within 7 days"
            value={expiring.length}
            color={expiring.length > 0 ? DANGER : MUTED}
            icon={<AlertTriangle className="w-5 h-5" />}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((tab) => {
            const count = tabCount(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-1.5 rounded-full border transition-all"
                style={{
                  borderColor: isActive ? PRIMARY : "var(--border)",
                  background: isActive ? `${PRIMARY}22` : "transparent",
                  color: isActive ? PRIMARY : MUTED,
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: isActive ? PRIMARY : "oklch(0.28 0.01 260)",
                      color: isActive ? "white" : MUTED,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Request list */}
        {tabRequests(activeTab).length === 0 ? (
          <div
            className="rounded-xl border p-10 text-center"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="text-[14px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              No {activeTab} requests
            </div>
            <p className="text-[12px]" style={{ color: MUTED }}>
              {activeTab === "pending"
                ? "All your requests have been responded to."
                : activeTab === "active"
                ? "You don't have any active access grants. Send a request to a player profile to get started."
                : activeTab === "expiring"
                ? "No grants are expiring in the next 7 days."
                : activeTab === "expired"
                ? "No expired grants."
                : "No denied requests."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tabRequests(activeTab).map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onWithdraw={handleWithdraw}
                onExtend={handleExtend}
                onMessage={handleMessage}
              />
            ))}
          </div>
        )}

        {/* New request CTA */}
        <div className="mt-8">
          <Link href="/app/recruiter/search" asChild>
            <a
              className="flex items-center justify-between rounded-xl border px-5 py-4 transition-colors"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <div>
                <div className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Find more athletes to evaluate →
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                  Browse all HoopsIQ-verified profiles and submit access requests
                </div>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0" style={{ color: MUTED }} />
            </a>
          </Link>
        </div>

        {/* Active grants — detailed management */}
        {active.length > 0 && (
          <div className="mt-10">
            <h2 className="text-[16px] font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Access Grant Management
            </h2>
            <div className="space-y-3">
              {active.map((req) => {
                const days = req.expiresAt ? daysUntil(req.expiresAt) : null;
                const soon = days !== null && days <= 7;
                return (
                  <div
                    key={req.id}
                    className="rounded-xl border p-4 flex items-center justify-between gap-4 flex-wrap"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                  >
                    <div className="min-w-0">
                      <Link href={`/app/recruiter/players/${req.playerId}`} asChild>
                        <a className="text-[13px] font-bold hover:underline" style={{ color: "var(--text-primary)" }}>
                          {req.playerName}
                        </a>
                      </Link>
                      <div className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                        {req.programName} · {accessLevelLabel(req.accessLevel)}
                      </div>
                      {req.sections && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {req.sections.map((sec) => (
                            <span
                              key={sec}
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                              style={{ background: `${SUCCESS}18`, color: SUCCESS }}
                            >
                              {sec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right">
                      {req.viewCount !== undefined && (
                        <div>
                          <div className="text-[18px] font-black tabular-nums" style={{ color: PRIMARY }}>
                            {req.viewCount}
                          </div>
                          <div className="text-[9px]" style={{ color: MUTED }}>views</div>
                        </div>
                      )}
                      {days !== null && (
                        <div>
                          <div
                            className="text-[18px] font-black tabular-nums"
                            style={{ color: soon ? WARNING : SUCCESS }}
                          >
                            {days}d
                          </div>
                          <div className="text-[9px]" style={{ color: MUTED }}>remaining</div>
                        </div>
                      )}
                      {soon && (
                        <button
                          onClick={() => handleExtend(req.id)}
                          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                          style={{ borderColor: `${WARNING}50`, color: WARNING }}
                        >
                          Extend
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] mt-3" style={{ color: MUTED }}>
              Your access expires based on the grant period — the family can extend it if needed.
            </p>
          </div>
        )}

        {/* Privacy reminder */}
        <div
          className="mt-10 rounded-xl border px-5 py-4"
          style={{ background: `${MUTED}0D`, borderColor: "var(--border)" }}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 2L3 7v6c0 5 3.9 9.5 9 11 5.1-1.5 9-6 9-11V7L12 2z"
                  fill="none"
                  stroke={MUTED}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: MUTED }}>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Privacy notice: </span>
              Access is granted by athlete families on a per-request basis. All profile views are logged
              and visible to the player's family and program director. HoopsIQ does not sell player data.
              Requests that are withdrawn, denied, or expired do not retain view history.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
