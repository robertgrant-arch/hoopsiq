import { Link } from "wouter";

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <Link href="/" asChild>
      <a className="flex items-center gap-2.5 group">
        <div
          className="flex items-center justify-center rounded-[6px] bg-primary shadow-[0_0_30px_-6px_rgba(255,153,0,0.6)]"
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
          <span className="display text-[15px] tracking-[0.04em]">HOOPSIQ</span>
          <span className="text-[9.5px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            Basketball IQ
          </span>
        </div>
      </a>
    </Link>
  );
}
