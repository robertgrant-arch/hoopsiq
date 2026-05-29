/**
 * Guardian-copy messaging policy — pure enforcement logic.
 *
 * BUSINESS RULES IMPLEMENTED
 * ──────────────────────────
 * 1. If the sender is a coach/staff member and any targeted player is a minor,
 *    every active guardian for that minor MUST be included in the thread.
 * 2. If a minor has no valid guardian on file (active, canReceiveMessages,
 *    with at least one contact method), the send is BLOCKED entirely.
 * 3. Guardians that are already in the resolved audience are not added again.
 * 4. Non-staff senders (players, guardians, viewers) bypass this policy.
 *
 * PURITY CONTRACT
 * ───────────────
 * This module is intentionally free of database calls and side effects so that
 * it can be unit-tested without any infrastructure.  The route handler is
 * responsible for loading the required data and persisting the audit row.
 *
 * AUDIT CONTRACT
 * ──────────────
 * Every PolicyResult carries an `audit` object that maps directly to the
 * columns of `messaging_policy_log`.  The caller MUST persist it after every
 * enforcement call, whether the result is allowed or blocked.
 */

import type { Player }         from "@shared/db/schema/players";
import type { PlayerGuardian } from "@shared/db/schema/guardians";

// ── Role classification ───────────────────────────────────────────────────────

/**
 * Org-level roles that are considered "staff" for the purposes of this policy.
 * Players and guardians messaging each other are not covered.
 */
