-- =============================================
-- MIGRATION: Add Booking Form Title Customization
-- =============================================
-- Adds fields to customize the booking form title and subtitle

-- Add booking form title text
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'studios' 
                   AND column_name = 'booking_title_text') THEN
        ALTER TABLE studios ADD COLUMN booking_title_text TEXT DEFAULT 'Tempahan Studio';
    END IF;
END $$;

-- Add booking form subtitle text
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'studios' 
                   AND column_name = 'booking_subtitle_text') THEN
        ALTER TABLE studios ADD COLUMN booking_subtitle_text TEXT DEFAULT 'Isi maklumat dan buat pembayaran untuk tempahan slot anda.';
    END IF;
END $$;

-- Add booking form title font family
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'studios' 
                   AND column_name = 'booking_title_font') THEN
        ALTER TABLE studios ADD COLUMN booking_title_font VARCHAR(50) DEFAULT 'default';
    END IF;
END $$;

-- Add booking form title font size
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'studios' 
                   AND column_name = 'booking_title_size') THEN
        ALTER TABLE studios ADD COLUMN booking_title_size VARCHAR(20) DEFAULT 'xl';
    END IF;
END $$;

-- Add booking form subtitle font family
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'studios' 
                   AND column_name = 'booking_subtitle_font') THEN
        ALTER TABLE studios ADD COLUMN booking_subtitle_font VARCHAR(50) DEFAULT 'default';
    END IF;
END $$;

-- Add booking form subtitle font size
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'studios' 
                   AND column_name = 'booking_subtitle_size') THEN
        ALTER TABLE studios ADD COLUMN booking_subtitle_size VARCHAR(20) DEFAULT 'base';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN studios.booking_title_text IS 'Customizable booking form title text';
COMMENT ON COLUMN studios.booking_subtitle_text IS 'Customizable booking form subtitle text';
COMMENT ON COLUMN studios.booking_title_font IS 'Font family for booking form title';
COMMENT ON COLUMN studios.booking_title_size IS 'Font size for booking form title (xs, sm, base, lg, xl, 2xl, 3xl, 4xl)';
COMMENT ON COLUMN studios.booking_subtitle_font IS 'Font family for booking form subtitle';
COMMENT ON COLUMN studios.booking_subtitle_size IS 'Font size for booking form subtitle (xs, sm, base, lg, xl)';
