/**
 * FilmAnalysisPages.tsx
 *
 * Coach-facing Film AI Analysis frontend module for HoopsOS.
 * Layered into the existing Coach HQ pages folder.
 *
 * Uses wouter (the router used by the rest of this app) — see App.tsx.
 *
 * Exports route-level page components:
 *   - FilmRoomPage         (list of sessions, upload entry point)
 *   - FilmUploadPage       (conceptual upload + ingest trigger)
 *   - FilmSessionPage      (single session: status, team stats, timeline)
 *   - PlayerHighlightsPage (player-facing highlight reel surface)
 *
 * Data is sourced from the shared mock layer via the useFilmAnalysis hook.
 */

import * as React from "react";
import { Link, useLocation, useRoute } from "wouter";
import * as UpChunk from "@mux/upchunk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFilmAnalysis } from "@/hooks/useFilmAnalysis";
import type {
  FilmSession,
  FilmSessionStatus,
  TimelineEvent,
  PlayerHighlight,
  TeamGameStats,
} from "@shared/film-analysis/mock";

/* ---------- helpers ---------- */

const statusColor: Record<FilmSessionStatus, string> = {
  uploaded: "bg-slate-500",
  queued: "bg-amber-500",
  processing: "bg-blue-500",
  ready: "bg-emerald-500",
  failed: "bg-red-500",
};

function StatusBadge({ status }: { status: FilmSessionStatus }) {
  return (
    <Badge className={`${statusColor[status]} text-white capitalize`}>
      {status}
    </Badge>
  );
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ---------- FilmRoomPage ---------- */

export function FilmRoomPage() {
  const { sessions, isLoading } = useFilmAnalysis();
  const [, setLocation] = useLocation();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Film Room</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered film analysis. Upload game film and get team & player
            insights, timeline events, and highlight reels.
          </p>
        </div>
        <Button onClick={() => setLocation("/app/coach/film/upload")}>
          Upload Film
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading sessions…</div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No film sessions yet. Upload your first game film to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session }: { session: FilmSession }) {
  return (
    <Link href={`/app/coach/film/sessions/${session.id}`}>
      <a>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base truncate">{session.title}</CardTitle>
            <StatusBadge status={session.status} />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {new Date(session.gameDate).toLocaleDateString()} ·{" "}
              {session.opponent ?? "Practice"}
            </div>
            {session.status === "processing" && (
              <Progress value={session.progressPct ?? 0} />
            )}
            <div className="text-xs text-muted-foreground">
              {session.durationSec ? formatClock(session.durationSec) : "—"} duration
            </div>
          </CardContent>
        </Card>
      </a>
    </Link>
  );
}

/* ---------- FilmUploadPage ---------- */

type UploadPhase = "idle" | "uploading" | "processing" | "done";

