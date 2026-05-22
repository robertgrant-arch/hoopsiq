# HoopsIQ Product Build — TODO

## Phase 1: Mock data layer
- [ ] Write `lib/mock/roles.ts` — 6 demo users (athlete/coach/teamAdmin/expert/parent/superAdmin)
- [ ] Write `lib/mock/teams.ts` — Texas Elite org with 2 teams + seasons
- [ ] Write `lib/mock/roster.ts` — 12 athletes with profiles, avatars, stats
- [ ] Write `lib/mock/workouts.ts` — workout templates + today's WOD + assignments
- [ ] Write `lib/mock/videos.ts` — uploads with AI analyses + issues + coach reviews
- [ ] Write `lib/mock/clips.ts` — film room clips with timestamp comments + assignments
- [ ] Write `lib/mock/plays.ts` — one full playbook with 3 plays + 5-frame sequences
- [ ] Write `lib/mock/experts.ts` — 6 experts with offers (review/consult/class/course)
- [ ] Write `lib/mock/courses.ts` — 8 courses across included/premium tiers
- [ ] Write `lib/mock/live.ts` — 12 upcoming live events + 3 replays
- [ ] Write `lib/mock/billing.ts` — plans, subscriptions, discount grants
- [ ] Write `lib/mock/notifications.ts` — mixed inbox with behavioral + transactional
- [ ] Write `lib/mock/audit.ts` — AuditLog entries for admin surface
- [ ] Write `lib/auth.ts` — localStorage-backed role switcher with `useRole()` hook

## Phase 2: Marketing site
- [ ] `/` — homepage hero + audience pivot + metrics + live showcase + pricing teaser
- [ ] `/players` — athlete-focused hero + AI mechanics + 50% callout
- [ ] `/coaches` — Coach HQ + Film Room + Playbook Studio + compliance
- [ ] `/teams` — org plan + 50% rule diagram + demo CTA
- [ ] `/experts` — MasterClass grid + apply-to-teach
- [ ] `/pricing` — tiered matrix + annual toggle + 50% rule fine print
- [ ] `/live` — Peloton poster grid
- [ ] `/about`, `/legal`, `/contact`

## Phase 3: Auth shell
- [ ] Role switcher modal (list of 6 demo users, click to impersonate)
- [ ] `(app)/layout` with `AppTopBar` + role-aware sidebar
- [ ] Route guards that redirect to `/signin` if no role

## Phases 4–13: Product surfaces
- [ ] Player App: dashboard / wod / uploads / uploads/[id] / skills / achievements
- [ ] Coach HQ: dashboard / roster / queue / queue/[id] (telestration) / assignments / practice-plans / library / messages / bookings / learn
- [ ] Team: org dashboard / teams/[id] / invite / billing / settings
- [ ] Marketplace: / / experts / experts/[slug] / offers/[id] / bookings/[id] / apply / payouts
- [ ] Film Room: / / rooms/[id] / rooms/[id]/clips/[id] / rooms/[id]/assignments / player-inbox
- [ ] Playbook Studio: / / plays/[id] (editor) / plays/[id]/study / plays/[id]/quiz
- [ ] Live: / / [id] / [id]/room / [id]/replay
- [ ] Learn: / / courses/[id] / courses/[id]/lessons/[id] / my
- [ ] Billing: / / checkout-success / settings
- [ ] Admin: / / users/[id] / subscriptions / moderation / audit / jobs / flags

## Phase 14: Docs integration
- [ ] Move docs to `/docs/*` with existing chapter index working
- [ ] Add "Docs" link to marketing top nav

## Phase 15: QA
- [ ] Visit every route — no 404s, no TS errors
- [ ] Save checkpoint

## Phase 16: Completion roadmap doc
- [ ] Write `hoopsiq_completion_roadmap.md` — production checklist


---

## Phase 17 — Practice Plan Builder + Playbook Studio Buildout (NEW REQUEST)

- [ ] Re-read Prompt 14 (Whiteboard/Playbook), Prompt 8 (Coach HQ practice plans), Prompt 3 (schema), audit existing PlaybookStudio + PracticePlans pages
- [ ] Extend mock data: drill library, practice plans, playbooks/plays/phases/diagrams/quizzes
- [ ] Practice Plan Builder
  - [ ] Drill library drawer with categories + search + filters
  - [ ] Period timeline with drag-add, drag-reorder, inline duration edit
  - [ ] Auto-summed running clock + warnings if over budget
  - [ ] Equipment / coach / court allocation summary
  - [ ] Print/share/export view
  - [ ] List + detail of multiple practice plans
