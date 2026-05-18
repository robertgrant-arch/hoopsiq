// shared/db/repositories/comms.ts
// Domain repository: comms
// Auto-extracted from shared/db/repository.ts as part of VSA refactor.

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import {
  announcements, waiverTemplates, waiverSignatures,
  type NewAnnouncement, type NewWaiverSignature
} from "../schema";
import type { RepoContext } from "../repository";

export function createCommsRepository(db: Db, ctx: RepoContext) {
  return {
    announcements: {
      /**
       * List announcements visible to a given org role.
       * audienceRoles IS NULL means "everyone"; otherwise the role must appear in the array.
       * This filter runs IN THE DATABASE — never send restricted rows to the client.
       */
      async listForRole(role: string) {
        return db
          .select()
          .from(announcements)
          .where(
            and(
              eq(announcements.orgId, ctx.orgId),
              isNull(announcements.deletedAt),
              sql`(${announcements.audienceRoles} IS NULL OR ${role} = ANY(${announcements.audienceRoles}))`,
            ),
          )
          .orderBy(desc(announcements.publishedAt));
      },
      async create(input: Omit<NewAnnouncement, "orgId" | "authorUserId">) {
        const [row] = await db
          .insert(announcements)
          .values({ ...input, orgId: ctx.orgId, authorUserId: ctx.userId })
          .returning();
        return row;
      },
      async pin(id: string, pinned: boolean) {
        await db
          .update(announcements)
          .set({ pinned, updatedAt: new Date() })
          .where(
            and(
              eq(announcements.id, id),
              eq(announcements.orgId, ctx.orgId),
            ),
          );
      },
      async softDelete(id: string) {
        await db
          .update(announcements)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(announcements.id, id),
              eq(announcements.orgId, ctx.orgId),
            ),
          );
      },
    },
    waivers: {
      async listTemplates() {
        return db
          .select()
          .from(waiverTemplates)
          .where(
            and(
              eq(waiverTemplates.orgId, ctx.orgId),
              isNull(waiverTemplates.deletedAt),
            ),
          );
      },
      async listSignaturesForPlayer(playerId: string) {
        return db
          .select()
          .from(waiverSignatures)
          .where(
            and(
              eq(waiverSignatures.orgId, ctx.orgId),
              eq(waiverSignatures.playerId, playerId),
            ),
          );
      },
      async signWaiver(input: Omit<NewWaiverSignature, "orgId">) {
        // Upsert: if already signed, refresh the timestamp & ip
        const [existing] = await db
          .select({ id: waiverSignatures.id })
          .from(waiverSignatures)
          .where(
            and(
              eq(waiverSignatures.orgId, ctx.orgId),
              eq(waiverSignatures.templateId, input.templateId),
              eq(waiverSignatures.playerId, input.playerId),
              eq(waiverSignatures.signedByUserId, ctx.userId),
            ),
          )
          .limit(1);

        if (existing) {
          const [row] = await db
            .update(waiverSignatures)
            .set({
              status: "signed",
              signedAt: new Date(),
              ipAddress: input.ipAddress,
              userAgent: input.userAgent,
              updatedAt: new Date(),
            })
            .where(eq(waiverSignatures.id, existing.id))
            .returning();
          return row;
        }

        const [row] = await db
          .insert(waiverSignatures)
          .values({ ...input, orgId: ctx.orgId, signedByUserId: ctx.userId })
          .returning();
        return row;
      },
    },
  };
}
