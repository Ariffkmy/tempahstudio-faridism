-- =============================================
-- Update Booking Status Enum
-- =============================================
-- This migration updates the booking status enum to include more detailed workflow statuses

-- Step 1: Drop the existing check constraint first
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Step 2: Update existing data to use new status values
-- Update 'pending' status to 'done-payment'
UPDATE bookings 
SET status = 'done-payment' 
WHERE status = 'pending';

-- Update 'confirmed' status to 'done-payment'
UPDATE bookings 
SET status = 'done-payment' 
WHERE status = 'confirmed';

-- Update any other old statuses to appropriate new values
-- 'completed' stays as 'completed'
-- 'cancelled' stays as 'cancelled'
-- 'no-show' stays as 'no-show'

-- Step 3: Now add the new check constraint with all valid statuses
ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN (
  'done-payment',
  'done-photoshoot', 
  'start-editing',
  'ready-for-delivery',
  'completed',
  'rescheduled',
  'no-show',
  'cancelled'
));

-- Step 4: Change default status to 'done-payment'
ALTER TABLE bookings 
ALTER COLUMN status SET DEFAULT 'done-payment';

-- Add comment to explain the status workflow
COMMENT ON COLUMN bookings.status IS 'Booking workflow status: done-payment -> done-photoshoot -> start-editing -> ready-for-delivery -> completed. Can also be rescheduled, no-show, or cancelled.';
