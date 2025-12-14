-- Add header_about_photo column to studios table
-- Run this in your Supabase SQL Editor

ALTER TABLE studios
ADD COLUMN IF NOT EXISTS header_about_photo TEXT DEFAULT '';

COMMENT ON COLUMN studios.header_about_photo IS 'Photo URL to display in About popup alongside the text';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'studios' 
AND column_name = 'header_about_photo';
