import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { toast } from "@/hooks/use-toast";
import {
  ProtectedRoute,
  AdminRoute,
  FamilyRoute,
} from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";

const AuthPage = lazy(() => import("./pages/AuthPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const FamilyPage = lazy(() => import("./pages/FamilyPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const FamilySetupPage = lazy(() => import("./pages/FamilySetupPage"));
const JoinPage = lazy(() => import("./pages/JoinPage"));
const InvitePage = lazy(() => import("./pages/InvitePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
    mutations: {
      onError: (error: unknown) => {
        const msg = error instanceof Error ? error.message : "حدث خطأ";
        toast({ variant: "destructive", title: "خطأ", description: msg });
      },
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-pulse text-4xl">🌙</div>
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/join"
                element={
                  <ProtectedRoute>
                    <JoinPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/family-setup"
                element={
                  <ProtectedRoute>
                    <FamilySetupPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <FamilyRoute>
                    <AppLayout>
                      <DashboardPage />
                    </AppLayout>
                  </FamilyRoute>
                }
              />
              <Route
                path="/family"
                element={
                  <FamilyRoute>
                    <AppLayout>
                      <FamilyPage />
                    </AppLayout>
                  </FamilyRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <FamilyRoute>
                    <AppLayout>
                      <ReportsPage />
                    </AppLayout>
                  </FamilyRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SettingsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invite"
                element={
                  <FamilyRoute>
                    <AppLayout>
                      <InvitePage />
                    </AppLayout>
                  </FamilyRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AppLayout>
                      <AdminPage />
                    </AppLayout>
                  </AdminRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
