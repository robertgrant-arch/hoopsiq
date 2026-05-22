/**
 * PlayerPublicProgramPage — Public-facing program profile for recruiting/marketing.
 * Route: /profile/program/:slug
 *
 * NOT behind auth. This is the program's public showcase page.
 *
 * Sections:
 *   1. Hero               — program name, tagline, stats, enrollment CTA
 *   2. Program Philosophy — 3 pillars with icons
 *   3. Staff              — public coach/staff cards with credentials
 *   4. Development Outcomes — program-level stats (no individual data)
 *   5. Schedule & Tryouts — season info, tryout dates
 *   6. Testimonials       — parent testimonials
 *   7. Footer CTA         — repeat enrollment inquiry
 */
import { useState } from "react";
import { useParams } from "wouter";
import {
  MapPin,
  Calendar,
  Users,
  Star,
  Target,
  Film,
  BarChart2,
  Award,
  ChevronRight,
  CheckCircle2,
  Phone,
  Mail,
  Clock,
  TrendingUp,
  BookOpen,
  Shield,
  MessageCircle,
  X,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { Link } from "wouter";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const PROGRAM = {
  name:        "Barnegat Basketball Academy",
  tagline:     "Where development meets accountability",
  location:    "Barnegat, NJ",
  foundedYear: 2019,
  ageGroups:   ["13U", "15U", "17U"],
  stats: {
    activeAthletes: 82,
    coachingStaff:  5,
    seasonsOfData:  6,
  },
};

type StaffMember = {
  id: string;
  name: string;
  initials: string;
  title: string;
  bio: string;
  certifications: string[];
  hoopsOSCredential?: "Foundation" | "Development" | "Elite";
};

const STAFF: StaffMember[] = [
  {
    id: "s1",
    name: "Marcus Williams",
    initials: "MW",
    title: "Head Coach — 17U",
    bio: "12 years coaching experience at the youth and high school level. Specializes in guard development and film-based feedback. Holds a USAB License and coaches at Barnegat High School varsity program.",
    certifications: ["USAB License", "CPR/AED Certified", "Background Cleared"],
    hoopsOSCredential: "Elite",
  },
  {
    id: "s2",
    name: "Terri Jackson",
    initials: "TJ",
    title: "Head Coach — 15U",
    bio: "Former D3 collegiate player with 8 years of youth development coaching. Certified in Positive Coaching Alliance methodology and leads the program's IDP review process.",
    certifications: ["PCA Certified", "NFHS Fundamentals", "Background Cleared"],
    hoopsOSCredential: "Development",
  },
  {
    id: "s3",
    name: "Devon Reese",
    initials: "DR",
    title: "Skills Trainer",
    bio: "Specializes in shooting mechanics and footwork development. Works with players 1-on-1 and in small groups as part of the IDP supplemental training program.",
    certifications: ["USAB License", "Background Cleared"],
    hoopsOSCredential: "Foundation",
  },
  {
    id: "s4",
    name: "Angela Diaz",
    initials: "AD",
    title: "Program Coordinator",
    bio: "Manages scheduling, registrations, and family communications. Former collegiate track athlete who brings a systems mindset to program operations.",
    certifications: ["Background Cleared", "CPR/AED Certified"],
    hoopsOSCredential: undefined,
  },
];

type Outcome = {
  stat: string;
  description: string;
};

const OUTCOMES: Outcome[] = [
  { stat: "87%",  description: "of athletes improved their primary skill rating last season" },
  { stat: "3.2",  description: "average IDP milestones achieved per athlete per season" },
  { stat: "94%",  description: "practice attendance rate across the program" },
  { stat: "91%",  description: "of families report improved confidence in their athlete" },
];

type TryoutDate = {
  ageGroup: string;
  date: string;
  time: string;
  spotsAvailable: number;
};

const TRYOUT_DATES: TryoutDate[] = [
  { ageGroup: "13U", date: "June 7, 2026",   time: "9:00 AM – 11:00 AM",  spotsAvailable: 4 },
  { ageGroup: "15U", date: "June 7, 2026",   time: "12:00 PM – 2:00 PM",  spotsAvailable: 2 },
  { ageGroup: "17U", date: "June 14, 2026",  time: "10:00 AM – 12:00 PM", spotsAvailable: 3 },
];

type Testimonial = {
  id: string;
  parentName: string;
  athleteName: string;
  ageGroup: string;
  seasons: number;
  quote: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    parentName: "Sandra M.",
    athleteName: "Marcus",
    ageGroup: "15U",
    seasons: 2,
    quote: "I've watched my son grow so much more confident — not just on the court, but in how he carries himself. He asks better questions, he's more coachable. The IDP made development feel real and personal for him.",
  },
  {
    id: "t2",
    parentName: "Darius & Kim O.",
    athleteName: "Jordan",
    ageGroup: "17U",
    seasons: 3,
    quote: "What I appreciate most is that the coaches actually watch film and give specific feedback. Jordan knows exactly what he's working on and why. He's never been more motivated to put in work between sessions.",
  },
  {
    id: "t3",
    parentName: "Yolanda W.",
    athleteName: "Caleb",
    ageGroup: "15U",
    seasons: 2,
    quote: "The communication from the program is unlike anything we've experienced. We always know where our son stands, what the plan is, and how to support him at home. It feels like a real partnership.",
  },
];

