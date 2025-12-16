import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as sgMail from "https://esm.sh/@sendgrid/mail";

// =============================================
// SEND EMAIL NOTIFICATION
// =============================================
// Supabase Edge Function for sending dynamic email notifications
// Retrieves template configuration and recipient data from database dynamically

interface NotificationRequest {
  action: string;         // Action identifier (e.g., 'admin_registration')
  recipient_email: string;
  recipient_type: 'customer' | 'admin' | 'studio';
  template_data: Record<string, any>; // Data to inject into template
}

serve(async (req: Request) => {
  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize SendGrid
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')!;
    sgMail.setApiKey(sendgridApiKey);

    // Parse request body
    const { action, recipient_email, recipient_type, template_data }: NotificationRequest = await req.json();

    console.log(`Processing email notification: ${action} for ${recipient_email}`);

    // Step 1: Get notification configuration
    const { data: notification, error: notificationError } = await supabase
      .from('email_notifications')
      .select(`
        *,
        email_template:email_templates(*)
      `)
      .eq('action', action)
      .eq('is_enabled', true)
      .single();

    if (notificationError || !notification) {
      console.error('Notification not found or disabled:', action);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Notification configuration not found for action: ${action}`,
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!notification.email_template) {
      console.error('No email template configured for:', action);
      return new Response(
        JSON.stringify({
          success: false,
          error: `No email template configured for action: ${action}`,
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Check if recipient type is allowed for this notification
    const allowedRecipientTypes = notification.recipients || [];
    if (!allowedRecipientTypes.includes(recipient_type)) {
      console.error(`Recipient type ${recipient_type} not allowed for action ${action}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Recipient type not allowed for this notification`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Prepare email data
    const template = notification.email_template;
    const fromEmail = template.from_email || 'noreply@rayastudio.com';

    // Build dynamic subject and content
    let subject = template.subject;
    let content = '';

    // Replace template variables in subject and content
    const allTemplateData = {
      ...template_data,
      ...notification.template_variables || {},
    };

    // Replace template variables in subject
    Object.keys(allTemplateData).forEach(key => {
      const placeholder = `{{${key}}}`;
      if (subject.includes(placeholder)) {
        subject = subject.replace(new RegExp(placeholder, 'g'), String(allTemplateData[key]));
      }
    });

    console.log(`Sending email: ${subject} to ${recipient_email}`);

    // Step 4: Send email via SendGrid
    const msg = {
      to: recipient_email,
      from: {
        email: fromEmail,
        name: 'Tempah Studio'
      },
      templateId: template.template_id,
      dynamicTemplateData: allTemplateData,
    };

    try {
      const result = await sgMail.send(msg);
      console.log('Email sent successfully:', result[0].statusCode, result[0].headers?.['x-message-id']);

      // Step 5: Log the email sending
      await supabase
        .from('email_logs')
        .insert({
          action: action,
          email_template_id: template.id,
          recipient_email: recipient_email,
          recipient_type: recipient_type,
          status: 'sent',
          template_data: allTemplateData,
          sent_at: new Date().toISOString(),
        });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully',
          email_id: result[0].headers?.['x-message-id'],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (sendError) {
      console.error('Failed to send email:', sendError);

      // Log the failure
      await supabase
        .from('email_logs')
        .insert({
          action: action,
          email_template_id: template.id,
          recipient_email: recipient_email,
          recipient_type: recipient_type,
          status: 'failed',
          template_data: allTemplateData,
          error_message: JSON.stringify(sendError),
        });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to send email',
          details: sendError,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Unexpected error in send-email-notification:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unexpected error occurred',
        details: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
