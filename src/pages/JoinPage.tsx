import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { joinFamilyByCode } from "@/services/worshipServiceSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function JoinPage() {
  const { user, refreshUser } = useAppStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState(
    (searchParams.get("code") || "").toUpperCase(),
  );
  const [loading, setLoading] = useState(false);

  // If user already has a family, redirect
  useEffect(() => {
    if (user?.familyId) navigate("/dashboard", { replace: true });
  }, [user?.familyId, navigate]);

  if (!user) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    const { error } = await joinFamilyByCode(inviteCode.trim(), user.id);
    if (error) {
      toast({ variant: "destructive", title: "خطأ", description: error });
    } else {
      await refreshUser();
      toast({ title: "انضممت إلى العائلة! 💚" });
      navigate("/dashboard", { replace: true });
    }
    setLoading(false);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen islamic-pattern flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <span className="text-4xl">💚</span>
          </div>
          <h1 className="text-3xl font-bold text-primary font-cairo">
            انضم إلى العائلة
          </h1>
          <p className="text-muted-foreground">
            {inviteCode
              ? `أنت مدعو للانضمام برمز: ${inviteCode}`
              : "أدخل رمز الدعوة للانضمام"}
          </p>
        </div>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> رمز الدعوة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join-code">رمز الدعوة</Label>
                <Input
                  id="join-code"
                  placeholder="ABC123"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  required
                  disabled={loading}
                  className="text-center tracking-widest font-mono text-lg"
                  dir="ltr"
                  maxLength={8}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !inviteCode.trim()}
              >
                {loading ? "جاري الانضمام..." : "انضم الآن 💚"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/family-setup")}
              >
                إنشاء عائلة جديدة بدلاً من ذلك
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
