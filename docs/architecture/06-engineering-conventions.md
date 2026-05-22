# HoopsIQ — Engineering Conventions & Repo Structure
## Vertical Slice Architecture: The Definitive Guide for the Next Phase

> Opinionated. Enforced. Non-negotiable.  
> Grounded in the VSA refactor, the six slice specs, and the product roadmap.  
> May 2026

---

## The One Rule That Governs All Others

**A feature slice is a vertical cut through the entire stack — types, API contract, business logic, UI components, pages, tests, and mock data — that is owned end-to-end by one engineer and that exposes exactly one public entry point to the rest of the codebase.**

Everything else in this document is a consequence of that rule.

---

## 1. Top-Level Folder Structure

### The target tree

```
hoopsos/
│
├── client/src/
│   ├── features/                    ← ALL product features live here
│   │   ├── _shared/                 ← The ONLY allowed cross-cutting code
│   │   │   ├── design-system/       ← Base components from shadcn + custom tokens
│   │   │   ├── auth/                ← auth context, useAuth hook, Clerk integration
│   │   │   ├── permissions/         ← PERMISSION_MATRIX, can(), StaffRole type
│   │   │   ├── navigation/          ← ROLE_NAV config, NavItem type, useActiveNav
│   │   │   ├── api-client/          ← apiGet, apiPost, apiPatch, apiDelete, apiFetch
│   │   │   └── types/               ← Org, User, Role — cross-cutting domain types
│   │   │
│   │   ├── dashboard/               ← Slice: Dashboard (P0)
│   │   ├── coaching/                ← Slice: Coaching — film, actions, practice (P1)
│   │   ├── readiness/               ← Slice: Readiness — daily check-in (P0, exists)
│   │   ├── playbook/                ← Slice: Playbook — V3 canvas (P2, exists)
│   │   ├── assessments/             ← Slice: Assessments — IDP, skills, benchmarks (P1)
│   │   ├── academy/                 ← Slice: Academy — drills, assignments, learning (P1)
│   │   ├── admin-billing/           ← Slice: Admin/Billing — ops, billing, roster (P0)
│   │   ├── manager-labs/            ← Slice: Manager Labs — analytics (P2)
│   │   ├── messaging/               ← Slice: Messaging — inbox, announcements
│   │   ├── recruiting/              ← Slice: Recruiting — dossier, scouting (P2)
│   │   └── navigation/              ← Slice: Navigation system (special — see §4)
│   │
│   ├── app/                         ← App shell — routing, auth wrapper, AppShell
│   │   ├── App.tsx
│   │   ├── AppShell.tsx             ← Reads from features/navigation/
│   │   ├── router.tsx               ← All routes registered here
│   │   └── providers.tsx            ← QueryClient, ThemeProvider, etc.
│   │
│   ├── lib/                         ← DEPRECATED ZONE — being dissolved
│   │   ├── README.md                ← "Nothing new goes here. See migration guide."
│   │   └── [shim files only]        ← All shimmed; migrating to features/
│   │
│   └── main.tsx
│
├── server/
│   ├── modules/                     ← Server domain modules (one per slice or sub-domain)
│   │   ├── roster/                  ← → admin-billing slice on client
│   │   ├── events/                  ← → admin-billing slice on client
│   │   ├── seasons/                 ← → admin-billing slice on client
│   │   ├── invoices/                ← → admin-billing slice on client
│   │   ├── registrations/           ← → admin-billing slice on client
│   │   ├── waivers/                 ← → admin-billing slice on client
│   │   ├── readiness/               ← → readiness slice on client
│   │   ├── film-analysis/           ← → coaching slice on client
│   │   ├── coaching-actions/        ← → coaching slice on client
│   │   ├── practice-plans/          ← → coaching slice on client
│   │   ├── assignments/             ← → academy slice on client
│   │   ├── messaging/               ← → messaging slice on client
│   │   ├── announcements/           ← → messaging slice on client
│   │   ├── parent/                  ← → admin-billing slice on client (parent portal)
│   │   ├── wearables/               ← → readiness slice on client
│   │   └── [future modules]
│   │
│   ├── lib/                         ← Server infrastructure ONLY
│   │   ├── gemini.ts                ← AI provider wrapper (no domain logic)
│   │   ├── mux.ts                   ← Video provider wrapper (no domain logic)
│   │   ├── openai.ts                ← AI provider wrapper (no domain logic)
│   │   ├── sms.ts                   ← SMS transport (was twilio.ts)
│   │   ├── slugify.ts               ← Utility
│   │   └── invoiceNumber.ts         ← Utility
│   │
│   ├── inngest/
│   │   ├── client.ts
│   │   └── functions/               ← Background jobs (one file per job)
│   │       ├── readiness-alert.ts
│   │       ├── benchmark-computation.ts
│   │       ├── program-health-snapshot.ts
│   │       └── [future jobs]
│   │
│   ├── auth/
│   │   └── tenant.ts                ← requireOrg(), org isolation
│   │
│   └── app.ts                       ← Express app, module registration
│
├── shared/
│   ├── db/
│   │   ├── schema/                  ← Drizzle table definitions (one file per entity)
│   │   ├── repositories/            ← Domain sub-repositories (post-VSA)
│   │   ├── repository.ts            ← Thin composer (NEVER add business logic here)
│   │   └── client.ts                ← DB connection
│   │
│   └── lib/
│       ├── HttpError.ts             ← HTTP error class
│       └── auth.ts                  ← Shared auth types
│
└── src/
    └── playbook/                    ← Canonical V3 domain logic + tests
        ├── types.ts
        ├── animate.ts
        ├── migrate.ts
        ├── resolver.ts
        ├── snap.ts
        └── __tests__/
```

### Why this tree is structured this way

**`features/` is the product.** Every feature the user touches lives here. This directory is the first thing a new engineer opens.

**`_shared/` is not `lib/`.** The underscore prefix makes it visually distinct and sorts it first, signaling "this is special." The contents are minimal by design: auth, permissions, nav config, API client, design system, and cross-cutting domain types. Nothing else qualifies. If you find yourself adding to `_shared/`, stop and ask why.

**`lib/` is a graveyard.** It contains only shims pointing to their migrated destinations. It has a `README.md` that says "Nothing new goes here." All new code goes in `features/`. The lib directory exists only to maintain backward compatibility during the shim-dissolution phase.

**`app/` is the shell, not the application.** It wires up routing, providers, and the app shell. It imports from features but adds no logic of its own.

---

## 2. What Belongs Inside Each Slice

### The canonical slice structure

Every client-side feature slice follows this structure exactly. No deviations without documented justification.

```
features/{slice-name}/
│
├── types.ts          ← (1) Domain types for this slice
├── api.ts            ← (2) Raw API fetch functions
├── hooks.ts          ← (3) React Query hooks (data interface)
├── store.ts          ← (4) Zustand store — only if UI state is complex
├── compute.ts        ← (5) Pure business logic — no React, no API
├── mock.ts           ← (6) Development and demo seed data
├── index.ts          ← (7) Public barrel — the ONLY import surface
│
├── components/       ← (8) React components owned by this slice
│   ├── SliceMainView.tsx
│   ├── SliceDetailPanel.tsx
│   └── SliceForm.tsx
│
├── pages/            ← (9) Page-level components (thin wrappers)
│   ├── SliceListPage.tsx
│   └── SliceDetailPage.tsx
│
└── tests/            ← (10) Slice-scoped test files
    ├── compute.test.ts
    ├── hooks.test.ts
    └── SliceComponent.test.tsx
```

### File-by-file rules

**`types.ts` — the source of truth for this slice's domain**
- Contains all TypeScript interfaces, types, enums, and Zod schemas owned by this slice
- Never imports types from another feature slice's `types.ts` directly — only from their `index.ts`
- Types used only inside the slice stay here; types exposed to other slices are re-exported from `index.ts`
- The Zod schemas in this file should be the canonical validators, shared between client validation and server validation via the shared schema

```typescript
// features/coaching/types.ts — GOOD EXAMPLE
import type { Player } from "@/features/admin-billing";  // From public index ✓
import { z } from "zod";

export type FilmSessionStatus = "uploading" | "processing" | "ready" | "error";

export type FilmSession = {
  id:         string;
  orgId:      string;
  title:      string;
  type:       "game" | "practice" | "scouting";
  status:     FilmSessionStatus;
  muxAssetId: string | null;
  muxPlaybackId: string | null;
  date:       string;
  createdAt:  string;
};

export const CreateFilmSessionSchema = z.object({
  title: z.string().min(1).max(200),
  type:  z.enum(["game", "practice", "scouting"]),
  date:  z.string().datetime(),
});

export type CreateFilmSessionInput = z.infer<typeof CreateFilmSessionSchema>;
```

---

**`api.ts` — the raw API contract**
- Contains plain async functions that call `apiGet`, `apiPost`, etc.
- No React. No hooks. No state. Just fetch calls.
- These functions are called by `hooks.ts` — never called directly from components
- Typed inputs and outputs match the server's Zod schemas

