// shared/db/repositories/club-ops.ts
// Domain repository: club-ops
// Auto-extracted from shared/db/repository.ts as part of VSA refactor.

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import {
  seasons, teams, teamRoster, membershipPlans, registrations,
  type NewSeason, type NewTeam, type NewTeamRoster, type NewMembershipPlan, type NewRegistration
} from "../schema";
import type { RepoContext } from "../repository";

export function createClubOpsRepository(db: Db, ctx: RepoContext) {
  return {
    seasons: {
      async list(opts: { includeArchived?: boolean } = {}) {
        const conditions = [
          eq(seasons.orgId, ctx.orgId),
          isNull(seasons.deletedAt),
        ];
        if (!opts.includeArchived) {
          // Exclude archived seasons by default
          conditions.push(sql`${seasons.status} != 'archived'`);
        }
        return db
          .select()
          .from(seasons)
          .where(and(...conditions))
          .orderBy(desc(seasons.createdAt));
      },
      async getById(id: string) {
        const [row] = await db
          .select()
          .from(seasons)
          .where(and(eq(seasons.id, id), eq(seasons.orgId, ctx.orgId), isNull(seasons.deletedAt)))
          .limit(1);
        return row ?? null;
      },
      async create(input: Omit<NewSeason, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(seasons)
          .values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId })
          .returning();
        return row;
      },
      async update(id: string, patch: Partial<Pick<NewSeason, "name" | "slug" | "status" | "description" | "startsAt" | "endsAt" | "registrationOpensAt" | "registrationClosesAt" | "maxRoster">>) {
        const [row] = await db
          .update(seasons)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(seasons.id, id), eq(seasons.orgId, ctx.orgId)))
          .returning();
        return row;
      },
      async softDelete(id: string) {
        await db
          .update(seasons)
          .set({ deletedAt: new Date() })
          .where(and(eq(seasons.id, id), eq(seasons.orgId, ctx.orgId)));
      },
    },
    teams: {
      async list(opts: { seasonId?: string; activeOnly?: boolean } = {}) {
        const conditions = [
          eq(teams.orgId, ctx.orgId),
          isNull(teams.deletedAt),
        ];
        if (opts.seasonId) conditions.push(eq(teams.seasonId, opts.seasonId));
        if (opts.activeOnly) conditions.push(eq(teams.isActive, true));
        return db.select().from(teams).where(and(...conditions)).orderBy(teams.name);
      },
      async getById(id: string) {
        const [row] = await db
          .select()
          .from(teams)
          .where(and(eq(teams.id, id), eq(teams.orgId, ctx.orgId), isNull(teams.deletedAt)))
          .limit(1);
        return row ?? null;
      },
      async create(input: Omit<NewTeam, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(teams)
          .values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId })
          .returning();
        return row;
      },
      async update(id: string, patch: Partial<Omit<NewTeam, "orgId" | "createdByUserId" | "createdAt">>) {
        const [row] = await db
          .update(teams)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(teams.id, id), eq(teams.orgId, ctx.orgId)))
          .returning();
        return row;
      },
      async softDelete(id: string) {
        await db
          .update(teams)
          .set({ deletedAt: new Date() })
          .where(and(eq(teams.id, id), eq(teams.orgId, ctx.orgId)));
      },
      // Roster management
      async getRoster(teamId: string) {
        return db
          .select()
          .from(teamRoster)
          .where(and(eq(teamRoster.teamId, teamId), eq(teamRoster.orgId, ctx.orgId), isNull(teamRoster.removedAt)));
      },
      async addToRoster(input: Omit<NewTeamRoster, "orgId" | "addedByUserId">) {
        const [row] = await db
          .insert(teamRoster)
          .values({ ...input, orgId: ctx.orgId, addedByUserId: ctx.userId })
          .onConflictDoUpdate({
            target: [teamRoster.teamId, teamRoster.playerId],
            set: { status: input.status ?? "active", removedAt: null, addedAt: new Date() },
          })
          .returning();
        return row;
      },
      async removeFromRoster(teamId: string, playerId: string) {
        await db
          .update(teamRoster)
          .set({ removedAt: new Date() })
          .where(and(eq(teamRoster.teamId, teamId), eq(teamRoster.playerId, playerId), eq(teamRoster.orgId, ctx.orgId)));
      },
    },
    membershipPlans: {
      async list(opts: { seasonId?: string; status?: string } = {}) {
        const conditions = [
          eq(membershipPlans.orgId, ctx.orgId),
          isNull(membershipPlans.deletedAt),
        ];
        if (opts.seasonId) conditions.push(eq(membershipPlans.seasonId, opts.seasonId));
        if (opts.status) conditions.push(sql`${membershipPlans.status} = ${opts.status}`);
        return db.select().from(membershipPlans).where(and(...conditions)).orderBy(membershipPlans.createdAt);
      },
      async getById(id: string) {
        const [row] = await db
          .select()
          .from(membershipPlans)
          .where(and(eq(membershipPlans.id, id), eq(membershipPlans.orgId, ctx.orgId), isNull(membershipPlans.deletedAt)))
          .limit(1);
        return row ?? null;
      },
      async create(input: Omit<NewMembershipPlan, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(membershipPlans)
          .values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId })
          .returning();
        return row;
      },
      async update(id: string, patch: Partial<Omit<NewMembershipPlan, "orgId" | "createdByUserId" | "createdAt">>) {
        const [row] = await db
          .update(membershipPlans)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(membershipPlans.id, id), eq(membershipPlans.orgId, ctx.orgId)))
          .returning();
        return row;
      },
      async softDelete(id: string) {
        await db
          .update(membershipPlans)
          .set({ deletedAt: new Date() })
          .where(and(eq(membershipPlans.id, id), eq(membershipPlans.orgId, ctx.orgId)));
      },
    },
    registrations: {
      async list(opts: { seasonId?: string; status?: string; playerId?: string } = {}) {
        const conditions = [eq(registrations.orgId, ctx.orgId)];
        if (opts.seasonId) conditions.push(eq(registrations.seasonId, opts.seasonId));
        if (opts.status) conditions.push(sql`${registrations.status} = ${opts.status}`);
        if (opts.playerId) conditions.push(eq(registrations.playerId, opts.playerId));
        return db.select().from(registrations).where(and(...conditions)).orderBy(desc(registrations.submittedAt));
      },
      async getById(id: string) {
        const [row] = await db
          .select()
          .from(registrations)
          .where(and(eq(registrations.id, id), eq(registrations.orgId, ctx.orgId)))
          .limit(1);
        return row ?? null;
      },
      async create(input: Omit<NewRegistration, "orgId" | "submittedByUserId">) {
        const [row] = await db
          .insert(registrations)
          .values({ ...input, orgId: ctx.orgId, submittedByUserId: ctx.userId })
          .returning();
        return row;
      },
      async updateStatus(
        id: string,
        status: "accepted" | "denied" | "waitlisted" | "cancelled" | "active" | "incomplete",
        opts: { adminNotes?: string; acceptedByUserId?: string } = {},
      ) {
        const patch: Record<string, unknown> = {
          status,
          updatedAt: new Date(),
          ...(opts.adminNotes ? { adminNotes: opts.adminNotes } : {}),
        };
        if (status === "accepted") {
          patch.acceptedAt = new Date();
          patch.acceptedByUserId = opts.acceptedByUserId ?? ctx.userId;
        }
        if (status === "cancelled") {
          patch.cancelledAt = new Date();
          patch.cancelledByUserId = ctx.userId;
        }
        const [row] = await db
          .update(registrations)
          .set(patch)
          .where(and(eq(registrations.id, id), eq(registrations.orgId, ctx.orgId)))
          .returning();
        return row;
      },
      /** Count by status for dashboard KPIs */
      async countByStatus(seasonId?: string) {
        const conditions = [eq(registrations.orgId, ctx.orgId)];
        if (seasonId) conditions.push(eq(registrations.seasonId, seasonId));
        return db
          .select({
            status: registrations.status,
            count: sql<number>`count(*)::int`,
          })
          .from(registrations)
          .where(and(...conditions))
          .groupBy(registrations.status);
      },
    },
  };
}
