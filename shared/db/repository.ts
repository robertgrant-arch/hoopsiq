// shared/db/repository.ts
// Tenant-scoped repository facade.
//
// Every query is org-scoped and goes through domain sub-repositories.
// This file composes them into the single surface the API modules use.
//
// Usage:
//   const repo = createRepository({ orgId, userId });
//   const sessions = await repo.filmSessions.list({ limit: 20 });
//
// To add a new domain: create shared/db/repositories/<domain>.ts,
// export a create<Domain>Repository(db, ctx) function, and spread it here.

import { getDb, type Db } from "./client";
import { createFilmRepository }        from "./repositories/film";
import { createRosterRepository }      from "./repositories/roster";
import { createEventsRepository }      from "./repositories/events";
import { createAssignmentsRepository } from "./repositories/assignments";
import { createPracticeRepository }    from "./repositories/practice";
import { createReadinessRepository }   from "./repositories/readiness";
import { createMessagingRepository }   from "./repositories/messaging";
import { createWearablesRepository }   from "./repositories/wearables";
import { createPlayerNotesRepository } from "./repositories/player-notes";
import { createIdpRepository }         from "./repositories/idp";
import { createGuardianRepository }    from "./repositories/guardian";
import { createCommsRepository }       from "./repositories/comms";
import { createClubOpsRepository }     from "./repositories/club-ops";
import { createBillingRepository }     from "./repositories/billing";

export interface RepoContext {
  orgId: string;
  userId: string;
  db?: Db;
}

export function createRepository(ctx: RepoContext) {
  const db = ctx.db ?? getDb();

  return {
    ...createFilmRepository(db, ctx),
    ...createRosterRepository(db, ctx),
    ...createEventsRepository(db, ctx),
    ...createAssignmentsRepository(db, ctx),
    ...createPracticeRepository(db, ctx),
    ...createReadinessRepository(db, ctx),
    ...createMessagingRepository(db, ctx),
    ...createWearablesRepository(db, ctx),
    ...createPlayerNotesRepository(db, ctx),
    ...createIdpRepository(db, ctx),
    ...createGuardianRepository(db, ctx),
    ...createCommsRepository(db, ctx),
    ...createClubOpsRepository(db, ctx),
    ...createBillingRepository(db, ctx),
  };
}

export type Repository = ReturnType<typeof createRepository>;
