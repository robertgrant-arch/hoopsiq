// ─────────────────────────────────────────────────────────────
// HoopsOS — Film AI Analysis: API Route Scaffolding (Phase 3)
// ─────────────────────────────────────────────────────────────
//
// Routes are namespaced under /api/film-analysis. Tenant scope comes from
// requireOrg(req) (Clerk session + org_members). Team scope uses the
// x-hoops-team-id header or session claims teamId / team_id.
// ─────────────────────────────────────────────────────────────

import type { NextFunction, Request, Response, Router } from "express";
import type {
  InitiateUploadRequest,
  CreateSessionRequest,
  SubmitReviewRequest,
  CreateExportRequest,
  EventsQueryParams,
} from "../../../shared/film-analysis/types";

import { HttpError, requireOrg } from "../../auth/tenant";
import type { FilmAnalysisService } from "./service";
import { createRepository } from "@shared/db";

function handleError(
  err: unknown,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  // Catch known misconfiguration errors and return a 503 instead of letting
  // them propagate to Express's default error handler (which returns 500 with
  // an HTML body). This covers DATABASE_URL, MUX_TOKEN_ID, GEMINI_API_KEY, etc.
  if (err instanceof Error) {
    const msg = err.message ?? "";
    if (
      msg.includes("DATABASE_URL") ||
      msg.includes("not set") ||
      msg.includes("not configured")
    ) {
      res.status(503).json({ error: "Service is not fully configured in this environment." });
      return;
    }
  }
  next(err);
}

