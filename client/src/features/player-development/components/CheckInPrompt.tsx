/**
 * features/player-development/components/CheckInPrompt.tsx
 *
 * Shown when the player has not yet submitted today's readiness check-in.
 * Subtle card with a single CTA — does not block other content.
 */

import { Link } from "wouter";
import { Zap, ArrowRight } from "lucide-react";

export function CheckInPrompt() {
  return (
    <Link href="/app/player/checkin" asChild>
      <a className="rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 flex items-center gap-3.5 hover:bg-amber-500/8 transition-colors active:scale-[0.99]">
        <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
          <Zap className="w-4.5 h-4.5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold mb-0.5">Start your day right</div>
          <div className="text-[12px] text-muted-foreground">
            30-second check-in · helps your coach plan your session
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-amber-500 shrink-0" />
      </a>
    </Link>
  );
}
