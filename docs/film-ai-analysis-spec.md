# Film AI Analysis — Canonical Specification

**Status:** Draft v1.0
**Owner:** HoopsIQ Architecture
**Module:** Film Room → Film AI Analysis
**Last updated:** 2026-05-03

---

## 1. Goals & Non-Goals

### Goals
- Allow coaches to upload full game/practice film and receive AI-generated player and team stats, timeline events, and highlight clips.
- Provide a coach review/correction loop with confidence badges and audit history.
- Make every stat and highlight deep-link back to the exact source moment in the film timeline.
- Stay provider-agnostic: support multiple/future CV vendors or internal models behind a stable adapter interface.
- Feel native to HoopsIQ — reuse Coach HQ / Film Room IA, design system, RBAC, and schema patterns.

### Non-Goals
- Performing computer vision in the browser.
- Replacing existing Film Room ingestion or AI Feedback modules — this *extends* them.
- Real-time live-game inference (future phase).
- Public/recruiting distribution flows (handled by Marketplace + Player App share surfaces).

---

## 2. Personas

| Persona | Primary jobs |
|---|---|
| **Head Coach** | Upload film, review AI output, approve stats, publish highlight reels. |
| **Assistant Coach / Staff** | Annotate, correct misattributions, manage review queue. |
| **Player** | View approved highlights and approved stat lines scoped to them. |
| **Org Admin** | Manage tenancy, RBAC, storage quotas, provider selection. |
| **System (AnalysisWorker)** | Execute pipeline stages, emit events, write versioned outputs. |

---

## 3. Jobs To Be Done

1. "As a coach, after a game I upload film and walk away — by morning I have a box score, per-player stat lines, and candidate highlights."
2. "As a coach, I can fix a misidentified player in 2 clicks and have stats recompute downstream."
3. "As a coach, I can build a player highlight reel from approved candidates and share it."
4. "As a player, I can see my approved highlights and stat line for last night's game."
5. "As an admin, I can swap CV providers without rewriting the schema or UI."

---

## 4. End-to-End Flow

```
Upload → FilmAsset created
      → FilmSession created (game/practice metadata + roster link)
      → AnalysisJob enqueued (versioned)
         ├─ stage: ingest/metadata
         ├─ stage: calibrate/preprocess
         ├─ stage: detect (players, ball)
         ├─ stage: track (identity)
         ├─ stage: possession segmentation
         ├─ stage: event classification
         ├─ stage: stat validation (rule-based)
         ├─ stage: clip boundary generation
         └─ stage: confidence scoring
      → DetectedEvents + StatAttributions + HighlightCandidates emitted
      → Coach review queue populated (low-confidence + flagged)
      → ReviewDecisions applied → stat recompute
      → HighlightClips approved → HighlightReel assembled
      → ExportRequest (share/download/publish)
```

---

## 5. Architecture

### Module placement
- `client/modules/film-analysis/` — UI (extends Film Room IA).
- `server/modules/film-analysis/` — routes, controllers, job orchestration.
- `shared/film-analysis/` — types, enums, zod schemas, mock data.
- `server/adapters/cv/` — provider-agnostic CV adapter interface.

### Provider-agnostic adapter
```ts
interface CVProviderAdapter {
  id: string;
  submit(job: AnalysisJobInput): Promise<ProviderJobHandle>;
  poll(handle: ProviderJobHandle): Promise<ProviderJobStatus>;
  fetchResults(handle: ProviderJobHandle): Promise<RawAnalysisPayload>;
  cancel(handle: ProviderJobHandle): Promise<void>;
}
```
Normalizers convert `RawAnalysisPayload` → HoopsIQ canonical events/stats. Provider identity is stored on `AnalysisJob.providerId` + `modelVersion` for reproducibility.

### Storage
- Object storage (S3-compatible) for `FilmAsset.sourceUri` and derived clip artifacts.
- Stable `mediaRef` (assetId + startMs + endMs) — clips are *derivations*, not copies, until export.

---

## 6. Schema Proposal

