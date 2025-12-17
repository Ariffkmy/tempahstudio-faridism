-- Add minute_package column to studio_layouts table
-- This stores the duration/period of each layout package in minutes

ALTER TABLE studio_layouts
ADD COLUMN IF NOT EXISTS minute_package INTEGER DEFAULT 0;

COMMENT ON COLUMN studio_layouts.minute_package IS 'Duration/period of the layout package in minutes';
