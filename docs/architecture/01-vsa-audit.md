# HoopsIQ — Vertical Slice Architecture Audit

> Audited: `robertgrant-arch/hoopsos-docs` · May 2026

---

## 1. What Is Working Well

### Server modules are correctly feature-scoped
`server/modules/` is the strongest part of the codebase architecturally. Each feature owns its own `routes.ts` and the registration in `server/app.ts` is clean:

```
server/modules/
  film-analysis/   ← routes, service, schema, pipeline adapter
  readiness/       ← routes
  roster/          ← routes
  assignments/     ← routes
  practice-plans/  ← routes
  messaging/       ← routes + recipient-resolver
  coaching-actions/
  parent/
  announcements/
  waivers/
  seasons/
  teams/
  invoices/
  registrations/
  wods/
  wearables/
```

`film-analysis` goes furthest — it has its own `service.ts` interface, `schema.ts` (Zod validators), and a `pipeline/` adapter abstraction. That's the template the other modules should evolve toward.

### Auth/RBAC is a correctly centralized primitive
`client/src/lib/permissions.ts` contains a single `PERMISSION_MATRIX` and `can(role, action)` function. This *should* be shared and it is. The dual-system (legacy `Permission` vs. new `StaffRole + PermissionAction`) is clearly marked with `@deprecated` tags and migration intent is visible. This is well-handled.

### React Query hooks give features a clean data interface
`client/src/lib/api/hooks/` provides typed, query-keyed hooks per domain (`useRoster`, `useReadiness`, `useAssignments`, etc.) with proper cache invalidation. These are the right abstraction layer for the client.

### Database schema is split by entity
`shared/db/schema/` separates tables into individual files rather than one giant schema. The Drizzle migration history is clean.

### `shared/film-analysis/types.ts` proves the right instinct
The film-analysis domain has its types co-located in a `shared/film-analysis/` subfolder rather than dumped into a flat shared root. The pattern is correct; it just needs to be applied everywhere else.

---

## 2. What Violates Vertical Slice Principles

---

### VIOLATION 1 — Readiness Domain Split Across Three Layers

**Severity: High**

The readiness scoring algorithm exists in three separate, partially-duplicated locations:

| File | Contents |
|---|---|
| `server/lib/readinessScore.ts` | Full `computeReadiness()` with thresholds, all signals |
| `client/src/lib/readiness.ts` | `computePlayerReadiness()` — truncated reimplementation + `REASON_LABELS` + `MOCK_TEAM_READINESS` |
| `client/src/lib/mock/player-checkin.ts` | Third `computeReadiness(soreness, sleep, energy)` variant used by `PlayerCheckinPage` |

`ReadinessStatus`, `ReadinessConfidence`, `ReadinessReasonCode`, and `REASON_LABELS` are defined identically in both `server/lib/readinessScore.ts` and `client/src/lib/readiness.ts`. These have diverged: the server version has wearable signals, workload, and assignment thresholds; the client version is a simplified subset with no override support.

Pages import domain logic directly:
- `PlayerProfilePage.tsx` calls `computePlayerReadiness()` and `REASON_LABELS` inline
- `TeamReadinessPage.tsx` uses `MOCK_TEAM_READINESS` and `REASON_LABELS` from `lib/readiness`
- `PlayerCheckinPage.tsx` uses a third `computeReadiness()` from `lib/mock/player-checkin`

**The readiness feature has no single owner.**

---

### VIOLATION 2 — `client/src/lib/mock/` Is a 32-File, 19,000-Line Dumping Ground

**Severity: High**

```
client/src/lib/mock/
  action-lanes.ts       admin.ts          analytics-kpi.ts
  analytics.ts          announcements.ts  assessments.ts
  athlete.ts            audit.ts          benchmarks.ts
  coach-education.ts    coach-metrics.ts  core-development.ts
  data.ts               dossier.ts        education.ts
  film.ts               guardian.ts       parent.ts
  payments.ts           plans.ts          playbook.ts
  playbookSchema.ts     player-checkin.ts player-development.ts
  practice.ts           program-ops.ts    readiness.ts
  recruiting.ts         scouting.ts       seasons.ts
  team-management.ts    users.ts
```

Each of these files belongs to a distinct feature. But because they all live under `lib/mock/`, feature ownership is invisible. When a developer works on the Film Room, they have no obvious place to find or put film mock data — they either search or add to `film.ts`.

