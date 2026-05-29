/**
 * Unit tests for the rule-based safety scanning engine (Layer 4).
 *
 * Coverage
 * ────────
 * Per flag category: at least one positive match + one non-triggering message
 * Severity scoring: low/medium/high escalation; multi-match max
 * Blocking logic: staff+minor+high = block; all other combos do not block
 * Evidence: matchedText is a substring of the body
 * Non-staff: never blocked regardless of content
 * Clean messages: no matches on legitimate coaching language
 */

import { describe, it, expect } from "vitest";
import {
  scanMessage,
  SAFETY_RULES,
  type ScanContext,
  type FlagCategory,
} from "../safety-rules";

// ── Helpers ───────────────────────────────────────────────────────────────────

function ctx(body: string, overrides: Partial<ScanContext> = {}): ScanContext {
  return {
    body,
    senderRole:         "coach",
    hasMinorRecipients: true,
    ...overrides,
  };
}

function categoriesOf(body: string, overrides: Partial<ScanContext> = {}): FlagCategory[] {
  return scanMessage(ctx(body, overrides)).categories;
}

function matchCountFor(body: string, category: FlagCategory): number {
  return scanMessage(ctx(body)).matches.filter((m) => m.category === category).length;
}

// ── Rule coverage sanity checks ───────────────────────────────────────────────

describe("SAFETY_RULES constant", () => {
  it("contains rules for all nine required categories", () => {
    const categories = new Set(SAFETY_RULES.map((r) => r.category));
    const required: FlagCategory[] = [
      "secrecy_language", "romantic_language", "sexual_language",
      "off_platform", "gift_offer", "solo_travel",
      "personal_oversharing", "parental_exclusion", "deletion_request",
    ];
    for (const cat of required) {
      expect(categories.has(cat)).toBe(true);
    }
  });

  it("all rule IDs are unique", () => {
    const ids = SAFETY_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all rules have non-empty descriptions", () => {
    for (const rule of SAFETY_RULES) {
      expect(rule.description.length).toBeGreaterThan(5);
    }
  });
});

// ── Category: parental_exclusion (HIGH) ───────────────────────────────────────

describe("parental_exclusion — HIGH severity", () => {
  it("detects 'don't tell your parents'", () => {
    expect(categoriesOf("Don't tell your parents about this.")).toContain("parental_exclusion");
  });

  it("detects 'don't tell your mom'", () => {
    expect(categoriesOf("Please don't tell your mom.")).toContain("parental_exclusion");
  });

  it("detects \"your parents don't need to know\"", () => {
    expect(categoriesOf("Your parents don't need to know about our sessions.")).toContain("parental_exclusion");
  });

  it("detects 'keep it from your parents'", () => {
    expect(categoriesOf("Keep it from your parents for now.")).toContain("parental_exclusion");
  });

  it("does NOT flag 'we told your parents about practice'", () => {
    expect(categoriesOf("We told your parents about the schedule change.")).not.toContain("parental_exclusion");
  });

  it("does NOT flag 'your parents should be proud'", () => {
    expect(categoriesOf("Your parents should be proud of your progress.")).not.toContain("parental_exclusion");
  });

  it("parental_exclusion is always high severity", () => {
    const result = scanMessage(ctx("Don't tell your guardian about this."));
    const match = result.matches.find((m) => m.category === "parental_exclusion");
    expect(match?.severity).toBe("high");
  });
});

// ── Category: deletion_request (HIGH) ────────────────────────────────────────

