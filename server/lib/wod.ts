/**
 * WOD generation — resilient multi-model chain.
 *
 * Tries each configured AI provider in priority order and falls through on
 * ANY failure (missing key, quota/429, timeout, malformed output), then ends
 * on a deterministic template generator so the feature can never hard-fail.
 *
 * Priority: OpenAI → Gemini → template. Reorder with WOD_PROVIDER_ORDER
 * (comma-separated, e.g. "gemini,openai").
 */

import { generateWod as generateWodOpenAI } from "./openai";
import { generateWod as generateWodGemini } from "./gemini";

export interface WodParams {
  playerName: string;
  position?: string;
  focusAreas: string[];
  targetMinutes: number;
  intensity: "low" | "medium" | "high";
  coachNotes?: string;
  wearableSnapshot?: { recoveryScore?: number; sleepScore?: number; strainScore?: number };
}

export interface WodBlock {
  block_type: string;
  drill_name: string;
  minutes: number;
  coaching_points: string[];
  success_metrics: string[];
}

export interface WodResult {
  theme: string;
  rationale: string;
  blocks: WodBlock[];
  /** Which generator produced this result — surfaced to the client. */
  generatedBy?: "openai" | "gemini" | "template";
}

type Provider = { name: "openai" | "gemini"; keyEnv: string; fn: (p: WodParams) => Promise<WodResult> };

const PROVIDERS: Record<"openai" | "gemini", Provider> = {
  openai: { name: "openai", keyEnv: "OPENAI_API_KEY", fn: generateWodOpenAI },
  gemini: { name: "gemini", keyEnv: "GEMINI_API_KEY", fn: generateWodGemini },
};

function providerOrder(): Provider[] {
  const raw = (process.env.WOD_PROVIDER_ORDER ?? "openai,gemini")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is "openai" | "gemini" => s === "openai" || s === "gemini");
  const order = raw.length ? raw : (["openai", "gemini"] as const);
  return order.map((n) => PROVIDERS[n]);
}

/** Basic sanity: a usable WOD has a theme and ≥2 blocks with positive minutes. */
function isUsable(r: WodResult | null | undefined): r is WodResult {
  return (
    !!r &&
    typeof r.theme === "string" &&
    Array.isArray(r.blocks) &&
    r.blocks.length >= 2 &&
    r.blocks.every((b) => typeof b.minutes === "number" && b.minutes > 0)
  );
}

export interface WodGenerationOutcome {
  result: WodResult;
  attempts: Array<{ provider: string; ok: boolean; error?: string }>;
}

