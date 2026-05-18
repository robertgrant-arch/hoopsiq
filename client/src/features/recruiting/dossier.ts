/**
 * Recruiting & Showcase Dossier — mock data.
 *
 * Turns verified HoopsOS activity (film clips, assessment milestones,
 * practice attendance, IDP progress) into shareable recruiting profiles.
 *
 * Acceptance criteria baked in:
 *  ✓ AC1: Jalen Carter dossier has 3 coach-selected clips + 2 verified milestones
 *  ✓ AC2: "academics" section is private → public page hides it
 *  ✓ AC3: recordViewEvent() appends to VIEW_EVENTS on public page load
 *
 * Key design decisions:
 *  - Each DossierSection carries its own visibility so the coach can be granular
 *  - verified: true flags data pulled from real HoopsOS activity (not self-reported)
 *  - reviewState gates publishing: draft → pending_review → approved → published
 *  - VIEW_EVENTS is module-level mutable so page-load mock appends work at runtime
 */

/* ─── Section keys ───────────────────────────────────────────────────────────── */

export type DossierSectionKey =
  | "bio"
  | "measurables"
  | "academics"
  | "teams"
  | "clips"
  | "stats"
  | "coach_summary"
  | "development_progress"
  | "contact_rules";

export const DOSSIER_SECTION_LABEL: Record<DossierSectionKey, string> = {
  bio:                  "Bio & headline",
  measurables:          "Measurables",
  academics:            "Academics",
  teams:                "Teams & programs",
  clips:                "Highlight clips",
  stats:                "Stats",
  coach_summary:        "Coach summary",
  development_progress: "Development progress",
  contact_rules:        "Contact info",
};

export const DOSSIER_SECTION_DESCRIPTION: Record<DossierSectionKey, string> = {
  bio:                  "Player headline, summary, hometown",
  measurables:          "Height, weight, wingspan, athleticism tests",
  academics:            "GPA, test scores, intended major",
  teams:                "Programs, seasons, records",
  clips:                "Coach-selected film clips with annotations",
  stats:                "Season stats and game averages",
  coach_summary:        "Personalized coach narrative and assessment",
  development_progress: "Verified milestones and IDP goal completion",
  contact_rules:        "How to reach player and family",
};

/* ─── Visibility ─────────────────────────────────────────────────────────────── */

export type SectionVisibility = "public" | "private" | "on_request";

export const VISIBILITY_LABEL: Record<SectionVisibility, string> = {
  public:     "Public",
  private:    "Private",
  on_request: "On request",
};

export const VISIBILITY_DESCRIPTION: Record<SectionVisibility, string> = {
  public:     "Visible to anyone with the link",
  private:    "Hidden from all public viewers",
  on_request: "Shown after an access request is approved",
};

/* ─── Section meta ───────────────────────────────────────────────────────────── */

export interface DossierSectionMeta {
  key: DossierSectionKey;
  visibility: SectionVisibility;
  /** True when data is sourced from verified HoopsOS activity */
  verified: boolean;
  /** Locked sections can't be edited by the player (coach-only) */
  coachOnly: boolean;
  /** Whether this section has any content yet */
  hasContent: boolean;
}

/* ─── Sub-types ──────────────────────────────────────────────────────────────── */

export interface DossierBio {
  headline: string;
  summary: string;
  pronouns?: string;
  hometown: string;
  state: string;
  twitter?: string;
  instagram?: string;
}

export interface DossierMeasurables {
  height: string;
  weight: string;
  wingspan?: string;
  standingReach?: string;
  verticalLeap?: string;
  laneAgilitySeconds?: number;
  threeQuarterSprintSeconds?: number;
  verified: boolean;
  verifiedBy?: string;
  verifiedDate?: string;
}

export interface DossierAcademics {
  gpa?: string;
  weightedGpa?: string;
  satScore?: number;
  actScore?: number;
  intendedMajor?: string;
  academicHonors?: string[];
  counselorName?: string;
}

export interface DossierTeam {
  id: string;
  teamName: string;
  level: string;
  coachName: string;
  season: string;
  record?: string;
  role: string;
  verified: boolean;
}

export interface DossierClip {
  clipId: string;
  filmId: string;
  title: string;
  category: string;
  startTime: string;
  endTime: string;
  coachNote: string;
  /** Positive = highlight, negative = developmental focus */
  highlightType: "positive" | "developmental";
  verified: boolean;
  addedAt: string;
}

