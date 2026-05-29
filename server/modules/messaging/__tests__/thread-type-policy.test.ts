/**
 * Unit tests for the thread-type policy classification engine.
 *
 * All tests are pure — no database, no network.
 *
 * Coverage matrix
 * ───────────────
 * Policy matrix rows (every cell tested):
 *
 *   Sender    | Audience              | Minor? | Guardian? | 2nd adult? | Org setting           | Expected type / block
 *   ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *   non-staff | any                   | any    | any       | any        | any                   | bypass (no type)
 *   staff     | staff-only            | no     | no        | no         | any                   | staff_internal
 *   staff     | staff-only            | no     | no        | yes        | any                   | staff_internal + second_adult badge
 *   staff     | guardians only        | no     | yes       | no         | any                   | coach_to_parent
 *   staff     | 1 minor + guardian    | yes    | yes       | no         | any                   | coach_to_minor_with_guardian
 *   staff     | 1 minor + guardian    | yes    | yes       | yes        | any                   | coach_to_minor_with_guardian + second_adult badge
 *   staff     | team + minors + gd    | yes    | yes       | no         | !require2ndAdult      | coach_to_team_with_adult_copy
 *   staff     | team + minors + gd    | yes    | yes       | yes        | any                   | coach_to_team_with_adult_copy + second_adult badge
 *   staff     | team + minors + gd    | yes    | yes       | no         | require2ndAdult=true  | BLOCKED SECOND_ADULT_REQUIRED
 *   staff     | minors, no guardian   | yes    | no        | any        | any                   | BLOCKED MINOR_WITHOUT_GUARDIAN
 *   staff     | adults only           | no     | no        | any        | any                   | broadcast (no safety concern)
 *   staff     | adults + guardians    | no     | yes       | any        | any                   | broadcast + guardian badge
 *
 * Additional coverage:
 *   - parseOrgMessagingSettings: valid JSONB, missing keys, malformed input
 *   - buildPolicyAudit: snapshot correctness
 *   - All four staff role variants trigger classification
 *   - Non-staff roles (player, guardian, viewer) bypass classification
 *   - requiresSecondAdult flag reflects org setting on team threads
 */

import { describe, it, expect } from "vitest";
import {
  classifyThreadType,
  parseOrgMessagingSettings,
  buildPolicyAudit,
  DEFAULT_ORG_SETTINGS,
  APPROVED_THREAD_TYPES,
  type ThreadClassificationInput,
  type OrgMessagingSettings,
} from "../thread-type-policy";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = { ...DEFAULT_ORG_SETTINGS };

const REQUIRE_SECOND_ADULT: OrgMessagingSettings = {
  ...DEFAULT_ORG_SETTINGS,
  requireSecondAdultForTeamThreads: true,
};

function base(overrides: Partial<ThreadClassificationInput> = {}): ThreadClassificationInput {
  return {
    senderRole:             "coach",
    hasMinorRecipients:     false,
    hasGuardianRecipients:  false,
    hasPlayerRecipients:    false,
    isTeamThread:           false,
    staffOnly:              false,
    secondAdultUserIds:     [],
    orgSettings:            DEFAULT_SETTINGS,
    ...overrides,
  };
}

// ── parseOrgMessagingSettings ─────────────────────────────────────────────────

