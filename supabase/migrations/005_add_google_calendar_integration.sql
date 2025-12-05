-- =============================================
-- ADD GOOGLE CALENDAR INTEGRATION
-- =============================================
-- Add Google Calendar integration fields to studios table

-- Add Google Calendar configuration columns to studios table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'google_calendar_enabled') THEN
        ALTER TABLE studios ADD COLUMN google_calendar_enabled BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'google_calendar_id') THEN
        ALTER TABLE studios ADD COLUMN google_calendar_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'google_client_id') THEN
        ALTER TABLE studios ADD COLUMN google_client_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'google_client_secret') THEN
        ALTER TABLE studios ADD COLUMN google_client_secret TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'google_refresh_token') THEN
        ALTER TABLE studios ADD COLUMN google_refresh_token TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'google_access_token') THEN
        ALTER TABLE studios ADD COLUMN google_access_token TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'google_token_expires_at') THEN
        ALTER TABLE studios ADD COLUMN google_token_expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_studios_google_calendar_enabled ON studios(google_calendar_enabled);

-- Add comments for clarity
COMMENT ON COLUMN studios.google_calendar_enabled IS 'Whether Google Calendar integration is enabled for this studio';
COMMENT ON COLUMN studios.google_calendar_id IS 'The Google Calendar ID where booking events should be added';
COMMENT ON COLUMN studios.google_client_id IS 'Google OAuth client ID for calendar access';
COMMENT ON COLUMN studios.google_client_secret IS 'Google OAuth client secret (encrypted)';
COMMENT ON COLUMN studios.google_refresh_token IS 'Google OAuth refresh token (encrypted)';
COMMENT ON COLUMN studios.google_access_token IS 'Current Google OAuth access token (encrypted)';
COMMENT ON COLUMN studios.google_token_expires_at IS 'When the current access token expires';
