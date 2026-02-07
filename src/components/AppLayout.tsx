import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { LayoutDashboard, Users, BarChart3, Settings, Shield, LogOut, Moon, Sun, Baby, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { to: '/family', icon: Users, label: 'العائلة' },
  { to: '/reports', icon: BarChart3, label: 'التقارير' },
  { to: '/settings', icon: Settings, label: 'الإعدادات' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout, kidsMode, ramadanMode, darkMode, toggleDarkMode } = useAppStore();
  const location = useLocation();
  const isMobile = useIsMobile();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div dir="rtl" className={cn(
      "min-h-screen font-cairo",
      ramadanMode && "ramadan",
      kidsMode && "kids-mode"
    )}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="fixed right-0 top-0 h-screen w-64 border-l bg-sidebar flex flex-col z-40">
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{ramadanMode ? '🌙' : '☀️'}</span>
              <div>
                <h1 className="font-bold text-lg text-sidebar-foreground">نور العائلة</h1>
                <p className="text-xs text-muted-foreground">{user?.name}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm",
                  isActive(item.to)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm",
                  isActive('/admin')
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Shield className="h-5 w-5" />
                <span>الإدارة</span>
              </Link>
            )}
          </nav>

          <div className="p-4 border-t border-sidebar-border space-y-2">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={toggleDarkMode}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive" onClick={logout}>
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className={cn("min-h-screen transition-all", !isMobile && "mr-64", isMobile && "pb-20")}>
        {/* Mobile header */}
        {isMobile && (
          <header className="sticky top-0 bg-background/95 backdrop-blur border-b z-30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{ramadanMode ? '🌙' : '☀️'}</span>
              <h1 className="font-bold text-primary">نور العائلة</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </header>
        )}

        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t z-40 flex justify-around py-2">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors text-xs",
                isActive(item.to)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive(item.to) && "text-primary")} />
              <span>{item.label}</span>
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors text-xs",
                isActive('/admin') ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Shield className="h-5 w-5" />
              <span>الإدارة</span>
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
