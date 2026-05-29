/**
 * Unit tests for the quiet-hours messaging policy (Layer 3).
 *
 * All tests are pure — no database, no network.  `attemptedAt` is always
 * passed explicitly so tests are fully deterministic and timezone-independent.
 *
 * Coverage matrix
 * ───────────────
 *  Non-staff sender              → skipped (policy does not apply)
 *  No minor recipients           → skipped
 *  policy.enabled = false        → skipped
 *  In window (e.g. 10:00 local)  → allowed
 *  Before window (e.g. 03:00)    → queued, scheduledAt = today start hour
 *  After window (e.g. 22:00)     → queued, scheduledAt = tomorrow start hour
 *  Exactly at window start       → allowed (inclusive boundary)
 *  Exactly at window end         → queued (exclusive boundary)
 *  Emergency override, valid     → emergency_send
 *  Emergency override, bad reason → queued + emergencyRejectedReason
 *  Emergency override, short note → queued + emergencyRejectedReason
 *  Emergency override, note = min length − 1 → queued
 *  Emergency override, note = min length     → emergency_send
 *  All four staff roles trigger policy
 *  Non-staff (player, guardian, viewer) bypass
 *
 * Timezone edge-case coverage (getNextWindowOpenUtc)
 * ───────────────────────────────────────────────────
 *  UTC−5 (America/New_York, winter) — before-window, after-window
 *  UTC−6 (America/Chicago, winter)  — after-window
 *  UTC+5:30 (Asia/Kolkata, IST)     — after-window with non-whole-hour offset
 *  UTC+0 (UTC itself)               — after-window
 *
 * parseOrgQuietHoursPolicy
 * ─────────────────────────
 *  Null/undefined/empty payload   → defaults
 *  Valid JSONB                    → reads values
 *  Out-of-range hour values       → clamped
 *  Non-boolean enabled            → defaults
 */

import { describe, it, expect } from "vitest";
import {
  enforceQuietHours,
  parseOrgQuietHoursPolicy,
  getLocalHour,
  getNextWindowOpenUtc,
  getLocalDateParts,
  DEFAULT_QUIET_HOURS_POLICY,
  VALID_EMERGENCY_REASONS,
  EMERGENCY_NOTE_MIN_LENGTH,
  type OrgQuietHoursPolicy,
  type QuietHoursInput,
} from "../quiet-hours-policy";

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEFAULT_POLICY = { ...DEFAULT_QUIET_HOURS_POLICY }; // 05–21, America/Chicago

function base(overrides: Partial<QuietHoursInput> = {}): QuietHoursInput {
  return {
    senderRole:         "coach",
    hasMinorRecipients: true,
    attemptedAt:        new Date("2025-01-15T16:00:00Z"), // 10am Chicago (UTC-6) — in window
    policy:             DEFAULT_POLICY,
    ...overrides,
  };
}

/** UTC timestamp for a known local time in America/Chicago (UTC-6 in January). */
function chicagoToUtc(isoLocalApprox: string): Date {
  // Chicago is UTC-6 in January (no DST).
  // Offset: subtract 6 hours from local → UTC.
  const local = new Date(isoLocalApprox + "Z"); // parse as UTC...
  return new Date(local.getTime() + 6 * 3_600_000); // ...then shift to get true UTC
}

// ── parseOrgQuietHoursPolicy ──────────────────────────────────────────────────

