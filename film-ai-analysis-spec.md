# HoopsIQ Film AI Analysis — Spec, Schema & Manus Prompt

> Canonical specification for AI-powered film upload, automated stat extraction, and highlight generation within HoopsIQ Coach HQ / Film Room.

---

## 1. Deep Research Summary

### Market Landscape

The basketball AI film analysis market has matured around a core value proposition: coaches upload game film and receive box-score stats, possession-level event timelines, and auto-generated player highlight reels without manual tagging.

Key competitors and their positioning:
- **SportsVisio** — Full-game upload produces automatic box scores, player highlight reels, stat-linked clips, league standings. Targets youth/HS/club coaches. Claims 24-hour turnaround.
- **Hooper** — Phone-captured video analyzed shot-by-shot. Tracks individual stats and generates highlights per player. Consumer/pickup oriented.
- **Hudl** — Incumbent film platform for organized teams. Manual tagging workflow with some AI assist. Deep recruiting integration.
- **NBA + AWS (Inside The Game)** — Production-grade pipeline: 25fps tracking data, event streams, contextual metrics (xFG%, defensive pressure). Uses EKS, Flink, DocumentDB. Not available to consumers but defines the technical ceiling.

### Technical Architecture Patterns

Every production basketball AI system uses a **multi-stage pipeline**, not a single model:

1. **Video Ingestion & Normalization** — Handle variable lighting, resolution, frame rate, camera angle. Normalize to consistent frames.
2. **Entity Detection** — Detect players, ball, rim, court landmarks per frame. State-of-the-art: RF-DETR, YOLOv8, fine-tuned on basketball domains.
3. **Player Tracking & Identity** — Maintain consistent player IDs across frames through occlusion/blur. SAM2 for pixel-level tracking. SigLIP + UMAP + K-means for team clustering without annotations. SmolVLM2/ResNet for jersey number recognition.
4. **Possession Segmentation** — Break continuous footage into possessions and dead-ball segments. Critical for event context.
5. **Event/Action Recognition** — Classify basketball events: shot attempts (made/missed), rebounds, turnovers, assists, steals, blocks, fouls. Transformer-based action recognition on possession segments.
6. **Stat Attribution & Rule-Based Validation** — Assign events to specific players. Validate against basketball constraints (e.g., a player cannot assist their own shot). This is where coach trust is built.
7. **Highlight Candidate Generation** — Score events by significance (game-winners, dunks, blocks, scoring runs). Assemble per-player clip sequences with padding for context.
8. **Human Review & Correction** — Coach reviews AI-generated stats and highlights. Can correct misattributions, add/remove events, approve/reject highlight selections before publishing.

Academic validation: Recent research reports player detection precision of ~93% and multi-object tracking accuracy of ~90% using deep learning pipelines on standard broadcast video.

### Product Design Principles for HoopsIQ

- **Video is the source of truth** — Stats and highlights link back to exact video moments. Coaches can click any stat to see the footage.
- **Editable outputs** — AI generates first draft; coach corrects and approves. No black-box publishing.
- **Per-player highlight reels** — Auto-generated but coach-curated. Shareable for recruiting.
- **Progressive disclosure** — Upload flow is simple (drag-and-drop). Advanced review is opt-in.
- **Team workflow** — Multiple coaches can review. Players see their own highlights in the Player App.

---

## 2. Manus Master Build Prompt

