// shared/db/repositories/practice.ts
// Domain repository: practice
// Auto-extracted from shared/db/repository.ts as part of VSA refactor.

import { and, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import {
  practicePlans,
  type NewPracticePlan
} from "../schema";
import type { RepoContext } from "../repository";

export function createPracticeRepository(db: Db, ctx: RepoContext) {
  return {
    practicePlans: {
      async list(opts: { limit?: number } = {}) {
        const limit = Math.min(opts.limit ?? 50, 200);
        return db
          .select()
          .from(practicePlans)
          .where(
            and(eq(practicePlans.orgId, ctx.orgId), isNull(practicePlans.deletedAt)),
          )
          .orderBy(desc(practicePlans.createdAt))
          .limit(limit);
      },
      async getById(id: string) {
        const rows = await db
          .select()
          .from(practicePlans)
          .where(
            and(
              eq(practicePlans.id, id),
              eq(practicePlans.orgId, ctx.orgId),
              isNull(practicePlans.deletedAt),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
      async create(input: Omit<NewPracticePlan, "orgId">) {
        const [row] = await db
          .insert(practicePlans)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async update(
        id: string,
        patch: Partial<
          Pick<
            typeof practicePlans.$inferInsert,
            | "title"
            | "status"
            | "payload"
            | "coachNotes"
            | "postPracticeNotes"
            | "scheduledAt"
          >
        >,
      ) {
        await db
          .update(practicePlans)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(practicePlans.id, id), eq(practicePlans.orgId, ctx.orgId)));
      },
      async softDelete(id: string) {
        await db
          .update(practicePlans)
          .set({ deletedAt: new Date() })
          .where(and(eq(practicePlans.id, id), eq(practicePlans.orgId, ctx.orgId)));
      },
    },
  };
}
