import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';

export const paymentRouter = Router();
paymentRouter.use(authenticate, authorize('ADMIN', 'MANAGER'));

const paymentSchema = Joi.object({
  invoiceId: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  method: Joi.string().valid('CASH', 'UPI', 'CARD', 'BANK_TRANSFER').required(),
});

async function updateInvoiceStatus(invoiceId: string, tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: { where: { refunded: false } } },
  });
  if (!invoice) return;

  const paid = invoice.payments.reduce(
    (sum, p) => sum + parseFloat(p.amount.toString()), 0,
  );
  const total = parseFloat(invoice.totalAmount.toString());

  let status: 'UNPAID' | 'PARTIAL' | 'PAID' = 'UNPAID';
  if (paid >= total) status = 'PAID';
  else if (paid > 0) status = 'PARTIAL';

  await tx.invoice.update({ where: { id: invoiceId }, data: { status } });
}

// Record payment
paymentRouter.post(
  '/',
  celebrate({ [Segments.BODY]: paymentSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { invoiceId, amount, method } = req.body;
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: { where: { refunded: false } } },
      });
      if (!invoice) throw new NotFoundError('Invoice');
      if (invoice.status === 'CANCELLED') throw new ValidationError('Cannot pay a cancelled invoice');
      if (invoice.status === 'PAID') throw new ValidationError('Invoice is already fully paid');

      // FIX: prevent overpayment
      const alreadyPaid = invoice.payments.reduce(
        (sum, p) => sum + parseFloat(p.amount.toString()), 0,
      );
      const remaining = parseFloat(invoice.totalAmount.toString()) - alreadyPaid;
      if (amount > remaining + 0.01) {
        throw new ValidationError(
          `Payment amount (${amount}) exceeds outstanding balance (${remaining.toFixed(2)})`
        );
      }

      const payment = await prisma.$transaction(async (tx) => {
        const p = await tx.payment.create({ data: { invoiceId, amount, method } });
        await updateInvoiceStatus(invoiceId, tx);
        return p;
      });
      res.status(201).json(payment);
    } catch (e) { next(e); }
  },
);

// Refund payment
paymentRouter.post(
  '/refund',
  celebrate({ [Segments.BODY]: Joi.object({ paymentId: Joi.string().uuid().required() }) }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { paymentId } = req.body;
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { invoice: true },
      });
      if (!payment) throw new NotFoundError('Payment');
      if (payment.refunded) throw new ValidationError('Payment already refunded');
      if (payment.invoice.status === 'CANCELLED') {
        throw new ValidationError('Cannot refund a payment on a cancelled invoice individually — cancel the invoice instead');
      }

      const updated = await prisma.$transaction(async (tx) => {
        const p = await tx.payment.update({ where: { id: paymentId }, data: { refunded: true } });
        await updateInvoiceStatus(payment.invoiceId, tx);
        return p;
      });
      res.json(updated);
    } catch (e) { next(e); }
  },
);

// List payments — paginated with date filter
paymentRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId, from, to, method } = req.query as Record<string, string>;
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, string>);

    const where: Record<string, unknown> = {};
    if (invoiceId) where.invoiceId = invoiceId;
    if (method) where.method = method;
    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) { const d = new Date(to); d.setHours(23,59,59,999); dateFilter.lte = d; }
      where.createdAt = dateFilter;
    }

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: { select: { number: true, customer: { select: { name: true, phone: true } } } },
        },
      }),
      prisma.payment.count({ where }),
    ]);
    res.json(buildPaginatedResult(data, total, { page, limit, skip }));
  } catch (e) { next(e); }
});