/* -------------------------------------------------------------------------- */
/* Inquiry Modal                                                               */
/* -------------------------------------------------------------------------- */

function InquiryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ parentName: "", email: "", athleteName: "", ageGroup: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onClose();
    setForm({ parentName: "", email: "", athleteName: "", ageGroup: "", message: "" });
    toast.success("We'll be in touch within 48 hours");
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "oklch(0.08 0.005 260 / 0.80)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-background p-6 space-y-5"
        style={{ boxShadow: "0 24px 64px -12px oklch(0.08 0.005 260 / 0.50)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-bold text-foreground">Inquire About Enrollment</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">We'll respond within 48 hours</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Your Name</label>
              <input
                type="text"
                required
                placeholder="Parent name"
                value={form.parentName}
                onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-border bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.72_0.18_290_/_0.5)] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-border bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.72_0.18_290_/_0.5)] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Athlete Name</label>
              <input
                type="text"
                required
                placeholder="First name"
                value={form.athleteName}
                onChange={e => setForm(f => ({ ...f, athleteName: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-border bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.72_0.18_290_/_0.5)] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Age Group</label>
              <select
                value={form.ageGroup}
                onChange={e => setForm(f => ({ ...f, ageGroup: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-border bg-card text-[13px] text-foreground focus:outline-none focus:border-[oklch(0.72_0.18_290_/_0.5)] transition-colors"
              >
                <option value="">Select…</option>
                {PROGRAM.ageGroups.map(ag => <option key={ag} value={ag}>{ag}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Message (optional)</label>
            <textarea
              rows={3}
              placeholder="Any questions or context about your athlete…"
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.72_0.18_290_/_0.5)] transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full h-10 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ background: PRIMARY, color: "#fff" }}
          >
            <Send className="w-4 h-4" />
            Submit Inquiry
          </button>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section components                                                          */
/* -------------------------------------------------------------------------- */

const CREDENTIAL_CONFIG = {
  Foundation:  { color: WARNING,  label: "Foundation Certified"  },
  Development: { color: PRIMARY,  label: "Development Certified" },
  Elite:       { color: SUCCESS,  label: "Elite Certified"       },
} as const;

function StaffCard({ member }: { member: StaffMember }) {
  const cred = member.hoopsOSCredential ? CREDENTIAL_CONFIG[member.hoopsOSCredential] : null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-[15px] font-bold shrink-0"
          style={{ background: `${PRIMARY}14`, color: PRIMARY }}
        >
          {member.initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold text-foreground">{member.name}</div>
          <div className="text-[12px] text-muted-foreground">{member.title}</div>
          {cred && (
            <div
              className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: `${cred.color}14`, color: cred.color }}
            >
              <Award className="w-2.5 h-2.5" />
              HoopsIQ {cred.label}
            </div>
          )}
        </div>
      </div>

      <p className="text-[12px] text-muted-foreground leading-relaxed">{member.bio}</p>

      <div className="flex flex-wrap gap-1.5">
        {member.certifications.map((cert, i) => (
          <span
            key={i}
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: "oklch(0.55 0.02 260 / 0.08)", color: "oklch(0.65 0.02 260)" }}
          >
            {cert}
          </span>
        ))}
      </div>
    </div>
  );
}

