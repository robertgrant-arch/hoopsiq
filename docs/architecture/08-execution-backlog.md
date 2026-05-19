# HoopsOS — Execution Backlog
## Six Vertical Slices · Directly Executable · Aligned to Roadmap Phases

> Format: One section per slice → Release goal → Epic/task tables → Implementation order → DoD  
> Task IDs: prefix each with slice code (DASH-, ACAD-, ASMT-, MGRL-, COCH-, ADMB-)  
> Types: [BE] backend · [FE] frontend · [DS] design · [AX] analytics · [QA] quality  
> Data: [REAL] must use production API · [MOCK-OK] can ship on seeded/demo data  
> Phases: P0 = Weeks 1-14 · P1 = Weeks 15-28 · P2 = Weeks 29+

---

## Shared Primitives (Block Everything Else — Build These First)

These must be extracted before any slice work begins. No exceptions.

| ID | Task | Type | Blocks | DoD |
|---|---|---|---|---|
| PRIM-001 | Create `features/_shared/api-client/` — migrate `lib/api/client.ts`; export `apiGet, apiPost, apiPatch, apiDelete, apiFetch`; update all existing consumers to new path | [BE][FE] | All slices | `lib/api/client.ts` is a re-export shim; all consumers use `@/features/_shared/api-client` |
| PRIM-002 | Create `features/_shared/permissions/` — migrate `lib/permissions.ts`; `PERMISSION_MATRIX`, `can()`, `StaffRole` exported from index | [FE] | All slices | `lib/permissions.ts` is a shim; `lib/__tests__/permissions.test.ts` passes at new location |
| PRIM-003 | Create `features/_shared/auth/` — migrate `lib/auth.ts`; `useAuth`, `useCurrentRole`, `useOrgId` hooks; Clerk token handling | [FE] | All slices | Auth hooks importable from `@/features/_shared/auth`; old path shimmed |
| PRIM-004 | Create `features/navigation/config.ts` — `ROLE_NAV` record keyed by `StaffRole`; 5 L1 items per role; badge count hooks; route guard array | [FE] | Dashboard, routing | Nav renders from config for all roles; no role sees more than 5 L1 items |
| PRIM-005 | Implement `app/router.tsx` — extract all routes from `App.tsx`; apply `ROUTE_GUARDS` from navigation config; lazy-import from slice page paths | [FE] | All slices | All routes 401-redirect correctly; unauthorized access to `/app/director/*` from coach role returns to coach home |
| PRIM-006 | Add `scripts/check-vsa.sh` to CI — cross-slice internal import check; mock data in production components check; untested compute.ts change check | [BE] | All slices | CI fails on any VSA violation; pipeline runs in under 30 seconds |
| PRIM-007 | Create feature flag system — env-var-based `FEATURE_FLAGS` object; `useFeatureFlag(name)` hook; flags for each slice: `FLAG_COACHING`, `FLAG_ASSESSMENTS`, `FLAG_ACADEMY`, `FLAG_MANAGER_LABS` | [FE][BE] | All slices | Any slice can be disabled for an org without code changes; flags checked server-side on API routes |
| PRIM-008 | Write `features/_template/` — all 7 canonical files (`types.ts`, `api.ts`, `hooks.ts`, `store.ts`, `compute.ts`, `mock.ts`, `index.ts`) with TODO placeholders; `README.md` for usage | [FE] | All slices | `cp -r features/_template features/new-slice` produces a compilable slice skeleton |
| PRIM-009 | Add ESLint `no-restricted-imports` rule blocking `@/features/{slice}/{internal}` cross-slice imports and `@/lib/` additions | [BE] | All slices | `npm run lint` fails on any cross-slice internal import in CI |

---

## SLICE 1: Admin/Billing

### Release Goal
The operational backbone that makes every other slice possible. A program director can create a season, import a roster, and collect payment from families — all without leaving HoopsOS. Everything else depends on having real player IDs in the database.

**Feature flag**: `FLAG_ADMIN_BILLING` (always on; this is the foundation)  
**Phase**: P0 — Weeks 4–10

---

### Epics Overview

| Epic | Description | Phase | MOCK-OK? | Depends on |
|---|---|---|---|---|
| ADMB-E1 | Roster Management | P0 | [REAL] | PRIM-001, PRIM-003 |
| ADMB-E2 | Events & Scheduling | P0 | [REAL] | ADMB-E1 |
| ADMB-E3 | Season & Team Setup | P0 | [REAL] | ADMB-E1 |
| ADMB-E4 | Invoice & Payment Core | P0 | [REAL] Stripe required | ADMB-E1, ADMB-E3 |
| ADMB-E5 | Parent Payment Portal | P0 | [REAL] | ADMB-E4 |
| ADMB-E6 | Registration & Waivers | P1 | [MOCK-OK] for P0 | ADMB-E1, ADMB-E3 |
| ADMB-E7 | Advanced Billing (plans, payouts) | P2 | [MOCK-OK] | ADMB-E4 |

---

### Epic ADMB-E1: Roster Management

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ADMB-001 | Write `server/modules/roster/service.ts` — implement `rosterService.list(ctx)`, `get(ctx, id)`, `create(ctx, input)`, `update(ctx, id, input)`, `archive(ctx, id)` with org-scoped DB queries | [BE] | [REAL] | All roster routes call service methods; no raw `createRepository` in routes.ts |
| ADMB-002 | Write `server/modules/roster/schema.ts` — Zod validators for `CreatePlayerInput` (name, position, jerseyNumber, grade, gradYear, status), `UpdatePlayerInput` (all optional) | [BE] | [REAL] | `POST /api/roster` with invalid body returns 422 with field-level errors |
| ADMB-003 | Create `features/admin-billing/` slice directory from `_template`; move `features/admin/`, `features/payments/`, `features/club-ops/` mock files in | [FE] | - | Slice directory matches canonical template; all old feature paths shimmed |
| ADMB-004 | Wire `useRoster()`, `usePlayer(id)`, `useCreatePlayer()`, `useUpdatePlayer()`, `useDeletePlayer()` to real API in `features/admin-billing/hooks.ts` | [FE] | [REAL] | Hooks call real `/api/roster` endpoints; no mock data; error state handled |
| ADMB-005 | Wire `RosterDetailPage` — replace mock roster array with `useRoster()`; loading skeleton while fetching; empty state if no players | [FE] | [REAL] | Page shows real players; adding a player refreshes the list; error state shows toast |
| ADMB-006 | Wire player profile page (`/app/coach/team/players/:id`) — `usePlayer(id)` drives header; tabs wire to real data as each epic ships | [FE] | [REAL] | Player name, position, jersey, status render from real API; 404 redirects to roster |
| ADMB-007 | Build `RosterImportPage` — CSV parsing with `papaparse`; validation against `CreatePlayerInput` schema; preview table with error rows highlighted; `POST /api/roster/bulk` endpoint | [BE][FE] | [REAL] | 20-player CSV imports correctly; duplicate jersey numbers flagged before submit; errors per row shown inline |
| ADMB-008 | Design: Roster list layout (table vs. card grid toggle), player status badge specs, empty state illustration | [DS] | - | Figma component spec for `PlayerRow`, `PlayerStatusBadge`, `AddPlayerModal` delivered to FE |
| ADMB-009 | Analytics: Track `roster.player_added`, `roster.player_archived`, `roster.import_completed` with `{orgId, playerCount}` | [AX] | - | Events fire on each action; visible in analytics dashboard |
| ADMB-010 | QA: Verify org isolation — Player created in Org A cannot be retrieved by Org B's JWT; `DELETE /api/roster/:id` with wrong org JWT returns 403 | [QA] | - | Automated test in `server/modules/roster/tests/routes.test.ts` |

---

### Epic ADMB-E2: Events & Scheduling

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ADMB-011 | Write `server/modules/events/service.ts` — `eventService.list(ctx, filters)`, `create(ctx, input)`, `update(ctx, id, input)`, `delete(ctx, id)`, `recordAttendance(ctx, eventId, records[])` | [BE] | [REAL] | Events filtered by `teamId`, `type`, `dateRange`; attendance records linked to player IDs |
| ADMB-012 | Wire `useEvents(filters?)`, `useEvent(id)`, `useCreateEvent()`, `useRecordAttendance()` in `features/admin-billing/hooks.ts` | [FE] | [REAL] | Hooks call real `/api/events` endpoints; mutations invalidate `["events"]` query key |
| ADMB-013 | Wire `TeamCalendarPage` — replace mock events array with `useEvents()`; month view renders real games, practices, tournaments; event type color-coded | [FE] | [REAL] | Calendar shows real events; clicking event opens `EventDetailPage` with real data |
| ADMB-014 | Wire `EventDetailPage` (`/app/team/events/:id`) — event metadata, attendance recording with player list from `useRoster()` | [FE] | [REAL] | Coach can mark each player present/absent/excused; attendance saves and shows confirmation |
| ADMB-015 | Wire `AbsenceManagementPage` — `GET /api/events/attendance/summary` endpoint returning per-player attendance rate over last 30 days | [BE][FE] | [REAL] | Players with <70% attendance highlighted; coach can click player to see event-by-event history |
| ADMB-016 | Design: Calendar month/week view spec, event creation modal fields spec (type, date, time, location, opponent, notes), attendance recording UI | [DS] | - | Component specs for `TeamCalendar`, `EventCard`, `AttendanceRecorder` |
| ADMB-017 | QA: Event availability conflict — two events on same date/time show warning; attendance cannot be recorded for future events; deleting an event with attendance records requires confirmation | [QA] | - | All three scenarios handled without silent data loss |

---

