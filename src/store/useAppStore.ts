import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { User } from "@/types";
import {
  getCurrentUser,
  signOut as authSignOut,
  onAuthStateChange,
  mapProfileToUser,
} from "@/services/authService";

interface AppState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  kidsMode: boolean;
  ramadanMode: boolean;
  darkMode: boolean;
  setLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  toggleKidsMode: () => void;
  toggleRamadanMode: () => void;
  toggleDarkMode: () => void;
  logout: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => {
  const isClient = typeof window !== "undefined";
  const darkMode = isClient
    ? localStorage.getItem("noor_dark") === "true"
    : false;
  const kidsMode = isClient
    ? localStorage.getItem("noor_kids") === "true"
    : false;
  const ramadanMode = isClient
    ? localStorage.getItem("noor_ramadan") === "true"
    : false;

  if (isClient) {
    if (darkMode) document.documentElement.classList.add("dark");
    if (ramadanMode) document.documentElement.classList.add("ramadan");
    if (kidsMode) document.documentElement.classList.add("kids-mode");
  }

  // Set up auth state listener — single source of truth for auth state
  onAuthStateChange(async (event, session) => {
    if (session) {
      // If the user is already loaded, skip re-fetch for token refresh / tab focus
      // to avoid flashing a loading screen on every Alt+Tab.
      const { user: currentUser } = get();
      if (
        currentUser &&
        (event === "TOKEN_REFRESHED" || event === "SIGNED_IN")
      ) {
        set({ session, initialized: true });
        return;
      }

      set({ loading: true });
      const profile = await getCurrentUser();
      set(
        profile
          ? { user: mapProfileToUser(profile), session, loading: false, initialized: true }
          : { user: null, session: null, loading: false, initialized: true },
      );
    } else {
      set({ user: null, session: null, loading: false, initialized: true });
    }
  });

  return {
    user: null,
    session: null,
    loading: true,
    initialized: false,
    kidsMode,
    ramadanMode,
    darkMode,

    setLoading: (loading) => set({ loading }),

    setUser: (user) => set({ user }),

    refreshUser: async () => {
      const profile = await getCurrentUser();
      if (profile) set({ user: mapProfileToUser(profile) });
    },

    toggleKidsMode: () =>
      set((s) => {
        const v = !s.kidsMode;
        if (typeof window !== "undefined") {
          localStorage.setItem("noor_kids", String(v));
          if (v) document.documentElement.classList.add("kids-mode");
          else document.documentElement.classList.remove("kids-mode");
        }
        return { kidsMode: v };
      }),

    toggleRamadanMode: () =>
      set((s) => {
        const v = !s.ramadanMode;
        if (typeof window !== "undefined") {
          localStorage.setItem("noor_ramadan", String(v));
          if (v) document.documentElement.classList.add("ramadan");
          else document.documentElement.classList.remove("ramadan");
        }
        return { ramadanMode: v };
      }),

    toggleDarkMode: () =>
      set((s) => {
        const v = !s.darkMode;
        if (typeof window !== "undefined") {
          localStorage.setItem("noor_dark", String(v));
          if (v) document.documentElement.classList.add("dark");
          else document.documentElement.classList.remove("dark");
        }
        return { darkMode: v };
      }),

    logout: async () => {
      set({ loading: true });
      await authSignOut();
      set({ user: null, session: null, loading: false });
    },
  };
});
