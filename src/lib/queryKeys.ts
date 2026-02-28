// ---------------------------------------------------------------------------
// Centralised React Query key factory.
// Every useQuery / useMutation key should be derived from this object so that
// targeted invalidations are always correct and never rely on magic strings.
// ---------------------------------------------------------------------------

export const qk = {
  // --- Worship ----------------------------------------------------------
  /** Today's worship log for a user */
  worshipLogToday: (userId: string) =>
    ["worship", "log", "today", userId] as const,

  /** All logs for a user (used by points / streaks / badges) */
  worshipLogsByUser: (userId: string) => ["worship", "logs", userId] as const,

  /** Points totals for a user */
  userPoints: (userId: string) => ["worship", "points", userId] as const,

  /** Leaderboard — all members weekly + total stats */
  leaderboard: (familyId?: string) =>
    ["family", "leaderboard", familyId ?? "current"] as const,

  /** User badges */
  userBadges: (userId: string) => ["worship", "badges", userId] as const,

  // --- Family -----------------------------------------------------------
  /** Family metadata (name, khatma, …) */
  family: (familyId?: string) =>
    ["family", "meta", familyId ?? "current"] as const,

  /** All members of the current (or given) family */
  familyMembers: (familyId?: string) =>
    ["family", "members", familyId ?? "current"] as const,

  /** Family daily prayer completion percentage for a given date */
  familyDailyCompletion: (date: string) =>
    ["family", "daily-completion", date] as const,

  // --- Social -----------------------------------------------------------
  /** Nudge inbox for a user */
  nudges: (userId: string) => ["social", "nudges", userId] as const,

  // --- Reports ----------------------------------------------------------
  /** N-day personal chart data for a user */
  reportsPersonal: (userId: string, days?: number) =>
    ["reports", "personal", userId, days ?? 7] as const,

  /** N-day family comparison chart data */
  reportsFamily: (familyId?: string, days?: number) =>
    ["reports", "family", familyId ?? "current", days ?? 7] as const,

  /** Weekly summary report for a user */
  weeklyReport: (userId: string) => ["reports", "weekly", userId] as const,

  // --- Prayer Times -----------------------------------------------------
  /** Prayer times for a specific location and date */
  prayerTimes: (lat: number, lng: number, date: string) =>
    ["prayer-times", lat, lng, date] as const,
} as const;
