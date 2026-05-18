/**
 * Recruiting mock data for HoopsOS.
 *
 * Covers the full recruiting layer: player profiles, badges, access requests,
 * film clips, coach narratives, privacy settings, and recruiter profiles.
 *
 * Used by: PlayerRecruitingDashboard, DevelopmentResumePage, ProfileVisibilityPage,
 *          PublicRecruitingProfile (public-facing)
 */

import type { SkillCategory } from "./assessments";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecruitingPlayer = {
  id: string;
  name: string;
  position: "PG" | "SG" | "SF" | "PF" | "C";
  gradYear: 2027 | 2028 | 2029;
  height: string;
  wingspan: string;
  programId: string;
  programName: string;
  teamTier: "Premier" | "Gold" | "Silver";
  skillScores: Record<SkillCategory, number>;
  skillDeltas: Record<SkillCategory, number>;
  overallTier: "Emerging" | "Developing" | "Advanced" | "Elite";
  assessmentCount: number;
  filmClipCount: number;
  badgeCount: number;
  coachabilityIndex: number;
  attendanceRate: number;
  idpOnTrack: boolean;
  isPublic: boolean;
  profileSlug: string;
  lastAssessedAt: string;
};

export type BadgeInstance = {
  id: string;
  badgeId: string;
  playerId: string;
  playerName: string;
  awardedBy: string;
  awardedByRole: string;
  awardedAt: string;
  evidenceType: "assessment" | "film" | "observation" | "attendance";
  evidenceId?: string;
  evidenceNote: string;
  programName: string;
};

export type DevelopmentBadge = {
  id: string;
  name: string;
  description: string;
  category: "skill" | "behavioral" | "achievement";
  threshold: string;
  iconKey: "shield" | "star" | "flame" | "target" | "clock" | "users" | "trophy" | "film";
  awardedInstances: BadgeInstance[];
};

export type AccessRequest = {
  id: string;
  playerId: string;
  playerName: string;
  requesterId: string;
  requesterName: string;
  requesterTitle: string;
  requesterSchool: string;
  requesterSchoolTier: "D1" | "D2" | "D3" | "NAIA" | "JUCO";
  status: "pending" | "approved" | "denied" | "expired";
  requestedAt: string;
  respondedAt?: string;
  expiresAt?: string;
  requestMessage: string;
  accessLevel: "profile_only" | "full_profile" | "includes_film";
  viewCount: number;
};

export type AccessLogEntry = {
  id: string;
  playerId: string;
  requesterId: string;
  requesterName: string;
  requesterSchool: string;
  viewedAt: string;
  sectionsViewed: ("skills" | "film" | "badges" | "observations" | "narrative" | "coachability")[];
};

export type RecruitingExport = {
  id: string;
  playerId: string;
  playerName: string;
  generatedBy: string;
  generatedAt: string;
  status: "draft" | "pending_approval" | "approved" | "shared";
  familyApprovedAt?: string;
  clipIds: string[];
  coachNarrative: string;
  featuredBadgeIds: string[];
  shareLink?: string;
  shareLinkExpiresAt?: string;
  downloadCount: number;
  viewCount: number;
};

export type FilmClip = {
  id: string;
  playerId: string;
  title: string;
  description: string;
  coachAnnotation: string;
  skillTags: SkillCategory[];
  eventType: "practice" | "game" | "tournament";
  eventDate: string;
  thumbnailUrl: string;
  durationSeconds: number;
  isPublic: boolean;
  isInRecruitingPackage: boolean;
  coachSelectedForRecruiting: boolean;
};

export type CoachNarrative = {
  id: string;
  playerId: string;
  playerName: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
  updatedAt: string;
  body: string;
  isApprovedByFamily: boolean;
  isPublic: boolean;
};

export type SynthesisSummary = {
  playerId: string;
  topGrowthArea: SkillCategory;
  topGrowthDelta: number;
  mostFilmedSkill: SkillCategory;
  filmCorroborationScore: number;
  coachObservationThemes: string[];
  growthRate: "top_10" | "top_25" | "average" | "below_average";
  narrative: string;
};

export type PrivacySettings = {
  playerId: string;
  publicFields: ("name" | "position" | "gradYear" | "height" | "program" | "tier" | "badgeCount" | "growthSignal")[];
  sharedFields: ("skillScores" | "assessmentHistory" | "filmClips" | "coachObservations" | "coachabilityIndex" | "idpDetails" | "attendance")[];
  requireApprovalForAccess: boolean;
  accessExpiry: 30 | 60 | 90;
  allowRecruiterSearch: boolean;
};

export type RecruiterProfile = {
  id: string;
  name: string;
  title: string;
  school: string;
  division: "D1" | "D2" | "D3" | "NAIA" | "JUCO";
  recruitingPositions: string[];
  gradYearsTargeting: number[];
  savedPlayerIds: string[];
  accessRequestIds: string[];
};

// ─── Recruiting Players ───────────────────────────────────────────────────────

