-- =============================================
-- GOOGLE OAUTH SETTINGS MIGRATION
-- =============================================
-- Creates table for global Google OAuth Client ID and Secret
-- Only super admins can manage these settings
-- All studios share the same OAuth app credentials
-- =============================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS google_oauth_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id TEXT,
    client_secret TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index
CREATE INDEX IF NOT EXISTS idx_google_oauth_settings_created_at ON google_oauth_settings(created_at);

-- 3. Insert default empty settings (only one row should exist)
INSERT INTO google_oauth_settings (client_id, client_secret) 
VALUES ('', '')
ON CONFLICT DO NOTHING;

-- 4. Create update trigger
CREATE TRIGGER google_oauth_settings_updated_at_trigger
    BEFORE UPDATE ON google_oauth_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE google_oauth_settings ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policy: Only super admins can read/write
CREATE POLICY "Super admin can manage google oauth settings" ON google_oauth_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.auth_user_id = auth.uid()
            AND admin_users.role = 'super_admin'
            AND admin_users.is_active = true
        )
    );

-- 7. Remove client_id and client_secret from studios table (they're now global)
-- Note: We'll keep them for now for backward compatibility, but they won't be used
-- ALTER TABLE studios DROP COLUMN IF EXISTS google_client_id;
-- ALTER TABLE studios DROP COLUMN IF EXISTS google_client_secret;

-- Comment: Studios will still have their own refresh_token and access_token
-- because each studio needs to authorize their own Google Calendar
