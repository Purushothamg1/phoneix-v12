"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
const path_1 = __importDefault(require("path"));
const errorHandler_1 = require("./shared/middleware/errorHandler");
const requestLogger_1 = require("./shared/middleware/requestLogger");
const requestId_1 = require("./shared/middleware/requestId");
const auth_routes_1 = require("./modules/auth/auth.routes");
const user_routes_1 = require("./modules/auth/user.routes");
const customer_routes_1 = require("./modules/customers/customer.routes");
const supplier_routes_1 = require("./modules/suppliers/supplier.routes");
const product_routes_1 = require("./modules/inventory/product.routes");
const invoice_routes_1 = require("./modules/invoices/invoice.routes");
const repair_routes_1 = require("./modules/repairs/repair.routes");
const payment_routes_1 = require("./modules/payments/payment.routes");
const report_routes_1 = require("./modules/reports/report.routes");
const dashboard_routes_1 = require("./modules/dashboard/dashboard.routes");
const settings_routes_1 = require("./modules/settings/settings.routes");
const search_routes_1 = require("./modules/search/search.routes");
const upload_routes_1 = require("./modules/upload/upload.routes");
const importExport_routes_1 = require("./modules/import-export/importExport.routes");
const audit_routes_1 = require("./modules/audit/audit.routes");
const app = (0, express_1.default)();
// ── Request ID (attach before all other middleware) ───────────
app.use(requestId_1.requestId);
// ── Security Headers ──────────────────────────────────────────
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
        },
    },
    hsts: process.env.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xFrameOptions: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
}));
// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',').map((o) => o.trim());
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        if (!origin)
            return cb(null, true);
        if (allowedOrigins.some((o) => origin === o || origin.endsWith('.replit.dev') || origin.endsWith('.replit.app'))) {
            return cb(null, true);
        }
        cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
}));
// ── Compression ───────────────────────────────────────────────
app.use((0, compression_1.default)({ level: 6, threshold: 1024 }));
// ── Body Parsing ──────────────────────────────────────────────
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ── Static Files ──────────────────────────────────────────────
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    etag: true,
}));
// ── Request Logging ───────────────────────────────────────────
app.use(requestLogger_1.requestLogger);
// ── Health / Readiness Probes ─────────────────────────────────
app.get('/health', async (_req, res) => {
    res.json({
        status: 'ok',
        version: '1.2.0',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV,
    });
});
app.get('/ready', (_req, res) => {
    res.json({ status: 'ready' });
});
// ── Rate Limiters ─────────────────────────────────────────────
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});
const authSlowDown = (0, express_slow_down_1.default)({
    windowMs: 15 * 60 * 1000,
    delayAfter: 5,
    delayMs: (used) => (used - 5) * 200,
});
const searchLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 60,
    message: { error: 'Search rate limit exceeded.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// ── Routes ────────────────────────────────────────────────────
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authSlowDown, authLimiter);
app.use('/api/auth', auth_routes_1.authRouter);
app.use('/api/auth/users', user_routes_1.userRouter);
app.use('/api/customers', customer_routes_1.customerRouter);
app.use('/api/suppliers', supplier_routes_1.supplierRouter);
app.use('/api/products', product_routes_1.productRouter);
app.use('/api/invoices', invoice_routes_1.invoiceRouter);
app.use('/api/repairs', repair_routes_1.repairRouter);
app.use('/api/payments', payment_routes_1.paymentRouter);
app.use('/api/reports', report_routes_1.reportRouter);
app.use('/api/dashboard', dashboard_routes_1.dashboardRouter);
app.use('/api/settings', settings_routes_1.settingsRouter);
app.use('/api/search', searchLimiter, search_routes_1.searchRouter);
app.use('/api/upload', upload_routes_1.uploadRouter);
app.use('/api/import-export', importExport_routes_1.importExportRouter);
app.use('/api/audit', audit_routes_1.auditRouter);
// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.path });
});
// ── Global Error Handler ──────────────────────────────────────
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map