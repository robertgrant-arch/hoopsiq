/**
 * Runtime guards for the Playbook Store.
 *
 * Thin wrapper around the canonical zod schemas in `mock/playbookSchema.ts`.
 * Provides safe + throwing variants for callers that want to validate
 * persisted blobs or play snapshots without depending on Zod directly.
 */
import { z } from "zod";
import {
  persistedPlaybookSchema,
  playSchema,
  type PersistedPlaybook,
  type Play,
} from "./schema";

export type GuardResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: z.ZodError };

export function validatePersistedPlaybook(value: unknown): GuardResult<PersistedPlaybook> {
  const parsed = persistedPlaybookSchema.safeParse(value);
  if (parsed.success) return { ok: true, data: parsed.data };
  return { ok: false, error: parsed.error };
}

export function validatePlay(value: unknown): GuardResult<Play> {
  const parsed = playSchema.safeParse(value);
  if (parsed.success) return { ok: true, data: parsed.data };
  return { ok: false, error: parsed.error };
}

/**
 * Best-effort localStorage hydration. Returns the validated value, or null
 * if missing/invalid. Wrapped in try/catch so a corrupt or unavailable
 * storage backend can never propagate up.
 */
export function safeLoadFromStorage(key: string): PersistedPlaybook | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const json = JSON.parse(raw);
    const result = validatePersistedPlaybook(json);
    if (result.ok) return result.data;
    console.warn("[playbook] persisted store failed schema validation", {
      key,
      issues: result.error.issues.slice(0, 5),
    });
    return null;
  } catch (e) {
    console.warn("[playbook] failed to read persisted store", e);
    return null;
  }
}

/** Throwing variant for tests / dev-time assertions. */
export function assertPersistedPlaybook(value: unknown): asserts value is PersistedPlaybook {
  const result = validatePersistedPlaybook(value);
  if (!result.ok) {
    throw new Error(
      `Invalid persisted playbook: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }
}
