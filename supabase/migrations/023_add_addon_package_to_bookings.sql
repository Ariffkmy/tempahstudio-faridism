-- Add addon_package_id column to bookings table
-- This links a booking to a specific add-on package (optional)

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS addon_package_id UUID REFERENCES addon_packages(id) ON DELETE SET NULL;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_bookings_addon_package_id ON bookings(addon_package_id);

-- Add comment for documentation
COMMENT ON COLUMN bookings.addon_package_id IS 'References the add-on package selected for this booking (NULL if no add-on)';
