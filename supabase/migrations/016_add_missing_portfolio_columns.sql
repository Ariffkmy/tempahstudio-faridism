-- =============================================
-- MIGRATION: Add Missing Portfolio and Settings Columns
-- =============================================
-- Adds missing columns to the studios table for portfolio and settings features

-- Add enable_portfolio_photo_upload column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'studios' 
                   AND column_name = 'enable_portfolio_photo_upload') THEN
        ALTER TABLE studios ADD COLUMN enable_portfolio_photo_upload BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add portfolio_upload_instructions column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'studios' 
                   AND column_name = 'portfolio_upload_instructions') THEN
        ALTER TABLE studios ADD COLUMN portfolio_upload_instructions TEXT DEFAULT 'Upload your photos for your portfolio session. Maximum 20 photos, each file up to 10MB.';
    END IF;
END $$;

-- Add portfolio_max_file_size column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'studios' 
                   AND column_name = 'portfolio_max_file_size') THEN
        ALTER TABLE studios ADD COLUMN portfolio_max_file_size INTEGER DEFAULT 10;
    END IF;
END $$;

-- Add show_studio_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'studios' 
                   AND column_name = 'show_studio_name') THEN
        ALTER TABLE studios ADD COLUMN show_studio_name BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN studios.enable_portfolio_photo_upload IS 'Enable portfolio photo upload feature in booking form';
COMMENT ON COLUMN studios.portfolio_upload_instructions IS 'Instructions shown to customers when uploading portfolio photos';
COMMENT ON COLUMN studios.portfolio_max_file_size IS 'Maximum file size in MB for portfolio photos';
COMMENT ON COLUMN studios.show_studio_name IS 'Show studio name below logo in booking form';
