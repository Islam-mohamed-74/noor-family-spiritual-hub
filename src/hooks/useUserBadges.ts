import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { getUserBadges } from "@/services/worship/badgesService";
import { getTotalPoints, getStreak } from "@/services/worship/pointsService";
import { qk } from "@/lib/queryKeys";
import { Badge } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserBadgesData {
  badges: Badge[];
  totalPoints: number;
  streak: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches earned badges, total points and current streak for the current user.
 * Used primarily by SettingsPage.
 */
export function useUserBadges() {
  const user = useAppStore((s) => s.user);

  return useQuery<UserBadgesData>({
    queryKey: qk.userBadges(user?.id ?? ""),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 min
    queryFn: async () => {
      const [badges, totalPoints, streak] = await Promise.all([
        getUserBadges(user!.id),
        getTotalPoints(user!.id),
        getStreak(user!.id),
      ]);
      return { badges, totalPoints, streak };
    },
  });
}
