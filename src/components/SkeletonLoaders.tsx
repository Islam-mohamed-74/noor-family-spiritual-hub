import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function WeeklyReportSkeleton() {
  return (
    <Card className="h-64">
      <CardContent className="p-4 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex items-end gap-2 h-32">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-md"
              style={{ height: `${Math.random() * 80 + 20}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PrayerTimesSkeleton() {
  return (
    <Card className="h-64">
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-6 w-24 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function HijriCalendarSkeleton() {
  return (
    <Card className="h-48">
      <CardContent className="p-4 space-y-4">
        <Skeleton className="h-6 w-32 mx-auto" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full rounded-md" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