describe("parseOrgQuietHoursPolicy", () => {
  it("returns defaults for null payload", () => {
    expect(parseOrgQuietHoursPolicy(null)).toEqual(DEFAULT_QUIET_HOURS_POLICY);
  });

  it("returns defaults for undefined payload", () => {
    expect(parseOrgQuietHoursPolicy(undefined)).toEqual(DEFAULT_QUIET_HOURS_POLICY);
  });

  it("returns defaults when quietHoursPolicy key is missing", () => {
    expect(parseOrgQuietHoursPolicy({ plan: "team" })).toEqual(DEFAULT_QUIET_HOURS_POLICY);
  });

  it("reads enabled=false", () => {
    const result = parseOrgQuietHoursPolicy({ quietHoursPolicy: { enabled: false } });
    expect(result.enabled).toBe(false);
    expect(result.allowedStartHour).toBe(DEFAULT_QUIET_HOURS_POLICY.allowedStartHour);
  });

  it("reads custom start and end hours", () => {
    const result = parseOrgQuietHoursPolicy({
      quietHoursPolicy: { allowedStartHour: 7, allowedEndHour: 20 },
    });
    expect(result.allowedStartHour).toBe(7);
    expect(result.allowedEndHour).toBe(20);
  });

  it("reads custom timezone", () => {
    const result = parseOrgQuietHoursPolicy({
      quietHoursPolicy: { timezone: "America/New_York" },
    });
    expect(result.timezone).toBe("America/New_York");
  });

  it("clamps out-of-range hours to 0–23", () => {
    const result = parseOrgQuietHoursPolicy({
      quietHoursPolicy: { allowedStartHour: -5, allowedEndHour: 30 },
    });
    expect(result.allowedStartHour).toBe(0);
    expect(result.allowedEndHour).toBe(23);
  });

  it("ignores non-integer hours and falls back to defaults", () => {
    const result = parseOrgQuietHoursPolicy({
      quietHoursPolicy: { allowedStartHour: "5am", allowedEndHour: 21.5 },
    });
    expect(result.allowedStartHour).toBe(DEFAULT_QUIET_HOURS_POLICY.allowedStartHour);
    expect(result.allowedEndHour).toBe(DEFAULT_QUIET_HOURS_POLICY.allowedEndHour);
  });

  it("ignores non-boolean enabled and falls back to default", () => {
    const result = parseOrgQuietHoursPolicy({
      quietHoursPolicy: { enabled: "yes" },
    });
    expect(result.enabled).toBe(DEFAULT_QUIET_HOURS_POLICY.enabled);
  });

  it("handles quietHoursPolicy: null", () => {
    expect(parseOrgQuietHoursPolicy({ quietHoursPolicy: null })).toEqual(
      DEFAULT_QUIET_HOURS_POLICY,
    );
  });
});

// ── Bypass conditions ─────────────────────────────────────────────────────────

describe("enforceQuietHours — bypass conditions", () => {
  it("skips when sender is not staff (player)", () => {
    const result = enforceQuietHours(
      base({ senderRole: "player", attemptedAt: new Date("2025-01-15T04:00:00Z") }),
    );
    expect(result.action).toBe("skipped");
    expect(result.sendNow).toBe(true);
    expect(result.scheduledAt).toBeNull();
  });

  it("skips when sender is guardian", () => {
    expect(enforceQuietHours(base({ senderRole: "guardian" })).action).toBe("skipped");
  });

  it("skips when sender is viewer", () => {
    expect(enforceQuietHours(base({ senderRole: "viewer" })).action).toBe("skipped");
  });

  it("skips when there are no minor recipients", () => {
    const result = enforceQuietHours(
      base({ hasMinorRecipients: false, attemptedAt: new Date("2025-01-15T04:00:00Z") }),
    );
    expect(result.action).toBe("skipped");
    expect(result.sendNow).toBe(true);
  });

  it("skips when policy.enabled is false", () => {
    const result = enforceQuietHours(
      base({
        policy: { ...DEFAULT_POLICY, enabled: false },
        attemptedAt: new Date("2025-01-15T04:00:00Z"), // 10pm Chicago — outside window
      }),
    );
    expect(result.action).toBe("skipped");
    expect(result.sendNow).toBe(true);
  });
});

// ── In-window sends ───────────────────────────────────────────────────────────

