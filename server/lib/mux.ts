// ─────────────────────────────────────────────────────────────
// HoopsIQ — Mux client singleton + helpers
// ─────────────────────────────────────────────────────────────
//
// Lazy-initialised so the server boots in dev without Mux credentials;
// functions throw HttpError (503) at call-time when credentials are missing
// so the error is properly converted to a JSON response instead of a 500.

import Mux from "@mux/mux-node";
import { HttpError } from "../auth/tenant";

let muxClient: Mux | null = null;

export function getMux(): Mux {
  if (!muxClient) {
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      throw new HttpError(
        503,
        "Film upload is not available in this environment. MUX_TOKEN_ID and MUX_TOKEN_SECRET are not configured.",
      );
    }
    muxClient = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
    });
  }
  return muxClient;
}

export async function createDirectUpload(): Promise<{
  uploadId: string;
  uploadUrl: string;
}> {
  const mux = getMux();
  const upload = await mux.video.uploads.create({
    cors_origin: process.env.APP_BASE_URL ?? "*",
    new_asset_settings: {
      playback_policy: ["public"],
      mp4_support: "capped-1080p",
    },
  });
  return { uploadId: upload.id, uploadUrl: upload.url };
}

export async function getAsset(assetId: string) {
  return getMux().video.assets.retrieve(assetId);
}

export async function getPlaybackId(assetId: string): Promise<string | null> {
  const asset = await getMux().video.assets.retrieve(assetId);
  return asset.playback_ids?.[0]?.id ?? null;
}

export function getMuxThumbnailUrl(playbackId: string, time = 0): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}`;
}

export function getMuxStoryboardUrl(playbackId: string): string {
  return `https://image.mux.com/${playbackId}/storyboard.vtt`;
}