export const recruitingPlayers: RecruitingPlayer[] = [
  {
    id: "rp_001",
    name: "Jordan Mills",
    position: "SG",
    gradYear: 2027,
    height: "6'3\"",
    wingspan: "6'7\"",
    programId: "prog_barnegat",
    programName: "Barnegat Premier Basketball",
    teamTier: "Premier",
    skillScores: {
      ball_handling: 7.8,
      shooting: 8.4,
      finishing: 7.2,
      defense: 6.9,
      footwork: 7.5,
      iq_reads: 7.1,
      athleticism: 8.1,
      conditioning: 7.6,
    },
    skillDeltas: {
      ball_handling: 1.4,
      shooting: 1.8,
      finishing: 0.9,
      defense: 0.6,
      footwork: 1.2,
      iq_reads: 0.8,
      athleticism: 0.4,
      conditioning: 1.1,
    },
    overallTier: "Advanced",
    assessmentCount: 6,
    filmClipCount: 14,
    badgeCount: 5,
    coachabilityIndex: 8.7,
    attendanceRate: 0.96,
    idpOnTrack: true,
    isPublic: true,
    profileSlug: "jordan-mills-2027",
    lastAssessedAt: "2026-05-02T10:00:00Z",
  },
  {
    id: "rp_002",
    name: "Marcus Webb Jr.",
    position: "PG",
    gradYear: 2027,
    height: "6'1\"",
    wingspan: "6'4\"",
    programId: "prog_barnegat",
    programName: "Barnegat Premier Basketball",
    teamTier: "Premier",
    skillScores: {
      ball_handling: 8.9,
      shooting: 7.1,
      finishing: 7.6,
      defense: 7.4,
      footwork: 8.2,
      iq_reads: 9.0,
      athleticism: 7.8,
      conditioning: 8.3,
    },
    skillDeltas: {
      ball_handling: 2.1,
      shooting: 0.7,
      finishing: 1.3,
      defense: 1.5,
      footwork: 1.7,
      iq_reads: 2.4,
      athleticism: 0.3,
      conditioning: 1.2,
    },
    overallTier: "Elite",
    assessmentCount: 7,
    filmClipCount: 18,
    badgeCount: 7,
    coachabilityIndex: 9.2,
    attendanceRate: 0.98,
    idpOnTrack: true,
    isPublic: true,
    profileSlug: "marcus-webb-jr-2027",
    lastAssessedAt: "2026-05-03T10:00:00Z",
  },
  {
    id: "rp_003",
    name: "Darius Cole",
    position: "SF",
    gradYear: 2028,
    height: "6'6\"",
    wingspan: "6'10\"",
    programId: "prog_barnegat",
    programName: "Barnegat Premier Basketball",
    teamTier: "Premier",
    skillScores: {
      ball_handling: 6.4,
      shooting: 7.8,
      finishing: 8.1,
      defense: 8.5,
      footwork: 7.2,
      iq_reads: 6.8,
      athleticism: 8.9,
      conditioning: 7.9,
    },
    skillDeltas: {
      ball_handling: 0.8,
      shooting: 1.3,
      finishing: 1.9,
      defense: 2.2,
      footwork: 0.9,
      iq_reads: 0.5,
      athleticism: 1.0,
      conditioning: 0.7,
    },
    overallTier: "Advanced",
    assessmentCount: 4,
    filmClipCount: 11,
    badgeCount: 4,
    coachabilityIndex: 8.1,
    attendanceRate: 0.92,
    idpOnTrack: true,
    isPublic: true,
    profileSlug: "darius-cole-2028",
    lastAssessedAt: "2026-04-28T10:00:00Z",
  },
  {
    id: "rp_004",
    name: "Tyrese Grant",
    position: "PF",
    gradYear: 2028,
    height: "6'7\"",
    wingspan: "7'0\"",
    programId: "prog_barnegat",
    programName: "Barnegat Gold Basketball",
    teamTier: "Gold",
    skillScores: {
      ball_handling: 5.8,
      shooting: 6.2,
      finishing: 8.4,
      defense: 7.9,
      footwork: 7.6,
      iq_reads: 6.5,
      athleticism: 8.7,
      conditioning: 7.2,
    },
    skillDeltas: {
      ball_handling: 1.2,
      shooting: 1.8,
      finishing: 1.5,
      defense: 1.1,
      footwork: 2.0,
      iq_reads: 0.9,
      athleticism: 0.6,
      conditioning: 1.3,
    },
    overallTier: "Advanced",
    assessmentCount: 5,
    filmClipCount: 9,
    badgeCount: 3,
    coachabilityIndex: 7.6,
    attendanceRate: 0.88,
    idpOnTrack: true,
    isPublic: true,
    profileSlug: "tyrese-grant-2028",
    lastAssessedAt: "2026-04-30T10:00:00Z",
  },
  {
    id: "rp_005",
    name: "Khalil Odom",
    position: "C",
    gradYear: 2028,
    height: "6'9\"",
    wingspan: "7'3\"",
    programId: "prog_barnegat",
    programName: "Barnegat Gold Basketball",
    teamTier: "Gold",
    skillScores: {
      ball_handling: 4.9,
      shooting: 5.3,
      finishing: 8.8,
      defense: 8.2,
      footwork: 7.0,
      iq_reads: 5.9,
      athleticism: 8.4,
      conditioning: 7.5,
    },
    skillDeltas: {
      ball_handling: 0.6,
      shooting: 0.4,
      finishing: 2.1,
      defense: 1.8,
      footwork: 1.4,
      iq_reads: 0.7,
      athleticism: 0.5,
      conditioning: 0.9,
    },
    overallTier: "Developing",
    assessmentCount: 3,
    filmClipCount: 7,
    badgeCount: 2,
    coachabilityIndex: 7.2,
    attendanceRate: 0.84,
    idpOnTrack: false,
    isPublic: false,
    profileSlug: "khalil-odom-2028",
    lastAssessedAt: "2026-04-15T10:00:00Z",
  },
  {
    id: "rp_006",
    name: "Devon Price",
    position: "PG",
    gradYear: 2029,
    height: "5'11\"",
    wingspan: "6'2\"",
    programId: "prog_barnegat",
    programName: "Barnegat Silver Basketball",
    teamTier: "Silver",
    skillScores: {
      ball_handling: 7.1,
      shooting: 6.4,
      finishing: 6.2,
      defense: 5.8,
      footwork: 6.9,
      iq_reads: 7.4,
      athleticism: 6.5,
      conditioning: 6.8,
    },
    skillDeltas: {
      ball_handling: 1.9,
      shooting: 1.1,
      finishing: 0.7,
      defense: 0.4,
      footwork: 1.3,
      iq_reads: 1.6,
      athleticism: 0.8,
      conditioning: 1.0,
    },
    overallTier: "Developing",
    assessmentCount: 4,
    filmClipCount: 8,
    badgeCount: 3,
    coachabilityIndex: 8.4,
    attendanceRate: 0.91,
    idpOnTrack: true,
    isPublic: true,
    profileSlug: "devon-price-2029",
    lastAssessedAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "rp_007",
    name: "Amari Thompson",
    position: "SF",
    gradYear: 2029,
    height: "6'4\"",
    wingspan: "6'8\"",
    programId: "prog_barnegat",
    programName: "Barnegat Silver Basketball",
    teamTier: "Silver",
    skillScores: {
      ball_handling: 6.0,
      shooting: 6.8,
      finishing: 7.2,
      defense: 6.4,
      footwork: 6.5,
      iq_reads: 5.9,
      athleticism: 7.6,
      conditioning: 6.7,
    },
    skillDeltas: {
      ball_handling: 0.5,
      shooting: 1.2,
      finishing: 1.0,
      defense: 0.8,
      footwork: 0.6,
      iq_reads: 0.4,
      athleticism: 1.4,
      conditioning: 0.7,
    },
    overallTier: "Emerging",
    assessmentCount: 2,
    filmClipCount: 5,
    badgeCount: 1,
    coachabilityIndex: 7.0,
    attendanceRate: 0.79,
    idpOnTrack: false,
    isPublic: false,
    profileSlug: "amari-thompson-2029",
    lastAssessedAt: "2026-04-10T10:00:00Z",
  },
  {
    id: "rp_008",
    name: "Zion Frazier",
    position: "PF",
    gradYear: 2029,
    height: "6'6\"",
    wingspan: "6'11\"",
    programId: "prog_barnegat",
    programName: "Barnegat Gold Basketball",
    teamTier: "Gold",
    skillScores: {
      ball_handling: 5.4,
      shooting: 5.9,
      finishing: 7.8,
      defense: 7.2,
      footwork: 6.8,
      iq_reads: 5.5,
      athleticism: 8.3,
      conditioning: 7.0,
    },
    skillDeltas: {
      ball_handling: 0.9,
      shooting: 1.5,
      finishing: 2.3,
      defense: 1.7,
      footwork: 1.1,
      iq_reads: 0.6,
      athleticism: 1.2,
      conditioning: 0.8,
    },
    overallTier: "Emerging",
    assessmentCount: 3,
    filmClipCount: 6,
    badgeCount: 2,
    coachabilityIndex: 7.4,
    attendanceRate: 0.85,
    idpOnTrack: true,
    isPublic: false,
    profileSlug: "zion-frazier-2029",
    lastAssessedAt: "2026-04-22T10:00:00Z",
  },
];

// ─── Development Badges ───────────────────────────────────────────────────────

