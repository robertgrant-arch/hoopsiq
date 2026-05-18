import { Link } from "wouter";

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <Link href="/" asChild>
      <a className="flex items-center gap-2.5 group">
        <div
          className="flex items-center justify-center rounded-[6px] bg-primary shadow-[0_0_30px_-6px_oklch(0.78_0.18_75/0.45)] group-hover:shadow-[0_0_40px_-4px_oklch(0.78_0.18_75/0.65)] transition-all"
          style={{ width: size, height: size }}
        >
          <span
            className="display text-black"
            style={{ fontSize: size * 0.55, lineHeight: 1 }}
          >
            H
          </span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="display text-[15px] tracking-[0.04em]">HOOPSOS</span>
          <span className="text-[9.5px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            Basketball OS
          </span>
        </div>
      </a>
    </Link>
  );
}
