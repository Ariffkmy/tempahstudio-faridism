-- Add operating hours and break time columns to studios table
ALTER TABLE studios
ADD COLUMN IF NOT EXISTS operating_start_time TIME DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS operating_end_time TIME DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS break_start_time TIME DEFAULT '13:00',
ADD COLUMN IF NOT EXISTS break_end_time TIME DEFAULT '14:00';

-- Add comments
COMMENT ON COLUMN studios.operating_start_time IS 'Daily operating start time';
COMMENT ON COLUMN studios.operating_end_time IS 'Daily operating end time';
COMMENT ON COLUMN studios.break_start_time IS 'Daily break start time';
COMMENT ON COLUMN studios.break_end_time IS 'Daily break end time';
