-- Create WhatsApp Blast History Table
-- This table tracks all WhatsApp message blasts sent through the system

CREATE TABLE IF NOT EXISTS whatsapp_blast_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  
  -- Message details
  message_template TEXT NOT NULL,
  message_type TEXT DEFAULT 'custom', -- 'custom', 'delivery', 'reminder', etc.
  
  -- Recipients
  total_recipients INTEGER NOT NULL DEFAULT 0,
  recipient_list JSONB DEFAULT '[]'::jsonb, -- Array of phone numbers and names
  
  -- Sending status
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'cancelled'
  successful_sends INTEGER DEFAULT 0,
  failed_sends INTEGER DEFAULT 0,
  
  -- Error tracking
  errors JSONB DEFAULT '[]'::jsonb, -- Array of error messages
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- User who initiated the blast
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_blast_history_studio_id ON whatsapp_blast_history(studio_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_blast_history_status ON whatsapp_blast_history(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_blast_history_created_at ON whatsapp_blast_history(created_at DESC);

-- Add RLS policies
ALTER TABLE whatsapp_blast_history ENABLE ROW LEVEL SECURITY;

-- Studios can view their own blast history
CREATE POLICY "Studios can view own blast history"
  ON whatsapp_blast_history
  FOR SELECT
  USING (studio_id = auth.uid());

-- Studios can insert their own blast records
CREATE POLICY "Studios can insert own blast history"
  ON whatsapp_blast_history
  FOR INSERT
  WITH CHECK (studio_id = auth.uid());

-- Studios can update their own blast records
CREATE POLICY "Studios can update own blast history"
  ON whatsapp_blast_history
  FOR UPDATE
  USING (studio_id = auth.uid());

-- Studios can delete their own blast records
CREATE POLICY "Studios can delete own blast history"
  ON whatsapp_blast_history
  FOR DELETE
  USING (studio_id = auth.uid());
