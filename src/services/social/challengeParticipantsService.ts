import { supabase } from "@/lib/supabase";
import { ChallengeParticipant } from "@/types";

// ---------------------------------------------------------------------------
// Challenge Participation Service  (Task 13 – Challenges v2)
// ---------------------------------------------------------------------------

export async function joinChallenge(
  challengeId: string,
): Promise<{ error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "غير مسجّل الدخول" };

    const { error } = await supabase
      .from("challenge_participants")
      .upsert(
        { challenge_id: challengeId, user_id: user.id, progress: 0 },
        { onConflict: "challenge_id,user_id", ignoreDuplicates: true },
      );
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function getChallengeParticipants(
  challengeId: string,
): Promise<ChallengeParticipant[]> {
  try {
    const { data, error } = await supabase
      .from("challenge_participants")
      .select(
        `id, challenge_id, user_id, progress, joined_at, completed_at,
         users!challenge_participants_user_id_fkey(name, avatar)`,
      )
      .eq("challenge_id", challengeId)
      .order("progress", { ascending: false });

    if (error) return [];

    return (data || []).map((p: any) => ({
      id: p.id,
      challengeId: p.challenge_id,
      userId: p.user_id,
      userName: p.users?.name ?? "",
      userAvatar: p.users?.avatar ?? "",
      progress: p.progress,
      joinedAt: p.joined_at,
      completedAt: p.completed_at ?? undefined,
    }));
  } catch {
    return [];
  }
}

export async function getMyActiveChallenges(): Promise<
  { challengeId: string; progress: number }[]
> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("challenge_participants")
      .select("challenge_id, progress")
      .eq("user_id", user.id)
      .is("completed_at", null);

    if (error) return [];
    return (data || []).map((p: any) => ({
      challengeId: p.challenge_id,
      progress: p.progress,
    }));
  } catch {
    return [];
  }
}

/**
 * Increments progress for ALL active (non-completed) challenges the current
 * user is enrolled in by 1. Marks completed when progress reaches target.
 * Call once per day when a worship log is saved.
 */
export async function incrementMyActiveChallenges(): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: parts } = await supabase
      .from("challenge_participants")
      .select(
        `id, progress, challenges!challenge_participants_challenge_id_fkey(target_days)`,
      )
      .eq("user_id", user.id)
      .is("completed_at", null);

    if (!parts || parts.length === 0) return;

    await Promise.all(
      parts.map(async (p: any) => {
        const targetDays: number = p.challenges?.target_days ?? 9999;
        const newProgress = (p.progress ?? 0) + 1;
        const isComplete = newProgress >= targetDays;
        await supabase
          .from("challenge_participants")
          .update({
            progress: newProgress,
            ...(isComplete ? { completed_at: new Date().toISOString() } : {}),
          })
          .eq("id", p.id);
      }),
    );
  } catch {
    // silent — non-critical
  }
}

/**
 * Increment a user's progress on a challenge by 1 day.
 * Marks the challenge as completed when progress reaches targetDays.
 */
export async function incrementChallengeProgress(
  challengeId: string,
  targetDays: number,
): Promise<{ completed: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { completed: false };

    // Get current progress
    const { data: existing } = await supabase
      .from("challenge_participants")
      .select("id, progress")
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id)
      .single();

    if (!existing) return { completed: false, error: "لم تنضم لهذا التحدي" };

    const newProgress = existing.progress + 1;
    const completed = newProgress >= targetDays;

    const { error } = await supabase
      .from("challenge_participants")
      .update({
        progress: newProgress,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", existing.id);

    if (error) return { completed: false, error: error.message };

    // Also update the shared challenge counter
    if (completed) {
      await supabase.rpc("increment_challenge_days", {
        p_challenge_id: challengeId,
        p_increment: 1,
      });
    }

    return { completed };
  } catch (e) {
    return {
      completed: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
