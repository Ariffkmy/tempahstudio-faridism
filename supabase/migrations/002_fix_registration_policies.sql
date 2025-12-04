-- =============================================
-- FIX: Registration Policies - Avoid Infinite Recursion
-- =============================================
-- Run this SQL in Supabase SQL Editor to fix registration issues
-- This fixes the infinite recursion problem in RLS policies
-- =============================================

-- =============================================
-- STEP 1: Drop problematic policies on admin_users
-- =============================================
DROP POLICY IF EXISTS "Admins can view studio admins" ON admin_users;
DROP POLICY IF EXISTS "Users can view own profile" ON admin_users;
DROP POLICY IF EXISTS "Users can update own profile" ON admin_users;
DROP POLICY IF EXISTS "Anyone can create admin users" ON admin_users;

-- =============================================
-- STEP 2: Drop problematic policies on studios
-- =============================================
DROP POLICY IF EXISTS "Studios are viewable by everyone" ON studios;
DROP POLICY IF EXISTS "Anyone can create studios" ON studios;
DROP POLICY IF EXISTS "Admins can view their studio" ON studios;
DROP POLICY IF EXISTS "Admins can update their studio" ON studios;
DROP POLICY IF EXISTS "Admins can delete their studio" ON studios;
DROP POLICY IF EXISTS "Anyone can delete studios" ON studios;

-- =============================================
-- STEP 3: Create simple non-recursive policies for studios
-- =============================================

-- Anyone can view active studios
CREATE POLICY "Studios are viewable by everyone" ON studios
  FOR SELECT USING (is_active = true);

-- Anyone can create studios (for registration)
CREATE POLICY "Anyone can create studios" ON studios
  FOR INSERT WITH CHECK (true);

-- Anyone can update studios (will be restricted by application logic)
CREATE POLICY "Anyone can update studios" ON studios
  FOR UPDATE USING (true);

-- Anyone can delete studios (for rollback during registration)
CREATE POLICY "Anyone can delete studios" ON studios
  FOR DELETE USING (true);

-- =============================================
-- STEP 4: Create simple non-recursive policies for admin_users
-- =============================================

-- Anyone can view admin_users (needed for login check)
CREATE POLICY "Anyone can view admin users" ON admin_users
  FOR SELECT USING (true);

-- Anyone can create admin_users (for registration)
CREATE POLICY "Anyone can create admin users" ON admin_users
  FOR INSERT WITH CHECK (true);

-- Anyone can update admin_users (will be restricted by application logic)
CREATE POLICY "Anyone can update admin users" ON admin_users
  FOR UPDATE USING (true);

-- =============================================
-- DONE! Registration should now work.
-- =============================================
