import { supabase } from "@/lib/supabase";
import { Feedback, FeedbackType } from "@/types";

// ---------------------------------------------------------------------------
// Feedback Service  (Task 18)
// ---------------------------------------------------------------------------

export async function submitFeedback(feedback: {
  type: FeedbackType;
  message: string;
}): Promise<{ error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "غير مسجّل الدخول" };

    const { data: profile } = await supabase
      .from("users")
      .select("family_id")
      .eq("id", user.id)
      .single();

    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      family_id: profile?.family_id ?? null,
      type: feedback.type,
      message: feedback.message,
    });

    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function getFamilyFeedback(): Promise<Feedback[]> {
  try {
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

    const { data, error } = await supabase
      .from("feedback")
      .select(
        `id, user_id, family_id, type, message, status, created_at,
         users!feedback_user_id_fkey(name, avatar)`,
      )
      .eq("family_id", profile.family_id)
      .order("created_at", { ascending: false });

    if (error) return [];

    return (data || []).map((f: any) => ({
      id: f.id,
      userId: f.user_id,
      userName: f.users?.name ?? "",
      familyId: f.family_id ?? undefined,
      type: f.type as FeedbackType,
      message: f.message,
      status: f.status as "open" | "reviewed",
      createdAt: f.created_at,
    }));
  } catch {
    return [];
  }
}

export async function markFeedbackReviewed(
  id: string,
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from("feedback")
      .update({ status: "reviewed" })
      .eq("id", id);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
