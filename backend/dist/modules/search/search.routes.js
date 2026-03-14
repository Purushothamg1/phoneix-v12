"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
exports.searchRouter = (0, express_1.Router)();
exports.searchRouter.use(auth_middleware_1.authenticate);
exports.searchRouter.get('/', async (req, res, next) => {
    try {
        const q = req.query.q?.trim();
        if (!q || q.length < 2)
            throw new AppError_1.ValidationError('Search query must be at least 2 characters');
        const [customers, products, invoices, repairs] = await Promise.all([
            database_1.prisma.customer.findMany({
                where: {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { phone: { contains: q } },
                        { email: { contains: q, mode: 'insensitive' } },
                    ],
                },
                take: 5,
            }),
            database_1.prisma.product.findMany({
                where: {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { sku: { contains: q, mode: 'insensitive' } },
                        { barcode: { contains: q } },
                    ],
                },
                take: 5,
            }),
            database_1.prisma.invoice.findMany({
                where: {
                    OR: [
                        { number: { contains: q, mode: 'insensitive' } },
                        { customer: { name: { contains: q, mode: 'insensitive' } } },
                    ],
                },
                take: 5,
                include: { customer: { select: { name: true } } },
            }),
            database_1.prisma.repairJob.findMany({
                where: {
                    OR: [
                        { jobId: { contains: q, mode: 'insensitive' } },
                        { brand: { contains: q, mode: 'insensitive' } },
                        { model: { contains: q, mode: 'insensitive' } },
                        { customer: { name: { contains: q, mode: 'insensitive' } } },
                    ],
                },
                take: 5,
                include: { customer: { select: { name: true } } },
            }),
        ]);
        res.json({ customers, products, invoices, repairs, query: q });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=search.routes.js.map