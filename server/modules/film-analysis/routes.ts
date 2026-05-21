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
  // Clips are derived from DetectedEvent annotations written by
  // CandidateEventSpotter. The mapper converts DetectedEvent fields to the
  // AnalysisClip shape the UI (AnalysisClipCard) expects.
  //
  // GET  /sessions/:sessionId/clips    — AnalysisClip[] from spotter candidates
  // GET  /sessions/:sessionId/summary  — SessionAnalysisSummary aggregate counts
  // POST /clips/:clipId/review         — coach decision (confirm/edit/reject/flag)

  // DetectedEventType → BoundedEventType (UI vocabulary)
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

  function eventToClip(event: import("../../../shared/film-analysis/types").DetectedEvent) {
    const boundedType = DET_TO_BOUNDED[event.type] ?? "pass_completed";
    const conf = event.confidence;
    const endMs = event.endMs ?? event.tMs + 8_000;
    return {
      id: event.id,
      sessionId: event.sessionId,
      analysisStatus: "needs_review",
      startMs: event.tMs,
      endMs,
      timestamp: fmtMs(event.tMs),
      primaryPlayerId: event.primaryPlayerId ?? null,
      primaryPlayerName: event.primaryPlayerName ?? null,
      primaryPlayerJersey: null as null,
      teamSide: "unknown" as const,
      observations: [
        {
          type: "player_movement",
          description: "Candidate window — review to confirm or reject this event",
          startMs: event.tMs,
          endMs,
          detectionConfidence: conf,
        },
      ],
      inference: {
        eventType: boundedType,
        confidence: conf,
        tier: confTier(conf),
        requiresReview: event.needsReview,
        evidenceItems: [
          {
            type: "zone_entry",
            description:
              "Window identified by rule-based temporal spotter v1. " +
              "No video frames analyzed — timestamp is an estimate.",
            strength: "weak",
          },
        ],
      },
      suggestedCoachNote: null as null,
      linkedSkillCategory: null as null,
      coachDecision: null as null,
    };
  }

  router.get(
    "/sessions/:sessionId/clips",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const events = await service.getEvents(orgId, teamId, req.params.sessionId, {});
        res.json(events.map(eventToClip));
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
        const events = await service.getEvents(orgId, teamId, sessionId, {});
        const clips = events.map(eventToClip);

        const byEventType: Record<string, number> = {};
        for (const c of clips) {
          const t = c.inference.eventType;
          byEventType[t] = (byEventType[t] ?? 0) + 1;
        }

        res.json({
          sessionId,
          totalClips: clips.length,
          pendingReview: clips.filter((c) => !c.coachDecision).length,
          confirmed: 0,
          requiresAttention: clips.filter(
            (c) => c.inference.requiresReview && !c.coachDecision
          ).length,
          byEventType,
          byPlayer: {},
          analysisVersion: "rule_based_spotter_v1",
          processedAt: new Date().toISOString(),
        });
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
