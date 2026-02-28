import { Badge } from "@/types";
import { getLogsByUser } from "./logsService";
import { getWeeklyPoints, getStreak } from "./pointsService";

// ---------------------------------------------------------------------------
// Badge definitions
// ---------------------------------------------------------------------------

export const ALL_BADGES: Badge[] = [
  {
    id: "b1",
    name: "فارس الفجر",
    description: "صلاة الفجر ٧ أيام متتالية",
    icon: "🌅",
    requirement: "fajr_streak",
    threshold: 7,
  },
  {
    id: "b2",
    name: "بطل الأذكار",
    description: "أذكار الصباح والمساء ٧ أيام",
    icon: "📿",
    requirement: "azkar_streak",
    threshold: 7,
  },
  {
    id: "b3",
    name: "صاحب الهمة",
    description: "أكثر من ١٠٠ نقطة في أسبوع",
    icon: "⭐",
    requirement: "weekly_points",
    threshold: 100,
  },
  {
    id: "b4",
    name: "حافظ القرآن",
    description: "قراءة ١٠٠ صفحة",
    icon: "📖",
    requirement: "quran_pages",
    threshold: 100,
  },
  {
    id: "b5",
    name: "المثابر",
    description: "سلسلة ٣٠ يوم متتالية",
    icon: "🔥",
    requirement: "general_streak",
    threshold: 30,
  },
];

// ---------------------------------------------------------------------------
// Badge queries
// ---------------------------------------------------------------------------

export function getBadges(): Badge[] {
  return ALL_BADGES;
}

export async function getUserBadges(userId: string): Promise<Badge[]> {
  const logs = await getLogsByUser(userId);
  const earned: Badge[] = [];

  const fajrDays = logs.filter(
    (l) => l.prayers.find((p) => p.name === "fajr")?.completed,
  ).length;
  if (fajrDays >= 7) earned.push(ALL_BADGES[0]);

  const azkarDays = logs.filter((l) => l.azpiMorning && l.azpiEvening).length;
  if (azkarDays >= 7) earned.push(ALL_BADGES[1]);

  const weeklyPts = await getWeeklyPoints(userId);
  if (weeklyPts >= 100) earned.push(ALL_BADGES[2]);

  const totalPages = logs.reduce((s, l) => s + l.quranPages, 0);
  if (totalPages >= 100) earned.push(ALL_BADGES[3]);

  const streak = await getStreak(userId);
  if (streak >= 30) earned.push(ALL_BADGES[4]);

  return earned;
}
