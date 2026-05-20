/**
 * AppShell — responsive app container for HoopsOS.
 *
 * COACH role:
 *   Mobile:
 *     • CoachHeader      — top bar (section title + logo mark + avatar)
 *                          + sticky sub-nav row for Team / Film / Plans sections
 *     • CoachBottomNav   — 5-tab bar (Home·Team·Film·Plans·Inbox)
 *                          Live badges via useCoachBadgeCounts
 *                          Haptic feedback via @capacitor/haptics on native
 *     • Swipe navigation — horizontal swipe between pages within a section
 *     • CoachProfileSheet— right-side sheet: profile + overflow + sign out
 *   Desktop:
 *     • CoachDesktopSidebar — grouped sections: DAILY/TEAM/FILM/BUILD/MORE
 *
 * Other roles:
 *   Mobile:  4-tab + right-side More sheet, improved touch targets
 *   Desktop: flat sidebar with role-accent active states
 *
 * Safe-area insets via env(safe-area-inset-*) for iOS/Capacitor.
 * All tap targets ≥ 44 × 44 px.
 */
import { useState, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Dumbbell,
  UploadCloud,
  TrendingUp,
  Trophy,
  MessageSquare,
  ListChecks,
  Users,
  ClipboardList,
  Film,
  LayoutDashboard,
  BookOpen,
  Calendar,
  CalendarDays,
  Package,
  Radio,
  GraduationCap,
  CreditCard,
  Shield,
  Flag,
  Database,
  Activity,
  LogOut,
  User as UserIcon,
  Heart,
  Target,
  X,
  MoreHorizontal,
  Crosshair,
  Bell,
  FileText,
  CheckSquare,
  ClipboardCheck,
  DollarSign,
  PlusCircle,
  Tag,
  ChevronRight,
  Inbox,
  Megaphone,
  BarChart2,
  AlertTriangle,
  Star,
  Sparkles,
  Award,
  GripVertical,
  Settings2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "@/lib/auth";
import { ROLE_META, type Role } from "@/lib/mock/users";
import { Logo } from "@/components/brand/Logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCoachBadgeCounts, formatBadge } from "@/lib/api/hooks/useCoachBadgeCounts";
import { hapticLight, hapticSelection } from "@/lib/haptics";
import {
  readCoachSectionOrder,
  writeCoachSectionOrder,
  readAthleteMoreOrder,
  writeAthleteMoreOrder,
  applyCoachSectionOrder,
  applyAthleteMoreOrder,
  clearCoachSectionOrder,
  clearAthleteMoreOrder,
} from "@/lib/navPrefs";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type NavItem = { href: string; label: string; icon: React.ReactNode };

type CoachTab = {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  href: string;
  isActive: (loc: string) => boolean;
};

type SidebarSection = { title?: string; items: NavItem[] };

type SubNavSection = {
  id: string;
  /** Paths that trigger this sub-nav */
  rootPaths: readonly string[];
  /** Ordered list of sub-pages */
  tabs: readonly { label: string; href: string }[];
};

/* -------------------------------------------------------------------------- */
/* Coach nav config                                                            */
/* -------------------------------------------------------------------------- */

const ACCENT = "oklch(0.72 0.18 290)";

const COACH_TABS: CoachTab[] = [
  {
    id: "home",
    label: "Home",
    Icon: LayoutDashboard,
    href: "/app/coach",
    isActive: (l) => l === "/app/coach",
  },
  {
    id: "team",
    label: "Team",
    Icon: Users,
    href: "/app/coach/roster",
    isActive: (l) =>
      ["/app/coach/roster", "/app/coach/parents", "/app/coach/readiness", "/app/coach/actions"]
        .some((p) => l.startsWith(p)),
  },
  {
    id: "film",
    label: "Film",
    Icon: Film,
    href: "/app/coach/film",
    isActive: (l) =>
      ["/app/coach/film", "/app/coach/queue", "/app/coach/scouting"]
        .some((p) => l.startsWith(p)),
  },
  {
    id: "plans",
    label: "Plans",
    Icon: CalendarDays,
    href: "/app/coach/practice-plans",
    isActive: (l) =>
      ["/app/coach/practice-plans", "/app/coach/wods", "/app/coach/assignments",
       "/app/coach/drills", "/app/playbook"]
        .some((p) => l.startsWith(p)),
  },
  {
    id: "inbox",
    label: "Inbox",
    Icon: MessageSquare,
    href: "/app/coach/inbox",
    isActive: (l) =>
      ["/app/coach/inbox", "/app/messages"].some((p) => l.startsWith(p)),
  },
];

/** Sections that expose a secondary horizontal sub-nav strip on mobile. */
const COACH_SUBNAV_SECTIONS: SubNavSection[] = [
  {
    id: "team",
    rootPaths: ["/app/coach/roster", "/app/coach/parents", "/app/coach/readiness", "/app/coach/actions"],
    tabs: [
      { label: "Roster",    href: "/app/coach/roster"    },
      { label: "Parents",   href: "/app/coach/parents"   },
      { label: "Readiness", href: "/app/coach/readiness" },
    ],
  },
  {
    id: "film",
    rootPaths: ["/app/coach/film", "/app/coach/queue", "/app/coach/scouting"],
    tabs: [
      { label: "Film Room", href: "/app/coach/film"     },
      { label: "Queue",     href: "/app/coach/queue"    },
      { label: "Scouting",  href: "/app/coach/scouting" },
    ],
  },
  {
    id: "plans",
    rootPaths: [
      "/app/coach/practice-plans", "/app/coach/wods",
      "/app/coach/assignments",    "/app/coach/drills", "/app/playbook",
    ],
    tabs: [
      { label: "Plans",       href: "/app/coach/practice-plans" },
      { label: "WODs",        href: "/app/coach/wods"           },
      { label: "Assignments", href: "/app/coach/assignments"    },
      { label: "Drills",      href: "/app/coach/drills"         },
      { label: "Playbook",    href: "/app/playbook"             },
    ],
  },
];

function getCoachSubNav(loc: string): SubNavSection | null {
  return (
    COACH_SUBNAV_SECTIONS.find((s) =>
      (s.rootPaths as readonly string[]).some((p) => loc.startsWith(p))
    ) ?? null
  );
}

const COACH_SECTION_LABELS: Array<{ match: (l: string) => boolean; label: string }> = [
  { match: (l) => l === "/app/coach",                                                    label: "Dashboard"      },
  { match: (l) => l.startsWith("/app/coach/inbox") || l.startsWith("/app/messages"),    label: "Inbox"          },
  { match: (l) => l.startsWith("/app/coach/roster"),                                    label: "Roster"         },
  { match: (l) => l.startsWith("/app/coach/parents"),                                   label: "Parents"        },
  { match: (l) => l.startsWith("/app/coach/readiness"),                                 label: "Readiness"      },
  { match: (l) => l.startsWith("/app/coach/actions"),                                   label: "Coach Actions"  },
  { match: (l) => l.startsWith("/app/coach/film"),                                      label: "Film Room"      },
  { match: (l) => l.startsWith("/app/coach/queue"),                                     label: "Review Queue"   },
  { match: (l) => l.startsWith("/app/coach/scouting"),                                  label: "Scouting"       },
  { match: (l) => l.startsWith("/app/coach/practice-plans"),                            label: "Practice Plans" },
  { match: (l) => l.startsWith("/app/coach/wods"),                                      label: "Daily WODs"     },
  { match: (l) => l.startsWith("/app/coach/assignments"),                               label: "Assignments"    },
  { match: (l) => l.startsWith("/app/coach/drills"),                                    label: "Drill Library"  },
  { match: (l) => l.startsWith("/app/playbook"),                                        label: "Playbook"       },
  { match: (l) => l.startsWith("/app/coach/bookings"),                                  label: "Bookings"       },
  { match: (l) => l.startsWith("/app/billing"),                                         label: "Billing"        },
  { match: (l) => l.startsWith("/app/learn"),                                           label: "Coach Education"},
];

function getCoachSectionLabel(loc: string) {
  return COACH_SECTION_LABELS.find((s) => s.match(loc))?.label ?? "HoopsOS";
}

const COACH_SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: "DAILY",
    items: [
      { href: "/app/coach",                label: "Dashboard",     icon: <LayoutDashboard className="w-4 h-4" /> },
      { href: "/app/coach/inbox",          label: "Inbox",         icon: <Inbox className="w-4 h-4" />          },
      { href: "/app/coach/announcements",  label: "Announcements", icon: <Megaphone className="w-4 h-4" />      },
    ],
  },
  {
    title: "TEAM",
    items: [
      { href: "/app/coach/roster",     label: "Roster",      icon: <Users className="w-4 h-4" />       },
      { href: "/app/coach/parents",    label: "Parents",     icon: <Heart className="w-4 h-4" />       },
      { href: "/app/coach/readiness",  label: "Readiness",   icon: <Activity className="w-4 h-4" />    },
      { href: "/app/coach/at-risk",    label: "At-Risk",     icon: <AlertTriangle className="w-4 h-4" /> },
      { href: "/app/payments",         label: "Payments",    icon: <DollarSign className="w-4 h-4" />    },
      { href: "/app/coach/absences",             label: "Absences",    icon: <CalendarDays className="w-4 h-4" /> },
    ],
  },
  {
    title: "BUILD",
    items: [
      { href: "/app/coach/practice-plans", label: "Practice Plans", icon: <CalendarDays className="w-4 h-4" /> },
      { href: "/app/coach/wods",           label: "Daily WODs",     icon: <Dumbbell className="w-4 h-4" />     },
      { href: "/app/coach/assignments",    label: "Assignments",    icon: <ClipboardList className="w-4 h-4" />},
      { href: "/app/coach/drills",         label: "Drill Library",  icon: <BookOpen className="w-4 h-4" />     },
      { href: "/app/playbook",             label: "Playbook",       icon: <Target className="w-4 h-4" />       },
    ],
  },
  {
    title: "DEVELOP",
    items: [
      { href: "/app/coach/assess/quick",  label: "Quick Assess",     icon: <ClipboardCheck className="w-4 h-4" /> },
      { href: "/app/coach/assessments",   label: "Assessments",      icon: <ClipboardList className="w-4 h-4" />  },
      { href: "/app/coach/observe/quality", label: "Observation Quality", icon: <Activity className="w-4 h-4" />  },
      { href: "/app/coach/film-link",     label: "Film Corroboration", icon: <Film className="w-4 h-4" />         },
      { href: "/app/coach/benchmarks",    label: "Benchmarking",     icon: <TrendingUp className="w-4 h-4" />     },
      { href: "/app/coach/idp/generate",  label: "IDP Builder",      icon: <Target className="w-4 h-4" />         },
    ],
  },
  {
    title: "FILM",
    items: [
      { href: "/app/coach/film",         label: "Film Room",    icon: <Film className="w-4 h-4" />       },
      { href: "/app/coach/film/analyze", label: "AI Analysis",  icon: <Sparkles className="w-4 h-4" />   },
      { href: "/app/coach/queue",        label: "Review Queue", icon: <ListChecks className="w-4 h-4" /> },
      { href: "/app/coach/scouting",     label: "Scouting",     icon: <Crosshair className="w-4 h-4" /> },
    ],
  },
  {
    title: "EDUCATION",
    items: [
      { href: "/app/coach/education",                label: "Education Hub",   icon: <GraduationCap className="w-4 h-4" /> },
      { href: "/app/coach/education/paths",          label: "Learning Paths",  icon: <BookOpen className="w-4 h-4" />      },
      { href: "/app/coach/education/mirror",         label: "My Data",         icon: <Activity className="w-4 h-4" />      },
      { href: "/app/coach/cues",                     label: "Cue Library",     icon: <MessageSquare className="w-4 h-4" /> },
      { href: "/app/coach/education/journal",        label: "Coaching Journal", icon: <FileText className="w-4 h-4" />     },
      { href: "/app/coach/education/cohort",           label: "Staff Cohort",      icon: <Users className="w-4 h-4" />         },
      { href: "/app/coach/education/certifications",   label: "Certifications",    icon: <Award className="w-4 h-4" />         },
      { href: "/app/coach/education/prescriptions",    label: "My Prescriptions",  icon: <Target className="w-4 h-4" />        },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      { href: "/app/coach/effectiveness",        label: "My Effectiveness",   icon: <BarChart2 className="w-4 h-4" />    },
      { href: "/app/coach/development-outcomes", label: "Player Outcomes",    icon: <TrendingUp className="w-4 h-4" />   },
      { href: "/app/coach/retention-leaders",    label: "Retention Leaders",  icon: <Users className="w-4 h-4" />        },
    ],
  },
  {
    title: "RECRUITING",
    items: [
      { href: "/app/coach/recruiting/export",     label: "Export Builder",    icon: <Star className="w-4 h-4" />        },
      { href: "/app/coach/recruiting/badges",     label: "Badge Awards",      icon: <Award className="w-4 h-4" />       },
      { href: "/app/coach/recruiting/narratives", label: "Player Narratives", icon: <FileText className="w-4 h-4" />    },
      { href: "/app/coach/recruiting/synthesis",  label: "Dev Synthesis",     icon: <TrendingUp className="w-4 h-4" />  },
    ],
  },
  {
    title: "PROFILE",
    items: [
      { href: "/app/coach/career",        label: "Career Record",    icon: <TrendingUp className="w-4 h-4" /> },
      { href: "/app/coach/season-report", label: "Season Report",    icon: <BarChart2 className="w-4 h-4" />  },
    ],
  },
  {
    title: "MORE",
    items: [
      { href: "/app/coach/bookings",    label: "Bookings",        icon: <Calendar className="w-4 h-4" />     },
      { href: "/app/club/analytics",    label: "Analytics",       icon: <BarChart2 className="w-4 h-4" />    },
      { href: "/app/club/analytics/v2", label: "Deep Analytics",  icon: <BarChart2 className="w-4 h-4" />    },
      { href: "/app/billing",           label: "Billing",         icon: <CreditCard className="w-4 h-4" />   },
      { href: "/app/learn",             label: "Coach Education", icon: <GraduationCap className="w-4 h-4" />},
    ],
  }
];

