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
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceRouter = void 0;
// ============================================================
// INVOICE ROUTES
// ============================================================
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
// Regenerate PDF for an existing invoice
exports.invoiceRouter.post('/:id/regenerate-pdf', async (req, res, next) => {
    try {
        const { pdfService } = await Promise.resolve().then(() => __importStar(require('../pdf/pdf.service')));
        const pdfUrl = await pdfService.generateInvoicePdf(req.params.id);
        await require('../../config/database').prisma.invoice.update({
            where: { id: req.params.id },
            data: { pdfUrl },
        });
        res.json({ pdfUrl });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=invoice.routes.js.map