describe("enforceQuietHours — within allowed window", () => {
  // 10:00 AM Chicago UTC-6 = 16:00 UTC (within 05–21 window)
  const inWindowAttempt = new Date("2025-01-15T16:00:00Z");

  it("returns allowed when in window", () => {
    const result = enforceQuietHours(base({ attemptedAt: inWindowAttempt }));
    expect(result.action).toBe("allowed");
    expect(result.sendNow).toBe(true);
    expect(result.scheduledAt).toBeNull();
  });

  it("policyWindow string is formatted correctly", () => {
    const result = enforceQuietHours(base({ attemptedAt: inWindowAttempt }));
    expect(result.policyWindow).toBe("05:00–21:00");
  });

  it("localOrgTime is a non-empty string", () => {
    const result = enforceQuietHours(base({ attemptedAt: inWindowAttempt }));
    expect(result.localOrgTime.length).toBeGreaterThan(0);
  });

  it("no emergency data on allowed result", () => {
    const result = enforceQuietHours(base({ attemptedAt: inWindowAttempt }));
    expect(result.emergencyApproved).toBe(false);
    expect(result.emergencyReason).toBeNull();
    expect(result.emergencyNote).toBeNull();
  });
});

// ── Window boundary tests ─────────────────────────────────────────────────────

describe("enforceQuietHours — window boundaries", () => {
  // Exactly 05:00 AM Chicago (UTC-6) = 11:00 UTC
  const atWindowStart = new Date("2025-01-15T11:00:00Z");
  // Exactly 21:00 (9 PM) Chicago (UTC-6) = 03:00 UTC next day
  const atWindowEnd   = new Date("2025-01-16T03:00:00Z");

  it("allows a send exactly at allowedStartHour (inclusive)", () => {
    const localH = getLocalHour(atWindowStart, "America/Chicago");
    expect(localH).toBe(5); // confirm our fixture is correct
    const result = enforceQuietHours(base({ attemptedAt: atWindowStart }));
    expect(result.action).toBe("allowed");
  });

  it("queues a send exactly at allowedEndHour (exclusive)", () => {
    const localH = getLocalHour(atWindowEnd, "America/Chicago");
    expect(localH).toBe(21); // confirm our fixture is correct
    const result = enforceQuietHours(base({ attemptedAt: atWindowEnd }));
    expect(result.action).toBe("queued");
    expect(result.sendNow).toBe(false);
  });

  it("allows at one minute before end (20:59 local)", () => {
    const oneMinBefore = new Date(atWindowEnd.getTime() - 60_000);
    const result = enforceQuietHours(base({ attemptedAt: oneMinBefore }));
    expect(result.action).toBe("allowed");
  });
});

// ── Queuing behaviour ─────────────────────────────────────────────────────────

describe("enforceQuietHours — queuing outside window", () => {
  // 22:00 Chicago (UTC-6) = 04:00 UTC next calendar day
  const afterWindowUtc = new Date("2025-01-16T04:00:00Z");
  // 03:00 Chicago (UTC-6) = 09:00 UTC same calendar day
  const beforeWindowUtc = new Date("2025-01-15T09:00:00Z");

  it("queues after-window send (22:00 local)", () => {
    const result = enforceQuietHours(base({ attemptedAt: afterWindowUtc }));
    expect(result.action).toBe("queued");
    expect(result.sendNow).toBe(false);
    expect(result.scheduledAt).not.toBeNull();
  });

  it("queues before-window send (03:00 local)", () => {
    const result = enforceQuietHours(base({ attemptedAt: beforeWindowUtc }));
    expect(result.action).toBe("queued");
    expect(result.sendNow).toBe(false);
    expect(result.scheduledAt).not.toBeNull();
  });

  it("scheduledAt for after-window is in the future relative to attemptedAt", () => {
    const result = enforceQuietHours(base({ attemptedAt: afterWindowUtc }));
    expect(result.scheduledAt!.getTime()).toBeGreaterThan(afterWindowUtc.getTime());
  });

  it("scheduledAt for before-window is in the future relative to attemptedAt", () => {
    const result = enforceQuietHours(base({ attemptedAt: beforeWindowUtc }));
    expect(result.scheduledAt!.getTime()).toBeGreaterThan(beforeWindowUtc.getTime());
  });

  it("scheduledAt local hour equals allowedStartHour", () => {
    const result = enforceQuietHours(base({ attemptedAt: afterWindowUtc }));
    const localH = getLocalHour(result.scheduledAt!, DEFAULT_POLICY.timezone);
    expect(localH).toBe(DEFAULT_POLICY.allowedStartHour);
  });
});

// ── All staff roles trigger the policy ───────────────────────────────────────

