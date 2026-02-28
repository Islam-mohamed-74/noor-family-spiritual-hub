import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
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

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAppStore((s) => s.user);
  const loading = useAppStore((s) => s.loading);

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}

/**
 * FamilyRoute — requires auth AND a familyId.
 * Users without a family are redirected to /family-setup.
 */
export function FamilyRoute({ children }: { children: ReactNode }) {
  const user = useAppStore((s) => s.user);
  const loading = useAppStore((s) => s.loading);

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!user.familyId) return <Navigate to="/family-setup" replace />;

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const user = useAppStore((s) => s.user);
  const loading = useAppStore((s) => s.loading);

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!user.familyId) return <Navigate to="/family-setup" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
