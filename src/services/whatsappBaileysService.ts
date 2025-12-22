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