### Epic ADMB-E3: Season & Team Setup

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ADMB-018 | Write `server/modules/seasons/service.ts` — `seasonService.create(ctx, input)`, `list(ctx)`, `activate(ctx, id)`, `addTeam(ctx, seasonId, teamInput)`, `assignCoach(ctx, teamId, userId, role)` | [BE] | [REAL] | Only one season can be `active` per org; activating deactivates the previous |
| ADMB-019 | Wire `SeasonSetupPage` — multi-step wizard: Season dates → Team names → Coach assignments → Confirm; calls `POST /api/seasons` then `POST /api/seasons/:id/teams` | [FE] | [REAL] | Admin completes 4-step wizard and lands on season overview with teams visible |
| ADMB-020 | Wire `SeasonManagementPage` — list of seasons; active season badge; archive past season action | [FE] | [REAL] | List renders from real API; "Activate" button changes active season |
| ADMB-021 | Wire `AdminTeamsPage` — team list per season; add coach to team; remove coach; set team capacity | [FE] | [REAL] | Team assignment changes persist; coach sees their team on next login |
| ADMB-022 | QA: Season setup wizard — incomplete wizard (navigating away mid-step) doesn't create partial records; team without head coach assigned shows warning | [QA] | - | Test with `beforeunload` and partial form submission |

---

