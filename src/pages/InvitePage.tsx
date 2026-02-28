import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getInviteCode } from "@/services/worshipServiceSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Share2, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function InvitePage() {
  const { user } = useAppStore();
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.familyId) return;
    getInviteCode(user.familyId).then((code) => {
      setInviteCode(code);
      setLoading(false);
    });
  }, [user?.familyId]);

  if (!user) return null;

  const joinUrl = inviteCode
    ? `${window.location.origin}/join?code=${inviteCode}`
    : "";

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: `تم نسخ ${label} 📋` });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "destructive", title: "لم يتمكن من النسخ" });
    }
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    if (navigator.share) {
      await navigator.share({
        title: "انضم إلى عائلتي في نور العائلة",
        text: `رمز الانضمام: ${inviteCode}`,
        url: joinUrl,
      });
    } else {
      handleCopy(joinUrl, "رابط الدعوة");
    }
  };

  return (
    <div dir="rtl" className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">دعوة أفراد العائلة</h1>
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            جاري التحميل...
          </CardContent>
        </Card>
      ) : !inviteCode ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            تعذّر تحميل رمز الدعوة
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Code card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>رمز الدعوة</CardTitle>
              <p className="text-sm text-muted-foreground">
                شارك هذا الرمز مع أفراد العائلة ليتمكنوا من الانضمام
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={inviteCode}
                  readOnly
                  className="text-center tracking-widest font-mono text-2xl font-bold text-primary"
                  dir="ltr"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(inviteCode, "الرمز")}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button className="w-full gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                مشاركة رابط الدعوة
              </Button>
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>رمز QR</CardTitle>
              <p className="text-sm text-muted-foreground">
                امسح الرمز بالكاميرا للانضمام مباشرة
              </p>
            </CardHeader>
            <CardContent className="flex justify-center p-6">
              <div className="p-4 bg-white rounded-xl shadow-sm">
                <QRCodeSVG
                  value={joinUrl}
                  size={200}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "",
                    height: 0,
                    width: 0,
                    excavate: false,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Link card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>رابط الانضمام المباشر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Input value={joinUrl} readOnly className="text-xs" dir="ltr" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(joinUrl, "الرابط")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
