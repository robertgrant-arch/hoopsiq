/**
 * features/player-development/components/CoachFeedbackCard.tsx
 *
 * Shows the 2 most recent coach feedback entries (film notes, monthly reviews,
 * observations). Tapping a film clip link navigates to the specific clip.
 */

import { Link } from "wouter";
import { Film, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CoachFeedback, FeedbackType } from "../types";

const TYPE_LABELS: Record<FeedbackType, string> = {
  film_note:      "Film Note",
  monthly_review: "Monthly Review",
  observation:    "Observation",
  milestone:      "Milestone",
};

const TYPE_COLORS: Record<FeedbackType, string> = {
  film_note:      "bg-primary/10 text-primary border-primary/25",
  monthly_review: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
  observation:    "bg-amber-500/10 text-amber-600 border-amber-500/25",
  milestone:      "bg-violet-500/10 text-violet-600 border-violet-500/25",
};

interface CoachFeedbackCardProps {
  feedback: CoachFeedback[];   // pass all; card shows first 2
}

export function CoachFeedbackCard({ feedback }: CoachFeedbackCardProps) {
  const visible = feedback.slice(0, 2);

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[13px] text-muted-foreground font-medium mb-1">Coach Feedback</p>
        <p className="text-[12.5px] text-muted-foreground">No feedback yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-4">
        Coach Feedback
      </div>

      <div className="flex flex-col gap-5">
        {visible.map((fb, i) => (
          <div key={fb.id}>
            {/* Author row */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                {fb.coachInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[12px] font-semibold">{fb.coachName}</span>
                  <Badge
                    variant="outline"
                    className={`text-[9.5px] px-1.5 py-0 ${TYPE_COLORS[fb.type]}`}
                  >
                    {TYPE_LABELS[fb.type]}
                  </Badge>
                </div>
                <div className="text-[10.5px] text-muted-foreground font-mono">{fb.date}</div>
              </div>
            </div>

            {/* Body */}
            <p className="text-[12.5px] text-muted-foreground leading-relaxed pl-9">
              {fb.text}
            </p>

            {/* Film clip link */}
            {fb.linkedClip && (
              <Link href={fb.linkedClip.href} asChild>
                <a className="inline-flex items-center gap-1.5 text-[11.5px] text-primary hover:underline pl-9 mt-1.5">
                  <Film className="w-3 h-3" />
                  {fb.linkedClip.title}
                  <ChevronRight className="w-3 h-3" />
                </a>
              </Link>
            )}

            {/* Divider (not after last item) */}
            {i < visible.length - 1 && (
              <div className="border-b border-border/50 mt-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
