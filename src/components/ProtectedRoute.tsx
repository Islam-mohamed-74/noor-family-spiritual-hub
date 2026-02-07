import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAppStore(s => s.user);
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const user = useAppStore(s => s.user);
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
