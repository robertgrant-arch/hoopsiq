// Complete plans catalog (the plans array in data.ts only has Team Pro; we keep the canonical three here).
export type Plan = {
  id: string;
  name: string;
  monthly: number;
  annual: number;
  perSeat?: boolean;
  features: string[];
  highlight?: string;
};

export const fullPlans: Plan[] = [
  {
    id: "p_player",
    name: "Player Core",
    monthly: 19.99,
    annual: 199,
    highlight: "For the athlete",
    features: [
      "Daily WODs — adaptive to your level",
      "Unlimited AI feedback on uploads",
      "Skill-track progression + XP",
      "10 film assignments / month",
      "Included courses library",
      "Member pricing on Expert Marketplace",
    ],
  },
  {
    id: "p_coach",
    name: "Coach Core",
    monthly: 49.99,
    annual: 499,
    highlight: "For the individual coach",
    features: [
      "Full Coach HQ — compliance, queue, reviews",
      "Playbook Studio + Film Room (up to 1 team)",
      "Assignment composer + practice plan builder",
      "Included coach education library",
      "Direct 1-on-1 messaging with athletes",
    ],
  },
  {
    id: "p_team",
    name: "Team Pro",
    monthly: 9.99,
    annual: 99,
    perSeat: true,
    highlight: "For programs & organizations",
    features: [
      "Everything in Coach Core — per seat",
      "Seat-based · 20 seat minimum",
      "Athletes automatically get 50% off Player Core",
      "Team Film Room + shared Playbook",
      "Compliance dashboards + analytics",
      "SSO + priority support",
    ],
  },
];