export interface DossierStat {
  label: string;
  value: string;
  period: string;
  source: string;
  verified: boolean;
}

export interface DossierMilestone {
  milestoneId: string;
  title: string;
  description: string;
  category: "development" | "performance" | "leadership" | "academic" | "recruiting";
  earnedDate: string;
  verifier: string;
  verifierRole: "coach" | "system";
  verified: boolean;
}

export interface DossierContactRules {
  allowDirectMessage: boolean;
  requireFamilyApproval: boolean;
  preferredChannel: "email" | "app" | "phone";
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  note?: string;
}

/* ─── Review state ───────────────────────────────────────────────────────────── */

export type DossierReviewState =
  | "draft"
  | "pending_player_review"
  | "pending_parent_review"
  | "approved"
  | "published";

export const REVIEW_STATE_LABEL: Record<DossierReviewState, string> = {
  draft:                  "Draft",
  pending_player_review:  "Awaiting player review",
  pending_parent_review:  "Awaiting parent review",
  approved:               "Approved",
  published:              "Published",
};

/* ─── Full dossier ───────────────────────────────────────────────────────────── */

export interface PlayerDossier {
  id: string;
  playerId: string;
  playerName: string;
  playerInitials: string;
  position: "PG" | "SG" | "SF" | "PF" | "C";
  gradYear: number;
  jerseyNumber: number;
  programId: string;
  programName: string;
  /** URL slug for the public page at /p/:slug */
  publicSlug: string;
  reviewState: DossierReviewState;
  reviewerNote?: string;
  publishedAt?: string;
  lastUpdatedAt: string;
  createdAt: string;
  /** Coach who owns this dossier */
  coachName: string;
  sections: DossierSectionMeta[];
  bio: DossierBio;
  measurables: DossierMeasurables;
  academics: DossierAcademics;
  teams: DossierTeam[];
  clips: DossierClip[];
  stats: DossierStat[];
  coachSummary: string;
  milestones: DossierMilestone[];
  contactRules: DossierContactRules;
  viewCount: number;
  uniqueSchoolCount: number;
}

/* ─── View events (mock analytics) ──────────────────────────────────────────── */

export type ViewerType =
  | "college_coach"
  | "scout"
  | "parent"
  | "player"
  | "public";

export interface ViewEvent {
  id: string;
  dossierId: string;
  publicSlug: string;
  viewerType: ViewerType;
  viewerName?: string;
  viewerTitle?: string;
  viewerSchool?: string;
  viewerDivision?: "D1" | "D2" | "D3" | "NAIA" | "JUCO";
  viewedAt: string;
  /** Which sections the viewer scrolled past */
  sectionsViewed: DossierSectionKey[];
  durationSeconds: number;
  referrer?: string;
}

/**
 * Module-level mutable event log.
 * recordViewEvent() appends here — satisfies AC #3.
 */
export const VIEW_EVENTS: ViewEvent[] = [
  {
    id: "ve_1",
    dossierId: "doss_jalen_carter",
    publicSlug: "jalen-carter-2027",
    viewerType: "college_coach",
    viewerName: "Coach Linda Park",
    viewerTitle: "Associate Head Coach",
    viewerSchool: "Rutgers University",
    viewerDivision: "D1",
    viewedAt: "2026-05-17T14:32:00Z",
    sectionsViewed: ["bio", "measurables", "clips", "stats", "development_progress"],
    durationSeconds: 214,
    referrer: "email_campaign",
  },
  {
    id: "ve_2",
    dossierId: "doss_jalen_carter",
    publicSlug: "jalen-carter-2027",
    viewerType: "college_coach",
    viewerName: "Coach Marcus Reid",
    viewerTitle: "Director of Player Development",
    viewerSchool: "Monmouth University",
    viewerDivision: "D1",
    viewedAt: "2026-05-15T09:18:00Z",
    sectionsViewed: ["bio", "clips", "coach_summary"],
    durationSeconds: 137,
    referrer: "direct",
  },
  {
    id: "ve_3",
    dossierId: "doss_jalen_carter",
    publicSlug: "jalen-carter-2027",
    viewerType: "scout",
    viewerName: "Tom Garibaldi",
    viewerTitle: "Regional Scout",
    viewerSchool: "NBPA Top 100",
    viewedAt: "2026-05-14T16:05:00Z",
    sectionsViewed: ["bio", "measurables", "stats", "clips", "development_progress", "teams"],
    durationSeconds: 389,
    referrer: "showcase_link",
  },
];

