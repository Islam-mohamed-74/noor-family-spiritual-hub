import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { getFamilyMembers } from "@/services/family/memberService";
import { getFamily } from "@/services/family/familyService";
import { getFamilyDailyCompletion } from "@/services/worship/pointsService";
import { getChallenges } from "@/services/social/rewardService";
import { getBadges } from "@/services/worship/badgesService";
import { qk } from "@/lib/queryKeys";
import { Family, User, Badge, Challenge } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FamilyMembersData {
  members: User[];
  family: Family | null;
  dailyCompletion: number;
  challenges: Challenge[];
  badges: Badge[];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/** Fetches family metadata, members, daily completion %, challenges & badge definitions. */
export function useFamilyMembers() {
  const user = useAppStore((s) => s.user);
  const todayDate = new Date().toISOString().split("T")[0];

  return useQuery<FamilyMembersData>({
    queryKey: qk.familyMembers(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 min
    queryFn: async () => {
      const [members, family, dailyCompletion, challenges] = await Promise.all([
        getFamilyMembers(),
        getFamily(),
        getFamilyDailyCompletion(todayDate),
        getChallenges(),
      ]);
      return {
        members,
        family,
        dailyCompletion,
        challenges,
        badges: getBadges(),
      };
    },
  });
}
