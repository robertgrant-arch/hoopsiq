// shared/db/repositories/readiness.ts
// Domain repository: readiness
// Auto-extracted from shared/db/repository.ts as part of VSA refactor.

import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import {
  readinessCheckins, readinessOverrides,
  type NewReadinessCheckin, type NewReadinessOverride
} from "../schema";
import type { RepoContext } from "../repository";

export function createReadinessRepository(db: Db, ctx: RepoContext) {
  return {
    readiness: {
      async listToday(date?: Date) {
        const d = date ?? new Date();
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        return db
          .select()
          .from(readinessCheckins)
          .where(
            and(
              eq(readinessCheckins.orgId, ctx.orgId),
              gte(readinessCheckins.checkedInAt, start),
              sql`${readinessCheckins.checkedInAt} <= ${end}`,
            ),
          )
          .orderBy(desc(readinessCheckins.checkedInAt));
      },
      async listForPlayer(playerId: string, days: number = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        return db
          .select()
          .from(readinessCheckins)
          .where(
            and(
              eq(readinessCheckins.orgId, ctx.orgId),
              eq(readinessCheckins.playerId, playerId),
              gte(readinessCheckins.checkedInAt, since),
            ),
          )
          .orderBy(desc(readinessCheckins.checkedInAt));
      },
      async create(input: Omit<NewReadinessCheckin, "orgId">) {
        const [row] = await db
          .insert(readinessCheckins)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
    },
    readinessOverrides: {
      async listActive(orgId: string) {
        return db
          .select()
          .from(readinessOverrides)
          .where(
            and(
              eq(readinessOverrides.orgId, orgId),
              gte(readinessOverrides.expiresAt, new Date()),
            ),
          );
      },
      async upsert(input: Omit<NewReadinessOverride, "id" | "createdAt">) {
        const existing = await db
          .select()
          .from(readinessOverrides)
          .where(
            and(
              eq(readinessOverrides.orgId, input.orgId),
              eq(readinessOverrides.playerId, input.playerId),
            ),
          )
          .limit(1);
        if (existing[0]) {
          const [row] = await db
            .update(readinessOverrides)
            .set({ status: input.status, note: input.note, expiresAt: input.expiresAt, coachUserId: input.coachUserId })
            .where(eq(readinessOverrides.id, existing[0].id))
            .returning();
          return row;
        }
        const [row] = await db
          .insert(readinessOverrides)
          .values(input)
          .returning();
        return row;
      },
      async remove(orgId: string, playerId: string) {
        await db
          .delete(readinessOverrides)
          .where(
            and(
              eq(readinessOverrides.orgId, orgId),
              eq(readinessOverrides.playerId, playerId),
            ),
          );
      },
    },
  };
}
