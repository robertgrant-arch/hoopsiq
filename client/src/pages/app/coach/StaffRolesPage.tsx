/**
 * StaffRolesPage — /app/coach/staff-roles
 *
 * Staff management screen with:
 *  - Full staff roster with fine-grained HoopsOS staff roles
 *  - Inline role editing (head_coach / admin only — enforced by PermissionGate)
 *  - Invite new staff member flow
 *  - Permission matrix viewer (what each role can do)
 *  - Audit trail tab with filtering by action type / severity
 *
 * Current user is simulated as "head_coach" (can change via demo switcher).
 * A video coordinator demo shows the RequestAccess block on role-restricted panels.
 */

import React, { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ShieldCheck,
  UserPlus,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  Activity,
  Users,
  Lock,
  Eye,
  Send,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  can,
  getRolePermissions,
  getPermittedRoles,
  staffRoleColor,
  STAFF_ROLE_LABEL,
  ACTION_LABEL,
  type StaffRole,
  type PermissionAction,
} from "@/lib/permissions";
import {
  AUDIT_EVENTS,
  AUDIT_ACTION_LABEL,
  AUDIT_ACTION_SEVERITY,
  STAFF_RECORDS,
  recordAuditEvent,
  type AuditEvent,
  type AuditAction,
  type StaffRecord,
} from "@/lib/mock/audit";
import { PermissionGate, RequestAccess } from "@/components/PermissionGate";

/* ─── Colour tokens ──────────────────────────────────────────────────────── */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

const SEVERITY_COLOR: Record<"info" | "warning" | "critical", string> = {
  info:     SUCCESS,
  warning:  WARNING,
  critical: DANGER,
};

/* ─── Tabs ───────────────────────────────────────────────────────────────── */

type TabId = "staff" | "permissions" | "audit";

const TABS: { id: TabId; label: string }[] = [
  { id: "staff",       label: "Staff & Roles" },
  { id: "permissions", label: "Permission matrix" },
  { id: "audit",       label: "Audit trail" },
];

/* ─── Role selector dropdown ─────────────────────────────────────────────── */

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: StaffRole;
  onChange: (r: StaffRole) => void;
  disabled?: boolean;
}): React.ReactElement {
  const roles: StaffRole[] = [
    "head_coach", "assistant_coach", "player_dev_coach", "video_coordinator",
    "strength_coach", "athletic_trainer", "director_of_ops", "admin",
  ];
  const color = staffRoleColor(value);
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as StaffRole)}
        disabled={disabled}
        className="appearance-none rounded-lg border pl-3 pr-8 py-1.5 text-[12px] font-semibold focus:outline-none"
        style={{
          background: `${color}18`,
          borderColor: `${color}40`,
          color,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {roles.map((r) => (
          <option key={r} value={r} style={{ background: "oklch(0.18 0.01 260)", color: "oklch(0.90 0.01 260)" }}>
            {STAFF_ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color }} />
    </div>
  );
}

/* ─── Staff row ──────────────────────────────────────────────────────────── */

function StaffRow({
  record,
  canEditRoles,
  onRoleChange,
}: {
  record: StaffRecord;
  canEditRoles: boolean;
  onRoleChange: (id: string, oldRole: StaffRole, newRole: StaffRole) => void;
}): React.ReactElement {
  const color  = staffRoleColor(record.staffRole);
  const isPending = record.status === "pending";
  const isActive  = record.status === "active";

  const lastSeen = new Date(record.lastActive);
  const diffH    = Math.round((Date.now() - lastSeen.getTime()) / 3_600_000);
  const lastSeenLabel = diffH < 24 ? `${diffH}h ago` : `${Math.floor(diffH / 24)}d ago`;

  return (
    <tr
      className="border-b transition-colors"
      style={{ borderColor: "oklch(0.20 0.01 260)" }}
    >
      {/* Avatar + name */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
            style={{ background: `${color}25`, color }}
          >
            {record.initials}
          </div>
          <div>
            <div className="text-[13px] font-semibold" style={{ color: "oklch(0.90 0.01 260)" }}>
              {record.name}
            </div>
            <div className="text-[11px]" style={{ color: MUTED }}>
              {record.email}
            </div>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="py-3 px-4">
        {canEditRoles ? (
          <RoleSelect
            value={record.staffRole}
            onChange={(newRole) => onRoleChange(record.id, record.staffRole, newRole)}
          />
        ) : (
          <span
            className="text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wide"
            style={{ background: `${color}18`, color }}
          >
            {STAFF_ROLE_LABEL[record.staffRole]}
          </span>
        )}
      </td>

      {/* Programs */}
      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-1">
          {record.programIds.slice(0, 3).map((p) => (
            <span
              key={p}
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: "oklch(0.20 0.01 260)", color: MUTED }}
            >
              {p.replace("prog_", "").replace("_", " ")}
            </span>
          ))}
        </div>
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5">
          {isActive  && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: SUCCESS }} />}
          {isPending && <Clock className="w-3.5 h-3.5" style={{ color: WARNING }} />}
          <span
            className="text-[11.5px] font-semibold capitalize"
            style={{ color: isActive ? SUCCESS : WARNING }}
          >
            {record.status}
          </span>
        </div>
      </td>

      {/* Last active */}
      <td className="py-3 px-4">
        <span className="text-[12px]" style={{ color: MUTED }}>
          {lastSeenLabel}
        </span>
      </td>
    </tr>
  );
}

