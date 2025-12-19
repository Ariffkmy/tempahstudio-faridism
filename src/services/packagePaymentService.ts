import { supabase } from '@/lib/supabase';

export interface PackagePayment {
    id: string;
    package_id: string | null;
    package_name: string;
    package_price: number;
    studio_name: string;
    full_name: string;
    email: string;
    phone: string;
    payment_method: string | null;
    receipt_url: string | null;
    status: 'pending' | 'verified' | 'rejected' | 'completed';
    verified_by: string | null;
    verified_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreatePackagePaymentInput {
    package_id?: string;
    package_name: string;
    package_price: number;
    studio_name: string;
    full_name: string;
    email: string;
    phone: string;
    payment_method?: string;
    receipt_url?: string;
}

export interface UpdatePackagePaymentInput {
    status?: 'pending' | 'verified' | 'rejected' | 'completed';
    notes?: string;
    verified_by?: string;
    verified_at?: string;
    package_name?: string;
}

/**
 * Create a new package payment submission
 */
export async function createPackagePayment(input: CreatePackagePaymentInput): Promise<{ success: boolean; payment?: PackagePayment; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('package_payments')
            .insert([input])
            .select()
            .single();

        if (error) {
            console.error('Error creating package payment:', error);
            return { success: false, error: error.message };
        }

        return { success: true, payment: data };
    } catch (error) {
        console.error('Error creating package payment:', error);
        return { success: false, error: 'Failed to submit payment' };
    }
}

/**
 * Get all package payments (super admin only)
 */
export async function getAllPackagePayments(): Promise<{ success: boolean; payments?: PackagePayment[]; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('package_payments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching package payments:', error);
            return { success: false, error: error.message };
        }

        return { success: true, payments: data };
    } catch (error) {
        console.error('Error fetching package payments:', error);
        return { success: false, error: 'Failed to fetch payments' };
    }
}

/**
 * Update package payment status
 */
export async function updatePackagePayment(id: string, input: UpdatePackagePaymentInput): Promise<{ success: boolean; payment?: PackagePayment; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('package_payments')
            .update(input)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating package payment:', error);
            return { success: false, error: error.message };
        }

        return { success: true, payment: data };
    } catch (error) {
        console.error('Error updating package payment:', error);
        return { success: false, error: 'Failed to update payment' };
    }
}

/**
 * Upload receipt file to storage
 */
export async function uploadReceipt(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `receipt-${Date.now()}.${fileExt}`;
        const filePath = `payment-receipts/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('public-assets')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('public-assets')
            .getPublicUrl(filePath);

        return { success: true, url: publicUrl };
    } catch (error: any) {
        console.error('Error uploading receipt:', error);
        return { success: false, error: error.message || 'Failed to upload receipt' };
    }
}