export function FilmUploadPage() {
  const [, setLocation] = useLocation();

  // If coach navigated here from a "Request Re-upload" action, the actionId is
  // in the query string (?resolves=ca_xxx). We pass it to the initiate endpoint
  // so the server can link the new session as follow-up evidence.
  const resolvesActionId = React.useMemo(
    () => new URLSearchParams(window.location.search).get("resolves") ?? undefined,
    [],
  );

  const [title, setTitle] = React.useState("");
  const [opponent, setOpponent] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [phase, setPhase] = React.useState<UploadPhase>("idle");
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Poll for session status once upload is done and Mux is processing.
  React.useEffect(() => {
    if (phase !== "processing" || !sessionId) return;

    let stopped = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/film-analysis/sessions/${sessionId}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { status?: string };
        if (data.status === "ready" && !stopped) {
          stopped = true;
          clearInterval(interval);
          setPhase("done");
          setLocation(`/app/coach/film/sessions/${sessionId}`);
        }
      } catch {
        // ignore transient fetch errors during polling
      }
    }, 3000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [phase, sessionId, setLocation]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    setErrorMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please select a video file.");
      return;
    }

    setErrorMsg(null);
    setPhase("uploading");
    setUploadProgress(0);

    try {
      // 1. Request a Mux direct-upload URL from our server.
      const initiateRes = await fetch("/api/film-analysis/uploads/initiate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || "video/mp4",
          sizeBytes: file.size,
          title,
          opponent,
          ...(resolvesActionId ? { resolvesActionId } : {}),
        }),
      });

      if (!initiateRes.ok) {
        const err = (await initiateRes.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(err.error ?? `Server error ${initiateRes.status}`);
      }

      const { assetId, uploadUrl } = (await initiateRes.json()) as {
        assetId: string;
        uploadUrl: string;
        expiresAt: string;
      };

      setSessionId(assetId); // assetId doubles as the handle we'll poll with

      // 2. Upload the file directly to Mux using UpChunk (chunked, resumable).
      await new Promise<void>((resolve, reject) => {
        const upload = UpChunk.createUpload({
          endpoint: uploadUrl,
          file,
          chunkSize: 5120, // 5 MB chunks
        });

        upload.on("progress", (evt: { detail: number }) => {
          setUploadProgress(Math.round(evt.detail));
        });

        upload.on("success", () => resolve());
        upload.on("error", (evt: { detail: string }) =>
          reject(new Error(evt.detail)),
        );
      });

      // 3. Upload done — Mux is now transcoding. Poll until ready.
      setPhase("processing");
    } catch (err) {
      setPhase("idle");
      setErrorMsg(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
    }
  }

  const isSubmitting = phase === "uploading" || phase === "processing";

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Upload Film</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="vs. Eagles - 11/14"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Opponent</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="Eagles"
                disabled={isSubmitting}
              />
            </div>

            {/* File picker */}
            <div>
              <label className="text-sm font-medium">Video File</label>
              <label
                className={`mt-1 flex flex-col items-center justify-center rounded-md border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                  isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-primary/60"
                }`}
              >
                <input
                  type="file"
                  accept="video/*"
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
                {file ? (
                  <span className="text-sm font-medium truncate max-w-full">
                    {file.name}
                  </span>
                ) : (
                  <>
                    <span className="text-sm text-muted-foreground">
                      Click to select or drag &amp; drop
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      MP4, MOV, MKV — up to 10 GB
                    </span>
                  </>
                )}
              </label>
            </div>

            {/* Upload progress */}
            {phase === "uploading" && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Processing state */}
            {phase === "processing" && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                Processing video… This may take a few minutes. You'll be
                redirected automatically when ready.
              </div>
            )}

            {/* Error */}
            {errorMsg && (
              <div className="rounded-md bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {errorMsg}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !file}
              className="w-full"
            >
              {phase === "uploading"
                ? `Uploading… ${uploadProgress}%`
                : phase === "processing"
                  ? "Processing video…"
                  : "Start Upload"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- FilmSessionPage ---------- */

export function FilmSessionPage() {
  const [, params] = useRoute<{ id: string }>("/app/coach/film/sessions/:id");
  const sessionId = params?.id ?? "";
  const { getSession } = useFilmAnalysis();
  const session = getSession(sessionId);

  if (!session) {
    return <div className="p-6">Session not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{session.title}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(session.gameDate).toLocaleDateString()} ·{" "}
            {session.opponent ?? "Practice"}
          </p>
        </div>
        <StatusBadge status={session.status} />
      </div>

      {session.status === "processing" && (
        <Card>
          <CardContent className="py-4">
            <div className="text-sm mb-2">AI analysis in progress…</div>
            <Progress value={session.progressPct ?? 0} />
          </CardContent>
        </Card>
      )}

      {session.status === "ready" && (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <TeamStatsPanel stats={session.teamStats} />
          </TabsContent>
          <TabsContent value="timeline">
            <TimelinePanel events={session.timeline ?? []} />
          </TabsContent>
          <TabsContent value="players">
            <PlayerStatsPanel session={session} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function TeamStatsPanel({ stats }: { stats?: TeamGameStats }) {
  if (!stats) return <div className="text-muted-foreground">No team stats available.</div>;
  const rows: [string, number | string][] = [
    ["Points", stats.points],
    ["FG%", `${stats.fgPct.toFixed(1)}%`],
    ["3P%", `${stats.threePct.toFixed(1)}%`],
    ["Rebounds", stats.rebounds],
    ["Assists", stats.assists],
    ["Turnovers", stats.turnovers],
    ["Pace", stats.pace.toFixed(1)],
  ];
  return (
    <Card>
      <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-xl font-semibold">{value}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TimelinePanel({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0)
    return <div className="text-muted-foreground">No timeline events.</div>;
  return (
    <div className="space-y-2">
      {events.map((e) => (
        <Card key={e.id}>
          <CardContent className="py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium capitalize">
                {e.type.replace(/_/g, " ")}
              </div>
              <div className="text-xs text-muted-foreground">{e.description}</div>
            </div>
            <div className="text-sm tabular-nums">{formatClock(e.timeSec)}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PlayerStatsPanel({ session }: { session: FilmSession }) {
  const players = session.playerStats ?? [];
  if (players.length === 0)
    return <div className="text-muted-foreground">No player stats available.</div>;
  return (
    <div className="space-y-2">
      {players.map((p) => (
        <Card key={p.playerId}>
          <CardContent className="py-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{p.playerName}</div>
              <div className="text-xs text-muted-foreground">
                {p.minutes} min · {p.points} pts · {p.rebounds} reb · {p.assists} ast
              </div>
            </div>
            <Link href={`/app/player/highlights/${p.playerId}`} asChild>
              <a className="text-sm text-blue-600 hover:underline">
                View highlights →
              </a>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ---------- PlayerHighlightsPage ---------- */

export function PlayerHighlightsPage() {
  const [, params] = useRoute<{ playerId: string }>(
    "/app/player/highlights/:playerId",
  );
  const playerId = params?.playerId ?? "";
  const { getPlayerHighlights } = useFilmAnalysis();
  const highlights = getPlayerHighlights(playerId);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Highlights</h1>
      {highlights.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No highlights yet. Once your coach uploads film, AI-generated
            highlights will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {highlights.map((h) => (
            <HighlightCard key={h.id} highlight={h} />
          ))}
        </div>
      )}
    </div>
  );
}

function HighlightCard({ highlight }: { highlight: PlayerHighlight }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base capitalize">
          {highlight.kind.replace(/_/g, " ")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="aspect-video bg-slate-900 rounded-md flex items-center justify-center text-white text-xs">
          ▶ Clip {formatClock(highlight.startSec)}–{formatClock(highlight.endSec)}
        </div>
        <div className="text-xs text-muted-foreground">{highlight.caption}</div>
      </CardContent>
    </Card>
  );
}

export default {
  FilmRoomPage,
  FilmUploadPage,
  FilmSessionPage,
  PlayerHighlightsPage,
};
