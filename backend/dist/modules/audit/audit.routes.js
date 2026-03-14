"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const database_1 = require("../../config/database");
const pagination_1 = require("../../shared/utils/pagination");
exports.auditRouter = (0, express_1.Router)();
exports.auditRouter.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMIN', 'MANAGER'));
/**
 * GET /api/audit
 * Returns a paginated list of audit log entries, newest first.
 * Query params: page, limit, userId, action, from, to
 */
exports.auditRouter.get('/', async (req, res, next) => {
    try {
        const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req.query);
        const { userId, action, from, to } = req.query;
        const where = {};
        if (userId)
            where.userId = userId;
        if (action)
            where.action = action;
        if (from || to) {
            const dateFilter = {};
            if (from)
                dateFilter.gte = new Date(from);
            if (to) {
                const d = new Date(to);
                d.setHours(23, 59, 59, 999);
                dateFilter.lte = d;
            }
            where.createdAt = dateFilter;
        }
        const [data, total] = await Promise.all([
            database_1.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, email: true, role: true } },
                },
            }),
            database_1.prisma.auditLog.count({ where }),
        ]);
        res.json((0, pagination_1.buildPaginatedResult)(data, total, { page, limit, skip }));
    }
    catch (e) {
        next(e);
    }
});
/**
 * GET /api/audit/actions
 * Returns distinct action values for filter dropdowns.
 */
exports.auditRouter.get('/actions', async (_req, res, next) => {
    try {
        const rows = await database_1.prisma.auditLog.findMany({
            distinct: ['action'],
            select: { action: true },
            orderBy: { action: 'asc' },
        });
        res.json(rows.map((r) => r.action));
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=audit.routes.js.map