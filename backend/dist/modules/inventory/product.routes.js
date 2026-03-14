"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRouter = void 0;
const express_1 = require("express");
const celebrate_1 = require("celebrate");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const product_controller_1 = require("./product.controller");
exports.productRouter = (0, express_1.Router)();
exports.productRouter.use(auth_middleware_1.authenticate);
const productSchema = celebrate_1.Joi.object({
    name: celebrate_1.Joi.string().min(2).max(200).required(),
    sku: celebrate_1.Joi.string().min(1).max(100).required(),
    barcode: celebrate_1.Joi.string().max(100).optional().allow('', null),
    category: celebrate_1.Joi.string().max(100).optional().allow('', null),
    purchasePrice: celebrate_1.Joi.number().min(0).required(),
    sellingPrice: celebrate_1.Joi.number().min(0).required(),
    stockQty: celebrate_1.Joi.number().integer().min(0).default(0),
    minStockLevel: celebrate_1.Joi.number().integer().min(0).default(5),
});
const adjustStockSchema = celebrate_1.Joi.object({
    quantity: celebrate_1.Joi.number().integer().not(0).required(),
    movementType: celebrate_1.Joi.string().valid('PURCHASE', 'ADJUSTMENT', 'RETURN').required(),
    note: celebrate_1.Joi.string().max(300).optional().allow('', null),
});
exports.productRouter.get('/', product_controller_1.productController.list);
exports.productRouter.get('/low-stock', product_controller_1.productController.lowStock);
exports.productRouter.get('/categories', product_controller_1.productController.categories);
exports.productRouter.post('/', (0, auth_middleware_1.authorize)('ADMIN', 'MANAGER'), (0, celebrate_1.celebrate)({ [celebrate_1.Segments.BODY]: productSchema }), product_controller_1.productController.create);
exports.productRouter.get('/:id', product_controller_1.productController.getById);
exports.productRouter.put('/:id', (0, auth_middleware_1.authorize)('ADMIN', 'MANAGER'), (0, celebrate_1.celebrate)({ [celebrate_1.Segments.BODY]: productSchema }), product_controller_1.productController.update);
exports.productRouter.delete('/:id', (0, auth_middleware_1.authorize)('ADMIN'), product_controller_1.productController.remove);
exports.productRouter.post('/:id/adjust-stock', (0, auth_middleware_1.authorize)('ADMIN', 'MANAGER'), (0, celebrate_1.celebrate)({ [celebrate_1.Segments.BODY]: adjustStockSchema }), product_controller_1.productController.adjustStock);
exports.productRouter.get('/:id/movements', product_controller_1.productController.getMovements);
//# sourceMappingURL=product.routes.js.map