export const developmentBadges: DevelopmentBadge[] = [
  {
    id: "badge_breakthrough",
    name: "Breakthrough Performer",
    description: "Achieved a single-cycle score jump of 1.5+ points in any skill category",
    category: "skill",
    threshold: "Score delta ≥ 1.5 in one assessment cycle",
    iconKey: "flame",
    awardedInstances: [
      {
        id: "bi_001",
        badgeId: "badge_breakthrough",
        playerId: "rp_001",
        playerName: "Jordan Mills",
        awardedBy: "Coach Ray Williams",
        awardedByRole: "Head Coach",
        awardedAt: "2026-03-15T10:00:00Z",
        evidenceType: "assessment",
        evidenceId: "sa_jm_w12",
        evidenceNote: "Shooting score jumped from 6.6 to 8.4 across spring cycle — driven by form correction work in weekly sessions.",
        programName: "Barnegat Premier Basketball",
      },
      {
        id: "bi_002",
        badgeId: "badge_breakthrough",
        playerId: "rp_002",
        playerName: "Marcus Webb Jr.",
        awardedBy: "Coach Ray Williams",
        awardedByRole: "Head Coach",
        awardedAt: "2026-04-02T10:00:00Z",
        evidenceType: "assessment",
        evidenceId: "sa_mwj_w16",
        evidenceNote: "IQ & Reads jumped 2.4 points after 4 consecutive film study sessions — correctly identified all 5 P&R coverage types.",
        programName: "Barnegat Premier Basketball",
      },
    ],
  },
  {
    id: "badge_iron_man",
    name: "Iron Man",
    description: "95%+ attendance across an entire season",
    category: "behavioral",
    threshold: "Attendance rate ≥ 0.95 for full season",
    iconKey: "shield",
    awardedInstances: [
      {
        id: "bi_003",
        badgeId: "badge_iron_man",
        playerId: "rp_001",
        playerName: "Jordan Mills",
        awardedBy: "Coach Ray Williams",
        awardedByRole: "Head Coach",
        awardedAt: "2026-05-01T10:00:00Z",
        evidenceType: "attendance",
        evidenceNote: "96% attendance across Spring 2026 — missed only one practice due to school conflict, communicated in advance.",
        programName: "Barnegat Premier Basketball",
      },
      {
        id: "bi_004",
        badgeId: "badge_iron_man",
        playerId: "rp_002",
        playerName: "Marcus Webb Jr.",
        awardedBy: "Coach Ray Williams",
        awardedByRole: "Head Coach",
        awardedAt: "2026-05-01T10:00:00Z",
        evidenceType: "attendance",
        evidenceNote: "98% attendance — perfect record through all 22 sessions. Model of commitment.",
        programName: "Barnegat Premier Basketball",
      },
    ],
  },
  {
    id: "badge_film_student",
    name: "Film Student",
    description: "Completed 8+ coach-assigned film review sessions in one season",
    category: "behavioral",
    threshold: "8 or more film review assignments completed",
    iconKey: "film",
    awardedInstances: [
      {
        id: "bi_005",
        badgeId: "badge_film_student",
        playerId: "rp_001",
        playerName: "Jordan Mills",
        awardedBy: "Coach Ray Williams",
        awardedByRole: "Head Coach",
        awardedAt: "2026-04-20T10:00:00Z",
        evidenceType: "film",
        evidenceNote: "Completed 10 film sessions with written notes submitted — quality of observations has noticeably improved execution on-court.",
        programName: "Barnegat Premier Basketball",
      },
      {
        id: "bi_006",
        badgeId: "badge_film_student",
        playerId: "rp_002",
        playerName: "Marcus Webb Jr.",
        awardedBy: "Coach Ray Williams",
        awardedByRole: "Head Coach",
        awardedAt: "2026-04-20T10:00:00Z",
        evidenceType: "film",
        evidenceNote: "12 film review sessions — frequently asked clarifying questions about coverage schemes. Exceptional preparation habits.",
        programName: "Barnegat Premier Basketball",
      },
    ],
  },
  {
    id: "badge_coachable",
    name: "Most Coachable",
    description: "Coachability index of 8.5+ maintained for two consecutive assessment periods",
    category: "behavioral",
    threshold: "Coachability index ≥ 8.5 for 2+ consecutive cycles",
    iconKey: "users",
    awardedInstances: [
      {
        id: "bi_007",
        badgeId: "badge_coachable",
        playerId: "rp_001",
        playerName: "Jordan Mills",
        awardedBy: "Coach Darnell Price",
        awardedByRole: "Assistant Coach",
        awardedAt: "2026-04-15T10:00:00Z",
        evidenceType: "observation",
        evidenceNote: "Jordan receives feedback without defensiveness and immediately attempts corrections. Consistently models expected behavior for teammates.",
        programName: "Barnegat Premier Basketball",
      },
      {
        id: "bi_008",
        badgeId: "badge_coachable",
        playerId: "rp_002",
        playerName: "Marcus Webb Jr.",
        awardedBy: "Coach Darnell Price",
        awardedByRole: "Assistant Coach",
        awardedAt: "2026-04-15T10:00:00Z",
        evidenceType: "observation",
        evidenceNote: "Marcus actively seeks feedback between sessions and applies adjustments at the next practice. Outstanding coachability index of 9.2.",
        programName: "Barnegat Premier Basketball",
      },
    ],
  },
  {
    id: "badge_elite_shooter",
    name: "Elite Shooter",
    description: "Shooting skill score of 8.0+ verified across two consecutive assessments",
    category: "skill",
    threshold: "Shooting score ≥ 8.0 in 2 consecutive assessments",
    iconKey: "target",
    awardedInstances: [
      {
        id: "bi_009",
        badgeId: "badge_elite_shooter",
        playerId: "rp_001",
        playerName: "Jordan Mills",
        awardedBy: "Coach Ray Williams",
        awardedByRole: "Head Coach",
        awardedAt: "2026-05-02T10:00:00Z",
        evidenceType: "assessment",
        evidenceId: "sa_jm_w20",
        evidenceNote: "5-spot shooting test: 84% conversion across all spots including off-movement. Consistent mechanics under defensive contest.",
        programName: "Barnegat Premier Basketball",
      },
    ],
  },
  {
    id: "badge_floor_general",
    name: "Floor General",
    description: "IQ & Reads score of 8.5+ — demonstrates advanced read-and-react ability",
    category: "skill",
    threshold: "IQ & Reads score ≥ 8.5",
    iconKey: "star",
    awardedInstances: [
      {
        id: "bi_010",
        badgeId: "badge_floor_general",
        playerId: "rp_002",
        playerName: "Marcus Webb Jr.",
        awardedBy: "Coach Ray Williams",
        awardedByRole: "Head Coach",
        awardedAt: "2026-05-03T10:00:00Z",
        evidenceType: "assessment",
        evidenceId: "sa_mwj_w20",
        evidenceNote: "Correctly read 9 of 10 tagged film possessions including blitz, ICE, and switch coverages. Teaching peers in practice without prompting.",
        programName: "Barnegat Premier Basketball",
      },
    ],
  },
  {
    id: "badge_season_champion",
    name: "Season Champion",
    description: "Member of team that won a sanctioned tournament this season",
    category: "achievement",
    threshold: "Tournament win — minimum 4-team bracket",
    iconKey: "trophy",
    awardedInstances: [
      {
        id: "bi_011",
        badgeId: "badge_season_champion",
        playerId: "rp_001",
        playerName: "Jordan Mills",
        awardedBy: "Coach Ray Williams",
        awardedByRole: "Head Coach",
        awardedAt: "2026-04-28T10:00:00Z",
        evidenceType: "observation",
        evidenceNote: "Barnegat Premier 17U won the Shore Showcase Tournament — 4-0 record. Jordan contributed 18 pts in the championship game.",
        programName: "Barnegat Premier Basketball",
      },
      {
        id: "bi_012",
        badgeId: "badge_season_champion",
        playerId: "rp_002",
        playerName: "Marcus Webb Jr.",
        awardedBy: "Coach Ray Williams",
        awardedByRole: "Head Coach",
        awardedAt: "2026-04-28T10:00:00Z",
        evidenceType: "observation",
        evidenceNote: "Shore Showcase Tournament champion — Marcus ran the offense flawlessly in the semis and finals, recording 7 assists with 0 turnovers in the title game.",
        programName: "Barnegat Premier Basketball",
      },
    ],
  },
  {
    id: "badge_idp_complete",
    name: "IDP Cycle Complete",
    description: "Completed a full Individual Development Plan cycle with all goals evaluated",
    category: "achievement",
    threshold: "All IDP goal milestones evaluated at cycle end",
    iconKey: "clock",
    awardedInstances: [
      {
        id: "bi_013",
        badgeId: "badge_idp_complete",
        playerId: "rp_001",
        playerName: "Jordan Mills",
        awardedBy: "Coach Darnell Price",
        awardedByRole: "Assistant Coach",
        awardedAt: "2026-05-05T10:00:00Z",
        evidenceType: "assessment",
        evidenceId: "idp_jm_s26",
        evidenceNote: "Spring 2026 IDP: all 3 focus areas (shooting form, defensive closeouts, conditioning) fully evaluated. 2 of 3 goals met ahead of schedule.",
        programName: "Barnegat Premier Basketball",
      },
      {
        id: "bi_014",
        badgeId: "badge_idp_complete",
        playerId: "rp_002",
        playerName: "Marcus Webb Jr.",
        awardedBy: "Coach Darnell Price",
        awardedByRole: "Assistant Coach",
        awardedAt: "2026-05-05T10:00:00Z",
        evidenceType: "assessment",
        evidenceId: "idp_mwj_s26",
        evidenceNote: "Spring 2026 IDP: all 4 goals evaluated — ball handling under pressure, IQ reads, on-ball defense, and conditioning. All 4 goals met or exceeded.",
        programName: "Barnegat Premier Basketball",
      },
    ],
  },
];

