-- Fix: Link the admin user to the studio
-- This will assign the studio to the user ariffhakimichik98@gmail.com

UPDATE admin_users
SET 
  studio_id = '2623bc2a-20ac-4342-aa5e-cf221661c2df', -- Your studio ID
  updated_at = NOW()
WHERE email = 'ariffhakimichik98@gmail.com';

-- Verify the update worked
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
WHERE au.email = 'ariffhakimichik98@gmail.com';
