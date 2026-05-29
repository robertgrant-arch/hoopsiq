/**
 * Thread-type policy — pure classification and validation logic.
 *
 * This is the second layer of the communications safety stack:
 *
 *   Layer 1 (guardian-policy.ts)   — "Is every minor covered by a guardian?"
 *   Layer 2 (this file)            — "Is the thread structure itself safe?"
 *
 * APPROVED THREAD TYPES
 * ─────────────────────
 *   coach_to_parent               Staff → guardian(s) only; no player recipient
 *   coach_to_minor_with_guardian  Staff → 1 minor + guardian(s) (1:1 protected DM)
 *   coach_to_team_with_adult_copy Staff → team including minors + guardian(s)
 *   staff_internal                Staff → staff only; no athletes or guardians
 *
 * BLOCKED CASES
 * ─────────────
 *   MINOR_WITHOUT_GUARDIAN    Minor in thread but no guardian present (belt-and-suspenders
 *                             after layer 1; should never reach this in normal flow)
 *   SECOND_ADULT_REQUIRED     Team thread with minors; org requires second adult staff
 *                             member but none was supplied
 *
 * PURITY CONTRACT
 * ───────────────
 * No database access.  All inputs are plain data.  The route handler loads
 * the required facts (org settings, audience shape) and passes them in.
 * The route handler is also responsible for persisting the audit row.
 *
 * ORG SETTINGS
 * ────────────
 * Two org-level flags control policy strictness:
 *   requireAllGuardians              (default true)  — all file guardians included, not just primary
 *   requireSecondAdultForTeamThreads (default false) — team+minor threads need extra staff witness
 *
 * Settings are stored in orgs.payload.messagingPolicy (JSONB).
 * Use parseOrgMessagingSettings() to read them safely.
 */

import { isStaffRole } from "./guardian-policy";

// ── Approved thread types ─────────────────────────────────────────────────────

export type ApprovedThreadType =
  | "coach_to_parent"
  | "coach_to_minor_with_guardian"
  | "coach_to_team_with_adult_copy"
  | "staff_internal";

export type LegacyThreadType = "broadcast" | "dm" | "parent_dm" | "staff";

/** Union of every value accepted by the thread_type DB enum. */
export type AllThreadType = ApprovedThreadType | LegacyThreadType;

export const APPROVED_THREAD_TYPES: readonly ApprovedThreadType[] = [
  "coach_to_parent",
  "coach_to_minor_with_guardian",
  "coach_to_team_with_adult_copy",
  "staff_internal",
];

/**
 * Legacy types that are UNSAFE when used for staff→minor communication.
 * If these are requested and minors are present, the engine will either
 * reclassify to the correct approved type or block.
 */
export const UNSAFE_LEGACY_TYPES_FOR_MINORS: readonly string[] = ["dm", "broadcast"];

// ── Org messaging settings ────────────────────────────────────────────────────

export interface OrgMessagingSettings {
  /**
   * When true, ALL active guardians on file must be included in any staff →
   * minor communication, not just the primary guardian.
   * Default: true (most protective).
   */
  requireAllGuardians: boolean;
  /**
   * When true, team threads that include minor athletes require a second adult
   * staff member (e.g. assistant coach) on the thread in addition to the
   * sender.  Provides an extra witness for group communications with minors.
   * Default: false (most common setting for single-coach programs).
   */
  requireSecondAdultForTeamThreads: boolean;
}

export const DEFAULT_ORG_SETTINGS: Readonly<OrgMessagingSettings> = {
  requireAllGuardians:              true,
  requireSecondAdultForTeamThreads: false,
};

/**
 * Safely reads org messaging settings from the `orgs.payload` JSONB blob.
 * Missing or malformed fields fall back to DEFAULT_ORG_SETTINGS values.
 *
 * @example
 * ```ts
 * const [org] = await getDb().select({ payload: orgs.payload }).from(orgs).where(...);
 * const settings = parseOrgMessagingSettings(org?.payload);
 * ```
 */
export function parseOrgMessagingSettings(payload: unknown): OrgMessagingSettings {
  if (!payload || typeof payload !== "object") return { ...DEFAULT_ORG_SETTINGS };
  const p  = payload as Record<string, unknown>;
  const mp = (typeof p.messagingPolicy === "object" && p.messagingPolicy !== null
    ? p.messagingPolicy
    : {}) as Record<string, unknown>;

  return {
    requireAllGuardians:
      typeof mp.requireAllGuardians === "boolean"
        ? mp.requireAllGuardians
        : DEFAULT_ORG_SETTINGS.requireAllGuardians,
    requireSecondAdultForTeamThreads:
      typeof mp.requireSecondAdultForTeamThreads === "boolean"
        ? mp.requireSecondAdultForTeamThreads
        : DEFAULT_ORG_SETTINGS.requireSecondAdultForTeamThreads,
  };
}

