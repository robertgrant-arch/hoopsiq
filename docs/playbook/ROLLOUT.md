# HoopsIQ Playbook Studio v2 — Rollout Plan

**Source:** Manus task `DrdHGGkMan2BdCx3DJzOfM`

## PR sequence

- **PR #4 (this PR):** Schema + Store scaffold + Persistence + research/rollout docs.
  Acceptance: `tsc --noEmit` passes, `pnpm build` passes, no regressions on /app/playbook.
- **PR #5:** Full XState v5 actor migration of store.ts. Acceptance: 39 vitest cases pass.
- **PR #6:** Bundle-size CI budget + telemetry marks E2E. Acceptance: <50 KB initial chunk.
- **PR #7:** Conflict resolution UI + presence cursors. Acceptance: a11y keyboard pass.
- **PR #8:** Rate limiting + observability backend wiring. Acceptance: Sentry + OTLP live.
