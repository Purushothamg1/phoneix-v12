"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerRouter = void 0;
const express_1 = require("express");
const celebrate_1 = require("celebrate");
const customer_controller_1 = require("./customer.controller");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
exports.customerRouter = (0, express_1.Router)();
exports.customerRouter.use(auth_middleware_1.authenticate);
const customerSchema = celebrate_1.Joi.object({
    name: celebrate_1.Joi.string().min(2).max(100).required(),
    phone: celebrate_1.Joi.string().min(7).max(20).required(),
    email: celebrate_1.Joi.string().email().optional().allow('', null),
    address: celebrate_1.Joi.string().max(300).optional().allow('', null),
    notes: celebrate_1.Joi.string().max(500).optional().allow('', null),
});
exports.customerRouter.get('/', customer_controller_1.customerController.list);
exports.customerRouter.post('/', (0, celebrate_1.celebrate)({ [celebrate_1.Segments.BODY]: customerSchema }), customer_controller_1.customerController.create);
exports.customerRouter.get('/:id', customer_controller_1.customerController.getById);
exports.customerRouter.put('/:id', (0, celebrate_1.celebrate)({ [celebrate_1.Segments.BODY]: customerSchema }), customer_controller_1.customerController.update);
// FIX: only ADMIN can delete customers (was missing authorize)
exports.customerRouter.delete('/:id', (0, auth_middleware_1.authorize)('ADMIN'), customer_controller_1.customerController.remove);
exports.customerRouter.get('/:id/history', customer_controller_1.customerController.getHistory);
//# sourceMappingURL=customer.routes.js.map