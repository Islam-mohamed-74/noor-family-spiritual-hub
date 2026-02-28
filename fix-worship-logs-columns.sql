-- ============================================================================
-- Migration: Add missing columns to worship_logs and users
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- worship_logs: new optional columns
ALTER TABLE public.worship_logs
  ADD COLUMN IF NOT EXISTS quran_surah_note TEXT,
  ADD COLUMN IF NOT EXISTS fasting_type TEXT CHECK (fasting_type IN ('fard', 'sunnah'));

-- users: cached stats columns (used by leaderboard & points service)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0;
