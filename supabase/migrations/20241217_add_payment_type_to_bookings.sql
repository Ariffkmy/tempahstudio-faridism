-- Add payment_type column to bookings table
-- This stores whether the customer paid deposit or full amount

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'full';

COMMENT ON COLUMN bookings.payment_type IS 'Payment type: deposit or full';
