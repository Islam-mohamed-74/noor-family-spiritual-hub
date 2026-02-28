"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { useShallow } from "zustand/react/shallow";
import { joinFamilyByCode } from "@/services/worshipServiceSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function JoinForm() {
  const { user, refreshUser } = useAppStore(
    useShallow((s) => ({ user: s.user, refreshUser: s.refreshUser })),
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState(
    (searchParams.get("code") || "").toUpperCase(),
  );
  const [loading, setLoading] = useState(false);

  // If user already has a family, redirect
  useEffect(() => {
    if (user?.familyId) {
      router.replace("/dashboard");
    }
  }, [user?.familyId, router]);

  if (!user) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    const result = await joinFamilyByCode(inviteCode.trim(), user.id);
    if (result.error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: result.error,
      });
    } else {
      await refreshUser();
      toast({ title: "انضممت إلى العائلة! 💚" });
      router.replace("/dashboard");
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
                onClick={() => router.push("/family-setup")}
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

export default function JoinPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinForm />
    </Suspense>
  );
}
