-- Fix RLS policies for public-assets bucket to allow receipt uploads

-- First, check if policies exist and drop them if needed
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow public uploads to payment-receipts" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public to upload payment receipts" ON storage.objects;
    DROP POLICY IF EXISTS "Public can upload to payment-receipts folder" ON storage.objects;
END $$;

-- Allow anyone to upload to payment-receipts folder
CREATE POLICY "Public can upload to payment-receipts folder"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
    bucket_id = 'public-assets' 
    AND (storage.foldername(name))[1] = 'payment-receipts'
);

-- Allow public read access to payment-receipts
CREATE POLICY "Public can read payment-receipts"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = 'public-assets' 
    AND (storage.foldername(name))[1] = 'payment-receipts'
);

-- Allow super admins to delete payment receipts if needed
CREATE POLICY "Super admins can delete payment-receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'public-assets' 
    AND (storage.foldername(name))[1] = 'payment-receipts'
    AND EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.auth_user_id = auth.uid()
        AND admin_users.role = 'super_admin'
    )
);
