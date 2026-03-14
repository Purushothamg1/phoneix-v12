"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = require("../errors/AppError");
const database_1 = require("../../config/database");
const authenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError_1.UnauthorizedError('No token provided');
        }
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;
        if (!secret)
            throw new Error('JWT_SECRET not configured');
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, email: true, name: true },
        });
        if (!user)
            throw new AppError_1.UnauthorizedError('User not found');
        req.user = { userId: user.id, role: user.role, email: user.email, name: user.name };
        next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new AppError_1.UnauthorizedError('Invalid token'));
        }
        else {
            next(err);
        }
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            next(new AppError_1.UnauthorizedError());
            return;
        }
        if (!roles.includes(req.user.role)) {
            next(new AppError_1.ForbiddenError('Insufficient permissions'));
            return;
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map