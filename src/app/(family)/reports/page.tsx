"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useReports, ChartDays } from "@/hooks/useReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import WeeklyReportCard from "@/components/WeeklyReportCard";
import HijriCalendarCard from "@/components/HijriCalendarCard";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const DAY_OPTIONS: { label: string; value: ChartDays }[] = [
  { label: "٧ أيام", value: 7 },
  { label: "٣٠ يوم", value: 30 },
  { label: "٩٠ يوم", value: 90 },
];

const COLORS = [
  "hsl(163, 79%, 20%)",
  "hsl(43, 80%, 55%)",
  "hsl(260, 70%, 55%)",
  "hsl(340, 80%, 55%)",
];

export default function ReportsPage() {
  const user = useAppStore((s) => s.user);
  const [selectedUser, setSelectedUser] = useState(user?.id || "");
  const [days, setDays] = useState<ChartDays>(7);
  const [chartTab, setChartTab] = useState<"points" | "prayers" | "breakdown">(
    "points",
  );

  const { members, personalChartData, familyChartData, trend, isLoading } =
    useReports(selectedUser || user?.id, days);

  useEffect(() => {
    if (!selectedUser && members.length > 0) {
      setSelectedUser(members[0].id);
    }
  }, [selectedUser, members]);

  if (!user) return null;

  const TrendIcon =
    trend.trendPct > 0 ? TrendingUp : trend.trendPct < 0 ? TrendingDown : Minus;
  const trendColor =
    trend.trendPct > 0
      ? "text-emerald-600"
      : trend.trendPct < 0
        ? "text-red-500"
        : "text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">📈 التقارير</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border overflow-hidden">
            {DAY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  days === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.avatar} {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeeklyReportCard />
        <HijriCalendarCard />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">البيانات الشخصية</CardTitle>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`gap-1 ${trendColor}`}>
                    <TrendIcon className="h-3.5 w-3.5" />
                    {trend.trendPct > 0 ? "+" : ""}
                    {trend.trendPct}% مقارنة بالفترة السابقة
                  </Badge>
                  <Tabs
                    value={chartTab}
                    onValueChange={(v) => setChartTab(v as typeof chartTab)}
                  >
                    <TabsList className="h-8">
                      <TabsTrigger value="points" className="text-xs px-2">
                        النقاط
                      </TabsTrigger>
                      <TabsTrigger value="prayers" className="text-xs px-2">
                        الصلوات
                      </TabsTrigger>
                      <TabsTrigger value="breakdown" className="text-xs px-2">
                        تفصيل
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartTab === "points" ? (
                    <LineChart data={personalChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        interval={days > 7 ? Math.floor(days / 8) : 0}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="النقاط"
                        stroke="hsl(163, 79%, 20%)"
                        strokeWidth={2}
                        dot={days <= 30 ? { r: 3 } : false}
                      />
                    </LineChart>
                  ) : chartTab === "prayers" ? (
                    <BarChart data={personalChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        interval={days > 7 ? Math.floor(days / 8) : 0}
                      />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="الصلوات"
                        fill="hsl(163, 79%, 20%)"
                        radius={[3, 3, 0, 0]}
                      />
                      <Bar
                        dataKey="القرآن"
                        fill="hsl(43, 80%, 55%)"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <BarChart data={personalChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        interval={days > 7 ? Math.floor(days / 8) : 0}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="الأذكار"
                        fill="hsl(260, 70%, 55%)"
                        stackId="a"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="القيام"
                        fill="hsl(43, 80%, 55%)"
                        stackId="a"
                      />
                      <Bar
                        dataKey="الصيام"
                        fill="hsl(163, 79%, 20%)"
                        stackId="a"
                        radius={[3, 3, 0, 0]}
                      />
                      <Bar
                        dataKey="القرآن"
                        fill="hsl(340, 80%, 55%)"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">مقارنة العائلة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={familyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      interval={days > 7 ? Math.floor(days / 8) : 0}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    {members.map((m, i) => (
                      <Line
                        key={m.id}
                        type="monotone"
                        dataKey={m.name}
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={2}
                        dot={days <= 30 ? { r: 3 } : false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