```
You are building the Film AI Analysis module for HoopsIQ, a basketball development platform.

Context:
- Monorepo: client/ (React + Vite + wouter router), server/ (Express/Vercel), api/ (serverless functions), shared/
- Existing Film Room routes: /app/film (FilmRoomHome), /app/film/clips/:id (FilmClipDetail)
- Existing Coach HQ routes: /app/coach/* with PlaybookStudio, PracticePlanBuilder
- UI uses Lucide icons, Tailwind CSS, PageHeader component with eyebrow/title pattern
- Mock data pattern: import from @/lib/mock/data
- Auth: coach role guard on /app/coach/* routes

Task: Extend the existing Film Room into a full AI film analysis system with these capabilities:

### Data Schema (add to shared/schema.ts)

Create TypeScript interfaces and mock data for:

1. FilmUpload — represents an uploaded game/practice video
   - id, teamId, coachId, title, description
   - videoUrl, thumbnailUrl, duration (seconds)
   - uploadStatus: 'uploading' | 'processing' | 'ready' | 'failed'
   - gameType: 'full_game' | 'scrimmage' | 'practice' | 'highlights_only'
   - gameDate, opponent, location
   - createdAt, updatedAt

2. AnalysisJob — represents an AI processing job on a film upload
   - id, filmUploadId
   - status: 'queued' | 'detecting' | 'tracking' | 'analyzing' | 'generating_highlights' | 'review_ready' | 'completed' | 'failed'
   - progress (0-100), currentStep (human-readable)
   - startedAt, completedAt, errorMessage
   - pipelineVersion

3. DetectedPlayer — a player identified in the video
   - id, analysisJobId, rosterId (nullable — links to existing roster player)
   - jerseyNumber, teamSide: 'home' | 'away'
   - confidenceScore (0-1)
   - trackingColor (hex for UI overlay)

4. GameEvent — a discrete basketball event detected by AI
   - id, analysisJobId, detectedPlayerId
   - eventType: 'shot_made' | 'shot_missed' | 'three_made' | 'three_missed' | 'free_throw_made' | 'free_throw_missed' | 'rebound_offensive' | 'rebound_defensive' | 'assist' | 'steal' | 'block' | 'turnover' | 'foul' | 'substitution'
   - timestampStart, timestampEnd (seconds in video)
   - possession: number
   - confidence (0-1)
   - verified: boolean (coach has confirmed)
   - overriddenBy: coachId | null
   - metadata: { shotDistance?, shotZone?, assistedBy?, fouledBy? }

5. PlayerStatLine — aggregated stats per player per game
   - id, analysisJobId, detectedPlayerId
   - points, rebounds, assists, steals, blocks, turnovers, fouls
   - fgMade, fgAttempted, fgPct
   - threeMade, threeAttempted, threePct
   - ftMade, ftAttempted, ftPct
   - minutesPlayed
   - offensiveRebounds, defensiveRebounds
   - plusMinus

6. HighlightClip — an auto-generated or coach-curated clip
   - id, analysisJobId, detectedPlayerId
   - title, clipUrl, thumbnailUrl
   - timestampStart, timestampEnd
   - eventIds: string[] (linked GameEvents)
   - highlightScore (0-100, AI significance ranking)
   - status: 'auto_generated' | 'coach_approved' | 'coach_rejected' | 'published'
   - publishedTo: ('player_app' | 'recruiting' | 'team_feed')[]

7. HighlightReel — a compiled per-player highlight reel
   - id, analysisJobId, detectedPlayerId
   - title, reelUrl, thumbnailUrl, duration
   - clipIds: string[]
   - status: 'generating' | 'ready' | 'published'
   - publishedTo: ('player_app' | 'recruiting' | 'team_feed')[]

### New Routes to Create

/app/film — FilmRoomHome (UPGRADE: add upload section, processing queue, recent analyses)
/app/film/upload — FilmUploadPage (drag-drop upload with metadata form)
/app/film/analysis/:id — AnalysisDashboard (stats + events + highlight review)
/app/film/analysis/:id/stats — PlayerStatsView (box score table, per-player drill-down)
/app/film/analysis/:id/events — EventTimeline (scrollable timeline linked to video)
/app/film/analysis/:id/highlights — HighlightManager (approve/reject/reorder clips per player)
/app/film/analysis/:id/player/:playerId — PlayerFilmProfile (single player: stats + clips + reel)

### UI Components to Create

- FilmUploadDropzone — drag-and-drop with progress bar and metadata form
- AnalysisProcessingCard — shows job status with animated pipeline steps
- BoxScoreTable — standard basketball box score layout with clickable stat cells
- EventTimelineStrip — horizontal timeline with event markers, click-to-seek
- HighlightClipCard — thumbnail + title + approve/reject/publish actions
- PlayerHighlightReel — video player with clip playlist sidebar
- StatCellLink — clicking a stat (e.g., "3 assists") shows the 3 assist clips
- PlayerDetectionOverlay — shows detected players with tracking colors on video frame
- ReviewActionBar — approve all / flag for review / publish buttons

### API Routes (api/ folder)

- POST /api/film/upload — initiate upload, return presigned URL
- POST /api/film/analyze — trigger analysis job on uploaded film
- GET /api/film/analysis/:id — get analysis status and results
- GET /api/film/analysis/:id/stats — get player stat lines
- GET /api/film/analysis/:id/events — get event timeline
- GET /api/film/analysis/:id/highlights — get highlight clips
- PATCH /api/film/events/:id — coach override/verify an event
- PATCH /api/film/highlights/:id — approve/reject/publish a clip
- POST /api/film/highlights/:id/publish — publish to player app or recruiting
- POST /api/film/analysis/:id/reel/:playerId — generate highlight reel for player

### Implementation Notes

- Use existing mock data pattern (filmRoom object in @/lib/mock/data) — extend it
- All new pages follow PageHeader eyebrow/title pattern
- Processing status uses polling or simulated progress for demo
- Video player can use HTML5 video with custom controls
- Highlight clips show start/end timestamps, not actual video cutting (mock)
- Box score table should match standard basketball stat sheet format
- Event timeline should be horizontally scrollable with color-coded event markers
- Ensure mobile-responsive: upload works on phone, stats table scrolls horizontally
- Add Film AI section to coach sidebar navigation
- Connect detected players to existing roster when rosterId is set
```

