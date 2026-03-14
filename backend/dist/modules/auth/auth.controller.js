"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("./auth.service");
exports.authController = {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.authService.login(email, password);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    },
    async getMe(req, res, next) {
        try {
            const user = await auth_service_1.authService.getMe(req.user.userId);
            res.json(user);
        }
        catch (err) {
            next(err);
        }
    },
    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const result = await auth_service_1.authService.changePassword(req.user.userId, currentPassword, newPassword);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=auth.controller.js.map