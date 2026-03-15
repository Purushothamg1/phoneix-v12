
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function normalizePdfUrls() {
  console.log('Starting PDF URL normalization...');

  const invoices = await prisma.invoice.findMany({
    where: {
      pdfUrl: {
        not: null,
      },
    },
  });

  for (const invoice of invoices) {
    if (invoice.pdfUrl && !invoice.pdfUrl.startsWith('/api/uploads/pdfs')) {
      const newUrl = `/api/uploads/pdfs/invoice-${invoice.number}.pdf`;
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { pdfUrl: newUrl },
      });
      console.log(`Updated invoice ${invoice.id}: ${invoice.pdfUrl} -> ${newUrl}`);
    }
  }

  const repairs = await prisma.repairJob.findMany({
    where: {
      pdfUrl: {
        not: null,
      },
    },
  });

  for (const repair of repairs) {
    if (repair.pdfUrl && !repair.pdfUrl.startsWith('/api/uploads/pdfs')) {
      const newUrl = `/api/uploads/pdfs/repair-${repair.jobId}.pdf`;
      await prisma.repairJob.update({
        where: { id: repair.id },
        data: { pdfUrl: newUrl },
      });
      console.log(`Updated repair ${repair.id}: ${repair.pdfUrl} -> ${newUrl}`);
    }
  }

  console.log('PDF URL normalization complete.');
}

normalizePdfUrls()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