---

## 3. Database Schema (TypeScript Interfaces)

```typescript
// shared/schema/film-analysis.ts

export type UploadStatus = 'uploading' | 'processing' | 'ready' | 'failed';
export type GameType = 'full_game' | 'scrimmage' | 'practice' | 'highlights_only';
export type AnalysisStatus = 'queued' | 'detecting' | 'tracking' | 'analyzing' | 'generating_highlights' | 'review_ready' | 'completed' | 'failed';
export type TeamSide = 'home' | 'away';
export type GameEventType =
  | 'shot_made' | 'shot_missed'
  | 'three_made' | 'three_missed'
  | 'free_throw_made' | 'free_throw_missed'
  | 'rebound_offensive' | 'rebound_defensive'
  | 'assist' | 'steal' | 'block' | 'turnover' | 'foul' | 'substitution';
export type HighlightStatus = 'auto_generated' | 'coach_approved' | 'coach_rejected' | 'published';
export type ReelStatus = 'generating' | 'ready' | 'published';
export type PublishTarget = 'player_app' | 'recruiting' | 'team_feed';

export interface FilmUpload {
  id: string;
  teamId: string;
  coachId: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // seconds
  uploadStatus: UploadStatus;
  gameType: GameType;
  gameDate: string; // ISO date
  opponent?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisJob {
  id: string;
  filmUploadId: string;
  status: AnalysisStatus;
  progress: number; // 0-100
  currentStep: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  pipelineVersion: string;
}

export interface DetectedPlayer {
  id: string;
  analysisJobId: string;
  rosterId?: string; // links to existing roster player
  playerName?: string;
  jerseyNumber: number;
  teamSide: TeamSide;
  confidenceScore: number; // 0-1
  trackingColor: string; // hex
}

export interface GameEvent {
  id: string;
  analysisJobId: string;
  detectedPlayerId: string;
  eventType: GameEventType;
  timestampStart: number; // seconds
  timestampEnd: number;
  possession: number;
  confidence: number; // 0-1
  verified: boolean;
  overriddenBy?: string; // coachId
  metadata?: {
    shotDistance?: number;
    shotZone?: string;
    assistedBy?: string; // detectedPlayerId
    fouledBy?: string;
  };
}

export interface PlayerStatLine {
  id: string;
  analysisJobId: string;
  detectedPlayerId: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fgMade: number;
  fgAttempted: number;
  fgPct: number;
  threeMade: number;
  threeAttempted: number;
  threePct: number;
  ftMade: number;
  ftAttempted: number;
  ftPct: number;
  minutesPlayed: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  plusMinus: number;
}

export interface HighlightClip {
  id: string;
  analysisJobId: string;
  detectedPlayerId: string;
  title: string;
  clipUrl: string;
  thumbnailUrl: string;
  timestampStart: number;
  timestampEnd: number;
  eventIds: string[];
  highlightScore: number; // 0-100
  status: HighlightStatus;
  publishedTo: PublishTarget[];
}

export interface HighlightReel {
  id: string;
  analysisJobId: string;
  detectedPlayerId: string;
  title: string;
  reelUrl: string;
  thumbnailUrl: string;
  duration: number;
  clipIds: string[];
  status: ReelStatus;
  publishedTo: PublishTarget[];
}

// Aggregate view for the analysis dashboard
export interface FilmAnalysis {
  upload: FilmUpload;
  job: AnalysisJob;
  players: DetectedPlayer[];
  events: GameEvent[];
  statLines: PlayerStatLine[];
  highlights: HighlightClip[];
  reels: HighlightReel[];
}
```

