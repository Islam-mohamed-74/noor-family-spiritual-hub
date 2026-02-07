

# NOOR FAMILY – نور العائلة
### Family Worship Tracker PWA

A full Arabic-first, RTL Progressive Web App for Muslim families to track worship, build spiritual habits, and strengthen family bonding. Built with React + Vite + TypeScript + Tailwind CSS + shadcn/ui.

---

## 🏗️ Architecture & Foundation

- **RTL-first layout** with `dir="rtl"` and Arabic font (Cairo from Google Fonts)
- **Zustand** for global state management (auth, family, worship logs, settings)
- **localStorage persistence** for all mock data to simulate a real backend
- **Clean architecture**: `services/worshipService.ts` as the single data access layer over `lib/mock/mockData.ts`
- **Strong TypeScript types** for User, Family, WorshipLog, Reward, Challenge, etc.
- **Custom Islamic theme**: Emerald green (#065f46) primary, gold accent, light/dark mode support
- **PWA setup**: manifest.json + service worker for offline capability

---

## 🔐 Authentication (Mock-Based)

- **Login page** with minimalist Islamic aesthetic (geometric patterns, calligraphy touches)
- **Sign-up page** (visual only, adds to mock data)
- Mock credentials: father/mother (admin), child1/child2 (member)
- Session stored in Zustand with role-based access (admin | member)
- **Route protection** via a React wrapper component on all protected routes (`/dashboard`, `/family`, `/reports`)
- Redirect unauthenticated users to `/auth`

---

## 📊 Worship Dashboard (Main Screen)

- **5 Daily Prayers**: Checkbox grid with on-time and jama'ah indicators per prayer
- **Azkar**: Morning/Evening toggle with completion tracking
- **Quran Tracker**: Page/verse counter with daily input
- **Fasting Tracker**: Optional daily log toggle
- **Extra Worship**: Duha, Witr, Qiyam tracking
- **Private Worship Toggle**: Mark Qiyam, Sadaqa, private Duas as hidden (still earns points, invisible to family)
- Warm Arabic microcopy throughout: "تقبّل الله منك", "خطوة جميلة نحو الاستمرار"

---

## 👨‍👩‍👧‍👦 Family Hub

- **Weekly Leaderboard**: Points-based ranking with dynamic Arabic titles (فارس الفجر, بطل الأذكار, صاحب الهمة)
- **Nudge System**: Virtual motivational reminder button per family member
- **Family Progress Bar**: Aggregated daily worship completion across all members
- **Shared Quran Khatma**: Collective family reading goal with progress visualization
- **No-Shaming Policy**: No negative messaging or public display of missed worship

---

## 🎮 Gamification System

- **Points engine**: Each worship action earns defined points
- **Streak counter** with 🔥 icon for consecutive days
- **Badges & Titles**: Earned automatically based on milestones
- **Rewards Management** (admin only): Define rewards tied to point thresholds

---

## 📈 Analytics & Reports

- **Personal consistency** line chart (Recharts)
- **Weekly worship trends** bar/line chart
- **Family comparison** multi-line chart
- All charts RTL-compatible with Arabic labels

---

## 👶 Kids Mode

- Global UI toggle (stored in Zustand)
- Colorful, playful interface with larger elements, cartoon-style icons, and stars
- Simplified Arabic language
- Positive reinforcement popups: "أحسنت!", "بارك الله فيك!"
- Simple daily missions view

---

## 🌙 Ramadan Mode

- Toggle activates emerald & gold enhanced theme
- Additional trackers: Iftar, Tarawih, Qiyam, Quran Khatma
- Special Ramadan leaderboard with Ramadan-specific points

---

## 🛠️ Admin Dashboard

- Override or correct worship logs for any family member
- Manage family members (add/edit)
- Manage rewards and challenges
- Control family challenges

---

## 📱 Responsive Layout

- **Mobile**: Bottom navigation bar with key sections (Dashboard, Family, Reports, Settings)
- **Desktop**: Sidebar navigation using shadcn sidebar component
- Mobile-first design throughout

---

## 🎯 Demo Experience

- Pre-populated with 1 family, 4 members, 7 days of worship history
- Charts, leaderboards, and progress bars all populated on first launch
- App feels alive immediately — no empty states on initial load

---

## 📄 Page Structure

| Route | Description |
|---|---|
| `/auth` | Login & Sign-up |
| `/dashboard` | Personal worship tracker (main screen) |
| `/family` | Family hub, leaderboard, shared goals |
| `/reports` | Analytics & charts |
| `/settings` | Profile, Kids Mode, Ramadan Mode, theme toggles |
| `/admin` | Admin panel (admin role only) |

