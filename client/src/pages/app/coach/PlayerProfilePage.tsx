import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import {
  TrendingUp, TrendingDown, Minus, Target, ChevronDown, ChevronUp,
  CheckCircle2, Sparkles, Brain, Zap, Shield, Film, ClipboardList,
  Calendar, Star, User, Phone, Mail, AlertTriangle, Activity,
  FileText, Plus, ArrowLeft, MessageCircle, HeartPulse,
  Dumbbell, Trophy, Pin, X, BookOpen, BarChart3,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { computePlayerReadiness, REASON_LABELS as READINESS_REASON_LABELS } from "@/lib/readiness";
import { ReadinessStatusBadge } from "@/components/readiness/ReadinessStatusBadge";

// ── Types ─────────────────────────────────────────────────────────────────────

type ProfileTab = "Overview" | "Development" | "Film" | "Attendance" | "Health" | "Notes" | "Timeline";
type TrendDir   = "up" | "flat" | "down";
type NoteType   = "coach" | "academic" | "health" | "behavioral" | "recruiting" | "general";

interface SubSkill   { name: string; score: number; trend: TrendDir; assessedAt: string; }
interface Milestone  { description: string; targetDate: string; completed: boolean; }

interface SkillCategory {
  category: string; color: string; avg: number; subSkills: SubSkill[];
}

interface FocusArea {
  id: string; priority: number; category: string; subSkill: string;
  currentScore: number; targetScore: number; deadline: string;
  rationale: string; source: "coach" | "ai"; progress: number;
  drills: string[]; filmClips: string[]; milestones: Milestone[];
}

interface AIRec {
  id: string; type: string; category: string; subSkill: string;
  reasoning: string; confidence: number;
  status: "pending" | "accepted" | "overridden";
}

interface AttendanceRecord {
  id: string; date: string; eventType: string; eventTitle: string;
  status: "present" | "absent" | "late" | "excused"; note?: string;
}

interface ReadinessDay {
  label: string; fatigue: number; sleep: number; soreness: number;
  mood?: number; flagged: boolean;
}

interface InjuryRecord {
  id: string; description: string; bodyPart: string;
  status: "active" | "monitoring" | "cleared";
  restrictions?: string; injuredAt: string;
  expectedReturnAt?: string; clearedAt?: string; clearanceNotes?: string;
}

interface PlayerNote {
  id: string; noteType: NoteType; body: string; isPinned: boolean;
  createdByName: string; createdAt: string;
}

interface FilmSessionSummary {
  id: string; date: string; title: string;
  type: "game" | "practice" | "scrimmage" | "workout";
  opponent?: string; annotationCount: number;
  highlightCount: number; aiConfidence?: number;
}

interface Guardian {
  id: string; name: string; relationship: string;
  phone?: string; email?: string; isPrimary: boolean; canReceiveMessages: boolean;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_PLAYER = {
  id: "p1", name: "Marcus Davis", initials: "MD", position: "PG",
  jerseyNumber: 3, tier: "HS Varsity", gradYear: 2026,
  height: "6'1\"", weight: 175, handedness: "Right",
  yearsPlaying: 8, role: "Starter", gpa: "3.4",
  recruitingStatus: "D1 Interest",
  phone: "(832) 555-0194", email: "mdavis26@school.edu",
  status: "active" as const,
  bio: "Lead guard with elite court vision and a developing off-dribble game. Three-year varsity starter with D1 evaluations in progress.",
  academicNotes: "3.4 GPA as of Spring semester. AP History and AP Calculus enrolled. NCAA eligibility on track.",
};

const MOCK_GUARDIANS: Guardian[] = [
  { id: "g1", name: "James Davis", relationship: "parent", phone: "(832) 555-0143",
    email: "jdavis@email.com", isPrimary: true, canReceiveMessages: true },
  { id: "g2", name: "Patricia Davis", relationship: "parent", phone: "(832) 555-0188",
    email: "pdavis@email.com", isPrimary: false, canReceiveMessages: true },
];

const SKILLS: SkillCategory[] = [
  { category: "Shooting", color: "oklch(0.65_0.18_290)", avg: 7.2, subSkills: [
    { name: "Catch & Shoot", score: 8, trend: "up", assessedAt: "May 1" },
    { name: "Off Dribble", score: 6, trend: "flat", assessedAt: "May 1" },
    { name: "Free Throw", score: 8, trend: "up", assessedAt: "May 1" },
    { name: "Pull-Up", score: 7, trend: "up", assessedAt: "Apr 15" },
  ]},
  { category: "Ball Handling", color: "oklch(0.72_0.17_75)", avg: 7.8, subSkills: [
    { name: "On the Move", score: 8, trend: "up", assessedAt: "May 1" },
    { name: "Pressure Handling", score: 7, trend: "up", assessedAt: "May 1" },
    { name: "Weak Hand", score: 6, trend: "flat", assessedAt: "Apr 15" },
  ]},
  { category: "Finishing", color: "oklch(0.68_0.22_25)", avg: 5.7, subSkills: [
    { name: "Contact Layup", score: 5, trend: "down", assessedAt: "May 1" },
    { name: "Floater", score: 6, trend: "flat", assessedAt: "Apr 15" },
    { name: "Euro Step", score: 5, trend: "flat", assessedAt: "Apr 15" },
  ]},
  { category: "Footwork", color: "oklch(0.75_0.18_150)", avg: 6.5, subSkills: [
    { name: "Pivot (Front/Back)", score: 7, trend: "up", assessedAt: "May 1" },
    { name: "Jab Step", score: 6, trend: "flat", assessedAt: "Apr 15" },
    { name: "Shot Fake", score: 7, trend: "up", assessedAt: "Apr 15" },
  ]},
  { category: "Defense", color: "oklch(0.7_0.18_200)", avg: 6.8, subSkills: [
    { name: "On-Ball", score: 7, trend: "up", assessedAt: "May 1" },
    { name: "Help Side", score: 6, trend: "flat", assessedAt: "May 1" },
    { name: "Closeouts", score: 7, trend: "up", assessedAt: "Apr 15" },
  ]},
  { category: "Decision-Making", color: "oklch(0.72_0.18_240)", avg: 7.0, subSkills: [
    { name: "Pick & Roll Reads", score: 7, trend: "up", assessedAt: "May 1" },
    { name: "Shot Selection", score: 7, trend: "flat", assessedAt: "May 1" },
    { name: "Pace Control", score: 7, trend: "up", assessedAt: "Apr 15" },
  ]},
  { category: "Conditioning", color: "oklch(0.7_0.16_60)", avg: 8.0, subSkills: [
    { name: "Lateral Quickness", score: 8, trend: "up", assessedAt: "May 1" },
    { name: "Endurance", score: 8, trend: "flat", assessedAt: "May 1" },
    { name: "Recovery Rate", score: 8, trend: "up", assessedAt: "Apr 15" },
  ]},
  { category: "Basketball IQ", color: "oklch(0.68_0.15_320)", avg: 7.5, subSkills: [
    { name: "Spacing", score: 8, trend: "up", assessedAt: "May 1" },
    { name: "Off-Ball Movement", score: 7, trend: "flat", assessedAt: "May 1" },
    { name: "Film Retention", score: 7, trend: "up", assessedAt: "Apr 15" },
  ]},
];

const FOCUS_AREAS: FocusArea[] = [
  { id: "fa1", priority: 1, category: "Finishing", subSkill: "Contact Layup",
    currentScore: 5, targetScore: 7, deadline: "Jun 15, 2025",
    rationale: "Weakest area relative to role. PG contact finishing limits effectiveness in the paint at D1 pace.",
    source: "coach", progress: 28,
    drills: ["Left-hand wall layup series", "Mikan drill 3x/week", "Contact finishing against pad holder"],
    filmClips: ["Turnover vs. Barnegat (contact)", "Missed and-1 vs. Toms River"],
    milestones: [
      { description: "Score 6/10 on contact layup eval", targetDate: "May 20", completed: false },
      { description: "10 consecutive wall layups each hand", targetDate: "Jun 1", completed: false },
      { description: "Score 7/10 on contact layup eval", targetDate: "Jun 15", completed: false },
    ],
  },
  { id: "fa2", priority: 2, category: "Shooting", subSkill: "Off Dribble",
    currentScore: 6, targetScore: 8, deadline: "Jul 1, 2025",
    rationale: "Catch-and-shoot is already a strength. Off-dribble gap limits creation at next level.",
    source: "ai", progress: 15,
    drills: ["Pull-up off DHO (daily)", "Step-back off live dribble", "1-2 step pull-up form"],
    filmClips: ["Pull-up miss vs. Lakewood (0:47)", "Good look off DHO vs. LBI (2:13)"],
    milestones: [
      { description: "60% on pull-up shooting chart", targetDate: "Jun 1", completed: false },
      { description: "Score 7/10 on off-dribble eval", targetDate: "Jun 15", completed: false },
    ],
  },
  { id: "fa3", priority: 3, category: "Ball Handling", subSkill: "Weak Hand",
    currentScore: 6, targetScore: 8, deadline: "Jul 15, 2025",
    rationale: "Scouting reports note opponents overplay right. Weak hand development is recruiting-critical.",
    source: "coach", progress: 40,
    drills: ["Left-only dribble warmup (10 min daily)", "Two-ball stationary drills", "Weak hand finishing series"],
    filmClips: ["Forced right vs. Neptune (full game)"],
    milestones: [
      { description: "Left-only 3-cone drill under 8s", targetDate: "May 25", completed: true },
      { description: "Score 7/10 on weak-hand eval", targetDate: "Jun 15", completed: false },
    ],
  },
];

const AI_RECS: AIRec[] = [
  { id: "r1", type: "add_focus_area", category: "Footwork", subSkill: "Drop Step (Post Entry)",
    reasoning: "Film review from last 4 games shows 6 failed post-entry attempts. Drop step footwork would add a dimension to half-court offense.",
    confidence: 0.82, status: "pending" },
  { id: "r2", type: "increase_load", category: "Finishing", subSkill: "Contact Layup",
    reasoning: "Progress rate on FA1 is 14% in 3 weeks. Target pace requires 25%/week. Recommend adding one contact finishing session.",
    confidence: 0.91, status: "pending" },
  { id: "r3", type: "schedule_assessment", category: "Conditioning", subSkill: "Lateral Quickness",
    reasoning: "Last evaluation was 6 weeks ago. Lateral quickness is a D1 recruiting benchmark. Recommend re-assessment this week.",
    confidence: 0.95, status: "accepted" },
];

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: "a1",  date: "2025-04-28", eventType: "practice",  eventTitle: "Monday Practice",          status: "present" },
  { id: "a2",  date: "2025-04-25", eventType: "game",      eventTitle: "vs. Neptune Trojans",       status: "present" },
  { id: "a3",  date: "2025-04-22", eventType: "practice",  eventTitle: "Thursday Practice",         status: "present" },
  { id: "a4",  date: "2025-04-19", eventType: "practice",  eventTitle: "Tuesday Practice",          status: "late",    note: "Arrived 12 min late — traffic" },
  { id: "a5",  date: "2025-04-16", eventType: "scrimmage", eventTitle: "Spring Scrimmage",          status: "present" },
  { id: "a6",  date: "2025-04-14", eventType: "practice",  eventTitle: "Monday Practice",           status: "present" },
  { id: "a7",  date: "2025-04-11", eventType: "practice",  eventTitle: "Friday Practice",           status: "present" },
  { id: "a8",  date: "2025-04-08", eventType: "game",      eventTitle: "vs. Barnegat Bengals",      status: "present" },
  { id: "a9",  date: "2025-04-05", eventType: "practice",  eventTitle: "Saturday Practice",         status: "excused", note: "SAT exam — pre-approved" },
  { id: "a10", date: "2025-04-02", eventType: "practice",  eventTitle: "Wednesday Practice",        status: "present" },
  { id: "a11", date: "2025-03-29", eventType: "practice",  eventTitle: "Saturday Practice",         status: "present" },
  { id: "a12", date: "2025-03-26", eventType: "practice",  eventTitle: "Wednesday Practice",        status: "absent",  note: "Illness — unexcused" },
];