More critically, `playbookSchema.ts` is not mock data at all — it contains the **live production Zod schema** used by `playbookStore.ts`. It is permanently misnamed and mislocated.

Pages import from this folder directly: 82 page-level imports from `lib/mock/**`. This means switching any page from mock to real API data requires searching for all mock imports and replacing them — there's no seam to pull.

---

### VIOLATION 3 — Playbook Is Shattered Across Six Separate Locations

**Severity: High**

The playbook feature's code lives in:

```
# Active V2 store (1,017 lines)
client/src/lib/playbookStore.ts
client/src/lib/playbookActions.ts          ← 212 lines
client/src/lib/playbookSnap.ts             ← 77 lines
client/src/lib/playbookStoreGuards.ts      ← 66 lines

# V3 store
client/src/lib/playbookV3/store.ts
client/src/lib/playbookV3/seeds.ts

# Canonical V3 types (src/ root — separate from client/)
src/playbook/types.ts
src/playbook/animate.ts
src/playbook/migrate.ts
src/playbook/resolver.ts
src/playbook/snap.ts

# Deprecated stubs (files that should be deleted)
client/src/lib/playbook/persistence.ts    ← empty @deprecated
client/src/lib/playbook/schema.ts         ← empty @deprecated
client/src/lib/playbook/store.ts          ← empty @deprecated

# Root-level duplicates (exact copies — should not exist)
playbookV3/PlayCanvasV3.tsx               ← identical to client/src/components/playbookV3/
playbookV3/usePlaybackV3.ts               ← identical to client/src/components/playbookV3/

# "Live schema" hiding in mock folder
client/src/lib/mock/playbookSchema.ts     ← production Zod schema
client/src/lib/mock/playbook.ts           ← seed data + formations
```

A developer working on Playbook has to know to look in at least 5 different directories. The `src/playbook/` module appears to be the canonical V3 domain logic (with tests), but `playbookStore.ts` imports from `lib/mock/playbookSchema` and `lib/mock/playbook`, not from `src/playbook/`.

---

### VIOLATION 4 — `server/lib/` Mixes Infrastructure with Domain Logic

**Severity: Medium**

`server/lib/` contains:

```
gemini.ts          ← AI provider wrapper (infrastructure ✓)
mux.ts             ← video provider wrapper (infrastructure ✓)
openai.ts          ← AI provider wrapper (infrastructure ✓)
twilio.ts          ← SMS provider wrapper (infrastructure ✓)
slugify.ts         ← utility (infrastructure ✓)
invoiceNumber.ts   ← utility (infrastructure ✓)

readinessScore.ts  ← domain algorithm ✗ (belongs in modules/readiness/)
notifications.ts   ← domain logic ✗ (knows about coaches and parents by domain role)
parentAccess.ts    ← domain rule ✗ (parent-child access policy belongs in modules/parent/)
```

`notifications.ts` has function signatures like `sendCoachAlert(coachUserId, orgId, subject, message)` and `sendParentNotification(parentPhone, playerName, message)`. These functions encode domain concepts (coach, parent, player) inside what should be an infrastructure wrapper. The infrastructure concern is Twilio SMS; the domain concern (who gets notified and why) should live in the feature module that fires the notification.

`readinessScore.ts` is a pure domain algorithm — it makes decisions about player health and status. It has no business in `lib/`.

---

### VIOLATION 5 — Billing Domain Scattered Into Generic `lib/`

**Severity: Medium**

The billing feature is a 2,056-line domain engine:

```
client/src/lib/billing/
  analytics.ts     ← KPI calculation engine
  catalog.ts       ← product/price definitions
  entitlements.ts  ← grant/revoke logic
  service.ts       ← Stripe simulation (checkout, seats, credits)
  store.ts         ← Zustand state
  types.ts         ← domain types
  webhooks.ts      ← event dispatch simulation
```

This is actually reasonably organized internally. The violation is that it lives under the generic `lib/` folder rather than as an explicit feature slice. Pages import multiple internal modules directly — `BillingAdmin.tsx` imports from `analytics`, `store`, `webhooks`, `catalog`, and `entitlements` individually. Pages should import from a single feature entry point.

---

### VIOLATION 6 — Duplicate `useRoster` Hook

**Severity: Medium**

Two completely different implementations of `useRoster` exist:

