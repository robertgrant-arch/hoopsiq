/**
 * permissions.test.ts
 *
 * Tests for the HoopsOS role-based permission matrix.
 *
 * Acceptance criteria verified:
 *  ✓ AC1: can("video_coordinator", "view_injury_notes") === false
 *  ✓ AC2: can("athletic_trainer", "update_injury_status") === true
 *  ✓ AC3: can("parent_guardian", "view_private_notes") === false
 *
 * Additional coverage:
 *  - Head coach and admin have broad access
 *  - Each restricted role is explicitly verified against the denied actions
 *  - getRolePermissions() returns the correct set
 *  - getPermittedRoles() identifies who holds an action
 *  - getBlockedReason() returns a non-empty string for every denied combo
 *  - canAny() short-circuits correctly
 */

import { describe, it, expect } from "vitest";
import {
  can,
  getRolePermissions,
  getPermittedRoles,
  getBlockedReason,
  canAny,
  STAFF_ROLE_LABEL,
  type StaffRole,
  type PermissionAction,
} from "../permissions";

/* ------------------------------------------------------------------ */
/* Acceptance criteria                                                  */
/* ------------------------------------------------------------------ */

describe("Acceptance criteria", () => {
  it("AC1 — video_coordinator cannot view_injury_notes", () => {
    expect(can("video_coordinator", "view_injury_notes")).toBe(false);
  });

  it("AC2 — athletic_trainer can update_injury_status", () => {
    expect(can("athletic_trainer", "update_injury_status")).toBe(true);
  });

  it("AC3 — parent_guardian cannot view_private_notes", () => {
    expect(can("parent_guardian", "view_private_notes")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Head coach — full access                                             */
/* ------------------------------------------------------------------ */

describe("head_coach", () => {
  const allActions: PermissionAction[] = [
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
  ];

  it.each(allActions)("can %s", (action) => {
    expect(can("head_coach", action)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Admin — full access, same as head coach                             */
/* ------------------------------------------------------------------ */

describe("admin", () => {
  const sensitiveActions: PermissionAction[] = [
    "view_injury_notes", "update_injury_status",
    "view_private_notes", "create_private_notes",
    "publish_dossier", "manage_staff_roles",
    "view_audit_log", "view_sensitive_analytics",
  ];

  it.each(sensitiveActions)("admin can %s", (action) => {
    expect(can("admin", action)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Video coordinator — film only; denied medical & private notes       */
/* ------------------------------------------------------------------ */

describe("video_coordinator", () => {
  const grantedActions: PermissionAction[] = [
    "view_film", "tag_film_clip", "delete_film_clip",
    "view_readiness_data",
    "view_practice_plans",
    "view_player_profile",
    "view_all_assignments",
    "view_analytics",
  ];

  const deniedActions: PermissionAction[] = [
    "view_injury_notes",       // AC#1
    "update_injury_status",
    "view_private_notes",
    "create_private_notes",
    "publish_dossier",
    "manage_staff_roles",
    "view_audit_log",
    "invite_user",
    "create_readiness_override",
    "manage_roster",
  ];

  it.each(grantedActions)("can %s", (action) => {
    expect(can("video_coordinator", action)).toBe(true);
  });

  it.each(deniedActions)("cannot %s", (action) => {
    expect(can("video_coordinator", action)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Athletic trainer — medical write; no coaching strategy notes        */
/* ------------------------------------------------------------------ */

describe("athletic_trainer", () => {
  const grantedActions: PermissionAction[] = [
    "view_injury_notes",
    "update_injury_status",    // AC#2
    "view_restriction_detail",
    "view_readiness_data",
    "create_readiness_override",
    "view_readiness_override",
    "view_player_profile",
    "view_analytics",
  ];

  const deniedActions: PermissionAction[] = [
    "view_private_notes",
    "create_private_notes",
    "publish_dossier",
    "manage_staff_roles",
    "view_audit_log",
    "invite_user",
    "create_assignment",
    "manage_roster",
    "view_sensitive_analytics",
  ];

  it.each(grantedActions)("can %s", (action) => {
    expect(can("athletic_trainer", action)).toBe(true);
  });

  it.each(deniedActions)("cannot %s", (action) => {
    expect(can("athletic_trainer", action)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Parent / guardian — minimal read access                             */
/* ------------------------------------------------------------------ */

describe("parent_guardian", () => {
  const grantedActions: PermissionAction[] = [
    "view_player_profile",
    "view_practice_plans",
  ];

  const deniedActions: PermissionAction[] = [
    "view_injury_notes",
    "update_injury_status",
    "view_private_notes",      // AC#3
    "create_private_notes",
    "publish_dossier",
    "manage_staff_roles",
    "view_audit_log",
    "invite_user",
    "create_assignment",
    "manage_roster",
    "view_sensitive_analytics",
    "create_readiness_override",
    "view_film",
    "tag_film_clip",
  ];

  it.each(grantedActions)("can %s", (action) => {
    expect(can("parent_guardian", action)).toBe(true);
  });

  it.each(deniedActions)("cannot %s", (action) => {
    expect(can("parent_guardian", action)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Player — own data only                                              */
/* ------------------------------------------------------------------ */

describe("player", () => {
  it("can view_player_profile", () => {
    expect(can("player", "view_player_profile")).toBe(true);
  });

  it("can view_practice_plans", () => {
    expect(can("player", "view_practice_plans")).toBe(true);
  });

  it("cannot view_injury_notes", () => {
    expect(can("player", "view_injury_notes")).toBe(false);
  });

  it("cannot view_private_notes", () => {
    expect(can("player", "view_private_notes")).toBe(false);
  });

  it("cannot publish_dossier", () => {
    expect(can("player", "publish_dossier")).toBe(false);
  });

  it("cannot manage_staff_roles", () => {
    expect(can("player", "manage_staff_roles")).toBe(false);
  });

  it("cannot invite_user", () => {
    expect(can("player", "invite_user")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Strength coach                                                       */
/* ------------------------------------------------------------------ */

describe("strength_coach", () => {
  it("can view_injury_notes (needs for safe training)", () => {
    expect(can("strength_coach", "view_injury_notes")).toBe(true);
  });

  it("can update_injury_status (training restrictions)", () => {
    expect(can("strength_coach", "update_injury_status")).toBe(true);
  });

  it("cannot view_private_notes", () => {
    expect(can("strength_coach", "view_private_notes")).toBe(false);
  });

  it("cannot manage_staff_roles", () => {
    expect(can("strength_coach", "manage_staff_roles")).toBe(false);
  });

  it("cannot publish_dossier", () => {
    expect(can("strength_coach", "publish_dossier")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Director of operations                                              */
/* ------------------------------------------------------------------ */

describe("director_of_ops", () => {
  it("can manage_staff_roles", () => {
    expect(can("director_of_ops", "manage_staff_roles")).toBe(true);
  });

  it("can invite_user", () => {
    expect(can("director_of_ops", "invite_user")).toBe(true);
  });

  it("can view_audit_log", () => {
    expect(can("director_of_ops", "view_audit_log")).toBe(true);
  });

  it("can view_injury_notes (scheduling context)", () => {
    expect(can("director_of_ops", "view_injury_notes")).toBe(true);
  });

  it("cannot view_private_notes", () => {
    expect(can("director_of_ops", "view_private_notes")).toBe(false);
  });

  it("cannot create_readiness_override", () => {
    expect(can("director_of_ops", "create_readiness_override")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* getRolePermissions()                                                 */
/* ------------------------------------------------------------------ */

describe("getRolePermissions()", () => {
  it("returns a non-empty array for every role", () => {
    const roles: StaffRole[] = [
      "head_coach", "assistant_coach", "player_dev_coach", "video_coordinator",
      "strength_coach", "athletic_trainer", "director_of_ops",
      "parent_guardian", "player", "admin",
    ];
    for (const role of roles) {
      expect(getRolePermissions(role).length).toBeGreaterThan(0);
    }
  });

  it("head_coach permissions include all key actions", () => {
    const perms = getRolePermissions("head_coach");
    expect(perms).toContain("view_injury_notes");
    expect(perms).toContain("update_injury_status");
    expect(perms).toContain("view_private_notes");
    expect(perms).toContain("publish_dossier");
    expect(perms).toContain("manage_staff_roles");
    expect(perms).toContain("view_audit_log");
  });

  it("video_coordinator permissions do NOT include view_injury_notes", () => {
    const perms = getRolePermissions("video_coordinator");
    expect(perms).not.toContain("view_injury_notes");
    expect(perms).not.toContain("view_private_notes");
  });

  it("parent_guardian permissions are strictly limited", () => {
    const perms = getRolePermissions("parent_guardian");
    expect(perms.length).toBeLessThanOrEqual(5);
    expect(perms).not.toContain("view_private_notes");
    expect(perms).not.toContain("view_injury_notes");
  });
});

/* ------------------------------------------------------------------ */
/* getPermittedRoles()                                                  */
/* ------------------------------------------------------------------ */

describe("getPermittedRoles()", () => {
  it("view_injury_notes — excludes video_coordinator, parent_guardian, player", () => {
    const permitted = getPermittedRoles("view_injury_notes");
    expect(permitted).not.toContain("video_coordinator");
    expect(permitted).not.toContain("parent_guardian");
    expect(permitted).not.toContain("player");
  });

  it("view_injury_notes — includes head_coach, athletic_trainer, strength_coach", () => {
    const permitted = getPermittedRoles("view_injury_notes");
    expect(permitted).toContain("head_coach");
    expect(permitted).toContain("athletic_trainer");
    expect(permitted).toContain("strength_coach");
  });

  it("update_injury_status — includes athletic_trainer and strength_coach (AC#2)", () => {
    const permitted = getPermittedRoles("update_injury_status");
    expect(permitted).toContain("athletic_trainer");
    expect(permitted).toContain("strength_coach");
  });

  it("view_private_notes — excludes parent_guardian (AC#3)", () => {
    const permitted = getPermittedRoles("view_private_notes");
    expect(permitted).not.toContain("parent_guardian");
    expect(permitted).not.toContain("player");
    expect(permitted).not.toContain("video_coordinator");
  });

  it("manage_staff_roles — only head_coach, director_of_ops, admin", () => {
    const permitted = getPermittedRoles("manage_staff_roles");
    expect(permitted).toContain("head_coach");
    expect(permitted).toContain("director_of_ops");
    expect(permitted).toContain("admin");
    expect(permitted).not.toContain("assistant_coach");
    expect(permitted).not.toContain("video_coordinator");
    expect(permitted).not.toContain("parent_guardian");
  });
});

/* ------------------------------------------------------------------ */
/* getBlockedReason()                                                   */
/* ------------------------------------------------------------------ */

describe("getBlockedReason()", () => {
  it("returns a non-empty string for every denied role/action combo", () => {
    const rolesToTest: StaffRole[] = [
      "video_coordinator", "parent_guardian", "player", "strength_coach",
    ];
    const actionsToTest: PermissionAction[] = [
      "view_injury_notes", "view_private_notes", "manage_staff_roles",
      "publish_dossier", "view_audit_log",
    ];
    for (const role of rolesToTest) {
      for (const action of actionsToTest) {
        if (!can(role, action)) {
          const reason = getBlockedReason(role, action);
          expect(reason.length).toBeGreaterThan(10);
          expect(typeof reason).toBe("string");
        }
      }
    }
  });

  it("AC1 — video_coordinator view_injury_notes has a specific message", () => {
    const reason = getBlockedReason("video_coordinator", "view_injury_notes");
    expect(reason.toLowerCase()).toContain("video coordinator");
  });

  it("AC3 — parent_guardian view_private_notes has a specific message", () => {
    const reason = getBlockedReason("parent_guardian", "view_private_notes");
    expect(reason.toLowerCase()).toMatch(/parent|guardian/);
  });

  it("returns a generic message for uncatalogued combinations", () => {
    const reason = getBlockedReason("player", "delete_film_clip");
    expect(reason.length).toBeGreaterThan(10);
  });
});

/* ------------------------------------------------------------------ */
/* canAny()                                                             */
/* ------------------------------------------------------------------ */

describe("canAny()", () => {
  it("returns true if at least one role in the list has the action", () => {
    expect(canAny(["video_coordinator", "athletic_trainer"], "update_injury_status")).toBe(true);
  });

  it("returns false if no role in the list has the action", () => {
    expect(canAny(["video_coordinator", "player", "parent_guardian"], "view_injury_notes")).toBe(false);
  });

  it("returns true for a single-element list when the role is permitted", () => {
    expect(canAny(["head_coach"], "view_audit_log")).toBe(true);
  });

  it("returns false for an empty list", () => {
    expect(canAny([], "view_film")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* STAFF_ROLE_LABEL — all roles have non-empty labels                  */
/* ------------------------------------------------------------------ */

describe("STAFF_ROLE_LABEL", () => {
  const roles: StaffRole[] = [
    "head_coach", "assistant_coach", "player_dev_coach", "video_coordinator",
    "strength_coach", "athletic_trainer", "director_of_ops",
    "parent_guardian", "player", "admin",
  ];

  it.each(roles)("label for %s is non-empty", (role) => {
    expect(STAFF_ROLE_LABEL[role].length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* Symmetry: admin ≥ head_coach for all actions                        */
/* ------------------------------------------------------------------ */

describe("admin permissions are a superset of head_coach", () => {
  it("every action granted to head_coach is also granted to admin", () => {
    const headCoachPerms = getRolePermissions("head_coach");
    for (const action of headCoachPerms) {
      expect(can("admin", action)).toBe(true);
    }
  });
});