describe("enforceQuietHours — all staff roles trigger enforcement", () => {
  // 22:00 local (outside window)
  const outsideWindow = new Date("2025-01-16T04:00:00Z");

  for (const role of ["owner", "admin", "coach", "analyst"]) {
    it(`role '${role}' causes queuing outside window`, () => {
      const result = enforceQuietHours(base({ senderRole: role, attemptedAt: outsideWindow }));
      expect(result.action).toBe("queued");
    });
  }
});

// ── Emergency override ────────────────────────────────────────────────────────

describe("enforceQuietHours — emergency override", () => {
  const outsideWindow = new Date("2025-01-16T04:00:00Z"); // 22:00 Chicago

  it("accepts a valid emergency override and sends immediately", () => {
    const result = enforceQuietHours(base({
      attemptedAt:       outsideWindow,
      emergencyOverride: { reason: "medical_emergency", note: "Player collapsed at practice" },
    }));
    expect(result.action).toBe("emergency_send");
    expect(result.sendNow).toBe(true);
    expect(result.scheduledAt).toBeNull();
    expect(result.emergencyApproved).toBe(true);
    expect(result.emergencyReason).toBe("medical_emergency");
    expect(result.emergencyNote).toBe("Player collapsed at practice");
  });

  it("stores trimmed note in result", () => {
    const result = enforceQuietHours(base({
      attemptedAt:       outsideWindow,
      emergencyOverride: { reason: "safety_concern", note: "  Locker room situation  " },
    }));
    expect(result.emergencyNote).toBe("Locker room situation");
  });

  it("all valid emergency reasons are accepted", () => {
    for (const reason of VALID_EMERGENCY_REASONS) {
      const result = enforceQuietHours(base({
        attemptedAt:       outsideWindow,
        emergencyOverride: { reason, note: "Valid emergency note here." },
      }));
      expect(result.action).toBe("emergency_send");
    }
  });

  it("rejects an invalid reason and queues instead", () => {
    const result = enforceQuietHours(base({
      attemptedAt:       outsideWindow,
      emergencyOverride: { reason: "totally_made_up" as any, note: "Some valid note text." },
    }));
    expect(result.action).toBe("queued");
    expect(result.sendNow).toBe(false);
    expect(result.emergencyApproved).toBe(false);
    expect(result.emergencyRejectedReason).not.toBeNull();
    expect(result.emergencyRejectedReason).toContain("totally_made_up");
  });

  it(`rejects a note shorter than ${EMERGENCY_NOTE_MIN_LENGTH} characters`, () => {
    const shortNote = "Too short";  // 9 chars — one below minimum
    expect(shortNote.length).toBe(EMERGENCY_NOTE_MIN_LENGTH - 1);

    const result = enforceQuietHours(base({
      attemptedAt:       outsideWindow,
      emergencyOverride: { reason: "urgent_team_matter", note: shortNote },
    }));
    expect(result.action).toBe("queued");
    expect(result.emergencyRejectedReason).not.toBeNull();
    expect(result.emergencyRejectedReason).toContain(String(EMERGENCY_NOTE_MIN_LENGTH));
  });

  it(`accepts a note of exactly ${EMERGENCY_NOTE_MIN_LENGTH} characters`, () => {
    const exactNote = "x".repeat(EMERGENCY_NOTE_MIN_LENGTH);
    expect(exactNote.length).toBe(EMERGENCY_NOTE_MIN_LENGTH);

    const result = enforceQuietHours(base({
      attemptedAt:       outsideWindow,
      emergencyOverride: { reason: "facility_emergency", note: exactNote },
    }));
    expect(result.action).toBe("emergency_send");
    expect(result.emergencyRejectedReason).toBeNull();
  });

  it("emergency override has no effect when already in window", () => {
    const inWindow = new Date("2025-01-15T16:00:00Z"); // 10am Chicago
    const result = enforceQuietHours(base({
      attemptedAt:       inWindow,
      emergencyOverride: { reason: "medical_emergency", note: "Does not matter" },
    }));
    // Already in window — policy returns 'allowed', not 'emergency_send'
    expect(result.action).toBe("allowed");
  });

  it("emergency override ignored when policy is skipped (non-staff)", () => {
    const result = enforceQuietHours(base({
      senderRole:        "player",
      emergencyOverride: { reason: "medical_emergency", note: "Does not matter" },
    }));
    expect(result.action).toBe("skipped");
    expect(result.emergencyApproved).toBe(false);
  });
});

