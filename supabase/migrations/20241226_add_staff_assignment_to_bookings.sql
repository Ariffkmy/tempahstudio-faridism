-- =============================================
-- ADD STAFF ASSIGNMENT TO BOOKINGS
-- =============================================
-- Add photographer_id and editor_id columns to bookings table

-- Add photographer_id column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS photographer_id UUID NULL REFERENCES studio_staff(id) ON DELETE SET NULL;

-- Add editor_id column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS editor_id UUID NULL REFERENCES studio_staff(id) ON DELETE SET NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_photographer_id ON bookings(photographer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_editor_id ON bookings(editor_id);

-- Add comments for documentation
COMMENT ON COLUMN bookings.photographer_id IS 'Reference to the photographer assigned to this booking';
COMMENT ON COLUMN bookings.editor_id IS 'Reference to the editor assigned to this booking';
