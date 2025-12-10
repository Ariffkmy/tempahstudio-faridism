-- =============================================
-- ADD BOOKING FORM CUSTOMIZATION SETTINGS
-- =============================================
-- Allows studio owners to customize their public booking forms with:
-- 1. Custom header with brand logo and navigation
-- 2. Custom footer with social media links
-- 3. Floating WhatsApp button
-- 4. Brand color customization

-- Add booking form customization columns to studios table
DO $$
BEGIN
    -- Feature toggles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'enable_custom_header') THEN
        ALTER TABLE studios ADD COLUMN enable_custom_header BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'enable_custom_footer') THEN
        ALTER TABLE studios ADD COLUMN enable_custom_footer BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'enable_whatsapp_button') THEN
        ALTER TABLE studios ADD COLUMN enable_whatsapp_button BOOLEAN DEFAULT false;
    END IF;

    -- Header customization
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'header_logo') THEN
        ALTER TABLE studios ADD COLUMN header_logo TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'header_home_enabled') THEN
        ALTER TABLE studios ADD COLUMN header_home_enabled BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'header_home_url') THEN
        ALTER TABLE studios ADD COLUMN header_home_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'header_about_enabled') THEN
        ALTER TABLE studios ADD COLUMN header_about_enabled BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'header_about_url') THEN
        ALTER TABLE studios ADD COLUMN header_about_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'header_portfolio_enabled') THEN
        ALTER TABLE studios ADD COLUMN header_portfolio_enabled BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'header_portfolio_url') THEN
        ALTER TABLE studios ADD COLUMN header_portfolio_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'header_contact_enabled') THEN
        ALTER TABLE studios ADD COLUMN header_contact_enabled BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'header_contact_url') THEN
        ALTER TABLE studios ADD COLUMN header_contact_url TEXT;
    END IF;

    -- Footer customization (social media links)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'footer_whatsapp_link') THEN
        ALTER TABLE studios ADD COLUMN footer_whatsapp_link TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'footer_facebook_link') THEN
        ALTER TABLE studios ADD COLUMN footer_facebook_link TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'footer_instagram_link') THEN
        ALTER TABLE studios ADD COLUMN footer_instagram_link TEXT;
    END IF;

    -- WhatsApp floating button
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'whatsapp_message') THEN
        ALTER TABLE studios ADD COLUMN whatsapp_message TEXT DEFAULT 'Hubungi kami';
    END IF;

    -- Brand colors
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'brand_color_primary') THEN
        ALTER TABLE studios ADD COLUMN brand_color_primary TEXT DEFAULT '#000000';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'brand_color_secondary') THEN
        ALTER TABLE studios ADD COLUMN brand_color_secondary TEXT DEFAULT '#ffffff';
    END IF;
END $$;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_studios_enable_custom_header ON studios(enable_custom_header);
CREATE INDEX IF NOT EXISTS idx_studios_enable_custom_footer ON studios(enable_custom_footer);
CREATE INDEX IF NOT EXISTS idx_studios_enable_whatsapp_button ON studios(enable_whatsapp_button);

-- Add comments for clarity
COMMENT ON COLUMN studios.enable_custom_header IS 'Enable custom header with brand logo and navigation on booking form';
COMMENT ON COLUMN studios.enable_custom_footer IS 'Enable custom footer with social media links on booking form';
COMMENT ON COLUMN studios.enable_whatsapp_button IS 'Enable floating WhatsApp button on booking form';
COMMENT ON COLUMN studios.header_logo IS 'URL/path to brand logo for booking form header (Supabase Storage)';
COMMENT ON COLUMN studios.header_home_enabled IS 'Show Home link in header navigation';
COMMENT ON COLUMN studios.header_home_url IS 'URL for Home page';
COMMENT ON COLUMN studios.header_about_enabled IS 'Show About link in header navigation';
COMMENT ON COLUMN studios.header_about_url IS 'URL for About page';
COMMENT ON COLUMN studios.header_portfolio_enabled IS 'Show Portfolio link in header navigation';
COMMENT ON COLUMN studios.header_portfolio_url IS 'URL for Portfolio page';
COMMENT ON COLUMN studios.header_contact_enabled IS 'Show Contact link in header navigation';
COMMENT ON COLUMN studios.header_contact_url IS 'URL for Contact page';
COMMENT ON COLUMN studios.footer_whatsapp_link IS 'WhatsApp phone number for footer (e.g., +601129947089)';
COMMENT ON COLUMN studios.footer_facebook_link IS 'Facebook page URL for footer';
COMMENT ON COLUMN studios.footer_instagram_link IS 'Instagram profile URL for footer';
COMMENT ON COLUMN studios.whatsapp_message IS 'Default message for WhatsApp floating button';
COMMENT ON COLUMN studios.brand_color_primary IS 'Primary brand color (hex code) for booking form theming';
COMMENT ON COLUMN studios.brand_color_secondary IS 'Secondary brand color (hex code) for booking form theming';

-- Set default values for existing studios (all customization OFF by default)
UPDATE studios
SET
    enable_custom_header = false,
    enable_custom_footer = false,
    enable_whatsapp_button = false,
    brand_color_primary = '#000000',
    brand_color_secondary = '#ffffff',
    whatsapp_message = 'Hubungi kami'
WHERE
    enable_custom_header IS NULL 
    OR enable_custom_footer IS NULL 
    OR enable_whatsapp_button IS NULL;
