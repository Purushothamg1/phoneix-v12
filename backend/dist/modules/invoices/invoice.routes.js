"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceRouter = void 0;
const express_1 = require("express");
const celebrate_1 = require("celebrate");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const invoice_service_1 = require("./invoice.service");
exports.invoiceRouter = (0, express_1.Router)();
exports.invoiceRouter.use(auth_middleware_1.authenticate);
const itemSchema = celebrate_1.Joi.object({
    productId: celebrate_1.Joi.string().uuid().optional().allow(null),
    description: celebrate_1.Joi.string().required(),
    qty: celebrate_1.Joi.number().integer().min(1).required(),
    unitPrice: celebrate_1.Joi.number().min(0).required(),
    tax: celebrate_1.Joi.number().min(0).max(100).optional(),
});
const createSchema = celebrate_1.Joi.object({
    customerId: celebrate_1.Joi.string().uuid().required(),
    discount: celebrate_1.Joi.number().min(0).optional(),
    items: celebrate_1.Joi.array().items(itemSchema).min(1).required(),
});
exports.invoiceRouter.get('/', async (req, res, next) => {
    try {
        res.json(await invoice_service_1.invoiceService.list(req.query));
    }
    catch (e) {
        next(e);
    }
});
exports.invoiceRouter.post('/', (0, celebrate_1.celebrate)({ [celebrate_1.Segments.BODY]: createSchema }), async (req, res, next) => {
    try {
        res.status(201).json(await invoice_service_1.invoiceService.create(req.body));
    }
    catch (e) {
        next(e);
    }
});
exports.invoiceRouter.get('/:id', async (req, res, next) => {
    try {
        res.json(await invoice_service_1.invoiceService.getById(req.params.id));
    }
    catch (e) {
        next(e);
    }
});
exports.invoiceRouter.put('/:id', (0, auth_middleware_1.authorize)('ADMIN', 'MANAGER'), async (req, res, next) => {
    try {
        res.json(await invoice_service_1.invoiceService.update(req.params.id, req.body));
    }
    catch (e) {
        next(e);
    }
});
exports.invoiceRouter.post('/:id/cancel', (0, auth_middleware_1.authorize)('ADMIN', 'MANAGER'), async (req, res, next) => {
    try {
        res.json(await invoice_service_1.invoiceService.cancel(req.params.id));
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=invoice.routes.js.map