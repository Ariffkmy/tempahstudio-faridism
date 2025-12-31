-- Make layout_id nullable in bookings table
-- Wedding bookings do not necessarily require a studio layout
ALTER TABLE bookings ALTER COLUMN layout_id DROP NOT NULL;

-- Update comment
COMMENT ON COLUMN bookings.layout_id IS 'Associated studio layout. Optional for wedding bookings.';
