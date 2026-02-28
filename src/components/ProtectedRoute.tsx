import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

// Loading spinner component
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 animate-pulse">
          <span className="text-3xl">🌙</span>
        </div>
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  );
}

export function FamilyRoute({ children }: { children: ReactNode }) {
  const user = useAppStore((s) => s.user);
  const loading = useAppStore((s) => s.loading);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user?.familyId) {
      router.replace("/family-setup");
    }
  }, [user, loading, router]);

  if (loading) return <LoadingScreen />;
  if (!user?.familyId) return null;

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const user = useAppStore((s) => s.user);
  const loading = useAppStore((s) => s.loading);
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user?.familyId) {
        router.replace("/family-setup");
      } else if (user.role !== "admin") {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading) return <LoadingScreen />;
  if (!user?.familyId || user.role !== "admin") return null;

  return <>{children}</>;
}
