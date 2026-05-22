# HoopsIQ: AI Feedback Architecture & Scaffolding

This document details the architecture for the HoopsIQ AI feedback feature. It defines the async processing pipeline, the human-in-the-loop (HITL) escalation model, safe product copy, and the youth privacy guardrails necessary for processing athlete video.

## 1. AI Workflow Architecture

The AI analysis pipeline is decoupled from the main web server to ensure performance and reliability.

1.  **Intake:** Athlete uploads a video directly to Mux from the client (bypassing our server).
2.  **Webhook:** Mux fires a `video.asset.ready` webhook to our Next.js backend.
3.  **Queue:** The webhook handler inserts an `AIJob` record into Postgres and pushes a message to the async queue (e.g., Inngest or AWS SQS).
4.  **Worker:** A dedicated worker service (Node.js or Python) picks up the job, fetches the Mux MP4 URL, and passes it to the CV/inference model.
5.  **Analysis Store:** The worker writes the raw JSON output to S3 and inserts structured `AIAnalysis` and `AIAnalysisIssue` records into Postgres.
6.  **Notification:** The worker fires a `DomainEvent` (Outbox pattern), which triggers an in-app notification and push notification to the athlete.
7.  **UI State:** The athlete opens the app and views the processed feedback overlaid on the video player.

## 2. Async Job Design

*   **Queue Choice:** Inngest (or Trigger.dev) is recommended for Next.js App Router compatibility, native retries, and easy local development.
*   **Idempotency:** The Mux `asset_id` serves as the idempotency key. If Mux fires duplicate webhooks, the queue drops the duplicate.
*   **Retry Semantics:** Exponential backoff (e.g., 3 retries: 1m, 5m, 15m). If the inference API times out, it retries.
*   **Poison-Message Handling:** After max retries, the `AIJob` is marked `FAILED`. The athlete's UI updates from "Processing" to "Analysis Failed," with a prompt to retry or request a manual coach review.
*   **Progress Events:** The worker emits `progress` events (e.g., `25%`, `50%`) which are synced to the UI via Server-Sent Events (SSE) or optimistic polling.

## 3. Schema Confirmations

Building on the schema from Prompt 3, we ensure the following structures exist:

*   `AIJob`: Tracks the queue state (`id`, `uploadId`, `status: QUEUED | PROCESSING | COMPLETED | FAILED`, `modelId`, `startedAt`, `completedAt`).
*   `AIAnalysis`: The root result (`id`, `uploadId`, `overallScore`, `rawJsonS3Key`).
*   `AIAnalysisIssue`: Specific findings (`id`, `analysisId`, `timestampSec`, `category: JUMPSHOT | POSTURE | FOOTWORK | AGILITY`, `severity: LOW | MEDIUM | HIGH`, `confidence`, `message`, `suggestedDrillIds[]`).
*   `AIModelVersion`: Tracks which model produced the result (`id`, `version`, `description`) for A/B testing and rollback.

## 4. API / Contract Shapes (Zod)

These Zod schemas define the strict contract between the worker and the database.

```typescript
import { z } from "zod";

export const ObservationSchema = z.object({
  timestampSec: z.number().min(0),
  category: z.enum(["JUMPSHOT", "POSTURE", "FOOTWORK", "AGILITY"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  confidence: z.number().min(0).max(1), // 0.0 to 1.0
  message: z.string().min(10).max(255),
  suggestedDrillIds: z.array(z.string()).optional(),
});

export const AnalysisResultSchema = z.object({
  uploadId: z.string(),
  modelVersion: z.string(),
  overallScore: z.number().min(0).max(100).optional(),
  observations: z.array(ObservationSchema),
  rawOutputS3Key: z.string(), // Pointer to full pose-estimation JSON
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type Observation = z.infer<typeof ObservationSchema>;
```

## 5. UI States

The UI must gracefully handle the async nature of video processing.

