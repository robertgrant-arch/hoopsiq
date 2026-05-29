import { AlertTriangle, Users } from "lucide-react";
import type { ResolvedAudience } from "./types";
import { GuardianIncludedBadge } from "./SafetyPolicyBanner";
import { ThreadPolicyBadgeRow }  from "./ThreadTypeBadge";

interface AudienceSummaryBarProps {
  audience: ResolvedAudience | null;
  loading: boolean;
  /** If true, renders as an inline validation error (no audience selected) */
  empty?: boolean;
  /**
   * Set when the resolved audience contains minors and guardians will be
   * (or have been) auto-included by the server-side policy.
   * Pass the number of auto-included guardians, or 0 for "policy active but
   * count unknown at preview time".
   */
  guardiansAutoIncluded?: number;
  /**
   * Client-side preview of the thread type classification.
   * Derived from audience + minor detection before the server validates.
   * When provided, renders a ThreadPolicyBadgeRow below the recipient count.
   */
  threadClassification?: {
    threadType: string | null;
    badges: string[];
  };
}

export function AudienceSummaryBar({ audience, loading, empty, guardiansAutoIncluded, threadClassification }: AudienceSummaryBarProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded border border-border bg-muted/40 text-[12px] text-muted-foreground">
        <span className="w-3 h-3 rounded-full border-2 border-muted-foreground/40 border-t-muted-foreground animate-spin" />
        Resolving recipients…
      </div>
    );
  }

  if (empty || !audience || audience.totalContacts === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded border border-border bg-muted/30 text-[12px] text-muted-foreground">
        <Users className="w-3.5 h-3.5 shrink-0" />
        <span>Select an audience to continue</span>
      </div>
    );
  }

  const { playerCount, guardianCount, totalContacts, playerWarnings, guardianWarnings } = audience;
  const warnings = [...playerWarnings, ...guardianWarnings];

  // Build human-readable summary
  const parts: string[] = [];
  if (playerCount > 0) parts.push(`${playerCount} player${playerCount !== 1 ? "s" : ""}`);
  if (guardianCount > 0) parts.push(`${guardianCount} guardian contact${guardianCount !== 1 ? "s" : ""}`);
  const summary = parts.join(" · ");

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 px-3 py-2 rounded border border-border bg-muted/30 text-[12px]">
        <Users className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">Sending to:</span>
        <span className="font-medium text-foreground">{summary}</span>
        {guardiansAutoIncluded !== undefined && guardiansAutoIncluded >= 0 && (
          <GuardianIncludedBadge count={guardiansAutoIncluded} />
        )}
        <span className="ml-auto text-muted-foreground tabular-nums">{totalContacts} total</span>
      </div>

      {/* Thread-type policy badge row */}
      {threadClassification && (
        threadClassification.badges.length > 0 || threadClassification.threadType
      ) && (
        <ThreadPolicyBadgeRow
          badges={threadClassification.badges}
          threadType={threadClassification.threadType ?? undefined}
          className="px-1"
        />
      )}

      {warnings.length > 0 && (
        <div className="flex items-start gap-2 px-3 py-2 rounded border border-amber-500/20 bg-amber-500/5 text-[11.5px] text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />
          <div className="space-y-0.5">
            {warnings.slice(0, 3).map((w, i) => (
              <div key={i}>{w.playerName}: {w.message}</div>
            ))}
            {warnings.length > 3 && (
              <div className="text-muted-foreground">
                +{warnings.length - 3} more warnings
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
