import { supabase } from '@/lib/supabase';

export interface GoogleOAuthSettings {
    id: string;
    client_id: string;
    client_secret: string;
    created_at: string;
    updated_at: string;
}

/**
 * Get Google OAuth settings (super admin only)
 */
export async function getGoogleOAuthSettings(): Promise<{
    success: boolean;
    settings?: GoogleOAuthSettings;
    error?: string;
}> {
    try {
        const { data, error } = await supabase
            .from('google_oauth_settings')
            .select('*')
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Error fetching Google OAuth settings:', error);
            return { success: false, error: error.message };
        }

        return { success: true, settings: data || undefined };
    } catch (error) {
        console.error('Error fetching Google OAuth settings:', error);
        return { success: false, error: 'Failed to fetch Google OAuth settings' };
    }
}

/**
 * Update Google OAuth settings (super admin only)
 */
export async function updateGoogleOAuthSettings(settings: {
    client_id: string;
    client_secret: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        // First, check if settings exist
        const { data: existing } = await supabase
            .from('google_oauth_settings')
            .select('id')
            .limit(1)
            .maybeSingle();

        let result;
        if (existing) {
            // Update existing settings
            result = await supabase
                .from('google_oauth_settings')
                .update({
                    client_id: settings.client_id,
                    client_secret: settings.client_secret,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);
        } else {
            // Insert new settings
            result = await supabase
                .from('google_oauth_settings')
                .insert({
                    client_id: settings.client_id,
                    client_secret: settings.client_secret,
                });
        }

        if (result.error) {
            console.error('Error updating Google OAuth settings:', result.error);
            return { success: false, error: result.error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating Google OAuth settings:', error);
        return { success: false, error: 'Failed to update Google OAuth settings' };
    }
}
