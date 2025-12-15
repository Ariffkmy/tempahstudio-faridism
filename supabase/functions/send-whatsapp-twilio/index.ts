import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================
// SEND WHATSAPP MESSAGE VIA TWILIO
// =============================================
// Supabase Edge Function for sending WhatsApp messages via Twilio REST API
// Uses direct HTTP calls to avoid SDK compatibility issues with Deno

interface WhatsAppRequest {
  phoneNumber: string;       // Recipients phone number (including country code)
  message?: string;          // The plain text message to send (for non-template messages)
  templateSid?: string;      // Twilio Content Template SID (for template messages)
  templateVariables?: Record<string, string>; // Template variables (for template messages)
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { phoneNumber, message, templateSid, templateVariables }: WhatsAppRequest = await req.json();

    console.log(`Processing WhatsApp message to: ${phoneNumber}`);
    console.log(`Template mode: ${!!templateSid}, Plain message mode: ${!!message}`);

    // Step 1: Get Twilio settings from database
    const { data: twilioSettings, error: settingsError } = await supabase
      .from('twilio_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.error('Failed to fetch Twilio settings:', settingsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Twilio settings not configured',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!twilioSettings.twilio_sid || !twilioSettings.twilio_auth_token || !twilioSettings.twilio_whatsapp_number) {
      console.error('Incomplete Twilio configuration');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Twilio configuration incomplete',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Format recipient phone number (ensure E.164 format)
    let formattedPhone = phoneNumber.replace(/\s+/g, '').trim(); // Remove spaces

    // Remove whatsapp: prefix if present
    if (formattedPhone.toLowerCase().startsWith('whatsapp:')) {
      formattedPhone = formattedPhone.substring(9);
    }

    // Handle Malaysian numbers: 01... -> +601...
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+60' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('60')) {
      // 60... -> +60...
      formattedPhone = '+' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      // If no + prefix and not local format, assume it needs + (or user provided partial)
      // Best effort: just add +
      formattedPhone = '+' + formattedPhone;
    }

    // Step 3: Send WhatsApp message via Twilio REST API
    try {
      // Sanitize 'From' number to ensure no double prefixes
      let fromNumber = twilioSettings.twilio_whatsapp_number.trim();
      if (fromNumber.toLowerCase().startsWith('whatsapp:')) {
        fromNumber = fromNumber.substring(9);
      }
      if (!fromNumber.startsWith('+')) {
        fromNumber = '+' + fromNumber;
      }

      const finalFrom = `whatsapp:${fromNumber}`;
      const finalTo = `whatsapp:${formattedPhone}`;

      console.log(`Sending WhatsApp details:`);
      console.log(`From (Raw): ${twilioSettings.twilio_whatsapp_number}`);
      console.log(`From (Formatted): ${finalFrom}`);
      console.log(`To (Formatted): ${finalTo}`);

      // Twilio REST API URL
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSettings.twilio_sid}/Messages.json`;

      // Prepare parameters for Twilio API
      let requestBody: Record<string, string>;

      if (templateSid) {
        // Template-based message using Content Template
        console.log(`Using Twilio Content Template: ${templateSid}`);

        // Build contentVariables JSON string
        const contentVariables = JSON.stringify(templateVariables || {});

        requestBody = {
          From: finalFrom,
          To: finalTo,
          ContentSid: templateSid,
          ContentVariables: contentVariables
        };

        console.log('Template variables:', contentVariables);
      } else {
        // Plain text message
        if (!message) {
          throw new Error('Either message or templateSid must be provided');
        }

        requestBody = {
          From: finalFrom,
          To: finalTo,
          Body: message
        };

        console.log('Plain message preview:', message.substring(0, 50) + '...');
      }

      console.log('Twilio API Request:', {
        url: twilioUrl,
        to: requestBody.To,
        mode: templateSid ? 'template' : 'plain',
        phone: phoneNumber,
        formattedPhone: formattedPhone
      });

      // Make HTTP request to Twilio API
      const authHeader = 'Basic ' + btoa(`${twilioSettings.twilio_sid}:${twilioSettings.twilio_auth_token}`);

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestBody).toString()
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
      }

      console.log('WhatsApp sent successfully:', responseData.sid);

      // Log success
      try {
        await supabase.from('whatsapp_logs').insert({
          phone_number: formattedPhone,
          message: templateSid ? `Template: ${templateSid}` : message,
          twilio_sid: responseData.sid,
          status: 'sent',
          sent_at: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Error logging to database:', logError);
      }

      return new Response(
        JSON.stringify({ success: true, sid: responseData.sid }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Error sending message:', error);

      // Log failure
      try {
        await supabase.from('whatsapp_logs').insert({
          phone_number: formattedPhone,
          message: templateSid ? `Template: ${templateSid}` : message,
          status: 'failed',
          error_message: error.message,
          sent_at: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Error logging failure:', logError);
      }

      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
