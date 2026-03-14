"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierRouter = void 0;
// ============================================================
// SUPPLIER ROUTES
// ============================================================
const express_1 = require("express");
const celebrate_1 = require("celebrate");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
const pagination_1 = require("../../shared/utils/pagination");
exports.supplierRouter = (0, express_1.Router)();
exports.supplierRouter.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMIN', 'MANAGER'));
const supplierSchema = celebrate_1.Joi.object({
    name: celebrate_1.Joi.string().min(2).max(100).required(),
    phone: celebrate_1.Joi.string().min(7).max(20).required(),
    email: celebrate_1.Joi.string().email().optional().allow('', null),
    address: celebrate_1.Joi.string().max(300).optional().allow('', null),
    paymentTerms: celebrate_1.Joi.string().max(200).optional().allow('', null),
});
async function listSuppliers(req, res, next) {
    try {
        const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req.query);
        const search = req.query.search;
        const where = search
            ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }] }
            : {};
        const [data, total] = await Promise.all([
            database_1.prisma.supplier.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
            database_1.prisma.supplier.count({ where }),
        ]);
        res.json((0, pagination_1.buildPaginatedResult)(data, total, { page, limit, skip }));
    }
    catch (e) {
        next(e);
    }
}
async function createSupplier(req, res, next) {
    try {
        const existing = await database_1.prisma.supplier.findFirst({ where: { phone: req.body.phone } });
        if (existing)
            throw new AppError_1.ConflictError('Supplier with this phone already exists');
        const supplier = await database_1.prisma.supplier.create({ data: req.body });
        res.status(201).json(supplier);
    }
    catch (e) {
        next(e);
    }
}
async function getSupplier(req, res, next) {
    try {
        const supplier = await database_1.prisma.supplier.findUnique({ where: { id: req.params.id } });
        if (!supplier)
            throw new AppError_1.NotFoundError('Supplier');
        res.json(supplier);
    }
    catch (e) {
        next(e);
    }
}
async function updateSupplier(req, res, next) {
    try {
        const existing = await database_1.prisma.supplier.findUnique({ where: { id: req.params.id } });
        if (!existing)
            throw new AppError_1.NotFoundError('Supplier');
        const supplier = await database_1.prisma.supplier.update({ where: { id: req.params.id }, data: req.body });
        res.json(supplier);
    }
    catch (e) {
        next(e);
    }
}
async function deleteSupplier(req, res, next) {
    try {
        const existing = await database_1.prisma.supplier.findUnique({ where: { id: req.params.id } });
        if (!existing)
            throw new AppError_1.NotFoundError('Supplier');
        await database_1.prisma.supplier.delete({ where: { id: req.params.id } });
        res.status(204).send();
    }
    catch (e) {
        next(e);
    }
}
exports.supplierRouter.get('/', listSuppliers);
exports.supplierRouter.post('/', (0, celebrate_1.celebrate)({ [celebrate_1.Segments.BODY]: supplierSchema }), createSupplier);
exports.supplierRouter.get('/:id', getSupplier);
exports.supplierRouter.put('/:id', (0, celebrate_1.celebrate)({ [celebrate_1.Segments.BODY]: supplierSchema }), updateSupplier);
exports.supplierRouter.delete('/:id', (0, auth_middleware_1.authorize)('ADMIN'), deleteSupplier);
//# sourceMappingURL=supplier.routes.js.map