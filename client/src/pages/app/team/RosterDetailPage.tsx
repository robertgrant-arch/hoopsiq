import { useState } from "react";
import {
  Users,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MessageSquare,
  CalendarOff,
  Target,
  Film,
  CheckCircle2,
  AlertTriangle,
  Minus,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";
import {
  rosterPlayers,
  prospectPlayers,
  type RosterPlayer,
  type HouseholdMember,
} from "@/features/team-management/mock";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";

const POSITION_COLORS: Record<string, string> = {
  PG: "oklch(0.72 0.18 290)",
  SG: "oklch(0.72 0.18 240)",
  SF: "oklch(0.75 0.12 140)",
  PF: "oklch(0.78 0.16 75)",
  C:  "oklch(0.68 0.22 25)",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function positionStyle(pos: string) {
  const c = POSITION_COLORS[pos] ?? PRIMARY;
  return {
    background: c.replace(")", " / 0.14)"),
    color: c,
    border: `1px solid ${c.replace(")", " / 0.30)")}`,
  };
}

function statusStyle(status: RosterPlayer["status"]) {
  if (status === "active")   return { bg: SUCCESS.replace(")", " / 0.12)"), color: SUCCESS, border: SUCCESS.replace(")", " / 0.28)") };
  if (status === "trial")    return { bg: PRIMARY.replace(")", " / 0.12)"), color: PRIMARY, border: PRIMARY.replace(")", " / 0.28)") };
  if (status === "inactive") return { bg: "oklch(0.4 0.01 260 / 0.14)", color: "oklch(0.55 0.01 260)", border: "oklch(0.4 0.01 260 / 0.25)" };
  return { bg: WARNING.replace(")", " / 0.12)"), color: WARNING, border: WARNING.replace(")", " / 0.28)") };
}

function priorityLabel(p: 1 | 2 | 3) {
  return p === 1 ? "Primary" : p === 2 ? "Secondary" : "Tertiary";
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini attendance bar
// ─────────────────────────────────────────────────────────────────────────────

function AttendanceBar({ rate }: { rate: number }) {
  const color =
    rate >= 85 ? SUCCESS :
    rate >= 70 ? WARNING :
    DANGER;

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-[oklch(0.22_0.005_260)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${rate}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-mono" style={{ color }}>
        {rate}%
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Household member row
// ─────────────────────────────────────────────────────────────────────────────

function HouseholdRow({ member }: { member: HouseholdMember }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
        style={{
          background: PRIMARY.replace(")", " / 0.13)"),
          color: PRIMARY,
        }}
      >
        {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold">{member.name}</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded capitalize font-medium"
            style={{
              background: "oklch(0.22 0.005 260)",
              color: "oklch(0.65 0.02 260)",
            }}
          >
            {member.relationship}
          </span>
          {member.isPrimary && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
              style={{
                background: PRIMARY.replace(")", " / 0.12)"),
                color: PRIMARY,
              }}
            >
              Primary
            </span>
          )}
          {member.hasMedicalAuth && (
            <span className="flex items-center gap-0.5 text-[10px]" style={{ color: SUCCESS }}>
              <ShieldCheck className="w-3 h-3" />
              Med Auth
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
            <Phone className="w-3 h-3" />
            {member.phone}
          </span>
          <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
            <Mail className="w-3 h-3" />
            {member.email}
          </span>
        </div>
        <div className="mt-1 text-[10.5px] text-muted-foreground">
          {priorityLabel(member.emergencyPriority)} emergency · prefers {member.preferredContact}
        </div>
      </div>
      <button
        className="shrink-0 h-7 px-2.5 rounded text-[11px] font-medium border border-border hover:border-primary/40 hover:text-primary transition-colors"
        onClick={() => toast.success(`Message sent to ${member.name}`)}
      >
        <MessageSquare className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Player detail panel (inline expand)
// ─────────────────────────────────────────────────────────────────────────────

function PlayerDetailPanel({ player, onClose }: { player: RosterPlayer; onClose: () => void }) {
  return (
    <tr>
      <td colSpan={8} className="px-0 py-0">
        <div
          className="mx-4 mb-3 rounded-xl border border-border overflow-hidden"
          style={{ background: "oklch(0.15 0.005 260)" }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <span className="text-[13px] font-semibold">{player.name} — Detail</span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">
            {/* Left: Household */}
            <div className="p-5">
              <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold mb-3">
                Household ({player.household.length})
              </div>
              {player.household.map((m) => (
                <HouseholdRow key={m.id} member={m} />
              ))}
            </div>

            {/* Right: Player details */}
            <div className="p-5 space-y-4">
              {/* Medical notes */}
              {player.medicalNotes && (
                <div
                  className="rounded-lg p-3 border-l-2"
                  style={{
                    borderLeftColor: WARNING,
                    background: WARNING.replace(")", " / 0.06)"),
                  }}
                >
                  <div
                    className="text-[10.5px] uppercase tracking-[0.08em] font-semibold mb-1"
                    style={{ color: WARNING }}
                  >
                    Medical Notes
                  </div>
                  <p className="text-[12.5px] leading-relaxed">{player.medicalNotes}</p>
                </div>
              )}

              {/* Tags */}
              {player.tags.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold mb-2">
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {player.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded-full text-[11px] font-semibold capitalize"
                        style={{
                          background: PRIMARY.replace(")", " / 0.12)"),
                          color: PRIMARY,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div>
                <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold mb-2">
                  Quick Actions
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border border-border hover:border-primary/40 hover:text-primary transition-colors"
                    onClick={() => toast.success(`Messaging household for ${player.name}`)}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Send Message
                  </button>
                  <button
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border border-border hover:border-warning/40 transition-colors"
                    onClick={() => toast.success(`Absence logged for ${player.name}`)}
                    style={{ "--tw-border-opacity": 1 } as React.CSSProperties}
                  >
                    <CalendarOff className="w-3.5 h-3.5" />
                    Log Absence
                  </button>
                  {player.hasActiveIDP && (
                    <button
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border border-border hover:border-primary/40 hover:text-primary transition-colors"
                      onClick={() => toast.success(`Opening IDP for ${player.name}`)}
                    >
                      <Target className="w-3.5 h-3.5" />
                      View IDP
                    </button>
                  )}
                  <button
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border border-border hover:border-primary/40 hover:text-primary transition-colors"
                    onClick={() => toast.success(`Opening film for ${player.name}`)}
                  >
                    <Film className="w-3.5 h-3.5" />
                    View Film
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add player inline form
// ─────────────────────────────────────────────────────────────────────────────

function AddPlayerForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    position: "PG",
    gradYear: 2027,
    status: "trial",
    ageGroup: "17U",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Player name is required");
      return;
    }
    toast.success(`${form.name} added to roster as ${form.status}`);
    onClose();
  }

  return (
    <div
      className="mx-0 mb-0 rounded-xl border border-primary/30 overflow-hidden"
      style={{ background: "oklch(0.15 0.005 260)" }}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <span className="text-[13px] font-semibold flex items-center gap-2">
          <UserPlus className="w-4 h-4" style={{ color: PRIMARY }} />
          Add New Player
        </span>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="First Last"
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-1">
              Position
            </label>
            <select
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary/50 transition-colors"
            >
              {["PG", "SG", "SF", "PF", "C"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-1">
              Grad Year
            </label>
            <select
              value={form.gradYear}
              onChange={(e) => setForm({ ...form, gradYear: parseInt(e.target.value) })}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary/50 transition-colors"
            >
              {[2026, 2027, 2028, 2029, 2030].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary/50 transition-colors"
            >
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button
            type="submit"
            className="h-9 px-5 rounded-lg text-[13px] font-semibold text-white transition-all hover:brightness-110"
            style={{ background: PRIMARY }}
          >
            Add Player
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-[13px] border border-border hover:border-border/80 transition-colors text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Player row
// ─────────────────────────────────────────────────────────────────────────────

function PlayerRow({
  player,
  isExpanded,
  onToggle,
}: {
  player: RosterPlayer;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const st = statusStyle(player.status);
  const formsOk = player.hasSignedWaiver && player.hasCompletedForms;

  return (
    <>
      <tr
        className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        {/* Avatar + name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
              style={{
                background: PRIMARY.replace(")", " / 0.14)"),
                color: PRIMARY,
              }}
            >
              {player.initials}
            </div>
            <div>
              <div className="text-[13px] font-semibold flex items-center gap-1.5">
                {player.name}
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
              <div className="text-[11px] text-muted-foreground">
                #{player.jerseyNumber} · {player.ageGroup} · {player.gradYear}
              </div>
            </div>
          </div>
        </td>

        {/* Position */}
        <td className="px-3 py-3">
          <span
            className="px-2 py-0.5 rounded text-[10.5px] font-bold font-mono"
            style={positionStyle(player.position)}
          >
            {player.position}
          </span>
        </td>

        {/* Status */}
        <td className="px-3 py-3">
          <span
            className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize border"
            style={{ background: st.bg, color: st.color, borderColor: st.border }}
          >
            {player.status}
          </span>
        </td>

        {/* Attendance */}
        <td className="px-3 py-3">
          <AttendanceBar rate={player.attendanceRate} />
        </td>

        {/* Forms */}
        <td className="px-3 py-3">
          {formsOk ? (
            <CheckCircle2 className="w-4 h-4" style={{ color: SUCCESS }} />
          ) : (
            <AlertTriangle className="w-4 h-4" style={{ color: WARNING }} />
          )}
        </td>

        {/* IDP */}
        <td className="px-3 py-3">
          {player.hasActiveIDP ? (
            <CheckCircle2 className="w-4 h-4" style={{ color: SUCCESS }} />
          ) : (
            <Minus className="w-4 h-4 text-muted-foreground/40" />
          )}
        </td>

        {/* Household count */}
        <td className="px-3 py-3">
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            {player.household.length}
          </span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="text-[11.5px] font-medium hover:text-primary transition-colors"
              style={{ color: PRIMARY }}
              onClick={() => toast.info(`Viewing profile for ${player.name}`)}
            >
              View
            </button>
            <span className="text-muted-foreground/30">·</span>
            <button
              className="text-[11.5px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => toast.info(`Editing ${player.name}`)}
            >
              Edit
            </button>
            <span className="text-muted-foreground/30">·</span>
            <button
              className="text-[11.5px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => toast.success(`Messaging ${player.name}'s household`)}
            >
              Msg
            </button>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <PlayerDetailPanel player={player} onClose={onToggle} />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trial pipeline card
// ─────────────────────────────────────────────────────────────────────────────

function TrialCard({ player }: { player: RosterPlayer }) {
  return (
    <div
      className="rounded-xl border border-border p-4 hover:border-primary/30 transition-colors"
      style={{ background: "oklch(0.15 0.005 260)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
          style={{
            background: PRIMARY.replace(")", " / 0.14)"),
            color: PRIMARY,
          }}
        >
          {player.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-semibold">{player.name}</div>
          <div className="text-[11.5px] text-muted-foreground mt-0.5">
            {player.position} · {player.ageGroup} · Class of {player.gradYear}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground">
              Joined {new Date(player.joinedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-semibold capitalize"
              style={{
                background: WARNING.replace(")", " / 0.12)"),
                color: WARNING,
              }}
            >
              {player.status}
            </span>
            {!player.hasSignedWaiver && (
              <span className="flex items-center gap-0.5 text-[10.5px]" style={{ color: DANGER }}>
                <AlertTriangle className="w-3 h-3" />
                Waiver pending
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          className="flex-1 h-8 rounded-lg text-[12px] font-semibold text-white transition-all hover:brightness-110"
          style={{ background: SUCCESS }}
          onClick={() => toast.success(`${player.name} converted to active roster`)}
        >
          Convert to Active
        </button>
        <button
          className="h-8 px-3 rounded-lg text-[12px] font-medium border border-border hover:border-danger/40 transition-colors text-muted-foreground"
          onClick={() => toast.success(`${player.name} archived`)}
        >
          Archive
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

type TabKey = "all" | "active" | "trial" | "inactive";

export function RosterDetailPage() {
  const [activeTab, setActiveTab]       = useState<TabKey>("all");
  const [posFilter, setPosFilter]       = useState<string>("All");
  const [search, setSearch]             = useState("");
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [showAddForm, setShowAddForm]   = useState(false);

  const allPlayers = rosterPlayers;

  // Derived stats
  const activePlayers  = allPlayers.filter((p) => p.status === "active");
  const trialPlayers   = allPlayers.filter((p) => p.status === "trial");
  const inactivePlayers = allPlayers.filter((p) => p.status === "inactive");

  const formsComplete = allPlayers.filter(
    (p) => p.hasSignedWaiver && p.hasCompletedForms
  ).length;
  const formsPct = Math.round((formsComplete / allPlayers.length) * 100);

  const avgAttendance = Math.round(
    allPlayers.reduce((acc, p) => acc + p.attendanceRate, 0) / allPlayers.length
  );

  // Filter players for current tab
  const tabFiltered =
    activeTab === "all"      ? allPlayers :
    activeTab === "active"   ? activePlayers :
    activeTab === "trial"    ? trialPlayers :
    inactivePlayers;

  const filtered = tabFiltered.filter((p) => {
    const matchPos    = posFilter === "All" || p.position === posFilter;
    const matchSearch = search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.position.toLowerCase().includes(search.toLowerCase());
    return matchPos && matchSearch;
  });

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all",      label: "All Players",      count: allPlayers.length },
    { key: "active",   label: "Active",           count: activePlayers.length },
    { key: "trial",    label: "Trial / Prospect", count: trialPlayers.length },
    { key: "inactive", label: "Inactive",         count: inactivePlayers.length },
  ];

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="TEAM MANAGEMENT"
          title="Roster"
          subtitle="Barnegat 17U — Spring 2026"
          actions={
            <button
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold text-white transition-all hover:brightness-110"
              style={{ background: PRIMARY }}
              onClick={() => setShowAddForm((v) => !v)}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Player
            </button>
          }
        />

        {/* Add form (inline) */}
        {showAddForm && (
          <div className="mb-6">
            <AddPlayerForm onClose={() => setShowAddForm(false)} />
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Active Players",    value: activePlayers.length.toString(),  sub: `${inactivePlayers.length} inactive`,  color: PRIMARY  },
            { label: "Trial Players",     value: trialPlayers.length.toString(),   sub: "evaluating this week",               color: WARNING  },
            { label: "Forms Complete",    value: `${formsPct}%`,                   sub: `${formsComplete} of ${allPlayers.length} players`, color: formsPct === 100 ? SUCCESS : DANGER },
            { label: "Avg Attendance",    value: `${avgAttendance}%`,              sub: "rolling 90 days",                    color: avgAttendance >= 85 ? SUCCESS : WARNING },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border p-4"
              style={{ background: "oklch(0.15 0.005 260)" }}
            >
              <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-1">
                {stat.label}
              </div>
              <div className="font-mono text-[22px] font-bold leading-none" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border mb-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors"
              style={
                activeTab === tab.key
                  ? { borderBottomColor: PRIMARY, color: PRIMARY, fontWeight: 600 }
                  : { borderBottomColor: "transparent", color: "oklch(0.55 0.02 260)" }
              }
            >
              {tab.label}
              <span className="ml-1.5 font-mono text-[10px] opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 py-3 border-b border-border mb-0 flex-wrap">
          {/* Position filter */}
          <div className="flex items-center gap-1">
            {["All", "PG", "SG", "SF", "PF", "C"].map((pos) => (
              <button
                key={pos}
                onClick={() => setPosFilter(pos)}
                className="h-7 px-2.5 rounded-md text-[11.5px] font-medium transition-colors"
                style={
                  posFilter === pos
                    ? { background: PRIMARY.replace(")", " / 0.14)"), color: PRIMARY }
                    : { background: "oklch(0.18 0.005 260)", color: "oklch(0.55 0.02 260)" }
                }
              >
                {pos}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players…"
              className="w-full h-8 pl-9 pr-3 rounded-lg border border-border bg-background text-[12.5px] focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <span className="text-[11.5px] text-muted-foreground ml-auto">
            {filtered.length} player{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table — desktop */}
        <div className="hidden md:block overflow-x-auto rounded-b-xl border-x border-b border-border">
          <table className="w-full">
            <thead>
              <tr
                className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground"
                style={{ background: "oklch(0.14 0.005 260)" }}
              >
                <th className="text-left px-4 py-3 font-semibold">Player</th>
                <th className="text-left px-3 py-3 font-semibold">Pos</th>
                <th className="text-left px-3 py-3 font-semibold">Status</th>
                <th className="text-left px-3 py-3 font-semibold">Attendance</th>
                <th className="text-left px-3 py-3 font-semibold">Forms</th>
                <th className="text-left px-3 py-3 font-semibold">IDP</th>
                <th className="text-left px-3 py-3 font-semibold">HH</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-[13px]">
                    No players match your filters
                  </td>
                </tr>
              ) : (
                filtered.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    isExpanded={expandedId === player.id}
                    onToggle={() => toggleExpand(player.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden space-y-2 mt-2">
          {filtered.map((player) => {
            const st = statusStyle(player.status);
            return (
              <div
                key={player.id}
                className="rounded-xl border border-border p-4 cursor-pointer"
                style={{ background: "oklch(0.15 0.005 260)" }}
                onClick={() => toggleExpand(player.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                    style={{
                      background: PRIMARY.replace(")", " / 0.14)"),
                      color: PRIMARY,
                    }}
                  >
                    {player.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold">{player.name}</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono"
                        style={positionStyle(player.position)}
                      >
                        {player.position}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold capitalize border"
                        style={{ background: st.bg, color: st.color, borderColor: st.border }}
                      >
                        {player.status}
                      </span>
                      <AttendanceBar rate={player.attendanceRate} />
                    </div>
                  </div>
                  {expandedId === player.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </div>

                {expandedId === player.id && (
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold mb-2">
                      Household
                    </div>
                    {player.household.map((m) => (
                      <HouseholdRow key={m.id} member={m} />
                    ))}
                    {player.medicalNotes && (
                      <div
                        className="rounded-lg p-3 border-l-2 mt-3"
                        style={{ borderLeftColor: WARNING, background: WARNING.replace(")", " / 0.06)") }}
                      >
                        <div className="text-[10.5px] uppercase tracking-[0.08em] font-semibold mb-1" style={{ color: WARNING }}>
                          Medical Notes
                        </div>
                        <p className="text-[12px] leading-relaxed">{player.medicalNotes}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border border-border hover:text-primary transition-colors"
                        onClick={(e) => { e.stopPropagation(); toast.success(`Messaging ${player.name}`); }}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Message
                      </button>
                      <button
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border border-border transition-colors"
                        onClick={(e) => { e.stopPropagation(); toast.success(`Absence logged for ${player.name}`); }}
                      >
                        <CalendarOff className="w-3.5 h-3.5" />
                        Log Absence
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Trial pipeline */}
        {prospectPlayers.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-[16px] font-bold">Trial Pipeline</h2>
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{
                  background: WARNING.replace(")", " / 0.12)"),
                  color: WARNING,
                }}
              >
                {prospectPlayers.length} prospects
              </span>
            </div>
            <p className="text-[12.5px] text-muted-foreground mb-4">
              Players currently evaluating the program. Convert to active once trial period is complete and paperwork is signed.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {prospectPlayers.map((player) => (
                <TrialCard key={player.id} player={player} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default RosterDetailPage;
