-- Add layout photos columns to studio_layouts table
-- This migration adds support for multiple layout photos with thumbnail selection

-- Add layout_photos column to store array of photo URLs
ALTER TABLE studio_layouts 
ADD COLUMN IF NOT EXISTS layout_photos TEXT[] DEFAULT '{}';

-- Add thumbnail_photo column to store the URL of the thumbnail photo
ALTER TABLE studio_layouts 
ADD COLUMN IF NOT EXISTS thumbnail_photo TEXT;

-- Add comment to describe the columns
COMMENT ON COLUMN studio_layouts.layout_photos IS 'Array of photo URLs for the studio layout (max 5 photos)';
COMMENT ON COLUMN studio_layouts.thumbnail_photo IS 'URL of the thumbnail photo to be shown in the booking form';
