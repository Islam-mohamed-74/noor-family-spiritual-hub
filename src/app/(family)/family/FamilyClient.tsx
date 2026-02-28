"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { useShallow } from "zustand/react/shallow";
import { qk } from "@/lib/queryKeys";
import * as ws from "@/services/worshipServiceSupabase";
import {
  calculateDayPoints,
  calculateTotalPoints,
  calculateWeeklyPoints,
  calculateStreak,
} from "@/services/worship/pointsService";
import { ALL_BADGES } from "@/services/worship/badgesService";
import { getFamilyEvents } from "@/services/social/eventService";
import { claimReward } from "@/services/social/claimService";
import { useMyRewardClaims } from "@/hooks/useMyRewardClaims";
import {
  joinChallenge,
  getChallengeParticipants,
} from "@/services/social/challengeParticipantsService";
import { User, Reward, WorshipLog, ChallengeParticipant } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import FamilyFeed from "@/components/FamilyFeed";
import {
  Trophy,
  Users,
  Flame,
  Send,
  QrCode,
  Calendar,
  Gift,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MemberStats extends User {
  weeklyPoints: number;
  totalPoints: number;
  streak: number;
  badgeCount: number;
  fajrStreak: number;
  azkarStreak: number;
  quranPages: number;
}

const EVENT_ICONS: Record<string, string> = {
  prayer: "🕌",
  quran: "📖",
  gathering: "👨‍👩‍👧",
  general: "📌",
};

interface FamilyClientProps {
  initialData: any; // Simplified for now
}

export default function FamilyClient({ initialData }: FamilyClientProps) {
  const { user, kidsMode } = useAppStore(
    useShallow((s) => ({ user: s.user, kidsMode: s.kidsMode })),
  );
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: myClaims = [] } = useMyRewardClaims();
  const [joiningChallenge, setJoiningChallenge] = useState<string | null>(null);
  const [claimingReward, setClaimingReward] = useState<string | null>(null);

  const { data: pageData, isLoading: loading } = useQuery({
    queryKey: qk.familyPage(user?.id ?? ""),
    enabled: !!user,
    initialData: initialData,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      // Re-fetch logic (same as original page component)
      const [members, familyData, challengeList, eventList, rewardList] =
        await Promise.all([
          ws.getFamilyMembers(),
          ws.getFamily(),
          ws.getChallenges(),
          getFamilyEvents(),
          ws.getRewards(),
        ]);

      const memberLogs = await Promise.all(
        members.map((m) => ws.getLogsByUser(m.id)),
      );

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const stats: MemberStats[] = members.map((m, idx) => {
        const logs: WorshipLog[] = memberLogs[idx];
        const totalPoints = calculateTotalPoints(logs);
        const weeklyPoints = calculateWeeklyPoints(logs);
        const streak = calculateStreak(logs);

        return {
          ...m,
          totalPoints,
          weeklyPoints,
          streak,
          badgeCount: 0,
          fajrStreak: 0,
          azkarStreak: 0,
          quranPages: 0,
        };
      });

      return {
        members: stats,
        family: familyData,
        challenges: challengeList,
        events: eventList,
        rewards: rewardList,
      };
    },
  });

  if (!user) return null;
  if (loading && !pageData) {
    return <div>Loading...</div>; // Skeleton optimization later
  }

  const {
    members = [],
    family,
    challenges = [],
    events = [],
    rewards = [],
  } = pageData ?? {};

  const handleJoinChallenge = async (challengeId: string) => {
    setJoiningChallenge(challengeId);
    try {
      await joinChallenge(challengeId);
      toast({ title: "تم الانضمام للتحدي بنجاح! 🚀" });
      queryClient.invalidateQueries({ queryKey: qk.familyPage(user.id) });
    } catch (e) {
      toast({ title: "عذراً، حدث خطأ ما", variant: "destructive" });
    } finally {
      setJoiningChallenge(null);
    }
  };

  const handleClaimReward = async (reward: Reward) => {
    setClaimingReward(reward.id);
    try {
      await claimReward(reward.id, reward.pointsRequired);
      toast({ title: `تم طلب جائزة: ${reward.name}! 🎁` });
      queryClient.invalidateQueries({ queryKey: ["claims", user.id] });
    } catch (e) {
      toast({ title: "فشل طلب الجائزة", variant: "destructive" });
    } finally {
      setClaimingReward(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Original UI content would go here - truncated for brevity in this step */}
      <h1 className="text-2xl font-bold">عائلتي: {family?.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Members column */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" /> أفراد العائلة
          </h2>
          {members.map((m: MemberStats) => (
            <Card key={m.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{m.avatar}</span>
                  <div>
                    <p className="font-bold">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.totalPoints} نقطة
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Challenges & Events */}
        <div className="lg:col-span-2 space-y-6">
          <FamilyFeed />
        </div>
      </div>
    </div>
  );
}
