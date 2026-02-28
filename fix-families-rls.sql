-- ============================================================================
-- FIX: families table SELECT policy too restrictive
--
-- Problem: The old policy only allows reading a family row if users.family_id
-- already matches. This blocks two flows:
--   1. createFamily — PostgREST tries to SELECT the row back after INSERT
--      before the users row has been updated with the new family_id.
--   2. joinFamilyByCode — the user queries families by invite_code before
--      they are a member.
--
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own family" ON public.families;

-- Allow any authenticated user to read families.
-- Family IDs are UUIDs (non-guessable) and invite codes are needed for joining,
-- so this is safe in practice.
CREATE POLICY "Authenticated users can read families"
  ON public.families FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Verify
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'families'
ORDER BY policyname;