const COACH_OVERFLOW_ITEMS: NavItem[] = [
  { href: "/app/coach/bookings", label: "Bookings",        icon: <Calendar className="w-4 h-4" />     },
  { href: "/app/billing",        label: "Billing",         icon: <CreditCard className="w-4 h-4" />   },
  { href: "/app/learn",          label: "Coach Education", icon: <GraduationCap className="w-4 h-4" />},
];

/**
 * Section titles that are always pinned at the top of the coach sidebar.
 * These cannot be dragged and are always rendered first.
 */
const COACH_PINNED_SECTIONS = ["DAILY"] as const;

/* -------------------------------------------------------------------------- */
/* Other roles nav                                                             */
/* -------------------------------------------------------------------------- */

const NAV: Record<Role, NavItem[]> = {
  ATHLETE: [
    { href: "/app/player",              label: "Home",         icon: <Home className="w-5 h-5" />         },
    { href: "/app/player/development",  label: "My Plan",  icon: <Target className="w-5 h-5" />       },
    { href: "/app/player/checkin",      label: "Check-In",     icon: <Activity className="w-5 h-5" />     },
    { href: "/app/player/assignments",  label: "Assignments",  icon: <CheckSquare className="w-5 h-5" />  },
    { href: "/app/player/skills",       label: "Skills", icon: <TrendingUp className="w-5 h-5" />   },
    { href: "/app/player/timeline",     label: "My Timeline",  icon: <TrendingUp className="w-5 h-5" />   },
    { href: "/app/player/assessments",  label: "Assessments",  icon: <ClipboardCheck className="w-5 h-5" /> },
    { href: "/app/player/skill-velocity", label: "Skill Velocity",     icon: <Activity className="w-5 h-5" />    },
    { href: "/app/player/milestones",     label: "Milestones",         icon: <Trophy className="w-5 h-5" />      },
    { href: "/app/player/workout",      label: "Today's WOD", icon: <Dumbbell className="w-5 h-5" />     },
    { href: "/app/player/plays",        label: "Study Plays",  icon: <BookOpen className="w-5 h-5" />     },
    { href: "/app/player/schedule",     label: "Schedule",     icon: <Calendar className="w-5 h-5" />     },
    { href: "/app/player/achievements", label: "Achievements", icon: <Trophy className="w-5 h-5" />       },
    { href: "/app/player/growth-story",   label: "My Growth Story",    icon: <Star className="w-5 h-5" />        },
    { href: "/app/player/recruiting",            label: "Recruiting Profile", icon: <Star className="w-5 h-5" />        },
    { href: "/app/player/resume",                label: "My Resume",          icon: <FileText className="w-5 h-5" />    },
    { href: "/app/player/uploads",      label: "Uploads",      icon: <UploadCloud className="w-5 h-5" />  },
    { href: "/app/film/inbox",          label: "Film Inbox",   icon: <Film className="w-5 h-5" />         },
    { href: "/app/player/coach-view",     label: "Coach's View",       icon: <Target className="w-5 h-5" />      },
    { href: "/app/player/vdv",            label: "My VDV Score",       icon: <TrendingUp className="w-5 h-5" />  },
    { href: "/app/player/recruiting/visibility", label: "Privacy Settings",   icon: <Shield className="w-5 h-5" />     },
    { href: "/app/messages",                     label: "Messages",          icon: <MessageSquare className="w-5 h-5" />},
    { href: "/app/billing",             label: "Billing",      icon: <CreditCard className="w-5 h-5" />   },
    { href: "/app/learn",               label: "Learn",        icon: <BookOpen className="w-5 h-5" />     },
    { href: "/app/live",                label: "Live",         icon: <Radio className="w-5 h-5" />        },
    { href: "/app/marketplace",         label: "Marketplace",  icon: <Package className="w-5 h-5" />      }
  ],
  COACH: [], // handled via COACH_SIDEBAR_SECTIONS + COACH_TABS
  TEAM_ADMIN: [
    { href: "/app/team",                  label: "Org Dashboard",       icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/app/team/calendar",         label: "Calendar",            icon: <Calendar className="w-5 h-5" />        },
    { href: "/app/team/roster-detail",    label: "Roster",              icon: <Users className="w-5 h-5" />           },
    { href: "/app/team/staff",            label: "Staff Directory",     icon: <UserIcon className="w-5 h-5" />        },
    { href: "/app/team/messaging",        label: "Messaging",           icon: <MessageSquare className="w-5 h-5" />   },
    { href: "/app/team/documents",        label: "Document Library",    icon: <FileText className="w-5 h-5" />        },
    { href: "/app/club/director",         label: "Program Overview",    icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/app/club/roster-intel",     label: "Roster Intelligence", icon: <TrendingUp className="w-5 h-5" />      },
    { href: "/app/club",                  label: "Club Dashboard",      icon: <ClipboardCheck className="w-5 h-5" />  },
    { href: "/app/club/registrations",    label: "Registrations",       icon: <ClipboardList className="w-5 h-5" />   },
    { href: "/app/club/teams",            label: "Teams",               icon: <Users className="w-5 h-5" />           },
    { href: "/app/club/memberships",      label: "Memberships",         icon: <Tag className="w-5 h-5" />             },
    { href: "/app/club/analytics",        label: "Analytics",           icon: <BarChart2 className="w-5 h-5" />       },
    { href: "/app/admin/season-setup",    label: "Season Setup",        icon: <Calendar className="w-5 h-5" />        },
    { href: "/app/admin/seasons",         label: "Seasons",             icon: <Calendar className="w-5 h-5" />        },
    { href: "/app/admin/onboarding",      label: "Onboarding",          icon: <ClipboardCheck className="w-5 h-5" />  },
    { href: "/app/admin/re-enrollment",   label: "Re-Enrollment",       icon: <ClipboardList className="w-5 h-5" />   },
    { href: "/app/admin/forms",           label: "Forms Manager",       icon: <FileText className="w-5 h-5" />        },
    { href: "/app/club/billing",          label: "Dues & Billing",      icon: <DollarSign className="w-5 h-5" />      },
    { href: "/app/team/roster",           label: "All Athletes",        icon: <UserIcon className="w-5 h-5" />        },
    { href: "/app/team/invite",           label: "Invite",              icon: <Users className="w-5 h-5" />           },
    { href: "/app/billing",               label: "Platform Billing",    icon: <CreditCard className="w-5 h-5" />      },
    { href: "/app/team/seats",            label: "Seat Manager",        icon: <Users className="w-5 h-5" />           },
    { href: "/app/team/settings",              label: "Settings",            icon: <Shield className="w-5 h-5" />          },
    { href: "/app/director/prospects",          label: "Prospect Pool",       icon: <Star className="w-5 h-5" />           },
    { href: "/app/director/program-reputation", label: "Program Reputation",  icon: <TrendingUp className="w-5 h-5" />     },
    { href: "/app/director/recruiter-access",   label: "Recruiter Activity",  icon: <Activity className="w-5 h-5" />      },
    { href: "/app/director/recruiting-crm",     label: "School Relations",    icon: <Users className="w-5 h-5" />         },
    { href: "/app/recruiter",                   label: "Recruiter Portal",    icon: <GraduationCap className="w-5 h-5" /> },
    { href: "/app/director/program-health",     label: "Program Health",      icon: <Activity className="w-5 h-5" />      },
    { href: "/app/payments",                    label: "Payments",            icon: <DollarSign className="w-5 h-5" />    },
    { href: "/app/payments/outstanding",        label: "Outstanding Queue",   icon: <AlertTriangle className="w-5 h-5" /> },
    { href: "/app/admin/operations-metrics",    label: "Operations Metrics",  icon: <BarChart2 className="w-5 h-5" />     },
    { href: "/app/club/growth",                 label: "Club Growth",         icon: <TrendingUp className="w-5 h-5" />    },
    { href: "/app/analytics/vdv",               label: "VDV Command Center",  icon: <Database className="w-5 h-5" />      },
    { href: "/app/analytics/north-star",        label: "North Star KPIs",     icon: <Star className="w-5 h-5" />          },
    { href: "/app/analytics/activation",        label: "Activation Heat Map", icon: <BarChart2 className="w-5 h-5" />    },
    { href: "/app/analytics/data-quality",      label: "Data Quality",        icon: <Shield className="w-5 h-5" />        },
    { href: "/app/analytics/warnings",          label: "Warning Metrics",     icon: <AlertTriangle className="w-5 h-5" /> },
    { href: "/app/analytics/enterprise",        label: "Enterprise Expansion",icon: <TrendingUp className="w-5 h-5" />    },
  ],
  EXPERT: [
    { href: "/app/expert",          label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/app/expert/offers",   label: "Offers",    icon: <Package className="w-5 h-5" />         },
    { href: "/app/expert/bookings", label: "Bookings",  icon: <Calendar className="w-5 h-5" />        },
    { href: "/app/expert/payouts",  label: "Payouts",   icon: <CreditCard className="w-5 h-5" />      },
    { href: "/app/messages",        label: "Messages",  icon: <MessageSquare className="w-5 h-5" />   },
  ],
  PARENT: [
    { href: "/app/parent",               label: "Home",          icon: <Home className="w-5 h-5" />         },
    { href: "/app/parent/child",         label: "My Child",      icon: <Heart className="w-5 h-5" />        },
    { href: "/app/parent/schedule",      label: "Schedule",      icon: <Calendar className="w-5 h-5" />     },
    { href: "/app/parent/register",      label: "Register",      icon: <PlusCircle className="w-5 h-5" />   },
    { href: "/app/parent/billing",       label: "Billing",       icon: <CreditCard className="w-5 h-5" />   },
    { href: "/app/parent/forms",         label: "Forms",         icon: <FileText className="w-5 h-5" />     },
    { href: "/app/parent/announcements", label: "Announcements", icon: <Bell className="w-5 h-5" />         },
    { href: "/app/parent/digest",          label: "Weekly Digest",    icon: <FileText className="w-5 h-5" />    },
    { href: "/app/messages",               label: "Messages",         icon: <MessageSquare className="w-5 h-5" />},
    { href: "/app/family/privacy",         label: "Privacy Settings", icon: <Shield className="w-5 h-5" />    },
    { href: "/app/family/access-requests", label: "Access Requests",  icon: <Bell className="w-5 h-5" />      },
    { href: "/app/family/report",          label: "Progress Report",  icon: <FileText className="w-5 h-5" />  },
    { href: "/app/parent/engagement",        label: "Engagement Score",    icon: <Activity className="w-5 h-5" />   },
    { href: "/app/parent/weekly-pulse",      label: "Weekly Pulse",        icon: <Bell className="w-5 h-5" />      },
    { href: "/app/parent/recruiter-activity", label: "Recruiter Activity", icon: <Star className="w-5 h-5" />      },
  ],
  SUPER_ADMIN: [
    { href: "/app/admin",            label: "Overview",            icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/app/admin/users",      label: "Users",               icon: <UserIcon className="w-5 h-5" />       },
    { href: "/app/admin/billing",    label: "Billing & Revenue",   icon: <CreditCard className="w-5 h-5" />     },
    { href: "/app/admin/experts",    label: "Expert Verification", icon: <GraduationCap className="w-5 h-5" />  },
    { href: "/app/admin/moderation", label: "Moderation",         icon: <Flag className="w-5 h-5" />           },
    { href: "/app/admin/audit",      label: "Audit Log",           icon: <Database className="w-5 h-5" />       },
    { href: "/app/admin/jobs",       label: "AI Jobs",             icon: <Activity className="w-5 h-5" />       },
  ],
};

const BOTTOM_NAV_COUNT: Partial<Record<Role, number>> = {
  ATHLETE:    5,
  TEAM_ADMIN: 4,
  EXPERT:     4,
  PARENT:     4,
  SUPER_ADMIN: 3,
};

/* -------------------------------------------------------------------------- */
/* 1 — CoachBottomNav: live badges + haptic feedback                          */
/* -------------------------------------------------------------------------- */

function CoachBottomNav({
  tabs,
  loc,
  filmBadge,
  inboxBadge,
  navigate,
}: {
  tabs: CoachTab[];
  loc: string;
  filmBadge: number;
  inboxBadge: number;
  navigate: (href: string) => void;
}) {
  function getBadge(tabId: string) {
    if (tabId === "film")  return filmBadge;
    if (tabId === "inbox") return inboxBadge;
    return 0;
  }

  return (
    <nav
      role="tablist"
      aria-label="Coach navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map((tab) => {
        const active = tab.isActive(loc);
        const badge  = getBadge(tab.id);
        const badgeStr = formatBadge(badge);

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            aria-label={`${tab.label}${badge > 0 ? `, ${badge} pending` : ""}`}
            onClick={() => {
              hapticLight();
              hapticSelection();
              navigate(tab.href);
            }}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] min-w-0 select-none transition-opacity active:opacity-70"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {/* Icon + pill */}
            <div className="relative flex items-center justify-center">
              <div
                className="w-10 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                style={active ? { background: `${ACCENT.replace(")", " / 0.14)")}` } : undefined}
              >
                <tab.Icon
                  className="w-[22px] h-[22px] transition-colors duration-200"
                  style={{ color: active ? ACCENT : "oklch(0.55 0.02 260)" }}
                />
              </div>

              {/* Badge dot / count */}
              {badgeStr && (
                <span
                  className="absolute -top-1 -right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none px-1 pointer-events-none"
                  style={{ background: "oklch(0.62 0.22 25)" }}
                >
                  {badgeStr}
                </span>
              )}
            </div>

            {/* Label */}
            <span
              className="text-[10px] leading-none transition-all duration-200"
              style={{
                color:      active ? ACCENT : "oklch(0.55 0.02 260)",
                fontWeight: active ? 600 : 400,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* 2 — CoachHeader: top bar + section sub-nav strip                           */
/* -------------------------------------------------------------------------- */

function CoachHeader({
  loc,
  user,
  onProfileOpen,
}: {
  loc: string;
  user: { name: string; avatar: string };
  onProfileOpen: () => void;
}) {
  const sectionLabel = getCoachSectionLabel(loc);
  const subNav       = getCoachSubNav(loc);

  return (
    <header
      className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* ── Primary bar ── */}
      <div className="h-[52px] flex items-center justify-between px-4">
        {/* Left: wordmark */}
        <Logo size={22} />

        {/* Center: section label */}
        <span className="absolute left-1/2 -translate-x-1/2 text-[14px] font-semibold tracking-tight pointer-events-none">
          {sectionLabel}
        </span>

        {/* Right: avatar → profile sheet */}
        <button
          onClick={onProfileOpen}
          aria-label="Profile and settings"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-opacity active:opacity-70"
          style={{
            background: `${ACCENT.replace(")", " / 0.16)")}`,
            color:       ACCENT,
            border:      `1.5px solid ${ACCENT.replace(")", " / 0.30)")}`,
          }}
        >
          {user.avatar}
        </button>
      </div>

      {/* ── Section sub-nav strip (Team / Film / Plans only) ── */}
      {subNav && (
        <div
          className="flex gap-1.5 px-4 pb-2.5 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {subNav.tabs.map((tab) => {
            const active = loc.startsWith(tab.href);
            return (
              <Link key={tab.href} href={tab.href} asChild>
                <a
                  onClick={() => { hapticLight(); }}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 whitespace-nowrap"
                  style={
                    active
                      ? {
                          background: ACCENT.replace(")", " / 0.14)"),
                          color:      ACCENT,
                          fontWeight: 600,
                        }
                      : {
                          background: "oklch(0.18 0.005 260)",
                          color:      "oklch(0.60 0.02 260)",
                        }
                  }
                >
                  {tab.label}
                </a>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* 3 — Swipe navigation hook                                                  */
/* Detects horizontal swipes on the main content area and navigates between   */
/* pages within the current section (Team / Film / Plans).                    */
/* Ignores predominantly-vertical movements to preserve normal scroll.        */
/* -------------------------------------------------------------------------- */

function useCoachSwipe(loc: string, navigate: (href: string) => void) {
  const startX = useRef(0);
  const startY = useRef(0);
  const MIN_SWIPE_PX    = 55;   // minimum horizontal distance to count
  const MAX_ANGLE_RATIO = 0.55; // dy/dx must stay below this (more horizontal than vertical)

  const subNav = getCoachSubNav(loc);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!subNav) return;

      const dx = startX.current - e.changedTouches[0].clientX; // + = swipe left
      const dy = Math.abs(startY.current - e.changedTouches[0].clientY);

      // Ignore if too short or too vertical
      if (Math.abs(dx) < MIN_SWIPE_PX) return;
      if (dy > Math.abs(dx) * MAX_ANGLE_RATIO) return;

      const tabs = subNav.tabs as readonly { label: string; href: string }[];
      const currentIdx = tabs.findIndex((t) => loc.startsWith(t.href));
      if (currentIdx === -1) return;

      if (dx > 0 && currentIdx < tabs.length - 1) {
        // Swipe left → next page in section
        hapticLight();
        navigate(tabs[currentIdx + 1].href);
      } else if (dx < 0 && currentIdx > 0) {
        // Swipe right → prev page in section
        hapticLight();
        navigate(tabs[currentIdx - 1].href);
      }
    },
    [subNav, loc, navigate],
  );

  return { onTouchStart, onTouchEnd };
}

/* -------------------------------------------------------------------------- */
/* CoachProfileSheet                                                           */
/* -------------------------------------------------------------------------- */

function CoachProfileSheet({
  open,
  onClose,
  user,
  meta,
  loc,
  onSignOut,
}: {
  open: boolean;
  onClose: () => void;
  user: { name: string; avatar: string; handle: string };
  meta: { color: string; label: string };
  loc: string;
  onSignOut: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[300px] p-0 flex flex-col">
        <SheetHeader className="h-14 border-b border-border flex-row items-center justify-between px-4 shrink-0">
          <SheetTitle className="text-[14px] font-semibold">Profile</SheetTitle>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </SheetHeader>

        {/* Identity */}
        <div className="px-5 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-[14px] font-bold shrink-0"
              style={{
                background: `${meta.color.replace(")", " / 0.15)")}`,
                color:      meta.color,
                border:     `1.5px solid ${meta.color.replace(")", " / 0.30)")}`,
              }}
            >
              {user.avatar}
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-bold truncate">{user.name}</div>
              <div className="text-[11px] text-muted-foreground truncate mt-0.5">{user.handle}</div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.1em] mt-1"
                style={{ color: meta.color }}
              >
                {meta.label}
              </div>
            </div>
          </div>
        </div>

        {/* Overflow workspace items */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-muted-foreground/50 px-2 mb-2">
            Workspace
          </div>
          {COACH_OVERFLOW_ITEMS.map((item) => {
            const active = loc.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} asChild>
                <a
                  onClick={onClose}
                  className="flex items-center justify-between px-3 py-3 rounded-xl text-[14px] transition-colors mb-0.5 hover:bg-muted/50"
                  style={active ? { background: `${ACCENT.replace(")", " / 0.10)")}`, color: ACCENT } : undefined}
                >
                  <span className="flex items-center gap-3 text-foreground">
                    <span className="text-muted-foreground">{item.icon}</span>
                    {item.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </a>
              </Link>
            );
          })}
        </div>

        <div
          className="border-t border-border p-3 shrink-0"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
        >
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
          >
            <UserIcon className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* CoachDesktopSidebar — drag-to-reorder sections                             */
/* -------------------------------------------------------------------------- */

/**
 * Sortable section row — renders one sidebar section with a drag handle.
 * Pinned sections receive no handle and cannot be moved.
 */
function SortableSidebarSection({
  section,
  loc,
  pinned,
}: {
  section: SidebarSection;
  loc: string;
  pinned: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.title ?? "", disabled: pinned });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function isItemActive(item: NavItem) {
    if (item.href === "/app/coach") return loc === "/app/coach";
    return loc.startsWith(item.href);
  }

  return (
    <div ref={setNodeRef} style={style}>
      {/* Section header with optional drag handle */}
      <div className="flex items-center justify-between px-2 mb-1.5 mt-4 first:mt-0 group">
        {section.title && (
          <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground/40">
            {section.title}
          </div>
        )}
        {!pinned && (
          <button
            {...attributes}
            {...listeners}
            aria-label={`Drag to reorder ${section.title} section`}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-0.5 rounded text-muted-foreground/30 hover:text-muted-foreground/60"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Section items */}
      {section.items.map((item) => {
        const active = isItemActive(item);
        return (
          <Link key={item.href} href={item.href} asChild>
            <a
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all duration-150 relative mb-0.5"
              style={
                active
                  ? { background: `${ACCENT.replace(")", " / 0.10)")}`, color: ACCENT }
                  : { color: "oklch(0.55 0.02 260)" }
              }
            >
              {active && (
                <span
                  className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
                  style={{ background: ACCENT }}
                />
              )}
              <span className="pl-1 w-4 h-4 flex items-center justify-center shrink-0">
                {item.icon}
              </span>
              <span className={active ? "font-semibold" : ""}>{item.label}</span>
            </a>
          </Link>
        );
      })}
    </div>
  );
}

function CoachDesktopSidebar({
  loc,
  user,
  meta,
  onSignOut,
}: {
  loc: string;
  user: { name: string; avatar: string; handle: string };
  meta: { color: string; label: string };
  onSignOut: () => void;
}) {
  // Load saved section order and apply it to the default sections
  const [sections, setSections] = useState<SidebarSection[]>(() =>
    applyCoachSectionOrder(
      COACH_SIDEBAR_SECTIONS,
      readCoachSectionOrder(user.handle),
      COACH_PINNED_SECTIONS,
    )
  );

  // Whether the user's current order differs from the default
  const isCustomized = sections.some(
    (s, i) => s.title !== COACH_SIDEBAR_SECTIONS[i]?.title
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.title === active.id);
      const newIndex = prev.findIndex((s) => s.title === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;

      // Prevent dragging above pinned sections
      const pinnedCount = prev.filter((s) =>
        COACH_PINNED_SECTIONS.includes((s.title ?? "") as typeof COACH_PINNED_SECTIONS[number])
      ).length;
      if (newIndex < pinnedCount) return prev;

      const next = arrayMove(prev, oldIndex, newIndex);

      // Save only the non-pinned section order
      const nonPinnedOrder = next
        .filter((s) => !COACH_PINNED_SECTIONS.includes((s.title ?? "") as typeof COACH_PINNED_SECTIONS[number]))
        .map((s) => s.title ?? "");
      writeCoachSectionOrder(user.handle, nonPinnedOrder);

      return next;
    });
  }

  // IDs for SortableContext — pinned sections need an id too but won't move
  const sectionIds = sections.map((s) => s.title ?? "");

  function handleReset() {
    clearCoachSectionOrder(user.handle);
    setSections([...COACH_SIDEBAR_SECTIONS]);
  }

  return (
    <aside className="hidden lg:flex w-60 shrink-0 border-r border-border flex-col h-screen sticky top-0">
      <div className="h-16 border-b border-border flex items-center px-5">
        <Logo size={30} />
      </div>

      <div className="px-4 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0"
            style={{
              background: `${meta.color.replace(")", " / 0.15)")}`,
              color:      meta.color,
              border:     `1.5px solid ${meta.color.replace(")", " / 0.28)")}`,
            }}
          >
            {user.avatar}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold truncate">{user.name}</div>
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.1em] mt-0.5"
              style={{ color: meta.color }}
            >
              {meta.label}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            {sections.map((section) => {
              const pinned = COACH_PINNED_SECTIONS.includes(
                (section.title ?? "") as typeof COACH_PINNED_SECTIONS[number]
              );
              return (
                <SortableSidebarSection
                  key={section.title ?? "untitled"}
                  section={section}
                  loc={loc}
                  pinned={pinned}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </nav>

      <div className="border-t border-border px-3 py-2 shrink-0 space-y-0.5">
        {isCustomized && (
          <button
            onClick={handleReset}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            title="Restore default nav order"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset nav order
          </button>
        )}
        <Link href="/" asChild>
          <a className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
            ← Marketing site
          </a>
        </Link>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] text-muted-foreground/60 hover:text-destructive transition-colors"
        >
          <UserIcon className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* PlayerDesktopSidebar — drag-to-reorder player nav (desktop only)          */
/* -------------------------------------------------------------------------- */

/**
 * Number of items pinned to the mobile bottom tab bar.
 * These are also pinned at the top of the desktop sidebar — never draggable.
 */
const ATHLETE_PINNED_COUNT = BOTTOM_NAV_COUNT["ATHLETE"] ?? 5;

/**
 * One sortable row in the player desktop sidebar.
 * Drag handle appears on group hover; hidden at rest.
 */
function SortablePlayerNavItem({
  item,
  loc,
  homeHref,
  meta,
}: {
  item:     NavItem;
  loc:      string;
  homeHref: string;
  meta:     { color: string };
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.href });

  const active =
    loc === item.href ||
    (item.href !== homeHref && loc.startsWith(item.href));

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-0.5 mb-0.5 group">
      {/* Drag handle — hover-reveal, matching coach sidebar pattern */}
      <button
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${item.label}`}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-0.5 rounded text-muted-foreground/30 hover:text-muted-foreground/60 shrink-0"
      >
        <GripVertical className="w-3 h-3" />
      </button>

      <Link href={item.href} asChild>
        <a
          className="flex-1 flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] transition-all duration-150 relative"
          style={
            active
              ? { background: `${meta.color.replace(")", " / 0.10)")}`, color: meta.color }
              : { color: "oklch(0.55 0.02 260)" }
          }
        >
          {active && (
            <span
              className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
              style={{ background: meta.color }}
            />
          )}
          <span className="pl-0.5 w-4 h-4 flex items-center justify-center shrink-0">
            {item.icon}
          </span>
          <span className={active ? "font-semibold" : ""}>{item.label}</span>
        </a>
      </Link>
    </div>
  );
}

/**
 * Player desktop sidebar with persistent drag-to-reorder.
 *
 * Structure:
 *   ┌────────────────────────────────┐
 *   │  Home · My Plan · Check-In    │  ← 5 pinned items (match mobile bottom tabs)
 *   │  Assignments · Skills         │    no drag handles
 *   │  ──────────────────────────── │
 *   │  MORE                         │  ← 21 sortable items
 *   │  ≡ My Timeline                │    drag handles on hover
 *   │  ≡ Assessments                │
 *   │  …                            │
 *   │  ──────────────────────────── │
 *   │  Reset nav order   (if saved) │
 *   │  ← Back to marketing          │
 *   │  Sign out                     │
 *   └────────────────────────────────┘
 *
 * Persistence: readAthleteMoreOrder / writeAthleteMoreOrder (same key as
 * GenericMoreSheet) — desktop sidebar and mobile More sheet stay in sync
 * automatically since they share the same localStorage entry.
 */
function PlayerDesktopSidebar({
  nav,
  loc,
  user,
  meta,
  onSignOut,
}: {
  nav:      NavItem[];
  loc:      string;
  user:     { name: string; avatar: string; handle: string };
  meta:     { color: string; label: string };
  onSignOut: () => void;
}) {
  const homeHref     = nav[0]?.href ?? "/app/player";
  const pinnedItems  = nav.slice(0, ATHLETE_PINNED_COUNT);
  const moreDefaults = nav.slice(ATHLETE_PINNED_COUNT);

  // Initialise from saved order; fall back to default if nothing saved
  const [sortableItems, setSortableItems] = useState<NavItem[]>(() =>
    applyAthleteMoreOrder(moreDefaults, readAthleteMoreOrder(user.handle))
  );

  // Drive the "Reset nav order" button — only visible when order differs from default
  const isCustomized = sortableItems.some(
    (item, i) => item.href !== moreDefaults[i]?.href
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSortableItems((prev) => {
      const oldIdx = prev.findIndex((i) => i.href === active.id);
      const newIdx = prev.findIndex((i) => i.href === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;

      const next = arrayMove(prev, oldIdx, newIdx);
      writeAthleteMoreOrder(user.handle, next.map((i) => i.href));
      return next;
    });
  }

  function handleReset() {
    clearAthleteMoreOrder(user.handle);
    setSortableItems([...moreDefaults]);
  }

  function isActive(item: NavItem) {
    return loc === item.href || (item.href !== homeHref && loc.startsWith(item.href));
  }

  return (
    <aside className="hidden lg:flex w-60 shrink-0 border-r border-border flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 border-b border-border flex items-center px-5">
        <Logo size={30} />
      </div>

      {/* Identity */}
      <div className="px-4 py-4 border-b border-border">
        <div
          className="text-[10px] uppercase tracking-[0.14em] font-mono mb-2"
          style={{ color: meta.color }}
        >
          {meta.label} · Signed in
        </div>
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0"
            style={{
              background: `${meta.color.replace(")", " / 0.15)")}`,
              color:      meta.color,
              border:     `1.5px solid ${meta.color.replace(")", " / 0.28)")}`,
            }}
          >
            {user.avatar}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold truncate">{user.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">{user.handle}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {/* ── Pinned items (match mobile bottom tabs) ── */}
        {pinnedItems.map((item) => {
          const active = isActive(item);
          return (
            <Link key={item.href} href={item.href} asChild>
              <a
                className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13px] transition-colors mb-0.5"
                style={
                  active
                    ? { background: `${meta.color.replace(")", " / 0.10)")}`, color: meta.color }
                    : { color: "oklch(0.55 0.02 260)" }
                }
              >
                <span className="w-4 h-4 shrink-0 flex items-center">{item.icon}</span>
                <span className={active ? "font-semibold" : ""}>{item.label}</span>
              </a>
            </Link>
          );
        })}

        {/* ── Divider + "More" label ── */}
        <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-muted-foreground/35 px-2 mt-3 mb-1.5">
          More
        </div>

        {/* ── Sortable items (drag handles on hover) ── */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortableItems.map((i) => i.href)}
            strategy={verticalListSortingStrategy}
          >
            {sortableItems.map((item) => (
              <SortablePlayerNavItem
                key={item.href}
                item={item}
                loc={loc}
                homeHref={homeHref}
                meta={meta}
              />
            ))}
          </SortableContext>
        </DndContext>
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-3 py-2 shrink-0 space-y-0.5">
        {isCustomized && (
          <button
            onClick={handleReset}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            title="Restore default nav order"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset nav order
          </button>
        )}
        <Link href="/" asChild>
          <a className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
            ← Back to marketing
          </a>
        </Link>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] text-muted-foreground/60 hover:text-destructive transition-colors"
        >
          <UserIcon className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* Generic role More sheet — with optional drag-to-reorder for ATHLETE        */
/* -------------------------------------------------------------------------- */

/** Sortable nav item for the More sheet. */
function SortableNavItem({
  item,
  active,
  meta,
  onClose,
  editMode,
}: {
  item: NavItem;
  active: boolean;
  meta: { color: string };
  onClose: () => void;
  editMode: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.href, disabled: !editMode });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1 mb-0.5">
      {editMode && (
        <button
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder ${item.label}`}
          className="p-2 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      <Link href={item.href} asChild>
        <a
          onClick={editMode ? (e) => e.preventDefault() : onClose}
          className="flex-1 flex items-center gap-3 px-3 py-3 rounded-xl text-[13.5px] transition-colors hover:bg-muted/50"
          style={active ? { background: `${meta.color.replace(")", " / 0.10)")}`, color: meta.color } : undefined}
        >
          <span className="text-muted-foreground shrink-0">{item.icon}</span>
          <span className={active ? "font-semibold" : "text-foreground"}>{item.label}</span>
        </a>
      </Link>
    </div>
  );
}

function GenericMoreSheet({
  open, onClose, nav, loc, user, meta, homeHref, onSignOut, role,
}: {
  open: boolean;
  onClose: () => void;
  nav: NavItem[];
  loc: string;
  user: { name: string; avatar: string; handle: string };
  meta: { color: string; label: string };
  homeHref: string;
  onSignOut: () => void;
  role?: string;
}) {
  const isAthlete = role === "ATHLETE";

  // Bottom-tab count for the athlete role — these items are pinned
  const pinnedCount = isAthlete ? (5) : 0;

  // Nav items that appear in the More sheet (beyond the pinned bottom tabs)
  const pinnedItems    = nav.slice(0, pinnedCount);
  const moreDefaultItems = nav.slice(pinnedCount);

  // Athlete More sheet order — persisted per user
  const [moreItems, setMoreItems] = useState<NavItem[]>(() =>
    isAthlete
      ? applyAthleteMoreOrder(moreDefaultItems, readAthleteMoreOrder(user.handle))
      : moreDefaultItems
  );

  const [editMode, setEditMode] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setMoreItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.href === active.id);
      const newIndex = prev.findIndex((i) => i.href === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      writeAthleteMoreOrder(user.handle, next.map((i) => i.href));
      return next;
    });
  }

  // All items to display: pinned (not sortable) + more items (sortable for athlete)
  const displayNav = isAthlete ? [...pinnedItems, ...moreItems] : nav;

  function isActive(item: NavItem) {
    return loc === item.href || (item.href !== homeHref && loc.startsWith(item.href));
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { setEditMode(false); onClose(); } }}>
      <SheetContent side="right" className="w-72 p-0 flex flex-col">
        <SheetHeader className="h-14 border-b border-border flex-row items-center justify-between px-4 shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Logo size={24} />
          </SheetTitle>
          <div className="flex items-center gap-1">
            {isAthlete && (
              <button
                onClick={() => setEditMode((e) => !e)}
                aria-label={editMode ? "Done customizing" : "Customize nav order"}
                className="flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-medium transition-colors border"
                style={editMode
                  ? { borderColor: meta.color, color: meta.color, background: `${meta.color.replace(")", " / 0.08)")}` }
                  : { borderColor: "transparent", color: "oklch(0.55 0.02 260)" }
                }
              >
                {editMode ? (
                  "Done"
                ) : (
                  <><Settings2 className="w-3.5 h-3.5" /> Reorder</>
                )}
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </SheetHeader>

        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono mb-2" style={{ color: meta.color }}>
            {meta.label}
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0"
              style={{
                background: `${meta.color.replace(")", " / 0.15)")}`,
                color:      meta.color,
                border:     `1px solid ${meta.color.replace(")", " / 0.30)")}`,
              }}
            >
              {user.avatar}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate">{user.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{user.handle}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2">
          {isAthlete && editMode && (
            <div className="mx-3 mb-3 px-3 py-2 rounded-lg bg-muted/40 text-[11px] text-muted-foreground">
              Drag <GripVertical className="w-3 h-3 inline" /> to reorder your nav. Bottom tabs stay fixed.
            </div>
          )}

          {isAthlete ? (
            <>
              {/* Pinned items — bottom-tab items shown but not reorderable */}
              {pinnedItems.map((item) => {
                const active = isActive(item);
                return (
                  <Link key={item.href} href={item.href} asChild>
                    <a
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-[13.5px] transition-colors mb-0.5 hover:bg-muted/50 opacity-50"
                      style={active ? { background: `${meta.color.replace(")", " / 0.10)")}`, color: meta.color } : undefined}
                    >
                      <span className="text-muted-foreground shrink-0">{item.icon}</span>
                      <span className={active ? "font-semibold" : "text-foreground"}>{item.label}</span>
                      <span className="ml-auto text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">tab</span>
                    </a>
                  </Link>
                );
              })}

              {/* Sortable More sheet items */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={moreItems.map((i) => i.href)}
                  strategy={verticalListSortingStrategy}
                >
                  {moreItems.map((item) => (
                    <SortableNavItem
                      key={item.href}
                      item={item}
                      active={isActive(item)}
                      meta={meta}
                      onClose={onClose}
                      editMode={editMode}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </>
          ) : (
            /* Non-athlete roles — plain list, no reordering */
            displayNav.map((item) => {
              const active = isActive(item);
              return (
                <Link key={item.href} href={item.href} asChild>
                  <a
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-[13.5px] transition-colors mb-0.5 hover:bg-muted/50"
                    style={active ? { background: `${meta.color.replace(")", " / 0.10)")}`, color: meta.color } : undefined}
                  >
                    <span className="text-muted-foreground shrink-0">{item.icon}</span>
                    <span className={active ? "font-semibold" : "text-foreground"}>{item.label}</span>
                  </a>
                </Link>
              );
            })
          )}
        </div>

        <div className="border-t border-border p-2 shrink-0" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[13.5px] text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
          >
            <UserIcon className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* AppShell                                                                    */
/* -------------------------------------------------------------------------- */

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [loc, navigate]   = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!user) {
    navigate("/sign-in");
    return null;
  }

  const meta    = ROLE_META[user.role];
  const isCoach = user.role === "COACH";

  function handleSignOut() {
    signOut();
    navigate("/");
    setSheetOpen(false);
  }

  /* ── Coach layout ──────────────────────────────────────────────────────── */
  if (isCoach) {
    return <CoachLayout user={user} meta={meta} loc={loc} navigate={navigate} onSignOut={handleSignOut}>{children}</CoachLayout>;
  }

  /* ── Other roles ───────────────────────────────────────────────────────── */
  const nav      = NAV[user.role];
  const tabCount = BOTTOM_NAV_COUNT[user.role] ?? 4;
  const homeHref = nav[0]?.href ?? "/";

  function isActive(item: NavItem) {
    return loc === item.href || (item.href !== homeHref && loc.startsWith(item.href));
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar — player gets sortable sidebar; other roles get static list */}
      {user.role === "ATHLETE" ? (
        <PlayerDesktopSidebar
          nav={nav}
          loc={loc}
          user={user}
          meta={meta}
          onSignOut={handleSignOut}
        />
      ) : (
        <aside className="hidden lg:flex w-60 shrink-0 border-r border-border flex-col h-screen sticky top-0">
          <div className="h-16 border-b border-border flex items-center px-5">
            <Logo size={30} />
          </div>
          <div className="px-4 py-4 border-b border-border">
            <div className="text-[10px] uppercase tracking-[0.14em] font-mono mb-2" style={{ color: meta.color }}>
              {meta.label} · Signed in
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0"
                style={{
                  background: `${meta.color.replace(")", " / 0.15)")}`,
                  color:      meta.color,
                  border:     `1.5px solid ${meta.color.replace(")", " / 0.28)")}`,
                }}
              >
                {user.avatar}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate">{user.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{user.handle}</div>
              </div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-3 px-3">
            {nav.map((item) => {
              const active = isActive(item);
              return (
                <Link key={item.href} href={item.href} asChild>
                  <a
                    className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13px] transition-colors mb-0.5"
                    style={
                      active
                        ? { background: `${meta.color.replace(")", " / 0.10)")}`, color: meta.color }
                        : { color: "oklch(0.55 0.02 260)" }
                    }
                  >
                    <span className="w-4 h-4 shrink-0 flex items-center">{item.icon}</span>
                    <span className={active ? "font-semibold" : ""}>{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border px-3 py-2 shrink-0">
            <Link href="/" asChild>
              <a className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                ← Back to marketing
              </a>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] text-muted-foreground/60 hover:text-destructive transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </aside>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 pb-[calc(56px+env(safe-area-inset-bottom))] lg:pb-0">
        <header
          className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="h-[52px] flex items-center justify-between px-4">
            <Logo size={26} />
            <button
              onClick={() => setSheetOpen(true)}
              aria-label="Open menu"
              className="w-9 h-9 flex items-center justify-center rounded-full text-[12px] font-bold transition-opacity active:opacity-70"
              style={{
                background: `${meta.color.replace(")", " / 0.15)")}`,
                color:      meta.color,
                border:     `1.5px solid ${meta.color.replace(")", " / 0.25)")}`,
              }}
            >
              {user.avatar}
            </button>
          </div>
        </header>
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav
        role="tablist"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {nav.slice(0, tabCount).map((item) => {
          const active = isActive(item);
          return (
            <Link key={item.href} href={item.href} asChild>
              <a
                role="tab"
                aria-selected={active}
                aria-label={item.label}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] min-w-0 select-none"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <div
                  className="w-10 h-7 rounded-full flex items-center justify-center transition-all duration-150"
                  style={active ? { background: `${meta.color.replace(")", " / 0.12)")}` } : undefined}
                >
                  <span style={{ color: active ? meta.color : "oklch(0.55 0.02 260)" }}>
                    {item.icon}
                  </span>
                </div>
                <span
                  className="text-[10px] leading-none"
                  style={{ color: active ? meta.color : "oklch(0.55 0.02 260)", fontWeight: active ? 600 : 400 }}
                >
                  {item.label}
                </span>
              </a>
            </Link>
          );
        })}
        <button
          onClick={() => setSheetOpen(true)}
          aria-label="More options"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] select-none"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <div className="w-10 h-7 rounded-full flex items-center justify-center">
            <MoreHorizontal className="w-5 h-5" style={{ color: "oklch(0.55 0.02 260)" }} />
          </div>
          <span className="text-[10px] leading-none" style={{ color: "oklch(0.55 0.02 260)" }}>
            More
          </span>
        </button>
      </nav>

      <GenericMoreSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        nav={nav}
        loc={loc}
        user={user}
        meta={meta}
        homeHref={homeHref}
        onSignOut={handleSignOut}
        role={user.role}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CoachLayout — extracted so it can call hooks unconditionally                */
/* -------------------------------------------------------------------------- */

function CoachLayout({
  user,
  meta,
  loc,
  navigate,
  onSignOut,
  children,
}: {
  user: { name: string; avatar: string; handle: string };
  meta: { color: string; label: string };
  loc: string;
  navigate: (href: string) => void;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const [profileOpen, setProfileOpen] = useState(false);

  // 2 — Live badge counts
  const { data: badges } = useCoachBadgeCounts();
  const filmBadge  = badges?.filmPending ?? 0;
  const inboxBadge = badges?.inboxUnread ?? 0;

  // 3 — Swipe navigation between section sub-pages
  const { onTouchStart, onTouchEnd } = useCoachSwipe(loc, navigate);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop grouped sidebar */}
      <CoachDesktopSidebar
        loc={loc}
        user={user}
        meta={meta}
        onSignOut={onSignOut}
      />

      {/* Main content area — swipe handlers for section navigation */}
      <main
        className="flex-1 min-w-0 pb-[calc(56px+env(safe-area-inset-bottom))] lg:pb-0"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* 1 — Section-aware header + sub-nav strip */}
        <CoachHeader loc={loc} user={user} onProfileOpen={() => setProfileOpen(true)} />
        {children}
      </main>

      {/* 1 + 2 + 3 — Premium 5-tab bar with live badges + haptics */}
      <CoachBottomNav
        tabs={COACH_TABS}
        loc={loc}
        filmBadge={filmBadge}
        inboxBadge={inboxBadge}
        navigate={navigate}
      />

      {/* Profile + overflow sheet */}
      <CoachProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        meta={meta}
        loc={loc}
        onSignOut={onSignOut}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PageHeader                                                                  */
/* -------------------------------------------------------------------------- */

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6 pb-5 mb-5 border-b border-border">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.12em] text-primary font-mono mb-1.5">
            {eyebrow}
          </div>
        )}
        <h1 className="display text-2xl sm:text-3xl lg:text-4xl leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-[13px] text-muted-foreground mt-1.5 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
