-- Generic script to fix package_name for ANY studio
-- This will work for whichever account you're currently logged in as

-- Step 1: Find your current user and studio
-- Run this first to see your current account details
SELECT 
    au.id as admin_user_id,
    au.email as your_email,
    au.full_name,
    au.studio_id,
    s.name as studio_name,
    s.package_name as current_package_name,
    pp.package_name as payment_package_name
FROM admin_users au
LEFT JOIN studios s ON s.id = au.studio_id
LEFT JOIN package_payments pp ON pp.email = au.email
WHERE au.auth_user_id = auth.uid()
ORDER BY pp.created_at DESC
LIMIT 1;

-- Step 2: Update your studio with the package name
-- This will automatically use YOUR email (whoever is logged in)
UPDATE studios
SET 
    package_name = (
        SELECT pp.package_name 
        FROM package_payments pp
        JOIN admin_users au ON au.email = pp.email
        WHERE au.auth_user_id = auth.uid()
        ORDER BY pp.created_at DESC 
        LIMIT 1
    ),
    email = (
        SELECT au.email
        FROM admin_users au
        WHERE au.auth_user_id = auth.uid()
        LIMIT 1
    ),
    updated_at = NOW()
WHERE id = (
    SELECT studio_id 
    FROM admin_users 
    WHERE auth_user_id = auth.uid()
);

-- Step 3: Verify the update worked
SELECT 
    s.id,
    s.name,
    s.email,
    s.package_name,
    au.email as admin_email,
    au.full_name
FROM studios s
JOIN admin_users au ON au.studio_id = s.id
WHERE au.auth_user_id = auth.uid();
