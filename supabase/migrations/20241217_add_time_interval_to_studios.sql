-- Add time_interval column to studios table
ALTER TABLE studios
ADD COLUMN IF NOT EXISTS time_interval INTEGER DEFAULT 60;

COMMENT ON COLUMN studios.time_interval IS 'Time interval in minutes for booking slots (e.g., 30, 60, 120)';
