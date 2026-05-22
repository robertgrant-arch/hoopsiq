export type Role =
  | "ATHLETE"
  | "COACH"
  | "TEAM_ADMIN"
  | "EXPERT"
  | "PARENT"
  | "SUPER_ADMIN";

export type DemoUser = {
  id: string;
  role: Role;
  name: string;
  handle: string;
  avatar: string;
  title: string;
  orgId?: string;
  teamId?: string;
  bio?: string;
  linkedChildId?: string;
  // For athlete users
  xp?: number;
  level?: number;
  streak?: number;
  hasTeamDiscount?: boolean;
};

export const demoUsers: DemoUser[] = [
  {
    id: "u_athlete_1",
    role: "ATHLETE",
    name: "Jalen Carter",
    handle: "@jcarter",
    avatar: "JC",
    title: "SG · Texas Elite Varsity · Class of 2027",
    orgId: "org_texas_elite",
    teamId: "team_varsity",
    xp: 2840,
    level: 7,
    streak: 14,
    hasTeamDiscount: true,
  },
  {
    id: "u_coach_1",
    role: "COACH",
    name: "Bob Grant",
    handle: "@coach_grant",
    avatar: "BG",
    title: "Head Coach · Texas Elite Varsity",
    orgId: "org_texas_elite",
    teamId: "team_varsity",
  },
  {
    id: "u_team_admin_1",
    role: "TEAM_ADMIN",
    name: "Diana Okafor",
    handle: "@dokafor",
    avatar: "DO",
    title: "Program Director · Texas Elite",
    orgId: "org_texas_elite",
  },
  {
    id: "u_expert_1",
    role: "EXPERT",
    name: "Chris Brickley",
    handle: "@brickley",
    avatar: "CB",
    title: "Skill Development Coach · NBA Clients",
    bio: "Trainer to NBA All-Stars. Shooting & footwork specialist.",
  },
  {
    id: "u_parent_1",
    role: "PARENT",
    name: "Renee Carter",
    handle: "@rcarter",
    avatar: "RC",
    title: "Parent · Jalen Carter",
    linkedChildId: "u_athlete_1",
  },
  {
    id: "u_admin_1",
    role: "SUPER_ADMIN",
    name: "Alex Rivera",
    handle: "@staff_rivera",
    avatar: "AR",
    title: "HoopsIQ Trust & Safety",
  },
];

export const ROLE_META: Record<Role, { label: string; color: string; home: string }> = {
  ATHLETE: { label: "Player", color: "oklch(0.78 0.17 75)", home: "/app/player" },
  COACH: { label: "Coach", color: "oklch(0.72 0.18 290)", home: "/app/coach" },
  TEAM_ADMIN: { label: "Team Admin", color: "oklch(0.75 0.14 180)", home: "/app/team" },
  EXPERT: { label: "Expert", color: "oklch(0.7 0.18 310)", home: "/app/expert" },
  PARENT: { label: "Parent", color: "oklch(0.75 0.12 140)", home: "/app/parent" },
  SUPER_ADMIN: { label: "Admin", color: "oklch(0.68 0.22 25)", home: "/app/admin" },
};
