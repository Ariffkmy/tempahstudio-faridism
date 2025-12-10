import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================
// SEND WHATSAPP MESSAGE VIA TWILIO
// =============================================
// Supabase Edge Function for sending WhatsApp messages via Twilio REST API
// Uses direct HTTP calls to avoid SDK compatibility issues with Deno

interface WhatsAppRequest {
  phoneNumber: string;  // Recipients phone number (including country code)
  message: string;      // The message to send
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
    const { phoneNumber, message }: WhatsAppRequest = await req.json();

    console.log(`Processing WhatsApp message to: ${phoneNumber}`);

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

    // Step 2: Format phone number (ensure + prefix)
    let formattedPhone = phoneNumber;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Step 3: Send WhatsApp message via Twilio REST API
    try {
      console.log(`Sending WhatsApp from: ${twilioSettings.twilio_whatsapp_number} to: ${formattedPhone}`);

      // Twilio REST API URL
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSettings.twilio_sid}/Messages.json`;

      // Prepare parameters for Twilio API
      const requestBody = {
        From: `whatsapp:${twilioSettings.twilio_whatsapp_number}`,
        To: `whatsapp:${formattedPhone}`,
        Body: message
      };

      console.log('Twilio API Request:', {
        url: twilioUrl,
        from: requestBody.From,
        to: requestBody.To,
        body: message.substring(0, 50) + '...',
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

      console.log('WhatsApp message sent successfully:', responseData.sid);

      // Optional: Log the message sending
      await supabase
        .from('whatsapp_logs')
        .insert({
          phone_number: formattedPhone,
          message: message,
          twilio_sid: responseData.sid,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .catch((err: any) => {
          console.warn('Failed to log WhatsApp message:', err);
        });

      return new Response(
        JSON.stringify({
          success: true,
          sid: responseData.sid,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (twilioError: any) {
      console.error('Twilio API error:', twilioError);

      // Log the failure
      await supabase
        .from('whatsapp_logs')
        .insert({
          phone_number: formattedPhone,
          message: message,
          status: 'failed',
          error_message: JSON.stringify(twilioError),
        })
        .catch(err => {
          console.warn('Failed to log WhatsApp message failure:', err);
        });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to send WhatsApp message',
          details: twilioError.message || 'Twilio API error',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Unexpected error in send-whatsapp-twilio:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unexpected error occurred',
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
