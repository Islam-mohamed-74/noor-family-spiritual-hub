"use client";

import { useAppStore } from "@/store/useAppStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";
import AppLayout from "@/components/AppLayout";

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

export default function FamilyLayout({ children }: { children: ReactNode }) {
  const { user, loading, initialized } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (initialized && !loading) {
      if (!user) {
        router.replace("/auth");
      } else if (!user.familyId && pathname !== "/family-setup") {
        router.replace("/family-setup");
      } else if (pathname === "/admin" && user.role !== "admin") {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, initialized, router, pathname]);

  if (!initialized || (loading && !user)) {
    return <LoadingScreen />;
  }

  if (!user || (!user.familyId && pathname !== "/family-setup")) {
    return null; // Will redirect in useEffect
  }

  return <AppLayout>{children}</AppLayout>;
}
