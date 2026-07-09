import { Router } from "express";
import { generateWodResilient } from "../../lib/wod";

export function registerWodRoutes(router: Router) {
  // Diagnostic — reports the provider chain without exposing key values.
  router.get("/health", (_req, res) => {
    const order = (process.env.WOD_PROVIDER_ORDER ?? "openai,gemini")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s === "openai" || s === "gemini");
    const chain = (order.length ? order : ["openai", "gemini"])
      .filter((p) => (p === "openai" ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY))
      .concat("template"); // always the final backstop
    res.json({
      openai_key_set: !!process.env.OPENAI_API_KEY,
      gemini_key_set: !!process.env.GEMINI_API_KEY,
      chain, // e.g. ["openai","gemini","template"] — tried in this order
      model:
        chain[0] === "openai"
          ? process.env.OPENAI_MODEL ?? "gpt-4o (default)"
          : chain[0] === "gemini"
            ? process.env.GEMINI_MODEL ?? "gemini-2.5-pro (default)"
            : "template (deterministic)",
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

      // Never hard-fails: AI providers are tried in order, then a deterministic
      // template generator. `generatedBy` tells the client which produced it.
      const { result, attempts } = await generateWodResilient({
        playerName,
        position,
        focusAreas,
        targetMinutes: Math.min(Math.max(targetMinutes, 15), 120),
        intensity,
        coachNotes,
        wearableSnapshot,
      });

      if (attempts.some((a) => a.provider !== "template" && !a.ok)) {
        console.warn("[WOD generate] provider fallbacks:", JSON.stringify(attempts));
      }
      res.json(result);
    } catch (err: unknown) {
      // Should be unreachable — the template backstop can't throw — but stay safe.
      const message = err instanceof Error ? err.message : String(err);
      console.error("[WOD generate]", message);
      res.status(500).json({ error: message });
    }
  });
}
