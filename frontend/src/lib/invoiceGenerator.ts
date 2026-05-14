/**
 * Client-side GST tax invoice generator (jsPDF).
 *
 * Invoice number == enrollmentId returned by the enrollment GAS endpoint.
 * Tax is reverse-calculated from the gross amount at 18% GST:
 *   - Karnataka customer  → CGST 9% + SGST 9%
 *   - Any other state     → IGST 18%
 */

import { jsPDF } from 'jspdf';
import { env } from './env';

export interface InvoiceCustomer {
  fullName: string;
  email: string;
  mobile: string;
  address: string;
  state: string;
  country: string;
}

export interface InvoiceData {
  enrollmentId: string;
  paymentId: string;
  program: string;
  courseType: string;
  amountInRupees: number;
  customer: InvoiceCustomer;
  dateIso?: string;
}

interface TaxBreakdown {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

const calculateTax = (total: number, customerState: string): TaxBreakdown => {
  const taxableValue = total / 1.18;
  const totalTax = total - taxableValue;
  const isIntrastate = customerState.trim().toLowerCase() === env.company.state.toLowerCase();
  if (isIntrastate) {
    return {
      taxableValue,
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      igst: 0,
      totalTax,
    };
  }
  return {
    taxableValue,
    cgst: 0,
    sgst: 0,
    igst: totalTax,
    totalTax,
  };
};

const formatINR = (n: number): string => n.toFixed(2);

const buildInvoice = (data: InvoiceData): jsPDF => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const tax = calculateTax(data.amountInRupees, data.customer.state);
  const dateStr = (data.dateIso ? new Date(data.dateIso) : new Date()).toLocaleDateString('en-IN');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('TAX INVOICE', pageWidth / 2, 18, { align: 'center' });

  // Company header (left)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(env.company.name, margin, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(env.company.address, margin, 36, { maxWidth: 100 });
  doc.text(`GSTIN: ${env.company.gstin}`, margin, 48);
  doc.text(`Email: ${env.company.email}`, margin, 53);
  doc.text(`Phone: ${env.company.phone}`, margin, 58);

  // Invoice metadata (right)
  const rightX = pageWidth - margin;
  doc.setFontSize(9);
  doc.text(`Invoice #: ${data.enrollmentId}`, rightX, 30, { align: 'right' });
  doc.text(`Date: ${dateStr}`, rightX, 36, { align: 'right' });
  doc.text(`Place of Supply: ${data.customer.state || 'N/A'}`, rightX, 42, { align: 'right' });

  // Customer block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Client / Customer / Student', margin, 72);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Name: ${data.customer.fullName}`, margin, 78);
  doc.text(`Email: ${data.customer.email}`, margin, 83);
  doc.text(`Mobile: ${data.customer.mobile}`, margin, 88);
  doc.text(`Address: ${data.customer.address}`, margin, 93, { maxWidth: pageWidth - margin * 2 });

  // Service description table header
  let y = 110;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');
  doc.text('Service Description', margin + 2, y);
  doc.text('SAC Code', pageWidth / 2 + 10, y);
  doc.text('Amount (Rs.)', rightX - 2, y, { align: 'right' });

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.program} (${data.courseType})`, margin + 2, y, { maxWidth: 90 });
  doc.text(env.company.sacCode, pageWidth / 2 + 10, y);
  doc.text(formatINR(data.amountInRupees), rightX - 2, y, { align: 'right' });

  // Payment breakdown
  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Breakdown', margin, y);
  doc.setFont('helvetica', 'normal');

  const rows: Array<[string, string]> = [
    ['TOTAL (A)', formatINR(data.amountInRupees)],
    ['DISCOUNT (B)', '0.00'],
    ['TAXABLE VALUE (C)', formatINR(tax.taxableValue)],
    ['CGST 9% (D)', formatINR(tax.cgst)],
    ['SGST 9% (E)', formatINR(tax.sgst)],
    ['IGST 18% (F)', formatINR(tax.igst)],
    ['TOTAL INVOICE VALUE', formatINR(data.amountInRupees)],
  ];

  y += 6;
  rows.forEach(([label, value], idx) => {
    const isLast = idx === rows.length - 1;
    if (isLast) doc.setFont('helvetica', 'bold');
    doc.text(label, margin, y);
    doc.text(`Rs. ${value}`, rightX, y, { align: 'right' });
    if (isLast) doc.setFont('helvetica', 'normal');
    y += 6;
  });

  // Footer
  y += 8;
  doc.setFontSize(9);
  doc.text(`Enrollment ID: ${data.enrollmentId}`, margin, y);
  y += 5;
  doc.text(`Payment Reference: ${data.paymentId}`, margin, y);
  y += 12;
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', pageWidth / 2, y, { align: 'center' });

  return doc;
};

/** Trigger a browser download of the invoice as `Invoice_{enrollmentId}.pdf`. */
export const downloadInvoice = (data: InvoiceData): void => {
  const doc = buildInvoice(data);
  doc.save(`Invoice_${data.enrollmentId}.pdf`);
};

/** Return the invoice as a base64 data URI string (for webhook payloads). */
export const invoiceAsBase64 = (data: InvoiceData): string => {
  const doc = buildInvoice(data);
  return doc.output('datauristring');
};
