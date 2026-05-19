/**
 * features/workout-log/components/SelfLogForm.tsx
 *
 * Compact form to log extra development work outside the assigned WOD.
 * Design: mobile-first, fast — 3 fields, one tap to submit.
 * Collapsed by default; expands on tap.
 */

import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { toast } from "sonner";
import type { SelfLogInput, SelfLogCategory } from "../types";
import { SELF_LOG_CATEGORY_META } from "../types";

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const MUTED   = "oklch(0.55 0.02 260)";

const CATEGORIES: SelfLogCategory[] = [
  "shooting", "finishing", "ball_handling", "decision_making",
  "footwork", "defensive_habits", "physical_readiness", "discipline",
];

const DURATION_PRESETS = [15, 20, 30, 45, 60];

interface SelfLogFormProps {
  onSubmit: (input: SelfLogInput) => void;
}

export function SelfLogForm({ onSubmit }: SelfLogFormProps) {
  const [open,     setOpen]     = useState(false);
  const [title,    setTitle]    = useState("");
  const [category, setCategory] = useState<SelfLogCategory>("shooting");
  const [duration, setDuration] = useState(20);

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("Add a title so your coach knows what you worked on.");
      return;
    }
    onSubmit({ title: title.trim(), category, durationMinutes: duration });
    toast.success("Extra work logged! Every rep counts.");
    setTitle("");
    setCategory("shooting");
    setDuration(20);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border border-dashed border-border bg-card hover:bg-muted/30 transition-colors text-left"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${PRIMARY}15`, color: PRIMARY }}
        >
          <Plus className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[13px] font-semibold">Log extra work</div>
          <div className="text-[11.5px]" style={{ color: MUTED }}>
            Shooting, gym, film — anything you did outside today's WOD
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-[10.5px] font-mono uppercase tracking-[0.12em]" style={{ color: PRIMARY }}>
          Log extra work
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <div>
        <div className="text-[10.5px]" style={{ color: MUTED, marginBottom: 4 }}>What did you work on?</div>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 200 makes — corner 3s"
          className="w-full h-10 px-3 text-[13px] rounded-xl border border-border bg-background focus:outline-none focus:ring-1"
          style={{ "--tw-ring-color": PRIMARY } as any}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>

      {/* Skill category pill selector */}
      <div>
        <div className="text-[10.5px] mb-2" style={{ color: MUTED }}>Skill focus</div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const meta   = SELF_LOG_CATEGORY_META[cat];
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] border transition-all"
                style={active
                  ? { backgroundColor: `${PRIMARY}15`, borderColor: `${PRIMARY}50`, color: PRIMARY, fontWeight: 600 }
                  : { borderColor: "var(--color-border)", color: MUTED }
                }
              >
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration presets */}
      <div>
        <div className="text-[10.5px] mb-2" style={{ color: MUTED }}>
          Duration — {duration} min
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {DURATION_PRESETS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className="px-2.5 py-1 rounded-full text-[11.5px] border transition-all"
              style={duration === d
                ? { backgroundColor: `${PRIMARY}15`, borderColor: `${PRIMARY}50`, color: PRIMARY, fontWeight: 600 }
                : { borderColor: "var(--color-border)", color: MUTED }
              }
            >
              {d} min
            </button>
          ))}
          {/* Custom duration nudge */}
          <input
            type="number"
            min={1}
            max={180}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-16 h-7 px-2 text-[12px] text-center rounded-lg border border-border bg-background focus:outline-none"
            aria-label="Custom duration in minutes"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!title.trim()}
        className="flex items-center justify-center gap-2 h-10 rounded-xl text-[13.5px] font-semibold transition-all"
        style={{
          backgroundColor: title.trim() ? SUCCESS : "var(--color-muted)",
          color:           title.trim() ? "#fff" : MUTED,
        }}
      >
        <Check className="w-4 h-4" />
        Log it
      </button>
    </div>
  );
}
