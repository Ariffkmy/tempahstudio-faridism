-- Drop the existing constraint
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS superadmin_studio_check;

-- Add updated constraint that allows admins without studio_id during onboarding
ALTER TABLE admin_users ADD CONSTRAINT superadmin_studio_check CHECK (
  (role = 'super_admin' AND studio_id IS NULL) OR 
  (role != 'super_admin' AND studio_id IS NOT NULL) OR
  (role != 'super_admin' AND studio_id IS NULL AND onboarding_completed = false)
);

-- Comment explaining the constraint
COMMENT ON CONSTRAINT superadmin_studio_check ON admin_users IS 
'Ensures super_admins have no studio_id, regular admins have studio_id, except during onboarding (onboarding_completed = false)';
