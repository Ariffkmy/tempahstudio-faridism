// =============================================
// TWILIO WHATSAPP SERVICE
// =============================================
// Client-side service for managing Twilio WhatsApp settings
// Handles database operations for Twilio WhatsApp configuration

import { supabase } from '@/lib/supabase';

// =============================================
// TWILIO WHATSAPP CONFIGURATION MANAGEMENT
// =============================================

/**
 * Get Twilio settings
 */
export async function getTwilioSettings(): Promise<{
  success: boolean;
  settings?: {
    id: string;
    twilio_sid: string;
    twilio_auth_token: string;
    twilio_whatsapp_number: string;
    created_at: string;
    updated_at: string;
  };
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('twilio_settings')
      .select('*')
      .single();

    if (error) {
      // If no settings exist, return default empty settings
      if (error.code === 'PGRST116') {
        return {
          success: true,
          settings: {
            id: '',
            twilio_sid: '',
            twilio_auth_token: '',
            twilio_whatsapp_number: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        };
      }

      console.error('Failed to fetch Twilio settings:', error);
      return { success: false, error: error.message };
    }

    return { success: true, settings: data };
  } catch (error) {
    console.error('Error fetching Twilio settings:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Update Twilio settings
 */
export async function updateTwilioSettings(updates: {
  twilio_sid?: string;
  twilio_auth_token?: string;
  twilio_whatsapp_number?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if settings already exist
    const { data: existingSettings, error: fetchError } = await supabase
      .from('twilio_settings')
      .select('*')
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Failed to check existing Twilio settings:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (existingSettings) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from('twilio_settings')
        .update(updates)
        .eq('id', existingSettings.id);

      if (updateError) {
        console.error('Failed to update Twilio settings:', updateError);
        return { success: false, error: updateError.message };
      }
    } else {
      // Create new settings
      const { error: insertError } = await supabase
        .from('twilio_settings')
        .insert(updates);

      if (insertError) {
        console.error('Failed to create Twilio settings:', insertError);
        return { success: false, error: insertError.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating Twilio settings:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<{
  success: boolean;
  sid?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp-twilio', {
      body: {
        phoneNumber,
        message,
      },
    });

    if (error) {
      console.error('Error sending WhatsApp message:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error) {
    console.error('Error calling Twilio whatsApp function:', error);
    return { success: false, error: 'Unexpected error occurred while sending WhatsApp message' };
  }
}
