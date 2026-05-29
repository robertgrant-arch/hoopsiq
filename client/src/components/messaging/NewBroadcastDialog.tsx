/**
 * NewBroadcastDialog — compose dialog for targeted audience messaging.
 *
 * Handles:
 *   1. Recipient targeting (RecipientSelector)
 *   2. Live audience preview (AudienceSummaryBar)
 *   3. Message composition
 *   4. Send to POST /api/messages/compose
 *
 * Opens as a Dialog modal to keep the compose flow focused and explicit.
 * The recipient summary is always visible above the send action — the coach
 * must see who they're sending to before they can submit.
 */
import { useState, useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button }   from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast }    from "sonner";
import { apiFetch } from "@/lib/api/client";
import type { RosterAthlete } from "@/lib/mock/data";
import { RecipientSelector }  from "./RecipientSelector";
import { AudienceSummaryBar } from "./AudienceSummaryBar";
import { BlockedSendBanner }  from "./SafetyPolicyBanner";
import { OutsideHoursWarning, MessageQueuedBanner, EmergencySentBanner } from "./QuietHoursBanner";
import { QuietHoursModal }    from "./QuietHoursModal";
import {
  type RecipientSpec,
  type ResolvedAudience,
  type GuardianEntry,
  defaultRecipientSpec,
} from "./types";
import {
  type EmergencyOverride,
  type QuietHoursResponsePolicy,
} from "./quiet-hours-types";

// Mock guardians derived from roster isMinor flag.
// In production this comes from GET /api/roster/guardians.
// Assumption: guardian API endpoint returns GuardianEntry[].
function buildMockGuardians(roster: RosterAthlete[]): GuardianEntry[] {
  return roster
    .filter((p) => p.isMinor)
    .map((p, i) => ({
      id:                 `g_${p.id}`,
      playerId:           p.id,
      playerName:         p.name,
      name:               `${p.name.split(" ")[1] ?? p.name} Sr.`,
      email:              `parent_${i}@example.com`,
      phone:              `+1555${String(i).padStart(7, "0")}`,
      relationship:       "parent",
      isPrimary:          true,
      canReceiveMessages: true,
    }));
}

interface NewBroadcastDialogProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  onCreated:     (threadId: string, label: string) => void;
  roster:        RosterAthlete[];
}

