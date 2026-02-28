import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import {
  getNudges,
  sendNudge,
  markNudgeRead,
} from "@/services/social/nudgeService";
import { qk } from "@/lib/queryKeys";
import { Nudge } from "@/types";

// ---------------------------------------------------------------------------
// Hook — inbox query
// ---------------------------------------------------------------------------

/**
 * Returns the nudge inbox for the current user.
 * Refetches automatically every 30 s (matches the previous polling interval).
 */
export function useNudges() {
  const user = useAppStore((s) => s.user);

  return useQuery<Nudge[]>({
    queryKey: qk.nudges(user?.id ?? ""),
    enabled: !!user,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30, // poll every 30 s
    queryFn: () => getNudges(user!.id),
  });
}

// ---------------------------------------------------------------------------
// Hook — send nudge mutation
// ---------------------------------------------------------------------------

export function useSendNudge() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (nudge: Omit<Nudge, "id" | "timestamp" | "read">) =>
      sendNudge(nudge),
    onSuccess: (_data, variables) => {
      // Optimistically invalidate the recipient's inbox (if same client session)
      qc.invalidateQueries({ queryKey: qk.nudges(variables.toUserId) });
    },
  });
}

// ---------------------------------------------------------------------------
// Hook — mark read mutation
// ---------------------------------------------------------------------------

export function useMarkNudgeRead() {
  const user = useAppStore((s) => s.user);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNudgeRead(id),
    // Optimistic local update — no server round-trip delay in the UI
    onMutate: async (id) => {
      if (!user) return;
      await qc.cancelQueries({ queryKey: qk.nudges(user.id) });
      const previous = qc.getQueryData<Nudge[]>(qk.nudges(user.id));
      qc.setQueryData<Nudge[]>(qk.nudges(user.id), (prev) =>
        prev?.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      // Roll back on failure
      if (user && ctx?.previous) {
        qc.setQueryData(qk.nudges(user.id), ctx.previous);
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Hook — mark ALL unread nudges as read
// ---------------------------------------------------------------------------

export function useMarkAllNudgesRead() {
  const user = useAppStore((s) => s.user);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const nudges = qc.getQueryData<Nudge[]>(qk.nudges(user.id)) ?? [];
      const unread = nudges.filter((n) => !n.read);
      await Promise.all(unread.map((n) => markNudgeRead(n.id)));
    },
    onSuccess: () => {
      if (!user) return;
      qc.setQueryData<Nudge[]>(qk.nudges(user.id), (prev) =>
        prev?.map((n) => ({ ...n, read: true })),
      );
    },
  });
}
