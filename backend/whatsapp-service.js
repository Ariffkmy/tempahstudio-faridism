import express from 'express';
import cors from 'cors';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.WHATSAPP_SERVICE_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client - using the same credentials as the main app
const supabaseUrl = 'https://ierrbnbghexwlwgizvww.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllcnJibmJnaGV4d2x3Z2l6dnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTMwNzgsImV4cCI6MjA4MDM4OTA3OH0.g_iGvJj9KuoYuAP-UbXcI6Bi612J_5-JEWKc1COvDlY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Store active WhatsApp connections per studio
const activeConnections = new Map();

// Store QR codes temporarily
const qrCodes = new Map();

/**
 * Get or create WhatsApp socket connection for a studio
 */
async function getWhatsAppSocket(studioId) {
    if (activeConnections.has(studioId)) {
        return activeConnections.get(studioId);
    }

    const authPath = path.join(__dirname, 'auth', studioId);

    // Ensure auth directory exists
    if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ['RayaStudio', 'Chrome', '1.0.0'],
    });

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // Generate QR code as data URL
            const qrDataUrl = await QRCode.toDataURL(qr);
            qrCodes.set(studioId, qrDataUrl);
            console.log(`QR code generated for studio ${studioId}`);
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to', lastDisconnect?.error, ', reconnecting', shouldReconnect);

            // Update database
            await supabase
                .from('whatsapp_sessions')
                .update({
                    is_connected: false,
                    last_disconnected_at: new Date().toISOString(),
                })
                .eq('studio_id', studioId);

            // Remove from active connections
            activeConnections.delete(studioId);
            qrCodes.delete(studioId);

            if (shouldReconnect) {
                // Reconnect after a delay
                setTimeout(() => getWhatsAppSocket(studioId), 3000);
            }
        } else if (connection === 'open') {
            console.log(`WhatsApp connected for studio ${studioId}`);
            qrCodes.delete(studioId);

            // Get device info
            const deviceInfo = sock.user;

            // Update database
            await supabase
                .from('whatsapp_sessions')
                .upsert({
                    studio_id: studioId,
                    is_connected: true,
                    last_connected_at: new Date().toISOString(),
                    device_name: deviceInfo?.name || 'Unknown',
                    phone_number: deviceInfo?.id?.split(':')[0] || '',
                }, {
                    onConflict: 'studio_id'
                });
        }
    });

    // Save credentials on update
    sock.ev.on('creds.update', saveCreds);

    // Track message receipts (delivery, read, played status)
    sock.ev.on('messages.update', async (updates) => {
        for (const update of updates) {
            const { key, update: messageUpdate } = update;

            // Check for delivery status updates
            if (messageUpdate.status) {
                const status = messageUpdate.status;
                const messageId = key.id;
                const recipient = key.remoteJid;

                console.log(`Message ${messageId} to ${recipient}: ${status}`);

                // Status can be: ERROR, PENDING, SERVER_ACK, DELIVERY_ACK, READ, PLAYED
                // Update database based on status
                if (status === 'DELIVERY_ACK') {
                    // Message delivered to recipient's device
                    await supabase
                        .from('whatsapp_message_tracking')
                        .update({
                            status: 'delivered',
                            delivered_at: new Date().toISOString(),
                        })
                        .eq('message_id', messageId);

                    console.log(`✓ Message ${messageId} delivered`);
                } else if (status === 'READ') {
                    // Message read by recipient
                    await supabase
                        .from('whatsapp_message_tracking')
                        .update({
                            status: 'read',
                            read_at: new Date().toISOString(),
                        })
                        .eq('message_id', messageId);

                    console.log(`✓✓ Message ${messageId} read`);
                } else if (status === 'ERROR') {
                    // Message failed
                    await supabase
                        .from('whatsapp_message_tracking')
                        .update({
                            status: 'error',
                            failed_at: new Date().toISOString(),
                        })
                        .eq('message_id', messageId);

                    console.log(`✗ Message ${messageId} failed`);
                }
            }
        }
    });

    // Store connection
    activeConnections.set(studioId, sock);

    return sock;
}

/**
 * API Routes
 */

// Health check
app.get('/health', (req, res) => {
    const connections = Array.from(activeConnections.entries()).map(([studioId, sock]) => ({
        studioId,
        isAuthenticated: !!sock.user,
        deviceName: sock.user?.name || 'Not authenticated',
        phoneNumber: sock.user?.id?.split(':')[0] || 'N/A',
    }));

    res.json({
        status: 'ok',
        activeConnections: activeConnections.size,
        connections,
        timestamp: new Date().toISOString(),
    });
});

