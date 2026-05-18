/**
 * Parent-portal access control.
 *
 * Every /api/parent/* endpoint that touches a specific player calls
 * validateParentChildAccess() before returning data.  This enforces:
 *
 *   1. The requesting user has a player_guardians row for the player.
 *   2. That row is in the same org (defense-in-depth against cross-org leaks).
 *   3. The guardian account has been linked (guardianUserId is not null).
 *
 * This is the server-side enforcement of the "parent can only see their
 * linked child" rule.  Client-side nav filtering is UX only; this is the gate.
 */

import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@shared/db";
import { playerGuardians } from "@shared/db/schema/guardians";
import { HttpError } from "../../auth/tenant";

/**
 * Throws HttpError 403 unless the authenticated guardian has an active
 * player_guardians row linking them to playerId inside orgId.
 *
 * @param orgId          - The org the request is scoped to.
 * @param guardianUserId - The Clerk userId of the authenticated user.
 * @param playerId       - The player being accessed.
 */
export async function validateParentChildAccess(
  orgId: string,
  guardianUserId: string,
  playerId: string,
): Promise<void> {
  const db = getDb();
  const [row] = await db
    .select({ id: playerGuardians.id })
    .from(playerGuardians)
    .where(
      and(
        eq(playerGuardians.orgId, orgId),
        eq(playerGuardians.guardianUserId, guardianUserId),
        eq(playerGuardians.playerId, playerId),
        isNull(playerGuardians.deletedAt),
      ),
    )
    .limit(1);

  if (!row) {
    throw new HttpError(
      403,
      "Access denied: no guardian relationship found for this player.",
    );
  }
}

/**
 * Returns all player IDs the authenticated guardian can access within an org.
 * Used by the parent dashboard to list linked children.
 */
export async function getGuardianPlayerIds(
  orgId: string,
  guardianUserId: string,
): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ playerId: playerGuardians.playerId })
    .from(playerGuardians)
    .where(
      and(
        eq(playerGuardians.orgId, orgId),
        eq(playerGuardians.guardianUserId, guardianUserId),
        isNull(playerGuardians.deletedAt),
      ),
    );
  return rows.map((r) => r.playerId);
}