// ── Thread badge types ────────────────────────────────────────────────────────

/**
 * UI badge keys emitted by the classifier.  Each key maps to a badge
 * component in ThreadTypeBadge.tsx.
 *
 *   minor_protected     — thread contains a minor; guardian copy is active
 *   guardian_included   — at least one guardian has been added to the thread
 *   second_adult_included — a second adult staff member is on the thread
 */
export type ThreadBadge = "minor_protected" | "guardian_included" | "second_adult_included";

// ── Policy input / output ─────────────────────────────────────────────────────

export interface ThreadClassificationInput {
  /** Org role of the sender (from org_members.role). */
  senderRole:             string;
  /** True when at least one player in the resolved audience is a minor. */
  hasMinorRecipients:     boolean;
  /** True when at least one guardian is in the resolved audience. */
  hasGuardianRecipients:  boolean;
  /** True when at least one player (minor or adult) is in the audience. */
  hasPlayerRecipients:    boolean;
  /** True when more than one player is in the audience (team send vs. 1:1). */
  isTeamThread:           boolean;
  /**
   * True when the audience has NO player and NO guardian recipients.
   * This identifies a staff-only internal thread.
   */
  staffOnly:              boolean;
  /**
   * Clerk user IDs of additional staff members explicitly added to the thread
   * beyond the sender.  Used for the "second adult" requirement on team threads.
   * Pass an empty array when none are added.
   */
  secondAdultUserIds:     string[];
  /** Org messaging settings (loaded from orgs.payload.messagingPolicy). */
  orgSettings:            OrgMessagingSettings;
}

export interface ThreadClassificationResult {
  /** Whether the thread creation should proceed. */
  allowed:              boolean;
  /**
   * The thread type to store in the DB.
   * null only when the sender is non-staff (no classification applied).
   */
  threadType:           AllThreadType | null;
  /** Human-readable block reason, or null when allowed. */
  blockedReason:        string | null;
  /** Machine-readable error code for client error handling. */
  blockedCode:          string | null;
  /** Ordered list of UI badge keys to display on this thread. */
  badges:               ThreadBadge[];
  /**
   * True when the org setting requires a second adult and the current request
   * did not supply one.  Used to show the "add second adult" prompt in UI even
   * after the block — so the user knows exactly what is needed.
   */
  requiresSecondAdult:  boolean;
}

// ── Audit snapshot ────────────────────────────────────────────────────────────

/**
 * Minimal shape of the context fields to be stored in
 * thread_type_policy_log.  Build from ThreadClassificationInput after the
 * call so the full result is also available.
 */
export interface ThreadTypePolicyAudit {
  senderRole:             string;
  hasMinorRecipients:     boolean;
  hasGuardianRecipients:  boolean;
  isTeamThread:           boolean;
  secondAdultPresent:     boolean;
  allowed:                boolean;
  blockedReason:          string | null;
  blockedCode:            string | null;
  badges:                 ThreadBadge[];
  classifiedType:         string | null;
  orgSettingsSnapshot:    OrgMessagingSettings;
}

export function buildPolicyAudit(
  input: ThreadClassificationInput,
  result: ThreadClassificationResult,
): ThreadTypePolicyAudit {
  return {
    senderRole:            input.senderRole,
    hasMinorRecipients:    input.hasMinorRecipients,
    hasGuardianRecipients: input.hasGuardianRecipients,
    isTeamThread:          input.isTeamThread,
    secondAdultPresent:    input.secondAdultUserIds.length > 0,
    allowed:               result.allowed,
    blockedReason:         result.blockedReason,
    blockedCode:           result.blockedCode,
    badges:                result.badges,
    classifiedType:        result.threadType,
    orgSettingsSnapshot:   input.orgSettings,
  };
}

// ── Core classification function ──────────────────────────────────────────────

/**
 * Classifies the structural type of a pending thread and validates that it
 * is safe to create given the participant set and org policy settings.
 *
 * Call this AFTER the guardian-copy policy (guardian-policy.ts) has already
 * run, so the audience already includes any auto-added guardians.
 *
 * @example
 * ```ts
 * // After guardian policy:
 * const classification = classifyThreadType({
 *   senderRole:            ctx.role,
 *   hasMinorRecipients:    policy.minorPlayerIds.length > 0,
 *   hasGuardianRecipients: finalGuardians.length > 0,
 *   hasPlayerRecipients:   audience.players.length > 0,
 *   isTeamThread:          audience.players.length > 1,
 *   staffOnly:             audience.players.length === 0 && finalGuardians.length === 0,
 *   secondAdultUserIds:    req.body.secondAdultUserIds ?? [],
 *   orgSettings,
 * });
 *
 * if (!classification.allowed) {
 *   return res.status(422).json({ error: classification.blockedReason, code: classification.blockedCode });
 * }
 * // Use classification.threadType for DB insert
 * ```
 */