let _viewEventCounter = VIEW_EVENTS.length + 1;

/**
 * Record a new view event. Appends to the module-level VIEW_EVENTS array.
 * Called on public page load — satisfies AC #3.
 */
export function recordViewEvent(
  dossierId: string,
  publicSlug: string,
  viewerType: ViewerType = "public",
  meta?: Partial<Omit<ViewEvent, "id" | "dossierId" | "publicSlug" | "viewerType" | "viewedAt">>,
): ViewEvent {
  const event: ViewEvent = {
    id: `ve_${_viewEventCounter++}`,
    dossierId,
    publicSlug,
    viewerType,
    viewedAt: new Date().toISOString(),
    sectionsViewed: ["bio"],
    durationSeconds: 0,
    ...meta,
  };
  VIEW_EVENTS.push(event);
  return event;
}

export function getViewEventsForDossier(dossierId: string): ViewEvent[] {
  return VIEW_EVENTS.filter((e) => e.dossierId === dossierId);
}

/* ─── Dossier data ───────────────────────────────────────────────────────────── */

export const DOSSIERS: PlayerDossier[] = [
  /* ── Jalen Carter — Varsity PG, 2027 ─────────────────────────────────────── */
  {
    id: "doss_jalen_carter",
    playerId: "a_1",
    playerName: "Jalen Carter",
    playerInitials: "JC",
    position: "PG",
    gradYear: 2027,
    jerseyNumber: 3,
    programId: "prog_varsity",
    programName: "Barnegat Basketball — Varsity",
    publicSlug: "jalen-carter-2027",
    reviewState: "published",
    publishedAt: "2026-05-10T12:00:00Z",
    lastUpdatedAt: "2026-05-17T08:30:00Z",
    createdAt: "2026-04-20T10:00:00Z",
    coachName: "Coach Grant",
    viewCount: 3,
    uniqueSchoolCount: 3,

    /* ── Section visibility map ─────────────────────────────────────────── */
    sections: [
      { key: "bio",                  visibility: "public",     verified: false, coachOnly: false, hasContent: true  },
      { key: "measurables",          visibility: "public",     verified: true,  coachOnly: true,  hasContent: true  },
      { key: "academics",            visibility: "private",    verified: false, coachOnly: false, hasContent: true  },
      { key: "teams",                visibility: "public",     verified: true,  coachOnly: true,  hasContent: true  },
      { key: "clips",                visibility: "public",     verified: true,  coachOnly: true,  hasContent: true  },
      { key: "stats",                visibility: "public",     verified: true,  coachOnly: true,  hasContent: true  },
      { key: "coach_summary",        visibility: "on_request", verified: true,  coachOnly: true,  hasContent: true  },
      { key: "development_progress", visibility: "public",     verified: true,  coachOnly: true,  hasContent: true  },
      { key: "contact_rules",        visibility: "public",     verified: false, coachOnly: false, hasContent: true  },
    ],

    /* ── Bio ────────────────────────────────────────────────────────────── */
    bio: {
      headline: "High-IQ point guard with elite court vision and proven development trajectory",
      summary:
        "Jalen is a 2027 point guard from Barnegat, NJ who combines natural playmaking instincts with a relentless improvement mindset. He's completed three consecutive assessment cycles with positive skill deltas, earned a coach-verified VDV badge, and logs the highest court vision score in his program. His development work is tracked and verifiable through HoopsOS.",
      pronouns: "he/him",
      hometown: "Barnegat",
      state: "NJ",
    },

    /* ── Measurables ────────────────────────────────────────────────────── */
    measurables: {
      height: "6'1\"",
      weight: "175 lbs",
      wingspan: "6'3\"",
      standingReach: "7'10\"",
      verticalLeap: "34\"",
      laneAgilitySeconds: 10.82,
      threeQuarterSprintSeconds: 3.21,
      verified: true,
      verifiedBy: "Coach Grant",
      verifiedDate: "2026-03-01",
    },

    /* ── Academics (PRIVATE — satisfies AC #2) ──────────────────────────── */
    academics: {
      gpa: "3.4",
      weightedGpa: "3.7",
      satScore: 1180,
      intendedMajor: "Sports Management",
      academicHonors: ["Honor Roll — Fall 2025", "Academic All-League 2026"],
    },

    /* ── Teams ──────────────────────────────────────────────────────────── */
    teams: [
      {
        id: "dt_1",
        teamName: "Barnegat HS Varsity",
        level: "High School Varsity",
        coachName: "Coach Grant",
        season: "2025–26",
        record: "14–6",
        role: "Starting PG",
        verified: true,
      },
      {
        id: "dt_2",
        teamName: "Barnegat AAU 17U Elite",
        level: "AAU 17U",
        coachName: "Coach Grant",
        season: "Spring 2026",
        record: "11–4",
        role: "Starting PG",
        verified: true,
      },
    ],

    /* ── Clips — 3 verified clips (satisfies AC #1) ─────────────────────── */
    clips: [
      {
        clipId: "clip_p2",
        filmId: "film_2",
        title: "Consistent release point — 4 consecutive reps",
        category: "Shooting",
        startTime: "1:08",
        endTime: "1:22",
        coachNote:
          "Jalen has been working on his release consistency for three months. This clip shows 4 consecutive reps at identical release height — a direct result of his IDP shooting goal. Positive marker.",
        highlightType: "positive",
        verified: true,
        addedAt: "2026-05-15T09:10:00Z",
      },
      {
        clipId: "clip_w4",
        filmId: "film_1",
        title: "Pull-up mid-range — improved footwork vs Westbury",
        category: "Shooting",
        startTime: "4:17",
        endTime: "4:29",
        coachNote:
          "Compared to early-season film, Jalen's gather step is cleaner. Still slight forward lean but measurably improved over 8-week IDP window. Good growth signal.",
        highlightType: "developmental",
        verified: true,
        addedAt: "2026-05-11T10:20:00Z",
      },
      {
        clipId: "clip_w1",
        filmId: "film_1",
        title: "Closeout recovery — late rotation corrected",
        category: "Defense",
        startTime: "0:14",
        endTime: "0:31",
        coachNote:
          "This clip shows the original close-out error and subsequent correction on the very next possession — Jalen self-identified the mistake and adjusted. Strong coachability indicator.",
        highlightType: "positive",
        verified: true,
        addedAt: "2026-05-11T10:00:00Z",
      },
    ],

    /* ── Stats ──────────────────────────────────────────────────────────── */
    stats: [
      { label: "PPG",    value: "14.2", period: "2025–26 Season", source: "HoopsOS",      verified: true  },
      { label: "APG",    value: "7.1",  period: "2025–26 Season", source: "HoopsOS",      verified: true  },
      { label: "RPG",    value: "3.8",  period: "2025–26 Season", source: "HoopsOS",      verified: true  },
      { label: "SPG",    value: "2.1",  period: "2025–26 Season", source: "HoopsOS",      verified: true  },
      { label: "FG%",    value: "44%",  period: "2025–26 Season", source: "HoopsOS",      verified: true  },
      { label: "3P%",    value: "36%",  period: "2025–26 Season", source: "HoopsOS",      verified: true  },
      { label: "Court Vision Score", value: "9.2 / 10", period: "Latest assessment",   source: "HoopsOS Assessment", verified: true  },
      { label: "Ball Handling Score", value: "8.6 / 10", period: "Latest assessment",  source: "HoopsOS Assessment", verified: true  },
    ],

    /* ── Coach summary (on_request) ─────────────────────────────────────── */
    coachSummary:
      "Jalen is one of the most coachable players I've worked with in 12 years. He comes early, stays late, and most importantly — he applies feedback between sessions, not just during them. His court vision is program-best and he makes teammates better in every practice. His IDP work is on-track and verifiable through our platform. I would not hesitate to recommend him at the next level.",

    /* ── Milestones — 2 verified milestones (satisfies AC #1) ───────────── */
    milestones: [
      {
        milestoneId: "m-001",
        title: "VDV Verified",
        description:
          "Coach-verified improvement across 2+ assessment cycles in a 90-day window. Jalen showed positive deltas in Ball Handling, Court Vision, and Defense.",
        category: "development",
        earnedDate: "2026-05-01",
        verifier: "Coach Grant",
        verifierRole: "coach",
        verified: true,
      },
      {
        milestoneId: "m-002",
        title: "Elite Ball Handler",
        description:
          "Ball handling score reached 8.6 in a verified coach assessment — above the program's 8.0 elite threshold.",
        category: "performance",
        earnedDate: "2026-05-01",
        verifier: "Coach Grant",
        verifierRole: "coach",
        verified: true,
      },
    ],

    /* ── Contact rules ──────────────────────────────────────────────────── */
    contactRules: {
      allowDirectMessage: true,
      requireFamilyApproval: true,
      preferredChannel: "email",
      contactName: "Sandra Carter (Mother)",
      contactEmail: "scarter@email.com",
      contactPhone: "(609) 555-0101",
      note: "All initial recruiting inquiries should go through Coach Grant first.",
    },
  },

  /* ── Marcus Williams — Varsity SG, 2026 ─────────────────────────────────── */
  {
    id: "doss_marcus_williams",
    playerId: "a_2",
    playerName: "Marcus Williams",
    playerInitials: "MW",
    position: "SG",
    gradYear: 2026,
    jerseyNumber: 12,
    programId: "prog_varsity",
    programName: "Barnegat Basketball — Varsity",
    publicSlug: "marcus-williams-2026",
    reviewState: "pending_player_review",
    lastUpdatedAt: "2026-05-16T14:00:00Z",
    createdAt: "2026-05-01T10:00:00Z",
    coachName: "Coach Grant",
    viewCount: 0,
    uniqueSchoolCount: 0,

    sections: [
      { key: "bio",                  visibility: "public",  verified: false, coachOnly: false, hasContent: true  },
      { key: "measurables",          visibility: "public",  verified: true,  coachOnly: true,  hasContent: true  },
      { key: "academics",            visibility: "private", verified: false, coachOnly: false, hasContent: false },
      { key: "teams",                visibility: "public",  verified: true,  coachOnly: true,  hasContent: true  },
      { key: "clips",                visibility: "public",  verified: true,  coachOnly: true,  hasContent: false },
      { key: "stats",                visibility: "public",  verified: true,  coachOnly: true,  hasContent: true  },
      { key: "coach_summary",        visibility: "private", verified: true,  coachOnly: true,  hasContent: false },
      { key: "development_progress", visibility: "public",  verified: true,  coachOnly: true,  hasContent: false },
      { key: "contact_rules",        visibility: "public",  verified: false, coachOnly: false, hasContent: true  },
    ],
    bio: {
      headline: "Explosive 2-guard with perimeter scoring ability and developing off-ball movement",
      summary: "Marcus Williams is a 2026 shooting guard who brings energy and scoring punch to any lineup. Strong finisher in transition and developing a reliable mid-range game.",
      hometown: "Barnegat",
      state: "NJ",
    },
    measurables: {
      height: "6'3\"",
      weight: "185 lbs",
      wingspan: "6'5\"",
      verified: true,
      verifiedBy: "Coach Grant",
      verifiedDate: "2026-03-01",
    },
    academics: { gpa: "3.1" },
    teams: [
      { id: "dt_mw_1", teamName: "Barnegat HS Varsity", level: "High School Varsity", coachName: "Coach Grant", season: "2025–26", record: "14–6", role: "Starting SG", verified: true },
    ],
    clips: [],
    stats: [
      { label: "PPG",  value: "11.8", period: "2025–26 Season", source: "HoopsOS", verified: true },
      { label: "RPG",  value: "5.2",  period: "2025–26 Season", source: "HoopsOS", verified: true },
      { label: "FG%",  value: "41%",  period: "2025–26 Season", source: "HoopsOS", verified: true },
    ],
    coachSummary: "",
    milestones: [],
    contactRules: {
      allowDirectMessage: false,
      requireFamilyApproval: true,
      preferredChannel: "email",
      contactName: "Robert Williams (Father)",
      contactEmail: "rwilliams@email.com",
      contactPhone: "(609) 555-0102",
    },
  },
];

/* ─── Helper functions ───────────────────────────────────────────────────────── */

export function getDossierByPlayerId(playerId: string): PlayerDossier | undefined {
  return DOSSIERS.find((d) => d.playerId === playerId);
}

export function getDossierBySlug(slug: string): PlayerDossier | undefined {
  return DOSSIERS.find((d) => d.publicSlug === slug);
}

export function getPublicSections(dossier: PlayerDossier): DossierSectionMeta[] {
  return dossier.sections.filter((s) => s.visibility === "public" && s.hasContent);
}

export function isSectionVisible(
  dossier: PlayerDossier,
  key: DossierSectionKey,
  publicView: boolean,
): boolean {
  const section = dossier.sections.find((s) => s.key === key);
  if (!section) return false;
  if (!publicView) return true; // coach always sees all
  return section.visibility === "public";
}