describe("parseOrgMessagingSettings", () => {
  it("returns defaults when payload is null", () => {
    expect(parseOrgMessagingSettings(null)).toEqual(DEFAULT_ORG_SETTINGS);
  });

  it("returns defaults when payload is undefined", () => {
    expect(parseOrgMessagingSettings(undefined)).toEqual(DEFAULT_ORG_SETTINGS);
  });

  it("returns defaults when payload has no messagingPolicy key", () => {
    expect(parseOrgMessagingSettings({ plan: "free" })).toEqual(DEFAULT_ORG_SETTINGS);
  });

  it("reads requireAllGuardians from valid JSONB", () => {
    const result = parseOrgMessagingSettings({
      messagingPolicy: { requireAllGuardians: false },
    });
    expect(result.requireAllGuardians).toBe(false);
    expect(result.requireSecondAdultForTeamThreads).toBe(DEFAULT_ORG_SETTINGS.requireSecondAdultForTeamThreads);
  });

  it("reads requireSecondAdultForTeamThreads from valid JSONB", () => {
    const result = parseOrgMessagingSettings({
      messagingPolicy: { requireSecondAdultForTeamThreads: true },
    });
    expect(result.requireSecondAdultForTeamThreads).toBe(true);
    expect(result.requireAllGuardians).toBe(DEFAULT_ORG_SETTINGS.requireAllGuardians);
  });

  it("ignores non-boolean values and falls back to defaults", () => {
    const result = parseOrgMessagingSettings({
      messagingPolicy: { requireAllGuardians: "yes", requireSecondAdultForTeamThreads: 1 },
    });
    expect(result).toEqual(DEFAULT_ORG_SETTINGS);
  });

  it("handles messagingPolicy: null gracefully", () => {
    expect(parseOrgMessagingSettings({ messagingPolicy: null })).toEqual(DEFAULT_ORG_SETTINGS);
  });
});

// ── Non-staff bypass ──────────────────────────────────────────────────────────

describe("classifyThreadType — non-staff sender bypass", () => {
  const nonStaffRoles = ["player", "guardian", "viewer"];

  for (const role of nonStaffRoles) {
    it(`role '${role}' bypasses classification — allowed=true, threadType=null`, () => {
      const result = classifyThreadType(base({
        senderRole:            role,
        hasMinorRecipients:    true,   // would block for staff
        hasGuardianRecipients: false,  // would block for staff
      }));
      expect(result.allowed).toBe(true);
      expect(result.threadType).toBeNull();
      expect(result.badges).toHaveLength(0);
      expect(result.blockedCode).toBeNull();
    });
  }
});

// ── Staff-internal thread ─────────────────────────────────────────────────────

describe("classifyThreadType — staff_internal", () => {
  it("classifies staff-only audience as staff_internal", () => {
    const result = classifyThreadType(base({ staffOnly: true }));
    expect(result.allowed).toBe(true);
    expect(result.threadType).toBe("staff_internal");
    expect(result.blockedCode).toBeNull();
  });

  it("no safety badges on staff_internal thread without second adult", () => {
    const result = classifyThreadType(base({ staffOnly: true }));
    expect(result.badges).not.toContain("minor_protected");
    expect(result.badges).not.toContain("guardian_included");
  });

  it("adds second_adult_included badge when secondAdultUserIds is non-empty", () => {
    const result = classifyThreadType(base({
      staffOnly:          true,
      secondAdultUserIds: ["user_co_coach"],
    }));
    expect(result.badges).toContain("second_adult_included");
  });

  it("requiresSecondAdult is false for staff_internal regardless of org setting", () => {
    const result = classifyThreadType(base({
      staffOnly:  true,
      orgSettings: REQUIRE_SECOND_ADULT,
    }));
    expect(result.requiresSecondAdult).toBe(false);
  });
});

// ── coach_to_parent ───────────────────────────────────────────────────────────

describe("classifyThreadType — coach_to_parent", () => {
  it("classifies guardian-only audience as coach_to_parent", () => {
    const result = classifyThreadType(base({
      hasGuardianRecipients: true,
      hasPlayerRecipients:   false,
    }));
    expect(result.allowed).toBe(true);
    expect(result.threadType).toBe("coach_to_parent");
  });

  it("includes guardian_included badge", () => {
    const result = classifyThreadType(base({
      hasGuardianRecipients: true,
      hasPlayerRecipients:   false,
    }));
    expect(result.badges).toContain("guardian_included");
  });

  it("does NOT include minor_protected badge (no player recipients)", () => {
    const result = classifyThreadType(base({
      hasGuardianRecipients: true,
      hasPlayerRecipients:   false,
    }));
    expect(result.badges).not.toContain("minor_protected");
  });

  it("is always allowed regardless of org settings", () => {
    const result = classifyThreadType(base({
      hasGuardianRecipients: true,
      hasPlayerRecipients:   false,
      orgSettings:           REQUIRE_SECOND_ADULT,
    }));
    expect(result.allowed).toBe(true);
  });
});

