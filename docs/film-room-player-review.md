# Player Clip Review — Spec

Routes: `/app/player/film` (inbox) · `/app/player/film/:assignmentId` (viewer).
Mobile-first; runs in the iOS shell (safe-area aware) and mobile web.
Companion to the Film Room v2 spec set.

Design stance: one clip = one screen = under 60 seconds. The player sees the
coach's teaching point, the film, and one way to respond. No analytics, no
charts, no AI, no feed. Calm surface, zero clutter.

---

## 1. Player UX flow

```
Push notification ──┐
Dashboard badge ────┤
Bottom-nav badge ───┴──▶ FILM INBOX ──tap──▶ CLIP VIEWER
                                               │ autoplays the exact segment
                                               │ coach note pinned below
                                               ▼
                                        watch to ≥90%  ──▶ status: watched
                                               │
                                               ▼
                                        RESPONSE CARD slides up
                                        (only what the coach asked for)
                                               │
                                       answer + optional flags
                                               ▼
                                        [Done] ──▶ ✓ micro-confirmation
                                               │
                                     next assigned clip? ──yes──▶ auto-advance
                                               │ no                (skippable)
                                               ▼
                                        back to inbox (badge decremented)
```

Target: notification-tap → Done in under 60s for a 15s clip. Nothing on the
path requires reading instructions.

## 2. Screen specs

### S1 — Film Inbox (`/app/player/film`)

- Header: "Film" + unwatched count. Nothing else.
- Card list, needs-action first (assigned/opened, earliest due first), then
  watched-awaiting-response, then completed (collapsed under "Done ✓ (12)").
