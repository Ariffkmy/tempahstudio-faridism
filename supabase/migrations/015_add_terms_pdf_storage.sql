-- =============================================
-- MIGRATION: Add Terms & Conditions PDF Storage Policies
-- =============================================
-- Sets up RLS policies for Terms & Conditions PDF files
-- NOTE: The 'studio-terms-pdfs' bucket must be created manually in Supabase Dashboard first!

-- IMPORTANT: Run this migration AFTER creating the bucket in Supabase Dashboard

-- Set up storage policies for Terms & Conditions PDFs
-- Allow authenticated users to upload PDFs for their studio
CREATE POLICY "Authenticated users can upload terms PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'studio-terms-pdfs' AND
  (storage.foldername(name))[1] IN (
    SELECT studio_id::text
    FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND is_active = true
  )
);

-- Allow authenticated users to update their studio's PDFs
CREATE POLICY "Authenticated users can update their terms PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'studio-terms-pdfs' AND
  (storage.foldername(name))[1] IN (
    SELECT studio_id::text
    FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND is_active = true
  )
);

-- Allow authenticated users to delete their studio's PDFs
CREATE POLICY "Authenticated users can delete their terms PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'studio-terms-pdfs' AND
  (storage.foldername(name))[1] IN (
    SELECT studio_id::text
    FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND is_active = true
  )
);

-- Allow public read access to all Terms & Conditions PDFs
CREATE POLICY "Public can view terms PDFs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'studio-terms-pdfs');
