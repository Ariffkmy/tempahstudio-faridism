-- Create WhatsApp Sessions Table
-- This table stores WhatsApp connection sessions for each studio using Baileys

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  
  -- Session data (encrypted auth state from Baileys)
  session_data JSONB,
  
  -- Device information
  device_name TEXT,
  device_platform TEXT,
  phone_number TEXT,
  
  -- Connection status
  is_connected BOOLEAN DEFAULT false,
  last_connected_at TIMESTAMPTZ,
  last_disconnected_at TIMESTAMPTZ,
  
  -- Synced contacts from WhatsApp
  contacts JSONB DEFAULT '[]'::jsonb,
  last_contact_sync_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one session per studio
  UNIQUE(studio_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_studio_id ON whatsapp_sessions(studio_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_is_connected ON whatsapp_sessions(is_connected);

-- Add RLS policies
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Studios can view and manage their own WhatsApp sessions
CREATE POLICY "Studios can view own whatsapp sessions"
  ON whatsapp_sessions
  FOR SELECT
  USING (studio_id = auth.uid());

CREATE POLICY "Studios can insert own whatsapp sessions"
  ON whatsapp_sessions
  FOR INSERT
  WITH CHECK (studio_id = auth.uid());

CREATE POLICY "Studios can update own whatsapp sessions"
  ON whatsapp_sessions
  FOR UPDATE
  USING (studio_id = auth.uid());

CREATE POLICY "Studios can delete own whatsapp sessions"
  ON whatsapp_sessions
  FOR DELETE
  USING (studio_id = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_whatsapp_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whatsapp_sessions_updated_at
  BEFORE UPDATE ON whatsapp_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_sessions_updated_at();