### Epic ADMB-E4: Invoice & Payment Core

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ADMB-023 | Write `server/modules/invoices/service.ts` — `invoiceService.create(ctx, input)`, `send(ctx, id)`, `void(ctx, id)`, `recordPayment(ctx, id, paymentInput)`, `createStripeCheckout(ctx, id)` | [BE] | [REAL] | Invoice created in `draft` status; `send` moves to `open` and emails parent; Stripe checkout session created with correct amount |
| ADMB-024 | Implement Stripe Checkout integration — `POST /api/invoices/:id/checkout` creates Stripe Checkout Session; return `sessionUrl`; webhook handler at `POST /api/webhooks/stripe` processes `payment_intent.succeeded` | [BE] | [REAL] Stripe required | Webhook updates invoice to `paid`; idempotency key prevents double-processing |
| ADMB-025 | Implement Stripe webhook endpoint — validate `stripe-signature` header; handle `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created`; update invoice status accordingly | [BE] | [REAL] | Test with `stripe trigger payment_intent.succeeded`; invoice moves to `paid` within 5 seconds |
| ADMB-026 | Wire `AdminBillingPage` — invoice list with status filters (all/open/paid/overdue); create invoice button opens modal; invoice row shows player name, amount, status, due date | [FE] | [REAL] | Invoice list loads from `GET /api/invoices`; creating invoice via modal reflects immediately in list |
| ADMB-027 | Build `CreateInvoiceModal` — player selector (from `useRoster()`), line items (description + amount), due date; `POST /api/invoices`; `POST /api/invoices/:id/send` | [FE] | [REAL] | Invoice created and sent; parent receives email notification (verified in staging) |
| ADMB-028 | Wire `OutstandingPaymentsPage` — `GET /api/invoices?status=overdue`; bulk "Send reminder" action; manual payment recording modal | [FE] | [REAL] | Overdue list accurate; reminder sends email; manual payment updates invoice status |
| ADMB-029 | Build manual payment recording modal — payment method selector (cash/check/Zelle/Venmo/other), amount, reference note, date; `POST /api/invoices/:id/payments` with `method: "manual"` | [FE] | [REAL] | Manual payment recorded; invoice status updates correctly; does not trigger Stripe |
| ADMB-030 | Nightly Inngest job: `overdue-invoice-sweep` — query all invoices with `dueDate < now()` and `status = "open" \| "partial"`; batch-update to `overdue`; notify org admins | [BE] | [REAL] | Runs at 00:05 UTC daily; idempotent (running twice doesn't create duplicate notifications) |
| ADMB-031 | Design: Invoice detail layout, create invoice modal fields spec, payment status badge component, outstanding payments table row spec | [DS] | - | Figma specs for `InvoiceCard`, `InvoiceStatusBadge`, `CreateInvoiceModal`, `RecordPaymentModal` |
| ADMB-032 | Analytics: Track `invoice.created`, `invoice.sent`, `invoice.paid`, `invoice.voided`, `invoice.payment_failed` with `{orgId, amount, method}` | [AX] | - | Funnel from `created` → `paid` visible in analytics |
| ADMB-033 | QA: Stripe webhook idempotency — send same `payment_intent.succeeded` event twice; invoice status = `paid` only once; no duplicate payment records | [QA] | - | Automated test using Stripe CLI webhook replay |
| ADMB-034 | QA: Invoice state machine — `void` a `paid` invoice throws 409; recording payment > invoice amount shows warning; partial payment leaves status as `partial` | [QA] | - | All invalid state transitions return correct HTTP error codes |

---

### Epic ADMB-E5: Parent Payment Portal

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ADMB-035 | Wire `ParentBillingPage` — `GET /api/invoices/my` for guardian-scoped invoice list; outstanding badge count on parent nav; payment CTA opens Stripe Checkout | [FE] | [REAL] | Parent sees only their children's invoices; "Pay Now" redirects to Stripe Checkout |
| ADMB-036 | Stripe Checkout success/cancel redirect — `success_url` returns to `/app/parent/billing?payment=success`; `cancel_url` returns to billing page; success banner shown | [FE][BE] | [REAL] | Success page shows confirmed payment; invoice status reflects `paid` within 10 seconds of Stripe event |
| ADMB-037 | Receipt email — Inngest function `send-receipt-email` triggered on `invoice.paid` event; sends templated email with invoice PDF link to parent email | [BE] | [REAL] | Test email arrives in staging with correct amount, date, and player name |
| ADMB-038 | QA: Guardian cannot access invoices for players they are not linked to — `GET /api/invoices/my` returns only linked children's invoices | [QA] | - | Cross-guardian data access test in `routes.test.ts` |

---

### Epic ADMB-E6: Registration & Waivers (P1)

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ADMB-039 | Write `server/modules/registrations/service.ts` — `registrationService.create(ctx, input)`, `approve(ctx, id, teamId)`, `reject(ctx, id, reason)` | [BE] | [MOCK-OK] P0 | Approval creates player record if none exists; sends account invitation email |
| ADMB-040 | Build public registration form — unauthenticated route `/register/:orgSlug`; form validates player info + parent contact; `POST /api/registrations` (no auth required) | [FE][BE] | [MOCK-OK] P0 | Form submits without login; admin receives in-app notification |
| ADMB-041 | Wire `AdminRegistrationsPage` — registration queue with approve/reject actions; shows form data; bulk approve | [FE] | [MOCK-OK] P0 | Approve action creates player and sends invite; reject marks status and notifies family |
| ADMB-042 | Build waiver template CRUD — `POST /api/waivers/templates`, `GET /api/waivers/templates`, `PATCH /api/waivers/templates/:id`; version increment on update | [BE] | [MOCK-OK] P0 | Creating new version doesn't invalidate prior signatures |
| ADMB-043 | Build parent waiver signing — `ParentFormsPage` lists unsigned waivers; waiver text modal with signature input (typed full name); `POST /api/waivers/sign` records `signedBy`, `timestamp`, `ip`, `version` | [FE][BE] | [MOCK-OK] P0 | Signature saves with metadata; admin sees signature status per player |
| ADMB-044 | QA: Waiver version control — signing waiver v1 does not satisfy requirement for v2; prior v1 signature remains valid | [QA] | - | Version mismatch test |

---

### ADMB Implementation Order

```
Week 4-5: PRIM-001..009 (shared primitives) + ADMB-001..010 (Roster)
Week 6-7: ADMB-011..017 (Events) + ADMB-018..022 (Season setup)
Week 8-9: ADMB-023..034 (Invoice core + Stripe)
Week 10:  ADMB-035..038 (Parent payment portal)
Week 15+: ADMB-039..044 (Registration & waivers — P1)
```

### ADMB Definition of Done

- [ ] Admin can create a season, set up 2 teams, and assign coaches in under 15 minutes
- [ ] Admin can import 15 players via CSV with zero errors
- [ ] Admin creates and sends an invoice; parent receives email within 2 minutes
- [ ] Parent pays via Stripe; invoice moves to `paid` within 10 seconds of payment confirmation
- [ ] Nightly overdue sweep runs without error; test invoice correctly transitions to `overdue`
- [ ] Zero pages in the Admin/Billing slice use mock data imports in production builds
- [ ] All service functions have corresponding tests in `server/modules/*/tests/`

---
---

## SLICE 2: Coaching

### Release Goal
The category-defining slice. The film → annotation → coaching action → practice plan loop must be fully wired with real data. A coach who annotates a moment in film tonight must see that observation surface in tomorrow's practice plan builder without any manual copy-paste.

**Feature flag**: `FLAG_COACHING`  
**Phase**: P1 primary (Weeks 15–22), P2 for Playbook/Game Day

---

### Epics Overview

| Epic | Description | Phase | MOCK? | Depends on |
|---|---|---|---|---|
| COCH-E1 | Film Library & Upload | P1 | [REAL] Mux required | ADMB-E1, PRIM-007 |
| COCH-E2 | Film Session Detail & Annotation | P1 | [REAL] | COCH-E1 |
| COCH-E3 | Coaching Actions Loop | P1 | [REAL] | COCH-E2 |
| COCH-E4 | Team Readiness | P0 (see Readiness slice) | [REAL] | ADMB-E1 |
| COCH-E5 | Practice Plan Builder | P1 | [REAL] | COCH-E3, COCH-E4, ACAD-E1 |
| COCH-E6 | Practice Execution & Review | P1 | [MOCK-OK] | COCH-E5 |
| COCH-E7 | Playbook V3 Studio | P2 | [MOCK-OK] | - |
| COCH-E8 | Game Day Mode | P2 | [MOCK-OK] | COCH-E7 |
| COCH-E9 | Coaching Journal | P1 | [REAL] | ADMB-E1 |

---

### Epic COCH-E1: Film Library & Upload

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| COCH-001 | Write `server/modules/film-analysis/service.ts` implementation — `filmService.initiateUpload(ctx)` calls `getMux().video.uploads.create()`; returns `uploadId` and `uploadUrl`; stores pending `film_sessions` record | [BE] | [REAL] Mux required | `POST /api/film-analysis/upload` returns a valid Mux upload URL; session record created with `status: "uploading"` |
| COCH-002 | Implement Mux webhook handler — `POST /api/webhooks/mux`; validate Mux webhook signature; on `video.asset.ready`: update session `status` to `ready`, store `muxAssetId` and `muxPlaybackId`; on `video.asset.errored`: update to `error` | [BE] | [REAL] | Session status updates within 30 seconds of Mux processing completing; test with Mux test webhook |
| COCH-003 | Implement `filmService.createSession(ctx, input)` — creates session record with `title`, `type`, `date`, `teamId`; links to upload via `uploadId` | [BE] | [REAL] | Session created with correct metadata; `listSessions` returns it immediately |
| COCH-004 | Create `features/coaching/` slice — `types.ts` (FilmSession, FilmAnnotation, CoachingAction, PracticePlan, PracticeBlock, ReadinessOverride); `api.ts`, `hooks.ts`, `compute.ts`, `mock.ts`, `index.ts` | [FE] | - | Slice directory matches canonical template; all internal files compile |
| COCH-005 | Implement `useFilmSessions()`, `useFilmSession(id)`, `useCreateFilmUpload()` hooks in `features/coaching/hooks.ts` | [FE] | [REAL] | Hooks return typed data from real API; `isLoading` and `error` states handled |
| COCH-006 | Wire `FilmLibraryPage` — replace mock session array with `useFilmSessions()`; filter by type (game/practice); sort by date desc; loading skeleton; empty state with upload CTA | [FE] | [REAL] | Page shows real sessions; filter works; uploading a session adds it to the list |
| COCH-007 | Build film upload flow — `FilmUploadButton` opens modal; title + type + date fields; validates with `CreateFilmSessionSchema`; calls `useCreateFilmUpload()`; shows upload progress via Mux uploader SDK | [FE] | [REAL] | Coach selects file, fills metadata, sees progress bar; on complete, session appears in library within 60 seconds |
| COCH-008 | Wire `FilmQueuePage` — sessions pending review (`status: "ready"`, `reviewedAt: null`); sorted by upload date; "Mark Reviewed" action | [FE] | [REAL] | Queue accurate; marking reviewed removes from queue |
| COCH-009 | Design: Film library grid card spec (thumbnail, title, type badge, date, duration, status indicator), upload modal spec, film queue row spec | [DS] | - | Figma specs for `FilmSessionCard`, `FilmUploadModal`, `FilmQueueRow` |
| COCH-010 | Analytics: Track `film.session_uploaded`, `film.session_reviewed`, `film.upload_failed` with `{orgId, sessionType, durationSeconds}` | [AX] | - | Events fire; funnel from upload to reviewed visible |
| COCH-011 | QA: Mux upload failure — if Mux returns `video.asset.errored`, session shows error state with retry option; retry creates new upload URL | [QA] | - | Error state renders; retry produces new valid upload URL |

---

### Epic COCH-E2: Film Session Detail & Annotation

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| COCH-012 | Implement `filmService.getAnnotations(ctx, sessionId)`, `createAnnotation(ctx, sessionId, input)`, `deleteAnnotation(ctx, annotationId)` | [BE] | [REAL] | Annotations org-scoped; `POST /api/film-analysis/sessions/:id/annotations` persists timestamp, text, playerTags, drawingData |
| COCH-013 | Refactor `FilmSessionDetail.tsx` — replace `SESSION` mock constant with `useFilmSession(id)`; annotations loaded from `GET /api/film-analysis/sessions/:id/annotations`; remove `import { apiGet }` inline calls; move to hook | [FE] | [REAL] | Page renders real session title, date, and type; annotations load from real API; no mock constants remain |
| COCH-014 | Wire annotation creation — `AnnotationPanel` textarea + player tag picker (from `useRoster()`); on submit calls `useCreateAnnotation()`; annotation appears in list within 1 second | [FE] | [REAL] | Typing a note and submitting creates a persisted annotation; page refresh shows it; player tags show player names |
| COCH-015 | Wire `TelestrationCanvas` save — drawing data serialized to JSON; sent as `drawingData` field in annotation POST; loaded back on session open | [FE][BE] | [REAL] | Drawing persists across page refreshes; correct annotation receives the drawing |
| COCH-016 | Implement `GET /api/film-analysis/sessions/:id/annotations?kind=telestration` — filters to annotation records with non-null `drawingData` | [BE] | [REAL] | Only annotations with drawings returned; used by `TelestrationCanvas` on load |
| COCH-017 | Build timestamp sync — annotation panel shows annotations sorted by `timestampMs`; clicking annotation in panel seeks video to that timestamp; video seeking creates a timestamp input in annotation composer | [FE] | [REAL] | Clicking any annotation in the list seeks video to within 1 second of the annotated moment |
| COCH-018 | Design: Annotation panel layout (timestamped list on right, composer at bottom), player tag UI (avatar pills), telestration toolbar (line/arrow/circle/color picker) | [DS] | - | Figma specs for `AnnotationPanel`, `PlayerTagPicker`, `TelestrationToolbar` |
| COCH-019 | QA: Annotation player tag privacy — annotation created by Coach A with player tag is not visible to players; annotation visible to all coaching staff in same org | [QA] | - | Role-filtered annotation list test; player JWT returns 403 on coach annotation endpoint |

---

### Epic COCH-E3: Coaching Actions Loop (The Wedge)

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| COCH-020 | Write `server/modules/coaching-actions/service.ts` — `actionService.create(ctx, input)`, `resolve(ctx, id, notes)`, `dismiss(ctx, id)`, `listOpen(ctx)`, `listForPlayer(ctx, playerId)`, `listForSession(ctx, sessionId)` | [BE] | [REAL] | All routes call service methods; `resolve` sets `resolvedAt` timestamp and fires Inngest event |
| COCH-021 | Write `server/modules/coaching-actions/schema.ts` — `CreateCoachingActionSchema` validates `type` (enum), `playerId` (optional), `sessionId` (required), `annotationId` (optional), `issueCategory`, `priority`, `notes`, `dueAt` | [BE] | [REAL] | Invalid `type` returns 422; missing `sessionId` returns 422 |
| COCH-022 | Implement `add_to_idp` action fulfillment — when action type is `add_to_idp`, `actionService.create()` also calls `rosterService.createIdpFocusArea(ctx, playerId, { category, subSkill, coachNotes })` derived from `issueCategory`; links `idpFocusAreaId` on the action record | [BE] | [REAL] | Creating `add_to_idp` action creates a corresponding IDP focus area; `idpFocusAreaId` set on action record |
| COCH-023 | Implement `recommend_drill` action fulfillment — stores `drillId` on action; creates a `film_assignments` record linking `drillId` to `playerId` | [BE] | [REAL] | Creating `recommend_drill` action with `drillId` creates a drill assignment visible to the player |
| COCH-024 | Implement `assign_clip` action fulfillment — creates `film_assignment` record with `clipId`, `playerId`, `instructions`, `dueAt` | [BE] | [REAL] | Creating `assign_clip` action creates a film assignment; player receives in-app notification |
| COCH-025 | Wire `ClipActionBar` — currently renders statically; wire to `useCreateCoachingAction()` mutation; on action type selection, open contextual form (player picker, priority, notes, due date); on submit call mutation | [FE] | [REAL] | Creating action from ClipActionBar persists to DB; action appears in `CoachActionsPage` within 2 seconds |
| COCH-026 | Refactor `CoachActionsPage` — currently calls `apiGet` directly; migrate to `useCoachingActions({ status: "open" })` hook; wire resolve/dismiss mutations to `useResolveCoachingAction()` / `useDismissCoachingAction()` | [FE] | [REAL] | Actions feed loads real data; resolving an action removes it from feed; dismissing logs reason |
| COCH-027 | Implement action resolution Inngest function — on `coaching/action-resolved` event: check if action has `idpFocusAreaId`; if so, update IDP with `evidenceNote` referencing resolved action; fire parent digest update | [BE] | [REAL] | Resolving an action updates the linked IDP focus area's evidence log |
| COCH-028 | Build `ActionDetailDrawer` — opens from action card; shows full action context (session link, annotation timestamp, player, category, notes); status update controls; linked IDP focus area link if `add_to_idp` | [FE] | [REAL] | Drawer opens with correct action data; navigating to film session from drawer seeks to annotation timestamp |
| COCH-029 | Design: ClipActionBar action type selector UI (2 primary + overflow), action creation form per type, ActionsFeed grouped layout, ActionDetailDrawer spec | [DS] | - | Figma specs for `ClipActionBar`, `ActionTypeSelector`, `CreateActionForm`, `CoachingActionCard`, `ActionDetailDrawer` |
| COCH-030 | Analytics: Track `coaching_action.created` (with `{type, hasPlayer, sessionId}`), `coaching_action.resolved` (with `{daysOpen, type}`), `coaching_action.dismissed` | [AX] | - | Resolution rate computable from events; average days-open tracked |
| COCH-031 | QA: End-to-end loop — upload session → annotate at 04:23 → create `add_to_idp` action → verify IDP focus area created with `coachNotes` → resolve action → verify IDP shows evidence link | [QA] | - | Automated integration test covering full loop; no mock data at any step |

---

### Epic COCH-E4: Team Readiness (P0 sub-slice)

*Readiness is the daily habit. Ships in P0, owned by Coaching slice owner.*

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| COCH-032 | Write `server/modules/readiness/service.ts` — `readinessService.submitCheckin(ctx, input)`, `getTeamToday(ctx)`, `getPlayerHistory(ctx, playerId)`, `applyOverride(ctx, playerId, override)`, `clearOverride(ctx, playerId)` | [BE] | [REAL] | All readiness routes call service; `getTeamToday` returns `ReadinessResult[]` with computed status for every active player |
| COCH-033 | Wire `PlayerCheckinPage` — replace mock `computeReadiness` with form submitting to `POST /api/readiness`; form fields: fatigue (1-10), sleep (hours), soreness (1-10), energy (1-10), note (optional) | [FE] | [REAL] | Player submits check-in; page shows confirmation; submitting twice in same day shows "already submitted" state |
| COCH-034 | Wire `TeamReadinessPage` — replace `MOCK_TEAM_READINESS` with `useTeamReadiness()` hook calling `GET /api/readiness/team`; rendered as dot grid; 30-second polling during 6am–12pm window | [FE] | [REAL] | Coach sees real-time status; refreshing shows same data; player checking in updates their dot within 30 seconds |
| COCH-035 | Wire readiness override — `OverrideModal` submits to `POST /api/readiness/player/:id/override`; override type (light_duty/no_contact/full_rest/medical_hold), reason, expiry; clearing calls DELETE | [FE] | [REAL] | Override applies immediately; coach sees override badge on player's dot; override auto-clears at expiry |
| COCH-036 | Inngest job `readiness-alert` (exists) — verify it fires correctly when player `flagged = true` on checkin; sends in-app alert to coaching staff with player name and flagged signals | [BE] | [REAL] | Test: submit check-in with fatigue=8; within 60 seconds coach receives in-app alert |
| COCH-037 | Inngest job `daily-checkin-reminder` — runs at 7:00am local org time; sends push to players who have not submitted today; only fires if org has event on that day | [BE] | [REAL] | Fires only on event days; player who has already submitted does not receive reminder |
| COCH-038 | Design: Dot grid sizing and color spec (READY=green, FLAGGED=amber, RESTRICTED=red, UNKNOWN=grey), player detail drawer layout, override modal spec | [DS] | - | Figma specs for `ReadinessDotGrid`, `ReadinessDetailDrawer`, `ReadinessOverrideModal` |
| COCH-039 | QA: Check-in cutoff — check-in submitted at 2:01pm (default cutoff) shows "submitted late" badge; does not count toward that day's completion rate | [QA] | - | Cutoff enforced server-side; unit test in `service.test.ts` |

---

### Epic COCH-E5: Practice Plan Builder

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| COCH-040 | Write `server/modules/practice-plans/service.ts` — `practicePlanService.create(ctx, input)`, `get(ctx, id)`, `update(ctx, id, blocks[])`, `publish(ctx, id)`, `getForDate(ctx, date)`, `execute(ctx, id)`, `complete(ctx, id)` | [BE] | [REAL] | Plan state machine: draft → published → executing → executed; published plans visible to assistant coaches |
| COCH-041 | Migrate `lib/practicePlanStore.ts` → `features/coaching/store.ts` — keep `usePracticeBuilderStore` with `draftBlocks`, `isDirty`, `moveBlock`, `setActiveBlock`, `resetDraft` | [FE] | - | Old path shimmed; no consumers of old path remain; store state survives component unmount |
| COCH-042 | Refactor `PracticePlanBuilder.tsx` — remove inline `apiGet`; load plan from `usePracticePlan(id)`; save blocks via `useUpdatePracticePlan()`; `isDirty` tracks unsaved changes; auto-save debounced 2 seconds after last change | [FE] | [REAL] | Plan persists on page refresh; unsaved changes show "Unsaved" badge; auto-save clears it |
| COCH-043 | Build "Open Coaching Actions" sidebar in plan builder — `GET /api/coaching-actions/open` called when plan builder opens; each open action shown as a suggested drill card; dragging an action into a block creates a `PracticeBlock` with `coachingActionId` | [FE][BE] | [REAL] | Open actions visible in sidebar; dragging one into the plan creates a linked block; action status updated to `in_progress` |
| COCH-044 | Build "Flagged Players" sidebar panel — fetches `GET /api/readiness/team` for today; players with RESTRICTED or FLAGGED status shown as warning chips; hovering shows their check-in signals | [FE] | [REAL] | Flagged players visible in plan builder; clicking shows override option directly |
| COCH-045 | Add drill library picker drawer — `DrillPickerDrawer` opens when adding a drill-type block; searches Academy drill library via `GET /api/drills?search=&focus=`; selecting a drill populates block name, duration, cues | [FE] | [MOCK-OK] P1 (drills seeded) | Drill search returns results; selecting populates block; drill cues appear in execution mode |
| COCH-046 | Wire plan publishing — "Publish" button calls `PATCH /api/practice-plans/:id/publish`; plan appears on assistant coaches' dashboards; player sees "Practice today" on their home screen | [FE][BE] | [REAL] | Publishing sends in-app notification to all coaching staff; player sees event on their schedule |
| COCH-047 | Design: Practice plan builder layout (block list center, readiness sidebar right, drill picker drawer), block type iconography, drag handle UX, "Open actions" sidebar card spec | [DS] | - | Figma specs for `PlanBlock`, `DrillPickerDrawer`, `OpenActionsSidebar`, `FlaggedPlayersSidebar` |
| COCH-048 | Analytics: Track `practice_plan.created`, `practice_plan.published`, `practice_plan.executed`, `coaching_action.added_to_plan` with `{orgId, blockCount, durationMinutes}` | [AX] | - | Plans-per-week metric trackable per org |
| COCH-049 | QA: Plan load conflict — two coaches editing the same plan simultaneously; last-write-wins with a "plan updated by [coach]" toast to the second coach | [QA] | - | Concurrent edit test; no silent data loss |

---

### Epic COCH-E6: Practice Execution & Review

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| COCH-050 | Wire `PracticeExecutionPage` — load plan from `usePracticePlan(id)`; block timer counts down per block duration; "Next Block" advances; quick note textarea per block; calls `PATCH /api/practice-plans/:id/execute` when started | [FE] | [REAL] | Execution mode shows real plan; timer works; notes save per block; starting execution updates plan status |
| COCH-051 | Wire `PracticeReviewPage` — post-session form: session rating (1-5), what worked, adjustments, player performance notes; `PATCH /api/practice-plans/:id/post-notes` (route exists) | [FE] | [REAL] | Review submits and persists; plan status moves to `reviewed` |
| COCH-052 | Build `CoachingJournalPage` — `POST /api/coaching-journal` creates a private journal entry linked to a date and optional session; `GET /api/coaching-journal` returns entries sorted by date | [BE][FE] | [REAL] | Journal entry creates and persists; private to author; searchable by date range |

---

### Epic COCH-E7: Playbook V3 Studio (P2)

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| COCH-053 | Wire `PlaybookStudioV3` — `GET /api/playbook/plays` loads saved plays; `POST /api/playbook/plays` saves new play; V3 canvas state serialized to `data` JSON column | [BE][FE] | [MOCK-OK] | Play saves and reloads with correct token positions and paths |
| COCH-054 | Build play library page — grid of plays filterable by category (offense/defense/BLOB/SLOB/press); play thumbnail renders from `src/playbook/` resolver | [FE] | [MOCK-OK] | Play grid loads; filter works; clicking opens canvas with that play |
| COCH-055 | Build opponent scout report — `POST /api/opponents` creates opponent; `PATCH /api/opponents/:id/scout` saves personnel, tendencies, key plays; linked to an upcoming game event | [BE][FE] | [MOCK-OK] | Scout report saves and appears on Game Day view |
| COCH-056 | Design: Playbook studio layout, play category nav, play card thumbnail spec, opponent scout report sections | [DS] | - | Figma specs delivered |

---

### COCH Implementation Order

```
Week 15-16: COCH-001..011 (Film library + Mux upload)
Week 17-18: COCH-012..019 (Film session detail + annotation)
Week 19-20: COCH-020..031 (Coaching actions loop — THE WEDGE)
P0 already:  COCH-032..039 (Readiness — runs in parallel with ADMB)
Week 21-22: COCH-040..049 (Practice plan builder)
Week 23-24: COCH-050..052 (Execution + review + journal)
Week 29+:   COCH-053..056 (Playbook + scout — P2)
```

### COCH Definition of Done

- [ ] Film uploads via Mux; session plays back in the film player
- [ ] Coach annotates at a specific timestamp with a player tag
- [ ] Creating a coaching action from `ClipActionBar` (`add_to_idp` type) creates a real IDP focus area
- [ ] Open coaching actions appear in the practice plan builder sidebar
- [ ] Practice plan saves, publishes, and shows on assistant coach dashboard
- [ ] Players submit real readiness check-ins; coach sees real team grid before practice
- [ ] End-to-end loop test passes: film → annotation → action → IDP → practice plan → resolved
- [ ] Zero mock data imports in any Coaching page or component in production builds

---
---

## SLICE 3: Assessments

### Release Goal
Every player has an evidence-based development plan created from real skill scores, not gut feel. Coaches can assess a full roster in under 5 minutes, see how each player compares to program norms, and generate an IDP pre-populated from the gaps.

**Feature flag**: `FLAG_ASSESSMENTS`  
**Phase**: P1 — Weeks 23–26

---

### Epics Overview

| Epic | Description | Phase | MOCK? | Depends on |
|---|---|---|---|---|
| ASMT-E1 | Quick Assess Flow | P1 | [REAL] | ADMB-E1 |
| ASMT-E2 | IDP CRUD | P1 | [REAL] | ADMB-E1, ASMT-E1 |
| ASMT-E3 | Benchmarks | P1 | [MOCK-OK] needs data | ASMT-E1 |
| ASMT-E4 | IDP Generator Wizard | P1 | [REAL] | ASMT-E1, ASMT-E2, ASMT-E3 |
| ASMT-E5 | Player-Facing Development Views | P1 | [REAL] | ASMT-E2 |
| ASMT-E6 | Advanced Analytics (velocity, calibration) | P2 | [MOCK-OK] | ASMT-E1 |

---

### Epic ASMT-E1: Quick Assess Flow

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ASMT-001 | Create `features/assessments/` slice from template — `types.ts` (AssessmentRubric, AssessmentEvent, AssessmentScore, IdpFocusArea, IdpMilestone, ProgramBenchmark); full slice structure | [FE] | - | Slice compiles; all types imported from `@/features/assessments` by consumers |
| ASMT-002 | Write `assessments` server module — create `server/modules/assessments/routes.ts` and `service.ts`; endpoints: `POST /api/assessments/events`, `GET /api/assessments/events`, `POST /api/assessments/events/:id/scores`, `GET /api/roster/:id/skill-assessments` (route exists) | [BE] | [REAL] | Assessment event created with `orgId`, `date`, `rubricId`, `assessorId`; scores stored per player per sub-skill |
| ASMT-003 | Write `server/modules/assessments/schema.ts` — `AssessmentEventSchema` (rubricId, sessionDate, playerIds[]), `SubmitScoresSchema` (scores[]: {playerId, category, subSkill, score 1-10, notes?}) | [BE] | [REAL] | `score` outside 1-10 returns 422; missing `playerId` returns 422 |
| ASMT-004 | Wire `useQuickAssess()` mutation — calls `POST /api/assessments/events` then `POST /api/assessments/events/:id/scores`; batches all scores in single submit | [FE] | [REAL] | Scores for 12 players submitted in one API call; network error shows retry option |
| ASMT-005 | Build `QuickAssessPage` — full-screen mobile mode; player list with auto-advance; `SkillScoreSlider` per sub-skill (1-10, large tap targets 44x44px minimum); "Skip" to next player; review screen before final submit | [FE] | [REAL] | 12 players × 3 sub-skills scoreable in under 4 minutes; scores persist on submit |
| ASMT-006 | Build `SkillScoreSlider` component — integer 1-10; tap-to-select (not drag); labeled anchors (1=Needs Work, 5=Developing, 10=Elite); keyboard-navigable on desktop | [FE] | - | Tap selects immediately; value readable by screen reader; no half-values accepted |
| ASMT-007 | Wire `SkillAssessmentPage` (coach view) — assessment events list; "Quick Assess" CTA; per-player score history table by sub-skill | [FE] | [REAL] | Loads real assessment history; empty state shows "No assessments yet — run Quick Assess" |
| ASMT-008 | Design: Quick Assess player card layout (player name, position, 3 sub-skill sliders), review screen (scrollable scores table with edit), assessment events list row | [DS] | - | Figma specs for `QuickAssessPlayerCard`, `ScoreReviewTable`, `AssessmentEventRow` |
| ASMT-009 | Analytics: Track `assessment.event_started`, `assessment.event_completed` (with `{playerCount, subSkillCount, durationSeconds}`), `assessment.score_corrected` | [AX] | - | Time-to-complete trackable; drop-off point visible |
| ASMT-010 | QA: Score jump validation — submitting a score that jumps >3 points from prior score in same sub-skill within 14 days shows confirmation dialog; confirm proceeds; cancel returns to slider | [QA] | - | Test: player had 5 last week; submitting 9 shows dialog; confirming saves 9 |

---

### Epic ASMT-E2: IDP CRUD

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ASMT-011 | Migrate `lib/idp-selectors.ts` → `features/assessments/compute.ts` — `identifyIdpGaps(scores, benchmarks)` and `suggestFocusAreas(gaps, limit)` functions | [FE] | - | Old path shimmed; `compute.test.ts` tests pass at new location |
| ASMT-012 | Wire `PlayerIDPPage` (coach view) — calls `GET /api/roster/:id/idp`; renders focus areas with status, current score, target score, deadline; "Add Focus Area" and "Edit" actions | [FE] | [REAL] | IDP loads real focus areas; status badges render correctly; adding a focus area persists |
| ASMT-013 | Wire focus area CRUD — `useCreateIdpFocusArea()`, `useUpdateIdpFocusArea()`, `useDeleteIdpFocusArea()` mutations calling existing roster routes | [FE] | [REAL] | Creating a focus area appears immediately in the list; deleting requires confirmation |
| ASMT-014 | Build milestone management — `IdpMilestone` CRUD via `POST /api/roster/:id/idp/:idpId/focus-areas/:faId/milestones`; milestone list under each focus area; mark complete action | [FE][BE] | [REAL] | Milestones create, update, and toggle complete; completed milestones show checkmark with completion date |
| ASMT-015 | Build drill link on focus area — `POST /api/roster/:id/idp/:idpId/focus-areas/:faId/drills`; drill picker opens Academy drill library; selected drill appears under focus area | [FE][BE] | [MOCK-OK] P1 drills needed | Linking a drill from the IDP focus area creates `idp_drill_links` record |
| ASMT-016 | Build `IdpComments` — async comment thread between coach and player on a focus area; `POST /api/roster/:id/idp/:idpId/focus-areas/:faId/comments`; comment types: `weekly_review`, `film_note`, `general` | [FE][BE] | [REAL] | Coach and player can comment; notifications sent to each party on new comment |
| ASMT-017 | Wire focus area status transitions — coach can move status: `draft → active → completed → paused`; UI shows current state and valid next states only | [FE] | [REAL] | Invalid state transitions not offered in UI; transition persists |
| ASMT-018 | Design: PlayerIDPPage layout (focus area cards with milestones collapsed/expanded), focus area editor modal, milestone row with complete toggle, IDP comment thread | [DS] | - | Figma specs for `IdpFocusAreaCard`, `IdpMilestoneRow`, `IdpCommentThread` |
| ASMT-019 | Analytics: Track `idp.focus_area_created`, `idp.milestone_completed`, `idp.focus_area_completed` with `{orgId, playerId, category, daysToCompletion}` | [AX] | - | Completion rate computable per org; median time-to-completion trackable |
| ASMT-020 | QA: IDP visibility — player can see their own IDP (focus areas, milestones, comments); cannot see other players' IDPs; parent can see child's active focus areas but not raw assessment scores | [QA] | - | Role-filtered endpoint test; parent sees simplified view |

---

### Epic ASMT-E3: Benchmarks

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ASMT-021 | Inngest job `benchmark-computation` — runs nightly at 02:00 UTC; queries all `skill_assessments` for org; computes `mean`, `stdDev`, `p25`, `p75` per `(orgId, category, subSkill, position?)`; upserts `program_benchmarks` table; only computes when `sampleSize >= 5` | [BE] | [REAL] | Job runs without error; `program_benchmarks` table populated after first run with sufficient data; `sampleSize < 5` → no row |
| ASMT-022 | Create `program_benchmarks` table — migration; `orgId`, `category`, `subSkill`, `position` (nullable), `sampleSize`, `mean`, `p25`, `p75`, `stdDev`, `computedAt` | [BE] | [REAL] | Migration runs cleanly; table queryable via repository |
| ASMT-023 | Wire `BenchmarkingPage` — `GET /api/benchmarks?category=&position=`; renders `BenchmarkBar` per sub-skill (player score vs. program mean); "Insufficient data" state when `sampleSize < 5` | [FE] | [MOCK-OK] until data exists | Page shows real data after first benchmark computation run; insufficient data state shown for new orgs |
| ASMT-024 | Build `BenchmarkBar` component — horizontal bar showing player score, program mean marker, p25-p75 range shaded; percentage label; position filter toggle | [FE] | - | Renders correctly with score < mean, score = mean, score > mean; accessible (ARIA labels) |
| ASMT-025 | QA: Benchmark not shown below 5 samples — org with 4 players assessed shows "Not enough data" placeholder; org with 5+ shows benchmark correctly | [QA] | - | Unit test for `sampleSize < 5` guard in `benchmark-computation` job |

---

### Epic ASMT-E4: IDP Generator Wizard

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ASMT-026 | Write `server/modules/roster/:id/idp/generate` service implementation — accepts `playerId`; fetches most recent assessment scores; fetches `program_benchmarks`; calls `identifyIdpGaps()` compute function; returns top 3 gap sub-skills with suggested focus area data | [BE] | [REAL] | Endpoint returns ranked gap list; each item has `category`, `subSkill`, `playerScore`, `benchmarkMean`, `gap` |
| ASMT-027 | Wire `IDPGeneratorPage` — replace `sampleBenchmarkReports` and `idpTemplates` mock imports with `useIdpGenerator(playerId)`; Step 1 shows real gaps; Step 2 allows coach to select focus areas; Step 3 sets targets and deadlines; Step 4 publishes IDP | [FE] | [REAL] | Wizard uses real assessment data; publishing creates real IDP focus areas; player notified |
| ASMT-028 | Design: IDP generator step indicators, gap card layout (skill name, player vs. benchmark visual, select checkbox), focus area target-setting form | [DS] | - | Figma spec for 4-step wizard; each step mocked in Figma |
| ASMT-029 | QA: IDP generator with insufficient data — player with < 2 assessment events shows "Not enough data to generate — run Quick Assess first" warning; wizard still allows manual focus area creation | [QA] | - | Graceful degradation test |

---

### Epic ASMT-E5: Player-Facing Development Views

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ASMT-030 | Wire `AssessmentHistoryPage` (player view) — `GET /api/roster/me/skill-assessments`; groups by `category`; shows score history per sub-skill as sparkline chart | [FE] | [REAL] | Player sees their own scores; no other players' data accessible |
| ASMT-031 | Wire `PlayerDevelopmentView` — replaces `CoachingActionItem` mock with `usePlayerIdp()` and `usePlayerActions()`; shows top active focus area with target score and deadline | [FE] | [REAL] | Player sees their active IDP focus area with current and target score |
| ASMT-032 | Build `DevelopmentTimelinePage` (player) — chronological view of: IDP focus areas added, milestones completed, assessment score changes; each event has a date and linked coaching action | [FE] | [MOCK-OK] P1 | Timeline renders real IDP and assessment events in date order |
| ASMT-033 | QA: Player skill history visibility — player sees their own assessment history from `GET /api/roster/me/skill-assessments`; cannot call `GET /api/roster/:otherId/skill-assessments` | [QA] | - | Cross-player data access blocked at route level |

---

### ASMT Implementation Order

```
Week 23-24: ASMT-001..010 (Quick Assess — needs real data foundation)
Week 24-25: ASMT-011..020 (IDP CRUD — depends on roster routes)
Week 25:    ASMT-021..025 (Benchmarks — wait for assessment data)
Week 26:    ASMT-026..029 (IDP Generator — depends on benchmarks)
Week 27:    ASMT-030..033 (Player views)
Week 29+:   ASMT-E6 tasks (skill velocity, calibration — P2)
```

### ASMT Definition of Done

- [ ] Coach can score 12 players across 3 sub-skills in Quick Assess in under 4 minutes
- [ ] Scores persist and show in per-player assessment history
- [ ] IDP focus area created from `add_to_idp` coaching action shows real data
- [ ] Benchmark computation job runs nightly; benchmark visible after sufficient data
- [ ] IDP generator pre-populates focus areas from real gap analysis (not mock data)
- [ ] Player sees their own assessment history and IDP focus areas; cannot see others'
- [ ] IDP focus area status transitions persist correctly

---
---

## SLICE 4: Academy

### Release Goal
Players complete coaching-assigned film and drill work before practice. Every drill in a practice plan links to a drill definition with cues and diagrams. Film assignments are tracked — coaches know who watched and who didn't.

**Feature flag**: `FLAG_ACADEMY`  
**Phase**: P1 — Weeks 27–28 (MVP); P2 for learning paths

---

### Epics Overview

| Epic | Description | Phase | MOCK? | Depends on |
|---|---|---|---|---|
| ACAD-E1 | Global Drill Library (seeded) | P1 | [MOCK-OK] seeded content | - |
| ACAD-E2 | Film Assignments | P1 | [REAL] | COCH-E1, COCH-E2, ADMB-E1 |
| ACAD-E3 | Player Assignments Dashboard | P1 | [REAL] | ACAD-E2, ASMT-E2 |
| ACAD-E4 | Play Study & Quiz | P2 | [MOCK-OK] | COCH-E7 |
| ACAD-E5 | Learning Paths & Certifications | P2 | [MOCK-OK] | ACAD-E1 |

---

### Epic ACAD-E1: Global Drill Library (seeded)

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ACAD-001 | Create `drills` table migration — `id`, `orgId` (null = global), `name`, `description`, `focusCategory`, `focusSubSkills[]`, `playerCount`, `durationMinutes`, `diagramSvg`, `cues[]`, `setupNotes`, `videoUrl`, `createdBy`, `isPublished` | [BE] | - | Migration runs cleanly; global drills have `orgId = null` |
| ACAD-002 | Create `server/modules/drills/routes.ts` and `service.ts` — `GET /api/drills?search=&focus=&playerCount=&duration=` returns global + org drills; `POST /api/drills` creates org-custom drill | [BE] | [REAL] | Search returns filtered results; org-custom drills only visible to that org |
| ACAD-003 | Seed 50 global basketball drills — JSON seed file in `server/seeds/drills.json`; categories: Shooting (10), Finishing (10), Ball Handling (10), Defense (10), Conditioning (10); each with `diagramSvg`, `cues[]`, realistic `setupNotes` | [BE] | - | `npm run seed:drills` inserts 50 drills; all visible via `GET /api/drills` without auth |
| ACAD-004 | Create `features/academy/` slice from template — `types.ts` (DrillLibraryEntry, FilmAssignment, FilmAssignmentCompletion, LearningPath, Module); wire to drill API | [FE] | - | Slice compiles; `useDrillLibrary()` hook in `hooks.ts` |
| ACAD-005 | Wire `DrillLibraryPage` — `useDrillLibrary(filters)` with real-time search (debounced 300ms); filter by focus category, player count, duration; `DrillCard` grid | [FE] | [REAL] | Search returns matching drills from seeded data within 200ms; filters work |
| ACAD-006 | Build `DrillDetailSheet` — bottom sheet with drill name, description, diagram SVG, cues list, setup notes, video link if present; "Add to plan" button fires `onSelect` callback | [FE] | - | Exported from `features/academy/index.ts`; imported by `COCH-E5` drill picker |
| ACAD-007 | Build `CueLibraryPage` — coach creates personal coaching cues; linked to a drill or standalone; tag by skill category; search | [FE][BE] | [REAL] | Cues save to `coaching_cues` table; visible only to creating coach; searchable |
| ACAD-008 | Design: Drill card grid (image/diagram, name, tags, duration badge), drill detail sheet layout, cue library list row | [DS] | - | Figma specs for `DrillCard`, `DrillDetailSheet`, `CueRow` |
| ACAD-009 | Analytics: Track `drill.searched` (with `{query, resultCount}`), `drill.viewed`, `drill.added_to_plan` | [AX] | - | Most-used drills visible; zero-result searches identify content gaps |
| ACAD-010 | QA: Drill org isolation — org-custom drill visible to same org; not visible to different org's `GET /api/drills` | [QA] | - | Cross-org drill access test |

---

### Epic ACAD-E2: Film Assignments

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ACAD-011 | Create `film_assignments` table migration — `id`, `orgId`, `sessionId`, `clipId` (optional), `assignedTo[]` (playerIds), `assignedBy`, `instructions`, `dueAt`; `film_assignment_completions` table — `assignmentId`, `playerId`, `watchedPct`, `markedDoneAt`, `coachNote` | [BE] | - | Migration runs; FK constraints on `sessionId` and `playerId` |
| ACAD-012 | Create `server/modules/academy/routes.ts` and `service.ts` — `POST /api/academy/assignments` (create), `GET /api/academy/assignments` (coach: all; player: own), `PATCH /api/academy/assignments/:id/complete` (player marks watched), `PATCH /api/academy/assignments/:id/coach-note` | [BE] | [REAL] | Coach sees all assignments for their org; player sees only their own |
| ACAD-013 | Wire `ClipActionBar` `assign_clip` fulfillment — `COCH-024` creates `film_assignments` record; wire player notification via Inngest function `notify-coaching-action` (already exists) | [BE] | [REAL] | Creating `assign_clip` action triggers player in-app notification within 60 seconds |
| ACAD-014 | Build `PlayerAssignmentsPage` — `useFilmAssignments()` fetching player's own assignments; split: overdue, due soon, completed; film assignment card with instructions and due date | [FE] | [REAL] | Player sees their assignments sorted by due date; tapping opens film session at correct timestamp |
| ACAD-015 | Wire `PlayerAssignmentsPage` clip playback — clicking assignment opens `FilmSessionDetail` with `?timestamp={annotationMs}` query param; session player seeks to timestamp on load | [FE] | [REAL] | Player arrives at the correct moment in the film without scrubbing |
| ACAD-016 | Build assignment completion tracking — `useMarkAssignmentWatched()` mutation calling `PATCH /api/academy/assignments/:id/complete`; Mux player sends `timeupdate` events; `watchedPct` computed from watched segments | [FE] | [REAL] | After watching 80% of clip, player can mark complete; coach sees `watchedPct` in assignment list |
| ACAD-017 | Wire coach assignment view — `CoachAssignmentsPage` (under `/app/coach/academy/assignments`); assignment list with player completion status per row; "Send reminder" to non-completers | [FE] | [REAL] | Coach sees per-player completion status; reminder sends in-app notification |
| ACAD-018 | Design: Film assignment card (video thumbnail, instructions, due date badge, watched % progress bar), coach assignment grid (player rows × completion status), reminder flow | [DS] | - | Figma specs for `FilmAssignmentCard`, `AssignmentCompletionRow`, `ReminderModal` |
| ACAD-019 | Analytics: Track `film_assignment.created`, `film_assignment.viewed`, `film_assignment.completed` (with `{daysFromDue, watchedPct}`), `film_assignment.overdue` | [AX] | - | Completion rate per org visible; average time-to-completion trackable |
| ACAD-020 | QA: Assignment due date reminder — assignment due in 2 hours where player has not completed triggers push notification; player who already completed does not receive reminder | [QA] | - | Inngest trigger test with mocked current time |

---

### Epic ACAD-E3: Player Assignments Dashboard

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| ACAD-021 | Wire `PlayerDashboard` academy section — show count of incomplete assignments and soonest due; link to assignments page | [FE] | [REAL] | Player home screen shows "2 assignments due this week" if any exist |
| ACAD-022 | Wire drill assignment from `recommend_drill` coaching action — `COCH-023` creates a record in a `drill_assignments` table; player sees it in their assignments page alongside film assignments | [BE][FE] | [REAL] | Drill assignment appears in player's `PlayerAssignmentsPage` with drill details |

---

### ACAD Implementation Order

```
Week 15-16: ACAD-001..010 (Drill library + seed data — runs parallel to COCH film)
Week 27:    ACAD-011..020 (Film assignments — depends on COCH film upload being live)
Week 27-28: ACAD-021..022 (Player dashboard integration)
Week 29+:   ACAD-E4 (Play study + quiz — needs Playbook V3)
Week 33+:   ACAD-E5 (Learning paths — P2)
```

### ACAD Definition of Done

- [ ] 50 global drills accessible via `GET /api/drills`; search returns results in under 200ms
- [ ] Drill picker in practice plan builder shows real drills; selecting populates block
- [ ] Coaching action of type `assign_clip` creates a film assignment; player receives notification
- [ ] Player can view assigned film clip at the correct timestamp; completion tracked at 80% watched
- [ ] Coach sees per-player completion status; can send reminder with one tap
- [ ] Drill assignment from `recommend_drill` action visible in player's assignment list

---
---

## SLICE 5: Dashboard

### Release Goal
Every role opens the app and immediately knows what to do today. The coach sees real readiness data and real open actions. The player sees their check-in status and top assignment. Nothing on these dashboards comes from mock data.

**Feature flag**: `FLAG_DASHBOARD` (always on after PRIM-004)  
**Phase**: P0 — Weeks 11–14 (coach + player); P2 for director + parent variants

---

### Epics Overview

| Epic | Description | Phase | MOCK? | Depends on |
|---|---|---|---|---|
| DASH-E1 | Dashboard aggregation API | P0 | [REAL] | ADMB-E1, COCH-E4 (readiness) |
| DASH-E2 | Coach Dashboard | P0 | [REAL] | DASH-E1, COCH-E3, ADMB-E2 |
| DASH-E3 | Player Dashboard | P0 | [REAL] | DASH-E1, COCH-E4 |
| DASH-E4 | Alert & Notification System | P1 | [REAL] | All slices |
| DASH-E5 | Parent Dashboard | P2 | [REAL] | ASMT-E2, ADMB-E5 |
| DASH-E6 | Director Dashboard | P2 | [REAL] | MGRL-E1 (health score) |

---

### Epic DASH-E1: Dashboard Aggregation API

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| DASH-001 | Create `server/modules/dashboard/routes.ts` and `service.ts` — `GET /api/dashboard/coach` returns: `{readiness: TeamReadinessSummary, openActionsCount, filmQueueCount, todayEvent, upcomingEvents[3], devAlerts[]}` in one request | [BE] | [REAL] | Endpoint responds in under 300ms; caches for 60 seconds per `orgId`; each component sourced from its own domain repo |
| DASH-002 | `GET /api/dashboard/player` — returns `{checkinStatus: "submitted" \| "not_submitted" \| "cutoff_passed", todayEvent, topIdpFocusArea, pendingAssignmentsCount, nextEvent}` | [BE] | [REAL] | Player endpoint returns only current player's data; no other player info exposed |
| DASH-003 | Create `features/dashboard/` slice — `types.ts`, `api.ts`, `hooks.ts` (`useCoachDashboard`, `usePlayerDashboard`), `compute.ts` (`computeHealthScore`, `prioritizeActionItems`), `mock.ts`, `index.ts` | [FE] | - | Slice compiles; hooks call real endpoints |
| DASH-004 | `AlertItem` table migration — `id`, `orgId`, `userId`, `type`, `severity`, `targetId`, `targetSlice`, `message`, `actionUrl`, `readAt`, `dismissedAt`, `createdAt` | [BE] | [REAL] | Migration runs; `readAt` nullable; partial index on `(userId, readAt IS NULL)` for fast unread count |
| DASH-005 | Alert creation service — `alertService.create(ctx, alert)` with deduplication: same `type + targetId + userId` within 24 hours returns existing record; called by Inngest functions in other slices | [BE] | [REAL] | Duplicate alert within 24 hours is suppressed; new alert after 24 hours created |

---

### Epic DASH-E2: Coach Dashboard

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| DASH-006 | Wire `CoachDashboard.tsx` — replace all mock imports (`roster`, `MOCK_TEAM_READINESS`, `TODAY_SESSION`) with `useCoachDashboard()` hook; `CommandStrip` reads `todayEvent`; `ReadinessDotGrid` reads `readiness` | [FE] | [REAL] | Dashboard cold-loads in under 1.5 seconds; all data real; no mock imports remain |
| DASH-007 | Build `CommandStrip` component — today's date, next event (type + time + opponent if game), countdown badge ("Practice in 2h", "Game tomorrow"); pulls from `todayEvent` in dashboard response | [FE] | - | Renders correctly for no event (rest day), today's event, and next event tomorrow |
| DASH-008 | Build `ReadinessDotGrid` from `useCoachDashboard()` — dots colored by status; "N/M checked in" text; tapping a dot opens `ReadinessDetailDrawer` (COCH-038); UNKNOWN dots show grey with "?" | [FE] | [REAL] | Grid reflects real check-in data; tapping dot shows real player detail |
| DASH-009 | Build `ActionLanes` component — Film Queue lane (count from `filmQueueCount`), Open Actions lane (count from `openActionsCount`), Development Alerts lane (from `devAlerts[]`); each item is tappable | [FE] | [REAL] | Film Queue count accurate; clicking item navigates to correct page |
| DASH-010 | Build `QuickActionsBar` — 4 fixed buttons: "Start Film Review" → `/app/coach/coaching/film/queue`, "Create Practice Plan" → `/app/coach/coaching/practice/new`, "Log Observation" → opens action composer, "View Readiness" → `/app/coach/coaching/readiness` | [FE] | - | All 4 buttons navigate correctly; "Log Observation" opens ClipActionBar without requiring a film session |
| DASH-011 | 30-second polling — `useCoachDashboard()` refetches every 30 seconds during 6am–12pm local time only; `useWindowFocus()` triggers immediate refetch on tab focus | [FE] | - | Network tab shows refetch at 30-second intervals only in AM window; no polling at midnight |
| DASH-012 | Design: Full coach dashboard layout spec (CommandStrip sizing, dot grid with legend, Action Lanes scrollable horizontal spec, Quick Actions bar), empty state for new orgs | [DS] | - | Figma spec for full coach dashboard at 375px, 768px, and 1440px breakpoints |
| DASH-013 | Analytics: Track `dashboard.opened` (with `{role, checkinCompletionRate, openActionsCount}`), `dashboard.quick_action_clicked` (with `{action}`), `dashboard.readiness_dot_tapped` | [AX] | - | Time-to-first-action from dashboard open trackable |
| DASH-014 | QA: Dashboard loads with real data on cold open; stale data banner appears if last fetch > 4 hours ago; "Refresh" button forces refetch | [QA] | - | Stale detection test with mocked `Date.now()` |

---

### Epic DASH-E3: Player Dashboard

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| DASH-015 | Wire `PlayerDashboard` — replace mock data with `usePlayerDashboard()`; check-in CTA is the first element when `checkinStatus = "not_submitted"`; pulsing dot on Home tab in bottom nav | [FE] | [REAL] | Player sees check-in CTA if not submitted; today's event shows real data; top IDP focus area shows real data |
| DASH-016 | Check-in bottom sheet — tapping check-in CTA opens bottom sheet with 4 sliders (fatigue, sleep, soreness, energy); submit calls `POST /api/readiness`; closes on success; confirmation shows player's status | [FE] | [REAL] | Check-in submits in under 30 seconds; status updates immediately; "already submitted today" state if re-opened |
| DASH-017 | Design: Player dashboard layout (check-in CTA prominent, today's event, IDP focus area card, assignment count badge), check-in bottom sheet (4-slider layout with large touch targets) | [DS] | - | Figma spec for player dashboard + check-in bottom sheet at 375px |

---

### Epic DASH-E4: Alert & Notification System

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| DASH-018 | Build `NotificationBell` component — badge count from `GET /api/alerts/unread-count`; opens `AlertInboxDrawer` on click | [FE][BE] | [REAL] | Badge count accurate; clicking marks all as read; count clears |
| DASH-019 | Build `AlertInboxDrawer` — `GET /api/alerts?limit=20`; each alert shows icon by type, message, timestamp, action link; mark-as-read on drawer open | [FE][BE] | [REAL] | Alerts load from real API; tapping any alert navigates to `actionUrl` |
| DASH-020 | Wire Inngest alert triggers — verify `readiness-alert.ts` calls `alertService.create()`; verify `notify-coaching-action.ts` creates alert for target player; add alert on invoice payment due | [BE] | [REAL] | Three alert types fire in staging: readiness flag → coach alert; coaching action → player alert; invoice due → parent alert |

---

### DASH Implementation Order

```
Week 11-12: DASH-001..005 (aggregation API + AlertItem table)
Week 12-13: DASH-006..014 (coach dashboard — needs readiness + actions wired)
Week 13-14: DASH-015..017 (player dashboard)
Week 20+:   DASH-018..020 (alert system — needs coaching actions live)
Week 29+:   DASH-E5, DASH-E6 (parent + director — needs full data)
```

### DASH Definition of Done

- [ ] Coach dashboard shows real team readiness grid before practice
- [ ] Coach dashboard action lanes show real film queue count and open action count
- [ ] Player dashboard shows check-in CTA if not submitted; submits in under 30 seconds
- [ ] Player dashboard shows real IDP focus area and assignment count
- [ ] Pulsing dot on Home nav tab when check-in not submitted
- [ ] Alert inbox shows real alerts; unread badge count accurate
- [ ] Zero mock data imports in any Dashboard page or component

---
---

## SLICE 6: Manager Labs

### Release Goal
Directors can see program health without calling a coach. The platform surfaces which players are at risk, which coaching behaviors correlate with outcomes, and what the program's development trajectory looks like — all from real data accumulated over 60+ days.

**Feature flag**: `FLAG_MANAGER_LABS`  
**Phase**: P2 — Weeks 29–40  
**Unlock condition**: Minimum 5 active programs with 60+ days of real readiness, assessment, and coaching action data. Do not ship to orgs without this data — empty analytics destroy trust.

---

### Epics Overview

| Epic | Description | Phase | MOCK? | Depends on |
|---|---|---|---|---|
| MGRL-E1 | Program Health Score | P2 | [REAL] | All other slices producing data |
| MGRL-E2 | At-Risk Player Interventions | P2 | [REAL] | COCH-E4, ASMT-E2, ADMB-E4 |
| MGRL-E3 | Warning Metrics Dashboard | P2 | [REAL] | MGRL-E1 |
| MGRL-E4 | Coach Effectiveness | P2 | [REAL] | COCH-E3, ASMT-E1 |
| MGRL-E5 | Development Synthesis | P2 | [REAL] | ASMT-E1, ASMT-E3 |
| MGRL-E6 | Season Report Export | P2 | [REAL] | All slices |

---

### Epic MGRL-E1: Program Health Score

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| MGRL-001 | Create `program_health_snapshots` table — `id`, `orgId`, `computedAt`, `overallScore`, `components` (JSONB: readinessRate, idpCoverage, actionResolutionRate, billingCollectionRate, attendanceRate, enrollmentRetentionRate), `deltas` (JSONB: same keys, prior week comparison) | [BE] | - | Migration runs; index on `(orgId, computedAt DESC)` |
| MGRL-002 | Inngest job `program-health-snapshot` — runs nightly at 01:00 UTC; computes 6 component scores from live data; upserts snapshot; fires if last snapshot > 20 hours old | [BE] | [REAL] | Job runs without error; snapshot created; delta computed vs. prior snapshot |
| MGRL-003 | Score computation — `readinessRate = checkins_submitted_today / total_active_players`; `idpCoverage = players_with_active_idp / total_active_players`; `actionResolutionRate = resolved_actions / (resolved + open) last 30d`; `billingCollectionRate = paid_invoices_value / total_invoiced_value`; `attendanceRate = avg_attendance_pct last 14 events`; `enrollmentRetentionRate = prior_season_players_re-enrolled / prior_season_total` | [BE] | [REAL] | Each component returns a value 0–1; overall score = weighted sum × 100 |
| MGRL-004 | Create `features/manager-labs/` slice from template — `types.ts` (ProgramHealthSnapshot, AtRiskFlag, Intervention, CoachEffectivenessMetric); `hooks.ts` (`useProgramHealth`, `useAtRiskPlayers`, `useCoachEffectiveness`); `compute.ts` (`computeRiskScore`) | [FE] | - | Slice compiles; all types from public index |
| MGRL-005 | Wire `ProgramHealthDashboardPage` — `useProgramHealth()` from `GET /api/manager-labs/health`; `ProgramHealthGauge` (0-100 score, delta badge); `ComponentIndicator` × 6; tap any component to open drill-down drawer | [FE] | [REAL] | Score renders from real snapshot; each component shows value + trend arrow; "No data yet" state for new orgs |
| MGRL-006 | Design: Program health gauge (circular, color coded 0-50 red / 50-75 amber / 75-100 green), component indicator bar (value, trend, label), drill-down drawer spec | [DS] | - | Figma spec; health gauge exported from `features/manager-labs/index.ts` (used by Director Dashboard) |
| MGRL-007 | Analytics: Track `manager_labs.health_opened`, `manager_labs.component_drilled` (with `{component}`) | [AX] | - | Component engagement heatmap visible |

---

### Epic MGRL-E2: At-Risk Player Interventions

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| MGRL-008 | Create `at_risk_flags` and `interventions` tables — `at_risk_flags`: `playerId`, `orgId`, `riskScore`, `triggers` (JSONB), `status` (active/intervention_active/resolved/dismissed), `detectedAt`, `suppressedUntil`; `interventions`: `flagId`, `coachId`, `type`, `notes`, `outcome`, `followUpAt`, `loggedAt` | [BE] | - | Migration runs; FK on `playerId`; partial index on `status = 'active'` |
| MGRL-009 | Inngest job `at-risk-assessment` — runs nightly; for each active player: compute risk score from triggers (missed check-ins 3+: +30, attendance <60%: +20, no IDP activity 30d: +20, no resolved actions 30d: +15, invoice overdue: +15); create flag if score ≥ 60 and no active flag; alert responsible coach | [BE] | [REAL] | Nightly run creates flags for test players meeting thresholds; duplicate flags not created |
| MGRL-010 | Wire `AtRiskInterventionPage` — `useAtRiskPlayers()` from `GET /api/manager-labs/at-risk`; risk card shows player name, score, trigger list; "Log Intervention" opens drawer | [FE] | [REAL] | At-risk players shown with real risk scores; empty state ("No players at risk — great work") when none |
| MGRL-011 | Build intervention log drawer — type selector (call/meeting/email/schedule_adjustment), notes textarea, outcome selector, `followUpAt` date picker; `POST /api/manager-labs/interventions`; sets flag `status = "intervention_active"` and `suppressedUntil = now + 7d` | [FE][BE] | [REAL] | Logging intervention suppresses risk flag for 7 days; follow-up reminder fires at `followUpAt` |
| MGRL-012 | Inngest job `intervention-followup` — fires at `followUpAt` timestamp; sends coach in-app alert: "Follow up on Devon Carter's at-risk flag — 7 days since intervention"; re-evaluates risk | [BE] | [REAL] | Follow-up alert fires within 5 minutes of `followUpAt`; if player improved, flag auto-resolves |

---

### Epic MGRL-E3: Warning Metrics Dashboard

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| MGRL-013 | Implement `GET /api/manager-labs/warnings` — returns active warning items grouped by severity; warning types: `low_checkin_completion` (<50% today), `overdue_idp` (IDP focus area >14d not updated), `assessment_gap` (player not assessed in 30d), `overdue_invoice` (>5 invoices overdue) | [BE] | [REAL] | Each warning includes `type`, `severity`, `value`, `threshold`, `affectedCount`, `actionUrl` |
| MGRL-014 | Wire `WarningMetricsDashboardPage` — grouped by severity (critical/warning/info); each warning card shows type label, current value, threshold, affected players/items count; `actionUrl` links to the relevant page | [FE] | [REAL] | Warnings load from real data; empty state when no warnings ("All clear"); clicking warning navigates to action |
| MGRL-015 | QA: Warning threshold accuracy — org with exactly 49% check-in rate shows `low_checkin_completion` warning; org with 51% does not | [QA] | - | Threshold boundary test |

---

### Epic MGRL-E4: Coach Effectiveness

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| MGRL-016 | Create `coach_effectiveness_metrics` table — `coachId`, `orgId`, `periodStart`, `periodEnd` (7-day and season-to-date), `actionResolutionRate`, `idpCompletionRate`, `filmSessionsCreated`, `assessmentEventsRun`, `playerCheckinRate`; `computedAt` | [BE] | - | Migration runs; unique constraint on `(coachId, periodStart, periodEnd)` |
| MGRL-017 | Inngest job `coach-effectiveness-snapshot` — runs Sunday nights; computes prior 7-day window per coach; stores snapshot | [BE] | [REAL] | Snapshots accumulate weekly; historic trend available via `periodStart` filter |
| MGRL-018 | Wire `CoachEffectivenessDashboardPage` — director-only; `useCoachEffectiveness()` from `GET /api/manager-labs/effectiveness`; `CoachMetricsRow` per coach; sortable columns | [FE] | [REAL] | Page visible only to `director_of_ops` role; coaches cannot access; data from real snapshots |
| MGRL-019 | QA: Role gate — coach JWT returns 403 on `GET /api/manager-labs/effectiveness`; director JWT returns 200 | [QA] | - | Role guard test |

---

### Epic MGRL-E5: Development Synthesis

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| MGRL-020 | Implement `GET /api/manager-labs/development-synthesis` — aggregates `skill_assessments` across org; returns mean score per `(category, subSkill)` over time (monthly buckets); identifies trending up/down sub-skills | [BE] | [REAL] | Endpoint returns data after ≥2 assessment events in organization |
| MGRL-021 | Wire `DevelopmentSynthesisPage` — heat map of skill categories × time buckets; color = average score (red <4, amber 4-6, green >6); click cell to see player distribution | [FE] | [REAL] | Heat map renders with real data; empty state for new orgs |

---

### Epic MGRL-E6: Season Report Export

| ID | Task | Type | MOCK? | AC |
|---|---|---|---|---|
| MGRL-022 | Implement `POST /api/manager-labs/season-report` — accepts `seasonId`; aggregates: enrollment count, attendance rate, assessment coverage, IDP completion rate, action resolution rate, billing collection rate; generates PDF via `puppeteer` or `pdfmake`; stores signed URL | [BE] | [REAL] | PDF generates in under 30 seconds; contains accurate numbers from the specified season |
| MGRL-023 | Wire `SeasonReportPage` — "Generate Report" button for active or past season; loading state during generation; download link on completion | [FE] | [REAL] | Report downloads as PDF; numbers match what director sees on health dashboard |
| MGRL-024 | QA: Season report idempotency — generating report for same season twice returns the same PDF (or regenerates with current data — document the behavior); second call does not create duplicate DB record | [QA] | - | Idempotency test |

---

### MGRL Implementation Order

```
Week 29-30: MGRL-001..007 (Health score — needs 60 days data; gate on unlock condition)
Week 31-32: MGRL-008..012 (At-risk interventions)
Week 33-34: MGRL-013..015 (Warning metrics)
Week 35-36: MGRL-016..019 (Coach effectiveness)
Week 37-38: MGRL-020..021 (Development synthesis)
Week 39-40: MGRL-022..024 (Season report)
```

### MGRL Definition of Done

- [ ] Program health score computes nightly from real data across all 6 components
- [ ] At-risk flags fire correctly for players meeting threshold criteria in automated test
- [ ] Coach effectiveness page returns 403 for coach JWT, 200 for director JWT
- [ ] Warning metrics dashboard shows zero warnings for a healthy test org
- [ ] Season report PDF generates with accurate numbers from the test season
- [ ] All Manager Labs pages show "Not enough data yet" state for orgs with < 60 days of data

---
---

## Cross-Slice Dependency Map

```
Foundation (PRIM-001..009)
  └── Admin/Billing (ADMB-E1 Roster) ← blocks everything
        └── Readiness (COCH-E4)
        └── Events (ADMB-E2)
        └── Season (ADMB-E3)
              └── Invoice/Billing (ADMB-E4, E5)
              └── Dashboard P0 (DASH-E1, E2, E3) ← needs readiness + actions
        └── Coaching Film (COCH-E1, E2)
              └── Coaching Actions (COCH-E3) ← THE WEDGE
                    └── add_to_idp → Assessments IDP (ASMT-E2)
                    └── assign_clip → Academy Assignments (ACAD-E2)
                    └── recommend_drill → Academy Drills (ACAD-E1)
        └── Assessments Quick Assess (ASMT-E1)
              └── Benchmarks (ASMT-E3) — needs 30+ days data
              └── IDP Generator (ASMT-E4) — needs benchmarks
        └── Practice Planning (COCH-E5) ← needs actions + drills + readiness
  └── Manager Labs (MGRL) ← last; needs 60+ days of all the above
```

---

## Global QA Checklist (applies to every slice before DoD)

- [ ] All server routes return 401 without a valid JWT
- [ ] All server routes return 403 when called with a JWT from a different org
- [ ] No response contains data from a different org (spot-checked with 2-org test fixture)
- [ ] All mutation endpoints return 422 with field-level errors for invalid input
- [ ] All list endpoints return empty array (not 404) when no records exist
- [ ] `compute.ts` for the slice has 100% test coverage (all exported functions)
- [ ] `hooks.ts` tests cover success, loading, and error states for each hook
- [ ] No `import` of `mock.ts` content in any production page or component (VSA CI check passes)
- [ ] Feature flag disables the slice's routes server-side (returns 404) and hides nav item client-side
- [ ] Slice's `index.ts` is the only import point used by any external consumer (VSA CI check passes)

---

*End of HoopsOS Execution Backlog*  
*212 tasks across 6 slices · Directly executable in Linear or Jira*
