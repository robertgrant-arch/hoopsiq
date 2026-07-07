# Film Room v2 — MVP Scope

Goal: **coach-created clip assignments work end-to-end.** One coach uploads
film, cuts a clip, sends it, a player watches and responds, the coach closes
the loop or escalates — with every step auditable. Everything else earns its
way in later.

---

## MVP features (must ship)

**Film pipeline**
- Upload (Mux direct, resumable) → `processing` → `ready to clip` → archived.
- "Pending AI" removed as a state; existing analysis keeps running as a
  non-blocking overlay job.
- Film Library with type/status/date/opponent filters + coverage counts +
  the Needs-Attention strip (computed, 4 counters).

**Clipping (Clip Workspace)**
- Keyboard clipping: I/O bounds, frame step, Enter-to-create; timeline with
  clip spans and wheel zoom (no lane packing beyond 3, no minimap).
- Clip drawer: title, teaching-point note, categories, player tags
  (type-ahead by number/name), priority.
- Telestration on clip (reuses the existing annotation canvas).
- Autosave (800ms debounce + localStorage mirror) with visible save state.
- Approve → clip locks on send; duplicate-to-edit.

**Assignment + accountability**
- Approve & send: per-player assignment rows, due date (defaults to next
  practice), response required toggle, text-reflection prompt.
- Notification fan-out through the existing quiet-hours/minor-safety stack;
  bundled reminders, 1/day player cap.
- Assignments page: attention-order grid, the 12-column layout with glyph
  cluster, row expansion, detail drawer with thread + event log, follow-up
  actions (reply / close / remind / due change / archive). Single-select
  actions only — bulk is post-MVP except bulk close.

**Player review (mobile-first)**
- Inbox + segment-clamped viewer + teaching point + text reflection +
  "review with coach" flag + Done; ≥90% watch tracking; offline capture
  with reconnect sync; the three player statuses (To do / Done / Coach
  replied).

**IDP escalation**
- Add-to-IDP panel from clip and queue row → existing IDP evidence +
  `idp_links` ledger row. Manual only in MVP.

**Audit trail**
- `audit_events` on every state change (who, when, before/after);
  event-log section in the assignment drawer; append-only.

**Copy + IA**
- Full copy swap per the copy doc (kill "AI-powered pattern detection"
  everywhere); nav: Film Room / Assignments; Suggestion history demoted to
  a tab.

## Optional in MVP (build only if the core lands early)

In priority order — each is small because the plumbing (ai_suggestions,
panel) ships with the schema:
1. **AI title/category suggestions** in the drawer (ghost text + unselected
   chips) — lowest risk, saves real seconds.
2. **AI draft notes** ("Draft note" button, editable, marked).
3. **Duplicate clip flags** on save (temporal overlap only — no embeddings).

If timeline pressure hits, all three slip without touching the core loop.

## Post-MVP backlog (ordered)

1. Bulk queue actions (reassign, bulk due change, bulk escalate) + saved views
2. AI clip-boundary suggestions on the timeline (needs suggestion→draft flow
   hardened + CV event quality validated against real accept rates)
3. Choice/confidence response types + coach question builder
4. Player Progress rollup page (per-player accountability over time)
5. Cross-clip pattern summaries + IDP recommendations (evidence-gated)
6. Review prioritization (ranking from coach accept/dismiss history)
7. Video replies from players; highlight-reel composition from sent clips
8. Parent read-only visibility; org outbound webhooks
9. Scouting ↔ Film Room shared-session deep links

## Cut now (explicit, with the reason)

| Cut | Reason |
|---|---|
| Autonomous pattern detection as a product surface | The old center of the product; demos well, coaches don't trust or use it |
| Evidence-free AI summaries | Violates the evidence-or-silence contract; nothing renders without timestamps |
| Multi-coach collaboration (shared editing, comments on clips, staff review flows) | Single-coach loop must prove value first; staff roles read-only via existing permissions |
| Social features (reactions, player-to-player visibility, leaderboards) | Accountability tool, not a feed; also a minor-safety surface we don't need yet |
| Advanced scouting automation | Scouting stays as-is; shared clips later |
| Highlight auto-reels, exports, embeds | Distribution features before the teaching loop works is backwards |
| Live/in-game tagging | Different product motion entirely |