```typescript
// features/coaching/api.ts — GOOD EXAMPLE
import { apiGet, apiPost, apiPatch, apiDelete } from "@/features/_shared/api-client";
import type { FilmSession, CreateFilmSessionInput, CoachingAction } from "./types";

export const filmSessionsApi = {
  list: () =>
    apiGet<FilmSession[]>("/film-sessions"),

  get: (id: string) =>
    apiGet<FilmSession>(`/film-sessions/${id}`),

  createUpload: () =>
    apiPost<{ uploadId: string; uploadUrl: string }>("/film-sessions/upload", {}),

  create: (input: CreateFilmSessionInput) =>
    apiPost<FilmSession>("/film-sessions", input),

  markReviewed: (id: string) =>
    apiPatch<FilmSession>(`/film-sessions/${id}`, { status: "reviewed" }),

  delete: (id: string) =>
    apiDelete<void>(`/film-sessions/${id}`),
};

export const coachingActionsApi = {
  list: (filters?: { status?: string; playerId?: string }) =>
    apiGet<CoachingAction[]>("/coaching-actions", { params: filters }),

  create: (input: CreateCoachingActionInput) =>
    apiPost<CoachingAction>("/coaching-actions", input),

  resolve: (id: string, notes?: string) =>
    apiPatch<CoachingAction>(`/coaching-actions/${id}`, { status: "resolved", notes }),

  dismiss: (id: string) =>
    apiPatch<CoachingAction>(`/coaching-actions/${id}`, { status: "dismissed" }),
};
```

---

**`hooks.ts` — the data interface for components**
- All React Query hooks for this slice live here
- Components never call `apiGet` directly — they always use a hook
- Query keys are defined as constants at the top of the file
- Cache invalidation is explicit and scoped to this slice's keys

```typescript
// features/coaching/hooks.ts — GOOD EXAMPLE
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { filmSessionsApi, coachingActionsApi } from "./api";
import type { FilmSession, CreateFilmSessionInput, CoachingAction } from "./types";

// ── Query key constants ────────────────────────────────────────────────────
const FILM_KEYS = {
  all:     ["film-sessions"]              as const,
  lists:   () => [...FILM_KEYS.all, "list"]    as const,
  detail:  (id: string) => [...FILM_KEYS.all, id] as const,
};

const ACTION_KEYS = {
  all:   ["coaching-actions"] as const,
  lists: () => [...ACTION_KEYS.all, "list"] as const,
};

// ── Film session hooks ─────────────────────────────────────────────────────
export function useFilmSessions() {
  return useQuery({
    queryKey: FILM_KEYS.lists(),
    queryFn:  filmSessionsApi.list,
  });
}

export function useFilmSession(id: string) {
  return useQuery({
    queryKey: FILM_KEYS.detail(id),
    queryFn:  () => filmSessionsApi.get(id),
    enabled:  !!id,
  });
}

export function useCreateFilmSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: filmSessionsApi.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: FILM_KEYS.lists() }),
  });
}

// ── Coaching action hooks ──────────────────────────────────────────────────
export function useCoachingActions(filters?: { status?: string; playerId?: string }) {
  return useQuery({
    queryKey: [...ACTION_KEYS.lists(), filters],
    queryFn:  () => coachingActionsApi.list(filters),
  });
}

export function useResolveCoachingAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      coachingActionsApi.resolve(id, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ACTION_KEYS.all }),
  });
}
```

---

**`store.ts` — Zustand for UI state only**
- Only exists when the slice has UI state that outlives component lifetimes
- UI state only: selected tab, drawer open state, drag-drop order, local edits before save
- Never stores server data — that lives in React Query cache
- Coaching (practice plan builder) needs a store. Readiness does not.

```typescript
// features/coaching/store.ts — GOOD EXAMPLE
import { create } from "zustand";
import type { PracticePlanBlock } from "./types";

type PracticeBuilderState = {
  draftBlocks:     PracticePlanBlock[];
  isDirty:         boolean;
  activeBlockId:   string | null;
  setBlocks:       (blocks: PracticePlanBlock[]) => void;
  moveBlock:       (fromIndex: number, toIndex: number) => void;
  setActiveBlock:  (id: string | null) => void;
  resetDraft:      () => void;
};

export const usePracticeBuilderStore = create<PracticeBuilderState>((set) => ({
  draftBlocks:    [],
  isDirty:        false,
  activeBlockId:  null,

  setBlocks: (blocks) => set({ draftBlocks: blocks, isDirty: false }),

  moveBlock: (fromIndex, toIndex) =>
    set((s) => {
      const blocks = [...s.draftBlocks];
      const [moved] = blocks.splice(fromIndex, 1);
      blocks.splice(toIndex, 0, moved);
      return { draftBlocks: blocks, isDirty: true };
    }),

  setActiveBlock: (id) => set({ activeBlockId: id }),
  resetDraft:     () => set({ draftBlocks: [], isDirty: false, activeBlockId: null }),
}));
```

---

**`compute.ts` — pure business logic**
- Pure functions only. `(input) => output`. No side effects.
- No imports from React, hooks, the API client, or any component
- The most testable file in the slice — 100% unit test coverage expected
- If you're putting business logic in a component, move it here first

```typescript
// features/coaching/compute.ts — GOOD EXAMPLE
import type { PracticePlanBlock, CoachingAction } from "./types";

export function computePracticeDuration(blocks: PracticePlanBlock[]): number {
  return blocks.reduce((sum, b) => sum + b.durationMinutes, 0);
}

export function groupActionsByPlayer(
  actions: CoachingAction[],
): Record<string, CoachingAction[]> {
  return actions.reduce<Record<string, CoachingAction[]>>((acc, action) => {
    const key = action.playerId ?? "_team";
    if (!acc[key]) acc[key] = [];
    acc[key].push(action);
    return acc;
  }, {});
}

export function prioritizeActions(actions: CoachingAction[]): CoachingAction[] {
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;
  return [...actions].sort((a, b) => {
    const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (p !== 0) return p;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function isPlanOverBudget(
  blocks: PracticePlanBlock[],
  budgetMinutes: number,
): boolean {
  return computePracticeDuration(blocks) > budgetMinutes;
}
```

---

**`mock.ts` — development and demo seed data**
- Seed data that matches the types in `types.ts` exactly (TypeScript enforces this)
- Never imported in production code paths — enforced by ESLint rule
- Named with `MOCK_` prefix for constants or `mock{Resource}` for factories
- Realistic data — not placeholder "Test Test Test" content

```typescript
// features/coaching/mock.ts — GOOD EXAMPLE
import type { FilmSession, CoachingAction } from "./types";

export const MOCK_FILM_SESSIONS: FilmSession[] = [
  {
    id:            "session-1",
    orgId:         "org-demo",
    title:         "Barnegat vs. Toms River North",
    type:          "game",
    status:        "ready",
    muxAssetId:    "demo-asset-1",
    muxPlaybackId: "demo-playback-1",
    date:          "2026-04-28",
    createdAt:     "2026-04-28T20:00:00Z",
  },
  {
    id:            "session-2",
    orgId:         "org-demo",
    title:         "Monday Practice — Defensive Sets",
    type:          "practice",
    status:        "ready",
    muxAssetId:    "demo-asset-2",
    muxPlaybackId: "demo-playback-2",
    date:          "2026-04-21",
    createdAt:     "2026-04-21T18:00:00Z",
  },
];

export const MOCK_COACHING_ACTIONS: CoachingAction[] = [
  {
    id:            "action-1",
    orgId:         "org-demo",
    sessionId:     "session-1",
    annotationId:  "ann-1",
    playerId:      "player-marcus",
    authorUserId:  "coach-taylor",
    type:          "recommend_drill",
    status:        "open",
    priority:      "high",
    issueCategory: "Defense",
    notes:         "Defensive stance — knees not bent, reaching with hands",
    dueAt:         "2026-05-02T00:00:00Z",
    createdAt:     "2026-04-28T21:30:00Z",
  },
];
```

---

**`index.ts` — the public API of the slice**
- The ONLY file that other slices may import from
- Explicitly curated — only what should be public is exported
- If you need something from a slice and it's not in `index.ts`, talk to the slice owner first
- The index is a contract. Adding to it requires review.

```typescript
// features/coaching/index.ts — GOOD EXAMPLE
// ── Types (only what other slices need) ───────────────────────────────────
export type {
  FilmSession,
  FilmSessionStatus,
  CoachingAction,
  CoachingActionType,
  CoachingActionStatus,
  PracticePlan,
  PracticePlanBlock,
} from "./types";

// ── Hooks (data interfaces for consuming components) ──────────────────────
export {
  useFilmSessions,
  useFilmSession,
  useCreateFilmSession,
  useCoachingActions,
  useResolveCoachingAction,
  usePracticePlan,
} from "./hooks";

// ── Compute (only what other slices need) ─────────────────────────────────
export { computePracticeDuration, prioritizeActions } from "./compute";

// ── Components (only cross-slice reusable components) ─────────────────────
export { ClipActionBar } from "./components/film/ClipActionBar";
export { TeamReadinessGrid } from "./components/readiness/TeamReadinessGrid";

// NOT exported: store.ts internals, api.ts functions, mock.ts data,
// internal components, pages, or any file from the components/ subdirectory
// unless it is genuinely used by another slice.
```

