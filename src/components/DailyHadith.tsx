import { useMemo } from "react";
import { getDailyHadith } from "@/lib/hadith";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function DailyHadith() {
  // Memoize for the current render session (changes each calendar day)
  const hadith = useMemo(() => getDailyHadith(), []);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-primary shrink-0 mt-1" />
          <div>
            <p className="text-xs font-medium text-primary mb-1">حديث اليوم</p>
            <p className="text-sm leading-relaxed font-arabic">{hadith.text}</p>
            <p className="text-xs text-muted-foreground mt-2">
              — {hadith.source}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
