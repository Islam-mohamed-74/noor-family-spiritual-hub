import { supabase } from "@/lib/supabase";
import { WorshipLog, Family, User, POINTS } from "@/types";

/**
 * Supabase-based Worship Service
 *
 * This service provides functions to interact with Supabase database
 * for worship logs, family data, and related operations.
 *
 * IMPORTANT: Before using these functions, ensure the following tables
 * exist in your Supabase database with proper RLS policies:
 * - users (id, email, name, avatar, role, family_id)
 * - families (id, name, invite_code, shared_khatma_target, shared_khatma_completed)
 * - worship_logs (id, user_id, date, prayers, azpi_morning, azpi_evening, quran_pages, etc.)
 */

// --- Worship Logs ---

export async function getWorshipLogs(): Promise<WorshipLog[]> {
  try {
    const { data, error } = await supabase
      .from("worship_logs")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching worship logs:", error);
      return [];
    }

    return mapSupabaseLogsToWorshipLogs(data || []);
  } catch (error) {
    console.error("Error getting worship logs:", error);
    return [];
  }
}

export async function getLogsByUser(userId: string): Promise<WorshipLog[]> {
  try {
    const { data, error } = await supabase
      .from("worship_logs")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching logs by user:", error);
      return [];
    }

    return mapSupabaseLogsToWorshipLogs(data || []);
  } catch (error) {
    console.error("Error getting logs by user:", error);
    return [];
  }
}

export async function getLogByUserAndDate(
  userId: string,
  date: string,
): Promise<WorshipLog | null> {
  try {
    const { data, error } = await supabase
      .from("worship_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      console.error("Error fetching log:", error);
      return null;
    }

    return mapSupabaseLogToWorshipLog(data);
  } catch (error) {
    console.error("Error getting log by user and date:", error);
    return null;
  }
}

export async function getTodayLog(userId: string): Promise<WorshipLog | null> {
  const date = new Date().toISOString().split("T")[0];
  const existing = await getLogByUserAndDate(userId, date);

  if (existing) {
    return existing;
  }

  // Create new log for today
  const newLog: WorshipLog = {
    id: `wl-${userId}-${Date.now()}`,
    userId,
    date,
    prayers: [
      { name: "fajr", completed: false, onTime: false, jamaah: false },
      { name: "dhuhr", completed: false, onTime: false, jamaah: false },
      { name: "asr", completed: false, onTime: false, jamaah: false },
      { name: "maghrib", completed: false, onTime: false, jamaah: false },
      { name: "isha", completed: false, onTime: false, jamaah: false },
    ],
    azpiMorning: false,
    azpiEvening: false,
    quranPages: 0,
    fasting: false,
    duha: false,
    witr: false,
    qiyam: false,
    qiyamPrivate: true,
    sadaqaPrivate: false,
    duaPrivate: false,
    iftar: false,
    tarawih: false,
    tarawihRakaat: 0,
  };

  await saveLog(newLog);
  return newLog;
}

export async function saveLog(log: WorshipLog): Promise<{ error?: string }> {
  try {
    const supabaseLog = mapWorshipLogToSupabase(log);

    const { error } = await supabase.from("worship_logs").upsert(supabaseLog, {
      onConflict: "user_id,date",
    });

    if (error) {
      console.error("Error saving log:", error);
      return { error: error.message };
    }

    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error saving log:", error);
    return { error: message };
  }
}

// --- Family ---

export async function getFamily(familyId?: string): Promise<Family | null> {
  try {
    // If no familyId provided, get it from current user
    if (!familyId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("users")
        .select("family_id")
        .eq("id", user.id)
        .single();

      if (!profile?.family_id) return null;
      familyId = profile.family_id;
    }

    const { data, error } = await supabase
      .from("families")
      .select("*")
      .eq("id", familyId)
      .single();

    if (error) {
      console.error("Error fetching family:", error);
      return null;
    }

    // Get family members
    const { data: members } = await supabase
      .from("users")
      .select("id")
      .eq("family_id", familyId);

    return {
      id: data.id,
      name: data.name,
      members: members?.map((m) => m.id) || [],
      sharedKhatma: {
        targetPages: data.shared_khatma_target || 0,
        completedPages: data.shared_khatma_completed || 0,
      },
    };
  } catch (error) {
    console.error("Error getting family:", error);
    return null;
  }
}

export async function getFamilyMembers(familyId?: string): Promise<User[]> {
  try {
    // If no familyId provided, get it from current user
    if (!familyId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("users")
        .select("family_id")
        .eq("id", user.id)
        .single();

      if (!profile?.family_id) return [];
      familyId = profile.family_id;
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("family_id", familyId);

    if (error) {
      console.error("Error fetching family members:", error);
      return [];
    }

    return (data || []).map(mapSupabaseUserToUser);
  } catch (error) {
    console.error("Error getting family members:", error);
    return [];
  }
}

export async function updateFamily(
  family: Partial<Family> & { id: string },
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from("families")
      .update({
        name: family.name,
        shared_khatma_target: family.sharedKhatma?.targetPages,
        shared_khatma_completed: family.sharedKhatma?.completedPages,
      })
      .eq("id", family.id);

    if (error) {
      console.error("Error updating family:", error);
      return { error: error.message };
    }

    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating family:", error);
    return { error: message };
  }
}

// --- Points and Stats ---

export function calculateDayPoints(log: WorshipLog): number {
  let pts = 0;
  log.prayers.forEach((p) => {
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
  const sortedLogs = logs.sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < sortedLogs.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split("T")[0];

    const log = sortedLogs.find((l) => l.date === expectedStr);
    if (log && log.prayers.some((p) => p.completed)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
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

// --- Helper mapping functions ---

function mapSupabaseLogToWorshipLog(data: any): WorshipLog {
  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    prayers: data.prayers || [],
    azpiMorning: data.azpi_morning || false,
    azpiEvening: data.azpi_evening || false,
    quranPages: data.quran_pages || 0,
    fasting: data.fasting || false,
    duha: data.duha || false,
    witr: data.witr || false,
    qiyam: data.qiyam || false,
    qiyamPrivate: data.qiyam_private ?? true,
    sadaqaPrivate: data.sadaqa_private || false,
    duaPrivate: data.dua_private || false,
    iftar: data.iftar || false,
    tarawih: data.tarawih || false,
    tarawihRakaat: data.tarawih_rakaat || 0,
  };
}

function mapSupabaseLogsToWorshipLogs(data: any[]): WorshipLog[] {
  return data.map(mapSupabaseLogToWorshipLog);
}

function mapWorshipLogToSupabase(log: WorshipLog) {
  return {
    id: log.id,
    user_id: log.userId,
    date: log.date,
    prayers: log.prayers,
    azpi_morning: log.azpiMorning,
    azpi_evening: log.azpiEvening,
    quran_pages: log.quranPages,
    fasting: log.fasting,
    duha: log.duha,
    witr: log.witr,
    qiyam: log.qiyam,
    qiyam_private: log.qiyamPrivate,
    sadaqa_private: log.sadaqaPrivate,
    dua_private: log.duaPrivate,
    iftar: log.iftar,
    tarawih: log.tarawih,
    tarawih_rakaat: log.tarawihRakaat,
  };
}

function mapSupabaseUserToUser(data: any): User {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    familyId: data.family_id || "",
    avatar: data.avatar || "👤",
  };
}
