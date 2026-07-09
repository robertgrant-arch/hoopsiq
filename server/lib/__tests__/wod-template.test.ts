import { describe, it, expect } from "vitest";
import { generateWodTemplate } from "../wod";

describe("generateWodTemplate (deterministic backstop)", () => {
  it("always starts with a warmup and ends with recovery", () => {
    const w = generateWodTemplate({
      playerName: "P", focusAreas: ["Shooting"], targetMinutes: 45, intensity: "medium",
    });
    expect(w.blocks[0].block_type).toBe("warmup");
    expect(w.blocks[w.blocks.length - 1].block_type).toBe("recovery");
    expect(w.generatedBy).toBe("template");
  });

  it("block minutes sum close to the target duration", () => {
    const target = 60;
    const w = generateWodTemplate({
      playerName: "P", focusAreas: ["Finishing", "Closeout footwork"], targetMinutes: target, intensity: "medium",
    });
    const sum = w.blocks.reduce((n, b) => n + b.minutes, 0);
    expect(Math.abs(sum - target)).toBeLessThanOrEqual(6);
  });

  it("high intensity adds a conditioning block", () => {
    const w = generateWodTemplate({
      playerName: "P", focusAreas: ["Shooting"], targetMinutes: 60, intensity: "high",
    });
    expect(w.blocks.some((b) => b.block_type === "conditioning")).toBe(true);
  });

  it("low recovery skips conditioning even at high intensity", () => {
    const w = generateWodTemplate({
      playerName: "P", focusAreas: ["Shooting"], targetMinutes: 60, intensity: "high",
      wearableSnapshot: { recoveryScore: 30 },
    });
    expect(w.blocks.some((b) => b.block_type === "conditioning")).toBe(false);
  });

  it("produces a block per focus area with coaching points and metrics", () => {
    const w = generateWodTemplate({
      playerName: "P", focusAreas: ["Ballhandling", "Passing"], targetMinutes: 45, intensity: "low",
    });
    const skillBlocks = w.blocks.filter((b) => !["warmup", "recovery", "conditioning"].includes(b.block_type));
    expect(skillBlocks.length).toBeGreaterThanOrEqual(2);
    for (const b of w.blocks) {
      expect(b.coaching_points.length).toBeGreaterThan(0);
      expect(b.success_metrics.length).toBeGreaterThan(0);
      expect(b.minutes).toBeGreaterThan(0);
    }
  });

  it("clamps absurd durations into the 15–120 range", () => {
    const tiny = generateWodTemplate({ playerName: "P", focusAreas: ["Shooting"], targetMinutes: 3, intensity: "low" });
    const huge = generateWodTemplate({ playerName: "P", focusAreas: ["Shooting"], targetMinutes: 999, intensity: "low" });
    const sum = (w: ReturnType<typeof generateWodTemplate>) => w.blocks.reduce((n, b) => n + b.minutes, 0);
    expect(sum(tiny)).toBeGreaterThanOrEqual(15);
    expect(sum(huge)).toBeLessThanOrEqual(126);
  });
});
