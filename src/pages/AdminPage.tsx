import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import * as ws from "@/services/worshipServiceSupabase";
import {
  getFamilyEvents,
  addFamilyEvent,
  deleteFamilyEvent,
} from "@/services/social/eventService";
import {
  getFamilyRewardClaims,
  reviewRewardClaim,
} from "@/services/social/claimService";
import {
  getFamilyFeedback,
  markFeedbackReviewed,
} from "@/services/social/feedbackService";
import {
  User,
  Reward,
  Challenge,
  FamilyEvent,
  RewardClaim,
  Feedback,
} from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Gift,
  Target,
  Trash2,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Check,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const EVENT_TYPE_LABELS: Record<string, string> = {
  prayer: "🕌 صلاة",
  quran: "📖 قرآن",
  gathering: "👨‍👩‍👧 تجمّع",
  general: "📌 عام",
};

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  bug: "🐛 خطأ",
  suggestion: "💡 اقتراح",
  praise: "💚 إيجابي",
};

export default function AdminPage() {
  const { user } = useAppStore();
  const [members, setMembers] = useState<User[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [claims, setClaims] = useState<RewardClaim[]>([]);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [memberPoints, setMemberPoints] = useState<Record<string, number>>({});

  // Form states
  const [newRewardName, setNewRewardName] = useState("");
  const [newRewardPoints, setNewRewardPoints] = useState("");
  const [newChallengeName, setNewChallengeName] = useState("");
  const [newChallengeDays, setNewChallengeDays] = useState("");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventType, setNewEventType] = useState<string>("general");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [m, r, c, ev, cl, fb] = await Promise.all([
      ws.getFamilyMembers(),
      ws.getRewards(),
      ws.getChallenges(),
      getFamilyEvents(),
      getFamilyRewardClaims("pending"),
      getFamilyFeedback(),
    ]);
    setMembers(m);
    setRewards(r);
    setChallenges(c);
    setEvents(ev);
    setClaims(cl);
    setFeedbackList(fb);
    const pts: Record<string, number> = {};
    await Promise.all(
      m.map(async (mem) => {
        pts[mem.id] = await ws.getTotalPoints(mem.id);
      }),
    );
    setMemberPoints(pts);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user || user.role !== "admin") return null;

  // ── Rewards ───────────────────────────────────────────────────────────────
  const addReward = async () => {
    if (!newRewardName || !newRewardPoints) return;
    const { error } = await ws.addReward({
      name: newRewardName,
      description: "",
      pointsRequired: parseInt(newRewardPoints),
      familyId: user.familyId,
      createdBy: user.id,
    });
    if (error) {
      toast({ variant: "destructive", title: "خطأ", description: error });
      return;
    }
    setRewards(await ws.getRewards());
    setNewRewardName("");
    setNewRewardPoints("");
    toast({ title: "تمت إضافة المكافأة ✨" });
  };

  const removeReward = async (id: string) => {
    await ws.deleteReward(id);
    setRewards(await ws.getRewards());
  };

  // ── Challenges ────────────────────────────────────────────────────────────
  const addChallenge = async () => {
    if (!newChallengeName || !newChallengeDays) return;
    const { error } = await ws.addChallenge({
      name: newChallengeName,
      description: "",
      targetDays: parseInt(newChallengeDays),
      currentDays: 0,
      familyId: user.familyId,
      active: true,
    });
    if (error) {
      toast({ variant: "destructive", title: "خطأ", description: error });
      return;
    }
    setChallenges(await ws.getChallenges());
    setNewChallengeName("");
    setNewChallengeDays("");
    toast({ title: "تم إضافة التحدي 🎯" });
  };

  const removeChallenge = async (id: string) => {
    await ws.deleteChallenge(id);
    setChallenges(await ws.getChallenges());
  };

  // ── Events ────────────────────────────────────────────────────────────────
  const addEvent = async () => {
    if (!newEventTitle || !newEventDate) return;
    const { error } = await addFamilyEvent({
      familyId: user.familyId,
      title: newEventTitle,
      description: newEventDesc,
      eventDate: new Date(newEventDate).toISOString(),
      eventType: newEventType as any,
      createdBy: user.id,
    });
    if (error) {
      toast({ variant: "destructive", title: "خطأ", description: error });
      return;
    }
    setEvents(await getFamilyEvents());
    setNewEventTitle("");
    setNewEventDesc("");
    setNewEventDate("");
    toast({ title: "تمت إضافة الحدث 📅" });
  };

  const removeEvent = async (id: string) => {
    await deleteFamilyEvent(id);
    setEvents(await getFamilyEvents());
  };

  // ── Claims ────────────────────────────────────────────────────────────────
  const handleClaim = async (claimId: string, approved: boolean) => {
    const { error } = await reviewRewardClaim(
      claimId,
      approved ? "approved" : "rejected",
    );
    if (error) {
      toast({ variant: "destructive", title: "خطأ", description: error });
      return;
    }
    setClaims((prev) => prev.filter((c) => c.id !== claimId));
    toast({ title: approved ? "تمت الموافقة ✅" : "تم الرفض ❌" });
  };

  // ── Feedback ──────────────────────────────────────────────────────────────
  const handleMarkReviewed = async (id: string) => {
    await markFeedbackReviewed(id);
    setFeedbackList((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: "reviewed" as const } : f,
      ),
    );
  };

  const openFeedbackCount = feedbackList.filter(
    (f) => f.status === "open",
  ).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="h-6 w-6" /> لوحة الإدارة
      </h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-1">
            <TabsTrigger value="members">الأعضاء</TabsTrigger>
            <TabsTrigger value="rewards">المكافآت</TabsTrigger>
            <TabsTrigger value="challenges">التحديات</TabsTrigger>
          </TabsList>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="events" className="gap-1">
              <Calendar className="h-3 w-3" />
              الأحداث
            </TabsTrigger>
            <TabsTrigger value="claims" className="gap-1">
              <Gift className="h-3 w-3" />
              الطلبات
              {claims.length > 0 && (
                <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[10px] mr-1 bg-destructive">
                  {claims.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-1">
              <MessageSquare className="h-3 w-3" />
              ملاحظات
              {openFeedbackCount > 0 && (
                <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[10px] mr-1 bg-destructive">
                  {openFeedbackCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Members ── */}
          <TabsContent value="members" className="space-y-4 mt-4">
            {members.map((m) => (
              <Card key={m.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{m.avatar}</span>
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {m.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <Badge>{m.role === "admin" ? "مسؤول" : "عضو"}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {memberPoints[m.id] || 0} نقطة
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ── Rewards ── */}
          <TabsContent value="rewards" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="اسم المكافأة"
                    value={newRewardName}
                    onChange={(e) => setNewRewardName(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="النقاط"
                    value={newRewardPoints}
                    onChange={(e) => setNewRewardPoints(e.target.value)}
                    className="w-24"
                    dir="ltr"
                  />
                  <Button onClick={addReward} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            {rewards.map((r) => (
              <Card key={r.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <Badge variant="outline">{r.pointsRequired} نقطة</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeReward(r.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ── Challenges ── */}
          <TabsContent value="challenges" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="اسم التحدي"
                    value={newChallengeName}
                    onChange={(e) => setNewChallengeName(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="الأيام"
                    value={newChallengeDays}
                    onChange={(e) => setNewChallengeDays(e.target.value)}
                    className="w-24"
                    dir="ltr"
                  />
                  <Button onClick={addChallenge} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            {challenges.map((c) => (
              <Card key={c.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {c.currentDays}/{c.targetDays}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeChallenge(c.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ── Events ── */}
          <TabsContent value="events" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> جدولة حدث جديد
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input
                  placeholder="عنوان الحدث"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                />
                <Textarea
                  placeholder="وصف الحدث (اختياري)"
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Input
                    type="datetime-local"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="flex-1"
                    dir="ltr"
                  />
                  <Select value={newEventType} onValueChange={setNewEventType}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">📌 عام</SelectItem>
                      <SelectItem value="prayer">🕌 صلاة</SelectItem>
                      <SelectItem value="quran">📖 قرآن</SelectItem>
                      <SelectItem value="gathering">👨‍👩‍👧 تجمّع</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addEvent} className="w-full gap-2">
                  <Plus className="h-4 w-4" /> إضافة حدث
                </Button>
              </CardContent>
            </Card>
            {events.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">
                لا توجد أحداث قادمة
              </p>
            )}
            {events.map((e) => (
              <Card key={e.id}>
                <CardContent className="pt-4 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {EVENT_TYPE_LABELS[e.eventType]} {e.title}
                    </p>
                    {e.description && (
                      <p className="text-xs text-muted-foreground">
                        {e.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(e.eventDate).toLocaleString("ar-SA")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEvent(e.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ── Reward Claims ── */}
          <TabsContent value="claims" className="space-y-4 mt-4">
            {claims.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">
                لا توجد طلبات معلّقة
              </p>
            ) : (
              claims.map((claim) => (
                <Card key={claim.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {claim.userAvatar} {claim.userName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {claim.rewardName}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {claim.pointsCost} نقطة
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="text-green-600 border-green-600"
                          onClick={() => handleClaim(claim.id, true)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="text-destructive border-destructive"
                          onClick={() => handleClaim(claim.id, false)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ── Feedback ── */}
          <TabsContent value="feedback" className="space-y-4 mt-4">
            {feedbackList.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">
                لا توجد ملاحظات
              </p>
            ) : (
              feedbackList.map((f) => (
                <Card
                  key={f.id}
                  className={f.status === "reviewed" ? "opacity-60" : ""}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            {FEEDBACK_TYPE_LABELS[f.type]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {f.userName}
                          </span>
                        </div>
                        <p className="text-sm">{f.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(f.createdAt).toLocaleDateString("ar-SA")}
                        </p>
                      </div>
                      {f.status === "open" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMarkReviewed(f.id)}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
