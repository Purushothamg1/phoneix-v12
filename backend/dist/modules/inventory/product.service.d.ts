import { MovementType } from '@prisma/client';
export interface ProductCreateInput {
    name: string;
    sku: string;
    barcode?: string | null;
    category?: string | null;
    purchasePrice: number;
    sellingPrice: number;
    stockQty?: number;
    minStockLevel?: number;
}
export declare const productService: {
    list(query: Record<string, string>): Promise<import("../../shared/utils/pagination").PaginatedResult<{
        id: string;
        createdAt: Date;
        name: string;
        sku: string;
        barcode: string | null;
        category: string | null;
        imageUrl: string | null;
        purchasePrice: import("@prisma/client/runtime/library").Decimal;
        sellingPrice: import("@prisma/client/runtime/library").Decimal;
        stockQty: number;
        minStockLevel: number;
    }>>;
    lowStock(): Promise<{
        id: string;
        name: string;
        sku: string;
        category: string | null;
        stockQty: number;
        minStockLevel: number;
        sellingPrice: number;
    }[]>;
    categories(): Promise<(string | null)[]>;
    create(data: ProductCreateInput): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        sku: string;
        barcode: string | null;
        category: string | null;
        imageUrl: string | null;
        purchasePrice: import("@prisma/client/runtime/library").Decimal;
        sellingPrice: import("@prisma/client/runtime/library").Decimal;
        stockQty: number;
        minStockLevel: number;
    }>;
    getById(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        sku: string;
        barcode: string | null;
        category: string | null;
        imageUrl: string | null;
        purchasePrice: import("@prisma/client/runtime/library").Decimal;
        sellingPrice: import("@prisma/client/runtime/library").Decimal;
        stockQty: number;
        minStockLevel: number;
    }>;
    update(id: string, data: ProductCreateInput): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        sku: string;
        barcode: string | null;
        category: string | null;
        imageUrl: string | null;
        purchasePrice: import("@prisma/client/runtime/library").Decimal;
        sellingPrice: import("@prisma/client/runtime/library").Decimal;
        stockQty: number;
        minStockLevel: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        sku: string;
        barcode: string | null;
        category: string | null;
        imageUrl: string | null;
        purchasePrice: import("@prisma/client/runtime/library").Decimal;
        sellingPrice: import("@prisma/client/runtime/library").Decimal;
        stockQty: number;
        minStockLevel: number;
    }>;
    adjustStock(id: string, quantity: number, movementType: MovementType, note?: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        sku: string;
        barcode: string | null;
        category: string | null;
        imageUrl: string | null;
        purchasePrice: import("@prisma/client/runtime/library").Decimal;
        sellingPrice: import("@prisma/client/runtime/library").Decimal;
        stockQty: number;
        minStockLevel: number;
    }>;
    getMovements(id: string, query: Record<string, string>): Promise<import("../../shared/utils/pagination").PaginatedResult<{
        id: string;
        createdAt: Date;
        productId: string;
        movementType: import(".prisma/client").$Enums.MovementType;
        quantity: number;
        note: string | null;
    }>>;
};
//# sourceMappingURL=product.service.d.ts.map