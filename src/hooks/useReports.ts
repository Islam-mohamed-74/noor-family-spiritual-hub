"use client";

import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { getLogsByUser } from "@/services/worship/logsService";
import { calculateDayPoints } from "@/services/worship/pointsService";
import { getFamilyMembers } from "@/services/family/memberService";
import { qk } from "@/lib/queryKeys";
import { User } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChartDays = 7 | 30 | 90;

export interface PersonalChartEntry {
  date: string;
  النقاط: number;
  الصلوات: number;
  القرآن: number;
  /** 1 = fasted that day, 0 = not */
  الصيام: number;
  /** morning + evening azkar completed (0-2) */
  الأذكار: number;
  /** witr + qiyam (0-2) */
  القيام: number;
}

export interface FamilyChartEntry {
  date: string;
  [memberName: string]: string | number;
}

export interface TrendInfo {
  /** Percentage change vs the equal-length previous window */
  trendPct: number;
  /** Absolute point delta */
  delta: number;
}

export interface ReportsData {
  members: User[];
  personalChartData: PersonalChartEntry[];
  familyChartData: FamilyChartEntry[];
  trend: TrendInfo;
  isLoading: boolean;
  isError: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDates(days: ChartDays): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().split("T")[0];
  });
}

function bucketLabel(dateStr: string, days: ChartDays): string {
  const d = new Date(dateStr);
  if (days <= 7) return d.toLocaleDateString("ar-SA", { weekday: "short" });
  return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches personal + family comparison chart data for the given window.
 * @param selectedUserId - which member's personal data to chart (defaults to current user)
 * @param days - 7 | 30 | 90 (default 7)
 */
export function useReports(selectedUserId?: string, days: ChartDays = 7) {
  const user = useAppStore((s) => s.user);
  const targetUserId = selectedUserId ?? user?.id ?? "";

  // --- Members ---
  const membersQuery = useQuery<User[]>({
    queryKey: qk.familyMembers(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    queryFn: () => getFamilyMembers(),
  });

  const members = membersQuery.data ?? [];

  // --- Personal chart + trend (single fetch) ---
  const personalQuery = useQuery<{
    chart: PersonalChartEntry[];
    trend: TrendInfo;
  }>({
    queryKey: qk.reportsPersonal(targetUserId, days),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const logs = await getLogsByUser(targetUserId);
      const logsMap = new Map(logs.map((l) => [l.date, l]));

      const currentDates = buildDates(days);
      const chart = currentDates.map((dateStr) => {
        const log = logsMap.get(dateStr);
        return {
          date: bucketLabel(dateStr, days),
          النقاط: log ? calculateDayPoints(log) : 0,
          الصلوات: log ? log.prayers.filter((p) => p.completed).length : 0,
          القرآن: log ? log.quranPages : 0,
          الصيام: log?.fasting ? 1 : 0,
          الأذكار: log
            ? (log.azpiMorning ? 1 : 0) + (log.azpiEvening ? 1 : 0)
            : 0,
          القيام: log ? (log.witr ? 1 : 0) + (log.qiyam ? 1 : 0) : 0,
        };
      });

      // Trend: compare current window vs previous equal window
      const prevDates = Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days * 2 - 1 - i));
        return d.toISOString().split("T")[0];
      });
      const sum = (dates: string[]) =>
        dates.reduce((acc, d) => {
          const log = logsMap.get(d);
          return acc + (log ? calculateDayPoints(log) : 0);
        }, 0);
      const current = sum(currentDates);
      const prev = sum(prevDates);
      const delta = current - prev;
      const trendPct =
        prev > 0 ? Math.round((delta / prev) * 100) : current > 0 ? 100 : 0;

      return { chart, trend: { trendPct, delta } };
    },
  });

  // --- Family chart: fetch ALL logs per member once (not per-day) ---
  const familyQuery = useQuery<FamilyChartEntry[]>({
    queryKey: qk.reportsFamily(undefined, days),
    enabled: members.length > 0,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const dates = buildDates(days);

      // 1 fetch per member (was members × days before)
      const memberLogs = await Promise.all(
        members.map((m) => getLogsByUser(m.id)),
      );
      const memberLogMaps = memberLogs.map(
        (logs) => new Map(logs.map((l) => [l.date, l])),
      );

      return dates.map((dateStr) => {
        const entry: FamilyChartEntry = { date: bucketLabel(dateStr, days) };
        members.forEach((m, idx) => {
          const log = memberLogMaps[idx].get(dateStr);
          entry[m.name] = log ? calculateDayPoints(log) : 0;
        });
        return entry;
      });
    },
  });

  return {
    members,
    personalChartData: personalQuery.data?.chart ?? [],
    familyChartData: familyQuery.data ?? [],
    trend: personalQuery.data?.trend ?? { trendPct: 0, delta: 0 },
    isLoading:
      membersQuery.isLoading ||
      personalQuery.isLoading ||
      familyQuery.isLoading,
    isError:
      membersQuery.isError || personalQuery.isError || familyQuery.isError,
  };
}
