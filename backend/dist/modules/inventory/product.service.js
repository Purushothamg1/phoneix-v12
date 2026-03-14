"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = void 0;
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
const pagination_1 = require("../../shared/utils/pagination");
exports.productService = {
    async list(query) {
        const { page, limit, skip } = (0, pagination_1.getPaginationParams)(query);
        const where = {};
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { sku: { contains: query.search, mode: 'insensitive' } },
                { barcode: { contains: query.search } },
            ];
        }
        if (query.category)
            where.category = { equals: query.category, mode: 'insensitive' };
        const [data, total] = await Promise.all([
            database_1.prisma.product.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
            database_1.prisma.product.count({ where }),
        ]);
        return (0, pagination_1.buildPaginatedResult)(data, total, { page, limit, skip });
    },
    // FIX: prisma.product.fields.minStockLevel is NOT valid Prisma API — use raw SQL
    async lowStock() {
        return database_1.prisma.$queryRaw `
      SELECT id, name, sku, category, "stockQty", "minStockLevel", "sellingPrice"
      FROM "Product"
      WHERE "stockQty" <= "minStockLevel"
      ORDER BY "stockQty" ASC
    `;
    },
    async categories() {
        const cats = await database_1.prisma.product.findMany({
            where: { category: { not: null } },
            select: { category: true },
            distinct: ['category'],
            orderBy: { category: 'asc' },
        });
        return cats.map((c) => c.category).filter(Boolean);
    },
    async create(data) {
        const existingSku = await database_1.prisma.product.findUnique({ where: { sku: data.sku } });
        if (existingSku)
            throw new AppError_1.ConflictError('Product with this SKU already exists');
        if (data.barcode) {
            const existingBarcode = await database_1.prisma.product.findUnique({ where: { barcode: data.barcode } });
            if (existingBarcode)
                throw new AppError_1.ConflictError('Product with this barcode already exists');
        }
        return database_1.prisma.product.create({ data });
    },
    async getById(id) {
        const product = await database_1.prisma.product.findUnique({ where: { id } });
        if (!product)
            throw new AppError_1.NotFoundError('Product');
        return product;
    },
    async update(id, data) {
        await this.getById(id);
        const dupSku = await database_1.prisma.product.findFirst({ where: { sku: data.sku, NOT: { id } } });
        if (dupSku)
            throw new AppError_1.ConflictError('Another product with this SKU exists');
        if (data.barcode) {
            const dupBarcode = await database_1.prisma.product.findFirst({ where: { barcode: data.barcode, NOT: { id } } });
            if (dupBarcode)
                throw new AppError_1.ConflictError('Another product with this barcode exists');
        }
        return database_1.prisma.product.update({ where: { id }, data });
    },
    async remove(id) {
        await this.getById(id);
        return database_1.prisma.product.delete({ where: { id } });
    },
    async adjustStock(id, quantity, movementType, note) {
        const product = await this.getById(id);
        const newQty = product.stockQty + quantity;
        if (newQty < 0)
            throw new AppError_1.ValidationError(`Stock adjustment would result in negative stock. Current: ${product.stockQty}, Requested change: ${quantity}`);
        return database_1.prisma.$transaction(async (tx) => {
            const updated = await tx.product.update({
                where: { id },
                data: { stockQty: newQty },
            });
            await tx.stockMovement.create({
                data: { productId: id, movementType, quantity, note },
            });
            return updated;
        });
    },
    async getMovements(id, query) {
        await this.getById(id);
        const { page, limit, skip } = (0, pagination_1.getPaginationParams)(query);
        const [data, total] = await Promise.all([
            database_1.prisma.stockMovement.findMany({
                where: { productId: id },
                skip, take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            database_1.prisma.stockMovement.count({ where: { productId: id } }),
        ]);
        return (0, pagination_1.buildPaginatedResult)(data, total, { page, limit, skip });
    },
};
//# sourceMappingURL=product.service.js.map