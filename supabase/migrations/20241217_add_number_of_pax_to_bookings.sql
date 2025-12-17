-- Add number_of_pax column to bookings table
-- This stores the number of people/participants for the booking

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS number_of_pax INTEGER DEFAULT 1;

COMMENT ON COLUMN bookings.number_of_pax IS 'Number of people/participants for the booking';
