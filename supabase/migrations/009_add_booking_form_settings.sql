-- =============================================
-- ADD BOOKING FORM CONFIGURATION SETTINGS
-- =============================================
-- Add booking form settings to studios table:
-- 1. Terms and Conditions (PDF file or text content)
-- 2. Time slot gap configuration
-- 3. Studio logo upload

-- Add booking form configuration columns to studios table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'terms_conditions_type') THEN
        ALTER TABLE studios ADD COLUMN terms_conditions_type VARCHAR(20) DEFAULT 'none' CHECK (terms_conditions_type IN ('text', 'pdf', 'none'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'terms_conditions_text') THEN
        ALTER TABLE studios ADD COLUMN terms_conditions_text TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'terms_conditions_pdf') THEN
        ALTER TABLE studios ADD COLUMN terms_conditions_pdf TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'time_slot_gap') THEN
        ALTER TABLE studios ADD COLUMN time_slot_gap INTEGER DEFAULT 30 CHECK (time_slot_gap IN (15, 30, 45, 60));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'studio_logo') THEN
        ALTER TABLE studios ADD COLUMN studio_logo TEXT;
    END IF;
END $$;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_studios_terms_conditions_type ON studios(terms_conditions_type);
CREATE INDEX IF NOT EXISTS idx_studios_time_slot_gap ON studios(time_slot_gap);

-- Add comments for clarity
COMMENT ON COLUMN studios.terms_conditions_type IS 'Type of terms and conditions: text, pdf, or none';
COMMENT ON COLUMN studios.terms_conditions_text IS 'Text content of terms and conditions if type is text';
COMMENT ON COLUMN studios.terms_conditions_pdf IS 'PDF file URL/path if type is pdf';
COMMENT ON COLUMN studios.time_slot_gap IS 'Gap between booking time slots in minutes (15, 30, 45, or 60)';
COMMENT ON COLUMN studios.studio_logo IS 'URL/path to studio logo image for booking form';

-- Set default values for existing studios
UPDATE studios
SET
    terms_conditions_type = 'none',
    time_slot_gap = 30
WHERE
    terms_conditions_type IS NULL OR time_slot_gap IS NULL;