// ─── Access Requests ──────────────────────────────────────────────────────────

export const accessRequests: AccessRequest[] = [
  {
    id: "ar_001",
    playerId: "rp_001",
    playerName: "Jordan Mills",
    requesterId: "rec_001",
    requesterName: "Coach Dana Reeves",
    requesterTitle: "Assistant Director of Recruiting",
    requesterSchool: "University of Vermont",
    requesterSchoolTier: "D1",
    status: "pending",
    requestedAt: "2026-05-10T14:22:00Z",
    requestMessage: "Hi Jordan — we've been following your development through the HoopsOS platform. Our staff is very interested in your shooting profile and overall trajectory. We'd love access to your full profile including film to better evaluate your fit for our program. We recruit 2027 SGs and your numbers are compelling.",
    accessLevel: "includes_film",
    viewCount: 0,
  },
  {
    id: "ar_002",
    playerId: "rp_001",
    playerName: "Jordan Mills",
    requesterId: "rec_002",
    requesterName: "Coach Marcus Bell",
    requesterTitle: "Head Recruiting Coordinator",
    requesterSchool: "Seton Hall University",
    requesterSchoolTier: "D1",
    status: "approved",
    requestedAt: "2026-04-18T09:00:00Z",
    respondedAt: "2026-04-19T11:00:00Z",
    expiresAt: "2026-07-19T11:00:00Z",
    requestMessage: "Jordan — our coaching staff has you on a priority watch list. We'd like to review your full skill profile and any available film before our summer evaluation period begins.",
    accessLevel: "full_profile",
    viewCount: 7,
  },
  {
    id: "ar_003",
    playerId: "rp_001",
    playerName: "Jordan Mills",
    requesterId: "rec_003",
    requesterName: "Coach Alicia Horton",
    requesterTitle: "Women's Basketball Recruiting",
    requesterSchool: "Monmouth University",
    requesterSchoolTier: "D1",
    status: "pending",
    requestedAt: "2026-05-12T16:45:00Z",
    requestMessage: "Reaching out to request profile access for Jordan Mills. We're actively evaluating 2027 guards and Jordan's skill trajectory is impressive. Would appreciate full profile access.",
    accessLevel: "full_profile",
    viewCount: 0,
  },
  {
    id: "ar_004",
    playerId: "rp_001",
    playerName: "Jordan Mills",
    requesterId: "rec_004",
    requesterName: "Coach Derek Sampson",
    requesterTitle: "Assistant Coach",
    requesterSchool: "Rider University",
    requesterSchoolTier: "D1",
    status: "denied",
    requestedAt: "2026-03-05T10:00:00Z",
    respondedAt: "2026-03-07T09:00:00Z",
    requestMessage: "We'd like to view Jordan's recruiting profile.",
    accessLevel: "profile_only",
    viewCount: 0,
  },
  {
    id: "ar_005",
    playerId: "rp_002",
    playerName: "Marcus Webb Jr.",
    requesterId: "rec_001",
    requesterName: "Coach Dana Reeves",
    requesterTitle: "Assistant Director of Recruiting",
    requesterSchool: "University of Vermont",
    requesterSchoolTier: "D1",
    status: "approved",
    requestedAt: "2026-04-22T11:00:00Z",
    respondedAt: "2026-04-23T09:30:00Z",
    expiresAt: "2026-07-23T09:30:00Z",
    requestMessage: "Marcus Webb Jr. is on our top-10 list for 2027 PGs. We'd love full access including film to prepare for our home visit conversation.",
    accessLevel: "includes_film",
    viewCount: 12,
  },
  {
    id: "ar_006",
    playerId: "rp_001",
    playerName: "Jordan Mills",
    requesterId: "rec_005",
    requesterName: "Coach Terri Mason",
    requesterTitle: "Head Coach",
    requesterSchool: "Stockton University",
    requesterSchoolTier: "D3",
    status: "expired",
    requestedAt: "2026-01-15T10:00:00Z",
    respondedAt: "2026-01-16T14:00:00Z",
    expiresAt: "2026-04-16T14:00:00Z",
    requestMessage: "We're evaluating 2027 SGs for our incoming class. Would appreciate access to Jordan's profile and skill data.",
    accessLevel: "full_profile",
    viewCount: 3,
  },
];

// ─── Access Log ───────────────────────────────────────────────────────────────

