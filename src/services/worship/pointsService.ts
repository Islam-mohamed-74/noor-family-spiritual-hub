import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
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

/** Calculate total points from all logs */
export function calculateTotalPoints(logs: WorshipLog[]): number {
  return logs.reduce((sum, log) => sum + calculateDayPoints(log), 0);
}

/** Calculate points for the last 7 days */
export function calculateWeeklyPoints(logs: WorshipLog[]): number {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return logs
    .filter((l) => new Date(l.date) >= weekAgo)
    .reduce((sum, log) => sum + calculateDayPoints(log), 0);
}

/** Calculate consecutive streak of days with at least one prayer completed */
export function calculateStreak(logs: WorshipLog[]): number {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // If no log for today AND no log for yesterday, streak is zero
  const hasToday = sorted.some(
    (l) => l.date === today && l.prayers.some((p) => p.completed),
  );
  const hasYesterday = sorted.some(
    (l) => l.date === yesterday && l.prayers.some((p) => p.completed),
  );

  if (!hasToday && !hasYesterday) return 0;

  // Check backwards from today/yesterday
  for (let i = 0; ; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split("T")[0];

    const log = sorted.find((l) => l.date === dStr);
    if (log && log.prayers.some((p) => p.completed)) {
      streak++;
    } else {
      // If we missed today but have yesterday, we continue.
      // If we missed any other day, we stop.
      if (i === 0 && hasYesterday) continue;
      break;
    }
  }
  return streak;
}

export async function getTotalPoints(userId: string): Promise<number> {
  const logs = await getLogsByUser(userId);
  return calculateTotalPoints(logs);
}

export async function getWeeklyPoints(userId: string): Promise<number> {
  const logs = await getLogsByUser(userId);
  return calculateWeeklyPoints(logs);
}

export async function getStreak(userId: string): Promise<number> {
  const logs = await getLogsByUser(userId);
  return calculateStreak(logs);
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