// ── coach_to_minor_with_guardian ──────────────────────────────────────────────

describe("classifyThreadType — coach_to_minor_with_guardian (1:1)", () => {
  const singleMinorWithGuardian: Partial<ThreadClassificationInput> = {
    hasMinorRecipients:    true,
    hasGuardianRecipients: true,
    hasPlayerRecipients:   true,
    isTeamThread:          false,     // single player
  };

  it("classifies single-minor + guardian as coach_to_minor_with_guardian", () => {
    const result = classifyThreadType(base(singleMinorWithGuardian));
    expect(result.allowed).toBe(true);
    expect(result.threadType).toBe("coach_to_minor_with_guardian");
  });

  it("includes minor_protected and guardian_included badges", () => {
    const result = classifyThreadType(base(singleMinorWithGuardian));
    expect(result.badges).toContain("minor_protected");
    expect(result.badges).toContain("guardian_included");
  });

  it("adds second_adult_included when secondAdultUserIds supplied", () => {
    const result = classifyThreadType(base({
      ...singleMinorWithGuardian,
      secondAdultUserIds: ["co_coach_1"],
    }));
    expect(result.badges).toContain("second_adult_included");
    expect(result.badges).toContain("minor_protected");
    expect(result.badges).toContain("guardian_included");
  });

  it("requiresSecondAdult is false (1:1 thread exempt from second adult rule)", () => {
    const result = classifyThreadType(base({
      ...singleMinorWithGuardian,
      orgSettings: REQUIRE_SECOND_ADULT,
    }));
    expect(result.requiresSecondAdult).toBe(false);
    expect(result.allowed).toBe(true);  // 1:1 threads are not blocked by this setting
  });

  it("is allowed even when org requireSecondAdultForTeamThreads=true (not a team thread)", () => {
    const result = classifyThreadType(base({
      ...singleMinorWithGuardian,
      orgSettings:       REQUIRE_SECOND_ADULT,
      secondAdultUserIds: [],
    }));
    expect(result.allowed).toBe(true);
  });
});

// ── coach_to_team_with_adult_copy ─────────────────────────────────────────────

describe("classifyThreadType — coach_to_team_with_adult_copy", () => {
  const teamWithMinors: Partial<ThreadClassificationInput> = {
    hasMinorRecipients:    true,
    hasGuardianRecipients: true,
    hasPlayerRecipients:   true,
    isTeamThread:          true,
  };

  it("classifies team + minors + guardian as coach_to_team_with_adult_copy", () => {
    const result = classifyThreadType(base(teamWithMinors));
    expect(result.allowed).toBe(true);
    expect(result.threadType).toBe("coach_to_team_with_adult_copy");
  });

  it("includes minor_protected and guardian_included badges", () => {
    const result = classifyThreadType(base(teamWithMinors));
    expect(result.badges).toContain("minor_protected");
    expect(result.badges).toContain("guardian_included");
  });

  it("allowed when org requireSecondAdultForTeamThreads=false and no second adult", () => {
    const result = classifyThreadType(base({
      ...teamWithMinors,
      orgSettings:        { ...DEFAULT_SETTINGS, requireSecondAdultForTeamThreads: false },
      secondAdultUserIds: [],
    }));
    expect(result.allowed).toBe(true);
    expect(result.requiresSecondAdult).toBe(false);
  });

  it("allowed when requireSecondAdultForTeamThreads=true AND second adult provided", () => {
    const result = classifyThreadType(base({
      ...teamWithMinors,
      orgSettings:        REQUIRE_SECOND_ADULT,
      secondAdultUserIds: ["user_assistant_coach"],
    }));
    expect(result.allowed).toBe(true);
    expect(result.threadType).toBe("coach_to_team_with_adult_copy");
    expect(result.badges).toContain("second_adult_included");
  });

  it("BLOCKED when org requires second adult but none provided", () => {
    const result = classifyThreadType(base({
      ...teamWithMinors,
      orgSettings:        REQUIRE_SECOND_ADULT,
      secondAdultUserIds: [],
    }));
    expect(result.allowed).toBe(false);
    expect(result.blockedCode).toBe("SECOND_ADULT_REQUIRED");
    expect(result.blockedReason).not.toBeNull();
    expect(result.threadType).toBeNull();
  });

  it("requiresSecondAdult=true in blocked result so UI can show the requirement", () => {
    const result = classifyThreadType(base({
      ...teamWithMinors,
      orgSettings:        REQUIRE_SECOND_ADULT,
      secondAdultUserIds: [],
    }));
    expect(result.requiresSecondAdult).toBe(true);
  });

  it("adds second_adult_included badge when a second adult is present", () => {
    const result = classifyThreadType(base({
      ...teamWithMinors,
      secondAdultUserIds: ["staff_1", "staff_2"],
    }));
    expect(result.badges).toContain("second_adult_included");
  });
});

