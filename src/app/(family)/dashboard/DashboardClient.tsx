"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useShallow } from "zustand/react/shallow";
import { useWorshipLog, useSaveWorshipLog } from "@/hooks/useWorshipLog";
import { calculateDayPoints } from "@/services/worship/pointsService";
import { WorshipLog, PrayerLog, PRAYER_NAMES, PrayerName } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Moon, Sun, Flame } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PrayerTimesCard from "@/components/PrayerTimesCard";
import IslamicEventsAlert from "@/components/IslamicEventsAlert";
import HijriCalendarCard from "@/components/HijriCalendarCard";
import DailyHadith from "@/components/DailyHadith";
import FeedbackDialog from "@/components/FeedbackDialog";
import { getCompletionTip } from "@/lib/hadith";
import WeeklyReportCard from "@/components/WeeklyReportCard";
import {
  WeeklyReportSkeleton,
  PrayerTimesSkeleton,
  HijriCalendarSkeleton,
} from "@/components/SkeletonLoaders";

interface DashboardClientProps {
  initialData: {
    log: WorshipLog | null;
    totalPoints: number;
    streak: number;
    todayPoints: number;
  };
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const { user, kidsMode, setUser } = useAppStore(
    useShallow((s) => ({
      user: s.user,
      kidsMode: s.kidsMode,
      setUser: s.setUser,
    })),
  );

  // We still use React Query for interactivity/mutations
  const { data, isLoading } = useWorshipLog();
  const saveLog = useSaveWorshipLog();

  // Local state for immediate UI feedback and debouncing
  const [localLog, setLocalLog] = useState<WorshipLog | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync localLog once when data or initialData is ready
  useEffect(() => {
    const fetchedLog = data?.log ?? initialData.log;
    if (fetchedLog && !localLog) {
      setLocalLog(fetchedLog);
    }
  }, [data?.log, initialData.log]);

  const log = localLog || data?.log || initialData.log;
  const points = data?.totalPoints ?? initialData.totalPoints;
  const streak = data?.streak ?? initialData.streak;

  if (!user || !log) return null;

