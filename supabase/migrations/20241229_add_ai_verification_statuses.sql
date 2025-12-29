-- Add AI verification statuses to payment_verification enum
-- Migration: 20241229_add_ai_verification_statuses

-- Add new AI-specific verification statuses
DO $$ 
BEGIN
    -- Add 'disahkan_oleh_ai' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'disahkan_oleh_ai' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_verification_status')
    ) THEN
        ALTER TYPE payment_verification_status ADD VALUE 'disahkan_oleh_ai';
    END IF;

    -- Add 'diragui_oleh_ai' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'diragui_oleh_ai' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_verification_status')
    ) THEN
        ALTER TYPE payment_verification_status ADD VALUE 'diragui_oleh_ai';
    END IF;
END $$;

-- Add AI validation metadata columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS ai_validation_result JSONB,
ADD COLUMN IF NOT EXISTS ai_validated_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN bookings.ai_validation_result IS 'AI validation details including confidence, reason, and analysis from Claude API';
COMMENT ON COLUMN bookings.ai_validated_at IS 'Timestamp when AI validation was performed';

-- Update the payment_verification column comment to include new statuses
COMMENT ON COLUMN bookings.payment_verification IS 'Payment verification status: disahkan (verified), belum_disahkan (not verified), diragui (suspicious), disahkan_oleh_ai (AI verified), diragui_oleh_ai (AI flagged)';
