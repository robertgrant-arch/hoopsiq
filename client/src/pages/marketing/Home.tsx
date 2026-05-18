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
                Now in preview — joining 12,400+ athletes
              </span>
            </div>

            <h1 className="display text-[clamp(3rem,7vw,6rem)] leading-[0.9] tracking-[-0.01em]">
              THE UNIFIED
              <br />
              BASKETBALL
              <br />
              <span className="text-primary">OS.</span>
            </h1>

            <p className="text-[18px] lg:text-[20px] leading-relaxed text-muted-foreground max-w-2xl mt-8">
              One platform for players, coaches, and programs. Daily workouts
              with AI feedback. A coaching command center for teams. A
              marketplace of elite trainers. The whole sport — one OS.
            </p>

            <div className="flex flex-wrap gap-3 mt-10">
              <Link href="/sign-in" asChild>
                <a className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-primary text-primary-foreground font-semibold text-[13px] uppercase tracking-[0.08em] hover:brightness-110 transition shadow-[0_0_40px_-8px_oklch(0.78_0.18_75/0.6)]">
                  Open Demo App <ArrowRight className="w-4 h-4" />
                </a>
              </Link>
              <Link href="/coaches" asChild>
                <a className="inline-flex items-center gap-2 h-12 px-6 rounded-md border border-border bg-card hover:bg-[oklch(0.17_0.005_260)] text-[13px] font-semibold uppercase tracking-[0.08em] transition">
                  <Play className="w-4 h-4" /> Explore Coach HQ
                </a>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl">
              {[
                { k: "12,400+", v: "Athletes Training" },
                { k: "480+", v: "Teams" },
                { k: "142", v: "Elite Experts" },
                { k: "50%", v: "Off for Team Athletes" },
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
            One platform · four audiences
          </div>
          <h2 className="display text-4xl lg:text-5xl">
            Built for every seat on the bench.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AudCard
            href="/players"
            icon={<Zap className="w-5 h-5" />}
            eyebrow="Players"
            title="Your daily blueprint for greatness."
            body="Adaptive WODs, AI feedback, and skill-track progression."
          />
          <AudCard
            href="/coaches"
            icon={<Shield className="w-5 h-5" />}
            eyebrow="Coaches"
            title="An operating system, not an app."
            body="Compliance, reviews, playbooks, and messaging — in one."
          />
          <AudCard
            href="/teams"
            icon={<Trophy className="w-5 h-5" />}
            eyebrow="Teams & Orgs"
            title="Standardize excellence across your program."
            body="Seat-based billing. Athletes get 50% off Player Core."
            highlight
          />
          <AudCard
            href="/experts"
            icon={<Flame className="w-5 h-5" />}
            eyebrow="Experts"
            title="Monetize your basketball mind."
            body="Async reviews, live classes, courses. You set the price."
          />
        </div>
      </section>

      {/* VALUE PILLARS */}
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-32">
        <div className="grid lg:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border border-border">
          <Pillar
            label="AI Feedback"
            title="Your shot. Your tape. Real critique — every rep."
            body="Upload a clip. Get frame-by-frame feedback on balance, release, footwork, and decision-making. Coaches review and sign off on every flag."
          />
          <Pillar
            label="Coach HQ"
            title="Stop toggling between Excel, GroupMe, Hudl, and Canva."
            body="Roster compliance, review queues, telestration, practice-plan builder, playbook studio, and parent-in-the-loop messaging. One tab."
          />
          <Pillar
            label="Expert Marketplace"
            title="Book the people who've been on the floor."
            body="Brickley, Tasha King, D1 head coaches. Async video reviews, 1:1 consults, and premium courses. Member pricing baked in."
          />
        </div>
      </section>

      {/* BIG CTA */}
      <section className="max-w-[1400px] mx-auto px-5 lg:px-8 mt-32">
        <div className="relative rounded-xl border border-border bg-gradient-to-br from-[oklch(0.14_0.01_60)] via-[oklch(0.13_0.005_260)] to-[oklch(0.12_0.02_280)] p-10 lg:p-16 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.78_0.18_75/0.25),transparent_55%)]" />
          <div className="relative max-w-3xl">
            <div className="text-[11px] uppercase tracking-[0.12em] text-primary font-mono mb-4">
              The every-day-matters promise
            </div>
            <h2 className="display text-4xl lg:text-6xl leading-[0.95]">
              THE COURT IS EARNED.
              <br />
              <span className="text-primary">EARN IT DAILY.</span>
            </h2>
            <p className="text-[17px] leading-relaxed text-muted-foreground mt-6 max-w-xl">
              HoopsOS is the compound-interest account for your basketball
              career. Players who train daily with AI feedback average{" "}
              <span className="text-foreground font-medium">
                +23% improvement
              </span>{" "}
              on tracked skills in 90 days.
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
