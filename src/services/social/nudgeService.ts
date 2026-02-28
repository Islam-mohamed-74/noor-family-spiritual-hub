import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
import { Nudge } from "@/types";

export async function getNudges(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<Nudge[]> {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("nudges")
      .select("*")
      .eq("to_user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) return [];
    return (data || []).map((n: any) => ({
      id: n.id,
      fromUserId: n.from_user_id,
      toUserId: n.to_user_id,
      message: n.message,
      timestamp: n.created_at,
      read: n.read,
    }));
  } catch {
    return [];
  }
}

export async function sendNudge(
  nudge: Omit<Nudge, "id" | "timestamp" | "read">,
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.from("nudges").insert({
      from_user_id: nudge.fromUserId,
      to_user_id: nudge.toUserId,
      message: nudge.message,
    });
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function markNudgeRead(id: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from("nudges")
      .update({ read: true })
      .eq("id", id);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
