/**
 * useAnnouncements — fetches from /api/announcements which filters server-side
 * by the caller's org role.  In demo mode, falls back to mock data so the
 * parent and athlete portals still work without a live backend.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IS_DEMO } from "@/lib/auth";
import { apiGet, apiPost, apiDelete } from "../client";
import { mockAnnouncements } from "@/lib/mock/parent";


export type AnnouncementItem = {
  id: string;
  orgId: string;
  title: string;
  body: string;
  priority: "normal" | "urgent" | "info";
  pinned: boolean;
  tags: string[];
  audienceRoles: string[] | null;
  authorUserId: string;
  authorName: string;
  publishedAt: string;
  expiresAt: string | null;
};

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async (): Promise<AnnouncementItem[]> => {
      if (IS_DEMO) {
        // Demo: return mock data shaped to match the API type
        return mockAnnouncements.map((a) => ({
          id: a.id,
          orgId: "org_texas_elite",
          title: a.title,
          body: a.body,
          priority: a.priority,
          pinned: a.pinned,
          tags: a.tags,
          audienceRoles: null,
          authorUserId: "u_coach_1",
          authorName: a.author,
          publishedAt: a.postedAt,
          expiresAt: null,
        }));
      }
      return apiGet<AnnouncementItem[]>("/announcements");
    },
    staleTime: 60_000,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AnnouncementItem>) =>
      apiPost<AnnouncementItem>("/announcements", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/announcements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}