const PILLAR_ICONS = [
  <Target className="w-5 h-5" />,
  <Film className="w-5 h-5" />,
  <BarChart2 className="w-5 h-5" />,
];

const PILLARS = [
  {
    title: "Individual Development Plans",
    description: "Every athlete enters the program with a personalized development plan built from skill assessments and coach observations. IDPs create a shared language between coaches, athletes, and families — so everyone is working toward the same goals.",
  },
  {
    title: "Film-Based Feedback",
    description: "Coaches review game and practice film to deliver specific, actionable feedback. Athletes receive time-stamped observations tied directly to their IDP goals. Seeing yourself is the most honest form of development feedback there is.",
  },
  {
    title: "Data-Driven Coaching",
    description: "We track skill velocity, attendance, and milestone completion across every season. Coaches use data to identify what's working, who needs intervention, and how to adjust development pathways — removing guesswork from the equation.",
  },
];

/* -------------------------------------------------------------------------- */
/* Main export                                                                 */
/* -------------------------------------------------------------------------- */

export default function PlayerPublicProgramPage() {
  const params = useParams<{ slug: string }>();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal nav bar */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size={24} />
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg px-4 py-2 text-[13px] font-semibold transition-all"
            style={{ background: PRIMARY, color: "#fff", minHeight: 36 }}
          >
            Inquire About Enrollment
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-16">

        {/* ── Hero ── */}
        <section className="space-y-6 text-center">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ background: `${PRIMARY}14`, color: PRIMARY }}
          >
            <Shield className="w-3 h-3" />
            HoopsIQ Verified Program
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-foreground">
              {PROGRAM.name}
            </h1>
            <p className="text-[18px] text-muted-foreground font-medium">
              {PROGRAM.tagline}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {PROGRAM.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Founded {PROGRAM.foundedYear}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Ages: {PROGRAM.ageGroups.join(", ")}
            </span>
          </div>

          {/* Hero stat row */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { value: PROGRAM.stats.activeAthletes, label: "Active Athletes" },
              { value: PROGRAM.stats.coachingStaff,   label: "Coaching Staff" },
              { value: PROGRAM.stats.seasonsOfData,   label: "Seasons of Data" },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
                <div className="text-[28px] font-bold font-mono leading-none" style={{ color: PRIMARY }}>
                  {value}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-[14px] font-bold transition-all hover:opacity-90"
            style={{ background: PRIMARY, color: "#fff" }}
          >
            Inquire About Enrollment
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>

        {/* ── Program Philosophy ── */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-[11px] uppercase tracking-[0.12em] font-mono" style={{ color: PRIMARY }}>
              Program Philosophy
            </div>
            <h2 className="text-[28px] font-bold text-foreground">Our Three Pillars</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PILLARS.map((pillar, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-6 space-y-3"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${PRIMARY}14`, color: PRIMARY }}
                >
                  {PILLAR_ICONS[i]}
                </div>
                <h3 className="text-[15px] font-bold text-foreground">{pillar.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Staff ── */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-[11px] uppercase tracking-[0.12em] font-mono" style={{ color: PRIMARY }}>
              Our Staff
            </div>
            <h2 className="text-[28px] font-bold text-foreground">Coaches & Program Team</h2>
            <p className="text-[13px] text-muted-foreground max-w-xl mx-auto">
              All coaches are background-checked, certified, and trained in our development methodology. HoopsIQ credentials reflect additional platform certifications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STAFF.map(member => <StaffCard key={member.id} member={member} />)}
          </div>
        </section>

        {/* ── Development Outcomes ── */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-[11px] uppercase tracking-[0.12em] font-mono" style={{ color: PRIMARY }}>
              Program Results
            </div>
            <h2 className="text-[28px] font-bold text-foreground">Development Outcomes</h2>
            <p className="text-[13px] text-muted-foreground max-w-xl mx-auto">
              Program-wide results from last season. We measure what matters — skill growth, engagement, and development consistency.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {OUTCOMES.map((outcome, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-5 text-center space-y-2"
              >
                <div className="text-[32px] font-bold font-mono leading-none" style={{ color: PRIMARY }}>
                  {outcome.stat}
                </div>
                <div className="text-[12px] text-muted-foreground leading-snug">
                  {outcome.description}
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl p-4 text-center text-[12px] text-muted-foreground"
            style={{ background: "oklch(0.55 0.02 260 / 0.05)", border: "1px solid oklch(0.55 0.02 260 / 0.12)" }}
          >
            All statistics are program-level aggregates from Spring 2025 season. Individual athlete data is private and shared only with families and coaching staff.
          </div>
        </section>

        {/* ── Schedule & Tryouts ── */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-[11px] uppercase tracking-[0.12em] font-mono" style={{ color: PRIMARY }}>
              Get Started
            </div>
            <h2 className="text-[28px] font-bold text-foreground">Schedule & Tryouts</h2>
          </div>

          <div
            className="rounded-xl p-5"
            style={{ background: `${PRIMARY}08`, border: `1px solid ${PRIMARY}20` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" style={{ color: PRIMARY }} />
              <span className="text-[14px] font-semibold text-foreground">Current Season: Summer 2026</span>
            </div>
            <p className="text-[13px] text-muted-foreground">
              Practice sessions run Tuesday and Thursday evenings, with Saturday morning skill development sessions for all age groups. Season runs June – August 2026.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <span className="text-[13px] font-semibold text-foreground">Upcoming Tryout Dates</span>
            </div>
            <div className="divide-y divide-border">
              {TRYOUT_DATES.map((tryout) => (
                <div key={tryout.ageGroup} className="px-4 py-3 flex items-center gap-4" style={{ minHeight: 56 }}>
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0"
                    style={{ background: `${PRIMARY}14`, color: PRIMARY }}
                  >
                    {tryout.ageGroup}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground">{tryout.date}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {tryout.time}
                    </div>
                  </div>
                  <span
                    className="text-[11px] font-semibold shrink-0"
                    style={{ color: tryout.spotsAvailable <= 2 ? WARNING : SUCCESS }}
                  >
                    {tryout.spotsAvailable} spot{tryout.spotsAvailable !== 1 ? "s" : ""} available
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[13px] font-semibold border transition-all hover:border-[oklch(0.72_0.18_290_/_0.5)]"
              style={{ borderColor: `${PRIMARY}30`, color: PRIMARY, minHeight: 44 }}
            >
              Register for Tryouts
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-[11px] uppercase tracking-[0.12em] font-mono" style={{ color: PRIMARY }}>
              Families
            </div>
            <h2 className="text-[28px] font-bold text-foreground">What Parents Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-border bg-card p-5 space-y-4"
              >
                <div className="flex items-start gap-1" style={{ color: WARNING }}>
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>

                <blockquote className="text-[13px] text-muted-foreground leading-relaxed">
                  "{t.quote}"
                </blockquote>

                <div className="border-t border-border pt-3">
                  <div className="text-[12px] font-semibold text-foreground">{t.parentName}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Parent of {t.athleteName} · {t.ageGroup} · {t.seasons} seasons
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer CTA ── */}
        <section
          className="rounded-2xl p-8 sm:p-12 text-center space-y-5"
          style={{ background: `${PRIMARY}08`, border: `1px solid ${PRIMARY}20` }}
        >
          <h2 className="text-[26px] font-bold text-foreground">Ready to get started?</h2>
          <p className="text-[14px] text-muted-foreground max-w-md mx-auto">
            Submit an enrollment inquiry and we'll follow up within 48 hours to discuss your athlete's development goals and program fit.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-[14px] font-bold transition-all hover:opacity-90"
            style={{ background: PRIMARY, color: "#fff" }}
          >
            Inquire About Enrollment
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="flex items-center justify-center gap-4 text-[12px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" style={{ color: SUCCESS }} />No commitment required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" style={{ color: SUCCESS }} />We respond within 48 hours</span>
          </div>
        </section>

      </main>

      {/* Minimal footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Logo size={20} />
          <p className="text-[12px] text-muted-foreground text-center">
            {PROGRAM.name} · {PROGRAM.location} · Powered by HoopsIQ
          </p>
          <Link href="/sign-in" asChild>
            <a className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
              Staff Sign In
            </a>
          </Link>
        </div>
      </footer>

      <InquiryModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
