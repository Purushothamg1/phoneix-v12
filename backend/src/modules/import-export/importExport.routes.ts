
import { Router } from 'express';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError';
import * as XLSX from 'xlsx';
import { invoiceService } from '../invoices/invoice.service';
import { repairService } from '../repairs/repair.service';

export const importExportRouter = Router();
importExportRouter.use(authenticate, authorize('ADMIN', 'MANAGER'));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ... (product import/export code remains the same)

importExportRouter.post('/prepare-send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, id } = req.body as { type: 'invoice' | 'repair'; id: string };
    if (!type || !id) throw new ValidationError('type and id are required');

    const settingsRows = await prisma.setting.findMany();
    const settings = settingsRows.reduce((acc: Record<string, string>, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    const bizName = settings.business_name || 'Our Business';
    const currency = settings.currency_symbol || '₹';

    let pdfUrl = '';
    let pdfName = '';
    let phone = '';
    let message = '';

    if (type === 'invoice') {
      const invoice = await invoiceService.getById(id);
      if (!invoice.pdfUrl) {
        // This should not happen if PDFs are generated on creation
        throw new NotFoundError('PDF for this invoice does not exist');
      }

      pdfUrl = invoice.pdfUrl;
      const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
      const outstanding = Math.max(0, Number(invoice.totalAmount) - paid);
      phone = invoice.customer.phone.replace(/\D/g, '');
      pdfName = pdfUrl.split('/').pop() || `${invoice.number}.pdf`;

      const lines = [
        `Hello ${invoice.customer.name}! 👋`,
        ``,
        `Your invoice from *${bizName}* is ready.`,
        ``,
        `📋 *Invoice #:* ${invoice.number}`,
        `💰 *Total:* ${currency}${Number(invoice.totalAmount).toFixed(2)}`,
      ];
      if (paid > 0) lines.push(`✅ *Paid:* ${currency}${paid.toFixed(2)}`);
      if (outstanding > 0.01) lines.push(`⏳ *Outstanding:* ${currency}${outstanding.toFixed(2)}`);
      lines.push(``);
      lines.push(`Please find the PDF invoice attached.`);
      if (settings.receipt_footer) lines.push(``, settings.receipt_footer);

      message = lines.join('\n');

    } else if (type === 'repair') {
      const repair = await repairService.getById(id);
      if (!repair.pdfUrl) {
        throw new NotFoundError('PDF for this repair job does not exist');
      }

      pdfUrl = repair.pdfUrl;
      phone = repair.customer.phone.replace(/\D/g, '');
      pdfName = pdfUrl.split('/').pop() || `${repair.jobId}.pdf`;

      const statusMessages: Record<string, string> = {
        RECEIVED:           'We have received your device and it is being logged.',
        DIAGNOSING:         'Our technician is currently diagnosing your device.',
        WAITING_FOR_PARTS:  'We are waiting for the required parts to arrive.',
        IN_REPAIR:          'Your device is currently being repaired.',
        READY:              'Great news! Your device is repaired and ready for collection.',
        DELIVERED:          'Your device has been delivered. Thank you!',
      };

      const lines = [
        `Hello ${repair.customer.name}! 👋`,
        ``,
        `Update on your repair at *${bizName}*:`,
        ``,
        `🔧 *Job ID:* ${repair.jobId}`,
        `📱 *Device:* ${repair.brand} ${repair.model}`,
        `📌 *Status:* ${repair.status.replace(/_/g, ' ')}`,
        ``,
        statusMessages[repair.status] || 'Thank you for choosing us.',
      ];
      if (repair.finalCost) {
        lines.push(``, `💰 *Final Cost:* ${currency}${Number(repair.finalCost).toFixed(2)}`);
      } else if (repair.estimatedCost) {
        lines.push(``, `💰 *Estimated Cost:* ${currency}${Number(repair.estimatedCost).toFixed(2)}`);
      }
      lines.push(``, `Please find the job card attached.`);
      if (settings.receipt_footer) lines.push(``, settings.receipt_footer);

      message = lines.join('\n');
    } else {
      throw new ValidationError('Invalid type. Must be "invoice" or "repair"');
    }

    const cleanPhone = phone.replace(/^\+/, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    res.json({
      pdfUrl,
      pdfName,
      phone,
      message,
      whatsappUrl,
    });
  } catch (e) { next(e); }
});
