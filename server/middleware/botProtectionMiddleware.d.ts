import { Request, Response, NextFunction } from 'express';

declare function botProtectionMiddleware(req: Request, res: Response, next: NextFunction): void;
export default botProtectionMiddleware; 