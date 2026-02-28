// ---------------------------------------------------------------------------
// Hijri calendar utilities — Task 22
// Uses the built-in Intl API with islamic-umalqura calendar (supported in
// modern Chromium-based browsers and Firefox 103+).
// ---------------------------------------------------------------------------

/** Return a formatted Hijri date string in Arabic. */
export function getHijriDateAr(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

/** Return the numeric Hijri day/month/year for a given Gregorian date. */
export function getHijriParts(date: Date = new Date()): {
  day: number;
  month: number;
  year: number;
} {
  try {
    const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    const parts = fmt.formatToParts(date);
    const get = (type: string) =>
      parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
    return { day: get("day"), month: get("month"), year: get("year") };
  } catch {
    return { day: 0, month: 0, year: 0 };
  }
}

// ---------------------------------------------------------------------------
// Islamic event definitions
// ---------------------------------------------------------------------------

export interface IslamicEvent {
  id: string;
  arabicName: string;
  month: number; // Hijri month 1-12
  day: number; // Hijri day
  description: string;
  emoji: string;
  color: string; // Tailwind accent class
}

export const ISLAMIC_EVENTS: IslamicEvent[] = [
  {
    id: "ashura",
    arabicName: "يوم عاشوراء",
    month: 1,
    day: 10,
    description: "يُستحب صيام يوم عاشوراء وما قبله",
    emoji: "🤲",
    color: "bg-blue-500/10 border-blue-400",
  },
  {
    id: "isra-miraj",
    arabicName: "الإسراء والمعراج",
    month: 7,
    day: 27,
    description: "ذكرى رحلة الإسراء والمعراج المباركة",
    emoji: "🌟",
    color: "bg-purple-500/10 border-purple-400",
  },
  {
    id: "sha-ban-15",
    arabicName: "نصف شعبان",
    month: 8,
    day: 15,
    description: "ليلة النصف من شعبان — ليلة مباركة",
    emoji: "🌙",
    color: "bg-indigo-500/10 border-indigo-400",
  },
  {
    id: "ramadan",
    arabicName: "رمضان المبارك",
    month: 9,
    day: 1,
    description: "مرحباً بشهر الصيام والقيام وتلاوة القرآن",
    emoji: "🌙",
    color: "bg-amber-500/10 border-amber-400",
  },
  {
    id: "laylat-al-qadr",
    arabicName: "ليلة القدر",
    month: 9,
    day: 27,
    description: "ليلة خير من ألف شهر — أكثر من العبادة والدعاء",
    emoji: "✨",
    color: "bg-yellow-500/10 border-yellow-400",
  },
  {
    id: "eid-al-fitr",
    arabicName: "عيد الفطر المبارك 🎉",
    month: 10,
    day: 1,
    description: "كل عام وأنتم بخير بمناسبة عيد الفطر السعيد",
    emoji: "🎊",
    color: "bg-green-500/10 border-green-400",
  },
  {
    id: "arafah",
    arabicName: "يوم عرفة",
    month: 12,
    day: 9,
    description: "أفضل يوم في السنة — يُكفّر ذنوب سنتين",
    emoji: "🕋",
    color: "bg-emerald-500/10 border-emerald-400",
  },
  {
    id: "eid-al-adha",
    arabicName: "عيد الأضحى المبارك 🎉",
    month: 12,
    day: 10,
    description: "كل عام وأنتم بخير بمناسبة عيد الأضحى المبارك",
    emoji: "🐑",
    color: "bg-green-500/10 border-green-400",
  },
  {
    id: "mawlid",
    arabicName: "المولد النبوي الشريف",
    month: 3,
    day: 12,
    description: "ذكرى مولد النبي محمد ﷺ",
    emoji: "💚",
    color: "bg-teal-500/10 border-teal-400",
  },
];

// ---------------------------------------------------------------------------
// Hijri month calendar builder — Task 22 (calendar component)
// ---------------------------------------------------------------------------

export interface HijriCalendarDay {
  gregorian: Date;
  hijriDay: number;
  isToday: boolean;
  events: IslamicEvent[];
  /** ISO date string YYYY-MM-DD */
  iso: string;
}

/**
 * Returns all days of the current Hijri month as an array, each annotated
 * with its Gregorian date, whether it is today, and any Islamic events.
 *
 * Algorithm: walk backward from today to Hijri day 1, then forward until
 * the Hijri month rolls over (max 30 days per Hijri month).
 */
export function buildHijriMonth(today: Date = new Date()): {
  days: HijriCalendarDay[];
  monthName: string;
  hijriYear: number;
  firstWeekday: number; // 0 = Sunday … 6 = Saturday (for grid offset)
} {
  const {
    day: todayHijriDay,
    month: todayHijriMonth,
    year: todayHijriYear,
  } = getHijriParts(today);

  // Gregorian date of Hijri day 1 of the current month
  const monthStart = new Date(today);
  monthStart.setDate(monthStart.getDate() - todayHijriDay + 1);

  const days: HijriCalendarDay[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(monthStart);
    d.setDate(d.getDate() + i);
    const { day: hDay, month: hMonth } = getHijriParts(d);
    if (hMonth !== todayHijriMonth) break; // Hijri month ended (29-day month)
    const iso = d.toISOString().split("T")[0];
    const dayEvents = ISLAMIC_EVENTS.filter(
      (e) => e.month === hMonth && e.day === hDay,
    );
    days.push({
      gregorian: d,
      hijriDay: hDay,
      isToday: hDay === todayHijriDay,
      events: dayEvents,
      iso,
    });
  }

  // Arabic month name via Intl
  const monthName = (() => {
    try {
      return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
        month: "long",
      }).format(monthStart);
    } catch {
      return String(todayHijriMonth);
    }
  })();

  return {
    days,
    monthName,
    hijriYear: todayHijriYear,
    firstWeekday: monthStart.getDay(), // 0=Sun … 6=Sat
  };
}

/**
 * Returns Islamic events occurring within `daysAhead` days from `from`.
 * Each result includes a `daysUntil` field (0 = today).
 */
export function getUpcomingIslamicEvents(
  from: Date = new Date(),
  daysAhead: number = 7,
): Array<IslamicEvent & { daysUntil: number }> {
  const results: Array<IslamicEvent & { daysUntil: number }> = [];
  for (let i = 0; i <= daysAhead; i++) {
    const check = new Date(from);
    check.setDate(check.getDate() + i);
    const { day, month } = getHijriParts(check);
    const event = ISLAMIC_EVENTS.find(
      (e) => e.month === month && e.day === day,
    );
    if (event) results.push({ ...event, daysUntil: i });
  }
  return results;
}
