# Noor Family — Agent Implementation Plan

## Complete the remaining 14 features across 3 phases

---

## IMPORTANT: Read this first

**Repository**: `C:\Users\Islam\noor-family`  
**Stack**: React 18 + TypeScript + Vite + Supabase + TanStack Query v5 + Zustand + Tailwind + shadcn/ui  
**Direction**: RTL (Arabic). All UI text must be Arabic. All files are TypeScript strict.  
**Build must pass**: Run `npx tsc --noEmit --skipLibCheck` after every phase. Zero errors allowed.  
**Do NOT**: Create new markdown files, rename existing services, break existing exports.

### Key architecture facts

- `src/services/worshipServiceSupabase.ts` is a **barrel re-export** of `src/services/index.ts`. Both are equivalent.
- All Supabase queries use `src/lib/supabase.ts` — import `{ supabase }` from there.
- Global state is Zustand store at `src/store/useAppStore.ts`. Get current user with `useAppStore(s => s.user)`.
- Query keys are centralized in `src/lib/queryKeys.ts` in the `qk` object. Add new keys there.
- All services follow the pattern: `async function foo(): Promise<{ error?: string }>`.
- shadcn/ui components are in `src/components/ui/`. Already installed: all accordion, dialog, tabs, badge, card, button, input, select, textarea, progress, skeleton, switch, popover, sheet, label, checkbox, separator, scroll-area, tooltip, avatar.

---

## PHASE 4 — Core Gaps (High Priority)

### Task 4-A: Challenge Auto-Progress

**Problem**: When a user saves their worship log, their progress in active challenges is never incremented. `progress` stays at 0 forever.

**Files to edit**:

1. `src/services/social/challengeParticipantsService.ts` — add a new exported function
2. `src/hooks/useWorshipLog.ts` — call it inside the mutation

**Step 1** — Add `incrementMyActiveChallenges()` to `src/services/social/challengeParticipantsService.ts`:

```typescript
/**
 * Increments the progress of all active (non-completed) challenge participants
 * for the current user by 1, and marks any that have reached targetDays as completed.
 * Call this once per day when a worship log is saved.
 */
export async function incrementMyActiveChallenges(): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch participant rows for current user that are not yet completed
    const { data: parts } = await supabase
      .from("challenge_participants")
      .select(
        "id, challenge_id, progress, challenges!challenge_participants_challenge_id_fkey(target_days)",
      )
      .eq("user_id", user.id)
      .is("completed_at", null);

    if (!parts || parts.length === 0) return;

    await Promise.all(
      parts.map(async (p: any) => {
        const targetDays: number = p.challenges?.target_days ?? 999;
        const newProgress = (p.progress ?? 0) + 1;
        const isComplete = newProgress >= targetDays;
        await supabase
          .from("challenge_participants")
          .update({
            progress: newProgress,
            ...(isComplete ? { completed_at: new Date().toISOString() } : {}),
          })
          .eq("id", p.id);
      }),
    );
  } catch {
    // silent — non-critical
  }
}
```

**Step 2** — In `src/hooks/useWorshipLog.ts`, inside `useSaveWorshipLog`, import `incrementMyActiveChallenges` and call it in the `mutationFn` after `saveLog(updated)`:

```typescript
// At top of file, add:
import { incrementMyActiveChallenges } from "@/services/social/challengeParticipantsService";

// Inside mutationFn, after await saveLog(updated):
await incrementMyActiveChallenges();
```

**Also add** `logActivity` call in the same `mutationFn` to record to the family feed when any prayer is completed. Import from `@/services/social/activityService`:

```typescript
import { logActivity } from "@/services/social/activityService";

// Inside mutationFn, after saveLog, if at least one prayer completed:
const prayersCompleted = updated.prayers.filter((p) => p.completed).length;
if (prayersCompleted > 0) {
  await logActivity({
    activityType: "prayer",
    description: `صلّى ${prayersCompleted} من 5 صلوات`,
    pointsEarned: 0, // points shown elsewhere
  }).catch(() => {});
}
```

---

### Task 4-B: Admin — Reward Claim Approval Panel

**Problem**: `getFamilyRewardClaims("pending")` and `reviewRewardClaim()` are already fully implemented in `src/services/social/claimService.ts`, and `AdminPage.tsx` already loads `claims` state and fetches pending claims. But there is **no UI tab** to display and approve/reject them.

