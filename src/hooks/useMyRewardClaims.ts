import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { getMyRewardClaims } from "@/services/social/claimService";
import { RewardClaim } from "@/types";

const MY_CLAIMS_KEY = (userId: string) => ["social", "my-claims", userId];

export function useMyRewardClaims() {
  const user = useAppStore((s) => s.user);
  return useQuery<RewardClaim[]>({
    queryKey: MY_CLAIMS_KEY(user?.id ?? ""),
    enabled: !!user,
    staleTime: 1000 * 30,
    queryFn: () => getMyRewardClaims(),
  });
}

export function useInvalidateMyRewardClaims() {
  const user = useAppStore((s) => s.user);
  const qc = useQueryClient();
  return () =>
    qc.invalidateQueries({ queryKey: MY_CLAIMS_KEY(user?.id ?? "") });
}