```
client/src/lib/api/hooks/useRoster.ts
  → React Query, full CRUD, typed Player, proper cache invalidation

client/src/lib/hooks/useRoster.ts
  → useState/useEffect, only list, maps to RosterEntry shape with initials,
    falls back to hardcoded FALLBACK demo players
```

The second was purpose-built for `ClipActionBar` in the film feature and adds an "initials" field that the first doesn't have. This is duplicated infrastructure where the second hook should instead be a thin transform over the first.

---

### VIOLATION 7 — `shared/db/repository.ts` Is a 900+ Line God Object

**Severity: Low–Medium** (pattern is correct, scope is the problem)

The repository correctly scopes all queries by `orgId` — that's the right pattern. But at 900+ lines, it's a single file that owns every domain's data access: film sessions, readiness, players, events, assignments, practice plans, wearables, IDPs, coaching actions, guardians, announcements, waivers, seasons, teams, invoices, payments. Every feature that needs database access adds methods to this one object.

This isn't a hard violation since it's deliberate infrastructure, but it makes the repository a choke point for every PR and creates implicit coupling between unrelated domains.

---

### VIOLATION 8 — Root-Level Orphaned Files

**Severity: Low**

```
/playbookV3/PlayCanvasV3.tsx      ← exact duplicate of client/src/components/playbookV3/
/playbookV3/usePlaybackV3.ts      ← exact duplicate of client/src/components/playbookV3/
/App.tsx                          ← root-level App — shadowed by client/src/App.tsx
/PlaybookStudioV3.tsx             ← root-level page — shadowed by client/src/pages/app/coach/
```

These appear to be artifacts of the Manus build environment copying files to the root during development. They should be deleted — they are not imported by anything in the actual build.

---

## 3. Exact Refactors to Fix Each Violation

---

### Fix 1 — Consolidate Readiness Into a Feature Module

**Goal**: one owner, one set of types, one algorithm.

**Step 1**: Create `client/src/features/readiness/` as the feature slice:

```
client/src/features/readiness/
  types.ts           ← ReadinessStatus, ReadinessConfidence, ReadinessReasonCode, REASON_LABELS
  compute.ts         ← computePlayerReadiness() — client-side, fetched-data variant only
  hooks.ts           ← re-exports from lib/api/hooks/useReadiness (no logic added)
  mock.ts            ← MOCK_TEAM_READINESS and player-checkin mock data
  ReadinessStatusBadge.tsx   ← moved from components/readiness/
  index.ts           ← public API: export { types, compute, hooks, mock, ReadinessStatusBadge }
```

**Step 2**: Move `server/lib/readinessScore.ts` to `server/modules/readiness/score.ts`. Update the import in `routes.ts`:

```ts
// Before
import { computeReadiness } from "../../lib/readinessScore";
// After
import { computeReadiness } from "./score";
```

**Step 3**: Delete `client/src/lib/readiness.ts`. Update the 5 pages that import from it to import from `@/features/readiness`.

**Step 4**: The third `computeReadiness` in `lib/mock/player-checkin.ts` takes `(soreness, sleep, energy)` positional args — it's a simplified UI-only scorer for the self-checkin guardrail system. Keep it in `features/readiness/compute.ts` as `computeCheckinScore(soreness, sleep, energy)` with a distinct name to prevent confusion with the full signal scorer.

---

### Fix 2 — Dissolve `lib/mock/` Into Feature-Owned Mock Files

**Goal**: feature mock data lives next to the feature, not in a global dump.

Do not create a new directory structure for mock data. Instead, each mock file moves to the feature it belongs to. The files that have already been migrated or that only serve one feature:

```
lib/mock/film.ts           → features/film/mock.ts  (or server/modules/film-analysis/mock.ts for shared)
lib/mock/practice.ts       → features/practice-plan/mock.ts
lib/mock/recruiting.ts     → features/recruiting/mock.ts
lib/mock/scouting.ts       → features/scouting/mock.ts
lib/mock/assessments.ts    → features/skill-assessment/mock.ts
lib/mock/readiness.ts      → features/readiness/mock.ts  (merged with player-checkin mock)
lib/mock/player-checkin.ts → features/readiness/mock.ts
lib/mock/payments.ts       → features/billing/mock.ts
lib/mock/seasons.ts        → features/club-ops/mock.ts
lib/mock/team-management.ts→ features/club-ops/mock.ts
lib/mock/analytics-kpi.ts  → features/analytics/mock.ts
lib/mock/playbook.ts       → features/playbook/mock.ts
```

