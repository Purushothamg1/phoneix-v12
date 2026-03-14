"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerService = void 0;
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
const pagination_1 = require("../../shared/utils/pagination");
exports.customerService = {
    async list(query) {
        const { page, limit, skip } = (0, pagination_1.getPaginationParams)(query);
        const where = query.search
            ? {
                OR: [
                    { name: { contains: query.search, mode: 'insensitive' } },
                    { phone: { contains: query.search } },
                    { email: { contains: query.search, mode: 'insensitive' } },
                ],
            }
            : {};
        const [data, total] = await Promise.all([
            database_1.prisma.customer.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            database_1.prisma.customer.count({ where }),
        ]);
        return (0, pagination_1.buildPaginatedResult)(data, total, { page, limit, skip });
    },
    async create(data) {
        const existing = await database_1.prisma.customer.findFirst({ where: { phone: data.phone } });
        if (existing)
            throw new AppError_1.ConflictError('Customer with this phone already exists');
        return database_1.prisma.customer.create({ data });
    },
    async getById(id) {
        const customer = await database_1.prisma.customer.findUnique({ where: { id } });
        if (!customer)
            throw new AppError_1.NotFoundError('Customer');
        return customer;
    },
    async update(id, data) {
        await this.getById(id);
        const duplicate = await database_1.prisma.customer.findFirst({
            where: { phone: data.phone, NOT: { id } },
        });
        if (duplicate)
            throw new AppError_1.ConflictError('Another customer with this phone exists');
        return database_1.prisma.customer.update({ where: { id }, data });
    },
    async remove(id) {
        await this.getById(id);
        return database_1.prisma.customer.delete({ where: { id } });
    },
    async getHistory(id) {
        await this.getById(id);
        const [invoices, repairs, outstanding] = await Promise.all([
            database_1.prisma.invoice.findMany({
                where: { customerId: id },
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: { items: true, payments: true },
            }),
            database_1.prisma.repairJob.findMany({
                where: { customerId: id },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
            database_1.prisma.invoice.aggregate({
                where: { customerId: id, status: { in: ['UNPAID', 'PARTIAL'] } },
                _sum: { totalAmount: true },
            }),
        ]);
        return {
            invoices,
            repairs,
            outstandingBalance: outstanding._sum.totalAmount || 0,
        };
    },
};
//# sourceMappingURL=customer.service.js.map