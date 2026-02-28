import { supabase } from "@/lib/supabase";
import { WorshipLog, POINTS } from "@/types";
import { getLogsByUser, getLogByUserAndDate } from "./logsService";
import { getFamilyMembers } from "@/services/family/memberService";

// ---------------------------------------------------------------------------
// Per-log point calculation (pure, synchronous)
// ---------------------------------------------------------------------------

export function calculateDayPoints(log: WorshipLog): number {
  let pts = 0;
  log.prayers.forEach((p) => {
    if (p.completed) pts += POINTS.prayer;
    if (p.onTime) pts += POINTS.prayerOnTime;
    if (p.jamaah) pts += POINTS.prayerJamaah;
    if (p.rawatib) pts += POINTS.rawatib;
  });
  if (log.azpiMorning) pts += POINTS.azpiMorning;
  if (log.azpiEvening) pts += POINTS.azpiEvening;
  pts += log.quranPages * POINTS.quranPage;
  if (log.fasting) {
    pts += log.fastingType === "sunnah" ? POINTS.fastingSunnah : POINTS.fasting;
  }
  if (log.duha) pts += POINTS.duha;
  if (log.witr) pts += POINTS.witr;
  if (log.qiyam) pts += POINTS.qiyam;
  if (log.sadaqaPrivate) pts += POINTS.sadaqa;
  if (log.duaPrivate) pts += POINTS.dua;
  if (log.iftar) pts += POINTS.iftar;
  if (log.tarawih) pts += POINTS.tarawih;
  return pts;
}

// ---------------------------------------------------------------------------
// Aggregate calculations
// ---------------------------------------------------------------------------

export async function getTotalPoints(userId: string): Promise<number> {
  const logs = await getLogsByUser(userId);
  return logs.reduce((sum, log) => sum + calculateDayPoints(log), 0);
}

export async function getWeeklyPoints(userId: string): Promise<number> {
  const logs = await getLogsByUser(userId);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return logs
    .filter((l) => new Date(l.date) >= weekAgo)
    .reduce((sum, log) => sum + calculateDayPoints(log), 0);
}

export async function getStreak(userId: string): Promise<number> {
  const logs = await getLogsByUser(userId);
  const sorted = logs.sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split("T")[0];
    const log = sorted.find((l) => l.date === expectedStr);
    if (log && log.prayers.some((p) => p.completed)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ---------------------------------------------------------------------------
// Fast-path getters that read pre-aggregated stats from the users table.
// These are O(1) versus the O(n) full-log recalc functions above.
// ---------------------------------------------------------------------------

export async function getTotalPointsFast(userId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from("users")
      .select("total_points")
      .eq("id", userId)
      .single();
    // Fall back to full recalc if column not present / null
    if (data?.total_points != null) return data.total_points as number;
  } catch {
    // ignore
  }
  return getTotalPoints(userId);
}

export async function getStreakFast(userId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from("users")
      .select("current_streak")
      .eq("id", userId)
      .single();
    if (data?.current_streak != null) return data.current_streak as number;
  } catch {
    // ignore
  }
  return getStreak(userId);
}

export async function getFamilyDailyCompletion(
  date: string,
  familyId?: string,
): Promise<number> {
  try {
    const members = await getFamilyMembers(familyId);
    if (!members.length) return 0;

    const logs = await Promise.all(
      members.map((m) => getLogByUserAndDate(m.id, date)),
    );

    let total = 0;
    logs.forEach((log) => {
      if (log) {
        const completed = log.prayers.filter((p) => p.completed).length;
        total += completed / 5;
      }
    });

    return Math.round((total / members.length) * 100);
  } catch (error) {
    console.error("Error calculating family daily completion:", error);
    return 0;
  }
}
