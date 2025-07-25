import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../services/redis';
import { MongoDBService } from '../services/mongodb';
import crypto from 'crypto';

export async function shopifyProtectionMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const ip = Array.isArray(req.headers['x-forwarded-for']) 
      ? req.headers['x-forwarded-for'][0] 
      : (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const path = req.path;
    const headers = req.headers;
    const shop = res.locals.shopify?.session?.shop || 'test-shop.myshopify.com';

    // 1. Check if IP is blocked
    const redisService = await RedisService.getInstance();
    const isBlocked = await redisService.isStoreIPBlocked(shop, ip);

    if (isBlocked) {
      console.log(`Blocked request from IP: ${ip}`);
      return res.status(403).json({ error: 'IP blocked' });
    }

    // 2. Block fake Shopify webhooks
    if (path.startsWith('/webhooks')) {
      const hmac = headers['x-shopify-hmac-sha256'];
      const topic = headers['x-shopify-topic'];
      const shopDomain = headers['x-shopify-shop-domain'];

      if (!hmac || !topic || !shopDomain) {
        console.log(`Invalid webhook attempt from IP: ${ip}`);
        await redisService.blockStoreIP(shop, ip, {
          duration: 3600, // 1 hour
          reason: 'Fake Shopify webhook attempt'
        });

        // Log the attempt
        const mongoService = await MongoDBService.getInstance();
        await mongoService.logBotActivity({
          ip,
          userAgent: headers['user-agent'] as string || 'unknown',
          path,
          severity: 'high',
          metadata: {
            headers,
            reason: 'Fake Shopify webhook attempt',
            type: 'webhook_attack'
          }
        });

        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    // 3. Block suspicious Shopify paths
    const suspiciousShopifyPaths = [
      '/admin/api/',
      '/admin/oauth/',
      '/admin/apps/',
      '/admin/settings/',
      '/admin/themes/',
      '/admin/customers/',
      '/admin/orders/'
    ];

    if (suspiciousShopifyPaths.some(suspiciousPath => path.includes(suspiciousPath))) {
      const mongoService = await MongoDBService.getInstance();
      await mongoService.logBotActivity({
        ip,
        userAgent: headers['user-agent'] as string || 'unknown',
        path,
        severity: 'high',
        metadata: {
          headers,
          reason: 'Suspicious Shopify path access',
          type: 'path_attack'
        }
      });

      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  } catch (error) {
    console.error('Shopify protection error:', error);
    next();
  }
} 