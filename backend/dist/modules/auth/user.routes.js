"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const celebrate_1 = require("celebrate");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
const auditLog_1 = require("../../shared/utils/auditLog");
exports.userRouter = (0, express_1.Router)();
exports.userRouter.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMIN'));
// List all users
exports.userRouter.get('/', async (_req, res, next) => {
    try {
        const users = await database_1.prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
        res.json(users);
    }
    catch (e) {
        next(e);
    }
});
// Create user
exports.userRouter.post('/', (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
        name: celebrate_1.Joi.string().min(2).max(100).required(),
        email: celebrate_1.Joi.string().email().required(),
        password: celebrate_1.Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
            .messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, and a number' }),
        role: celebrate_1.Joi.string().valid('ADMIN', 'MANAGER', 'STAFF').required(),
    }),
}), async (req, res, next) => {
    try {
        const { name, email: rawEmail, password, role } = req.body;
        const email = rawEmail.toLowerCase().trim();
        const existing = await database_1.prisma.user.findUnique({ where: { email } });
        if (existing)
            throw new AppError_1.ConflictError('A user with this email already exists');
        const hashed = await bcrypt_1.default.hash(password, 12);
        const user = await database_1.prisma.user.create({
            data: { name, email, password: hashed, role },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });
        await (0, auditLog_1.auditLog)({
            userId: req.user.userId,
            action: 'USER_CREATED',
            metadata: { createdUserId: user.id, email, role },
        });
        res.status(201).json(user);
    }
    catch (e) {
        next(e);
    }
});
// Update user role
exports.userRouter.put('/:id/role', (0, celebrate_1.celebrate)({ [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({ role: celebrate_1.Joi.string().valid('ADMIN', 'MANAGER', 'STAFF').required() }) }), async (req, res, next) => {
    try {
        const user = await database_1.prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user)
            throw new AppError_1.NotFoundError('User');
        const updated = await database_1.prisma.user.update({
            where: { id: req.params.id },
            data: { role: req.body.role },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });
        await (0, auditLog_1.auditLog)({
            userId: req.user.userId,
            action: 'USER_ROLE_CHANGED',
            metadata: { targetUserId: req.params.id, oldRole: user.role, newRole: req.body.role },
        });
        res.json(updated);
    }
    catch (e) {
        next(e);
    }
});
// Delete user
exports.userRouter.delete('/:id', async (req, res, next) => {
    try {
        if (req.params.id === req.user.userId) {
            res.status(400).json({ error: 'You cannot delete your own account' });
            return;
        }
        const user = await database_1.prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user)
            throw new AppError_1.NotFoundError('User');
        await database_1.prisma.user.delete({ where: { id: req.params.id } });
        await (0, auditLog_1.auditLog)({
            userId: req.user.userId,
            action: 'USER_DELETED',
            metadata: { deletedUserId: req.params.id, email: user.email },
        });
        res.status(204).send();
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=user.routes.js.map