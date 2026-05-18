// shared/db/repositories/wearables.ts
// Domain repository: wearables
// Auto-extracted from shared/db/repository.ts as part of VSA refactor.

import { and, desc, eq, gte, isNull } from "drizzle-orm";
import type { Db } from "../client";
import {
  wearableConnections, wearableMetrics, wearableSharing,
  type NewWearableConnection, type NewWearableMetric, type NewWearableSharing
} from "../schema";
import type { RepoContext } from "../repository";

export function createWearablesRepository(db: Db, ctx: RepoContext) {
  return {
    wearableConnections: {
      async list(opts: { playerId?: string } = {}) {
        const conditions = [
          eq(wearableConnections.orgId, ctx.orgId),
          isNull(wearableConnections.deletedAt),
        ];
        if (opts.playerId) {
          conditions.push(eq(wearableConnections.playerId, opts.playerId));
        }
        return db
          .select()
          .from(wearableConnections)
          .where(and(...conditions))
          .orderBy(desc(wearableConnections.createdAt));
      },
      async getByPlayer(playerId: string) {
        return db
          .select()
          .from(wearableConnections)
          .where(
            and(
              eq(wearableConnections.orgId, ctx.orgId),
              eq(wearableConnections.playerId, playerId),
              isNull(wearableConnections.deletedAt),
            ),
          )
          .orderBy(desc(wearableConnections.createdAt));
      },
      async upsertConnection(input: Omit<NewWearableConnection, "orgId">) {
        const [row] = await db
          .insert(wearableConnections)
          .values({ ...input, orgId: ctx.orgId })
          .onConflictDoUpdate({
            target: [
              wearableConnections.orgId,
              wearableConnections.playerId,
              wearableConnections.provider,
            ],
            set: {
              status: input.status ?? "pending",
              providerUserId: input.providerUserId,
              accessToken: input.accessToken,
              refreshToken: input.refreshToken,
              tokenExpiresAt: input.tokenExpiresAt,
              updatedAt: new Date(),
            },
          })
          .returning();
        return row;
      },
      async updateStatus(
        id: string,
        status: "connected" | "disconnected" | "error" | "pending",
        extra?: { lastSyncedAt?: Date },
      ) {
        await db
          .update(wearableConnections)
          .set({
            status,
            ...(extra?.lastSyncedAt ? { lastSyncedAt: extra.lastSyncedAt } : {}),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(wearableConnections.id, id),
              eq(wearableConnections.orgId, ctx.orgId),
            ),
          );
      },
      async disconnect(id: string) {
        await db
          .update(wearableConnections)
          .set({ deletedAt: new Date(), updatedAt: new Date() })
          .where(
            and(
              eq(wearableConnections.id, id),
              eq(wearableConnections.orgId, ctx.orgId),
            ),
          );
      },
    },
    wearableMetrics: {
      async getLatest(playerId: string) {
        // Most recent row per provider — fetch last 7 days and let app dedupe by provider
        const since = new Date();
        since.setDate(since.getDate() - 7);
        return db
          .select()
          .from(wearableMetrics)
          .where(
            and(
              eq(wearableMetrics.orgId, ctx.orgId),
              eq(wearableMetrics.playerId, playerId),
              gte(wearableMetrics.recordedDate, since.toISOString().slice(0, 10)),
            ),
          )
          .orderBy(desc(wearableMetrics.recordedDate))
          .limit(20);
      },
      async getHistory(playerId: string, days: number = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        return db
          .select()
          .from(wearableMetrics)
          .where(
            and(
              eq(wearableMetrics.orgId, ctx.orgId),
              eq(wearableMetrics.playerId, playerId),
              gte(wearableMetrics.recordedDate, since.toISOString().slice(0, 10)),
            ),
          )
          .orderBy(desc(wearableMetrics.recordedDate));
      },
      async upsert(input: Omit<NewWearableMetric, "orgId">) {
        const [row] = await db
          .insert(wearableMetrics)
          .values({ ...input, orgId: ctx.orgId })
          .onConflictDoUpdate({
            target: [
              wearableMetrics.playerId,
              wearableMetrics.provider,
              wearableMetrics.recordedDate,
            ],
            set: {
              recoveryScore: input.recoveryScore,
              hrv: input.hrv,
              restingHr: input.restingHr,
              sleepScore: input.sleepScore,
              sleepDurationMins: input.sleepDurationMins,
              deepSleepMins: input.deepSleepMins,
              remSleepMins: input.remSleepMins,
              strainScore: input.strainScore,
              steps: input.steps,
              activeCalories: input.activeCalories,
              rawPayload: input.rawPayload,
            },
          })
          .returning();
        return row;
      },
    },
    wearableSharing: {
      async get(playerId: string) {
        const rows = await db
          .select()
          .from(wearableSharing)
          .where(
            and(
              eq(wearableSharing.orgId, ctx.orgId),
              eq(wearableSharing.playerId, playerId),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
      async upsert(
        playerId: string,
        settings: Partial<
          Pick<
            NewWearableSharing,
            | "shareRecovery"
            | "shareSleep"
            | "shareStrain"
            | "shareHeartRate"
            | "shareWithCoaches"
            | "shareWithTeam"
          >
        >,
      ) {
        const [row] = await db
          .insert(wearableSharing)
          .values({ playerId, orgId: ctx.orgId, ...settings })
          .onConflictDoUpdate({
            target: [wearableSharing.orgId, wearableSharing.playerId],
            set: { ...settings, updatedAt: new Date() },
          })
          .returning();
        return row;
      },
      async canCoachView(playerId: string): Promise<boolean> {
        const rows = await db
          .select({ shareWithCoaches: wearableSharing.shareWithCoaches })
          .from(wearableSharing)
          .where(
            and(
              eq(wearableSharing.orgId, ctx.orgId),
              eq(wearableSharing.playerId, playerId),
            ),
          )
          .limit(1);
        return rows[0]?.shareWithCoaches ?? false;
      },
    },
  };
}
