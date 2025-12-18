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
  AdminUserWithStudio,
  AdminRole
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
    // Find the latest package payment for this email to set the package_name
    let packageName = null;
    try {
      const { data: paymentData } = await supabase
        .from('package_payments')
        .select('package_name')
        .eq('email', data.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (paymentData) {
        packageName = paymentData.package_name;
      }
    } catch (err) {
      console.error('Error looking up package payment during registration:', err);
    }

    // Step 1: Create a new studio
    const { data: newStudio, error: studioError } = await supabase
      .from('studios')
      .insert({
        company_id: DEFAULT_COMPANY_ID,
        name: data.studio_name,
        location: data.studio_location || null,
        is_active: true,
        package_name: packageName,
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



    // Send welcome email notification
    try {
      // Import email service dynamically to avoid circular imports
      const { sendAdminWelcomeEmail } = await import('@/services/emailService');

      // Get studio details for email
      const { data: studioDetails } = await supabase
        .from('studios')
        .select('name')
        .eq('id', newStudio.id)
        .single();

      await sendAdminWelcomeEmail(data.email, {
        full_name: data.full_name,
        studio_name: studioDetails?.name || newStudio.name,
      });
    } catch (emailError) {
      // Log email error but don't fail registration
      console.error('Failed to send admin welcome email:', emailError);
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

    // Step 2: Get admin_users record
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
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

    // Step 4: Handle studio info based on role
    let userWithStudio: AdminUserWithStudio;

    if (adminUser.role === 'super_admin') {
      userWithStudio = {
        ...adminUser,
        studio: null
      } as AdminUserWithStudio;
    } else {
      // For regular admins, fetch studio info
      const { data: studio, error: studioError } = await supabase
        .from('studios')
        .select('*')
        .eq('id', adminUser.studio_id)
        .single();

      if (studioError || !studio) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Studio tidak dijumpai',
        };
      }

      userWithStudio = {
        ...adminUser,
        studio
      } as AdminUserWithStudio;
    }

    return {
      success: true,
      user: userWithStudio,
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
 * Note: Super admins don't have a studio, so studio will be null for super admins
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

    // Get admin_users record
    console.log('getCurrentAdmin: Fetching admin_users record...');
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
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

    console.log('getCurrentAdmin: Admin user found:', adminUser.email, 'Role:', adminUser.role);

    // If super admin, return without studio info
    if (adminUser.role === 'super_admin') {
      return {
        ...adminUser,
        studio: null
      } as AdminUserWithStudio;
    }

    // For regular admins, fetch studio info
    const { data: studio, error: studioError } = await supabase
      .from('studios')
      .select('*')
      .eq('id', adminUser.studio_id)
      .single();

    if (studioError) {
      console.error('getCurrentAdmin: Error fetching studio:', studioError);
      return null;
    }

    console.log('getCurrentAdmin: Studio found:', studio.name);
    return {
      ...adminUser,
      studio
    } as AdminUserWithStudio;
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
// SUPER ADMIN OPERATIONS
// =============================================

/**
 * Create a super admin user (only callable by existing super admins)
 */
export async function createSuperAdmin(data: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}): Promise<{
  success: boolean;
  user?: AdminUser;
  error?: string;
}> {
  try {
    // Check if current user is a super admin
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return {
        success: false,
        error: 'Only super admins can create other super admins',
      };
    }

    // Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
        },
      },
    });

    if (authError) {
      // Handle specific errors
      if (authError.message.includes('already registered')) {
        return {
          success: false,
          error: 'Email already registered',
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
        error: 'Failed to create user account',
      };
    }

    // Create super admin record
    const superAdminData: AdminUserInsert = {
      auth_user_id: authData.user.id,
      studio_id: null, // Super admins don't belong to a studio
      email: data.email,
      full_name: data.full_name,
      phone: data.phone || null,
      role: 'super_admin',
    };

    const { data: superAdmin, error: adminError } = await supabase
      .from('admin_users')
      .insert(superAdminData)
      .select()
      .single();

    if (adminError) {
      console.error('Failed to create super admin record:', adminError);
      return {
        success: false,
        error: 'Failed to save super admin information',
      };
    }

    return {
      success: true,
      user: superAdmin,
    };
  } catch (error) {
    console.error('Create super admin error:', error);
    return {
      success: false,
      error: 'Unexpected error occurred',
    };
  }
}

/**
 * Get all admin users (only for super admins)
 */
