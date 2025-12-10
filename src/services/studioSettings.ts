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

  // Booking form customization
  enableCustomHeader: boolean;
  enableCustomFooter: boolean;
  enableWhatsappButton: boolean;
  headerLogo: string;
  headerHomeEnabled: boolean;
  headerHomeUrl: string;
  headerAboutEnabled: boolean;
  headerAboutUrl: string;
  headerPortfolioEnabled: boolean;
  headerPortfolioUrl: string;
  headerContactEnabled: boolean;
  headerContactUrl: string;
  footerWhatsappLink: string;
  footerFacebookLink: string;
  footerInstagramLink: string;
  footerTrademark: string;
  whatsappMessage: string;
  brandColorPrimary: string;
  brandColorSecondary: string;

  // Portfolio photo upload settings
  enablePortfolioPhotoUpload: boolean;
  portfolioUploadInstructions: string;
  portfolioMaxFileSize: number;
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
      // Booking form customization
      enableCustomHeader: studio.enable_custom_header || false,
      enableCustomFooter: studio.enable_custom_footer || false,
      enableWhatsappButton: studio.enable_whatsapp_button || false,
      headerLogo: studio.header_logo || '',
      headerHomeEnabled: studio.header_home_enabled || false,
      headerHomeUrl: studio.header_home_url || '',
      headerAboutEnabled: studio.header_about_enabled || false,
      headerAboutUrl: studio.header_about_url || '',
      headerPortfolioEnabled: studio.header_portfolio_enabled || false,
      headerPortfolioUrl: studio.header_portfolio_url || '',
      headerContactEnabled: studio.header_contact_enabled || false,
      headerContactUrl: studio.header_contact_url || '',
      footerWhatsappLink: studio.footer_whatsapp_link || '',
      footerFacebookLink: studio.footer_facebook_link || '',
      footerInstagramLink: studio.footer_instagram_link || '',
      footerTrademark: studio.footer_trademark || '© 2025 {{BrandName}}. All rights reserved.',
      whatsappMessage: studio.whatsapp_message || 'Hubungi kami',
      brandColorPrimary: studio.brand_color_primary || '#000000',
      brandColorSecondary: studio.brand_color_secondary || '#ffffff',
      enablePortfolioPhotoUpload: (studio as any).enable_portfolio_photo_upload || false,
      portfolioUploadInstructions: (studio as any).portfolio_upload_instructions || 'Upload your photos for your portfolio session. Maximum 20 photos, each file up to 10MB.',
      portfolioMaxFileSize: (studio as any).portfolio_max_file_size || 10,
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
export async function saveStudioSettings(
  settings: StudioSettings,
  layouts: StudioLayout[],
  studioId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current admin to find their studio
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, error: 'No authenticated user' };
    }

    let targetStudioId = studioId;
    if (!targetStudioId) {
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

      targetStudioId = adminUser.studio_id;
    }

    console.log('[saveStudioSettings] target studio:', targetStudioId);
    console.log('[saveStudioSettings] payload:', {
      name: settings.studioName,
      location: settings.studioLocation,
      email: settings.studioEmail,
      google_maps_link: settings.googleMapsLink,
      waze_link: settings.wazeLink,
      bank_account_number: settings.bankAccountNumber,
      account_owner_name: settings.accountOwnerName,
      qr_code: settings.qrCode,
      studio_logo: settings.studioLogo,
      booking_link: settings.bookingLink,
      google_calendar_enabled: settings.googleCalendarEnabled,
      google_calendar_id: settings.googleCalendarId,
      enable_custom_header: settings.enableCustomHeader,
      enable_custom_footer: settings.enableCustomFooter,
      enable_whatsapp_button: settings.enableWhatsappButton,
      header_logo: settings.headerLogo,
      header_home_enabled: settings.headerHomeEnabled,
      header_home_url: settings.headerHomeUrl,
      header_about_enabled: settings.headerAboutEnabled,
      header_about_url: settings.headerAboutUrl,
      header_portfolio_enabled: settings.headerPortfolioEnabled,
      header_portfolio_url: settings.headerPortfolioUrl,
      header_contact_enabled: settings.headerContactEnabled,
      header_contact_url: settings.headerContactUrl,
      footer_whatsapp_link: settings.footerWhatsappLink,
      footer_facebook_link: settings.footerFacebookLink,
      footer_instagram_link: settings.footerInstagramLink,
      footer_trademark: settings.footerTrademark,
      whatsapp_message: settings.whatsappMessage,
      brand_color_primary: settings.brandColorPrimary,
      brand_color_secondary: settings.brandColorSecondary,
    });

    // Update studio settings
    const { data: studioUpdate, error: studioError } = await supabase
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
        studio_logo: settings.studioLogo,
        booking_link: settings.bookingLink,
        google_calendar_enabled: settings.googleCalendarEnabled,
        google_calendar_id: settings.googleCalendarId,
        // Booking form customization
        enable_custom_header: settings.enableCustomHeader,
        enable_custom_footer: settings.enableCustomFooter,
        enable_whatsapp_button: settings.enableWhatsappButton,
        header_logo: settings.headerLogo,
        header_home_enabled: settings.headerHomeEnabled,
        header_home_url: settings.headerHomeUrl,
        header_about_enabled: settings.headerAboutEnabled,
        header_about_url: settings.headerAboutUrl,
        header_portfolio_enabled: settings.headerPortfolioEnabled,
        header_portfolio_url: settings.headerPortfolioUrl,
        header_contact_enabled: settings.headerContactEnabled,
        header_contact_url: settings.headerContactUrl,
        footer_whatsapp_link: settings.footerWhatsappLink,
        footer_facebook_link: settings.footerFacebookLink,
        footer_instagram_link: settings.footerInstagramLink,
        footer_trademark: settings.footerTrademark,
        whatsapp_message: settings.whatsappMessage,
        brand_color_primary: settings.brandColorPrimary,
        brand_color_secondary: settings.brandColorSecondary,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetStudioId)
      .select('id, studio_logo')
      .single();

    if (studioError) {
      console.error('Failed to update studio:', studioError);
      console.error('Payload that failed:', settings);
      return { success: false, error: 'Failed to update studio settings' };
    }

    if (!studioUpdate) {
      console.error('Update returned no data for studio:', targetStudioId);
      return { success: false, error: 'Studio update returned no data' };
    }

    console.log('[saveStudioSettings] updated studio:', studioUpdate);

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
export async function updateStudioLayouts(layouts: StudioLayout[], studioId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current admin to find their studio
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, error: 'No authenticated user' };
    }

    let targetStudioId = studioId;
    if (!targetStudioId) {
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

      targetStudioId = adminUser.studio_id;
    }

    // For simplicity, delete all existing layouts and insert new ones
    // In a production app, you'd want to do proper diffing

    // Delete existing layouts
    const { error: deleteError } = await supabase
      .from('studio_layouts')
      .delete()
      .eq('studio_id', targetStudioId);

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

