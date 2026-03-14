"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRouter = void 0;
const express_1 = require("express");
const celebrate_1 = require("celebrate");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
const pagination_1 = require("../../shared/utils/pagination");
exports.paymentRouter = (0, express_1.Router)();
exports.paymentRouter.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMIN', 'MANAGER'));
const paymentSchema = celebrate_1.Joi.object({
    invoiceId: celebrate_1.Joi.string().uuid().required(),
    amount: celebrate_1.Joi.number().positive().required(),
    method: celebrate_1.Joi.string().valid('CASH', 'UPI', 'CARD', 'BANK_TRANSFER').required(),
});
async function updateInvoiceStatus(invoiceId, tx) {
    const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: { where: { refunded: false } } },
    });
    if (!invoice)
        return;
    const paid = invoice.payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
    const total = parseFloat(invoice.totalAmount.toString());
    let status = 'UNPAID';
    if (paid >= total)
        status = 'PAID';
    else if (paid > 0)
        status = 'PARTIAL';
    await tx.invoice.update({ where: { id: invoiceId }, data: { status } });
}
// Record payment
exports.paymentRouter.post('/', (0, celebrate_1.celebrate)({ [celebrate_1.Segments.BODY]: paymentSchema }), async (req, res, next) => {
    try {
        const { invoiceId, amount, method } = req.body;
        const invoice = await database_1.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { payments: { where: { refunded: false } } },
        });
        if (!invoice)
            throw new AppError_1.NotFoundError('Invoice');
        if (invoice.status === 'CANCELLED')
            throw new AppError_1.ValidationError('Cannot pay a cancelled invoice');
        if (invoice.status === 'PAID')
            throw new AppError_1.ValidationError('Invoice is already fully paid');
        // FIX: prevent overpayment
        const alreadyPaid = invoice.payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
        const remaining = parseFloat(invoice.totalAmount.toString()) - alreadyPaid;
        if (amount > remaining + 0.01) {
            throw new AppError_1.ValidationError(`Payment amount (${amount}) exceeds outstanding balance (${remaining.toFixed(2)})`);
        }
        const payment = await database_1.prisma.$transaction(async (tx) => {
            const p = await tx.payment.create({ data: { invoiceId, amount, method } });
            await updateInvoiceStatus(invoiceId, tx);
            return p;
        });
        res.status(201).json(payment);
    }
    catch (e) {
        next(e);
    }
});
// Refund payment
exports.paymentRouter.post('/refund', (0, celebrate_1.celebrate)({ [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({ paymentId: celebrate_1.Joi.string().uuid().required() }) }), async (req, res, next) => {
    try {
        const { paymentId } = req.body;
        const payment = await database_1.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { invoice: true },
        });
        if (!payment)
            throw new AppError_1.NotFoundError('Payment');
        if (payment.refunded)
            throw new AppError_1.ValidationError('Payment already refunded');
        if (payment.invoice.status === 'CANCELLED') {
            throw new AppError_1.ValidationError('Cannot refund a payment on a cancelled invoice individually — cancel the invoice instead');
        }
        const updated = await database_1.prisma.$transaction(async (tx) => {
            const p = await tx.payment.update({ where: { id: paymentId }, data: { refunded: true } });
            await updateInvoiceStatus(payment.invoiceId, tx);
            return p;
        });
        res.json(updated);
    }
    catch (e) {
        next(e);
    }
});
// List payments — paginated with date filter
exports.paymentRouter.get('/', async (req, res, next) => {
    try {
        const { invoiceId, from, to, method } = req.query;
        const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req.query);
        const where = {};
        if (invoiceId)
            where.invoiceId = invoiceId;
        if (method)
            where.method = method;
        if (from || to) {
            const dateFilter = {};
            if (from)
                dateFilter.gte = new Date(from);
            if (to) {
                const d = new Date(to);
                d.setHours(23, 59, 59, 999);
                dateFilter.lte = d;
            }
            where.createdAt = dateFilter;
        }
        const [data, total] = await Promise.all([
            database_1.prisma.payment.findMany({
                where,
                skip, take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    invoice: { select: { number: true, customer: { select: { name: true, phone: true } } } },
                },
            }),
            database_1.prisma.payment.count({ where }),
        ]);
        res.json((0, pagination_1.buildPaginatedResult)(data, total, { page, limit, skip }));
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=payment.routes.js.map