All entities include: `id`, `orgId`, `teamId`, `createdAt`, `updatedAt`, `createdBy`, `version`, soft-delete via `deletedAt`.

### FilmAsset
Raw uploaded media. Fields: `sourceUri`, `mimeType`, `durationMs`, `sizeBytes`, `checksum`, `uploadStatus` (`pending|uploading|ready|failed`).

### FilmSession
Logical game/practice. Fields: `assetId`, `kind` (`game|practice|scrimmage`), `opponentTeamId?`, `playedAt`, `homeAway`, `rosterSnapshotId`, `notes`.

### AnalysisJob
Fields: `sessionId`, `providerId`, `modelVersion`, `status` (`queued|running|partial|succeeded|failed|cancelled`), `stage`, `progressPct`, `startedAt`, `finishedAt`, `errorCode?`, `parentJobId?` (for reruns).

### AnalysisSegment
Time-bounded subdivision of the session. Fields: `jobId`, `startMs`, `endMs`, `periodLabel` (Q1/Q2/OT…), `possessionTeamId?`.

### TrackedPlayer
Pipeline-internal identity. Fields: `jobId`, `trackId`, `jerseyNumber?`, `teamSide`, `embeddings?`, `confidence`.

### RosterLink
Maps `TrackedPlayer` → real `playerId`. Fields: `trackedPlayerId`, `playerId`, `confidence`, `source` (`auto|coach|staff`), `lockedBy?`.

### DetectedEvent
Fields: `sessionId`, `segmentId`, `tMs`, `endMs?`, `type` (enum: `make_2|make_3|miss_2|miss_3|ft_make|ft_miss|rebound_off|rebound_def|assist|steal|block|turnover|foul|sub|timeout|jumpball|possession_change`), `primaryPlayerId?`, `assistPlayerId?`, `confidence`, `needsReview` (bool), `providerEventId?`.

### StatAttribution
Fields: `eventId`, `playerId`, `teamId`, `statKey`, `delta`, `confidence`, `version`.

### PlayerStatLine
Materialized per session+player. Fields: `sessionId`, `playerId`, totals (`pts, ast, reb, stl, blk, to, fls, fg, fga, tp, tpa, ft, fta, min`), `version`, `derivedAt`.

### TeamStatSummary
Materialized per session+team. Box-score totals + pace + efficiency.

### HighlightCandidate
Fields: `sessionId`, `playerId?`, `eventIds[]`, `startMs`, `endMs`, `score`, `reason`, `status` (`proposed|approved|rejected`).

### HighlightClip
Approved clip derived from candidate. Fields: `candidateId`, `mediaRef`, `trim {inMs,outMs}`, `coachNotes`, `approvedBy`, `approvedAt`, `version`.

### HighlightReel
Ordered collection. Fields: `playerId?|teamId?`, `clipIds[]`, `title`, `visibility` (`private|team|player|org|external_link`), `publishedAt?`.

### ReviewDecision
Audit row. Fields: `targetType` (`event|attribution|rosterlink|candidate`), `targetId`, `before`, `after`, `decidedBy`, `decidedAt`, `reason`.

### ProcessingIssue
Fields: `jobId`, `stage`, `severity` (`info|warn|error`), `code`, `message`, `context`.

### ExportRequest
Fields: `targetType` (`clip|reel|stats`), `targetId`, `format` (`mp4|csv|pdf|link`), `status`, `resultUri?`, `requestedBy`.

---

## 7. API Surface (REST, namespaced under `/api/film-analysis`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/uploads/initiate` | Create FilmAsset + presigned URL |
| POST | `/sessions` | Create FilmSession from asset + metadata |
| GET | `/sessions/:id` | Session detail (asset, job, segments) |
| GET | `/sessions/:id/jobs/latest` | Latest AnalysisJob status |
| POST | `/sessions/:id/jobs` | Trigger analysis or rerun (versioned) |
| GET | `/sessions/:id/stats/team` | TeamStatSummary |
| GET | `/sessions/:id/stats/players` | PlayerStatLine[] |
| GET | `/sessions/:id/events` | DetectedEvent[] (filterable) |
| GET | `/sessions/:id/highlights` | HighlightCandidate[] + Clips |
| POST | `/review/decisions` | Submit ReviewDecision (recomputes downstream) |
| POST | `/highlights/clips` | Approve/trim clip from candidate |
| POST | `/highlights/reels` | Create/update reel |
| POST | `/exports` | Request export (clip/reel/stats) |

