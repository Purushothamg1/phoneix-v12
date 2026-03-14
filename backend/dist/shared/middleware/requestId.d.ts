import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            requestId: string;
        }
    }
}
/**
 * Attaches a unique request ID to every incoming request.
 * Uses the X-Request-ID header if provided by a reverse proxy, otherwise generates a UUID.
 * The ID is echoed back in the response headers for client-side correlation.
 */
export declare function requestId(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=requestId.d.ts.map