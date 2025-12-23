-- Fix: Update existing studio to have package_name from package_payments
-- This will set the package name on the studio so it shows in the sidebar

-- First, let's see what package payment exists for your email
SELECT 
    pp.email,
    pp.package_name,
    pp.created_at,
    s.id as studio_id,
    s.name as studio_name,
    s.package_name as current_package_name
FROM package_payments pp
LEFT JOIN admin_users au ON au.email = pp.email
LEFT JOIN studios s ON s.id = au.studio_id
WHERE pp.email = 'ariffhakimichik98@gmail.com'
ORDER BY pp.created_at DESC
LIMIT 1;

-- Update the studio with the package name from the payment
UPDATE studios
SET 
    package_name = (
        SELECT package_name 
        FROM package_payments 
        WHERE email = 'ariffhakimichik98@gmail.com'
        ORDER BY created_at DESC 
        LIMIT 1
    ),
    email = 'ariffhakimichik98@gmail.com', -- Also set email for fallback lookup
    updated_at = NOW()
WHERE id = '2623bc2a-20ac-4342-aa5e-cf221661c2df';

-- Verify the update
SELECT 
    id,
    name,
    email,
    package_name
FROM studios
WHERE id = '2623bc2a-20ac-4342-aa5e-cf221661c2df';
