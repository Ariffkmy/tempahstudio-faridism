import jsPDF from 'jspdf';

interface InvoiceDetails {
    reference: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    date: string;
    startTime: string;
    endTime: string;
    studioName: string;
    layoutName: string;
    duration: number;
    totalPrice: number;
    paymentMethod?: string;
    paymentType?: string; // 'deposit' or 'full'
    balanceDue?: number;
    depositAmount?: number;
}

/**
 * Generate invoice number based on reference and date
 * Format: INV-YYYYMMDD-XXXX
 */
function generateInvoiceNumber(reference: string, date: string): string {
    const dateParts = date.split('-');
    const dateStr = dateParts.length === 3 ? `${dateParts[0]}${dateParts[1]}${dateParts[2]}` : '';

    // Extract last 4 characters from reference or use random number
    const refSuffix = reference.replace(/[^0-9]/g, '').slice(-4).padStart(4, '0');

    return `INV-${dateStr}-${refSuffix}`;
}

/**
 * Generate and download booking invoice PDF
 */
export function generateInvoicePDF(details: InvoiceDetails): void {
    console.log('\n========== GENERATING PDF INVOICE ==========');
    console.log('Booking Reference:', details.reference);

    // Create new PDF document
    const doc = new jsPDF();

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber(details.reference, details.date);

    // Format date
    const dateParts = details.date.split('-');
    const formattedDate = dateParts.length === 3
        ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
        : details.date;

    // Get today's date for invoice date
    const today = new Date();
    const invoiceDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

    let y = 20; // Starting Y position

    // Header - Studio Name
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(details.studioName.toUpperCase(), 105, y, { align: 'center' });
    y += 10;

    // Title - INVOIS
    doc.setFontSize(18);
    doc.text('INVOIS', 105, y, { align: 'center' });
    y += 15;

    // Horizontal line
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    // Invoice Info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`No. Invois: ${invoiceNumber}`, 20, y);
    y += 7;
    doc.text(`Tarikh Invois: ${invoiceDate}`, 20, y);
    y += 7;
    doc.text(`No. Rujukan Tempahan: ${details.reference}`, 20, y);
    y += 12;

    // Section: MAKLUMAT PELANGGAN
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('MAKLUMAT PELANGGAN', 20, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Nama: ${details.customerName}`, 20, y);
    y += 6;
    doc.text(`Email: ${details.customerEmail}`, 20, y);
    y += 6;
    if (details.customerPhone) {
        doc.text(`Telefon: ${details.customerPhone}`, 20, y);
        y += 6;
    }
    y += 6;

    // Section: MAKLUMAT TEMPAHAN
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('MAKLUMAT TEMPAHAN', 20, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Tarikh: ${formattedDate}`, 20, y);
    y += 6;
    doc.text(`Masa: ${details.startTime} - ${details.endTime}`, 20, y);
    y += 6;
    doc.text(`Layout: ${details.layoutName}`, 20, y);
    y += 6;
    doc.text(`Durasi: ${details.duration} minit`, 20, y);
    y += 12;

    // Section: BUTIRAN INVOIS (Invoice Items Table)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('BUTIRAN INVOIS', 20, y);
    y += 10;

    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 5, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Perkara', 25, y);
    doc.text('Jumlah (RM)', 160, y);
    y += 10;

    // Table content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Main booking item
    const bookingDescription = `Tempahan Studio - ${details.layoutName}`;
    doc.text(bookingDescription, 25, y);
    doc.text(details.totalPrice.toFixed(2), 160, y);
    y += 6;

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`${formattedDate} • ${details.startTime} - ${details.endTime} (${details.duration} minit)`, 25, y);
    doc.setTextColor(0, 0, 0);
    y += 10;

    // Horizontal line
    doc.setLineWidth(0.3);
    doc.line(20, y, 190, y);
    y += 8;

    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Jumlah Kecil:', 120, y);
    doc.text(`RM ${details.totalPrice.toFixed(2)}`, 160, y);
    y += 8;

    // If deposit payment, show deposit and balance
    if (details.paymentType === 'deposit' && details.depositAmount) {
        doc.text('Deposit Dibayar:', 120, y);
        doc.text(`RM ${details.depositAmount.toFixed(2)}`, 160, y);
        y += 8;

        // Balance due
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Baki Perlu Dibayar:', 120, y);
        doc.text(`RM ${(details.balanceDue || 0).toFixed(2)}`, 160, y);
        y += 10;
    } else {
        // Total (full payment)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('JUMLAH KESELURUHAN:', 120, y);
        doc.text(`RM ${details.totalPrice.toFixed(2)}`, 160, y);
        y += 10;
    }

    // Horizontal line
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    // Payment Information
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('MAKLUMAT PEMBAYARAN', 20, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    if (details.paymentMethod) {
        const methodMap: Record<string, string> = {
            'qr': 'QR Code',
            'bank': 'Bank Transfer',
            'fpx': 'FPX Online Banking',
            'cash': 'Tunai'
        };
        const methodText = methodMap[details.paymentMethod.toLowerCase()] || details.paymentMethod;
        doc.text(`Kaedah Bayaran: ${methodText}`, 20, y);
        y += 6;
    }

    if (details.paymentType) {
        const paymentTypeText = details.paymentType === 'deposit' ? 'Deposit' : 'Bayaran Penuh';
        doc.text(`Jenis Bayaran: ${paymentTypeText}`, 20, y);
        y += 6;
    }

    // Status
    doc.setFont('helvetica', 'bold');
    const statusText = details.paymentType === 'deposit'
        ? (details.balanceDue && details.balanceDue > 0 ? 'SEBAHAGIAN DIBAYAR' : 'DIBAYAR PENUH')
        : 'DIBAYAR PENUH';
    doc.text(`Status: ${statusText}`, 20, y);
    y += 15;

    // Horizontal line
    doc.setLineWidth(0.3);
    doc.line(20, y, 190, y);
    y += 10;

    // Footer message
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Terima kasih atas tempahan anda!', 105, y, { align: 'center' });
    y += 6;
    doc.setFontSize(9);
    doc.text('Sila simpan invois ini untuk rujukan anda.', 105, y, { align: 'center' });
    y += 10;

    // Bottom border
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);

    // Save the PDF
    const filename = `Invois-${invoiceNumber}.pdf`;
    doc.save(filename);

    console.log('✓ Invoice PDF generated and downloaded:', filename);
    console.log('===========================================\n');
}
