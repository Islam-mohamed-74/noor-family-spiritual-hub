import { User, Family, WorshipLog, Reward, Challenge, Badge, Nudge, POINTS } from '@/types';
import { MOCK_USERS, MOCK_FAMILY, MOCK_WORSHIP_LOGS, MOCK_REWARDS, MOCK_CHALLENGES, MOCK_BADGES } from '@/lib/mock/mockData';

const STORAGE_KEYS = {
  users: 'noor_users',
  family: 'noor_family',
  logs: 'noor_worship_logs',
  rewards: 'noor_rewards',
  challenges: 'noor_challenges',
  nudges: 'noor_nudges',
};

function load<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}
function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Initialize if empty
function init() {
  if (!localStorage.getItem(STORAGE_KEYS.users)) save(STORAGE_KEYS.users, MOCK_USERS);
  if (!localStorage.getItem(STORAGE_KEYS.family)) save(STORAGE_KEYS.family, MOCK_FAMILY);
  if (!localStorage.getItem(STORAGE_KEYS.logs)) save(STORAGE_KEYS.logs, MOCK_WORSHIP_LOGS);
  if (!localStorage.getItem(STORAGE_KEYS.rewards)) save(STORAGE_KEYS.rewards, MOCK_REWARDS);
  if (!localStorage.getItem(STORAGE_KEYS.challenges)) save(STORAGE_KEYS.challenges, MOCK_CHALLENGES);
  if (!localStorage.getItem(STORAGE_KEYS.nudges)) save(STORAGE_KEYS.nudges, []);
}
init();

// --- Users ---
export function getUsers(): User[] { return load(STORAGE_KEYS.users, MOCK_USERS); }
export function getUserById(id: string): User | undefined { return getUsers().find(u => u.id === id); }
export function authenticate(email: string, password: string): User | null {
  const user = getUsers().find(u => u.email === email && u.password === password);
  return user || null;
}
export function addUser(user: User) {
  const users = getUsers();
  users.push(user);
  save(STORAGE_KEYS.users, users);
}

// --- Family ---
export function getFamily(): Family { return load(STORAGE_KEYS.family, MOCK_FAMILY); }
export function updateFamily(family: Family) { save(STORAGE_KEYS.family, family); }
export function getFamilyMembers(): User[] {
  const family = getFamily();
  const users = getUsers();
  return users.filter(u => family.members.includes(u.id));
}

// --- Worship Logs ---
export function getWorshipLogs(): WorshipLog[] { return load(STORAGE_KEYS.logs, MOCK_WORSHIP_LOGS); }
export function getLogsByUser(userId: string): WorshipLog[] { return getWorshipLogs().filter(l => l.userId === userId); }
export function getLogByUserAndDate(userId: string, date: string): WorshipLog | undefined {
  return getWorshipLogs().find(l => l.userId === userId && l.date === date);
}
export function getTodayLog(userId: string): WorshipLog {
  const date = new Date().toISOString().split('T')[0];
  const existing = getLogByUserAndDate(userId, date);
  if (existing) return existing;
  const newLog: WorshipLog = {
    id: `wl-${userId}-${Date.now()}`,
    userId, date,
    prayers: [
      { name: 'fajr', completed: false, onTime: false, jamaah: false },
      { name: 'dhuhr', completed: false, onTime: false, jamaah: false },
      { name: 'asr', completed: false, onTime: false, jamaah: false },
      { name: 'maghrib', completed: false, onTime: false, jamaah: false },
      { name: 'isha', completed: false, onTime: false, jamaah: false },
    ],
    azpiMorning: false, azpiEvening: false,
    quranPages: 0, fasting: false,
    duha: false, witr: false, qiyam: false,
    qiyamPrivate: true, sadaqaPrivate: false, duaPrivate: false,
    iftar: false, tarawih: false, tarawihRakaat: 0,
  };
  saveLog(newLog);
  return newLog;
}
export function saveLog(log: WorshipLog) {
  const logs = getWorshipLogs();
  const idx = logs.findIndex(l => l.id === log.id);
  if (idx >= 0) logs[idx] = log; else logs.push(log);
  save(STORAGE_KEYS.logs, logs);
}

