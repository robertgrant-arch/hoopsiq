// shared/db/repositories/player-notes.ts
// Domain repository: player-notes
// Auto-extracted from shared/db/repository.ts as part of VSA refactor.

import { and, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import {
  playerNotes, skillAssessments, injuryRecords,
  type NewPlayerNote, type NewSkillAssessment, type NewInjuryRecord
} from "../schema";
import type { RepoContext } from "../repository";

export function createPlayerNotesRepository(db: Db, ctx: RepoContext) {
  return {
    playerNotes: {
      async listForPlayer(playerId: string, limit = 50) {
        return db
          .select()
          .from(playerNotes)
          .where(
            and(
              eq(playerNotes.orgId, ctx.orgId),
              eq(playerNotes.playerId, playerId),
              isNull(playerNotes.deletedAt),
            ),
          )
          .orderBy(desc(playerNotes.createdAt))
          .limit(Math.min(limit, 200));
      },
      async create(input: Omit<NewPlayerNote, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(playerNotes)
          .values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId })
          .returning();
        return row;
      },
      async softDelete(id: string) {
        await db
          .update(playerNotes)
          .set({ deletedAt: new Date() })
          .where(and(eq(playerNotes.id, id), eq(playerNotes.orgId, ctx.orgId)));
      },
      async togglePin(id: string, isPinned: boolean) {
        await db
          .update(playerNotes)
          .set({ isPinned, updatedAt: new Date() })
          .where(and(eq(playerNotes.id, id), eq(playerNotes.orgId, ctx.orgId)));
      },
    },
    skillAssessments: {
      async listForPlayer(playerId: string, limit = 100) {
        return db
          .select()
          .from(skillAssessments)
          .where(
            and(
              eq(skillAssessments.orgId, ctx.orgId),
              eq(skillAssessments.playerId, playerId),
            ),
          )
          .orderBy(desc(skillAssessments.assessedAt))
          .limit(Math.min(limit, 500));
      },
      async create(input: Omit<NewSkillAssessment, "orgId" | "assessedByUserId">) {
        const [row] = await db
          .insert(skillAssessments)
          .values({ ...input, orgId: ctx.orgId, assessedByUserId: ctx.userId })
          .returning();
        return row;
      },
    },
    injuries: {
      async listActive() {
        return db
          .select()
          .from(injuryRecords)
          .where(
            and(
              eq(injuryRecords.orgId, ctx.orgId),
              isNull(injuryRecords.deletedAt),
            ),
          )
          .orderBy(desc(injuryRecords.injuredAt));
      },
    },
    injuryRecords: {
      async listForPlayer(playerId: string) {
        return db
          .select()
          .from(injuryRecords)
          .where(
            and(
              eq(injuryRecords.orgId, ctx.orgId),
              eq(injuryRecords.playerId, playerId),
              isNull(injuryRecords.deletedAt),
            ),
          )
          .orderBy(desc(injuryRecords.injuredAt));
      },
      async create(input: Omit<NewInjuryRecord, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(injuryRecords)
          .values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId })
          .returning();
        return row;
      },
      async update(
        id: string,
        patch: Partial<
          Pick<
            typeof injuryRecords.$inferInsert,
            "status" | "restrictions" | "expectedReturnAt" | "clearedAt" | "clearanceNotes"
          >
        >,
      ) {
        await db
          .update(injuryRecords)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(injuryRecords.id, id), eq(injuryRecords.orgId, ctx.orgId)));
      },
      async softDelete(id: string) {
        await db
          .update(injuryRecords)
          .set({ deletedAt: new Date() })
          .where(and(eq(injuryRecords.id, id), eq(injuryRecords.orgId, ctx.orgId)));
      },
    },
  };
}
