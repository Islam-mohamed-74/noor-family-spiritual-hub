import { createClient } from "@/lib/supabase/server";
import { calculateDayPoints } from "@/services/worship/pointsService";
import { mapSupabaseLogToWorshipLog } from "@/services/worship/logsService";
import { WorshipLog } from "@/types";

export async function getDashboardData() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { user: null, dashboardData: null };
  }

  // Fetch user data from our users table for metadata (avatar, name, points, streak)
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    return { user: null, dashboardData: null };
  }

  // Fetch worship logs for the user
  const { data: logsData, error: logsError } = await supabase
    .from("worship_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  const logs = (logsData || []).map(mapSupabaseLogToWorshipLog);
  const todayStr = new Date().toISOString().split("T")[0];
  let todayLog = logs.find((l) => l.date === todayStr) || null;

  // If no today log, we don't create it here (SSR should be read-only if possible)
  // But we need a default structure for the UI if it doesn't exist
  if (!todayLog) {
    todayLog = {
      id: `wl-temp-${Date.now()}`,
      userId: user.id,
      date: todayStr,
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
  }

  const totalPoints = logs.reduce((sum, l) => sum + calculateDayPoints(l), 0);

  // Calculate streak
  let streak = 0;
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const today = new Date();
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split("T")[0];
    const log = sorted.find((l) => l.date === expectedStr);
    if (log && log.prayers.some((p) => p.completed)) streak++;
    else if (i === 0)
      continue; // Skip today if not yet started
    else break;
  }

  return {
    user: {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      role: userData.role,
      familyId: userData.family_id,
    },
    dashboardData: {
      log: todayLog,
      totalPoints,
      streak,
      todayPoints: calculateDayPoints(todayLog),
    },
  };
}

export async function getFamilyPageData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (!userData?.family_id) return null;

  const { data: family } = await supabase
    .from("families")
    .select("*, members:users(*)")
    .eq("id", userData.family_id)
    .single();

  return family;
}

export async function getAdminPageData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("role, family_id")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "parent") return null;

  const { data: members } = await supabase
    .from("users")
    .select("*")
    .eq("family_id", userData.family_id);

  return { members, familyId: userData.family_id };
}
