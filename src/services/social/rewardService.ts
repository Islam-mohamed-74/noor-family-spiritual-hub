import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
import { Reward, Challenge } from "@/types";

// ---------------------------------------------------------------------------
// Rewards
// ---------------------------------------------------------------------------

export async function getRewards(familyId?: string): Promise<Reward[]> {
  try {
    let fid = familyId;
    if (!fid) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data: profile } = await supabase
        .from("users")
        .select("family_id")
        .eq("id", user.id)
        .single();
      fid = profile?.family_id;
    }
    if (!fid) return [];
    const { data, error } = await supabase
      .from("rewards")
      .select("*")
      .eq("family_id", fid);
    if (error) return [];
    return (data || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description || "",
      pointsRequired: r.points_required,
      familyId: r.family_id,
      createdBy: r.created_by || "",
    }));
  } catch {
    return [];
  }
}

export async function addReward(
  reward: Omit<Reward, "id">,
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.from("rewards").insert({
      name: reward.name,
      description: reward.description,
      points_required: reward.pointsRequired,
      family_id: reward.familyId,
      created_by: reward.createdBy,
    });
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteReward(id: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.from("rewards").delete().eq("id", id);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------

export async function getChallenges(familyId?: string): Promise<Challenge[]> {
  try {
    let fid = familyId;
    if (!fid) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data: profile } = await supabase
        .from("users")
        .select("family_id")
        .eq("id", user.id)
        .single();
      fid = profile?.family_id;
    }
    if (!fid) return [];
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("family_id", fid)
      .eq("active", true);
    if (error) return [];
    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description || "",
      targetDays: c.target_days,
      currentDays: c.current_days || 0,
      familyId: c.family_id,
      active: c.active,
    }));
  } catch {
    return [];
  }
}

export async function addChallenge(
  challenge: Omit<Challenge, "id">,
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.from("challenges").insert({
      name: challenge.name,
      description: challenge.description,
      target_days: challenge.targetDays,
      current_days: challenge.currentDays,
      family_id: challenge.familyId,
      active: challenge.active,
    });
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateChallenge(
  challenge: Challenge,
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from("challenges")
      .update({
        name: challenge.name,
        description: challenge.description,
        target_days: challenge.targetDays,
        current_days: challenge.currentDays,
        active: challenge.active,
      })
      .eq("id", challenge.id);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteChallenge(id: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.from("challenges").delete().eq("id", id);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
