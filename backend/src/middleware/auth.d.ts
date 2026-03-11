import { Request, Response, NextFunction } from "express";
interface AuthRequest extends Request {
    user?: {
        id: string;
        businessId: string;
        role: string;
    };
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export {};
//# sourceMappingURL=auth.d.ts.map