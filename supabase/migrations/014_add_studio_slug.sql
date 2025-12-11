-- =============================================
-- ADD STUDIO SLUG FOR URL-FRIENDLY BOOKING LINKS
-- =============================================
-- Add slug column to studios table for URL-friendly booking links
-- Example: http://domain/studioname instead of http://domain/book/uuid

-- Add slug column to studios table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studios' AND column_name = 'slug') THEN
        ALTER TABLE studios ADD COLUMN slug VARCHAR(100);
    END IF;
END $$;

-- Create unique index on slug (allowing NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_studios_slug_unique ON studios(slug) WHERE slug IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN studios.slug IS 'URL-friendly slug for booking links (e.g., my-studio-name)';

-- Function to generate slug from studio name
CREATE OR REPLACE FUNCTION generate_studio_slug(studio_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to lowercase, replace spaces with hyphens, remove special characters
    base_slug := lower(trim(studio_name));
    base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- Ensure slug is not empty
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'studio';
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and append number if needed
    WHILE EXISTS (SELECT 1 FROM studios WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing studios that don't have one
UPDATE studios
SET slug = generate_studio_slug(name)
WHERE slug IS NULL;

-- Create trigger to auto-generate slug on insert if not provided
CREATE OR REPLACE FUNCTION auto_generate_studio_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_studio_slug(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_studio_slug ON studios;
CREATE TRIGGER trigger_auto_generate_studio_slug
    BEFORE INSERT ON studios
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_studio_slug();


