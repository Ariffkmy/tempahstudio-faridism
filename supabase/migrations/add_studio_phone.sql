-- Add phone column to studios table
ALTER TABLE studios
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN studios.phone IS 'Studio contact phone number for customer inquiries';
