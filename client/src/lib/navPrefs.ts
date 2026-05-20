/**
 * lib/navPrefs.ts
 *
 * Persistent nav-order preferences for coach and athlete roles.
 *
 * Storage pattern follows lib/drillTemplateStore.ts and lib/customDrillsStore.ts —
 * plain localStorage, no React, no external dependencies.
 *
 * Keys
 *   hoopsos:nav:coach:{handle}:sections   → string[]  ordered section titles
 *   hoopsos:nav:athlete:{handle}:more     → string[]  ordered hrefs (More sheet items only)
 */

const key = (role: string, handle: string, kind: string) =>
  `hoopsos:nav:${role}:${handle}:${kind}`;

// ── Coach section order ────────────────────────────────────────────────────

/**
 * Returns the saved coach section title order, or null if never saved.
 * Covers only the reorderable (non-pinned) sections.
 */
export function readCoachSectionOrder(handle: string): string[] | null {
  try {
    const raw = localStorage.getItem(key("coach", handle, "sections"));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : null;
  } catch {
    return null;
  }
}

/** Saves the coach section title order (non-pinned sections only). */
export function writeCoachSectionOrder(handle: string, order: string[]): void {
  try {
    localStorage.setItem(key("coach", handle, "sections"), JSON.stringify(order));
  } catch {
    // Storage quota exceeded — fail silently
  }
}

// ── Athlete More sheet order ───────────────────────────────────────────────

/**
 * Returns saved href order for the athlete More sheet items, or null.
 * Only covers items beyond the pinned bottom-tab items.
 */
export function readAthleteMoreOrder(handle: string): string[] | null {
  try {
    const raw = localStorage.getItem(key("athlete", handle, "more"));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : null;
  } catch {
    return null;
  }
}

/** Saves the athlete More sheet href order. */
export function writeAthleteMoreOrder(handle: string, order: string[]): void {
  try {
    localStorage.setItem(key("athlete", handle, "more"), JSON.stringify(order));
  } catch {
    // Storage quota exceeded — fail silently
  }
}

// ── Coach item order (within sections) ────────────────────────────────────
//
// Stored as a single JSON object: { [sectionTitle]: href[] }
// One key covers all sections — avoids proliferating N keys for N sections.
//
// Key: hoopsos:nav:coach:{handle}:items

export type CoachItemOrder = Record<string, string[]>;

/**
 * Returns the saved per-section item-order map, or null if never saved.
 * Shape: { TEAM: ["/app/coach/roster", ...], FILM: [...], ... }
 */
export function readCoachItemOrder(handle: string): CoachItemOrder | null {
  try {
    const raw = localStorage.getItem(key("coach", handle, "items"));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as CoachItemOrder)
      : null;
  } catch {
    return null;
  }
}

/**
 * Persists the item order for ONE section without clobbering other sections.
 * Reads the existing object, updates the single key, writes back.
 */
export function writeCoachSectionItemOrder(
  handle: string,
  sectionTitle: string,
  order: string[],
): void {
  try {
    const existing = readCoachItemOrder(handle) ?? {};
    existing[sectionTitle] = order;
    localStorage.setItem(key("coach", handle, "items"), JSON.stringify(existing));
  } catch {
    // Storage quota exceeded — fail silently
  }
}

/** Removes all item-order preferences for a coach (used on global reset). */
export function clearCoachItemOrder(handle: string): void {
  try {
    localStorage.removeItem(key("coach", handle, "items"));
  } catch {
    // Silent
  }
}

/**
 * Applies a saved href order to an items array.
 * Items absent from savedOrder (newly added) are appended at the end.
 * Items in savedOrder but removed from config are silently dropped.
 */
export function applyItemOrder<T extends { href: string }>(
  items: T[],
  order: string[] | null,
): T[] {
  if (!order) return items;
  const reordered = order
    .map((href) => items.find((i) => i.href === href))
    .filter(Boolean) as T[];
  const missing = items.filter((i) => !order.includes(i.href));
  return [...reordered, ...missing];
}

// ── Reset ──────────────────────────────────────────────────────────────────

/** Clears all nav preferences for a user — used on sign-out or reset. */
export function clearNavPrefs(handle: string): void {
  try {
    [
      key("coach",   handle, "sections"),
      key("athlete", handle, "more"),
    ].forEach((k) => localStorage.removeItem(k));
  } catch {
    // Silent
  }
}

/** Resets only the coach section order to default (remove the stored key). */
export function clearCoachSectionOrder(handle: string): void {
  try {
    localStorage.removeItem(key("coach", handle, "sections"));
  } catch {
    // Silent
  }
}

/** Resets only the athlete More-sheet/sidebar order to default. */
export function clearAthleteMoreOrder(handle: string): void {
  try {
    localStorage.removeItem(key("athlete", handle, "more"));
  } catch {
    // Silent
  }
}

// ── Order helpers ──────────────────────────────────────────────────────────

/**
 * Applies a saved title order to a sections array.
 * - Pinned titles are always kept first in their original order.
 * - Sections absent from savedOrder (newly added) are appended at the end.
 * - Sections in savedOrder but no longer in sections (removed) are dropped.
 */
export function applyCoachSectionOrder<T extends { title?: string }>(
  sections: T[],
  savedOrder: string[] | null,
  pinnedTitles: readonly string[],
): T[] {
  if (!savedOrder) return sections;

  const pinned     = sections.filter((s) => pinnedTitles.includes(s.title ?? ""));
  const reorderable= sections.filter((s) => !pinnedTitles.includes(s.title ?? ""));

  const reordered  = savedOrder
    .map((title) => reorderable.find((s) => s.title === title))
    .filter(Boolean) as T[];

  // Append any newly-added sections that aren't in the saved order
  const missing    = reorderable.filter((s) => !savedOrder.includes(s.title ?? ""));

  return [...pinned, ...reordered, ...missing];
}

/**
 * Applies a saved href order to a nav items array.
 * Items absent from savedOrder are appended at the end.
 */
export function applyAthleteMoreOrder<T extends { href: string }>(
  items: T[],
  savedOrder: string[] | null,
): T[] {
  if (!savedOrder) return items;

  const reordered = savedOrder
    .map((href) => items.find((i) => i.href === href))
    .filter(Boolean) as T[];

  const missing   = items.filter((i) => !savedOrder.includes(i.href));

  return [...reordered, ...missing];
}