export const STAFF_ROLES = ["owner", "admin", "coach", "analyst"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(role: string): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

// ── Input / output types ──────────────────────────────────────────────────────

/**
 * Minimal guardian shape the policy engine needs from the resolved audience.
 * Matches the shape produced by recipient-resolver.ts (ResolvedGuardian).
 */
export interface PolicyGuardian {
  guardianId: string;
  playerId:   string;
  playerName: string;
  name:       string;
  email:      string | null;
  phone:      string | null;
}

export interface PolicyInput {
  /** Org role of the sender (from org_members.role). */
  senderRole: string;
  /**
   * Player IDs that are explicitly targeted by this message.
   * Used to identify which players need guardian-copy checks.
   */
  targetPlayerIds: string[];
  /**
   * Full active player roster for the org (used to look up isMinor).
   * Only players matching targetPlayerIds are evaluated.
   */
  allPlayers: Player[];
  /**
   * All active guardians for the org (used to find coverage for minors).
   */
  allGuardians: PlayerGuardian[];
  /**
   * Guardian IDs already present in the resolved audience.
   * These are excluded from `guardiansToAdd` to prevent duplicates.
   */
  existingGuardianIds: string[];
}

export interface PolicyAudit {
  minorPresent:       boolean;
  guardiansAdded:     string[];       // guardian IDs
  participantsBefore: string[];       // player + existing guardian IDs
  participantsAfter:  string[];       // after auto-injected guardian IDs merged
  blockedReason:      string | null;
}

export type PolicyAction = "allowed" | "blocked" | "guardian_auto_included";

export interface PolicyResult {
  /** Whether the send should proceed. */
  allowed:         boolean;
  /** Human-readable reason for blocking, or null when allowed. */
  blockedReason:   string | null;
  /** The determined action — used to write the audit log enum column. */
  action:          PolicyAction;
  /**
   * Guardian records that must be injected into the audience before
   * the message is created.  Empty when no auto-inclusion is needed.
   */
  guardiansToAdd:  PolicyGuardian[];
  /** Player IDs that were identified as minors. */
  minorPlayerIds:  string[];
  /** Ready-to-persist audit payload for messaging_policy_log. */
  audit:           PolicyAudit;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * A "valid" guardian for policy purposes must:
 *   1. Not be soft-deleted.
 *   2. Have canReceiveMessages = true.
 *   3. Have at least one contact method (email or phone).
 */
function isValidGuardian(g: PlayerGuardian): boolean {
  return (
    !g.deletedAt &&
    g.canReceiveMessages &&
    !!(g.email || g.phone)
  );
}

function toPolicy(g: PlayerGuardian, playerName: string): PolicyGuardian {
  return {
    guardianId: g.id,
    playerId:   g.playerId,
    playerName,
    name:       g.name,
    email:      g.email ?? null,
    phone:      g.phone ?? null,
  };
}

// ── Core enforcement function ─────────────────────────────────────────────────

/**
 * Evaluates the guardian-copy policy for a pending message send.
 *
 * Call this AFTER resolving the audience but BEFORE persisting any DB rows.
 * If `result.allowed === false`, abort the send and return `result.blockedReason`
 * to the client as a 422.
 * If `result.guardiansToAdd.length > 0`, merge them into the audience before
 * inserting message_recipients rows.
 * Always persist `result.audit` as a messaging_policy_log row.
 *
 * @example
 * ```ts
 * const policy = enforceGuardianPolicy({ senderRole, targetPlayerIds, ... });
 * await db.insert(messagingPolicyLog).values({ ...policy.audit, senderId, orgId });
 * if (!policy.allowed) return res.status(422).json({ error: policy.blockedReason, code: "GUARDIAN_REQUIRED" });
 * const enrichedAudience = mergeGuardians(audience, policy.guardiansToAdd);
 * ```
 */
export function enforceGuardianPolicy(input: PolicyInput): PolicyResult {
  const {
    senderRole,
    targetPlayerIds,
    allPlayers,
    allGuardians,
    existingGuardianIds,
  } = input;

  // ── Fast path: non-staff senders are not subject to this policy ─────────────
  if (!isStaffRole(senderRole)) {
    return {
      allowed:        true,
      blockedReason:  null,
      action:         "allowed",
      guardiansToAdd: [],
      minorPlayerIds: [],
      audit: {
        minorPresent:       false,
        guardiansAdded:     [],
        participantsBefore: targetPlayerIds,
        participantsAfter:  targetPlayerIds,
        blockedReason:      null,
      },
    };
  }

  // ── Identify minor players in the target set ──────────────────────────────
  const targetSet    = new Set(targetPlayerIds);
  const targetPlayers = allPlayers.filter(
    (p) => targetSet.has(p.id) && !p.deletedAt && p.status !== "inactive"
  );

  const minors = targetPlayers.filter((p) => p.isMinor);

  // ── Fast path: no minors → policy is satisfied trivially ──────────────────
  if (minors.length === 0) {
    return {
      allowed:        true,
      blockedReason:  null,
      action:         "allowed",
      guardiansToAdd: [],
      minorPlayerIds: [],
      audit: {
        minorPresent:       false,
        guardiansAdded:     [],
        participantsBefore: targetPlayerIds,
        participantsAfter:  targetPlayerIds,
        blockedReason:      null,
      },
    };
  }

  // ── Check guardian coverage for every minor ───────────────────────────────
  const alreadyCovered = new Set(existingGuardianIds);
  const guardiansToAdd: PolicyGuardian[] = [];
  const minorPlayerIds: string[] = minors.map((p) => p.id);

  for (const minor of minors) {
    const validGuardians = allGuardians.filter(
      (g) => g.playerId === minor.id && isValidGuardian(g)
    );

    if (validGuardians.length === 0) {
      // No reachable guardian → BLOCK the entire send.
      const reason =
        `Cannot send to ${minor.name}: no guardian with a valid contact method is on file. ` +
        `Add a guardian with email or phone before messaging this athlete.`;

      const participantsBefore = [...targetPlayerIds, ...existingGuardianIds];

      return {
        allowed:        false,
        blockedReason:  reason,
        action:         "blocked",
        guardiansToAdd: [],
        minorPlayerIds,
        audit: {
          minorPresent:       true,
          guardiansAdded:     [],
          participantsBefore,
          participantsAfter:  participantsBefore, // nothing changed — send was blocked
          blockedReason:      reason,
        },
      };
    }

    // Collect guardians not yet in the audience
    for (const g of validGuardians) {
      if (!alreadyCovered.has(g.id)) {
        guardiansToAdd.push(toPolicy(g, minor.name));
        alreadyCovered.add(g.id); // avoid duplicating across multiple minors sharing a guardian
      }
    }
  }

  // ── All minors are covered — build final audit payload ────────────────────
  const participantsBefore = [...targetPlayerIds, ...existingGuardianIds];
  const addedIds           = guardiansToAdd.map((g) => g.guardianId);
  const participantsAfter  = [...participantsBefore, ...addedIds];

  const action: PolicyAction =
    guardiansToAdd.length > 0 ? "guardian_auto_included" : "allowed";

  return {
    allowed:        true,
    blockedReason:  null,
    action,
    guardiansToAdd,
    minorPlayerIds,
    audit: {
      minorPresent:       true,
      guardiansAdded:     addedIds,
      participantsBefore,
      participantsAfter,
      blockedReason:      null,
    },
  };
}
