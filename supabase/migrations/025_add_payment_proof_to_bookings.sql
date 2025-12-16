-- Add payment proof fields to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Add comment to explain the fields
COMMENT ON COLUMN bookings.receipt_url IS 'URL to QR payment receipt image';
COMMENT ON COLUMN bookings.payment_proof_url IS 'URL to bank transfer proof image';
COMMENT ON COLUMN bookings.payment_method IS 'Payment method: cash, qr, bank, fpx';