const MOCK_READINESS: ReadinessDay[] = [
  { label: "Apr 15", fatigue: 3, sleep: 8, soreness: 2, mood: 8, flagged: false },
  { label: "Apr 16", fatigue: 4, sleep: 7, soreness: 3, mood: 7, flagged: false },
  { label: "Apr 17", fatigue: 5, sleep: 6, soreness: 5, mood: 6, flagged: false },
  { label: "Apr 18", fatigue: 6, sleep: 6, soreness: 6, mood: 5, flagged: false },
  { label: "Apr 19", fatigue: 4, sleep: 7, soreness: 4, mood: 7, flagged: false },
  { label: "Apr 20", fatigue: 7, sleep: 5, soreness: 7, mood: 4, flagged: true  },
  { label: "Apr 21", fatigue: 8, sleep: 6, soreness: 7, mood: 4, flagged: true  },
  { label: "Apr 22", fatigue: 5, sleep: 8, soreness: 4, mood: 7, flagged: false },
  { label: "Apr 23", fatigue: 3, sleep: 9, soreness: 2, mood: 9, flagged: false },
  { label: "Apr 24", fatigue: 4, sleep: 8, soreness: 3, mood: 8, flagged: false },
  { label: "Apr 25", fatigue: 5, sleep: 7, soreness: 4, mood: 7, flagged: false },
  { label: "Apr 26", fatigue: 6, sleep: 7, soreness: 5, mood: 6, flagged: false },
  { label: "Apr 27", fatigue: 3, sleep: 8, soreness: 2, mood: 9, flagged: false },
  { label: "Apr 28", fatigue: 4, sleep: 8, soreness: 3, mood: 8, flagged: false },
];

const MOCK_INJURIES: InjuryRecord[] = [
  { id: "inj1", description: "Left ankle sprain — Grade 1",
    bodyPart: "Ankle", status: "monitoring",
    restrictions: "Monitor during high-impact drills. No full-speed lateral cuts until re-eval.",
    injuredAt: "2025-04-20", expectedReturnAt: "2025-05-05" },
  { id: "inj2", description: "Right patellar tendinitis",
    bodyPart: "Knee", status: "cleared",
    restrictions: undefined, injuredAt: "2025-03-05",
    clearedAt: "2025-03-22",
    clearanceNotes: "Full clearance granted by team trainer. No restrictions. Re-assess if pain returns." },
];

const MOCK_NOTES_INIT: PlayerNote[] = [
  { id: "n1", noteType: "recruiting", body: "Phone call with Duke assistant coach — expressed strong interest after watching film from Neptune game. Follow up in 2 weeks.",
    isPinned: true, createdByName: "Coach Williams", createdAt: "2025-04-20T14:30:00Z" },
  { id: "n2", noteType: "coach", body: "Excellent leadership in today's film session. Called out multiple defensive rotations on his own. This is the kind of IQ growth we need.",
    isPinned: false, createdByName: "Coach Williams", createdAt: "2025-04-28T16:00:00Z" },
  { id: "n3", noteType: "academic", body: "GPA confirmed at 3.4 for Spring semester. AP History strong (B+). Calculus is a watch — C+ heading into finals. Connected him with tutoring resources.",
    isPinned: false, createdByName: "Coach Williams", createdAt: "2025-05-01T09:15:00Z" },
  { id: "n4", noteType: "health", body: "Ankle is responding well to treatment. Cleared for modified practice. Full re-eval scheduled May 5. No restrictions on shooting or upper-body work.",
    isPinned: false, createdByName: "Coach Williams", createdAt: "2025-04-23T11:00:00Z" },
  { id: "n5", noteType: "coach", body: "Still struggles to finish through contact when driving left. Mikan drill addition appears to be helping — saw improvement in Thursday scrimmage.",
    isPinned: false, createdByName: "Coach Williams", createdAt: "2025-04-10T15:45:00Z" },
  { id: "n6", noteType: "academic", body: "Teacher report from Ms. Rodriguez: strong classroom participation, always prepared. No academic eligibility concerns.",
    isPinned: false, createdByName: "Coach Williams", createdAt: "2025-03-15T10:00:00Z" },
];

