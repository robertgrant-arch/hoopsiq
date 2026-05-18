// shared/db/repositories/idp.ts
// Domain repository: idp
// Auto-extracted from shared/db/repository.ts as part of VSA refactor.

import { and, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import {
  idpFocusAreas, idpMilestones, idpDrillLinks, idpComments, coachingActions,
  type NewIdpFocusArea, type NewIdpMilestone, type NewIdpDrillLink, type NewIdpComment, type NewCoachingAction
} from "../schema";
import type { RepoContext } from "../repository";

export function createIdpRepository(db: Db, ctx: RepoContext) {
  return {
    idpFocusAreas: {
      async listForIdp(idpId: string) {
        return db
          .select()
          .from(idpFocusAreas)
          .where(
            and(
              eq(idpFocusAreas.idpId, idpId),
              eq(idpFocusAreas.orgId, ctx.orgId),
              isNull(idpFocusAreas.deletedAt),
            ),
          )
          .orderBy(idpFocusAreas.priority);
      },
      async listForPlayer(playerId: string) {
        return db
          .select()
          .from(idpFocusAreas)
          .where(
            and(
              eq(idpFocusAreas.playerId, playerId),
              eq(idpFocusAreas.orgId, ctx.orgId),
              isNull(idpFocusAreas.deletedAt),
            ),
          )
          .orderBy(idpFocusAreas.priority);
      },
      async create(input: Omit<NewIdpFocusArea, "orgId">) {
        const [row] = await db
          .insert(idpFocusAreas)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async update(
        id: string,
        patch: Partial<
          Pick<
            typeof idpFocusAreas.$inferInsert,
            | "priority"
            | "category"
            | "subSkill"
            | "emoji"
            | "currentScore"
            | "targetScore"
            | "deadline"
            | "status"
            | "coachNotes"
          >
        >,
      ) {
        await db
          .update(idpFocusAreas)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(idpFocusAreas.id, id), eq(idpFocusAreas.orgId, ctx.orgId)));
      },
      async softDelete(id: string) {
        await db
          .update(idpFocusAreas)
          .set({ deletedAt: new Date() })
          .where(and(eq(idpFocusAreas.id, id), eq(idpFocusAreas.orgId, ctx.orgId)));
      },
    },
    idpMilestones: {
      async listForFocusArea(focusAreaId: string) {
        return db
          .select()
          .from(idpMilestones)
          .where(
            and(
              eq(idpMilestones.focusAreaId, focusAreaId),
              eq(idpMilestones.orgId, ctx.orgId),
            ),
          )
          .orderBy(idpMilestones.createdAt);
      },
      async create(input: Omit<NewIdpMilestone, "orgId">) {
        const [row] = await db
          .insert(idpMilestones)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async complete(id: string) {
        await db
          .update(idpMilestones)
          .set({ completedAt: new Date() })
          .where(and(eq(idpMilestones.id, id), eq(idpMilestones.orgId, ctx.orgId)));
      },
      async unComplete(id: string) {
        await db
          .update(idpMilestones)
          .set({ completedAt: null })
          .where(and(eq(idpMilestones.id, id), eq(idpMilestones.orgId, ctx.orgId)));
      },
    },
    idpDrillLinks: {
      async listForFocusArea(focusAreaId: string) {
        return db
          .select()
          .from(idpDrillLinks)
          .where(
            and(
              eq(idpDrillLinks.focusAreaId, focusAreaId),
              eq(idpDrillLinks.orgId, ctx.orgId),
              isNull(idpDrillLinks.deletedAt),
            ),
          )
          .orderBy(idpDrillLinks.createdAt);
      },
      async create(input: Omit<NewIdpDrillLink, "orgId">) {
        const [row] = await db
          .insert(idpDrillLinks)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async softDelete(id: string) {
        await db
          .update(idpDrillLinks)
          .set({ deletedAt: new Date() })
          .where(and(eq(idpDrillLinks.id, id), eq(idpDrillLinks.orgId, ctx.orgId)));
      },
    },
    idpComments: {
      async listForIdp(idpId: string) {
        return db
          .select()
          .from(idpComments)
          .where(
            and(
              eq(idpComments.idpId, idpId),
              eq(idpComments.orgId, ctx.orgId),
              isNull(idpComments.deletedAt),
            ),
          )
          .orderBy(desc(idpComments.createdAt));
      },
      async create(input: Omit<NewIdpComment, "orgId" | "authorUserId">) {
        const [row] = await db
          .insert(idpComments)
          .values({ ...input, orgId: ctx.orgId, authorUserId: ctx.userId })
          .returning();
        return row;
      },
      async softDelete(id: string) {
        await db
          .update(idpComments)
          .set({ deletedAt: new Date() })
          .where(and(eq(idpComments.id, id), eq(idpComments.orgId, ctx.orgId)));
      },
    },
    coachingActions: {
      async listForSession(sessionId: string) {
        return db
          .select()
          .from(coachingActions)
          .where(and(eq(coachingActions.sessionId, sessionId), eq(coachingActions.orgId, ctx.orgId)))
          .orderBy(desc(coachingActions.createdAt));
      },
      async listForPlayer(playerId: string, limit = 50) {
        return db
          .select()
          .from(coachingActions)
          .where(and(eq(coachingActions.playerId, playerId), eq(coachingActions.orgId, ctx.orgId)))
          .orderBy(desc(coachingActions.createdAt))
          .limit(Math.min(limit, 200));
      },
      async listOpen() {
        return db
          .select()
          .from(coachingActions)
          .where(
            and(
              eq(coachingActions.orgId, ctx.orgId),
              eq(coachingActions.status, "open"),
            ),
          )
          .orderBy(desc(coachingActions.createdAt));
      },
      async create(input: Omit<NewCoachingAction, "orgId" | "authorUserId">) {
        const [row] = await db
          .insert(coachingActions)
          .values({ ...input, orgId: ctx.orgId, authorUserId: ctx.userId })
          .returning();
        return row;
      },
      async updateStatus(
        id: string,
        status: "open" | "in_progress" | "resolved" | "dismissed",
        patch?: { assignmentId?: string; idpFocusAreaId?: string; followUpSessionId?: string; resolvedNote?: string },
      ) {
        await db
          .update(coachingActions)
          .set({
            status,
            updatedAt: new Date(),
            ...(status === "resolved" ? { resolvedAt: new Date() } : {}),
            ...patch,
          })
          .where(and(eq(coachingActions.id, id), eq(coachingActions.orgId, ctx.orgId)));
      },
    },
  };
}
