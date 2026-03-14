interface InvoiceItemInput {
    productId?: string | null;
    description: string;
    qty: number;
    unitPrice: number;
    tax?: number;
}
interface CreateInvoiceInput {
    customerId: string;
    discount?: number;
    items: InvoiceItemInput[];
}
export declare const invoiceService: {
    list(query: Record<string, string>): Promise<import("../../shared/utils/pagination").PaginatedResult<{
        customer: {
            id: string;
            name: string;
            phone: string;
        };
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
    }>>;
    create(data: CreateInvoiceInput): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            name: string;
            email: string | null;
            phone: string;
            address: string | null;
            notes: string | null;
        };
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
        items: ({
            product: {
                name: string;
                sku: string;
            } | null;
        } & {
            id: string;
            total: import("@prisma/client/runtime/library").Decimal;
            invoiceId: string;
            productId: string | null;
            description: string;
            qty: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            tax: import("@prisma/client/runtime/library").Decimal;
        })[];
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
    }>;
    update(id: string, data: {
        discount?: number;
        status?: string;
    }): Promise<{
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
    }>;
    cancel(id: string): Promise<({
        customer: {
            id: string;
            createdAt: Date;
            name: string;
            email: string | null;
            phone: string;
            address: string | null;
            notes: string | null;
        };
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
    }) | null>;
};
export {};
//# sourceMappingURL=invoice.service.d.ts.map