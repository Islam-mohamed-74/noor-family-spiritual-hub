import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import * as ws from '@/services/worshipService';
import { User, Nudge } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Bell, BookOpen, Users, Flame, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function FamilyPage() {
  const { user, kidsMode } = useAppStore();
  const [members, setMembers] = useState<User[]>([]);
  const [family, setFamily] = useState(ws.getFamily());

  useEffect(() => {
    setMembers(ws.getFamilyMembers());
    setFamily(ws.getFamily());
  }, []);

  if (!user) return null;

  const leaderboard = members
    .map(m => ({
      ...m,
      weeklyPoints: ws.getWeeklyPoints(m.id),
      totalPoints: ws.getTotalPoints(m.id),
      streak: ws.getStreak(m.id),
      badges: ws.getUserBadges(m.id),
    }))
    .sort((a, b) => b.weeklyPoints - a.weeklyPoints);

  const titles = ['🥇', '🥈', '🥉', '⭐'];
  const arabicTitles = ['فارس الفجر', 'بطل الأذكار', 'صاحب الهمة', 'نجم العائلة'];

  const todayDate = new Date().toISOString().split('T')[0];
  const dailyCompletion = ws.getFamilyDailyCompletion(todayDate);

  const khatmaProgress = Math.round((family.sharedKhatma.completedPages / family.sharedKhatma.targetPages) * 100);

  const sendNudge = (toId: string) => {
    const msgs = ['حان وقت العبادة! 🌟', 'لا تنسَ أذكارك 📿', 'هيا نتسابق للخير! 🏃'];
    const nudge: Nudge = {
      id: `n-${Date.now()}`,
      fromUserId: user.id,
      toUserId: toId,
      message: msgs[Math.floor(Math.random() * msgs.length)],
      timestamp: new Date().toISOString(),
      read: false,
    };
    ws.sendNudge(nudge);
    toast({ title: 'تم إرسال التشجيع! 💚' });
  };

  return (
    <div className="space-y-6">
      <h1 className={`font-bold ${kidsMode ? 'text-3xl' : 'text-2xl'}`}>
        <Users className="inline h-6 w-6 ml-2" />
        {family.name}
      </h1>

      {/* Family progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">تقدّم العائلة اليوم</span>
            <span className="text-sm text-muted-foreground">{dailyCompletion}%</span>
          </div>
          <Progress value={dailyCompletion} className="h-3" />
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold" />
            لوحة المتصدرين الأسبوعية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {leaderboard.map((m, i) => (
            <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg ${i === 0 ? 'bg-gold/10 border border-gold/30' : 'bg-secondary'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{titles[i] || '⭐'}</span>
                <div>
                  <span className="font-medium">{m.avatar} {m.name}</span>
                  <p className="text-xs text-muted-foreground">{arabicTitles[i] || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {m.streak > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Flame className="h-3 w-3 text-orange-500" /> {m.streak}
                  </Badge>
                )}
                <Badge className="bg-accent text-accent-foreground">{m.weeklyPoints} نقطة</Badge>
                {m.id !== user.id && (
                  <Button variant="ghost" size="icon" onClick={() => sendNudge(m.id)}>
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Shared Khatma */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            ختمة القرآن الجماعية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={khatmaProgress} className="h-4 mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{family.sharedKhatma.completedPages} صفحة</span>
            <span>{family.sharedKhatma.targetPages} صفحة</span>
          </div>
        </CardContent>
      </Card>

      {/* Badges showcase */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>🏅 الأوسمة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ws.getBadges().map(badge => {
              const earned = leaderboard.some(m => m.badges.some(b => b.id === badge.id));
              return (
                <div key={badge.id} className={`text-center p-3 rounded-lg border ${earned ? 'bg-gold/10 border-gold/30' : 'opacity-40'}`}>
                  <span className="text-3xl block mb-1">{badge.icon}</span>
                  <p className="text-sm font-medium">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Challenges */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>🎯 التحديات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ws.getChallenges().map(c => (
            <div key={c.id} className="p-3 rounded-lg bg-secondary">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{c.name}</span>
                <Badge variant="outline">{c.currentDays}/{c.targetDays} يوم</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{c.description}</p>
              <Progress value={(c.currentDays / c.targetDays) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
