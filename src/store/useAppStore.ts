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
  kidsMode: boolean;
  ramadanMode: boolean;
  darkMode: boolean;
  setLoading: (loading: boolean) => void;
  toggleKidsMode: () => void;
  toggleRamadanMode: () => void;
  toggleDarkMode: () => void;
  logout: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => {
  const darkMode = localStorage.getItem("noor_dark") === "true";
  const kidsMode = localStorage.getItem("noor_kids") === "true";
  const ramadanMode = localStorage.getItem("noor_ramadan") === "true";
  if (darkMode) document.documentElement.classList.add("dark");

  // Set up auth state listener — single source of truth for auth state
  onAuthStateChange(async (event, session) => {
    if (session) {
      set({ loading: true });
      const profile = await getCurrentUser();
      set(
        profile
          ? { user: mapProfileToUser(profile), session, loading: false }
          : { user: null, session: null, loading: false },
      );
    } else {
      set({ user: null, session: null, loading: false });
    }
  });

  return {
    user: null,
    session: null,
    loading: true,
    kidsMode,
    ramadanMode,
    darkMode,

    setLoading: (loading) => set({ loading }),

    toggleKidsMode: () =>
      set((s) => {
        const v = !s.kidsMode;
        localStorage.setItem("noor_kids", String(v));
        return { kidsMode: v };
      }),

    toggleRamadanMode: () =>
      set((s) => {
        const v = !s.ramadanMode;
        localStorage.setItem("noor_ramadan", String(v));
        return { ramadanMode: v };
      }),

    toggleDarkMode: () =>
      set((s) => {
        const v = !s.darkMode;
        localStorage.setItem("noor_dark", String(v));
        if (v) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
        return { darkMode: v };
      }),

    logout: async () => {
      set({ loading: true });
      await authSignOut();
      set({ user: null, session: null, loading: false });
    },
  };
});
