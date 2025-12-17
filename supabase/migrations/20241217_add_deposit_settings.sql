-- Add deposit configuration columns to studios table
ALTER TABLE studios
ADD COLUMN IF NOT EXISTS deposit_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN studios.deposit_enabled IS 'Whether deposit payment option is enabled for this studio';
COMMENT ON COLUMN studios.deposit_amount IS 'Fixed deposit amount required when deposit is enabled';
