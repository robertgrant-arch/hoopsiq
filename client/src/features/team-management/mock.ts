/* ==========================================================================
   HoopsOS Mock Data — Team Management
   Roster players, staff, documents, sub-groups with full household data.
   ========================================================================== */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type HouseholdMember = {
  id: string;
  name: string;
  relationship: "parent" | "guardian" | "sibling";
  phone: string;
  email: string;
  isPrimary: boolean;
  emergencyPriority: 1 | 2 | 3;
  hasMedicalAuth: boolean;
  preferredContact: "phone" | "email" | "app";
};

export type RosterPlayer = {
  id: string;
  name: string;
  initials: string;
  position: "PG" | "SG" | "SF" | "PF" | "C";
  jerseyNumber: number;
  ageGroup: string;
  gradYear: number;
  status: "active" | "trial" | "inactive" | "prospect";
  joinedDate: string;
  household: HouseholdMember[];
  medicalNotes?: string;
  attendanceRate: number;
  hasSignedWaiver: boolean;
  hasCompletedForms: boolean;
  hasActiveIDP: boolean;
  tags: string[];
};

export type StaffMember = {
  id: string;
  name: string;
  initials: string;
  role: "head_coach" | "assistant_coach" | "director" | "admin" | "volunteer";
  title: string;
  email: string;
  phone: string;
  teams: string[];
  certifications: string[];
  backgroundCheckStatus: "verified" | "pending" | "expired";
  backgroundCheckExpiry?: string;
  bio: string;
  joinedDate: string;
  isPublicFacing: boolean;
};

export type TeamDocument = {
  id: string;
  title: string;
  category: "handbook" | "waiver" | "medical" | "policy" | "media" | "resource" | "form";
  uploadedBy: string;
  uploadedAt: string;
  fileType: "pdf" | "doc" | "video" | "image" | "link";
  fileSize?: string;
  url: string;
  targetAudience: "all" | "coaches" | "parents" | "players";
  requiresAcknowledgment: boolean;
  acknowledgmentCount: number;
  totalRecipients: number;
  tags: string[];
  season?: string;
};

