import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { getFamilyMembers } from "@/services/family/memberService";
import {
  getWeeklyPoints,
  getTotalPoints,
  getStreak,
} from "@/services/worship/pointsService";
import { getUserBadges } from "@/services/worship/badgesService";
import { qk } from "@/lib/queryKeys";
import { User } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MemberStats extends User {
  weeklyPoints: number;
  totalPoints: number;
  streak: number;
  badgeCount: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/** Builds the weekly leaderboard by enriching each family member with stats. */
export function useLeaderboard() {
  const user = useAppStore((s) => s.user);

  return useQuery<MemberStats[]>({
    queryKey: qk.leaderboard(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 min
    queryFn: async () => {
      const members = await getFamilyMembers();

      const stats = await Promise.all(
        members.map(async (m) => ({
          ...m,
          weeklyPoints: await getWeeklyPoints(m.id),
          totalPoints: await getTotalPoints(m.id),
          streak: await getStreak(m.id),
          badgeCount: (await getUserBadges(m.id)).length,
        })),
      );

      return stats.sort((a, b) => b.weeklyPoints - a.weeklyPoints);
    },
  });
}