export const accessLog: AccessLogEntry[] = [
  {
    id: "al_001",
    playerId: "rp_001",
    requesterId: "rec_002",
    requesterName: "Coach Marcus Bell",
    requesterSchool: "Seton Hall University",
    viewedAt: "2026-05-14T09:15:00Z",
    sectionsViewed: ["skills", "coachability", "narrative"],
  },
  {
    id: "al_002",
    playerId: "rp_001",
    requesterId: "rec_002",
    requesterName: "Coach Marcus Bell",
    requesterSchool: "Seton Hall University",
    viewedAt: "2026-05-10T14:30:00Z",
    sectionsViewed: ["skills", "film", "badges"],
  },
  {
    id: "al_003",
    playerId: "rp_001",
    requesterId: "rec_002",
    requesterName: "Coach Marcus Bell",
    requesterSchool: "Seton Hall University",
    viewedAt: "2026-05-06T11:00:00Z",
    sectionsViewed: ["skills", "observations"],
  },
  {
    id: "al_004",
    playerId: "rp_001",
    requesterId: "rec_005",
    requesterName: "Coach Terri Mason",
    requesterSchool: "Stockton University",
    viewedAt: "2026-03-20T15:45:00Z",
    sectionsViewed: ["skills", "badges"],
  },
  {
    id: "al_005",
    playerId: "rp_001",
    requesterId: "rec_002",
    requesterName: "Coach Marcus Bell",
    requesterSchool: "Seton Hall University",
    viewedAt: "2026-04-28T10:00:00Z",
    sectionsViewed: ["film", "narrative"],
  },
  {
    id: "al_006",
    playerId: "rp_002",
    requesterId: "rec_001",
    requesterName: "Coach Dana Reeves",
    requesterSchool: "University of Vermont",
    viewedAt: "2026-05-15T08:30:00Z",
    sectionsViewed: ["skills", "film", "badges", "observations", "coachability"],
  },
  {
    id: "al_007",
    playerId: "rp_002",
    requesterId: "rec_001",
    requesterName: "Coach Dana Reeves",
    requesterSchool: "University of Vermont",
    viewedAt: "2026-05-12T16:00:00Z",
    sectionsViewed: ["skills", "narrative"],
  },
  {
    id: "al_008",
    playerId: "rp_001",
    requesterId: "rec_002",
    requesterName: "Coach Marcus Bell",
    requesterSchool: "Seton Hall University",
    viewedAt: "2026-04-20T09:00:00Z",
    sectionsViewed: ["skills"],
  },
  {
    id: "al_009",
    playerId: "rp_001",
    requesterId: "rec_005",
    requesterName: "Coach Terri Mason",
    requesterSchool: "Stockton University",
    viewedAt: "2026-02-10T13:00:00Z",
    sectionsViewed: ["skills", "badges"],
  },
  {
    id: "al_010",
    playerId: "rp_002",
    requesterId: "rec_001",
    requesterName: "Coach Dana Reeves",
    requesterSchool: "University of Vermont",
    viewedAt: "2026-05-09T11:30:00Z",
    sectionsViewed: ["film", "badges", "observations"],
  },
];

// ─── Recruiting Exports ───────────────────────────────────────────────────────

export const recruitingExports: RecruitingExport[] = [
  {
    id: "re_001",
    playerId: "rp_001",
    playerName: "Jordan Mills",
    generatedBy: "Coach Ray Williams",
    generatedAt: "2026-05-08T10:00:00Z",
    status: "shared",
    familyApprovedAt: "2026-05-09T14:00:00Z",
    clipIds: ["fc_001", "fc_002", "fc_003", "fc_004", "fc_005"],
    coachNarrative: "Jordan Mills is one of the most complete shooting guards we have developed in the Barnegat program. His technical shooting form is textbook — consistent release point, proper base, and exceptional off-movement accuracy at 84% conversion. What separates Jordan from other prospects his age is his coachability index of 8.7 and his response to film study. He applies corrections within one or two practice sessions and retains adjustments under game pressure. His defensive effort has improved dramatically this season, and his athleticism gives him the physical profile to guard multiple positions at the next level. Jordan's character is elite — he holds teammates to standards, communicates on the floor, and prepares like a professional. We believe he has the ceiling to compete for meaningful minutes at the D1 level and beyond.",
    featuredBadgeIds: ["badge_elite_shooter", "badge_iron_man", "badge_coachable", "badge_season_champion"],
    shareLink: "https://hoopsos.app/recruiting/jordan-mills-2027?token=export_abc123",
    shareLinkExpiresAt: "2026-08-08T10:00:00Z",
    downloadCount: 4,
    viewCount: 9,
  },
  {
    id: "re_002",
    playerId: "rp_001",
    playerName: "Jordan Mills",
    generatedBy: "Coach Darnell Price",
    generatedAt: "2026-03-15T10:00:00Z",
    status: "approved",
    familyApprovedAt: "2026-03-17T09:00:00Z",
    clipIds: ["fc_001", "fc_002", "fc_003"],
    coachNarrative: "Mid-season recruiting package for Jordan Mills — showcasing his shooting breakout and defensive improvements through the first 12 weeks of the Spring 2026 season.",
    featuredBadgeIds: ["badge_breakthrough", "badge_film_student"],
    downloadCount: 1,
    viewCount: 3,
  },
  {
    id: "re_003",
    playerId: "rp_001",
    playerName: "Jordan Mills",
    generatedBy: "Coach Ray Williams",
    generatedAt: "2026-05-13T16:00:00Z",
    status: "pending_approval",
    clipIds: ["fc_001", "fc_002", "fc_004", "fc_006"],
    coachNarrative: "Summer showcase prep export — updated with season-final assessment data and five additional annotated clips from the Shore Showcase tournament.",
    featuredBadgeIds: ["badge_elite_shooter", "badge_season_champion", "badge_iron_man", "badge_idp_complete", "badge_coachable"],
    downloadCount: 0,
    viewCount: 0,
  },
];

// ─── Film Clips ───────────────────────────────────────────────────────────────

