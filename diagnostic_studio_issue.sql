-- Diagnostic query to check admin user and studio relationship
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check current authenticated user's admin record
SELECT 
  au.id as admin_user_id,
  au.email,
  au.full_name,
  au.studio_id,
  au.is_active,
  au.role,
  s.id as studio_id_check,
  s.name as studio_name
FROM admin_users au
LEFT JOIN studios s ON s.id = au.studio_id
WHERE au.auth_user_id = auth.uid()
AND au.is_active = true;

-- 2. Check if there are any studios in the database
SELECT 
  id,
  name,
  company_id,
  email,
  location,
  is_active
FROM studios
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if the admin user exists but has no studio_id
SELECT 
  id,
  email,
  full_name,
  studio_id,
  is_active,
  role
FROM admin_users
WHERE auth_user_id = auth.uid();
