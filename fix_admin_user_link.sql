-- Fix: Create admin_users record for current authenticated user
-- This will link your auth user to the studio

-- First, let's check what your current auth user ID is
SELECT auth.uid() as current_auth_user_id;

-- Now, insert an admin_users record linking your auth user to the studio
-- Replace the email with your actual email if needed
INSERT INTO admin_users (
  auth_user_id,
  studio_id,
  email,
  full_name,
  role,
  is_active
)
VALUES (
  auth.uid(), -- Your current authenticated user ID
  '2623bc2a-20ac-4342-aa5e-cf221661c2df', -- Your studio ID
  (SELECT email FROM auth.users WHERE id = auth.uid()), -- Get email from auth.users
  'Admin User', -- You can change this to your actual name
  'admin', -- Role: 'admin' or 'super_admin'
  true -- Active status
)
ON CONFLICT (auth_user_id) DO UPDATE
SET 
  studio_id = '2623bc2a-20ac-4342-aa5e-cf221661c2df',
  is_active = true,
  updated_at = NOW();

-- Verify the insert worked
SELECT 
  au.id as admin_user_id,
  au.email,
  au.full_name,
  au.studio_id,
  au.is_active,
  au.role,
  s.name as studio_name
FROM admin_users au
LEFT JOIN studios s ON s.id = au.studio_id
WHERE au.auth_user_id = auth.uid();
