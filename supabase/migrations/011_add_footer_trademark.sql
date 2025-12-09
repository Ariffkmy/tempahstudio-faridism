-- =============================================
-- ADD FOOTER TRADEMARK FIELD
-- =============================================
-- Adds a customizable footer trademark text field for booking form customization

-- Add footer trademark column to studios table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'footer_trademark') THEN
        ALTER TABLE studios ADD COLUMN footer_trademark TEXT DEFAULT '© 2025 {{BrandName}}. All rights reserved.';
    END IF;
END $$;

-- Add comment for clarity
COMMENT ON COLUMN studios.footer_trademark IS 'Customizable footer trademark text for booking forms (supports {{BrandName}} placeholder)';

-- Update existing studios with the default value
UPDATE studios
SET footer_trademark = '© 2025 {{BrandName}}. All rights reserved.'
WHERE footer_trademark IS NULL;
