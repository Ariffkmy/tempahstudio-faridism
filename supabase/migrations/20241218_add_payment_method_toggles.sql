-- Add payment method toggle columns to studios table
ALTER TABLE studios ADD COLUMN IF NOT EXISTS payment_studio_enabled BOOLEAN DEFAULT false;
ALTER TABLE studios ADD COLUMN IF NOT EXISTS payment_qr_enabled BOOLEAN DEFAULT false;
ALTER TABLE studios ADD COLUMN IF NOT EXISTS payment_bank_transfer_enabled BOOLEAN DEFAULT false;
ALTER TABLE studios ADD COLUMN IF NOT EXISTS payment_fpx_enabled BOOLEAN DEFAULT false;
ALTER TABLE studios ADD COLUMN IF NOT EXISTS payment_tng_enabled BOOLEAN DEFAULT false;
ALTER TABLE studios ADD COLUMN IF NOT EXISTS tng_qr_code TEXT;

-- Add comments for documentation
COMMENT ON COLUMN studios.payment_studio_enabled IS 'Toggle to enable/disable payment at studio';
COMMENT ON COLUMN studios.payment_qr_enabled IS 'Toggle to enable/disable QR Code payment';
COMMENT ON COLUMN studios.payment_bank_transfer_enabled IS 'Toggle to enable/disable direct bank transfer payment';
COMMENT ON COLUMN studios.payment_fpx_enabled IS 'Toggle to enable/disable FPX payment';
COMMENT ON COLUMN studios.payment_tng_enabled IS 'Toggle to enable/disable Touch n Go payment';
COMMENT ON COLUMN studios.tng_qr_code IS 'Storage URL for the Touch n Go QR code image';
