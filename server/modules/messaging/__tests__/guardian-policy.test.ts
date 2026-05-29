/**
 * Unit tests for the guardian-copy messaging policy.
 *
 * All tests use in-memory fixture data — no database, no network.
 *
 * Coverage matrix
 * ───────────────
 *  Non-staff sender                   → always allowed, policy skipped
 *  Staff + all adults                 → allowed, no guardians added
 *  Staff + minor + valid guardian     → allowed, guardian injected
 *  Staff + minor + guardian already present  → allowed, no duplicate
 *  Staff + minor + no guardian        → BLOCKED
 *  Staff + minor + guardian canReceiveMessages=false  → BLOCKED
 *  Staff + minor + guardian no contact → BLOCKED
 *  Staff + minor + guardian soft-deleted → BLOCKED
 *  Mixed minor+adult audience         → allowed, only minor's guardian added
 *  Multiple minors, one missing guardian → BLOCKED on first offender
 *  Multiple minors, all covered       → allowed, all guardians added
 */

import { describe, it, expect } from "vitest";
import { enforceGuardianPolicy, isStaffRole, STAFF_ROLES } from "../guardian-policy";
import type { PolicyInput } from "../guardian-policy";
import type { Player }         from "@shared/db/schema/players";
import type { PlayerGuardian } from "@shared/db/schema/guardians";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makePlayer(overrides: Partial<Player> & { id: string }): Player {
  return {
    orgId:              "org1",
    userId:             null,
    name:               "Test Player",
    position:           null,
    jerseyNumber:       null,
    grade:              null,
    gradYear:           null,
    height:             null,
    weight:             null,
    handedness:         "right",
    status:             "active",
    role:               "player",
    parentGuardianName:  null,
    parentGuardianEmail: null,
    parentGuardianPhone: null,
    medicalNotes:       null,
    phone:              null,
    email:              null,
    bio:                null,
    recruitingStatus:   null,
    academicNotes:      null,
    yearsPlaying:       null,
    isMinor:            true,       // safe default
    dateOfBirth:        null,
    createdByUserId:    "coach1",
    createdAt:          new Date(),
    updatedAt:          new Date(),
    deletedAt:          null,
    ...overrides,
  };
}

function makeGuardian(overrides: Partial<PlayerGuardian> & { id: string; playerId: string }): PlayerGuardian {
  return {
    orgId:              "org1",
    guardianUserId:     null,
    name:               "Test Guardian",
    email:              "guardian@example.com",
    phone:              "+15550001234",
    relationship:       "parent",
    isPrimary:          true,
    canReceiveMessages: true,
    createdAt:          new Date(),
    deletedAt:          null,
    ...overrides,
  };
}

// Convenience builders
const MINOR  = makePlayer({ id: "p_minor",  name: "Jalen Minor",  isMinor: true });
const ADULT  = makePlayer({ id: "p_adult",  name: "Chris Adult",  isMinor: false });
const MINOR2 = makePlayer({ id: "p_minor2", name: "Kai Minor 2",  isMinor: true });

const GUARDIAN_VALID = makeGuardian({ id: "g1", playerId: "p_minor",  email: "mom@example.com", phone: "+15550001111" });
const GUARDIAN2      = makeGuardian({ id: "g2", playerId: "p_minor2", email: "dad2@example.com", phone: null });

function baseInput(overrides: Partial<PolicyInput> = {}): PolicyInput {
  return {
    senderRole:          "coach",
    targetPlayerIds:     ["p_minor"],
    allPlayers:          [MINOR, ADULT, MINOR2],
    allGuardians:        [GUARDIAN_VALID, GUARDIAN2],
    existingGuardianIds: [],
    ...overrides,
  };
}

// ── isStaffRole helper ────────────────────────────────────────────────────────

describe("isStaffRole", () => {
  it("returns true for all defined staff roles", () => {
    for (const role of STAFF_ROLES) {
      expect(isStaffRole(role)).toBe(true);
    }
  });

  it("returns false for player role", () => {
    expect(isStaffRole("player")).toBe(false);
  });

  it("returns false for guardian role", () => {
    expect(isStaffRole("guardian")).toBe(false);
  });

  it("returns false for viewer role", () => {
    expect(isStaffRole("viewer")).toBe(false);
  });

  it("returns false for arbitrary strings", () => {
    expect(isStaffRole("")).toBe(false);
    expect(isStaffRole("superadmin")).toBe(false);
  });
});

// ── Non-staff sender ──────────────────────────────────────────────────────────

describe("enforceGuardianPolicy — non-staff sender", () => {
  it("allows a player sender targeting a minor with no guardian on file", () => {
    const result = enforceGuardianPolicy(
      baseInput({ senderRole: "player", allGuardians: [] })
    );
    expect(result.allowed).toBe(true);
    expect(result.action).toBe("allowed");
    expect(result.guardiansToAdd).toHaveLength(0);
    expect(result.audit.minorPresent).toBe(false);
  });

  it("allows a guardian sender", () => {
    const result = enforceGuardianPolicy(
      baseInput({ senderRole: "guardian" })
    );
    expect(result.allowed).toBe(true);
    expect(result.guardiansToAdd).toHaveLength(0);
  });

  it("allows a viewer sender", () => {
    const result = enforceGuardianPolicy(
      baseInput({ senderRole: "viewer" })
    );
    expect(result.allowed).toBe(true);
  });
});