const MOCK_FILM_SESSIONS: FilmSessionSummary[] = [
  { id: "fs1", date: "2025-04-25", title: "vs. Neptune Trojans",
    type: "game", opponent: "Neptune Trojans",
    annotationCount: 24, highlightCount: 7, aiConfidence: 0.91 },
  { id: "fs2", date: "2025-04-16", title: "Spring Scrimmage",
    type: "scrimmage", annotationCount: 15, highlightCount: 4, aiConfidence: 0.87 },
  { id: "fs3", date: "2025-04-08", title: "vs. Barnegat Bengals",
    type: "game", opponent: "Barnegat Bengals",
    annotationCount: 18, highlightCount: 5, aiConfidence: 0.89 },
  { id: "fs4", date: "2025-04-22", title: "Thursday Practice Film",
    type: "practice", annotationCount: 12, highlightCount: 0, aiConfidence: 0.78 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function cssColor(raw: string) { return raw.replace(/_/g, " "); }

function scoreColor(score: number) {
  if (score >= 8) return "oklch(0.75 0.18 150)";
  if (score >= 6) return "oklch(0.72 0.17 75)";
  return "oklch(0.68 0.22 25)";
}


function attendanceColor(status: string) {
  if (status === "present")  return { bg: "oklch(0.75 0.18 150 / 0.12)", text: "oklch(0.6 0.15 145)", border: "oklch(0.75 0.18 150 / 0.3)" };
  if (status === "late")     return { bg: "oklch(0.72 0.17 75 / 0.12)",  text: "oklch(0.65 0.17 75)",  border: "oklch(0.72 0.17 75 / 0.3)" };
  if (status === "excused")  return { bg: "oklch(0.72 0.18 240 / 0.12)", text: "oklch(0.65 0.18 240)", border: "oklch(0.72 0.18 240 / 0.3)" };
  return { bg: "oklch(0.68 0.22 25 / 0.12)", text: "oklch(0.6 0.2 25)", border: "oklch(0.68 0.22 25 / 0.3)" };
}

function injuryStatusColor(status: string) {
  if (status === "cleared")    return { text: "oklch(0.75 0.18 150)", bg: "oklch(0.75 0.18 150 / 0.1)", border: "oklch(0.75 0.18 150 / 0.3)" };
  if (status === "monitoring") return { text: "oklch(0.72 0.17 75)",  bg: "oklch(0.72 0.17 75 / 0.1)",  border: "oklch(0.72 0.17 75 / 0.3)" };
  return { text: "oklch(0.68 0.22 25)", bg: "oklch(0.68 0.22 25 / 0.1)", border: "oklch(0.68 0.22 25 / 0.3)" };
}

const NOTE_TYPE_META: Record<NoteType, { label: string; color: string }> = {
  coach:      { label: "Coach",     color: "oklch(0.65 0.18 290)" },
  academic:   { label: "Academic",  color: "oklch(0.72 0.18 240)" },
  health:     { label: "Health",    color: "oklch(0.72 0.17 75)" },
  behavioral: { label: "Conduct",   color: "oklch(0.68 0.22 25)" },
  recruiting: { label: "Recruiting",color: "oklch(0.75 0.18 150)" },
  general:    { label: "General",   color: "oklch(0.6 0.05 240)" },
};

const EVENT_TYPE_ICON: Record<string, React.ReactNode> = {
  game:         <Trophy className="w-3.5 h-3.5" />,
  practice:     <Dumbbell className="w-3.5 h-3.5" />,
  scrimmage:    <Shield className="w-3.5 h-3.5" />,
  film_session: <Film className="w-3.5 h-3.5" />,
  optional:     <Calendar className="w-3.5 h-3.5" />,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-40 bg-muted rounded-md" />
      <div className="h-28 rounded-xl bg-muted" />
      <div className="flex gap-1 border-b border-border pb-0">
        {[120, 100, 80, 110, 90, 100].map((w, i) => (
          <div key={i} className="h-10 rounded-t-md bg-muted" style={{ width: w }} />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-64 rounded-xl bg-muted" />
        <div className="space-y-3">
          <div className="h-28 rounded-xl bg-muted" />
          <div className="h-28 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

// ── Skill sub-components ──────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: TrendDir }) {
  if (trend === "up")   return <TrendingUp   className="w-3.5 h-3.5 text-[oklch(0.75_0.18_150)]" />;
  if (trend === "down") return <TrendingDown className="w-3.5 h-3.5 text-[oklch(0.68_0.22_25)]" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

function SkillRow({ name, score, trend, assessedAt }: SubSkill) {
  const color = scoreColor(score);
  return (
    <div className="flex items-center gap-3 py-2">
      <TrendIcon trend={trend} />
      <span className="text-[13px] flex-1 min-w-0 truncate">{name}</span>
      <span className="text-[11px] text-muted-foreground shrink-0">{assessedAt}</span>
      <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[12px] font-bold font-mono"
           style={{ background: `${color.replace(")", " / 0.15)")}`, color, border: `1px solid ${color.replace(")", " / 0.35)")}` }}>
        {score}
      </div>
      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
        <div className="h-full rounded-full" style={{ width: `${(score / 10) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function SkillCategoryGroup({ category, color, avg, subSkills }: SkillCategory) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cssColor(color) }} />
          <span className="text-[13px] font-semibold">{category}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-mono font-bold" style={{ color: cssColor(color) }}>{avg.toFixed(1)}</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="px-4 divide-y divide-border/50 bg-card/50">
          {subSkills.map(ss => <SkillRow key={ss.name} {...ss} />)}
        </div>
      )}
    </div>
  );
}

function SkillRadar({ skills }: { skills: SkillCategory[] }) {
  const SIZE = 280; const CENTER = SIZE / 2; const MAX_RADIUS = 110; const N = skills.length;
  function pointAt(angle: number, r: number) {
    return { x: CENTER + r * Math.sin(angle), y: CENTER - r * Math.cos(angle) };
  }
  const rings = [2, 4, 6, 8, 10];
  const scorePoints = skills.map((s, i) => pointAt((2 * Math.PI * i) / N, (s.avg / 10) * MAX_RADIUS));
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto">
      {rings.map(ring => {
        const r = (ring / 10) * MAX_RADIUS;
        const pts = Array.from({ length: N }, (_, i) => {
          const { x, y } = pointAt((2 * Math.PI * i) / N, r);
          return `${x},${y}`;
        }).join(" ");
        return (
          <g key={ring}>
            <polygon points={pts} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} className="text-foreground" />
            <text x={CENTER + 4} y={CENTER - r - 3} fontSize={9} fill="currentColor" opacity={0.4} className="text-foreground">{ring}</text>
          </g>
        );
      })}
      {skills.map((_, i) => {
        const angle = (2 * Math.PI * i) / N;
        const { x, y } = pointAt(angle, MAX_RADIUS);
        return <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="currentColor" strokeOpacity={0.12} strokeWidth={1} className="text-foreground" />;
      })}
      <polygon points={scorePoints.map(p => `${p.x},${p.y}`).join(" ")}
               fill="oklch(0.65 0.18 290 / 0.25)" stroke="oklch(0.65 0.18 290)" strokeWidth={2} strokeLinejoin="round" />
      {scorePoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={cssColor(skills[i].color)} stroke="var(--background)" strokeWidth={1.5} />
      ))}
      {skills.map((s, i) => {
        const angle = (2 * Math.PI * i) / N;
        const { x, y } = pointAt(angle, MAX_RADIUS + 22);
        const textAnchor = Math.abs(x - CENTER) < 8 ? "middle" : x < CENTER ? "end" : "start";
        return (
          <text key={i} x={x} y={y + 4} fontSize={9.5} fontWeight={600} textAnchor={textAnchor} fill={cssColor(s.color)}>
            {s.category}
          </text>
        );
      })}
    </svg>
  );
}

// ── Focus area card ───────────────────────────────────────────────────────────

function FocusAreaCard({ area }: { area: FocusArea }) {
  const [expanded, setExpanded] = useState(false);
  const pColors: Record<number, string> = { 1: "oklch(0.68 0.22 25)", 2: "oklch(0.72 0.17 75)", 3: "oklch(0.75 0.18 150)" };
  const pColor = pColors[area.priority] ?? "oklch(0.65 0.18 290)";
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 w-7 h-7 rounded-md flex items-center justify-center text-[12px] font-bold font-mono shrink-0"
               style={{ background: `${pColor.replace(")", " / 0.15)")}`, color: pColor, border: `1px solid ${pColor.replace(")", " / 0.3)")}` }}>
            {area.priority}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13.5px] font-semibold">{area.subSkill}</span>
              <span className="text-muted-foreground text-[12px]">·</span>
              <span className="text-[12px] text-muted-foreground">{area.category}</span>
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-1"
                     style={{ borderColor: area.source === "ai" ? "oklch(0.72 0.18 290 / 0.4)" : "oklch(0.75 0.18 150 / 0.4)",
                              color: area.source === "ai" ? "oklch(0.65 0.18 290)" : "oklch(0.75 0.18 150)" }}>
                {area.source === "ai" ? <><Brain className="w-2.5 h-2.5" /> AI</> : <><User className="w-2.5 h-2.5" /> Coach</>}
              </Badge>
            </div>
            <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{area.rationale}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-center gap-1 justify-end text-[12px] font-mono font-bold">
            <span style={{ color: scoreColor(area.currentScore) }}>{area.currentScore}</span>
            <span className="text-muted-foreground">→</span>
            <span style={{ color: scoreColor(area.targetScore) }}>{area.targetScore}</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
            <Calendar className="w-3 h-3" />{area.deadline}
          </div>
        </div>
      </div>
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>Progress toward goal</span>
          <span className="font-mono font-semibold text-foreground">{area.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${area.progress}%`, background: "oklch(0.72 0.18 290)" }} />
        </div>
      </div>
      <div className="px-5 pb-3 flex flex-col gap-1.5">
        {area.milestones.slice(0, expanded ? undefined : 2).map((m, i) => (
          <div key={i} className="flex items-start gap-2 text-[12px]">
            <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${m.completed ? "text-[oklch(0.75_0.18_150)]" : "text-muted-foreground/40"}`} />
            <span className={m.completed ? "line-through text-muted-foreground" : ""}>{m.description}</span>
            <span className="ml-auto text-muted-foreground shrink-0">{m.targetDate}</span>
          </div>
        ))}
      </div>
      {expanded && (
        <div className="px-5 pb-4 space-y-4 border-t border-border pt-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Drills
            </div>
            <ul className="space-y-1">{area.drills.map((d, i) => (
              <li key={i} className="text-[12.5px] flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">·</span>{d}
              </li>
            ))}</ul>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
              <Film className="w-3 h-3" /> Film Clips
            </div>
            <ul className="space-y-1">{area.filmClips.map((clip, i) => (
              <li key={i}>
                <button className="text-[12.5px] text-primary hover:underline underline-offset-2 text-left"
                        onClick={() => toast.info(`Opening clip: ${clip}`)}>
                  {clip}
                </button>
              </li>
            ))}</ul>
          </div>
        </div>
      )}
      <div className="px-5 pb-4">
        <button onClick={() => setExpanded(v => !v)}
                className="text-[12px] text-primary hover:underline underline-offset-2 flex items-center gap-1">
          {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Collapse</> : <><ChevronDown className="w-3.5 h-3.5" /> Show drills & film</>}
        </button>
      </div>
    </div>
  );
}

// ── AI recommendation card ────────────────────────────────────────────────────

function AIRecCard({ rec, onAccept, onOverride }: {
  rec: AIRec;
  onAccept: (id: string) => void;
  onOverride: (id: string, reason: string) => void;
}) {
  const [overrideMode, setOverrideMode] = useState(false);
  const [reason, setReason] = useState("");
  const typeLabel: Record<string, string> = {
    add_focus_area: "Add Focus Area", increase_load: "Increase Load", schedule_assessment: "Schedule Assessment",
  };
  const typeIcon: Record<string, React.ReactNode> = {
    add_focus_area: <Target className="w-3.5 h-3.5" />,
    increase_load: <Zap className="w-3.5 h-3.5" />,
    schedule_assessment: <Calendar className="w-3.5 h-3.5" />,
  };
  const pct = Math.round(rec.confidence * 100);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[11px] h-5 px-1.5 gap-1 border-[oklch(0.65_0.18_290_/_0.4)] text-[oklch(0.65_0.18_290)]">
              {typeIcon[rec.type] ?? <Sparkles className="w-3.5 h-3.5" />}
              {typeLabel[rec.type] ?? rec.type}
            </Badge>
            <span className="text-[12px] text-muted-foreground">{rec.category} · {rec.subSkill}</span>
          </div>
          {rec.status === "accepted" && (
            <Badge className="shrink-0 bg-[oklch(0.75_0.18_150_/_0.15)] text-[oklch(0.75_0.18_150)] border border-[oklch(0.75_0.18_150_/_0.3)] text-[11px] gap-1">
              <CheckCircle2 className="w-3 h-3" /> Accepted
            </Badge>
          )}
          {rec.status === "overridden" && (
            <Badge className="shrink-0 bg-muted text-muted-foreground text-[11px] gap-1">Overridden</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-muted-foreground uppercase tracking-[0.08em] font-semibold">Confidence</span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 90 ? "oklch(0.75 0.18 150)" : pct >= 75 ? "oklch(0.72 0.17 75)" : "oklch(0.68 0.22 25)" }} />
          </div>
          <span className="text-[11px] font-mono font-bold text-foreground">{pct}%</span>
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed">{rec.reasoning}</p>
        {rec.status === "pending" && !overrideMode && (
          <div className="flex items-center gap-2 mt-4">
            <Button size="sm" className="h-8 text-[12px] bg-[oklch(0.75_0.18_150_/_0.15)] text-[oklch(0.75_0.18_150)] border border-[oklch(0.75_0.18_150_/_0.3)] hover:bg-[oklch(0.75_0.18_150_/_0.25)]" variant="outline" onClick={() => onAccept(rec.id)}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Accept
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-[12px]" onClick={() => setOverrideMode(true)}>Override</Button>
          </div>
        )}
        {overrideMode && (
          <div className="mt-4 space-y-2">
            <label className="text-[12px] text-muted-foreground font-medium">Reason for override</label>
            <Textarea className="text-[13px] resize-none" rows={3} placeholder="Explain why you're overriding this recommendation…" value={reason} onChange={e => setReason(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" className="h-8 text-[12px]" onClick={() => { if (!reason.trim()) { toast.error("Provide a reason."); return; } onOverride(rec.id, reason); setOverrideMode(false); setReason(""); }}>Confirm Override</Button>
              <Button size="sm" variant="ghost" className="h-8 text-[12px]" onClick={() => { setOverrideMode(false); setReason(""); }}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold flex items-center gap-1.5">
      {icon}{label}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string | React.ReactNode; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <div className="text-[11px] text-muted-foreground mb-2">{label}</div>
      <div className="text-[24px] font-bold leading-none tabular-nums" style={color ? { color } : undefined}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: Overview
// ══════════════════════════════════════════════════════════════════════════════

function OverviewTab({
  player, guardians, injuries, focusAreas,
  attendance, readiness, skills,
}: {
  player: typeof MOCK_PLAYER;
  guardians: Guardian[];
  injuries: InjuryRecord[];
  focusAreas: FocusArea[];
  attendance: AttendanceRecord[];
  readiness: ReadinessDay[];
  skills: SkillCategory[];
}) {
  const overallAvg = (skills.reduce((acc, s) => acc + s.avg, 0) / skills.length).toFixed(1);
  const present   = attendance.filter(a => a.status === "present").length;
  const attended  = attendance.filter(a => a.status !== "absent").length;
  const attendRate = attendance.length > 0 ? Math.round((attended / attendance.length) * 100) : null;
  const today      = readiness[readiness.length - 1];
  const activeInj  = injuries.filter(i => i.status !== "cleared");
  const playerReadinessSummary = computePlayerReadiness({
    latestCheckin: today ?? null,
    hasActiveInjury:     injuries.some(i => i.status === "active"),
    hasMonitoringInjury: injuries.some(i => i.status === "monitoring"),
  });

  return (
    <div className="space-y-6">
      {/* Active injury banner */}
      {activeInj.length > 0 && (
        <div className="rounded-xl border border-[oklch(0.72_0.17_75_/_0.4)] bg-[oklch(0.72_0.17_75_/_0.06)] px-5 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[oklch(0.65_0.17_75)] mt-0.5 shrink-0" />
          <div>
            <div className="text-[13px] font-semibold text-[oklch(0.65_0.17_75)]">
              {activeInj.length === 1 ? "1 Active Health Flag" : `${activeInj.length} Active Health Flags`}
            </div>
            {activeInj.map(inj => (
              <div key={inj.id} className="text-[12px] text-muted-foreground mt-0.5">
                <span className="font-medium">{inj.bodyPart}</span> — {inj.description}
                {inj.restrictions && <span className="ml-2 text-[11px]">· {inj.restrictions}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Attendance Rate" value={attendRate != null ? `${attendRate}%` : "—"}
                  sub={`${present} present / ${attendance.length} events`}
                  color={attendRate != null ? (attendRate >= 90 ? "oklch(0.75 0.18 150)" : attendRate >= 75 ? "oklch(0.72 0.17 75)" : "oklch(0.68 0.22 25)") : undefined} />
        <StatCard label="Avg Skill Score" value={`${overallAvg}`} sub="across 8 categories"
                  color="oklch(0.65 0.18 290)" />
        <StatCard
          label="Today's Readiness"
          value={<ReadinessStatusBadge status={playerReadinessSummary.status} confidence={playerReadinessSummary.confidence} size="md" title={playerReadinessSummary.summary} />}
          sub={today ? `Fatigue ${today.fatigue} · Sleep ${today.sleep}h` : "No check-in today"}
        />
        <StatCard label="IDP Focus Areas" value={`${focusAreas.length}`}
                  sub={`${focusAreas.filter(f => f.progress > 50).length} past halfway`} />
      </div>

      {/* Bio + guardians */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bio */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <SectionLabel icon={<User className="w-3.5 h-3.5" />} label="Player Bio" />
          {player.bio && <p className="text-[13px] text-muted-foreground leading-relaxed">{player.bio}</p>}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {[
              { label: "Position",     value: player.position },
              { label: "Jersey",       value: `#${player.jerseyNumber}` },
              { label: "Height",       value: player.height },
              { label: "Weight",       value: `${player.weight} lbs` },
              { label: "Handedness",   value: player.handedness },
              { label: "Years Playing",value: `${player.yearsPlaying} yrs` },
              { label: "GPA",          value: player.gpa },
              { label: "Class",        value: `'${String(player.gradYear).slice(2)}` },
              { label: "Tier",         value: player.tier },
              { label: "Role",         value: player.role },
              { label: "Recruiting",   value: player.recruitingStatus },
            ].map(row => (
              <div key={row.label}>
                <div className="text-[11px] text-muted-foreground">{row.label}</div>
                <div className="text-[13px] font-semibold mt-0.5">{row.value}</div>
              </div>
            ))}
          </div>
          {player.academicNotes && (
            <div className="pt-3 border-t border-border space-y-1">
              <SectionLabel icon={<BookOpen className="w-3.5 h-3.5" />} label="Academic Notes" />
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">{player.academicNotes}</p>
            </div>
          )}
          {(player.phone || player.email) && (
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              {player.phone && (
                <a href={`tel:${player.phone}`} className="flex items-center gap-2 text-[12.5px] text-muted-foreground hover:text-foreground transition">
                  <Phone className="w-3.5 h-3.5 shrink-0" />{player.phone}
                </a>
              )}
              {player.email && (
                <a href={`mailto:${player.email}`} className="flex items-center gap-2 text-[12.5px] text-muted-foreground hover:text-foreground transition">
                  <Mail className="w-3.5 h-3.5 shrink-0" />{player.email}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Guardians */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <SectionLabel icon={<User className="w-3.5 h-3.5" />} label="Parent / Guardian Contacts" />
            {guardians.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No contacts on file.</p>
            ) : guardians.map(g => (
              <div key={g.id} className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold">{g.name}</span>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 capitalize">{g.relationship}</Badge>
                    {g.isPrimary && <Badge className="text-[10px] h-5 px-1.5 bg-primary/10 text-primary border-primary/30 border">Primary</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {g.phone && (
                      <a href={`tel:${g.phone}`} className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition">
                        <Phone className="w-3 h-3" />{g.phone}
                      </a>
                    )}
                    {g.email && (
                      <a href={`mailto:${g.email}`} className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition">
                        <Mail className="w-3 h-3" />{g.email}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {g.canReceiveMessages && (
                    <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
                            onClick={() => toast.info(`Opening message to ${g.name}`)}>
                      <MessageCircle className="w-3.5 h-3.5" /> Message
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* IDP summary */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <SectionLabel icon={<Target className="w-3.5 h-3.5" />} label="Development Focus" />
            {focusAreas.map(fa => (
              <div key={fa.id} className="space-y-1">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium">{fa.priority}. {fa.subSkill}
                    <span className="text-muted-foreground font-normal text-[11.5px] ml-1.5">({fa.category})</span>
                  </span>
                  <span className="font-mono text-[12px] text-muted-foreground">{fa.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${fa.progress}%`, background: "oklch(0.72 0.18 290)" }} />
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {fa.deadline}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: Development
// ══════════════════════════════════════════════════════════════════════════════

function DevelopmentTab({ skills, focusAreas, aiRecs, onAcceptRec, onOverrideRec, playerId }: {
  skills: SkillCategory[];
  focusAreas: FocusArea[];
  aiRecs: AIRec[];
  onAcceptRec: (id: string) => void;
  onOverrideRec: (id: string, reason: string) => void;
  playerId: string;
}) {
  const overallAvg = (skills.reduce((a, s) => a + s.avg, 0) / skills.length).toFixed(1);
  return (
    <div className="space-y-8">
      {/* Skills section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-semibold">Skill Assessment</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">8 categories · Last assessed May 1, 2025</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => toast.info("Opening assessment form…")}>
            <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Record Assessment
          </Button>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-border bg-card p-4 sticky top-6">
              <SectionLabel icon={<Brain className="w-3.5 h-3.5" />} label="Skill Radar" />
              <div className="mt-4"><SkillRadar skills={skills} /></div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-[11px] text-muted-foreground mb-1">Overall Average</div>
                <div className="text-[24px] font-bold font-mono text-[oklch(0.65_0.18_290)]">
                  {overallAvg}<span className="text-[12px] text-muted-foreground font-normal ml-1">/10</span>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-3">
            {skills.map(s => <SkillCategoryGroup key={s.category} {...s} />)}
          </div>
        </div>
      </section>

      {/* IDP section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-semibold">Individual Development Plan</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">{focusAreas.length} active focus areas · Updated May 5, 2025</p>
          </div>
          <Link href={`/app/coach/players/${playerId}/idp`} asChild>
            <a className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-[12px] hover:bg-muted transition font-medium">
              <ClipboardList className="w-3.5 h-3.5" /> Manage IDP
            </a>
          </Link>
        </div>
        {focusAreas.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-12 flex flex-col items-center text-center gap-3">
            <Target className="w-8 h-8 text-muted-foreground/40" />
            <h3 className="font-semibold text-[15px]">No focus areas yet</h3>
            <p className="text-[13px] text-muted-foreground">Add the player's first development focus area to start tracking progress.</p>
            <Button size="sm" className="h-8 text-[12px] mt-1" onClick={() => toast.info("Opening focus area form…")}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Focus Area
            </Button>
          </div>
        ) : focusAreas.map(fa => <FocusAreaCard key={fa.id} area={fa} />)}
      </section>

      {/* AI Recommendations */}
      <section>
        <h2 className="text-[16px] font-semibold mb-1">AI Recommendations</h2>
        <p className="text-[12px] text-muted-foreground mb-4">All suggestions require coach review before affecting the player's plan.</p>
        <div className="rounded-xl border border-[oklch(0.65_0.18_290_/_0.3)] bg-[oklch(0.65_0.18_290_/_0.06)] px-5 py-3 flex items-start gap-3 mb-4">
          <Sparkles className="w-4 h-4 text-[oklch(0.65_0.18_290)] mt-0.5 shrink-0" />
          <p className="text-[12.5px] text-muted-foreground leading-relaxed">
            AI analyses film sessions, assessment score trends, and D1 benchmark data to surface development recommendations.
          </p>
        </div>
        {aiRecs.map(rec => (
          <div key={rec.id} className="mb-3">
            <AIRecCard rec={rec} onAccept={onAcceptRec} onOverride={onOverrideRec} />
          </div>
        ))}
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: Film
// ══════════════════════════════════════════════════════════════════════════════

function FilmTab({ sessions, playerName }: { sessions: FilmSessionSummary[]; playerName: string }) {
  const typeColors: Record<string, string> = {
    game:      "oklch(0.72 0.18 290)",
    practice:  "oklch(0.72 0.18 240)",
    scrimmage: "oklch(0.72 0.17 75)",
    workout:   "oklch(0.75 0.18 150)",
  };
  const typeLabel: Record<string, string> = {
    game: "Game", practice: "Practice", scrimmage: "Scrimmage", workout: "Workout",
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold">Film Sessions</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">{sessions.length} sessions featuring {playerName.split(" ")[0]}</p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => toast.info("Opening film room…")}>
          <Film className="w-3.5 h-3.5 mr-1.5" /> Open Film Room
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-14 flex flex-col items-center text-center gap-3">
          <Film className="w-8 h-8 text-muted-foreground/40" />
          <h3 className="font-semibold text-[15px]">No film sessions yet</h3>
          <p className="text-[13px] text-muted-foreground max-w-xs">Upload game or practice film and tag {playerName.split(" ")[0]} to start building their film library.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="divide-y divide-border">
            {sessions.map(s => {
              const color = typeColors[s.type] ?? "oklch(0.65 0.18 290)";
              return (
                <button key={s.id} onClick={() => toast.info(`Opening film session: ${s.title}`)}
                        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-muted/30 transition text-left">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                       style={{ background: `${color.replace(")", " / 0.12)")}`, border: `1px solid ${color.replace(")", " / 0.3)")}` }}>
                    {EVENT_TYPE_ICON[s.type] ?? <Film className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13.5px] font-semibold">{s.title}</span>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5" style={{ borderColor: `${color.replace(")", " / 0.4)")}`, color }}>
                        {typeLabel[s.type]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[12px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(s.date)}</span>
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{s.annotationCount} annotations</span>
                      {s.highlightCount > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3" />{s.highlightCount} highlights</span>}
                    </div>
                  </div>
                  {s.aiConfidence != null && (
                    <div className="shrink-0 text-right">
                      <div className="text-[11px] text-muted-foreground">AI Confidence</div>
                      <div className="text-[14px] font-mono font-bold" style={{ color: s.aiConfidence >= 0.85 ? "oklch(0.75 0.18 150)" : "oklch(0.72 0.17 75)" }}>
                        {Math.round(s.aiConfidence * 100)}%
                      </div>
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 -rotate-90" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: Attendance
// ══════════════════════════════════════════════════════════════════════════════

function AttendanceTab({ records }: { records: AttendanceRecord[] }) {
  const [filter, setFilter] = useState<string>("all");
  const present  = records.filter(r => r.status === "present").length;
  const late     = records.filter(r => r.status === "late").length;
  const absent   = records.filter(r => r.status === "absent").length;
  const excused  = records.filter(r => r.status === "excused").length;
  const total    = records.length;
  const attended = present + late + excused;
  const rate     = total > 0 ? Math.round((attended / total) * 100) : 0;

  const eventTypes = ["all", ...Array.from(new Set(records.map(r => r.eventType)))];
  const filtered   = filter === "all" ? records : records.filter(r => r.eventType === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold">Attendance History</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">Last {total} events recorded</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Attendance Rate", value: `${rate}%`, color: rate >= 90 ? "oklch(0.75 0.18 150)" : rate >= 75 ? "oklch(0.72 0.17 75)" : "oklch(0.68 0.22 25)" },
          { label: "Present", value: String(present), color: "oklch(0.75 0.18 150)" },
          { label: "Late", value: String(late), color: "oklch(0.72 0.17 75)" },
          { label: "Excused", value: String(excused), color: "oklch(0.72 0.18 240)" },
          { label: "Absent", value: String(absent), color: "oklch(0.68 0.22 25)" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
            <div className="text-[22px] font-bold tabular-nums leading-snug mt-0.5" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {eventTypes.map(t => (
          <button key={t} onClick={() => setFilter(t)}
                  className={`h-8 px-3 rounded-md text-[12px] font-medium capitalize transition border ${filter === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Records table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-10 flex flex-col items-center text-center gap-2">
          <Calendar className="w-7 h-7 text-muted-foreground/40" />
          <p className="text-[13px] text-muted-foreground">No events match this filter.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Date", "Event", "Type", "Status", "Note"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.07em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const c = attendanceColor(r.status);
                  const eventTypeCap = r.eventType.replace("_", " ");
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(r.date)}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{r.eventTitle}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-muted-foreground capitalize">
                          {EVENT_TYPE_ICON[r.eventType] ?? <Calendar className="w-3.5 h-3.5" />}{eventTypeCap}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize"
                              style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-[12px] max-w-[220px] truncate">{r.note ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: Health
// ══════════════════════════════════════════════════════════════════════════════

function HealthTab({ readiness, injuries }: { readiness: ReadinessDay[]; injuries: InjuryRecord[] }) {
  const latest    = readiness[readiness.length - 1];
  const activeInj  = injuries.filter(i => i.status !== "cleared");
  const historyInj = injuries.filter(i => i.status === "cleared");

  const playerReadiness = computePlayerReadiness({
    latestCheckin: latest ?? null,
    hasActiveInjury:    injuries.some(i => i.status === "active"),
    hasMonitoringInjury: injuries.some(i => i.status === "monitoring"),
  });

  return (
    <div className="space-y-6">
      {/* Today readiness status card */}
      <div className="rounded-xl border p-5 flex items-start gap-4"
           style={{
             background: `oklch(0.75 0.18 150 / 0.04)`,
             borderColor: playerReadiness.status === "RESTRICTED" ? "oklch(0.68 0.22 25 / 0.4)"
               : playerReadiness.status === "FLAGGED"    ? "oklch(0.72 0.17 75 / 0.4)"
               : "oklch(0.75 0.18 150 / 0.3)",
           }}>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-[15px]">Today's readiness</span>
            <ReadinessStatusBadge
              status={playerReadiness.status}
              confidence={playerReadiness.confidence}
              size="md"
              title={playerReadiness.summary}
            />
          </div>
          {playerReadiness.reasons.length > 0 && playerReadiness.reasons[0] !== "no_data" && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {playerReadiness.reasons.map((r) => (
                <span key={r} className="text-[11px] font-medium rounded-full px-2.5 py-0.5 border bg-[oklch(0.72_0.17_75/0.08)] text-[oklch(0.65_0.17_75)] border-[oklch(0.72_0.17_75/0.3)]">
                  {READINESS_REASON_LABELS[r]}
                </span>
              ))}
            </div>
          )}
          {latest && (
            <div className="grid grid-cols-3 gap-4 mt-3 text-[12px]">
              {[
                { label: "Fatigue", value: `${latest.fatigue}/10`, flag: latest.fatigue >= 7 },
                { label: "Sleep",   value: `${latest.sleep}h`,     flag: latest.sleep <= 5 },
                { label: "Soreness",value: `${latest.soreness}/10`,flag: latest.soreness >= 7 },
              ].map(m => (
                <div key={m.label}>
                  <div className="text-muted-foreground">{m.label}</div>
                  <div className={`font-semibold mt-0.5 ${m.flag ? "text-[oklch(0.68_0.22_25)]" : "text-foreground"}`}>{m.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 14-day wellness trend chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <SectionLabel icon={<Activity className="w-3.5 h-3.5" />} label="14-Day Wellness Trend" />
        <div className="mt-4 flex items-end gap-1.5 h-28 px-1">
          {readiness.map((d, i) => {
            const flagged = d.fatigue >= 7 || d.sleep <= 5 || d.soreness >= 7;
            const color = flagged ? "oklch(0.68 0.22 25)" : "oklch(0.6 0.15 145)";
            // composite wellness: invert fatigue/soreness penalty, boost by sleep
            const composite = Math.max(10, Math.round(100 - (d.fatigue - 1) * 5 - (d.soreness - 1) * 5 - Math.max(0, 8 - d.sleep) * 6));
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                {d.flagged && <div className="w-1 h-1 rounded-full bg-[oklch(0.68_0.22_25)]" />}
                <div className="w-full rounded-sm overflow-hidden bg-muted/40" style={{ height: "72px", display: "flex", alignItems: "flex-end" }}>
                  <div className="w-full rounded-sm" style={{ height: `${composite}%`, background: color, opacity: 0.85 }} />
                </div>
                <div className="text-[9px] text-muted-foreground font-mono leading-tight text-center">{d.label.replace(/\w+ /, "")}</div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-5 mt-4 pt-4 border-t border-border">
          {[
            { color: "oklch(0.6 0.15 145)", label: "Wellness — OK" },
            { color: "oklch(0.68 0.22 25)", label: "Flag day" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
              <span className="text-[11px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
          <span className="text-[11px] text-muted-foreground ml-auto">Bar height = relative wellness composite</span>
        </div>
      </div>

      {/* Active injuries / restrictions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel icon={<HeartPulse className="w-3.5 h-3.5" />} label="Active Health Flags" />
          <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => toast.info("Opening injury log form…")}>
            <Plus className="w-3 h-3 mr-1" /> Log
          </Button>
        </div>
        {activeInj.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-5 py-8 flex flex-col items-center text-center gap-2">
            <HeartPulse className="w-6 h-6 text-muted-foreground/40" />
            <p className="text-[13px] text-muted-foreground">No active health flags. Player is fully cleared.</p>
          </div>
        ) : activeInj.map(inj => {
          const c = injuryStatusColor(inj.status);
          return (
            <div key={inj.id} className="rounded-xl border bg-card p-5 space-y-3" style={{ borderColor: c.border }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13.5px] font-semibold">{inj.description}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md capitalize font-semibold" style={{ background: c.bg, color: c.text }}>{inj.bodyPart}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[12px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Injured: {formatDate(inj.injuredAt)}</span>
                    {inj.expectedReturnAt && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Est. return: {formatDate(inj.expectedReturnAt)}</span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-[11px] font-semibold px-2 py-1 rounded-md capitalize" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                  {inj.status}
                </span>
              </div>
              {inj.restrictions && (
                <div className="rounded-lg bg-muted/50 px-4 py-2.5 text-[12.5px] text-muted-foreground">
                  <span className="font-semibold text-foreground">Restrictions: </span>{inj.restrictions}
                </div>
              )}
              <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => toast.info("Opening clearance form…")}>
                Mark Cleared / Update Status
              </Button>
            </div>
          );
        })}
      </div>

      {/* Injury history */}
      {historyInj.length > 0 && (
        <div className="space-y-3">
          <SectionLabel icon={<FileText className="w-3.5 h-3.5" />} label="Injury History" />
          {historyInj.map(inj => {
            const c = injuryStatusColor(inj.status);
            return (
              <div key={inj.id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
                <div className="w-2 h-full mt-1.5 rounded-full shrink-0" style={{ background: c.text, minHeight: 8, height: 8 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium">{inj.description}</span>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5" style={{ borderColor: c.border, color: c.text }}>Cleared</Badge>
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-3">
                    <span>{formatDate(inj.injuredAt)}{inj.clearedAt ? ` → ${formatDate(inj.clearedAt)}` : ""}</span>
                  </div>
                  {inj.clearanceNotes && (
                    <p className="text-[12px] text-muted-foreground mt-1 italic">{inj.clearanceNotes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: Notes
// ══════════════════════════════════════════════════════════════════════════════

function NotesTab({ notes, onAddNote, onDeleteNote, onTogglePin }: {
  notes: PlayerNote[];
  onAddNote: (body: string, noteType: NoteType) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<NoteType | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [newBody, setNewBody] = useState("");
  const [newType, setNewType] = useState<NoteType>("coach");

  const filtered = typeFilter === "all"
    ? [...notes].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
    : notes.filter(n => n.noteType === typeFilter);

  const noteTypeOptions: NoteType[] = ["coach", "academic", "health", "behavioral", "recruiting", "general"];

  function handleSubmit() {
    if (!newBody.trim()) { toast.error("Note body is required."); return; }
    onAddNote(newBody.trim(), newType);
    setNewBody(""); setNewType("coach"); setShowForm(false);
    toast.success("Note saved.");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-[16px] font-semibold">Notes & Activity</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">{notes.length} notes</p>
        </div>
        <Button size="sm" className="h-8 text-[12px]" onClick={() => setShowForm(v => !v)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Note
        </Button>
      </div>

      {/* Inline add-note form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-[12px] text-muted-foreground font-medium">Type</label>
            <select value={newType} onChange={e => setNewType(e.target.value as NoteType)}
                    className="h-8 px-2 rounded-md border border-border bg-card text-[12px] focus:outline-none focus:ring-1 focus:ring-primary">
              {noteTypeOptions.map(t => (
                <option key={t} value={t}>{NOTE_TYPE_META[t].label}</option>
              ))}
            </select>
          </div>
          <Textarea value={newBody} onChange={e => setNewBody(e.target.value)}
                    placeholder="Write your note here…" rows={4} className="text-[13px] resize-none" />
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 text-[12px]" onClick={handleSubmit}>Save Note</Button>
            <Button size="sm" variant="ghost" className="h-8 text-[12px]" onClick={() => { setShowForm(false); setNewBody(""); }}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Type filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", ...noteTypeOptions] as (NoteType | "all")[]).map(t => {
          const meta = t === "all" ? null : NOTE_TYPE_META[t];
          const count = t === "all" ? notes.length : notes.filter(n => n.noteType === t).length;
          if (t !== "all" && count === 0) return null;
          return (
            <button key={t} onClick={() => setTypeFilter(t)}
                    className={`h-7 px-2.5 rounded-md text-[11.5px] font-medium transition border ${typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
              {t === "all" ? "All" : meta?.label} <span className="ml-1 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Notes list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 flex flex-col items-center text-center gap-3">
          <FileText className="w-7 h-7 text-muted-foreground/40" />
          <h3 className="font-semibold text-[15px]">No notes yet</h3>
          <p className="text-[13px] text-muted-foreground max-w-xs">
            Add coach notes, academic updates, recruiting contacts, and health observations here.
          </p>
          <Button size="sm" className="h-8 text-[12px] mt-1" onClick={() => setShowForm(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add First Note
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(note => {
            const meta = NOTE_TYPE_META[note.noteType];
            return (
              <div key={note.id} className={`rounded-xl border bg-card p-5 space-y-2 ${note.isPinned ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold"
                          style={{ background: `${meta.color.replace(")", " / 0.12)")}`, color: meta.color }}>
                      {meta.label}
                    </span>
                    {note.isPinned && (
                      <span className="flex items-center gap-1 text-[11px] text-primary">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />{note.createdByName}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{formatDate(note.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onTogglePin(note.id)}
                            className="p-1.5 rounded-md hover:bg-muted transition text-muted-foreground hover:text-foreground"
                            title={note.isPinned ? "Unpin" : "Pin"}>
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm("Delete this note?")) onDeleteNote(note.id); }}
                            className="p-1.5 rounded-md hover:bg-muted transition text-muted-foreground hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[13px] text-foreground leading-relaxed">{note.body}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TIMELINE TAB — coaching action loop visibility
// ══════════════════════════════════════════════════════════════════════════════

type ActionType = "assign_clip" | "recommend_drill" | "add_to_idp" | "add_to_wod" | "request_reupload" | "mark_addressed";
type ActionStatus = "open" | "in_progress" | "resolved" | "dismissed";

interface CoachingActionEntry {
  id: string;
  actionType: ActionType;
  status: ActionStatus;
  issueCategory?: string;
  issueSeverity?: string;
  timestamp?: string;       // video timestamp e.g. "0:37"
  sessionTitle?: string;
  coachNote?: string;
  assignmentTitle?: string; // if action spawned an assignment
  followUpNote?: string;    // evidence submitted
  createdAt: string;        // ISO date
  resolvedAt?: string;
}

const MOCK_TIMELINE: CoachingActionEntry[] = [
  {
    id: "ca1",
    actionType: "recommend_drill",
    status: "resolved",
    issueCategory: "Finishing",
    issueSeverity: "major",
    timestamp: "1:23",
    sessionTitle: "Barnegat vs. Toms River · Apr 28",
    coachNote: "Fading on contact layup. Left Mikan drill prescribed — 5 sets of 10 daily.",
    assignmentTitle: "Contact Layup Series (left hand only)",
    followUpNote: "Athlete submitted re-upload May 10. Clear improvement — less fade, attacking through contact.",
    createdAt: "2025-04-28T20:00:00Z",
    resolvedAt: "2025-05-10T10:00:00Z",
  },
  {
    id: "ca2",
    actionType: "assign_clip",
    status: "in_progress",
    issueCategory: "Defense",
    issueSeverity: "minor",
    timestamp: "0:47",
    sessionTitle: "Barnegat vs. Toms River · Apr 28",
    coachNote: "Wrong closeout angle — biting on pump fake. Watch this clip and log your read.",
    assignmentTitle: "Film Review: Closeout Mechanics",
    createdAt: "2025-04-28T20:05:00Z",
  },
  {
    id: "ca3",
    actionType: "add_to_idp",
    status: "resolved",
    issueCategory: "Ball Handling",
    sessionTitle: "Practice Upload · May 2",
    coachNote: "Weak-hand control flagged in 3 consecutive practices. Added as Focus Area #3 in IDP.",
    createdAt: "2025-05-02T15:30:00Z",
    resolvedAt: "2025-05-02T15:31:00Z",
  },
  {
    id: "ca4",
    actionType: "request_reupload",
    status: "resolved",
    issueCategory: "Release",
    issueSeverity: "major",
    timestamp: "0:37",
    sessionTitle: "Pull-Up Jumper Reps · Apr 30",
    coachNote: "Thumb flick on pull-up. Record 20 reps of index-finger-only release and submit.",
    followUpNote: "Re-upload received May 5. Thumb flick eliminated in 18/20 reps.",
    createdAt: "2025-04-30T09:00:00Z",
    resolvedAt: "2025-05-05T11:00:00Z",
  },
  {
    id: "ca5",
    actionType: "mark_addressed",
    status: "resolved",
    issueCategory: "Footwork",
    issueSeverity: "minor",
    timestamp: "3:45",
    sessionTitle: "Barnegat vs. Toms River · Apr 28",
    coachNote: "Addressed verbally in post-game review. No further action needed.",
    createdAt: "2025-04-28T21:00:00Z",
    resolvedAt: "2025-04-28T21:00:00Z",
  },
];

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  assign_clip:      "Clip Assigned",
  recommend_drill:  "Drill Prescribed",
  add_to_idp:       "Added to IDP",
  add_to_wod:       "Added to WOD",
  request_reupload: "Re-upload Requested",
  mark_addressed:   "Marked Addressed",
};

const ACTION_TYPE_COLORS: Record<ActionType, { dot: string; badge: string }> = {
  assign_clip:      { dot: "bg-primary",         badge: "bg-primary/10 text-primary border-primary/30" },
  recommend_drill:  { dot: "bg-amber-500",        badge: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  add_to_idp:       { dot: "bg-emerald-500",      badge: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  add_to_wod:       { dot: "bg-orange-500",       badge: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
  request_reupload: { dot: "bg-violet-500",       badge: "bg-violet-500/15 text-violet-600 border-violet-500/30" },
  mark_addressed:   { dot: "bg-muted-foreground", badge: "bg-muted text-muted-foreground border-border" },
};

const STATUS_LABELS: Record<ActionStatus, { label: string; color: string }> = {
  open:        { label: "Open",        color: "text-primary" },
  in_progress: { label: "In Progress", color: "text-amber-600" },
  resolved:    { label: "Resolved",    color: "text-emerald-600" },
  dismissed:   { label: "Dismissed",   color: "text-muted-foreground" },
};

function fmtRelative(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function TimelineTab({ playerId }: { playerId: string }) {
  void playerId; // will be used for API call
  const [filterStatus, setFilterStatus] = useState<ActionStatus | "all">("all");

  const filtered = MOCK_TIMELINE.filter(
    (a) => filterStatus === "all" || a.status === filterStatus,
  );

  const openCount     = MOCK_TIMELINE.filter((a) => a.status === "open").length;
  const inProgCount   = MOCK_TIMELINE.filter((a) => a.status === "in_progress").length;
  const resolvedCount = MOCK_TIMELINE.filter((a) => a.status === "resolved").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open",        value: openCount,     color: "text-primary",      bg: "bg-primary/8" },
          { label: "In Progress", value: inProgCount,   color: "text-amber-600",    bg: "bg-amber-500/8" },
          { label: "Resolved",    value: resolvedCount, color: "text-emerald-600",  bg: "bg-emerald-500/8" },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setFilterStatus(s.label.toLowerCase().replace(" ", "_") as ActionStatus | "all")}
            className={`rounded-xl border border-border p-4 text-left transition ${
              filterStatus === s.label.toLowerCase().replace(" ", "_") ? s.bg : "bg-card hover:bg-muted/40"
            }`}
          >
            <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-1">
              {s.label}
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </button>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "open", "in_progress", "resolved", "dismissed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-3 py-1 rounded-full text-[11.5px] font-medium border transition capitalize ${
              filterStatus === f
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
        <button
          onClick={() => setFilterStatus("all")}
          className="ml-auto text-[11px] text-muted-foreground hover:text-foreground transition"
        >
          Clear
        </button>
      </div>

      {/* Timeline entries */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground text-[13px]">
          No coaching actions match this filter.
        </div>
      ) : (
        <div className="relative flex flex-col gap-0">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-6 bottom-6 w-px bg-border" />

          {filtered.map((entry, idx) => {
            const tc = ACTION_TYPE_COLORS[entry.actionType];
            const st = STATUS_LABELS[entry.status];

            return (
              <div key={entry.id} className={`relative flex gap-5 ${idx < filtered.length - 1 ? "pb-6" : ""}`}>
                {/* Timeline dot */}
                <div className={`w-9 h-9 rounded-full border-2 border-background flex items-center justify-center shrink-0 z-10 mt-0.5 ${tc.dot}`} />

                {/* Card */}
                <div className="flex-1 rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10.5px] px-2 py-0.5 rounded-full border font-medium ${tc.badge}`}>
                          {ACTION_TYPE_LABELS[entry.actionType]}
                        </span>
                        {entry.issueCategory && (
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {entry.issueCategory}
                            {entry.issueSeverity === "major" && (
                              <span className="ml-1 text-rose-500">· Major</span>
                            )}
                          </span>
                        )}
                      </div>
                      {entry.sessionTitle && (
                        <div className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                          <Film className="w-3 h-3" />
                          {entry.sessionTitle}
                          {entry.timestamp && (
                            <span className="font-mono text-primary">@ {entry.timestamp}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-[11px] font-semibold ${st.color}`}>{st.label}</div>
                      <div className="text-[10.5px] text-muted-foreground font-mono mt-0.5">
                        {fmtRelative(entry.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Coach note */}
                  {entry.coachNote && (
                    <p className="text-[12.5px] text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3 italic">
                      {entry.coachNote}
                    </p>
                  )}

                  {/* Assignment spawned */}
                  {entry.assignmentTitle && (
                    <div className="flex items-center gap-2 text-[12px] rounded-md bg-muted/40 px-3 py-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium">{entry.assignmentTitle}</span>
                    </div>
                  )}

                  {/* Follow-up evidence */}
                  {entry.followUpNote && (
                    <div className="flex items-start gap-2 rounded-md bg-emerald-500/8 border border-emerald-500/20 px-3 py-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10.5px] font-mono uppercase tracking-[0.1em] text-emerald-600 mb-0.5">
                          Follow-up evidence · {entry.resolvedAt ? fmtRelative(entry.resolvedAt) : ""}
                        </div>
                        <p className="text-[12px] text-foreground/80 leading-snug">{entry.followUpNote}</p>
                      </div>
                    </div>
                  )}

                  {/* AI resolution quality score */}
                  {(entry as any).resolutionScore && (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2 py-0.5 w-fit">
                      <span className="font-mono">AI score:</span>
                      {Math.round((entry as any).resolutionScore.improvement * 100)}% improvement ·{" "}
                      {(entry as any).resolutionScore.originalCount}→{(entry as any).resolutionScore.followUpCount} clips
                    </div>
                  )}

                  {/* Open action CTA */}
                  {entry.status === "open" && (
                    <div className="flex gap-2 pt-1">
                      <Link href="/app/coach/queue" asChild>
                        <a className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-border text-[11.5px] hover:bg-muted transition font-medium">
                          <Film className="w-3 h-3" /> Open in Queue
                        </a>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

const TABS: ProfileTab[] = ["Overview", "Development", "Film", "Attendance", "Health", "Notes", "Timeline"];

export function PlayerProfilePage() {
  const [_match, params] = useRoute("/app/coach/players/:id");
  const playerId = params?.id ?? MOCK_PLAYER.id;
  void playerId;

  const [activeTab, setActiveTab] = useState<ProfileTab>("Overview");
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<PlayerNote[]>(MOCK_NOTES_INIT);
  const [recStatuses, setRecStatuses] = useState<Record<string, AIRec["status"]>>(
    Object.fromEntries(AI_RECS.map(r => [r.id, r.status]))
  );

  // Simulate data loading
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 480);
    return () => clearTimeout(t);
  }, [playerId]);

  function acceptRec(id: string) {
    setRecStatuses(prev => ({ ...prev, [id]: "accepted" }));
    toast.success("Recommendation accepted and added to the plan.");
  }
  function overrideRec(id: string, reason: string) {
    setRecStatuses(prev => ({ ...prev, [id]: "overridden" }));
    toast("Recommendation overridden.", { description: reason });
  }

  function addNote(body: string, noteType: NoteType) {
    setNotes(prev => [{
      id: `local-${Date.now()}`, noteType, body, isPinned: false,
      createdByName: "Coach Williams", createdAt: new Date().toISOString(),
    }, ...prev]);
  }
  function deleteNote(id: string) {
    setNotes(prev => prev.filter(n => n.id !== id));
    toast.success("Note deleted.");
  }
  function togglePin(id: string) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  }

  const aiRecs = AI_RECS.map(r => ({ ...r, status: recStatuses[r.id] ?? r.status }));
  const overallAvg = (SKILLS.reduce((a, s) => a + s.avg, 0) / SKILLS.length).toFixed(1);
  const hasActiveInjury = MOCK_INJURIES.some(i => i.status !== "cleared");

  if (isLoading) return <AppShell><ProfileSkeleton /></AppShell>;

  return (
    <AppShell>
      <div className="p-6 max-w-[1200px] mx-auto">

        {/* Back link */}
        <Link href="/app/coach/roster" asChild>
          <a className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground transition mb-5">
            <ArrowLeft className="w-3.5 h-3.5" /> Roster
          </a>
        </Link>

        {/* Player header */}
        <div className="flex items-start justify-between gap-6 mb-6 pb-6 border-b border-border flex-wrap">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-xl bg-[oklch(0.72_0.18_290_/_0.15)] border border-[oklch(0.72_0.18_290_/_0.3)] flex items-center justify-center text-[22px] font-bold shrink-0 text-[oklch(0.65_0.18_290)]">
              {MOCK_PLAYER.initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <h1 className="text-[26px] font-bold leading-none">{MOCK_PLAYER.name}</h1>
                <Badge className="text-[11px] font-mono h-6 px-2"
                       style={{ background: "oklch(0.72 0.18 290 / 0.15)", color: "oklch(0.65 0.18 290)", border: "1px solid oklch(0.72 0.18 290 / 0.35)" }}>
                  #{MOCK_PLAYER.jerseyNumber} · {MOCK_PLAYER.position}
                </Badge>
                <Badge variant="outline" className="text-[11px] h-6 px-2">{MOCK_PLAYER.tier}</Badge>
                <Badge variant="outline" className="text-[11px] h-6 px-2">{MOCK_PLAYER.role}</Badge>
                {hasActiveInjury && (
                  <Badge className="text-[11px] h-6 px-2 bg-[oklch(0.72_0.17_75_/_0.15)] text-[oklch(0.65_0.17_75)] border border-[oklch(0.72_0.17_75_/_0.4)]">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Health Flag
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap text-[12.5px] text-muted-foreground">
                <span>{MOCK_PLAYER.height} · {MOCK_PLAYER.weight} lbs</span>
                <span>·</span>
                <span>{MOCK_PLAYER.handedness}-handed</span>
                <span>·</span>
                <span>{MOCK_PLAYER.yearsPlaying} yrs playing</span>
                <span>·</span>
                <span>GPA {MOCK_PLAYER.gpa}</span>
                <span>·</span>
                <span>Class of {MOCK_PLAYER.gradYear}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11.5px] px-2.5 py-0.5 rounded-full font-semibold"
                      style={{ background: "oklch(0.75 0.18 150 / 0.15)", color: "oklch(0.75 0.18 150)", border: "1px solid oklch(0.75 0.18 150 / 0.3)" }}>
                  <Star className="w-3 h-3 inline mr-1 -mt-0.5" />{MOCK_PLAYER.recruitingStatus}
                </span>
                <span className="text-[12px] text-muted-foreground font-mono">{overallAvg}/10 overall</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button variant="outline" size="sm" className="h-9 text-[13px]" onClick={() => toast.info("Opening practice plan builder…")}>
              <ClipboardList className="w-3.5 h-3.5 mr-1.5" /> Assign Plan
            </Button>
            <Button size="sm" className="h-9 text-[13px]" onClick={() => setActiveTab("Development")}>
              <Shield className="w-3.5 h-3.5 mr-1.5" /> Full Assessment
            </Button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-border mb-6 -mx-0.5 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
                      activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "Overview" && (
          <OverviewTab player={MOCK_PLAYER} guardians={MOCK_GUARDIANS} injuries={MOCK_INJURIES}
                       focusAreas={FOCUS_AREAS} attendance={MOCK_ATTENDANCE} readiness={MOCK_READINESS} skills={SKILLS} />
        )}
        {activeTab === "Development" && (
          <DevelopmentTab skills={SKILLS} focusAreas={FOCUS_AREAS} aiRecs={aiRecs}
                          onAcceptRec={acceptRec} onOverrideRec={overrideRec} playerId={playerId} />
        )}
        {activeTab === "Film" && (
          <FilmTab sessions={MOCK_FILM_SESSIONS} playerName={MOCK_PLAYER.name} />
        )}
        {activeTab === "Attendance" && (
          <AttendanceTab records={MOCK_ATTENDANCE} />
        )}
        {activeTab === "Health" && (
          <HealthTab readiness={MOCK_READINESS} injuries={MOCK_INJURIES} />
        )}
        {activeTab === "Notes" && (
          <NotesTab notes={notes} onAddNote={addNote} onDeleteNote={deleteNote} onTogglePin={togglePin} />
        )}
        {activeTab === "Timeline" && (
          <TimelineTab playerId={playerId} />
        )}
      </div>
    </AppShell>
  );
}

export default PlayerProfilePage;
