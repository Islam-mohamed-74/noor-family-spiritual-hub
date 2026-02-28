"use client";

import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { ALL_BADGES } from "@/services/worship/badgesService";
import { getLogsByUser } from "@/services/worship/logsService";
import { calculateDayPoints } from "@/services/worship/pointsService";
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
      // Fetch logs ONCE, compute everything locally
      const logs = await getLogsByUser(user!.id);

      const totalPoints = logs.reduce(
        (sum, l) => sum + calculateDayPoints(l),
        0,
      );

      // Streak
      let streak = 0;
      const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
      const today = new Date();
      for (let i = 0; i < sorted.length; i++) {
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        const expectedStr = expected.toISOString().split("T")[0];
        const log = sorted.find((l) => l.date === expectedStr);
        if (log && log.prayers.some((p) => p.completed)) streak++;
        else break;
      }

      // Badges — compute locally
      const badges: Badge[] = [];
      const fajrDays = logs.filter(
        (l) => l.prayers.find((p) => p.name === "fajr")?.completed,
      ).length;
      if (fajrDays >= 7) badges.push(ALL_BADGES[0]);

      const azkarDays = logs.filter(
        (l) => l.azpiMorning && l.azpiEvening,
      ).length;
      if (azkarDays >= 7) badges.push(ALL_BADGES[1]);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyPts = logs
        .filter((l) => new Date(l.date) >= weekAgo)
        .reduce((sum, l) => sum + calculateDayPoints(l), 0);
      if (weeklyPts >= 100) badges.push(ALL_BADGES[2]);

      const totalPages = logs.reduce((s, l) => s + l.quranPages, 0);
      if (totalPages >= 100) badges.push(ALL_BADGES[3]);

      if (streak >= 30) badges.push(ALL_BADGES[4]);

      return { badges, totalPoints, streak };
    },
  });
}
