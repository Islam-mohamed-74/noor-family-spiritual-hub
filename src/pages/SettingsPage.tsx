import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, Baby, LogOut, User, Palette } from 'lucide-react';
import * as ws from '@/services/worshipService';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { user, kidsMode, ramadanMode, darkMode, toggleKidsMode, toggleRamadanMode, toggleDarkMode, logout } = useAppStore();
  const navigate = useNavigate();

  if (!user) return null;

  const badges = ws.getUserBadges(user.id);
  const totalPoints = ws.getTotalPoints(user.id);
  const streak = ws.getStreak(user.id);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">⚙️ الإعدادات</h1>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> الملف الشخصي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{user.avatar}</span>
            <div>
              <p className="font-bold text-lg">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="outline" className="mt-1">{user.role === 'admin' ? 'مسؤول' : 'عضو'}</Badge>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-secondary">
              <p className="text-2xl font-bold text-primary">{totalPoints}</p>
              <p className="text-xs text-muted-foreground">نقطة</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary">
              <p className="text-2xl font-bold text-primary">{streak}</p>
              <p className="text-xs text-muted-foreground">يوم متتالي</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary">
              <p className="text-2xl font-bold text-primary">{badges.length}</p>
              <p className="text-xs text-muted-foreground">وسام</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> المظهر</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>الوضع الداكن</span>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Baby className="h-4 w-4" />
              <div>
                <span>وضع الأطفال</span>
                <p className="text-xs text-muted-foreground">واجهة ملونة وممتعة للصغار</p>
              </div>
            </div>
            <Switch checked={kidsMode} onCheckedChange={toggleKidsMode} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <div>
                <span>وضع رمضان</span>
                <p className="text-xs text-muted-foreground">مؤقتات إضافية للتراويح والإفطار</p>
              </div>
            </div>
            <Switch checked={ramadanMode} onCheckedChange={toggleRamadanMode} />
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        تسجيل الخروج
      </Button>
    </div>
  );
}
