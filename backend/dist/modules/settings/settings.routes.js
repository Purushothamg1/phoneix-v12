"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRouter = void 0;
const express_1 = require("express");
const celebrate_1 = require("celebrate");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const database_1 = require("../../config/database");
const auditLog_1 = require("../../shared/utils/auditLog");
exports.settingsRouter = (0, express_1.Router)();
exports.settingsRouter.use(auth_middleware_1.authenticate);
// All allowed setting keys — whitelist prevents arbitrary key injection
const ALLOWED_KEYS = new Set([
    // Business info
    'business_name', 'business_address', 'business_phone', 'business_email',
    'gst_number', 'invoice_prefix', 'default_tax', 'currency', 'currency_symbol',
    'logo_url', 'receipt_footer', 'timezone',
    // WhatsApp / messaging
    'whatsapp_phone',
    'whatsapp_message_template_invoice',
    'whatsapp_message_template_repair',
    // Meta API (Cloud API) — stored but not auto-used; UI exposes config panel
    'meta_api_enabled', // '1' or '0'
    'meta_waba_id', // WhatsApp Business Account ID
    'meta_phone_number_id', // Phone Number ID
    'meta_access_token', // Permanent system-user access token
    'meta_webhook_verify_token', // Webhook verification token
]);
const settingsUpdateSchema = celebrate_1.Joi.object({
    // Business info
    business_name: celebrate_1.Joi.string().max(200).optional(),
    business_address: celebrate_1.Joi.string().max(500).optional(),
    business_phone: celebrate_1.Joi.string().max(20).optional(),
    business_email: celebrate_1.Joi.string().email().optional().allow('', null),
    gst_number: celebrate_1.Joi.string().max(50).optional().allow('', null),
    invoice_prefix: celebrate_1.Joi.string().max(10).alphanum().optional(),
    default_tax: celebrate_1.Joi.number().min(0).max(100).optional(),
    currency: celebrate_1.Joi.string().max(10).optional(),
    currency_symbol: celebrate_1.Joi.string().max(5).optional(),
    receipt_footer: celebrate_1.Joi.string().max(500).optional().allow('', null),
    timezone: celebrate_1.Joi.string().max(50).optional(),
    // WhatsApp
    whatsapp_phone: celebrate_1.Joi.string().max(25).optional().allow('', null),
    whatsapp_message_template_invoice: celebrate_1.Joi.string().max(1000).optional().allow('', null),
    whatsapp_message_template_repair: celebrate_1.Joi.string().max(1000).optional().allow('', null),
    // Meta API
    meta_api_enabled: celebrate_1.Joi.string().valid('0', '1').optional(),
    meta_waba_id: celebrate_1.Joi.string().max(100).optional().allow('', null),
    meta_phone_number_id: celebrate_1.Joi.string().max(100).optional().allow('', null),
    meta_access_token: celebrate_1.Joi.string().max(500).optional().allow('', null),
    meta_webhook_verify_token: celebrate_1.Joi.string().max(100).optional().allow('', null),
}).min(1);
// GET /api/settings — anyone authenticated can read (needed for invoice rendering)
exports.settingsRouter.get('/', async (_req, res, next) => {
    try {
        const settings = await database_1.prisma.setting.findMany();
        const obj = settings.reduce((acc, s) => {
            // Never expose sensitive tokens over the API in full
            if (s.key === 'meta_access_token' && s.value) {
                acc[s.key] = s.value.length > 8 ? `${s.value.substring(0, 4)}...${s.value.slice(-4)}` : '****';
            }
            else {
                acc[s.key] = s.value;
            }
            return acc;
        }, {});
        res.json(obj);
    }
    catch (e) {
        next(e);
    }
});
// PUT /api/settings — ADMIN only
exports.settingsRouter.put('/', (0, auth_middleware_1.authorize)('ADMIN'), (0, celebrate_1.celebrate)({ [celebrate_1.Segments.BODY]: settingsUpdateSchema }), async (req, res, next) => {
    try {
        const updates = req.body;
        const filtered = Object.entries(updates).filter(([key]) => ALLOWED_KEYS.has(key));
        if (!filtered.length) {
            res.status(400).json({ error: 'No valid setting keys provided' });
            return;
        }
        const ops = filtered.map(([key, value]) => database_1.prisma.setting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
        }));
        await Promise.all(ops);
        await (0, auditLog_1.auditLog)({
            userId: req.user.userId,
            action: 'SETTINGS_UPDATED',
            metadata: { keys: filtered.map(([k]) => k) },
        });
        // Return full settings (re-fetch to reflect DB state)
        const all = await database_1.prisma.setting.findMany();
        const obj = all.reduce((acc, s) => {
            if (s.key === 'meta_access_token' && s.value) {
                acc[s.key] = s.value.length > 8 ? `${s.value.substring(0, 4)}...${s.value.slice(-4)}` : '****';
            }
            else {
                acc[s.key] = s.value;
            }
            return acc;
        }, {});
        res.json(obj);
    }
    catch (e) {
        next(e);
    }
});
// PUT /api/settings/meta-token — Separate endpoint for full token update (ADMIN only)
exports.settingsRouter.put('/meta-token', (0, auth_middleware_1.authorize)('ADMIN'), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
        meta_access_token: celebrate_1.Joi.string().min(10).max(500).required(),
    }),
}), async (req, res, next) => {
    try {
        await database_1.prisma.setting.upsert({
            where: { key: 'meta_access_token' },
            update: { value: req.body.meta_access_token },
            create: { key: 'meta_access_token', value: req.body.meta_access_token },
        });
        await (0, auditLog_1.auditLog)({ userId: req.user.userId, action: 'SETTINGS_UPDATED', metadata: { keys: ['meta_access_token'] } });
        res.json({ message: 'Meta access token saved securely' });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=settings.routes.js.map