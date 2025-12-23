-- DIRECT FIX FOR RLS POLICIES
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it

-- ============================================
-- FIX 1: whatsapp_blast_history RLS policies
-- ============================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Studios can view own blast history" ON whatsapp_blast_history;
DROP POLICY IF EXISTS "Studios can insert own blast history" ON whatsapp_blast_history;
DROP POLICY IF EXISTS "Studios can update own blast history" ON whatsapp_blast_history;
DROP POLICY IF EXISTS "Studios can delete own blast history" ON whatsapp_blast_history;
DROP POLICY IF EXISTS "Allow blast history inserts for valid studios" ON whatsapp_blast_history;
DROP POLICY IF EXISTS "Allow blast history updates" ON whatsapp_blast_history;

-- Create new permissive policies
CREATE POLICY "Studios can view own blast history"
  ON whatsapp_blast_history
  FOR SELECT
  USING (studio_id = auth.uid());

CREATE POLICY "Allow blast history inserts for valid studios"
  ON whatsapp_blast_history
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM studios WHERE id = studio_id)
  );

CREATE POLICY "Allow blast history updates"
  ON whatsapp_blast_history
  FOR UPDATE
  USING (true);

CREATE POLICY "Studios can delete own blast history"
  ON whatsapp_blast_history
  FOR DELETE
  USING (studio_id = auth.uid());

-- ============================================
-- FIX 2: whatsapp_sessions RLS policies
-- ============================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Studios can view own whatsapp sessions" ON whatsapp_sessions;
DROP POLICY IF EXISTS "Studios can insert own whatsapp sessions" ON whatsapp_sessions;
DROP POLICY IF EXISTS "Studios can update own whatsapp sessions" ON whatsapp_sessions;
DROP POLICY IF EXISTS "Studios can delete own whatsapp sessions" ON whatsapp_sessions;
DROP POLICY IF EXISTS "Allow session inserts for valid studios" ON whatsapp_sessions;
DROP POLICY IF EXISTS "Allow session updates" ON whatsapp_sessions;

-- Create new permissive policies
CREATE POLICY "Studios can view own whatsapp sessions"
  ON whatsapp_sessions
  FOR SELECT
  USING (studio_id = auth.uid());

CREATE POLICY "Allow session inserts for valid studios"
  ON whatsapp_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM studios WHERE id = studio_id)
  );

CREATE POLICY "Allow session updates"
  ON whatsapp_sessions
  FOR UPDATE
  USING (true);

CREATE POLICY "Studios can delete own whatsapp sessions"
  ON whatsapp_sessions
  FOR DELETE
  USING (studio_id = auth.uid());

-- ============================================
-- FIX 3: whatsapp_message_tracking RLS policies
-- ============================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Studios can view own message tracking" ON whatsapp_message_tracking;
DROP POLICY IF EXISTS "Allow message tracking inserts for valid studios" ON whatsapp_message_tracking;
DROP POLICY IF EXISTS "Allow message tracking updates" ON whatsapp_message_tracking;
DROP POLICY IF EXISTS "Studios can delete own message tracking" ON whatsapp_message_tracking;

-- Create new permissive policies
CREATE POLICY "Studios can view own message tracking"
  ON whatsapp_message_tracking
  FOR SELECT
  USING (studio_id = auth.uid());

CREATE POLICY "Allow message tracking inserts for valid studios"
  ON whatsapp_message_tracking
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM studios WHERE id = studio_id)
  );

CREATE POLICY "Allow message tracking updates"
  ON whatsapp_message_tracking
  FOR UPDATE
  USING (true);

CREATE POLICY "Studios can delete own message tracking"
  ON whatsapp_message_tracking
  FOR DELETE
  USING (studio_id = auth.uid());

-- ============================================
-- VERIFICATION
-- ============================================

-- Check policies were created
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('whatsapp_blast_history', 'whatsapp_sessions', 'whatsapp_message_tracking')
ORDER BY tablename, policyname;
