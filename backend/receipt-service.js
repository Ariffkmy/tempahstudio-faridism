import express from 'express';
import cors from 'cors';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.RECEIPT_SERVICE_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

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

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'receipt-generator',
        timestamp: new Date().toISOString(),
    });
});

// Generate and download booking receipt
app.post('/api/receipt/generate', async (req, res) => {
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
    console.log(`Receipt service running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    process.exit(0);
});
