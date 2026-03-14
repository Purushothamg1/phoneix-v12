"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerController = void 0;
const customer_service_1 = require("./customer.service");
exports.customerController = {
    async list(req, res, next) {
        try {
            res.json(await customer_service_1.customerService.list(req.query));
        }
        catch (e) {
            next(e);
        }
    },
    async create(req, res, next) {
        try {
            res.status(201).json(await customer_service_1.customerService.create(req.body));
        }
        catch (e) {
            next(e);
        }
    },
    async getById(req, res, next) {
        try {
            res.json(await customer_service_1.customerService.getById(req.params.id));
        }
        catch (e) {
            next(e);
        }
    },
    async update(req, res, next) {
        try {
            res.json(await customer_service_1.customerService.update(req.params.id, req.body));
        }
        catch (e) {
            next(e);
        }
    },
    async remove(req, res, next) {
        try {
            await customer_service_1.customerService.remove(req.params.id);
            res.status(204).send();
        }
        catch (e) {
            next(e);
        }
    },
    async getHistory(req, res, next) {
        try {
            res.json(await customer_service_1.customerService.getHistory(req.params.id));
        }
        catch (e) {
            next(e);
        }
    },
};
//# sourceMappingURL=customer.controller.js.map