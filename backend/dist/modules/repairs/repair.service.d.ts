interface PartInput {
    productId: string;
    qty: number;
    cost: number;
}
export declare const repairService: {
    list(query: Record<string, string>): Promise<import("../../shared/utils/pagination").PaginatedResult<{
        customer: {
            id: string;
            name: string;
            phone: string;
        };
        technician: {
            id: string;
            name: string;
        } | null;
        parts: ({
            product: {
                name: string;
                sku: string;
            };
        } & {
            id: string;
            productId: string;
            qty: number;
            repairJobId: string;
            cost: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        model: string;
        id: string;
        createdAt: Date;
        customerId: string;
        status: import(".prisma/client").$Enums.RepairStatus;
        pdfUrl: string | null;
        jobId: string;
        deviceType: string;
        brand: string;
        serialNumber: string | null;
        issueDescription: string;
        repairNotes: string | null;
        technicianId: string | null;
        estimatedCost: import("@prisma/client/runtime/library").Decimal | null;
        finalCost: import("@prisma/client/runtime/library").Decimal | null;
        updatedAt: Date;
    }>>;
    create(data: {
        customerId: string;
        deviceType: string;
        brand: string;
        model: string;
        serialNumber?: string;
        issueDescription: string;
        technicianId?: string;
        estimatedCost?: number;
        parts?: PartInput[];
    }): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            name: string;
            email: string | null;
            phone: string;
            address: string | null;
            notes: string | null;
        };
        technician: {
            id: string;
            name: string;
        } | null;
        parts: ({
            product: {
                name: string;
                sku: string;
            };
        } & {
            id: string;
            productId: string;
            qty: number;
            repairJobId: string;
            cost: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        model: string;
        id: string;
        createdAt: Date;
        customerId: string;
        status: import(".prisma/client").$Enums.RepairStatus;
        pdfUrl: string | null;
        jobId: string;
        deviceType: string;
        brand: string;
        serialNumber: string | null;
        issueDescription: string;
        repairNotes: string | null;
        technicianId: string | null;
        estimatedCost: import("@prisma/client/runtime/library").Decimal | null;
        finalCost: import("@prisma/client/runtime/library").Decimal | null;
        updatedAt: Date;
    }>;
    getById(id: string): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            name: string;
            email: string | null;
            phone: string;
            address: string | null;
            notes: string | null;
        };
        technician: {
            id: string;
            name: string;
        } | null;
        parts: ({
            product: {
                id: string;
                name: string;
                sku: string;
            };
        } & {
            id: string;
            productId: string;
            qty: number;
            repairJobId: string;
            cost: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        model: string;
        id: string;
        createdAt: Date;
        customerId: string;
        status: import(".prisma/client").$Enums.RepairStatus;
        pdfUrl: string | null;
        jobId: string;
        deviceType: string;
        brand: string;
        serialNumber: string | null;
        issueDescription: string;
        repairNotes: string | null;
        technicianId: string | null;
        estimatedCost: import("@prisma/client/runtime/library").Decimal | null;
        finalCost: import("@prisma/client/runtime/library").Decimal | null;
        updatedAt: Date;
    }>;
    update(id: string, data: {
        status?: string;
        repairNotes?: string;
        technicianId?: string;
        finalCost?: number;
        estimatedCost?: number;
    }): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            name: string;
            email: string | null;
            phone: string;
            address: string | null;
            notes: string | null;
        };
        technician: {
            id: string;
            name: string;
        } | null;
        parts: ({
            product: {
                name: string;
            };
        } & {
            id: string;
            productId: string;
            qty: number;
            repairJobId: string;
            cost: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        model: string;
        id: string;
        createdAt: Date;
        customerId: string;
        status: import(".prisma/client").$Enums.RepairStatus;
        pdfUrl: string | null;
        jobId: string;
        deviceType: string;
        brand: string;
        serialNumber: string | null;
        issueDescription: string;
        repairNotes: string | null;
        technicianId: string | null;
        estimatedCost: import("@prisma/client/runtime/library").Decimal | null;
        finalCost: import("@prisma/client/runtime/library").Decimal | null;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<void>;
};
export {};
//# sourceMappingURL=repair.service.d.ts.map