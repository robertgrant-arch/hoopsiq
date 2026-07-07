import { describe, expect, it } from "vitest";
import {
  computePct,
  createWatchAccumulator,
  totalSecondsFor,
} from "../useWatchAccumulator";

describe("totalSecondsFor", () => {
  it("counts a trailing partial second as a full bucket", () => {
    expect(totalSecondsFor(10_000)).toBe(10);
    expect(totalSecondsFor(14_500)).toBe(15);
    expect(totalSecondsFor(1)).toBe(1);
  });

  it("never returns less than one bucket", () => {
    expect(totalSecondsFor(0)).toBe(1);
  });
});

describe("computePct", () => {
  it("computes the fraction as a percentage", () => {
    expect(computePct(2, 10)).toBe(20);
    expect(computePct(15, 15)).toBe(100);
  });

  it("clamps to 0–100", () => {
    expect(computePct(20, 10)).toBe(100);
    expect(computePct(-1, 10)).toBe(0);
    expect(computePct(5, 0)).toBe(0);
  });
});

describe("createWatchAccumulator", () => {
  it("does not double-count rewatched seconds", () => {
    const acc = createWatchAccumulator(10_000); // 10 buckets
    acc.markSecond(0);
    acc.markSecond(0);
    acc.markSecond(0.4); // same bucket as 0
    acc.markSecond(1);
    expect(acc.uniqueCount).toBe(2);
    expect(acc.pct).toBe(20);
  });

  it("pct math: full unique coverage reaches exactly 100", () => {
    const acc = createWatchAccumulator(14_500); // 15 buckets (14.5s clip)
    for (let s = 0; s < 15; s++) acc.markSecond(s);
    expect(acc.pct).toBe(100);
  });

  it("ignores out-of-range seconds so pct never exceeds 100", () => {
    const acc = createWatchAccumulator(3_000); // 3 buckets
    acc.markSecond(-1);
    acc.markSecond(0);
    acc.markSecond(1);
    acc.markSecond(2);
    acc.markSecond(3); // beyond the segment
    acc.markSecond(99);
    expect(acc.uniqueCount).toBe(3);
    expect(acc.pct).toBe(100);
  });

  it("crosses the 90% threshold with correct rounding on a 14.5s clip", () => {
    const acc = createWatchAccumulator(14_500); // 15 buckets
    for (let s = 0; s < 13; s++) acc.markSecond(s);
    expect(acc.pct).toBeCloseTo((13 / 15) * 100, 5); // ~86.7 — not yet watched
    expect(acc.pct).toBeLessThan(90);

    acc.markSecond(13);
    expect(acc.pct).toBeCloseTo((14 / 15) * 100, 5); // ~93.3 — watched
    expect(acc.pct).toBeGreaterThanOrEqual(90);
  });

  it("markSecond returns the updated pct", () => {
    const acc = createWatchAccumulator(2_000);
    expect(acc.markSecond(0)).toBe(50);
    expect(acc.markSecond(1)).toBe(100);
  });

  it("reset clears all progress", () => {
    const acc = createWatchAccumulator(5_000);
    acc.markSecond(0);
    acc.markSecond(1);
    acc.reset();
    expect(acc.uniqueCount).toBe(0);
    expect(acc.pct).toBe(0);
  });
});
