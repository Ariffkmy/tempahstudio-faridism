import jsPDF from 'jspdf';

interface PackageReceiptDetails {
    studioName: string;
    fullName: string;
    email: string;
    phone: string;
    packageName: string;
    packagePrice: number;
    paymentMethod?: string;
    submittedDate: string;
    status: string;
}

/**
 * Generate and download package payment receipt PDF
 */
export function generatePackageReceiptPDF(details: PackageReceiptDetails): void {
    console.log('\n========== GENERATING PACKAGE RECEIPT PDF ==========');
    console.log('Studio:', details.studioName);
    console.log('Package:', details.packageName);

    // Create new PDF document
    const doc = new jsPDF();

    // Get today's date for receipt date
    const today = new Date();
    const receiptDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

    // Format submitted date
    const submittedParts = details.submittedDate.split('/');
    const formattedSubmitted = submittedParts.length >= 2 ? `${submittedParts[0]}/${submittedParts[1]}` : details.submittedDate;

    // Generate unique receipt number (format: PKG-YYYYMMDD-HHMMSS-StudioName)
    const studioNameSlug = details.studioName.replace(/\s+/g, '-').toUpperCase();
    const receiptNo = `PKG-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${today.getHours().toString().padStart(2, '0')}${today.getMinutes().toString().padStart(2, '0')}${today.getSeconds().toString().padStart(2, '0')}-${studioNameSlug}`;

    let y = 20; // Starting Y position

    // Load and add logo
    const logo = new Image();
    logo.src = '/studiorayalogo.png';

    logo.onload = () => {
        // Add logo (centered, 40mm wide)
        const logoWidth = 40;
        const logoHeight = (logo.height / logo.width) * logoWidth;
        const logoX = (210 - logoWidth) / 2; // Center on A4 width (210mm)

        doc.addImage(logo, 'PNG', logoX, y, logoWidth, logoHeight);
        y += logoHeight + 10;

        // Title - RESIT PEMBAYARAN PAKEJ
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Resit Pembayaran Pakej Tempah Studio', 105, y, { align: 'center' });
        y += 15;

        // Horizontal line
        doc.setLineWidth(0.5);
        doc.line(20, y, 190, y);
        y += 10;

        // Receipt Number
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`No. Resit: ${receiptNo}`, 20, y);
        y += 7;

        // Receipt Info
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Tarikh Resit: ${receiptDate}`, 20, y);
        y += 7;
        doc.text(`Tarikh Pembayaran: ${formattedSubmitted}`, 20, y);
        y += 12;

        // Section: MAKLUMAT STUDIO
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('MAKLUMAT STUDIO', 20, y);
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Nama Studio: ${details.studioName}`, 20, y);
        y += 6;
        doc.text(`Nama Pemilik: ${details.fullName}`, 20, y);
        y += 6;
        doc.text(`Email: ${details.email}`, 20, y);
        y += 6;
        doc.text(`Telefon: ${details.phone}`, 20, y);
        y += 12;

        // Section: MAKLUMAT PAKEJ
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('MAKLUMAT PAKEJ', 20, y);
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Pakej: ${details.packageName}`, 20, y);
        y += 6;
        doc.text(`Harga: RM ${details.packagePrice.toFixed(2)}`, 20, y);
        y += 12;

        // Section: PEMBAYARAN
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('PEMBAYARAN', 20, y);
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Jumlah: RM ${details.packagePrice.toFixed(2)}`, 20, y);
        y += 6;

        if (details.paymentMethod) {
            doc.text(`Kaedah: ${details.paymentMethod}`, 20, y);
            y += 6;
        }

        // Status
        doc.setFont('helvetica', 'bold');
        const statusText = details.status === 'verified' || details.status === 'completed'
            ? 'DISAHKAN'
            : details.status === 'rejected'
                ? 'DITOLAK'
                : 'MENUNGGU PENGESAHAN';
        doc.text(`Status: ${statusText}`, 20, y);
        y += 15;

        // Horizontal line
        doc.setLineWidth(0.3);
        doc.line(20, y, 190, y);
        y += 10;

        // Footer message
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text('Terima kasih atas pembayaran anda!', 105, y, { align: 'center' });
        y += 5;
        doc.setFontSize(9);
        doc.text('Resit ini dijana secara automatik oleh sistem.', 105, y, { align: 'center' });
        y += 10;

        // Bottom border
        doc.setLineWidth(0.5);
        doc.line(20, y, 190, y);
        y += 7;

        // Company information
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Receipt Issued By: Baidumi Digital (SSM : 003795517-T)', 105, y, { align: 'center' });

        // Save the PDF
        const filename = `Resit-Pakej-${details.studioName.replace(/\s+/g, '-')}.pdf`;
        doc.save(filename);

        console.log('✓ Package receipt PDF generated and downloaded:', filename);
        console.log('====================================================\n');
    };
}
