import { Router } from "express";
import { generateWod as generateWodOpenAI } from "../../lib/openai";
import { generateWod as generateWodGemini } from "../../lib/gemini";

/** Provider-agnostic dispatch: use whichever key is configured (OpenAI
 *  preferred when both are present — identical signatures and result shape). */
function pickGenerator() {
  if (process.env.OPENAI_API_KEY) return { name: "openai" as const, fn: generateWodOpenAI };
  if (process.env.GEMINI_API_KEY) return { name: "gemini" as const, fn: generateWodGemini };
  return null;
}

export function registerWodRoutes(router: Router) {
  // Diagnostic — returns env var presence without exposing values
  router.get("/health", (_req, res) => {
    const provider = pickGenerator();
    res.json({
      provider: provider?.name ?? null,
      openai_key_set: !!process.env.OPENAI_API_KEY,
      gemini_key_set: !!process.env.GEMINI_API_KEY,
      model:
        provider?.name === "openai"
          ? process.env.OPENAI_MODEL ?? "gpt-4o (default)"
          : provider?.name === "gemini"
            ? process.env.GEMINI_MODEL ?? "gemini-2.5-pro (default)"
            : null,
    });
  });

  router.post("/generate", async (req, res) => {
    try {
      const {
        playerName,
        position,
        focusAreas,
        targetMinutes,
        intensity,
        coachNotes,
        wearableSnapshot,
      } = req.body as {
        playerName: string;
        position?: string;
        focusAreas: string[];
        targetMinutes: number;
        intensity: "low" | "medium" | "high";
        coachNotes?: string;
        wearableSnapshot?: { recoveryScore?: number; sleepScore?: number; strainScore?: number };
      };

      if (!playerName || !focusAreas?.length || !targetMinutes || !intensity) {
        res.status(400).json({ error: "playerName, focusAreas, targetMinutes, and intensity are required" });
        return;
      }

      const provider = pickGenerator();
      if (!provider) {
        res.status(503).json({
          error: "Workout generation isn't configured — set OPENAI_API_KEY or GEMINI_API_KEY.",
        });
        return;
      }

      const result = await provider.fn({
        playerName,
        position,
        focusAreas,
        targetMinutes: Math.min(Math.max(targetMinutes, 15), 120),
        intensity,
        coachNotes,
        wearableSnapshot,
      });

      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const status = (err as { status?: number }).status ?? 500;
      console.error("[WOD generate]", message);
      res.status(status).json({ error: message });
    }
  });
}
