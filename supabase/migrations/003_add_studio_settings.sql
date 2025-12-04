-- =============================================
-- ADD STUDIO SETTINGS COLUMNS
-- =============================================
-- Add additional columns to studios table for storing admin settings

-- Add new columns to studios table
ALTER TABLE studios ADD COLUMN email VARCHAR(255);
ALTER TABLE studios ADD COLUMN google_maps_link TEXT;
ALTER TABLE studios ADD COLUMN waze_link TEXT;
ALTER TABLE studios ADD COLUMN bank_account_number VARCHAR(100);
ALTER TABLE studios ADD COLUMN account_owner_name VARCHAR(255);
ALTER TABLE studios ADD COLUMN qr_code TEXT;
ALTER TABLE studios ADD COLUMN booking_link TEXT;

-- Update existing studios with default values (optional)
-- You can run these manually if needed:
-- UPDATE studios SET email = 'info@rayastudiokl.com' WHERE id = 'b0000000-0000-0000-0000-000000000001';
-- UPDATE studios SET booking_link = 'https://rayastudiokl.com/book' WHERE id = 'b0000000-0000-0000-0000-000000000001';