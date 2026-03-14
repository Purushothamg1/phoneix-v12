"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = auditLog;
const database_1 = require("../../config/database");
const logger_1 = require("../utils/logger");
/**
 * Fire-and-forget audit logger.
 * Failures are caught and logged to the error log but never bubble up to the caller.
 */
async function auditLog({ userId, action, metadata }) {
    try {
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action,
                metadata: (metadata ?? {}),
            },
        });
    }
    catch (err) {
        logger_1.logger.error('Failed to write audit log', { userId, action, error: err });
    }
}
//# sourceMappingURL=auditLog.js.map