/**
 * Seed plays for Playbook Studio v3 (parallel route).
 *
 * Authored directly in the action-based model from `src/playbook/types.ts`.
 * Coordinates are court-normalized (0..1, origin = baseline-left).
 */
import type { Play } from "../../../../src/playbook/types";

const id = (n: number) => `seed_v3_${n}`;

const untitled: Play = {
  schema: "v2",
  id: id(1),
  name: "Untitled Play",
  version: "v0.1",
  formation: "5-out",
  phases: [
    {
      id: "ph_01",
      label: "Phase 01 — Entry",
      startPositions: {
        "1": { x: 0.50, y: 0.95 },
        "2": { x: 0.05, y: 0.65 },
        "3": { x: 0.95, y: 0.65 },
        "4": { x: 0.31, y: 0.80 },
        "5": { x: 0.69, y: 0.80 },
      },
      ballHolder: "1",
      actions: [],
    },
    {
      id: "ph_02",
      label: "Phase 02 — Cut",
      // Player 4 cuts from elbow to opposite corner; player 1 still has the ball.
      actions: [
        {
          kind: "cut",
          player: "4",
          path: [
            { x: 0.31, y: 0.80 },
            { x: 0.50, y: 0.50 },
            { x: 0.95, y: 0.65 },
          ],
          style: "curve",
        },
      ],
    },
    {
      id: "ph_03",
      label: "Phase 03 — Pass + Hold",
      // Pass to player 4 in the corner; everyone else holds.
      actions: [{ kind: "pass", from: "1", to: "4" }],
    },
  ],
};

const horns: Play = {
  schema: "v2",
  id: id(2),
  name: "Horns Flex (v3 seed)",
  version: "v0.1",
  formation: "horns",
  phases: [
    {
      id: "ph_h01",
      label: "Phase 01 — Horns alignment",
      startPositions: {
        "1": { x: 0.50, y: 0.85 },
        "2": { x: 0.15, y: 0.68 },
        "3": { x: 0.85, y: 0.68 },
        "4": { x: 0.40, y: 0.40 },
        "5": { x: 0.60, y: 0.40 },
      },
      ballHolder: "1",
      actions: [],
    },
    {
      id: "ph_h02",
      label: "Phase 02 — Pass to 4 / 1 cuts off 5",
      actions: [
        { kind: "pass", from: "1", to: "4" },
        {
          kind: "cut",
          player: "1",
          path: [
            { x: 0.50, y: 0.85 },
            { x: 0.55, y: 0.55 },
            { x: 0.72, y: 0.45 },
          ],
          style: "curve",
        },
      ],
    },
  ],
};

export const v3Seeds: Play[] = [untitled, horns];

export function findSeedById(id: string): Play | undefined {
  return v3Seeds.find((p) => p.id === id);
}