// Initiate WhatsApp connection and get QR code
app.post('/api/whatsapp/connect', async (req, res) => {
    try {
        const { studioId } = req.body;

        if (!studioId) {
            return res.status(400).json({ error: 'Studio ID is required' });
        }

        // Check if already connected
        if (activeConnections.has(studioId)) {
            const sock = activeConnections.get(studioId);
            if (sock.user) {
                return res.json({
                    status: 'already_connected',
                    deviceInfo: {
                        name: sock.user.name,
                        phoneNumber: sock.user.id?.split(':')[0],
                    }
                });
            }
        }

        // Create new connection
        await getWhatsAppSocket(studioId);

        // Wait a bit for QR code generation
        await new Promise(resolve => setTimeout(resolve, 2000));

        const qrCode = qrCodes.get(studioId);

        if (qrCode) {
            res.json({ status: 'qr_generated', qrCode });
        } else {
            res.json({ status: 'connecting', message: 'Please wait for QR code...' });
        }
    } catch (error) {
        console.error('Error connecting to WhatsApp:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get current QR code
app.get('/api/whatsapp/qr/:studioId', (req, res) => {
    const { studioId } = req.params;
    const qrCode = qrCodes.get(studioId);

    if (qrCode) {
        res.json({ qrCode });
    } else {
        res.status(404).json({ error: 'No QR code available' });
    }
});

// Get connection status
app.get('/api/whatsapp/status/:studioId', async (req, res) => {
    try {
        const { studioId } = req.params;

        const sock = activeConnections.get(studioId);
        const isConnected = sock && sock.user;

        if (isConnected) {
            res.json({
                isConnected: true,
                deviceInfo: {
                    name: sock.user.name,
                    phoneNumber: sock.user.id?.split(':')[0],
                    platform: 'WhatsApp',
                }
            });
        } else {
            // Check database
            const { data } = await supabase
                .from('whatsapp_sessions')
                .select('*')
                .eq('studio_id', studioId)
                .single();

            res.json({
                isConnected: false,
                lastConnected: data?.last_connected_at,
                hasQR: qrCodes.has(studioId),
            });
        }
    } catch (error) {
        console.error('Error getting status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Disconnect device
app.post('/api/whatsapp/disconnect', async (req, res) => {
    try {
        const { studioId } = req.body;

        if (!studioId) {
            return res.status(400).json({ error: 'Studio ID is required' });
        }

        const sock = activeConnections.get(studioId);

        if (sock) {
            await sock.logout();
            activeConnections.delete(studioId);
            qrCodes.delete(studioId);

            // Clean up auth files
            const authPath = path.join(__dirname, 'auth', studioId);
            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
            }

            // Update database
            await supabase
                .from('whatsapp_sessions')
                .update({
                    is_connected: false,
                    last_disconnected_at: new Date().toISOString(),
                    session_data: null,
                })
                .eq('studio_id', studioId);

            res.json({ success: true, message: 'Disconnected successfully' });
        } else {
            res.status(404).json({ error: 'No active connection found' });
        }
    } catch (error) {
        console.error('Error disconnecting:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get contacts from WhatsApp
app.get('/api/whatsapp/contacts/:studioId', async (req, res) => {
    try {
        const { studioId } = req.params;

        const sock = activeConnections.get(studioId);

        if (!sock || !sock.user) {
            return res.status(400).json({ error: 'WhatsApp not connected' });
        }

        // Fetch contacts - Note: Baileys doesn't directly provide contact list
        // We need to get it from the store or use a different approach
        // For now, return contacts from database if previously synced
        const { data } = await supabase
            .from('whatsapp_sessions')
            .select('contacts')
            .eq('studio_id', studioId)
            .single();

        res.json({ contacts: data?.contacts || [] });
    } catch (error) {
        console.error('Error getting contacts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send WhatsApp blast
app.post('/api/whatsapp/send-blast', async (req, res) => {
    try {
        console.log('\n========== NEW BLAST REQUEST ==========');
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        const { studioId, recipients, message } = req.body;

        // Validate inputs
        if (!studioId || !recipients || !message) {
            console.error('❌ Missing required fields:', { studioId: !!studioId, recipients: !!recipients, message: !!message });
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log(`✓ Studio ID: ${studioId}`);
        console.log(`✓ Recipients count: ${recipients.length}`);
        console.log(`✓ Message length: ${message.length} characters`);

        // Check WhatsApp connection
        const sock = activeConnections.get(studioId);
        console.log(`Connection status: ${sock ? 'Found' : 'Not found'}`);

        if (!sock) {
            console.error('❌ No socket connection found for studio:', studioId);
            console.log('Active connections:', Array.from(activeConnections.keys()));
            return res.status(400).json({ error: 'WhatsApp not connected - no socket found' });
        }

        if (!sock.user) {
            console.error('❌ Socket exists but not authenticated (no user)');
            return res.status(400).json({ error: 'WhatsApp not connected - not authenticated' });
        }

        console.log(`✓ WhatsApp connected as: ${sock.user.name} (${sock.user.id})`);

        // Create blast history record
        console.log('\n--- Creating blast history record ---');
        console.log('Insert data:', {
            studio_id: studioId,
            message_template: message,
            total_recipients: recipients.length,
            status: 'in_progress',
            started_at: new Date().toISOString(),
            recipient_list: recipients,
        });

        const { data: blastRecord, error: insertError } = await supabase
            .from('whatsapp_blast_history')
            .insert({
                studio_id: studioId,
                message_template: message,
                total_recipients: recipients.length,
                status: 'in_progress',
                started_at: new Date().toISOString(),
                recipient_list: recipients,
            })
            .select()
            .single();

        console.log('Insert result:', {
            hasData: !!blastRecord,
            data: blastRecord,
            hasError: !!insertError,
            error: insertError,
        });

        if (insertError) {
            console.error('❌ Database insert failed!');
            console.error('Error code:', insertError.code);
            console.error('Error message:', insertError.message);
            console.error('Error details:', insertError.details);
            console.error('Error hint:', insertError.hint);
            console.warn('⚠️  Could not create blast record (RLS restriction):', insertError.message);
            console.log('Continuing to send messages without history tracking...');
        } else {
            console.log(`✓ Blast record created with ID: ${blastRecord.id}`);
            console.log('Full blast record:', blastRecord);
        }

        // Send messages with delay
        console.log('\n--- Starting to send messages ---');
        let successCount = 0;
        let failCount = 0;
        const errors = [];

        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            console.log(`\n[${i + 1}/${recipients.length}] Processing: ${recipient.name || 'Unknown'} (${recipient.phone})`);

            try {
                const jid = `${recipient.phone}@s.whatsapp.net`;
                console.log(`  → JID: ${jid}`);

                // Personalize message
                let personalizedMessage = message;
                if (recipient.name) {
                    personalizedMessage = personalizedMessage.replace(/{name}/g, recipient.name);
                    console.log(`  → Personalized message (replaced {name})`);
                }

                // Send message and get message info
                console.log(`  → Sending message...`);
                const sentMessage = await sock.sendMessage(jid, { text: personalizedMessage });
                const messageId = sentMessage?.key?.id;
                console.log(`  ✓ Message sent! ID: ${messageId}`);

                successCount++;

                // Track individual message in database
                if (blastRecord) {
                    console.log(`  → Saving to tracking database...`);
                    const { error: trackError } = await supabase
                        .from('whatsapp_message_tracking')
                        .insert({
                            blast_id: blastRecord.id,
                            studio_id: studioId,
                            message_id: messageId,
                            recipient_phone: recipient.phone,
                            recipient_name: recipient.name || null,
                            message_content: personalizedMessage,
                            status: 'sent',
                            sent_at: new Date().toISOString(),
                        });

                    if (trackError) {
                        console.warn(`  ⚠️  Could not save tracking: ${trackError.message}`);
                    } else {
                        console.log(`  ✓ Tracking saved`);
                    }
                }

                // Delay between messages
                if (i < recipients.length - 1) {
                    console.log(`  → Waiting 3 seconds before next message...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            } catch (error) {
                console.error(`  ✗ FAILED to send to ${recipient.phone}:`, error.message);
                console.error(`  Error details:`, error);
                failCount++;
                errors.push({
                    phone: recipient.phone,
                    error: error.message,
                });

                // Track failed message in database
                if (blastRecord) {
                    await supabase
                        .from('whatsapp_message_tracking')
                        .insert({
                            blast_id: blastRecord.id,
                            studio_id: studioId,
                            recipient_phone: recipient.phone,
                            recipient_name: recipient.name || null,
                            message_content: message,
                            status: 'failed',
                            error_message: error.message,
                            failed_at: new Date().toISOString(),
                        });
                }
            }
        }

        console.log('\n--- Blast Complete ---');
        console.log(`✓ Success: ${successCount}`);
        console.log(`✗ Failed: ${failCount}`);

        // Update blast history (if record was created)
        if (blastRecord) {
            console.log('Updating blast history record...');
            const { error: updateError } = await supabase
                .from('whatsapp_blast_history')
                .update({
                    status: 'completed',
                    successful_sends: successCount,
                    failed_sends: failCount,
                    errors: errors,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', blastRecord.id);

            if (updateError) {
                console.error('Error updating blast record:', updateError);
            } else {
                console.log('✓ Blast history updated');
            }
        }

        console.log('========== BLAST REQUEST COMPLETE ==========\n');

        res.json({
            success: true,
            blastId: blastRecord?.id || null,
            successCount,
            failCount,
            errors,
        });
    } catch (error) {
        console.error('\n========== BLAST REQUEST FAILED ==========');
        console.error('Error sending blast:', error);
        console.error('Stack trace:', error.stack);
        console.error('==========================================\n');
        res.status(500).json({ error: error.message });
    }
});

// Get blast history
app.get('/api/whatsapp/blast-history/:studioId', async (req, res) => {
    try {
        const { studioId } = req.params;

        const { data, error } = await supabase
            .from('whatsapp_blast_history')
            .select('*')
            .eq('studio_id', studioId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        res.json({ history: data });
    } catch (error) {
        console.error('Error getting blast history:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`WhatsApp service running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');

    // Disconnect all active connections
    for (const [studioId, sock] of activeConnections.entries()) {
        try {
            await sock.end();
        } catch (error) {
            console.error(`Error disconnecting studio ${studioId}:`, error);
        }
    }

    process.exit(0);
});
