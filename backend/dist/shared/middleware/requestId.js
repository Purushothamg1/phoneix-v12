"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestId = requestId;
const uuid_1 = require("uuid");
/**
 * Attaches a unique request ID to every incoming request.
 * Uses the X-Request-ID header if provided by a reverse proxy, otherwise generates a UUID.
 * The ID is echoed back in the response headers for client-side correlation.
 */
function requestId(req, res, next) {
    const id = req.headers['x-request-id'] || (0, uuid_1.v4)();
    req.requestId = id;
    res.setHeader('X-Request-ID', id);
    next();
}
//# sourceMappingURL=requestId.js.map