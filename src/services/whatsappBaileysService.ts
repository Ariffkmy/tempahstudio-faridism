/**
 * WhatsApp Baileys Service
 * Frontend service to communicate with the WhatsApp backend service
 */

const WHATSAPP_SERVICE_URL = import.meta.env.VITE_WHATSAPP_SERVICE_URL || 'http://localhost:3001';

export interface WhatsAppConnectionStatus {
    isConnected: boolean;
    deviceInfo?: {
        name: string;
        phoneNumber: string;
        platform: string;
    };
    lastConnected?: string;
    hasQR?: boolean;
}

export interface WhatsAppContact {
    id: string;
    name: string;
    phone: string;
    isGroup?: boolean;
}

export interface BlastRecipient {
    phone: string;
    name?: string;
}

export interface BlastParams {
    studioId: string;
    recipients: BlastRecipient[];
    message: string;
}

export interface BlastResult {
    success: boolean;
    blastId: string;
    successCount: number;
    failCount: number;
    errors: Array<{ phone: string; error: string }>;
}

export interface BlastHistory {
    id: string;
    studio_id: string;
    message_template: string;
    message_type: string;
    total_recipients: number;
    successful_sends: number;
    failed_sends: number;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    started_at: string;
    completed_at?: string;
    created_at: string;
}

export interface MessageTracking {
    id: string;
    blast_id: string;
    studio_id: string;
    message_id: string | null;
    recipient_phone: string;
    recipient_name: string | null;
    message_content: string;
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'error';
    error_message: string | null;
    sent_at: string | null;
    delivered_at: string | null;
    read_at: string | null;
    failed_at: string | null;
    created_at: string;
    updated_at: string;
}

// Note: Message tracking is fetched directly from Supabase
// Use: supabase.from('whatsapp_message_tracking').select('*').eq('blast_id', blastId)

/**
 * Initiate WhatsApp connection and get QR code
 */
export async function initiateConnection(studioId: string): Promise<{ status: string; qrCode?: string; deviceInfo?: any }> {
    try {
        const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/whatsapp/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studioId }),
        });

        if (!response.ok) {
            throw new Error('Failed to initiate connection');
        }

        return await response.json();
    } catch (error) {
        console.error('Error initiating connection:', error);
        throw error;
    }
}

/**
 * Get current QR code
 */
export async function getQRCode(studioId: string): Promise<string | null> {
    try {
        const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/whatsapp/qr/${studioId}`);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.qrCode;
    } catch (error) {
        console.error('Error getting QR code:', error);
        return null;
    }
}

/**
 * Get connection status
 */
export async function getConnectionStatus(studioId: string): Promise<WhatsAppConnectionStatus> {
    try {
        const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/whatsapp/status/${studioId}`);

        if (!response.ok) {
            throw new Error('Failed to get connection status');
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting connection status:', error);
        throw error;
    }
}

/**
 * Disconnect WhatsApp device
 */
export async function disconnectDevice(studioId: string): Promise<void> {
    try {
        const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/whatsapp/disconnect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studioId }),
        });

        if (!response.ok) {
            throw new Error('Failed to disconnect device');
        }
    } catch (error) {
        console.error('Error disconnecting device:', error);
        throw error;
    }
}

/**
 * Get contacts from WhatsApp
 */
export async function getContacts(studioId: string): Promise<WhatsAppContact[]> {
    try {
        const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/whatsapp/contacts/${studioId}`);

        if (!response.ok) {
            throw new Error('Failed to get contacts');
        }

        const data = await response.json();
        return data.contacts || [];
    } catch (error) {
        console.error('Error getting contacts:', error);
        throw error;
    }
}

/**
 * Manually sync contacts from WhatsApp device
 */
export async function syncContacts(studioId: string): Promise<WhatsAppContact[]> {
    try {
        const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/whatsapp/sync-contacts/${studioId}`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('Failed to sync contacts');
        }

        const data = await response.json();
        return data.contacts;
    } catch (error) {
        console.error('Error syncing contacts:', error);
        throw error;
    }
}

/**
 * Send WhatsApp blast
 */
export async function sendBlast(params: BlastParams): Promise<BlastResult> {
    try {
        const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/whatsapp/send-blast`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send blast');
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending blast:', error);
        throw error;
    }
}

/**
 * Get blast history
 */
export async function getBlastHistory(studioId: string): Promise<BlastHistory[]> {
    try {
        const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/whatsapp/blast-history/${studioId}`);

        if (!response.ok) {
            throw new Error('Failed to get blast history');
        }

        const data = await response.json();
        return data.history || [];
    } catch (error) {
        console.error('Error getting blast history:', error);
        throw error;
    }
}

/**
 * Send booking confirmation notification via WhatsApp
 */