describe("deletion_request — HIGH severity", () => {
  it("detects 'delete this message'", () => {
    expect(categoriesOf("Please delete this message after reading.")).toContain("deletion_request");
  });

  it("detects 'clear the chat'", () => {
    expect(categoriesOf("Clear the chat before our meeting.")).toContain("deletion_request");
  });

  it("detects 'don't screenshot this'", () => {
    expect(categoriesOf("Don't screenshot this please.")).toContain("deletion_request");
  });

  it("detects 'erase our conversation'", () => {
    expect(categoriesOf("Erase our conversation on your phone.")).toContain("deletion_request");
  });

  it("does NOT flag 'delete the old practice schedule'", () => {
    // "delete the old practice schedule" — "delete" + file reference, no message/chat keyword
    expect(categoriesOf("You can delete the old practice schedule.")).not.toContain("deletion_request");
  });

  it("deletion_request is always high severity", () => {
    const result = scanMessage(ctx("Delete this message."));
    const match = result.matches.find((m) => m.category === "deletion_request");
    expect(match?.severity).toBe("high");
  });
});

// ── Category: sexual_language (HIGH) ─────────────────────────────────────────

describe("sexual_language — HIGH severity", () => {
  it("detects explicit sexual terminology", () => {
    expect(categoriesOf("This is sexual content.")).toContain("sexual_language");
  });

  it("detects nudity reference", () => {
    expect(categoriesOf("Can you send me a nude photo?")).toContain("sexual_language");
  });

  it("detects image solicitation", () => {
    expect(categoriesOf("Send me a pic of yourself.")).toContain("sexual_language");
  });

  it("does NOT flag neutral anatomy in medical context", () => {
    // This is an intentional design limitation — medical terms still flag.
    // Acceptable: admins review, which is the correct behavior for HIGH severity.
    const result = scanMessage(ctx("Schedule your physical and talk to the trainer about any injuries."));
    // "physical" should not match sexual_language
    expect(result.categories).not.toContain("sexual_language");
  });

  it("sexual_language is always high severity", () => {
    const result = scanMessage(ctx("Sexual content here."));
    const match = result.matches.find((m) => m.category === "sexual_language");
    expect(match?.severity).toBe("high");
  });
});

// ── Category: romantic_language (MEDIUM) ─────────────────────────────────────

describe("romantic_language — MEDIUM severity", () => {
  it("detects 'I love you'", () => {
    expect(categoriesOf("I love you, you're amazing.")).toContain("romantic_language");
  });

  it("detects 'you're so cute'", () => {
    expect(categoriesOf("You're so cute when you hustle.")).toContain("romantic_language");
  });

  it("detects 'my special girl'", () => {
    expect(categoriesOf("You're my special girl on this team.")).toContain("romantic_language");
  });

  it("detects 'I have feelings for you'", () => {
    expect(categoriesOf("I have feelings for you beyond coaching.")).toContain("romantic_language");
  });

  it("does NOT flag 'great work, love your commitment'", () => {
    expect(categoriesOf("Great work — love your commitment this week!")).not.toContain("romantic_language");
  });

  it("does NOT flag 'the team loves your energy'", () => {
    expect(categoriesOf("The team loves your energy on defense.")).not.toContain("romantic_language");
  });

  it("romantic_language is medium severity", () => {
    const result = scanMessage(ctx("I love you."));
    const match = result.matches.find((m) => m.category === "romantic_language");
    expect(match?.severity).toBe("medium");
  });
});

// ── Category: off_platform (MEDIUM) ──────────────────────────────────────────

describe("off_platform — MEDIUM severity", () => {
  it("detects 'Snapchat me'", () => {
    expect(categoriesOf("Snapchat me when you get home.")).toContain("off_platform");
  });

  it("detects 'text me on instagram'", () => {
    expect(categoriesOf("Text me on instagram instead.")).toContain("off_platform");
  });

  it("detects 'text me directly'", () => {
    expect(categoriesOf("Text me directly on my number.")).toContain("off_platform");
  });

  it("detects 'let's talk off here'", () => {
    expect(categoriesOf("Let's talk off this app.")).toContain("off_platform");
  });

  it("does NOT flag 'snap a photo of your receipt'", () => {
    // "snap" in context of photography, no mention of Snapchat specifically
    expect(categoriesOf("Snap a photo of your receipt for reimbursement.")).not.toContain("off_platform");
  });

  it("off_platform is medium severity", () => {
    const result = scanMessage(ctx("Let's talk off this platform."));
    const match = result.matches.find((m) => m.category === "off_platform");
    expect(match?.severity).toBe("medium");
  });
});

