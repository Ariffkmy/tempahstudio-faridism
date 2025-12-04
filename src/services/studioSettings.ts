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
}

export interface StudioSettingsWithLayouts extends StudioSettings {
  layouts: StudioLayout[];
}

/**
 * Load studio settings for the current admin's studio
 */
export async function loadStudioSettings(): Promise<StudioSettingsWithLayouts | null> {
  try {
    // Get current admin to find their studio
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return null;
    }

    // Get admin user with studio info
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

    const studio = adminUser.studio as Studio;

    // Get studio layouts
    const { data: layouts, error: layoutsError } = await supabase
      .from('studio_layouts')
      .select('*')
      .eq('studio_id', studio.id)
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
      ownerName: adminUser.full_name || '',
      ownerPhone: adminUser.phone || '',
      bankAccountNumber: studio.bank_account_number || '',
      accountOwnerName: studio.account_owner_name || '',
      qrCode: studio.qr_code || '',
      bookingLink: studio.booking_link || '',
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