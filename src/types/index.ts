export type UserRole = "admin" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // only present in mock/localStorage mode
  role: UserRole;
  familyId: string;
  avatar?: string;
}

export interface Family {
  id: string;
  name: string;
  members: string[]; // user IDs
  sharedKhatma: {
    targetPages: number;
    completedPages: number;
  };
}

export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export interface PrayerLog {
  name: PrayerName;
  completed: boolean;
  onTime: boolean;
  jamaah: boolean;
  rawatib?: boolean; // Sunnah rawatib prayers for this prayer time
}

export interface WorshipLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  prayers: PrayerLog[];
  azpiMorning: boolean;
  azpiEvening: boolean;
  quranPages: number;
  fasting: boolean;
  duha: boolean;
  witr: boolean;
  qiyam: boolean;
  qiyamPrivate: boolean;
  sadaqaPrivate: boolean;
  duaPrivate: boolean;
  // Ramadan extras
  iftar: boolean;
  tarawih: boolean;
  tarawihRakaat: number;
  // Optional enrichment fields
  quranSurahNote?: string; // e.g. "سورة البقرة – الجزء الأول"
  fastingType?: "fard" | "sunnah"; // mandatory vs. voluntary fasting
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  threshold: number;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  familyId: string;
  createdBy: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  targetDays: number;
  currentDays: number;
  familyId: string;
  active: boolean;
}

export interface Nudge {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export const PRAYER_NAMES: Record<PrayerName, { icon: string; label: string }> =
  {
    fajr: { icon: "🌅", label: "الفجر" },
    dhuhr: { icon: "☀️", label: "الظهر" },
    asr: { icon: "🌤️", label: "العصر" },
    maghrib: { icon: "🌇", label: "المغرب" },
    isha: { icon: "🌙", label: "العشاء" },
  };

export const POINTS = {
  prayer: 10,
  prayerOnTime: 5,
  prayerJamaah: 5,
  rawatib: 5, // Sunnah rawatib prayer
  azpiMorning: 8,
  azpiEvening: 8,
  quranPage: 3,
  fasting: 15,
  fastingSunnah: 10, // voluntary / Sunnah fast
  duha: 7,
  witr: 7,
  qiyam: 12,
  sadaqa: 10,
  dua: 5,
  iftar: 5,
  tarawih: 15,
};

// ---------------------------------------------------------------------------
// Task 12 – Activity Feed
// ---------------------------------------------------------------------------
export type ActivityType =
  | "prayer"
  | "quran"
  | "azkar"
  | "fasting"
  | "challenge"
  | "badge"
  | "reward"
  | "streak";

export interface ActivityEvent {
  id: string;
  familyId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  activityType: ActivityType;
  activityKey?: string;
  description: string;
  pointsEarned: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Task 13 – Challenge Participants (Challenges v2)
// ---------------------------------------------------------------------------
export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  progress: number;
  joinedAt: string;
  completedAt?: string;
}

// ---------------------------------------------------------------------------
// Task 14 – Family Events
// ---------------------------------------------------------------------------
export type EventType = "prayer" | "quran" | "gathering" | "general";

export interface FamilyEvent {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  eventDate: string;
  eventType: EventType;
  createdBy: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Task 15 – Dynamic Titles
// ---------------------------------------------------------------------------
export interface TitleRule {
  id: string;
  title: string;
  titleEn: string;
  icon: string;
  requirement:
    | "fajr_streak"
    | "general_streak"
    | "total_points"
    | "weekly_points"
    | "quran_pages"
    | "azkar_streak";
  threshold: number;
  tier: "bronze" | "silver" | "gold";
}

// ---------------------------------------------------------------------------
// Task 16 – Reward Redemption
// ---------------------------------------------------------------------------
export type ClaimStatus = "pending" | "approved" | "rejected";

export interface RewardClaim {
  id: string;
  rewardId: string;
  rewardName?: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  familyId: string;
  status: ClaimStatus;
  pointsCost: number;
  claimedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

// ---------------------------------------------------------------------------
// Task 18 – Feedback System
// ---------------------------------------------------------------------------
export type FeedbackType = "bug" | "suggestion" | "praise";
export type FeedbackStatus = "open" | "reviewed";

export interface Feedback {
  id: string;
  userId: string;
  userName?: string;
  familyId?: string;
  type: FeedbackType;
  message: string;
  status: FeedbackStatus;
  createdAt: string;
}
