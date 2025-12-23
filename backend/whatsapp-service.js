import express from 'express';
import cors from 'cors';
import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';
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

// Store synced contacts from device (for re-importing after deletion)
const syncedContacts = new Map();

/**
 * Validate which contacts are actual WhatsApp users
 * Uses sock.onWhatsApp() to check contact existence in batches
 */
async function validateWhatsAppContacts(sock, contacts, batchSize = 50) {
    const validContacts = [];

    try {
        // Process contacts in batches for performance
        for (let i = 0; i < contacts.length; i += batchSize) {
            const batch = contacts.slice(i, i + batchSize);

            // Extract phone numbers from contact IDs
            const phoneNumbers = batch
                .map(c => c.id.replace('@s.whatsapp.net', '').replace('@lid', ''))
                .filter(num => num && /^\d+$/.test(num)); // Only valid numeric phone numbers

            if (phoneNumbers.length === 0) continue;

            try {
                // Use onWhatsApp to validate contacts
                const validationResults = await sock.onWhatsApp(...phoneNumbers);

                // Only keep contacts that exist on WhatsApp
                // CRITICAL: Use exact phone number matching, not loose includes()
                for (const result of validationResults) {
                    if (result.exists) {
                        // Extract phone number from validation result JID
                        const validatedPhone = result.jid.split('@')[0];

                        // Find the original contact with EXACT phone number match
                        const originalContact = batch.find(c => {
                            const contactPhone = c.id.replace('@s.whatsapp.net', '').replace('@lid', '');
                            return contactPhone === validatedPhone; // Exact match only
                        });

                        if (originalContact) {
                            validContacts.push(originalContact);
                        }
                    }
                }

                console.log(`  Batch ${Math.floor(i / batchSize) + 1}: Validated ${validationResults.filter(r => r.exists).length}/${phoneNumbers.length} contacts`);
            } catch (error) {
                console.error(`  Error validating batch ${Math.floor(i / batchSize) + 1}:`, error.message);
                // On error, skip this batch rather than failing completely
            }

            // Small delay between batches to avoid rate limiting
            if (i + batchSize < contacts.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    } catch (error) {
        console.error('Error in validateWhatsAppContacts:', error.message);
    }

    return validContacts;
}

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

    // Load saved credentials
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    // Get latest WhatsApp version
    const { version } = await fetchLatestBaileysVersion();

    // Create socket
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

    // Handle contact syncing from WhatsApp
    sock.ev.process(async (events) => {
        // Initial contact sync during history synchronization
        if (events['messaging-history.set']) {
            const { contacts, isLatest } = events['messaging-history.set'];

            if (contacts && contacts.length > 0) {
                console.log(`\n📇 Received ${contacts.length} raw contacts from device sync`);

                // Filter out groups first
                const individualContacts = contacts.filter(c => !c.id.includes('@g.us'));
                console.log(`📱 Filtered to ${individualContacts.length} individual contacts (${contacts.length - individualContacts.length} groups excluded)`);

                // Validate which contacts are actual WhatsApp users
                console.log('🔍 Validating contacts with WhatsApp servers...');
                const validatedContacts = await validateWhatsAppContacts(sock, individualContacts);
                console.log(`✅ Validated ${validatedContacts.length} contacts as WhatsApp users (${individualContacts.length - validatedContacts.length} non-WhatsApp contacts excluded)`);

                // Format validated contacts
                const formattedContacts = validatedContacts.map(contact => ({
                    id: contact.id,
                    name: contact.name || contact.notify || contact.id.split('@')[0],
                    phone: contact.id.split('@')[0],
                    notify: contact.notify,
                    isGroup: false,
                }));

                // Store in memory for re-importing (append to existing)
                const existingContacts = syncedContacts.get(studioId) || [];
                const existingIds = new Set(existingContacts.map(c => c.id));

                // Add only new contacts (avoid duplicates)
                const newContacts = formattedContacts.filter(c => !existingIds.has(c.id));
                const allContacts = [...existingContacts, ...newContacts];

                syncedContacts.set(studioId, allContacts);
                console.log(`✓ Contacts stored in memory: ${allContacts.length} total (${newContacts.length} new, ${existingContacts.length} existing)`);

                // Save to database (merge with existing)
                try {
                    const { data: session } = await supabase
                        .from('whatsapp_sessions')
                        .select('contacts')
                        .eq('studio_id', studioId)
                        .single();

                    const dbContacts = session?.contacts || [];
                    const dbIds = new Set(dbContacts.map(c => c.id));
                    const newDbContacts = formattedContacts.filter(c => !dbIds.has(c.id));
                    const mergedContacts = [...dbContacts, ...newDbContacts];

                    await supabase
                        .from('whatsapp_sessions')
                        .update({ contacts: mergedContacts })
                        .eq('studio_id', studioId);

                    console.log(`✓ Contacts saved to database: ${mergedContacts.length} total for studio ${studioId}`);
                } catch (error) {
                    console.error('Failed to save contacts:', error.message);
                }
            }
        }

        // Handle new contacts added
        if (events['contacts.upsert']) {
            console.log(`\n📇 Contact updates received: ${events['contacts.upsert'].length}`);

            // Filter out groups
            const individualContacts = events['contacts.upsert']
                .filter(contact => !contact.id.includes('@g.us'));

            if (individualContacts.length > 0) {
                console.log('🔍 Validating new contacts with WhatsApp servers...');

                // Validate which contacts are actual WhatsApp users
                const validatedContacts = await validateWhatsAppContacts(sock, individualContacts);
                console.log(`✅ Validated ${validatedContacts.length}/${individualContacts.length} new contacts as WhatsApp users`);

                if (validatedContacts.length > 0) {
                    try {
                        // Get existing contacts
                        const { data: session } = await supabase
                            .from('whatsapp_sessions')
                            .select('contacts')
                            .eq('studio_id', studioId)
                            .single();

                        const existingContacts = session?.contacts || [];
                        const existingIds = new Set(existingContacts.map(c => c.id));

                        // Format and add only new validated contacts
                        const newValidContacts = validatedContacts
                            .filter(c => !existingIds.has(c.id))
                            .map(contact => ({
                                id: contact.id,
                                name: contact.name || contact.notify || contact.id.split('@')[0],
                                phone: contact.id.split('@')[0],
                                notify: contact.notify,
                                isGroup: false,
                            }));

                        if (newValidContacts.length > 0) {
                            const updatedContacts = [...existingContacts, ...newValidContacts];

                            await supabase
                                .from('whatsapp_sessions')
                                .update({ contacts: updatedContacts })
                                .eq('studio_id', studioId);

                            console.log(`✓ Added ${newValidContacts.length} new WhatsApp contacts`);
                        } else {
                            console.log('  ℹ️  All validated contacts already exist');
                        }
                    } catch (error) {
                        console.error('Failed to update contacts:', error.message);
                    }
                }
            }
        }

        // Handle contact updates
        if (events['contacts.update']) {
            console.log(`\n📇 Contact updates: ${events['contacts.update'].length}`);

            try {
                const { data: session } = await supabase
                    .from('whatsapp_sessions')
                    .select('contacts')
                    .eq('studio_id', studioId)
                    .single();

                let contacts = session?.contacts || [];

                // Update existing contacts
                for (const update of events['contacts.update']) {
                    const index = contacts.findIndex(c => c.id === update.id);
                    if (index !== -1) {
                        contacts[index] = {
                            ...contacts[index],
                            name: update.name || contacts[index].name,
                            notify: update.notify || contacts[index].notify,
                        };
                    }
                }

                await supabase
                    .from('whatsapp_sessions')
                    .update({ contacts })
                    .eq('studio_id', studioId);

                console.log(`✓ Updated ${events['contacts.update'].length} contacts`);
            } catch (error) {
                console.error('Failed to update contacts:', error.message);
            }
        }
    });

    // Store connection
    activeConnections.set(studioId, sock);

    return sock;
}

/**
 * Generate PDF receipt for booking
 */
async function generateBookingReceipt(bookingDetails) {
    return new Promise((resolve, reject) => {
        try {
            console.log('\n========== GENERATING PDF RECEIPT ==========');
            console.log('Booking Reference:', bookingDetails.reference);

            // Create temporary directory if it doesn't exist
            const tmpDir = path.join(__dirname, 'tmp');
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
                console.log('✓ Created tmp directory');
            }

            // Generate unique filename
            const filename = `receipt-${bookingDetails.reference}-${Date.now()}.pdf`;
            const filepath = path.join(tmpDir, filename);
            console.log('✓ PDF filepath:', filepath);

            // Create PDF document
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const stream = fs.createWriteStream(filepath);

            doc.pipe(stream);

            // Format date for display
            const dateParts = bookingDetails.date.split('-');
            const formattedDate = dateParts.length === 3
                ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
                : bookingDetails.date;

            // Header - Studio Name
            doc.fontSize(24)
                .font('Helvetica-Bold')
                .text(bookingDetails.studioName.toUpperCase(), { align: 'center' });

            doc.moveDown(0.5);

            // Title - RESIT TEMPAHAN
            doc.fontSize(18)
                .font('Helvetica-Bold')
                .text('RESIT TEMPAHAN', { align: 'center' });

            doc.moveDown(1);

            // Horizontal line
            doc.strokeColor('#000000')
                .lineWidth(2)
                .moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .stroke();

            doc.moveDown(0.5);

            // Receipt Info
            doc.fontSize(11)
                .font('Helvetica');

            doc.text(`No. Rujukan: ${bookingDetails.reference}`, { continued: false });
            const today = new Date();
            const receiptDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
            doc.text(`Tarikh Resit: ${receiptDate}`, { continued: false });

            doc.moveDown(1);

            // Section: MAKLUMAT PELANGGAN
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .text('MAKLUMAT PELANGGAN');

            doc.fontSize(11)
                .font('Helvetica');

            doc.moveDown(0.3);
            doc.text(`Nama: ${bookingDetails.customerName}`);
            doc.text(`Email: ${bookingDetails.customerEmail}`);
            if (bookingDetails.customerPhone) {
                doc.text(`Telefon: ${bookingDetails.customerPhone}`);
            }

            doc.moveDown(1);

            // Section: MAKLUMAT TEMPAHAN
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .text('MAKLUMAT TEMPAHAN');

            doc.fontSize(11)
                .font('Helvetica');

            doc.moveDown(0.3);
            doc.text(`Tarikh: ${formattedDate}`);
            doc.text(`Masa: ${bookingDetails.startTime} - ${bookingDetails.endTime}`);
            doc.text(`Layout: ${bookingDetails.layoutName}`);
            doc.text(`Durasi: ${bookingDetails.duration} minit`);

            doc.moveDown(1);

            // Section: PEMBAYARAN
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .text('PEMBAYARAN');

            doc.fontSize(11)
                .font('Helvetica');

            doc.moveDown(0.3);
            doc.text(`Jumlah: RM ${bookingDetails.totalPrice.toFixed(2)}`);
            if (bookingDetails.paymentMethod) {
                doc.text(`Kaedah: ${bookingDetails.paymentMethod}`);
            }
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .text('Status: DIBAYAR', { continued: false });

            doc.moveDown(2);

            // Horizontal line
            doc.strokeColor('#000000')
                .lineWidth(1)
                .moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .stroke();

            doc.moveDown(0.5);

            // Footer message
            doc.fontSize(11)
                .font('Helvetica')
                .text('Terima kasih atas tempahan anda!', { align: 'center' });

            doc.moveDown(0.5);

            // Bottom border
            doc.strokeColor('#000000')
                .lineWidth(2)
                .moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .stroke();

            // Finalize PDF
            doc.end();

            stream.on('finish', () => {
                console.log('✓ PDF generated successfully');
                console.log('File size:', fs.statSync(filepath).size, 'bytes');
                console.log('===========================================\n');
                resolve(filepath);
            });

            stream.on('error', (error) => {
                console.error('❌ Error writing PDF:', error);
                reject(error);
            });

        } catch (error) {
            console.error('❌ Error generating PDF:', error);
            reject(error);
        }
    });
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

// Get contacts
app.get('/api/whatsapp/contacts/:studioId', async (req, res) => {
    try {
        const { studioId } = req.params;
        console.log('\n--- Fetching contacts for studio:', studioId);

        const sock = activeConnections.get(studioId);

        if (!sock || !sock.user) {
            console.error('WhatsApp not connected');
            return res.status(400).json({ error: 'WhatsApp not connected' });
        }

        console.log('✓ WhatsApp connected');

        // Note: Baileys doesn't provide direct contact list access
        // Users need to manually import contacts or we fetch from database
        const { data } = await supabase
            .from('whatsapp_sessions')
            .select('contacts')
            .eq('studio_id', studioId)
            .single();

        const contacts = data?.contacts || [];
        console.log(`✓ Loaded ${contacts.length} contacts from database`);

        res.json({ contacts });
    } catch (error) {
        console.error('Error getting contacts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Manually trigger contact sync from device
app.post('/api/whatsapp/sync-contacts/:studioId', async (req, res) => {
    try {
        const { studioId } = req.params;
        console.log('\n--- Manual contact sync requested for studio:', studioId);

        const sock = activeConnections.get(studioId);

        if (!sock || !sock.user) {
            console.error('WhatsApp not connected');
            return res.status(400).json({ error: 'WhatsApp not connected' });
        }

        console.log('✓ WhatsApp connected, retrieving synced contacts...');

        // Get contacts from memory (originally synced from device)
        const storedContacts = syncedContacts.get(studioId);

        if (!storedContacts || storedContacts.length === 0) {
            console.log('⚠️  No contacts in memory. Checking database...');

            // Fallback to database
            const { data } = await supabase
                .from('whatsapp_sessions')
                .select('contacts')
                .eq('studio_id', studioId)
                .single();

            const dbContacts = data?.contacts || [];

            if (dbContacts.length > 0) {
                // Store in memory for future use
                syncedContacts.set(studioId, dbContacts);
                console.log(`✓ Loaded ${dbContacts.length} contacts from database and stored in memory`);

                // Save back to database
                await supabase
                    .from('whatsapp_sessions')
                    .update({ contacts: dbContacts })
                    .eq('studio_id', studioId);

                return res.json({
                    contacts: dbContacts,
                    message: `Re-imported ${dbContacts.length} contacts from device sync`,
                    source: 'database'
                });
            } else {
                console.log('⚠️  No contacts found. Please disconnect and reconnect WhatsApp to sync from device.');
                return res.json({
                    contacts: [],
                    message: 'No contacts available. Disconnect and reconnect WhatsApp to sync from your device.',
                    source: 'none'
                });
            }
        }

        console.log(`✓ Re-importing ${storedContacts.length} contacts from device sync`);

        // Save to database
        await supabase
            .from('whatsapp_sessions')
            .update({ contacts: storedContacts })
            .eq('studio_id', studioId);

        res.json({
            contacts: storedContacts,
            message: `Successfully re-imported ${storedContacts.length} contacts from your WhatsApp device`,
            source: 'device_sync'
        });
    } catch (error) {
        console.error('Error syncing contacts:', error);
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

// Send booking receipt via WhatsApp
app.post('/api/whatsapp/send-receipt', async (req, res) => {
    try {
        console.log('\n========== SEND RECEIPT REQUEST ==========');
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        const { studioId, customerPhone, bookingDetails } = req.body;

        // Validate inputs
        if (!studioId || !customerPhone || !bookingDetails) {
            console.error('❌ Missing required fields');
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log(`✓ Studio ID: ${studioId}`);
        console.log(`✓ Customer Phone: ${customerPhone}`);
        console.log(`✓ Booking Reference: ${bookingDetails.reference}`);

        // Check WhatsApp connection
        const sock = activeConnections.get(studioId);

        if (!sock || !sock.user) {
            console.error('❌ WhatsApp not connected');
            return res.status(400).json({ error: 'WhatsApp not connected' });
        }

        console.log(`✓ WhatsApp connected as: ${sock.user.name}`);

        // Generate PDF receipt
        console.log('\n📄 Generating PDF receipt...');
        const pdfPath = await generateBookingReceipt(bookingDetails);
        console.log('✓ PDF generated at:', pdfPath);

        // Format phone number
        let formattedPhone = customerPhone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('60') && formattedPhone.startsWith('0')) {
            formattedPhone = '60' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('60')) {
            formattedPhone = '60' + formattedPhone;
        }

        const jid = `${formattedPhone}@s.whatsapp.net`;
        console.log('✓ Recipient JID:', jid);

        // Read PDF file
        console.log('\n📤 Sending PDF via WhatsApp...');
        const pdfBuffer = fs.readFileSync(pdfPath);
        console.log('✓ PDF buffer size:', pdfBuffer.length, 'bytes');

        // Send PDF as document
        const sentMessage = await sock.sendMessage(jid, {
            document: pdfBuffer,
            mimetype: 'application/pdf',
            fileName: `Resit-${bookingDetails.reference}.pdf`,
            caption: '📄 Resit Tempahan Anda\n\nTerima kasih atas tempahan anda!'
        });

        console.log('✓ PDF sent successfully!');
        console.log('Message ID:', sentMessage?.key?.id);

        // Clean up temporary file
        console.log('\n🗑️  Cleaning up temporary file...');
        fs.unlinkSync(pdfPath);
        console.log('✓ Temporary file deleted');
        console.log('==========================================\n');

        res.json({
            success: true,
            messageId: sentMessage?.key?.id
        });

    } catch (error) {
        console.error('\n❌ Error sending receipt:', error);
        console.error('Stack trace:', error.stack);
        console.error('==========================================\n');
        res.status(500).json({ error: error.message });
    }
});

// Generate and download booking receipt (without sending via WhatsApp)
app.post('/api/whatsapp/generate-receipt', async (req, res) => {
    try {
        console.log('\n========== GENERATE RECEIPT (DOWNLOAD) ==========');
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        const { bookingDetails } = req.body;

        // Validate inputs
        if (!bookingDetails) {
            console.error('❌ Missing booking details');
            return res.status(400).json({ error: 'Missing booking details' });
        }

        console.log(`✓ Booking Reference: ${bookingDetails.reference}`);

        // Generate PDF receipt
        console.log('\n📄 Generating PDF receipt...');
        const pdfPath = await generateBookingReceipt(bookingDetails);
        console.log('✓ PDF generated at:', pdfPath);

        // Read PDF file
        const pdfBuffer = fs.readFileSync(pdfPath);
        console.log('✓ PDF buffer size:', pdfBuffer.length, 'bytes');

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Resit-${bookingDetails.reference}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);
        console.log('✓ PDF sent for download');

        // Clean up temporary file after sending
        setTimeout(() => {
            try {
                fs.unlinkSync(pdfPath);
                console.log('✓ Temporary file deleted');
            } catch (cleanupError) {
                console.error('⚠️ Error deleting temporary file:', cleanupError.message);
            }
            console.log('=================================================\n');
        }, 1000);

    } catch (error) {
        console.error('\n❌ Error generating receipt:', error);
        console.error('Stack trace:', error.stack);
        console.error('=================================================\n');
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
