import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import {
  createFamily,
  joinFamilyByCode,
} from "@/services/worshipServiceSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function FamilySetupPage() {
  const { user, refreshUser } = useAppStore();
  const navigate = useNavigate();

  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  // If user already has a family, redirect
  if (user?.familyId) {
    navigate("/dashboard", { replace: true });
    return null;
  }
  if (!user) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) return;
    setLoading(true);
    const { error } = await createFamily(familyName.trim(), user.id);
    if (error) {
      toast({ variant: "destructive", title: "خطأ", description: error });
    } else {
      await refreshUser();
      toast({
        title: "تم إنشاء العائلة! 🎉",
        description: `مرحباً بك في ${familyName}`,
      });
      navigate("/dashboard", { replace: true });
    }
    setLoading(false);
  };

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
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <span className="text-4xl">🏠</span>
          </div>
          <h1 className="text-3xl font-bold text-primary font-cairo">
            مرحباً {user.avatar} {user.name}
          </h1>
          <p className="text-muted-foreground">
            ابدأ رحلتك العائلية — أنشئ عائلة أو انضم لعائلة موجودة
          </p>
        </div>

        <Card className="border-primary/20 shadow-lg">
          <CardContent className="pt-4">
            <Tabs defaultValue="create">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="create" className="gap-2">
                  <Home className="h-4 w-4" /> إنشاء عائلة
                </TabsTrigger>
                <TabsTrigger value="join" className="gap-2">
                  <Users className="h-4 w-4" /> الانضمام
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create">
                <form onSubmit={handleCreate} className="space-y-4">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-lg">إنشاء عائلة جديدة</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      ستصبح مسؤول العائلة ويمكنك دعوة الأعضاء لاحقاً
                    </p>
                  </CardHeader>
                  <div className="space-y-2">
                    <Label htmlFor="family-name">اسم العائلة</Label>
                    <Input
                      id="family-name"
                      placeholder="عائلة النور"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      required
                      disabled={loading}
                      className="text-right"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || !familyName.trim()}
                  >
                    {loading ? "جاري الإنشاء..." : "إنشاء العائلة 🏠"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="join">
                <form onSubmit={handleJoin} className="space-y-4">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-lg">
                      الانضمام إلى عائلة
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      أدخل رمز الدعوة الذي شاركه معك أحد أفراد العائلة
                    </p>
                  </CardHeader>
                  <div className="space-y-2">
                    <Label htmlFor="invite-code">رمز الدعوة</Label>
                    <Input
                      id="invite-code"
                      placeholder="ABC123"
                      value={inviteCode}
                      onChange={(e) =>
                        setInviteCode(e.target.value.toUpperCase())
                      }
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
                    {loading ? "جاري الانضمام..." : "انضم للعائلة 💚"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
