import { supabase } from '@/lib/supabase';

/**
 * Upload booking receipt file to storage
 */
export async function uploadBookingReceipt(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `booking-receipt-${Date.now()}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('booking-payments')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('booking-payments')
            .getPublicUrl(filePath);

        return { success: true, url: publicUrl };
    } catch (error: any) {
        console.error('Error uploading booking receipt:', error);
        return { success: false, error: error.message || 'Failed to upload receipt' };
    }
}

/**
 * Upload booking payment proof file to storage
 */
export async function uploadBookingPaymentProof(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `booking-proof-${Date.now()}.${fileExt}`;
        const filePath = `proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('booking-payments')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('booking-payments')
            .getPublicUrl(filePath);

        return { success: true, url: publicUrl };
    } catch (error: any) {
        console.error('Error uploading payment proof:', error);
        return { success: false, error: error.message || 'Failed to upload payment proof' };
    }
}
