// shared/db/client.ts
// Neon serverless Drizzle client factory.
//
// We expose a single `getDb()` so server code does not have to know which
// pool/connection it is talking to. The factory is memoized per process so
// Vercel functions reuse the underlying Neon connection.
//
// Deps (added in PR 1.5 dependency bump):
//   - drizzle-orm
//   - @neondatabase/serverless
//
// Until the deps land, this file is the contract; importers should be guarded
// behind FILM_ANALYSIS_DATA_SOURCE === "db".

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Neon's HTTP driver works in edge + node. Enable fetch caching off so we
// always see fresh writes (Drizzle handles its own batching).
neonConfig.fetchConnectionCache = true;

export type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | null = null;

export function getDb(): Db {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    // Throw a plain Error here — HttpError lives in server/auth/tenant.ts which
    // creates a circular import risk from shared/db. The routes.ts handleError
    // function catches this via a fallback check below.
    throw new Error(
      "DATABASE_URL is not set. Set it in Vercel for Development/Preview/Production.",
    );
  }

  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

// For tests / scripts that want a fresh client (e.g. after env mutation).
export function resetDb(): void {
  _db = null;
}

export { schema };
