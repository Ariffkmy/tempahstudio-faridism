-- Migration: Add navigation content fields to studios table
-- Description: Adds text fields for Home, About, and Contact navigation popups
-- Date: 2025-12-14

-- Add Home navigation text field
ALTER TABLE studios
ADD COLUMN IF NOT EXISTS header_home_text TEXT DEFAULT '';

-- Add About navigation text field
ALTER TABLE studios
ADD COLUMN IF NOT EXISTS header_about_text TEXT DEFAULT '';

-- Add About navigation photo field
ALTER TABLE studios
ADD COLUMN IF NOT EXISTS header_about_photo TEXT DEFAULT '';

-- Add Contact navigation fields
ALTER TABLE studios
ADD COLUMN IF NOT EXISTS header_contact_address TEXT DEFAULT '';

ALTER TABLE studios
ADD COLUMN IF NOT EXISTS header_contact_phone TEXT DEFAULT '';

ALTER TABLE studios
ADD COLUMN IF NOT EXISTS header_contact_email TEXT DEFAULT '';

-- Add comments for documentation
COMMENT ON COLUMN studios.header_home_text IS 'Text content to display in popup when users click Home navigation';
COMMENT ON COLUMN studios.header_about_text IS 'Text content to display in popup when users click About navigation';
COMMENT ON COLUMN studios.header_about_photo IS 'Photo URL to display in About popup alongside the text';
COMMENT ON COLUMN studios.header_contact_address IS 'Studio address to display in Contact popup';
COMMENT ON COLUMN studios.header_contact_phone IS 'Phone number to display in Contact popup';
COMMENT ON COLUMN studios.header_contact_email IS 'Email address to display in Contact popup';