export function registerFilmAnalysisRoutes(
  router: Router,
  service: FilmAnalysisService,
): void {
  router.post(
    "/uploads/initiate",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const body: InitiateUploadRequest = req.body;

        const result = await service.initiateUpload({
          ...body,
          orgId,
          teamId,
          createdBy: userId,
        });

        // If this upload is a re-upload resolving an open coaching action,
        // move that action to in_progress and link the new session as evidence.
        if (body.resolvesActionId) {
          const repo = createRepository({ orgId, userId });
          await repo.coachingActions.updateStatus(body.resolvesActionId, "in_progress", {
            followUpSessionId: result.assetId,
          });
        }

        res.status(201).json(result);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.post(
    "/sessions",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const body: CreateSessionRequest = req.body;

        const session = await service.createSession({
          ...body,
          orgId,
          teamId,
          createdBy: userId,
        });

        res.status(201).json(session);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.get(
    "/sessions",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const sessions = await service.listSessions(orgId, teamId);
        res.json(sessions);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.get(
    "/sessions/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const session = await service.getSessionDetail(
          orgId,
          teamId,
          req.params.id,
        );
        if (!session)
          return res.status(404).json({ error: "Session not found" });
        res.json(session);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.get(
    "/sessions/:id/jobs/latest",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const job = await service.getLatestJob(orgId, teamId, req.params.id);
        if (!job)
          return res.status(404).json({ error: "No analysis job found" });
        res.json(job);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.post(
    "/sessions/:id/jobs",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const job = await service.triggerAnalysis(
          orgId,
          teamId,
          req.params.id,
          userId,
          req.body,
        );
        res.status(202).json(job);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.get(
    "/sessions/:id/stats/team",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const stats = await service.getTeamStats(orgId, teamId, req.params.id);
        if (!stats)
          return res.status(404).json({ error: "Stats not available" });
        res.json(stats);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.get(
    "/sessions/:id/stats/players",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const stats = await service.getPlayerStats(
          orgId,
          teamId,
          req.params.id,
        );
        res.json(stats);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.get(
    "/sessions/:id/events",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const query: EventsQueryParams = {
          playerId: req.query.playerId as string | undefined,
          period: req.query.period as string | undefined,
          eventType: req.query.eventType as EventsQueryParams["eventType"],
          minConfidence: req.query.minConfidence
            ? Number(req.query.minConfidence)
            : undefined,
          needsReview:
            req.query.needsReview === "true"
              ? true
              : req.query.needsReview === "false"
                ? false
                : undefined,
          page: req.query.page ? Number(req.query.page) : undefined,
          limit: req.query.limit ? Number(req.query.limit) : undefined,
        };
        const events = await service.getEvents(
          orgId,
          teamId,
          req.params.id,
          query,
        );
        res.json(events);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.get(
    "/sessions/:id/highlights",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const highlights = await service.getHighlights(
          orgId,
          teamId,
          req.params.id,
        );
        res.json(highlights);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.post(
    "/highlights/clips",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const clip = await service.approveClip(
          orgId,
          teamId,
          userId,
          req.body,
        );
        res.status(201).json(clip);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.post(
    "/highlights/reels",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const reel = await service.upsertReel(
          orgId,
          teamId,
          userId,
          req.body,
        );
        res.status(201).json(reel);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.post(
    "/review/decisions",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const sessionId =
          (req.query.sessionId as string | undefined) ??
          (req.body.sessionId as string | undefined);
        const body = {
          ...req.body,
          sessionId,
        } as SubmitReviewRequest & { sessionId?: string };
        const decision = await service.submitReview(
          orgId,
          teamId,
          userId,
          body,
        );
        res.status(201).json(decision);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  // List all annotations for a session — used for telestration playback and clip overlays
  router.get(
    "/sessions/:id/annotations",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, userId } = await requireOrg(req);
        const repo = createRepository({ orgId, userId });
        const kind = req.query.kind as string | undefined;
        const all = await repo.annotations.listForSession(req.params.id);
        const filtered = kind ? all.filter((a: any) => a.kind === kind) : all;
        res.json(filtered);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  // Create a coach annotation on a session (including telestration strokes)
  router.post(
    "/sessions/:id/annotations",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, userId } = await requireOrg(req);
        const repo = createRepository({ orgId, userId });
        const { kind, startMs, endMs, label, body, data, payload } = req.body as {
          kind: string;
          startMs: number;
          endMs?: number;
          label?: string;
          body?: string;
          data?: Record<string, unknown>;
          payload?: Record<string, unknown>;
        };
        if (!kind || startMs == null) {
          return res.status(400).json({ error: "kind and startMs are required" });
        }
        const annotation = await repo.annotations.create({
          sessionId: req.params.id,
          kind: kind as any,
          source: "coach",
          authorUserId: userId,
          startMs,
          endMs: endMs ?? null,
          label: label ?? null,
          body: body ?? null,
          data: data ?? {},
          payload: payload ?? {},
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        res.status(201).json(annotation);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.post(
    "/exports",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const sessionId =
          (req.query.sessionId as string | undefined) ??
          (req.body.sessionId as string | undefined);
        const body = {
          ...req.body,
          sessionId,
        } as CreateExportRequest & { sessionId?: string };
        const exportReq = await service.requestExport(
          orgId,
          teamId,
          userId,
          body,
        );
        res.status(202).json(exportReq);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  // ── Candidate clip routes (features/film-analysis slice) ──────────────────
  //
  // Clips are spotter-generated annotation rows whose data.eventType is set.
  // Review decisions are stored in data.coachDecision on the same row.
  //
  // GET  /sessions/:sessionId/clips    — AnalysisClip[] with live coachDecision
  // GET  /sessions/:sessionId/summary  — SessionAnalysisSummary aggregate counts
  // POST /clips/:clipId/review         — persists coach decision to annotation row

  // ── DetectedEventType → BoundedEventType ──────────────────────────────────
  const DET_TO_BOUNDED: Record<string, string> = {
    make_2:      "shot_made_2",
    miss_2:      "shot_missed_2",
    make_3:      "shot_made_3",
    miss_3:      "shot_missed_3",
    ft_make:     "free_throw_made",
    ft_miss:     "free_throw_missed",
    drive:       "drive_right",
    pass:        "pass_completed",
    turnover:    "turnover_live_ball",
    steal:       "steal",
    block:       "block",
    rebound_off: "transition_offense",
    rebound_def: "transition_defense",
  };

  function fmtMs(ms: number): string {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  function confTier(c: number): "high" | "medium" | "low" {
    return c >= 0.85 ? "high" : c >= 0.60 ? "medium" : "low";
  }

  // ── AnalysisStatus derivation ──────────────────────────────────────────────
  // Maps the review decision status to the pipeline lifecycle state the UI shows.
  function deriveAnalysisStatus(
    decisionStatus: string | null | undefined,
  ): string {
    switch (decisionStatus) {
      case "confirmed":
      case "flagged_for_teaching": return "approved";
      case "edited":               return "corrected";
      case "rejected":             return "rejected";
      case "uncertain":            return "needs_review";
      default:                     return "needs_review";
    }
  }

  // ── Annotation row → AnalysisClip ─────────────────────────────────────────
  // Reads raw annotation data including data.coachDecision so review state
  // survives the round-trip without a separate join or secondary table.
  // When data.classification is present (set by POST /classify on approved
  // clips), the higher-trust inference from the classifier replaces the
  // spotter output — backward-compatible and purely additive.
  function annotationToClip(
    row: { id: string; sessionId: string; startMs: number; endMs: number | null; data: unknown },
    _teamId: string,
  ) {
    const data = (row.data && typeof row.data === "object" ? row.data : {}) as Record<string, unknown>;
    const rawType  = (data.eventType  as string | undefined) ?? "pass_completed";
    const rawConf  = typeof data.confidence === "number" ? data.confidence : 0;
    const rawNeeds = Boolean(data.needsReview ?? true);
    const endMs    = row.endMs ?? row.startMs + 8_000;

    // Coach decision — stored in data.coachDecision on the same row
    const cd = data.coachDecision as Record<string, unknown> | null | undefined;
    const coachDecision = cd
      ? {
          status:          (cd.status as string) ?? "pending",
          note:            (cd.note as string | null) ?? null,
          editedEventType: (cd.editedEventType as string | null) ?? null,
          reviewedAt:      (cd.reviewedAt as string) ?? new Date().toISOString(),
          reviewedBy:      (cd.reviewedBy as string) ?? "unknown",
        }
      : null;

    // If coach relabelled the event, use their label; otherwise use spotter's
    const effectiveType = (coachDecision?.editedEventType ?? DET_TO_BOUNDED[rawType] ?? "pass_completed") as string;

    // ── Classification upgrade ────────────────────────────────────────────────
    // POST /sessions/:id/classify writes data.classification for each approved
    // clip.  When present, substitute the spotter's weak inference with the
    // classifier's higher-trust output.
    const cls = data.classification as Record<string, unknown> | null | undefined;

    const inferenceEventType = (cls?.eventType ?? effectiveType) as string;
    const inferenceConf      = typeof cls?.confidence === "number" ? cls.confidence : rawConf;
    const inferenceTier      = typeof cls?.tier === "string"
      ? (cls.tier as "high" | "medium" | "low")
      : confTier(inferenceConf);
    const inferenceNeeds     = cls ? false : (rawNeeds && !coachDecision);
    const inferenceEvidence  = Array.isArray(cls?.evidenceItems) && (cls.evidenceItems as unknown[]).length > 0
      ? cls.evidenceItems as Array<{ type: string; description: string; strength: string }>
      : [
          {
            type:        "zone_entry",
            description: "Window identified by rule-based temporal spotter v1. No video frames analyzed.",
            strength:    "weak",
          },
        ];

    // ── Observations ─────────────────────────────────────────────────────────
    // When classified, use the structured observation records that describe
    // what was physically detected — not what it means (that's inference).
    // Unclassified clips fall back to one generic placeholder observation.
    const clsObs = Array.isArray(cls?.observations) && (cls.observations as unknown[]).length > 0
      ? cls.observations as Array<{
          type: string;
          description: string;
          startMs: number;
          endMs: number;
          detectionConfidence: number;
          frameMs?: number;
        }>
      : null;

    const observations = clsObs ?? [
      {
        type:                "player_movement",
        description:         "Candidate window — confirm or reject this event",
        startMs:             row.startMs,
        endMs,
        detectionConfidence: rawConf,
      },
    ];

    return {
      id:                  row.id,
      sessionId:           row.sessionId,
      analysisStatus:      deriveAnalysisStatus(coachDecision?.status),
      startMs:             row.startMs,
      endMs,
      timestamp:           fmtMs(row.startMs),
      primaryPlayerId:     null as null,
      primaryPlayerName:   null as null,
      primaryPlayerJersey: null as null,
      teamSide:            "unknown" as const,
      observations,
      inference: {
        eventType:      inferenceEventType,
        confidence:     inferenceConf,
        tier:           inferenceTier,
        requiresReview: inferenceNeeds,
        evidenceItems:  inferenceEvidence,
      },
      suggestedCoachNote:  null as null,
      linkedSkillCategory: null as null,
      coachDecision,
    };
  }

  // ── Shared query: spotter-candidate annotations for a session ──────────────
  async function loadCandidateRows(
    orgId: string,
    teamId: string,
    sessionId: string,
  ) {
    const session = await createRepository({ orgId, userId: "system" })
      .filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) return null;

    const repo = createRepository({ orgId, userId: "system" });
    const rows = await repo.annotations.listForSession(sessionId);
    // Candidate annotations are identified by data.eventType being set
    return rows.filter((r) => {
      const d = r.data as Record<string, unknown> | null;
      return typeof d?.eventType === "string";
    });
  }

  router.get(
    "/sessions/:sessionId/clips",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const rows = await loadCandidateRows(orgId, teamId, req.params.sessionId);
        if (!rows) return res.status(404).json({ error: "Session not found" });
        res.json(rows.map((r) => annotationToClip(r, teamId)));
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  router.get(
    "/sessions/:sessionId/summary",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const { sessionId } = req.params;
        const rows = await loadCandidateRows(orgId, teamId, sessionId);
        if (!rows) return res.status(404).json({ error: "Session not found" });

        const clips = rows.map((r) => annotationToClip(r, teamId));
        const byEventType: Record<string, number> = {};
        let confirmed = 0;
        for (const c of clips) {
          const t = c.inference.eventType;
          byEventType[t] = (byEventType[t] ?? 0) + 1;
          if (c.coachDecision?.status === "confirmed" || c.coachDecision?.status === "edited") confirmed++;
        }

        res.json({
          sessionId,
          totalClips:       clips.length,
          pendingReview:    clips.filter((c) => !c.coachDecision).length,
          confirmed,
          requiresAttention: clips.filter(
            (c) => c.inference.requiresReview || c.coachDecision?.status === "uncertain",
          ).length,
          byEventType,
          byPlayer:         {},
          analysisVersion:  "rule_based_spotter_v1",
          processedAt:      new Date().toISOString(),
        });
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  // ── GET /sessions/:sessionId/playback-info ────────────────────────────────
  // Returns the Mux playbackId for the session's primary video asset.
  // Used by the clip playback UI to seek the full-game video to a clip window.
  router.get(
    "/sessions/:sessionId/playback-info",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const { sessionId } = req.params;
        const repo = createRepository({ orgId, userId: "system" });
        const session = await repo.filmSessions.getById(sessionId);
        if (!session || !teamScopeMatches(session, teamId)) {
          return res.status(404).json({ error: "Session not found" });
        }
        const assets = await repo.filmAssets.listForSession(sessionId);
        const primary = assets.find((a) => a.kind === "source" && a.status === "ready")
          ?? assets.find((a) => a.kind === "source")
          ?? assets[0]
          ?? null;
        res.json({
          playbackId:  primary?.playbackId  ?? null,
          durationSec: primary?.durationSeconds ?? null,
        });
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );

  // ── PATCH /clips/:clipId/boundaries ───────────────────────────────────────
  // Persists adjusted start/end times for a candidate clip.
  // Previous boundaries are appended to data.boundaryHistory (append-only log).
  router.patch(
    "/clips/:clipId/boundaries",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, userId } = await requireOrg(req);
        const { clipId } = req.params;
        const { startMs, endMs }: { startMs: number; endMs: number } = req.body;

        if (
          !Number.isInteger(startMs) ||
          !Number.isInteger(endMs) ||
          startMs < 0 ||
          endMs <= startMs
        ) {
          return res.status(400).json({
            error: "startMs and endMs must be non-negative integers with endMs > startMs",
          });
        }

        const repo = createRepository({ orgId, userId });
        const annotation = await repo.annotations.getById(clipId);
        if (!annotation) {
          return res.status(404).json({ error: "Clip not found" });
        }

        const currentData = (
          annotation.data && typeof annotation.data === "object" ? annotation.data : {}
        ) as Record<string, unknown>;

        // Append the OLD boundary to history before overwriting
        const boundaryHistory = Array.isArray(currentData.boundaryHistory)
          ? [...(currentData.boundaryHistory as unknown[])]
          : [];
        boundaryHistory.push({
          startMs: annotation.startMs,
          endMs:   annotation.endMs ?? null,
          savedAt: new Date().toISOString(),
          savedBy: userId,
        });

        await repo.annotations.update(clipId, {
          startMs,
          endMs,
          data: { ...currentData, boundaryHistory },
        });

        const updatedAt = new Date().toISOString();
        res.json({ clipId, startMs, endMs, updatedAt, boundaryHistory });
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );


    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const rows = await loadCandidateRows(orgId, teamId, req.params.sessionId);
        if (!rows) return res.status(404).json({ error: "Session not found" });

        // Only statuses that gate downstream analysis.
        // "uncertain" and null (pending) remain in the review queue.
        // "rejected" is excluded — the clip is discarded.
        const APPROVED_STATUSES = new Set([
          "confirmed",
          "edited",
          "flagged_for_teaching",
        ]);

        const approved = rows
          .map((r) => annotationToClip(r, teamId))
          .filter((c) => c.coachDecision && APPROVED_STATUSES.has(c.coachDecision.status));

        res.json(approved);
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );


  // ── POST /sessions/:sessionId/classify ──────────────────────────────────
  router.post(
    "/sessions/:sessionId/classify",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const { sessionId } = req.params;
        const rows = await loadCandidateRows(orgId, teamId, sessionId);
        if (!rows) return res.status(404).json({ error: "Session not found" });
        const APPROVED = new Set(["confirmed", "edited", "flagged_for_teaching"]);
        const { classify } = await import("./classification/ClipClassifier");
        const repo = createRepository({ orgId, userId });
        let classified = 0; let skipped = 0;
        for (const row of rows) {
          const d  = (row.data && typeof row.data === "object" ? row.data : {}) as Record<string, unknown>;
          const cd = d.coachDecision as Record<string, unknown> | null | undefined;
          const status = (cd?.status as string | undefined) ?? null;
          if (!status || !APPROVED.has(status)) { skipped++; continue; }
          const editedType     = cd?.editedEventType as string | null | undefined;
          const rawType        = (d.eventType as string | undefined) ?? "pass_completed";
          const eventType      = (editedType ?? DET_TO_BOUNDED[rawType] ?? "pass_completed") as string;
          const result = classify(row.id, eventType, status, row.startMs, row.endMs ?? row.startMs + 8_000);
          await repo.annotations.update(row.id, { data: { ...d, classification: result } });
          classified++;
        }
        res.json({ sessionId, classified, skipped,
          message: `Classified ${classified} approved clip${classified !== 1 ? "s" : ""}; skipped ${skipped}.` });
      } catch (e) { handleError(e, res, next); }
    },
  );

  router.post(
    "/clips/:clipId/review",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, userId } = await requireOrg(req);
        const { clipId } = req.params;
        const {
          status,
          note,
          editedEventType,
        }: { status: string; note?: string; editedEventType?: string } = req.body;

        const VALID_STATUSES = [
          "confirmed", "edited", "rejected", "flagged_for_teaching", "uncertain",
        ];
        if (!VALID_STATUSES.includes(status)) {
          return res.status(400).json({
            error: `Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(", ")}`,
          });
        }

        const repo = createRepository({ orgId, userId });

        // Load the annotation to verify org scope and get current data
        const annotation = await repo.annotations.getById(clipId);
        if (!annotation) {
          return res.status(404).json({ error: "Clip not found" });
        }

        const currentData = (
          annotation.data && typeof annotation.data === "object" ? annotation.data : {}
        ) as Record<string, unknown>;

        const decision = {
          status,
          note:            note ?? null,
          editedEventType: editedEventType ?? null,
          reviewedAt:      new Date().toISOString(),
          reviewedBy:      userId,
        };

        // Persist: write coachDecision into the annotation's data JSONB field
        await repo.annotations.update(clipId, {
          data: { ...currentData, coachDecision: decision },
        });

        res.json({ clipId, ...decision });
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );
}
