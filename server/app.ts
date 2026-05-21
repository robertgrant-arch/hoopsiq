import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { registerFilmAnalysisRoutes } from "./modules/film-analysis/routes";
import { DbFilmAnalysisService } from "./modules/film-analysis/service";
import { registerMeRoute } from "./routes/me";
import { registerRosterRoutes } from "./modules/roster/routes";
import { registerAssignmentRoutes } from "./modules/assignments/routes";
import { registerPracticePlanRoutes } from "./modules/practice-plans/routes";
import { registerEventRoutes } from "./modules/events/routes";
import { registerReadinessRoutes } from "./modules/readiness/routes";
import { registerMessagingRoutes } from "./modules/messaging/routes";
import { registerWearableRoutes } from "./modules/wearables/routes";
import { registerWodRoutes } from "./modules/wods/routes";
import { registerCoachingActionRoutes } from "./modules/coaching-actions/routes";
import { registerParentRoutes } from "./modules/parent/routes";
import { registerAnnouncementRoutes } from "./modules/announcements/routes";
import { registerWaiverRoutes } from "./modules/waivers/routes";
import { registerSeasonRoutes } from "./modules/seasons/routes";
import { registerTeamRoutes } from "./modules/teams/routes";
import { registerRegistrationRoutes } from "./modules/registrations/routes";
import { registerInvoiceRoutes } from "./modules/invoices/routes";
import { registerAdminRoutes } from "./modules/admin/routes";
import { registerWebhookRoutes } from "./routes/webhooks";
import { inngest } from "./inngest/client";
import { analyzeFilmFn, readinessAlertFn, attendanceNotifyFn, notifyCoachingActionFn } from "./inngest";

export function createApp() {
  const app = express();

  // Trust the first proxy for accurate req.ip in waiver signatures.
  // Required for X-Forwarded-For to be read correctly behind load balancers
  // (Render, Railway, Heroku, etc.).  Set to the number of trusted proxies
  // in front of the app in production.
  app.set("trust proxy", 1);

  // ── CORS ───────────────────────────────────────────────────────────────────
  // Allow requests from the Vercel frontend and localhost dev servers.
  // APP_BASE_URL should be set to https://hoopsos-docs.vercel.app on Render.
  const allowedOrigins: (string | RegExp)[] = [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
  ];
  if (process.env.APP_BASE_URL) {
    allowedOrigins.push(process.env.APP_BASE_URL);
  }
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );

  // ── Health check ───────────────────────────────────────────────────────────
  // Render uses this to confirm the service is up. Must come before
  // clerkMiddleware so unauthenticated health checks always return 200.
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      db:     !!process.env.DATABASE_URL,
      clerk:  !!process.env.CLERK_SECRET_KEY,
      mux:    !!process.env.MUX_TOKEN_ID,
    });
  });

  // Webhooks MUST be registered before express.json() so express.raw()
  // inside registerWebhookRoutes can capture the raw body for Mux HMAC verification.
  const webhookRouter = express.Router();
  registerWebhookRoutes(webhookRouter);
  app.use("/webhooks", webhookRouter);

  app.use(express.json());
  app.use(clerkMiddleware());

  const filmRouter = express.Router();
  registerFilmAnalysisRoutes(filmRouter, new DbFilmAnalysisService());
  app.use("/api/film-analysis", filmRouter);

  const meRouter = express.Router();
  registerMeRoute(meRouter);
  app.use("/api", meRouter);

  const rosterRouter = express.Router();
  registerRosterRoutes(rosterRouter);
  app.use("/api/roster", rosterRouter);

  const assignmentsRouter = express.Router();
  registerAssignmentRoutes(assignmentsRouter);
  app.use("/api/assignments", assignmentsRouter);

  const practicePlansRouter = express.Router();
  registerPracticePlanRoutes(practicePlansRouter);
  app.use("/api/practice-plans", practicePlansRouter);

  const eventsRouter = express.Router();
  registerEventRoutes(eventsRouter);
  app.use("/api/events", eventsRouter);

  const readinessRouter = express.Router();
  registerReadinessRoutes(readinessRouter);
  app.use("/api/readiness", readinessRouter);

  const messagingRouter = express.Router();
  registerMessagingRoutes(messagingRouter);
  app.use("/api/messages", messagingRouter);

  const wearablesRouter = express.Router();
  registerWearableRoutes(wearablesRouter);
  app.use("/api/wearables", wearablesRouter);

  const wodsRouter = express.Router();
  registerWodRoutes(wodsRouter);
  app.use("/api/wods", wodsRouter);

  const coachingActionsRouter = express.Router();
  registerCoachingActionRoutes(coachingActionsRouter);
  app.use("/api/coaching-actions", coachingActionsRouter);

  // ── New portal-layer routes ────────────────────────────────────────────────

  // Parent portal: all routes gated to role=guardian + parent-child validation
  const parentRouter = express.Router();
  registerParentRoutes(parentRouter);
  app.use("/api/parent", parentRouter);

  // Announcements: role-filtered server-side before response
  const announcementsRouter = express.Router();
  registerAnnouncementRoutes(announcementsRouter);
  app.use("/api/announcements", announcementsRouter);

  // Waivers: IP + UA captured on sign; consent acknowledgement enforced
  const waiversRouter = express.Router();
  registerWaiverRoutes(waiversRouter);
  app.use("/api/waivers", waiversRouter);

  // ── Club Operations Layer ─────────────────────────────────────────────────

  const seasonsRouter = express.Router();
  registerSeasonRoutes(seasonsRouter);
  app.use("/api/seasons", seasonsRouter);

  const teamsRouter = express.Router();
  registerTeamRoutes(teamsRouter);
  app.use("/api/teams", teamsRouter);

  const registrationsRouter = express.Router();
  registerRegistrationRoutes(registrationsRouter);
  app.use("/api/registrations", registrationsRouter);

  const invoicesRouter = express.Router();
  registerInvoiceRoutes(invoicesRouter);
  app.use("/api/invoices", invoicesRouter);

  const adminRouter = express.Router();
  registerAdminRoutes(adminRouter);
  app.use("/api/admin", adminRouter);

  app.use(
    "/api/inngest",
    serve({
      client: inngest,
      functions: [analyzeFilmFn, readinessAlertFn, attendanceNotifyFn, notifyCoachingActionFn],
    }),
  );

  return app;
}
