"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { qk } from "@/lib/queryKeys";
import * as ws from "@/services/worshipServiceSupabase";
import { getLogsByUser } from "@/services/worship/logsService";
import {
  calculateDayPoints,
  calculateTotalPoints,
} from "@/services/worship/pointsService";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();

  const rewardForm = useForm({
    defaultValues: { name: "", points: "" },
  });
  const challengeForm = useForm({
    defaultValues: { name: "", days: "" },
  });
  const eventForm = useForm({
    defaultValues: {
      title: "",
      description: "",
      date: "",
      type: "general",
    },
  });

  const { data, isLoading: loading } = useQuery({
    queryKey: qk.adminPage(user?.id ?? ""),
    queryFn: async () => {
      const [m, r, c, ev, cl, fb] = await Promise.all([
        ws.getFamilyMembers(),
        ws.getRewards(),
        ws.getChallenges(),
        getFamilyEvents(),
        getFamilyRewardClaims("pending"),
        getFamilyFeedback(),
      ]);

      const logsPerMember = await Promise.all(
        m.map((mem) => getLogsByUser(mem.id)),
      );
      const pts: Record<string, number> = {};
      m.forEach((mem, i) => {
        pts[mem.id] = calculateTotalPoints(logsPerMember[i]);
      });
      return {
        members: m,
        rewards: r,
        challenges: c,
        events: ev,
        claims: cl,
        feedbackList: fb,
        memberPoints: pts,
      };
    },
    enabled: !!user,
  });

  const members = data?.members ?? [];
  const rewards = data?.rewards ?? [];
  const challenges = data?.challenges ?? [];
  const events = data?.events ?? [];
  const claims = data?.claims ?? [];
  const feedbackList = data?.feedbackList ?? [];
  const memberPoints = data?.memberPoints ?? {};

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: qk.adminPage(user?.id ?? "") });

  // Mutations
  const addRewardMutation = useMutation({
    mutationFn: (newReward: any) => ws.addReward(newReward),
    onSuccess: () => {
      invalidate();
      rewardForm.reset();
      toast({ title: "تمت إضافة المكافأة ✨" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });

  const deleteRewardMutation = useMutation({
    mutationFn: (id: string) => ws.deleteReward(id),
    onSuccess: () => invalidate(),
  });

  const addChallengeMutation = useMutation({
    mutationFn: (newChallenge: any) => ws.addChallenge(newChallenge),
    onSuccess: () => {
      invalidate();
      challengeForm.reset();
      toast({ title: "تم إضافة التحدي 🎯" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });

  const deleteChallengeMutation = useMutation({
    mutationFn: (id: string) => ws.deleteChallenge(id),
    onSuccess: () => invalidate(),
  });

  const addEventMutation = useMutation({
    mutationFn: (newEvent: any) => addFamilyEvent(newEvent),
    onSuccess: () => {
      invalidate();
      eventForm.reset();
      toast({ title: "تمت إضافة الحدث 📅" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => deleteFamilyEvent(id),
    onSuccess: () => invalidate(),
  });

  const reviewClaimMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) =>
      reviewRewardClaim(id, status),
    onSuccess: (_, variables) => {
      invalidate();
      toast({
        title:
          variables.status === "approved" ? "تمت الموافقة ✅" : "تم الرفض ❌",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });

  const markReviewedMutation = useMutation({
    mutationFn: (id: string) => markFeedbackReviewed(id),
    onSuccess: () => invalidate(),
  });

  if (!user || user.role !== "admin") return null;

  const onAddReward = (values: any) => {
    addRewardMutation.mutate({
      name: values.name,
      description: "",
      pointsRequired: parseInt(values.points),
      familyId: user.familyId,
      createdBy: user.id,
    });
  };

  const removeReward = async (id: string) => {
    deleteRewardMutation.mutate(id);
  };

  const onAddChallenge = (values: any) => {
    addChallengeMutation.mutate({
      name: values.name,
      description: "",
      targetDays: parseInt(values.days),
      currentDays: 0,
      familyId: user.familyId,
      active: true,
    });
  };

  const removeChallenge = async (id: string) => {
    deleteChallengeMutation.mutate(id);
  };

  const onAddEvent = (values: any) => {
    addEventMutation.mutate({
      familyId: user.familyId,
      title: values.title,
      description: values.description,
      eventDate: new Date(values.date).toISOString(),
      eventType: values.type as any,
      createdBy: user.id,
    });
  };

  const removeEvent = async (id: string) => {
    deleteEventMutation.mutate(id);
  };

  const handleClaim = async (claimId: string, approved: boolean) => {
    reviewClaimMutation.mutate({
      id: claimId,
      status: approved ? "approved" : "rejected",
    });
  };

  const handleMarkReviewed = async (id: string) => {
    markReviewedMutation.mutate(id);
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

          <TabsContent value="rewards" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">إضافة مكافأة جديدة</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...rewardForm}>
                  <form
                    onSubmit={rewardForm.handleSubmit(onAddReward)}
                    className="space-y-3"
                  >
                    <FormField
                      control={rewardForm.control}
                      name="name"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="اسم المكافأة" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={rewardForm.control}
                      name="points"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="النقاط المطلوبة"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={addRewardMutation.isPending}
                    >
                      <Plus className="h-4 w-4" /> إضافة
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {rewards.map((r) => (
                <Card key={r.id}>
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {r.pointsRequired} نقطة
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeReward(r.id)}
                      disabled={deleteRewardMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="challenges" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">إضافة تحدي جديد</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...challengeForm}>
                  <form
                    onSubmit={challengeForm.handleSubmit(onAddChallenge)}
                    className="space-y-3"
                  >
                    <FormField
                      control={challengeForm.control}
                      name="name"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="اسم التحدي" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={challengeForm.control}
                      name="days"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="عدد الأيام"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={addChallengeMutation.isPending}
                    >
                      <Plus className="h-4 w-4" /> إضافة
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {challenges.map((c) => (
                <Card key={c.id}>
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.targetDays} يوم
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeChallenge(c.id)}
                      disabled={deleteChallengeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">إضافة حدث عائلي</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...eventForm}>
                  <form
                    onSubmit={eventForm.handleSubmit(onAddEvent)}
                    className="space-y-3"
                  >
                    <FormField
                      control={eventForm.control}
                      name="title"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="عنوان الحدث" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={eventForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="نوع الحدث" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(EVENT_TYPE_LABELS).map(
                                ([k, v]) => (
                                  <SelectItem key={k} value={k}>
                                    {v}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={eventForm.control}
                      name="date"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={eventForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="تفاصيل إضافية (اختياري)"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={addEventMutation.isPending}
                    >
                      <Calendar className="h-4 w-4" /> إضافة الحدث
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {events.map((e) => (
                <Card key={e.id}>
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.eventDate).toLocaleDateString("ar-SA", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-8 w-8"
                      onClick={() => removeEvent(e.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="claims" className="space-y-4 mt-4">
            {claims.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground italic text-sm">
                لا توجد طلبات مكافأة معلقة
              </div>
            ) : (
              claims.map((c) => (
                <Card key={c.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎁</span>
                        <div>
                          <p className="font-bold text-sm">
                            {(c as any).reward?.title || "مكافأة"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            طلب من: {(c as any).user?.name}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => handleClaim(c.id, true)}
                      >
                        <CheckCircle2 className="h-4 w-4" /> موافقة
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1 text-destructive"
                        onClick={() => handleClaim(c.id, false)}
                      >
                        <XCircle className="h-4 w-4" /> رفض
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4 mt-4">
            {feedbackList.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground italic text-sm">
                لا توجد ملاحظات
              </div>
            ) : (
              feedbackList.map((f) => (
                <Card
                  key={f.id}
                  className={
                    f.status === "open" ? "border-primary/50" : "opacity-60"
                  }
                >
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        {FEEDBACK_TYPE_LABELS[f.type] || f.type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(f.createdAt).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                    <p className="text-sm font-medium">"{f.message}"</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="text-base">
                          {(f as any).user?.avatar}
                        </span>
                        {(f as any).user?.name}
                      </span>
                      {f.status === "open" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleMarkReviewed(f.id)}
                        >
                          <Check className="h-3 w-3" /> تم الاطلاع
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