1.  **Queued:** "Video uploaded. Waiting for AI analysis engine..." (Spinner icon).
2.  **Processing:** "Analyzing mechanics..." (Progress bar, potentially showing fake steps like "Tracking joints", "Calculating release angle" to reduce perceived wait time).
3.  **Ready:** "Analysis complete." (Shows the `AIAnalysisIssue` list next to the video player).
4.  **Low-Confidence (Escalate):** "We detected some complex movements. Request a coach review for precise feedback." (Triggered if avg `confidence` < 0.6).
5.  **Escalated:** "Sent to Coach Smith for review." (AI results are hidden or muted until the coach signs off).
6.  **Expert-Reviewed:** "Reviewed by Coach Smith." (Coach's comments are prioritized; AI observations are marked as "Verified").

## 6. Frontend Scaffolding

Below is the Next.js scaffolding for the upload flow and the feedback view, implementing optimistic polling and safe state handling.

### `src/app/(app)/(player)/uploads/page.tsx` (Upload Flow)

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadCloudIcon, Loader2Icon } from "lucide-react";
// Assumes a custom hook wrapping Mux direct upload logic
import { useMuxUpload } from "@/hooks/use-mux-upload"; 

export default function UploadVideoPage() {
  const router = useRouter();
  const { upload, isUploading, progress } = useMuxUpload();
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      // 1. Upload directly to Mux (returns the Mux asset ID)
      const uploadId = await upload(file);
      
      // 2. Tell our server to track this upload and enqueue the AI job
      const response = await fetch("/api/uploads/register", {
        method: "POST",
        body: JSON.stringify({ uploadId, filename: file.name }),
        headers: { "Content-Type": "application/json" }
      });
      
      if (response.ok) {
        // 3. Redirect to the feedback view (which will show the "Processing" state)
        router.push(`/uploads/${uploadId}/ai-feedback`);
      }
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  return (
    <div className="container max-w-2xl py-12">
      <h1 className="font-heading text-h2 uppercase mb-8">Upload Film</h1>
      <Card className="p-12 border-dashed border-2 border-border flex flex-col items-center justify-center text-center">
        <UploadCloudIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">Drag and drop your video here</p>
        <p className="text-sm text-muted-foreground mb-8">MP4 or MOV, up to 500MB.</p>
        
        <input 
          type="file" 
          accept="video/mp4,video/quicktime" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4"
        />

        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          className="w-full shadow-glow-primary"
        >
          {isUploading ? (
            <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Uploading ({progress}%)</>
          ) : (
            "Analyze Mechanics"
          )}
        </Button>
      </Card>
    </div>
  );
}
```

### `src/app/(app)/(player)/uploads/[id]/ai-feedback/page.tsx` (Feedback View)

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";
// Assumes a custom SWR hook that polls the /api/analysis/[id] endpoint
import { useAnalysisStatus } from "@/hooks/use-analysis-status";
import { TelestrationCanvas } from "@/components/coach/telestration-canvas";

export default function AIFeedbackPage() {
  const params = useParams();
  const uploadId = params.id as string;
  const { data, isLoading, isError } = useAnalysisStatus(uploadId);

  if (isLoading) return <div className="p-12 text-center"><Loader2Icon className="animate-spin h-8 w-8 mx-auto" /></div>;
  if (isError) return <div className="p-12 text-center text-destructive">Failed to load analysis status.</div>;

  const { status, videoUrl, observations, coachReviewed } = data;

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-h2 uppercase">Mechanics Breakdown</h1>
        {status === "COMPLETED" && !coachReviewed && (
          <Button variant="outline" size="sm">
            <AlertTriangleIcon className="mr-2 h-4 w-4" /> Request Coach Review
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Video Player */}
        <div className="lg:col-span-2">
          <div className="bg-black rounded-lg overflow-hidden border border-border aspect-video relative">
            {/* If processing, show an overlay */}
            {status === "PROCESSING" && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
                <Loader2Icon className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="font-heading text-xl text-white uppercase tracking-widest animate-pulse">
                  Analyzing Biomechanics...
                </p>
                <p className="text-sm text-muted-foreground mt-2">This usually takes about 60 seconds.</p>
              </div>
            )}
            <TelestrationCanvas videoUrl={videoUrl} readOnly />
          </div>
        </div>

        {/* Right: AI Observations Panel */}
        <div className="space-y-4">
          <h3 className="font-heading text-xl uppercase border-b border-border pb-2">
            AI Observations
          </h3>
          
          {status === "PROCESSING" ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-zinc-900 animate-pulse rounded-md border border-white/5" />
              ))}
            </div>
          ) : status === "FAILED" ? (
             <Card className="p-6 border-destructive/50 bg-destructive/10 text-center">
               <AlertTriangleIcon className="h-8 w-8 text-destructive mx-auto mb-2" />
               <p className="font-medium text-destructive">Analysis failed.</p>
               <p className="text-sm text-muted-foreground mt-1">The video quality may be too low for the AI to track joints accurately.</p>
               <Button variant="outline" className="mt-4 w-full">Request Coach Review</Button>
             </Card>
          ) : (
            <div className="space-y-4">
              {coachReviewed && (
                <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-md flex items-start gap-3">
                  <CheckCircle2Icon className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-500">Verified by Coach Smith</p>
                    <p className="text-xs text-muted-foreground">The AI observations below have been reviewed and confirmed.</p>
                  </div>
                </div>
              )}
              
              {observations.map((obs: any, i: number) => (
                <Card key={i} className="p-4 border-white/10 bg-zinc-900 hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded text-primary">
                      [{new Date(obs.timestampSec * 1000).toISOString().substr(14, 5)}]
                    </span>
                    <span className={`text-xs uppercase font-bold tracking-wider ${
                      obs.severity === "HIGH" ? "text-destructive" : obs.severity === "MEDIUM" ? "text-warning" : "text-muted-foreground"
                    }`}>
                      {obs.category}
                    </span>
                  </div>
                  <p className="text-sm">{obs.message}</p>
                  {/* Note: The copy here must be safe (see Section 7) */}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## 7. Safe Product Copy

AI in sports performance must never overclaim certainty, as incorrect mechanical advice can cause injury.

*   **Bad (Overclaiming):** "Your release angle is wrong. You must bend your knees 15 degrees more to fix your shot."
*   **Good (Observational):** "The AI detected a lower-than-average release point on this repetition. Consider reviewing this frame with your coach."
*   **Bad (Diagnostic):** "You have poor ankle mobility."
*   **Good (Descriptive):** "We observed a narrow base upon landing. A wider stance typically improves balance."
*   **Disclaimer Banner (Always visible near AI results):** "AI feedback is designed to highlight mechanical patterns, not diagnose physical limitations. Always consult your coach or trainer before making major adjustments."

## 8. Human-in-the-Loop (HITL) Escalation

The AI is an assistant, not a replacement. The escalation path is critical for trust and monetization.

*   **Auto-Escalation (Low Confidence):** If the inference model returns an average confidence score below `0.6` (e.g., due to poor lighting, occlusion, or complex multi-player drills), the system automatically pauses the AI output. The UI displays: "This drill is too complex for automated feedback. We've routed it to your coaching staff for review."
*   **Manual Escalation (Athlete Request):** If the AI provides feedback, but the athlete is confused or disagrees, they click "Request Coach Review". This flags the `VideoUpload` in the Coach HQ `Queue`.
*   **Expert Marketplace Upsell:** If the athlete does not have a linked team (or their coach is unresponsive), the "Request Review" button opens the `BookingCatalog`, offering a 1:1 film breakdown with a verified Expert for a fee (e.g., "$25 for a detailed telestration breakdown by Coach K").
*   **Coach Confirmation:** When a coach reviews an AI-flagged video in Coach HQ, they see the AI's suggested observations. They can click "Approve," "Edit," or "Delete" on each observation. Once the coach signs off, the athlete's UI updates to show the "Verified by Coach" badge, locking the feedback as canonical.

## 9. Worker Stub (Node.js)

For development, we use a deterministic stub that simulates a CV inference model processing an MP4 file. This allows frontend and backend development to proceed without waiting for the actual PyTorch models to be finalized.

```typescript
import { AnalysisResult, Observation } from "@/lib/contracts/ai";

