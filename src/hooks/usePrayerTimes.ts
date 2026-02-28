// ---------------------------------------------------------------------------
// usePrayerTimes — Task 21: Prayer Times API
// Integrates the Aladhan API (https://aladhan.com/prayer-times-api).
// Method 4 = Umm Al-Qura University, Makkah (suitable for Muslim users).
// ---------------------------------------------------------------------------

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { qk } from "@/lib/queryKeys";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PrayerTime {
  key: string;
  name: string; // Arabic name
  time: string; // "HH:MM" (24-h)
}

export interface PrayerTimesData {
  times: PrayerTime[];
  nextPrayer: PrayerTime | null;
  minutesUntilNext: number;
  hijriDate: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRAYER_KEYS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

const PRAYER_NAMES: Record<string, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

const COORDS_KEY = "noor_prayer_coords";

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function fetchPrayerTimes(
  lat: number,
  lng: number,
): Promise<PrayerTimesData> {
  const today = new Date();
  // Aladhan accepts DD-MM-YYYY or a unix timestamp
  const dateStr = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getFullYear()}`;

  const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=4`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Aladhan API error");
  const json = await res.json();

  const timings = json.data?.timings ?? {};
  const hijriDate: string = (() => {
    const h = json.data?.date?.hijri;
    if (!h) return "";
    return `${h.day} ${h.month?.ar ?? ""} ${h.year} هـ`;
  })();

  const times: PrayerTime[] = PRAYER_KEYS.map((key) => ({
    key,
    name: PRAYER_NAMES[key],
    time: timings[key] ?? "--:--",
  }));

  // Determine next prayer
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  let nextPrayer: PrayerTime | null = null;
  let minutesUntilNext = 0;

  for (const t of times) {
    const [h, m] = t.time.split(":").map(Number);
    const prayerMins = h * 60 + m;
    if (prayerMins > nowMinutes) {
      nextPrayer = t;
      minutesUntilNext = prayerMins - nowMinutes;
      break;
    }
  }

  return { times, nextPrayer, minutesUntilNext, hijriDate };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePrayerTimes() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  // Restore saved coordinates on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COORDS_KEY);
      if (saved) setCoords(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("المتصفح لا يدعم تحديد الموقع الجغرافي");
      return;
    }
    setIsRequesting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        localStorage.setItem(COORDS_KEY, JSON.stringify(c));
        setGeoError(null);
        setIsRequesting(false);
      },
      () => {
        setGeoError(
          "تعذّر تحديد موقعك — تأكد من السماح للمتصفح بالوصول إلى الموقع",
        );
        setIsRequesting(false);
      },
      { timeout: 10_000 },
    );
  };

  const clearLocation = () => {
    setCoords(null);
    localStorage.removeItem(COORDS_KEY);
  };

  const today = new Date().toISOString().split("T")[0];

  const query = useQuery<PrayerTimesData>({
    queryKey: coords
      ? qk.prayerTimes(coords.lat, coords.lng, today)
      : ["prayer-times-disabled"],
    enabled: !!coords,
    staleTime: 1000 * 60 * 60, // refresh once an hour
    retry: 1,
    queryFn: () => fetchPrayerTimes(coords!.lat, coords!.lng),
  });

  return {
    ...query,
    coords,
    geoError,
    isRequesting,
    hasLocation: !!coords,
    requestLocation,
    clearLocation,
  };
}
