-- Create storage bucket for studio layout photos
-- This migration creates the storage bucket and sets up RLS policies

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('studio-layout-photos', 'studio-layout-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload layout photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view layout photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their studio layout photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their studio layout photos" ON storage.objects;

-- Policy: Allow authenticated users to upload layout photos
CREATE POLICY "Authenticated users can upload layout photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'studio-layout-photos');

-- Policy: Allow public to view layout photos
CREATE POLICY "Public can view layout photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'studio-layout-photos');

-- Policy: Allow authenticated users to delete layout photos
CREATE POLICY "Users can delete their studio layout photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'studio-layout-photos');

-- Policy: Allow authenticated users to update layout photos
CREATE POLICY "Users can update their studio layout photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'studio-layout-photos');
