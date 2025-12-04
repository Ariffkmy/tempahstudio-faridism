// =============================================
// ADMIN AUTHENTICATION SERVICE
// =============================================
// Handles admin user registration, login, and session management
// Key: 1 admin belongs to 1 studio, but 1 studio can have multiple admins

import { supabase } from '@/lib/supabase';
import type { 
  AdminUser, 
  AdminUserInsert, 
  AdminRegistrationData, 
  AdminLoginData,
  Studio,
  AdminUserWithStudio
} from '@/types/database';

// Default company ID (Raya Studio KL)
const DEFAULT_COMPANY_ID = 'a0000000-0000-0000-0000-000000000001';

// =============================================
// REGISTRATION
// =============================================

/**
 * Register a new admin user
 * Steps:
 * 1. Create a new studio with the provided name
 * 2. Create auth user in Supabase Auth
 * 3. Create admin_users record linked to the auth user and new studio
 */
export async function registerAdmin(data: AdminRegistrationData): Promise<{
  success: boolean;
  user?: AdminUser;
  error?: string;
}> {
  try {
    // Step 1: Create a new studio
    const { data: newStudio, error: studioError } = await supabase
      .from('studios')
      .insert({
        company_id: DEFAULT_COMPANY_ID,
        name: data.studio_name,
        location: data.studio_location || null,
        is_active: true,
      })
      .select()
      .single();

    if (studioError) {
      console.error('Failed to create studio:', studioError);
      return {
        success: false,
        error: 'Gagal membuat studio. Sila cuba lagi.',
      };
    }

    // Step 2: Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          studio_id: newStudio.id,
        },
      },
    });

    if (authError) {
      // Rollback: Delete the created studio
      await supabase.from('studios').delete().eq('id', newStudio.id);
      
      // Handle specific errors
      if (authError.message.includes('already registered')) {
        return {
          success: false,
          error: 'Emel ini telah didaftarkan',
        };
      }
      return {
        success: false,
        error: authError.message,
      };
    }

    if (!authData.user) {
      // Rollback: Delete the created studio
      await supabase.from('studios').delete().eq('id', newStudio.id);
      return {
        success: false,
        error: 'Gagal membuat akaun pengguna',
      };
    }

    // Step 3: Create admin_users record
    const adminUserData: AdminUserInsert = {
      auth_user_id: authData.user.id,
      studio_id: newStudio.id,
      email: data.email,
      full_name: data.full_name,
      phone: data.phone || null,
      role: 'admin', // Default role for new registrations
    };

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .insert(adminUserData)
      .select()
      .single();

    if (adminError) {
      // Rollback: Delete the created studio (auth user cannot be easily deleted from client)
      await supabase.from('studios').delete().eq('id', newStudio.id);
      console.error('Failed to create admin user record:', adminError);
      return {
        success: false,
        error: 'Gagal menyimpan maklumat admin. Sila cuba lagi.',
      };
    }



    return {
      success: true,
      user: adminUser,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Ralat tidak dijangka berlaku. Sila cuba lagi.',
    };
  }
}

// =============================================
// LOGIN
// =============================================

/**
 * Login admin user
 * Returns the admin user with their associated studio
 */
export async function loginAdmin(data: AdminLoginData): Promise<{
  success: boolean;
  user?: AdminUserWithStudio;
  error?: string;
}> {
  try {
    // Step 1: Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        return {
          success: false,
          error: 'Emel atau kata laluan tidak sah',
        };
      }
      return {
        success: false,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Gagal log masuk',
      };
    }

    // Step 2: Get admin_users record with studio info
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        *,
        studio:studios(*)
      `)
      .eq('auth_user_id', authData.user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      // User exists in auth but not in admin_users table
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Akaun admin tidak dijumpai atau tidak aktif',
      };
    }

    // Step 3: Update last login timestamp
    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', adminUser.id);

    return {
      success: true,
      user: adminUser as AdminUserWithStudio,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Ralat tidak dijangka berlaku. Sila cuba lagi.',
    };
  }
}

// =============================================
// LOGOUT
// =============================================

/**
 * Logout current admin user
 */
export async function logoutAdmin(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: 'Gagal log keluar',
    };
  }
}

// =============================================
// SESSION MANAGEMENT
// =============================================

/**
 * Get current authenticated admin user with studio info
 */
export async function getCurrentAdmin(): Promise<AdminUserWithStudio | null> {
  try {
    console.log('getCurrentAdmin: Getting session...');
    // Get current auth session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('getCurrentAdmin: Session error:', sessionError);
      return null;
    }
    
    if (!session?.user) {
      console.log('getCurrentAdmin: No session or user found');
      return null;
    }

    console.log('getCurrentAdmin: Session found for user:', session.user.id);

    // Get admin_users record with studio info
    console.log('getCurrentAdmin: Fetching admin_users record...');
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select(`
        *,
        studio:studios(*)
      `)
      .eq('auth_user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('getCurrentAdmin: Error fetching admin user:', error);
      return null;
    }
    
    if (!adminUser) {
      console.log('getCurrentAdmin: No admin user found for auth_user_id:', session.user.id);
      return null;
    }

    console.log('getCurrentAdmin: Admin user found:', adminUser.email);
    return adminUser as AdminUserWithStudio;
  } catch (error) {
    console.error('getCurrentAdmin: Unexpected error:', error);
    return null;
  }
}

/**
 * Check if current user is authenticated as admin
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const admin = await getCurrentAdmin();
  return admin !== null;
}

/**
 * Get the studio ID for the current admin
 */
export async function getAdminStudioId(): Promise<string | null> {
  const admin = await getCurrentAdmin();
  return admin?.studio_id || null;
}

// =============================================
// STUDIO-SPECIFIC OPERATIONS
// =============================================

/**
 * Get all studios (for reference purposes)
 */
export async function getAvailableStudios(): Promise<Studio[]> {
  try {
    const { data, error } = await supabase
      .from('studios')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching studios:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching studios:', error);
    return [];
  }
}

/**
 * Get admins for a specific studio
 * Only accessible by admins of the same studio
 */
export async function getStudioAdmins(studioId: string): Promise<AdminUser[]> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('studio_id', studioId)
      .eq('is_active', true)
      .order('full_name');

    if (error) {
      console.error('Error fetching studio admins:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching studio admins:', error);
    return [];
  }
}

// =============================================
// PASSWORD MANAGEMENT
// =============================================

/**
 * Request password reset email
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'Gagal menghantar emel tetapan semula kata laluan',
    };
  }
}

/**
 * Update password (for logged-in users)
 */
export async function updatePassword(newPassword: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Password update error:', error);
    return {
      success: false,
      error: 'Gagal mengemaskini kata laluan',
    };
  }
}

// =============================================
// PROFILE MANAGEMENT
// =============================================

/**
 * Update admin profile
 */
export async function updateAdminProfile(
  adminId: string,
  updates: { full_name?: string; phone?: string }
): Promise<{
  success: boolean;
  user?: AdminUser;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', adminId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      user: data,
    };
  } catch (error) {
    console.error('Profile update error:', error);
    return {
      success: false,
      error: 'Gagal mengemaskini profil',
    };
  }
}

// =============================================
// AUTH STATE LISTENER
// =============================================

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}
