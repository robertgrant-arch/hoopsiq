// shared/db/repositories/roster.ts
// Domain repository: roster
// Auto-extracted from shared/db/repository.ts as part of VSA refactor.

import { and, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import {
  orgMembers, players,
  type NewPlayer
} from "../schema";
import type { RepoContext } from "../repository";

export function createRosterRepository(db: Db, ctx: RepoContext) {
  return {
    orgMembers: {
      async getMembership() {
        const rows = await db
          .select()
          .from(orgMembers)
          .where(
            and(
              eq(orgMembers.orgId, ctx.orgId),
              eq(orgMembers.userId, ctx.userId),
              isNull(orgMembers.deletedAt),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
    },
    players: {
      async list(opts: { limit?: number; offset?: number } = {}) {
        const limit = Math.min(opts.limit ?? 100, 500);
        const offset = opts.offset ?? 0;
        return db
          .select()
          .from(players)
          .where(and(eq(players.orgId, ctx.orgId), isNull(players.deletedAt)))
          .orderBy(players.name)
          .limit(limit)
          .offset(offset);
      },
      async listActive() {
        return db
          .select()
          .from(players)
          .where(
            and(
              eq(players.orgId, ctx.orgId),
              eq(players.status, "active"),
              isNull(players.deletedAt),
            ),
          )
          .orderBy(players.name);
      },
      async getById(id: string) {
        const rows = await db
          .select()
          .from(players)
          .where(
            and(
              eq(players.id, id),
              eq(players.orgId, ctx.orgId),
              isNull(players.deletedAt),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
      async create(input: Omit<NewPlayer, "orgId">) {
        const [row] = await db
          .insert(players)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async update(
        id: string,
        patch: Partial<
          Pick<
            typeof players.$inferInsert,
            | "name"
            | "position"
            | "jerseyNumber"
            | "grade"
            | "status"
            | "role"
            | "height"
            | "weight"
            | "parentGuardianName"
            | "parentGuardianEmail"
            | "medicalNotes"
          >
        >,
      ) {
        await db
          .update(players)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(players.id, id), eq(players.orgId, ctx.orgId)));
      },
      async softDelete(id: string) {
        await db
          .update(players)
          .set({ deletedAt: new Date() })
          .where(and(eq(players.id, id), eq(players.orgId, ctx.orgId)));
      },
    },
  };
}
