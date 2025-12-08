// =============================================
// EMAIL SERVICE
// =============================================
// Client-side service for sending email notifications
// Calls Supabase Edge Function to trigger dynamic email sending

import { supabase } from '@/lib/supabase';

// =============================================
// EMAIL TRIGGER FUNCTIONS
// =============================================

/**
 * Trigger a dynamic email notification
 */
export async function triggerEmailNotification(
  action: string,
  recipientEmail: string,
  recipientType: 'customer' | 'admin' | 'studio' = 'customer',
  templateData: Record<string, any> = {}
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    console.log(`Triggering email notification: ${action} for ${recipientEmail}`);

    const { data, error } = await supabase.functions.invoke('send-email-notification', {
      body: {
        action,
        recipient_email: recipientEmail,
        recipient_type: recipientType,
        template_data: templateData,
      },
    });

    if (error) {
      console.error(`Failed to trigger email for ${action}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to send email notification',
      };
    }

    if (!data.success) {
      console.error(`Email sending failed for ${action}:`, data.error);
      return {
        success: false,
        error: data.error || 'Email sending failed',
      };
    }

    console.log(`Email notification sent successfully for ${action}:`, data.email_id);
    return {
      success: true,
      emailId: data.email_id,
    };
  } catch (error) {
    console.error(`Unexpected error triggering email for ${action}:`, error);
    return {
      success: false,
      error: 'Unexpected error occurred while sending email',
    };
  }
}

// =============================================
// SPECIFIC EMAIL TRIGGER FUNCTIONS
// =============================================

/**
 * Send admin registration welcome email
 */
export async function sendAdminWelcomeEmail(
  adminEmail: string,
  adminData: {
    full_name: string;
    studio_name: string;
  }
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const templateData = {
    admin_name: adminData.full_name,
    studio_name: adminData.studio_name,
    login_url: `${window.location.origin}/admin/login`,
    registration_date: new Date().toLocaleDateString('ms-MY'),
  };

  return triggerEmailNotification(
    'admin_registration',
    adminEmail,
    'admin',
    templateData
  );
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  customerEmail: string,
  bookingData: {
    reference: string;
    customer_name: string;
    date: string;
    start_time: string;
    end_time: string;
    studio_name: string;
    layout_name: string;
    total_price: number;
    duration: number;
  }
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const templateData = {
    customer_name: bookingData.customer_name,
    booking_reference: bookingData.reference,
    booking_date: new Date(bookingData.date).toLocaleDateString('ms-MY'),
    booking_time: `${bookingData.start_time} - ${bookingData.end_time}`,
    studio_name: bookingData.studio_name,
    layout_name: bookingData.layout_name,
    duration: bookingData.duration,
    total_price: bookingData.total_price,
    total_price_formatted: `RM ${bookingData.total_price.toFixed(2)}`,
  };

  return triggerEmailNotification(
    'booking_confirmation',
    customerEmail,
    'customer',
    templateData
  );
}

/**
 * Send booking status update email
 */
export async function sendBookingStatusEmail(
  customerEmail: string,
  bookingData: {
    reference: string;
    customer_name: string;
    studio_name: string;
    old_status: string;
    new_status: string;
  }
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const templateData = {
    customer_name: bookingData.customer_name,
    booking_reference: bookingData.reference,
    studio_name: bookingData.studio_name,
    old_status: bookingData.old_status,
    new_status: bookingData.new_status,
  };

  return triggerEmailNotification(
    `booking_status_${bookingData.new_status.toLowerCase()}`,
    customerEmail,
    'customer',
    templateData
  );
}

/**
 * Send new booking alert to admin
 */
export async function sendAdminBookingAlert(
  adminEmail: string,
  bookingData: {
    reference: string;
    customer_name: string;
    customer_email: string;
    date: string;
    start_time: string;
    end_time: string;
    studio_name: string;
    total_price: number;
    duration: number;
  }
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const templateData = {
    customer_name: bookingData.customer_name,
    customer_email: bookingData.customer_email,
    booking_reference: bookingData.reference,
    booking_date: new Date(bookingData.date).toLocaleDateString('ms-MY'),
    booking_time: `${bookingData.start_time} - ${bookingData.end_time}`,
    studio_name: bookingData.studio_name,
    total_price: bookingData.total_price,
    total_price_formatted: `RM ${bookingData.total_price.toFixed(2)}`,
    duration: bookingData.duration,
  };

  return triggerEmailNotification(
    'admin_booking_alert',
    adminEmail,
    'admin',
    templateData
  );
}

// =============================================
// CONFIGURATION MANAGEMENT
// =============================================

/**
 * Get all email notifications with their configurations
 */
export async function getEmailNotifications(): Promise<{
  success: boolean;
  notifications?: any[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('email_notifications')
      .select(`
        *,
        email_template:email_templates(*)
      `)
      .order('name');

    if (error) {
      console.error('Failed to fetch email notifications:', error);
      return { success: false, error: error.message };
    }

    return { success: true, notifications: data || [] };
  } catch (error) {
    console.error('Error fetching email notifications:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Update email notification configuration
 */
export async function updateEmailNotification(
  notificationId: string,
  updates: {
    is_enabled?: boolean;
    email_template_id?: string;
    recipients?: string[];
    template_variables?: Record<string, any>;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('email_notifications')
      .update(updates)
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to update email notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating email notification:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Get email templates available for configuration
 */
export async function getEmailTemplates(): Promise<{
  success: boolean;
  templates?: any[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Failed to fetch email templates:', error);
      return { success: false, error: error.message };
    }

    return { success: true, templates: data || [] };
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Create new email template
 */
export async function createEmailTemplate(templateData: {
  template_id: string;
  name: string;
  description?: string;
  subject: string;
  from_email?: string;
  template_variables?: string[];
}): Promise<{ success: boolean; template?: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create email template:', error);
      return { success: false, error: error.message };
    }

    return { success: true, template: data };
  } catch (error) {
    console.error('Error creating email template:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Update email template
 */
export async function updateEmailTemplate(
  templateId: string,
  updates: Partial<{
    template_id: string;
    name: string;
    description: string;
    subject: string;
    from_email: string;
    template_variables: string[];
    is_active: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('email_templates')
      .update(updates)
      .eq('id', templateId);

    if (error) {
      console.error('Failed to update email template:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating email template:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Delete email template
 */
export async function deleteEmailTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Failed to delete email template:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting email template:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Get email logs for monitoring
 */
export async function getEmailLogs(limit: number = 50): Promise<{
  success: boolean;
  logs?: any[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch email logs:', error);
      return { success: false, error: error.message };
    }

    return { success: true, logs: data || [] };
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}
