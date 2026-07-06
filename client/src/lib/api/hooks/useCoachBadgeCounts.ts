/**
 * useCoachBadgeCounts — live badge counts for the coach bottom tab bar.
 *
 * Returns:
 *   filmPending  — uploads awaiting coach review (Film tab badge)
 *   inboxUnread  — unread inbox messages (Inbox tab badge)
 *
 * Demo mode: derives filmPending from athleteUploads mock, inboxUnread hardcoded.
 * Production: polls GET /api/coach/badge-counts every 30 s.
 *
 * Counts are capped at 99 for display purposes.
 */
import { useQuery } from "@tanstack/react-query";
import { IS_DEMO } from "@/lib/auth";
import { athleteUploads } from "@/lib/mock/data";
import { apiGet } from "@/lib/api/client";


type BadgeCounts = {
  filmPending: number;
  inboxUnread: number;
};

export function useCoachBadgeCounts() {
  return useQuery<BadgeCounts>({
    queryKey: ["coach", "badge-counts"],
    queryFn: async (): Promise<BadgeCounts> => {
      if (IS_DEMO) {
        const filmPending = athleteUploads.filter(
          (u) => u.status !== "COACH_REVIEWED"
        ).length;
        return { filmPending, inboxUnread: 2 };
      }
      return apiGet<BadgeCounts>("/coach/badge-counts");
    },
    staleTime: 30_000,   // re-fetch every 30 s
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

/** Clamp a count to a displayable string: "0" → hidden, "10+" for >9 */
export function formatBadge(count: number): string | null {
  if (count <= 0) return null;
  if (count > 9) return "9+";
  return String(count);
}
