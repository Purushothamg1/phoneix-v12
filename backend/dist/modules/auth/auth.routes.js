"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
// ============================================================
// AUTH ROUTES
// ============================================================
const express_1 = require("express");
const celebrate_1 = require("celebrate");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post('/login', (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
        email: celebrate_1.Joi.string().email().required(),
        password: celebrate_1.Joi.string().min(6).required(),
    }),
}), auth_controller_1.authController.login);
exports.authRouter.get('/me', auth_middleware_1.authenticate, auth_controller_1.authController.getMe);
exports.authRouter.post('/change-password', auth_middleware_1.authenticate, (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
        currentPassword: celebrate_1.Joi.string().required(),
        // Enforce strength at schema level too
        newPassword: celebrate_1.Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
            .messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, and a number' }),
    }),
}), auth_controller_1.authController.changePassword);
//# sourceMappingURL=auth.routes.js.map