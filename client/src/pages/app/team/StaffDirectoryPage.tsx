import { useState } from "react";
import {
  Mail,
  Phone,
  Copy,
  MessageSquare,
  Plus,
  ShieldCheck,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";
import {
  staffMembers,
  type StaffMember,
} from "@/features/team-management/mock";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";

const ROLE_LABELS: Record<StaffMember["role"], string> = {
  head_coach:      "Head Coach",
  assistant_coach: "Asst. Coach",
  director:        "Director",
  admin:           "Admin",
  volunteer:       "Volunteer",
};

const ROLE_COLORS: Record<StaffMember["role"], string> = {
  head_coach:      "oklch(0.72 0.18 290)",
  assistant_coach: "oklch(0.72 0.18 240)",
  director:        "oklch(0.68 0.22 25)",
  admin:           "oklch(0.75 0.12 140)",
  volunteer:       "oklch(0.78 0.16 75)",
};

const TEAM_LABELS: Record<string, string> = {
  team_17u: "17U",
  team_15u: "15U",
};

type RoleFilter = "all" | StaffMember["role"];

// ─────────────────────────────────────────────────────────────────────────────
// Background check badge
// ─────────────────────────────────────────────────────────────────────────────

function BgCheckBadge({ status, expiry }: { status: StaffMember["backgroundCheckStatus"]; expiry?: string }) {
  if (status === "verified") {
    return (
      <span
        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
        style={{
          background: SUCCESS.replace(")", " / 0.12)"),
          color: SUCCESS,
          borderColor: SUCCESS.replace(")", " / 0.30)"),
        }}
      >
        <ShieldCheck className="w-3 h-3" />
        Verified
        {expiry && (
          <span className="opacity-60 ml-0.5">· {new Date(expiry).getFullYear()}</span>
        )}
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span
        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
        style={{
          background: WARNING.replace(")", " / 0.12)"),
          color: WARNING,
          borderColor: WARNING.replace(")", " / 0.30)"),
        }}
      >
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  }
  return (
    <span
      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
      style={{
        background: DANGER.replace(")", " / 0.12)"),
        color: DANGER,
        borderColor: DANGER.replace(")", " / 0.30)"),
      }}
    >
      <AlertTriangle className="w-3 h-3" />
      Expired
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add staff modal
// ─────────────────────────────────────────────────────────────────────────────

function AddStaffModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    role: "assistant_coach" as StaffMember["role"],
    email: "",
    teams: [] as string[],
  });

  function toggleTeam(teamId: string) {
    setForm((prev) => ({
      ...prev,
      teams: prev.teams.includes(teamId)
        ? prev.teams.filter((t) => t !== teamId)
        : [...prev.teams, teamId],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }
    toast.success(`${form.name} added to staff directory`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden"
        style={{ background: "oklch(0.13 0.005 260)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-[15px] font-bold">Add Staff Member</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Coach First Last"
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-1">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as StaffMember["role"] })}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary/50 transition-colors"
            >
              <option value="head_coach">Head Coach</option>
              <option value="assistant_coach">Assistant Coach</option>
              <option value="director">Director</option>
              <option value="admin">Admin</option>
              <option value="volunteer">Volunteer</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-1">
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="coach@barnegat.org"
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-2">
              Team Assignments
            </label>
            <div className="flex gap-2">
              {(["team_17u", "team_15u"] as const).map((teamId) => {
                const selected = form.teams.includes(teamId);
                return (
                  <button
                    key={teamId}
                    type="button"
                    onClick={() => toggleTeam(teamId)}
                    className="h-8 px-3 rounded-lg text-[12px] font-medium border transition-colors"
                    style={
                      selected
                        ? { background: PRIMARY.replace(")", " / 0.14)"), color: PRIMARY, borderColor: PRIMARY.replace(")", " / 0.35)") }
                        : { borderColor: "oklch(0.28 0.005 260)", color: "oklch(0.55 0.02 260)" }
                    }
                  >
                    {TEAM_LABELS[teamId]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 h-9 rounded-lg text-[13px] font-semibold text-white transition-all hover:brightness-110"
              style={{ background: PRIMARY }}
            >
              Add Staff Member
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg text-[13px] border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Staff card
// ─────────────────────────────────────────────────────────────────────────────

function StaffCard({ member }: { member: StaffMember }) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const roleColor = ROLE_COLORS[member.role];
  const roleLabel = ROLE_LABELS[member.role];

  const bioPreview = member.bio.length > 110
    ? member.bio.slice(0, 110) + "…"
    : member.bio;

  return (
    <div
      className="rounded-2xl border border-border overflow-hidden flex flex-col hover:border-primary/25 transition-colors"
      style={{ background: "oklch(0.15 0.005 260)" }}
    >
      {/* Card header */}
      <div
        className="h-1.5"
        style={{ background: roleColor.replace(")", " / 0.50)") }}
      />

      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Identity row */}
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-[15px] font-bold shrink-0"
            style={{
              background: roleColor.replace(")", " / 0.15)"),
              color: roleColor,
              border: `1.5px solid ${roleColor.replace(")", " / 0.30)")}`,
            }}
          >
            {member.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14.5px] font-bold leading-tight">{member.name}</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">{member.title}</div>
            <div className="mt-1.5">
              <span
                className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
                style={{
                  background: roleColor.replace(")", " / 0.12)"),
                  color: roleColor,
                }}
              >
                {roleLabel}
              </span>
            </div>
          </div>
          <BgCheckBadge status={member.backgroundCheckStatus} expiry={member.backgroundCheckExpiry} />
        </div>

        {/* Team chips */}
        {member.teams.length > 0 && (
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-1.5">
              Teams
            </div>
            <div className="flex flex-wrap gap-1.5">
              {member.teams.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium border"
                  style={{
                    background: PRIMARY.replace(")", " / 0.08)"),
                    color: PRIMARY,
                    borderColor: PRIMARY.replace(")", " / 0.20)"),
                  }}
                >
                  {TEAM_LABELS[t] ?? t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {member.certifications.length > 0 && (
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-1.5">
              Certifications
            </div>
            <div className="flex flex-col gap-1">
              {member.certifications.map((cert) => (
                <span key={cert} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: SUCCESS }}
                  />
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-1.5">
            Bio
          </div>
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            {bioExpanded ? member.bio : bioPreview}
          </p>
          {member.bio.length > 110 && (
            <button
              className="flex items-center gap-1 text-[11.5px] mt-1.5 transition-colors hover:text-primary"
              style={{ color: PRIMARY }}
              onClick={() => setBioExpanded((v) => !v)}
            >
              {bioExpanded ? (
                <>Show less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Read more <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </div>

        {/* Contact row */}
        <div className="flex items-center gap-3 pt-1 border-t border-border">
          <button
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors group"
            onClick={() => {
              navigator.clipboard.writeText(member.email).catch(() => null);
              toast.success(`${member.email} copied`);
            }}
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="truncate max-w-[140px]">{member.email}</span>
            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
          </button>
          <span className="text-muted-foreground/20">·</span>
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Phone className="w-3.5 h-3.5" />
            {member.phone}
          </span>
        </div>
      </div>

      {/* Action footer */}
      <div className="px-5 pb-4">
        <button
          className="w-full h-8 rounded-lg text-[12.5px] font-semibold border transition-colors hover:border-primary/40 hover:text-primary"
          style={{ borderColor: "oklch(0.28 0.005 260)", color: "oklch(0.55 0.02 260)" }}
          onClick={() => toast.success(`Message sent to ${member.name}`)}
        >
          <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
          Message
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export function StaffDirectoryPage() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Background check summary
  const verified = staffMembers.filter((s) => s.backgroundCheckStatus === "verified").length;
  const pending  = staffMembers.filter((s) => s.backgroundCheckStatus === "pending").length;
  const expired  = staffMembers.filter((s) => s.backgroundCheckStatus === "expired").length;

  const filtered = roleFilter === "all"
    ? staffMembers
    : staffMembers.filter((s) => s.role === roleFilter);

  const roleFilters: { key: RoleFilter; label: string }[] = [
    { key: "all",            label: "All Staff" },
    { key: "director",       label: "Directors" },
    { key: "head_coach",     label: "Head Coaches" },
    { key: "assistant_coach", label: "Assistants" },
    { key: "admin",          label: "Admin" },
    { key: "volunteer",      label: "Volunteers" },
  ];

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="TEAM MANAGEMENT"
          title="Staff Directory"
          subtitle="Coaches, administrators, and support staff"
          actions={
            <button
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold text-white transition-all hover:brightness-110"
              style={{ background: PRIMARY }}
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Staff
            </button>
          }
        />

        {/* Background check summary bar */}
        <div
          className="rounded-xl border border-border p-4 mb-6 flex flex-wrap items-center gap-4"
          style={{ background: "oklch(0.15 0.005 260)" }}
        >
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
            Background Checks
          </span>

          <div className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: SUCCESS }}>
            <ShieldCheck className="w-4 h-4" />
            {verified} verified
          </div>

          {pending > 0 && (
            <div className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: WARNING }}>
              <Clock className="w-4 h-4" />
              {pending} pending
            </div>
          )}

          {expired > 0 && (
            <div className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: DANGER }}>
              <AlertTriangle className="w-4 h-4" />
              {expired} expired — renewal required
            </div>
          )}

          {/* SVG mini bar */}
          <div className="ml-auto hidden sm:flex items-center gap-1.5">
            <svg width="120" height="8" viewBox="0 0 120 8" className="rounded-full overflow-hidden">
              <rect x="0" y="0" width="120" height="8" fill="oklch(0.22 0.005 260)" />
              <rect
                x="0"
                y="0"
                width={Math.round((verified / staffMembers.length) * 120)}
                height="8"
                fill={SUCCESS}
              />
              <rect
                x={Math.round((verified / staffMembers.length) * 120)}
                y="0"
                width={Math.round((pending / staffMembers.length) * 120)}
                height="8"
                fill={WARNING}
              />
              <rect
                x={Math.round(((verified + pending) / staffMembers.length) * 120)}
                y="0"
                width={Math.round((expired / staffMembers.length) * 120)}
                height="8"
                fill={DANGER}
              />
            </svg>
            <span className="text-[11px] text-muted-foreground font-mono">
              {staffMembers.length} total
            </span>
          </div>
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
          {roleFilters.map(({ key, label }) => {
            const count = key === "all"
              ? staffMembers.length
              : staffMembers.filter((s) => s.role === key).length;
            if (key !== "all" && count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setRoleFilter(key)}
                className="h-8 px-3.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors"
                style={
                  roleFilter === key
                    ? { background: PRIMARY.replace(")", " / 0.14)"), color: PRIMARY }
                    : { background: "oklch(0.18 0.005 260)", color: "oklch(0.55 0.02 260)" }
                }
              >
                {label}
                <span className="ml-1.5 opacity-60 font-mono text-[10px]">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Staff grid */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border py-12 text-center">
            <p className="text-muted-foreground text-[14px]">No staff in this category</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {filtered.map((member) => (
              <StaffCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>

      {/* Add staff modal */}
      {showAddModal && (
        <AddStaffModal onClose={() => setShowAddModal(false)} />
      )}
    </AppShell>
  );
}

export default StaffDirectoryPage;