**File to edit**: `src/pages/AdminPage.tsx`

**What exists already**:

- `claims` state variable (line ~72)
- `loadData` fetches `getFamilyRewardClaims("pending")` (line ~100)
- Imports: `getFamilyRewardClaims`, `reviewRewardClaim`, `CheckCircle2`, `XCircle` are already imported

**What to add**: A new tab "طلبات المكافآت" in the `<Tabs>` component. Find the existing `<TabsList>` in `AdminPage.tsx` (it has tabs for members, rewards, challenges, events, feedback). Add a new tab trigger and content:

**Tab trigger to add** (inside existing `<TabsList>`):

```tsx
<TabsTrigger value="claims" className="gap-1">
  <Gift className="h-4 w-4" />
  الطلبات
  {claims.length > 0 && (
    <Badge className="h-4 w-4 p-0 text-[10px] flex items-center justify-center bg-destructive">
      {claims.length}
    </Badge>
  )}
</TabsTrigger>
```

**Tab content to add** (after the existing feedback TabsContent):

```tsx
<TabsContent value="claims" className="space-y-3 mt-4">
  {claims.length === 0 ? (
    <p className="text-center text-muted-foreground text-sm py-8">
      لا توجد طلبات معلّقة
    </p>
  ) : (
    claims.map((claim) => (
      <Card key={claim.id}>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="font-medium">{claim.rewardName ?? "مكافأة"}</p>
              <p className="text-sm text-muted-foreground">
                {claim.userName ?? "عضو"} {claim.userAvatar ?? "👤"}
              </p>
              <Badge variant="outline" className="text-xs">
                {claim.pointsCost} نقطة
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                className="gap-1"
                onClick={async () => {
                  const { error } = await reviewRewardClaim(
                    claim.id,
                    "approved",
                  );
                  if (error) {
                    toast({
                      variant: "destructive",
                      title: "خطأ",
                      description: error,
                    });
                  } else {
                    toast({ title: "تمت الموافقة ✅" });
                    loadData();
                  }
                }}
              >
                <CheckCircle2 className="h-4 w-4" /> موافقة
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="gap-1"
                onClick={async () => {
                  const { error } = await reviewRewardClaim(
                    claim.id,
                    "rejected",
                  );
                  if (error) {
                    toast({
                      variant: "destructive",
                      title: "خطأ",
                      description: error,
                    });
                  } else {
                    toast({ title: "تم الرفض" });
                    loadData();
                  }
                }}
              >
                <XCircle className="h-4 w-4" /> رفض
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    ))
  )}
</TabsContent>
```

---

### Task 4-C: Rawatib (Sunnah Prayers) Tracking

**Problem**: The schema has `duha` and `witr` but no per-prayer rawatib (Sunnah rakaat before/after each fard prayer).

