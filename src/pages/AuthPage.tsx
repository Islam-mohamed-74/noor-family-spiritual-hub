import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { signIn, signUp } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AVATAR_OPTIONS = ["👨", "👩", "👦", "👧", "🧔", "👴", "👵", "🧒"];

// ---------------------------------------------------------------------------
// Sign-In Form
// ---------------------------------------------------------------------------
interface SignInFormProps {
  initialEmail?: string;
}

function SignInForm({ initialEmail = "" }: SignInFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الدخول",
          description: result.error,
        });
      } else {
        toast({ title: "مرحبا!", description: "تم تسجيل الدخول بنجاح" });
        navigate("/dashboard");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      setError(message);
      toast({ variant: "destructive", title: "خطأ", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">البريد الإلكتروني</Label>
        <Input
          id="signin-email"
          type="email"
          placeholder="example@noor.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="text-right"
          dir="ltr"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">كلمة المرور</Label>
        <Input
          id="signin-password"
          type="password"
          placeholder="••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          dir="ltr"
        />
      </div>
      {error && <p className="text-destructive text-sm text-center">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "جاري تسجيل الدخول..." : "دخول"}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Sign-Up Form
// ---------------------------------------------------------------------------
interface SignUpFormProps {
  onSuccess: (email: string) => void;
}

function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("👨");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signUp(email, password, name, avatar);
      if (result.error) {
        setError(result.error);
        toast({
          variant: "destructive",
          title: "خطأ في إنشاء الحساب",
          description: result.error,
        });
      } else {
        toast({
          title: "مرحبا بك!",
          description: "تم إنشاء حسابك بنجاح. يرجى تسجيل الدخول.",
        });
        onSuccess(email);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      setError(message);
      toast({ variant: "destructive", title: "خطأ", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">الاسم</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="محمد أحمد"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
          className="text-right"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">البريد الإلكتروني</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="example@noor.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="text-right"
          dir="ltr"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">كلمة المرور</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          minLength={6}
          dir="ltr"
        />
        <p className="text-xs text-muted-foreground">على الأقل 6 أحرف</p>
      </div>
      <div className="space-y-2">
        <Label>اختر أيقونتك</Label>
        <div className="grid grid-cols-8 gap-2">
          {AVATAR_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setAvatar(opt)}
              disabled={loading}
              className={`text-2xl p-2 rounded-lg border-2 transition-colors ${
                avatar === opt
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-destructive text-sm text-center">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Auth Page
// ---------------------------------------------------------------------------
export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInEmail, setSignInEmail] = useState("");
  const user = useAppStore((s) => s.user);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignUpSuccess = (email: string) => {
    setSignInEmail(email);
    setMode("signin");
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen islamic-pattern flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <span className="text-4xl">🌙</span>
          </div>
          <h1 className="text-3xl font-bold text-primary font-cairo">
            نور العائلة
          </h1>
          <p className="text-muted-foreground">
            تتبع عباداتكم معا كعائلة واحدة
          </p>
        </div>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">مرحبا بك</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={mode}
              onValueChange={(v) => setMode(v as "signin" | "signup")}
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                {/* key forces remount so initialEmail refreshes after signup */}
                <SignInForm key={signInEmail} initialEmail={signInEmail} />
              </TabsContent>

              <TabsContent value="signup">
                <SignUpForm onSuccess={handleSignUpSuccess} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          بسم الله الرحمن الرحيم
        </p>
      </div>
    </div>
  );
}