**Critical**: `lib/mock/playbookSchema.ts` is not mock data. Rename and move:
```
lib/mock/playbookSchema.ts → features/playbook/schema.ts
```
Update the single import in `playbookStore.ts`.

Cross-cutting mock files (`data.ts`, `users.ts`) that are used by many features can remain at `lib/mock/core.ts`.

Migration is mechanical — do it incrementally, one feature at a time, verifying imports compile after each move.

---

### Fix 3 — Consolidate Playbook Into One Feature Directory

**Goal**: all playbook code in one place, dead files deleted.

**Target structure**:
```
client/src/features/playbook/
  schema.ts           ← was lib/mock/playbookSchema.ts
  store.ts            ← was lib/playbookStore.ts
  actions.ts          ← was lib/playbookActions.ts
  snap.ts             ← was lib/playbookSnap.ts
  guards.ts           ← was lib/playbookStoreGuards.ts
  mock.ts             ← was lib/mock/playbook.ts (seed data + formations)
  v3/
    store.ts          ← was lib/playbookV3/store.ts
    seeds.ts          ← was lib/playbookV3/seeds.ts
    PlayCanvasV3.tsx  ← was components/playbookV3/PlayCanvasV3.tsx
    usePlaybackV3.ts  ← was components/playbookV3/usePlaybackV3.ts
  PlayCanvas.tsx      ← was components/playbook/PlayCanvas.tsx
  usePlayback.ts      ← was components/playbook/usePlayback.ts
  index.ts            ← public API
```

The `src/playbook/` module at the repo root (with `types.ts`, `animate.ts`, `migrate.ts`, `resolver.ts`, `snap.ts`) is the canonical V3 domain logic with tests. Keep it in place — it is correctly isolated and test-covered. The page (`PlaybookStudioV3.tsx`) should import its types from `src/playbook/types.ts` and its store from `features/playbook/v3/store.ts`.

**Delete immediately** (these files are confirmed empty stubs):
```bash
rm client/src/lib/playbook/persistence.ts
rm client/src/lib/playbook/schema.ts
rm client/src/lib/playbook/store.ts
```

**Delete immediately** (confirmed identical duplicates at root):
```bash
rm playbookV3/PlayCanvasV3.tsx
rm playbookV3/usePlaybackV3.ts
rm App.tsx                    # root-level only if confirmed unimported
rm PlaybookStudioV3.tsx       # root-level only if confirmed unimported
```

---

### Fix 4 — Move Domain Logic Out of `server/lib/`

**Three specific moves**:

**A)** Move `server/lib/readinessScore.ts` → `server/modules/readiness/score.ts` (covered in Fix 1)

**B)** Move `server/lib/parentAccess.ts` → `server/modules/parent/access.ts`:
```ts
// server/modules/parent/routes.ts
// Before:
import { validateParentAccess } from "../../lib/parentAccess";
// After:
import { validateParentAccess } from "./access";
```

**C)** Refactor `server/lib/notifications.ts`:

The file currently contains domain-aware notification functions. Split it:
- Keep `server/lib/sms.ts` as a thin Twilio wrapper (pure infrastructure — takes a phone number and message string, knows nothing about coaches or players)
- Move domain notification logic into the modules that own the event:

```ts
// server/modules/readiness/notifications.ts
import { sendSms } from "../../lib/sms";
export async function notifyCoachOfFlaggedCheckin(params: {
  coachPhone: string; playerName: string; flags: string[];
}) { ... }

// server/modules/coaching-actions/notifications.ts
export async function notifyCoachingActionAssigned(...) { ... }
```

`server/lib/notifications.ts` then becomes `server/lib/sms.ts` — one function, no domain coupling.

---

### Fix 5 — Give Billing a Feature Entry Point

The internal structure of `client/src/lib/billing/` is fine. The fix is two things:

**A)** Move the folder: `client/src/lib/billing/` → `client/src/features/billing/`

**B)** Create `client/src/features/billing/index.ts` as the public API:
```ts
// features/billing/index.ts
export { createCheckout, openPortal, cancelAtPeriodEnd, addSeat, removeSeat, consumeAICredit } from "./service";
export { useBillingStore } from "./store";
export { computeKPIs } from "./analytics";
export type { Subscription, Invoice, Seat } from "./types";
// Internal: catalog.ts, webhooks.ts, entitlements.ts NOT re-exported
// Pages that need internals during development import directly, but get flagged in review
```

