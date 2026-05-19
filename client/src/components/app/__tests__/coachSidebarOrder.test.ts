/**
 * Coach sidebar section order — focused regression test.
 *
 * Scope: verifies COACH_SIDEBAR_SECTIONS order only.
 * Does NOT test rendering, routing, permissions, or badge counts.
 *
 * If this test fails, the section order in AppShell.tsx has drifted
 * from the spec. Fix it there — this file must not be changed to make
 * the test pass.
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Import the config under test via the module's own type so the test stays
// decoupled from component internals. We re-export the array from the
// module-level const — Vitest imports the real file (no mocking needed here).
// ---------------------------------------------------------------------------

// Inline the expected order as the canonical spec for this test.
const EXPECTED_SECTION_ORDER = [
  "DAILY",
  "TEAM",
  "BUILD",
  "DEVELOP",
  "FILM",
  "ANALYTICS",
  "RECRUITING",
  "MORE",
  "EDUCATION",
  "PROFILE",
] as const;

// ---------------------------------------------------------------------------
// Parse the actual order directly from the source file so the test is
// resilient to module bundling quirks and avoids rendering the full component.
// ---------------------------------------------------------------------------

import { readFileSync } from "fs";
import { resolve }      from "path";

function extractSectionTitles(): string[] {
  const filePath = resolve(
    __dirname,
    "../../..",           // client/src
    "components/app/AppShell.tsx",
  );
  const src = readFileSync(filePath, "utf-8");

  // Locate the COACH_SIDEBAR_SECTIONS array
  const arrayStart = src.indexOf("const COACH_SIDEBAR_SECTIONS: SidebarSection[] = [");
  const arrayEnd   = src.indexOf("const COACH_OVERFLOW_ITEMS", arrayStart);

  if (arrayStart === -1 || arrayEnd === -1) {
    throw new Error(
      "Could not locate COACH_SIDEBAR_SECTIONS in AppShell.tsx. " +
      "Has the constant been renamed or moved?",
    );
  }

  const arrayBlock = src.slice(arrayStart, arrayEnd);

  // Extract title: "SECTION_NAME" occurrences — order-preserving
  const matches = [...arrayBlock.matchAll(/title:\s*"([^"]+)"/g)];
  return matches.map((m) => m[1]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("COACH_SIDEBAR_SECTIONS — section order", () => {
  const actualOrder = extractSectionTitles();

  it("contains exactly the expected sections (no additions or removals)", () => {
    expect(actualOrder).toHaveLength(EXPECTED_SECTION_ORDER.length);
    expect(new Set(actualOrder)).toEqual(new Set(EXPECTED_SECTION_ORDER));
  });

  it("sections appear in the correct top-to-bottom order", () => {
    expect(actualOrder).toEqual([...EXPECTED_SECTION_ORDER]);
  });

  // Spot-check each position explicitly so failures name the offending section
  EXPECTED_SECTION_ORDER.forEach((section, index) => {
    it(`position ${index + 1} is ${section}`, () => {
      expect(actualOrder[index]).toBe(section);
    });
  });

  it("BUILD appears immediately after TEAM", () => {
    const teamIdx  = actualOrder.indexOf("TEAM");
    const buildIdx = actualOrder.indexOf("BUILD");
    expect(buildIdx).toBe(teamIdx + 1);
  });

  it("DEVELOP appears immediately after BUILD", () => {
    const buildIdx  = actualOrder.indexOf("BUILD");
    const developIdx = actualOrder.indexOf("DEVELOP");
    expect(developIdx).toBe(buildIdx + 1);
  });

  it("FILM appears immediately after DEVELOP", () => {
    const developIdx = actualOrder.indexOf("DEVELOP");
    const filmIdx    = actualOrder.indexOf("FILM");
    expect(filmIdx).toBe(developIdx + 1);
  });

  it("ANALYTICS appears immediately after FILM", () => {
    const filmIdx      = actualOrder.indexOf("FILM");
    const analyticsIdx = actualOrder.indexOf("ANALYTICS");
    expect(analyticsIdx).toBe(filmIdx + 1);
  });

  it("RECRUITING appears immediately after ANALYTICS", () => {
    const analyticsIdx  = actualOrder.indexOf("ANALYTICS");
    const recruitingIdx = actualOrder.indexOf("RECRUITING");
    expect(recruitingIdx).toBe(analyticsIdx + 1);
  });

  it("MORE appears immediately after RECRUITING", () => {
    const recruitingIdx = actualOrder.indexOf("RECRUITING");
    const moreIdx       = actualOrder.indexOf("MORE");
    expect(moreIdx).toBe(recruitingIdx + 1);
  });

  it("EDUCATION appears immediately after MORE", () => {
    const moreIdx      = actualOrder.indexOf("MORE");
    const educationIdx = actualOrder.indexOf("EDUCATION");
    expect(educationIdx).toBe(moreIdx + 1);
  });

  it("PROFILE is the last section", () => {
    expect(actualOrder[actualOrder.length - 1]).toBe("PROFILE");
  });

  it("DAILY is the first section", () => {
    expect(actualOrder[0]).toBe("DAILY");
  });

  it("TEAM is the second section", () => {
    expect(actualOrder[1]).toBe("TEAM");
  });
});