  const debouncedSave = (updatedLog: WorshipLog) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      saveLog.mutate(updatedLog);
    }, 1000);
  };

  const updateLog = (partial: Partial<WorshipLog>) => {
    const updated = { ...log, ...partial };
    setLocalLog(updated);
    debouncedSave(updated);
  };

  const updatePrayer = (
    name: PrayerName,
    field: keyof PrayerLog,
    value: boolean,
  ) => {
    const prayers = log.prayers.map((p: any) =>
      p.name === name
        ? {
            ...p,
            [field]: value,
            ...(field === "completed" && !value
              ? { onTime: false, jamaah: false }
              : {}),
          }
        : p,
    );
    updateLog({ prayers });
  };

  const completedPrayers = log.prayers.filter((p) => p.completed).length;
  const dayProgress = Math.round((completedPrayers / 5) * 100);
  const todayPoints = calculateDayPoints(log);

  const showEncouragement = (
    activityType:
      | "prayer"
      | "azkar"
      | "quran"
      | "fasting"
      | "general" = "general",
  ) => {
    const tip = kidsMode
      ? ["أحسنت! ⭐", "بارك الله فيك! 🌟", "ما شاء الله! 🎉"][
          Math.floor(Math.random() * 3)
        ]
      : getCompletionTip(activityType);
    toast({ title: tip });
  };

  return (
    <div className="space-y-6">
      {/* Islamic events alerts (upcoming events within 7 days) */}
      <IslamicEventsAlert />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`font-bold ${kidsMode ? "text-3xl" : "text-2xl"}`}>
            مرحباً {user.avatar} {user.name}
          </h1>
          <p className="text-muted-foreground">كيف حال عبادتك اليوم؟</p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="p-3 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
            <div className="text-sm font-semibold">{streak} يوم</div>
          </Card>
          <Card className="p-3 flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-lg px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary border-none"
            >
              {points} نقطة
            </Badge>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Progress */}
          <Card
            className={`overflow-hidden border-none shadow-lg ${kidsMode ? "bg-gradient-to-br from-yellow-50 to-orange-50" : "bg-card"}`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className={kidsMode ? "text-2xl" : ""}>
                  إجمالي صلوات اليوم
                </CardTitle>
                <span className="font-bold text-primary">{dayProgress}%</span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress
                value={dayProgress}
                className={`h-4 ${kidsMode ? "bg-yellow-200" : ""}`}
              />
              <div className="mt-4 flex justify-between text-sm">
                <span>{completedPrayers} صلوات من 5</span>
                <span className="font-bold">+{todayPoints} نقطة</span>
              </div>
            </CardContent>
          </Card>

          {/* Prayers List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {log.prayers.map((prayer) => (
              <Card
                key={prayer.name}
                className={`relative overflow-hidden transition-all duration-300 ${prayer.completed ? "border-primary/50 bg-primary/5 shadow-sm" : "hover:border-primary/30"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${prayer.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        {PRAYER_NAMES[prayer.name].icon}
                      </div>
                      <div>
                        <h3 className="font-bold">
                          {PRAYER_NAMES[prayer.name].label}
                        </h3>
                        <div className="flex gap-1">
                          {prayer.completed && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-4 scale-90 origin-right"
                            >
                              تم الأداء
                            </Badge>
                          )}
                          {prayer.onTime && (
                            <Badge
                              variant="outline"
                              className="text-[10px] h-4 scale-90 origin-right border-green-500 text-green-600"
                            >
                              في وقتها
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Checkbox
                      id={`p-${prayer.name}`}
                      checked={prayer.completed}
                      onCheckedChange={(val) => {
                        updatePrayer(prayer.name, "completed", !!val);
                        if (val) showEncouragement("prayer");
                      }}
                      className="w-6 h-6 rounded-full"
                    />
                  </div>

                  {prayer.completed && (
                    <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                        <label
                          htmlFor={`ontime-${prayer.name}`}
                          className="text-xs font-medium cursor-pointer"
                        >
                          في وقتها
                        </label>
                        <Switch
                          id={`ontime-${prayer.name}`}
                          checked={prayer.onTime}
                          onCheckedChange={(val) =>
                            updatePrayer(prayer.name, "onTime", val)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                        <label
                          htmlFor={`jamaah-${prayer.name}`}
                          className="text-xs font-medium cursor-pointer"
                        >
                          جماعة
                        </label>
                        <Switch
                          id={`jamaah-${prayer.name}`}
                          checked={prayer.jamaah}
                          onCheckedChange={(val) =>
                            updatePrayer(prayer.name, "jamaah", val)
                          }
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Daily Extra Activities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className={
                log.quranPages > 0 ? "border-primary/30 bg-primary/5" : ""
              }
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-md flex items-center gap-2">
                  <span className="p-1.5 bg-sky-100 text-sky-600 rounded-md">
                    <Sun className="w-4 h-4" />
                  </span>
                  القرآن الكريم
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    placeholder="عدد الصفحات"
                    value={log.quranPages || ""}
                    onChange={(e) =>
                      updateLog({ quranPages: parseInt(e.target.value) || 0 })
                    }
                    className="w-24 font-bold text-center"
                    min={0}
                  />
                  <span className="text-sm text-muted-foreground">
                    صفحة اليوم
                  </span>
                </div>
                {log.quranPages > 0 && (
                  <Input
                    placeholder="ماذا قرأت؟ (اختياري)"
                    value={log.quranSurahNote || ""}
                    onChange={(e) =>
                      updateLog({ quranSurahNote: e.target.value })
                    }
                    className="text-xs h-8"
                  />
                )}
              </CardContent>
            </Card>

            <Card
              className={
                log.azpiMorning || log.azpiEvening
                  ? "border-primary/30 bg-primary/5"
                  : ""
              }
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-md flex items-center gap-2">
                  <span className="p-1.5 bg-amber-100 text-amber-600 rounded-md">
                    <Moon className="w-4 h-4" />
                  </span>
                  الأذكار
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">أذكار الصباح</span>
                  <Checkbox
                    checked={log.azpiMorning}
                    onCheckedChange={(val) => {
                      updateLog({ azpiMorning: !!val });
                      if (val) showEncouragement("azkar");
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">أذكار المساء</span>
                  <Checkbox
                    checked={log.azpiEvening}
                    onCheckedChange={(val) => {
                      updateLog({ azpiEvening: !!val });
                      if (val) showEncouragement("azkar");
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Fasting & Other actions */}
            <Card
              className={log.fasting ? "border-primary/30 bg-primary/5" : ""}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-md ${log.fasting ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                  >
                    🌙
                  </div>
                  <span className="text-sm font-bold">صيام</span>
                </div>
                <Checkbox
                  checked={log.fasting}
                  onCheckedChange={(val) => {
                    updateLog({ fasting: !!val });
                    if (val) showEncouragement("fasting");
                  }}
                />
              </CardContent>
            </Card>

            <Card className={log.duha ? "border-primary/30 bg-primary/5" : ""}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-md ${log.duha ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground"}`}
                  >
                    <Sun className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">صلاة الضحى</span>
                </div>
                <Checkbox
                  checked={log.duha}
                  onCheckedChange={(val) => {
                    updateLog({ duha: !!val });
                    if (val) showEncouragement("prayer");
                  }}
                />
              </CardContent>
            </Card>

            <Card className={log.witr ? "border-primary/30 bg-primary/5" : ""}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-md ${log.witr ? "bg-indigo-100 text-indigo-600" : "bg-muted text-muted-foreground"}`}
                  >
                    <Moon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">صلاة الوتر</span>
                </div>
                <Checkbox
                  checked={log.witr}
                  onCheckedChange={(val) => {
                    updateLog({ witr: !!val });
                    if (val) showEncouragement("prayer");
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <PrayerTimesCard />
          <WeeklyReportCard />
          <HijriCalendarCard />
          <DailyHadith />
          <FeedbackDialog />
        </div>
      </div>
    </div>
  );
}
