-- Add booking_type column to differentiate between studio and wedding bookings
-- This allows us to use the same bookings table for both types while showing different columns in admin

-- Add booking_type column with check constraint
ALTER TABLE bookings 
ADD COLUMN booking_type VARCHAR(20) DEFAULT 'studio' 
CHECK (booking_type IN ('studio', 'wedding'));

-- Add index for faster filtering by booking type
CREATE INDEX idx_bookings_booking_type ON bookings(booking_type);

-- Update existing bookings to have booking_type = 'studio' for backward compatibility
UPDATE bookings SET booking_type = 'studio' WHERE booking_type IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN bookings.booking_type IS 'Type of booking: studio (studio raya) or wedding (wedding reception)';