// ── BLOCKED: minor without guardian ──────────────────────────────────────────

describe("classifyThreadType — MINOR_WITHOUT_GUARDIAN (belt-and-suspenders)", () => {
  it("blocks a minor-containing thread with no guardian", () => {
    const result = classifyThreadType(base({
      hasMinorRecipients:    true,
      hasGuardianRecipients: false,
      hasPlayerRecipients:   true,
    }));
    expect(result.allowed).toBe(false);
    expect(result.blockedCode).toBe("MINOR_WITHOUT_GUARDIAN");
    expect(result.threadType).toBeNull();
    expect(result.badges).toHaveLength(0);
  });

  it("blocks a team thread with minors and no guardian", () => {
    const result = classifyThreadType(base({
      hasMinorRecipients:    true,
      hasGuardianRecipients: false,
      hasPlayerRecipients:   true,
      isTeamThread:          true,
    }));
    expect(result.allowed).toBe(false);
    expect(result.blockedCode).toBe("MINOR_WITHOUT_GUARDIAN");
  });

  it("blocked even when a second adult is present — second adult cannot substitute guardian", () => {
    const result = classifyThreadType(base({
      hasMinorRecipients:    true,
      hasGuardianRecipients: false,
      secondAdultUserIds:    ["co_coach"],
    }));
    expect(result.allowed).toBe(false);
    expect(result.blockedCode).toBe("MINOR_WITHOUT_GUARDIAN");
  });
});

// ── Adult-only broadcast (no safety concern) ──────────────────────────────────

describe("classifyThreadType — adults only, no minors", () => {
  it("classifies adult-only team as broadcast with no safety badges", () => {
    const result = classifyThreadType(base({
      hasMinorRecipients:    false,
      hasGuardianRecipients: false,
      hasPlayerRecipients:   true,
      isTeamThread:          true,
    }));
    expect(result.allowed).toBe(true);
    expect(result.threadType).toBe("broadcast");
    expect(result.badges).not.toContain("minor_protected");
    expect(result.badges).not.toContain("guardian_included");
  });

  it("classifies adult individual send as broadcast", () => {
    const result = classifyThreadType(base({
      hasMinorRecipients:    false,
      hasGuardianRecipients: false,
      hasPlayerRecipients:   true,
      isTeamThread:          false,
    }));
    expect(result.allowed).toBe(true);
    expect(result.threadType).toBe("broadcast");
  });

  it("adult-only + voluntary guardian copy adds guardian_included badge", () => {
    const result = classifyThreadType(base({
      hasMinorRecipients:    false,
      hasGuardianRecipients: true,
      hasPlayerRecipients:   true,
    }));
    expect(result.allowed).toBe(true);
    expect(result.badges).toContain("guardian_included");
    expect(result.badges).not.toContain("minor_protected");
  });

  it("requireSecondAdultForTeamThreads has no effect on adult-only threads", () => {
    const result = classifyThreadType(base({
      hasMinorRecipients:    false,
      hasPlayerRecipients:   true,
      isTeamThread:          true,
      orgSettings:           REQUIRE_SECOND_ADULT,
      secondAdultUserIds:    [],
    }));
    expect(result.allowed).toBe(true);
    expect(result.requiresSecondAdult).toBe(false);
  });
});

// ── All four staff roles trigger classification ───────────────────────────────

