import { Request, Response, NextFunction } from 'express';
import { shopifyApi } from '@shopify/shopify-api';

export const verifyRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = res.locals.shopify?.session;
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}; 