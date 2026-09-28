import { jsPDF } from 'jspdf';
import { Invoice, ClinicSettings } from '../types';
import { formatDate, numberToWordsINR } from './utils';

/**
 * Format currency for PDF (uses Rs. to avoid font-encoding glyph issues with the Unicode ₹ symbol)
 */
function formatPdfCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rs. 0.00';
  }
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
  return `Rs. ${formatted}`;
}

/**
 * Generates an official, high-resolution A4 jsPDF document for an invoice
 */
export function generateInvoicePDF(invoice: Invoice, settings: ClinicSettings): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  let y = margin;

  // VOID Stamp background watermark if cancelled
  if (invoice.status === 'CANCELLED') {
    doc.saveGraphicsState();
    doc.setTextColor(239, 68, 68); // Red
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(45);
    // Rotate and print VOID across center
    doc.text('VOID / CANCELLED', pageWidth / 2, pageHeight / 2 - 20, {
      align: 'center',
      angle: 35,
    });
    doc.restoreGraphicsState();
  }

  // Clinic Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(43, 36, 32); // #2B2420
  doc.text(settings.clinicName || 'Dr. Unnati Skin Clinic', margin, y + 6);

  // Tagline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(201, 138, 125); // #C98A7D
  const tagline = (settings.tagline || 'Advanced Cosmetology, Laser & Aesthetic Care')
    .replace(/Dermatology/gi, 'Cosmetology')
    .toUpperCase();
  doc.text(tagline, margin, y + 11.5);

  // Clinic Address & Contacts
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 90, 85);
  doc.text(settings.address || '', margin, y + 16.5, { maxWidth: 105 });
  doc.text(`Phone: ${settings.phone || ''}  |  Email: ${settings.email || ''}`, margin, y + 24.5);
  doc.text(`GSTIN: ${settings.gstin || ''}  |  Reg No: ${settings.registrationNo || ''}`, margin, y + 28.5);

  // Invoice Meta Box (Right Side)
  const metaBoxX = pageWidth - margin - 60;
  doc.setFillColor(250, 247, 245); // #FAF7F5
  doc.setDrawColor(232, 226, 220); // #E8E2DC
  doc.roundedRect(metaBoxX, y, 60, 31, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(43, 36, 32);
  doc.text(`${invoice.invoiceType} INVOICE`, metaBoxX + 30, y + 6, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 110, 100);
  doc.text('Invoice No:', metaBoxX + 4, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(201, 138, 125);
  doc.text(invoice.invoiceNo, metaBoxX + 4, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 110, 100);
  doc.text('Date & Time:', metaBoxX + 4, y + 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(43, 36, 32);
  doc.text(formatDate(invoice.date, true), metaBoxX + 4, y + 27.5);

  y += 35;

  // Separator Line
  doc.setDrawColor(43, 36, 32);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);

  y += 4;

  // Patient & Doctor Information Box
  doc.setFillColor(250, 247, 245);
  doc.setDrawColor(232, 226, 220);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'FD');

  // Billed to
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(120, 110, 100);
  doc.text('BILLED TO PATIENT:', margin + 4, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(43, 36, 32);
  doc.text(invoice.patientName || 'Walk-in Patient', margin + 4, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 80, 75);
  const patientDetails = [
    `UHID: ${invoice.patientUHID || 'N/A'}`,
    `Mobile: ${invoice.patientPhone || 'N/A'}`,
    invoice.patientAgeGender ? `Age/Gender: ${invoice.patientAgeGender}` : '',
  ].filter(Boolean).join('   |   ');
  doc.text(patientDetails, margin + 4, y + 15.5);

  // Attending Doctor
  const docColX = margin + 110;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(120, 110, 100);
  doc.text('ATTENDING DOCTOR / CLINICIAN:', docColX, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(43, 36, 32);
  doc.text(invoice.doctorName || 'Dr. Unnati Suthar', docColX, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 90, 85);
  doc.text('Cosmetologist & Aesthetic Care', docColX, y + 14.5);
  doc.text(`Billed by: ${invoice.creatorName || 'Clinic Reception'}`, docColX, y + 18.5);

  y += 28;

  // Table Columns
  // Col positions
  const colX = {
    idx: margin + 2,
    desc: margin + 12,
    qty: margin + 98,
    rate: margin + 115,
    disc: margin + 138,
    gst: margin + 158,
    total: pageWidth - margin - 3,
  };

  // Table Header Bar
  doc.setFillColor(243, 238, 233);
  doc.setDrawColor(215, 206, 198);
  doc.rect(margin, y, contentWidth, 7, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(43, 36, 32);
  doc.text('#', colX.idx, y + 4.8);
  doc.text('ITEM DESCRIPTION', colX.desc, y + 4.8);
  doc.text('QTY', colX.qty + 6, y + 4.8, { align: 'right' });
  doc.text('RATE', colX.rate + 12, y + 4.8, { align: 'right' });
  doc.text('DISC', colX.disc + 11, y + 4.8, { align: 'right' });
  doc.text('GST %', colX.gst + 9, y + 4.8, { align: 'right' });
  doc.text('LINE TOTAL', colX.total, y + 4.8, { align: 'right' });

  y += 7;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const items = invoice.items || [];
  items.forEach((item, index) => {
    const rowHeight = 7.5;
    const isEven = index % 2 === 0;

    if (isEven) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(252, 250, 248);
    }
    doc.setDrawColor(240, 235, 230);
    doc.rect(margin, y, contentWidth, rowHeight, 'FD');

    doc.setTextColor(100, 90, 85);
    doc.text(String(index + 1), colX.idx, y + 5);

    doc.setTextColor(43, 36, 32);
    doc.setFont('helvetica', 'bold');
    const cleanDesc = (item.description || '')
      .replace(/Dermatology/gi, 'Cosmetology')
      .replace(/Dermatological/gi, 'Cosmetological');
    doc.text(cleanDesc.substring(0, 48), colX.desc, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.text(String(item.quantity), colX.qty + 6, y + 5, { align: 'right' });
    doc.text(formatPdfCurrency(item.unitPrice), colX.rate + 12, y + 5, { align: 'right' });
    doc.text(item.discount > 0 ? formatPdfCurrency(item.discount) : '-', colX.disc + 11, y + 5, { align: 'right' });
    doc.text(`${item.taxRate}%`, colX.gst + 9, y + 5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(formatPdfCurrency(item.lineTotal), colX.total, y + 5, { align: 'right' });

    y += rowHeight;
  });

  y += 4;

  // Summary and Totals Section
  const summaryY = y;

  // Left side: In words and payment mode
  doc.setFillColor(250, 247, 245);
  doc.setDrawColor(232, 226, 220);
  doc.roundedRect(margin, summaryY, 95, 30, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(120, 110, 100);
  doc.text('TOTAL AMOUNT IN WORDS:', margin + 4, summaryY + 5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(43, 36, 32);
  const words = numberToWordsINR(invoice.grandTotal);
  doc.text(words, margin + 4, summaryY + 10, { maxWidth: 87 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 90, 85);
  doc.text(`Payment Mode:  ${invoice.paymentMode}`, margin + 4, summaryY + 19);
  doc.text(`Payment Status: ${invoice.paymentStatus}`, margin + 4, summaryY + 23.5);
  if (invoice.notes) {
    doc.text(`Notes: ${invoice.notes.substring(0, 45)}`, margin + 4, summaryY + 27.5);
  }

  // Right side: Totals Calculation
  const totalsX = margin + 105;
  const totalsWidth = contentWidth - 105;
  const labelX = totalsX;
  const valX = pageWidth - margin - 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 90, 85);

  let currentTotY = summaryY + 5;
  doc.text('Subtotal Amount:', labelX, currentTotY);
  doc.text(formatPdfCurrency(invoice.subtotal), valX, currentTotY, { align: 'right' });

  if (invoice.discountTotal > 0) {
    currentTotY += 5;
    doc.setTextColor(217, 83, 79); // red
    doc.text('Discount Allowed:', labelX, currentTotY);
    doc.text(`- ${formatPdfCurrency(invoice.discountTotal)}`, valX, currentTotY, { align: 'right' });
    doc.setTextColor(100, 90, 85);
  }

  if (invoice.taxTotal > 0) {
    currentTotY += 5;
    doc.text('GST Tax (CGST + SGST):', labelX, currentTotY);
    doc.text(`+ ${formatPdfCurrency(invoice.taxTotal)}`, valX, currentTotY, { align: 'right' });
  }

  currentTotY += 7;
  doc.setDrawColor(43, 36, 32);
  doc.setLineWidth(0.4);
  doc.line(totalsX, currentTotY - 2, pageWidth - margin, currentTotY - 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(43, 36, 32);
  doc.text('Net Payable Total:', labelX, currentTotY + 2.5);
  doc.setTextColor(201, 138, 125); // #C98A7D
  doc.setFontSize(11);
  doc.text(formatPdfCurrency(invoice.grandTotal), valX, currentTotY + 2.5, { align: 'right' });

  // Footer / Terms & Signature Block
  const footerY = pageHeight - margin - 26;

  doc.setDrawColor(215, 206, 198);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(43, 36, 32);
  doc.text('Terms & Conditions:', margin, footerY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 110, 100);
  const terms = (settings.termsAndConditions || '1. Valid with clinic seal. 2. Medicines once sold cannot be returned.').split('\n');
  terms.slice(0, 3).forEach((line, idx) => {
    doc.text(line.trim(), margin, footerY + 9 + idx * 3.5, { maxWidth: 110 });
  });

  // Authorized Signatory
  const sigX = pageWidth - margin - 45;
  doc.setDrawColor(43, 36, 32);
  doc.setLineWidth(0.3);
  doc.line(sigX, footerY + 17, pageWidth - margin, footerY + 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(43, 36, 32);
  doc.text('Authorized Signature', sigX + 22.5, footerY + 21, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 110, 100);
  doc.text('For Dr. Unnati Skin Clinic', sigX + 22.5, footerY + 24.5, { align: 'center' });

  return doc;
}

/**
 * Returns the PDF document as a Blob for uploading to Supabase Storage
 */
export function getInvoicePDFBlob(invoice: Invoice, settings: ClinicSettings): Blob {
  const doc = generateInvoicePDF(invoice, settings);
  return doc.output('blob');
}

/**
 * Triggers a browser download of the invoice PDF
 */
export function downloadInvoicePDF(invoice: Invoice, settings: ClinicSettings): void {
  const doc = generateInvoicePDF(invoice, settings);
  const cleanInvoiceNo = invoice.invoiceNo.replace(/[^a-zA-Z0-9-_]/g, '_');
  doc.save(`${cleanInvoiceNo}.pdf`);
}