---

## 4. Route Map

| Route | Component | Description |
|-------|-----------|-------------|
| `/app/film` | FilmRoomHome | Upload queue + recent analyses + quick actions |
| `/app/film/upload` | FilmUploadPage | Drag-drop upload + game metadata form |
| `/app/film/analysis/:id` | AnalysisDashboard | Overview: status, box score, timeline, highlights |
| `/app/film/analysis/:id/stats` | PlayerStatsView | Full box score + per-player stat drill-down |
| `/app/film/analysis/:id/events` | EventTimeline | Scrollable event timeline synced to video |
| `/app/film/analysis/:id/highlights` | HighlightManager | Review/approve/publish clips per player |
| `/app/film/analysis/:id/player/:playerId` | PlayerFilmProfile | Single player stats + clips + reel |

---

## 5. AI Processing Pipeline Stages

| Stage | Status Value | Description | Progress Range |
|-------|-------------|-------------|----------------|
| 1 | `queued` | Waiting in processing queue | 0% |
| 2 | `detecting` | Running player/ball/court detection | 0-25% |
| 3 | `tracking` | Building player tracks and identities | 25-50% |
| 4 | `analyzing` | Event recognition + stat attribution | 50-75% |
| 5 | `generating_highlights` | Scoring and assembling highlight clips | 75-95% |
| 6 | `review_ready` | Analysis complete, awaiting coach review | 95-100% |
| 7 | `completed` | Coach has reviewed and approved | 100% |

---

## 6. Implementation Priority

### Phase 1 — Core UI (build now)
- FilmUploadPage with drag-drop and metadata form
- AnalysisDashboard with processing status animation
- BoxScoreTable with mock stat data
- EventTimeline with mock events
- HighlightManager with mock clips
- Sidebar navigation update

### Phase 2 — Player Profiles & Publishing
- PlayerFilmProfile page
- HighlightReel compilation view
- Publish-to-player-app flow
- Recruiting share links

### Phase 3 — Backend Integration
- Presigned upload URLs (S3/R2)
- Analysis job queue (serverless)
- Real processing pipeline integration
- Webhook callbacks for status updates

### Phase 4 — AI Pipeline
- Video ingestion service
- Detection model deployment
- Tracking + identity resolution
- Event classification
- Stat attribution + validation
- Highlight scoring + assembly
