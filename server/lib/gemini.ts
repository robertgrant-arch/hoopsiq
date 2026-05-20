import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { HttpError } from "../auth/tenant";

let client: GoogleGenerativeAI | null = null;

function getClient() {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new HttpError(
        503,
        "Film analysis is not available in this environment. GEMINI_API_KEY is not configured.",
      );
    }
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return client;
}

const ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    keyObservations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    teachableClips: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          startSec: { type: SchemaType.NUMBER },
          endSec: { type: SchemaType.NUMBER },
          category: { type: SchemaType.STRING },
          playerName: { type: SchemaType.STRING },
          note: { type: SchemaType.STRING },
          sentiment: { type: SchemaType.STRING },
          teachable: { type: SchemaType.BOOLEAN },
        },
        required: ["startSec", "endSec", "category", "note", "sentiment", "teachable"],
      },
    },
    suggestedFocusAreas: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          playerName: { type: SchemaType.STRING },
          category: { type: SchemaType.STRING },
          reasoning: { type: SchemaType.STRING },
        },
        required: ["category", "reasoning"],
      },
    },
  },
  required: ["summary", "keyObservations", "teachableClips"],
};

export interface FilmAnalysisResult {
  summary: string;
  keyObservations: string[];
  teachableClips: Array<{
    startSec: number;
    endSec: number;
    category: string;
    playerName?: string;
    note: string;
    sentiment: "positive" | "corrective" | "neutral";
    teachable: boolean;
  }>;
  suggestedFocusAreas?: Array<{
    playerName?: string;
    category: string;
    reasoning: string;
  }>;
}

export async function analyzeFilmSession(params: {
  sessionTitle: string;
  sessionType: string;
  opponent?: string;
  date?: string;
  playerNames: string[];
  durationSecs: number;
  videoUrl?: string;  // Mux MP4 URL or transcript if available
}): Promise<FilmAnalysisResult> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-pro",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA as any,
    },
  });

  const prompt = buildAnalysisPrompt(params);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text) as FilmAnalysisResult;
}

// ─── WOD Generation ──────────────────────────────────────────────────────────

const WOD_BLOCK_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    theme: { type: SchemaType.STRING },
    rationale: { type: SchemaType.STRING },
    blocks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          block_type: { type: SchemaType.STRING },
          drill_name: { type: SchemaType.STRING },
          minutes: { type: SchemaType.NUMBER },
          coaching_points: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          success_metrics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ["block_type", "drill_name", "minutes", "coaching_points", "success_metrics"],
      },
    },
  },
  required: ["theme", "rationale", "blocks"],
};

export interface WodGenerationResult {
  theme: string;
  rationale: string;
  blocks: Array<{
    block_type: string;
    drill_name: string;
    minutes: number;
    coaching_points: string[];
    success_metrics: string[];
  }>;
}

export async function generateWod(params: {
  playerName: string;
  position?: string;
  focusAreas: string[];
  targetMinutes: number;
  intensity: "low" | "medium" | "high";
  coachNotes?: string;
  wearableSnapshot?: { recoveryScore?: number; sleepScore?: number; strainScore?: number };
}): Promise<WodGenerationResult> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-pro",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: WOD_BLOCK_SCHEMA as any,
    },
  });

  const prompt = buildWodPrompt(params);
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text()) as WodGenerationResult;
}

function buildWodPrompt(params: {
  playerName: string;
  position?: string;
  focusAreas: string[];
  targetMinutes: number;
  intensity: "low" | "medium" | "high";
  coachNotes?: string;
  wearableSnapshot?: { recoveryScore?: number; sleepScore?: number; strainScore?: number };
}) {
  const wearableContext = params.wearableSnapshot
    ? `\nWEARABLE DATA (today):
- Recovery score: ${params.wearableSnapshot.recoveryScore ?? "unknown"}/100
- Sleep score: ${params.wearableSnapshot.sleepScore ?? "unknown"}/100
- Strain: ${params.wearableSnapshot.strainScore ?? "unknown"}
${(params.wearableSnapshot.recoveryScore ?? 100) < 40 ? "NOTE: Player is showing low recovery — reduce volume and avoid high-intensity conditioning." : ""}
${(params.wearableSnapshot.recoveryScore ?? 100) >= 67 ? "NOTE: Player is well-recovered — can handle full intensity." : ""}`
    : "";

  return `You are an elite basketball skills trainer designing a personalized daily workout (WOD) for a player.

PLAYER: ${params.playerName}${params.position ? ` (${params.position})` : ""}
FOCUS AREAS: ${params.focusAreas.join(", ")}
TARGET DURATION: ${params.targetMinutes} minutes total
INTENSITY: ${params.intensity}${wearableContext}
${params.coachNotes ? `\nCOACH NOTES: ${params.coachNotes}` : ""}

BLOCK TYPES available: warmup, skill, shooting, finishing, footwork, defense, conditioning, competitive, recovery

RULES:
- Always start with a warmup block (5-8 min)
- Always end with a recovery block (3-5 min)
- Total block minutes must sum close to ${params.targetMinutes}
- Each block needs 2-3 specific coaching points and 1-2 measurable success metrics
- Drill names should be specific and real (e.g. "Mikan Drill", "1-2-3 Step-Back Series", "Cone Weave Ball Handling")
- Coaching points should be short, actionable cues a coach would actually say
- Success metrics should be measurable (reps, percentages, time)
- Intensity ${params.intensity}: ${params.intensity === "high" ? "high reps, max effort conditioning block" : params.intensity === "low" ? "technical focus, no conditioning block" : "moderate volume, optional conditioning"}

Return a complete WOD with theme, coaching rationale, and all blocks.`;
}

// ─── Film Analysis ────────────────────────────────────────────────────────────

function buildAnalysisPrompt(params: {
  sessionTitle: string;
  sessionType: string;
  opponent?: string;
  date?: string;
  playerNames: string[];
  durationSecs: number;
}) {
  return `You are an expert basketball coaching assistant analyzing game film.

SESSION CONTEXT:
- Title: ${params.sessionTitle}
- Type: ${params.sessionType}
- ${params.opponent ? `Opponent: ${params.opponent}` : ""}
- ${params.date ? `Date: ${params.date}` : ""}
- Players: ${params.playerNames.join(", ") || "Unknown"}
- Duration: ${Math.round(params.durationSecs / 60)} minutes

TASK:
Analyze this basketball film session and return structured coaching intelligence.

For teachableClips, identify moments that coaches should review:
- Mistakes that need correction (sentiment: "corrective")
- Positive examples to reinforce (sentiment: "positive")
- Tactical breakdowns (sentiment: "corrective")
- Great execution worth highlighting (sentiment: "positive")

Categories for clips: offense, defense, finishing, footwork, transition, IQ, conditioning

For keyObservations, provide 4-6 specific, actionable coaching observations.

Return structured JSON following the schema exactly.`;
}
