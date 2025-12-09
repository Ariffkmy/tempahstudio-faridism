-- =============================================
-- MIGRATION: ADD SUPERADMIN FUNCTIONALITY
-- =============================================
-- Allows super admins to exist without being tied to a specific studio
-- Updates RLS policies to give super admins full access

-- =============================================
-- 1. UPDATE ADMIN_USERS TABLE
-- =============================================
-- Make studio_id nullable for super admins
DO $$
BEGIN
    ALTER TABLE admin_users ALTER COLUMN studio_id DROP NOT NULL;
EXCEPTION
    WHEN others THEN
        -- Column might already be nullable, continue
        NULL;
END $$;

-- Add constraint to ensure only super admins can have NULL studio_id
DO $$
BEGIN
    ALTER TABLE admin_users ADD CONSTRAINT superadmin_studio_check
      CHECK (
        (role = 'super_admin' AND studio_id IS NULL) OR
        (role != 'super_admin' AND studio_id IS NOT NULL)
      );
EXCEPTION
    WHEN others THEN
        -- Constraint might already exist, continue
        NULL;
END $$;

-- =============================================
-- 2. UPDATE RLS POLICIES FOR SUPER ADMINS
-- =============================================

-- Allow super admins to view all studios
CREATE POLICY "Super admins can view all studios" ON studios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Allow super admins to manage all studios
CREATE POLICY "Super admins can manage all studios" ON studios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Allow super admins to view all studio layouts
CREATE POLICY "Super admins can view all studio layouts" ON studio_layouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Allow super admins to manage all studio layouts
CREATE POLICY "Super admins can manage all studio layouts" ON studio_layouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Allow super admins to view all admin users
CREATE POLICY "Super admins can view all admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.auth_user_id = auth.uid()
      AND au.role = 'super_admin'
    )
  );

-- Allow super admins to manage all admin users
CREATE POLICY "Super admins can manage all admin users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.auth_user_id = auth.uid()
      AND au.role = 'super_admin'
    )
  );

-- Allow super admins to view all bookings
CREATE POLICY "Super admins can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Allow super admins to manage all bookings
CREATE POLICY "Super admins can manage all bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Allow super admins to view all customers
CREATE POLICY "Super admins can view all customers" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Allow super admins to manage all customers
CREATE POLICY "Super admins can manage all customers" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- =============================================
-- 3. UPDATE HELPER FUNCTIONS
-- =============================================

-- Update get_admin_studio function to handle super admins
CREATE OR REPLACE FUNCTION get_admin_studio(user_auth_id UUID)
RETURNS UUID AS $$
DECLARE
  studio_id UUID;
  user_role VARCHAR(50);
BEGIN
  SELECT admin_users.studio_id, admin_users.role INTO studio_id, user_role
  FROM admin_users
  WHERE admin_users.auth_user_id = user_auth_id
  AND admin_users.is_active = true;

  -- Super admins don't have a specific studio
  IF user_role = 'super_admin' THEN
    RETURN NULL;
  END IF;

  RETURN studio_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update is_admin_of_studio function to handle super admins
CREATE OR REPLACE FUNCTION is_admin_of_studio(user_auth_id UUID, check_studio_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role VARCHAR(50);
BEGIN
  SELECT role INTO user_role
  FROM admin_users
  WHERE auth_user_id = user_auth_id
  AND is_active = true;

  -- Super admins have access to all studios
  IF user_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  -- Regular admins only have access to their own studio
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = user_auth_id
    AND studio_id = check_studio_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. ADD SUPER ADMIN SEED DATA
-- =============================================

-- Create a default super admin account (password: superadmin123)
-- NOTE: In production, change this password immediately
INSERT INTO admin_users (
  auth_user_id,
  studio_id,
  email,
  full_name,
  phone,
  role,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Placeholder auth_user_id
  NULL, -- No studio for super admin
  'superadmin@rayastudio.com',
  'Super Administrator',
  '+601129947089',
  'super_admin',
  true
) ON CONFLICT (email) DO NOTHING;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