// ── Category: solo_travel (MEDIUM) ───────────────────────────────────────────

describe("solo_travel — MEDIUM severity", () => {
  it("detects 'give you a ride'", () => {
    expect(categoriesOf("I can give you a ride home.")).toContain("solo_travel");
  });

  it("detects 'I'll pick you up'", () => {
    expect(categoriesOf("I'll pick you up at 7.")).toContain("solo_travel");
  });

  it("detects 'just the two of us'", () => {
    expect(categoriesOf("This drill, just the two of us.")).toContain("solo_travel");
  });

  it("detects 'meet me alone'", () => {
    expect(categoriesOf("Can you meet me alone after practice?")).toContain("solo_travel");
  });

  it("detects 'private training session'", () => {
    expect(categoriesOf("We'll do a private session this weekend.")).toContain("solo_travel");
  });

  it("does NOT flag 'the team van picks everyone up'", () => {
    expect(categoriesOf("The team van picks everyone up at 8am.")).not.toContain("solo_travel");
  });

  it("solo_travel is medium severity", () => {
    const result = scanMessage(ctx("I can give you a ride."));
    const match = result.matches.find((m) => m.category === "solo_travel");
    expect(match?.severity).toBe("medium");
  });
});

// ── Category: gift_offer (LOW) ────────────────────────────────────────────────

describe("gift_offer — LOW severity", () => {
  it("detects 'I'll buy you'", () => {
    expect(categoriesOf("I'll buy you lunch.")).toContain("gift_offer");
  });

  it("detects 'I got a gift for you'", () => {
    expect(categoriesOf("I got a gift for you waiting at the gym.")).toContain("gift_offer");
  });

  it("detects 'cash for you'", () => {
    expect(categoriesOf("I have some cash for you from the fundraiser.")).toContain("gift_offer");
  });

  it("does NOT flag 'the team bought new uniforms'", () => {
    expect(categoriesOf("The team bought new uniforms for the season.")).not.toContain("gift_offer");
  });

  it("gift_offer is low severity", () => {
    const result = scanMessage(ctx("I'll buy you a snack."));
    const match = result.matches.find((m) => m.category === "gift_offer");
    expect(match?.severity).toBe("low");
  });
});

// ── Category: secrecy_language (LOW) ─────────────────────────────────────────

describe("secrecy_language — LOW severity", () => {
  it("detects 'our little secret'", () => {
    expect(categoriesOf("Let's keep this our little secret.")).toContain("secrecy_language");
  });

  it("detects 'keep this between us'", () => {
    expect(categoriesOf("Keep this between us for now.")).toContain("secrecy_language");
  });

  it("detects 'just between you and me'", () => {
    expect(categoriesOf("Just between you and me, I think you're the starter.")).toContain("secrecy_language");
  });

  it("does NOT flag 'this strategy stays within the team'", () => {
    // "stays within the team" is about team confidentiality, not personal secrecy
    expect(categoriesOf("This strategy stays within the team, don't share with opponents.")).not.toContain("secrecy_language");
  });

  it("secrecy_language is low severity", () => {
    const result = scanMessage(ctx("Keep this between us."));
    const match = result.matches.find((m) => m.category === "secrecy_language");
    expect(match?.severity).toBe("low");
  });
});

// ── Category: personal_oversharing (LOW) ─────────────────────────────────────

describe("personal_oversharing — LOW severity", () => {
  it("detects 'my ex-wife'", () => {
    expect(categoriesOf("My ex-wife used to come to all the games.")).toContain("personal_oversharing");
  });

  it("detects loneliness disclosure", () => {
    expect(categoriesOf("I'm so lonely since the divorce.")).toContain("personal_oversharing");
  });

  it("detects marriage problem disclosure", () => {
    expect(categoriesOf("My marriage is going through a rough patch.")).toContain("personal_oversharing");
  });

  it("does NOT flag standard coaching personal connection", () => {
    expect(categoriesOf("I remember being your age and feeling the same pressure.")).not.toContain("personal_oversharing");
  });

  it("personal_oversharing is low severity", () => {
    const result = scanMessage(ctx("I'm so lonely since they left."));
    const match = result.matches.find((m) => m.category === "personal_oversharing");
    expect(match?.severity).toBe("low");
  });
});

