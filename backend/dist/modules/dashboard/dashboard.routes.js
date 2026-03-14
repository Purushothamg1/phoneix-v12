"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const database_1 = require("../../config/database");
exports.dashboardRouter = (0, express_1.Router)();
exports.dashboardRouter.use(auth_middleware_1.authenticate);
exports.dashboardRouter.get('/', async (_req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const [todaySales, monthlyRevenue, activeRepairs, recentInvoices, recentRepairs, 
        // FIX: raw SQL to compare two columns (stockQty <= minStockLevel)
        lowStockItems, salesByDayRaw,] = await Promise.all([
            database_1.prisma.invoice.aggregate({
                where: { createdAt: { gte: today, lte: todayEnd }, status: { not: 'CANCELLED' } },
                _sum: { totalAmount: true },
                _count: true,
            }),
            database_1.prisma.invoice.aggregate({
                where: { createdAt: { gte: monthStart }, status: { not: 'CANCELLED' } },
                _sum: { totalAmount: true },
                _count: true,
            }),
            database_1.prisma.repairJob.count({ where: { status: { notIn: ['DELIVERED'] } } }),
            database_1.prisma.invoice.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { customer: { select: { name: true } } },
            }),
            database_1.prisma.repairJob.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                where: { status: { notIn: ['DELIVERED'] } },
                include: { customer: { select: { name: true } } },
            }),
            // FIX: compare columns via raw SQL
            database_1.prisma.$queryRaw `
        SELECT id, name, "stockQty", "minStockLevel"
        FROM "Product"
        WHERE "stockQty" <= "minStockLevel"
        ORDER BY "stockQty" ASC
        LIMIT 20
      `,
            // FIX: cast BigInt/Decimal to string-safe types
            database_1.prisma.$queryRaw `
        SELECT DATE("createdAt") as date, SUM("totalAmount")::float as total
        FROM "Invoice"
        WHERE "createdAt" >= ${monthStart} AND status != 'CANCELLED'
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
        ]);
        // Serialize BigInts and Decimals safely
        const salesByDay = salesByDayRaw.map((r) => ({
            date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date),
            total: Number(r.total) || 0,
        }));
        res.json({
            todaySales: {
                amount: Number(todaySales._sum.totalAmount) || 0,
                count: todaySales._count,
            },
            monthlyRevenue: {
                amount: Number(monthlyRevenue._sum.totalAmount) || 0,
                count: monthlyRevenue._count,
            },
            activeRepairs,
            lowStockAlerts: lowStockItems.length,
            lowStockItems,
            recentInvoices,
            recentRepairs,
            salesByDay,
        });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=dashboard.routes.js.map