export function NewBroadcastDialog({
  open,
  onOpenChange,
  onCreated,
  roster,
}: NewBroadcastDialogProps) {
  const [spec,     setSpec]     = useState<RecipientSpec>(defaultRecipientSpec());
  const [title,    setTitle]    = useState("");
  const [body,     setBody]     = useState("");
  const [audience, setAudience] = useState<ResolvedAudience | null>(null);
  const [previewLoading,  setPreviewLoading]  = useState(false);
  const [sending,         setSending]         = useState(false);
  // Policy state — populated after a blocked 422 response from the server.
  const [blockedReason,         setBlockedReason]         = useState<string | null>(null);
  const [blockedCode,           setBlockedCode]           = useState<string | null>(null);
  // Minor-detection flag — derived client-side for preview badge.
  const [minorsDetected,        setMinorsDetected]        = useState(false);
  // Client-side thread-type classification (preview — mirrors server logic).
  const [threadClassification,  setThreadClassification]  = useState<{
    threadType: string | null;
    badges: string[];
  } | null>(null);
  // Quiet-hours state
  const [quietHoursModal,       setQuietHoursModal]       = useState(false);
  const [quietHoursInfo,        setQuietHoursInfo]        = useState<QuietHoursResponsePolicy | null>(null);
  const [pendingOverride,       setPendingOverride]        = useState<EmergencyOverride | null>(null);

  // In production this is fetched from /api/roster/guardians
  const guardians = buildMockGuardians(roster);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSpec(defaultRecipientSpec());
      setTitle("");
      setBody("");
      setAudience(null);
      setBlockedReason(null);
      setBlockedCode(null);
      setMinorsDetected(false);
      setThreadClassification(null);
      setQuietHoursModal(false);
      setQuietHoursInfo(null);
      setPendingOverride(null);
    }
  }, [open]);

  // Resolve audience preview whenever spec changes.
  // In production: debounce + call POST /api/messages/resolve-audience.
  // Here: pure client-side resolution using the same logic as the server.
  const resolveAudience = useCallback(
    (s: RecipientSpec) => {
      setPreviewLoading(true);
      setBlockedReason(null); // clear any previous block error on re-targeting
      // Simulate async resolution (replace with real API call)
      setTimeout(() => {
        const resolved = resolveAudienceClient(s, roster, guardians);
        setAudience(resolved);

        // Client-side minor detection and thread-type classification for preview.
        // Mirrors server logic — gives immediate feedback before the server validates.
        const hasMinors = detectMinorsInSpec(s, roster);
        setMinorsDetected(hasMinors);

        const classification = deriveClientThreadClassification(s, resolved, hasMinors);
        setThreadClassification(classification);

        setPreviewLoading(false);
      }, 0);
    },
    [roster, guardians]
  );

  function handleSpecChange(next: RecipientSpec) {
    setSpec(next);
    resolveAudience(next);
  }

  const canSend =
    !sending &&
    body.trim().length > 0 &&
    audience !== null &&
    audience.totalContacts > 0;

  async function handleSend(override?: EmergencyOverride) {
    if (!canSend) return;
    setSending(true);
    setBlockedReason(null);
    setBlockedCode(null);

    try {
      const result = await apiFetch<{
        thread:   { id: string };
        audience: { totalContacts: number };
        policy?:  {
          guardianAction:      string;
          guardiansAutoAdded:  number;
          threadType:          string;
          badges:              string[];
          requiresSecondAdult: boolean;
          notice?:             string;
          quietHours?:         QuietHoursResponsePolicy;
        };
      }>(
        "/messages/compose",
        {
          method: "POST",
          body:   JSON.stringify({
            spec,
            title:               title.trim() || null,
            body:                body.trim(),
            emergencyOverride:   override ?? null,
          }),
        }
      );

      const qh = result.policy?.quietHours;

      // 202 Accepted → message was queued for later delivery
      if (qh?.action === "queued" && qh.scheduledAt) {
        setQuietHoursInfo(qh);
        toast.info("Message scheduled", { description: `Will be sent at ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(qh.scheduledAt))}` });
        onCreated(result.thread.id, buildThreadLabel(spec, audience!));
        onOpenChange(false);
        return;
      }

      // Emergency override was rejected by server (note too short, invalid reason)
      if (qh?.emergencyRejectedReason) {
        toast.warning("Override not accepted", { description: qh.emergencyRejectedReason });
        setPendingOverride(null);
        return;
      }

      // Surface any guardian auto-inclusion notice
      if (result.policy?.notice) toast.info(result.policy.notice);

      // Emergency send confirmation
      if (qh?.action === "emergency_send") {
        toast.warning("Emergency override used — this send has been logged for admin review.");
      }

      toast.success(
        `Message sent to ${result.audience.totalContacts} recipient${result.audience.totalContacts !== 1 ? "s" : ""}`
      );
      onCreated(result.thread.id, buildThreadLabel(spec, audience!));
      onOpenChange(false);
    } catch (err: any) {
      // 422 policy blocks — show inline blocked banner instead of a toast.
      const knownCodes = [
        "GUARDIAN_REQUIRED", "MINOR_WITHOUT_GUARDIAN",
        "SECOND_ADULT_REQUIRED", "THREAD_TYPE_BLOCKED",
      ];
      if (err?.blockedReason || knownCodes.includes(err?.code)) {
        setBlockedReason(err.blockedReason ?? err.message ?? "Policy violation");
        setBlockedCode(err.code ?? null);
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to send message");
      }
    } finally {
      setSending(false);
    }
  }

  function handleEmergencyConfirm(override: EmergencyOverride) {
    setPendingOverride(override);
    setQuietHoursModal(false);
    handleSend(override);
  }

  function handleQueueFromModal() {
    // User chose "schedule for later" in the modal — just send without override.
    handleSend(undefined);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  // Client-side quiet-hours preview: check if local hour is outside the default window.
  // In production this window comes from org settings; here we use the server default (5-21).
  const outsideHoursPreview = minorsDetected && (() => {
    const h = new Date().getHours();
    return h < 5 || h >= 21;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-[15px] font-semibold tracking-tight">
            New Message
          </DialogTitle>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Choose your audience, then compose your message.
          </p>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* Recipient targeting */}
          <RecipientSelector
            roster={roster}
            guardians={guardians}
            value={spec}
            onChange={handleSpecChange}
          />

          {/* Optional subject line */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.13em] font-mono text-muted-foreground">
              Subject <span className="normal-case">(optional)</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Film session tomorrow at 4 PM"
              className="text-[13px] h-8"
              maxLength={120}
            />
          </div>

          {/* Message body */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.13em] font-mono text-muted-foreground">
              Message
            </Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your message…"
              className="resize-none text-[13.5px] min-h-[100px] max-h-[200px]"
              rows={4}
            />
            <div className="text-[10.5px] text-muted-foreground">
              ⌘ + Enter to send
            </div>
          </div>

          {/* Audience summary + thread-type classification badges */}
          <AudienceSummaryBar
            audience={audience}
            loading={previewLoading}
            empty={audience === null}
            guardiansAutoIncluded={minorsDetected ? 0 : undefined}
            threadClassification={threadClassification ?? undefined}
          />

          {/* Blocked-send error — shown when the server rejects with a policy violation */}
          {blockedReason && (
            <BlockedSendBanner reason={blockedReason} code={blockedCode ?? undefined} />
          )}

          {/* Outside-hours preview warning — shown client-side when minors are targeted */}
          {outsideHoursPreview && !blockedReason && (
            <OutsideHoursWarning
              policyWindow="05:00–21:00"
              localOrgTime={new Intl.DateTimeFormat("en-US", { timeStyle: "short", hour12: false }).format(new Date())}
            />
          )}

          {/* Queued message confirmation — set after a 202 response */}
          {quietHoursInfo?.action === "queued" && quietHoursInfo.scheduledAt && (
            <MessageQueuedBanner scheduledAt={quietHoursInfo.scheduledAt} />
          )}

          {/* Emergency override confirmation */}
          {quietHoursInfo?.action === "emergency_send" && pendingOverride && (
            <EmergencySentBanner reason={pendingOverride.reason} />
          )}
        </div>

        <Separator />

        <DialogFooter className="px-5 py-3.5 flex items-center gap-2">
          <Button
            variant="ghost"
            className="text-[13px] h-8 px-3"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          {/* Emergency override trigger — only visible when outside hours with minors */}
          {outsideHoursPreview && canSend && (
            <Button
              variant="outline"
              className="h-8 text-[12px] px-3 gap-1.5 text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
              onClick={() => setQuietHoursModal(true)}
              disabled={sending}
            >
              Emergency Override
            </Button>
          )}
          <Button
            onClick={() => handleSend()}
            disabled={!canSend}
            className="h-8 text-[13px] px-4 gap-2"
          >
            {sending ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                {pendingOverride ? "Sending override…" : "Scheduling…"}
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                {outsideHoursPreview ? "Schedule for Later" : "Send Message"}
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Emergency override modal */}
        <QuietHoursModal
          open={quietHoursModal}
          onOpenChange={setQuietHoursModal}
          policyWindow="05:00–21:00"
          localOrgTime={new Intl.DateTimeFormat("en-US", { timeStyle: "short", hour12: false }).format(new Date())}
          onConfirm={handleEmergencyConfirm}
          onQueue={handleQueueFromModal}
          submitting={sending}
        />
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Client-side audience resolver                                               */
/* Mirrors server/modules/messaging/recipient-resolver.ts                     */
/* Replace preview calls with POST /api/messages/resolve-audience in prod.    */
/* -------------------------------------------------------------------------- */

function resolveAudienceClient(
  spec: RecipientSpec,
  roster: RosterAthlete[],
  guardians: GuardianEntry[]
): ResolvedAudience {
  const { mode, playerScope, selectedPlayerIds, individuals } = spec;

  function targetPlayers(): RosterAthlete[] {
    return playerScope === "all"
      ? roster
      : roster.filter((p) => selectedPlayerIds.includes(p.id));
  }

  function guardiansFor(players: RosterAthlete[]): GuardianEntry[] {
    const ids = new Set(players.map((p) => p.id));
    return guardians.filter((g) => ids.has(g.playerId) && g.canReceiveMessages);
  }

  if (mode === "players") {
    const targets = targetPlayers();
    return { playerCount: targets.length, guardianCount: 0, totalContacts: targets.length, playerWarnings: [], guardianWarnings: [] };
  }

  if (mode === "parents") {
    const targets  = targetPlayers();
    const resolved = guardiansFor(targets);
    const warnings = targets
      .filter((p) => !resolved.some((g) => g.playerId === p.id))
      .map((p) => ({ playerId: p.id, playerName: p.name, message: "No linked guardian" }));
    return { playerCount: 0, guardianCount: resolved.length, totalContacts: resolved.length, playerWarnings: warnings, guardianWarnings: [] };
  }

  if (mode === "both") {
    const targets   = targetPlayers();
    const resolvedG = guardiansFor(targets);
    const warnings  = targets
      .filter((p) => !resolvedG.some((g) => g.playerId === p.id))
      .map((p) => ({ playerId: p.id, playerName: p.name, message: "No linked guardian — guardian message will not be sent" }));
    return { playerCount: targets.length, guardianCount: resolvedG.length, totalContacts: targets.length + resolvedG.length, playerWarnings: warnings, guardianWarnings: [] };
  }

  if (mode === "individuals") {
    const players  = individuals.filter((i) => i.type === "player").length;
    const guards   = individuals.filter((i) => i.type === "guardian").length;
    return { playerCount: players, guardianCount: guards, totalContacts: individuals.length, playerWarnings: [], guardianWarnings: [] };
  }

  return { playerCount: 0, guardianCount: 0, totalContacts: 0, playerWarnings: [], guardianWarnings: [] };
}

function buildThreadLabel(spec: RecipientSpec, audience: ResolvedAudience): string {
  if (spec.mode === "players")     return `Team Broadcast — Players (${audience.playerCount})`;
  if (spec.mode === "parents")     return `Parent Broadcast (${audience.guardianCount})`;
  if (spec.mode === "both")        return `Team + Parents (${audience.totalContacts})`;
  if (spec.mode === "individuals") return `Individual Message (${audience.totalContacts})`;
  return "New Message";
}

/**
 * Client-side thread-type classification for immediate UI preview.
 *
 * Mirrors the server-side classifyThreadType() logic using the same rules,
 * but operates on client-side roster data and the resolved audience.
 * The server is the authoritative validator — this is for UX feedback only.
 *
 * Returns null when no classification is applicable (e.g. empty audience).
 */
function deriveClientThreadClassification(
  spec: RecipientSpec,
  audience: ResolvedAudience,
  hasMinors: boolean,
): { threadType: string | null; badges: string[] } | null {
  if (audience.totalContacts === 0) return null;

  // Guardian-only send (mode=parents)
  if (spec.mode === "parents") {
    return { threadType: "coach_to_parent", badges: ["guardian_included"] };
  }

  if (hasMinors) {
    const isTeam = audience.playerCount > 1;
    if (isTeam) {
      return {
        threadType: "coach_to_team_with_adult_copy",
        badges:     ["minor_protected", "guardian_included"],
      };
    }
    return {
      threadType: "coach_to_minor_with_guardian",
      badges:     ["minor_protected", "guardian_included"],
    };
  }

  // Adults only
  const hasGuardians = audience.guardianCount > 0;
  return {
    threadType: hasGuardians ? null : "broadcast",
    badges:     hasGuardians ? ["guardian_included"] : [],
  };
}

/**
 * Client-side minor detection for preview badge.
 * Returns true when any player in the current spec is flagged as a minor.
 * Mirrors the server-side enforceGuardianPolicy minor check without needing
 * a network round-trip during preview.
 */
function detectMinorsInSpec(spec: RecipientSpec, roster: RosterAthlete[]): boolean {
  if (spec.mode === "parents") return false; // parent-only sends don't trigger minor policy

  if (spec.mode === "individuals") {
    return spec.individuals
      .filter((i) => i.type === "player")
      .some((i) => {
        const player = roster.find((p) => p.id === i.playerId);
        return player?.isMinor ?? false;
      });
  }

  // players / both: check within scope
  const targets =
    spec.playerScope === "all"
      ? roster
      : roster.filter((p) => spec.selectedPlayerIds.includes(p.id));

  return targets.some((p) => p.isMinor);
}