- Card (single line-and-a-half, 64px):
  - clip title (coach's words, e.g. "Late closeout vs Oak Hill")
  - coach avatar + first name · duration ("0:14") · due chip
    ("due Thu" / red "due today" / red bold "overdue")
  - unwatched dot on the left edge
- No filters, no search below 20 items (then a simple "to do / done" toggle).
- Empty state: "No film to review. 🏀" — nothing else.

### S2 — Clip Viewer (`/app/player/film/:assignmentId`)

Vertical layout, full-bleed, one scroll:

```
┌──────────────────────────────┐
│ ← back        due Thu · 0:14 │  minimal chrome
│                              │
│        VIDEO (16:9)          │  autoplays clip segment, loops
│   telestration overlay       │  scrub bar spans ONLY the clip
│   ▶ replay │ 🔊 │ ⏪ 0.5×     │  big targets (≥44pt)
│                              │
│ ┌ TEACHING POINT ──────────┐ │
│ │ Coach Grant              │ │  the coach note, verbatim,
│ │ "Watch your feet on the  │ │  16px readable text —
│ │  closeout — you're flat. │ │  the visual anchor of the screen
│ │  Short choppy steps."    │ │
│ └──────────────────────────┘ │
│                              │
│ [ RESPONSE CARD ]            │  appears after watch threshold;
│                              │  before that: "Watch the clip
│                              │  to respond" (grayed)
└──────────────────────────────┘
```

- Video: plays **only the clip segment** (in→out); scrubbing is clamped to
  the segment; loop on by default; 0.5× replay button for detail study;
  telestration renders at its authored timestamps.
- Teaching point: always visible without scrolling on ≥5.4" screens
  (video letterboxes down before the note ever hides).
- Response card (contents = exactly what the coach configured, nothing more):
  - **Text reflection** (when required): one prompt line
    ("What do you see?" or the coach's custom prompt), auto-growing input,
    120-char soft cap with counter — reflections, not essays.
  - **Understanding check** (when configured): one question, 2–4 tappable
    options, instant single-select. Wrong answers are *not* graded on-device;
    the coach sees the choice.
  - **Confidence tap** (when enabled, org-level): "How confident are you
    fixing this?" — 3 emoji (😕 😐 💪), single tap, optional.
  - **"Review with coach" flag:** small link-style toggle under the card —
    "🙋 I'd like to go over this with coach." Never required, always
    available, sets a visible flag on the coach's queue row.
  - **[Done]** primary button, full-width, disabled until required elements
    are complete; label adapts: "Done" / "Send & Done."
- After Done: 400ms check animation → auto-advance card "Next: Spacing @4:12
  (0:09)" with a 3s countdown + "Not now." No streak mechanics, no confetti
  beyond the check.

### S3 — Completed view (revisit)

Same viewer, response card replaced by a quiet summary: your reflection, your
answer, coach's reply if any (with an "unread reply" badge driving re-entry
from the inbox). Replay always available — completed clips remain a study
resource.

## 3. Status logic

```
assigned ──player opens viewer──▶ opened
opened ──cumulative unique playback ≥90% of segment──▶ watched
        (or coach override "watched together at practice")
watched ──response requirements met + Done──▶ responded
        (no response required: Done alone ──▶ responded)
responded ──coach closes / auto-close──▶ completed
overdue = overlay on assigned/opened/watched when due passes (never on
          responded+ — once the player acted, they're never "late" in the UI)
```

- Watch tracking: unique-seconds watched, client-accumulated, synced on
  progress events; ≥90% of segment duration. Rewatching doesn't double-count.
- Offline: progress + response cached locally, synced on reconnect; the
  player sees "saved — will send when online," and Done works offline.
- The player **never sees** "escalated_to_idp," watch percentages, or any
  pipeline machinery. Player-visible states are exactly: to do (with due),
  done, and coach-replied.

## 4. Notifications / reminders model

All delivery passes through the existing comms safety stack (quiet hours,
minor-safety policies). Player notifications are calm by design:

| Trigger | Timing | Copy shape |
|---|---|---|
| Assignment sent | immediate (quiet-hours deferred) | "Coach Grant sent you a clip: Late closeout (0:14)" |
| Due soon | T-24h, only if not yet watched | "1 clip due tomorrow (0:14)" |
| Due today | morning of due date, if unwatched | "1 clip due today" |
| Coach nudge | manual, rate-limited 1/12h | "Reminder from Coach Grant: Late closeout" |
| Coach replied | immediate | "Coach Grant replied to your reflection" |

Rules: reminders bundle ("3 clips due tomorrow" — one notification, never
three) · automatic reminders stop once `watched` (no nagging players who
watched but haven't typed yet; that's the coach's judgment via manual nudge)
· hard cap: ≤1 automatic film notification per day per player · badge counts
(app icon, bottom nav) always reflect needs-action count.

## 5. Mobile interaction details

- **Targets:** every interactive element ≥44pt; Done is a full-width bottom
  button inside the thumb zone; safe-area insets respected (home indicator,
  notch) in the iOS shell.
- **Gestures:** swipe down on video = back to inbox (with response-draft
  guard) · swipe left/right in completed view = prev/next clip · double-tap
  video = replay segment · long-press video = 0.25× slow-mo while held
  (film-study affordance).
- **Playback:** muted-autoplay first frame with instant tap-to-sound (iOS
  autoplay policy), loop on; scrub bar is segment-clamped and haptic-ticks at
  in/out (Capacitor Haptics, already integrated).
- **Input:** keyboard pushes the card up, video stays partially visible
  (players type about what they're seeing); return key = "Done" when text is
  the only requirement.
- **Performance:** inbox → first frame ≤2s on LTE (Mux clip-range streaming;
  the app never downloads the full source film); the next clip in the inbox
  is pre-fetched while the current one plays.
- **Interruptions:** app backgrounded mid-watch → resumes at the same
  position with progress intact; notification deep links land directly in
  the viewer, not the inbox.

## 6. Acceptance criteria

**Speed & simplicity**
1. Notification-tap → clip playing ≤3s on LTE; full review (15s clip, text
   reflection) completable ≤60s.
2. The viewer contains at most: video, teaching point, response card, one
   flag link, Done. Nothing else renders on the player surface — no charts,
   percentages, streaks, or AI content.
3. Teaching point is visible without scrolling on a 375×812 viewport.

**Playback fidelity**
4. Playback is clamped to the assigned segment ±0.5s; scrubbing cannot leave
   the segment; telestration renders at authored timestamps on all supported
   devices.
5. Loop, 0.5× replay, and long-press slow-mo function on iOS shell and
   mobile Safari/Chrome.

**Status integrity**
6. `opened` fires on first viewer load; `watched` fires only at ≥90% unique
   seconds (rewatches don't double-count); both survive offline→reconnect.
7. Done is disabled until required response elements are complete, and the
   required set exactly matches the coach's assignment configuration.
8. A response submitted offline syncs on reconnect without user action and
   without duplication.
9. Players in responded/completed are never shown as overdue anywhere.

**Response quality**
10. Text reflection enforces the 120-char soft cap with counter (hard cap
    500); understanding-check selections and confidence taps reach the
    coach's queue row within 5s of sync.
11. "Review with coach" sets a visible flag on the coach's Assignment Queue
    row and is available on every clip regardless of response configuration.

**Notifications**
12. Same-day reminders bundle into one notification; no player receives more
    than one automatic film notification per day; quiet-hours and
    minor-safety policies apply to every send; automatic reminders cease at
    `watched`.

**Completion loop**
13. Done triggers the confirmation + auto-advance offer; declining returns to
    the inbox with the badge already decremented.
14. A coach reply flips the inbox card to "unread reply" state and deep-links
    into the completed view with the thread visible.
```