export const filmClips: FilmClip[] = [
  {
    id: "fc_001",
    playerId: "rp_001",
    title: "Pull-Up Jumper — Shore Showcase Finals",
    description: "Mid-range pull-up off the dribble with defender in closeout. Perfect footwork and balance.",
    coachAnnotation: "Notice the gather step — Jordan creates space with a hesitation then fires with consistent release point even under contest. This is the shot we've been building all season.",
    skillTags: ["shooting", "footwork"],
    eventType: "tournament",
    eventDate: "2026-04-27T18:00:00Z",
    thumbnailUrl: "oklch(0.72 0.18 290)",
    durationSeconds: 34,
    isPublic: true,
    isInRecruitingPackage: true,
    coachSelectedForRecruiting: true,
  },
  {
    id: "fc_002",
    playerId: "rp_001",
    title: "Corner Three — Catch and Shoot",
    description: "Off-ball movement into catch-and-shoot corner three. Quick release, high arc.",
    coachAnnotation: "This sequence shows Jordan reading the skip pass and being in rhythm before the ball arrives. Feet set, knee bend locked, fires in under 0.7 seconds. Elite readiness.",
    skillTags: ["shooting", "iq_reads"],
    eventType: "game",
    eventDate: "2026-04-12T14:00:00Z",
    thumbnailUrl: "oklch(0.75 0.12 140)",
    durationSeconds: 28,
    isPublic: true,
    isInRecruitingPackage: true,
    coachSelectedForRecruiting: true,
  },
  {
    id: "fc_003",
    playerId: "rp_001",
    title: "Defensive Closeout — Contested Stop",
    description: "Full-speed closeout, high hand, no foul. Forces opponent into off-balance shot attempt.",
    coachAnnotation: "Jordan's closeout technique has transformed. Controlled approach, eyes on hips, hand perfectly positioned. Opponent missed the shot. This is why we spent 4 weeks on closeout work.",
    skillTags: ["defense", "athleticism"],
    eventType: "game",
    eventDate: "2026-04-05T14:00:00Z",
    thumbnailUrl: "oklch(0.68 0.22 25)",
    durationSeconds: 22,
    isPublic: true,
    isInRecruitingPackage: true,
    coachSelectedForRecruiting: true,
  },
  {
    id: "fc_004",
    playerId: "rp_001",
    title: "Ball Screen Navigation — Correct Read",
    description: "ICE coverage execution — funnels ball handler baseline, no foul on contact.",
    coachAnnotation: "Jordan recognized ICE coverage before the screen was set and communicated to his teammate. Executed perfectly — drove handler into the corner help, zero rotation required. Film study paying off.",
    skillTags: ["defense", "iq_reads"],
    eventType: "tournament",
    eventDate: "2026-04-26T15:00:00Z",
    thumbnailUrl: "oklch(0.78 0.16 75)",
    durationSeconds: 41,
    isPublic: true,
    isInRecruitingPackage: true,
    coachSelectedForRecruiting: true,
  },
  {
    id: "fc_005",
    playerId: "rp_001",
    title: "Transition Finish — And-1",
    description: "Secondary break, absorbs contact, finishes left-hand layup, draws foul.",
    coachAnnotation: "Body control at full speed. Jordan stays composed through contact and keeps the ball high — two things we've worked on specifically. Finishing with either hand is now a weapon.",
    skillTags: ["finishing", "athleticism", "conditioning"],
    eventType: "game",
    eventDate: "2026-04-19T14:00:00Z",
    thumbnailUrl: "oklch(0.72 0.18 290)",
    durationSeconds: 19,
    isPublic: true,
    isInRecruitingPackage: true,
    coachSelectedForRecruiting: true,
  },
  {
    id: "fc_006",
    playerId: "rp_001",
    title: "Crossover Into Pull-Up — Practice",
    description: "Cone drill speed to live 1v1 — uses crossover to create separation, hits pull-up.",
    coachAnnotation: "This rep in practice demonstrates Jordan's ability to connect skill work to live reps. The cone drill time has dropped from 16s to 11.4s — watch how that quickness shows up in the crossover here.",
    skillTags: ["ball_handling", "shooting"],
    eventType: "practice",
    eventDate: "2026-04-30T10:00:00Z",
    thumbnailUrl: "oklch(0.75 0.12 140)",
    durationSeconds: 37,
    isPublic: false,
    isInRecruitingPackage: false,
    coachSelectedForRecruiting: false,
  },
  {
    id: "fc_007",
    playerId: "rp_002",
    title: "P&R Read — Roller Find",
    description: "Perfect read on hedged screen — pull back, skip to roller for easy dunk.",
    coachAnnotation: "Marcus recognized the hedge before the screen was set. Pre-loaded the pocket pass before contacting the screen — roller was unguarded at the rim. Elite IQ.",
    skillTags: ["iq_reads", "ball_handling"],
    eventType: "game",
    eventDate: "2026-04-12T14:00:00Z",
    thumbnailUrl: "oklch(0.72 0.18 290)",
    durationSeconds: 29,
    isPublic: true,
    isInRecruitingPackage: true,
    coachSelectedForRecruiting: true,
  },
  {
    id: "fc_008",
    playerId: "rp_002",
    title: "On-Ball Stop — Switch Coverage",
    description: "Recognizes switch, attacks mismatch, then finds open shooter when help collapses.",
    coachAnnotation: "Two elite reads in one possession. First he recognizes the switch and attacks. When help comes, instead of forcing, he finds the open shooter in the corner. Floor general behavior.",
    skillTags: ["iq_reads", "defense"],
    eventType: "tournament",
    eventDate: "2026-04-26T16:00:00Z",
    thumbnailUrl: "oklch(0.75 0.12 140)",
    durationSeconds: 44,
    isPublic: true,
    isInRecruitingPackage: true,
    coachSelectedForRecruiting: true,
  },
  {
    id: "fc_009",
    playerId: "rp_003",
    title: "Block from Behind — Transition Defense",
    description: "Full-speed chase-down block, stays in bounds, ball retained.",
    coachAnnotation: "Darius tracked the ball from half court and timed the block perfectly — zero foul, kept the play alive. This is the athleticism and motor you're evaluating.",
    skillTags: ["defense", "athleticism"],
    eventType: "game",
    eventDate: "2026-04-05T14:00:00Z",
    thumbnailUrl: "oklch(0.68 0.22 25)",
    durationSeconds: 18,
    isPublic: true,
    isInRecruitingPackage: true,
    coachSelectedForRecruiting: true,
  },
  {
    id: "fc_010",
    playerId: "rp_003",
    title: "Post-Up Finish — Drop Step",
    description: "Low post drop step, uses size advantage, finishes with right hand.",
    coachAnnotation: "Darius has developed a reliable right-side drop step. Watch the footwork — clean pivot, no travel, finishes above the rim with authority. He's grown significantly in post work this season.",
    skillTags: ["finishing", "footwork"],
    eventType: "game",
    eventDate: "2026-04-12T14:00:00Z",
    thumbnailUrl: "oklch(0.78 0.16 75)",
    durationSeconds: 31,
    isPublic: true,
    isInRecruitingPackage: false,
    coachSelectedForRecruiting: false,
  },
  {
    id: "fc_011",
    playerId: "rp_004",
    title: "Mid-Range Pull-Up — Off the Elbow",
    description: "Catch from post feed, one-dribble pull-up off the elbow — clean form.",
    coachAnnotation: "Tyrese's mid-range development has been the story of his season. Previously a drive-only forward, he now has a reliable 15-foot shot that stretches defenses and creates driving lanes.",
    skillTags: ["shooting", "footwork"],
    eventType: "practice",
    eventDate: "2026-04-28T10:00:00Z",
    thumbnailUrl: "oklch(0.72 0.18 290)",
    durationSeconds: 26,
    isPublic: false,
    isInRecruitingPackage: false,
    coachSelectedForRecruiting: false,
    },
  {
    id: "fc_012",
    playerId: "rp_005",
    title: "Post Seal — Lob Finish",
    description: "Deep post seal, receives lob, finishes with both hands through contact.",
    coachAnnotation: "Khalil's post seal technique is exceptional for his age. He creates deep position before the pass and converts through contact at the rim. This is a 6'9\" body moving with purpose.",
    skillTags: ["finishing", "footwork"],
    eventType: "game",
    eventDate: "2026-04-05T14:00:00Z",
    thumbnailUrl: "oklch(0.75 0.12 140)",
    durationSeconds: 23,
    isPublic: false,
    isInRecruitingPackage: false,
    coachSelectedForRecruiting: false,
  },
];

// ─── Coach Narratives ─────────────────────────────────────────────────────────