// ── Severity scoring / aggregation ───────────────────────────────────────────

describe("severity scoring", () => {
  it("returns null maxSeverity when no rules match", () => {
    const result = scanMessage(ctx("Nice work at practice today. See you tomorrow."));
    expect(result.maxSeverity).toBeNull();
    expect(result.matches).toHaveLength(0);
  });

  it("returns 'low' for low-only matches", () => {
    const result = scanMessage(ctx("Keep this between us. I'll buy you a snack."));
    expect(result.maxSeverity).toBe("low");
  });

  it("returns 'medium' when highest match is medium", () => {
    const result = scanMessage(ctx("I can give you a ride. Keep this between us."));
    expect(result.maxSeverity).toBe("medium");
  });

  it("returns 'high' when any match is high (overrides lower)", () => {
    const result = scanMessage(ctx("Keep this between us. Don't tell your parents. I love you."));
    expect(result.maxSeverity).toBe("high");
  });

  it("categories list contains every matched category (deduplicated)", () => {
    const result = scanMessage(ctx("Don't tell your parents. Delete this message."));
    expect(result.categories).toContain("parental_exclusion");
    expect(result.categories).toContain("deletion_request");
    // deduplicated
    expect(new Set(result.categories).size).toBe(result.categories.length);
  });

  it("multiple matches from the same category appear once in categories", () => {
    // Two deletion_request rules could both match
    const result = scanMessage(ctx("Delete this message and clear the chat."));
    const count = result.categories.filter((c) => c === "deletion_request").length;
    expect(count).toBe(1);
  });
});

// ── Blocking logic ────────────────────────────────────────────────────────────

describe("shouldBlock — blocking decision", () => {
  const highBody = "Don't tell your parents.";

  it("blocks staff sender + minor recipients + high severity", () => {
    const result = scanMessage({ body: highBody, senderRole: "coach", hasMinorRecipients: true });
    expect(result.shouldBlock).toBe(true);
  });

  it("does NOT block when sender is not staff (player)", () => {
    const result = scanMessage({ body: highBody, senderRole: "player", hasMinorRecipients: true });
    expect(result.shouldBlock).toBe(false);
  });

  it("does NOT block when sender is guardian", () => {
    const result = scanMessage({ body: highBody, senderRole: "guardian", hasMinorRecipients: true });
    expect(result.shouldBlock).toBe(false);
  });

  it("does NOT block staff + high + NO minor recipients", () => {
    const result = scanMessage({ body: highBody, senderRole: "coach", hasMinorRecipients: false });
    expect(result.shouldBlock).toBe(false);
  });

  it("does NOT block staff + minor + medium severity only", () => {
    const result = scanMessage({
      body:               "I can give you a ride home.",
      senderRole:         "coach",
      hasMinorRecipients: true,
    });
    expect(result.shouldBlock).toBe(false);
    expect(result.maxSeverity).toBe("medium");
  });

  it("does NOT block staff + minor + low severity only", () => {
    const result = scanMessage({
      body:               "Keep this between us for now.",
      senderRole:         "coach",
      hasMinorRecipients: true,
    });
    expect(result.shouldBlock).toBe(false);
    expect(result.maxSeverity).toBe("low");
  });

  it("does NOT block clean message", () => {
    const result = scanMessage({
      body:               "Practice is at 4pm tomorrow. Bring your gear.",
      senderRole:         "coach",
      hasMinorRecipients: true,
    });
    expect(result.shouldBlock).toBe(false);
    expect(result.maxSeverity).toBeNull();
  });

  it("all four staff roles can block (owner, admin, coach, analyst)", () => {
    for (const role of ["owner", "admin", "coach", "analyst"]) {
      const result = scanMessage({ body: highBody, senderRole: role, hasMinorRecipients: true });
      expect(result.shouldBlock).toBe(true);
    }
  });
});

