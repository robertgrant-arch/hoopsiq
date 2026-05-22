# HoopsIQ Playbook Studio v2 — Deep Research Report

**Source:** Manus deep research task `DrdHGGkMan2BdCx3DJzOfM` (May 1, 2026)

## Recommendations

| Question | Recommendation | Rationale |
|---|---|---|
| IndexedDB library | **idb** (~1.4 KB gz) | Multi-store ACID transactions for WAL; idb-keyval lacks cursors; Dexie costs 22 KB |
| State management | **XState v5** | Native FSM; impossible-state invariants; actor model maps to undo/redo tree |
| Server schema mirror | **pnpm workspace shared package** | Zero runtime overhead; isomorphic Zod schemas |
| Observability | **Sentry + OTLP -> Datadog** | Vendor-neutral instrumentation; swap backends via collector YAML |

Full narrative report and citations live in the Manus task. This file is a
binding summary and bibliography pointer.
