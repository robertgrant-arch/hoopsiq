/**
 * Coach sidebar section order — focused regression test.
 *
 * Scope: verifies COACH_SIDEBAR_SECTIONS order only.
 * Does NOT test rendering, routing, permissions, or badge counts.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve }      from "path";

const EXPECTED_SECTION_ORDER = [
  "DAILY",
  "TEAM",
  "BUILD",
  "DEVELOP",
  "FILM",
  "EDUCATION",
  "ANALYTICS",
  "RECRUITING",
  "PROFILE",
  "MORE",
] as const;

function extractSectionTitles(): string[] {
  const filePath = resolve(__dirname, "../../..", "components/app/AppShell.tsx");
  const src = readFileSync(filePath, "utf-8");
  const arrayStart = src.indexOf("const COACH_SIDEBAR_SECTIONS: SidebarSection[] = [");
  const arrayEnd   = src.indexOf("const COACH_OVERFLOW_ITEMS", arrayStart);
  if (arrayStart === -1 || arrayEnd === -1) throw new Error("COACH_SIDEBAR_SECTIONS not found");
  const block = src.slice(arrayStart, arrayEnd);
  return [...block.matchAll(/title:\s*"([^"]+)"/g)].map((m) => m[1]);
}

describe("COACH_SIDEBAR_SECTIONS — section order", () => {
  const actual = extractSectionTitles();

  it("contains exactly the expected sections", () => {
    expect(actual).toHaveLength(EXPECTED_SECTION_ORDER.length);
    expect(new Set(actual)).toEqual(new Set(EXPECTED_SECTION_ORDER));
  });

  it("sections appear in the correct top-to-bottom order", () => {
    expect(actual).toEqual([...EXPECTED_SECTION_ORDER]);
  });

  EXPECTED_SECTION_ORDER.forEach((section, index) => {
    it(`position ${index + 1} is ${section}`, () => {
      expect(actual[index]).toBe(section);
    });
  });

  it("EDUCATION appears immediately before ANALYTICS", () => {
    expect(actual.indexOf("ANALYTICS")).toBe(actual.indexOf("EDUCATION") + 1);
  });

  it("MORE is the last section", () => {
    expect(actual[actual.length - 1]).toBe("MORE");
  });

  it("PROFILE is immediately before MORE", () => {
    expect(actual.indexOf("MORE")).toBe(actual.indexOf("PROFILE") + 1);
  });
});
