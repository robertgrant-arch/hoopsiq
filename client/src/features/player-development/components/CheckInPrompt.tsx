/**
 * features/player-development/components/CheckInPrompt.tsx
 *
 * Shown when the player has not yet submitted today's readiness check-in.
 * Subtle card with a single CTA — does not block other content.
 */

import { Link } from "wouter";
import { Activity, ArrowRight } from "lucide-react";

export function CheckInPrompt() {
  return (
    <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 flex items-center gap-4">
      <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
        <Activity className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold mb-0.5">How are you feeling today?</div>
        <div className="text-[11.5px] text-muted-foreground">
          Submit your daily check-in so your coach knows your status.
        </div>
      </div>
      <Link href="/app/player/checkin" asChild>
        <a
          className="shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold hover:brightness-110 transition"
          aria-label="Submit today's check-in"
        >
          Check in
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </Link>
    </div>
  );
}
