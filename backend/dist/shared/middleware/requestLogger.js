"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const logger_1 = require("../utils/logger");
const SENSITIVE_FIELDS = new Set([
    'password', 'currentPassword', 'newPassword', 'token', 'secret', 'apiKey', 'authorization',
]);
function sanitizeBody(body) {
    if (!body || typeof body !== 'object')
        return body;
    const sanitized = {};
    for (const [key, value] of Object.entries(body)) {
        sanitized[key] = SENSITIVE_FIELDS.has(key.toLowerCase()) ? '[REDACTED]' : value;
    }
    return sanitized;
}
function requestLogger(req, res, next) {
    const start = Date.now();
    const { method, path, query, requestId } = req;
    const userId = req.user?.userId;
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        logger_1.logger[level](`[${requestId}] ${method} ${path} ${res.statusCode} ${duration}ms`, {
            status: res.statusCode,
            duration: `${duration}ms`,
            requestId,
            userId: userId || undefined,
            query: Object.keys(query).length ? query : undefined,
            body: method !== 'GET' && req.body ? sanitizeBody(req.body) : undefined,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
    });
    next();
}
//# sourceMappingURL=requestLogger.js.map