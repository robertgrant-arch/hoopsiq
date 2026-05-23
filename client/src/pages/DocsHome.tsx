import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import DocsTopBar from "@/components/DocsTopBar";
import DocsSidebar from "@/components/DocsSidebar";
import { chapters, allDocs } from "@/lib/docs";

export default function DocsHome() {
  const totalWords = allDocs.reduce(
    (sum, d) => sum + d.content.split(/\s+/).length,
    0
  );
  const approxK = Math.round(totalWords / 1000);

  return (
    <div className="min-h-screen">
      <DocsTopBar />
      <div className="flex">
        <aside className="hidden lg:block w-[280px] shrink-0 sticky top-16 h-[calc(100vh-4rem)] border-r border-border">
          <DocsSidebar />
        </aside>
        <main className="flex-1 min-w-0">
          <div className="max-w-[880px] mx-auto px-6 lg:px-10 py-16 fade-in">
            <div className="flex items-center gap-3 mb-8">
              <span className="mono-pill text-primary border-primary/25 bg-primary/10">
                V1.0 · CANONICAL
              </span>
              <span className="mono-pill">APRIL 2026</span>
            </div>

            <h1 className="display text-[clamp(2.5rem,5.5vw,4.2rem)] leading-[0.95] mb-6">
              The Unified Basketball
              <br />
              Development IQ,
              <br />
              <span className="text-primary">Specified End-to-End.</span>
            </h1>

            <p className="text-[17px] leading-relaxed text-muted-foreground max-w-[620px] mb-10">
              HoopsIQ is a production-grade architecture reference for a modular
              basketball platform — Player App, Coach HQ, Team Management,
              Expert Marketplace, AI Feedback, Film Room, Playbook Studio, Live
              Classes, and a Stripe-backed billing engine. These are the 17
              canonical specs the engineering team builds against.
            </p>

            <div className="flex flex-wrap gap-3 mb-16">
              <Link href="/docs/architecture" asChild>
                <a className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-primary text-primary-foreground font-semibold text-[13px] uppercase tracking-[0.08em] hover:brightness-110 transition">
                  Start with Architecture <ArrowRight className="w-4 h-4" />
                </a>
              </Link>
              <Link href="/docs/schema" asChild>
                <a className="inline-flex items-center gap-2 h-11 px-5 rounded-md border border-border bg-background hover:bg-[oklch(0.18_0.005_260)] text-[13px] font-semibold uppercase tracking-[0.08em] transition">
                  Jump to Schema
                </a>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              {[
                { k: "17", v: "Canonical Specs" },
                { k: "8", v: "Bounded Modules" },
                { k: "9", v: "User Roles" },
                { k: `${approxK}K`, v: "Words of Spec" },
              ].map((s) => (
                <div
                  key={s.v}
                  className="rounded-md border border-border bg-card p-4"
                >
                  <div className="display text-3xl text-primary">{s.k}</div>
                  <div className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground mt-1">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>

            {chapters.map((c) => (
              <section key={c.id} className="mb-14">
                <div className="flex items-baseline justify-between mb-5 pb-3 border-b border-border">
                  <h2 className="display text-xl tracking-[0.04em]">
                    {c.label}
                  </h2>
                  <span className="text-[12px] text-muted-foreground">
                    {c.docs.length} {c.docs.length === 1 ? "doc" : "docs"}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {c.docs.map((d) => (
                    <Link key={d.slug} href={`/docs/${d.slug}`} asChild>
                      <a className="block rounded-md border border-border bg-card hover:bg-[oklch(0.18_0.005_260)] p-4 transition group">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
                            PROMPT {d.prompt}
                          </span>
                          <span className="text-[10.5px] text-muted-foreground">
                            {d.minutes} min
                          </span>
                        </div>
                        <div className="display text-[17px] tracking-[0.01em] group-hover:text-primary transition-colors mb-1.5">
                          {d.title}
                        </div>
                        <p className="text-[13.5px] text-muted-foreground leading-relaxed line-clamp-3">
                          {d.summary}
                        </p>
                      </a>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
