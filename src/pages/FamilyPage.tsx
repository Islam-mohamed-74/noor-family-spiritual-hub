import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import * as ws from "@/services/worshipServiceSupabase";
import { getFamilyEvents } from "@/services/social/eventService";
import { claimReward } from "@/services/social/claimService";
import { useMyRewardClaims } from "@/hooks/useMyRewardClaims";
import {
  joinChallenge,
  getChallengeParticipants,
} from "@/services/social/challengeParticipantsService";
import {
  getMemberTitle,
  type MemberStats as TitleStats,
} from "@/lib/titleEngine";
import {
  User,
  Family,
  Badge as BadgeType,
  Challenge,
  FamilyEvent,
  ChallengeParticipant,
  Reward,
} from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import FamilyFeed from "@/components/FamilyFeed";
import {
  Trophy,
  BookOpen,
  Users,
  Flame,
  Send,
  QrCode,
  Calendar,
  Gift,
  UserPlus,
  Badge,
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

export default function FamilyPage() {
  const { user, kidsMode } = useAppStore();
  const navigate = useNavigate();
  const { data: myClaims = [] } = useMyRewardClaims();
  const [leaderboard, setLeaderboard] = useState<MemberStats[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [dailyCompletion, setDailyCompletion] = useState(0);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [participants, setParticipants] = useState<
    Record<string, ChallengeParticipant[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [joiningChallenge, setJoiningChallenge] = useState<string | null>(null);
  const [claimingReward, setClaimingReward] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const todayDate = new Date().toISOString().split("T")[0];
    const [
      members,
      familyData,
      completion,
      challengeList,
      eventList,
      rewardList,
    ] = await Promise.all([
      ws.getFamilyMembers(),
      ws.getFamily(),
      ws.getFamilyDailyCompletion(todayDate),
      ws.getChallenges(),
      getFamilyEvents(),
      ws.getRewards(),
    ]);
    setFamily(familyData);
    setDailyCompletion(completion);
    setChallenges(challengeList);
    setEvents(eventList);
    setRewards(rewardList);
    setBadges(ws.getBadges());

    const stats = await Promise.all(
      members.map(async (m) => {
        const [weekly, total, streak, userBadges, logs] = await Promise.all([
          ws.getWeeklyPoints(m.id),
          ws.getTotalPoints(m.id),
          ws.getStreak(m.id),
          ws.getUserBadges(m.id),
          ws.getLogsByUser(m.id),
        ]);
        const fajrStreak = logs.filter(
          (l) => l.prayers.find((p) => p.name === "fajr")?.completed,
        ).length;
        const azkarStreak = logs.filter(
          (l) => l.azpiMorning && l.azpiEvening,
        ).length;
        const quranPages = logs.reduce((s, l) => s + l.quranPages, 0);
        return {
          ...m,
          weeklyPoints: weekly,
          totalPoints: total,
          streak,
          badgeCount: userBadges.length,
          fajrStreak,
          azkarStreak,
          quranPages,
        };
      }),
    );
    setLeaderboard(stats.sort((a, b) => b.weeklyPoints - a.weeklyPoints));

    const partMap: Record<string, ChallengeParticipant[]> = {};
    await Promise.all(
      challengeList.map(async (c) => {
        partMap[c.id] = await getChallengeParticipants(c.id);
      }),
    );
    setParticipants(partMap);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) return null;
  if (loading)
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );

  const rankIcons = ["🥇", "🥈", "🥉", "⭐"];
  const khatmaProgress = family
    ? Math.round(
        (family.sharedKhatma.completedPages /
          (family.sharedKhatma.targetPages || 1)) *
          100,
      )
    : 0;
  const upcomingEvents = events.filter(
    (e) => new Date(e.eventDate) >= new Date(Date.now() - 86400000),
  );

  const sendNudge = async (toId: string) => {
    const msgs = [
      "حان وقت العبادة! 🌟",
      "لا تنسَ أذكارك 📿",
      "هيا نتسابق للخير! 🏃",
    ];
    await ws.sendNudge({
      fromUserId: user.id,
      toUserId: toId,
      message: msgs[Math.floor(Math.random() * msgs.length)],
    });
    toast({ title: "تم إرسال التشجيع! 💚" });
  };

  const handleJoinChallenge = async (challengeId: string) => {
    setJoiningChallenge(challengeId);
    const { error } = await joinChallenge(challengeId);
    if (error)
      toast({ variant: "destructive", title: "خطأ", description: error });
    else {
      toast({ title: "انضممت للتحدي! 🎯" });
      const updated = await getChallengeParticipants(challengeId);
      setParticipants((prev) => ({ ...prev, [challengeId]: updated }));
    }
    setJoiningChallenge(null);
  };

  const handleClaimReward = async (reward: Reward) => {
    setClaimingReward(reward.id);
    const { error } = await claimReward(reward.id, reward.pointsRequired);
    if (error)
      toast({ variant: "destructive", title: "خطأ", description: error });
    else toast({ title: "تم إرسال طلب المكافأة للمسؤول ✅" });
    setClaimingReward(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className={`font-bold ${kidsMode ? "text-3xl" : "text-2xl"}`}>
          <Users className="inline h-6 w-6 ml-2" />
          {family?.name || "العائلة"}
        </h1>
        {user.role === "admin" && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate("/invite")}
          >
            <QrCode className="h-4 w-4" />
            دعوة أفراد
          </Button>
        )}
      </div>

      {/* Family progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">تقدّم العائلة اليوم</span>
            <span className="text-sm text-muted-foreground">
              {dailyCompletion}%
            </span>
          </div>
          <Progress value={dailyCompletion} className="h-3" />
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              الأحداث القادمة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-background/60"
              >
                <span className="text-xl">
                  {EVENT_ICONS[e.eventType] ?? "📌"}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{e.title}</p>
                  {e.description && (
                    <p className="text-xs text-muted-foreground">
                      {e.description}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(e.eventDate).toLocaleDateString("ar-SA", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Leaderboard with dynamic titles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            لوحة المتصدرين الأسبوعية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {leaderboard.map((m, i) => {
            const titleStats: TitleStats = {
              fajrStreak: m.fajrStreak,
              generalStreak: m.streak,
              weeklyPoints: m.weeklyPoints,
              totalPoints: m.totalPoints,
              quranPages: m.quranPages,
              azkarStreak: m.azkarStreak,
            };
            const dynTitle = getMemberTitle(titleStats);
            return (
              <div
                key={m.id}
                className={`flex items-center justify-between p-3 rounded-lg
                  ${i === 0 ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300/40" : "bg-secondary"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{rankIcons[i] || "⭐"}</span>
                  <div>
                    <span className="font-medium">
                      {m.avatar} {m.name}
                    </span>
                    {dynTitle ? (
                      <p className="text-xs text-primary font-medium">
                        {dynTitle.icon} {dynTitle.title}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">مبتدئ</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.streak > 0 && (
                    <BadgeUI variant="outline" className="gap-1 text-xs">
                      <Flame className="h-3 w-3 text-orange-500" /> {m.streak}
                    </BadgeUI>
                  )}
                  <BadgeUI className="bg-primary text-primary-foreground text-xs">
                    {m.weeklyPoints} نقطة
                  </BadgeUI>
                  {m.id !== user.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => sendNudge(m.id)}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Shared Khatma */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            ختمة القرآن الجماعية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={khatmaProgress} className="h-4 mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{family?.sharedKhatma.completedPages || 0} صفحة</span>
            <span>{family?.sharedKhatma.targetPages || 0} صفحة</span>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>🏅 الأوسمة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {badges.map((badge) => {
              const earned = leaderboard.some((m) => m.badgeCount > 0);
              return (
                <div
                  key={badge.id}
                  className={`text-center p-3 rounded-lg border ${earned ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300/40" : "opacity-40"}`}
                >
                  <span className="text-3xl block mb-1">{badge.icon}</span>
                  <p className="text-sm font-medium">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {badge.description}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Challenges v2 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>🎯 التحديات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {challenges.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              لا توجد تحديات نشطة حالياً
            </p>
          )}
          {challenges.map((c) => {
            const parts = participants[c.id] ?? [];
            const myPart = parts.find((p) => p.userId === user.id);
            const myProgress = myPart?.progress ?? 0;
            const isCompleted = !!myPart?.completedAt;
            return (
              <div key={c.id} className="p-3 rounded-lg bg-secondary space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.name}</span>
                  <BadgeUI variant="outline" className="text-xs">
                    {c.currentDays}/{c.targetDays} يوم
                  </BadgeUI>
                </div>
                {c.description && (
                  <p className="text-xs text-muted-foreground">
                    {c.description}
                  </p>
                )}
                <Progress
                  value={(c.currentDays / c.targetDays) * 100}
                  className="h-2"
                />
                {parts.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground ml-1">
                      المشاركون:
                    </span>
                    {parts.map((p) => (
                      <span
                        key={p.id}
                        title={p.userName}
                        className={`text-sm ${p.completedAt ? "" : "opacity-60"}`}
                      >
                        {p.userAvatar || "👤"}
                      </span>
                    ))}
                  </div>
                )}
                {myPart && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>تقدّمي</span>
                      <span>
                        {myProgress}/{c.targetDays}
                      </span>
                    </div>
                    <Progress
                      value={(myProgress / c.targetDays) * 100}
                      className="h-1.5"
                    />
                    {isCompleted && (
                      <p className="text-xs text-green-600 font-medium">
                        🎉 أكملت هذا التحدي!
                      </p>
                    )}
                  </div>
                )}
                {!myPart && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 mt-1"
                    disabled={joiningChallenge === c.id}
                    onClick={() => handleJoinChallenge(c.id)}
                  >
                    <UserPlus className="h-3 w-3" />
                    {joiningChallenge === c.id
                      ? "جاري الانضمام..."
                      : "انضم للتحدي"}
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Rewards claim */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            المكافآت
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rewards.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              لا توجد مكافآت حالياً
            </p>
          )}
          {rewards.map((r) => {
            const myPoints =
              leaderboard.find((m) => m.id === user.id)?.totalPoints ?? 0;
            const canClaim = myPoints >= r.pointsRequired;
            return (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary"
              >
                <div>
                  <p className="font-medium">{r.name}</p>
                  {r.description && (
                    <p className="text-xs text-muted-foreground">
                      {r.description}
                    </p>
                  )}
                  <BadgeUI variant="outline" className="mt-1 text-xs">
                    {r.pointsRequired} نقطة
                  </BadgeUI>
                </div>
                <Button
                  size="sm"
                  disabled={!canClaim || claimingReward === r.id}
                  onClick={() => handleClaimReward(r)}
                  variant={canClaim ? "default" : "secondary"}
                >
                  {claimingReward === r.id
                    ? "..."
                    : canClaim
                      ? "استبدال"
                      : "غير متاح"}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* My reward claim history */}
      {myClaims.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-4 w-4 text-primary" />
              طلباتي للمكافآت
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myClaims.slice(0, 5).map((claim) => (
              <div
                key={claim.id}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary"
              >
                <div>
                  <p className="text-sm font-medium">
                    {claim.rewardName ?? "مكافأة"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(claim.claimedAt).toLocaleDateString("ar-SA")}
                  </p>
                </div>
                <BadgeUI
                  variant="outline"
                  className={`text-xs ${
                    claim.status === "approved"
                      ? "border-green-600 text-green-600"
                      : claim.status === "rejected"
                        ? "border-destructive text-destructive"
                        : "border-yellow-500 text-yellow-600"
                  }`}
                >
                  {claim.status === "approved"
                    ? "موافق عليه ✅"
                    : claim.status === "rejected"
                      ? "مرفوض ❌"
                      : "معلّق ⏳"}
                </BadgeUI>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Activity Feed */}
      <FamilyFeed />
    </div>
  );
}
