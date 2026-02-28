// ---------------------------------------------------------------------------
// PrayerTimesCard — Task 21: Prayer Times API (Aladhan)
// ---------------------------------------------------------------------------

import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, RefreshCw, Clock, XCircle } from "lucide-react";

function formatTime12(time24: string): string {
  if (!time24 || time24 === "--:--") return "--:--";
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "م" : "ص";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function minutesToHM(mins: number): string {
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} س ${m} د`;
  if (h > 0) return `${h} ساعة`;
  return `${m} دقيقة`;
}

export default function PrayerTimesCard() {
  const {
    data,
    isLoading,
    isError,
    hasLocation,
    geoError,
    isRequesting,
    requestLocation,
    clearLocation,
    refetch,
  } = usePrayerTimes();

  // — No location yet —
  if (!hasLocation) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            🕌 مواقيت الصلاة
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-4 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground max-w-xs">
            اسمح بالوصول إلى موقعك لعرض مواقيت الصلاة الصحيحة لمنطقتك
          </p>
          {geoError && (
            <p className="text-xs text-destructive">{geoError}</p>
          )}
          <Button
            size="sm"
            onClick={requestLocation}
            disabled={isRequesting}
            className="gap-2"
          >
            <MapPin className="h-4 w-4" />
            {isRequesting ? "جارٍ تحديد الموقع..." : "تحديد موقعي"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // — Loading —
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">🕌 مواقيت الصلاة</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  // — Error —
  if (isError || !data) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">🕌 مواقيت الصلاة</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-4 text-center">
          <XCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            تعذّر تحميل مواقيت الصلاة
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 ml-1" /> إعادة المحاولة
            </Button>
            <Button size="sm" variant="ghost" onClick={clearLocation}>
              تغيير الموقع
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { times, nextPrayer, minutesUntilNext, hijriDate } = data;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            🕌 مواقيت الصلاة
          </CardTitle>
          <div className="flex items-center gap-2">
            {nextPrayer && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {nextPrayer.name} بعد {minutesToHM(minutesUntilNext)}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {hijriDate && (
          <p className="text-xs text-muted-foreground">{hijriDate}</p>
        )}
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {times.map((t) => {
            const isNext = nextPrayer?.key === t.key;
            return (
              <div
                key={t.key}
                className={`flex flex-col items-center p-2.5 rounded-lg text-center transition-colors ${
                  isNext
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                }`}
              >
                <span className="text-xs font-medium mb-1">{t.name}</span>
                <span className={`font-bold tabular-nums ${isNext ? "text-lg" : "text-base"}`}>
                  {formatTime12(t.time)}
                </span>
                {isNext && (
                  <span className="text-[10px] mt-0.5 opacity-80">التالية</span>
                )}
              </div>
            );
          })}
        </div>

        <button
          className="mt-3 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          onClick={clearLocation}
        >
          <MapPin className="h-3 w-3" /> تغيير الموقع
        </button>
      </CardContent>
    </Card>
  );
}
