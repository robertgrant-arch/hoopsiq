// drizzle.config.ts
// Drizzle-kit config for HoopsIQ film-analysis schema.
//
// Used by:
//   pnpm db:generate   -> generate SQL migration files into shared/db/migrations
//   pnpm db:migrate    -> apply migrations against DATABASE_URL_UNPOOLED
//   pnpm db:studio     -> open drizzle studio against DATABASE_URL_UNPOOLED
//
// IMPORTANT: db:migrate uses the UNPOOLED Neon connection string (direct pg),
// because pgbouncer-style pooling does not support the prepared statements
// drizzle-kit issues during migration.

import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/db/schema/index.ts",
  out: "./shared/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
} satisfies Config;
