import { create } from 'zustand';
import { User } from '@/types';

interface AppState {
  user: User | null;
  kidsMode: boolean;
  ramadanMode: boolean;
  darkMode: boolean;
  setUser: (user: User | null) => void;
  toggleKidsMode: () => void;
  toggleRamadanMode: () => void;
  toggleDarkMode: () => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => {
  const stored = localStorage.getItem('noor_session');
  const storedUser = stored ? JSON.parse(stored) : null;
  const darkMode = localStorage.getItem('noor_dark') === 'true';
  const kidsMode = localStorage.getItem('noor_kids') === 'true';
  const ramadanMode = localStorage.getItem('noor_ramadan') === 'true';
  if (darkMode) document.documentElement.classList.add('dark');

  return {
    user: storedUser,
    kidsMode,
    ramadanMode,
    darkMode,
    setUser: (user) => {
      if (user) localStorage.setItem('noor_session', JSON.stringify(user));
      else localStorage.removeItem('noor_session');
      set({ user });
    },
    toggleKidsMode: () => set(s => {
      const v = !s.kidsMode;
      localStorage.setItem('noor_kids', String(v));
      return { kidsMode: v };
    }),
    toggleRamadanMode: () => set(s => {
      const v = !s.ramadanMode;
      localStorage.setItem('noor_ramadan', String(v));
      return { ramadanMode: v };
    }),
    toggleDarkMode: () => set(s => {
      const v = !s.darkMode;
      localStorage.setItem('noor_dark', String(v));
      if (v) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return { darkMode: v };
    }),
    logout: () => {
      localStorage.removeItem('noor_session');
      set({ user: null });
    },
  };
});
