/**
 * QuietHoursModal — emergency override form for quiet-hours policy.
 *
 * Shown when a coach tries to send to a minor-protected thread outside
 * allowed hours.  Requires a valid emergency reason enum value and a
 * free-text note (min 10 characters) before the override can be submitted.
 *
 * The parent (`NewBroadcastDialog`) owns the actual send — this modal
 * just collects the override data and calls `onConfirm(override)`.
 *
 * Accessibility: traps focus, announces role="dialog", Escape to cancel.
 */

import { useState } from "react";
import { AlertOctagon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button }   from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label }    from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type EmergencyReason,
  type EmergencyOverride,
  EMERGENCY_REASON_LABELS,
  VALID_EMERGENCY_REASONS,
  EMERGENCY_NOTE_MIN_LENGTH,
} from "./quiet-hours-types";

interface QuietHoursModalProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  policyWindow:  string;
  localOrgTime:  string;
  onConfirm:     (override: EmergencyOverride) => void;
  onQueue:       () => void;
  submitting?:   boolean;
}

export function QuietHoursModal({
  open,
  onOpenChange,
  policyWindow,
  localOrgTime,
  onConfirm,
  onQueue,
  submitting = false,
}: QuietHoursModalProps) {
  const [reason, setReason] = useState<EmergencyReason | "">("");
  const [note,   setNote]   = useState("");

  const noteLength    = note.trim().length;
  const noteValid     = noteLength >= EMERGENCY_NOTE_MIN_LENGTH;
  const canSubmit     = reason !== "" && noteValid && !submitting;

  function handleConfirm() {
    if (!canSubmit || reason === "") return;
    onConfirm({ reason, note: note.trim() });
  }

  function handleQueue() {
    onQueue();
    onOpenChange(false);
  }

  function handleOpenChange(next: boolean) {
    if (!submitting) onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-500/15">
              <AlertOctagon className="w-4 h-4 text-orange-400" />
            </span>
            <DialogTitle className="text-[14px] font-semibold tracking-tight">
              Outside Allowed Hours
            </DialogTitle>
          </div>
          <p className="text-[11.5px] text-muted-foreground mt-1.5 ml-9">
            Current time: <span className="text-foreground/80 font-medium">{localOrgTime}</span>.
            Messages to minor athletes are only allowed between{" "}
            <span className="text-foreground/80 font-medium">{policyWindow}</span>.
          </p>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {/* Queue option */}
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-sky-400 shrink-0" />
            <div>
              <div className="text-[12px] font-medium text-foreground">
                Schedule for next window
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Your message will be saved and sent automatically when the
                policy window opens. No further action required.
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 h-7 text-[11.5px] px-3"
                onClick={handleQueue}
                disabled={submitting}
              >
                Schedule for Later
              </Button>
            </div>
          </div>

          {/* Emergency override option */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono px-2">
                Or send with emergency override
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.13em] font-mono text-muted-foreground">
                Emergency reason <span className="text-red-400">*</span>
              </Label>
              <Select
                value={reason}
                onValueChange={(v) => setReason(v as EmergencyReason)}
                disabled={submitting}
              >
                <SelectTrigger className="h-8 text-[12.5px]">
                  <SelectValue placeholder="Select a reason…" />
                </SelectTrigger>
                <SelectContent>
                  {VALID_EMERGENCY_REASONS.map((r) => (
                    <SelectItem key={r} value={r} className="text-[12.5px]">
                      {EMERGENCY_REASON_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-[0.13em] font-mono text-muted-foreground">
                  Emergency note <span className="text-red-400">*</span>
                </Label>
                <span
                  className={`text-[10px] tabular-nums ${noteValid ? "text-emerald-400" : "text-muted-foreground"}`}
                >
                  {noteLength}/{EMERGENCY_NOTE_MIN_LENGTH} min
                </span>
              </div>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Briefly describe the emergency situation that requires sending outside normal hours…"
                className="resize-none text-[12.5px] min-h-[72px]"
                rows={3}
                disabled={submitting}
              />
              {!noteValid && note.length > 0 && (
                <p className="text-[10.5px] text-amber-400">
                  Note must be at least {EMERGENCY_NOTE_MIN_LENGTH} characters.
                </p>
              )}
            </div>

            <div className="text-[10.5px] text-muted-foreground bg-muted/30 rounded px-3 py-2">
              Emergency overrides are logged and reviewed by program administrators.
              Only use for genuine time-sensitive emergencies.
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-3.5 border-t border-border flex items-center gap-2">
          <Button
            variant="ghost"
            className="text-[12px] h-8 px-3 text-muted-foreground"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="h-8 text-[12px] px-4 gap-1.5 bg-orange-600 hover:bg-orange-500 text-white"
          >
            {submitting ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <AlertOctagon className="w-3.5 h-3.5" />
                Send Emergency Override
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