- [ ] Playbook Studio
  - [ ] Half-court + full-court SVG backgrounds
  - [ ] Token palette (O1–O5, X1–X5, ball, cones, screens)
  - [ ] Drag tokens, snap-to-grid, multi-select
  - [ ] Path tools (cut, dribble, pass, screen)
  - [ ] Multi-phase timeline + animated playback
  - [ ] Formation library
  - [ ] Save/version, list view, naming, tags
  - [ ] Coach presentation mode
- [ ] Play Quizzes (author + take)
- [ ] QA + checkpoint


## Phase 18 — Bug: links/login broken to Practice Plans + Playbook Studio
- [ ] Verify sidebar `Practice Plans` href matches the App.tsx route exactly
- [ ] Verify sidebar `Playbook Studio` href matches the new route
- [ ] Test sign-in flow on the deployed domain
- [ ] Test direct deep-links: `/app/coach/practice-plans` and `/app/playbook` after sign-in
- [ ] Patch any mismatched hrefs / missing routes


## Phase 19 — UX: marketing/demo-app boundary is confusing
- [ ] Audit every CTA on /, /coaches, /players, /teams, /experts, /pricing, /live
- [ ] "Start 14-day trial", "Start training" type CTAs → `/sign-in`
- [ ] Top-nav "Sign in" already routes to `/sign-in` — add a primary "Open Demo App" button next to it
- [ ] Add a dismissible banner across marketing routes: "This is the demo product page — sign in (no password) to use the actual app"


## Phase 20 — Prompt 16: Billing + Custom Drills addendum
- [ ] Custom Drills: extend Drill type with ownerCoachId, orgId, isCustom, visibility
- [ ] Custom Drills: My Drills tab + create/edit/delete dialog in Practice Plan Builder
- [ ] Custom Drills: localStorage-backed store + integration with existing drill drawer
- [ ] Billing seed: Subscription, Entitlement, CoachLinkEntitlement, Seat, Invoice, WebhookEvent, Coupon, PayoutAccount
- [ ] EntitlementService: grant/revoke/check + 50%-off engine with grandfathering + audit log
- [ ] Webhook simulator panel (admin)
- [ ] Pricing page wired to mock Checkout
- [ ] Customer Portal page (cancel/upgrade/pause/resume)
- [ ] Seat management UI for Team Pro (add/remove/swap with proration)
- [ ] Dunning banner + grace period UX
- [ ] Refund flow (subs / live / expert review SLA)
- [ ] Expert payout panel + 15% platform fee math
- [ ] Metered AI credits
- [ ] Admin Analytics: MRR, ARR, churn, LTV, ARPU
- [ ] Update architecture + schema docs
- [ ] Wire into Coach HQ / Player / Team / Expert / Admin nav
- [ ] QA + checkpoint


## Phase 21 — Drill Library toolbar layout fix
- [ ] Re-read DrillLibraryDrawer header markup
- [ ] Refactor into 4 sub-containers: header / tabs / search+chips / filters+matched
- [ ] Use flex-wrap + min-widths so nothing overlaps at any width
- [ ] Add 2-column grid on >=1024px for bottom (search+chips | filters)
- [ ] Verify desktop/tablet/mobile, save checkpoint


## Phase 22 — Custom Drill modal: number-input editing bug
- [ ] CustomDrillEditor: switch durationMin/coaches/minPlayers/maxPlayers to raw-string state
- [ ] Normalize via parseInt/clamp only on blur + submit
- [ ] Re-verify clearing & retyping any value works smoothly
- [ ] Save checkpoint + republish


## Phase 23 — Claude code review fixes for CustomDrillEditor
- [ ] Build NumericInput primitive (raw-string internal state, normalize on blur)
- [ ] Module-level normalizePositiveInt(v, opts?) — fallback defaults to min
- [ ] Drop defaultDurationMin/coachesNeeded/min/maxPlayers from `form`; derive at save
- [ ] canSave reads live numStr values via normalizePositiveInt
- [ ] Replace local Label div with <label htmlFor=> + stable id on every input/select
- [ ] aria-pressed on visibility option buttons
- [ ] aria-label on equipment + coaching point remove buttons
- [ ] Import ReactNode where needed
- [ ] Replace BudgetInput/SeatCountInput/AddSeatDialog with NumericInput
- [ ] TS check, save checkpoint, redeploy
