"use client";

// ---------------------------------------------------------------------------
// useWeeklyReport — Task 19: Weekly Report
// Computes a rich weekly summary for the current user and their family.
// ---------------------------------------------------------------------------

import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { getLogsByUser } from "@/services/worship/logsService";
import { calculateDayPoints } from "@/services/worship/pointsService";
import { getFamilyMembers } from "@/services/family/memberService";
import { qk } from "@/lib/queryKeys";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeeklyReportData {
  /** Total points earned this week (Mon–Sun relative to today) */
  totalPoints: number;
  /** Average points per calendar day this week */
  avgDailyPoints: number;
  /** Day with the most points */
  bestDay: { label: string; points: number } | null;
  /** Family member with most points this week */
  mostCommittedMember: { name: string; avatar: string; points: number } | null;
  /** % of the max possible prayers completed (5 × active days) */
  prayerCompletionRate: number;
  /** Total Quran pages read this week */
  quranPagesTotal: number;
  /** Number of fasting days this week */
  fastingDays: number;
  /** Days with at least one recorded act of worship */
  activeDays: number;
  /** % change vs the previous 7-day window (positive = improvement) */
  trendPct: number;
  /** Whether today is Friday — triggers motivational message */
  isFriday: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns an array of YYYY-MM-DD strings for `length` days ending today. */
function buildDateRange(daysBack: number, length = 7): string[] {
  return Array.from({ length }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - daysBack + i);
    return d.toISOString().split("T")[0];
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWeeklyReport() {
  const user = useAppStore((s) => s.user);

  return useQuery<WeeklyReportData>({
    queryKey: qk.weeklyReport(user?.id ?? ""),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const members = await getFamilyMembers();

      // Fetch all member logs in parallel (includes the current user)
      const allMemberLogs = await Promise.all(
        members.map((m) => getLogsByUser(m.id)),
      );

      const thisWeek = buildDateRange(6); // today & 6 days before
      const prevWeek = buildDateRange(13, 7); // 7–13 days ago

      // Find the current user's logs from the batch
      const userIdx = members.findIndex((m) => m.id === user!.id);
      const userLogs = userIdx >= 0 ? allMemberLogs[userIdx] : [];

      const thisWeekLogs = userLogs.filter((l) => thisWeek.includes(l.date));
      const prevWeekLogs = userLogs.filter((l) => prevWeek.includes(l.date));

      const thisWeekPoints = thisWeekLogs.reduce(
        (sum, l) => sum + calculateDayPoints(l),
        0,
      );
      const prevWeekPoints = prevWeekLogs.reduce(
        (sum, l) => sum + calculateDayPoints(l),
        0,
      );

      const trendPct =
        prevWeekPoints > 0
          ? Math.round(
              ((thisWeekPoints - prevWeekPoints) / prevWeekPoints) * 100,
            )
          : thisWeekPoints > 0
            ? 100
            : 0;

      // Best day this week
      let bestDay: { label: string; points: number } | null = null;
      for (const log of thisWeekLogs) {
        const pts = calculateDayPoints(log);
        if (!bestDay || pts > bestDay.points) {
          bestDay = {
            label: new Date(log.date).toLocaleDateString("ar-SA", {
              weekday: "long",
            }),
            points: pts,
          };
        }
      }

      // Prayer completion rate
      const completedPrayers = thisWeekLogs.reduce(
        (sum, l) => sum + l.prayers.filter((p) => p.completed).length,
        0,
      );
      const maxPrayers = thisWeekLogs.length * 5;
      const prayerCompletionRate =
        maxPrayers > 0 ? Math.round((completedPrayers / maxPrayers) * 100) : 0;

      const quranPagesTotal = thisWeekLogs.reduce(
        (sum, l) => sum + l.quranPages,
        0,
      );
      const fastingDays = thisWeekLogs.filter((l) => l.fasting).length;
      const activeDays = thisWeekLogs.filter(
        (l) => calculateDayPoints(l) > 0,
      ).length;

      // Most committed family member — use already-fetched logs
      let mostCommittedMember: {
        name: string;
        avatar: string;
        points: number;
      } | null = null;

      if (members.length > 0) {
        const allMemberPoints = members.map((m, idx) => {
          const pts = allMemberLogs[idx]
            .filter((l) => thisWeek.includes(l.date))
            .reduce((sum, l) => sum + calculateDayPoints(l), 0);
          return { name: m.name, avatar: m.avatar ?? "👤", points: pts };
        });
        mostCommittedMember = allMemberPoints.reduce(
          (best, m) => (m.points > best.points ? m : best),
          allMemberPoints[0],
        );
      }

      return {
        totalPoints: thisWeekPoints,
        avgDailyPoints: Math.round(thisWeekPoints / 7),
        bestDay,
        mostCommittedMember,
        prayerCompletionRate,
        quranPagesTotal,
        fastingDays,
        activeDays,
        trendPct,
        isFriday: new Date().getDay() === 5,
      };
    },
  });
}
