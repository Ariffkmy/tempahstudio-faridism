-- Add delivery_link field to bookings table
-- This field stores the link to the delivered photos/videos for the booking

ALTER TABLE bookings
ADD COLUMN delivery_link TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN bookings.delivery_link IS 'Link to the delivered photos/videos (e.g., Google Drive, Dropbox, etc.)';