---

**`components/` — the UI owned by this slice**
- All components here are private to the slice unless explicitly exported from `index.ts`
- Sub-directories allowed when a slice has distinct sub-domains (film/, practice/, actions/)
- Components in here should not be imported by `pages/` in other roles unless exported from `index.ts`
- Component files are PascalCase; the default export matches the filename

**`pages/` — thin page wrappers**
- Pages do one thing: assemble components and call hooks
- No business logic. No data transformation.
- No inline styles — use Tailwind classes or CSS variables
- Maximum 80 lines. If longer, extract a component.

```typescript
// features/coaching/pages/coach/FilmLibraryPage.tsx — GOOD EXAMPLE
import { AppShell, PageHeader } from "@/app/AppShell";
import { FilmSessionGrid, FilmUploadButton } from "../components/film";
import { useFilmSessions } from "../../hooks";

export default function FilmLibraryPage() {
  const { data: sessions = [], isLoading } = useFilmSessions();

  return (
    <AppShell>
      <PageHeader title="Film Room" action={<FilmUploadButton />} />
      <FilmSessionGrid sessions={sessions} isLoading={isLoading} />
    </AppShell>
  );
}
```

---

**`tests/` — slice-scoped tests**
- `compute.test.ts` — unit tests for pure functions (100% coverage required)
- `hooks.test.ts` — integration tests using MSW to mock the API
- `{Component}.test.tsx` — component tests for critical UI interactions
- No test file imports from outside this slice except `_shared/`

---

## 3. The Complete Slice Template

Copy this entire directory and rename it. Replace `{SliceName}` and `{slice-name}` with your slice.

```bash
cp -r features/_template features/{slice-name}
# Then find-and-replace "{SliceName}" and "{slice-name}" throughout
```

### Template files (copy verbatim, then fill in)

**`features/_template/types.ts`**
```typescript
/**
 * {SliceName} — Domain types
 *
 * All types in this file are owned by the {slice-name} slice.
 * Types used by other slices must be re-exported from index.ts.
 */

// ── Main entities ──────────────────────────────────────────────────────────

export type {SliceName}Status = "active" | "inactive";

export type {SliceName} = {
  id:        string;
  orgId:     string;
  status:    {SliceName}Status;
  createdAt: string;
  updatedAt: string;
};

// ── Input schemas ──────────────────────────────────────────────────────────

import { z } from "zod";

export const Create{SliceName}Schema = z.object({
  // TODO: add fields
});

export type Create{SliceName}Input = z.infer<typeof Create{SliceName}Schema>;
```

**`features/_template/api.ts`**
```typescript
/**
 * {SliceName} — API functions
 *
 * Raw fetch calls. Called by hooks.ts only — never directly from components.
 */
import { apiGet, apiPost, apiPatch, apiDelete } from "@/features/_shared/api-client";
import type { {SliceName}, Create{SliceName}Input } from "./types";

export const {sliceName}Api = {
  list: () =>
    apiGet<{SliceName}[]>("/{slice-name}"),

  get: (id: string) =>
    apiGet<{SliceName}>("/{slice-name}/" + id),

  create: (input: Create{SliceName}Input) =>
    apiPost<{SliceName}>("/{slice-name}", input),

  update: (id: string, input: Partial<Create{SliceName}Input>) =>
    apiPatch<{SliceName}>("/{slice-name}/" + id, input),

  delete: (id: string) =>
    apiDelete<void>("/{slice-name}/" + id),
};
```

**`features/_template/hooks.ts`**
```typescript
/**
 * {SliceName} — React Query hooks
 *
 * Data interface for all components in this slice and consuming slices.
 * Never call apiGet/apiPost directly from a component — use these hooks.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { {sliceName}Api } from "./api";
import type { {SliceName}, Create{SliceName}Input } from "./types";

// ── Query key constants ────────────────────────────────────────────────────
const KEYS = {
  all:    ["{slice-name}"]                   as const,
  lists:  () => [...KEYS.all, "list"]        as const,
  detail: (id: string) => [...KEYS.all, id]  as const,
};

// ── Queries ────────────────────────────────────────────────────────────────
export function use{SliceName}s() {
  return useQuery({
    queryKey: KEYS.lists(),
    queryFn:  {sliceName}Api.list,
  });
}

export function use{SliceName}(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn:  () => {sliceName}Api.get(id),
    enabled:  !!id,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────
export function useCreate{SliceName}() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: {sliceName}Api.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.lists() }),
  });
}

export function useUpdate{SliceName}() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Create{SliceName}Input> }) =>
      {sliceName}Api.update(id, input),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.lists() });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useDelete{SliceName}() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: {sliceName}Api.delete,
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
```

**`features/_template/compute.ts`**
```typescript
/**
 * {SliceName} — Pure business logic
 *
 * No React. No API calls. No side effects. Pure functions only.
 * Every function here must have a test in tests/compute.test.ts.
 */
import type { {SliceName} } from "./types";

// TODO: Add domain-specific computation functions
// Example:
// export function compute{SliceName}Score(item: {SliceName}): number { ... }
```

**`features/_template/mock.ts`**
```typescript
/**
 * {SliceName} — Mock / seed data
 *
 * Used for development and demo mode ONLY.
 * Never imported in production code paths.
 * Data must match the types in types.ts exactly.
 */
import type { {SliceName} } from "./types";

export const MOCK_{SLICE_NAME}S: {SliceName}[] = [
  {
    id:        "{slice-name}-demo-1",
    orgId:     "org-demo",
    status:    "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];
```

**`features/_template/index.ts`**
```typescript
/**
 * {SliceName} — Public API
 *
 * This is the ONLY file other slices may import from.
 * Think carefully before adding an export. Every export is a commitment.
 */

// ── Types ──────────────────────────────────────────────────────────────────
export type { {SliceName}, {SliceName}Status, Create{SliceName}Input } from "./types";

// ── Hooks ──────────────────────────────────────────────────────────────────
export { use{SliceName}s, use{SliceName}, useCreate{SliceName} } from "./hooks";

// ── Compute ────────────────────────────────────────────────────────────────
// export { compute{SliceName}Score } from "./compute";  // Only if other slices need it

// ── Components ─────────────────────────────────────────────────────────────
// export { {SliceName}Card } from "./components/{SliceName}Card";  // Only cross-slice components
```

**`features/_template/tests/compute.test.ts`**
```typescript
import { describe, it, expect } from "vitest";
// import { compute{SliceName}Score } from "../compute";

describe("{SliceName} compute", () => {
  it("TODO: add tests", () => {
    expect(true).toBe(true);
  });
});
```

---

## 4. What Qualifies as Shared Code

### The three tests for shared code

A piece of code belongs in `features/_shared/` if and only if it passes ALL THREE of these tests:

**Test 1 — Used by 3 or more independent slices today** (not "might be used" — actually used now)

**Test 2 — Has no domain ownership** (it is not "the coaching team's permission check" or "the billing team's date formatting" — it belongs to no feature)

**Test 3 — Is infrastructure, not domain logic** (it provides a capability, not a business rule)

### Currently approved shared modules

| Module | Justification |
|---|---|
| `_shared/auth/` | Used by every slice; has no domain ownership; pure infrastructure |
| `_shared/permissions/` | `PERMISSION_MATRIX` and `can()` are correct here — centralized by design, used by all slices |
| `_shared/api-client/` | `apiGet`, `apiPost`, etc. are the transport layer — no domain meaning |
| `_shared/navigation/` | `ROLE_NAV` config and `NavItem` type — the nav system is intentionally centralized |
| `_shared/design-system/` | shadcn/ui components + custom tokens — visual primitives with no domain logic |
| `_shared/types/` | `Org`, `User`, `StaffRole` — domain types that predate all slices |

### What is NOT allowed in `_shared/`

| Attempted addition | Why it's wrong | Where it should live |
|---|---|---|
| `_shared/coaching-utils.ts` | Coaching-specific logic | `features/coaching/compute.ts` |
| `_shared/readiness-labels.ts` | Readiness-owned display logic | `features/readiness/compute.ts` |
| `_shared/date-format.ts` | "Used by many slices" is not enough; `date-fns` is the utility — wrap it in the slice that needs the specific format | Each slice wraps `date-fns` directly |
| `_shared/player-avatar.tsx` | Roster-owned component | `features/admin-billing/components/PlayerAvatar.tsx`, exported from `features/admin-billing/index.ts` |
| `_shared/use-debounce.ts` | Used by 5+ slices | `_shared/hooks/useDebounce.ts` — OK because it is a pure React utility hook with zero domain coupling |
| `_shared/format-currency.ts` | Billing-specific format | `features/admin-billing/compute.ts` |