// ── Staff + no minors ─────────────────────────────────────────────────────────

describe("enforceGuardianPolicy — staff, no minors in target", () => {
  it("allows message to adults only without adding guardians", () => {
    const result = enforceGuardianPolicy(
      baseInput({ targetPlayerIds: ["p_adult"] })
    );
    expect(result.allowed).toBe(true);
    expect(result.action).toBe("allowed");
    expect(result.guardiansToAdd).toHaveLength(0);
    expect(result.minorPlayerIds).toHaveLength(0);
    expect(result.audit.minorPresent).toBe(false);
  });
});

// ── Staff + minor, guardian present ──────────────────────────────────────────

describe("enforceGuardianPolicy — staff, minor with valid guardian", () => {
  it("auto-includes guardian and marks action as guardian_auto_included", () => {
    const result = enforceGuardianPolicy(baseInput());
    expect(result.allowed).toBe(true);
    expect(result.action).toBe("guardian_auto_included");
    expect(result.guardiansToAdd).toHaveLength(1);
    expect(result.guardiansToAdd[0].guardianId).toBe("g1");
    expect(result.guardiansToAdd[0].playerId).toBe("p_minor");
    expect(result.minorPlayerIds).toContain("p_minor");
    expect(result.audit.minorPresent).toBe(true);
    expect(result.audit.guardiansAdded).toContain("g1");
  });

  it("includes the guardian's contact details in guardiansToAdd", () => {
    const result = enforceGuardianPolicy(baseInput());
    const added = result.guardiansToAdd[0];
    expect(added.email).toBe("mom@example.com");
    expect(added.phone).toBe("+15550001111");
  });

  it("sets participantsAfter to include both target player and added guardian", () => {
    const result = enforceGuardianPolicy(baseInput());
    expect(result.audit.participantsAfter).toContain("p_minor");
    expect(result.audit.participantsAfter).toContain("g1");
  });
});

// ── Guardian already in audience ──────────────────────────────────────────────

describe("enforceGuardianPolicy — guardian already present in audience", () => {
  it("does not add duplicate guardian when already in existingGuardianIds", () => {
    const result = enforceGuardianPolicy(
      baseInput({ existingGuardianIds: ["g1"] })
    );
    expect(result.allowed).toBe(true);
    // Guardian already covered — action can be either 'allowed' or 'guardian_auto_included'
    // depending on impl; what matters is no duplicate.
    expect(result.guardiansToAdd).toHaveLength(0);
    expect(result.audit.guardiansAdded).toHaveLength(0);
  });
});

// ── Staff + minor, NO guardian on file ───────────────────────────────────────

describe("enforceGuardianPolicy — staff, minor with no guardian", () => {
  it("blocks the send", () => {
    const result = enforceGuardianPolicy(
      baseInput({ allGuardians: [] })
    );
    expect(result.allowed).toBe(false);
    expect(result.action).toBe("blocked");
    expect(result.blockedReason).not.toBeNull();
    expect(result.blockedReason).toMatch(/Jalen Minor/);
    expect(result.guardiansToAdd).toHaveLength(0);
  });

  it("populates blockedReason in the audit payload", () => {
    const result = enforceGuardianPolicy(
      baseInput({ allGuardians: [] })
    );
    expect(result.audit.blockedReason).not.toBeNull();
  });

  it("does not modify participantsAfter when blocked", () => {
    const result = enforceGuardianPolicy(
      baseInput({ allGuardians: [] })
    );
    expect(result.audit.participantsAfter).toEqual(result.audit.participantsBefore);
  });
});

// ── canReceiveMessages = false ────────────────────────────────────────────────

describe("enforceGuardianPolicy — guardian with canReceiveMessages=false", () => {
  it("blocks the send — an opt-out guardian is not a valid guardian", () => {
    const optedOut = makeGuardian({
      id:                 "g_optout",
      playerId:           "p_minor",
      canReceiveMessages: false,
      email:              "mom@example.com",
    });
    const result = enforceGuardianPolicy(
      baseInput({ allGuardians: [optedOut] })
    );
    expect(result.allowed).toBe(false);
    expect(result.action).toBe("blocked");
  });
});

// ── Guardian with no contact method ──────────────────────────────────────────

describe("enforceGuardianPolicy — guardian with no email or phone", () => {
  it("blocks the send — unreachable guardian is not a valid guardian", () => {
    const noContact = makeGuardian({
      id:       "g_nocontact",
      playerId: "p_minor",
      email:    null,
      phone:    null,
    });
    const result = enforceGuardianPolicy(
      baseInput({ allGuardians: [noContact] })
    );
    expect(result.allowed).toBe(false);
    expect(result.action).toBe("blocked");
  });
});