export const coachNarratives: CoachNarrative[] = [
  {
    id: "cn_001",
    playerId: "rp_001",
    playerName: "Jordan Mills",
    authorName: "Coach Ray Williams",
    authorRole: "Head Coach — 17U",
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-05-08T10:00:00Z",
    body: "Jordan Mills came into this program as a skilled scorer who needed to develop the full package. Over the course of this season, he has become one of the most well-rounded shooting guards I have coached in twelve years with Barnegat. His shooting mechanics are elite — 84% conversion on the 5-spot test, consistent off-movement, and the ability to create his own shot off one or two dribbles. What the numbers don't capture fully is his competitive character. Jordan holds himself to a high standard and communicates that standard to his teammates without being asked. He was the player most responsible for our Shore Showcase championship run — not because of individual statistics, but because of his preparation and consistency when the games mattered most. He completes every film assignment with written notes and routinely applies corrections within a single practice session. His coachability index of 8.7 is among the highest I have measured in this program. Defensively, Jordan has made a genuine leap this season — his closeout technique, lateral footwork, and contest quality have each improved measurably. He is ready to compete at the D1 level and I would stake my reputation on his ceiling.",
    isApprovedByFamily: true,
    isPublic: true,
  },
  {
    id: "cn_002",
    playerId: "rp_002",
    playerName: "Marcus Webb Jr.",
    authorName: "Coach Ray Williams",
    authorRole: "Head Coach — 17U",
    createdAt: "2026-04-05T10:00:00Z",
    updatedAt: "2026-05-09T10:00:00Z",
    body: "Marcus Webb Jr. is the highest-IQ point guard I have worked with in a decade of coaching youth basketball. His ability to read defenses in real time and make the correct decision at full speed is something that cannot be taught in one season — Marcus came in with the instincts and we have sharpened them to an elite level. His IQ & Reads score of 9.0 leads our entire program. He correctly identified and executed against nine of ten tagged possessions in his final assessment cycle, including blitz, ICE, and switch coverages. In practice, Marcus voluntarily teaches coverages to teammates without being prompted — a rare quality at seventeen years old. He completed twelve coach-assigned film review sessions this season, more than any other player on the roster, and submitted written questions for each one. His coachability index of 9.2 is the highest we have measured in four years of structured assessments. Marcus also brings elite conditioning and athleticism — his sprint numbers rank in the top fifteen percent of our 17U cohort. He is, without question, a D1-caliber point guard and a young man who will thrive in any program that values intelligence and preparation.",
    isApprovedByFamily: true,
    isPublic: true,
  },
  {
    id: "cn_003",
    playerId: "rp_003",
    playerName: "Darius Cole",
    authorName: "Coach Darnell Price",
    authorRole: "Assistant Coach — 17U",
    createdAt: "2026-04-10T10:00:00Z",
    updatedAt: "2026-05-05T10:00:00Z",
    body: "Darius Cole is a versatile wing with a physical profile that naturally stands out at the 15U level — 6'6\" with a 6'10\" wingspan and elite athleticism. His defensive impact is already measurable: his athleticism score of 8.9 and defense score of 8.5 place him in the top tier of our program's tracked history for his age group. The chase-down block in the Shore Showcase semifinal was one of the most athletic individual defensive plays I have seen from a 15U player. Offensively, Darius is developing steadily. His finishing through contact has improved dramatically — his finishing score jumped 1.9 points this cycle — and his shooting is developing a reliable base. His IQ work is the next developmental frontier. We have started dedicated film study sessions with him and the improvement has been tangible. Darius absorbs coaching well and competes at a high level every session. His ceiling is elite if he continues to develop his offensive skill set to match the defensive impact he already delivers.",
    isApprovedByFamily: true,
    isPublic: true,
  },
  {
    id: "cn_004",
    playerId: "rp_004",
    playerName: "Tyrese Grant",
    authorName: "Coach Darnell Price",
    authorRole: "Assistant Coach — 17U",
    createdAt: "2026-04-15T10:00:00Z",
    updatedAt: "2026-05-02T10:00:00Z",
    body: "Tyrese Grant is a developing power forward with an intriguing combination of size, athleticism, and a rapidly improving perimeter skill set. At 6'7\" with a 7'0\" wingspan, he brings the physical tools that are increasingly valued for stretch-four roles at the college level. His finishing score of 8.4 and defense score of 7.9 establish him as a paint presence, but the story of his 2026 season is the emergence of a mid-range game. His footwork improvement — a score delta of 2.0 points, the largest single-category gain on the 17U roster — has enabled him to create off the elbow and convert pull-ups that simply were not available to him at the start of the year. Tyrese is a high-effort player who shows up for every session prepared to work. His IDP goals for this cycle focused on mid-range development and screen-to-roll timing, and both metrics have responded positively. He is on track to be a multi-dimensional big at the college level.",
    isApprovedByFamily: false,
    isPublic: false,
  },
];

// ─── Synthesis Summaries ──────────────────────────────────────────────────────

export const synthesisSummaries: SynthesisSummary[] = [
  {
    playerId: "rp_001",
    topGrowthArea: "shooting",
    topGrowthDelta: 1.8,
    mostFilmedSkill: "shooting",
    filmCorroborationScore: 0.91,
    coachObservationThemes: ["Elite shooting mechanics", "High coachability and film preparation", "Defensive closeout improvement"],
    growthRate: "top_10",
    narrative: "Jordan's assessment data and film record are strongly correlated — his shooting gains verified in structured tests are visibly replicated in game and tournament clips. His growth trajectory places him in the top 10% of tracked 17U SGs across the Barnegat program's four-year data set, and his coachability metrics suggest the gains will continue.",
  },
  {
    playerId: "rp_002",
    topGrowthArea: "iq_reads",
    topGrowthDelta: 2.4,
    mostFilmedSkill: "iq_reads",
    filmCorroborationScore: 0.94,
    coachObservationThemes: ["Floor general decision-making", "Exceptional film study habits", "Peer leadership in practice"],
    growthRate: "top_10",
    narrative: "Marcus's IQ & Reads growth is the sharpest single-category gain in the program's current cohort, and film evidence strongly corroborates his assessment scores. His cross-data profile — combining elite IQ scores, the highest coachability index recorded, and film evidence of correct real-time reads — presents an exceptionally complete recruiting dossier.",
  },
  {
    playerId: "rp_003",
    topGrowthArea: "defense",
    topGrowthDelta: 2.2,
    mostFilmedSkill: "defense",
    filmCorroborationScore: 0.87,
    coachObservationThemes: ["Explosive athleticism and motor", "Defensive impact above age level", "Finishing contact finishing development"],
    growthRate: "top_25",
    narrative: "Darius's athletic and defensive metrics are in the top quartile for his age group, and film evidence — particularly the chase-down blocks and post seals — strongly corroborates his assessment scores. His offensive development is the variable to watch as he matures.",
  },
  {
    playerId: "rp_004",
    topGrowthArea: "footwork",
    topGrowthDelta: 2.0,
    mostFilmedSkill: "finishing",
    filmCorroborationScore: 0.82,
    coachObservationThemes: ["Mid-range shot creation development", "Screen-to-roll timing improvement", "High-effort practice presence"],
    growthRate: "top_25",
    narrative: "Tyrese's footwork improvement is the catalyst behind his expanded offensive toolkit, and film from practice sessions shows the direct connection between drill work and live game application. His assessment profile positions him as a developing stretch-four with a trajectory trending strongly upward.",
  },
  {
    playerId: "rp_005",
    topGrowthArea: "finishing",
    topGrowthDelta: 2.1,
    mostFilmedSkill: "finishing",
    filmCorroborationScore: 0.79,
    coachObservationThemes: ["Post scoring and paint presence", "Physical tools above age level", "IDP engagement needs improvement"],
    growthRate: "average",
    narrative: "Khalil's finishing gains are the standout metric and are well-supported by film evidence of his post work. However, IDP engagement and overall assessment count remain below program benchmarks, suggesting unrealized potential that depends on consistency and commitment.",
  },
  {
    playerId: "rp_006",
    topGrowthArea: "ball_handling",
    topGrowthDelta: 1.9,
    mostFilmedSkill: "iq_reads",
    filmCorroborationScore: 0.83,
    coachObservationThemes: ["Ball handling speed improvement", "Advanced court vision for age", "Strong practice habits and IDP adherence"],
    growthRate: "top_25",
    narrative: "Devon's ball handling gains and IQ scores are both strong for a 2029 player, and his coachability index of 8.4 suggests the trajectory will continue. His overall skill profile is developing ahead of many peers at his stage.",
  },
  {
    playerId: "rp_007",
    topGrowthArea: "athleticism",
    topGrowthDelta: 1.4,
    mostFilmedSkill: "finishing",
    filmCorroborationScore: 0.71,
    coachObservationThemes: ["Athletic upside and frame development", "Shooting touch developing", "Attendance consistency a concern"],
    growthRate: "average",
    narrative: "Amari shows athletic upside that warrants continued development investment, but attendance gaps have limited both the assessment count and the depth of film evidence. Two more consistent seasons would significantly strengthen his recruiting dossier.",
  },
  {
    playerId: "rp_008",
    topGrowthArea: "finishing",
    topGrowthDelta: 2.3,
    mostFilmedSkill: "finishing",
    filmCorroborationScore: 0.86,
    coachObservationThemes: ["Finishing improvement most pronounced", "Wingspan and length translating to rim protection", "IQ development next frontier"],
    growthRate: "top_25",
    narrative: "Zion's finishing gains are the most significant jump in his cohort this cycle, and his physical profile provides a strong foundation for continued development. Film from recent game clips shows the finishing improvement translating under live defensive pressure.",
  },
];

