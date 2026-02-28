import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { useShallow } from "zustand/react/shallow";
import {
  getFamilyFeed,
  subscribeFamilyFeed,
} from "@/services/social/activityService";
import { getFamily } from "@/services/family/familyService";
import { ActivityEvent } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

const ACTIVITY_ICONS: Record<string, string> = {
  prayer: "🕌",
  quran: "📖",
  azkar: "📿",
  fasting: "🌙",
  challenge: "🎯",
  badge: "🏅",
  reward: "🎁",
  streak: "🔥",
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

export default function FamilyFeed() {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();
  const [familyId, setFamilyId] = useState<string | null>(null);

  // Cached query — no refetch on tab switch or navigation
  const { data: events = [], isLoading: loading } = useQuery({
    queryKey: ["family-feed", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const family = await getFamily();
      if (!family) return [];
      setFamilyId(family.id);
      return getFamilyFeed(family.id, 25);
    },
  });

  // Subscribe to Realtime updates
  useEffect(() => {
    if (!familyId) return;
    const unsubscribe = subscribeFamilyFeed(familyId, (newEvent) => {
      queryClient.setQueryData<ActivityEvent[]>(
        ["family-feed", user?.id],
        (prev = []) => [newEvent, ...prev.slice(0, 24)],
      );
    });
    return unsubscribe;
  }, [familyId, queryClient, user?.id]);

  if (loading)
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            تغذية العائلة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );

  if (!events.length)
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            تغذية العائلة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            لا يوجد نشاط حديث للعائلة
          </p>
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          تغذية العائلة
          <Badge variant="secondary" className="mr-auto">
            مباشر
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-72 overflow-y-auto">
        {events.map((e) => (
          <div
            key={e.id}
            className="flex items-start gap-3 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <span className="text-xl shrink-0 mt-0.5">
              {ACTIVITY_ICONS[e.activityType] ?? "⭐"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">
                <span className="font-medium">
                  {e.userAvatar} {e.userName}
                </span>{" "}
                {e.description}
              </p>
              {e.pointsEarned > 0 && (
                <Badge variant="outline" className="mt-1 text-xs h-5">
                  +{e.pointsEarned} نقطة
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
              {timeAgo(e.createdAt)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
