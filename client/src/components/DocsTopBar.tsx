import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Command, Github, Menu } from "lucide-react";
import SearchDialog from "@/components/SearchDialog";
import DocsSidebar from "@/components/DocsSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function DocsTopBar({ currentSlug }: { currentSlug?: string }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
        <div className="h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile nav */}
            <Sheet>
              <SheetTrigger className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground">
                <Menu className="w-5 h-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0 border-border">
                <DocsSidebar currentSlug={currentSlug} />
              </SheetContent>
            </Sheet>

            <Link href="/" asChild>
              <a className="flex items-center gap-2.5 group">
                <LogoMark />
                <div className="leading-none">
                  <div className="display text-[17px] tracking-[0.02em] text-foreground">
                    HoopsIQ
                  </div>
                  <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground/80 mt-0.5">
                    Architecture Docs
                  </div>
                </div>
              </a>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-3 h-9 w-[260px] rounded-md border border-border bg-[oklch(0.16_0.005_260)] hover:bg-[oklch(0.19_0.005_260)] px-3 text-[13px] text-muted-foreground transition-colors"
            >
              <Command className="w-3.5 h-3.5" />
              <span>Search docs…</span>
              <span className="ml-auto flex items-center gap-1 font-mono text-[11px]">
                <kbd className="rounded border border-border bg-background/50 px-1.5 py-0.5 text-[10px]">
                  ⌘
                </kbd>
                <kbd className="rounded border border-border bg-background/50 px-1.5 py-0.5 text-[10px]">
                  K
                </kbd>
              </span>
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              aria-label="Search"
            >
              <Command className="w-5 h-5" />
            </button>

            <a
              href="https://github.com/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-[oklch(0.17_0.005_260)] transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

function LogoMark() {
  return (
    <div className="relative w-9 h-9 rounded-[8px] bg-[oklch(0.18_0.005_260)] border border-border flex items-center justify-center overflow-hidden group-hover:border-primary/40 transition-colors">
      <svg
        viewBox="0 0 32 32"
        className="w-5 h-5"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="h-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.82 0.17 75)" />
            <stop offset="100%" stopColor="oklch(0.65 0.18 50)" />
          </linearGradient>
        </defs>
        <rect
          x="5"
          y="4"
          width="5"
          height="24"
          rx="1.5"
          fill="url(#h-grad)"
        />
        <rect
          x="22"
          y="4"
          width="5"
          height="24"
          rx="1.5"
          fill="url(#h-grad)"
        />
        <rect x="5" y="13.5" width="22" height="5" fill="url(#h-grad)" />
      </svg>
    </div>
  );
}
