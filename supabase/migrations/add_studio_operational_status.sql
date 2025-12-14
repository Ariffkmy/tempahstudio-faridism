-- Add is_operational column to studios table
ALTER TABLE studios
ADD COLUMN IF NOT EXISTS is_operational BOOLEAN DEFAULT true;

-- Add comment to explain the column
COMMENT ON COLUMN studios.is_operational IS 'Indicates whether the studio is currently accepting bookings. When false, customers cannot make new bookings.';
