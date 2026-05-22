# Playbook Studio v3 PRD — "Beat HoopsGeek"

## Mission
Make HoopsIQ Playbook Studio the unambiguous best-in-class basketball play diagramming + animation product for coaches at the youth, HS, college, and pro levels. Significantly better than HoopsGeek (https://hoopsgeek.com), FastDraw, FastModel, and CoachTube Whiteboard.

## Verified state today (v2.x, post PR #6)
WORKS: v2 schema/store/persistence; toolbar with V/O/X/B/K/P/D/C/S/H shortcuts; Pass arrow (player-to-player); Cut player-to-player; Phases (Entry/Read 1/...); Phase timeline strip with reorder; Save version; Play metadata panel (name, type, half/full court, version, history); Selected-action panel + delete; Tips panel.

FAIL or MISSING:
1. Cut/Dribble/Pass cannot terminate at a *spot* on the court — only player-to-player. Coaches need spot-targeting (corner, elbow, slot, block, wing, top of key).
2. Free-form polyline path drawing for Cut and Dribble is missing — coaches need to trace curves, not just straight segments.
3. Inter-phase animation: phases switch instantly; HoopsGeek interpolates motion between phases over a configurable duration.
4. No voiceover / audio annotation per phase or per action.
5. No video/GIF/MP4 export of animated play.
6. No drill / play library categorization (BLOB, SLOB, ATO, half-court sets, motion, transition).
7. No defensive coverage overlays (man/zone, help-side, ICE, switch, hedge, drop).
8. No player roles (PG/SG/SF/PF/C with role-based defaults and skill-tag labels).
9. No counter actions (if-this-then-that branching).
10. No print-ready PDF playbook export.
11. No team sharing / read-only links / commenting.
12. No mobile/touch first-class support — only desktop.
13. No formation library beyond "From formation..." placeholder.
14. No film integration — link plays to film clips in Film Room.
15. No AI play assistant ("design a SLOB vs 2-3 zone for a left-handed shooter").

## v3 Roadmap (PRs #7 → #20)

### PR #7 — Free-form polyline path drawing (THIS PR)
Cut/Dribble support pointer-down on token → pointer-move traces sampled polyline → pointer-up commits ADD_CUT/ADD_DRIBBLE with the captured points (RDP eps=0.25ft, max 24 points). Tip: "Hold to draw a curved path." Acceptance: drag from player 3 in a curve, release, see the curve persist.

### PR #8 — Spot targets (drop on empty court ends arrow at point)
Pass/Cut/Dribble can terminate at an arbitrary court coordinate, not only at a token. Snap to named landmarks (corner, wing, slot, elbow, block, top, FT, rim) within 1.5ft. Renders "to corner" in selected-action panel.

### PR #9 — Inter-phase animation playback
Play button tweens token positions between phase N and N+1 with cubic-bezier ease, default 1.2s/phase, configurable per-phase. Action arrows fade in during their phase, fade out at next.

### PR #10 — Counter actions / branching
Each phase can have multiple branches ("vs hard hedge", "vs switch", "vs ICE"). Tree view in right panel.

### PR #11 — Defensive coverage overlays
Zone/man toggle. Help-side shading. ICE arrows for sideline pick. Drop coverage rectangle.

### PR #12 — Player roles & skill tags
5-on-5 starting alignment uses PG/SG/SF/PF/C. Per-token tag chips: shooter, slasher, lob threat, screener, etc. Drives AI assistant context.

### PR #13 — Formation library + AI "design a play"
Preset formations (5-out, Horns, Box, 1-4 high, Stack, BLOB Box, SLOB Stack). AI prompt panel: "design a [SLOB|BLOB|ATO|half-court] vs [man|2-3|3-2|1-3-1|switching] for [scenario]".

### PR #14 — Voice-over per phase (browser MediaRecorder → R2)
Record, scrub, attach. Plays during animation.

### PR #15 — Video / GIF export
Server-side rendered MP4 via ffmpeg-wasm or Remotion. 1080p. Download or share link.

### PR #16 — Print-ready PDF playbook
React-PDF; per-play 1-pager with phase frames + coaching notes. Multi-play book PDF.

### PR #17 — Read-only share links + comments
UUID slug → read-only animated viewer; threaded comments per phase.

### PR #18 — Mobile / touch first-class
Responsive canvas; touch gestures (pinch zoom, two-finger pan, long-press select); iPad pencil support.

### PR #19 — Drill library + categorization
Tags (BLOB, SLOB, ATO, motion, transition, OOB, EOG); search; filter; clone; team folder.

### PR #20 — Film Room integration
Link play → film clip timestamp; "watch the real run" button.

## Acceptance for "better than HoopsGeek"
A varsity HS HC, given 30 min onboarding, can:
1. Diagram a 4-phase BLOB vs 2-3 zone with curved cuts and spot targets.
2. Add voice-over per phase.
3. Animate it end-to-end smoothly.
4. Share a read-only link to assistant coaches; receive comments.
5. Export a 1-pager PDF for the team binder.
6. Re-open it on iPad on the bus and edit live.

If any of those fails, v3 is not done.

---

## Appendix A — PR #8 Implementation Prompt (paste into Claude Code locally)

You are working in hoopsiq on branch main. Implement PR #8: free-form polyline path drawing for Cut and Dribble tools.

Files to modify:
- client/src/components/playbook/PlayCanvas.tsx (currently 465 lines, mode-based handlers)
- client/src/lib/playbookStore.ts (the v2 store at /workspaces/hoopsiq/client/src/lib/playbookStore.ts)
- client/src/components/playbook/usePlayback.ts
- client/src/lib/mock/playbookSchema.ts (extend Cut and Dribble action zod schemas with optional path: { x: number; y: number }[])

Behavior:
1. When tool is CUT or DRIBBLE and the user pointer-downs on a token, do NOT enter DRAW_CUT/DRAW_DRIBBLE click-to-click mode. Instead enter TRACE mode.
2. On pointermove while in TRACE mode, sample points at <=16ms intervals into a buffer, in court coordinates (use the existing screenToCourt helper).
3. On pointerup: if the buffer has < 3 points OR the total path length < 1ft, fall back to legacy click-to-click mode (treat as a click). Otherwise:
   a. Run Ramer-Douglas-Peucker simplification with epsilon=0.25ft to reduce to <=24 points.
   b. Commit ADD_CUT or ADD_DRIBBLE with both fromTokenId and the simplified path[].
   c. End point of path snaps to nearest token within 1.5ft if any (player-to-player still works); otherwise terminates at the freeform point.
4. SVG renderer: if action.path is present, render it as a smoothed Catmull-Rom or quadratic-bezier polyline with the same stroke as the existing CUT/DRIBBLE styles. Arrowhead at last point. Dashed for cut (#cbd5e1), solid for dribble (#fb923c).
5. Tip panel update: "Hold Cut (C) or Dribble (D) and drag from a player to trace a curved path. Release on a player or a court spot."
6. Acceptance: drag from player 3 in an S-curve through the lane and release in the corner; the curve persists, animates with the play, and serializes to IndexedDB.
7. Tests: at least 6 new unit tests in client/src/components/playbook/__tests__/canvas.test.tsx covering RDP simplification, fallback to click-mode on tap, snap-on-release, and roundtrip serialization.
8. Run pnpm tsc --noEmit && pnpm test && pnpm build. All must pass.
9. Commit: feat(playbook): free-form polyline path drawing for Cut/Dribble (PR #8). PR title same.

Do NOT downscope. Do NOT ship a click-only fallback as the primary path. The user explicitly rejected click-to-click as the only mode.
