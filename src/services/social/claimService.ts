import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
import { RewardClaim, ClaimStatus } from "@/types";
import { getFamilyId } from "@/services/family/familyService";

// ---------------------------------------------------------------------------
// Reward Claims Service  (Task 16 – Reward Redemption)
// ---------------------------------------------------------------------------

export async function claimReward(
  rewardId: string,
  pointsCost: number,
): Promise<{ error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "غير مسجّل الدخول" };

    const fid = await getFamilyId();
    if (!fid) return { error: "لا توجد عائلة مرتبطة" };

    // Prevent duplicate pending claims
    const { data: existing } = await supabase
      .from("reward_claims")
      .select("id")
      .eq("reward_id", rewardId)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .single();

    if (existing) return { error: "لديك طلب معلّق لهذه المكافأة بالفعل" };

    const { error } = await supabase.from("reward_claims").insert({
      reward_id: rewardId,
      user_id: user.id,
      family_id: fid,
      points_cost: pointsCost,
      status: "pending",
    });
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function getMyRewardClaims(): Promise<RewardClaim[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("reward_claims")
      .select(
        `id, reward_id, user_id, family_id, status, points_cost, claimed_at,
         reviewed_at, reviewed_by,
         rewards!reward_claims_reward_id_fkey(name)`,
      )
      .eq("user_id", user.id)
      .order("claimed_at", { ascending: false });

    if (error) return [];
    return mapClaims(data);
  } catch {
    return [];
  }
}

export async function getFamilyRewardClaims(
  status?: ClaimStatus,
): Promise<RewardClaim[]> {
  try {
    const fid = await getFamilyId();
    if (!fid) return [];

    let query = supabase
      .from("reward_claims")
      .select(
        `id, reward_id, user_id, family_id, status, points_cost, claimed_at,
         reviewed_at, reviewed_by,
         rewards!reward_claims_reward_id_fkey(name),
         users!reward_claims_user_id_fkey(name, avatar)`,
      )
      .eq("family_id", fid)
      .order("claimed_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return [];
    return mapClaims(data);
  } catch {
    return [];
  }
}

export async function reviewRewardClaim(
  claimId: string,
  status: "approved" | "rejected",
): Promise<{ error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "غير مسجّل الدخول" };

    const { error } = await supabase
      .from("reward_claims")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", claimId);

    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function mapClaims(data: any[]): RewardClaim[] {
  return (data || []).map((c: any) => ({
    id: c.id,
    rewardId: c.reward_id,
    rewardName: c.rewards?.name ?? "",
    userId: c.user_id,
    userName: c.users?.name ?? "",
    userAvatar: c.users?.avatar ?? "",
    familyId: c.family_id,
    status: c.status as ClaimStatus,
    pointsCost: c.points_cost,
    claimedAt: c.claimed_at,
    reviewedAt: c.reviewed_at ?? undefined,
    reviewedBy: c.reviewed_by ?? undefined,
  }));
}
