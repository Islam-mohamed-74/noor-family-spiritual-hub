-- ============================================================================
-- FIX: Infinite Recursion in Users Table RLS Policies
-- Run this in Supabase SQL Editor to fix the recursion error
-- ============================================================================

-- STEP 1: Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view family members" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service can insert users" ON public.users;

-- STEP 2: Create a helper function that bypasses RLS
-- This function runs with SECURITY DEFINER, allowing it to read the users table
-- without triggering RLS policies
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

-- STEP 3: Create new, non-recursive policies

-- Policy 1: Users can always view their own profile (no recursion)
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can view family members (using helper function to avoid recursion)
CREATE POLICY "Users can view family members"
  ON public.users FOR SELECT
  USING (
    family_id IS NOT NULL 
    AND family_id = public.current_user_family_id()
  );

-- Policy 3: Users can update their own profile (no recursion)
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Allow user creation during signup
CREATE POLICY "Service can insert users"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- STEP 4: Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;
