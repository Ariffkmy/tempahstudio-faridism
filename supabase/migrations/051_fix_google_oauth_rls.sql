-- =============================================
-- FIX GOOGLE OAUTH SETTINGS RLS POLICY
-- =============================================
-- Allow regular admins to READ OAuth settings
-- Only super admins can WRITE
-- =============================================

-- Drop the existing policy
DROP POLICY IF EXISTS "Super admin can manage google oauth settings" ON google_oauth_settings;

-- Create separate policies for read and write

-- Policy 1: All authenticated admins can READ (to get client_id for OAuth)
CREATE POLICY "Admins can read google oauth settings" ON google_oauth_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.auth_user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Policy 2: Only super admins can INSERT/UPDATE/DELETE
CREATE POLICY "Super admin can manage google oauth settings" ON google_oauth_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.auth_user_id = auth.uid()
            AND admin_users.role = 'super_admin'
            AND admin_users.is_active = true
        )
    );

-- Comment
COMMENT ON POLICY "Admins can read google oauth settings" ON google_oauth_settings IS 
'All active admins can read OAuth settings to initiate Google Calendar authorization';

COMMENT ON POLICY "Super admin can manage google oauth settings" ON google_oauth_settings IS 
'Only super admins can create, update, or delete OAuth settings';
