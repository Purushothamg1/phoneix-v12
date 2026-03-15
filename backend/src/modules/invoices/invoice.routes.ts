
import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { invoiceService } from './invoice.service';
import { Request, Response, NextFunction } from 'express';

export const invoiceRouter = Router();
invoiceRouter.use(authenticate);

const itemSchema = Joi.object({
  productId: Joi.string().uuid().optional().allow(null),
  description: Joi.string().required(),
  qty: Joi.number().integer().min(1).required(),
  unitPrice: Joi.number().min(0).required(),
  tax: Joi.number().min(0).max(100).optional(),
});

const createSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  discount: Joi.number().min(0).optional(),
  items: Joi.array().items(itemSchema).min(1).required(),
});

invoiceRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await invoiceService.list(req.query as Record<string, string>)); }
  catch (e) { next(e); }
});

invoiceRouter.post(
  '/',
  celebrate({ [Segments.BODY]: createSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json(await invoiceService.create(req.body)); }
    catch (e) { next(e); }
  },
);

invoiceRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await invoiceService.getById(req.params.id)); }
  catch (e) { next(e); }
});

invoiceRouter.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await invoiceService.update(req.params.id, req.body)); }
    catch (e) { next(e); }
  },
);

invoiceRouter.post('/:id/cancel', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await invoiceService.cancel(req.params.id)); }
  catch (e) { next(e); }
});
