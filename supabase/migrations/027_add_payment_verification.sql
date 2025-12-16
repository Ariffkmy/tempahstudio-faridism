-- Add payment verification status to bookings table
DO $$ 
BEGIN
    -- Create enum type for payment verification status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_verification_status') THEN
        CREATE TYPE payment_verification_status AS ENUM ('disahkan', 'belum_disahkan', 'diragui');
    END IF;
END $$;

-- Add payment_verification column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_verification payment_verification_status DEFAULT 'belum_disahkan';

-- Add comment
COMMENT ON COLUMN bookings.payment_verification IS 'Payment verification status: disahkan (verified), belum_disahkan (not verified), diragui (suspicious)';

-- Create function to auto-set verification status based on payment method
CREATE OR REPLACE FUNCTION set_payment_verification_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If payment method is FPX, auto-verify
    IF NEW.payment_method = 'fpx' THEN
        NEW.payment_verification := 'disahkan';
    -- If payment method is QR or bank, set as not verified
    ELSIF NEW.payment_method IN ('qr', 'bank') THEN
        NEW.payment_verification := 'belum_disahkan';
    -- For cash or null, keep default
    ELSE
        NEW.payment_verification := COALESCE(NEW.payment_verification, 'belum_disahkan');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set verification status on insert/update
DROP TRIGGER IF EXISTS trigger_set_payment_verification ON bookings;
CREATE TRIGGER trigger_set_payment_verification
    BEFORE INSERT OR UPDATE OF payment_method
    ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_payment_verification_status();
