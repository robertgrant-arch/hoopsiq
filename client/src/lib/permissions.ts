/**
 * permissions.ts — Role-based permission matrix for HoopsIQ staff roles.
 *
 * Design:
 *  - StaffRole is the fine-grained staff identity (separate from the app-auth
 *    Role in users.ts which governs top-level portal access).
 *  - PermissionAction is the complete action vocabulary.
 *  - PERMISSION_MATRIX is the authoritative grant table — each role lists
 *    exactly the actions it may perform. Absence = denied.
 *  - can(role, action) is the single evaluation point used everywhere.
 *  - getBlockedReason(role, action) returns a human-readable reason string
 *    for use in request-access UI.
 *
 * Acceptance criteria baked in:
 *  ✓ AC1: can("video_coordinator", "view_injury_notes") === false
 *  ✓ AC2: can("athletic_trainer", "update_injury_status") === true
 *  ✓ AC3: can("parent_guardian", "view_private_notes") === false
 *
 * Legacy app-level portal permissions (ATHLETE/COACH/PARENT etc.) are
 * preserved below under the "Portal permissions (legacy)" section.
 */

/* ─── Staff roles ─────────────────────────────────────────────────────────── */

export type StaffRole =
  | "head_coach"
  | "assistant_coach"
  | "player_dev_coach"
  | "video_coordinator"
  | "strength_coach"
  | "athletic_trainer"
  | "director_of_ops"
  | "parent_guardian"
  | "player"
  | "admin";

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  head_coach:        "Head Coach",
  assistant_coach:   "Assistant Coach",
  player_dev_coach:  "Player Development Coach",
  video_coordinator: "Video Coordinator",
  strength_coach:    "Strength Coach",
  athletic_trainer:  "Athletic Trainer",
  director_of_ops:   "Director of Operations",
  parent_guardian:   "Parent / Guardian",
  player:            "Player",
  admin:             "Admin",
};

export const STAFF_ROLE_HUE: Record<StaffRole, number> = {
  head_coach:        290,
  assistant_coach:   240,
  player_dev_coach:  200,
  video_coordinator: 160,
  strength_coach:    75,
  athletic_trainer:  25,
  director_of_ops:   140,
  parent_guardian:   180,
  player:            220,
  admin:             0,
};

/* ─── Permission actions ──────────────────────────────────────────────────── */

export type PermissionAction =
  | "view_injury_notes"
  | "update_injury_status"
  | "view_restriction_detail"
  | "view_readiness_data"
  | "create_readiness_override"
  | "view_readiness_override"
  | "view_private_notes"
  | "create_private_notes"
  | "publish_dossier"
  | "edit_dossier"
  | "manage_parent_visibility"
  | "create_assignment"
  | "view_all_assignments"
  | "view_film"
  | "tag_film_clip"
  | "delete_film_clip"
  | "view_practice_plans"
  | "create_practice_plans"
  | "view_player_profile"
  | "edit_player_profile"
  | "invite_user"
  | "manage_staff_roles"
  | "view_audit_log"
  | "manage_roster"
  | "view_analytics"
  | "view_sensitive_analytics";

export const ACTION_LABEL: Record<PermissionAction, string> = {
  view_injury_notes:          "View injury notes",
  update_injury_status:       "Update injury / restriction status",
  view_restriction_detail:    "View restriction detail",
  view_readiness_data:        "View readiness data",
  create_readiness_override:  "Create readiness override",
  view_readiness_override:    "View readiness overrides",
  view_private_notes:         "View private coach notes",
  create_private_notes:       "Create private coach notes",
  publish_dossier:            "Publish recruiting dossier",
  edit_dossier:               "Edit recruiting dossier",
  manage_parent_visibility:   "Manage parent-visible settings",
  create_assignment:          "Create player assignments",
  view_all_assignments:       "View all player assignments",
  view_film:                  "View film library",
  tag_film_clip:              "Tag film clips",
  delete_film_clip:           "Delete film clips",
  view_practice_plans:        "View practice plans",
  create_practice_plans:      "Create practice plans",
  view_player_profile:        "View player profile",
  edit_player_profile:        "Edit player profile",
  invite_user:                "Invite users",
  manage_staff_roles:         "Manage staff roles",
  view_audit_log:             "View audit log",
  manage_roster:              "Manage roster",
  view_analytics:             "View analytics",
  view_sensitive_analytics:   "View sensitive analytics",
};

