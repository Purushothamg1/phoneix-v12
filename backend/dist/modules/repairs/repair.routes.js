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
exports.repairRouter = void 0;
// ============================================================
// REPAIR ROUTES
// ============================================================
const express_1 = require("express");
const celebrate_1 = require("celebrate");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const repair_service_1 = require("./repair.service");
exports.repairRouter = (0, express_1.Router)();
exports.repairRouter.use(auth_middleware_1.authenticate);
const createRepairSchema = celebrate_1.Joi.object({
    customerId: celebrate_1.Joi.string().uuid().required(),
    deviceType: celebrate_1.Joi.string().required(),
    brand: celebrate_1.Joi.string().required(),
    model: celebrate_1.Joi.string().required(),
    serialNumber: celebrate_1.Joi.string().optional().allow('', null),
    issueDescription: celebrate_1.Joi.string().required(),
    technicianId: celebrate_1.Joi.string().uuid().optional().allow(null),
    estimatedCost: celebrate_1.Joi.number().min(0).optional().allow(null),
    parts: celebrate_1.Joi.array().items(celebrate_1.Joi.object({
        productId: celebrate_1.Joi.string().uuid().required(),
        qty: celebrate_1.Joi.number().integer().min(1).required(),
        cost: celebrate_1.Joi.number().min(0).required(),
    })).optional(),
});
const updateRepairSchema = celebrate_1.Joi.object({
    status: celebrate_1.Joi.string().valid('RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'IN_REPAIR', 'READY', 'DELIVERED').optional(),
    repairNotes: celebrate_1.Joi.string().optional().allow('', null),
    technicianId: celebrate_1.Joi.string().uuid().optional().allow(null),
    finalCost: celebrate_1.Joi.number().min(0).optional().allow(null),
    estimatedCost: celebrate_1.Joi.number().min(0).optional().allow(null),
});
exports.repairRouter.get('/', async (req, res, next) => {
    try {
        res.json(await repair_service_1.repairService.list(req.query));
    }
    catch (e) {
        next(e);
    }
});
exports.repairRouter.post('/', (0, celebrate_1.celebrate)({ [celebrate_1.Segments.BODY]: createRepairSchema }), async (req, res, next) => {
    try {
        res.status(201).json(await repair_service_1.repairService.create(req.body));
    }
    catch (e) {
        next(e);
    }
});
exports.repairRouter.get('/:id', async (req, res, next) => {
    try {
        res.json(await repair_service_1.repairService.getById(req.params.id));
    }
    catch (e) {
        next(e);
    }
});
exports.repairRouter.put('/:id', (0, celebrate_1.celebrate)({ [celebrate_1.Segments.BODY]: updateRepairSchema }), async (req, res, next) => {
    try {
        res.json(await repair_service_1.repairService.update(req.params.id, req.body));
    }
    catch (e) {
        next(e);
    }
});
exports.repairRouter.delete('/:id', (0, auth_middleware_1.authorize)('ADMIN'), async (req, res, next) => {
    try {
        await repair_service_1.repairService.remove(req.params.id);
        res.status(204).send();
    }
    catch (e) {
        next(e);
    }
});
// Regenerate PDF for an existing repair job
exports.repairRouter.post('/:id/regenerate-pdf', async (req, res, next) => {
    try {
        const { pdfService } = await Promise.resolve().then(() => __importStar(require('../pdf/pdf.service')));
        const pdfUrl = await pdfService.generateRepairPdf(req.params.id);
        await require('../../config/database').prisma.repairJob.update({
            where: { id: req.params.id },
            data: { pdfUrl },
        });
        res.json({ pdfUrl });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=repair.routes.js.map