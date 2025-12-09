// =============================================
// STUDIO SETTINGS SERVICE
// =============================================
// Handles loading and saving studio settings from/to database

import { supabase } from '@/lib/supabase';
import type { Studio, StudioLayout, AdminUser } from '@/types/database';

export interface StudioSettings {
  // Studio info
  studioName: string;
  studioLocation: string;
  studioEmail: string;
  googleMapsLink: string;
  wazeLink: string;

  // Owner info (from admin_users)
  ownerName: string;
  ownerPhone: string;

  // Banking info
  bankAccountNumber: string;
  accountOwnerName: string;
  qrCode: string;

  // Booking link
  bookingLink: string;

  // Google Calendar integration
  googleCalendarEnabled: boolean;
  googleCalendarId: string;
  googleClientId: string;
  googleClientSecret: string;
  googleClientIdConfigured: boolean;
  googleRefreshTokenConfigured: boolean;

  // Booking form settings
  termsConditionsType: string;
  termsConditionsText: string;
  termsConditionsPdf: string;
  timeSlotGap: number;
  studioLogo: string;
}

export interface StudioSettingsWithLayouts extends StudioSettings {
  layouts: StudioLayout[];
}

/**
 * Load studio settings for the provided studio ID, or current admin's studio if no ID provided
 */
export async function loadStudioSettings(studioId?: string): Promise<StudioSettingsWithLayouts | null> {
  try {
    // Get current admin to find their studio (and validate permissions)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return null;
    }

    let targetStudioId = studioId;
    let studio: Studio;
    let ownerName = '';
    let ownerPhone = '';

    if (studioId) {
      // Load specific studio by ID (for super admins)
      const { data: studioData, error: studioError } = await supabase
        .from('studios')
        .select('*')
        .eq('id', studioId)
        .single();

      if (studioError || !studioData) {
        console.error('Failed to load studio:', studioError);
        return null;
      }

      studio = studioData;

      // For super admin access, we can get owner info from admin_users table
      // Get first admin user for this studio
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('studio_id', studioId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (adminError) {
        console.warn('Failed to load admin user for studio, using default values:', adminError);
        ownerName = studio.name || '';
      } else {
        ownerName = adminUser.full_name || adminUser.email || '';
        ownerPhone = adminUser.phone || '';
      }
    } else {
      // Load current admin's studio (original behavior)
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select(`
          *,
          studio:studios(*)
        `)
        .eq('auth_user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (adminError || !adminUser) {
        console.error('Failed to load admin user:', adminError);
        return null;
      }

      studio = adminUser.studio as Studio;
      targetStudioId = studio.id;
      ownerName = adminUser.full_name || '';
      ownerPhone = adminUser.phone || '';
    }

    // Get studio layouts
    const { data: layouts, error: layoutsError } = await supabase
      .from('studio_layouts')
      .select('*')
      .eq('studio_id', targetStudioId)
      .order('name');

    if (layoutsError) {
      console.error('Failed to load studio layouts:', layoutsError);
      return null;
    }

    // Build settings object
    const settings: StudioSettingsWithLayouts = {
      studioName: studio.name || '',
      studioLocation: studio.location || '',
      studioEmail: studio.email || '',
      googleMapsLink: studio.google_maps_link || '',
      wazeLink: studio.waze_link || '',
      ownerName: ownerName,
      ownerPhone: ownerPhone,
      bankAccountNumber: studio.bank_account_number || '',
      accountOwnerName: studio.account_owner_name || '',
      qrCode: studio.qr_code || '',
      bookingLink: studio.booking_link || '',
      googleCalendarEnabled: studio.google_calendar_enabled || false,
      googleCalendarId: studio.google_calendar_id || 'primary',
      googleClientId: studio.google_client_id || '',
      googleClientSecret: studio.google_client_secret || '',
      googleClientIdConfigured: !!(studio.google_client_id),
      googleRefreshTokenConfigured: !!(studio.google_refresh_token),
      termsConditionsType: (studio as any).terms_conditions_type || 'none',
      termsConditionsText: (studio as any).terms_conditions_text || '',
      termsConditionsPdf: (studio as any).terms_conditions_pdf || '',
      timeSlotGap: (studio as any).time_slot_gap || 30,
      studioLogo: (studio as any).studio_logo || '',
      layouts: layouts || []
    };

    return settings;
  } catch (error) {
    console.error('Error loading studio settings:', error);
    return null;
  }
}

/**
 * Save studio settings to database
 */