/* ─── Permission matrix ───────────────────────────────────────────────────── */

const PERMISSION_MATRIX: Record<StaffRole, ReadonlyArray<PermissionAction>> = {

  head_coach: [
    "view_injury_notes", "update_injury_status", "view_restriction_detail",
    "view_readiness_data", "create_readiness_override", "view_readiness_override",
    "view_private_notes", "create_private_notes",
    "publish_dossier", "edit_dossier", "manage_parent_visibility",
    "create_assignment", "view_all_assignments",
    "view_film", "tag_film_clip", "delete_film_clip",
    "view_practice_plans", "create_practice_plans",
    "view_player_profile", "edit_player_profile",
    "invite_user", "manage_staff_roles", "view_audit_log",
    "manage_roster",
    "view_analytics", "view_sensitive_analytics",
  ],

  assistant_coach: [
    "view_injury_notes", "view_restriction_detail",
    "view_readiness_data", "view_readiness_override",
    "view_private_notes", "create_private_notes",
    "edit_dossier",
    "create_assignment", "view_all_assignments",
    "view_film", "tag_film_clip",
    "view_practice_plans", "create_practice_plans",
    "view_player_profile", "edit_player_profile",
    "manage_roster",
    "view_analytics",
  ],

  player_dev_coach: [
    "view_injury_notes", "view_restriction_detail",
    "view_readiness_data", "view_readiness_override",
    "view_private_notes", "create_private_notes",
    "edit_dossier",
    "create_assignment", "view_all_assignments",
    "view_film", "tag_film_clip",
    "view_practice_plans", "create_practice_plans",
    "view_player_profile",
    "view_analytics",
  ],

  /* ── Video Coordinator — film only; NO injury or private notes (AC #1) ── */
  video_coordinator: [
    // view_injury_notes INTENTIONALLY ABSENT — AC #1
    // view_private_notes INTENTIONALLY ABSENT
    "view_film", "tag_film_clip", "delete_film_clip",
    "view_readiness_data",
    "view_practice_plans",
    "view_player_profile",
    "view_all_assignments",
    "view_analytics",
  ],

  strength_coach: [
    "view_injury_notes", "view_restriction_detail",
    "update_injury_status",
    "view_readiness_data", "view_readiness_override",
    "view_practice_plans",
    "view_player_profile",
    "view_analytics",
  ],

  /* ── Athletic Trainer — medical lead; injury read/write (AC #2) ─────── */
  athletic_trainer: [
    "view_injury_notes", "update_injury_status", "view_restriction_detail", // AC #2 ✓
    "view_readiness_data", "create_readiness_override", "view_readiness_override",
    "view_player_profile",
    "view_analytics",
  ],

  director_of_ops: [
    "view_injury_notes", "view_restriction_detail",
    "view_readiness_data",
    "manage_parent_visibility",
    "view_all_assignments",
    "view_film",
    "view_practice_plans",
    "view_player_profile",
    "invite_user", "manage_staff_roles", "view_audit_log",
    "manage_roster",
    "view_analytics",
  ],

  /* ── Parent / Guardian — no medical detail, no private notes (AC #3) ── */
  parent_guardian: [
    // view_injury_notes ABSENT
    // view_private_notes ABSENT — AC #3 ✓
    "view_player_profile",
    "view_practice_plans",
  ],

  player: [
    "view_player_profile",
    "view_practice_plans",
    "view_film",
    "view_analytics",
  ],

  admin: [
    "view_injury_notes", "update_injury_status", "view_restriction_detail",
    "view_readiness_data", "create_readiness_override", "view_readiness_override",
    "view_private_notes", "create_private_notes",
    "publish_dossier", "edit_dossier", "manage_parent_visibility",
    "create_assignment", "view_all_assignments",
    "view_film", "tag_film_clip", "delete_film_clip",
    "view_practice_plans", "create_practice_plans",
    "view_player_profile", "edit_player_profile",
    "invite_user", "manage_staff_roles", "view_audit_log",
    "manage_roster",
    "view_analytics", "view_sensitive_analytics",
  ],
};

