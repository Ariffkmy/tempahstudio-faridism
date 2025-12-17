import { supabase } from '@/lib/supabase';

export interface Package {
    id: string;
    name: string;
    slug: string;
    price: number;
    period: string;
    minute_package?: number | null;
    is_popular: boolean;
    features: string[];
    is_active: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface CreatePackageInput {
    name: string;
    slug: string;
    price: number;
    period: string;
    minute_package?: number;
    is_popular: boolean;
    features: string[];
    is_active: boolean;
    display_order: number;
}

export interface UpdatePackageInput extends Partial<CreatePackageInput> {
    id: string;
}

/**
 * Get all packages (active only for public, all for super admin)
 */
export async function getPackages(includeInactive = false): Promise<Package[]> {
    let query = supabase
        .from('packages')
        .select('*')
        .order('display_order', { ascending: true });

    if (!includeInactive) {
        query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching packages:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get a single package by slug
 */
export async function getPackageBySlug(slug: string): Promise<Package | null> {
    const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (error) {
        console.error('Error fetching package:', error);
        return null;
    }

    return data;
}

/**
 * Create a new package (super admin only)
 */
export async function createPackage(input: CreatePackageInput): Promise<{ success: boolean; error?: string; data?: Package }> {
    const { data, error } = await supabase
        .from('packages')
        .insert([input])
        .select()
        .single();

    if (error) {
        console.error('Error creating package:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

/**
 * Update an existing package (super admin only)
 */
export async function updatePackage(input: UpdatePackageInput): Promise<{ success: boolean; error?: string; data?: Package }> {
    const { id, ...updateData } = input;

    const { data, error } = await supabase
        .from('packages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating package:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

/**
 * Delete a package (super admin only)
 */
export async function deletePackage(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting package:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Toggle package active status
 */
export async function togglePackageActive(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('packages')
        .update({ is_active: isActive })
        .eq('id', id);

    if (error) {
        console.error('Error toggling package active status:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Set package as popular (and unset others)
 */
export async function setPackageAsPopular(id: string): Promise<{ success: boolean; error?: string }> {
    // First, unset all packages as popular
    const { error: unsetError } = await supabase
        .from('packages')
        .update({ is_popular: false })
        .neq('id', id);

    if (unsetError) {
        console.error('Error unsetting popular packages:', unsetError);
        return { success: false, error: unsetError.message };
    }

    // Then set the selected package as popular
    const { error: setError } = await supabase
        .from('packages')
        .update({ is_popular: true })
        .eq('id', id);

    if (setError) {
        console.error('Error setting package as popular:', setError);
        return { success: false, error: setError.message };
    }

    return { success: true };
}
