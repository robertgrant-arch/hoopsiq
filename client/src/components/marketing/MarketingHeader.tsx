import { Link, useLocation } from "wouter";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/lib/auth";
import { ROLE_META } from "@/lib/mock/users";

const links = [
  { href: "/players", label: "Players" },
  { href: "/coaches", label: "Coaches" },
  { href: "/teams", label: "Teams" },
  { href: "/experts", label: "Experts" },
  { href: "/live", label: "Live" },
  { href: "/pricing", label: "Pricing" },
];

export function MarketingHeader() {
  const [loc] = useLocation();
  const { user } = useAuth();

  return (
    <div className="sticky top-0 z-40">
      {/* Demo banner */}
      <Link href="/sign-in" asChild>
        <a
          className="block w-full bg-primary text-primary-foreground text-center text-[12px] font-mono uppercase tracking-[0.14em] py-2 hover:brightness-110 transition"
        >
          ▶ This is a demo · Click any role on Sign-in to use the actual app — no password, no signup
        </a>
      </Link>
      <header className="h-16 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="h-full max-w-[1400px] mx-auto px-5 lg:px-8 flex items-center gap-8">
        <Logo />
        <nav className="hidden md:flex items-center gap-7 flex-1">
          {links.map((l) => {
            const active = loc === l.href;
            return (
              <Link key={l.href} href={l.href} asChild>
                <a
                  className={`text-[13.5px] font-medium transition-colors ${
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.label}
                </a>
              </Link>
            );
          })}
        </nav>
        <div className="hidden md:flex items-center gap-3 ml-auto">
          <Link href="/docs" asChild>
            <a className="text-[13px] text-muted-foreground hover:text-foreground">
              Docs
            </a>
          </Link>
          {user ? (
            <Link href={ROLE_META[user.role].home} asChild>
              <a className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.08em] hover:brightness-110 transition">
                Open {ROLE_META[user.role].label} App
              </a>
            </Link>
          ) : (
            <>
              <Link href="/sign-in" asChild>
                <a className="text-[13px] font-medium text-foreground hover:text-primary transition-colors">
                  Sign in
                </a>
              </Link>
              <Link href="/sign-in" asChild>
                <a className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.08em] hover:brightness-110 transition">
                  Open Demo App
                </a>
              </Link>
            </>
          )}
        </div>
      </div>
      </header>
    </div>
  );
}
