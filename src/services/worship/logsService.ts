import { supabase } from "@/lib/supabase";
import { WorshipLog } from "@/types";

// ---------------------------------------------------------------------------
// Internal mapping helpers
// ---------------------------------------------------------------------------

export function mapSupabaseLogToWorshipLog(data: any): WorshipLog {
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
    quranSurahNote: data.quran_surah_note ?? "",
    fastingType: data.fasting_type ?? undefined,
  };
}

export function mapWorshipLogToSupabase(log: WorshipLog) {
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
    quran_surah_note: log.quranSurahNote ?? null,
    fasting_type: log.fastingType ?? null,
  };
}

// ---------------------------------------------------------------------------
// Worship log CRUD
// ---------------------------------------------------------------------------

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

    return (data || []).map(mapSupabaseLogToWorshipLog);
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

    return (data || []).map(mapSupabaseLogToWorshipLog);
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
      if (error.code === "PGRST116") return null; // no rows
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

  if (existing) return existing;

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

/**
 * Persists computed totalPoints and streak back to the users table
 * so leaderboard reads are O(1) instead of O(n) over all logs.
 */
export async function persistUserStats(
  userId: string,
  totalPoints: number,
  streak: number,
): Promise<void> {
  await supabase
    .from("users")
    .update({ total_points: totalPoints, current_streak: streak })
    .eq("id", userId);
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
