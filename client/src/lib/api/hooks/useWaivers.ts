/**
 * useWaivers — fetches waiver templates + signatures for a player.
 * Demo mode returns mock data from parent.ts.
 *
 * The sign mutation sends { playerId, consentAcknowledged: true } to
 * POST /api/waivers/:templateId/sign.  The server captures IP and user-agent.
 * The client MUST set consentAcknowledged based on the user checking a real
 * checkbox — never auto-set it to true.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IS_DEMO } from "@/lib/auth";
import { apiGet, apiPost } from "../client";
import { mockForms } from "@/lib/mock/parent";


export type WaiverItem = {
  id: string;
  orgId: string;
  title: string;
  description: string;
  category: "waiver" | "consent" | "medical" | "media" | "emergency";
  required: boolean;
  dueDate?: string;
  expiresAt?: string;
  signature: {
    id: string;
    status: "pending" | "signed" | "expired" | "voided";
    signedAt: string | null;
  } | null;
};

export function useWaivers(playerId: string) {
  return useQuery({
    queryKey: ["waivers", playerId],
    queryFn: async (): Promise<WaiverItem[]> => {
      if (IS_DEMO) {
        return mockForms.map((f) => ({
          id: f.id,
          orgId: "org_texas_elite",
          title: f.title,
          description: f.description,
          category: f.category,
          required: f.required,
          dueDate: f.dueDate,
          expiresAt: f.expiresAt,
          signature:
            f.status === "signed"
              ? { id: `sig_${f.id}`, status: "signed" as const, signedAt: f.signedDate ?? null }
              : f.status === "not_required"
              ? null
              : { id: `sig_${f.id}`, status: "pending" as const, signedAt: null },
        }));
      }
      return apiGet<WaiverItem[]>(`/waivers/player/${playerId}`);
    },
    enabled: !!playerId,
    staleTime: 30_000,
  });
}

export function useSignWaiver(playerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      consentAcknowledged,
    }: {
      templateId: string;
      consentAcknowledged: true; // TypeScript enforces this must be literal true
    }) =>
      apiPost(`/waivers/${templateId}/sign`, {
        playerId,
        consentAcknowledged,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["waivers", playerId] });
    },
  });
}
