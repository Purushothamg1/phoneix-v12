import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const PDF_DIR = path.join(UPLOAD_DIR, 'pdfs');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Sanitize a string for safe use as a filename fragment */
function safeName(str: string): string {
  return str.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_').substring(0, 30);
}

async function getBusinessSettings(): Promise<Record<string, string>> {
  try {
    const settings = await prisma.setting.findMany();
    return settings.reduce((acc: Record<string, string>, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

async function generateQrDataUrl(text: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(text, { width: 80, margin: 1, color: { dark: '#1e293b', light: '#ffffff' } });
  } catch {
    return null;
  }
}

function drawHeader(doc: PDFKit.PDFDocument, settings: Record<string, string>, logoPath?: string): void {
  const businessName = settings.business_name || 'Business';
  const currency = settings.currency_symbol || '₹';

  // Left: logo or business name block
  if (logoPath && fs.existsSync(logoPath)) {
    try { doc.image(logoPath, 50, 40, { height: 50 }); }
    catch { /* logo load failed — fall through to text */ }
  }

  doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e293b').text(businessName, 50, 45);
  doc.fontSize(8.5).font('Helvetica').fillColor('#64748b');
  if (settings.business_address) doc.text(settings.business_address, 50, 72);
  if (settings.business_phone) doc.text(`Phone: ${settings.business_phone}`);
  if (settings.business_email) doc.text(`Email: ${settings.business_email}`);
  if (settings.gst_number) doc.text(`GST: ${settings.gst_number}`);
}

function drawDivider(doc: PDFKit.PDFDocument, y: number): void {
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
}

export const pdfService = {
  /**
   * Generates an invoice PDF.
   * File name format: <CustomerName>-<InvoiceNumber>.pdf  e.g. John_Doe-INV-00001.pdf
   * Returns the public URL path e.g. /uploads/pdfs/John_Doe-INV-00001.pdf
   */
  async generateInvoicePdf(invoiceId: string): Promise<string> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, items: { include: { product: true } }, payments: true },
    });
    if (!invoice) throw new NotFoundError('Invoice');

    const settings = await getBusinessSettings();
    ensureDir(PDF_DIR);

    // Human-readable filename: CustomerName-InvoiceNumber.pdf
    const filename = `${safeName(invoice.customer.name)}-${invoice.number}.pdf`;
    const filepath = path.join(PDF_DIR, filename);

    const currency = settings.currency_symbol || '₹';
    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || '';

    const qrData = appUrl
      ? `${appUrl}/invoices/${invoice.id}`
      : `Invoice: ${invoice.number} | Customer: ${invoice.customer.name} | Total: ${currency}${Number(invoice.totalAmount).toFixed(2)}`;
    const qrDataUrl = await generateQrDataUrl(qrData);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, info: {
        Title: `Invoice ${invoice.number}`,
        Author: settings.business_name || 'Phoneix Business Suite',
        Subject: `Invoice for ${invoice.customer.name}`,
      }});
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // ── Header ─────────────────────────────────────────────
      drawHeader(doc, settings);

      // ── Invoice Title (right side) ─────────────────────────
      doc.fontSize(26).font('Helvetica-Bold').fillColor('#2563eb').text('INVOICE', 0, 45, { align: 'right' });
      doc.fontSize(9).font('Helvetica').fillColor('#64748b')
        .text(`Invoice #: ${invoice.number}`, 0, 80, { align: 'right' })
        .text(`Date: ${invoice.createdAt.toLocaleDateString('en-IN')}`, { align: 'right' });

      const paidAmt = (invoice.payments ?? [])
        .filter((p) => !p.refunded)
        .reduce((s, p) => s + Number(p.amount), 0);
      const outstanding = Math.max(0, Number(invoice.totalAmount) - paidAmt);

      const statusColor = invoice.status === 'PAID' ? '#16a34a' : invoice.status === 'PARTIAL' ? '#d97706' : '#dc2626';
      doc.fontSize(10).font('Helvetica-Bold').fillColor(statusColor)
        .text(invoice.status, 0, 97, { align: 'right' });

      drawDivider(doc, 130);

      // ── Bill To ────────────────────────────────────────────
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#94a3b8').text('BILL TO', 50, 145);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text(invoice.customer.name, 50, 158);
      doc.fontSize(9).font('Helvetica').fillColor('#64748b')
        .text(invoice.customer.phone, 50, 173);
      if (invoice.customer.email) doc.text(invoice.customer.email, 50, 186);
      if (invoice.customer.address) doc.text(invoice.customer.address, 50, invoice.customer.email ? 199 : 186);

      // ── Items Table ────────────────────────────────────────
      const tableTop = 235;
      doc.rect(50, tableTop, 495, 22).fill('#f1f5f9');
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569');
      doc.text('#', 55, tableTop + 7);
      doc.text('Description', 72, tableTop + 7);
      doc.text('Qty', 300, tableTop + 7, { width: 40, align: 'right' });
      doc.text('Unit Price', 345, tableTop + 7, { width: 70, align: 'right' });
      doc.text('Tax%', 420, tableTop + 7, { width: 40, align: 'right' });
      doc.text('Total', 465, tableTop + 7, { width: 75, align: 'right' });

      let y = tableTop + 27;
      doc.font('Helvetica').fontSize(9).fillColor('#334155');

      invoice.items.forEach((item, idx) => {
        if (y > 680) {
          doc.addPage();
          y = 50;
          // Re-draw column headers on continuation page
          doc.rect(50, y, 495, 22).fill('#f1f5f9');
          doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569');
          doc.text('Continued', 55, y + 7);
          y += 27;
          doc.font('Helvetica').fontSize(9).fillColor('#334155');
        }
        if (idx % 2 === 0) doc.rect(50, y - 3, 495, 18).fill('#f8fafc');
        doc.fillColor('#334155');
        doc.text(String(idx + 1), 55, y);
        doc.text(item.description.substring(0, 38), 72, y);
        doc.text(item.qty.toString(), 300, y, { width: 40, align: 'right' });
        doc.text(`${currency}${Number(item.unitPrice).toFixed(2)}`, 345, y, { width: 70, align: 'right' });
        doc.text(`${Number(item.tax)}%`, 420, y, { width: 40, align: 'right' });
        doc.text(`${currency}${Number(item.total).toFixed(2)}`, 465, y, { width: 75, align: 'right' });
        y += 18;
      });

      drawDivider(doc, y + 5);
      y += 18;

      // ── Totals ─────────────────────────────────────────────
      const subtotal = Number(invoice.totalAmount) - Number(invoice.taxAmount) + Number(invoice.discount);
      doc.font('Helvetica').fontSize(9).fillColor('#64748b');
      doc.text('Subtotal:', 380, y); doc.text(`${currency}${subtotal.toFixed(2)}`, 465, y, { width: 75, align: 'right' });
      y += 15;
      doc.text('Tax:', 380, y); doc.text(`${currency}${Number(invoice.taxAmount).toFixed(2)}`, 465, y, { width: 75, align: 'right' });
      y += 15;
      if (Number(invoice.discount) > 0) {
        doc.fillColor('#16a34a').text('Discount:', 380, y);
        doc.text(`-${currency}${Number(invoice.discount).toFixed(2)}`, 465, y, { width: 75, align: 'right' });
        y += 15;
      }
      doc.rect(380, y + 2, 160, 22).fill('#2563eb');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('TOTAL:', 385, y + 7);
      doc.text(`${currency}${Number(invoice.totalAmount).toFixed(2)}`, 465, y + 7, { width: 75, align: 'right' });
      y += 30;

      if (paidAmt > 0) {
        doc.fontSize(9).font('Helvetica').fillColor('#16a34a')
          .text(`Amount Paid: ${currency}${paidAmt.toFixed(2)}`, 380, y);
        y += 14;
        if (outstanding > 0.01) {
          doc.fillColor('#dc2626').font('Helvetica-Bold')
            .text(`Outstanding: ${currency}${outstanding.toFixed(2)}`, 380, y);
        }
      }

      // ── Payment History ────────────────────────────────────
      const nonRefunded = (invoice.payments ?? []).filter((p) => !p.refunded);
      if (nonRefunded.length > 0) {
        y += 30;
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569').text('PAYMENT HISTORY', 50, y);
        y += 14;
        nonRefunded.forEach((p) => {
          doc.font('Helvetica').fontSize(8.5).fillColor('#64748b')
            .text(`${p.method.replace('_', ' ')} — ${currency}${Number(p.amount).toFixed(2)} on ${p.createdAt.toLocaleDateString('en-IN')}`, 55, y);
          y += 13;
        });
      }

      // ── QR Code ────────────────────────────────────────────
      if (qrDataUrl) {
        const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
        doc.image(qrBuffer, 50, y + 15, { width: 70 });
        doc.fontSize(7).fillColor('#94a3b8').text('Scan to view invoice', 50, y + 88);
      }

      // ── Footer ─────────────────────────────────────────────
      const footerY = 760;
      drawDivider(doc, footerY - 5);
      doc.fontSize(8).font('Helvetica').fillColor('#94a3b8');
      if (settings.receipt_footer) {
        doc.text(settings.receipt_footer, 50, footerY, { align: 'center', width: 495 });
      } else {
        doc.text('Thank you for your business!', 50, footerY, { align: 'center', width: 495 });
      }
      doc.text(`Generated by Phoneix Business Suite v1.2.0`, 50, footerY + 12, { align: 'center', width: 495 });

      doc.end();
      stream.on('finish', () => {
        logger.info(`PDF generated: ${filename}`);
        resolve(`/uploads/pdfs/${filename}`);
      });
      stream.on('error', (err) => {
        logger.error(`PDF generation failed: ${filename}`, err);
        reject(err);
      });
    });
  },

  /**
   * Generates a repair job card PDF.
   * File name format: <CustomerName>-<JobID>.pdf  e.g. John_Doe-JOB-00001.pdf
   */
  async generateRepairPdf(repairId: string): Promise<string> {
    const repair = await prisma.repairJob.findUnique({
      where: { id: repairId },
      include: { customer: true, technician: true, parts: { include: { product: true } } },
    });
    if (!repair) throw new NotFoundError('Repair job');

    const settings = await getBusinessSettings();
    ensureDir(PDF_DIR);

    const filename = `${safeName(repair.customer.name)}-${repair.jobId}.pdf`;
    const filepath = path.join(PDF_DIR, filename);

    const currency = settings.currency_symbol || '₹';
    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || '';
    const qrDataUrl = await generateQrDataUrl(
      appUrl ? `${appUrl}/repairs/${repair.id}` : `Repair: ${repair.jobId} | ${repair.brand} ${repair.model}`,
    );

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, info: {
        Title: `Repair Job Card ${repair.jobId}`,
        Author: settings.business_name || 'Phoneix Business Suite',
        Subject: `Repair for ${repair.customer.name}`,
      }});
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // ── Header ─────────────────────────────────────────────
      drawHeader(doc, settings);

      // ── Job Card Title ─────────────────────────────────────
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#7c3aed').text('JOB CARD', 0, 45, { align: 'right' });
      doc.fontSize(9).font('Helvetica').fillColor('#64748b')
        .text(`Job ID: ${repair.jobId}`, 0, 78, { align: 'right' })
        .text(`Date: ${repair.createdAt.toLocaleDateString('en-IN')}`, { align: 'right' });

      const statusColor = repair.status === 'DELIVERED' ? '#16a34a' :
        repair.status === 'READY' ? '#2563eb' :
        repair.status === 'IN_REPAIR' ? '#7c3aed' : '#d97706';
      doc.fontSize(9).font('Helvetica-Bold').fillColor(statusColor).text(repair.status.replace(/_/g, ' '), 0, 102, { align: 'right' });

      drawDivider(doc, 130);

      // ── Customer & Device ──────────────────────────────────
      let y = 145;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#94a3b8').text('CUSTOMER INFORMATION', 50, y);
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#94a3b8').text('DEVICE INFORMATION', 300, y);
      y += 14;

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text(repair.customer.name, 50, y);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text(`${repair.brand} ${repair.model}`, 300, y);
      y += 14;

      doc.fontSize(9).font('Helvetica').fillColor('#64748b');
      doc.text(repair.customer.phone, 50, y);
      doc.text(`${repair.deviceType}`, 300, y);
      y += 13;

      if (repair.customer.email) { doc.text(repair.customer.email, 50, y); }
      doc.text(`Serial: ${repair.serialNumber || 'N/A'}`, 300, y);
      y += 20;

      drawDivider(doc, y);
      y += 15;

      // ── Issue Description ──────────────────────────────────
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#94a3b8').text('REPORTED ISSUE', 50, y);
      y += 14;
      doc.fontSize(9).font('Helvetica').fillColor('#334155')
        .text(repair.issueDescription, 50, y, { width: 495, lineGap: 3 });
      y += Math.ceil(repair.issueDescription.length / 90) * 14 + 10;

      // ── Repair Notes (if any) ──────────────────────────────
      if (repair.repairNotes) {
        drawDivider(doc, y);
        y += 15;
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#94a3b8').text('REPAIR NOTES', 50, y);
        y += 14;
        doc.fontSize(9).font('Helvetica').fillColor('#334155')
          .text(repair.repairNotes, 50, y, { width: 495, lineGap: 3 });
        y += Math.ceil(repair.repairNotes.length / 90) * 14 + 10;
      }

      // ── Parts ──────────────────────────────────────────────
      if (repair.parts.length > 0) {
        drawDivider(doc, y);
        y += 15;
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#94a3b8').text('PARTS USED', 50, y);
        y += 14;
        doc.rect(50, y, 495, 18).fill('#f1f5f9');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
        doc.text('Part Name', 55, y + 5); doc.text('SKU', 250, y + 5);
        doc.text('Qty', 340, y + 5); doc.text('Unit Cost', 390, y + 5); doc.text('Subtotal', 465, y + 5);
        y += 22;
        let partsTotal = 0;
        repair.parts.forEach((p) => {
          const sub = p.qty * Number(p.cost);
          partsTotal += sub;
          doc.font('Helvetica').fontSize(8.5).fillColor('#334155');
          doc.text(p.product.name.substring(0, 28), 55, y);
          doc.text(p.product.sku, 250, y);
          doc.text(String(p.qty), 340, y);
          doc.text(`${currency}${Number(p.cost).toFixed(2)}`, 390, y);
          doc.text(`${currency}${sub.toFixed(2)}`, 465, y);
          y += 16;
        });
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e293b')
          .text(`Parts Total: ${currency}${partsTotal.toFixed(2)}`, 380, y);
        y += 20;
      }

      // ── Cost Summary ───────────────────────────────────────
      if (repair.estimatedCost || repair.finalCost) {
        drawDivider(doc, y);
        y += 15;
        if (repair.estimatedCost) {
          doc.fontSize(9).font('Helvetica').fillColor('#64748b')
            .text(`Estimated Cost: ${currency}${Number(repair.estimatedCost).toFixed(2)}`, 50, y);
          y += 15;
        }
        if (repair.finalCost) {
          doc.rect(50, y, 200, 22).fill('#7c3aed');
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff')
            .text(`Final Cost: ${currency}${Number(repair.finalCost).toFixed(2)}`, 55, y + 6);
          y += 30;
        }
      }

      // ── Technician ─────────────────────────────────────────
      if (repair.technician) {
        y += 5;
        doc.fontSize(9).font('Helvetica').fillColor('#64748b')
          .text(`Assigned Technician: ${repair.technician.name}`, 50, y);
        y += 20;
      }

      // ── QR Code ────────────────────────────────────────────
      if (qrDataUrl) {
        const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
        doc.image(qrBuffer, 50, Math.max(y + 10, 640), { width: 70 });
        doc.fontSize(7).fillColor('#94a3b8').text('Scan to view job', 50, Math.max(y + 83, 713));
      }

      // ── Signatures ─────────────────────────────────────────
      const sigY = 720;
      drawDivider(doc, sigY - 5);
      doc.fontSize(9).font('Helvetica').fillColor('#64748b')
        .text('Customer Signature: ___________________________', 50, sigY + 5)
        .text('Technician Signature: ___________________________', 300, sigY + 5);

      // ── Footer ─────────────────────────────────────────────
      drawDivider(doc, 758);
      doc.fontSize(7.5).font('Helvetica').fillColor('#94a3b8');
      const footer = settings.receipt_footer || 'Thank you for choosing us!';
      doc.text(footer, 50, 763, { align: 'center', width: 495 });
      doc.text('Phoneix Business Suite v1.2.0', 50, 774, { align: 'center', width: 495 });

      doc.end();
      stream.on('finish', () => {
        logger.info(`PDF generated: ${filename}`);
        resolve(`/uploads/pdfs/${filename}`);
      });
      stream.on('error', reject);
    });
  },

  /**
   * Re-generates a PDF for an existing invoice (useful after updates).
   */
  async regenerateInvoicePdf(invoiceId: string): Promise<string> {
    return this.generateInvoicePdf(invoiceId);
  },

  /**
   * Re-generates a PDF for an existing repair job.
   */
  async regenerateRepairPdf(repairId: string): Promise<string> {
    return this.generateRepairPdf(repairId);
  },
};
