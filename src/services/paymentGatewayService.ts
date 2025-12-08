// =============================================
// PAYMENT GATEWAY SERVICE
// =============================================
// Client-side service for managing payment gateway settings
// Handles database operations for payment gateway configuration

import { supabase } from '@/lib/supabase';

// =============================================
// PAYMENT GATEWAY CONFIGURATION MANAGEMENT
// =============================================

/**
 * Get payment gateway settings
 */
export async function getPaymentGatewaySettings(): Promise<{
  success: boolean;
  settings?: {
    id: string;
    user_secret_key: string;
    category_code: string;
    created_at: string;
    updated_at: string;
  };
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('payment_gateway_settings')
      .select('*')
      .single();

    if (error) {
      // If no settings exist, return default empty settings
      if (error.code === 'PGRST116') {
        return {
          success: true,
          settings: {
            id: '',
            user_secret_key: '',
            category_code: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        };
      }

      console.error('Failed to fetch payment gateway settings:', error);
      return { success: false, error: error.message };
    }

    return { success: true, settings: data };
  } catch (error) {
    console.error('Error fetching payment gateway settings:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Update payment gateway settings
 */
export async function updatePaymentGatewaySettings(updates: {
  user_secret_key?: string;
  category_code?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if settings already exist
    const { data: existingSettings, error: fetchError } = await supabase
      .from('payment_gateway_settings')
      .select('*')
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Failed to check existing payment gateway settings:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (existingSettings) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from('payment_gateway_settings')
        .update(updates)
        .eq('id', existingSettings.id);

      if (updateError) {
        console.error('Failed to update payment gateway settings:', updateError);
        return { success: false, error: updateError.message };
      }
    } else {
      // Create new settings
      const { error: insertError } = await supabase
        .from('payment_gateway_settings')
        .insert(updates);

      if (insertError) {
        console.error('Failed to create payment gateway settings:', insertError);
        return { success: false, error: insertError.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating payment gateway settings:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}
