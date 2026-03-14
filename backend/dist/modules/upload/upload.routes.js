"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
const fs_1 = __importDefault(require("fs"));
exports.uploadRouter = (0, express_1.Router)();
exports.uploadRouter.use(auth_middleware_1.authenticate);
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const storage = multer_1.default.diskStorage({
    destination: (req, _file, cb) => {
        const type = req.path.includes('logo') ? 'logos' : 'products';
        const dir = path_1.default.join(UPLOAD_DIR, type);
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype))
        cb(null, true);
    else
        cb(new AppError_1.ValidationError('Only JPEG, PNG, and WebP images are allowed'));
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
});
exports.uploadRouter.post('/product-image/:productId', (0, auth_middleware_1.authorize)('ADMIN', 'MANAGER'), upload.single('image'), async (req, res, next) => {
    try {
        if (!req.file)
            throw new AppError_1.ValidationError('No file uploaded');
        const imageUrl = `/uploads/products/${req.file.filename}`;
        const product = await database_1.prisma.product.update({
            where: { id: req.params.productId },
            data: { imageUrl },
        });
        res.json({ imageUrl, product });
    }
    catch (e) {
        next(e);
    }
});
exports.uploadRouter.post('/logo', (0, auth_middleware_1.authorize)('ADMIN'), upload.single('logo'), async (req, res, next) => {
    try {
        if (!req.file)
            throw new AppError_1.ValidationError('No file uploaded');
        const logoUrl = `/uploads/logos/${req.file.filename}`;
        await database_1.prisma.setting.upsert({
            where: { key: 'logo_url' },
            update: { value: logoUrl },
            create: { key: 'logo_url', value: logoUrl },
        });
        res.json({ logoUrl });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=upload.routes.js.map