### The "used by two slices" rule

When two slices both need the same logic, do NOT immediately move it to `_shared/`. Instead:

1. **One slice owns it** — the slice that most naturally owns the domain concept exports it from its `index.ts`
2. **The other slice imports from the owning slice's public API** — `import { computeReadinessScore } from "@/features/readiness"`
3. **If three or more slices import it**, that is the signal to consider `_shared/` — but only if it passes all three tests above

The pattern "let's put it in shared because two slices use it" is how `lib/` was created in the first place.

---

## 5. API Client Organization

### The canonical client (`_shared/api-client/`)

```typescript
// features/_shared/api-client/index.ts
export { apiGet, apiPost, apiPatch, apiDelete, apiFetch } from "./client";
export type { ApiError } from "./client";
```

```typescript
// features/_shared/api-client/client.ts
const BASE = "/api";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let token: string | null = null;
  try {
    const { Clerk } = window as any;
    if (Clerk?.session) token = await Clerk.session.getToken();
  } catch { /* demo mode */ }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error: ApiError = { status: res.status, message: body.error ?? `API error ${res.status}` };
    throw error;
  }

  return res.json() as Promise<T>;
}

export type ApiError = { status: number; message: string };

export const apiGet  = <T>(path: string)               => apiFetch<T>(path);
export const apiPost = <T>(path: string, body: unknown) => apiFetch<T>(path, { method: "POST",   body: JSON.stringify(body) });
export const apiPatch= <T>(path: string, body: unknown) => apiFetch<T>(path, { method: "PATCH",  body: JSON.stringify(body) });
export const apiDelete=<T>(path: string)               => apiFetch<T>(path, { method: "DELETE" });
export { apiFetch };
```

### Server module pattern

Server modules mirror the client feature structure. One module per client slice (or sub-domain). Each module has:

```
server/modules/{domain}/
├── routes.ts      ← Express routes — thin; calls service, returns response
├── service.ts     ← Business logic — orchestrates repository calls
├── schema.ts      ← Zod request/response validators
├── score.ts       ← Domain algorithms (if applicable)
├── notifications.ts ← Domain notification logic (uses server/lib/sms.ts)
└── tests/
    ├── service.test.ts
    └── routes.test.ts
```

**`routes.ts` must be thin.** If a route handler is more than 15 lines, extract to `service.ts`.

```typescript
// server/modules/readiness/routes.ts — GOOD EXAMPLE (thin routes)
router.post("/", async (req, res) => {
  try {
    const ctx = await requireOrg(req);
    const input = SubmitCheckinSchema.parse(req.body);
    const result = await readinessService.submitCheckin(ctx, input);
    res.json(result);
  } catch (err) {
    handleError(err, res);
  }
});

// server/modules/readiness/service.ts — business logic lives here
export const readinessService = {
  async submitCheckin(ctx: OrgContext, input: SubmitCheckinInput) {
    const repo = createRepository(ctx);
    const flagged = input.fatigue >= 7 || input.sleep <= 5 || input.soreness >= 7;
    const record = await repo.readiness.create({ ...input, playerId: ctx.userId, flagged });
    if (flagged) {
      await inngest.send({ name: "readiness/player-flagged", data: { ...ctx, playerId: ctx.userId } });
    }
    return record;
  },
};
```

---

## 6. Import Rules Between Slices

### The four laws

**Law 1: Import from `index.ts` only**
```typescript
// ✅ CORRECT — importing from the public entry point
import type { CoachingAction } from "@/features/coaching";
import { useCoachingActions } from "@/features/coaching";

// ❌ WRONG — importing from an internal file
import type { CoachingAction } from "@/features/coaching/types";
import { useCoachingActions } from "@/features/coaching/hooks";
```

**Law 2: Never import pages from another slice**
```typescript
// ❌ WRONG — pages are owned by their slice; never imported elsewhere
import { FilmLibraryPage } from "@/features/coaching/pages/coach/FilmLibraryPage";

// Router (in app/router.tsx) imports pages. No other file does.
const FilmLibrary = lazy(() => import("@/features/coaching/pages/coach/FilmLibraryPage"));
```

**Law 3: Never import mock data from another slice**
```typescript
// ❌ WRONG — mock data is internal to the slice
import { MOCK_FILM_SESSIONS } from "@/features/coaching/mock";

// Only acceptable in tests of the coaching slice itself, or in a demo-mode provider
// owned by the coaching slice.
```

**Law 4: Never cross-import between `_shared/` modules**
```typescript
// ❌ WRONG — shared modules must not depend on each other beyond basic types
// _shared/navigation/config.ts
import { can } from "@/features/_shared/permissions";  // forbidden

// ✅ CORRECT — permissions logic stays in features/; navigation imports the type
import type { StaffRole } from "@/features/_shared/types";
```

### Import path rules

```typescript
// ✅ Use path aliases always — no relative paths across slices
import { useFilmSessions } from "@/features/coaching";
import { can } from "@/features/_shared/permissions";
import { apiGet } from "@/features/_shared/api-client";

// ✅ Relative paths only within the same slice
// Inside features/coaching/hooks.ts:
import { filmSessionsApi } from "./api";          // ✓ same slice
import type { FilmSession } from "./types";       // ✓ same slice

// ❌ Relative paths across slices are forbidden
import { something } from "../../readiness/types"; // ✗ use @/features/readiness
import { other } from "../../../lib/utils";        // ✗ use @/features/_shared/...
```

### Enforcing these rules with ESLint

Add to `eslint.config.js`:

```javascript
// eslint.config.js
import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import";

export default defineConfig([
  {
    plugins: { import: importPlugin },
    rules: {
      // Law 1: No direct internal feature imports
      "no-restricted-imports": ["error", {
        patterns: [
          // Block internal imports from other feature slices
          {
            group: ["@/features/*/types", "@/features/*/hooks", "@/features/*/api",
                    "@/features/*/store", "@/features/*/compute", "@/features/*/mock",
                    "@/features/*/components/*", "@/features/*/pages/*"],
            message: "Import from the feature's index.ts only: '@/features/{slice-name}'",
          },
          // Block importing mock data anywhere except tests and demo providers
          {
            group: ["@/features/*/mock"],
            message: "Mock data is for tests and demo mode only. Import from index.ts.",
          },
          // Block new additions to the deprecated lib/
          {
            group: ["@/lib/customDrillsStore", "@/lib/drillTemplateStore",
                    "@/lib/practicePlanStore", "@/lib/idp-selectors"],
            message: "This file is being migrated. Import from the appropriate feature slice.",
          },
        ],
      }],

      // Enforce that lib/ shims are not used in new code
      "import/no-deprecated": "warn",
    },
    // Exception: allow internal imports within the same slice
    // This requires the import/no-restricted-paths plugin for per-directory rules
  },
]);
```

Note: Full per-directory enforcement requires `eslint-plugin-boundaries`. Add it when the team is ready to enforce strictly.

```bash
npm install --save-dev eslint-plugin-boundaries
```

---

## 7. Rules for Shared Abstractions

### The shared abstraction decision tree

```
Is it used by 3+ slices today (not hypothetically)?
├── NO  → Belongs in the most relevant single slice. Export from its index.ts.
└── YES → Does it contain domain-specific logic (billing rules, coaching terms, etc.)?
          ├── YES → Still belongs in the owning domain. Others import from that slice.
          └── NO  → Is it pure infrastructure (transport, auth, UI primitives)?
                    ├── NO  → Reconsider. Almost everything domain-level has an owner.
                    └── YES → May go in _shared/. Document why in a comment.
```

### The refusal pattern

When someone wants to add something to `_shared/`, use this checklist before approving:

- [ ] It is used by 3+ distinct slices today, confirmed by `grep -r "import.*from" --include="*.ts"`
- [ ] It has zero domain-specific terminology in its function names or type names
- [ ] Removing it from `_shared/` would require duplicating identical code (not similar code — identical)
- [ ] A new engineer would not find its placement surprising after reading the feature list

If any checkbox is unchecked, the code stays in the owning feature and is exported from `index.ts`.

---

## 8. Testing Strategy by Slice

### The testing pyramid for a VSA codebase

```
         E2E (Playwright)
        ─────────────────
       Critical user flows
       1–2 per slice

      Component (Vitest + Testing Library)
     ─────────────────────────────────────
    Critical interactive components
    Especially forms, modals, state transitions
    5–10 per slice

   Integration (Vitest + MSW)
  ─────────────────────────────
  React Query hooks with mocked server
  Data loading, error states, cache invalidation
  1 test file per slice (hooks.test.ts)

 Unit (Vitest)
─────────────
compute.ts functions — 100% coverage required
Pure functions are fast to test and document behavior
1 test file per slice (compute.test.ts)
```

### Per-file testing requirements