// ── Review item creation ──────────────────────────────────────────────────────

describe("createReviewItem and reviewItemStatus", () => {
  it("high severity → createReviewItem=true, status=escalated", () => {
    const result = scanMessage(ctx("Don't tell your parents."));
    expect(result.createReviewItem).toBe(true);
    expect(result.reviewItemStatus).toBe("escalated");
  });

  it("medium severity → createReviewItem=true, status=open", () => {
    const result = scanMessage(ctx("I can give you a ride."));
    expect(result.createReviewItem).toBe(true);
    expect(result.reviewItemStatus).toBe("open");
  });

  it("low severity → createReviewItem=false, status=null", () => {
    const result = scanMessage(ctx("Keep this between us."));
    expect(result.createReviewItem).toBe(false);
    expect(result.reviewItemStatus).toBeNull();
  });

  it("no match → createReviewItem=false, status=null", () => {
    const result = scanMessage(ctx("Good work today!"));
    expect(result.createReviewItem).toBe(false);
    expect(result.reviewItemStatus).toBeNull();
  });
});

// ── Evidence quality ──────────────────────────────────────────────────────────

describe("evidence quality", () => {
  it("matchedText is a substring of the original body", () => {
    const body = "Don't tell your parents about this meeting.";
    const result = scanMessage(ctx(body));
    for (const match of result.matches) {
      expect(body.toLowerCase()).toContain(match.matchedText.toLowerCase());
    }
  });

  it("matchedText is non-empty for every match", () => {
    const result = scanMessage(ctx("Don't tell your parents. Delete this message."));
    for (const match of result.matches) {
      expect(match.matchedText.length).toBeGreaterThan(0);
    }
  });

  it("every match has a ruleId that exists in SAFETY_RULES", () => {
    const validIds = new Set(SAFETY_RULES.map((r) => r.id));
    const result = scanMessage(ctx("Don't tell your parents. I love you. Snapchat me."));
    for (const match of result.matches) {
      expect(validIds.has(match.ruleId)).toBe(true);
    }
  });

  it("every match has a description", () => {
    const result = scanMessage(ctx("Don't tell your parents."));
    for (const match of result.matches) {
      expect(match.description.length).toBeGreaterThan(0);
    }
  });
});

// ── Case insensitivity ────────────────────────────────────────────────────────

describe("case insensitivity", () => {
  it("matches uppercase variants", () => {
    expect(categoriesOf("DON'T TELL YOUR PARENTS!")).toContain("parental_exclusion");
  });

  it("matches mixed case", () => {
    expect(categoriesOf("Delete This Message please.")).toContain("deletion_request");
  });

  it("matches title case", () => {
    expect(categoriesOf("Keep This Between Us.")).toContain("secrecy_language");
  });
});

// ── Clean messages — no false positives on legitimate coaching ────────────────

describe("clean messages — no false positives", () => {
  const cleanMessages = [
    "Nice work at practice today. Keep pushing!",
    "Don't forget to bring your jersey for tomorrow's game.",
    "Great effort — the team loves your energy on defense.",
    "Practice starts at 4pm. Bring your gear and a water bottle.",
    "Film review is mandatory for all starters this Thursday at 6pm.",
    "Your parents can pick you up after practice ends at 7.",
    "Let's focus on footwork drills this week.",
    "The coaching staff is proud of your improvement.",
    "Season registration closes Friday — make sure your forms are in.",
    "We need to work on your free-throw percentage. Let's drill it.",
  ];

  for (const msg of cleanMessages) {
    it(`no flag for: "${msg.slice(0, 60)}…"`, () => {
      const result = scanMessage(ctx(msg));
      expect(result.maxSeverity).toBeNull();
      expect(result.shouldBlock).toBe(false);
    });
  }
});
