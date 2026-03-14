"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = void 0;
const product_service_1 = require("./product.service");
exports.productController = {
    async list(req, res, next) {
        try {
            res.json(await product_service_1.productService.list(req.query));
        }
        catch (e) {
            next(e);
        }
    },
    async lowStock(_req, res, next) {
        try {
            res.json(await product_service_1.productService.lowStock());
        }
        catch (e) {
            next(e);
        }
    },
    async categories(_req, res, next) {
        try {
            res.json(await product_service_1.productService.categories());
        }
        catch (e) {
            next(e);
        }
    },
    async create(req, res, next) {
        try {
            res.status(201).json(await product_service_1.productService.create(req.body));
        }
        catch (e) {
            next(e);
        }
    },
    async getById(req, res, next) {
        try {
            res.json(await product_service_1.productService.getById(req.params.id));
        }
        catch (e) {
            next(e);
        }
    },
    async update(req, res, next) {
        try {
            res.json(await product_service_1.productService.update(req.params.id, req.body));
        }
        catch (e) {
            next(e);
        }
    },
    async remove(req, res, next) {
        try {
            await product_service_1.productService.remove(req.params.id);
            res.status(204).send();
        }
        catch (e) {
            next(e);
        }
    },
    async adjustStock(req, res, next) {
        try {
            const { quantity, movementType, note } = req.body;
            res.json(await product_service_1.productService.adjustStock(req.params.id, quantity, movementType, note));
        }
        catch (e) {
            next(e);
        }
    },
    async getMovements(req, res, next) {
        try {
            res.json(await product_service_1.productService.getMovements(req.params.id, req.query));
        }
        catch (e) {
            next(e);
        }
    },
};
//# sourceMappingURL=product.controller.js.map