/* ─── Permission matrix table ────────────────────────────────────────────── */

const MATRIX_ROLES: StaffRole[] = [
  "head_coach", "assistant_coach", "player_dev_coach", "video_coordinator",
  "strength_coach", "athletic_trainer", "director_of_ops", "parent_guardian", "player", "admin",
];

const MATRIX_ACTIONS: PermissionAction[] = [
  "view_injury_notes", "update_injury_status", "view_restriction_detail",
  "view_readiness_data", "create_readiness_override",
  "view_private_notes", "create_private_notes",
  "publish_dossier", "manage_parent_visibility",
  "create_assignment", "view_film", "tag_film_clip",
  "view_practice_plans", "create_practice_plans",
  "view_player_profile", "edit_player_profile",
  "invite_user", "manage_staff_roles", "view_audit_log",
  "view_analytics",
];

/* Highlight cells involved in ACs */
const AC_CELLS = new Set([
  "video_coordinator:view_injury_notes",  // AC#1 — denied
  "athletic_trainer:update_injury_status", // AC#2 — allowed
  "parent_guardian:view_private_notes",    // AC#3 — denied
]);

function PermissionMatrixTable(): React.ReactElement {
  const [filterRole, setFilterRole] = useState<StaffRole | "all">("all");
  return (
    <div className="space-y-4">
      {/* Role filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[12px] font-semibold" style={{ color: MUTED }}>Show column:</span>
        {(["all", ...MATRIX_ROLES] as (StaffRole | "all")[]).slice(0, 6).map((r) => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className="text-[11px] font-bold px-2.5 py-1 rounded-full transition-all"
            style={{
              background: filterRole === r ? `${PRIMARY}25` : "oklch(0.20 0.01 260)",
              color: filterRole === r ? PRIMARY : MUTED,
            }}
          >
            {r === "all" ? "All roles" : STAFF_ROLE_LABEL[r]}
          </button>
        ))}
      </div>

      <div className="rounded-xl border overflow-auto" style={{ borderColor: "oklch(0.22 0.01 260)" }}>
        <table className="w-full text-left min-w-max">
          <thead>
            <tr style={{ background: "oklch(0.15 0.01 260)", borderBottom: "1px solid oklch(0.22 0.01 260)" }}>
              <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wide sticky left-0" style={{ color: MUTED, background: "oklch(0.15 0.01 260)", minWidth: 200 }}>
                Action
              </th>
              {MATRIX_ROLES.filter((r) => filterRole === "all" || r === filterRole).map((r) => {
                const c = staffRoleColor(r);
                return (
                  <th key={r} className="py-2.5 px-3 text-center" style={{ color: c, minWidth: 100 }}>
                    <div className="text-[10px] font-bold uppercase tracking-wide">{STAFF_ROLE_LABEL[r].split(" ").slice(-1)[0]}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {MATRIX_ACTIONS.map((action) => (
              <tr key={action} className="border-t" style={{ borderColor: "oklch(0.20 0.01 260)" }}>
                <td
                  className="py-2 px-4 text-[12px] sticky left-0"
                  style={{ color: "oklch(0.82 0.01 260)", background: "oklch(0.13 0.01 260)", minWidth: 200 }}
                >
                  {ACTION_LABEL[action]}
                </td>
                {MATRIX_ROLES.filter((r) => filterRole === "all" || r === filterRole).map((r) => {
                  const granted = can(r, action);
                  const cellKey = `${r}:${action}`;
                  const isAcCell = AC_CELLS.has(cellKey);
                  return (
                    <td
                      key={r}
                      className="py-2 px-3 text-center"
                      style={{
                        background: isAcCell
                          ? granted ? `${SUCCESS}12` : `${DANGER}12`
                          : "transparent",
                      }}
                    >
                      {granted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 mx-auto" style={{ color: isAcCell ? SUCCESS : "oklch(0.50 0.01 260)" }} />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 mx-auto" style={{ color: isAcCell ? DANGER : "oklch(0.28 0.01 260)" }} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AC legend */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "AC#1: Video coordinator ✗ injury notes", color: DANGER },
          { label: "AC#2: Athletic trainer ✓ update status", color: SUCCESS },
          { label: "AC#3: Parent ✗ private notes",           color: DANGER },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: MUTED }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Audit trail ────────────────────────────────────────────────────────── */

function AuditTrail({ canView }: { canView: boolean }): React.ReactElement {
  const [query,      setQuery]      = useState("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "info" | "warning" | "critical">("all");

  if (!canView) {
    return (
      <RequestAccess
        role="video_coordinator"
        action="view_audit_log"
      />
    );
  }

  const events = [...AUDIT_EVENTS]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .filter((e) => {
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (severityFilter !== "all" && AUDIT_ACTION_SEVERITY[e.action] !== severityFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          e.actorName.toLowerCase().includes(q) ||
          (e.targetName ?? "").toLowerCase().includes(q) ||
          AUDIT_ACTION_LABEL[e.action].toLowerCase().includes(q)
        );
      }
      return true;
    });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: MUTED }} />
          <input
            type="text"
            placeholder="Search actor, target, action…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border pl-9 pr-3 py-2 text-[12.5px] focus:outline-none focus:ring-1"
            style={{ background: "oklch(0.16 0.015 260)", borderColor: "oklch(0.26 0.015 260)", color: "oklch(0.88 0.01 260)" }}
          />
        </div>
        {/* Severity filter */}
        {(["all", "info", "warning", "critical"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg capitalize"
            style={{
              background: severityFilter === s
                ? s === "all" ? `${PRIMARY}20` : `${SEVERITY_COLOR[s] || PRIMARY}20`
                : "oklch(0.18 0.01 260)",
              color: severityFilter === s
                ? s === "all" ? PRIMARY : (SEVERITY_COLOR[s] || PRIMARY)
                : MUTED,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Event count */}
      <div className="text-[12px]" style={{ color: MUTED }}>
        {events.length} event{events.length !== 1 ? "s" : ""} shown
      </div>

      {/* Events list */}
      <div className="space-y-2">
        {events.length === 0 && (
          <div className="text-center py-10 text-[13px]" style={{ color: MUTED }}>
            No events match the current filter.
          </div>
        )}
        {events.map((e) => {
          const sev   = AUDIT_ACTION_SEVERITY[e.action];
          const color = SEVERITY_COLOR[sev];
          return (
            <div
              key={e.id}
              className="rounded-xl border px-4 py-3 flex items-start gap-4"
              style={{ borderColor: `${color}20`, background: `${color}06` }}
            >
              {/* Severity dot */}
              <div
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ background: color }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-bold" style={{ color: "oklch(0.90 0.01 260)" }}>
                      {AUDIT_ACTION_LABEL[e.action]}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                      style={{ background: `${color}20`, color }}
                    >
                      {sev}
                    </span>
                    {e.systemGenerated && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "oklch(0.20 0.01 260)", color: MUTED }}>
                        system
                      </span>
                    )}
                  </div>
                  <time className="text-[11.5px] shrink-0" style={{ color: MUTED }}>
                    {new Date(e.timestamp).toLocaleString()}
                  </time>
                </div>

                {/* Actor + target */}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[12px]" style={{ color: MUTED }}>
                  <span>
                    <span className="font-semibold" style={{ color: "oklch(0.78 0.01 260)" }}>{e.actorName}</span>
                    {" · "}
                    <span
                      className="font-semibold"
                      style={{ color: staffRoleColor(e.actorRole) }}
                    >
                      {STAFF_ROLE_LABEL[e.actorRole]}
                    </span>
                  </span>
                  {e.targetName && (
                    <span>
                      → <span className="font-semibold" style={{ color: "oklch(0.78 0.01 260)" }}>{e.targetName}</span>
                    </span>
                  )}
                </div>

                {/* Old → New values (AC #2) */}
                {(e.oldValue || e.newValue) && (
                  <div className="mt-2 flex items-center gap-2 text-[12px]">
                    {e.oldValue && (
                      <span className="px-2 py-0.5 rounded" style={{ background: `${DANGER}18`, color: DANGER }}>
                        {e.oldValue}
                      </span>
                    )}
                    {e.oldValue && e.newValue && (
                      <span style={{ color: MUTED }}>→</span>
                    )}
                    {e.newValue && (
                      <span className="px-2 py-0.5 rounded" style={{ background: `${SUCCESS}18`, color: SUCCESS }}>
                        {e.newValue}
                      </span>
                    )}
                  </div>
                )}

                {/* Blocked action badge */}
                {e.blockedAction && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px]" style={{ color: DANGER }}>
                    <Lock className="w-3 h-3" />
                    Blocked: {ACTION_LABEL[e.blockedAction]}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Invite modal ───────────────────────────────────────────────────────── */

function InviteForm({ onClose }: { onClose: () => void }): React.ReactElement {
  const [email, setEmail]   = useState("");
  const [name,  setName]    = useState("");
  const [role,  setRole]    = useState<StaffRole>("assistant_coach");
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!email || !name) return;
    setSending(true);
    setTimeout(() => {
      recordAuditEvent({
        action: "user_invited",
        actorId: "staff_grant",
        actorName: "Coach Grant",
        actorRole: "head_coach",
        targetType: "staff",
        targetName: name,
        metadata: { email, invitedRole: role },
      });
      toast.success(`Invite sent to ${name} (${email})`);
      setSending(false);
      onClose();
    }, 700);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "oklch(0.08 0.01 260 / 0.85)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 space-y-5"
        style={{ background: "oklch(0.15 0.015 260)", borderColor: "oklch(0.26 0.015 260)" }}
      >
        <h3 className="text-[16px] font-bold" style={{ color: "oklch(0.93 0.01 260)" }}>
          Invite staff member
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: MUTED }}>Full name *</label>
            <input
              required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan Smith"
              className="w-full rounded-xl border px-3 py-2.5 text-[13px] focus:outline-none"
              style={{ background: "oklch(0.12 0.01 260)", borderColor: "oklch(0.26 0.015 260)", color: "oklch(0.93 0.01 260)" }}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: MUTED }}>Email address *</label>
            <input
              required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email@school.edu"
              className="w-full rounded-xl border px-3 py-2.5 text-[13px] focus:outline-none"
              style={{ background: "oklch(0.12 0.01 260)", borderColor: "oklch(0.26 0.015 260)", color: "oklch(0.93 0.01 260)" }}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: MUTED }}>Staff role *</label>
            <div className="relative">
              <select
                value={role} onChange={(e) => setRole(e.target.value as StaffRole)}
                className="w-full appearance-none rounded-xl border px-3 py-2.5 text-[13px] pr-9 focus:outline-none"
                style={{ background: "oklch(0.12 0.01 260)", borderColor: "oklch(0.26 0.015 260)", color: "oklch(0.93 0.01 260)" }}
              >
                {(["assistant_coach","player_dev_coach","video_coordinator","strength_coach","athletic_trainer","director_of_ops"] as StaffRole[]).map((r) => (
                  <option key={r} value={r}>{STAFF_ROLE_LABEL[r]}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: MUTED }} />
            </div>
          </div>

          {/* Permissions preview */}
          <div
            className="rounded-xl border px-4 py-3"
            style={{ borderColor: "oklch(0.24 0.015 260)", background: "oklch(0.12 0.01 260)" }}
          >
            <p className="text-[11px] font-semibold mb-2" style={{ color: MUTED }}>
              {STAFF_ROLE_LABEL[role]} will be able to:
            </p>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {getRolePermissions(role).slice(0, 8).map((a) => (
                <div key={a} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "oklch(0.75 0.01 260)" }}>
                  <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: SUCCESS }} />
                  {ACTION_LABEL[a]}
                </div>
              ))}
              {getRolePermissions(role).length > 8 && (
                <div className="text-[11px]" style={{ color: MUTED }}>
                  +{getRolePermissions(role).length - 8} more…
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit" disabled={sending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold"
              style={{ background: PRIMARY, color: "#fff", opacity: sending ? 0.7 : 1 }}
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? "Sending…" : "Send invite"}
            </button>
            <button
              type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl border text-[13px] font-semibold"
              style={{ borderColor: "oklch(0.28 0.015 260)", color: MUTED }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Demo role switcher ─────────────────────────────────────────────────── */

function DemoRoleSwitcher({
  role,
  onChange,
}: {
  role: StaffRole;
  onChange: (r: StaffRole) => void;
}): React.ReactElement {
  const demoRoles: StaffRole[] = [
    "head_coach", "video_coordinator", "athletic_trainer", "parent_guardian",
  ];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] font-semibold" style={{ color: MUTED }}>Demo as:</span>
      {demoRoles.map((r) => {
        const c = staffRoleColor(r);
        return (
          <button
            key={r}
            onClick={() => onChange(r)}
            className="text-[11px] font-bold px-2.5 py-1 rounded-full transition-all"
            style={{ background: role === r ? `${c}25` : "oklch(0.20 0.01 260)", color: role === r ? c : MUTED }}
          >
            {STAFF_ROLE_LABEL[r]}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function StaffRolesPage(): React.ReactElement {
  const [activeTab,     setActiveTab]     = useState<TabId>("staff");
  const [demoRole,      setDemoRole]      = useState<StaffRole>("head_coach");
  const [showInvite,    setShowInvite]    = useState(false);
  const [staffRecords,  setStaffRecords]  = useState<StaffRecord[]>(STAFF_RECORDS);

  function handleRoleChange(
    id: string,
    oldRole: StaffRole,
    newRole: StaffRole,
  ): void {
    setStaffRecords((prev) =>
      prev.map((s) => s.id === id ? { ...s, staffRole: newRole } : s),
    );
    const record = staffRecords.find((s) => s.id === id);
    if (!record) return;
    recordAuditEvent({
      action: "staff_role_changed",
      actorId: "staff_grant",
      actorName: "Coach Grant",
      actorRole: "head_coach",
      targetType: "staff",
      targetId: id,
      targetName: record.name,
      oldValue: oldRole,
      newValue: newRole,
    });
    toast.success(`${record.name} role updated → ${STAFF_ROLE_LABEL[newRole]}`);
  }

  const canEditRoles   = can(demoRole, "manage_staff_roles");
  const canInvite      = can(demoRole, "invite_user");
  const canViewAudit   = can(demoRole, "view_audit_log");

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.12 0.01 260)", color: "oklch(0.93 0.01 260)" }}>

      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b"
        style={{ background: "oklch(0.14 0.01 260)", borderColor: "oklch(0.22 0.01 260)" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/app/coach" asChild>
            <a className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-4 h-4" style={{ color: MUTED }} />
            </a>
          </Link>
          <div>
            <h1 className="text-[15px] font-semibold">Staff Roles & Audit Trail</h1>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
              Barnegat Basketball · {staffRecords.length} staff members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Invite button — gated */}
          <PermissionGate
            role={demoRole}
            action="invite_user"
            compact
            fallback={
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-semibold opacity-40 cursor-not-allowed"
                style={{ borderColor: "oklch(0.28 0.015 260)", color: MUTED }}
                disabled
              >
                <Lock className="w-3.5 h-3.5" />
                Invite
              </button>
            }
          >
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-semibold"
              style={{ borderColor: `${PRIMARY}40`, background: `${PRIMARY}15`, color: PRIMARY }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite staff
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Demo role switcher */}
      <div
        className="px-4 py-2.5 border-b flex items-center gap-4 flex-wrap"
        style={{ background: "oklch(0.13 0.01 260)", borderColor: "oklch(0.20 0.01 260)" }}
      >
        <DemoRoleSwitcher role={demoRole} onChange={setDemoRole} />
        <span className="text-[11px]" style={{ color: MUTED }}>
          (switches permission context to simulate different staff views)
        </span>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-0 border-b"
        style={{ borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.13 0.01 260)" }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="px-5 py-3 text-[13px] font-semibold border-b-2 transition-colors"
            style={{
              borderColor: activeTab === t.id ? PRIMARY : "transparent",
              color: activeTab === t.id ? PRIMARY : MUTED,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ── Staff tab ──────────────────────────────────────────────────── */}
        {activeTab === "staff" && (
          <div className="space-y-5">
            {/* AC#1 demo: video coordinator blocked from injury notes */}
            {demoRole === "video_coordinator" && (
              <div className="space-y-3">
                <h3 className="text-[13.5px] font-bold" style={{ color: "oklch(0.88 0.01 260)" }}>
                  Permission gate demo — injury notes
                </h3>
                <PermissionGate
                  role="video_coordinator"
                  action="view_injury_notes"
                  targetName="Injury Notes Section"
                >
                  <div className="rounded-xl border px-4 py-3" style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.15 0.015 260)" }}>
                    <p className="text-[13px]" style={{ color: "oklch(0.80 0.01 260)" }}>
                      Injury notes content would appear here.
                    </p>
                  </div>
                </PermissionGate>
              </div>
            )}

            {/* AC#3 demo: parent blocked from private notes */}
            {demoRole === "parent_guardian" && (
              <div className="space-y-3">
                <h3 className="text-[13.5px] font-bold" style={{ color: "oklch(0.88 0.01 260)" }}>
                  Permission gate demo — private notes
                </h3>
                <PermissionGate
                  role="parent_guardian"
                  action="view_private_notes"
                  targetName="Private Coach Notes"
                >
                  <div className="rounded-xl border px-4 py-3" style={{ borderColor: "oklch(0.26 0.015 260)", background: "oklch(0.15 0.015 260)" }}>
                    <p className="text-[13px]" style={{ color: "oklch(0.80 0.01 260)" }}>
                      Private coach notes content would appear here.
                    </p>
                  </div>
                </PermissionGate>
              </div>
            )}

            {/* Staff table */}
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: "oklch(0.22 0.01 260)" }}
            >
              <div
                className="flex items-center justify-between px-5 py-3 border-b"
                style={{ borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.155 0.015 260)" }}
              >
                <span className="text-[13px] font-bold" style={{ color: "oklch(0.88 0.01 260)" }}>
                  Program staff
                </span>
                {!canEditRoles && (
                  <div className="flex items-center gap-1.5 text-[11.5px]" style={{ color: MUTED }}>
                    <Lock className="w-3 h-3" />
                    Role editing requires {STAFF_ROLE_LABEL["head_coach"]} or Admin
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className="text-[10.5px] font-semibold uppercase tracking-wide border-b"
                      style={{ borderColor: "oklch(0.20 0.01 260)", background: "oklch(0.14 0.01 260)", color: MUTED }}
                    >
                      <th className="py-2.5 px-4 text-left">Staff member</th>
                      <th className="py-2.5 px-4 text-left">Role</th>
                      <th className="py-2.5 px-4 text-left">Programs</th>
                      <th className="py-2.5 px-4 text-left">Status</th>
                      <th className="py-2.5 px-4 text-left">Last active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffRecords.map((r) => (
                      <StaffRow
                        key={r.id}
                        record={r}
                        canEditRoles={canEditRoles}
                        onRoleChange={handleRoleChange}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Permission matrix tab ───────────────────────────────────────── */}
        {activeTab === "permissions" && <PermissionMatrixTable />}

        {/* ── Audit trail tab ─────────────────────────────────────────────── */}
        {activeTab === "audit" && (
          <PermissionGate
            role={demoRole}
            action="view_audit_log"
            targetName="Audit Trail"
          >
            <AuditTrail canView={canViewAudit} />
          </PermissionGate>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && <InviteForm onClose={() => setShowInvite(false)} />}
    </div>
  );
}
