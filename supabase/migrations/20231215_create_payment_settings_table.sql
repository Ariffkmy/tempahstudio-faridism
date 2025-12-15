-- Create payment_settings table for managing payment configurations
CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_image TEXT,
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  account_owner_name VARCHAR(100),
  fpx_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default payment settings
INSERT INTO payment_settings (bank_name, account_number, account_owner_name, fpx_enabled)
VALUES ('Maybank', '1234567890', 'Raya Studio Sdn Bhd', false)
ON CONFLICT DO NOTHING;

-- Add RLS policies
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to payment settings
CREATE POLICY "Allow public read access to payment settings"
  ON payment_settings
  FOR SELECT
  USING (true);

-- Allow super admins to manage payment settings
CREATE POLICY "Allow super admins to manage payment settings"
  ON payment_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER payment_settings_updated_at
  BEFORE UPDATE ON payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_settings_updated_at();
