import { supabase } from '@/lib/supabase';

export interface PaymentSettings {
    id: string;
    qr_code_image: string | null;
    bank_name: string | null;
    account_number: string | null;
    account_owner_name: string | null;
    fpx_enabled: boolean;
    terms_pdf: string | null;
    privacy_policy_pdf: string | null;
    created_at: string;
    updated_at: string;
}

export interface UpdatePaymentSettingsInput {
    qr_code_image?: string | null;
    bank_name?: string | null;
    account_number?: string | null;
    account_owner_name?: string | null;
    fpx_enabled?: boolean;
    terms_pdf?: string | null;
    privacy_policy_pdf?: string | null;
}

/**
 * Get payment settings
 */
export async function getPaymentSettings(): Promise<{ success: boolean; settings?: PaymentSettings; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('payment_settings')
            .select('*')
            .limit(1)
            .single();

        if (error) {
            console.error('Error fetching payment settings:', error);
            return { success: false, error: error.message };
        }

        return { success: true, settings: data };
    } catch (error) {
        console.error('Error fetching payment settings:', error);
        return { success: false, error: 'Failed to fetch payment settings' };
    }
}

/**
 * Update payment settings
 */
export async function updatePaymentSettings(input: UpdatePaymentSettingsInput): Promise<{ success: boolean; settings?: PaymentSettings; error?: string }> {
    try {
        // First, get the existing settings to get the ID
        const { data: existing, error: fetchError } = await supabase
            .from('payment_settings')
            .select('id')
            .limit(1)
            .single();

        if (fetchError) {
            console.error('Error fetching existing payment settings:', fetchError);
            return { success: false, error: fetchError.message };
        }

        // Update the settings
        const { data, error } = await supabase
            .from('payment_settings')
            .update(input)
            .eq('id', existing.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating payment settings:', error);
            return { success: false, error: error.message };
        }

        return { success: true, settings: data };
    } catch (error) {
        console.error('Error updating payment settings:', error);
        return { success: false, error: 'Failed to update payment settings' };
    }
}
