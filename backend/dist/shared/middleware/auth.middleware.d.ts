import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
export interface AuthUser {
    userId: string;
    role: Role;
    email: string;
    name: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map