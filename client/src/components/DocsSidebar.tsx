import { Link, useLocation } from "wouter";
import { chapters } from "@/lib/docs";
import { cn } from "@/lib/utils";

export default function DocsSidebar({ currentSlug }: { currentSlug?: string }) {
  const [location] = useLocation();
  const isHome = location === "/docs" || location === "/docs/";

  return (
    <nav className="h-full overflow-y-auto doc-scroll py-8 px-5 text-[13.5px]">
      <Link href="/docs" asChild>
        <a
          className={cn(
            "block px-3 py-1.5 rounded-md transition-colors mb-4",
            isHome
              ? "bg-[oklch(0.2_0.005_260)] text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-[oklch(0.18_0.005_260)]"
          )}
        >
          <span className="text-[12px] uppercase tracking-[0.08em] font-semibold opacity-70">
            Introduction
          </span>
          <div className="mt-0.5">Overview</div>
        </a>
      </Link>

      {chapters.map((chapter) => (
        <div key={chapter.id} className="mb-5">
          <div className="display text-[11px] tracking-[0.14em] text-muted-foreground/80 px-3 pb-2 mt-1">
            {chapter.label}
          </div>
          <ul className="space-y-0.5">
            {chapter.docs.map((doc) => {
              const active = currentSlug === doc.slug;
              return (
                <li key={doc.slug}>
                  <Link href={`/docs/${doc.slug}`} asChild>
                    <a
                      className={cn(
                        "group relative flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-md transition-all duration-150",
                        active
                          ? "text-foreground bg-[oklch(0.2_0.005_260)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-[oklch(0.17_0.005_260)]"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-primary" />
                      )}
                      <span className="font-mono text-[10.5px] tracking-[0.05em] tabular-nums w-6 shrink-0 text-muted-foreground/70 group-hover:text-muted-foreground">
                        {doc.prompt}
                      </span>
                      <span className="truncate">{doc.shortTitle}</span>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="hairline my-6" />
      <div className="px-3 text-[11.5px] text-muted-foreground/70 space-y-1.5 leading-relaxed">
        <p>17 canonical specs · 6,300+ lines of markdown.</p>
        <p>Updated April 2026.</p>
      </div>
    </nav>
  );
}
