import { Link } from "wouter";
import { ArrowRight, Clock, FileText, Layers, Radio, ShieldCheck, Trophy } from "lucide-react";
import DocsTopBar from "@/components/DocsTopBar";
import DocsSidebar from "@/components/DocsSidebar";
import { chapters, allDocs } from "@/lib/docs";

const chapterIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  foundation: Layers,
  product: Trophy,
  experiences: Radio,
  commerce: FileText,
  platform: ShieldCheck,
};

export default function Home() {
  const total = allDocs.length;
  const words = allDocs.reduce((n, d) => n + d.content.split(/\s+/).length, 0);
  const kWords = Math.round(words / 1000);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DocsTopBar />

      <div className="flex">
        <aside className="hidden lg:block w-[280px] shrink-0 border-r border-border sticky top-16 h-[calc(100vh-4rem)]">
          <DocsSidebar />
        </aside>

        <main className="flex-1 min-w-0">
          {/* HERO */}
          <section className="relative overflow-hidden border-b border-border noise">
            <div className="absolute -top-32 -right-20 w-[520px] h-[520px] rounded-full bg-[oklch(0.78_0.17_75/0.12)] blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-40 -left-20 w-[420px] h-[420px] rounded-full bg-[oklch(0.45_0.22_290/0.15)] blur-[140px] pointer-events-none" />

            <div className="relative max-w-[1100px] mx-auto px-6 lg:px-12 pt-20 pb-20">
              <div className="flex items-center gap-3 mb-8">
                <span className="mono-pill text-primary/90 !bg-[oklch(0.78_0.17_75/0.1)] border-primary/20">
                  v1.0 · CANONICAL
                </span>
                <span className="mono-pill">APRIL 2026</span>
              </div>

              <h1 className="display text-5xl md:text-[68px] leading-[0.98] tracking-tight max-w-4xl">
                The unified basketball development IQ,
                <br />
                <span className="text-primary">specified end-to-end.</span>
              </h1>

              <p className="mt-7 text-[17.5px] text-muted-foreground leading-relaxed max-w-[680px]">
                HoopsIQ is a production-grade architecture reference for a modular
                basketball platform — Player App, Coach HQ, Team Management, Expert
                Marketplace, AI Feedback, Film Room, Playbook Studio, Live Classes, and
                a Stripe-backed billing engine. These are the {total} canonical specs
                the engineering team builds against.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/docs/architecture" asChild>
                  <a className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-primary text-primary-foreground hover:bg-[oklch(0.82_0.17_75)] transition-colors text-[14px] font-semibold uppercase tracking-[0.05em]">
                    Start with Architecture
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </Link>
                <Link href="/docs/schema" asChild>
                  <a className="inline-flex items-center gap-2 h-11 px-5 rounded-md border border-border text-foreground hover:bg-[oklch(0.18_0.005_260)] transition-colors text-[14px] font-semibold uppercase tracking-[0.05em]">
                    Jump to Schema
                  </a>
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border border-border max-w-2xl">
                <Stat label="Specifications" value={String(total)} />
                <Stat label="Product Modules" value="8" />
                <Stat label="User Roles" value="9" />
                <Stat label="Words" value={`${kWords}k`} />
              </div>
            </div>
          </section>

          {/* CHAPTERS */}
          <section className="max-w-[1100px] mx-auto px-6 lg:px-12 py-20">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="mono-pill mb-3 inline-block">INDEX</div>
                <h2 className="display text-3xl text-foreground">
                  Five chapters. Seventeen specifications.
                </h2>
              </div>
            </div>

            <div className="space-y-14">
              {chapters.map((chapter) => {
                const Icon = chapterIcon[chapter.id] || FileText;
                return (
                  <div key={chapter.id}>
                    <div className="flex items-baseline gap-4 mb-5">
                      <div className="w-9 h-9 rounded-md border border-border bg-[oklch(0.17_0.005_260)] flex items-center justify-center text-primary">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                          Chapter
                        </div>
                        <h3 className="display text-2xl text-foreground">
                          {chapter.label}
                        </h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {chapter.docs.map((doc) => (
                        <Link key={doc.slug} href={`/docs/${doc.slug}`} asChild>
                          <a className="group relative block rounded-lg border border-border bg-[oklch(0.15_0.005_260)] p-5 hover:border-primary/40 hover:bg-[oklch(0.17_0.005_260)] transition-all duration-200">
                            <div className="absolute top-0 left-5 right-5 h-[2px] bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/60 transition-all" />
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-mono text-[11px] tracking-[0.08em] text-primary/80">
                                PROMPT {doc.prompt}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {doc.minutes} min
                              </span>
                            </div>
                            <h4 className="display text-[17px] text-foreground leading-tight mb-2">
                              {doc.title}
                            </h4>
                            <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-3">
                              {doc.summary}
                            </p>
                            <div className="mt-4 flex items-center gap-1.5 text-[12px] text-primary/80 font-medium">
                              Read
                              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </a>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* FOOTER */}
          <footer className="border-t border-border mt-12">
            <div className="max-w-[1100px] mx-auto px-6 lg:px-12 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="text-[12.5px] text-muted-foreground leading-relaxed">
                <div className="display text-[15px] text-foreground mb-1">HoopsIQ</div>
                Canonical architecture and engineering documentation.
                <br />
                Built as the source of truth for every module, prompt, and surface.
              </div>
              <div className="flex items-center gap-5 text-[12px] text-muted-foreground">
                <Link href="/docs/architecture" asChild>
                  <a className="hover:text-foreground">Architecture</a>
                </Link>
                <Link href="/docs/schema" asChild>
                  <a className="hover:text-foreground">Schema</a>
                </Link>
                <Link href="/docs/design-system" asChild>
                  <a className="hover:text-foreground">Design System</a>
                </Link>
                <Link href="/docs/billing" asChild>
                  <a className="hover:text-foreground">Billing</a>
                </Link>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-5">
      <div className="display text-3xl text-foreground">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
}
