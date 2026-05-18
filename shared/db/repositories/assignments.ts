// shared/db/repositories/assignments.ts
// Domain repository: assignments
// Auto-extracted from shared/db/repository.ts as part of VSA refactor.

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import {
  assignments,
  type NewAssignment
} from "../schema";
import type { RepoContext } from "../repository";

export function createAssignmentsRepository(db: Db, ctx: RepoContext) {
  return {
    assignments: {
      async listForPlayer(playerId: string) {
        return db
          .select()
          .from(assignments)
          .where(
            and(
              eq(assignments.orgId, ctx.orgId),
              eq(assignments.playerId, playerId),
              isNull(assignments.deletedAt),
            ),
          )
          .orderBy(desc(assignments.createdAt));
      },
      async list(opts: { playerId?: string; status?: string } = {}) {
        const conditions = [
          eq(assignments.orgId, ctx.orgId),
          isNull(assignments.deletedAt),
        ];
        if (opts.playerId) {
          conditions.push(eq(assignments.playerId, opts.playerId));
        }
        if (opts.status) {
          conditions.push(
            eq(assignments.status, opts.status as "draft" | "submitted" | "overdue" | "in_progress" | "assigned" | "reviewed"),
          );
        }
        return db
          .select()
          .from(assignments)
          .where(and(...conditions))
          .orderBy(desc(assignments.createdAt));
      },
      async getById(id: string) {
        const rows = await db
          .select()
          .from(assignments)
          .where(
            and(
              eq(assignments.id, id),
              eq(assignments.orgId, ctx.orgId),
              isNull(assignments.deletedAt),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
      async create(input: Omit<NewAssignment, "orgId">) {
        const [row] = await db
          .insert(assignments)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async update(
        id: string,
        patch: Partial<
          Pick<
            typeof assignments.$inferInsert,
            | "status"
            | "submittedAt"
            | "reviewedAt"
            | "reviewedByUserId"
            | "payload"
          >
        >,
      ) {
        await db
          .update(assignments)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(assignments.id, id), eq(assignments.orgId, ctx.orgId)));
      },
      async softDelete(id: string) {
        await db
          .update(assignments)
          .set({ deletedAt: new Date() })
          .where(and(eq(assignments.id, id), eq(assignments.orgId, ctx.orgId)));
      },
      async complianceByPlayer() {
        const rows = await db
          .select({
            playerId: assignments.playerId,
            total: sql<number>`count(*)::int`,
            completed: sql<number>`count(*) filter (where ${assignments.status} in ('submitted','reviewed'))::int`,
          })
          .from(assignments)
          .where(and(eq(assignments.orgId, ctx.orgId), isNull(assignments.deletedAt)))
          .groupBy(assignments.playerId);
        return rows.map((r) => ({
          playerId: r.playerId,
          total: r.total,
          completed: r.completed,
          rate: r.total > 0 ? r.completed / r.total : 0,
        }));
      },
    },
  };
}
