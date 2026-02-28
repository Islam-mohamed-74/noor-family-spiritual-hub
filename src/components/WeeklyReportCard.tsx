// ---------------------------------------------------------------------------
// WeeklyReportCard — Task 19: Weekly Report
// ---------------------------------------------------------------------------

import { useWeeklyReport } from "@/hooks/useWeeklyReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  BookOpen,
  Utensils,
  Trophy,
} from "lucide-react";

export default function WeeklyReportCard() {
  const { data, isLoading } = useWeeklyReport();

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (!data) return null;

  const {
    totalPoints,
    avgDailyPoints,
    bestDay,
    mostCommittedMember,
    prayerCompletionRate,
    quranPagesTotal,
    fastingDays,
    activeDays,
    trendPct,
    isFriday,
  } = data;

  const TrendIcon =
    trendPct > 0 ? TrendingUp : trendPct < 0 ? TrendingDown : Minus;
  const trendColor =
    trendPct > 0
      ? "text-emerald-600"
      : trendPct < 0
        ? "text-red-500"
        : "text-muted-foreground";

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            📊 ملخص الأسبوع
          </CardTitle>
          <div
            className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}
          >
            <TrendIcon className="h-4 w-4" />
            <span>
              {trendPct > 0 ? "+" : ""}
              {trendPct}%
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Friday motivational banner */}
        {isFriday && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-400/40 p-3 text-sm text-amber-700 dark:text-amber-300">
            🕌 <strong>يوم الجمعة المبارك!</strong> أكثر من الصلاة على النبي ﷺ
            وقراءة سورة الكهف
          </div>
        )}

        {/* Points summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-secondary">
            <p className="text-2xl font-bold text-primary">{totalPoints}</p>
            <p className="text-xs text-muted-foreground mt-1">إجمالي النقاط</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary">
            <p className="text-2xl font-bold text-primary">{avgDailyPoints}</p>
            <p className="text-xs text-muted-foreground mt-1">متوسط يومي</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary">
            <p className="text-2xl font-bold text-primary">{activeDays}/7</p>
            <p className="text-xs text-muted-foreground mt-1">أيام نشطة</p>
          </div>
        </div>

        {/* Prayer completion */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium">الصلوات المؤداة</span>
            <span className="text-sm text-muted-foreground">
              {prayerCompletionRate}%
            </span>
          </div>
          <Progress value={prayerCompletionRate} className="h-2" />
        </div>

        {/* Stats row */}
        <div className="flex gap-3 flex-wrap">
          {quranPagesTotal > 0 && (
            <Badge variant="outline" className="gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {quranPagesTotal} صفحة قرآن
            </Badge>
          )}
          {fastingDays > 0 && (
            <Badge variant="outline" className="gap-1">
              <Utensils className="h-3.5 w-3.5" />
              {fastingDays} يوم صيام
            </Badge>
          )}
          {bestDay && (
            <Badge variant="outline" className="gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              أفضل يوم: {bestDay.label} ({bestDay.points})
            </Badge>
          )}
        </div>

        {/* Most committed member */}
        {mostCommittedMember && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
            <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">
                أكثر التزاماً هذا الأسبوع
              </p>
              <p className="font-medium">
                {mostCommittedMember.avatar} {mostCommittedMember.name}
                <span className="text-muted-foreground font-normal text-sm">
                  {" "}
                  — {mostCommittedMember.points} نقطة
                </span>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
