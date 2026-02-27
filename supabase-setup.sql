-- ============================================================================
-- Noor Family App - Complete Database Setup Script
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Tables
-- ============================================================================

-- 1.1 Create families table first (referenced by users)
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE,
  shared_khatma_target INTEGER DEFAULT 0,
  shared_khatma_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '👤',
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Create worship_logs table
CREATE TABLE IF NOT EXISTS public.worship_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  prayers JSONB NOT NULL DEFAULT '[]',
  azpi_morning BOOLEAN DEFAULT FALSE,
  azpi_evening BOOLEAN DEFAULT FALSE,
  quran_pages INTEGER DEFAULT 0,
  fasting BOOLEAN DEFAULT FALSE,
  duha BOOLEAN DEFAULT FALSE,
  witr BOOLEAN DEFAULT FALSE,
  qiyam BOOLEAN DEFAULT FALSE,
  qiyam_private BOOLEAN DEFAULT TRUE,
  sadaqa_private BOOLEAN DEFAULT FALSE,
  dua_private BOOLEAN DEFAULT FALSE,
  iftar BOOLEAN DEFAULT FALSE,
  tarawih BOOLEAN DEFAULT FALSE,
  tarawih_rakaat INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 1.4 Create rewards table
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Create challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  target_days INTEGER NOT NULL,
  current_days INTEGER DEFAULT 0,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 Create nudges table
CREATE TABLE IF NOT EXISTS public.nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Create Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_families_invite_code ON public.families(invite_code);
CREATE INDEX IF NOT EXISTS idx_users_family_id ON public.users(family_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_worship_logs_user_id ON public.worship_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_worship_logs_date ON public.worship_logs(date);
CREATE INDEX IF NOT EXISTS idx_worship_logs_user_date ON public.worship_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_rewards_family_id ON public.rewards(family_id);
CREATE INDEX IF NOT EXISTS idx_challenges_family_id ON public.challenges(family_id);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.challenges(active);
CREATE INDEX IF NOT EXISTS idx_nudges_to_user ON public.nudges(to_user_id);
CREATE INDEX IF NOT EXISTS idx_nudges_from_user ON public.nudges(from_user_id);

-- ============================================================================
-- STEP 3: Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worship_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create Helper Function to Avoid RLS Recursion
-- ============================================================================

-- This function bypasses RLS to get the current user's family_id
-- Without this, querying users table in RLS policies causes infinite recursion
CREATE OR REPLACE FUNCTION public.current_user_family_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.current_user_family_id() TO authenticated, anon;

-- ============================================================================
-- STEP 5: Create RLS Policies for Users Table
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view family members" ON public.users;
DROP POLICY IF EXISTS "Service can insert users" ON public.users;

-- Users can read their own profile (simple, no recursion)
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (simple, no recursion)
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can view family members (uses helper function to avoid recursion)
CREATE POLICY "Users can view family members"
  ON public.users FOR SELECT
  USING (
    family_id IS NOT NULL AND
    family_id = public.current_user_family_id()
  );

-- Allow user creation during signup
CREATE POLICY "Service can insert users"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- STEP 6: Create RLS Policies for Families Table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own family" ON public.families;
DROP POLICY IF EXISTS "Admins can update family" ON public.families;
DROP POLICY IF EXISTS "Users can create families" ON public.families;

-- Users can view their own family
CREATE POLICY "Users can view own family"
  ON public.families FOR SELECT
  USING (
    id IN (SELECT family_id FROM public.users WHERE id = auth.uid())
  );

-- Admins can update their family
CREATE POLICY "Admins can update family"
  ON public.families FOR UPDATE
  USING (
    id IN (
      SELECT family_id FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow family creation
CREATE POLICY "Users can create families"
  ON public.families FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- STEP 7: Create RLS Policies for Worship Logs Table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own logs" ON public.worship_logs;
DROP POLICY IF EXISTS "Users can view family logs" ON public.worship_logs;
DROP POLICY IF EXISTS "Users can manage own logs" ON public.worship_logs;

-- Users can view their own logs
CREATE POLICY "Users can view own logs"
  ON public.worship_logs FOR SELECT
  USING (user_id = auth.uid());

-- Users can view family members' logs
CREATE POLICY "Users can view family logs"
  ON public.worship_logs FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users 
      WHERE family_id = (
        SELECT family_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Users can insert/update their own logs
CREATE POLICY "Users can manage own logs"
  ON public.worship_logs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- STEP 8: Create RLS Policies for Rewards Table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view family rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can manage rewards" ON public.rewards;

-- Users can view family rewards
CREATE POLICY "Users can view family rewards"
  ON public.rewards FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Admins can manage rewards
CREATE POLICY "Admins can manage rewards"
  ON public.rewards FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- STEP 9: Create RLS Policies for Challenges Table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view family challenges" ON public.challenges;
DROP POLICY IF EXISTS "Admins can manage challenges" ON public.challenges;

-- Users can view family challenges
CREATE POLICY "Users can view family challenges"
  ON public.challenges FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Admins can manage challenges
CREATE POLICY "Admins can manage challenges"
  ON public.challenges FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- STEP 10: Create RLS Policies for Nudges Table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view received nudges" ON public.nudges;
DROP POLICY IF EXISTS "Users can view sent nudges" ON public.nudges;
DROP POLICY IF EXISTS "Users can send nudges to family" ON public.nudges;
DROP POLICY IF EXISTS "Users can update received nudges" ON public.nudges;

-- Users can view nudges sent to them
CREATE POLICY "Users can view received nudges"
  ON public.nudges FOR SELECT
  USING (to_user_id = auth.uid());

-- Users can view nudges they sent
CREATE POLICY "Users can view sent nudges"
  ON public.nudges FOR SELECT
  USING (from_user_id = auth.uid());

-- Users can send nudges to family members
CREATE POLICY "Users can send nudges to family"
  ON public.nudges FOR INSERT
  WITH CHECK (
    from_user_id = auth.uid() AND
    to_user_id IN (
      SELECT id FROM public.users 
      WHERE family_id = (
        SELECT family_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Users can update nudges sent to them
CREATE POLICY "Users can update received nudges"
  ON public.nudges FOR UPDATE
  USING (to_user_id = auth.uid());

-- ============================================================================
-- STEP 11: Create Updated_at Triggers (Optional but Recommended)
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_families_updated_at ON public.families;
CREATE TRIGGER update_families_updated_at
    BEFORE UPDATE ON public.families
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_worship_logs_updated_at ON public.worship_logs;
CREATE TRIGGER update_worship_logs_updated_at
    BEFORE UPDATE ON public.worship_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DONE! Database setup complete
-- ============================================================================

-- Verify tables were created
SELECT 
  schemaname,
  tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'families', 'worship_logs', 'rewards', 'challenges', 'nudges')
ORDER BY tablename;

-- Verify RLS is enabled
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'families', 'worship_logs', 'rewards', 'challenges', 'nudges')
ORDER BY tablename;