| File | Test type | Coverage target | Test location |
|---|---|---|---|
| `compute.ts` | Unit (Vitest) | 100% — every exported function | `tests/compute.test.ts` |
| `hooks.ts` | Integration (MSW) | All query + mutation paths; error state | `tests/hooks.test.ts` |
| `{Component}.tsx` (critical) | Component (Testing Library) | Interactions, state changes | `tests/{Component}.test.tsx` |
| `pages/` | E2E (Playwright) | Happy path + primary error path | `/e2e/{slice}.spec.ts` |
| `api.ts` | Not unit tested directly | Tested via hooks integration tests | — |
| `store.ts` | Unit or component | All state transitions | `tests/store.test.ts` |

### Concrete testing patterns

**`compute.ts` unit test**
```typescript
// features/coaching/tests/compute.test.ts
import { describe, it, expect } from "vitest";
import {
  computePracticeDuration,
  groupActionsByPlayer,
  prioritizeActions,
  isPlanOverBudget,
} from "../compute";
import { MOCK_COACHING_ACTIONS } from "../mock";

describe("computePracticeDuration", () => {
  it("returns 0 for empty blocks", () => {
    expect(computePracticeDuration([])).toBe(0);
  });

  it("sums durations correctly", () => {
    const blocks = [
      { id: "1", durationMinutes: 15, type: "drill", name: "Warm up" },
      { id: "2", durationMinutes: 20, type: "scrimmage", name: "5v5" },
    ];
    expect(computePracticeDuration(blocks)).toBe(35);
  });
});

describe("prioritizeActions", () => {
  it("sorts high priority before medium before low", () => {
    const actions = [
      { ...MOCK_COACHING_ACTIONS[0], priority: "low"    as const, createdAt: "2026-01-01T00:00:00Z" },
      { ...MOCK_COACHING_ACTIONS[0], priority: "high"   as const, createdAt: "2026-01-02T00:00:00Z" },
      { ...MOCK_COACHING_ACTIONS[0], priority: "medium" as const, createdAt: "2026-01-03T00:00:00Z" },
    ];
    const sorted = prioritizeActions(actions);
    expect(sorted[0].priority).toBe("high");
    expect(sorted[1].priority).toBe("medium");
    expect(sorted[2].priority).toBe("low");
  });
});
```

**`hooks.ts` integration test with MSW**
```typescript
// features/coaching/tests/hooks.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFilmSessions, useCreateFilmSession } from "../hooks";
import { MOCK_FILM_SESSIONS } from "../mock";

const server = setupServer(
  http.get("/api/film-sessions", () =>
    HttpResponse.json(MOCK_FILM_SESSIONS)
  ),
  http.post("/api/film-sessions", async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ ...MOCK_FILM_SESSIONS[0], ...body, id: "new-session" });
  }),
);

beforeAll(()  => server.listen());
afterEach(()  => server.resetHandlers());
afterAll(()   => server.close());

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useFilmSessions", () => {
  it("fetches and returns film sessions", async () => {
    const { result } = renderHook(() => useFilmSessions(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(MOCK_FILM_SESSIONS.length);
    expect(result.current.data![0].title).toBe("Barnegat vs. Toms River North");
  });

  it("handles server errors gracefully", async () => {
    server.use(http.get("/api/film-sessions", () => HttpResponse.json({}, { status: 500 })));
    const { result } = renderHook(() => useFilmSessions(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});
```

**Component test**
```typescript
// features/coaching/tests/CoachingActionCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { CoachingActionCard } from "../components/actions/CoachingActionCard";
import { MOCK_COACHING_ACTIONS } from "../mock";

const mockAction = MOCK_COACHING_ACTIONS[0];

describe("CoachingActionCard", () => {
  it("renders the action category and player name", () => {
    render(
      <CoachingActionCard
        action={mockAction}
        playerName="Marcus Davis"
        onResolve={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText("Defense")).toBeInTheDocument();
    expect(screen.getByText("Marcus Davis")).toBeInTheDocument();
  });

  it("calls onResolve when the resolve button is clicked", async () => {
    const onResolve = vi.fn();
    render(
      <CoachingActionCard
        action={mockAction}
        playerName="Marcus Davis"
        onResolve={onResolve}
        onDismiss={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /resolve/i }));
    expect(onResolve).toHaveBeenCalledWith(mockAction.id);
  });
});
```

---

## 9. Mock Data Strategy by Slice

### The three modes

**Mode 1: Production** — no mock data. All data from real API. ESLint rule prevents mock imports.

**Mode 2: Demo mode** (`VITE_DEMO_MODE=true` or `?demo=1` in URL) — API calls intercepted by MSW service worker; mock data served. Useful for sales demos and early user onboarding.

**Mode 3: Development** — uses real API against a development database seeded with realistic data. Only falls back to mock when the specific API route is not yet implemented.

### Mock data rules

**Rule 1: Mock data must be typed**
```typescript
// ✅ TypeScript enforces that mock data matches the type
import type { CoachingAction } from "./types";
export const MOCK_COACHING_ACTIONS: CoachingAction[] = [ ... ];

// ❌ Untyped mock data drifts from real types
export const MOCK_COACHING_ACTIONS = [ { id: "1", ... } ]; // Type drifts silently
```

**Rule 2: Mock data uses realistic content**
```typescript
// ✅ CORRECT — realistic basketball content
title: "Barnegat vs. Toms River North"
notes: "Defensive stance — knees not bent, reaching with hands"

// ❌ WRONG — placeholder content
title: "Test Session"
notes: "Test note test note"
```

**Rule 3: One `mock.ts` per slice, no exceptions**
```typescript
// ❌ WRONG — scattered mock files
features/coaching/film/mock-sessions.ts    // ✗
features/coaching/actions/testActions.ts   // ✗

// ✅ CORRECT — all mock data in one place per slice
features/coaching/mock.ts                  // ✓
```

**Rule 4: Mock factories for variable data**
```typescript
// When tests need variants, use a factory function
export function mockFilmSession(overrides?: Partial<FilmSession>): FilmSession {
  return {
    id:            `session-${Math.random().toString(36).slice(2)}`,
    orgId:         "org-demo",
    title:         "Demo Session",
    type:          "practice",
    status:        "ready",
    muxAssetId:    "demo-asset",
    muxPlaybackId: "demo-playback",
    date:          "2026-05-01",
    createdAt:     new Date().toISOString(),
    ...overrides,
  };
}
```

**Rule 5: Demo mode provider pattern**

```typescript
// features/coaching/DemoModeProvider.tsx — only file that imports mock.ts
// This component is imported by app/providers.tsx only in demo mode
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MOCK_FILM_SESSIONS, MOCK_COACHING_ACTIONS } from "./mock";

export function CoachingDemoProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  useEffect(() => {
    qc.setQueryData(["film-sessions", "list"], MOCK_FILM_SESSIONS);
    qc.setQueryData(["coaching-actions", "list"], MOCK_COACHING_ACTIONS);
  }, [qc]);

  return <>{children}</>;
}

// app/providers.tsx
const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true" ||
                   new URLSearchParams(window.location.search).has("demo");

export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {isDemoMode ? (
        <CoachingDemoProvider>
          <ReadinessDemoProvider>
            {children}
          </ReadinessDemoProvider>
        </CoachingDemoProvider>
      ) : children}
    </QueryClientProvider>
  );
}
```

---

## 10. Migration Strategy for Future Refactors

### The shim-first pattern (established — maintain it)

When moving a file:
1. Create the file at the new location with updated imports
2. Replace the old file with a re-export shim
3. Update consumers to use the new path over time
4. Delete the shim when `grep -r "old-path" client/src/ | wc -l` returns 0

Never delete before shimming. Never shim without a plan to delete.

### The lib/ dissolution roadmap

Files remaining in `lib/` that need migration:

| File | Target location | Priority |
|---|---|---|
| `lib/practicePlanStore.ts` | `features/coaching/store.ts` | P0 — before coaching wiring |
| `lib/idp-selectors.ts` | `features/assessments/compute.ts` | P1 — before assessments wiring |
| `lib/customDrillsStore.ts` | `features/academy/store.ts` | P1 — before academy wiring |
| `lib/drillTemplateStore.ts` | `features/academy/store.ts` | P1 — before academy wiring |
| `lib/haptics.ts` | `features/_shared/haptics.ts` | P1 — used by nav system |
| `lib/auth.ts` | `features/_shared/auth/index.ts` | P0 — before any new features |
| `lib/utils.ts` | Audit: what's actually used → `_shared/` or delete | P1 |
| `lib/docs.ts` | `features/documentation/` or delete | P2 |
| `lib/readiness.ts` | Already shimmed → `features/readiness/` | Shim only, delete when consumers updated |
| `lib/playbookStore.ts` et al | Already shimmed → `features/playbook/` | Shim only, delete when consumers updated |

