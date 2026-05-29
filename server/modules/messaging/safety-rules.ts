/**
 * Safety rule engine — Layer 4 of the HoopsOS communications safety stack.
 *
 *   Layer 1  guardian-policy.ts    — guardian-copy enforcement
 *   Layer 2  thread-type-policy.ts — approved thread type classification
 *   Layer 3  quiet-hours-policy.ts — send-time window enforcement
 *   Layer 4  safety-rules.ts       — rule-based content flagging (THIS FILE)
 *
 * DESIGN PRINCIPLES
 * ─────────────────
 * • Deterministic — the same message always produces the same result.  No LLM,
 *   no network calls.
 * • Pure function — scanMessage() has no side effects and no DB access.  The
 *   caller (routes.ts) is responsible for persisting the flag and review item.
 * • Evidence-preserving — every match captures the specific text that triggered
 *   it, not just the rule ID.
 * • Conservative false-positive design — rules target specific phrases that are
 *   unambiguous in a coach-to-minor context.  Vague patterns are LOW severity
 *   so borderline cases reach an admin rather than being silently blocked.
 *
 * FLAG CATEGORIES
 * ───────────────
 *   secrecy_language       "keep this between us", "our little secret"
 *   romantic_language      "I love you", "you're so cute/beautiful"
 *   sexual_language        Explicit sexual content
 *   off_platform           Requests to move to Snapchat, text, etc.
 *   gift_offer             "I'll buy you…", "I have a gift for you"
 *   solo_travel            "I'll give you a ride", "just the two of us"
 *   personal_oversharing   Coach sharing intimate personal details
 *   parental_exclusion     "don't tell your parents/guardian"
 *   deletion_request       "delete this message", "clear the chat"
 *
 * SEVERITY LEVELS
 * ───────────────
 *   high    Block send for coach/staff in minor-protected threads.
 *           Creates an escalated review item.
 *           Categories: sexual_language, parental_exclusion, deletion_request
 *
 *   medium  Allow send if thread is otherwise policy-compliant.
 *           Creates an open review item.
 *           Categories: romantic_language, off_platform, solo_travel
 *
 *   low     Allow send, no review item.  Flag row written for audit trail.
 *           Categories: secrecy_language, gift_offer, personal_oversharing
 *
 * BLOCKING LOGIC
 * ──────────────
 * A message is blocked (shouldBlock = true) when ALL of:
 *   • senderRole is staff (owner/admin/coach/analyst)
 *   • hasMinorRecipients = true
 *   • maxSeverity = "high"
 *
 * Non-staff senders are never blocked regardless of content, but their
 * messages are still flagged so admins can review inbound language too.
 */

import { isStaffRole } from "./guardian-policy";

// ── Types ─────────────────────────────────────────────────────────────────────

export type FlagCategory =
  | "secrecy_language"
  | "romantic_language"
  | "sexual_language"
  | "off_platform"
  | "gift_offer"
  | "solo_travel"
  | "personal_oversharing"
  | "parental_exclusion"
  | "deletion_request";

export type FlagSeverity = "low" | "medium" | "high";

export interface SafetyRule {
  id:          string;
  category:    FlagCategory;
  severity:    FlagSeverity;
  pattern:     RegExp;
  description: string;
}

export interface RuleMatch {
  ruleId:      string;
  category:    FlagCategory;
  severity:    FlagSeverity;
  /** The actual text fragment that triggered the rule. */
  matchedText: string;
  description: string;
}

export interface ScanContext {
  body:                string;
  senderRole:          string;
  hasMinorRecipients:  boolean;
  threadType?:         string;
}

export interface ScanResult {
  /** All rule matches found (one per rule, not per occurrence). */
  matches:           RuleMatch[];
  /** Highest severity across all matches.  Null when no rules matched. */
  maxSeverity:       FlagSeverity | null;
  /** Deduplicated list of matched categories. */
  categories:        FlagCategory[];
  /**
   * True when the message should be blocked before DB writes.
   * Only set when: staff sender + minor recipients + HIGH severity match.
   */
  shouldBlock:       boolean;
  /**
   * True when an admin review item should be created.
   * Set for HIGH and MEDIUM severity matches in protected contexts.
   */
  createReviewItem:  boolean;
  /**
   * Initial status for the review item.
   * "escalated" for HIGH, "open" for MEDIUM.
   */
  reviewItemStatus:  "open" | "escalated" | null;
}

// ── Severity helpers ──────────────────────────────────────────────────────────

const SEVERITY_RANK: Record<FlagSeverity, number> = {
  low:    1,
  medium: 2,
  high:   3,
};

