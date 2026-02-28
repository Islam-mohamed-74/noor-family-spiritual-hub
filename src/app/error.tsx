"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex items-center justify-center min-h-screen p-4"
      dir="rtl"
    >
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 space-y-4 text-center">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold">حدث خطأ غير متوقع</h2>
          <p className="text-sm text-muted-foreground">
            {error.message || "حاول مرة أخرى"}
          </p>
          <div className="space-y-2">
            <Button onClick={() => reset()} className="w-full">
              إعادة المحاولة
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              تحديث الصفحة بالكامل
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