/**
 * Load portfolio photos for a specific studio
 */
export async function loadStudioPortfolioPhotos(studioId?: string): Promise<string[]> {
  try {
    // Get current admin to validate permissions
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return [];
    }

    if (!studioId) {
      // Get current admin's studio
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('studio_id')
        .eq('auth_user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (adminError || !adminUser) {
        console.error('Failed to find admin studio:', adminError);
        return [];
      }

      studioId = adminUser.studio_id;
    }

    // Load portfolio photos
    const { data: photos, error: photosError } = await supabase
      .from('portfolio_photos')
      .select('photo_url')
      .eq('studio_id', studioId)
      .order('uploaded_at', { ascending: false });

    if (photosError) {
      console.error('Failed to load portfolio photos:', photosError);
      return [];
    }

    return (photos || []).map(photo => photo.photo_url);
  } catch (error) {
    console.error('Error loading portfolio photos:', error);
    return [];
  }
}

/**
 * Delete a portfolio photo record for a studio
 */
export async function deleteStudioPortfolioPhoto(photoUrl: string, studioId?: string): Promise<boolean> {
  try {
    // Validate session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return false;
    }

    // Resolve studio id if not provided
    if (!studioId) {
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('studio_id')
        .eq('auth_user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (adminError || !adminUser) {
        console.error('Failed to find admin studio:', adminError);
        return false;
      }

      studioId = adminUser.studio_id;
    }

    const { error } = await supabase
      .from('portfolio_photos')
      .delete()
      .eq('studio_id', studioId)
      .eq('photo_url', photoUrl);

    if (error) {
      console.error('Failed to delete portfolio photo record:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting portfolio photo record:', error);
    return false;
  }
}