/* ─── Core evaluation functions ───────────────────────────────────────────── */

export function can(role: StaffRole, action: PermissionAction): boolean {
  return (PERMISSION_MATRIX[role] as ReadonlyArray<PermissionAction>).includes(action);
}

export function getRolePermissions(role: StaffRole): PermissionAction[] {
  return [...PERMISSION_MATRIX[role]];
}

export function getPermittedRoles(action: PermissionAction): StaffRole[] {
  return (Object.keys(PERMISSION_MATRIX) as StaffRole[]).filter((r) => can(r, action));
}

export function getBlockedReason(role: StaffRole, action: PermissionAction): string {
  const label = STAFF_ROLE_LABEL[role];
  const actionLabel = ACTION_LABEL[action].toLowerCase();

  const reasons: Partial<Record<PermissionAction, Partial<Record<StaffRole, string>>>> = {
    view_injury_notes: {
      video_coordinator: `Video coordinators do not have access to injury notes. This information is restricted to medical staff and coaching staff with clinical context.`,
      parent_guardian:   `Parents can view a high-level availability status for their child, but detailed injury notes are restricted to program staff.`,
      player:            `Players can view their own availability status but not detailed clinical injury notes.`,
    },
    view_private_notes: {
      video_coordinator: `Private coach notes are restricted to coaching staff only.`,
      strength_coach:    `Private coaching strategy notes are outside the scope of strength staff access.`,
      athletic_trainer:  `Private coaching notes are restricted to coaching staff. Athletic trainers have access to medical records separately.`,
      director_of_ops:   `Private coach-to-coach notes are restricted to coaching staff.`,
      parent_guardian:   `Private coach notes are internal to the coaching staff and not accessible to parents or guardians.`,
      player:            `Private coaching notes are for staff use only and are not visible to players.`,
    },
    update_injury_status: {
      video_coordinator: `Only athletic trainers, strength coaches, and head coaches may update a player's injury or restriction status.`,
      assistant_coach:   `Injury status updates require athletic trainer or head coach authorization.`,
      player_dev_coach:  `Injury status updates are restricted to medical and head coaching staff.`,
      parent_guardian:   `Injury status is updated by program medical staff, not by families.`,
      player:            `Players cannot update their own injury status — this is managed by program staff.`,
    },
    publish_dossier: {
      video_coordinator: `Only head coaches and admins may publish a player's recruiting dossier.`,
      strength_coach:    `Dossier publication requires head coach authorization.`,
      athletic_trainer:  `Dossier publication is restricted to coaching staff.`,
      parent_guardian:   `Dossier publication requires coach authorization. Please contact your program's head coach.`,
      player:            `Dossier publication requires your head coach's approval.`,
    },
    manage_staff_roles: {
      video_coordinator: `Staff role management is restricted to head coaches, directors of operations, and admins.`,
      assistant_coach:   `Staff role management is restricted to head coaches and administrators.`,
      strength_coach:    `Staff role management is outside the scope of strength staff access.`,
      athletic_trainer:  `Staff role management is outside the scope of athletic training access.`,
      parent_guardian:   `Staff management is restricted to authorized program staff.`,
      player:            `Staff management is restricted to authorized program staff.`,
    },
    view_audit_log: {
      video_coordinator: `The audit log is restricted to administrative staff.`,
      assistant_coach:   `Audit log access is restricted to head coaches and administrators.`,
      strength_coach:    `Audit log access is restricted to administrative staff.`,
      athletic_trainer:  `Audit log access is restricted to administrative staff.`,
      parent_guardian:   `The audit log is an internal administrative record.`,
      player:            `The audit log is an internal administrative record.`,
    },
  };

  const specific = reasons[action]?.[role];
  if (specific) return specific;
  return `${label} does not have permission to ${actionLabel}. Contact your program administrator to request elevated access.`;
}

