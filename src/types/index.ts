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

export const PRAYER_NAMES: Record<PrayerName, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

export const POINTS = {
  prayer: 10,
  prayerOnTime: 5,
  prayerJamaah: 5,
  azpiMorning: 8,
  azpiEvening: 8,
  quranPage: 3,
  fasting: 15,
  duha: 7,
  witr: 7,
  qiyam: 12,
  sadaqa: 10,
  dua: 5,
  iftar: 5,
  tarawih: 15,
};
