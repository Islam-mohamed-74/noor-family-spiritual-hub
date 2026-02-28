import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
import { ActivityEvent, ActivityType } from "@/types";
import { getFamilyId } from "@/services/family/familyService";

// ---------------------------------------------------------------------------
// Activity Feed Service  (Task 12)
// ---------------------------------------------------------------------------

export async function getFamilyFeed(
  familyId?: string,
  page = 1,
  pageSize = 30,
): Promise<ActivityEvent[]> {
  try {
    const fid = familyId ?? (await getFamilyId());
    if (!fid) return [];

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("activity_log")
      .select(
        `id, family_id, user_id, activity_type, activity_key, description,
         points_earned, created_at,
         users!activity_log_user_id_fkey(name, avatar)`,
      )
      .eq("family_id", fid)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return [];

    return (data || []).map((r: any) => ({
      id: r.id,
      familyId: r.family_id,
      userId: r.user_id,
      userName: r.users?.name ?? "",
      userAvatar: r.users?.avatar ?? "",
      activityType: r.activity_type as ActivityType,
      activityKey: r.activity_key ?? "",
      description: r.description ?? "",
      pointsEarned: r.points_earned ?? 0,
      createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}

export async function logActivity(event: {
  activityType: ActivityType;
  activityKey?: string;
  description: string;
  pointsEarned?: number;
}): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("users")
      .select("family_id")
      .eq("id", user.id)
      .single();

    if (!profile?.family_id) return;

    await supabase.from("activity_log").insert({
      user_id: user.id,
      family_id: profile.family_id,
      activity_type: event.activityType,
      activity_key: event.activityKey ?? null,
      description: event.description,
      points_earned: event.pointsEarned ?? 0,
    });
  } catch {
    // Silently fail – feed is non-critical
  }
}

/**
 * Subscribe to live family feed updates.
 * Returns an unsubscribe function.
 */
export function subscribeFamilyFeed(
  familyId: string,
  onInsert: (event: ActivityEvent) => void,
): () => void {
  const channel = supabase
    .channel(`family-feed-${familyId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "activity_log",
        filter: `family_id=eq.${familyId}`,
      },
      (payload) => {
        const r = payload.new as any;
        onInsert({
          id: r.id,
          familyId: r.family_id,
          userId: r.user_id,
          userName: "",
          userAvatar: "",
          activityType: r.activity_type as ActivityType,
          activityKey: r.activity_key ?? "",
          description: r.description ?? "",
          pointsEarned: r.points_earned ?? 0,
          createdAt: r.created_at,
        });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
