import { Link } from "wouter";
import { ArrowRight, Play, Flame, Zap, Shield, Trophy } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function Home() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.22_0.06_75_/_0.35),transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,oklch(0.09_0.005_260)_100%)]" />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.4_0.05_75_/_0.4) 1px, transparent 1px), linear-gradient(90deg, oklch(0.4_0.05_75_/_0.4) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
        </div>
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8 pt-24 pb-32">
          <div className="max-w-4xl fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 mb-8">
              <Flame className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] uppercase tracking-[0.12em] text-primary font-medium">
                Built with Earl Watson · Elite development infrastructure
              </span>
            </div>

            <h1 className="display text-[clamp(3rem,7vw,6rem)] leading-[0.9] tracking-[-0.01em]">
              THE BASKETBALL
              <br />
              DEVELOPMENT
              <br />
              <span className="text-primary">IQ.</span>
            </h1>

            <p className="text-[18px] lg:text-[20px] leading-relaxed text-muted-foreground max-w-2xl mt-8">
              The operating system for elite player development. Coaching
              observations become individual plans. Film becomes drills. Drills
              become scored skill data. Every player in your program gets a real
              IDP — not a spreadsheet.
            </p>

            <div className="flex flex-wrap gap-3 mt-10">
              <Link href="/sign-in" asChild>
                <a className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-primary text-primary-foreground font-semibold text-[13px] uppercase tracking-[0.08em] hover:brightness-110 transition shadow-[0_0_40px_-8px_oklch(0.78_0.18_75/0.6)]">
                  Open Demo App <ArrowRight className="w-4 h-4" />
                </a>
              </Link>
              <Link href="/coaches" asChild>
                <a className="inline-flex items-center gap-2 h-12 px-6 rounded-md border border-border bg-card hover:bg-[oklch(0.17_0.005_260)] text-[13px] font-semibold uppercase tracking-[0.08em] transition">
                  <Play className="w-4 h-4" /> See the Development Loop
                </a>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl">
              {[
                { k: "12,400+", v: "Players in active development" },
                { k: "480+",    v: "Programs" },
                { k: "13 yrs", v: "NBA career — Earl Watson, Partner" },
                { k: "Film → IDP", v: "The loop that closes" },
              ].map((s) => (
                <div key={s.v}>
                  <div className="display text-3xl lg:text-4xl text-primary">{s.k}</div>
                  <div className="text-[11.5px] uppercase tracking-[0.1em] text-muted-foreground mt-1">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AUDIENCE PIVOT */}
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 -mt-8">
        <div className="text-center mb-14">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-mono mb-3">
            One platform · every role in the program
          </div>
          <h2 className="display text-4xl lg:text-5xl">
            Built for every seat in the gym.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AudCard
            href="/players"
            icon={<Zap className="w-5 h-5" />}
            eyebrow="Players"
            title="Your development plan. In motion."
            body="Individual focus areas, drill assignments from your coach, and skill scores that prove you're getting better — session after session."
          />
          <AudCard
            href="/coaches"
            icon={<Shield className="w-5 h-5" />}
            eyebrow="Coaches"
            title="Coaching intelligence that develops players."
            body="Film observations become IDP entries. Coaching actions become practice drills. Every decision leaves a development record."
          />
          <AudCard
            href="/teams"
            icon={<Trophy className="w-5 h-5" />}
            eyebrow="Programs"
            title="Every player in your program gets a real IDP."
            body="Individual development at scale. Film-to-drill feedback for every player on the roster, not just the ones with time."
            highlight
          />
          <AudCard
            href="/experts"
            icon={<Flame className="w-5 h-5" />}
            eyebrow="Expert Coaches"
            title="Bring elite development knowledge to your program."
            body="Async film reviews, live sessions, and premium curriculum from coaches who've developed players at the highest level."
          />
        </div>
      </section>

      {/* VALUE PILLARS */}
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-32">
        <div className="grid lg:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border border-border">
          <Pillar
            label="Player Development"
            title="Every player gets a real plan. Every plan has proof of progress."
            body="Individual development plans built from film observations and assessment scores. Focus areas. Coach-assigned drills. Skill milestones. A development record that follows the player through every season — and into recruiting."
          />
          <Pillar
            label="Coach Intelligence"
            title="What you see on film becomes what they work on tomorrow."
            body="Annotate a clip. Create a coaching action. It surfaces in the practice plan and the player's IDP automatically. Readiness tracking, playbook studio, and compliance — every tool connects to the development loop."
          />
          <Pillar
            label="AI Feedback"
            title="Frame-by-frame critique. Coach-verified before the player sees it."
            body="Upload any clip — phone or camcorder. AI flags balance, release angle, footwork, and decision-making at each timestamp. Coaches review and sign off. Suggested drills route directly to the player's next WOD."
          />
        </div>
      </section>

      {/* EARL WATSON / DEVELOPMENT CREDIBILITY */}
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-32">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-primary font-mono mb-6">
              Development Philosophy · HoopsIQ Partner
            </div>
            <blockquote className="display text-3xl lg:text-[2.1rem] leading-tight mb-8">
              "The best coaches don't just watch film. They close the loop —
              from what they see, to what the player works on, to what actually
              changes. That loop is everything."
            </blockquote>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold display text-lg shrink-0">
                EW
              </div>
              <div>
                <div className="font-semibold display text-[18px]">Earl Watson</div>
                <div className="text-[13px] text-muted-foreground leading-relaxed">
                  13-year NBA veteran · Head Coach, Phoenix Suns · HoopsIQ Partner
                </div>
              </div>
            </div>
            <p className="text-[14px] text-muted-foreground leading-relaxed max-w-xl">
              Earl Watson played 13 seasons in the NBA — at UCLA, with the
              SuperSonics, the Thunder, the Trail Blazers — and spent years on
              the bench studying what actually develops players rather than
              what makes practice feel productive. His conviction: individual
              development requires a system, not a session. Every observation
              needs to close a loop. Every player needs a real plan — not a
              spreadsheet, not a conversation, a structured record that follows
              them and proves they got better. That conviction is the
              architecture behind HoopsIQ.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { k: "13", v: "NBA seasons", sub: "SuperSonics · Thunder · Blazers · Heat and more" },
              { k: "UCLA", v: "Foundation", sub: "Where basketball IQ and player development became his lens" },
              { k: "Head Coach", v: "Phoenix Suns", sub: "Led a program built on individual development at every roster level" },
              { k: "The Loop", v: "Film → Plan → Proof", sub: "The coaching methodology behind every HoopsIQ workflow" },
            ].map((c) => (
              <div
                key={c.k}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="display text-2xl text-primary mb-1">{c.k}</div>
                <div className="text-[13px] font-semibold mb-1">{c.v}</div>
                <div className="text-[11.5px] text-muted-foreground">{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEVELOPMENT PRINCIPLES */}
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-32">
        <div className="text-center mb-16">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-mono mb-3">
            The standard HoopsIQ is built to
          </div>
          <h2 className="display text-4xl lg:text-5xl">
            Four things elite programs do.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-lg overflow-hidden">
          {[
            {
              n: "01",
              title: "Teach the why, not just the what.",
              body: "Players who understand why they're working on something execute with intention. Drill prescriptions in HoopsIQ carry the coach's reasoning — not just the reps.",
            },
            {
              n: "02",
              title: "Every observation creates an obligation.",
              body: "A coaching note that doesn't connect to a player action is just commentary. Film annotations in HoopsIQ generate coaching actions. Actions become assignments. Assignments close.",
            },
            {
              n: "03",
              title: "Progress needs proof, not opinion.",
              body: "Coaches feel players improving. Programs need to measure it. Skill scores, milestone completions, and assessment history create a development record that can't be argued with.",
            },
            {
              n: "04",
              title: "Individual development is a system.",
              body: "One great practice doesn't develop a player. A system of observation, planning, execution, and re-assessment over a full season does. That's what HoopsIQ runs.",
            },
          ].map((p) => (
            <div key={p.n} className="bg-card p-8 lg:p-10">
              <div className="font-mono text-[11px] text-primary mb-5">{p.n}</div>
              <h3 className="display text-[19px] leading-tight mb-4">{p.title}</h3>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BIG CTA */}
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-32">
        <div className="relative rounded-xl border border-border bg-gradient-to-br from-[oklch(0.14_0.01_60)] via-[oklch(0.13_0.005_260)] to-[oklch(0.12_0.02_280)] p-10 lg:p-16 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.78_0.18_75/0.25),transparent_55%)]" />
          <div className="relative max-w-3xl">
            <div className="text-[11px] uppercase tracking-[0.12em] text-primary font-mono mb-4">
              The standard serious programs hold themselves to
            </div>
            <h2 className="display text-4xl lg:text-6xl leading-[0.95]">
              GREAT PROGRAMS
              <br />
              DON'T JUST RUN PRACTICES.
              <br />
              <span className="text-primary">THEY DEVELOP PLAYERS.</span>
            </h2>
            <p className="text-[17px] leading-relaxed text-muted-foreground mt-6 max-w-xl">
              HoopsIQ turns coaching observations into individual development
              plans. The film you watch on Monday becomes the drill your player
              runs on Wednesday. That drill becomes the scored data that proves
              they got better. That data follows the player into recruiting
              season.
            </p>
            <Link href="/sign-in" asChild>
              <a className="inline-flex items-center gap-2 h-12 px-6 mt-10 rounded-md bg-primary text-primary-foreground font-semibold text-[13px] uppercase tracking-[0.08em] hover:brightness-110 transition">
                Open Demo App <ArrowRight className="w-4 h-4" />
              </a>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

function AudCard({
  href,
  icon,
  eyebrow,
  title,
  body,
  highlight = false,
}: {
  href: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <Link href={href} asChild>
      <a
        className={`group block rounded-lg border p-6 transition-all relative overflow-hidden ${
          highlight
            ? "border-primary/40 bg-primary/5 hover:bg-primary/10 shadow-[0_0_40px_-20px_oklch(0.78_0.18_75/0.5)]"
            : "border-border bg-card hover:bg-[oklch(0.17_0.005_260)] hover:border-[oklch(0.3_0.005_260)]"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-md flex items-center justify-center mb-5 ${
            highlight ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          {icon}
        </div>
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-mono mb-2">
          {eyebrow}
        </div>
        <div className="display text-[22px] leading-tight mb-3 group-hover:text-primary transition-colors">
          {title}
        </div>
        <p className="text-[13.5px] text-muted-foreground leading-relaxed">
          {body}
        </p>
        <ArrowRight className="w-4 h-4 mt-5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
      </a>
    </Link>
  );
}

function Pillar({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-card p-10">
      <div className="text-[11px] uppercase tracking-[0.12em] text-primary font-mono mb-4">
        {label}
      </div>
      <h3 className="display text-2xl leading-tight mb-4">{title}</h3>
      <p className="text-[14px] text-muted-foreground leading-relaxed">
        {body}
      </p>
    </div>
  );
}
