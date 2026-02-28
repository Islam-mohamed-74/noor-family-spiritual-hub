"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import {
  getTodayLog,
  saveLog,
  getLogsByUser,
  persistUserStats,
} from "@/services/worship/logsService";
import { calculateDayPoints } from "@/services/worship/pointsService";
import { incrementMyActiveChallenges } from "@/services/social/challengeParticipantsService";
import { logActivity } from "@/services/social/activityService";
import { WorshipLog } from "@/types";
import { qk } from "@/lib/queryKeys";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorshipLogData {
  log: WorshipLog | null;
  totalPoints: number;
  streak: number;
  todayPoints: number;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Fetches today's worship log plus points & streak for the current user. */
export function useWorshipLog() {
  const user = useAppStore((s) => s.user);

  const query = useQuery<WorshipLogData>({
    queryKey: qk.worshipLogToday(user?.id ?? ""),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 min
    queryFn: async () => {
      // Fetch today's log and ALL logs in parallel (only 2 requests, not 3)
      const [todayLog, allLogs] = await Promise.all([
        getTodayLog(user!.id),
        getLogsByUser(user!.id),
      ]);
      // Compute points & streak locally from the fetched logs
      const totalPoints = allLogs.reduce(
        (sum, l) => sum + calculateDayPoints(l),
        0,
      );
      let streak = 0;
      const sorted = [...allLogs].sort((a, b) => b.date.localeCompare(a.date));
      const today = new Date();
      for (let i = 0; i < sorted.length; i++) {
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        const expectedStr = expected.toISOString().split("T")[0];
        const log = sorted.find((l) => l.date === expectedStr);
        if (log && log.prayers.some((p) => p.completed)) streak++;
        else break;
      }
      return {
        log: todayLog,
        totalPoints,
        streak,
        todayPoints: todayLog ? calculateDayPoints(todayLog) : 0,
      };
    },
  });

  return query;
}

/**
 * Mutation that persists a partial update to today's log.
 * On success it updates the cached data immediately (optimistic-style) and
 * re-fetches points / streak so the UI stays consistent without a full reload.
 */
export function useSaveWorshipLog() {
  const user = useAppStore((s) => s.user);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (updated: WorshipLog) => {
      await saveLog(updated);
      // Increment active challenge progress (once per day when any prayer completed)
      const prayersCompleted = updated.prayers.filter(
        (p) => p.completed,
      ).length;
      if (prayersCompleted > 0) {
        incrementMyActiveChallenges().catch(() => {});
        logActivity({
          activityType: "prayer",
          description: `صلّى ${prayersCompleted} من 5 صلوات`,
          pointsEarned: 0,
        }).catch(() => {});
      }
      // Compute points & streak locally from all logs (1 fetch, not 2)
      const allLogs = await getLogsByUser(user!.id);
      // Replace today's log in the list with the updated version
      const logsWithUpdate = allLogs.map((l) =>
        l.date === updated.date ? updated : l,
      );
      const totalPoints = logsWithUpdate.reduce(
        (sum, l) => sum + calculateDayPoints(l),
        0,
      );
      let streak = 0;
      const sorted = [...logsWithUpdate].sort((a, b) =>
        b.date.localeCompare(a.date),
      );
      const today = new Date();
      for (let i = 0; i < sorted.length; i++) {
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        const expectedStr = expected.toISOString().split("T")[0];
        const log = sorted.find((l) => l.date === expectedStr);
        if (log && log.prayers.some((p) => p.completed)) streak++;
        else break;
      }
      return { log: updated, totalPoints, streak };
    },
    onSuccess: ({ log, totalPoints, streak }) => {
      qc.setQueryData<WorshipLogData>(qk.worshipLogToday(user!.id), (prev) =>
        prev
          ? {
              ...prev,
              log,
              totalPoints,
              streak,
              todayPoints: calculateDayPoints(log),
            }
          : prev,
      );
      // Persist aggregated stats for O(1) leaderboard reads
      persistUserStats(user!.id, totalPoints, streak).catch(() => {});
      // Invalidate leaderboard so family page refreshes eventually
      qc.invalidateQueries({ queryKey: ["family", "leaderboard"] });
    },
  });
}
