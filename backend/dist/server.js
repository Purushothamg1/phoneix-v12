"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./shared/utils/logger");
const database_1 = require("./config/database");
const http_1 = __importDefault(require("http"));
// ── Environment Validation ────────────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
    console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
}
const PORT = Number(process.env.PORT) || 5000;
const server = http_1.default.createServer(app_1.default);
async function main() {
    try {
        await database_1.prisma.$connect();
        logger_1.logger.info('Database connected successfully');
        server.listen(PORT, () => {
            logger_1.logger.info(`Phoneix Backend v1.2.0 running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// ── Graceful Shutdown ─────────────────────────────────────────
async function shutdown(signal) {
    logger_1.logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
        try {
            await database_1.prisma.$disconnect();
            logger_1.logger.info('Prisma disconnected. Bye.');
            process.exit(0);
        }
        catch (err) {
            logger_1.logger.error('Error during shutdown:', err);
            process.exit(1);
        }
    });
    // Force exit after 10 seconds if server hasn't closed
    setTimeout(() => {
        logger_1.logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
// ── Unhandled Rejection / Exception Guards ─────────────────────
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('Unhandled Promise Rejection:', reason);
    shutdown('unhandledRejection');
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    shutdown('uncaughtException');
});
main();
//# sourceMappingURL=server.js.map