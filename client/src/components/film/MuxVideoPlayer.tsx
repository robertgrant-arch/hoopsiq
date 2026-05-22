// ─────────────────────────────────────────────────────────────
// HoopsIQ — Mux video player wrapper
// ─────────────────────────────────────────────────────────────

import MuxPlayer from "@mux/mux-player-react";

interface MuxVideoPlayerProps {
  playbackId: string;
  startTime?: number;
  className?: string;
  onTimeUpdate?: (currentTime: number) => void;
}

export function MuxVideoPlayer({
  playbackId,
  startTime = 0,
  className,
  onTimeUpdate,
}: MuxVideoPlayerProps) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      startTime={startTime}
      className={className}
      onTimeUpdate={(e) => {
        const video = e.currentTarget as HTMLVideoElement;
        onTimeUpdate?.(video.currentTime);
      }}
      style={{ width: "100%", aspectRatio: "16/9" }}
      streamType="on-demand"
      preload="metadata"
    />
  );
}
