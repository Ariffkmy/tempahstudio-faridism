-- Comprehensive fix for package_payments RLS policies

-- First, disable RLS temporarily to clear any issues
ALTER TABLE package_payments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Super admins can view all package payments" ON package_payments;
DROP POLICY IF EXISTS "Super admins can update package payments" ON package_payments;
DROP POLICY IF EXISTS "Allow public to submit package payments" ON package_payments;

-- Re-enable RLS
ALTER TABLE package_payments ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous users) to insert package payments
CREATE POLICY "Anyone can submit package payments"
ON package_payments
FOR INSERT
TO public
WITH CHECK (true);

-- Allow super admins to view all payments
CREATE POLICY "Super admins can view all package payments"
ON package_payments
FOR SELECT
TO authenticated
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
TO authenticated
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

-- Also ensure packages table allows public read access
DROP POLICY IF EXISTS "Allow public read access to packages" ON packages;

CREATE POLICY "Allow public read access to packages"
ON packages
FOR SELECT
TO public
USING (is_active = true);