## Product risks

1. **Coaches don't clip.** The whole model assumes coaches will spend 20–30
   min post-game cutting clips. *Mitigation:* the 30-second golden path is
   the product bet — instrument `clip_time_to_create_ms` from day one; if
   real coaches average >60s, fix the workspace before adding anything.
2. **Players ignore assignments.** Accountability UI doesn't create
   motivation. *Mitigation:* coach-visible watch data + practice-adjacent
   due defaults; watch whether "watched %" beats 60% in week 2, and make
   the nudge loop effortless.
3. **The demo-to-real transition.** Existing users saw "AI insights"; the
   new pitch is quieter. *Mitigation:* the copy reframe ships with visible
   coach-control wins (locks, audit trail, accountability) — position as
   "your film, your words, delivered."
4. **Response fatigue.** Required reflections on every clip train players to
   type "ok". *Mitigation:* response-required is per-assignment and the
   default follows coach behavior; low-effort detection stays post-MVP but
   the 120-char soft cap signals "short is fine."
5. **Two queues confusion** (Assignments vs old Queue). *Mitigation:* hard
   cutover, old routes redirect, no legacy surface survives.

## Technical risks

1. **Mux segment fidelity** — clip-accurate playback (±0.5s) and
   segment-clamped scrubbing on iOS WKWebView; haptic scrub + autoplay
   policies. *Spike first: 2-day playback prototype on the iOS shell before
   committing the viewer design.*
2. **Watch-tracking integrity** — unique-seconds accumulation across seeks,
   loops, offline, background/foreground on mobile. Unit-test the
   accumulator hard; accept eventual consistency server-side.
3. **Migration runner + new schema on prod** — the prod DB was only just
   migrated (0000–0017); the Film Room migration (12+ objects) is the
   biggest single migration yet. Rehearse against a Neon branch copy first.
4. **Clip lock enforcement across layers** — UI, API, and the DB trigger
   must agree; a mismatch surfaces as coach data loss. Contract tests on
   the 409 path.
5. **Notification volume** — assignment fan-out × reminders through the
   quiet-hours stack; a coach sending 30 clips post-game must produce
   bundled, capped sends, not 30 pushes. Load-test the fan-out with the
   bundling rules before launch.
6. **Legacy data** — existing film_sessions/annotations must map into the
   new films/clips views without a rewrite; plan a compatibility view or a
   one-time backfill, decide before the schema freezes.

## Success metrics — first 30 days

Activation (the loop exists):
- **≥60% of active coach orgs create ≥1 clip** in their first session with
  film uploaded
- **≥40% of clips created get sent** as assignments (clips that never send
  = workspace friction or wrong moments)

Speed (the bet):
- **Median `clip_time_to_create_ms` ≤ 45s** (p75 ≤ 90s) — target trend
  toward 30s
- **Median player `review_duration_ms` ≤ 60s**

Accountability (the value):
- **≥70% of assignments watched within 72h** of send
- **≥50% response rate** where a response was required
- **≥80% of responded assignments closed by a coach within 7d** (coaches
  actually work the inbox — the loop closes on both ends)

Retention signal:
- **≥3 sessions with clips per active org in the 30 days** (repeat behavior,
  not one experiment)
- **≥1 IDP escalation in ≥25% of active orgs** (film feeding development —
  the strategic hook)

AI (only if optional items ship):
- **Suggestion accept rate ≥30%** (below that, suggestions are noise —
  tighten thresholds before adding capabilities)

Guardrail metrics (watch, don't target): player notification
opt-outs/mutes · "review with coach" flag rate (very high = notes aren't
landing) · % of clips edited after an AI draft accept (very low = coaches
rubber-stamping AI text to players).
```
