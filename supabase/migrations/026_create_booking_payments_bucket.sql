-- Create storage bucket for booking payment proofs if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-payments', 'booking-payments', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to upload to booking-payments bucket
CREATE POLICY "Allow public uploads to booking-payments"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'booking-payments');

-- Policy to allow anyone to read from booking-payments bucket
CREATE POLICY "Allow public reads from booking-payments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'booking-payments');

-- Policy to allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated updates to booking-payments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'booking-payments');

-- Policy to allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated deletes from booking-payments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'booking-payments');
