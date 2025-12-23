import jsPDF from 'jspdf';

interface ReceiptDetails {
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
}

/**
 * Generate and download booking receipt PDF
 */
export function generateReceiptPDF(details: ReceiptDetails): void {
    console.log('\n========== GENERATING PDF RECEIPT ==========');
    console.log('Booking Reference:', details.reference);

    // Create new PDF document
    const doc = new jsPDF();

    // Format date
    const dateParts = details.date.split('-');
    const formattedDate = dateParts.length === 3
        ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
        : details.date;

    // Get today's date for receipt date
    const today = new Date();
    const receiptDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

    let y = 20; // Starting Y position

    // Header - Studio Name
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(details.studioName.toUpperCase(), 105, y, { align: 'center' });
    y += 10;

    // Title - RESIT TEMPAHAN
    doc.setFontSize(18);
    doc.text('RESIT TEMPAHAN', 105, y, { align: 'center' });
    y += 15;

    // Horizontal line
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    // Receipt Info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`No. Rujukan: ${details.reference}`, 20, y);
    y += 7;
    doc.text(`Tarikh Resit: ${receiptDate}`, 20, y);
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

    // Section: PEMBAYARAN
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PEMBAYARAN', 20, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Jumlah: RM ${details.totalPrice.toFixed(2)}`, 20, y);
    y += 6;
    if (details.paymentMethod) {
        doc.text(`Kaedah: ${details.paymentMethod}`, 20, y);
        y += 6;
    }
    doc.setFont('helvetica', 'bold');
    doc.text('Status: DIBAYAR', 20, y);
    y += 15;

    // Horizontal line
    doc.setLineWidth(0.3);
    doc.line(20, y, 190, y);
    y += 10;

    // Footer message
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Terima kasih atas tempahan anda!', 105, y, { align: 'center' });
    y += 10;

    // Bottom border
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);

    // Save the PDF
    const filename = `Resit-${details.reference}.pdf`;
    doc.save(filename);

    console.log('✓ PDF generated and downloaded:', filename);
    console.log('===========================================\n');
}
