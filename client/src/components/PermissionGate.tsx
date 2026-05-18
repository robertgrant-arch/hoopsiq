/**
 * PermissionGate — component-level permission enforcement.
 *
 * Wraps any piece of UI and gates rendering on can(role, action).
 * When access is denied, renders a RequestAccess fallback (or a custom one).
 *
 * Usage:
 *   <PermissionGate role="video_coordinator" action="view_injury_notes">
 *     <InjuryNotesPanel />
 *   </PermissionGate>
 *
 * The denial is also recorded as an "access_denied" audit event so every
 * blocked attempt appears in the audit trail — satisfying AC #1.
 *
 * Acceptance criteria:
 *  ✓ AC1: video_coordinator + view_injury_notes → blocked, RequestAccess shown
 *  ✓ AC3: parent_guardian + view_private_notes → blocked, RequestAccess shown
 */

import React, { useEffect, useRef } from "react";
import { ShieldOff, Send, ChevronRight, Lock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  can,
  getBlockedReason,
  staffRoleColor,
  STAFF_ROLE_LABEL,
  ACTION_LABEL,
  type StaffRole,
  type PermissionAction,
} from "@/lib/permissions";
import { recordAuditEvent } from "@/features/admin/audit";

/* ─── Colour tokens ──────────────────────────────────────────────────────── */

const DANGER = "oklch(0.68 0.22 25)";
const MUTED  = "oklch(0.55 0.02 260)";

/* ─── Request-access inline UI ──────────────────────────────────────────── */

interface RequestAccessProps {
  role: StaffRole;
  action: PermissionAction;
  compact?: boolean;
  onRequest?: () => void;
}

export function RequestAccess({
  role,
  action,
  compact = false,
  onRequest,
}: RequestAccessProps): React.ReactElement {
  const reason = getBlockedReason(role, action);
  const roleColor = staffRoleColor(role);

  function handleRequest(): void {
    recordAuditEvent({
      action: "access_request_submitted",
      actorId: `user_${role}`,
      actorName: STAFF_ROLE_LABEL[role],
      actorRole: role,
      blockedAction: action,
      targetType: "system",
      metadata: { requestedAction: action, requestedAt: new Date().toISOString() },
    });
    toast.success("Access request submitted — your program administrator will be notified.");
    onRequest?.();
  }

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg border px-3 py-2.5"
        style={{ borderColor: `${DANGER}30`, background: `${DANGER}08` }}
      >
        <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: DANGER }} />
        <span className="flex-1 text-[12px]" style={{ color: DANGER }}>
          {ACTION_LABEL[action]} — not available for {STAFF_ROLE_LABEL[role]}
        </span>
        <button
          onClick={handleRequest}
          className="text-[11px] font-bold px-2 py-0.5 rounded transition-opacity hover:opacity-80 shrink-0"
          style={{ background: `${DANGER}20`, color: DANGER }}
        >
          Request
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: `${DANGER}30`, background: "oklch(0.14 0.01 260)" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ background: `${DANGER}10`, borderBottom: `1px solid ${DANGER}20` }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${DANGER}20` }}
        >
          <ShieldOff className="w-5 h-5" style={{ color: DANGER }} />
        </div>
        <div>
          <h3 className="text-[14px] font-bold" style={{ color: "oklch(0.93 0.01 260)" }}>
            Access restricted
          </h3>
          <p className="text-[11.5px] mt-0.5" style={{ color: MUTED }}>
            {ACTION_LABEL[action]} · {STAFF_ROLE_LABEL[role]}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        <p className="text-[13.5px] leading-relaxed" style={{ color: "oklch(0.78 0.01 260)" }}>
          {reason}
        </p>

        {/* Current role chip */}
        <div className="flex items-center gap-2">
          <span className="text-[11.5px]" style={{ color: MUTED }}>Your role:</span>
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
            style={{ background: `${roleColor}20`, color: roleColor }}
          >
            {STAFF_ROLE_LABEL[role]}
          </span>
        </div>

        {/* Permitted roles hint */}
        <div
          className="rounded-xl px-4 py-3 space-y-1.5"
          style={{ background: "oklch(0.11 0.01 260)", border: "1px solid oklch(0.22 0.01 260)" }}
        >
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.78 0.16 75)" }} />
            <span className="text-[11.5px] font-semibold" style={{ color: "oklch(0.78 0.16 75)" }}>
              To gain access
            </span>
          </div>
          <p className="text-[12px]" style={{ color: MUTED }}>
            Submit a request and your program administrator will review it. You can also contact your head coach directly.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleRequest}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold transition-opacity hover:opacity-90"
            style={{ background: DANGER, color: "#fff" }}
          >
            <Send className="w-3.5 h-3.5" />
            Request access
          </button>
          <button
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl border text-[13px] font-semibold"
            style={{ borderColor: "oklch(0.28 0.015 260)", color: MUTED }}
            onClick={() => window.history.back()}
          >
            Go back
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── PermissionGate ─────────────────────────────────────────────────────── */

interface PermissionGateProps {
  /** The staff role of the current user */
  role: StaffRole;
  /** The action being attempted */
  action: PermissionAction;
  /** Content to render when access is granted */
  children: React.ReactNode;
  /** Custom fallback — defaults to <RequestAccess> */
  fallback?: React.ReactNode;
  /** If true, renders the compact inline denied banner */
  compact?: boolean;
  /**
   * Optional target info for audit logging when access is denied.
   * The gate always records a denial event on first render.
   */
  targetId?: string;
  targetName?: string;
  onRequest?: () => void;
}

export function PermissionGate({
  role,
  action,
  children,
  fallback,
  compact = false,
  targetId,
  targetName,
  onRequest,
}: PermissionGateProps): React.ReactElement {
  const permitted = can(role, action);
  const auditFired = useRef(false);

  /* Record the denial once, on first blocked render */
  useEffect(() => {
    if (!permitted && !auditFired.current) {
      auditFired.current = true;
      recordAuditEvent({
        action: "access_denied",
        actorId: `user_${role}`,
        actorName: STAFF_ROLE_LABEL[role],
        actorRole: role,
        targetType: "system",
        targetId,
        targetName,
        blockedAction: action,
        systemGenerated: true,
        metadata: { attemptedAt: new Date().toISOString() },
      });
    }
  }, [permitted, role, action, targetId, targetName]);

  if (permitted) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <RequestAccess
      role={role}
      action={action}
      compact={compact}
      onRequest={onRequest}
    />
  );
}

export default PermissionGate;