// ─── Privacy Settings ─────────────────────────────────────────────────────────

export const privacySettings: PrivacySettings[] = [
  {
    playerId: "rp_001",
    publicFields: ["name", "position", "gradYear", "height", "program", "tier", "badgeCount", "growthSignal"],
    sharedFields: ["skillScores", "assessmentHistory", "filmClips", "coachObservations", "coachabilityIndex", "idpDetails", "attendance"],
    requireApprovalForAccess: true,
    accessExpiry: 90,
    allowRecruiterSearch: true,
  },
  {
    playerId: "rp_002",
    publicFields: ["name", "position", "gradYear", "height", "program", "tier", "badgeCount", "growthSignal"],
    sharedFields: ["skillScores", "assessmentHistory", "filmClips", "coachObservations", "coachabilityIndex", "idpDetails", "attendance"],
    requireApprovalForAccess: true,
    accessExpiry: 60,
    allowRecruiterSearch: true,
  },
  {
    playerId: "rp_003",
    publicFields: ["name", "position", "gradYear", "height", "program", "tier", "badgeCount", "growthSignal"],
    sharedFields: ["skillScores", "assessmentHistory", "filmClips", "coachObservations", "coachabilityIndex"],
    requireApprovalForAccess: true,
    accessExpiry: 60,
    allowRecruiterSearch: true,
  },
  {
    playerId: "rp_004",
    publicFields: ["name", "position", "gradYear", "height", "program", "tier", "badgeCount"],
    sharedFields: ["skillScores", "assessmentHistory", "coachabilityIndex"],
    requireApprovalForAccess: true,
    accessExpiry: 30,
    allowRecruiterSearch: true,
  },
  {
    playerId: "rp_005",
    publicFields: ["name", "position", "gradYear", "height", "program"],
    sharedFields: ["skillScores"],
    requireApprovalForAccess: true,
    accessExpiry: 30,
    allowRecruiterSearch: false,
  },
  {
    playerId: "rp_006",
    publicFields: ["name", "position", "gradYear", "height", "program", "tier", "badgeCount", "growthSignal"],
    sharedFields: ["skillScores", "assessmentHistory", "filmClips", "coachabilityIndex"],
    requireApprovalForAccess: true,
    accessExpiry: 60,
    allowRecruiterSearch: true,
  },
  {
    playerId: "rp_007",
    publicFields: ["name", "position", "gradYear", "height", "program"],
    sharedFields: ["skillScores"],
    requireApprovalForAccess: true,
    accessExpiry: 30,
    allowRecruiterSearch: false,
  },
  {
    playerId: "rp_008",
    publicFields: ["name", "position", "gradYear", "height", "program", "tier"],
    sharedFields: ["skillScores", "assessmentHistory"],
    requireApprovalForAccess: true,
    accessExpiry: 30,
    allowRecruiterSearch: false,
  },
];

// ─── Recruiter Profiles ───────────────────────────────────────────────────────

export const recruiterProfiles: RecruiterProfile[] = [
  {
    id: "rec_001",
    name: "Coach Dana Reeves",
    title: "Assistant Director of Recruiting",
    school: "University of Vermont",
    division: "D1",
    recruitingPositions: ["PG", "SG"],
    gradYearsTargeting: [2027, 2028],
    savedPlayerIds: ["rp_001", "rp_002"],
    accessRequestIds: ["ar_001", "ar_005"],
  },
  {
    id: "rec_002",
    name: "Coach Marcus Bell",
    title: "Head Recruiting Coordinator",
    school: "Seton Hall University",
    division: "D1",
    recruitingPositions: ["SG", "SF"],
    gradYearsTargeting: [2027],
    savedPlayerIds: ["rp_001"],
    accessRequestIds: ["ar_002"],
  },
  {
    id: "rec_003",
    name: "Coach Alicia Horton",
    title: "Women's Basketball Recruiting",
    school: "Monmouth University",
    division: "D1",
    recruitingPositions: ["PG", "SG"],
    gradYearsTargeting: [2027, 2028],
    savedPlayerIds: ["rp_001"],
    accessRequestIds: ["ar_003"],
  },
  {
    id: "rec_005",
    name: "Coach Terri Mason",
    title: "Head Coach",
    school: "Stockton University",
    division: "D3",
    recruitingPositions: ["SG", "SF", "PF"],
    gradYearsTargeting: [2027, 2028, 2029],
    savedPlayerIds: ["rp_001", "rp_003"],
    accessRequestIds: ["ar_006"],
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getPlayerBadges(playerId: string): BadgeInstance[] {
  return developmentBadges
    .flatMap((b) => b.awardedInstances)
    .filter((inst) => inst.playerId === playerId);
}

export function getPlayerAccessRequests(playerId: string): AccessRequest[] {
  return accessRequests.filter((r) => r.playerId === playerId);
}

export function getPlayerFilmClips(playerId: string): FilmClip[] {
  return filmClips.filter((c) => c.playerId === playerId);
}

export function getPlayerSynthesis(playerId: string): SynthesisSummary | undefined {
  return synthesisSummaries.find((s) => s.playerId === playerId);
}

export function getPlayerPrivacySettings(playerId: string): PrivacySettings | undefined {
  return privacySettings.find((p) => p.playerId === playerId);
}

export function getPlayerExports(playerId: string): RecruitingExport[] {
  return recruitingExports.filter((e) => e.playerId === playerId);
}

export function getPlayerNarrative(playerId: string): CoachNarrative | undefined {
  return coachNarratives.find((n) => n.playerId === playerId);
}
