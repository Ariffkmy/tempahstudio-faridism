-- Fix RLS policies for WhatsApp sessions to allow backend service operations
-- This allows the backend service (using anon key) to insert and update session records

-- Drop existing restrictive policies (use IF EXISTS to avoid errors)
DROP POLICY IF EXISTS "Studios can insert own whatsapp sessions" ON whatsapp_sessions;
DROP POLICY IF EXISTS "Studios can update own whatsapp sessions" ON whatsapp_sessions;
DROP POLICY IF EXISTS "Allow session inserts for valid studios" ON whatsapp_sessions;
DROP POLICY IF EXISTS "Allow session updates" ON whatsapp_sessions;

-- Create more permissive policies for inserts and updates
-- Allow inserts if the studio_id exists in the studios table
CREATE POLICY "Allow session inserts for valid studios"
  ON whatsapp_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM studios WHERE id = studio_id
    )
  );

-- Allow updates for any session record (backend needs to update connection status)
CREATE POLICY "Allow session updates"
  ON whatsapp_sessions
  FOR UPDATE
  USING (true);

-- Keep the select and delete policies as they were
-- (They already work correctly)
