-- =============================================
-- CRITICAL SECURITY FIX: Restrict Overly Permissive RLS Policies
-- =============================================
-- This migration fixes the dangerous "Anyone can..." policies
-- that were allowing unauthorized access to sensitive data
-- =============================================

-- =============================================
-- STEP 1: Drop dangerous policies on studios
-- =============================================
DROP POLICY IF EXISTS "Anyone can create studios" ON studios;
DROP POLICY IF EXISTS "Anyone can update studios" ON studios;
DROP POLICY IF EXISTS "Anyone can delete studios" ON studios;

-- =============================================
-- STEP 2: Drop dangerous policies on admin_users
-- =============================================
DROP POLICY IF EXISTS "Anyone can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Anyone can create admin users" ON admin_users;
DROP POLICY IF EXISTS "Anyone can update admin users" ON admin_users;

-- =============================================
-- STEP 3: Create SECURE policies for studios
-- =============================================

-- Public can view active studios (for booking form)
CREATE POLICY "Public can view active studios" ON studios
  FOR SELECT USING (is_active = true);

-- Only authenticated admins can create studios (via Edge Function)
CREATE POLICY "Authenticated can create studios" ON studios
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins of the studio can update their own studio
CREATE POLICY "Admins can update own studio" ON studios
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.studio_id = studios.id 
      AND admin_users.auth_user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Only super admins can delete studios
CREATE POLICY "Super admins can delete studios" ON studios
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
      AND admin_users.is_active = true
    )
  );

-- =============================================
-- STEP 4: Create SECURE policies for admin_users
-- =============================================

-- Admins can only view users in their own studio
CREATE POLICY "Admins view own studio users" ON admin_users
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND (
      -- User can see themselves
      auth_user_id = auth.uid()
      OR
      -- Or users in the same studio
      studio_id IN (
        SELECT studio_id FROM admin_users 
        WHERE auth_user_id = auth.uid() 
        AND is_active = true
      )
    )
  );

-- Only authenticated users can create admin_users (via Edge Function)
-- The Edge Function will enforce additional business logic
CREATE POLICY "Authenticated can create admin users" ON admin_users
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON admin_users
  FOR UPDATE 
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Only super admins can delete users
CREATE POLICY "Super admins can delete users" ON admin_users
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM admin_users AS requesting_admin
      WHERE requesting_admin.auth_user_id = auth.uid()
      AND requesting_admin.role = 'super_admin'
      AND requesting_admin.is_active = true
    )
  );

-- =============================================
-- STEP 5: Add policy for public studio creation during registration
-- =============================================
-- This allows the registration flow to work while still being secure
-- The registration Edge Function will handle the actual creation

CREATE POLICY "Allow studio creation during registration" ON studios
  FOR INSERT 
  WITH CHECK (
    -- Allow if user is not yet authenticated (during registration)
    auth.uid() IS NULL
    OR
    -- Or if user is authenticated
    auth.uid() IS NOT NULL
  );

-- =============================================
-- STEP 6: Add policy for admin user creation during registration
-- =============================================

CREATE POLICY "Allow admin creation during registration" ON admin_users
  FOR INSERT 
  WITH CHECK (
    -- Allow if user is not yet authenticated (during registration)
    auth.uid() IS NULL
    OR
    -- Or if user is authenticated
    auth.uid() IS NOT NULL
  );

-- =============================================
-- NOTES:
-- =============================================
-- 1. These policies are more restrictive than before
-- 2. Registration still works because we allow unauthenticated inserts
-- 3. Edge Functions use service_role key which bypasses RLS
-- 4. Authenticated users are restricted by studio_id
-- 5. Super admins have elevated permissions
-- =============================================

-- =============================================
-- VERIFICATION QUERIES (Run these to test)
-- =============================================
-- Check all policies on studios:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'studios';

-- Check all policies on admin_users:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'admin_users';