// --- Points ---
export function calculateDayPoints(log: WorshipLog): number {
  let pts = 0;
  log.prayers.forEach(p => {
    if (p.completed) pts += POINTS.prayer;
    if (p.onTime) pts += POINTS.prayerOnTime;
    if (p.jamaah) pts += POINTS.prayerJamaah;
  });
  if (log.azpiMorning) pts += POINTS.azpiMorning;
  if (log.azpiEvening) pts += POINTS.azpiEvening;
  pts += log.quranPages * POINTS.quranPage;
  if (log.fasting) pts += POINTS.fasting;
  if (log.duha) pts += POINTS.duha;
  if (log.witr) pts += POINTS.witr;
  if (log.qiyam) pts += POINTS.qiyam;
  if (log.sadaqaPrivate) pts += POINTS.sadaqa;
  if (log.duaPrivate) pts += POINTS.dua;
  if (log.iftar) pts += POINTS.iftar;
  if (log.tarawih) pts += POINTS.tarawih;
  return pts;
}
export function getWeeklyPoints(userId: string): number {
  const logs = getLogsByUser(userId);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  return logs.filter(l => new Date(l.date) >= weekAgo).reduce((s, l) => s + calculateDayPoints(l), 0);
}
export function getTotalPoints(userId: string): number {
  return getLogsByUser(userId).reduce((s, l) => s + calculateDayPoints(l), 0);
}

// --- Streaks ---
export function getStreak(userId: string): number {
  const logs = getLogsByUser(userId).sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < logs.length; i++) {
    const expected = new Date(d);
    expected.setDate(expected.getDate() - i);
    const expStr = expected.toISOString().split('T')[0];
    const log = logs.find(l => l.date === expStr);
    if (log && log.prayers.some(p => p.completed)) streak++; else break;
  }
  return streak;
}

// --- Rewards ---
export function getRewards(): Reward[] { return load(STORAGE_KEYS.rewards, MOCK_REWARDS); }
export function addReward(reward: Reward) { const r = getRewards(); r.push(reward); save(STORAGE_KEYS.rewards, r); }
export function deleteReward(id: string) { save(STORAGE_KEYS.rewards, getRewards().filter(r => r.id !== id)); }

// --- Challenges ---
export function getChallenges(): Challenge[] { return load(STORAGE_KEYS.challenges, MOCK_CHALLENGES); }
export function addChallenge(challenge: Challenge) { const c = getChallenges(); c.push(challenge); save(STORAGE_KEYS.challenges, c); }
export function updateChallenge(challenge: Challenge) {
  const cs = getChallenges(); const i = cs.findIndex(c => c.id === challenge.id);
  if (i >= 0) cs[i] = challenge; save(STORAGE_KEYS.challenges, cs);
}

// --- Badges ---
export function getBadges(): Badge[] { return MOCK_BADGES; }
export function getUserBadges(userId: string): Badge[] {
  const logs = getLogsByUser(userId);
  const badges: Badge[] = [];
  const allBadges = getBadges();
  // Check fajr streak
  const fajrStreak = logs.filter(l => l.prayers.find(p => p.name === 'fajr')?.completed).length;
  if (fajrStreak >= 7) badges.push(allBadges[0]);
  // Azkar streak
  const azkarStreak = logs.filter(l => l.azpiMorning && l.azpiEvening).length;
  if (azkarStreak >= 7) badges.push(allBadges[1]);
  // Weekly points
  if (getWeeklyPoints(userId) >= 100) badges.push(allBadges[2]);
  // Quran pages
  const totalPages = logs.reduce((s, l) => s + l.quranPages, 0);
  if (totalPages >= 100) badges.push(allBadges[3]);
  return badges;
}

// --- Nudges ---
export function getNudges(userId: string): Nudge[] {
  return load<Nudge[]>(STORAGE_KEYS.nudges, []).filter(n => n.toUserId === userId);
}
export function sendNudge(nudge: Nudge) {
  const nudges = load<Nudge[]>(STORAGE_KEYS.nudges, []);
  nudges.push(nudge);
  save(STORAGE_KEYS.nudges, nudges);
}
export function markNudgeRead(id: string) {
  const nudges = load<Nudge[]>(STORAGE_KEYS.nudges, []);
  const n = nudges.find(x => x.id === id);
  if (n) n.read = true;
  save(STORAGE_KEYS.nudges, nudges);
}

// --- Family daily completion ---
export function getFamilyDailyCompletion(date: string): number {
  const members = getFamilyMembers();
  if (!members.length) return 0;
  const logs = getWorshipLogs().filter(l => l.date === date);
  let total = 0;
  members.forEach(m => {
    const log = logs.find(l => l.userId === m.id);
    if (log) {
      const completed = log.prayers.filter(p => p.completed).length;
      total += completed / 5;
    }
  });
  return Math.round((total / members.length) * 100);
}
