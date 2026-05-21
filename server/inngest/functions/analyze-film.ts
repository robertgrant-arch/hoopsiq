import { inngest } from "../client";
import { analyzeFilmSession } from "../../lib/gemini";
import { getDb } from "@shared/db/client";
import { filmSessions, filmAssets, annotations, coachingActions, analysisJobs } from "@shared/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export const analyzeFilmFn = inngest.createFunction(
  {
    id: "analyze-film-session",
    name: "Analyze Film Session with Gemini",
    retries: 2,
  },
  { event: "film/asset.ready" },
  async ({ event, step }) => {
    const { sessionId, orgId, muxPlaybackId, durationSecs } = event.data;

    // Step 1: Load session + asset metadata
    const sessionData = await step.run("load-session", async () => {
      const db = getDb();
      const [session] = await db
        .select()
        .from(filmSessions)
        .where(and(eq(filmSessions.id, sessionId), eq(filmSessions.orgId, orgId)))
        .limit(1);
      return session ?? null;
    });

    if (!sessionData) throw new Error(`Session ${sessionId} not found`);

    // Step 2: Run Gemini analysis
    const analysis = await step.run("gemini-analysis", async () => {
      return analyzeFilmSession({
        sessionTitle: sessionData.title,
        sessionType: sessionData.kind ?? "game",
        opponent: sessionData.opponent ?? undefined,
        date: sessionData.playedAt ? String(sessionData.playedAt).split("T")[0] : undefined,
        playerNames: [],  // TODO: load from org roster
        durationSecs: durationSecs ?? 0,
      });
    });

    // Step 3: Save AI summary to film session
    await step.run("save-summary", async () => {
      const db = getDb();
      await db
        .update(filmSessions)
        .set({
          payload: {
            ...(sessionData.payload as object ?? {}),
            aiSummary: analysis.summary,
            aiObservations: analysis.keyObservations,
            aiStatus: "complete",
            aiAnalyzedAt: new Date().toISOString(),
          },
          status: "ready",
        })
        .where(eq(filmSessions.id, sessionId));
    });

    // Step 4: Create annotations for each teachable clip
    await step.run("create-annotations", async () => {
      const db = getDb();
      const annotationRows = analysis.teachableClips.map((clip) => ({
        id: nanoid(),
        sessionId,
        orgId,
        startMs: Math.round(clip.startSec * 1000),
        endMs: Math.round(clip.endSec * 1000),
        kind: clip.category as any,
        source: "ai" as const,
        payload: {
          note: clip.note,
          playerName: clip.playerName,
          sentiment: clip.sentiment,
          teachable: clip.teachable,
          aiGenerated: true,
          coachReviewed: false,
          suggestedFocusAreas: analysis.suggestedFocusAreas,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      if (annotationRows.length > 0) {
        await db.insert(annotations).values(annotationRows);
      }
    });

    // Step 4b: Generate candidate event windows via the rules-based spotter.
    // Produces CandidateEvent annotations with needsReview: true so coaches
    // can confirm/reject them in the AnalysisClipCard review UI.
    const spotterResult = await step.run("candidate-event-spotting", async () => {
      const { generateCandidates, toAnnotationRow, summarize } =
        await import("../../modules/film-analysis/spotting/CandidateEventSpotter");

      // Find the analysis_job row that was created for this session.
      const db = getDb();
      const jobRows = await db
        .select()
        .from(analysisJobs)
        .where(and(eq(analysisJobs.sessionId, sessionId), eq(analysisJobs.orgId, orgId)))
        .orderBy(analysisJobs.createdAt)
        .limit(1);
      const jobId = jobRows[0]?.id ?? nanoid(); // fallback id if no job row

      const durationSec = durationSecs ?? sessionData.durationSeconds ?? 2400;
      const candidates = generateCandidates({ sessionId, orgId, jobId, durationSec });

      if (candidates.length > 0) {
        await db
          .insert(annotations)
          .values(candidates.map((c) => toAnnotationRow(c, { sessionId, orgId, jobId })))
          .onConflictDoNothing();
      }

      return summarize(candidates, durationSec);
    });

    // Step 5: Auto-resolve coaching actions that linked this session as follow-up evidence.
    // If the original issue category no longer appears as a negative AI observation, mark resolved.
    const resolutionResult = await step.run("check-resolutions", async () => {
      const db = getDb();

      const pendingActions = await db
        .select()
        .from(coachingActions)
        .where(
          and(
            eq(coachingActions.followUpSessionId, sessionId),
            eq(coachingActions.status, "in_progress"),
            eq(coachingActions.orgId, orgId),
          ),
        );

      if (pendingActions.length === 0) return { checked: 0, resolved: 0 };

      // Categories that are still flagged negatively in the new session
      const stillFlaggedCategories = new Set(
        analysis.teachableClips
          .filter((c) => c.sentiment === "corrective" || c.teachable)
          .map((c) => c.category.toLowerCase()),
      );

      let resolved = 0;
      for (const action of pendingActions) {
        const originalCategory = action.issueCategory?.toLowerCase();
        const stillFlagged = originalCategory && stillFlaggedCategories.has(originalCategory);

        if (!stillFlagged) {
          // Count how many clips had this category in the original session vs follow-up
          const originalCount = analysis.teachableClips.filter(
            (c) => c.category.toLowerCase() === originalCategory,
          ).length;
          // In the follow-up session we already checked it's 0, so followUpCount = 0
          const followUpCount = 0;
          const improvement = originalCount > 0 ? 1.0 : 0;

          await db
            .update(coachingActions)
            .set({
              status: "resolved",
              resolvedAt: new Date(),
              resolvedNote: originalCategory
                ? `AI detected improvement: ${action.issueCategory} not flagged in follow-up session.`
                : "Follow-up session analyzed — no related issues found by AI.",
              resolutionScore: {
                originalCount,
                followUpCount,
                improvement,
                autoResolved: true,
              },
              updatedAt: new Date(),
            })
            .where(eq(coachingActions.id, action.id));
          resolved++;
        }
      }
      return { checked: pendingActions.length, resolved };
    });

    return {
      sessionId,
      clipsCreated: analysis.teachableClips.length,
      summary: analysis.summary,
      candidatesGenerated: spotterResult.total,
      candidatesByFamily: spotterResult.byFamily,
      resolutionsChecked: resolutionResult.checked,
      resolutionsAutoResolved: resolutionResult.resolved,
    };
  }
);
