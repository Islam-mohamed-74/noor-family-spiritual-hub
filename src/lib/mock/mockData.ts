import { User, Family, WorshipLog, Reward, Challenge, Badge } from '@/types';

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return formatDate(d);
};

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'أبو محمد', email: 'father@noor.com', password: '123', role: 'admin', familyId: 'f1', avatar: '👨' },
  { id: 'u2', name: 'أم محمد', email: 'mother@noor.com', password: '123', role: 'admin', familyId: 'f1', avatar: '👩' },
  { id: 'u3', name: 'محمد', email: 'child1@noor.com', password: '123', role: 'member', familyId: 'f1', avatar: '👦' },
  { id: 'u4', name: 'فاطمة', email: 'child2@noor.com', password: '123', role: 'member', familyId: 'f1', avatar: '👧' },
];

export const MOCK_FAMILY: Family = {
  id: 'f1',
  name: 'عائلة النور',
  members: ['u1', 'u2', 'u3', 'u4'],
  sharedKhatma: { targetPages: 604, completedPages: 187 },
};

function generatePrayers(completionRate: number) {
  const names: Array<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'> = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  return names.map(name => ({
    name,
    completed: Math.random() < completionRate,
    onTime: Math.random() < 0.7,
    jamaah: Math.random() < 0.5,
  }));
}

function generateLogs(userId: string, rate: number): WorshipLog[] {
  return Array.from({ length: 7 }, (_, i) => ({
    id: `wl-${userId}-${i}`,
    userId,
    date: daysAgo(6 - i),
    prayers: generatePrayers(rate),
    azpiMorning: Math.random() < rate,
    azpiEvening: Math.random() < rate * 0.8,
    quranPages: Math.floor(Math.random() * 5) + 1,
    fasting: Math.random() < 0.3,
    duha: Math.random() < rate * 0.6,
    witr: Math.random() < rate * 0.8,
    qiyam: Math.random() < rate * 0.4,
    qiyamPrivate: true,
    sadaqaPrivate: Math.random() < 0.3,
    duaPrivate: Math.random() < 0.5,
    iftar: false,
    tarawih: false,
    tarawihRakaat: 0,
  }));
}

export const MOCK_WORSHIP_LOGS: WorshipLog[] = [
  ...generateLogs('u1', 0.9),
  ...generateLogs('u2', 0.85),
  ...generateLogs('u3', 0.7),
  ...generateLogs('u4', 0.6),
];

export const MOCK_REWARDS: Reward[] = [
  { id: 'r1', name: 'نزهة عائلية', description: 'رحلة إلى الحديقة', pointsRequired: 200, familyId: 'f1', createdBy: 'u1' },
  { id: 'r2', name: 'وجبة مفضلة', description: 'اختيار وجبة الغداء', pointsRequired: 100, familyId: 'f1', createdBy: 'u1' },
  { id: 'r3', name: 'هدية صغيرة', description: 'هدية تشجيعية', pointsRequired: 300, familyId: 'f1', createdBy: 'u2' },
];

export const MOCK_CHALLENGES: Challenge[] = [
  { id: 'c1', name: 'تحدي الفجر', description: 'صلاة الفجر في وقتها ٧ أيام', targetDays: 7, currentDays: 4, familyId: 'f1', active: true },
  { id: 'c2', name: 'ختمة جماعية', description: 'إكمال ختمة قرآن كاملة', targetDays: 30, currentDays: 12, familyId: 'f1', active: true },
];

export const MOCK_BADGES: Badge[] = [
  { id: 'b1', name: 'فارس الفجر', description: 'صلاة الفجر ٧ أيام متتالية', icon: '🌅', requirement: 'fajr_streak', threshold: 7 },
  { id: 'b2', name: 'بطل الأذكار', description: 'أذكار الصباح والمساء ٧ أيام', icon: '📿', requirement: 'azkar_streak', threshold: 7 },
  { id: 'b3', name: 'صاحب الهمة', description: 'أكثر من ١٠٠ نقطة في أسبوع', icon: '⭐', requirement: 'weekly_points', threshold: 100 },
  { id: 'b4', name: 'حافظ القرآن', description: 'قراءة ١٠٠ صفحة', icon: '📖', requirement: 'quran_pages', threshold: 100 },
  { id: 'b5', name: 'المثابر', description: 'سلسلة ٣٠ يوم متتالية', icon: '🔥', requirement: 'general_streak', threshold: 30 },
];
