import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import * as ws from '@/services/worshipService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ReportsPage() {
  const { user } = useAppStore();
  const [selectedUser, setSelectedUser] = useState(user?.id || '');
  const members = ws.getFamilyMembers();

  if (!user) return null;

  const userLogs = ws.getLogsByUser(selectedUser).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);

  const dailyData = userLogs.map(log => ({
    date: new Date(log.date).toLocaleDateString('ar-SA', { weekday: 'short' }),
    النقاط: ws.calculateDayPoints(log),
    الصلوات: log.prayers.filter(p => p.completed).length,
    القرآن: log.quranPages,
  }));

  // Family comparison
  const familyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('ar-SA', { weekday: 'short' });
    const entry: Record<string, any> = { date: dayLabel };
    members.forEach(m => {
      const log = ws.getLogByUserAndDate(m.id, dateStr);
      entry[m.name] = log ? ws.calculateDayPoints(log) : 0;
    });
    return entry;
  });

  const COLORS = ['hsl(163, 79%, 20%)', 'hsl(43, 80%, 55%)', 'hsl(260, 70%, 55%)', 'hsl(340, 80%, 55%)'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📈 التقارير</h1>
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {members.map(m => (
              <SelectItem key={m.id} value={m.id}>{m.avatar} {m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Points trend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>النقاط اليومية</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="النقاط" stroke="hsl(163, 79%, 20%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Prayer & Quran */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>الصلوات والقرآن</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="الصلوات" fill="hsl(163, 79%, 20%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="القرآن" fill="hsl(43, 80%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Family comparison */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>مقارنة العائلة</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={familyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {members.map((m, i) => (
                <Line key={m.id} type="monotone" dataKey={m.name} stroke={COLORS[i]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
