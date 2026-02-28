-- =============================================================================
-- Phase 3: Social & Engagement – Database Migration
-- Run this in your Supabase SQL editor
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Activity Log  (Task 12 – Global Family Feed)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     uuid REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  user_id       uuid REFERENCES users(id)    ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,   -- 'prayer'|'quran'|'azkar'|'fasting'|'challenge'|'badge'|'reward'|'streak'
  activity_key  text,            -- e.g. 'fajr', 'quran_pages', 'badge_b1'
  description   text,
  points_earned integer DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family members can read activity log"
  ON activity_log FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "members can insert own activity"
  ON activity_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Enable Realtime for live feed
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;

-- ---------------------------------------------------------------------------
-- 2. Challenge Participants  (Task 13 – Challenges v2)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challenge_participants (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id      uuid REFERENCES users(id)      ON DELETE CASCADE NOT NULL,
  progress     integer DEFAULT 0,
  joined_at    timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (challenge_id, user_id)
);

ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can read challenge participants"
  ON challenge_participants FOR SELECT
  USING (challenge_id IN (
    SELECT c.id FROM challenges c
    JOIN users u ON u.family_id = c.family_id
    WHERE u.id = auth.uid()
  ));

CREATE POLICY "members can join challenges"
  ON challenge_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "members can update own participation"
  ON challenge_participants FOR UPDATE
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. Family Events  (Task 14 – Event Notifications)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS family_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    uuid REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  title        text NOT NULL,
  description  text,
  event_date   timestamptz NOT NULL,
  event_type   text DEFAULT 'general',  -- 'prayer'|'quran'|'gathering'|'general'
  created_by   uuid REFERENCES users(id),
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE family_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family members can read events"
  ON family_events FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "admins can insert events"
  ON family_events FOR INSERT
  WITH CHECK (family_id IN (
    SELECT family_id FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admins can delete events"
  ON family_events FOR DELETE
  USING (family_id IN (
    SELECT family_id FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ---------------------------------------------------------------------------
-- 4. Reward Claims  (Task 16 – Reward Redemption)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reward_claims (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id   uuid REFERENCES rewards(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES users(id)   ON DELETE CASCADE NOT NULL,
  family_id   uuid REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  status      text DEFAULT 'pending',  -- 'pending'|'approved'|'rejected'
  points_cost integer NOT NULL,
  claimed_at  timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id)
);

ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can read own claims"
  ON reward_claims FOR SELECT
  USING (user_id = auth.uid() OR family_id IN (
    SELECT family_id FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "members can insert own claims"
  ON reward_claims FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admins can update claims"
  ON reward_claims FOR UPDATE
  USING (family_id IN (
    SELECT family_id FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ---------------------------------------------------------------------------
-- 5. Feedback  (Task 18 – Feedback System)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  family_id  uuid REFERENCES families(id) ON DELETE CASCADE,
  type       text NOT NULL,   -- 'bug'|'suggestion'|'praise'
  message    text NOT NULL,
  status     text DEFAULT 'open',  -- 'open'|'reviewed'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users can read own feedback"
  ON feedback FOR SELECT
  USING (user_id = auth.uid() OR family_id IN (
    SELECT family_id FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admins can update feedback status"
  ON feedback FOR UPDATE
  USING (family_id IN (
    SELECT family_id FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ---------------------------------------------------------------------------
-- Helper indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_activity_log_family_created
  ON activity_log (family_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reward_claims_family_status
  ON reward_claims (family_id, status);

CREATE INDEX IF NOT EXISTS idx_family_events_family_date
  ON family_events (family_id, event_date);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge
  ON challenge_participants (challenge_id);

CREATE INDEX IF NOT EXISTS idx_feedback_family
  ON feedback (family_id, created_at DESC);