// ── Timezone edge cases — getNextWindowOpenUtc ────────────────────────────────

describe("getNextWindowOpenUtc — timezone accuracy", () => {
  // Helper: verify that a computed scheduledAt has the correct local hour
  function localHourAt(utc: Date, tz: string) {
    return getLocalHour(utc, tz);
  }

  // America/New_York UTC-5 in January (EST)
  describe("America/New_York (UTC-5)", () => {
    const tz = "America/New_York";

    it("after-window: 10pm local → scheduledAt = next 5am local", () => {
      // 10pm EST Jan 15 = 03:00 UTC Jan 16
      const utcBase = new Date("2025-01-16T03:00:00Z");
      const parts   = getLocalDateParts(utcBase, tz);
      expect(parts.hour).toBe(22); // sanity check

      const scheduledAt = getNextWindowOpenUtc(utcBase, 5, tz);
      expect(localHourAt(scheduledAt, tz)).toBe(5);
      expect(scheduledAt.getTime()).toBeGreaterThan(utcBase.getTime());
    });

    it("before-window: 3am local → scheduledAt = same-day 5am local", () => {
      // 3am EST Jan 15 = 08:00 UTC Jan 15
      const utcBase = new Date("2025-01-15T08:00:00Z");
      const parts   = getLocalDateParts(utcBase, tz);
      expect(parts.hour).toBe(3); // sanity check

      const scheduledAt = getNextWindowOpenUtc(utcBase, 5, tz);
      expect(localHourAt(scheduledAt, tz)).toBe(5);
      // Same UTC day (Jan 15) expected since we need same-day 5am EST = 10am UTC
      expect(scheduledAt.getUTCDate()).toBe(15);
    });

    it("scheduledAt is in the future relative to utcBase (before-window)", () => {
      const utcBase     = new Date("2025-01-15T08:00:00Z"); // 3am EST
      const scheduledAt = getNextWindowOpenUtc(utcBase, 5, tz);
      expect(scheduledAt.getTime()).toBeGreaterThan(utcBase.getTime());
    });
  });

  // America/Chicago UTC-6 in January (CST)
  describe("America/Chicago (UTC-6)", () => {
    const tz = "America/Chicago";

    it("after-window: 22:00 local → scheduledAt local hour = 5", () => {
      const utcBase = new Date("2025-01-16T04:00:00Z"); // 22:00 CST Jan 15
      expect(getLocalDateParts(utcBase, tz).hour).toBe(22);

      const scheduledAt = getNextWindowOpenUtc(utcBase, 5, tz);
      expect(localHourAt(scheduledAt, tz)).toBe(5);
    });

    it("scheduledAt is 11am UTC when 5am Chicago (CST)", () => {
      // 22:00 CST Jan 15 → next open = 5am CST Jan 16 = 11:00 UTC Jan 16
      const utcBase = new Date("2025-01-16T04:00:00Z");
      const scheduledAt = getNextWindowOpenUtc(utcBase, 5, tz);
      // Allow ±1 minute for rounding
      const expectedUtcMs = new Date("2025-01-16T11:00:00Z").getTime();
      expect(Math.abs(scheduledAt.getTime() - expectedUtcMs)).toBeLessThan(60_000);
    });
  });

  // Asia/Kolkata UTC+5:30 — non-whole-hour offset
  describe("Asia/Kolkata (UTC+5:30)", () => {
    const tz = "Asia/Kolkata";

    it("after-window: 11pm IST → scheduledAt local hour = 5", () => {
      // 11pm IST = 17:30 UTC
      const utcBase = new Date("2025-01-15T17:30:00Z");
      expect(getLocalDateParts(utcBase, tz).hour).toBe(23);

      const scheduledAt = getNextWindowOpenUtc(utcBase, 5, tz);
      expect(localHourAt(scheduledAt, tz)).toBe(5);
    });

    it("5am IST is 23:30 UTC previous day — verify minute precision", () => {
      // 11pm IST Jan 15 → next 5am IST Jan 16 = 23:30 UTC Jan 15
      const utcBase     = new Date("2025-01-15T17:30:00Z");
      const scheduledAt = getNextWindowOpenUtc(utcBase, 5, tz);
      const expectedMs  = new Date("2025-01-15T23:30:00Z").getTime();
      // Within 2 minutes (IST offset is exact, so should be exact)
      expect(Math.abs(scheduledAt.getTime() - expectedMs)).toBeLessThan(120_000);
    });
  });

  // UTC itself (UTC+0)
  describe("UTC timezone", () => {
    const tz = "UTC";

    it("after-window: 22:00 UTC → scheduledAt = next day 05:00 UTC", () => {
      const utcBase = new Date("2025-01-15T22:00:00Z");
      expect(getLocalDateParts(utcBase, tz).hour).toBe(22);

      const scheduledAt = getNextWindowOpenUtc(utcBase, 5, tz);
      expect(localHourAt(scheduledAt, tz)).toBe(5);
      const expectedMs = new Date("2025-01-16T05:00:00Z").getTime();
      expect(Math.abs(scheduledAt.getTime() - expectedMs)).toBeLessThan(60_000);
    });

    it("before-window: 03:00 UTC → scheduledAt = same day 05:00 UTC", () => {
      const utcBase = new Date("2025-01-15T03:00:00Z");
      expect(getLocalDateParts(utcBase, tz).hour).toBe(3);

      const scheduledAt = getNextWindowOpenUtc(utcBase, 5, tz);
      const expectedMs  = new Date("2025-01-15T05:00:00Z").getTime();
      expect(Math.abs(scheduledAt.getTime() - expectedMs)).toBeLessThan(60_000);
    });
  });

  // Custom window hours (allowedStartHour != 5)
  describe("custom allowedStartHour", () => {
    const tz = "UTC";

    it("respects custom allowedStartHour = 7", () => {
      const utcBase     = new Date("2025-01-15T23:00:00Z"); // 11pm UTC, after window
      const scheduledAt = getNextWindowOpenUtc(utcBase, 7, tz);
      expect(localHourAt(scheduledAt, tz)).toBe(7);
    });

    it("respects allowedStartHour = 0 (midnight)", () => {
      // 23:00 → midnight next day
      const utcBase     = new Date("2025-01-15T23:00:00Z");
      const scheduledAt = getNextWindowOpenUtc(utcBase, 0, tz);
      expect(localHourAt(scheduledAt, tz)).toBe(0);
    });
  });
});