export async function sendBookingNotification(params: {
    studioId: string;
    customerPhone: string;
    customerName: string;
    bookingReference: string;
    date: string;
    startTime: string;
    endTime: string;
    studioName: string;
    layoutName: string;
    totalPrice: number;
}): Promise<{ success: boolean; error?: string }> {
    try {
        console.log('\n========== WHATSAPP BOOKING NOTIFICATION ==========');
        console.log('📱 Starting WhatsApp booking notification process...');
        console.log('Studio ID:', params.studioId);
        console.log('Customer Name:', params.customerName);
        console.log('Customer Phone (raw):', params.customerPhone);
        console.log('Booking Reference:', params.bookingReference);

        // Format phone number - ensure it has country code
        let formattedPhone = params.customerPhone.replace(/\D/g, ''); // Remove non-digits
        console.log('Phone after removing non-digits:', formattedPhone);

        // If phone doesn't start with country code, assume Malaysia (60)
        if (!formattedPhone.startsWith('60') && formattedPhone.startsWith('0')) {
            formattedPhone = '60' + formattedPhone.substring(1);
            console.log('Added country code (removed leading 0):', formattedPhone);
        } else if (!formattedPhone.startsWith('60')) {
            formattedPhone = '60' + formattedPhone;
            console.log('Added country code (no leading 0):', formattedPhone);
        } else {
            console.log('Phone already has country code:', formattedPhone);
        }

        console.log('✓ Final formatted phone:', formattedPhone);

        // Format date for display (YYYY-MM-DD to DD/MM/YYYY)
        const dateParts = params.date.split('-');
        const formattedDate = dateParts.length === 3
            ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
            : params.date;
        console.log('✓ Formatted date:', formattedDate);

        // Create personalized message
        const message = `Terima kasih atas tempahan anda!

Rujukan: ${params.bookingReference}
Nama: ${params.customerName}
Tarikh: ${formattedDate}
Masa: ${params.startTime} - ${params.endTime}
Studio: ${params.studioName}
Layout: ${params.layoutName}
Jumlah: RM${params.totalPrice.toFixed(2)}

Kami akan menghubungi anda tidak lama lagi. Terima kasih!`;

        console.log('✓ Message prepared');
        console.log('Message preview (first 100 chars):', message.substring(0, 100) + '...');
        console.log('Message length:', message.length, 'characters');

        console.log('\n📤 Calling sendBlast API...');
        console.log('Recipient:', { phone: formattedPhone, name: params.customerName });

        // Use the existing sendBlast function with a single recipient
        const result = await sendBlast({
            studioId: params.studioId,
            recipients: [{
                phone: formattedPhone,
                name: params.customerName,
            }],
            message,
        });

        console.log('\n📥 Received response from sendBlast API');
        console.log('Result:', JSON.stringify(result, null, 2));

        if (result.success && result.successCount > 0) {
            console.log('✅ SUCCESS: Booking notification sent successfully!');
            console.log('Success count:', result.successCount);
            console.log('Fail count:', result.failCount);
            console.log('Blast ID:', result.blastId);
            console.log('==================================================\n');
            return { success: true };
        } else {
            const errorMsg = result.errors?.[0]?.error || 'Failed to send notification';
            console.error('❌ FAILED: Booking notification failed');
            console.error('Error message:', errorMsg);
            console.error('Success count:', result.successCount);
            console.error('Fail count:', result.failCount);
            console.error('Errors:', result.errors);
            console.log('==================================================\n');
            return { success: false, error: errorMsg };
        }
    } catch (error) {
        console.error('\n❌ EXCEPTION: Error sending booking notification');
        console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');
        console.log('==================================================\n');
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Send booking receipt PDF via WhatsApp
 */
export async function sendBookingReceipt(params: {
    studioId: string;
    customerPhone: string;
    bookingDetails: {
        reference: string;
        customerName: string;
        customerEmail: string;
        date: string;
        startTime: string;
        endTime: string;
        studioName: string;
        layoutName: string;
        duration: number;
        totalPrice: number;
        paymentMethod?: string;
    };
}): Promise<{ success: boolean; error?: string }> {
    try {
        console.log('\n========== SENDING BOOKING RECEIPT ==========');
        console.log('📄 Requesting PDF receipt generation and WhatsApp delivery...');
        console.log('Booking Reference:', params.bookingDetails.reference);
        console.log('Customer Phone:', params.customerPhone);

        const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/whatsapp/send-receipt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Receipt sending failed:', error.error);
            console.log('=================================================\n');
            throw new Error(error.error || 'Failed to send receipt');
        }

        const result = await response.json();
        console.log('✅ Receipt sent successfully!');
        console.log('Message ID:', result.messageId);
        console.log('=================================================\n');

        return { success: true };
    } catch (error) {
        console.error('❌ Error sending receipt:', error);
        console.log('=================================================\n');
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Generate and download booking receipt PDF (without sending via WhatsApp)
 */
export async function generateReceiptDownload(bookingDetails: {
    reference: string;
    customerName: string;
    customerEmail: string;
    date: string;
    startTime: string;
    endTime: string;
    studioName: string;
    layoutName: string;
    duration: number;
    totalPrice: number;
    paymentMethod?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        console.log('\n========== GENERATING RECEIPT FOR DOWNLOAD ==========');
        console.log('📄 Requesting PDF receipt generation...');
        console.log('Booking Reference:', bookingDetails.reference);

        const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/whatsapp/generate-receipt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bookingDetails }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Receipt generation failed:', error.error);
            console.log('====================================================\n');
            throw new Error(error.error || 'Failed to generate receipt');
        }

        // Get PDF blob
        const blob = await response.blob();
        console.log('✓ PDF received, size:', blob.size, 'bytes');

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Resit-${bookingDetails.reference}.pdf`;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('✅ Receipt downloaded successfully!');
        console.log('====================================================\n');

        return { success: true };
    } catch (error) {
        console.error('❌ Error generating receipt:', error);
        console.log('====================================================\n');
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Check if WhatsApp service is running
 */
export async function checkServiceHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${WHATSAPP_SERVICE_URL}/health`);
        return response.ok;
    } catch (error) {
        console.error('WhatsApp service is not running:', error);
        return false;
    }
}
