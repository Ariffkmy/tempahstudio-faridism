-- =============================================
-- EMAIL NOTIFICATION SYSTEM
-- =============================================
-- Database-driven email template and notification configuration
-- Allows super admins to configure which templates to use for specific actions

-- =============================================
-- EMAIL TEMPLATES TABLE
-- =============================================
-- Store SendGrid template metadata and configuration

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL UNIQUE, -- SendGrid template ID
  name TEXT NOT NULL, -- Human-readable template name
  description TEXT, -- Optional description
  subject TEXT NOT NULL, -- Email subject template
  from_email TEXT NOT NULL DEFAULT 'noreply@rayastudio.com',
  template_variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage email templates
CREATE POLICY "super_admins_manage_email_templates"
ON email_templates FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  )
);

-- =============================================
-- EMAIL NOTIFICATIONS TABLE
-- =============================================
-- Map user actions to email templates with configuration

CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL UNIQUE, -- Action identifier (e.g., 'admin_registration', 'booking_confirmation')
  name TEXT NOT NULL, -- Human-readable action name
  description TEXT, -- Optional description
  email_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  recipients TEXT[] NOT NULL DEFAULT ARRAY['customer'], -- Array of: 'customer', 'admin', 'studio'
  is_enabled BOOLEAN DEFAULT false,
  triggers TEXT[] DEFAULT ARRAY[]::TEXT[], -- Which status changes trigger this (for booking actions)
  template_variables JSONB DEFAULT '{}'::jsonb, -- Additional template variables configuration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage email notifications
CREATE POLICY "super_admins_manage_email_notifications"
ON email_notifications FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  )
);

-- =============================================
-- EMAIL LOGS TABLE
-- =============================================
-- Log all email sending attempts for monitoring

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL, -- The action that triggered the email
  email_template_id UUID REFERENCES email_templates(id),
  recipient_email TEXT NOT NULL,
  recipient_type TEXT NOT NULL, -- 'customer', 'admin', 'studio'
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  template_data JSONB DEFAULT '{}'::jsonb, -- Data sent to template
  error_message TEXT, -- Error details if failed
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view email logs
CREATE POLICY "super_admins_view_email_logs"
ON email_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  )
);

-- =============================================
-- INSERT DEFAULT TEMPLATES
-- =============================================

-- Insert default email templates (you can modify template_id after creating in SendGrid)
INSERT INTO email_templates (template_id, name, description, subject, template_variables) VALUES
('199982901212-231', 'Admin Email Onboarding', 'Welcome email sent to new admin users after registration', 'Welcome to Studio Raya Admin Panel - {{studio_name}}', '["admin_name", "studio_name", "login_url", "registration_date"]'::jsonb),
('booking-confirmation-template', 'Booking Confirmation', 'Confirmation email sent to customers after successful booking', 'Booking Confirmation - {{booking_reference}}', '["customer_name", "booking_reference", "booking_date", "booking_time", "studio_name", "layout_name"]'::jsonb),
('booking-status-update-template', 'Booking Status Update', 'Email sent when booking status changes', 'Booking Update - {{booking_reference}}', '["customer_name", "booking_reference", "new_status", "studio_name"]'::jsonb),
('booking-cancellation-template', 'Booking Cancellation', 'Email sent when booking is cancelled', 'Booking Cancelled - {{booking_reference}}', '["customer_name", "booking_reference", "cancellation_reason", "refund_info"]'::jsonb),
('admin-new-booking-template', 'New Booking Alert', 'Alert email sent to admins for new bookings', 'New Booking Alert - {{booking_reference}}', '["customer_name", "customer_email", "booking_reference", "booking_date", "booking_time", "studio_name", "total_price"]'::jsonb),
('payment-reminder-template', 'Payment Reminder', 'Reminder email for pending payments', 'Payment Reminder - {{booking_reference}}', '["customer_name", "booking_reference", "due_date", "amount_due"]'::jsonb);

-- =============================================
-- INSERT DEFAULT NOTIFICATION CONFIGURATIONS
-- =============================================

INSERT INTO email_notifications (action, name, description, recipients, is_enabled, triggers) VALUES
('admin_registration', 'Admin Registration', 'Sent when a new admin registers or is created', ARRAY['admin'], true, ARRAY[]::TEXT[]),
('booking_confirmation', 'Booking Confirmation', 'Sent immediately after successful booking', ARRAY['customer'], false, ARRAY[]::TEXT[]),
('booking_status_confirmed', 'Booking Confirmed', 'Sent when booking status changes to confirmed', ARRAY['customer'], false, ARRAY['confirmed']),
('booking_status_cancelled', 'Booking Cancelled', 'Sent when booking status changes to cancelled', ARRAY['customer'], false, ARRAY['cancelled']),
('booking_status_completed', 'Booking Completed', 'Sent when booking status changes to completed', ARRAY['customer'], false, ARRAY['completed']),
('admin_booking_alert', 'New Booking Alert', 'Sent to studio admins for new bookings', ARRAY['admin'], false, ARRAY[]::TEXT[]),
('booking_created_admin', 'Booking Created (Admin)', 'Sent to admins when any booking is created', ARRAY['admin'], false, ARRAY[]::TEXT[]),
('payment_reminder', 'Payment Reminder', 'Sent for pending payments approaching due date', ARRAY['customer'], false, ARRAY[]::TEXT[]);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_notifications_updated_at
    BEFORE UPDATE ON email_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