Then `BillingAdmin.tsx` changes from 5 separate internal imports to:
```ts
import { useBillingStore, computeKPIs, dispatchWebhook } from "@/features/billing";
// dispatchWebhook is re-exported only for the admin dev tool
```

---

### Fix 6 — Merge the Two `useRoster` Hooks

`client/src/lib/hooks/useRoster.ts` exists only to add `initials` computation and a "Full Team" sentinel entry for `ClipActionBar`. It should not be a separate hook.

**Refactor**:
```ts
// client/src/lib/api/hooks/useRoster.ts — add a selector
export function useRosterForFilmBar() {
  const { data: players = [] } = useRoster();
  const fullTeam: RosterEntry = { id: "team", name: "Full Team", position: "", initials: "" };
  const entries = players.map((p) => ({
    id: p.id,
    name: p.name,
    position: p.position ?? "",
    initials: p.name.split(" ").map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase(),
  }));
  return [fullTeam, ...entries];
}
```

Delete `client/src/lib/hooks/useRoster.ts`. Update `ClipActionBar.tsx` to import `useRosterForFilmBar` from `@/lib/api/hooks/useRoster`.

---

### Fix 7 — Split the Repository by Domain Group

This is lower priority and should be done incrementally. The pattern to apply:

```ts
// shared/db/repository.ts — becomes a thin orchestrator
import { createFilmRepository } from "./repositories/film";
import { createReadinessRepository } from "./repositories/readiness";
import { createRosterRepository } from "./repositories/roster";
// ...

export function createRepository(ctx: RepoContext) {
  const db = ctx.db ?? getDb();
  return {
    ...createFilmRepository(db, ctx),
    ...createReadinessRepository(db, ctx),
    ...createRosterRepository(db, ctx),
    // etc.
  };
}
```

Each `repositories/[domain].ts` file contains only the methods for that domain. The spread merge preserves the existing call site API (`repo.filmSessions.list()`) without breaking changes.

Do not split this until Fixes 1–4 are complete. The repository is currently the least harmful of the violations.

---

## 4. Updated Folder Structure

Only showing files that move or are created. Files not listed stay where they are.