/**
 * Simulates a computer vision inference pipeline.
 * In production, this would call an external GPU cluster or SageMaker endpoint.
 */
export async function simulateInference(videoUrl: string, uploadId: string): Promise<AnalysisResult> {
  console.log(`[Worker] Starting inference on ${videoUrl}`);
  
  // Simulate 15 seconds of processing time
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Deterministic mock observations based on the uploadId (for predictable testing)
  const mockObservations: Observation[] = [
    {
      timestampSec: 2.5,
      category: "POSTURE",
      severity: "MEDIUM",
      confidence: 0.85,
      message: "Base appears slightly narrow on the catch. Consider widening your stance for better balance.",
      suggestedDrillIds: ["drill_wide_base_catch"]
    },
    {
      timestampSec: 3.1,
      category: "JUMPSHOT",
      severity: "LOW",
      confidence: 0.92,
      message: "Release point is consistent with previous uploads. Good follow-through.",
    }
  ];

  // If uploadId contains "fail", simulate a low-confidence rejection
  if (uploadId.includes("fail")) {
    throw new Error("Inference confidence too low (0.4). Video too dark or occluded.");
  }

  console.log(`[Worker] Inference complete for ${uploadId}`);

  return {
    uploadId,
    modelVersion: "v1.0.0-mock",
    overallScore: 82,
    observations: mockObservations,
    rawOutputS3Key: `s3://hoopsos-ai-raw/${uploadId}/pose-data.json`
  };
}
```

## 10. Observability & Guardrails

Processing video is computationally expensive. We must protect the system from abuse and monitor costs per user.

*   **Cost Guardrails:**
    *   *Player Core Plan:* Limit AI analysis to 10 videos per month. The UI must clearly show "3/10 AI Analyses Used" to prevent surprise exhaustion.
    *   *Team Pro Plan:* Organizations receive a pooled quota (e.g., 500 analyses/month across all rosters).
*   **Rate Limits:**
    *   Enforced at the Next.js API route (`/api/uploads/register`) using Upstash Redis or Vercel KV. Maximum 1 upload per minute per user to prevent spamming the GPU queue.
*   **Logging & Tracing:**
    *   Every step of the async job must emit structured logs (e.g., `[job_id] [upload_id] Mux download started`).
    *   Datadog or Sentry tracing should link the initial upload request, the Mux webhook, and the background worker execution so that a single trace ID covers the entire lifecycle.
*   **Duration Monitoring:**
    *   Set alerts if average processing time exceeds 3 minutes. This indicates the queue is backing up and more workers need to be provisioned.

## 11. Youth Privacy Path (COPPA Compliance)

Handling video of minors (under 13) requires extreme care, especially when sending data to third-party AI vendors.

*   **Consent Gate:**
    *   Before a minor can upload their first video for AI analysis, the system checks the `ParentLink` record.
    *   If no parent is linked, the upload is blocked with a message: "Please ask your parent to link their account to enable AI film analysis."
    *   If a parent is linked, but consent is missing, an email is dispatched to the parent: "Action Required: Approve AI Analysis for [Child's Name]."
*   **Parent Approval Flow:**
    *   The parent logs into `/(parent)/dashboard` and reviews the AI Privacy Addendum.
    *   They must explicitly check a box confirming they understand that their child's video will be processed by automated systems to generate biomechanical feedback.
    *   This consent is logged immutably in the `AuditLog` with their IP address and timestamp.
*   **Data Minimization:**
    *   Minors' videos are *never* used to train base models without a separate, explicit opt-in (which is off by default).
    *   Raw pose-estimation JSON files (`rawOutputS3Key`) for minors are set with a strict 30-day lifecycle expiration policy in S3.
    *   The `AIAnalysisIssue` records (the text feedback) are retained indefinitely for the athlete's progression history, but the underlying video and coordinate data are scrubbed.
