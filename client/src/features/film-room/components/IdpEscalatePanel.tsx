/**
 * Film Room v2 — "Add to IDP" escalation panel.
 * Copy per docs/film-room-copy.md § IDP escalation panel.
 */

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useEscalateToIdp } from "../hooks";
import { ACCENT, MUTED, RegionError } from "./shared";

const FOCUS_PRESETS = ["Closeouts", "Spacing", "Transition", "Finishing", "Ball pressure"];

export function IdpEscalatePanel({
  open,
  onOpenChange,
  playerName,
  assignmentPlayerId,
  notePrefill = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerName: string;
  assignmentPlayerId: string;
  notePrefill?: string;
}) {
  const escalate = useEscalateToIdp(assignmentPlayerId);
  const [focusArea, setFocusArea] = useState("");
  const [note, setNote] = useState(notePrefill);

  // Reset fields each time the panel opens for a (possibly different) target.
  useEffect(() => {
    if (open) {
      setFocusArea("");
      setNote(notePrefill);
      escalate.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, assignmentPlayerId, notePrefill]);

  const firstName = playerName.split(" ")[0] || playerName;

  const confirm = () => {
    if (!focusArea.trim() || escalate.isPending) return;
    escalate.mutate(
      { focusArea: focusArea.trim(), note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`Added to ${firstName}'s IDP.`);
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add to IDP</SheetTitle>
          <SheetDescription>
            This clip becomes evidence on {playerName}'s development plan.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="idp-focus-area"
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: MUTED }}
            >
              Focus area
            </label>
            <input
              id="idp-focus-area"
              type="text"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-[13px] outline-none focus:border-[oklch(0.72_0.18_290)]"
              placeholder="e.g. Closeouts"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {FOCUS_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFocusArea(preset)}
                  className="text-[11px] px-2 py-0.5 rounded-full border transition-colors"
                  style={
                    focusArea === preset
                      ? {
                          color: ACCENT,
                          borderColor: ACCENT,
                          background: "oklch(0.72 0.18 290 / 0.12)",
                        }
                      : { color: MUTED, borderColor: "oklch(0.30 0.01 260)" }
                  }
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="idp-why"
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: MUTED }}
            >
              Why this clip
            </label>
            <textarea
              id="idp-why"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-[13px] outline-none resize-y focus:border-[oklch(0.72_0.18_290)]"
            />
          </div>

          {escalate.isError && (
            <RegionError
              message="Couldn't add this to the IDP."
              onRetry={confirm}
            />
          )}

          <button
            type="button"
            onClick={confirm}
            disabled={!focusArea.trim() || escalate.isPending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-[13px] font-semibold text-black transition-opacity disabled:opacity-40"
            style={{ background: ACCENT }}
          >
            {escalate.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Add to {firstName}'s IDP
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