```
hoopsos-docs/
├── src/
│   └── playbook/               ← KEEP AS-IS (canonical V3 domain + tests)
│       ├── types.ts
│       ├── animate.ts
│       ├── migrate.ts
│       ├── resolver.ts
│       └── snap.ts
│
├── server/
│   ├── lib/
│   │   ├── gemini.ts           ← unchanged (infrastructure)
│   │   ├── mux.ts              ← unchanged (infrastructure)
│   │   ├── openai.ts           ← unchanged (infrastructure)
│   │   ├── sms.ts              ← RENAMED from twilio.ts (thin wrapper only)
│   │   ├── slugify.ts          ← unchanged
│   │   └── invoiceNumber.ts    ← unchanged
│   │   # readinessScore.ts  MOVED → modules/readiness/score.ts
│   │   # notifications.ts   DISSOLVED → modules/*/notifications.ts
│   │   # parentAccess.ts    MOVED → modules/parent/access.ts
│   │
│   └── modules/
│       ├── readiness/
│       │   ├── routes.ts       ← unchanged
│       │   └── score.ts        ← MOVED from lib/readinessScore.ts
│       └── parent/
│           ├── routes.ts       ← unchanged
│           └── access.ts       ← MOVED from lib/parentAccess.ts
│
└── client/src/
    ├── features/               ← NEW top-level features directory
    │   ├── readiness/
    │   │   ├── types.ts        ← extracted from lib/readiness.ts
    │   │   ├── compute.ts      ← computePlayerReadiness + computeCheckinScore
    │   │   ├── mock.ts         ← MOCK_TEAM_READINESS + player-checkin mock data
    │   │   ├── ReadinessStatusBadge.tsx   ← MOVED from components/readiness/
    │   │   └── index.ts
    │   │
    │   ├── playbook/
    │   │   ├── schema.ts       ← MOVED from lib/mock/playbookSchema.ts
    │   │   ├── store.ts        ← MOVED from lib/playbookStore.ts
    │   │   ├── actions.ts      ← MOVED from lib/playbookActions.ts
    │   │   ├── snap.ts         ← MOVED from lib/playbookSnap.ts
    │   │   ├── guards.ts       ← MOVED from lib/playbookStoreGuards.ts
    │   │   ├── mock.ts         ← MOVED from lib/mock/playbook.ts
    │   │   ├── PlayCanvas.tsx  ← MOVED from components/playbook/PlayCanvas.tsx
    │   │   ├── usePlayback.ts  ← MOVED from components/playbook/usePlayback.ts
    │   │   ├── v3/
    │   │   │   ├── store.ts    ← MOVED from lib/playbookV3/store.ts
    │   │   │   ├── seeds.ts    ← MOVED from lib/playbookV3/seeds.ts
    │   │   │   ├── PlayCanvasV3.tsx      ← MOVED from components/playbookV3/
    │   │   │   └── usePlaybackV3.ts     ← MOVED from components/playbookV3/
    │   │   └── index.ts
    │   │
    │   └── billing/
    │       ├── analytics.ts    ← MOVED from lib/billing/analytics.ts
    │       ├── catalog.ts      ← MOVED from lib/billing/catalog.ts
    │       ├── entitlements.ts ← MOVED from lib/billing/entitlements.ts
    │       ├── service.ts      ← MOVED from lib/billing/service.ts
    │       ├── store.ts        ← MOVED from lib/billing/store.ts
    │       ├── types.ts        ← MOVED from lib/billing/types.ts
    │       ├── webhooks.ts     ← MOVED from lib/billing/webhooks.ts
    │       └── index.ts        ← NEW public entry point
    │
    ├── lib/
    │   ├── api/
    │   │   └── hooks/
    │   │       └── useRoster.ts ← add useRosterForFilmBar() selector here
    │   ├── mock/
    │   │   ├── core.ts         ← RENAMED from data.ts + users.ts (cross-cutting only)
    │   │   ├── admin.ts        ← keep if admin-specific
    │   │   └── analytics.ts    ← keep if cross-cutting
    │   │   # Feature-specific mock files DISSOLVED into their feature slice
    │   ├── permissions.ts      ← KEEP (correctly shared primitive)
    │   └── utils.ts            ← KEEP
    │
    # DELETED:
    # lib/playbook/persistence.ts    (empty stub)
    # lib/playbook/schema.ts         (empty stub)
    # lib/playbook/store.ts          (empty stub)
    # lib/hooks/useRoster.ts         (merged into api/hooks/useRoster.ts)
    # lib/readiness.ts               (replaced by features/readiness/)
    # lib/billing/                   (moved to features/billing/)
    # lib/playbookStore.ts           (moved to features/playbook/store.ts)
    # lib/playbookActions.ts         (moved to features/playbook/actions.ts)
    # lib/playbookSnap.ts            (moved to features/playbook/snap.ts)
    # lib/playbookStoreGuards.ts     (moved to features/playbook/guards.ts)
    # lib/playbookV3/                (moved to features/playbook/v3/)
    # components/playbook/           (moved to features/playbook/)
    # components/playbookV3/         (moved to features/playbook/v3/)
    # components/readiness/          (moved to features/readiness/)
    #
    # ROOT LEVEL (delete):
    # /playbookV3/PlayCanvasV3.tsx
    # /playbookV3/usePlaybackV3.ts
    # /App.tsx
    # /PlaybookStudioV3.tsx
```

---

## Priority Order

| Priority | Fix | Impact | Effort |
|---|---|---|---|
| 1 | Fix 3 — Playbook consolidation + delete stubs | Eliminates active confusion for any playbook work | Medium |
| 2 | Fix 1 — Readiness into a feature module | Stops algorithm drift between client and server | Low |
| 3 | Fix 6 — Merge duplicate useRoster hooks | Eliminates a bug vector (stale fallback data) | Low |
| 4 | Fix 4 — Move domain logic out of server/lib/ | Clarifies server architecture | Low |
| 5 | Fix 2 — Dissolve lib/mock/ incrementally | Do one feature at a time as you touch those pages | High (but incremental) |
| 6 | Fix 5 — Billing feature entry point | Prevents internal API spread | Low |
| 7 | Fix 7 — Repository domain split | Reduces choke point, lower urgency | High |

The top three fixes are mechanical renames with no logic changes — they're safe to do in a single PR per fix and immediately improve navigability. Fixes 2 and 7 should be done incrementally alongside feature work rather than as big-bang refactors.
