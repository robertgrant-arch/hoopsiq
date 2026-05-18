import { Link } from "wouter";
import { Logo } from "@/components/brand/Logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-16 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 md:col-span-2">
          <Logo />
          <p className="text-[13px] text-muted-foreground max-w-xs mt-4 leading-relaxed">
            The unified operating system for modern basketball — from rec-league
            point guards to Division I programs.
          </p>
          <p className="text-[11px] text-muted-foreground mt-6 font-mono uppercase tracking-[0.1em]">
            © 2026 HoopsOS Inc. · Austin, TX
          </p>
        </div>
        <FooterCol
          title="Product"
          links={[
            { href: "/players", label: "For Players" },
            { href: "/coaches", label: "For Coaches" },
            { href: "/teams", label: "For Teams" },
            { href: "/experts", label: "For Experts" },
            { href: "/live", label: "Live Classes" },
            { href: "/pricing", label: "Pricing" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { href: "/about", label: "About" },
            { href: "/contact", label: "Contact" },
            { href: "/docs", label: "Architecture Docs" },
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            { href: "/legal/terms", label: "Terms" },
            { href: "/legal/privacy", label: "Privacy" },
            { href: "/legal/youth", label: "Youth Safety (COPPA)" },
            { href: "/legal/a11y", label: "Accessibility" },
          ]}
        />
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-4 font-mono">
        {title}
      </div>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} asChild>
              <a className="text-[13px] text-foreground/80 hover:text-primary transition-colors">
                {l.label}
              </a>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