**Rawatib definition** (standard Sunnah mu'akkadah):

- Fajr: 2 before
- Dhuhr: 4 before, 2 after
- Maghrib: 2 after
- Isha: 2 after
- (Asr and Witr handled separately)

**Step 1** — Update `src/types/index.ts`. In the `PrayerLog` interface, add:

```typescript
rawatib?: boolean; // completed the sunnah rakaat for this prayer
```

**Step 2** — Update `src/services/worship/logsService.ts`. In `mapSupabaseLogToWorshipLog`, the `prayers` field is stored as JSONB — rawatib will persist automatically since it's inside the prayers array JSON. No DB migration needed.

**Step 3** — Update `src/services/worship/pointsService.ts`. In `calculateDayPoints`, add inside the `forEach`:

```typescript
if (p.rawatib) pts += 5; // add POINTS.rawatib = 5
```

Also add `rawatib: 5` to the `POINTS` constant in `src/types/index.ts`.

**Step 4** — Update `src/pages/DashboardPage.tsx`. In `updatePrayer`, the `keyof PrayerLog` already accepts `rawatib` since we added it to the type. In the prayer row UI, add a "السنة" button alongside "في وقتها" and "جماعة", but only show it for prayers that have rawatib (fajr, dhuhr, maghrib, isha):

```typescript
const RAWATIB_PRAYERS: PrayerName[] = ["fajr", "dhuhr", "maghrib", "isha"];

// Inside the prayer row, alongside the existing buttons:
{prayer.completed && RAWATIB_PRAYERS.includes(prayer.name) && (
  <button
    onClick={() => updatePrayer(prayer.name, "rawatib", !prayer.rawatib)}
    className={`text-xs px-2 py-1 rounded-full border transition-colors ${prayer.rawatib ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
  >
    السنة
  </button>
)}
```

---

### Task 4-D: Family Events UI in FamilyPage

**Problem**: `getFamilyEvents()`, `addFamilyEvent()`, `deleteFamilyEvent()` are fully implemented in `src/services/social/eventService.ts`. `AdminPage.tsx` already has full CRUD UI for events. But `FamilyPage.tsx` only uses a local `events` state that is fetched but **never displayed in a meaningful way** for members — they can't see or browse upcoming family events in the family view.

**File to edit**: `src/pages/FamilyPage.tsx`

**What exists**: `events` state is fetched via `getFamilyEvents()` in `loadData`. The `EVENT_ICONS` map exists. There is no card rendering them.

**What to add**: Find the section in `FamilyPage.tsx` where shared khatma or challenges are rendered and add an "Upcoming Events" card before the FamilyFeed:

```tsx
{
  /* Family Events */
}
{
  events.length > 0 && (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          المناسبات القادمة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {events
          .filter(
            (e) => new Date(e.eventDate) >= new Date(Date.now() - 86400000),
          )
          .slice(0, 5)
          .map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-secondary"
            >
              <span className="text-xl">
                {EVENT_ICONS[ev.eventType] ?? "📌"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{ev.title}</p>
                {ev.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {ev.description}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(ev.eventDate).toLocaleDateString("ar-SA", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
```

---

## PHASE 5 — Polish & Completeness (Medium Priority)

### Task 5-A: Quran Surah/Juz Selector

**Problem**: Quran progress is only a page number counter. Users want to optionally record which Surah or Juz they read.

**Step 1** — Add to `WorshipLog` in `src/types/index.ts`:

```typescript
quranSurahNote?: string; // free-text e.g. "سورة البقرة الجزء الأول"
```

**Step 2** — Update `mapSupabaseLogToWorshipLog` and `mapWorshipLogToSupabase` in `src/services/worship/logsService.ts`:

```typescript
// in mapSupabaseLogToWorshipLog:
quranSurahNote: data.quran_surah_note ?? "",

// in mapWorshipLogToSupabase:
quran_surah_note: log.quranSurahNote ?? null,
```

**Step 3** — Run this SQL in Supabase dashboard:

```sql
ALTER TABLE worship_logs ADD COLUMN IF NOT EXISTS quran_surah_note TEXT;
```

**Step 4** — In `src/pages/DashboardPage.tsx`, find the Quran section (it has `quranPages` input). Add beneath the page input:

```tsx
{
  log.quranPages > 0 && (
    <Input
      dir="rtl"
      placeholder="ملاحظة اختيارية: السورة أو الجزء..."
      value={log.quranSurahNote ?? ""}
      onChange={(e) => updateLog({ quranSurahNote: e.target.value })}
      className="mt-2 text-sm"
    />
  );
}
```

---

### Task 5-B: Fasting Type (Mandatory vs Sunnah)

**Problem**: `fasting` is a single boolean. No distinction between Ramadan fard fasting and Sunnah fasting (Monday/Thursday, Ayyam al-Beed, etc.).

**Step 1** — Add to `WorshipLog` type:

```typescript
fastingType?: "fard" | "sunnah"; // only meaningful when fasting === true
```

**Step 2** — Add `POINTS.fastingSunnah = 10` to the POINTS constant (currently `fasting: 15` is for fard/Ramadan).

**Step 3** — Update `calculateDayPoints` in `src/services/worship/pointsService.ts`:

```typescript
if (log.fasting) {
  pts += log.fastingType === "sunnah" ? POINTS.fastingSunnah : POINTS.fasting;
}
```

**Step 4** — Update log mappers in `logsService.ts`:

```typescript
// mapSupabaseLogToWorshipLog:
fastingType: data.fasting_type ?? undefined,
// mapWorshipLogToSupabase:
fasting_type: log.fastingType ?? null,
```

**Step 5** — Run SQL:

```sql
ALTER TABLE worship_logs ADD COLUMN IF NOT EXISTS fasting_type TEXT CHECK (fasting_type IN ('fard', 'sunnah'));
```

**Step 6** — In `DashboardPage.tsx`, find the fasting Switch. When `log.fasting` is true, show two small toggle buttons: "فرض" and "سنة":

```tsx
{
  log.fasting && (
    <div className="flex gap-2 mt-2">
      {(["fard", "sunnah"] as const).map((t) => (
        <button
          key={t}
          onClick={() => updateLog({ fastingType: t })}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            log.fastingType === t
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          }`}
        >
          {t === "fard" ? "فرض" : "سنة / نافلة"}
        </button>
      ))}
    </div>
  );
}
```

---

### Task 5-C: Ramadan Mode — Special Theme

**Problem**: `ramadanMode` toggle exists and conditionally shows Tarawih/Iftar sections, but there is no visual theme change.

**File to edit**: `src/store/useAppStore.ts` and `src/index.css`.

**Step 1** — In `useAppStore.ts`, in `toggleRamadanMode`, toggle a CSS class on `document.documentElement`:

```typescript
toggleRamadanMode: () =>
  set((s) => {
    const v = !s.ramadanMode;
    localStorage.setItem("noor_ramadan", String(v));
    if (v) {
      document.documentElement.classList.add("ramadan");
    } else {
      document.documentElement.classList.remove("ramadan");
    }
    return { ramadanMode: v };
  }),
```

Also on init (before the `return` in the store creator), apply if previously set:

```typescript
if (ramadanMode) document.documentElement.classList.add("ramadan");
```

**Step 2** — In `src/index.css`, add a Ramadan CSS layer that overrides the primary color to deep blue/gold:

```css
/* Ramadan mode — deep blue/gold palette */
.ramadan {
  --primary: 220 70% 35%;
  --primary-foreground: 45 80% 90%;
  --accent: 43 80% 55%;
  --accent-foreground: 220 70% 10%;
}

.ramadan .islamic-pattern {
  background-image:
    radial-gradient(
      circle at 20% 50%,
      hsl(220 70% 35% / 0.08) 0%,
      transparent 60%
    ),
    radial-gradient(
      circle at 80% 20%,
      hsl(43 80% 55% / 0.08) 0%,
      transparent 60%
    );
}
```

---

### Task 5-D: Kids Mode — Visual Theme

**Problem**: `kidsMode` enlarges fonts and uses encouraging messages but has no visual distinction (colors, stars).

**Files to edit**: `src/index.css` and `src/store/useAppStore.ts` (same pattern as Ramadan).

**Step 1** — In `useAppStore.ts`, `toggleKidsMode`:

```typescript
toggleKidsMode: () =>
  set((s) => {
    const v = !s.kidsMode;
    localStorage.setItem("noor_kids", String(v));
    if (v) document.documentElement.classList.add("kids");
    else document.documentElement.classList.remove("kids");
    return { kidsMode: v };
  }),
```

Also apply on init:

```typescript
if (kidsMode) document.documentElement.classList.add("kids");
```

**Step 2** — In `src/index.css`:

```css
/* Kids mode — bright green/yellow cheerful palette */
.kids {
  --primary: 142 70% 35%;
  --accent: 48 96% 53%;
  --radius: 1rem; /* rounder corners */
}

.kids .card {
  border-width: 2px;
}
```

---

### Task 5-E: Expand Hadith Content Database

**File to edit**: `src/lib/hadith.ts`

Read the current file. The `getCompletionTip()` function returns a message based on activity type. Expand each category to have at least **10 messages** per type. Keep them short (1 sentence), in Arabic, motivational and Islamic. Types: `"prayer"`, `"azkar"`, `"quran"`, `"fasting"`, `"general"`.

Example prayers array expansion:

```typescript
prayer: [
  "أقيموا الصلاة، إن الصلاة كانت على المؤمنين كتاباً موقوتاً 🕌",
  "الصلاة نور — بارك الله فيك على محافظتك عليها ✨",
  "من حافظ على الصلاة كانت له نوراً وبرهاناً ونجاةً يوم القيامة 🌟",
  "ما شاء الله! الصلاة في وقتها أحب الأعمال إلى الله 💚",
  "جعل الله صلاتك قرة عين لك في الدنيا والآخرة 🤲",
  "من صلى الفجر في جماعة فكأنما قام الليل كله 🌅",
  "الصلاة تنهى عن الفحشاء والمنكر — استمر على هذا الطريق 🛤️",
  "بارك الله في يومك! الصلاة خير موضوع 🌙",
  "أحسنت! الصلاةُ عمادُ الدين 🏛️",
  "تقبّل الله صلاتك وجعلها في ميزان حسناتك ⚖️",
],
```

---

### Task 5-F: My Reward Claims History in FamilyPage

**Problem**: Members can click "استبدال" to claim a reward, but they can never see the status of their pending/approved/rejected claims.

**Step 1** — Add a query hook. Create `src/hooks/useMyRewardClaims.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { getMyRewardClaims } from "@/services/social/claimService";
import { RewardClaim } from "@/types";

export function useMyRewardClaims() {
  const user = useAppStore((s) => s.user);
  return useQuery<RewardClaim[]>({
    queryKey: ["social", "my-claims", user?.id ?? ""],
    enabled: !!user,
    staleTime: 1000 * 30,
    queryFn: () => getMyRewardClaims(),
  });
}
```

**Step 2** — In `src/pages/FamilyPage.tsx`, import `useMyRewardClaims` and add a "My Claims" section below the rewards list. Show each claim with a colored badge for status:

- `pending` → yellow badge "معلّق ⏳"
- `approved` → green badge "موافق عليه ✅"
- `rejected` → red badge "مرفوض ❌"

---

## PHASE 6 — Architecture & Performance

### Task 6-A: Code Splitting (Lazy Loading)

**File to edit**: `src/App.tsx`

Replace all direct page imports with `React.lazy` + `Suspense`:

```tsx
import { lazy, Suspense } from "react";

const AuthPage = lazy(() => import("./pages/AuthPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const FamilyPage = lazy(() => import("./pages/FamilyPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const FamilySetupPage = lazy(() => import("./pages/FamilySetupPage"));
const JoinPage = lazy(() => import("./pages/JoinPage"));
const InvitePage = lazy(() => import("./pages/InvitePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
```

Wrap `<Routes>` with:

```tsx
<Suspense
  fallback={
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-3xl">🌙</div>
    </div>
  }
>
  <Routes>{/* existing routes unchanged */}</Routes>
</Suspense>
```

---

### Task 6-B: Global Error Boundary

**Create new file**: `src/components/ErrorBoundary.tsx`

```tsx
import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center justify-center min-h-screen p-4"
          dir="rtl"
        >
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 space-y-4 text-center">
              <div className="text-5xl">⚠️</div>
              <h2 className="text-xl font-bold">حدث خطأ غير متوقع</h2>
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message ?? "حاول تحديث الصفحة"}
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                تحديث الصفحة
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Edit `src/main.tsx`**: Wrap `<App />` with `<ErrorBoundary>`:

```tsx
import { ErrorBoundary } from "./components/ErrorBoundary";
// ...
root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
```

---

### Task 6-C: QueryClient Error Config

**File to edit**: `src/App.tsx`

Replace:

```tsx
const queryClient = new QueryClient();
```

With:

```tsx
import { toast } from "@/hooks/use-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
    mutations: {
      onError: (error: unknown) => {
        const msg = error instanceof Error ? error.message : "حدث خطأ";
        toast({ variant: "destructive", title: "خطأ", description: msg });
      },
    },
  },
});
```

---

### Task 6-D: Fix package.json name

**File to edit**: `package.json`

Change line 2:

```json
"name": "noor-family",
```

---

### Task 6-E: Performance — Aggregate Stats in DB

**Problem**: `getTotalPoints(userId)` loads ALL worship logs and sums them in JS. Same for `getStreak`. This is O(n) on every render.

**Step 1** — Run in Supabase SQL editor:

```sql
-- Add cached stats columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0;

-- Create function to update user stats after worship_log insert/update
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_total INTEGER;
  v_streak INTEGER;
  v_date DATE;
  v_expected DATE;
BEGIN
  -- Recalculate total points (simplified — sum quran_pages * 3 + fasting * 15 etc)
  -- The actual point calc happens in JS; this stores the last JS-computed value
  -- So we skip the trigger approach and instead update from the app after save.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Step 2** — In `src/services/worship/logsService.ts`, add a function that persists computed stats back to DB after a save:

```typescript
export async function persistUserStats(
  userId: string,
  totalPoints: number,
  streak: number,
): Promise<void> {
  await supabase
    .from("users")
    .update({ total_points: totalPoints, current_streak: streak })
    .eq("id", userId);
}
```

**Step 3** — In `src/hooks/useWorshipLog.ts`, in `useSaveWorshipLog.onSuccess`, after setting query data, call:

```typescript
import { persistUserStats } from "@/services/worship/logsService";

// in onSuccess:
persistUserStats(user!.id, totalPoints, streak).catch(() => {});
```

**Step 4** — In `src/services/worship/pointsService.ts`, add a fast-path getter that reads from the `users` table instead of aggregating:

```typescript
export async function getTotalPointsFast(userId: string): Promise<number> {
  const { data } = await supabase
    .from("users")
    .select("total_points")
    .eq("id", userId)
    .single();
  return data?.total_points ?? 0;
}

export async function getStreakFast(userId: string): Promise<number> {
  const { data } = await supabase
    .from("users")
    .select("current_streak")
    .eq("id", userId)
    .single();
  return data?.current_streak ?? 0;
}
```

**Step 5** — In `src/hooks/useLeaderboard.ts` and `src/hooks/useWeeklyReport.ts`, switch the per-member points/streak calls to `getTotalPointsFast` / `getStreakFast` where appropriate (check what functions are currently called, then swap them).

---

## Verification Checklist (run after all phases)

After completing all tasks, run these checks:

```bash
# 1. TypeScript — must exit 0
npx tsc --noEmit --skipLibCheck

# 2. Build — must succeed
npm run build

# 3. Manual test in browser
# - Create new family, invite link + QR shows
# - Save worship log → challenge progress increments
# - Admin tab "الطلبات" shows pending reward claims with approve/reject
# - Prayer rawatib button shows only for fajr/dhuhr/maghrib/isha
# - Ramadan mode → page color shifts to blue/gold
# - Kids mode → page color shifts to green/yellow, rounder corners
# - Family page shows upcoming events card
# - Error boundary: window open, then throw in DevTools console — error card appears
```

---

## File Summary — All files to create or edit

| File                                                  | Action                                                                               | Task               |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------ |
| `src/services/social/challengeParticipantsService.ts` | Edit — add `incrementMyActiveChallenges()`                                           | 4-A                |
| `src/hooks/useWorshipLog.ts`                          | Edit — call increment + logActivity in mutationFn                                    | 4-A                |
| `src/pages/AdminPage.tsx`                             | Edit — add claims tab trigger + content                                              | 4-B                |
| `src/types/index.ts`                                  | Edit — add `rawatib` to PrayerLog, `POINTS.rawatib`, `fastingType`, `quranSurahNote` | 4-C, 5-A, 5-B      |
| `src/services/worship/pointsService.ts`               | Edit — rawatib + fasting type points                                                 | 4-C, 5-B           |
| `src/services/worship/logsService.ts`                 | Edit — mappers for rawatib/fastingType/quranSurahNote + persistUserStats             | 4-C, 5-A, 5-B, 6-E |
| `src/pages/DashboardPage.tsx`                         | Edit — rawatib button, fasting type toggle, optional quran note input                | 4-C, 5-A, 5-B      |
| `src/pages/FamilyPage.tsx`                            | Edit — add events card + my claims section                                           | 4-D, 5-F           |
| `src/lib/hadith.ts`                                   | Edit — expand all tip arrays to 10 items each                                        | 5-E                |
| `src/store/useAppStore.ts`                            | Edit — add class toggle for ramadan/kids modes                                       | 5-C, 5-D           |
| `src/index.css`                                       | Edit — add `.ramadan` and `.kids` CSS rules                                          | 5-C, 5-D           |
| `src/hooks/useMyRewardClaims.ts`                      | Create new                                                                           | 5-F                |
| `src/App.tsx`                                         | Edit — lazy loading + QueryClient error config                                       | 6-A, 6-C           |
| `src/components/ErrorBoundary.tsx`                    | Create new                                                                           | 6-B                |
| `src/main.tsx`                                        | Edit — wrap App in ErrorBoundary                                                     | 6-B                |
| `package.json`                                        | Edit — rename to `noor-family`                                                       | 6-D                |
| `src/services/worship/pointsService.ts`               | Edit — getTotalPointsFast + getStreakFast                                            | 6-E                |
