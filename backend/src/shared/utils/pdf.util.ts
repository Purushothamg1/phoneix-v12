
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const uploadsDir = path.join(process.cwd(), 'uploads');
const pdfsDir = path.join(uploadsDir, 'pdfs');

// Ensure the directories exist
fs.mkdirSync(pdfsDir, { recursive: true });

/**
 * Sanitizes a filename to be URL and filesystem-safe.
 * @param filename - The original filename.
 * @returns The sanitized filename.
 */
function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-z0-9\._-]/gi, '-')
        .replace(/-{2,}/g, '-')
        .toLowerCase();
}

/**
 * Generates a PDF and saves it to the filesystem.
 * @param content - The content to be written to the PDF.
 * @param filename - The desired filename.
 * @returns The canonical URL of the generated PDF.
 */
export async function generatePdf(
    content: (doc: PDFKit.PDFDocument) => void,
    filename: string
): Promise<string> {
    const sanitized = sanitizeFilename(filename);
    const filePath = path.join(pdfsDir, sanitized);
    const canonicalUrl = `/api/uploads/pdfs/${sanitized}`;

    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);
    content(doc);
    doc.end();

    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
            logger.info(`PDF generated successfully: ${filePath}`);
            resolve(canonicalUrl);
        });
        writeStream.on('error', (err) => {
            logger.error(`Error generating PDF: ${err.message}`);
            reject(err);
        });
    });
}