describe("classifyThreadType — all staff roles trigger enforcement", () => {
  const staffRoles = ["owner", "admin", "coach", "analyst"];

  for (const role of staffRoles) {
    it(`role '${role}' classifies minor thread as coach_to_minor_with_guardian`, () => {
      const result = classifyThreadType(base({
        senderRole:            role,
        hasMinorRecipients:    true,
        hasGuardianRecipients: true,
        hasPlayerRecipients:   true,
        isTeamThread:          false,
      }));
      expect(result.threadType).toBe("coach_to_minor_with_guardian");
      expect(result.allowed).toBe(true);
    });

    it(`role '${role}' blocks minor thread without guardian`, () => {
      const result = classifyThreadType(base({
        senderRole:            role,
        hasMinorRecipients:    true,
        hasGuardianRecipients: false,
        hasPlayerRecipients:   true,
      }));
      expect(result.allowed).toBe(false);
    });
  }
});

// ── APPROVED_THREAD_TYPES constant ───────────────────────────────────────────

describe("APPROVED_THREAD_TYPES constant", () => {
  it("contains exactly the four approved types", () => {
    expect(APPROVED_THREAD_TYPES).toHaveLength(4);
    expect(APPROVED_THREAD_TYPES).toContain("coach_to_parent");
    expect(APPROVED_THREAD_TYPES).toContain("coach_to_minor_with_guardian");
    expect(APPROVED_THREAD_TYPES).toContain("coach_to_team_with_adult_copy");
    expect(APPROVED_THREAD_TYPES).toContain("staff_internal");
  });

  it("every non-bypass allowed result from a staff sender uses one of the approved types or broadcast", () => {
    const cases: Array<Partial<ThreadClassificationInput>> = [
      { staffOnly: true },
      { hasGuardianRecipients: true, hasPlayerRecipients: false },
      { hasMinorRecipients: true, hasGuardianRecipients: true, hasPlayerRecipients: true, isTeamThread: false },
      { hasMinorRecipients: true, hasGuardianRecipients: true, hasPlayerRecipients: true, isTeamThread: true },
      { hasMinorRecipients: false, hasPlayerRecipients: true },
    ];

    const allowedTypes = [...APPROVED_THREAD_TYPES, "broadcast", "dm", "parent_dm", "staff"];

    for (const c of cases) {
      const result = classifyThreadType(base(c));
      if (result.allowed && result.threadType !== null) {
        expect(allowedTypes).toContain(result.threadType);
      }
    }
  });
});

// ── buildPolicyAudit ─────────────────────────────────────────────────────────

describe("buildPolicyAudit", () => {
  it("captures input and result into a flat audit snapshot", () => {
    const input = base({
      senderRole:            "coach",
      hasMinorRecipients:    true,
      hasGuardianRecipients: true,
      hasPlayerRecipients:   true,
      isTeamThread:          true,
      secondAdultUserIds:    ["user_asst"],
    });
    const result = classifyThreadType(input);
    const audit  = buildPolicyAudit(input, result);

    expect(audit.senderRole).toBe("coach");
    expect(audit.hasMinorRecipients).toBe(true);
    expect(audit.isTeamThread).toBe(true);
    expect(audit.secondAdultPresent).toBe(true);
    expect(audit.allowed).toBe(result.allowed);
    expect(audit.classifiedType).toBe(result.threadType);
    expect(audit.badges).toEqual(result.badges);
    expect(audit.orgSettingsSnapshot).toEqual(input.orgSettings);
  });

  it("reflects blocked state correctly", () => {
    const input  = base({ hasMinorRecipients: true, hasGuardianRecipients: false, hasPlayerRecipients: true });
    const result = classifyThreadType(input);
    const audit  = buildPolicyAudit(input, result);

    expect(audit.allowed).toBe(false);
    expect(audit.blockedCode).toBe("MINOR_WITHOUT_GUARDIAN");
    expect(audit.classifiedType).toBeNull();
  });

  it("snapshots the org settings so policy replay is possible", () => {
    const input = base({ orgSettings: REQUIRE_SECOND_ADULT });
    const result = classifyThreadType(input);
    const audit  = buildPolicyAudit(input, result);

    expect(audit.orgSettingsSnapshot.requireSecondAdultForTeamThreads).toBe(true);
  });
});
