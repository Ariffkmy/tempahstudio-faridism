-- =============================================
-- MIGRATION: Create All Required Storage Buckets
-- =============================================
-- This migration creates all necessary storage buckets for the application
-- and sets up appropriate RLS policies for each bucket

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 1. PUBLIC-ASSETS BUCKET
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can upload to public-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can read public-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update public-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete public-assets" ON storage.objects;

-- Allow public uploads
CREATE POLICY "Public can upload to public-assets"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'public-assets');

-- Allow public reads
CREATE POLICY "Public can read public-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-assets');

-- Allow authenticated users to update
CREATE POLICY "Authenticated can update public-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public-assets');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated can delete public-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public-assets');

-- =============================================
-- 2. STUDIO-LOGOS BUCKET
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('studio-logos', 'studio-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload studio logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view studio logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update studio logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete studio logos" ON storage.objects;

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload studio logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'studio-logos');

-- Allow public to view logos
CREATE POLICY "Public can view studio logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'studio-logos');

-- Allow authenticated users to update logos
CREATE POLICY "Authenticated users can update studio logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'studio-logos');

-- Allow authenticated users to delete logos
CREATE POLICY "Authenticated users can delete studio logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'studio-logos');

-- =============================================
-- 3. STUDIO-PORTFOLIO BUCKET
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('studio-portfolio', 'studio-portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload portfolio photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view portfolio photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update portfolio photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete portfolio photos" ON storage.objects;

-- Allow authenticated users to upload portfolio photos
CREATE POLICY "Authenticated users can upload portfolio photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'studio-portfolio');

-- Allow public to view portfolio photos
CREATE POLICY "Public can view portfolio photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'studio-portfolio');

-- Allow authenticated users to update portfolio photos
CREATE POLICY "Authenticated users can update portfolio photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'studio-portfolio');

-- Allow authenticated users to delete portfolio photos
CREATE POLICY "Authenticated users can delete portfolio photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'studio-portfolio');

-- =============================================
-- NOTE: The following buckets are already created
-- by existing migrations, but included here for reference:
-- - booking-payments (026_create_booking_payments_bucket.sql)
-- - studio-layout-photos (019_create_layout_photos_bucket.sql)
-- - studio-terms-pdfs (015_add_terms_pdf_storage.sql)
-- =============================================