**Shim cleanup cadence**: Run `grep -r "@deprecated" client/src/lib --include="*.ts" -l` weekly. Any shim with zero non-shim consumers gets deleted in the same sprint it's discovered.

### Adding a new slice

Checklist for any new feature slice:

```bash
# 1. Copy the template
cp -r client/src/features/_template client/src/features/{new-slice}

# 2. Register in the nav config
# → features/navigation/config.ts: add to ROLE_NAV for appropriate roles

# 3. Register routes in the router
# → app/router.tsx: lazy-import pages, add Route entries

# 4. Register in route guards
# → features/navigation/guards.ts: add ROUTE_GUARDS entry

# 5. Create server module
mkdir -p server/modules/{new-slice}
touch server/modules/{new-slice}/routes.ts
touch server/modules/{new-slice}/service.ts
touch server/modules/{new-slice}/schema.ts

# 6. Register server module in app.ts
# → server/app.ts: register{NewSlice}Routes(router)

# 7. Create DB sub-repository (if new DB tables)
# → shared/db/repositories/{new-slice}.ts
# → shared/db/repository.ts: add to createRepository() spread
```

### Deprecation protocol for internal slice files

When a file inside a slice is being replaced:

```typescript
/**
 * @deprecated Use `./compute.ts` instead.
 * This file will be deleted after the migration PR is merged.
 * Tracking issue: #123
 */
export * from "./compute";
```

The issue number is mandatory. "We'll delete it later" without a tracked issue is how shims live forever.

---

## 11. Naming Conventions

### Files and directories

| Pattern | Convention | Example |
|---|---|---|
| Feature slice directories | `kebab-case` | `admin-billing/`, `manager-labs/` |
| React components | `PascalCase.tsx` | `FilmSessionCard.tsx` |
| Non-component TS files | `camelCase.ts` | `hooks.ts`, `compute.ts` |
| Test files | `{name}.test.ts(x)` | `compute.test.ts`, `ClipActionBar.test.tsx` |
| Server module directories | `kebab-case` | `coaching-actions/`, `film-analysis/` |
| Slice index | Always `index.ts` | Never `coaching.ts` or `main.ts` |
| Template directory | `_template/` | The underscore signals "meta, not a slice" |
| Shared directory | `_shared/` | The underscore signals "meta, not a feature" |

### TypeScript conventions

| Pattern | Convention | Example |
|---|---|---|
| Types and interfaces | `PascalCase` | `CoachingAction`, `FilmSession` |
| Type aliases for unions | `PascalCase` | `FilmSessionStatus` |
| Zod schemas | `{Name}Schema` | `CreateFilmSessionSchema` |
| Zod-inferred types | `{Name}Input` for inputs | `CreateFilmSessionInput` |
| Enums (const objects) | `SCREAMING_SNAKE_CASE` for keys | `COACHING_ACTION_TYPES` |
| Enum values | `string` literals preferred over TS enums | `"open" \| "resolved"` |

### Functions and hooks

| Pattern | Convention | Example |
|---|---|---|
| React hooks | `use{Resource}` or `use{Action}{Resource}` | `useFilmSessions`, `useResolveCoachingAction` |
| Query hooks | `use{Resource}` (plural for lists) | `useCoachingActions`, `useFilmSession` |
| Mutation hooks | `use{Verb}{Resource}` | `useCreateFilmSession`, `useResolveAction` |
| API functions (in `api.ts`) | Objects with method names | `filmSessionsApi.list()` |
| Compute functions | Descriptive verb phrases | `computePracticeDuration`, `groupActionsByPlayer` |
| Validation functions | `validate{Thing}` or `is{Condition}` | `validateScoreJump`, `isPlanOverBudget` |
| Factory functions | `make{Resource}` or `create{Resource}` | `makeDefaultPlanBlock` |
| Mock factories | `mock{Resource}` | `mockFilmSession(overrides?)` |
| Mock constants | `MOCK_{RESOURCE}S` | `MOCK_FILM_SESSIONS` |

### Query key conventions

```typescript
// Query keys follow a hierarchical tuple pattern
const KEYS = {
  all:    ["coaching-actions"]                     as const,
  lists:  () => [...KEYS.all, "list"]             as const,
  byPlayer: (id: string) => [...KEYS.all, "player", id] as const,
  detail: (id: string) => [...KEYS.all, id]       as const,
};

// Key name matches the server resource name (lowercase, hyphenated)
// "coaching-actions" matches POST /api/coaching-actions
// "film-sessions" matches GET /api/film-sessions
```

### CSS / styling conventions

```typescript
// Use Tailwind classes for layout; CSS variables for semantic colors
<div className="flex items-center gap-3 p-4 rounded-lg border"
     style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>

// Never hardcode color hex values in components — use CSS variables
// ❌ style={{ color: "#a855f7" }}
// ✅ style={{ color: "var(--color-accent)" }}

// Tailwind color utilities only for structural colors (bg-white, text-black)
// Everything semantic goes through CSS variables
```

---

## 12. Slice Examples — Dashboard, Academy, Assessments, Coaching

### Dashboard slice (concrete structure)

```
features/dashboard/
├── types.ts
│   └── AlertItem, ProgramHealthSnapshot, DashboardSummary
├── api.ts
│   └── dashboardApi.coach(), dashboardApi.player(), dashboardApi.director()
├── hooks.ts
│   └── useCoachDashboard(), usePlayerDashboard(), useDirectorDashboard(), useAlerts()
├── compute.ts
│   └── computeHealthScore(), prioritizeActionItems(), groupByLane(), labelAlert()
├── mock.ts
│   └── MOCK_COACH_DASHBOARD, MOCK_PLAYER_DASHBOARD, MOCK_DIRECTOR_DASHBOARD
├── index.ts
│   └── exports: AlertItem, ProgramHealthSnapshot types; useCoachDashboard, usePlayerDashboard; ProgramHealthGauge (used by director nav)
│
├── components/
│   ├── CommandStrip.tsx          ← today's event + countdown
│   ├── ReadinessDotGrid.tsx      ← compact team grid (also exported — used by Coaching slice)
│   ├── ActionLane.tsx            ← single scrollable priority lane
│   ├── ActionLaneContainer.tsx   ← multi-lane layout
│   ├── QuickActionsBar.tsx       ← 4 coach shortcuts
│   ├── ProgramHealthGauge.tsx    ← 0-100 score with delta (exported for director nav)
│   ├── FilmQueueSidebar.tsx      ← top pending reviews
│   ├── DevelopmentAlerts.tsx     ← IDP gap + streak sidebar
│   └── ReadinessDetailDrawer.tsx ← player drill-down on dot tap
│
├── pages/
│   ├── CoachDashboard.tsx        ← assembles: CommandStrip + ReadinessDotGrid + ActionLanes + sidebar
│   ├── PlayerDashboard.tsx       ← assembles: check-in CTA + today's event + IDP focus + assignments
│   ├── DirectorDashboard.tsx     ← assembles: ProgramHealthGauge + warnings + enrollment
│   └── AdminDashboard.tsx        ← assembles: open tasks list + billing snapshot
│
└── tests/
    ├── compute.test.ts           ← computeHealthScore, prioritizeActionItems
    ├── hooks.test.ts             ← useCoachDashboard loading/error/success
    └── ActionLane.test.tsx       ← renders items, handles empty state, tap navigation
```

**What Dashboard imports from other slices:**
```typescript
// features/dashboard/index.ts imports — reads from other slices' public APIs
import type { ReadinessCheckin } from "@/features/readiness";  // ✓ public type
import type { CoachingAction }  from "@/features/coaching";    // ✓ public type
import type { Invoice }         from "@/features/admin-billing"; // ✓ public type
// Dashboard does NOT own any of this data — it aggregates it via a server-side summary endpoint
```

---

### Academy slice (concrete structure)

```
features/academy/
├── types.ts
│   └── DrillLibraryEntry, LearningPath, Module, ModuleProgress,
│       FilmAssignment, FilmAssignmentCompletion, CertificationAward
├── api.ts
│   └── drillsApi, learningPathsApi, filmAssignmentsApi, certificationsApi
├── hooks.ts
│   └── useDrillLibrary(), useDrill(), useFilmAssignments(), useLearningPath(),
│       useModuleProgress(), useCompleteModule(), useMarkAssignmentWatched()
├── compute.ts
│   └── computePathProgress(), computeQuizScore(), isDrillMatch(),
│       isAssignmentOverdue(), computeWatchedPercentage()
├── mock.ts
│   └── MOCK_DRILLS (50 global drills), MOCK_FILM_ASSIGNMENTS, MOCK_LEARNING_PATHS
├── index.ts
│   └── exports: DrillLibraryEntry, useDrillLibrary (for Practice slice's drill picker)
│              FilmAssignment type, useFilmAssignments (for player dashboard)
│
├── components/
│   ├── DrillCard.tsx
│   ├── DrillDetailSheet.tsx      ← bottom sheet; exported because Practice slice uses it
│   ├── DrillSearchInput.tsx      ← used inside DrillDetailSheet
│   ├── FilmAssignmentCard.tsx    ← player-facing assignment card
│   ├── ModuleProgressBar.tsx
│   ├── CertificationBadge.tsx
│   └── QuizQuestion.tsx
│
├── pages/
│   ├── coach/
│   │   ├── DrillLibraryPage.tsx
│   │   ├── CoachEducationHub.tsx
│   │   └── LearningPathPage.tsx
│   └── player/
│       ├── PlayerAssignmentsPage.tsx
│       ├── PlayStudy.tsx
│       └── PlayQuizRunner.tsx
│
└── tests/
    ├── compute.test.ts           ← computePathProgress, isDrillMatch, isAssignmentOverdue
    ├── hooks.test.ts             ← useDrillLibrary filtering, useMarkAssignmentWatched
    └── DrillCard.test.tsx        ← renders, handles selection
```

