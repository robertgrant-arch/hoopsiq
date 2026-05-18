import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";
import { ArrowLeft, ArrowRight, ChevronRight, Clock, Hash } from "lucide-react";

import DocsSidebar from "@/components/DocsSidebar";
import DocsTopBar from "@/components/DocsTopBar";
import { getDocBySlug, getChapterForDoc, getNeighbors, type DocEntry } from "@/lib/docs";

type TocItem = { id: string; text: string; level: 2 | 3 };

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function extractToc(md: string): TocItem[] {
  const toc: TocItem[] = [];
  const lines = md.split("\n");
  let inFence = false;
  for (const line of lines) {
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m2 = line.match(/^##\s+(.+?)\s*$/);
    if (m2) {
      toc.push({ id: slugifyHeading(m2[1]), text: m2[1], level: 2 });
      continue;
    }
    const m3 = line.match(/^###\s+(.+?)\s*$/);
    if (m3) {
      toc.push({ id: slugifyHeading(m3[1]), text: m3[1], level: 3 });
    }
  }
  return toc;
}

export default function DocPage() {
  const [match, params] = useRoute("/docs/:slug");
  const slug = match ? params?.slug : undefined;
  const doc: DocEntry | undefined = slug ? getDocBySlug(slug) : undefined;
  const chapter = slug ? getChapterForDoc(slug) : undefined;
  const neighbors = slug ? getNeighbors(slug) : { prev: undefined, next: undefined };

  const toc = useMemo(() => (doc ? extractToc(doc.content) : []), [doc]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [slug]);

  useEffect(() => {
    if (!toc.length) return;
    const handler = () => {
      const offset = 120;
      let current: string | null = null;
      for (const item of toc) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top - offset <= 0) current = item.id;
      }
      setActiveId(current || toc[0]?.id || null);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [toc]);

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Document not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DocsTopBar />

      <div className="flex">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-[280px] shrink-0 border-r border-border sticky top-16 h-[calc(100vh-4rem)]">
          <DocsSidebar currentSlug={slug} />
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <div className="max-w-[780px] mx-auto px-6 lg:px-12 py-12 fade-in">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground mb-6">
              <Link href="/" asChild>
                <a className="hover:text-foreground transition-colors">HoopsOS</a>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span>{chapter?.label}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span className="text-foreground">{doc.shortTitle}</span>
            </div>

            {/* Header */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="mono-pill text-primary/90 border-primary/20 !bg-[oklch(0.78_0.17_75/0.08)]">
                  PROMPT {doc.prompt}
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {doc.minutes} min read
                </span>
              </div>
              <h1 className="display text-4xl md:text-5xl leading-[1.08] tracking-tight">
                {doc.title}
              </h1>
              <p className="mt-4 text-[16.5px] text-muted-foreground leading-relaxed max-w-[640px]">
                {doc.summary}
              </p>
            </div>

            <div className="hairline mb-10" />

            {/* Rendered markdown */}
            <article className="prose-doc">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  h1: () => null, // suppress duplicate H1 from markdown
                  h2: ({ children }) => {
                    const text = String(children);
                    return <h2 id={slugifyHeading(text)}>{children}</h2>;
                  },
                  h3: ({ children }) => {
                    const text = String(children);
                    return <h3 id={slugifyHeading(text)}>{children}</h3>;
                  },
                  a: ({ href, children }) => (
                    <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {doc.content}
              </ReactMarkdown>
            </article>

            {/* Prev / Next */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4">
              {neighbors.prev ? (
                <Link href={`/docs/${neighbors.prev.slug}`} asChild>
                  <a className="group rounded-lg border border-border p-5 hover:border-primary/40 hover:bg-[oklch(0.17_0.005_260)] transition-all">
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-2">
                      <ArrowLeft className="w-3.5 h-3.5" /> Previous
                    </div>
                    <div className="display text-base text-foreground">
                      {neighbors.prev.shortTitle}
                    </div>
                  </a>
                </Link>
              ) : (
                <div />
              )}
              {neighbors.next && (
                <Link href={`/docs/${neighbors.next.slug}`} asChild>
                  <a className="group rounded-lg border border-border p-5 hover:border-primary/40 hover:bg-[oklch(0.17_0.005_260)] transition-all text-right">
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-2 justify-end">
                      Next <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                    <div className="display text-base text-foreground">
                      {neighbors.next.shortTitle}
                    </div>
                  </a>
                </Link>
              )}
            </div>
          </div>
        </main>

        {/* Right TOC */}
        <aside className="hidden xl:block w-[260px] shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto doc-scroll py-12 pr-8">
          {toc.length > 0 && (
            <>
              <div className="display text-[11px] tracking-[0.14em] text-muted-foreground/80 mb-3 flex items-center gap-2">
                <Hash className="w-3 h-3" /> On this page
              </div>
              <ul className="space-y-1 text-[13px]">
                {toc.map((item) => (
                  <li
                    key={item.id}
                    style={{ paddingLeft: item.level === 3 ? "0.9rem" : 0 }}
                  >
                    <a
                      href={`#${item.id}`}
                      className={
                        "block py-1 border-l-2 pl-3 -ml-[2px] transition-all duration-150 " +
                        (activeId === item.id
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground")
                      }
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
