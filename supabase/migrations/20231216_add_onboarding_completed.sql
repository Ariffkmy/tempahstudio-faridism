-- Add onboarding_completed field to admin_users table
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing admin users to have onboarding_completed = true (they're already using the system)
UPDATE admin_users 
SET onboarding_completed = TRUE 
WHERE onboarding_completed IS NULL OR onboarding_completed = FALSE;
