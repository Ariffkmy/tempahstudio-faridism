-- Create table to track individual message delivery status
-- This table stores detailed tracking for each message sent in a blast

CREATE TABLE IF NOT EXISTS whatsapp_message_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blast_id UUID REFERENCES whatsapp_blast_history(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  
  -- Message details
  message_id TEXT, -- WhatsApp message ID
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  message_content TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed', 'error'
  error_message TEXT,
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_message_tracking_blast_id ON whatsapp_message_tracking(blast_id);
CREATE INDEX IF NOT EXISTS idx_message_tracking_studio_id ON whatsapp_message_tracking(studio_id);
CREATE INDEX IF NOT EXISTS idx_message_tracking_message_id ON whatsapp_message_tracking(message_id);
CREATE INDEX IF NOT EXISTS idx_message_tracking_status ON whatsapp_message_tracking(status);

-- Add RLS policies
ALTER TABLE whatsapp_message_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Studios can view own message tracking" ON whatsapp_message_tracking;
DROP POLICY IF EXISTS "Allow message tracking inserts for valid studios" ON whatsapp_message_tracking;
DROP POLICY IF EXISTS "Allow message tracking updates" ON whatsapp_message_tracking;
DROP POLICY IF EXISTS "Studios can delete own message tracking" ON whatsapp_message_tracking;

-- Studios can view their own message tracking
CREATE POLICY "Studios can view own message tracking"
  ON whatsapp_message_tracking
  FOR SELECT
  USING (studio_id = auth.uid());

-- Allow inserts for valid studios (backend service)
CREATE POLICY "Allow message tracking inserts for valid studios"
  ON whatsapp_message_tracking
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM studios WHERE id = studio_id
    )
  );

-- Allow updates (backend needs to update delivery status)
CREATE POLICY "Allow message tracking updates"
  ON whatsapp_message_tracking
  FOR UPDATE
  USING (true);

-- Studios can delete their own message tracking
CREATE POLICY "Studios can delete own message tracking"
  ON whatsapp_message_tracking
  FOR DELETE
  USING (studio_id = auth.uid());

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_message_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS message_tracking_updated_at ON whatsapp_message_tracking;

CREATE TRIGGER message_tracking_updated_at
  BEFORE UPDATE ON whatsapp_message_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_message_tracking_updated_at();
