-- Add terms and conditions and privacy policy PDF fields to payment_settings
ALTER TABLE payment_settings 
ADD COLUMN IF NOT EXISTS terms_pdf TEXT,
ADD COLUMN IF NOT EXISTS privacy_policy_pdf TEXT;
