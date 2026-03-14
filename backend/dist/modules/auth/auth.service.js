"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
const auditLog_1 = require("../../shared/utils/auditLog");
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
function validatePasswordStrength(password) {
    if (password.length < PASSWORD_MIN_LENGTH) {
        throw new AppError_1.ValidationError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }
    if (!PASSWORD_REGEX.test(password)) {
        throw new AppError_1.ValidationError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
}
exports.authService = {
    async login(email, password) {
        // Always run bcrypt compare — prevents timing-based user enumeration
        const user = await database_1.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        const DUMMY_HASH = '$2b$12$invalidhashfortimingnormalizationXXXXXXXXXXXXXXXXXXXX';
        const valid = await bcrypt_1.default.compare(password, user?.password ?? DUMMY_HASH);
        if (!user || !valid) {
            // Audit failed login attempt (if user exists)
            if (user) {
                await (0, auditLog_1.auditLog)({ userId: user.id, action: 'USER_LOGIN', metadata: { success: false, email } });
            }
            throw new AppError_1.UnauthorizedError('Invalid email or password');
        }
        const secret = process.env.JWT_SECRET;
        if (!secret)
            throw new Error('JWT_SECRET not configured');
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
        await (0, auditLog_1.auditLog)({ userId: user.id, action: 'USER_LOGIN', metadata: { success: true } });
        return {
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
        };
    },
    async getMe(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
        });
        if (!user)
            throw new AppError_1.NotFoundError('User');
        return user;
    },
    async changePassword(userId, currentPassword, newPassword) {
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new AppError_1.NotFoundError('User');
        const valid = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!valid)
            throw new AppError_1.ValidationError('Current password is incorrect');
        if (currentPassword === newPassword) {
            throw new AppError_1.ValidationError('New password must be different from the current password');
        }
        validatePasswordStrength(newPassword);
        const hashed = await bcrypt_1.default.hash(newPassword, 12);
        await database_1.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
        await (0, auditLog_1.auditLog)({ userId, action: 'PASSWORD_CHANGED' });
        return { message: 'Password changed successfully' };
    },
};
//# sourceMappingURL=auth.service.js.map