All endpoints scope by `orgId`/`teamId` from session context; tenancy enforced server-side.

---

## 8. Background Jobs

- `film.analysis.run` — orchestrates pipeline stages; idempotent per `(sessionId, modelVersion)`.
- `film.analysis.rerun` — accepts `fromStage`; preserves prior `version` records.
- `film.stats.recompute` — fired on ReviewDecision affecting events/attributions.
- `film.highlights.assemble` — generates candidates from approved events.
- `film.export.render` — produces mp4/csv/pdf artifacts to object storage.

State machine for `AnalysisJob.status`: `queued → running → (partial | succeeded | failed | cancelled)`. `partial` permits downstream consumers to render available stages.

---

## 9. Review Workflow

- Items hit the queue when `confidence < threshold` or rule-based validators flag inconsistency (e.g., made 3 attributed to player not on floor).
- Coach actions: **Confirm**, **Reassign player**, **Change event type**, **Adjust time**, **Reject**, **Add note**.
- Every action writes a `ReviewDecision` and triggers `film.stats.recompute` for the affected segment.
- AI revisions never overwrite — they create a new `version` row; coach overrides are sticky and survive reruns unless explicitly released.

---

## 10. Permissions / RBAC

| Role | Upload | Review | Approve | Share/Export | View raw pipeline |
|---|---|---|---|---|---|
| Org Admin | Y | Y | Y | Y | Y |
| Head Coach | Y | Y | Y | Y | summary only |
| Assistant Coach | Y | Y | N | N | summary only |
| Staff/Analyst | N | Y | N | N | N |
| Player | N | N | N | view approved only | N |

Reuses HoopsIQ RBAC matrix; new permissions: `film.analysis.upload`, `film.analysis.review`, `film.analysis.approve`, `film.analysis.export`, `film.analysis.admin`.

---

## 11. Analytics / Telemetry

Emit events: `film.upload.started/completed/failed`, `film.job.stage_advanced`, `film.review.decision`, `film.clip.approved`, `film.reel.published`, `film.export.requested`. Track per-org KPIs: avg job duration, % events needing review, coach correction rate (model quality signal), reel publish rate.

---

## 12. Failure Modes

| Mode | Detection | Recovery |
|---|---|---|
| Upload aborted | presigned URL TTL | resumable upload + retry |
| Provider outage | adapter poll error | requeue with backoff; mark `partial` |
| Roster mismatch | RosterLink confidence low | force review before stats publish |
| Corrupt media | ingest stage validator | mark asset `failed`, notify uploader |
| Stat inconsistency | rule validator | flag events `needsReview=true` |
| Coach override conflict on rerun | version diff | preserve overrides, surface diff UI |

---

## 13. Phased Roadmap

- **Phase 1 — Docs (this file).**
- **Phase 2 — Shared types + mock data** under `shared/film-analysis/`.
- **Phase 3 — API/route scaffolding** under `server/modules/film-analysis/` with adapter interface + in-memory mock provider.
- **Phase 4 — Frontend module** under `client/modules/film-analysis/`: index, upload, session detail, team stats tab, highlights tab, review queue, timeline browser, player drilldown, reel manager.
- **Phase 5 — Real provider integration** (pluggable; e.g., HudlAdapter, InternalCVAdapter).
- **Phase 6 — Player App surface** for approved highlights/stats.
- **Phase 7 — Live/near-real-time** ingestion.

---

## 14. Open TODOs

- TODO: confirm exact roster snapshot strategy (point-in-time copy vs. reference + asOf).
- TODO: align highlight `mediaRef` semantics with existing Film Room clip references.
- TODO: decide thresholds for auto-approve vs. force-review per event type with coaching staff.