**What Academy imports from other slices:**
```typescript
// Academy needs film clip data to create assignments
import type { FilmSession }  from "@/features/coaching";  // ✓ clip source
// Academy needs player list for assignment targeting
import { useRoster }         from "@/features/admin-billing"; // ✓ player list

// Academy exports DrillLibraryEntry and useDrillLibrary so Coaching (practice planning)
// can show a drill picker. This is the cross-slice link that was approved in the spec.
```

---

### Assessments slice (concrete structure)

```
features/assessments/
├── types.ts
│   └── AssessmentRubric, AssessmentEvent, AssessmentScore,
│       IdpFocusArea, IdpMilestone, ProgramBenchmark, SkillVelocity
├── api.ts
│   └── assessmentsApi (events, scores, rubrics), idpApi (CRUD), benchmarksApi
├── hooks.ts
│   └── useAssessmentEvents(), usePlayerAssessments(), useIdp(), useIdpFocusAreas(),
│       useQuickAssess(), useBenchmarks(), useSkillVelocity()
├── compute.ts
│   └── computeSkillVelocity(), computeBenchmarkPercentile(), identifyIdpGaps(),
│       validateScoreJump(), suggestFocusAreas(), computeIdpCompletionRate()
├── mock.ts
│   └── MOCK_ASSESSMENT_RUBRICS, MOCK_ASSESSMENT_EVENTS, MOCK_IDP_FOCUS_AREAS,
│       MOCK_BENCHMARKS, mockAssessmentScore()
├── index.ts
│   └── exports: IdpFocusArea type (→ Coaching for add_to_idp action),
│              useIdpFocusAreas (→ Coaching for action creation form),
│              ProgramBenchmark type (→ Manager Labs),
│              usePlayerAssessments (→ Dashboard for dev alerts)
│
├── components/
│   ├── SkillScoreSlider.tsx      ← 1-10 input, large touch targets
│   ├── SkillSparkline.tsx        ← mini trend chart per sub-skill
│   ├── BenchmarkBar.tsx          ← player score vs. program average
│   ├── IdpFocusAreaCard.tsx      ← one focus area with edit controls
│   ├── IdpProgressRing.tsx       ← circular completion indicator
│   └── QuickAssessPlayerCard.tsx ← one player card in the Quick Assess flow
│
├── pages/
│   ├── coach/
│   │   ├── SkillAssessmentPage.tsx
│   │   ├── QuickAssessPage.tsx    ← full-screen mobile mode
│   │   ├── BenchmarkingPage.tsx
│   │   ├── IDPGeneratorPage.tsx
│   │   └── PlayerIDPPage.tsx
│   └── player/
│       ├── AssessmentHistoryPage.tsx
│       └── SkillVelocityPage.tsx
│
└── tests/
    ├── compute.test.ts           ← identifyIdpGaps, computeSkillVelocity, validateScoreJump
    ├── hooks.test.ts             ← usePlayerAssessments, useQuickAssess
    └── SkillScoreSlider.test.tsx ← renders, handles 1-10 constraint, touch input
```

---

### Coaching slice (concrete structure — the largest slice)

```
features/coaching/
├── types.ts
│   └── FilmSession, FilmAnnotation, CoachingAction, PracticePlan,
│       PracticeBlock, PracticeExecution, ReadinessOverride, Opponent
├── api.ts
│   └── filmSessionsApi, annotationsApi, coachingActionsApi,
│       practicePlansApi, readinessOverrideApi
├── hooks.ts
│   └── useFilmSessions(), useFilmSession(), useFilmQueue(), useAnnotations(),
│       useCoachingActions(), usePracticePlan(), useTeamReadiness(),
│       useCreateAnnotation(), useCreateCoachingAction(), useResolveCoachingAction()
├── store.ts
│   └── usePracticeBuilderStore() ← dnd-kit block order, draft state
├── compute.ts
│   └── computePracticeDuration(), groupActionsByPlayer(), prioritizeActions(),
│       isPlanOverBudget(), deriveSessionStatus(), filterFilmByType()
├── mock.ts
│   └── MOCK_FILM_SESSIONS, MOCK_ANNOTATIONS, MOCK_COACHING_ACTIONS,
│       MOCK_PRACTICE_PLANS, mockFilmSession(), mockCoachingAction()
├── index.ts
│   └── exports:
│       - CoachingAction type + status types (→ Dashboard, Manager Labs)
│       - useCoachingActions() (→ Dashboard action lanes)
│       - PracticePlan type (→ Dashboard today's plan preview)
│       - ClipActionBar (→ actually stays internal; Academy references film data differently)
│       - TeamReadinessGrid (→ Dashboard ReadinessDotGrid uses this data shape)
│       - useTeamReadiness() (→ Dashboard, Manager Labs)
│
├── components/
│   ├── film/
│   │   ├── FilmSessionCard.tsx
│   │   ├── AnnotationPanel.tsx
│   │   ├── ClipActionBar.tsx      ← film-to-action bridge; internal to this slice
│   │   └── AICorroborationCard.tsx
│   ├── practice/
│   │   ├── PlanBlock.tsx          ← draggable block (dnd-kit)
│   │   ├── DrillPickerDrawer.tsx  ← imports DrillDetailSheet from Academy (public export)
│   │   ├── BlockTimer.tsx
│   │   └── PracticeLoadBar.tsx
│   ├── actions/
│   │   ├── CoachingActionCard.tsx
│   │   ├── ActionsFeed.tsx
│   │   └── ActionDetailDrawer.tsx
│   └── readiness/
│       ├── ReadinessDetailDrawer.tsx
│       └── OverrideModal.tsx
│
├── pages/
│   ├── coach/
│   │   ├── FilmLibraryPage.tsx
│   │   ├── FilmSessionDetail.tsx
│   │   ├── FilmQueuePage.tsx
│   │   ├── CoachActionsPage.tsx
│   │   ├── PracticePlanBuilder.tsx
│   │   ├── PracticeExecutionPage.tsx
│   │   ├── PracticeReviewPage.tsx
│   │   ├── TeamReadinessPage.tsx
│   │   ├── CoachingJournalPage.tsx
│   │   ├── OpponentScoutPage.tsx
│   │   └── GameDayPage.tsx
│   └── assistant/
│       ├── AssistantFilmQueuePage.tsx
│       └── AssistantPracticeContribPage.tsx
│
└── tests/
    ├── compute.test.ts            ← full coverage of all compute functions
    ├── hooks.test.ts              ← film fetch, action creation, plan save
    ├── store.test.ts              ← block ordering, isDirty state
    ├── CoachingActionCard.test.tsx
    └── PlanBlock.test.tsx         ← drag-drop interactions
```

---

## 13. Good and Bad Boundary Examples

### ✅ GOOD: Cross-slice via public API

```typescript
// features/coaching/components/practice/DrillPickerDrawer.tsx
// The practice plan builder needs drills from the Academy slice.
// Coaching imports from Academy's public index.

import { useDrillLibrary }    from "@/features/academy"; // ✓ public hook
import { DrillDetailSheet }   from "@/features/academy"; // ✓ explicitly exported component

export function DrillPickerDrawer({ onSelect }: Props) {
  const { data: drills = [] } = useDrillLibrary({ search: query });
  return (
    <Sheet>
      {drills.map(d => <DrillCard key={d.id} drill={d} onSelect={() => onSelect(d)} />)}
    </Sheet>
  );
}
```

---

### ❌ BAD: Cross-slice internal import

```typescript
// features/coaching/components/practice/DrillPickerDrawer.tsx
// ❌ Directly importing from Academy internals — forbidden

import { useDrillLibrary } from "@/features/academy/hooks";    // ✗ internal file
import { DrillCard }       from "@/features/academy/components/DrillCard"; // ✗ not exported
import type { Drill }      from "@/features/academy/types";   // ✗ use index.ts
```

---

### ✅ GOOD: Logic in compute.ts, UI stays thin