export async function saveStudioSettings(settings: StudioSettings, layouts: StudioLayout[]): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current admin to find their studio
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, error: 'No authenticated user' };
    }

    // Get admin user with studio info
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('studio_id')
      .eq('auth_user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return { success: false, error: 'Failed to find admin studio' };
    }

    const studioId = adminUser.studio_id;

    // Update studio settings
    const { error: studioError } = await supabase
      .from('studios')
      .update({
        name: settings.studioName,
        location: settings.studioLocation,
        email: settings.studioEmail,
        google_maps_link: settings.googleMapsLink,
        waze_link: settings.wazeLink,
        bank_account_number: settings.bankAccountNumber,
        account_owner_name: settings.accountOwnerName,
        qr_code: settings.qrCode,
        booking_link: settings.bookingLink,
        google_calendar_enabled: settings.googleCalendarEnabled,
        google_calendar_id: settings.googleCalendarId,
        updated_at: new Date().toISOString()
      })
      .eq('id', studioId);

    if (studioError) {
      console.error('Failed to update studio:', studioError);
      return { success: false, error: 'Failed to update studio settings' };
    }

    // Update admin user (owner info)
    const { error: adminUpdateError } = await supabase
      .from('admin_users')
      .update({
        full_name: settings.ownerName,
        phone: settings.ownerPhone,
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', session.user.id);

    if (adminUpdateError) {
      console.error('Failed to update admin user:', adminUpdateError);
      return { success: false, error: 'Failed to update owner information' };
    }

    // Handle layouts - for now, we'll skip this part since it requires more complex logic
    // to handle inserts, updates, and deletes
    console.log('Layouts update skipped - requires additional implementation');

    return { success: true };
  } catch (error) {
    console.error('Error saving studio settings:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Update studio layouts (separate function for now)
 */
export async function updateStudioLayouts(layouts: StudioLayout[]): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current admin to find their studio
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, error: 'No authenticated user' };
    }

    // Get admin user with studio info
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('studio_id')
      .eq('auth_user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return { success: false, error: 'Failed to find admin studio' };
    }

    const studioId = adminUser.studio_id;

    // For simplicity, delete all existing layouts and insert new ones
    // In a production app, you'd want to do proper diffing

    // Delete existing layouts
    const { error: deleteError } = await supabase
      .from('studio_layouts')
      .delete()
      .eq('studio_id', studioId);

    if (deleteError) {
      console.error('Failed to delete existing layouts:', deleteError);
      return { success: false, error: 'Failed to update layouts' };
    }

    // Insert new layouts
    if (layouts.length > 0) {
      const layoutsToInsert = layouts.map(layout => ({
        studio_id: studioId,
        name: layout.name,
        description: layout.description,
        capacity: layout.capacity,
        price_per_hour: layout.price_per_hour,
        image: layout.image,
        is_active: layout.is_active
      }));

      const { error: insertError } = await supabase
        .from('studio_layouts')
        .insert(layoutsToInsert);

      if (insertError) {
        console.error('Failed to insert layouts:', insertError);
        return { success: false, error: 'Failed to save layouts' };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating studio layouts:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

// =============================================
// GOOGLE CALENDAR OAUTH
// =============================================

/**
 * Save Google OAuth credentials for a studio
 */
export async function saveGoogleCredentials(
  clientId: string,
  clientSecret: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, error: 'No authenticated user' };
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('studio_id')
      .eq('auth_user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return { success: false, error: 'Failed to find admin studio' };
    }

    const { error } = await supabase
      .from('studios')
      .update({
        google_client_id: clientId,
        google_client_secret: clientSecret,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminUser.studio_id);

    if (error) {
      console.error('Failed to save Google credentials:', error);
      return { success: false, error: 'Failed to save credentials' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving Google credentials:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Initiate Google OAuth authorization flow
 */
export async function initiateGoogleAuth(clientId: string): Promise<{ authUrl: string; state: string }> {
  const redirectUri = `${window.location.origin}/admin/settings`;
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent',
    state: state
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return { authUrl, state };
}

/**
 * Exchange authorization code for tokens and save them
 */
export async function exchangeGoogleCode(
  code: string,
  clientId: string,
  clientSecret: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, error: 'No authenticated user' };
    }

    // Exchange code for tokens directly (since Edge Functions aren't deployed)
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: `${window.location.origin}/admin/settings`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('OAuth token exchange failed:', errorText);
      return { success: false, error: `OAuth token exchange failed: ${tokenResponse.status} - ${errorText}` };
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token } = tokens;

    if (!access_token || !refresh_token) {
      return { success: false, error: 'Missing access_token or refresh_token in OAuth response' };
    }

    // Calculate token expiration (tokens are typically valid for 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Get admin user to find their studio
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('studio_id')
      .eq('auth_user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return { success: false, error: 'Failed to find admin studio' };
    }

    // Try to update the studio with the tokens
    // Note: This will only work if RLS allows it or if we use service role
    // For now, we'll use a direct approach but in production this should be server-side
    const { error: updateError } = await supabase
      .from('studios')
      .update({
        google_refresh_token: refresh_token,
        google_access_token: access_token,
        google_token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', adminUser.studio_id);

    if (updateError) {
      console.error('Failed to save tokens to database:', updateError);
      // Save tokens to localStorage as fallback for development
      localStorage.setItem('temp_google_refresh_token', refresh_token);
      localStorage.setItem('temp_google_access_token', access_token);
      localStorage.setItem('temp_google_token_expires_at', expiresAt.toISOString());
      return {
        success: false,
        error: `Failed to save tokens to database: ${updateError.message}. Tokens saved to localStorage for manual import.`
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error exchanging Google code:', error);
    return { success: false, error: 'Network error occurred' };
  }
}
