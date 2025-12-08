-- =============================================
-- PAYMENT GATEWAY SETTINGS MIGRATION
-- =============================================
-- Creates table for UserSecretKey and CategoryCode configuration
--
-- RUN THIS MIGRATION MANUALLY IN SUPABASE SQL Editor as the parser has issues with complex SQL
-- =============================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS payment_gateway_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_secret_key TEXT NOT NULL,
    category_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index
CREATE INDEX IF NOT EXISTS idx_payment_gateway_settings_created_at ON payment_gateway_settings(created_at);

-- 3. Insert default settings
INSERT INTO payment_gateway_settings (user_secret_key, category_code) VALUES ('', '');

-- 4. Create update trigger
CREATE TRIGGER payment_gateway_settings_updated_at_trigger
    BEFORE UPDATE ON payment_gateway_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Add RLS (run this manually)
-- ALTER TABLE payment_gateway_settings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Super admin can manage payment gateway settings" ON payment_gateway_settings
--     FOR ALL
--     USING (
--         EXISTS (
--             SELECT 1 FROM admin_users
--             WHERE admin_users.auth_user_id = auth.uid()
--             AND admin_users.role = 'super_admin'
--             AND admin_users.is_active = true
--         )
--     );
