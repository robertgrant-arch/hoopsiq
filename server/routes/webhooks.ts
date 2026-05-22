// ─────────────────────────────────────────────────────────────
// HoopsIQ — Webhook routes
// ─────────────────────────────────────────────────────────────
//
// IMPORTANT: This router must be mounted BEFORE express.json() middleware
// so that the raw request body is available for signature verification.
// See server/index.ts.

import { createHmac, timingSafeEqual } from "crypto";
import express, { type Router } from "express";
import { DbFilmAnalysisService } from "../modules/film-analysis/service";

export function registerWebhookRoutes(router: Router): void {
  // Mux delivers a JSON body but we need the raw bytes to verify the HMAC
  // signature, so we use express.raw() here instead of express.json().
  router.post(
    "/mux",
    express.raw({ type: "application/json" }),
    async (req, res, next) => {
      try {
        const sigHeader = req.headers["mux-signature"] as string | undefined;

        // Verify HMAC signature when a signing secret is configured.
        if (process.env.MUX_WEBHOOK_SIGNING_SECRET && sigHeader) {
          const parts = sigHeader.split(",");
          const tPart = parts.find((p) => p.startsWith("t="));
          const v1Part = parts.find((p) => p.startsWith("v1="));

          if (!tPart || !v1Part) {
            res.status(401).json({ error: "Malformed Mux-Signature header" });
            return;
          }

          const timestamp = tPart.slice(2);
          const received = v1Part.slice(3);

          const expected = createHmac(
            "sha256",
            process.env.MUX_WEBHOOK_SIGNING_SECRET,
          )
            .update(`${timestamp}.${req.body}`)
            .digest("hex");

          // Constant-time comparison to prevent timing attacks.
          let valid = false;
          try {
            valid = timingSafeEqual(
              Buffer.from(expected),
              Buffer.from(received),
            );
          } catch {
            // Buffers of different length throw — treat as invalid.
            valid = false;
          }

          if (!valid) {
            res.status(401).json({ error: "Invalid Mux webhook signature" });
            return;
          }
        }

        const body = Buffer.isBuffer(req.body)
          ? req.body.toString("utf8")
          : String(req.body);

        const event = JSON.parse(body) as {
          type: string;
          data: Record<string, unknown>;
        };

        const service = new DbFilmAnalysisService();

        if (event.type === "video.asset.ready") {
          await service.handleMuxWebhook(event);
        }

        res.json({ received: true });
      } catch (err) {
        next(err);
      }
    },
  );
}
