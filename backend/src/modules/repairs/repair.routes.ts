// ============================================================
// REPAIR ROUTES
// ============================================================
import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { repairService } from './repair.service';
import { Request, Response, NextFunction } from 'express';

export const repairRouter = Router();
repairRouter.use(authenticate);

const createRepairSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  deviceType: Joi.string().required(),
  brand: Joi.string().required(),
  model: Joi.string().required(),
  serialNumber: Joi.string().optional().allow('', null),
  issueDescription: Joi.string().required(),
  technicianId: Joi.string().uuid().optional().allow(null),
  estimatedCost: Joi.number().min(0).optional().allow(null),
  parts: Joi.array().items(
    Joi.object({
      productId: Joi.string().uuid().required(),
      qty: Joi.number().integer().min(1).required(),
      cost: Joi.number().min(0).required(),
    })
  ).optional(),
});

const updateRepairSchema = Joi.object({
  status: Joi.string().valid('RECEIVED','DIAGNOSING','WAITING_FOR_PARTS','IN_REPAIR','READY','DELIVERED').optional(),
  repairNotes: Joi.string().optional().allow('', null),
  technicianId: Joi.string().uuid().optional().allow(null),
  finalCost: Joi.number().min(0).optional().allow(null),
  estimatedCost: Joi.number().min(0).optional().allow(null),
});

repairRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await repairService.list(req.query as Record<string, string>)); }
  catch (e) { next(e); }
});

repairRouter.post('/', celebrate({ [Segments.BODY]: createRepairSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json(await repairService.create(req.body)); }
  catch (e) { next(e); }
});

repairRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await repairService.getById(req.params.id)); }
  catch (e) { next(e); }
});

repairRouter.put('/:id', celebrate({ [Segments.BODY]: updateRepairSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await repairService.update(req.params.id, req.body)); }
  catch (e) { next(e); }
});

repairRouter.delete('/:id', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try { await repairService.remove(req.params.id); res.status(204).send(); }
  catch (e) { next(e); }
});

// Regenerate PDF for an existing repair job
repairRouter.post('/:id/regenerate-pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pdfService } = await import('../pdf/pdf.service');
    const pdfUrl = await pdfService.generateRepairPdf(req.params.id);
    await require('../../config/database').prisma.repairJob.update({
      where: { id: req.params.id },
      data: { pdfUrl },
    });
    res.json({ pdfUrl });
  } catch (e) { next(e); }
});

// Create invoice from completed repair job
repairRouter.post('/:id/create-invoice', authorize('ADMIN', 'MANAGER', 'STAFF'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prisma } = await import('../../config/database');
    const { invoiceService } = await import('../invoices/invoice.service');
    const { ValidationError, NotFoundError } = await import('../../shared/errors/AppError');

    const repair = await prisma.repairJob.findUnique({
      where: { id: req.params.id },
      include: { customer: true, parts: { include: { product: true } } },
    });
    if (!repair) throw new NotFoundError('Repair job');
    if (!['READY', 'DELIVERED'].includes(repair.status)) {
      throw new ValidationError('Can only create invoice for repairs with status READY or DELIVERED');
    }

    const serviceAmount = Number(repair.finalCost || repair.estimatedCost || 0);
    const items: { productId?: string; description: string; qty: number; unitPrice: number; tax: number }[] = [];

    items.push({
      description: `Repair Service – ${repair.brand} ${repair.model} (${repair.deviceType}) [${repair.jobId}]`,
      qty: 1,
      unitPrice: serviceAmount,
      tax: 0,
    });

    for (const part of repair.parts) {
      items.push({
        productId: part.productId,
        description: `${part.product.name} (Part)`,
        qty: part.qty,
        unitPrice: Number(part.cost),
        tax: 0,
      });
    }

    const invoice = await invoiceService.create({
      customerId: repair.customerId,
      discount: 0,
      items,
    });

    await prisma.repairJob.update({
      where: { id: req.params.id },
      data: { status: 'DELIVERED' },
    });

    res.status(201).json(invoice);
  } catch (e) { next(e); }
});
