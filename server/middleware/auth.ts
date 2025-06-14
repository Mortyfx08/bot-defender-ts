// src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';

declare global {
  namespace Express {
    interface Request {
      shopify?: {
        session?: {
          shop: string;
        };
      };
    }
  }
}

// Validate required environment variables
const requiredEnvVars = {
  SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
  SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL,
  JWT_SECRET: process.env.JWT_SECRET
};

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: ['read_products', 'write_products'],
  hostName: process.env.SHOPIFY_APP_URL!.replace(/https?:\/\//, ''), // Remove protocol
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
});

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authenticateShopify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shop = req.query.shop as string;
    if (!shop) {
      return res.status(400).json({ error: 'Shop parameter is required' });
    }

    const session = await shopify.session.customAppSession(shop);
    if (!session || !session.shop) {
      return res.status(401).json({ error: 'Unauthorized - No valid session' });
    }
    
    req.shopify = { session };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};