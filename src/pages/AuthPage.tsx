import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { authenticate } from '@/services/worshipService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Sun } from 'lucide-react';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const setUser = useAppStore(s => s.setUser);
  const navigate = useNavigate();
  const user = useAppStore(s => s.user);

  if (user) { navigate('/dashboard', { replace: true }); return null; }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const u = authenticate(email, password);
    if (u) { setUser(u); navigate('/dashboard'); }
    else setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  };

  const quickLogin = (em: string) => {
    const u = authenticate(em, '123');
    if (u) { setUser(u); navigate('/dashboard'); }
  };

  return (
    <div dir="rtl" className="min-h-screen islamic-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <span className="text-4xl">🌙</span>
          </div>
          <h1 className="text-3xl font-bold text-primary font-cairo">نور العائلة</h1>
          <p className="text-muted-foreground">تتبّع عباداتكم معاً كعائلة واحدة</p>
        </div>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">تسجيل الدخول</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">البريد الإلكتروني</label>
                <Input
                  type="email"
                  placeholder="example@noor.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="text-right"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">كلمة المرور</label>
                <Input
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  dir="ltr"
                />
              </div>
              {error && <p className="text-destructive text-sm text-center">{error}</p>}
              <Button type="submit" className="w-full">دخول</Button>
            </form>

            <div className="mt-6 space-y-3">
              <p className="text-xs text-muted-foreground text-center">دخول سريع للتجربة</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => quickLogin('father@noor.com')}>
                  👨 أبو محمد
                </Button>
                <Button variant="outline" size="sm" onClick={() => quickLogin('mother@noor.com')}>
                  👩 أم محمد
                </Button>
                <Button variant="outline" size="sm" onClick={() => quickLogin('child1@noor.com')}>
                  👦 محمد
                </Button>
                <Button variant="outline" size="sm" onClick={() => quickLogin('child2@noor.com')}>
                  👧 فاطمة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          بسم الله الرحمن الرحيم
        </p>
      </div>
    </div>
  );
}
