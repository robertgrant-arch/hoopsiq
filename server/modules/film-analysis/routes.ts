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

  // ── Structured analysis clips (features/film-analysis slice) ─────────────
  //
  // GET  /sessions/:sessionId/clips   — returns AnalysisClip[] for a session
  // POST /clips/:clipId/review        — records coach decision
  //
  // These endpoints serve the bounded, evidence-backed analysis layer.
  // Responses are structured AnalysisClip objects, not free-form prose.
  // Until the CV pipeline emits real clips, we serve the structured mock
  // so the UI hooks have a real route to call.

  router.get(
    "/sessions/:sessionId/clips",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await requireOrg(req);
        const { sessionId } = req.params;

        // When real CV pipeline is wired:
        //   const clips = await service.getStructuredClips(sessionId, orgId, teamId);
        // For now: import mock and filter by sessionId

        const { MOCK_ANALYSIS_CLIPS } = await import(
          // Dynamic import keeps this from being bundled into the main build
          "../../client/src/features/film-analysis/mock" as any
        ).catch(() => ({ MOCK_ANALYSIS_CLIPS: [] }));

        const clips = Array.isArray(MOCK_ANALYSIS_CLIPS)
          ? MOCK_ANALYSIS_CLIPS.filter(
              (c: any) => !sessionId || c.sessionId === sessionId || sessionId === "session_001"
            )
          : [];

        res.json(clips);
      } catch (e) {
        handleError(e, res, next);
      }
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

        // Validate status against allowed coach review values
        const VALID_STATUSES = [
          "confirmed", "edited", "rejected", "flagged_for_teaching",
        ];
        if (!VALID_STATUSES.includes(status)) {
          res.status(400).json({ error: `Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(", ")}` });
          return;
        }

        // When persistence is wired:
        //   await service.recordCoachDecision(clipId, orgId, userId, { status, note, editedEventType });

        // For now: acknowledge optimistically (the client already applied the update)
        res.json({
          clipId,
          status,
          note: note ?? null,
          editedEventType: editedEventType ?? null,
          reviewedAt: new Date().toISOString(),
          reviewedBy: userId,
        });
      } catch (e) {
        handleError(e, res, next);
      }
    },
  );
}
