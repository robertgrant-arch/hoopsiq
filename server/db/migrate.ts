/**
 * Startup migration runner.
 *
 * The repo's migrations mix drizzle-kit generated files (0000/0001, journaled,
 * "--> statement-breakpoint" markers) with hand-written SQL (0002+, no journal
 * entries), so drizzle's migrate() can't apply the full set. This runner
 * applies every shared/db/migrations/*.sql in filename order exactly once,
 * tracked in a _hoopsiq_migrations table.
 *
 * Statement splitting: files with drizzle's "--> statement-breakpoint" marker
 * split on it; hand-written files are split on ";" via a small scanner that
 * respects single-quoted strings, line comments, and $tag$ dollar-quoted
 * bodies (DO $$ ... $$ blocks).
 */

import fs from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { getDb } from "@shared/db";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "shared/db/migrations");

export function splitSqlStatements(text: string): string[] {
  if (text.includes("--> statement-breakpoint")) {
    return text
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const statements: string[] = [];
  let current = "";
  let i = 0;
  let dollarTag: string | null = null;
  let inSingleQuote = false;
  let inLineComment = false;

  while (i < text.length) {
    const ch = text[i];
    const next2 = text.slice(i, i + 2);

    if (inLineComment) {
      current += ch;
      if (ch === "\n") inLineComment = false;
      i++;
      continue;
    }
    if (dollarTag) {
      if (text.startsWith(dollarTag, i)) {
        current += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
      } else {
        current += ch;
        i++;
      }
      continue;
    }
    if (inSingleQuote) {
      current += ch;
      if (ch === "'" && text[i + 1] === "'") {
        current += "'";
        i += 2;
        continue;
      }
      if (ch === "'") inSingleQuote = false;
      i++;
      continue;
    }

    if (next2 === "--") {
      inLineComment = true;
      current += ch;
      i++;
      continue;
    }
    if (ch === "'") {
      inSingleQuote = true;
      current += ch;
      i++;
      continue;
    }
    if (ch === "$") {
      const m = /^\$[A-Za-z_]*\$/.exec(text.slice(i));
      if (m) {
        dollarTag = m[0];
        current += m[0];
        i += m[0].length;
        continue;
      }
    }
    if (ch === ";") {
      const stmt = current.trim();
      if (stmt) statements.push(stmt);
      current = "";
      i++;
      continue;
    }
    current += ch;
    i++;
  }
  const tail = current.trim();
  // A trailing fragment that is only comments/whitespace is not a statement.
  if (tail && !tail.split("\n").every((l) => l.trim() === "" || l.trim().startsWith("--"))) {
    statements.push(tail);
  }
  return statements;
}

export async function runMigrations(): Promise<{ applied: string[] }> {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS _hoopsiq_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const done = new Set<string>(
    ((await db.execute(sql`SELECT name FROM _hoopsiq_migrations`)) as any).rows?.map(
      (r: any) => r.name,
    ) ?? [],
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    const text = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const statements = splitSqlStatements(text);
    for (const stmt of statements) {
      // Postgres has no CREATE TYPE IF NOT EXISTS — some hand-written
      // migrations use it anyway. Rewrite to the guarded DO-block form.
      const typeMatch = /^((?:--[^\n]*\n|\s)*)CREATE TYPE IF NOT EXISTS\s+([\s\S]+)$/i.exec(stmt);
      const runnable = typeMatch
        ? `DO $mig$ BEGIN CREATE TYPE ${typeMatch[2]}; EXCEPTION WHEN duplicate_object THEN NULL; END $mig$`
        : stmt;
      try {
        await db.execute(sql.raw(runnable));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // Hand-written migrations predate this runner and some objects may
        // already exist from partial manual applies — tolerate those.
        if (/already exists|duplicate_object/i.test(msg)) continue;
        throw new Error(`Migration ${file} failed on statement: ${stmt.slice(0, 120)}… → ${msg}`);
      }
    }
    await db.execute(sql`INSERT INTO _hoopsiq_migrations (name) VALUES (${file}) ON CONFLICT DO NOTHING`);
    applied.push(file);
    console.log(`[db] applied migration ${file}`);
  }
  return { applied };
}
