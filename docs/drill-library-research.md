# HoopsIQ Drill Library Research Notes

Date: 2026-05-05

This drill library update follows youth-development guidance and representative-learning principles so coaches get game-relevant drills instead of random reps.

## Research Inputs

1. USA Basketball Youth Guidelines  
   <https://www.usab.com/youthguidelines>
2. USA Basketball skills & coaching resources (youth development and skill progressions)  
   <https://www.usab.com/youth/development/youth-development-skill-levels.aspx>
3. FIBA mini-basketball development principles and age-appropriate adaptations  
   <https://assets.fiba.basketball/image/upload/documents-corporate-wabc-coaching-manual-mini-basketball-eng.pdf>
4. Constraints-led / representative learning references (used as design lens for decision drills)  
   <https://www.breakthroughbasketball.com/coaching/constraint-led-approach>

## Design Principles Applied

- Age appropriate progression: simple constraints for U10/U12 before complex reads.
- Representative learning: add decision pressure with defenders, dribble caps, and paint-touch constraints.
- Small-sided game bias: 1v1, 2v2, and 3v3 formats to increase touches and reads.
- Measurable outcomes: every drill has clear reps/time and trackable success metrics.
- Workload realism: keep warm-up and low-intensity skill blocks available for heavy-load days.

## What Changed

- Added a new category: `Decision Games (SSG)`.
- Added new drills focused on game transfer:
  - 1v1 Advantage — 3 Dribble Cap
  - 2v2 Paint-Touch Game
  - 3v3 No-Corner Constraint
  - 3v2 Continuous Read
  - Pivot + Pass Tag (U10)
  - 1v1 Closeout Read (U10-U12)
- Added a dedicated Coach UI route `/app/coach/drills` for browsing all drills and creating/editing/deleting custom drills.

## Implementation Notes

- Library drills remain in `client/src/lib/mock/practice.ts`.
- Custom drills are persisted in `localStorage` via Zustand (`useCustomDrillsStore`).
- Practice Plan Builder already supports adding custom drills directly; the new Drill Library page makes authoring discoverable.
