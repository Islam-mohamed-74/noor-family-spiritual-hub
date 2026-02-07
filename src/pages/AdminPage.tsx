import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import * as ws from '@/services/worshipService';
import { User, WorshipLog, Reward, Challenge } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Gift, Target, Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function AdminPage() {
  const { user } = useAppStore();
  const [members, setMembers] = useState<User[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardPoints, setNewRewardPoints] = useState('');
  const [newChallengeName, setNewChallengeName] = useState('');
  const [newChallengeDays, setNewChallengeDays] = useState('');

  useEffect(() => {
    setMembers(ws.getFamilyMembers());
    setRewards(ws.getRewards());
    setChallenges(ws.getChallenges());
  }, []);

  if (!user || user.role !== 'admin') return null;

  const addReward = () => {
    if (!newRewardName || !newRewardPoints) return;
    const reward: Reward = {
      id: `r-${Date.now()}`,
      name: newRewardName,
      description: '',
      pointsRequired: parseInt(newRewardPoints),
      familyId: user.familyId,
      createdBy: user.id,
    };
    ws.addReward(reward);
    setRewards(ws.getRewards());
    setNewRewardName('');
    setNewRewardPoints('');
    toast({ title: 'تمت إضافة المكافأة ✨' });
  };

  const removeReward = (id: string) => {
    ws.deleteReward(id);
    setRewards(ws.getRewards());
  };

  const addChallenge = () => {
    if (!newChallengeName || !newChallengeDays) return;
    const challenge: Challenge = {
      id: `c-${Date.now()}`,
      name: newChallengeName,
      description: '',
      targetDays: parseInt(newChallengeDays),
      currentDays: 0,
      familyId: user.familyId,
      active: true,
    };
    ws.addChallenge(challenge);
    setChallenges(ws.getChallenges());
    setNewChallengeName('');
    setNewChallengeDays('');
    toast({ title: 'تم إضافة التحدي 🎯' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="h-6 w-6" /> لوحة الإدارة
      </h1>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="members">الأعضاء</TabsTrigger>
          <TabsTrigger value="rewards">المكافآت</TabsTrigger>
          <TabsTrigger value="challenges">التحديات</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4 mt-4">
          {members.map(m => (
            <Card key={m.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{m.avatar}</span>
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-sm text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <Badge>{m.role === 'admin' ? 'مسؤول' : 'عضو'}</Badge>
                    <p className="text-sm text-muted-foreground mt-1">{ws.getTotalPoints(m.id)} نقطة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <Input placeholder="اسم المكافأة" value={newRewardName} onChange={e => setNewRewardName(e.target.value)} />
                <Input type="number" placeholder="النقاط" value={newRewardPoints} onChange={e => setNewRewardPoints(e.target.value)} className="w-24" dir="ltr" />
                <Button onClick={addReward} size="icon"><Plus className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
          {rewards.map(r => (
            <Card key={r.id}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <Badge variant="outline">{r.pointsRequired} نقطة</Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeReward(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <Input placeholder="اسم التحدي" value={newChallengeName} onChange={e => setNewChallengeName(e.target.value)} />
                <Input type="number" placeholder="الأيام" value={newChallengeDays} onChange={e => setNewChallengeDays(e.target.value)} className="w-24" dir="ltr" />
                <Button onClick={addChallenge} size="icon"><Plus className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
          {challenges.map(c => (
            <Card key={c.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                  </div>
                  <Badge variant="outline">{c.currentDays}/{c.targetDays}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
