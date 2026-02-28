import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <div className="text-center space-y-4 mb-8">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-4 w-80 mx-auto" />
      </div>

      <Card className="border-2 border-dashed">
        <CardHeader className="text-center">
          <Skeleton className="h-6 w-32 mx-auto" />
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 py-10">
          <Skeleton className="h-48 w-48 rounded-lg" />
          <div className="flex gap-4 w-full justify-center">
            <Skeleton className="h-12 w-32 rounded-md" />
            <Skeleton className="h-12 w-32 rounded-md" />
          </div>
          <Skeleton className="h-6 w-48 mx-auto" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-40 mx-auto" />
        </CardContent>
      </Card>
    </div>
  );
}
