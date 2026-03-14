"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const AppError_1 = require("../errors/AppError");
const logger_1 = require("../utils/logger");
const celebrate_1 = require("celebrate");
function errorHandler(err, req, res, _next) {
    const requestId = req.requestId || undefined;
    // ── Celebrate / Joi Validation Errors ─────────────────────
    if ((0, celebrate_1.isCelebrateError)(err)) {
        const details = [];
        for (const [, value] of err.details) {
            value.details.forEach((d) => details.push(d.message.replace(/['"]/g, '')));
        }
        res.status(400).json({ error: 'Validation failed', details, requestId });
        return;
    }
    // ── Prisma Known Request Errors ────────────────────────────
    if (err.constructor.name === 'PrismaClientKnownRequestError') {
        const pe = err;
        if (pe.code === 'P2002') {
            const field = pe.meta?.target?.[0] || 'field';
            res.status(409).json({ error: `A record with this ${field} already exists`, requestId });
            return;
        }
        if (pe.code === 'P2025') {
            res.status(404).json({ error: 'Record not found', requestId });
            return;
        }
        if (pe.code === 'P2003') {
            const field = pe.meta?.field_name?.replace('_fkey', '') || 'related record';
            res.status(400).json({ error: `Referenced ${field} does not exist`, requestId });
            return;
        }
        if (pe.code === 'P2014') {
            res.status(400).json({ error: 'Cannot delete: this record has related data', requestId });
            return;
        }
        if (pe.code === 'P2016') {
            res.status(404).json({ error: 'Record not found', requestId });
            return;
        }
    }
    // ── Prisma Validation Errors ───────────────────────────────
    if (err.constructor.name === 'PrismaClientValidationError') {
        logger_1.logger.warn(`[${requestId}] Prisma validation error: ${err.message}`);
        res.status(400).json({ error: 'Invalid data provided', requestId });
        return;
    }
    // ── Prisma Connection Errors ───────────────────────────────
    if (err.constructor.name === 'PrismaClientInitializationError' ||
        err.constructor.name === 'PrismaClientRustPanicError') {
        logger_1.logger.error(`[${requestId}] Database error:`, err);
        res.status(503).json({ error: 'Database temporarily unavailable. Please try again.', requestId });
        return;
    }
    // ── Operational Errors (AppError subclasses) ───────────────
    if (err instanceof AppError_1.AppError) {
        if (err.statusCode >= 500) {
            logger_1.logger.error(`[${requestId}] [${req.method} ${req.path}] ${err.message}`, { stack: err.stack });
        }
        res.status(err.statusCode).json({ error: err.message, requestId });
        return;
    }
    // ── JWT Errors ─────────────────────────────────────────────
    if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
        res.status(401).json({ error: 'Invalid token', requestId });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Session expired. Please sign in again.', requestId });
        return;
    }
    // ── Multer Errors ──────────────────────────────────────────
    if (err.constructor.name === 'MulterError') {
        const me = err;
        if (me.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({ error: 'File is too large. Maximum size is 5MB.', requestId });
            return;
        }
        if (me.code === 'LIMIT_UNEXPECTED_FILE') {
            res.status(400).json({ error: `Unexpected file field: ${me.field}`, requestId });
            return;
        }
        res.status(400).json({ error: 'File upload error', requestId });
        return;
    }
    // ── SyntaxError (malformed JSON body) ─────────────────────
    if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({ error: 'Invalid JSON in request body', requestId });
        return;
    }
    // ── Unknown / Unexpected Errors ────────────────────────────
    logger_1.logger.error(`[${requestId}] [${req.method} ${req.path}] Unhandled error:`, err);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred. Please try again.'
            : err.message,
        requestId,
    });
}
//# sourceMappingURL=errorHandler.js.map