export function canAny(roles: StaffRole[], action: PermissionAction): boolean {
  return roles.some((r) => can(r, action));
}

export function staffRoleColor(role: StaffRole): string {
  const hue = STAFF_ROLE_HUE[role];
  if (hue === 0) return "oklch(0.68 0.22 25)";
  return `oklch(0.72 0.18 ${hue})`;
}

/* ─── Portal permissions (legacy — app-auth Role from users.ts) ───────────── */
/* These govern top-level portal routing (COACH/PARENT/ATHLETE etc.).          */
/* Fine-grained staff permissions use the StaffRole system above.              */

import type { Role } from "@/lib/mock/users";

/** @deprecated Use StaffRole + PermissionAction for new features */
export type Permission =
  | "view_own_assignments" | "view_own_schedule" | "view_own_billing"
  | "view_own_film_feedback" | "view_own_wod" | "view_own_development"
  | "submit_availability"
  | "view_child_progress" | "view_child_assignments" | "view_child_schedule"
  | "view_child_billing" | "view_child_film_summary"
  | "sign_waiver" | "view_announcements" | "rsvp_for_child"
  | "view_practice_notes" | "view_full_film" | "create_practice_plan"
  | "assign_work" | "manage_roster" | "view_all_readiness" | "edit_scout_report"
  | "manage_org" | "view_billing_admin" | "moderate_content";

const PORTAL_PERMISSIONS: Record<Role, ReadonlyArray<Permission>> = {
  ATHLETE:     ["view_own_assignments","view_own_schedule","view_own_billing","view_own_film_feedback","view_own_wod","view_own_development","submit_availability","view_announcements"],
  PARENT:      ["view_child_progress","view_child_assignments","view_child_schedule","view_child_billing","view_child_film_summary","sign_waiver","view_announcements","rsvp_for_child","view_own_billing"],
  COACH:       ["view_own_assignments","view_own_schedule","view_own_billing","view_full_film","view_practice_notes","create_practice_plan","assign_work","manage_roster","view_all_readiness","edit_scout_report","view_announcements"],
  TEAM_ADMIN:  ["view_own_schedule","view_billing_admin","manage_roster","manage_org","view_announcements","view_all_readiness","create_practice_plan"],
  EXPERT:      ["view_own_billing","view_announcements"],
  SUPER_ADMIN: ["view_child_progress","view_child_assignments","view_child_schedule","view_child_billing","view_child_film_summary","view_own_assignments","view_own_schedule","view_own_billing","view_own_film_feedback","view_own_wod","view_own_development","submit_availability","sign_waiver","view_announcements","rsvp_for_child","view_practice_notes","view_full_film","create_practice_plan","assign_work","manage_roster","view_all_readiness","edit_scout_report","manage_org","view_billing_admin","moderate_content"],
};

/** @deprecated Use can(StaffRole, PermissionAction) for new features */
export function hasPortalPermission(role: Role, permission: Permission): boolean {
  return (PORTAL_PERMISSIONS[role] as ReadonlyArray<Permission>).includes(permission);
}

/** @deprecated Use makeStaffPermissionChecker() */
export function makePermissionChecker(role: Role) {
  return (permission: Permission) => hasPortalPermission(role, permission);
}
