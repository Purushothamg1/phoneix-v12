import { Request, Response, NextFunction } from 'express';
export declare const productController: {
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    lowStock(_req: Request, res: Response, next: NextFunction): Promise<void>;
    categories(_req: Request, res: Response, next: NextFunction): Promise<void>;
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    remove(req: Request, res: Response, next: NextFunction): Promise<void>;
    adjustStock(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMovements(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=product.controller.d.ts.map