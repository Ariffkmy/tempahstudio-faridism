-- Add minute_package column to packages table
-- This stores the duration/period of each package in minutes

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS minute_package INTEGER DEFAULT 0;

COMMENT ON COLUMN packages.minute_package IS 'Duration/period of the package in minutes';