export type SubGroup = {
  id: string;
  name: string;
  type: "position" | "age" | "custom" | "staff_only" | "parents";
  memberIds: string[];
  coachIds: string[];
  description?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Roster Players — 12 players, 17U + 15U, 2 households with 2 athletes each
// ─────────────────────────────────────────────────────────────────────────────

export const rosterPlayers: RosterPlayer[] = [
  // ── Multi-athlete household 1: The Carter family (Marcus + Darius) ──
  {
    id: "rp_001",
    name: "Marcus Carter",
    initials: "MC",
    position: "PG",
    jerseyNumber: 3,
    ageGroup: "17U",
    gradYear: 2026,
    status: "active",
    joinedDate: "2023-09-01",
    attendanceRate: 94,
    hasSignedWaiver: true,
    hasCompletedForms: true,
    hasActiveIDP: true,
    tags: ["captain", "scholarship"],
    medicalNotes: "Mild patellar tendinitis — monitor load during back-to-back sessions.",
    household: [
      {
        id: "hm_001a",
        name: "Terrence Carter",
        relationship: "parent",
        phone: "(609) 555-0141",
        email: "terrence.carter@email.com",
        isPrimary: true,
        emergencyPriority: 1,
        hasMedicalAuth: true,
        preferredContact: "app",
      },
      {
        id: "hm_001b",
        name: "Denise Carter",
        relationship: "parent",
        phone: "(609) 555-0142",
        email: "denise.carter@email.com",
        isPrimary: false,
        emergencyPriority: 2,
        hasMedicalAuth: true,
        preferredContact: "email",
      },
    ],
  },
  {
    id: "rp_002",
    name: "Darius Carter",
    initials: "DC",
    position: "SF",
    jerseyNumber: 23,
    ageGroup: "15U",
    gradYear: 2028,
    status: "active",
    joinedDate: "2024-01-15",
    attendanceRate: 88,
    hasSignedWaiver: true,
    hasCompletedForms: true,
    hasActiveIDP: false,
    tags: ["new"],
    household: [
      {
        id: "hm_001a",
        name: "Terrence Carter",
        relationship: "parent",
        phone: "(609) 555-0141",
        email: "terrence.carter@email.com",
        isPrimary: true,
        emergencyPriority: 1,
        hasMedicalAuth: true,
        preferredContact: "app",
      },
      {
        id: "hm_001b",
        name: "Denise Carter",
        relationship: "parent",
        phone: "(609) 555-0142",
        email: "denise.carter@email.com",
        isPrimary: false,
        emergencyPriority: 2,
        hasMedicalAuth: true,
        preferredContact: "email",
      },
    ],
  },

  // ── Multi-athlete household 2: The Washington family (Jordan + Tyrell) ──
  {
    id: "rp_003",
    name: "Jordan Washington",
    initials: "JW",
    position: "SG",
    jerseyNumber: 11,
    ageGroup: "17U",
    gradYear: 2026,
    status: "active",
    joinedDate: "2022-08-20",
    attendanceRate: 97,
    hasSignedWaiver: true,
    hasCompletedForms: true,
    hasActiveIDP: true,
    tags: ["captain"],
    household: [
      {
        id: "hm_002a",
        name: "Lisa Washington",
        relationship: "parent",
        phone: "(732) 555-0201",
        email: "lisa.washington@email.com",
        isPrimary: true,
        emergencyPriority: 1,
        hasMedicalAuth: true,
        preferredContact: "phone",
      },
      {
        id: "hm_002b",
        name: "Kevin Washington",
        relationship: "parent",
        phone: "(732) 555-0202",
        email: "k.washington@work.com",
        isPrimary: false,
        emergencyPriority: 2,
        hasMedicalAuth: false,
        preferredContact: "email",
      },
    ],
  },
  {
    id: "rp_004",
    name: "Tyrell Washington",
    initials: "TW",
    position: "C",
    jerseyNumber: 44,
    ageGroup: "15U",
    gradYear: 2028,
    status: "active",
    joinedDate: "2024-09-05",
    attendanceRate: 82,
    hasSignedWaiver: true,
    hasCompletedForms: false,
    hasActiveIDP: false,
    tags: ["new"],
    medicalNotes: "Allergy to penicillin. EpiPen on file with trainer.",
    household: [
      {
        id: "hm_002a",
        name: "Lisa Washington",
        relationship: "parent",
        phone: "(732) 555-0201",
        email: "lisa.washington@email.com",
        isPrimary: true,
        emergencyPriority: 1,
        hasMedicalAuth: true,
        preferredContact: "phone",
      },
      {
        id: "hm_002b",
        name: "Kevin Washington",
        relationship: "parent",
        phone: "(732) 555-0202",
        email: "k.washington@work.com",
        isPrimary: false,
        emergencyPriority: 2,
        hasMedicalAuth: false,
        preferredContact: "email",
      },
    ],
  },

  // ── Additional 17U players ──
  {
    id: "rp_005",
    name: "Isaiah Brooks",
    initials: "IB",
    position: "PF",
    jerseyNumber: 34,
    ageGroup: "17U",
    gradYear: 2026,
    status: "active",
    joinedDate: "2023-09-01",
    attendanceRate: 91,
    hasSignedWaiver: true,
    hasCompletedForms: true,
    hasActiveIDP: true,
    tags: ["scholarship"],
    household: [
      {
        id: "hm_003a",
        name: "Michelle Brooks",
        relationship: "parent",
        phone: "(609) 555-0310",
        email: "mbrooks@email.com",
        isPrimary: true,
        emergencyPriority: 1,
        hasMedicalAuth: true,
        preferredContact: "app",
      },
      {
        id: "hm_003b",
        name: "Robert Brooks",
        relationship: "parent",
        phone: "(609) 555-0311",
        email: "rbrooks@email.com",
        isPrimary: false,
        emergencyPriority: 2,
        hasMedicalAuth: true,
        preferredContact: "phone",
      },
    ],
  },
  {
    id: "rp_006",
    name: "Caleb Monroe",
    initials: "CM",
    position: "C",
    jerseyNumber: 50,
    ageGroup: "17U",
    gradYear: 2026,
    status: "active",
    joinedDate: "2023-09-01",
    attendanceRate: 78,
    hasSignedWaiver: true,
    hasCompletedForms: true,
    hasActiveIDP: false,
    tags: [],
    medicalNotes: "Asthma — uses Albuterol inhaler. Cleared for full activity.",
    household: [
      {
        id: "hm_004a",
        name: "Phyllis Monroe",
        relationship: "guardian",
        phone: "(732) 555-0401",
        email: "p.monroe@email.com",
        isPrimary: true,
        emergencyPriority: 1,
        hasMedicalAuth: true,
        preferredContact: "phone",
      },
    ],
  },
  {
    id: "rp_007",
    name: "Devonte Simmons",
    initials: "DS",
    position: "PG",
    jerseyNumber: 5,
    ageGroup: "17U",
    gradYear: 2027,
    status: "active",
    joinedDate: "2024-01-10",
    attendanceRate: 85,
    hasSignedWaiver: true,
    hasCompletedForms: true,
    hasActiveIDP: true,
    tags: [],
    household: [
      {
        id: "hm_005a",
        name: "Angela Simmons",
        relationship: "parent",
        phone: "(609) 555-0501",
        email: "angela.simmons@email.com",
        isPrimary: true,
        emergencyPriority: 1,
        hasMedicalAuth: true,
        preferredContact: "email",
      },
      {
        id: "hm_005b",
        name: "Jerome Simmons",
        relationship: "parent",
        phone: "(609) 555-0502",
        email: "jerome.simmons@email.com",
        isPrimary: false,
        emergencyPriority: 2,
        hasMedicalAuth: false,
        preferredContact: "phone",
      },
    ],
  },

  // ── Additional 15U players ──
  {
    id: "rp_008",
    name: "Malik Torres",
    initials: "MT",
    position: "SG",
    jerseyNumber: 12,
    ageGroup: "15U",
    gradYear: 2028,
    status: "active",
    joinedDate: "2024-09-01",
    attendanceRate: 90,
    hasSignedWaiver: true,
    hasCompletedForms: true,
    hasActiveIDP: false,
    tags: [],
    household: [
      {
        id: "hm_006a",
        name: "Carlos Torres",
        relationship: "parent",
        phone: "(732) 555-0601",
        email: "carlos.torres@email.com",
        isPrimary: true,
        emergencyPriority: 1,
        hasMedicalAuth: true,
        preferredContact: "app",
      },
      {
        id: "hm_006b",
        name: "Rosa Torres",
        relationship: "parent",
        phone: "(732) 555-0602",
        email: "rosa.torres@email.com",
        isPrimary: false,
        emergencyPriority: 2,
        hasMedicalAuth: true,
        preferredContact: "phone",
      },
    ],
  },
  {
    id: "rp_009",
    name: "Andre Mitchell",
    initials: "AM",
    position: "PF",
    jerseyNumber: 32,
    ageGroup: "15U",
    gradYear: 2029,
    status: "trial",
    joinedDate: "2025-04-15",
    attendanceRate: 72,
    hasSignedWaiver: false,
    hasCompletedForms: false,
    hasActiveIDP: false,
    tags: ["new"],
    household: [
      {
        id: "hm_007a",
        name: "Patricia Mitchell",
        relationship: "parent",
        phone: "(609) 555-0701",
        email: "p.mitchell@email.com",
        isPrimary: true,
        emergencyPriority: 1,
        hasMedicalAuth: false,
        preferredContact: "email",
      },
    ],
  },
  {
    id: "rp_010",
    name: "Xavier Coleman",
    initials: "XC",
    position: "SF",
    jerseyNumber: 21,
    ageGroup: "15U",
    gradYear: 2028,
    status: "active",
    joinedDate: "2024-09-01",
    attendanceRate: 93,
    hasSignedWaiver: true,
    hasCompletedForms: true,
    hasActiveIDP: false,
    tags: [],
    household: [
      {
        id: "hm_008a",
        name: "Diane Coleman",
        relationship: "parent",
        phone: "(732) 555-0801",
        email: "diane.coleman@email.com",
        isPrimary: true,
        emergencyPriority: 1,
        hasMedicalAuth: true,
        preferredContact: "app",
      },
      {
        id: "hm_008b",
        name: "Marcus Coleman Sr.",
        relationship: "parent",
        phone: "(732) 555-0802",
        email: "mcoleman@email.com",
        isPrimary: false,
        emergencyPriority: 2,
        hasMedicalAuth: true,
        preferredContact: "phone",
      },
    ],
  },
  {
    id: "rp_011",
    name: "Nathan Pierce",
    initials: "NP",
    position: "PG",
    jerseyNumber: 1,
    ageGroup: "17U",
    gradYear: 2027,
    status: "inactive",
    joinedDate: "2023-09-01",
    attendanceRate: 55,
    hasSignedWaiver: true,
    hasCompletedForms: true,
    hasActiveIDP: false,
    tags: [],
    medicalNotes: "Ankle sprain — sitting out until cleared by orthopedist.",
    household: [
      {
        id: "hm_009a",
        name: "Gwen Pierce",
        relationship: "parent",
        phone: "(609) 555-0901",
        email: "gwen.pierce@email.com",
        isPrimary: true,
        emergencyPriority: 1,
        hasMedicalAuth: true,
        preferredContact: "phone",
      },
    ],
  },
  {
    id: "rp_012",
    name: "Elijah Hayes",
    initials: "EH",
    position: "C",
    jerseyNumber: 55,
    ageGroup: "15U",
    gradYear: 2029,
    status: "active",
    joinedDate: "2024-09-01",
    attendanceRate: 87,
    hasSignedWaiver: true,
    hasCompletedForms: true,
    hasActiveIDP: false,
    tags: [],
    household: [
      {
        id: "hm_010a",
        name: "Sandra Hayes",
        relationship: "parent",
        phone: "(732) 555-1001",
        email: "sandra.hayes@email.com",
        isPrimary: true,
        emergencyPriority: 1,
        hasMedicalAuth: true,
        preferredContact: "app",
      },
      {
        id: "hm_010b",
        name: "Brian Hayes",
        relationship: "parent",
        phone: "(732) 555-1002",
        email: "brian.hayes@email.com",
        isPrimary: false,
        emergencyPriority: 2,
        hasMedicalAuth: true,
        preferredContact: "email",
      },
      {
        id: "hm_010c",
        name: "Jada Hayes",
        relationship: "sibling",
        phone: "(732) 555-1003",
        email: "jada.hayes@school.edu",
        isPrimary: false,
        emergencyPriority: 3,
        hasMedicalAuth: false,
        preferredContact: "phone",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Prospects (trial pipeline — shown at bottom of roster)
// ─────────────────────────────────────────────────────────────────────────────

export const prospectPlayers: RosterPlayer[] = [
  {
    id: "rp_p01",
    name: "Bryce Holloway",
    initials: "BH",
    position: "SG",
    jerseyNumber: 0,
    ageGroup: "17U",
    gradYear: 2027,
    status: "prospect",
    joinedDate: "2026-05-01",
    attendanceRate: 67,
    hasSignedWaiver: false,
    hasCompletedForms: false,
    hasActiveIDP: false,
    tags: ["new"],
    household: [
      {
        id: "hm_p01a",
        name: "Denise Holloway",
        relationship: "parent",
        phone: "(609) 555-1101",
        email: "d.holloway@email.com",
        isPrimary: true,
        emergencyPriority: 1,
        hasMedicalAuth: false,
        preferredContact: "email",
      },
    ],
  },
  {
    id: "rp_p02",
    name: "Quincy Reeves",
    initials: "QR",
    position: "PF",
    jerseyNumber: 0,
    ageGroup: "15U",
    gradYear: 2029,
    status: "prospect",
    joinedDate: "2026-05-08",
    attendanceRate: 80,
    hasSignedWaiver: false,
    hasCompletedForms: false,
    hasActiveIDP: false,
    tags: ["new"],
    household: [
      {
        id: "hm_p02a",
        name: "Maurice Reeves",
        relationship: "parent",
        phone: "(732) 555-1201",
        email: "m.reeves@email.com",
        isPrimary: true,
        emergencyPriority: 1,
        hasMedicalAuth: false,
        preferredContact: "phone",
      },
    ],
  },
  {
    id: "rp_p03",
    name: "Trevon Gill",
    initials: "TG",
    position: "C",
    jerseyNumber: 0,
    ageGroup: "17U",
    gradYear: 2026,
    status: "prospect",
    joinedDate: "2026-05-10",
    attendanceRate: 100,
    hasSignedWaiver: false,
    hasCompletedForms: false,
    hasActiveIDP: false,
    tags: [],
    household: [
      {
        id: "hm_p03a",
        name: "Sharon Gill",
        relationship: "parent",
        phone: "(609) 555-1301",
        email: "sharon.gill@email.com",
        isPrimary: true,
        emergencyPriority: 1,
        hasMedicalAuth: false,
        preferredContact: "app",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Staff Members — 5 staff
// ─────────────────────────────────────────────────────────────────────────────

export const staffMembers: StaffMember[] = [
  {
    id: "sm_001",
    name: "Coach Ray Williams",
    initials: "RW",
    role: "head_coach",
    title: "Head Coach — 17U",
    email: "ray.williams@barnegat.org",
    phone: "(609) 555-2001",
    teams: ["team_17u"],
    certifications: ["USA Basketball Gold License", "PGC Guard School Certified", "CPR/AED"],
    backgroundCheckStatus: "verified",
    backgroundCheckExpiry: "2027-03-15",
    bio: "Coach Williams has 12 years of AAU experience and has coached 18 players to Division I scholarships. He specializes in guard development and reads-based offense systems.",
    joinedDate: "2019-06-01",
    isPublicFacing: true,
  },
  {
    id: "sm_002",
    name: "Coach Darnell Price",
    initials: "DP",
    role: "assistant_coach",
    title: "Assistant Coach — 17U",
    email: "darnell.price@barnegat.org",
    phone: "(732) 555-2002",
    teams: ["team_17u"],
    certifications: ["USA Basketball Silver License", "NSCA-CSCS", "CPR/AED"],
    backgroundCheckStatus: "verified",
    backgroundCheckExpiry: "2026-11-30",
    bio: "Coach Price brings a strength & conditioning background to his coaching. Former D3 college player, he focuses on player movement efficiency and post-game film review.",
    joinedDate: "2021-09-01",
    isPublicFacing: true,
  },
  {
    id: "sm_003",
    name: "Coach Tamika Foster",
    initials: "TF",
    role: "assistant_coach",
    title: "Assistant Coach — 15U",
    email: "tamika.foster@barnegat.org",
    phone: "(609) 555-2003",
    teams: ["team_15u"],
    certifications: ["USA Basketball Silver License", "CPR/AED"],
    backgroundCheckStatus: "pending",
    bio: "Coach Foster is entering her second season with Barnegat. A former collegiate point guard, she runs the skill development program for the 15U squad.",
    joinedDate: "2025-09-01",
    isPublicFacing: true,
  },
  {
    id: "sm_004",
    name: "Marcus Webb",
    initials: "MW",
    role: "director",
    title: "Program Director",
    email: "m.webb@barnegat.org",
    phone: "(732) 555-2004",
    teams: ["team_17u", "team_15u"],
    certifications: ["USA Basketball Bronze License", "SafeSport Certified"],
    backgroundCheckStatus: "verified",
    backgroundCheckExpiry: "2027-06-01",
    bio: "Marcus founded the Barnegat program in 2015 and oversees all player development initiatives, scheduling, and community outreach efforts.",
    joinedDate: "2015-01-01",
    isPublicFacing: true,
  },
  {
    id: "sm_005",
    name: "Keisha Norris",
    initials: "KN",
    role: "admin",
    title: "Team Administrator",
    email: "keisha.norris@barnegat.org",
    phone: "(609) 555-2005",
    teams: ["team_17u", "team_15u"],
    certifications: ["SafeSport Certified"],
    backgroundCheckStatus: "expired",
    backgroundCheckExpiry: "2025-12-31",
    bio: "Keisha manages registration, forms compliance, parent communications, and tournament logistics for both Barnegat squads.",
    joinedDate: "2022-01-15",
    isPublicFacing: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Team Documents — 14 documents across all categories
// ─────────────────────────────────────────────────────────────────────────────

export const teamDocuments: TeamDocument[] = [
  {
    id: "doc_001",
    title: "Spring 2026 Team Handbook",
    category: "handbook",
    uploadedBy: "Keisha Norris",
    uploadedAt: "2026-02-01",
    fileType: "pdf",
    fileSize: "2.4 MB",
    url: "/mock/spring-2026-handbook.pdf",
    targetAudience: "all",
    requiresAcknowledgment: true,
    acknowledgmentCount: 10,
    totalRecipients: 12,
    tags: ["essential", "season"],
    season: "Spring 2026",
  },
  {
    id: "doc_002",
    title: "Participant Liability Waiver — Spring 2026",
    category: "waiver",
    uploadedBy: "Keisha Norris",
    uploadedAt: "2026-02-01",
    fileType: "pdf",
    fileSize: "580 KB",
    url: "/mock/waiver-spring-2026.pdf",
    targetAudience: "parents",
    requiresAcknowledgment: true,
    acknowledgmentCount: 11,
    totalRecipients: 12,
    tags: ["essential", "legal"],
    season: "Spring 2026",
  },
  {
    id: "doc_003",
    title: "Photo & Media Release Form",
    category: "waiver",
    uploadedBy: "Keisha Norris",
    uploadedAt: "2026-02-01",
    fileType: "pdf",
    fileSize: "240 KB",
    url: "/mock/media-release.pdf",
    targetAudience: "parents",
    requiresAcknowledgment: true,
    acknowledgmentCount: 8,
    totalRecipients: 12,
    tags: ["media", "legal"],
    season: "Spring 2026",
  },
  {
    id: "doc_004",
    title: "Emergency Medical Authorization Form",
    category: "medical",
    uploadedBy: "Coach Ray Williams",
    uploadedAt: "2026-02-05",
    fileType: "pdf",
    fileSize: "310 KB",
    url: "/mock/emergency-medical-auth.pdf",
    targetAudience: "parents",
    requiresAcknowledgment: true,
    acknowledgmentCount: 9,
    totalRecipients: 12,
    tags: ["medical", "emergency"],
    season: "Spring 2026",
  },
  {
    id: "doc_005",
    title: "Concussion Protocol & Return-to-Play Policy",
    category: "medical",
    uploadedBy: "Marcus Webb",
    uploadedAt: "2026-01-15",
    fileType: "pdf",
    fileSize: "890 KB",
    url: "/mock/concussion-protocol.pdf",
    targetAudience: "all",
    requiresAcknowledgment: true,
    acknowledgmentCount: 14,
    totalRecipients: 17,
    tags: ["medical", "policy", "safety"],
    season: "Spring 2026",
  },
  {
    id: "doc_006",
    title: "Code of Conduct — Players & Parents",
    category: "policy",
    uploadedBy: "Marcus Webb",
    uploadedAt: "2026-01-15",
    fileType: "pdf",
    fileSize: "450 KB",
    url: "/mock/code-of-conduct.pdf",
    targetAudience: "all",
    requiresAcknowledgment: true,
    acknowledgmentCount: 15,
    totalRecipients: 17,
    tags: ["policy", "essential"],
    season: "Spring 2026",
  },
  {
    id: "doc_007",
    title: "Travel Policy & Chaperone Guidelines",
    category: "policy",
    uploadedBy: "Marcus Webb",
    uploadedAt: "2026-02-10",
    fileType: "pdf",
    fileSize: "620 KB",
    url: "/mock/travel-policy.pdf",
    targetAudience: "parents",
    requiresAcknowledgment: false,
    acknowledgmentCount: 0,
    totalRecipients: 12,
    tags: ["policy", "travel"],
    season: "Spring 2026",
  },
  {
    id: "doc_008",
    title: "Spring 2026 Tournament Schedule",
    category: "resource",
    uploadedBy: "Keisha Norris",
    uploadedAt: "2026-03-01",
    fileType: "pdf",
    fileSize: "180 KB",
    url: "/mock/tournament-schedule.pdf",
    targetAudience: "all",
    requiresAcknowledgment: false,
    acknowledgmentCount: 0,
    totalRecipients: 17,
    tags: ["schedule", "season"],
    season: "Spring 2026",
  },
  {
    id: "doc_009",
    title: "Strength & Conditioning Guide — Off-Season",
    category: "resource",
    uploadedBy: "Coach Darnell Price",
    uploadedAt: "2026-04-01",
    fileType: "pdf",
    fileSize: "3.1 MB",
    url: "/mock/sc-guide.pdf",
    targetAudience: "players",
    requiresAcknowledgment: false,
    acknowledgmentCount: 0,
    totalRecipients: 12,
    tags: ["training", "development"],
    season: "Spring 2026",
  },
  {
    id: "doc_010",
    title: "17U vs Shore Ballers — Game Film",
    category: "media",
    uploadedBy: "Coach Ray Williams",
    uploadedAt: "2026-04-20",
    fileType: "video",
    url: "https://vimeo.com/mock/123456",
    targetAudience: "coaches",
    requiresAcknowledgment: false,
    acknowledgmentCount: 0,
    totalRecipients: 3,
    tags: ["film", "17U"],
    season: "Spring 2026",
  },
  {
    id: "doc_011",
    title: "End-of-Season Highlights Reel",
    category: "media",
    uploadedBy: "Keisha Norris",
    uploadedAt: "2026-05-10",
    fileType: "video",
    url: "https://vimeo.com/mock/789012",
    targetAudience: "all",
    requiresAcknowledgment: false,
    acknowledgmentCount: 0,
    totalRecipients: 17,
    tags: ["film", "highlights"],
    season: "Spring 2026",
  },
  {
    id: "doc_012",
    title: "Fall 2025 Team Handbook",
    category: "handbook",
    uploadedBy: "Keisha Norris",
    uploadedAt: "2025-09-01",
    fileType: "pdf",
    fileSize: "2.1 MB",
    url: "/mock/fall-2025-handbook.pdf",
    targetAudience: "all",
    requiresAcknowledgment: true,
    acknowledgmentCount: 17,
    totalRecipients: 17,
    tags: ["essential", "season"],
    season: "Fall 2025",
  },
  {
    id: "doc_013",
    title: "Nutrition & Recovery Playbook",
    category: "resource",
    uploadedBy: "Coach Darnell Price",
    uploadedAt: "2026-03-15",
    fileType: "pdf",
    fileSize: "1.4 MB",
    url: "/mock/nutrition-guide.pdf",
    targetAudience: "players",
    requiresAcknowledgment: false,
    acknowledgmentCount: 0,
    totalRecipients: 12,
    tags: ["nutrition", "health"],
    season: "Spring 2026",
  },
  {
    id: "doc_014",
    title: "2026 USA Basketball Player Registration",
    category: "form",
    uploadedBy: "Keisha Norris",
    uploadedAt: "2026-01-10",
    fileType: "link",
    url: "https://usab.com/mock/registration",
    targetAudience: "parents",
    requiresAcknowledgment: true,
    acknowledgmentCount: 10,
    totalRecipients: 12,
    tags: ["registration", "external"],
    season: "Spring 2026",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Groups — 7 groups
// ─────────────────────────────────────────────────────────────────────────────

export const subGroups: SubGroup[] = [
  {
    id: "sg_guards",
    name: "Guards",
    type: "position",
    memberIds: ["rp_001", "rp_003", "rp_007", "rp_008"],
    coachIds: ["sm_001", "sm_003"],
    description: "PG and SG position group — handles & half-court sets",
  },
  {
    id: "sg_wings",
    name: "Wings",
    type: "position",
    memberIds: ["rp_002", "rp_010"],
    coachIds: ["sm_001", "sm_002"],
    description: "SF position group — versatility and shot creation",
  },
  {
    id: "sg_bigs",
    name: "Bigs",
    type: "position",
    memberIds: ["rp_004", "rp_005", "rp_006", "rp_009", "rp_012"],
    coachIds: ["sm_002", "sm_003"],
    description: "PF and C position group — paint finishing and screen work",
  },
  {
    id: "sg_17u",
    name: "17U Squad",
    type: "age",
    memberIds: ["rp_001", "rp_003", "rp_005", "rp_006", "rp_007", "rp_011"],
    coachIds: ["sm_001", "sm_002"],
    description: "Barnegat 17U — Spring 2026",
  },
  {
    id: "sg_15u",
    name: "15U Squad",
    type: "age",
    memberIds: ["rp_002", "rp_004", "rp_008", "rp_009", "rp_010", "rp_012"],
    coachIds: ["sm_003"],
    description: "Barnegat 15U — Spring 2026",
  },
  {
    id: "sg_parents",
    name: "All Parents",
    type: "parents",
    memberIds: [
      "hm_001a", "hm_001b", "hm_002a", "hm_002b", "hm_003a", "hm_003b",
      "hm_004a", "hm_005a", "hm_005b", "hm_006a", "hm_006b", "hm_007a",
      "hm_008a", "hm_008b", "hm_009a", "hm_010a", "hm_010b",
    ],
    coachIds: [],
    description: "All registered parents and guardians — season communications",
  },
  {
    id: "sg_coaches",
    name: "Coaching Staff",
    type: "staff_only",
    memberIds: [],
    coachIds: ["sm_001", "sm_002", "sm_003", "sm_004", "sm_005"],
    description: "Internal staff channel — scouting reports and practice notes",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

export function getPlayerById(id: string): RosterPlayer | undefined {
  return [...rosterPlayers, ...prospectPlayers].find((p) => p.id === id);
}

export function getHousehold(playerId: string): HouseholdMember[] {
  return getPlayerById(playerId)?.household ?? [];
}

export function getStaffByRole(role: StaffMember["role"]): StaffMember[] {
  return staffMembers.filter((s) => s.role === role);
}

export function getDocumentsByCategory(cat: TeamDocument["category"]): TeamDocument[] {
  return teamDocuments.filter((d) => d.category === cat);
}

export function getDocumentAcknowledgmentRate(doc: TeamDocument): number {
  if (!doc.requiresAcknowledgment || doc.totalRecipients === 0) return 100;
  return Math.round((doc.acknowledgmentCount / doc.totalRecipients) * 100);
}

export function getSubGroupMembers(groupId: string): {
  players: RosterPlayer[];
  staff: StaffMember[];
} {
  const group = subGroups.find((g) => g.id === groupId);
  if (!group) return { players: [], staff: [] };

  const players = group.memberIds
    .map((id) => getPlayerById(id))
    .filter((p): p is RosterPlayer => p !== undefined);

  const staff = group.coachIds
    .map((id) => staffMembers.find((s) => s.id === id))
    .filter((s): s is StaffMember => s !== undefined);

  return { players, staff };
}
