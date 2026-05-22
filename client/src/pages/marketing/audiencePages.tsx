import { Link } from "wouter";
import { ArrowRight, Check, Flame, Shield, Trophy, Zap, Star } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { fullPlans } from "@/features/club-ops/mock";
import { experts } from "@/lib/mock/data";

// ------------- shared shell -------------
function AudienceShell({
  eyebrow,
  title,
  titleAccent,
  lede,
  primaryCta,
  primaryHref,
  secondaryCta,
  secondaryHref,
  accent,
  children,
}: {
  eyebrow: string;
  title: string;
  titleAccent: string;
  lede: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta?: string;
  secondaryHref?: string;
  accent: "amber" | "indigo" | "teal";
  children: React.ReactNode;
}) {
  const accentMap = {
    amber: "oklch(0.78 0.18 75 / 0.35)",
    indigo: "oklch(0.55 0.22 290 / 0.35)",
    teal: "oklch(0.65 0.15 180 / 0.35)",
  };
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at top, ${accentMap[accent]}, transparent 55%)`,
            }}
          />
        </div>
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8 pt-20 pb-16">
          <div className="text-[11px] uppercase tracking-[0.12em] text-primary font-mono mb-5">
            {eyebrow}
          </div>
          <h1 className="display text-[clamp(2.5rem,6vw,5rem)] leading-[0.9] tracking-[-0.01em] max-w-5xl">
            {title}
            <br />
            <span className="text-primary">{titleAccent}</span>
          </h1>
          <p className="text-[18px] leading-relaxed text-muted-foreground max-w-2xl mt-8">
            {lede}
          </p>
          <div className="flex flex-wrap gap-3 mt-10">
            <Link href={primaryHref} asChild>
              <a className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-primary text-primary-foreground font-semibold text-[13px] uppercase tracking-[0.08em] hover:brightness-110 transition">
                {primaryCta} <ArrowRight className="w-4 h-4" />
              </a>
            </Link>
            {secondaryCta && secondaryHref && (
              <Link href={secondaryHref} asChild>
                <a className="inline-flex items-center gap-2 h-12 px-6 rounded-md border border-border bg-card hover:bg-[oklch(0.17_0.005_260)] text-[13px] font-semibold uppercase tracking-[0.08em] transition">
                  {secondaryCta}
                </a>
              </Link>
            )}
          </div>
        </div>
      </section>
      {children}
      <MarketingFooter />
    </div>
  );
}

// ------------- Players -------------
export function PlayersPage() {
  return (
    <AudienceShell
      eyebrow="For Players"
      title="YOUR DEVELOPMENT PLAN."
      titleAccent="IN MOTION."
      lede="Your coach sees the film. They write the plan. You execute the drills. You both watch the skill scores move. HoopsIQ is where individual development actually happens — not just gets scheduled."
      primaryCta="Open Player Demo"
      primaryHref="/sign-in"
      secondaryCta="See How the IDP Works"
      secondaryHref="#idp"
      accent="amber"
    >
      {/* The Stack */}
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-16">
        <h2 className="display text-3xl lg:text-4xl mb-10">Your development stack — all in one place.</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Zap />, title: "My IDP", body: "Individual development plan with real focus areas. Built by your coach from film and assessments. Updated every time you make progress." },
            { icon: <Flame />, title: "Film Feedback", body: "Your coach annotates your clips. Their notes, the linked drill, and the IDP connection — all visible to you." },
            { icon: <Shield />, title: "Skill Scores", body: "Assessed by your coach across shooting, finishing, ball handling, defense, and footwork. Your trajectory is visible and dated." },
            { icon: <Trophy />, title: "Drill Assignments", body: "Coach-prescribed drills delivered to your daily WOD. When you complete them, the feedback loop closes." },
          ].map((c) => (
            <div key={c.title} className="rounded-lg border border-border bg-card p-6">
              <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-4">
                {c.icon}
              </div>
              <div className="display text-[18px] mb-2">{c.title}</div>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT ELITE DEVELOPMENT ACTUALLY LOOKS LIKE */}
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-24">
        <div className="relative rounded-xl border border-border overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.78_0.18_75_/_0.08),transparent_60%)]" />
          <div className="relative grid lg:grid-cols-2 gap-0">
            <div className="p-10 lg:p-14 border-b lg:border-b-0 lg:border-r border-border">
              <div className="text-[11px] uppercase tracking-[0.12em] text-primary font-mono mb-5">
                What Elite Development Actually Looks Like
              </div>
              <h2 className="display text-2xl lg:text-3xl leading-tight mb-6">
                The difference isn't talent.<br />It's whether anyone closed the loop.
              </h2>
              <p className="text-[14.5px] text-muted-foreground leading-relaxed mb-6">
                Earl Watson spent 13 years in the NBA watching what separated
                players who developed from players who plateaued. The answer was
                rarely talent. It was whether their coaches had a system to turn
                observations into assigned work — and assigned work into
                measurable evidence of growth.
              </p>
              <p className="text-[14.5px] text-muted-foreground leading-relaxed">
                Your IDP, your skill scores, your film feedback — that's the
                system. Built for players who want to know exactly where they
                stand and exactly what to do about it.
              </p>
            </div>
            <div className="p-10 lg:p-14 flex flex-col justify-center gap-7">
              {[
                { label: "You know what to work on.", sub: "Your top focus areas are set by your coach from real assessment scores — not a guess, not a conversation you forgot." },
                { label: "You know why.", sub: "Every drill assignment is linked to a film observation. You can see the clip, read the note, and understand the correction." },
                { label: "You can prove you improved.", sub: "Skill scores are dated. Your coach reassesses. The delta is visible to you, your coach, and recruiting programs." },
              ].map((item) => (
                <div key={item.label} className="flex gap-4">
                  <div className="w-1.5 rounded-full bg-primary/40 shrink-0 mt-1" style={{ minHeight: "1.25rem" }} />
                  <div>
                    <div className="display text-[16px] mb-1">{item.label}</div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 50% callout */}
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-16" id="team-discount">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-block px-3 py-1 rounded-full border border-primary/40 bg-primary/15 text-primary text-[11px] uppercase tracking-[0.12em] font-mono mb-4">
              For team athletes
            </div>
            <h3 className="display text-2xl lg:text-3xl mb-3">
              On a team using HoopsIQ? Your membership is <span className="text-primary">50% off</span>.
            </h3>
            <p className="text-[14.5px] text-muted-foreground">
              Athletes on the active roster of any team with an eligible Team Pro
              plan automatically get Player Core at 50% off — for as long as
              they're on the roster.
            </p>
          </div>
          <Link href="/sign-in" asChild>
            <a className="shrink-0 inline-flex items-center gap-2 h-11 px-5 rounded-md bg-primary text-primary-foreground font-semibold text-[13px] uppercase tracking-[0.08em] hover:brightness-110 transition">
              Join My Team
            </a>
          </Link>
        </div>
      </section>

      {/* AI feedback explain */}
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-20" id="ai-feedback">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-primary font-mono mb-3">
              How AI Feedback Works
            </div>
            <h2 className="display text-3xl lg:text-4xl mb-6 leading-tight">
              Upload a rep. Get a coach's eye on frame 437.
            </h2>
            <ol className="space-y-5">
              {[
                { n: "01", t: "Upload", b: "Drop any clip — phone or camcorder. Mux transcodes it for slow-mo and frame-scrub." },
                { n: "02", t: "Analyze", b: "Pose-estimation models score balance, release angle, foot plant, and tempo — at each timestamp." },
                { n: "03", t: "Verify", b: "Every observation is reviewable by your coach. Flagged low-confidence moments auto-escalate to humans." },
                { n: "04", t: "Drill", b: "Suggested drills show up in your next WOD. The feedback loop actually closes." },
              ].map((s) => (
                <li key={s.n} className="flex gap-4">
                  <div className="font-mono text-[11px] tabular-nums text-primary w-8 shrink-0 pt-1">
                    {s.n}
                  </div>
                  <div>
                    <div className="display text-[17px] mb-1">{s.t}</div>
                    <p className="text-[13.5px] text-muted-foreground leading-relaxed">{s.b}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 font-mono text-[11.5px] leading-relaxed">
            <div className="text-muted-foreground mb-3">
              // Example AI observation
            </div>
            <div className="text-primary mb-1">0:37 · major</div>
            <div className="mb-3">Thumb flick visible — rotation is forced.</div>
            <div className="text-primary mb-1">suggested_drills</div>
            <div className="text-muted-foreground">
              → form_shooting_guide_hand
              <br />
              → release_triangulation
            </div>
            <div className="mt-6 pt-4 border-t border-border text-[10.5px] text-muted-foreground">
              Confidence 0.89 · VERIFIED BY COACH REED
            </div>
          </div>
        </div>
      </section>
    </AudienceShell>
  );
}

// ------------- Coaches -------------
export function CoachesPage() {
  return (
    <AudienceShell
      eyebrow="For Coaches"
      title="COACHING THAT"
      titleAccent="DEVELOPS PLAYERS."
      lede="Turn what you see on film into what players actually work on. Individual development plans built from your coaching observations. Readiness tracking, practice planning, playbook, and film — one workflow that connects observation to outcome."
      primaryCta="Open Coach Demo"
      primaryHref="/sign-in"
      secondaryCta="See the Development Loop"
      secondaryHref="#dev-loop"
      accent="indigo"
    >
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-16" id="dev-loop">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { t: "IDP Builder", b: "Create individual development plans from assessment scores and film observations. Focus areas, milestones, and drill links — all in one record that follows the player." },
            { t: "Coaching Actions", b: "Annotate a film clip. Create a coaching action. It surfaces in the practice plan sidebar and the player's daily assignments automatically." },
            { t: "Readiness Intelligence", b: "Daily check-ins scored against wellness thresholds. Know who's restricted before you plan the session. Overrides tracked for accountability." },
            { t: "Practice Plan Builder", b: "Drag-and-drop blocks with time budgets. Open coaching actions surface as suggested drills. Flagged players highlighted before you publish." },
            { t: "Playbook Studio", b: "Draw plays on a real court. Animate read-sequences. Assign film study and quiz players on coverages and counters." },
            { t: "Proof of Progress", b: "Skill scores over time. IDP completion rates. Development records that answer the question every parent asks: is my player getting better?" },
          ].map((c) => (
            <div key={c.t} className="rounded-lg border border-border bg-card p-6">
              <div className="display text-[18px] mb-2">{c.t}</div>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed">{c.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* THE DEVELOPMENT STANDARD — Earl Watson methodology */}
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-24">
        <div className="grid lg:grid-cols-2 gap-14 items-start">
          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-primary font-mono mb-5">
              The Development Standard · Earl Watson, HoopsIQ Partner
            </div>
            <h2 className="display text-3xl lg:text-[2.2rem] leading-tight mb-6">
              Observation is the beginning.<br />Not the end.
            </h2>
            <p className="text-[15px] text-muted-foreground leading-relaxed mb-6">
              Earl Watson's conviction — forged across 13 NBA seasons as a
              player and years on the bench as a coach — is that most coaching
              work never closes the loop. A coach sees something on film. They
              say something in practice. The player hears it. Nothing is
              written down. Nothing is tracked. Nothing is re-assessed.
            </p>
            <p className="text-[15px] text-muted-foreground leading-relaxed mb-8">
              HoopsIQ is built to make that impossible. Every observation you
              make creates a record. Every coaching action generates an
              assignment. Every assignment connects to a focus area. Every
              focus area has a score that moves — or doesn't — and you'll know
              which.
            </p>
            <blockquote className="border-l-2 border-primary pl-6">
              <p className="display text-[19px] leading-snug text-foreground mb-3">
                "Every coaching observation should close a loop. Not just
                'I saw it' — but 'I noted it, I taught it, the player worked
                on it, and we can prove it changed.'"
              </p>
              <cite className="text-[12px] text-muted-foreground not-italic font-mono uppercase tracking-[0.1em]">
                Earl Watson · HoopsIQ Partner
              </cite>
            </blockquote>
          </div>
          <div className="flex flex-col gap-5 pt-2">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-mono mb-1">
              The loop, step by step
            </div>
            {[
              { step: "01", label: "You see it on film.", detail: "Annotate the clip. Flag the moment. Tag the player and the category." },
              { step: "02", label: "You create a coaching action.", detail: "Prescribe a drill, assign the clip, or link it directly to an IDP focus area." },
              { step: "03", label: "The player receives it.", detail: "The assignment surfaces in their WOD. Film context travels with it — they know why." },
              { step: "04", label: "The player executes.", detail: "Drill completions are logged. Film responses are submitted. Progress is recorded." },
              { step: "05", label: "You re-assess.", detail: "Skill scores update. The development record grows. You close the loop." },
            ].map((item) => (
              <div key={item.step} className="flex gap-5 items-start">
                <div className="font-mono text-[11px] text-primary w-8 shrink-0 pt-[3px]">{item.step}</div>
                <div>
                  <div className="text-[14px] font-semibold mb-1">{item.label}</div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT GREAT COACHES KNOW */}
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-24 mb-8">
        <div className="rounded-xl border border-border bg-card p-10 lg:p-14">
          <div className="text-[11px] uppercase tracking-[0.12em] text-primary font-mono mb-6">
            What the best player-development coaches have in common
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "They teach the why.", body: "The drill prescription includes the reason. A player who understands why they're working on something executes with intention. HoopsIQ carries your reasoning from film annotation through to the assignment." },
              { title: "They hold themselves accountable.", body: "Good coaches track their own coaching — not just player output. How many observations became actions this month? How many actions were followed up? HoopsIQ makes that visible." },
              { title: "They build individual plans.", body: "The best programs have an IDP for every player — not just the stars. HoopsIQ makes program-wide individual development feasible for coaching staffs of any size." },
            ].map((item) => (
              <div key={item.title}>
                <div className="display text-[19px] leading-tight mb-3">{item.title}</div>
                <p className="text-[13.5px] text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AudienceShell>
  );
}

// ------------- Teams -------------
export function TeamsPage() {
  return (
    <AudienceShell
      eyebrow="For Programs & Organizations"
      title="STANDARDIZE EXCELLENCE"
      titleAccent="ACROSS YOUR ORG."
      lede="From one varsity team to a 16-team travel program. Seat-based billing, SSO, roster SSO-import, and a flagship perk for your athletes: 50% off Player Core — forever, while they're on roster."
      primaryCta="Open Org Admin Demo"
      primaryHref="/sign-in"
      secondaryCta="See Pricing"
      secondaryHref="/pricing"
      accent="teal"
    >
      {/* Program development standard */}
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-16">
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          <div className="lg:col-span-2">
            <div className="text-[11px] uppercase tracking-[0.12em] text-primary font-mono mb-4">
              The program-level standard
            </div>
            <h2 className="display text-3xl lg:text-4xl leading-tight mb-5">
              The programs that develop players do it systematically — not occasionally.
            </h2>
            <p className="text-[15px] text-muted-foreground leading-relaxed mb-4">
              Earl Watson has seen programs at every level — college, NBA, youth —
              and the gap between programs that develop players and programs that
              roster them is structural, not philosophical. It's whether there's
              a system that runs for every player, not just the ones who get
              extra attention.
            </p>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              HoopsIQ is that system. Every player gets an IDP. Every coach
              observation creates a record. Every program has a development
              standard that applies at scale — not just for the stars.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-7 flex flex-col gap-5">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-mono">
              Program-wide development
            </div>
            {[
              "Every player gets a real IDP",
              "Film → coaching action → player assignment — automated",
              "Readiness tracked across every athlete",
              "Skill assessments dated and stored",
              "Development records into recruiting",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-[13px]">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
            <div className="pt-2 mt-auto border-t border-border">
              <div className="text-[11px] text-muted-foreground font-mono uppercase tracking-[0.1em]">
                Earl Watson · HoopsIQ Partner
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-5 lg:px-8">
        <div className="rounded-xl border border-border bg-card p-10">
          <h2 className="display text-3xl mb-8">The 50% Rule, visually.</h2>
          <div className="grid md:grid-cols-3 gap-6 text-[13.5px] leading-relaxed">
            <Step num="01" t="Program Subscribes" b="You subscribe to Team Pro with 20+ seats." />
            <Step num="02" t="Coaches Invite Athletes" b="Coaches invite athletes to the team roster." />
            <Step num="03" t="Discount Grants Automatically" b="Entitlement Service grants TEAM_DISCOUNT_50 on roster-join. Stripe coupon applied at checkout." />
          </div>
          <div className="text-[12px] text-muted-foreground mt-8 pt-6 border-t border-border">
            Coach subscription pauses, athlete removed from roster, or program cancels → discount revokes with full audit trail. Clean, idempotent, with proration.
          </div>
        </div>
      </section>
    </AudienceShell>
  );
}

function Step({ num, t, b }: { num: string; t: string; b: string }) {
  return (
    <div>
      <div className="font-mono text-[11px] text-primary mb-2">{num}</div>
      <div className="display text-[17px] mb-2">{t}</div>
      <p className="text-muted-foreground">{b}</p>
    </div>
  );
}

// ------------- Experts -------------
export function ExpertsPage() {
  return (
    <AudienceShell
      eyebrow="For Trainers & Elite Coaches"
      title="MONETIZE YOUR"
      titleAccent="BASKETBALL MIND."
      lede="List async video reviews, 1:1 consults, live classes, and premium courses. We handle payments, member pricing, and the platform. You set the price and keep 80%."
      primaryCta="Open Expert Demo"
      primaryHref="/sign-in"
      secondaryCta="Browse the Marketplace"
      secondaryHref="/experts#marketplace"
      accent="amber"
    >
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-16" id="marketplace">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="display text-3xl">Currently on the platform.</h2>
          <Link href="/experts/directory" asChild>
            <a className="text-[13px] text-primary hover:brightness-110">
              View all 142 →
            </a>
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experts.slice(0, 6).map((e) => (
            <div key={e.id} className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center display text-sm">
                  {e.initials}
                </div>
                <div>
                  <div className="display text-[15px]">{e.name}</div>
                  <div className="text-[11px] text-muted-foreground">{e.category}</div>
                </div>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                {e.tagline}
              </p>
              <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1 text-primary">
                  <Star className="w-3 h-3 fill-primary" /> {e.rating}
                </span>
                <span>·</span>
                <span>{e.reviewCount} reviews</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AudienceShell>
  );
}

// ------------- Pricing -------------
export function PricingPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 pt-20 pb-16 text-center">
        <div className="text-[11px] uppercase tracking-[0.12em] text-primary font-mono mb-5">
          Pricing
        </div>
        <h1 className="display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95]">
          PRICED FOR
          <br />
          <span className="text-primary">ACTUAL BASKETBALL.</span>
        </h1>
        <p className="text-[16px] leading-relaxed text-muted-foreground max-w-xl mx-auto mt-6">
          Start free. Upgrade when you're ready. Save 16% on annual.
        </p>
      </section>
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 grid md:grid-cols-3 gap-4">
        {fullPlans.map((p, i) => (
          <div
            key={p.id}
            className={`rounded-xl p-8 flex flex-col ${
              i === 2
                ? "border-2 border-primary bg-primary/5 shadow-[0_0_60px_-20px_oklch(0.78_0.18_75/0.5)]"
                : "border border-border bg-card"
            }`}
          >
            {i === 2 && (
              <div className="inline-block self-start px-2.5 py-1 rounded bg-primary text-primary-foreground text-[10px] uppercase tracking-[0.1em] font-bold mb-4">
                Most Popular
              </div>
            )}
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-mono mb-2">
              {p.highlight}
            </div>
            <div className="display text-2xl mb-4">{p.name}</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="display text-5xl text-primary">
                ${p.monthly}
              </span>
              <span className="text-[13px] text-muted-foreground">
                /{p.perSeat ? "seat/mo" : "mo"}
              </span>
            </div>
            <div className="text-[11.5px] text-muted-foreground mb-6">
              or ${p.annual}/{p.perSeat ? "seat/yr" : "yr"} — save 16%
            </div>
            <ul className="space-y-2.5 mb-8 flex-1">
              {p.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-[13.5px] leading-relaxed"
                >
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/sign-in" asChild>
              <a
                className={`inline-flex items-center justify-center gap-2 h-11 rounded-md text-[13px] font-semibold uppercase tracking-[0.08em] transition ${
                  i === 2
                    ? "bg-primary text-primary-foreground hover:brightness-110"
                    : "border border-border hover:bg-[oklch(0.17_0.005_260)]"
                }`}
              >
                {p.perSeat ? "Open Org Demo" : "Open Demo App"}
              </a>
            </Link>
          </div>
        ))}
      </section>
      <div className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-12 text-center text-[12.5px] text-muted-foreground">
        Athletes on an active roster of a Team Pro org get{" "}
        <span className="text-primary font-medium">50% off Player Core</span> —
        automatically.
      </div>
      <MarketingFooter />
    </div>
  );
}

// ------------- Live (marketing landing) -------------
export function LiveLanding() {
  return (
    <AudienceShell
      eyebrow="Live classes"
      title="THE GLOBAL HARDWOOD."
      titleAccent="LIVE."
      lede="Real-time training with NBA-calibre trainers. Chat, react, ask questions. Replay forever. Free for Player Core members on select events."
      primaryCta="Browse Live Schedule"
      primaryHref="/app/live"
      accent="indigo"
    >
      <div className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-16 pb-8">
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <div className="text-[11px] uppercase tracking-[0.12em] text-primary font-mono mb-4">
            Full schedule inside
          </div>
          <p className="text-[14.5px] text-muted-foreground max-w-xl mx-auto">
            Sign in to see the full live class schedule, reserve your spot, and
            join waitlists for sold-out sessions.
          </p>
          <Link href="/sign-in" asChild>
            <a className="inline-flex items-center gap-2 h-11 px-5 mt-6 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.08em]">
              Sign In to See Schedule
            </a>
          </Link>
        </div>
      </div>
    </AudienceShell>
  );
}
