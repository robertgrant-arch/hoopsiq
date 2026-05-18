// shared/db/repositories/messaging.ts
// Domain repository: messaging
// Auto-extracted from shared/db/repository.ts as part of VSA refactor.

import { and, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import {
  messageThreads, messages,
  type NewMessage, type NewMessageThread
} from "../schema";
import type { RepoContext } from "../repository";

export function createMessagingRepository(db: Db, ctx: RepoContext) {
  return {
    messages: {
      async listThreads() {
        return db
          .select()
          .from(messageThreads)
          .where(
            and(eq(messageThreads.orgId, ctx.orgId), isNull(messageThreads.deletedAt)),
          )
          .orderBy(desc(messageThreads.createdAt));
      },
      async getThread(threadId: string) {
        const rows = await db
          .select()
          .from(messageThreads)
          .where(
            and(
              eq(messageThreads.id, threadId),
              eq(messageThreads.orgId, ctx.orgId),
              isNull(messageThreads.deletedAt),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
      },
      async createThread(input: Omit<NewMessageThread, "orgId">) {
        const [row] = await db
          .insert(messageThreads)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async listMessages(threadId: string) {
        return db
          .select()
          .from(messages)
          .where(
            and(
              eq(messages.threadId, threadId),
              eq(messages.orgId, ctx.orgId),
              isNull(messages.deletedAt),
            ),
          )
          .orderBy(messages.sentAt);
      },
      async createMessage(input: Omit<NewMessage, "orgId">) {
        const [row] = await db
          .insert(messages)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
    },
  };
}
