"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importExportRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
const XLSX = __importStar(require("xlsx"));
exports.importExportRouter = (0, express_1.Router)();
exports.importExportRouter.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMIN', 'MANAGER'));
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
// ── Product Import ────────────────────────────────────────────
exports.importExportRouter.post('/products/import', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        if (!rows.length) {
            res.status(400).json({ error: 'File is empty or has no data rows' });
            return;
        }
        const results = { imported: 0, updated: 0, skipped: 0, errors: [] };
        for (const [index, row] of rows.entries()) {
            try {
                const sku = String(row.sku || row.SKU || row.Sku || '').trim();
                if (!sku) {
                    results.errors.push(`Row ${index + 2}: missing SKU`);
                    results.skipped++;
                    continue;
                }
                const name = String(row.name || row.Name || '').trim();
                if (!name) {
                    results.errors.push(`Row ${index + 2}: missing product name`);
                    results.skipped++;
                    continue;
                }
                const sellingPrice = parseFloat(row.sellingPrice || row.selling_price || row['Selling Price'] || 0);
                if (isNaN(sellingPrice) || sellingPrice < 0) {
                    results.errors.push(`Row ${index + 2}: invalid selling price`);
                    results.skipped++;
                    continue;
                }
                const existing = await database_1.prisma.product.findUnique({ where: { sku } });
                await database_1.prisma.product.upsert({
                    where: { sku },
                    update: {
                        name,
                        category: String(row.category || row.Category || '').trim() || null,
                        purchasePrice: parseFloat(row.purchasePrice || row.purchase_price || row['Purchase Price'] || 0),
                        sellingPrice,
                        stockQty: parseInt(row.stockQty || row.stock_qty || row['Stock Qty'] || 0),
                        minStockLevel: parseInt(row.minStockLevel || row.min_stock || row['Min Stock Level'] || 5),
                    },
                    create: {
                        sku,
                        name,
                        barcode: row.barcode || row.Barcode || null,
                        category: String(row.category || row.Category || '').trim() || null,
                        purchasePrice: parseFloat(row.purchasePrice || row.purchase_price || row['Purchase Price'] || 0),
                        sellingPrice,
                        stockQty: parseInt(row.stockQty || row.stock_qty || row['Stock Qty'] || 0),
                        minStockLevel: parseInt(row.minStockLevel || row.min_stock || row['Min Stock Level'] || 5),
                    },
                });
                if (existing)
                    results.updated++;
                else
                    results.imported++;
            }
            catch (err) {
                results.skipped++;
                results.errors.push(`Row ${index + 2}: ${err?.message || 'Unknown error'}`);
            }
        }
        res.json(results);
    }
    catch (e) {
        next(e);
    }
});
// ── Product Export ────────────────────────────────────────────
exports.importExportRouter.get('/products/export', async (_req, res, next) => {
    try {
        const products = await database_1.prisma.product.findMany({ orderBy: { name: 'asc' } });
        const data = products.map((p) => ({
            SKU: p.sku,
            Name: p.name,
            Category: p.category || '',
            Barcode: p.barcode || '',
            'Purchase Price': Number(p.purchasePrice),
            'Selling Price': Number(p.sellingPrice),
            'Stock Qty': p.stockQty,
            'Min Stock Level': p.minStockLevel,
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = [
            { wch: 15 }, { wch: 35 }, { wch: 20 }, { wch: 18 },
            { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 16 },
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'Products');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="products-export-${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(buf);
    }
    catch (e) {
        next(e);
    }
});
// ── Sales Report Export ────────────────────────────────────────
exports.importExportRouter.get('/reports/sales/export', async (req, res, next) => {
    try {
        const from = req.query.from ? new Date(req.query.from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const to = req.query.to ? new Date(req.query.to) : new Date();
        to.setHours(23, 59, 59, 999);
        const invoices = await database_1.prisma.invoice.findMany({
            where: { createdAt: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
            include: {
                customer: { select: { name: true, phone: true } },
                payments: { where: { refunded: false } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const data = invoices.map((inv) => {
            const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
            return {
                'Invoice #': inv.number,
                Customer: inv.customer.name,
                Phone: inv.customer.phone,
                Status: inv.status,
                'Tax Amount': Number(inv.taxAmount),
                Discount: Number(inv.discount),
                'Total Amount': Number(inv.totalAmount),
                'Amount Paid': paid,
                Outstanding: Math.max(0, Number(inv.totalAmount) - paid),
                Date: inv.createdAt.toLocaleDateString('en-IN'),
            };
        });
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = [
            { wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 10 },
            { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 13 }, { wch: 13 }, { wch: 14 },
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="sales-report-${from.toISOString().split('T')[0]}-to-${to.toISOString().split('T')[0]}.xlsx"`);
        res.send(buf);
    }
    catch (e) {
        next(e);
    }
});
// ── Customer Export ────────────────────────────────────────────
exports.importExportRouter.get('/customers/export', async (_req, res, next) => {
    try {
        const customers = await database_1.prisma.customer.findMany({ orderBy: { name: 'asc' } });
        const data = customers.map((c) => ({
            Name: c.name, Phone: c.phone, Email: c.email || '',
            Address: c.address || '', Notes: c.notes || '',
            'Created At': c.createdAt.toLocaleDateString('en-IN'),
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Customers');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="customers-export-${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(buf);
    }
    catch (e) {
        next(e);
    }
});
// ── WhatsApp Share Endpoint ───────────────────────────────────
/**
 * POST /api/import-export/prepare-send
 * Returns:
 *   - pdfUrl   — direct URL to the PDF file (already saved with customer+number naming)
 *   - pdfName  — readable filename for display
 *   - whatsappUrl — wa.me deep-link with pre-filled message text
 *   - phone    — raw phone number
 *   - message  — the pre-filled WhatsApp message text (also URL-encoded in whatsappUrl)
 */
exports.importExportRouter.post('/prepare-send', async (req, res, next) => {
    try {
        const { type, id } = req.body;
        if (!type || !id)
            throw new AppError_1.ValidationError('type and id are required');
        // Get business settings for message template
        const settingsRows = await database_1.prisma.setting.findMany();
        const settings = settingsRows.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {});
        const bizName = settings.business_name || 'Our Business';
        const currency = settings.currency_symbol || '₹';
        const phone_setting = settings.whatsapp_phone || settings.business_phone || '';
        let pdfUrl = '';
        let pdfName = '';
        let phone = '';
        let message = '';
        if (type === 'invoice') {
            const invoice = await database_1.prisma.invoice.findUnique({
                where: { id },
                include: {
                    customer: true,
                    payments: { where: { refunded: false } },
                },
            });
            if (!invoice)
                throw new AppError_1.NotFoundError('Invoice');
            // Generate PDF if not already generated
            if (!invoice.pdfUrl) {
                const { pdfService } = await Promise.resolve().then(() => __importStar(require('../pdf/pdf.service')));
                const url = await pdfService.generateInvoicePdf(id);
                await database_1.prisma.invoice.update({ where: { id }, data: { pdfUrl: url } });
                pdfUrl = url;
            }
            else {
                pdfUrl = invoice.pdfUrl;
            }
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
            if (paid > 0)
                lines.push(`✅ *Paid:* ${currency}${paid.toFixed(2)}`);
            if (outstanding > 0.01)
                lines.push(`⏳ *Outstanding:* ${currency}${outstanding.toFixed(2)}`);
            lines.push(``);
            lines.push(`Please find the PDF invoice attached.`);
            if (settings.receipt_footer)
                lines.push(``, settings.receipt_footer);
            message = lines.join('\n');
        }
        else if (type === 'repair') {
            const repair = await database_1.prisma.repairJob.findUnique({
                where: { id },
                include: { customer: true },
            });
            if (!repair)
                throw new AppError_1.NotFoundError('Repair job');
            if (!repair.pdfUrl) {
                const { pdfService } = await Promise.resolve().then(() => __importStar(require('../pdf/pdf.service')));
                const url = await pdfService.generateRepairPdf(id);
                await database_1.prisma.repairJob.update({ where: { id }, data: { pdfUrl: url } });
                pdfUrl = url;
            }
            else {
                pdfUrl = repair.pdfUrl;
            }
            phone = repair.customer.phone.replace(/\D/g, '');
            pdfName = pdfUrl.split('/').pop() || `${repair.jobId}.pdf`;
            const statusMessages = {
                RECEIVED: 'We have received your device and it is being logged.',
                DIAGNOSING: 'Our technician is currently diagnosing your device.',
                WAITING_FOR_PARTS: 'We are waiting for the required parts to arrive.',
                IN_REPAIR: 'Your device is currently being repaired.',
                READY: 'Great news! Your device is repaired and ready for collection.',
                DELIVERED: 'Your device has been delivered. Thank you!',
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
            }
            else if (repair.estimatedCost) {
                lines.push(``, `💰 *Estimated Cost:* ${currency}${Number(repair.estimatedCost).toFixed(2)}`);
            }
            lines.push(``, `Please find the job card attached.`);
            if (settings.receipt_footer)
                lines.push(``, settings.receipt_footer);
            message = lines.join('\n');
        }
        else {
            throw new AppError_1.ValidationError('Invalid type. Must be "invoice" or "repair"');
        }
        // Build wa.me URL - phone must be E.164 without +
        const cleanPhone = phone.replace(/^\+/, '');
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || '';
        const pdfDirectUrl = appUrl ? `${appUrl}${pdfUrl}` : pdfUrl;
        res.json({
            pdfUrl: pdfDirectUrl,
            pdfName,
            phone,
            message,
            whatsappUrl,
        });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=importExport.routes.js.map