function maxSeverityOf(severities: FlagSeverity[]): FlagSeverity | null {
  if (severities.length === 0) return null;
  return severities.reduce((a, b) =>
    SEVERITY_RANK[b] > SEVERITY_RANK[a] ? b : a,
  );
}

// ── Rule definitions ──────────────────────────────────────────────────────────
//
// Pattern design philosophy:
//   • Use \b word boundaries to avoid matching substrings ("snap" in "snapshot")
//   • Use case-insensitive flag on all patterns
//   • Prefer specificity over breadth — one clear hit is better than 10 marginal hits
//   • Capture groups are unnecessary; we capture the full match via RegExp.exec

export const SAFETY_RULES: SafetyRule[] = [

  // ── HIGH: parental exclusion ─────────────────────────────────────────────
  // These are the clearest grooming-pattern phrases.

  {
    id:          "PE-001",
    category:    "parental_exclusion",
    severity:    "high",
    pattern:     /\bdon'?t\s+tell\s+(your\s+)?(parents?|mom|dad|mother|father|guardian|family)\b/i,
    description: "Explicit instruction not to tell parents/guardian",
  },
  {
    id:          "PE-002",
    category:    "parental_exclusion",
    severity:    "high",
    pattern:     /\byour\s+(parents?|mom|dad|mother|father|guardian)\s+(don'?t\s+need\s+to\s+know|wouldn'?t\s+understand|would(n'?t)?\s+(get|like|approve))\b/i,
    description: "Dismissing parental knowledge or authority",
  },
  {
    id:          "PE-003",
    category:    "parental_exclusion",
    severity:    "high",
    pattern:     /\bkeep\s+(it|this)\s+(from|away\s+from)\s+(your\s+)?(parents?|mom|dad|mother|father|guardian|family)\b/i,
    description: "Instruction to hide content from parents",
  },
  {
    id:          "PE-004",
    category:    "parental_exclusion",
    severity:    "high",
    pattern:     /\blet'?s?\s+not\s+(mention|tell|say)\s+(this|anything)?\s*(to\s+)?(your\s+)?(parents?|mom|dad)\b/i,
    description: "Suggesting silence toward parents",
  },

  // ── HIGH: deletion requests ───────────────────────────────────────────────

  {
    id:          "DR-001",
    category:    "deletion_request",
    severity:    "high",
    pattern:     /\bdelete\s+(this|these|the|your|our|all)?\s*(messages?|texts?|chat|conversation|thread)\b/i,
    description: "Request to delete messages",
  },
  {
    id:          "DR-002",
    category:    "deletion_request",
    severity:    "high",
    pattern:     /\b(clear|erase|remove|wipe)\s+(the\s+|our\s+|your\s+|this\s+)?(chat|messages?|conversation|history|texts?)\b/i,
    description: "Request to erase message history",
  },
  {
    id:          "DR-003",
    category:    "deletion_request",
    severity:    "high",
    pattern:     /\bdon'?t\s+(save|screenshot|screen\s*shot|share|forward|show)\s+(this|these|the\s+messages?)\b/i,
    description: "Instruction not to save or share content",
  },

  // ── HIGH: sexual language ─────────────────────────────────────────────────

  {
    id:          "SX-001",
    category:    "sexual_language",
    severity:    "high",
    pattern:     /\b(sex|sexual|sexually|intercourse|foreplay)\b/i,
    description: "Explicit sexual terminology",
  },
  {
    id:          "SX-002",
    category:    "sexual_language",
    severity:    "high",
    pattern:     /\b(nude|naked|undress|strip|genitals?|privates?|penis|vagina|breasts?|boobs?)\b/i,
    description: "Explicit body or nudity reference",
  },
  {
    id:          "SX-003",
    category:    "sexual_language",
    severity:    "high",
    pattern:     /\b(send\s+me\s+(a\s+)?(pic|photo|photo|picture|image|video|selfie)|send\s+(nudes?|pics?\s+of\s+yourself))\b/i,
    description: "Solicitation of images",
  },
  {
    id:          "SX-004",
    category:    "sexual_language",
    severity:    "high",
    pattern:     /\b(turn\s+me\s+on|turned\s+on\s+by\s+you|sexually\s+attracted)\b/i,
    description: "Sexual attraction statement",
  },

  // ── MEDIUM: romantic language ─────────────────────────────────────────────

  {
    id:          "RL-001",
    category:    "romantic_language",
    severity:    "medium",
    pattern:     /\bi\s+(love|adore|am\s+in\s+love\s+with)\s+you\b/i,
    description: "Expression of love toward recipient",
  },
  {
    id:          "RL-002",
    category:    "romantic_language",
    severity:    "medium",
    pattern:     /\byou'?re?\s+(so\s+)?(cute|beautiful|gorgeous|sexy|attractive|stunning|hot)\b/i,
    description: "Romantic or sexual compliment toward recipient",
  },
  {
    id:          "RL-003",
    category:    "romantic_language",
    severity:    "medium",
    pattern:     /\b(you\s+mean\s+(so\s+much|everything)\s+to\s+me|i\s+(miss\s+you\s+so\s+much|can'?t\s+stop\s+thinking\s+about\s+you))\b/i,
    description: "Romantic longing expression",
  },
  {
    id:          "RL-004",
    category:    "romantic_language",
    severity:    "medium",
    pattern:     /\b(my\s+)(special|favorite)\s+(girl|boy|kid|player|athlete)\b/i,
    description: "Possessive romantic language toward minor",
  },
  {
    id:          "RL-005",
    category:    "romantic_language",
    severity:    "medium",
    pattern:     /\b(i\s+have\s+feelings?\s+for\s+you|i\s+like\s+you\s+(more\s+than|as\s+more\s+than)\s+a)\b/i,
    description: "Romantic feelings disclosure",
  },

  // ── MEDIUM: off-platform requests ─────────────────────────────────────────

  {
    id:          "OP-001",
    category:    "off_platform",
    severity:    "medium",
    pattern:     /\b(snap\s*chat|instagram|insta|signal|telegram|whatsapp)\s*(me|dm|message|text)?\b/i,
    description: "Reference to alternative messaging platform",
  },
  {
    id:          "OP-002",
    category:    "off_platform",
    severity:    "medium",
    pattern:     /\b(text|dm|message)\s+me\s+(on|at|directly|privately|instead)\b/i,
    description: "Request to move communication off-platform",
  },
  {
    id:          "OP-003",
    category:    "off_platform",
    severity:    "medium",
    pattern:     /\b(let'?s?\s+(talk|chat|communicate)\s+(off|outside|away\s+from)\s+(here|this\s+(app|platform|system)))\b/i,
    description: "Explicit request to leave this platform",
  },
  {
    id:          "OP-004",
    category:    "off_platform",
    severity:    "medium",
    pattern:     /\b(use\s+my\s+(personal|private)\s+(phone|number|email)|call\s+my\s+personal)\b/i,
    description: "Directing contact to personal device/account",
  },

  // ── MEDIUM: solo travel or alone time ────────────────────────────────────

  {
    id:          "ST-001",
    category:    "solo_travel",
    severity:    "medium",
    pattern:     /\b(give|offer|drive)\s+you\s+a\s+(ride|lift|drive)\b/i,
    description: "Offer of private transportation",
  },
  {
    id:          "ST-002",
    category:    "solo_travel",
    severity:    "medium",
    // Require explicit first-person subject to avoid "your parents can pick you up" false-positive
    pattern:     /\bi\s*('?ll?|('m\s+going\s+to)|can|will|could|would)\s+(pick\s+you\s+up|drive\s+you)\b/i,
    description: "Offer to pick up minor",
  },
  {
    id:          "ST-003",
    category:    "solo_travel",
    severity:    "medium",
    pattern:     /\bjust\s+(the\s+)?two\s+of\s+us\b/i,
    description: "Suggestion of one-on-one alone time",
  },
  {
    id:          "ST-004",
    category:    "solo_travel",
    severity:    "medium",
    pattern:     /\b(alone\s+(with\s+me|together)|meet\s+(me\s+)?(alone|privately|in\s+private))\b/i,
    description: "Request for private alone time",
  },
  {
    id:          "ST-005",
    category:    "solo_travel",
    severity:    "medium",
    pattern:     /\b(private\s+(session|lesson|training|workout|meeting))\b/i,
    description: "Solicitation of private unsupervised session",
  },

  // ── LOW: secrecy language ─────────────────────────────────────────────────

  {
    id:          "SL-001",
    category:    "secrecy_language",
    severity:    "low",
    pattern:     /\b(keep\s+this\s+(between\s+us|quiet|to\s+yourself)|our\s+(little\s+)?secret)\b/i,
    description: "Language suggesting secrecy between parties",
  },
  {
    id:          "SL-002",
    category:    "secrecy_language",
    severity:    "low",
    pattern:     /\bjust\s+between\s+(you\s+and\s+me|us)\b/i,
    description: "Exclusionary secrecy phrase",
  },
  {
    id:          "SL-003",
    category:    "secrecy_language",
    severity:    "low",
    pattern:     /\b(don'?t\s+(mention|say|tell)\s+(anyone|this)\b(?!.*parent))/i,
    description: "Generic request for non-disclosure",
  },

  // ── LOW: gift offers ──────────────────────────────────────────────────────

  {
    id:          "GO-001",
    category:    "gift_offer",
    severity:    "low",
    pattern:     /\b(i'?ll?\s+(buy|get|give|send)\s+you)\b/i,
    description: "Offer to provide something to minor",
  },
  {
    id:          "GO-002",
    category:    "gift_offer",
    severity:    "low",
    pattern:     /\b(i\s+(have|got)\s+(a\s+)?(gift|present|surprise|something\s+special)\s+(for\s+you|waiting))\b/i,
    description: "Gift or surprise offer to minor",
  },
  {
    id:          "GO-003",
    category:    "gift_offer",
    severity:    "low",
    pattern:     /\b(money|cash|gift\s+card|venmo|paypal|cashapp|zelle)\s+(for\s+you|to\s+you)\b/i,
    description: "Financial transfer offer to minor",
  },

  // ── LOW: personal oversharing ─────────────────────────────────────────────

  {
    id:          "PO-001",
    category:    "personal_oversharing",
    severity:    "low",
    pattern:     /\b(my\s+(ex|ex-wife|ex-husband|ex-girlfriend|ex-boyfriend))\b/i,
    description: "Coach sharing details about former romantic partners",
  },
  {
    id:          "PO-002",
    category:    "personal_oversharing",
    severity:    "low",
    pattern:     /\b(i'?m?\s+(so\s+)?(lonely|depressed|struggling\s+with\s+my|going\s+through\s+(a\s+)?(hard|tough|rough|difficult)))\b/i,
    description: "Coach sharing emotional distress or loneliness",
  },
  {
    id:          "PO-003",
    category:    "personal_oversharing",
    severity:    "low",
    pattern:     /\b(my\s+(marriage|divorce|separation|relationship\s+problem|personal\s+life|home\s+life)\s+(is|has|was))\b/i,
    description: "Coach sharing intimate relationship details",
  },
];

// ── Core scan function ────────────────────────────────────────────────────────

/**
 * Scans a message body against all safety rules and returns the consolidated
 * result.  Pure function — no side effects.
 *
 * @example
 * ```ts
 * const scan = scanMessage({
 *   body:               "Don't tell your parents about this.",
 *   senderRole:         "coach",
 *   hasMinorRecipients: true,
 * });
 * // scan.shouldBlock === true
 * // scan.maxSeverity === "high"
 * // scan.categories includes "parental_exclusion"
 * ```
 */
export function scanMessage(ctx: ScanContext): ScanResult {
  const { body, senderRole, hasMinorRecipients } = ctx;

  const matches: RuleMatch[] = [];
  const seenRuleIds = new Set<string>();

  for (const rule of SAFETY_RULES) {
    if (seenRuleIds.has(rule.id)) continue; // rules are unique but be safe

    const match = rule.pattern.exec(body);
    if (!match) continue;

    matches.push({
      ruleId:      rule.id,
      category:    rule.category,
      severity:    rule.severity,
      matchedText: match[0],
      description: rule.description,
    });
    seenRuleIds.add(rule.id);
  }

  if (matches.length === 0) {
    return {
      matches:          [],
      maxSeverity:      null,
      categories:       [],
      shouldBlock:      false,
      createReviewItem: false,
      reviewItemStatus: null,
    };
  }

  const maxSeverity = maxSeverityOf(matches.map((m) => m.severity))!;
  const categories  = [...new Set(matches.map((m) => m.category))];

  // Blocking: only staff senders, only in minor-protected threads, only HIGH
  const isProtectedContext = isStaffRole(senderRole) && hasMinorRecipients;
  const shouldBlock        = isProtectedContext && maxSeverity === "high";

  // Review items: HIGH or MEDIUM in any flagged message (including non-minor
  // or non-staff contexts — admins may want to review player content too)
  const createReviewItem =
    maxSeverity === "high" || maxSeverity === "medium";

  const reviewItemStatus: "open" | "escalated" | null =
    !createReviewItem ? null
    : maxSeverity === "high" ? "escalated"
    : "open";

  return {
    matches,
    maxSeverity,
    categories,
    shouldBlock,
    createReviewItem,
    reviewItemStatus,
  };
}