export function classifyThreadType(
  input: ThreadClassificationInput,
): ThreadClassificationResult {
  const {
    senderRole,
    hasMinorRecipients,
    hasGuardianRecipients,
    hasPlayerRecipients,
    isTeamThread,
    staffOnly,
    secondAdultUserIds,
    orgSettings,
  } = input;

  const secondAdultPresent = secondAdultUserIds.length > 0;

  // ── Non-staff bypass ───────────────────────────────────────────────────────
  // Players and guardians messaging each other are not subject to thread type
  // enforcement.  Return null type so the caller uses its own default.
  if (!isStaffRole(senderRole)) {
    return {
      allowed:             true,
      threadType:          null,
      blockedReason:       null,
      blockedCode:         null,
      badges:              [],
      requiresSecondAdult: false,
    };
  }

  // ── Case 1: Staff-internal ─────────────────────────────────────────────────
  // No player recipients, no guardian recipients — pure staff comms.
  if (staffOnly) {
    return {
      allowed:             true,
      threadType:          "staff_internal",
      blockedReason:       null,
      blockedCode:         null,
      badges:              secondAdultPresent ? ["second_adult_included"] : [],
      requiresSecondAdult: false,
    };
  }

  // ── Case 2: Coach → parent (guardian-only audience) ───────────────────────
  // No player in the thread; sender is reaching guardians directly.
  if (hasGuardianRecipients && !hasPlayerRecipients) {
    return {
      allowed:             true,
      threadType:          "coach_to_parent",
      blockedReason:       null,
      blockedCode:         null,
      badges:              ["guardian_included"],
      requiresSecondAdult: false,
    };
  }

  // ── Cases 3 & 4: Thread includes minor recipients ─────────────────────────
  if (hasMinorRecipients) {
    // Belt-and-suspenders: guardian MUST be in the audience.
    // Layer 1 (guardian-policy) should have already enforced this; this check
    // ensures the invariant holds even if the compose path is bypassed.
    if (!hasGuardianRecipients) {
      return {
        allowed:             false,
        threadType:          null,
        blockedReason:
          "This thread includes a minor athlete but no parent or guardian is copied. " +
          "All staff communications involving minor athletes must include a guardian. " +
          "Use the compose flow to send — guardians will be added automatically.",
        blockedCode:         "MINOR_WITHOUT_GUARDIAN",
        badges:              [],
        requiresSecondAdult: false,
      };
    }

    // ── Case 4: Team thread (multiple players) ───────────────────────────────
    if (isTeamThread) {
      const needsSecondAdult = orgSettings.requireSecondAdultForTeamThreads;

      if (needsSecondAdult && !secondAdultPresent) {
        return {
          allowed:             false,
          threadType:          null,
          blockedReason:
            "Your organization requires a second adult staff member (such as an assistant " +
            "coach) on any team communication that includes minor athletes. " +
            "Ask your program administrator to add a second staff member to this thread.",
          blockedCode:         "SECOND_ADULT_REQUIRED",
          badges:              [],
          requiresSecondAdult: true,
        };
      }

      const badges: ThreadBadge[] = ["minor_protected", "guardian_included"];
      if (secondAdultPresent) badges.push("second_adult_included");

      return {
        allowed:             true,
        threadType:          "coach_to_team_with_adult_copy",
        blockedReason:       null,
        blockedCode:         null,
        badges,
        requiresSecondAdult: needsSecondAdult,
      };
    }

    // ── Case 3: 1:1 or small group — single minor + guardian ────────────────
    const badges: ThreadBadge[] = ["minor_protected", "guardian_included"];
    if (secondAdultPresent) badges.push("second_adult_included");

    return {
      allowed:             true,
      threadType:          "coach_to_minor_with_guardian",
      blockedReason:       null,
      blockedCode:         null,
      badges,
      requiresSecondAdult: false,
    };
  }

  // ── Case 5: Adult-only players, no minors ─────────────────────────────────
  // No safety concern.  Use the standard broadcast type.
  // Guardians may be present (mode=both with adults) — that is fine.
  const badges: ThreadBadge[] = hasGuardianRecipients ? ["guardian_included"] : [];
  return {
    allowed:             true,
    threadType:          "broadcast",
    blockedReason:       null,
    blockedCode:         null,
    badges,
    requiresSecondAdult: false,
  };
}
