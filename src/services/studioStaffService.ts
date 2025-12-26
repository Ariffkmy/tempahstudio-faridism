import { supabase } from '@/lib/supabase';
import type { StudioStaff, StudioStaffInsert, StaffRole } from '@/types/studioStaff';

/**
 * Get all staff members for a studio, optionally filtered by role
 */
export async function getStudioStaff(
    studioId: string,
    role?: StaffRole
): Promise<StudioStaff[]> {
    try {
        let query = supabase
            .from('studio_staff')
            .select('*')
            .eq('studio_id', studioId)
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (role) {
            query = query.eq('role', role);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching studio staff:', error);
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error in getStudioStaff:', error);
        throw error;
    }
}

/**
 * Get active photographers for a studio
 */
export async function getActivePhotographers(studioId: string): Promise<StudioStaff[]> {
    return getStudioStaff(studioId, 'Photographer');
}

/**
 * Get active editors for a studio
 */
export async function getActiveEditors(studioId: string): Promise<StudioStaff[]> {
    return getStudioStaff(studioId, 'Editor');
}

/**
 * Create a new staff member
 */
export async function createStaff(
    studioId: string,
    name: string,
    role: StaffRole
): Promise<{ success: boolean; data?: StudioStaff; error?: string }> {
    try {
        const staffData: StudioStaffInsert = {
            studio_id: studioId,
            name: name.trim(),
            role,
        };

        const { data, error } = await supabase
            .from('studio_staff')
            .insert(staffData)
            .select()
            .single();

        if (error) {
            console.error('Error creating staff:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error('Error in createStaff:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update a staff member's name
 */
export async function updateStaff(
    staffId: string,
    name: string
): Promise<{ success: boolean; data?: StudioStaff; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('studio_staff')
            .update({ name: name.trim() })
            .eq('id', staffId)
            .select()
            .single();

        if (error) {
            console.error('Error updating staff:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error('Error in updateStaff:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a staff member (soft delete by setting is_active to false)
 */
export async function deleteStaff(
    staffId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('studio_staff')
            .update({ is_active: false })
            .eq('id', staffId);

        if (error) {
            console.error('Error deleting staff:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error in deleteStaff:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get a single staff member by ID
 */
export async function getStaffById(staffId: string): Promise<StudioStaff | null> {
    try {
        const { data, error } = await supabase
            .from('studio_staff')
            .select('*')
            .eq('id', staffId)
            .single();

        if (error) {
            console.error('Error fetching staff by ID:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in getStaffById:', error);
        return null;
    }
}
