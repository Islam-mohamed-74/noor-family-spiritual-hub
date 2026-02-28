import { TitleRule } from "@/types";

// ---------------------------------------------------------------------------
// Dynamic Title Engine  (Task 15)
// ---------------------------------------------------------------------------
// Titles are awarded based on the highest threshold the member has crossed.
// ---------------------------------------------------------------------------

export const TITLE_RULES: TitleRule[] = [
  // ── Fajr streak ──────────────────────────────────────────────────────────
  {
    id: "t-fajr-bronze",
    title: "محافظ الفجر",
    titleEn: "Fajr Guardian",
    icon: "🌅",
    requirement: "fajr_streak",
    threshold: 7,
    tier: "bronze",
  },
  {
    id: "t-fajr-silver",
    title: "فارس الفجر",
    titleEn: "Fajr Knight",
    icon: "🌄",
    requirement: "fajr_streak",
    threshold: 21,
    tier: "silver",
  },
  {
    id: "t-fajr-gold",
    title: "سيد الفجر",
    titleEn: "Master of Fajr",
    icon: "☀️",
    requirement: "fajr_streak",
    threshold: 60,
    tier: "gold",
  },

  // ── General streak ───────────────────────────────────────────────────────
  {
    id: "t-streak-bronze",
    title: "المثابر",
    titleEn: "The Persistent",
    icon: "🔥",
    requirement: "general_streak",
    threshold: 7,
    tier: "bronze",
  },
  {
    id: "t-streak-silver",
    title: "بطل الاستمرار",
    titleEn: "Champion of Consistency",
    icon: "💪",
    requirement: "general_streak",
    threshold: 30,
    tier: "silver",
  },
  {
    id: "t-streak-gold",
    title: "أسطورة العبادة",
    titleEn: "Worship Legend",
    icon: "🏆",
    requirement: "general_streak",
    threshold: 90,
    tier: "gold",
  },

  // ── Weekly points ────────────────────────────────────────────────────────
  {
    id: "t-weekly-bronze",
    title: "نشيط الأسبوع",
    titleEn: "Weekly Active",
    icon: "⭐",
    requirement: "weekly_points",
    threshold: 100,
    tier: "bronze",
  },
  {
    id: "t-weekly-silver",
    title: "صاحب الهمة",
    titleEn: "High Spirited",
    icon: "🌟",
    requirement: "weekly_points",
    threshold: 250,
    tier: "silver",
  },
  {
    id: "t-weekly-gold",
    title: "بطل الأسبوع",
    titleEn: "Weekly Champion",
    icon: "🥇",
    requirement: "weekly_points",
    threshold: 500,
    tier: "gold",
  },

  // ── Total points ─────────────────────────────────────────────────────────
  {
    id: "t-total-bronze",
    title: "عضو فاعل",
    titleEn: "Active Member",
    icon: "🙌",
    requirement: "total_points",
    threshold: 500,
    tier: "bronze",
  },
  {
    id: "t-total-silver",
    title: "نجم العائلة",
    titleEn: "Family Star",
    icon: "💫",
    requirement: "total_points",
    threshold: 2000,
    tier: "silver",
  },
  {
    id: "t-total-gold",
    title: "قدوة العائلة",
    titleEn: "Family Role Model",
    icon: "👑",
    requirement: "total_points",
    threshold: 5000,
    tier: "gold",
  },

  // ── Azkar streak ─────────────────────────────────────────────────────────
  {
    id: "t-azkar-bronze",
    title: "ذاكر الله",
    titleEn: "Remembers Allah",
    icon: "📿",
    requirement: "azkar_streak",
    threshold: 7,
    tier: "bronze",
  },
  {
    id: "t-azkar-silver",
    title: "بطل الأذكار",
    titleEn: "Dhikr Champion",
    icon: "🤲",
    requirement: "azkar_streak",
    threshold: 30,
    tier: "silver",
  },

  // ── Quran pages ──────────────────────────────────────────────────────────
  {
    id: "t-quran-bronze",
    title: "قارئ متميز",
    titleEn: "Devoted Reader",
    icon: "📖",
    requirement: "quran_pages",
    threshold: 30,
    tier: "bronze",
  },
  {
    id: "t-quran-silver",
    title: "حافظ القرآن",
    titleEn: "Quran Guardian",
    icon: "📚",
    requirement: "quran_pages",
    threshold: 100,
    tier: "silver",
  },
  {
    id: "t-quran-gold",
    title: "ختام القرآن",
    titleEn: "Khatm Achiever",
    icon: "🌙",
    requirement: "quran_pages",
    threshold: 604,
    tier: "gold",
  },
];

export interface MemberStats {
  fajrStreak: number;
  generalStreak: number;
  weeklyPoints: number;
  totalPoints: number;
  quranPages: number;
  azkarStreak: number;
}

/**
 * Returns the highest-tier title earned for a member based on their stats.
 * Priority: gold > silver > bronze; falls back to "مبتدئ".
 */
export function getMemberTitle(stats: MemberStats): TitleRule | null {
  const matched: TitleRule[] = [];

  for (const rule of TITLE_RULES) {
    const value = stats[statKey(rule.requirement)];
    if (value >= rule.threshold) {
      matched.push(rule);
    }
  }

  if (!matched.length) return null;

  // Sort by tier weight then threshold descending
  const weight = { gold: 3, silver: 2, bronze: 1 };
  matched.sort(
    (a, b) => weight[b.tier] - weight[a.tier] || b.threshold - a.threshold,
  );

  return matched[0];
}

/**
 * Returns ALL titles earned (for profile display).
 */
export function getAllEarnedTitles(stats: MemberStats): TitleRule[] {
  return TITLE_RULES.filter(
    (rule) => stats[statKey(rule.requirement)] >= rule.threshold,
  );
}

function statKey(req: TitleRule["requirement"]): keyof MemberStats {
  const map: Record<TitleRule["requirement"], keyof MemberStats> = {
    fajr_streak: "fajrStreak",
    general_streak: "generalStreak",
    weekly_points: "weeklyPoints",
    total_points: "totalPoints",
    quran_pages: "quranPages",
    azkar_streak: "azkarStreak",
  };
  return map[req];
}
