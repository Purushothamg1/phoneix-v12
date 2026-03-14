export declare const pdfService: {
    /**
     * Generates an invoice PDF.
     * File name format: <CustomerName>-<InvoiceNumber>.pdf  e.g. John_Doe-INV-00001.pdf
     * Returns the public URL path e.g. /uploads/pdfs/John_Doe-INV-00001.pdf
     */
    generateInvoicePdf(invoiceId: string): Promise<string>;
    /**
     * Generates a repair job card PDF.
     * File name format: <CustomerName>-<JobID>.pdf  e.g. John_Doe-JOB-00001.pdf
     */
    generateRepairPdf(repairId: string): Promise<string>;
    /**
     * Re-generates a PDF for an existing invoice (useful after updates).
     */
    regenerateInvoicePdf(invoiceId: string): Promise<string>;
    /**
     * Re-generates a PDF for an existing repair job.
     */
    regenerateRepairPdf(repairId: string): Promise<string>;
};
//# sourceMappingURL=pdf.service.d.ts.map