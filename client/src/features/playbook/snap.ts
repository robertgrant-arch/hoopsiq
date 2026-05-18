/**
 * Snap-to-court for the V2 Playbook canvas.
 *
 * Coordinate system: 800 × 600 stage pixels matching the HalfCourt SVG.
 *   x=0..800  sideline to sideline (left → right)
 *   y=0       baseline (under the rim)
 *   y=600     half-court line
 *
 * The KEY_SPOTS list captures the basketball-meaningful locations a coach
 * usually wants to drop a token or end a path on: paint corners, elbows,
 * top of key, mid-range positions, wings, deep corners, half-court spots.
 * `snapPoint` returns the closest key spot within `radius` of the input,
 * else returns the input unchanged so free-form positioning still works.
 */
/** Stage-pixel coordinates (0..800 × 0..600). */
export type Vec2Px = { x: number; y: number };

export type CourtSpot = {
  x: number;
  y: number;
  /** Short label for tooltips / debugging. */
  label: string;
};

export const KEY_SPOTS: ReadonlyArray<CourtSpot> = [
  // Paint / restricted area
  { x: 400, y: 56, label: "Rim" },
  { x: 310, y: 90, label: "Block left" },
  { x: 490, y: 90, label: "Block right" },
  { x: 310, y: 194, label: "Elbow left" },
  { x: 490, y: 194, label: "Elbow right" },
  { x: 400, y: 194, label: "Free-throw line" },
  // Mid-range and wing
  { x: 400, y: 250, label: "Top of key (mid)" },
  { x: 200, y: 200, label: "Wing left mid" },
  { x: 600, y: 200, label: "Wing right mid" },
  // Three-point arc spots
  { x: 400, y: 480, label: "Top of key (3pt)" },
  { x: 130, y: 250, label: "Wing left" },
  { x: 670, y: 250, label: "Wing right" },
  { x: 70, y: 80, label: "Corner left" },
  { x: 730, y: 80, label: "Corner right" },
  // Half-court
  { x: 400, y: 596, label: "Half-court center" },
  { x: 200, y: 580, label: "Half-court left" },
  { x: 600, y: 580, label: "Half-court right" },
  // Backcourt-sideline-inbound markers
  { x: 70, y: 4, label: "Baseline left corner" },
  { x: 730, y: 4, label: "Baseline right corner" },
];

/** Default snap radius in stage pixels (~24px ≈ 1 token diameter). */
export const DEFAULT_SNAP_RADIUS = 24;

export function snapPoint(
  p: Vec2Px,
  others: ReadonlyArray<Vec2Px> = [],
  radius = DEFAULT_SNAP_RADIUS,
): Vec2Px {
  let best: Vec2Px = p;
  let bestD = radius;
  for (const c of KEY_SPOTS) {
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    if (d < bestD) {
      best = { x: c.x, y: c.y };
      bestD = d;
    }
  }
  for (const c of others) {
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    if (d < bestD) {
      best = { x: c.x, y: c.y };
      bestD = d;
    }
  }
  return best;
}