export async function generateWodResilient(params: WodParams): Promise<WodGenerationOutcome> {
  const attempts: WodGenerationOutcome["attempts"] = [];

  for (const p of providerOrder()) {
    if (!process.env[p.keyEnv]) {
      attempts.push({ provider: p.name, ok: false, error: "no key" });
      continue;
    }
    try {
      const result = await p.fn(params);
      if (isUsable(result)) {
        attempts.push({ provider: p.name, ok: true });
        return { result: { ...result, generatedBy: p.name }, attempts };
      }
      attempts.push({ provider: p.name, ok: false, error: "unusable output" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      attempts.push({ provider: p.name, ok: false, error: msg.slice(0, 160) });
      console.warn(`[wod] ${p.name} failed, falling through: ${msg.slice(0, 160)}`);
    }
  }

  // Deterministic backstop — always produces a coherent session.
  attempts.push({ provider: "template", ok: true });
  return { result: generateWodTemplate(params), attempts };
}

// ── Deterministic template generator ────────────────────────────────────────

/** Drill catalogue keyed by focus keyword; falls back to a generic skill block. */
const DRILLS: Record<string, { block_type: string; drill_name: string; points: string[]; metrics: string[] }[]> = {
  shooting: [
    { block_type: "shooting", drill_name: "Form Shooting Progression", points: ["Elbow under the ball", "Hold the follow-through", "Same arc every rep"], metrics: ["Make 8/10 from each spot"] },
    { block_type: "shooting", drill_name: "Catch-and-Shoot Series", points: ["Feet set before the catch", "Quick, repeatable release"], metrics: ["45+ makes in 5 minutes"] },
  ],
  finishing: [
    { block_type: "finishing", drill_name: "Mikan Drill", points: ["Soft touch off the glass", "Two-foot rhythm", "Chin the rebound"], metrics: ["25 makes in a row"] },
    { block_type: "finishing", drill_name: "Contact Layup Series", points: ["Absorb contact, finish through", "Protect with the off-arm"], metrics: ["8/10 through contact each side"] },
  ],
  closeout: [
    { block_type: "footwork", drill_name: "Closeout Slide Drill", points: ["Short choppy steps", "High hand, chest down", "Break down under control"], metrics: ["Contest without fouling on 10 reps"] },
    { block_type: "defense", drill_name: "Closeout & Contain", points: ["Sprint to the gap, break down", "Force to the sideline"], metrics: ["Stay in front on 8/10 drives"] },
  ],
  footwork: [
    { block_type: "footwork", drill_name: "Pivot & Jab Series", points: ["Stay low", "Sell the jab", "Balanced base"], metrics: ["Clean footwork on 20 reps"] },
  ],
  defense: [
    { block_type: "defense", drill_name: "Lateral Slide Ladder", points: ["Stay low, don't cross feet", "Active hands"], metrics: ["4 clean ladders under time"] },
  ],
  ballhandling: [
    { block_type: "skill", drill_name: "2-Ball Stationary Series", points: ["Pound hard", "Eyes up", "Fingertip control"], metrics: ["3 clean minutes, no fumbles"] },
  ],
  passing: [
    { block_type: "skill", drill_name: "Partner Passing Progression", points: ["Step into every pass", "Target the numbers"], metrics: ["50 accurate reps"] },
  ],
  conditioning: [
    { block_type: "conditioning", drill_name: "17s (Sideline Sprints)", points: ["Full speed, controlled stops", "Consistent splits"], metrics: ["Finish under target time"] },
  ],
};

function drillsForFocus(focus: string) {
  const key = focus.toLowerCase();
  for (const k of Object.keys(DRILLS)) {
    if (key.includes(k)) return DRILLS[k];
  }
  // Generic skill block named after the focus area.
  return [{
    block_type: "skill",
    drill_name: `${focus} — Skill Reps`,
    points: ["Full concentration each rep", "Quality over quantity", "Match game speed"],
    metrics: [`Complete a focused ${focus} block`],
  }];
}

export function generateWodTemplate(params: WodParams): WodResult {
  const total = Math.min(Math.max(params.targetMinutes || 45, 15), 120);
  const intensity = params.intensity ?? "medium";
  const lowRecovery = (params.wearableSnapshot?.recoveryScore ?? 100) < 40;
  const includeConditioning = intensity === "high" && !lowRecovery;

  const warmup = 7;
  const recovery = intensity === "low" ? 5 : 4;
  const conditioning = includeConditioning ? Math.round(total * 0.15) : 0;
  const skillBudget = Math.max(total - warmup - recovery - conditioning, 8);

  const blocks: WodBlock[] = [
    { block_type: "warmup", drill_name: "Dynamic Warmup Series", minutes: warmup,
      coaching_points: ["Raise heart rate gradually", "Open the hips and ankles"], success_metrics: ["Break a light sweat, joints loose"] },
  ];

  const focuses = params.focusAreas.length ? params.focusAreas : ["Skill Development"];
  const per = Math.max(Math.floor(skillBudget / focuses.length), 5);
  let used = 0;
  focuses.forEach((focus, i) => {
    const d = drillsForFocus(focus)[0];
    const mins = i === focuses.length - 1 ? skillBudget - used : per;
    used += mins;
    blocks.push({ block_type: d.block_type, drill_name: d.drill_name, minutes: Math.max(mins, 4),
      coaching_points: d.points.slice(0, 3), success_metrics: d.metrics.slice(0, 2) });
  });

  if (includeConditioning) {
    blocks.push({ block_type: "conditioning", drill_name: "17s (Sideline Sprints)", minutes: conditioning,
      coaching_points: ["Full speed, controlled stops"], success_metrics: ["Finish under target time"] });
  }

  blocks.push({ block_type: "recovery", drill_name: "Static Stretching & Breathing", minutes: recovery,
    coaching_points: ["Hold each stretch 20-30s", "Slow nasal breathing"], success_metrics: ["Heart rate back to baseline"] });

  const rationale = lowRecovery
    ? `Recovery is low today, so this ${total}-minute session keeps volume moderate and skips conditioning — quality reps on ${focuses.join(" and ")} without adding strain.`
    : `A ${intensity}-intensity, ${total}-minute session built around ${focuses.join(" and ")}${params.position ? ` for a ${params.position}` : ""}. Warm up, get focused skill reps, and cool down.`;

  return {
    theme: `${focuses[0]}${focuses.length > 1 ? " + " + focuses[1] : ""} Development`,
    rationale,
    blocks,
    generatedBy: "template",
  };
}
