// shared/db/repositories/guardian.ts
// Domain repository: guardian
// Auto-extracted from shared/db/repository.ts as part of VSA refactor.

import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import {
  playerGuardians
} from "../schema";
import type { RepoContext } from "../repository";

export function createGuardianRepository(db: Db, ctx: RepoContext) {
  return {
    guardians: {
      /** All guardian rows for a specific player (coach / admin view). */
      async listForPlayer(playerId: string) {
        return db
          .select()
          .from(playerGuardians)
          .where(
            and(
              eq(playerGuardians.orgId, ctx.orgId),
              eq(playerGuardians.playerId, playerId),
              isNull(playerGuardians.deletedAt),
            ),
          );
      },
      /** All players the authenticated guardian user can access. */
      async listPlayersForGuardian(guardianUserId: string) {
        return db
          .select()
          .from(playerGuardians)
          .where(
            and(
              eq(playerGuardians.orgId, ctx.orgId),
              eq(playerGuardians.guardianUserId, guardianUserId),
              isNull(playerGuardians.deletedAt),
            ),
          );
      },
      /** Single access-check: returns the row or null. */
      async findRelationship(guardianUserId: string, playerId: string) {
        const [row] = await db
          .select()
          .from(playerGuardians)
          .where(
            and(
              eq(playerGuardians.orgId, ctx.orgId),
              eq(playerGuardians.guardianUserId, guardianUserId),
              eq(playerGuardians.playerId, playerId),
              isNull(playerGuardians.deletedAt),
            ),
          )
          .limit(1);
        return row ?? null;
      },
      async linkUser(guardianId: string, guardianUserId: string) {
        await db
          .update(playerGuardians)
          .set({ guardianUserId })
          .where(
            and(
              eq(playerGuardians.id, guardianId),
              eq(playerGuardians.orgId, ctx.orgId),
            ),
          );
      },
    },
  };
}
