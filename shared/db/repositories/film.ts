// shared/db/repositories/film.ts
// Domain repository: film
// Auto-extracted from shared/db/repository.ts as part of VSA refactor.

import { and, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import {
  filmSessions, filmAssets, analysisJobs, annotations,
  type NewFilmSession, type NewFilmAsset, type NewAnalysisJob, type NewAnnotation
} from "../schema";
import type { RepoContext } from "../repository";

export function createFilmRepository(db: Db, ctx: RepoContext) {
  return {
    filmSessions: {
      async list(opts: { limit?: number; offset?: number } = {}) {
        const limit = Math.min(opts.limit ?? 50, 200);
        const offset = opts.offset ?? 0;
        return db
          .select()
          .from(filmSessions)
          .where(
            and(
              eq(filmSessions.orgId, ctx.orgId),
              isNull(filmSessions.deletedAt),
            ),
          )
          .orderBy(desc(filmSessions.createdAt))
          .limit(limit)
          .offset(offset);
      },
      async getById(id: string) {
        const rows = await db
          .select()
          .from(filmSessions)
          .where(
            and(
              eq(filmSessions.id, id),
              eq(filmSessions.orgId, ctx.orgId),
              isNull(filmSessions.deletedAt),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
      async create(input: Omit<NewFilmSession, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(filmSessions)
          .values({
            ...input,
            orgId: ctx.orgId,
            createdByUserId: ctx.userId,
          })
          .returning();
        return row;
      },
      async softDelete(id: string) {
        await db
          .update(filmSessions)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(filmSessions.id, id),
              eq(filmSessions.orgId, ctx.orgId),
            ),
          );
      },
      async update(
        id: string,
        patch: Partial<
          Pick<
            typeof filmSessions.$inferInsert,
            | "title"
            | "description"
            | "kind"
            | "status"
            | "opponent"
            | "homeAway"
            | "playedAt"
            | "payload"
          >
        >,
      ) {
        await db
          .update(filmSessions)
          .set({ ...patch, updatedAt: new Date() })
          .where(
            and(eq(filmSessions.id, id), eq(filmSessions.orgId, ctx.orgId)),
          );
      },
    },
    filmAssets: {
      async listForSession(sessionId: string) {
        return db
          .select()
          .from(filmAssets)
          .where(
            and(
              eq(filmAssets.sessionId, sessionId),
              eq(filmAssets.orgId, ctx.orgId),
              isNull(filmAssets.deletedAt),
            ),
          );
      },
      async create(input: Omit<NewFilmAsset, "orgId">) {
        const [row] = await db
          .insert(filmAssets)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async getById(id: string) {
        const rows = await db
          .select()
          .from(filmAssets)
          .where(
            and(
              eq(filmAssets.id, id),
              eq(filmAssets.orgId, ctx.orgId),
              isNull(filmAssets.deletedAt),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
      async update(
        id: string,
        patch: Partial<
          Pick<
            typeof filmAssets.$inferInsert,
            | "sessionId"
            | "status"
            | "mimeType"
            | "sizeBytes"
            | "payload"
          >
        >,
      ) {
        await db
          .update(filmAssets)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(filmAssets.id, id), eq(filmAssets.orgId, ctx.orgId)));
      },
    },
    analysisJobs: {
      async listForSession(sessionId: string) {
        return db
          .select()
          .from(analysisJobs)
          .where(
            and(
              eq(analysisJobs.sessionId, sessionId),
              eq(analysisJobs.orgId, ctx.orgId),
              isNull(analysisJobs.deletedAt),
            ),
          )
          .orderBy(desc(analysisJobs.createdAt));
      },
      async enqueue(input: Omit<NewAnalysisJob, "orgId" | "status">) {
        const [row] = await db
          .insert(analysisJobs)
          .values({ ...input, orgId: ctx.orgId, status: "queued" })
          .returning();
        return row;
      },
    },
    annotations: {
      async listForSession(sessionId: string) {
        return db
          .select()
          .from(annotations)
          .where(
            and(
              eq(annotations.sessionId, sessionId),
              eq(annotations.orgId, ctx.orgId),
              isNull(annotations.deletedAt),
            ),
          )
          .orderBy(annotations.startMs);
      },
      async create(input: Omit<NewAnnotation, "orgId">) {
        const [row] = await db
          .insert(annotations)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },

      async getById(id: string) {
        const [row] = await db
          .select()
          .from(annotations)
          .where(and(eq(annotations.id, id), eq(annotations.orgId, ctx.orgId)))
          .limit(1);
        return row ?? null;
      },

      async update(
        id: string,
        patch: Partial<Pick<NewAnnotation, "data" | "label" | "body" | "updatedAt">>,
      ) {
        const [row] = await db
          .update(annotations)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(annotations.id, id), eq(annotations.orgId, ctx.orgId)))
          .returning();
        return row ?? null;
      },
    },
  };
}
