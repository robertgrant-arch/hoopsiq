// =============================================================================
// server/modules/film-analysis/pipeline/PipelineAdapter.ts
// Provider-agnostic interface for video analysis pipelines.
//
// HoopsIQ does NOT perform computer vision in-process. Each provider (mock,
// internal model, AWS Rekognition Video, Hudl, third-party CV vendor) is
// implemented as an adapter that conforms to this interface.
//
// Selection is driven by env: VIDEO_PIPELINE_PROVIDER=mock|internal_v1|...
// =============================================================================

import type {
  PipelineJobInput,
  PipelineStatusResponse,
  PipelineResults,
} from "../../../../shared/film-analysis/types";

/**
 * VideoPipelineAdapter
 * -------------------------------------------------------------------------
 * Implementations MUST be stateless across requests (any per-job state lives
 * in the provider's own backend or in our DB). All methods return Promises
 * and MUST NOT block the Express event loop.
 */
export interface VideoPipelineAdapter {
  /**
   * Submit a new analysis job to the provider.
   * @returns the provider's external job ID. Persist this on AnalysisJob.externalJobId.
   */
  submitJob(input: PipelineJobInput): Promise<{ externalJobId: string }>;

  /**
   * Poll current status. Called by the `film.analysis.poll` background worker.
   * Should NOT throw on a still-running job; it should return RUNNING.
   */
  pollStatus(externalJobId: string): Promise<PipelineStatusResponse>;

  /**
   * Fetch all results once status === COMPLETE. Called once, then the rollup
   * job persists results to our normalized tables.
   */
  fetchResults(externalJobId: string): Promise<PipelineResults>;

  /**
   * Cancel a running job (best-effort). Some providers do not support this;
   * implementations may resolve to no-op.
   */
  cancelJob(externalJobId: string): Promise<void>;
}

/**
 * Adapter registry. To add a new provider:
 *  1. Create `./providers/<name>Adapter.ts` exporting a class that implements
 *     VideoPipelineAdapter.
 *  2. Add an entry below.
 *  3. Set VIDEO_PIPELINE_PROVIDER=<name> in the environment.
 */
const ADAPTERS: Record<string, () => Promise<VideoPipelineAdapter>> = {
  mock: () =>
    import("./MockPipelineAdapter").then((m) => new m.MockPipelineAdapter()),
  // internal_v1: () =>
  //   import("./providers/InternalV1Adapter").then(
  //     (m) => new m.InternalV1Adapter()
  //   ),
  // aws_rekognition: () =>
  //   import("./providers/AwsRekognitionAdapter").then(
  //     (m) => new m.AwsRekognitionAdapter()
  //   ),
};

/**
 * Resolve the configured pipeline adapter. Defaults to `mock` for local dev.
 * Throws on an unknown provider so misconfiguration fails fast at boot.
 */
export async function getPipelineAdapter(
  provider: string = process.env.VIDEO_PIPELINE_PROVIDER ?? "mock"
): Promise<VideoPipelineAdapter> {
  const factory = ADAPTERS[provider];
  if (!factory) {
    throw new Error(
      `[film-analysis] Unknown pipeline provider: "${provider}". ` +
        `Valid options: ${Object.keys(ADAPTERS).join(", ")}`
    );
  }
  return factory();
}