export async function getAllAdmins(): Promise<AdminUserWithStudio[]> {
  try {
    // Check if current user is a super admin
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return [];
    }

    const { data, error } = await supabase
      .from('admin_users')
      .select(`
        *,
        studio:studios(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admins:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
}

/**
 * Update admin user role (only for super admins)
 */
export async function updateAdminRole(
  adminId: string,
  newRole: AdminRole,
  studioId?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Check if current user is a super admin
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return {
        success: false,
        error: 'Only super admins can update admin roles',
      };
    }

    const updateData: Partial<AdminUserInsert> = {
      role: newRole,
    };

    // If changing to super_admin, studio_id must be null
    // If changing from super_admin to regular role, studio_id must be provided
    if (newRole === 'super_admin') {
      updateData.studio_id = null;
    } else if (studioId) {
      updateData.studio_id = studioId;
    }

    const { error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', adminId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Update admin role error:', error);
    return {
      success: false,
      error: 'Unexpected error occurred',
    };
  }
}

// =============================================
// STUDIO USER MANAGEMENT
// =============================================

/**
 * Create a new studio user (admin) without email verification
 * Only callable by admins (not staff) of the same studio
 */
export async function createStudioUser(data: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}): Promise<{
  success: boolean;
  user?: AdminUser;
  error?: string;
}> {
  try {
    // Get current admin to verify permissions and get studio_id
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Check if current user is staff (staff cannot create users)
    if (currentAdmin.role === 'staff') {
      return {
        success: false,
        error: 'Staff cannot create users',
      };
    }

    // Super admins don't have a studio_id, so they can't create studio users this way
    if (!currentAdmin.studio_id) {
      return {
        success: false,
        error: 'Super admins cannot create studio users via this method',
      };
    }

    // Get current session to get auth user ID
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return {
        success: false,
        error: 'Failed to get session',
      };
    }

    // Call Edge Function to create user
    const { data: result, error: functionError } = await supabase.functions.invoke('create-studio-user', {
      body: {
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone || null,
        studio_id: currentAdmin.studio_id,
        requesting_user_id: session.user.id,
      },
    });

    if (functionError) {
      console.error('Error calling create-studio-user function:', functionError);
      return {
        success: false,
        error: functionError.message || 'Failed to create user',
      };
    }

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to create user',
      };
    }

    return {
      success: true,
      user: result.user as AdminUser,
    };
  } catch (error) {
    console.error('Create studio user error:', error);
    return {
      success: false,
      error: 'Unexpected error occurred',
    };
  }
}

/**
 * Update a studio user's information
 * Only callable by admins (not staff) of the same studio
 */
export async function updateStudioUser(
  userId: string,
  updates: {
    full_name?: string;
    phone?: string;
    email?: string;
  }
): Promise<{
  success: boolean;
  user?: AdminUser;
  error?: string;
}> {
  try {
    // Get current admin to verify permissions
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Check if current user is staff (staff cannot update users)
    if (currentAdmin.role === 'staff') {
      return {
        success: false,
        error: 'Staff cannot update users',
      };
    }

    // Get the user to update
    const { data: userToUpdate, error: fetchError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !userToUpdate) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Verify the user belongs to the same studio (unless super admin)
    if (currentAdmin.role !== 'super_admin' && userToUpdate.studio_id !== currentAdmin.studio_id) {
      return {
        success: false,
        error: 'Cannot update users from other studios',
      };
    }

    // Update admin_users record
    const { data: updatedUser, error: updateError } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }

    return {
      success: true,
      user: updatedUser,
    };
  } catch (error) {
    console.error('Update studio user error:', error);
    return {
      success: false,
      error: 'Unexpected error occurred',
    };
  }
}

/**
 * Delete a studio user
 * Only callable by admins (not staff) of the same studio
 */
export async function deleteStudioUser(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get current admin to verify permissions
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Check if current user is staff (staff cannot delete users)
    if (currentAdmin.role === 'staff') {
      return {
        success: false,
        error: 'Staff cannot delete users',
      };
    }

    // Prevent deleting yourself
    if (currentAdmin.id === userId) {
      return {
        success: false,
        error: 'Cannot delete your own account',
      };
    }

    // Get the user to delete
    const { data: userToDelete, error: fetchError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !userToDelete) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Verify the user belongs to the same studio (unless super admin)
    if (currentAdmin.role !== 'super_admin' && userToDelete.studio_id !== currentAdmin.studio_id) {
      return {
        success: false,
        error: 'Cannot delete users from other studios',
      };
    }

    // Soft delete: set is_active to false
    const { error: deleteError } = await supabase
      .from('admin_users')
      .update({ is_active: false })
      .eq('id', userId);

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete studio user error:', error);
    return {
      success: false,
      error: 'Unexpected error occurred',
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