```typescript
// features/coaching/compute.ts — logic lives here
export function groupActionsByPlayer(actions: CoachingAction[]) {
  return actions.reduce<Record<string, CoachingAction[]>>((acc, a) => {
    const key = a.playerId ?? "_team";
    (acc[key] ??= []).push(a);
    return acc;
  }, {});
}

// features/coaching/pages/coach/CoachActionsPage.tsx — page stays thin
import { useCoachingActions } from "../hooks";
import { groupActionsByPlayer } from "../compute";
import { ActionsFeed } from "../components/actions/ActionsFeed";

export default function CoachActionsPage() {
  const { data: actions = [] } = useCoachingActions();
  const grouped = groupActionsByPlayer(actions);  // ✓ uses compute
  return <ActionsFeed grouped={grouped} />;
}
```

---

### ❌ BAD: Logic embedded in component

```typescript
// features/coaching/pages/coach/CoachActionsPage.tsx
// ❌ Sorting and grouping logic inside the component

export default function CoachActionsPage() {
  const { data: actions = [] } = useCoachingActions();

  // ❌ This belongs in compute.ts
  const grouped = actions.reduce((acc, action) => {
    const key = action.playerId ?? "_team";
    if (!acc[key]) acc[key] = [];
    acc[key].push(action);
    return acc;
  }, {} as Record<string, CoachingAction[]>);

  // ❌ This belongs in compute.ts
  const sorted = Object.entries(grouped).sort(([, a], [, b]) =>
    a.filter(x => x.priority === "high").length - b.filter(x => x.priority === "high").length
  );

  return <ActionsFeed grouped={Object.fromEntries(sorted)} />;
}
```

---

### ✅ GOOD: Shared only when it passes all three tests

```typescript
// features/_shared/permissions/index.ts
// ✓ Used by every slice (auth, coaching, assessments, billing, dashboard, etc.)
// ✓ No domain ownership — it's not "coaching permissions" or "billing permissions"
// ✓ Pure infrastructure — rule evaluation with no business logic

export function can(role: StaffRole, action: PermissionAction): boolean {
  return PERMISSION_MATRIX[role]?.includes(action) ?? false;
}

// Usage in any slice:
import { can } from "@/features/_shared/permissions";
if (!can(userRole, "view_film_sessions")) redirect("/app");
```

---

### ❌ BAD: Domain logic hiding in shared

```typescript
// features/_shared/coaching-helpers.ts
// ❌ "coaching-helpers" is not shared — it's domain logic masquerading as utility

export function computeActionResolutionRate(actions: CoachingAction[]): number {
  const resolved = actions.filter(a => a.status === "resolved");
  return resolved.length / actions.length;
}

// ✓ This belongs in features/coaching/compute.ts
// ✓ If Manager Labs needs it, it imports from @/features/coaching (public index)
```

---

### ✅ GOOD: Server route stays thin, service has the logic

```typescript
// server/modules/coaching-actions/routes.ts — GOOD: thin
router.post("/:id/resolve", async (req, res) => {
  try {
    const ctx  = await requireOrg(req);
    const notes = z.string().optional().parse(req.body.notes);
    const result = await coachingActionsService.resolve(ctx, req.params.id, notes);
    res.json(result);
  } catch (err) { handleError(err, res); }
});

// server/modules/coaching-actions/service.ts — GOOD: logic here
export const coachingActionsService = {
  async resolve(ctx: OrgContext, actionId: string, notes?: string) {
    const repo = createRepository(ctx);
    const action = await repo.coachingActions.get(actionId);
    if (!action) throw new HttpError(404, "Action not found");
    if (action.status === "resolved") throw new HttpError(409, "Already resolved");
    const updated = await repo.coachingActions.update(actionId, {
      status: "resolved", notes, resolvedAt: new Date().toISOString(),
    });
    await inngest.send({ name: "coaching/action-resolved", data: { ...ctx, actionId } });
    return updated;
  },
};
```

---

## 14. Code Review Checklist for Enforcing VSA

This checklist is a required PR comment before any merge. Copy it into your PR template.

```markdown
## VSA Compliance Checklist

### Imports
- [ ] No imports from `@/features/{slice}/types`, `/{slice}/hooks`, `/{slice}/api`,
      `/{slice}/components/**`, or `/{slice}/pages/**` (internal files) — only from `@/features/{slice}`
- [ ] No `@/lib/` imports except from known shim files (with @deprecated tag)
- [ ] No relative paths (`../../`) crossing feature boundaries — uses `@/` aliases
- [ ] No mock data imported in any page or component outside a DemoModeProvider

### Slice structure
- [ ] New exported functions added to `index.ts` — not just to the internal file
- [ ] New types added to `types.ts` — not inline in components or hooks
- [ ] API calls only in `api.ts` or `hooks.ts` — never inline in components or pages
- [ ] Business logic only in `compute.ts` — not inline in components or hooks
- [ ] Page components under 80 lines — longer pages extract a component

### Tests
- [ ] New `compute.ts` functions have unit tests in `tests/compute.test.ts`
- [ ] New hooks have at least a success case and an error case in `tests/hooks.test.ts`
- [ ] New interactive components have a test for the primary interaction
- [ ] Mock data in `mock.ts` is typed — TypeScript enforces shape matches `types.ts`

### Backend (if server changes)
- [ ] Route handlers are under 15 lines — longer handlers extract to `service.ts`
- [ ] Zod validators used for all request body parsing — no `req.body as any`
- [ ] New Inngest functions registered in `server/inngest/functions/` — not inlined in routes
- [ ] New DB tables have a migration file
- [ ] New domain queries added to `shared/db/repositories/{domain}.ts` — not to `repository.ts` directly

### Shared code
- [ ] Nothing added to `_shared/` without documenting (a) which 3+ slices use it and (b) why it has no domain owner
- [ ] New server infrastructure (API wrappers, providers) goes in `server/lib/` — not in a module
- [ ] No new `@deprecated` shims created without a tracking issue linked

### Anti-patterns check
- [ ] No `lib/` files created — all new code goes in `features/` or `_shared/`
- [ ] No page-level data fetching with `useEffect` + `fetch` — uses React Query hooks
- [ ] No `any` type without a comment explaining why TypeScript cannot infer it
- [ ] No hardcoded color hex values in components — CSS variables or Tailwind utilities only
```

---

## 15. The Drift Prevention System

### Structural enforcement (automated)

Run this script in CI to catch VSA violations before they merge:

```bash
#!/bin/bash
# scripts/check-vsa.sh

VIOLATIONS=0

echo "Checking for cross-slice internal imports..."
# Flag any import of @/features/{slice}/{internal-file}
if grep -rn "from \"@/features/[^\"_][^/]*/\(types\|hooks\|api\|store\|compute\|mock\|components/\|pages/\)" \
     client/src/ --include="*.ts" --include="*.tsx" \
     | grep -v "features/_template\|// vsa-ignore"; then
  echo "❌ FAIL: Cross-slice internal imports detected"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

echo "Checking for new lib/ file additions..."
if git diff --name-only origin/main...HEAD | grep "^client/src/lib/" \
     | grep -v "\.ts$\|shim\|@deprecated"; then
  echo "❌ FAIL: New files added to deprecated lib/"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

echo "Checking for untested compute.ts changes..."
COMPUTE_CHANGED=$(git diff --name-only origin/main...HEAD | grep "compute\.ts")
if [ -n "$COMPUTE_CHANGED" ]; then
  for f in $COMPUTE_CHANGED; do
    SLICE=$(echo "$f" | sed 's|client/src/features/\([^/]*\)/.*|\1|')
    TEST_FILE="client/src/features/$SLICE/tests/compute.test.ts"
    if ! git diff --name-only origin/main...HEAD | grep -q "$TEST_FILE"; then
      echo "❌ FAIL: $SLICE/compute.ts changed without updating compute.test.ts"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done
fi

echo "Checking for mock data in production components..."
if grep -rn "from.*mock\|MOCK_\|mock[A-Z]" \
     client/src/features/*/pages/ client/src/features/*/components/ \
     --include="*.tsx" --include="*.ts" \
     | grep -v "test\|DemoModeProvider\|// vsa-ignore"; then
  echo "❌ FAIL: Mock data imported in production component or page"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

if [ $VIOLATIONS -gt 0 ]; then
  echo ""
  echo "❌ $VIOLATIONS VSA violation(s) detected. Fix before merging."
  exit 1
else
  echo "✅ VSA checks passed"
fi
```

### The escape hatch

When a genuine exception to a VSA rule is required, use the `// vsa-ignore` comment with a mandatory explanation:

```typescript
// vsa-ignore: DashboardSummaryEndpoint aggregates across all slices by design.
// This is the one place where cross-slice imports are structurally necessary.
import type { CoachingAction } from "@/features/coaching/types"; // server-side only
import type { ReadinessCheckin } from "@/features/readiness/types"; // server-side only
```

The escape hatch is in the codebase to be used rarely, not to excuse laziness.

---

*End of HoopsIQ Engineering Conventions & Repo Structure*  
*This document is a living spec. Update it when a pattern changes; delete sections that no longer apply.*
