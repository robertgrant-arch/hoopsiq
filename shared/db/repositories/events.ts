// shared/db/repositories/events.ts
// Domain repository: events
// Auto-extracted from shared/db/repository.ts as part of VSA refactor.

import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import {
  events, eventAvailability, eventAttendance,
  type NewEvent, type NewEventAvailability, type NewEventAttendance
} from "../schema";
import type { RepoContext } from "../repository";

export function createEventsRepository(db: Db, ctx: RepoContext) {
  return {
    events: {
      async list(opts: { limit?: number; from?: Date } = {}) {
        const limit = Math.min(opts.limit ?? 50, 200);
        const conditions = [
          eq(events.orgId, ctx.orgId),
          isNull(events.deletedAt),
        ];
        if (opts.from) {
          conditions.push(gte(events.startsAt, opts.from));
        }
        return db
          .select()
          .from(events)
          .where(and(...conditions))
          .orderBy(events.startsAt)
          .limit(limit);
      },
      async getById(id: string) {
        const rows = await db
          .select()
          .from(events)
          .where(
            and(
              eq(events.id, id),
              eq(events.orgId, ctx.orgId),
              isNull(events.deletedAt),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
      async create(input: Omit<NewEvent, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(events)
          .values({
            ...input,
            orgId: ctx.orgId,
            createdByUserId: ctx.userId,
          })
          .returning();
        return row;
      },
      async update(
        id: string,
        patch: Partial<
          Pick<
            typeof events.$inferInsert,
            "title" | "status" | "startsAt" | "endsAt" | "location" | "notes"
          >
        >,
      ) {
        await db
          .update(events)
          .set({ ...patch, updatedAt: new Date() })
          .where(and(eq(events.id, id), eq(events.orgId, ctx.orgId)));
      },
      async softDelete(id: string) {
        await db
          .update(events)
          .set({ deletedAt: new Date() })
          .where(and(eq(events.id, id), eq(events.orgId, ctx.orgId)));
      },
      /** Upcoming events from now onwards (used by parent portal). */
      async listUpcoming(limit = 50) {
        return db
          .select()
          .from(events)
          .where(
            and(
              eq(events.orgId, ctx.orgId),
              isNull(events.deletedAt),
              gte(events.startsAt, new Date()),
            ),
          )
          .orderBy(events.startsAt)
          .limit(limit);
      },
      /** Attendance records for a specific player (used by parent portal). */
      async listAttendanceForPlayer(playerId: string, limit = 50) {
        return db
          .select({
            id: eventAttendance.id,
            eventId: eventAttendance.eventId,
            playerId: eventAttendance.playerId,
            status: eventAttendance.status,
            note: eventAttendance.note,
            recordedAt: eventAttendance.recordedAt,
            eventTitle: events.title,
            eventDate: events.startsAt,
          })
          .from(eventAttendance)
          .innerJoin(events, eq(eventAttendance.eventId, events.id))
          .where(
            and(
              eq(eventAttendance.orgId, ctx.orgId),
              eq(eventAttendance.playerId, playerId),
            ),
          )
          .orderBy(desc(events.startsAt))
          .limit(limit);
      },
      /** Upsert an availability/RSVP for a player (used by parent portal). */
      async upsertAvailability(input: {
        playerId: string;
        eventId: string;
        status: "available" | "unavailable" | "maybe";
        note?: string;
        respondedByUserId: string;
      }) {
        const [row] = await db
          .insert(eventAvailability)
          .values({
            eventId: input.eventId,
            playerId: input.playerId,
            orgId: ctx.orgId,
            response: input.status as any,
            note: input.note,
            respondedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [eventAvailability.eventId, eventAvailability.playerId],
            set: {
              response: input.status as any,
              note: input.note,
              respondedAt: new Date(),
            },
          })
          .returning();
        return row;
      },
    },
    eventAvailability: {
      async listForEvent(eventId: string) {
        return db
          .select()
          .from(eventAvailability)
          .where(
            and(
              eq(eventAvailability.eventId, eventId),
              eq(eventAvailability.orgId, ctx.orgId),
            ),
          );
      },
      async upsert(input: Omit<NewEventAvailability, "orgId">) {
        const [row] = await db
          .insert(eventAvailability)
          .values({ ...input, orgId: ctx.orgId })
          .onConflictDoUpdate({
            target: [eventAvailability.eventId, eventAvailability.playerId],
            set: {
              response: input.response,
              note: input.note,
              respondedAt: new Date(),
            },
          })
          .returning();
        return row;
      },
    },
    eventAttendance: {
      async listForEvent(eventId: string) {
        return db
          .select()
          .from(eventAttendance)
          .where(
            and(
              eq(eventAttendance.eventId, eventId),
              eq(eventAttendance.orgId, ctx.orgId),
            ),
          );
      },
      async upsertBulk(
        eventId: string,
        records: Array<{
          playerId: string;
          status: "present" | "absent" | "late" | "excused";
          note?: string;
          recordedByUserId: string;
        }>,
      ) {
        if (records.length === 0) return [];
        const values = records.map((r) => ({
          eventId,
          playerId: r.playerId,
          orgId: ctx.orgId,
          status: r.status,
          note: r.note,
          recordedByUserId: r.recordedByUserId,
        }));
        return db
          .insert(eventAttendance)
          .values(values)
          .onConflictDoUpdate({
            target: [eventAttendance.eventId, eventAttendance.playerId],
            set: {
              status: sql`excluded.status`,
              note: sql`excluded.note`,
              recordedByUserId: sql`excluded.recorded_by_user_id`,
              recordedAt: new Date(),
            },
          })
          .returning();
      },
    },
  };
}
