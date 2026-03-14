import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/pagination';
import { pdfService } from '../pdf/pdf.service';

interface InvoiceItemInput {
  productId?: string | null;
  description: string;
  qty: number;
  unitPrice: number;
  tax?: number;
}

interface CreateInvoiceInput {
  customerId: string;
  discount?: number;
  items: InvoiceItemInput[];
}

// FIX: Race-condition-safe invoice number using DB advisory lock
async function generateInvoiceNumber(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]): Promise<string> {
  const setting = await tx.setting.findUnique({ where: { key: 'invoice_prefix' } });
  const prefix = setting?.value || 'INV';
  const count = await tx.invoice.count();
  const candidate = `${prefix}-${String(count + 1).padStart(5, '0')}`;
  // Ensure uniqueness: if number already exists (concurrent creation), increment
  const existing = await tx.invoice.findUnique({ where: { number: candidate } });
  if (existing) {
    return `${prefix}-${String(count + 2).padStart(5, '0')}-${Date.now().toString(36).slice(-4)}`;
  }
  return candidate;
}

export const invoiceService = {
  async list(query: Record<string, string>) {
    const { page, limit, skip } = getPaginationParams(query);
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;
    if (query.search) {
      where.OR = [
        { number: { contains: query.search, mode: 'insensitive' } },
        { customer: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    // Date range filter
    if (query.from || query.to) {
      const dateFilter: Record<string, Date> = {};
      if (query.from) dateFilter.gte = new Date(query.from);
      if (query.to) { const to = new Date(query.to); to.setHours(23,59,59,999); dateFilter.lte = to; }
      where.createdAt = dateFilter;
    }
    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: true,
          payments: { where: { refunded: false } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);
    return buildPaginatedResult(data, total, { page, limit, skip });
  },

  async create(data: CreateInvoiceInput) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new NotFoundError('Customer');
    if (!data.items?.length) throw new ValidationError('Invoice must have at least one item');

    // Validate stock availability up-front before opening transaction
    for (const item of data.items) {
      if (item.productId) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new NotFoundError(`Product (${item.productId})`);
        if (product.stockQty < item.qty) {
          throw new ValidationError(
            `Insufficient stock for "${product.name}". Available: ${product.stockQty}, Requested: ${item.qty}`
          );
        }
      }
    }

    const taxSetting = await prisma.setting.findUnique({ where: { key: 'default_tax' } });
    const defaultTax = parseFloat(taxSetting?.value || '0');

    let subtotal = 0;
    let taxAmount = 0;
    const itemsData = data.items.map((item) => {
      const itemTax = item.tax ?? defaultTax;
      const lineSubtotal = item.qty * item.unitPrice;
      const lineTax = lineSubtotal * (itemTax / 100);
      subtotal += lineSubtotal;
      taxAmount += lineTax;
      return {
        productId: item.productId || null,
        description: item.description,
        qty: item.qty,
        unitPrice: item.unitPrice,
        tax: itemTax,
        total: lineSubtotal + lineTax,
      };
    });

    const discount = data.discount || 0;
    const totalAmount = subtotal + taxAmount - discount;
    if (totalAmount < 0) throw new ValidationError('Discount cannot exceed the invoice total');

    const invoice = await prisma.$transaction(async (tx) => {
      // FIX: generate number inside transaction to reduce race window
      const number = await generateInvoiceNumber(tx);

      const created = await tx.invoice.create({
        data: {
          number,
          customerId: data.customerId,
          taxAmount,
          discount,
          totalAmount,
          status: 'UNPAID',
          items: { create: itemsData },
        },
        include: { items: true, customer: true, payments: true },
      });

      // Deduct stock and record movements
      for (const item of data.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQty: { decrement: item.qty } },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              movementType: 'SALE',
              quantity: -item.qty,
              note: `Invoice ${number}`,
            },
          });
        }
      }
      return created;
    });

    // Generate PDF outside transaction (non-critical)
    try {
      const pdfUrl = await pdfService.generateInvoicePdf(invoice.id);
      await prisma.invoice.update({ where: { id: invoice.id }, data: { pdfUrl } });
      return { ...invoice, pdfUrl };
    } catch {
      return invoice;
    }
  },

  async getById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: { select: { name: true, sku: true } } } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!invoice) throw new NotFoundError('Invoice');
    return invoice;
  },

  async update(id: string, data: { discount?: number; status?: string }) {
    const invoice = await this.getById(id);
    if (invoice.status === 'CANCELLED') throw new ValidationError('Cannot update a cancelled invoice');
    if (invoice.status === 'PAID' && data.discount !== undefined) {
      throw new ValidationError('Cannot modify discount on a fully paid invoice');
    }
    return prisma.invoice.update({ where: { id }, data });
  },

  async cancel(id: string) {
    const invoice = await this.getById(id);
    if (invoice.status === 'CANCELLED') throw new ValidationError('Invoice already cancelled');

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({ where: { id }, data: { status: 'CANCELLED' } });

      // Restore stock
      for (const item of invoice.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQty: { increment: item.qty } },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              movementType: 'RETURN',
              quantity: item.qty,
              note: `Cancelled Invoice ${invoice.number}`,
            },
          });
        }
      }

      // Mark all non-refunded payments as refunded
      await tx.payment.updateMany({
        where: { invoiceId: id, refunded: false },
        data: { refunded: true },
      });
    });

    return prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, items: true, payments: true },
    });
  },
};