// ── enforceQuietHours integration with custom policy ─────────────────────────

describe("enforceQuietHours — custom policy window", () => {
  const customPolicy: OrgQuietHoursPolicy = {
    enabled:          true,
    allowedStartHour: 7,
    allowedEndHour:   20,
    timezone:         "UTC",
  };

  it("allows a send within custom window (8am UTC)", () => {
    const result = enforceQuietHours(base({
      policy:      customPolicy,
      attemptedAt: new Date("2025-01-15T08:00:00Z"),
    }));
    expect(result.action).toBe("allowed");
  });

  it("queues a send outside custom window (21:00 UTC)", () => {
    const result = enforceQuietHours(base({
      policy:      customPolicy,
      attemptedAt: new Date("2025-01-15T21:00:00Z"),
    }));
    expect(result.action).toBe("queued");
  });

  it("scheduledAt has correct local hour for custom policy", () => {
    const result = enforceQuietHours(base({
      policy:      customPolicy,
      attemptedAt: new Date("2025-01-15T21:00:00Z"),
    }));
    expect(getLocalHour(result.scheduledAt!, "UTC")).toBe(7);
  });

  it("policyWindow string reflects custom hours", () => {
    const result = enforceQuietHours(base({ policy: customPolicy, attemptedAt: new Date("2025-01-15T08:00:00Z") }));
    expect(result.policyWindow).toBe("07:00–20:00");
  });
});
