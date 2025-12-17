-- Add balance_due column to bookings table
-- This stores the remaining balance that needs to be paid for deposit bookings

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS balance_due DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN bookings.balance_due IS 'Remaining balance to be paid (for deposit payments)';
