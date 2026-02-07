import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import * as ws from '@/services/worshipService';
import { WorshipLog, PrayerLog, PRAYER_NAMES, PrayerName } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Moon, Sun, Hand, Eye, EyeOff, Flame } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user, kidsMode, ramadanMode } = useAppStore();
  const [log, setLog] = useState<WorshipLog | null>(null);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    const todayLog = ws.getTodayLog(user.id);
    setLog(todayLog);
    setPoints(ws.getTotalPoints(user.id));
    setStreak(ws.getStreak(user.id));
  }, [user]);

  if (!user || !log) return null;

  const updateLog = (partial: Partial<WorshipLog>) => {
    const updated = { ...log, ...partial };
    ws.saveLog(updated);
    setLog(updated);
    setPoints(ws.getTotalPoints(user.id));
  };

  const updatePrayer = (name: PrayerName, field: keyof PrayerLog, value: boolean) => {
    const prayers = log.prayers.map(p =>
      p.name === name ? { ...p, [field]: value, ...(field === 'completed' && !value ? { onTime: false, jamaah: false } : {}) } : p
    );
    updateLog({ prayers });
  };

  const completedPrayers = log.prayers.filter(p => p.completed).length;
  const dayProgress = Math.round((completedPrayers / 5) * 100);
  const todayPoints = ws.calculateDayPoints(log);

  const showEncouragement = () => {
    const msgs = kidsMode
      ? ['أحسنت! ⭐', 'بارك الله فيك! 🌟', 'ما شاء الله! 🎉']
      : ['تقبّل الله منك', 'خطوة جميلة نحو الاستمرار', 'بارك الله في عبادتك'];
    toast({ title: msgs[Math.floor(Math.random() * msgs.length)] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`font-bold ${kidsMode ? 'text-3xl' : 'text-2xl'}`}>
            مرحباً {user.avatar} {user.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <Badge variant="secondary" className="gap-1 text-base px-3 py-1">
              <Flame className="h-4 w-4 text-orange-500" /> {streak}
            </Badge>
          )}
          <Badge className="bg-accent text-accent-foreground gap-1 px-3 py-1">
            ⭐ {points}
          </Badge>
        </div>
      </div>

      {/* Day progress */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">تقدّم اليوم</span>
            <span className="text-sm text-muted-foreground">{todayPoints} نقطة</span>
          </div>
          <Progress value={dayProgress} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">{completedPrayers}/5 صلوات</p>
        </CardContent>
      </Card>

      {/* Prayers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className={kidsMode ? 'text-xl' : 'text-lg'}>🕌 الصلوات اليومية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {log.prayers.map(prayer => (
            <div key={prayer.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={prayer.completed}
                  onCheckedChange={(v) => {
                    updatePrayer(prayer.name, 'completed', !!v);
                    if (v) showEncouragement();
                  }}
                  className={kidsMode ? 'h-6 w-6' : ''}
                />
                <span className={`font-medium ${kidsMode ? 'text-lg' : ''}`}>
                  {PRAYER_NAMES[prayer.name]}
                </span>
              </div>
              {prayer.completed && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updatePrayer(prayer.name, 'onTime', !prayer.onTime)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${prayer.onTime ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  >
                    في وقتها
                  </button>
                  <button
                    onClick={() => updatePrayer(prayer.name, 'jamaah', !prayer.jamaah)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${prayer.jamaah ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  >
                    جماعة
                  </button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Azkar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className={kidsMode ? 'text-xl' : 'text-lg'}>📿 الأذكار</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1 flex items-center justify-between p-3 rounded-lg bg-secondary">
            <span className="flex items-center gap-2"><Sun className="h-4 w-4" /> أذكار الصباح</span>
            <Switch checked={log.azpiMorning} onCheckedChange={(v) => { updateLog({ azpiMorning: v }); if (v) showEncouragement(); }} />
          </div>
          <div className="flex-1 flex items-center justify-between p-3 rounded-lg bg-secondary">
            <span className="flex items-center gap-2"><Moon className="h-4 w-4" /> أذكار المساء</span>
            <Switch checked={log.azpiEvening} onCheckedChange={(v) => { updateLog({ azpiEvening: v }); if (v) showEncouragement(); }} />
          </div>
        </CardContent>
      </Card>

      {/* Quran & Fasting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={kidsMode ? 'text-xl' : 'text-lg'}>📖 القرآن الكريم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-sm">عدد الصفحات:</span>
              <Input
                type="number"
                min={0}
                value={log.quranPages}
                onChange={e => updateLog({ quranPages: parseInt(e.target.value) || 0 })}
                className="w-24 text-center"
                dir="ltr"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={kidsMode ? 'text-xl' : 'text-lg'}>🍽️ الصيام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span>صيام اليوم</span>
              <Switch checked={log.fasting} onCheckedChange={(v) => { updateLog({ fasting: v }); if (v) showEncouragement(); }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Extra worship */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className={kidsMode ? 'text-xl' : 'text-lg'}>🤲 عبادات إضافية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>صلاة الضحى</span>
            <Switch checked={log.duha} onCheckedChange={(v) => { updateLog({ duha: v }); if (v) showEncouragement(); }} />
          </div>
          <div className="flex items-center justify-between">
            <span>صلاة الوتر</span>
            <Switch checked={log.witr} onCheckedChange={(v) => { updateLog({ witr: v }); if (v) showEncouragement(); }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              قيام الليل
              {log.qiyamPrivate && <EyeOff className="h-3 w-3 text-muted-foreground" />}
            </span>
            <Switch checked={log.qiyam} onCheckedChange={(v) => { updateLog({ qiyam: v }); if (v) showEncouragement(); }} />
          </div>
        </CardContent>
      </Card>

      {/* Private worship */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-muted-foreground" /> عبادات خاصة
          </CardTitle>
          <p className="text-xs text-muted-foreground">هذه العبادات مخفية عن الآخرين وتكسب نقاطاً</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>صدقة</span>
            <Switch checked={log.sadaqaPrivate} onCheckedChange={(v) => updateLog({ sadaqaPrivate: v })} />
          </div>
          <div className="flex items-center justify-between">
            <span>دعاء خاص</span>
            <Switch checked={log.duaPrivate} onCheckedChange={(v) => updateLog({ duaPrivate: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Ramadan extras */}
      {ramadanMode && (
        <Card className="border-gold/50 bg-gradient-to-b from-gold/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">🌙 عبادات رمضان</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>الإفطار</span>
              <Switch checked={log.iftar} onCheckedChange={(v) => updateLog({ iftar: v })} />
            </div>
            <div className="flex items-center justify-between">
              <span>التراويح</span>
              <Switch checked={log.tarawih} onCheckedChange={(v) => updateLog({ tarawih: v })} />
            </div>
            {log.tarawih && (
              <div className="flex items-center gap-3">
                <span className="text-sm">عدد الركعات:</span>
                <Input
                  type="number" min={0} max={20}
                  value={log.tarawihRakaat}
                  onChange={e => updateLog({ tarawihRakaat: parseInt(e.target.value) || 0 })}
                  className="w-20 text-center" dir="ltr"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
