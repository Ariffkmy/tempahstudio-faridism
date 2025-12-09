-- =============================================
-- TWILIO WHATSAPP SETTINGS MIGRATION
-- =============================================
-- Creates table for Twilio WhatsApp configuration
--
-- RUN THIS MIGRATION MANUALLY IN SUPABASE SQL Editor as the parser has issues with complex SQL
-- =============================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS twilio_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    twilio_sid TEXT NOT NULL,
    twilio_auth_token TEXT NOT NULL,
    twilio_whatsapp_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index
CREATE INDEX IF NOT EXISTS idx_twilio_settings_created_at ON twilio_settings(created_at);

-- 3. Insert default settings
INSERT INTO twilio_settings (twilio_sid, twilio_auth_token, twilio_whatsapp_number) VALUES ('', '', '');

-- 4. Trigger and RLS setup (run manually in Supabase SQL Editor)
-- Run the following commands manually:
--   ALTER TABLE twilio_settings ENABLE ROW LEVEL SECURITY;
--   CREATE TRIGGER twilio_settings_updated_at_trigger BEFORE UPDATE ON twilio_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
--   CREATE POLICY "Super admin can manage Twilio settings" ON twilio_settings FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.auth_user_id = auth.uid() AND admin_users.role = 'super_admin' AND admin_users.is_active = true));