// ── Soft-deleted guardian ─────────────────────────────────────────────────────

describe("enforceGuardianPolicy — soft-deleted guardian", () => {
  it("blocks the send — deleted guardian is ignored", () => {
    const deleted = makeGuardian({
      id:        "g_deleted",
      playerId:  "p_minor",
      email:     "gone@example.com",
      deletedAt: new Date("2025-01-01"),
    });
    const result = enforceGuardianPolicy(
      baseInput({ allGuardians: [deleted] })
    );
    expect(result.allowed).toBe(false);
    expect(result.action).toBe("blocked");
  });
});

// ── Mixed audience: minors and adults ────────────────────────────────────────

describe("enforceGuardianPolicy — mixed minor and adult audience", () => {
  it("adds guardian for the minor but not for the adult", () => {
    const result = enforceGuardianPolicy(
      baseInput({ targetPlayerIds: ["p_minor", "p_adult"] })
    );
    expect(result.allowed).toBe(true);
    expect(result.guardiansToAdd).toHaveLength(1);
    expect(result.guardiansToAdd[0].guardianId).toBe("g1");
    expect(result.minorPlayerIds).toContain("p_minor");
    expect(result.minorPlayerIds).not.toContain("p_adult");
  });
});

// ── Multiple minors ───────────────────────────────────────────────────────────

describe("enforceGuardianPolicy — multiple minors", () => {
  it("blocks if any one minor has no guardian, even when others do", () => {
    // p_minor has g1 (valid), p_minor2 has g2 (valid email-only)
    // Remove g1 so p_minor is uncovered
    const result = enforceGuardianPolicy(
      baseInput({
        targetPlayerIds: ["p_minor", "p_minor2"],
        allGuardians:    [GUARDIAN2], // g2 covers p_minor2 only
      })
    );
    expect(result.allowed).toBe(false);
    expect(result.action).toBe("blocked");
    expect(result.blockedReason).toMatch(/Jalen Minor/);
  });

  it("allows and adds all guardians when every minor is covered", () => {
    const result = enforceGuardianPolicy(
      baseInput({
        targetPlayerIds: ["p_minor", "p_minor2"],
        allGuardians:    [GUARDIAN_VALID, GUARDIAN2],
      })
    );
    expect(result.allowed).toBe(true);
    expect(result.action).toBe("guardian_auto_included");
    expect(result.guardiansToAdd).toHaveLength(2);
    const addedIds = result.guardiansToAdd.map((g) => g.guardianId);
    expect(addedIds).toContain("g1");
    expect(addedIds).toContain("g2");
  });

  it("does not add the same guardian twice when one guardian covers two minors (shared family)", () => {
    // Unusual but possible: one guardian record linked to two players
    const sharedGuardian = makeGuardian({ id: "g_shared", playerId: "p_minor", email: "shared@example.com" });
    const sharedGuardian2 = makeGuardian({ id: "g_shared", playerId: "p_minor2", email: "shared@example.com" });
    const result = enforceGuardianPolicy(
      baseInput({
        targetPlayerIds: ["p_minor", "p_minor2"],
        allGuardians:    [sharedGuardian, sharedGuardian2],
      })
    );
    // Should only be added once despite appearing for both players
    const uniqueIds = new Set(result.guardiansToAdd.map((g) => g.guardianId));
    expect(uniqueIds.size).toBe(result.guardiansToAdd.length);
  });
});

// ── Audit payload completeness ────────────────────────────────────────────────

describe("enforceGuardianPolicy — audit payload", () => {
  it("always includes blockedReason=null in audit when allowed", () => {
    const result = enforceGuardianPolicy(baseInput());
    expect(result.audit.blockedReason).toBeNull();
  });

  it("includes targetPlayerIds in participantsBefore", () => {
    const result = enforceGuardianPolicy(baseInput());
    expect(result.audit.participantsBefore).toContain("p_minor");
  });

  it("includes existingGuardianIds in participantsBefore", () => {
    const result = enforceGuardianPolicy(
      baseInput({ existingGuardianIds: ["g_existing"] })
    );
    expect(result.audit.participantsBefore).toContain("g_existing");
  });

  it("participantsAfter includes everything in participantsBefore plus new guardians", () => {
    const result = enforceGuardianPolicy(baseInput());
    for (const id of result.audit.participantsBefore) {
      expect(result.audit.participantsAfter).toContain(id);
    }
    for (const g of result.guardiansToAdd) {
      expect(result.audit.participantsAfter).toContain(g.guardianId);
    }
  });
});

// ── Role coverage for all staff variants ─────────────────────────────────────

describe("enforceGuardianPolicy — all staff roles trigger policy", () => {
  const roles = ["owner", "admin", "coach", "analyst"];

  for (const role of roles) {
    it(`role '${role}' triggers guardian enforcement`, () => {
      const result = enforceGuardianPolicy(baseInput({ senderRole: role }));
      expect(result.action).not.toBe("allowed"); // either auto_included or blocked
    });
  }
});
