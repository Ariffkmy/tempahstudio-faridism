-- Add Twilio WhatsApp Template Configuration
-- This migration adds support for Twilio Content Template SIDs

-- Add template configuration columns to twilio_settings table
ALTER TABLE twilio_settings
ADD COLUMN IF NOT EXISTS delivery_template_sid TEXT,
ADD COLUMN IF NOT EXISTS delivery_template_variables JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN twilio_settings.delivery_template_sid IS 'Twilio Content Template SID for delivery notifications (e.g., HXb1234567890abcdef1234567890abcdef)';
COMMENT ON COLUMN twilio_settings.delivery_template_variables IS 'JSON object mapping template variable names to booking field names';

-- Example of delivery_template_variables structure:
-- {
--   "1": "customerName",     -- Template variable {{1}} maps to customer name
--   "2": "deliveryLink"      -- Template variable {{2}} maps to delivery link
-- }
