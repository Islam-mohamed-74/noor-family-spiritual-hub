import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useUserBadges } from "@/hooks/useUserBadges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Moon,
  Sun,
  Baby,
  LogOut,
  User,
  Palette,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { updateUserProfile } from "@/services/family/memberService";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const AVATAR_OPTIONS = ["👨", "👩", "👦", "👧", "🧔", "👴", "👵", "🧒"];

export default function SettingsPage() {
  const {
    user,
    refreshUser,
    kidsMode,
    ramadanMode,
    darkMode,
    toggleKidsMode,
    toggleRamadanMode,
    toggleDarkMode,
    logout,
  } = useAppStore();
  const navigate = useNavigate();
  const badgesQuery = useUserBadges();

  const badges = badgesQuery.data?.badges ?? [];
  const totalPoints = badgesQuery.data?.totalPoints ?? 0;
  const streak = badgesQuery.data?.streak ?? 0;

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editAvatar, setEditAvatar] = useState(user?.avatar || "👨");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    const { error } = await updateUserProfile(user.id, {
      name: editName.trim(),
      avatar: editAvatar,
    });
    if (error) {
      toast({ variant: "destructive", title: "خطأ", description: error });
    } else {
      await refreshUser();
      toast({ title: "تم حفظ الملف الشخصي ✅" });
      setEditing(false);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">⚙️ الإعدادات</h1>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="h-5 w-5" /> الملف الشخصي
            </span>
            {!editing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(true);
                  setEditName(user.name);
                  setEditAvatar(user.avatar || "👨");
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label>الأيقونة</Label>
                <div className="grid grid-cols-8 gap-2">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setEditAvatar(opt)}
                      className={`text-2xl p-2 rounded-lg border-2 transition-colors ${
                        editAvatar === opt
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" /> حفظ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditing(false)}
                  className="gap-2"
                >
                  <X className="h-4 w-4" /> إلغاء
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <span className="text-5xl">{user.avatar}</span>
                <div>
                  <p className="font-bold text-lg">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant="outline" className="mt-1">
                    {user.role === "admin" ? "مسؤول" : "عضو"}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-2xl font-bold text-primary">
                    {totalPoints}
                  </p>
                  <p className="text-xs text-muted-foreground">نقطة</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-2xl font-bold text-primary">{streak}</p>
                  <p className="text-xs text-muted-foreground">يوم متتالي</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-2xl font-bold text-primary">
                    {badges.length}
                  </p>
                  <p className="text-xs text-muted-foreground">وسام</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" /> المظهر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {darkMode ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span>الوضع الداكن</span>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Baby className="h-4 w-4" />
              <div>
                <span>وضع الأطفال</span>
                <p className="text-xs text-muted-foreground">
                  واجهة ملونة وممتعة للصغار
                </p>
              </div>
            </div>
            <Switch checked={kidsMode} onCheckedChange={toggleKidsMode} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <div>
                <span>وضع رمضان</span>
                <p className="text-xs text-muted-foreground">
                  مؤقتات إضافية للتراويح والإفطار
                </p>
              </div>
            </div>
            <Switch checked={ramadanMode} onCheckedChange={toggleRamadanMode} />
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="destructive"
        className="w-full gap-2"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" /> تسجيل الخروج
      </Button>
    </div>
  );
}
