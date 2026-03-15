"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repairService = void 0;
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
const pagination_1 = require("../../shared/utils/pagination");
const pdf_util_1 = require("../../shared/utils/pdf.util");
async function generateJobId(tx) {
    const count = await tx.repairJob.count();
    const candidate = `JOB-${String(count + 1).padStart(5, '0')}`;
    const existing = await tx.repairJob.findUnique({ where: { jobId: candidate } });
    if (existing)
        return `JOB-${String(count + 2).padStart(5, '0')}-${Date.now().toString(36).slice(-4)}`;
    return candidate;
}
exports.repairService = {
    async list(query) {
        const { page, limit, skip } = (0, pagination_1.getPaginationParams)(query);
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.technicianId)
            where.technicianId = query.technicianId;
        if (query.customerId)
            where.customerId = query.customerId;
        if (query.search) {
            where.OR = [
                { jobId: { contains: query.search, mode: 'insensitive' } },
                { brand: { contains: query.search, mode: 'insensitive' } },
                { model: { contains: query.search, mode: 'insensitive' } },
                { customer: { name: { contains: query.search, mode: 'insensitive' } } },
            ];
        }
        if (query.from || query.to) {
            const dateFilter = {};
            if (query.from)
                dateFilter.gte = new Date(query.from);
            if (query.to) {
                const to = new Date(query.to);
                to.setHours(23, 59, 59, 999);
                dateFilter.lte = to;
            }
            where.createdAt = dateFilter;
        }
        const [data, total] = await Promise.all([
            database_1.prisma.repairJob.findMany({
                where, skip, take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    customer: { select: { id: true, name: true, phone: true } },
                    technician: { select: { id: true, name: true } },
                    parts: { include: { product: { select: { name: true, sku: true } } } },
                },
            }),
            database_1.prisma.repairJob.count({ where }),
        ]);
        return (0, pagination_1.buildPaginatedResult)(data, total, { page, limit, skip });
    },
    async create(data) {
        const customer = await database_1.prisma.customer.findUnique({ where: { id: data.customerId } });
        if (!customer)
            throw new AppError_1.NotFoundError('Customer');
        const { parts = [], ...jobData } = data;
        for (const part of parts) {
            const product = await database_1.prisma.product.findUnique({ where: { id: part.productId } });
            if (!product)
                throw new AppError_1.NotFoundError(`Product (${part.productId})`);
            if (product.stockQty < part.qty) {
                throw new AppError_1.ValidationError(`Insufficient stock for part "${product.name}". Available: ${product.stockQty}, Requested: ${part.qty}`);
            }
        }
        const repair = await database_1.prisma.$transaction(async (tx) => {
            const jobId = await generateJobId(tx);
            const job = await tx.repairJob.create({
                data: {
                    ...jobData,
                    jobId,
                    parts: parts.length ? {
                        create: parts.map((p) => ({ productId: p.productId, qty: p.qty, cost: p.cost })),
                    } : undefined,
                },
                include: {
                    customer: true,
                    technician: { select: { id: true, name: true } },
                    parts: { include: { product: { select: { name: true, sku: true } } } },
                },
            });
            for (const part of parts) {
                await tx.product.update({
                    where: { id: part.productId },
                    data: { stockQty: { decrement: part.qty } },
                });
                await tx.stockMovement.create({
                    data: {
                        productId: part.productId,
                        movementType: 'REPAIR_USAGE',
                        quantity: -part.qty,
                        note: `Repair ${jobId}`,
                    },
                });
            }
            return job;
        });
        try {
            const pdfUrl = await (0, pdf_util_1.generatePdf)((doc) => {
                doc.fontSize(25).text(`Repair Job #${repair.jobId}`, { align: 'center' });
                doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
                doc.moveDown();
                doc.text(`Customer: ${repair.customer.name}`);
                doc.text(`Phone: ${repair.customer.phone}`);
                doc.moveDown();
                doc.text('Device Information:');
                doc.text(`- Type: ${repair.deviceType}`);
                doc.text(`- Brand: ${repair.brand}`);
                doc.text(`- Model: ${repair.model}`);
                if (repair.serialNumber)
                    doc.text(`- Serial: ${repair.serialNumber}`);
            }, `repair-${repair.jobId}.pdf`);
            await database_1.prisma.repairJob.update({ where: { id: repair.id }, data: { pdfUrl } });
            return { ...repair, pdfUrl };
        }
        catch (error) {
            console.error('Error generating or saving PDF:', error);
            return repair;
        }
    },
    async getById(id) {
        const repair = await database_1.prisma.repairJob.findUnique({
            where: { id },
            include: {
                customer: true,
                technician: { select: { id: true, name: true } },
                parts: { include: { product: { select: { id: true, name: true, sku: true } } } },
            },
        });
        if (!repair)
            throw new AppError_1.NotFoundError('Repair job');
        if (repair.pdfUrl && !repair.pdfUrl.startsWith('/api/uploads/pdfs')) {
            repair.pdfUrl = `/api/uploads/pdfs/repair-${repair.jobId}.pdf`;
        }
        return repair;
    },
    async update(id, data) {
        const existing = await this.getById(id);
        if (existing.status === 'DELIVERED' && data.status && data.status !== 'DELIVERED') {
            throw new AppError_1.ValidationError('Cannot revert a delivered repair job');
        }
        const updateData = {};
        if (data.status !== undefined)
            updateData.status = data.status;
        if (data.repairNotes !== undefined)
            updateData.repairNotes = data.repairNotes;
        if (data.technicianId !== undefined)
            updateData.technicianId = data.technicianId;
        if (data.finalCost !== undefined)
            updateData.finalCost = data.finalCost;
        if (data.estimatedCost !== undefined)
            updateData.estimatedCost = data.estimatedCost;
        return database_1.prisma.repairJob.update({
            where: { id },
            data: updateData,
            include: {
                customer: true,
                technician: { select: { id: true, name: true } },
                parts: { include: { product: { select: { name: true } } } },
            },
        });
    },
    async remove(id) {
        const repair = await this.getById(id);
        if (!['RECEIVED', 'DIAGNOSING'].includes(repair.status)) {
            throw new AppError_1.ValidationError('Only repairs in RECEIVED or DIAGNOSING status can be deleted');
        }
        await database_1.prisma.$transaction(async (tx) => {
            for (const part of repair.parts) {
                await tx.product.update({
                    where: { id: part.productId },
                    data: { stockQty: { increment: part.qty } },
                });
                await tx.stockMovement.create({
                    data: {
                        productId: part.productId,
                        movementType: 'RETURN',
                        quantity: part.qty,
                        note: `Repair ${repair.jobId} deleted`,
                    },
                });
            }
            await tx.repairJob.delete({ where: { id } });
        });
    },
};
//# sourceMappingURL=repair.service.js.map