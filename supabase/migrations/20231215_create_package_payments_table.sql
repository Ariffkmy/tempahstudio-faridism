  -- Create package_payments table to store payment submissions
  CREATE TABLE IF NOT EXISTS package_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
    package_name VARCHAR(100) NOT NULL,
    package_price DECIMAL(10, 2) NOT NULL,
    
    -- Contact Information
    studio_name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    
    -- Payment Details
    payment_method VARCHAR(50), -- 'qr', 'transfer', 'fpx'
    receipt_url TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'rejected', 'completed'
    verified_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes
  CREATE INDEX idx_package_payments_status ON package_payments(status);
  CREATE INDEX idx_package_payments_created_at ON package_payments(created_at DESC);
  CREATE INDEX idx_package_payments_email ON package_payments(email);

  -- Enable RLS
  ALTER TABLE package_payments ENABLE ROW LEVEL SECURITY;

  -- Allow super admins to view all payments
  CREATE POLICY "Super admins can view all package payments"
    ON package_payments
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.auth_user_id = auth.uid()
        AND admin_users.role = 'super_admin'
      )
    );

  -- Allow super admins to update payment status
  CREATE POLICY "Super admins can update package payments"
    ON package_payments
    FOR UPDATE
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

  -- Allow public to insert (for payment submissions)
  CREATE POLICY "Allow public to submit package payments"
    ON package_payments
    FOR INSERT
    WITH CHECK (true);

  -- Create function to update updated_at timestamp
  CREATE OR REPLACE FUNCTION update_package_payments_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Create trigger
  CREATE TRIGGER package_payments_updated_at
    BEFORE UPDATE ON package_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_package_payments_updated_at();
