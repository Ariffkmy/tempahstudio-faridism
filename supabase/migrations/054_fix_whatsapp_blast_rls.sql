-- Fix RLS policies for WhatsApp blast history to allow backend service operations
-- This allows the backend service (using anon key) to insert and update blast records

-- Drop existing restrictive policies (use IF EXISTS to avoid errors)
DROP POLICY IF EXISTS "Studios can insert own blast history" ON whatsapp_blast_history;
DROP POLICY IF EXISTS "Studios can update own blast history" ON whatsapp_blast_history;
DROP POLICY IF EXISTS "Allow blast history inserts for valid studios" ON whatsapp_blast_history;
DROP POLICY IF EXISTS "Allow blast history updates" ON whatsapp_blast_history;

-- Create more permissive policies for inserts and updates
-- Allow inserts if the studio_id exists in the studios table
CREATE POLICY "Allow blast history inserts for valid studios"
  ON whatsapp_blast_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM studios WHERE id = studio_id
    )
  );

-- Allow updates for any blast record (backend needs to update status)
CREATE POLICY "Allow blast history updates"
  ON whatsapp_blast_history
  FOR UPDATE
  USING (true);

-- Keep the select and delete policies as they were
-- (They already work correctly)
