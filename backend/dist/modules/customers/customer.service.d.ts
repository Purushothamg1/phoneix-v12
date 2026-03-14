export declare const customerService: {
    list(query: {
        page?: string;
        limit?: string;
        search?: string;
    }): Promise<import("../../shared/utils/pagination").PaginatedResult<{
        id: string;
        createdAt: Date;
        name: string;
        email: string | null;
        phone: string;
        address: string | null;
        notes: string | null;
    }>>;
    create(data: {
        name: string;
        phone: string;
        email?: string;
        address?: string;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        email: string | null;
        phone: string;
        address: string | null;
        notes: string | null;
    }>;
    getById(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        email: string | null;
        phone: string;
        address: string | null;
        notes: string | null;
    }>;
    update(id: string, data: {
        name: string;
        phone: string;
        email?: string;
        address?: string;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        email: string | null;
        phone: string;
        address: string | null;
        notes: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        email: string | null;
        phone: string;
        address: string | null;
        notes: string | null;
    }>;
    getHistory(id: string): Promise<{
        invoices: ({
            items: {
                id: string;
                total: import("@prisma/client/runtime/library").Decimal;
                invoiceId: string;
                productId: string | null;
                description: string;
                qty: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                tax: import("@prisma/client/runtime/library").Decimal;
            }[];
            payments: {
                method: import(".prisma/client").$Enums.PaymentMethod;
                id: string;
                createdAt: Date;
                invoiceId: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                refunded: boolean;
            }[];
        } & {
            number: string;
            id: string;
            createdAt: Date;
            prefix: string;
            customerId: string;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            taxAmount: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            pdfUrl: string | null;
        })[];
        repairs: {
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
        }[];
        outstandingBalance: number | import("@prisma/client/runtime/library").Decimal;
    }>;
};
//# sourceMappingURL=customer.service.d.ts.map