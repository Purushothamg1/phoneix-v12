"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const database_1 = require("../../config/database");
exports.reportRouter = (0, express_1.Router)();
exports.reportRouter.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMIN', 'MANAGER'));
function dateRange(query) {
    const from = query.from
        ? new Date(query.from)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = query.to ? new Date(query.to) : new Date();
    to.setHours(23, 59, 59, 999);
    return { from, to };
}
// Sales Report
exports.reportRouter.get('/sales', async (req, res, next) => {
    try {
        const { from, to } = dateRange(req.query);
        const [invoices, totalRevenue, paidCount, unpaidCount, partialCount] = await Promise.all([
            database_1.prisma.invoice.findMany({
                where: { createdAt: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
                include: { customer: { select: { name: true } }, items: true, payments: true },
                orderBy: { createdAt: 'desc' },
            }),
            database_1.prisma.invoice.aggregate({
                where: { createdAt: { gte: from, lte: to }, status: 'PAID' },
                _sum: { totalAmount: true },
            }),
            database_1.prisma.invoice.count({ where: { createdAt: { gte: from, lte: to }, status: 'PAID' } }),
            database_1.prisma.invoice.count({ where: { createdAt: { gte: from, lte: to }, status: 'UNPAID' } }),
            database_1.prisma.invoice.count({ where: { createdAt: { gte: from, lte: to }, status: 'PARTIAL' } }),
        ]);
        res.json({
            invoices,
            totalRevenue: Number(totalRevenue._sum.totalAmount) || 0,
            paidCount, unpaidCount, partialCount,
            from, to,
        });
    }
    catch (e) {
        next(e);
    }
});
// Inventory Report — FIX: use raw SQL for column comparison
exports.reportRouter.get('/inventory', async (_req, res, next) => {
    try {
        const [products, lowStockItems, totalValue] = await Promise.all([
            database_1.prisma.product.findMany({ orderBy: { name: 'asc' } }),
            database_1.prisma.$queryRaw `
        SELECT id, name, "stockQty", "minStockLevel"
        FROM "Product"
        WHERE "stockQty" <= "minStockLevel"
        ORDER BY "stockQty" ASC
      `,
            database_1.prisma.product.findMany({ select: { stockQty: true, purchasePrice: true, sellingPrice: true } }),
        ]);
        const inventoryValue = totalValue.reduce((sum, p) => sum + p.stockQty * Number(p.purchasePrice), 0);
        const retailValue = totalValue.reduce((sum, p) => sum + p.stockQty * Number(p.sellingPrice), 0);
        res.json({
            products,
            lowStockCount: lowStockItems.length,
            lowStockItems,
            inventoryValue,
            retailValue,
            potentialProfit: retailValue - inventoryValue,
        });
    }
    catch (e) {
        next(e);
    }
});
// Repair Report
exports.reportRouter.get('/repairs', async (req, res, next) => {
    try {
        const { from, to } = dateRange(req.query);
        const [repairs, byStatus, revenue] = await Promise.all([
            database_1.prisma.repairJob.findMany({
                where: { createdAt: { gte: from, lte: to } },
                include: {
                    customer: { select: { name: true } },
                    technician: { select: { name: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            database_1.prisma.repairJob.groupBy({
                by: ['status'],
                where: { createdAt: { gte: from, lte: to } },
                _count: true,
            }),
            database_1.prisma.repairJob.aggregate({
                where: { createdAt: { gte: from, lte: to }, finalCost: { not: null } },
                _sum: { finalCost: true },
            }),
        ]);
        res.json({
            repairs,
            byStatus,
            totalRevenue: Number(revenue._sum.finalCost) || 0,
            from, to,
        });
    }
    catch (e) {
        next(e);
    }
});
// Financial Report
exports.reportRouter.get('/financial', async (req, res, next) => {
    try {
        const { from, to } = dateRange(req.query);
        const [revenue, payments, byMethod, refunds] = await Promise.all([
            database_1.prisma.invoice.aggregate({
                where: { createdAt: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
                _sum: { totalAmount: true, taxAmount: true, discount: true },
            }),
            database_1.prisma.payment.aggregate({
                where: { createdAt: { gte: from, lte: to }, refunded: false },
                _sum: { amount: true },
            }),
            database_1.prisma.payment.groupBy({
                by: ['method'],
                where: { createdAt: { gte: from, lte: to }, refunded: false },
                _sum: { amount: true },
                _count: true,
            }),
            database_1.prisma.payment.aggregate({
                where: { createdAt: { gte: from, lte: to }, refunded: true },
                _sum: { amount: true },
                _count: true,
            }),
        ]);
        res.json({
            revenue: {
                total: Number(revenue._sum.totalAmount) || 0,
                tax: Number(revenue._sum.taxAmount) || 0,
                discount: Number(revenue._sum.discount) || 0,
            },
            collected: Number(payments._sum.amount) || 0,
            byMethod: byMethod.map((m) => ({ ...m, _sum: { amount: Number(m._sum.amount) || 0 } })),
            refunds: {
                total: Number(refunds._sum.amount) || 0,
                count: refunds._count,
            },
            from, to,
        });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=report.routes.js.map