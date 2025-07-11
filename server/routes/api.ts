import express, { Request, Response } from 'express';
import { shopifyAuthMiddleware } from '../middleware/shopifyAuth';
import { RedisService } from '../services/redis';
import { MongoDBService } from '../services/mongodb';

const router = express.Router();

// Apply Shopify auth middleware to all routes
router.use(shopifyAuthMiddleware);

// Dashboard data endpoint
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const shop = (req as any).shop;
    if (!shop) {
      return res.status(400).json({ error: 'Missing required parameter: shop' });
    }

    const redisService = await RedisService.getInstance();
    const mongoService = await MongoDBService.getInstance();

    // Get store-specific data
    const [blockedIPs, recentActivities, securityAlerts] = await Promise.all([
      redisService.getStoreBlockedIPs(shop),
      mongoService.getCollection('bot_activities')
        .find({ shop })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray(),
      mongoService.getCollection('security_alerts')
        .find({ shop })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray()
    ]);

    // Calculate metrics
    const metrics = {
      totalAlerts: securityAlerts.length,
      totalBlockedIPs: blockedIPs.length,
      recentBotActivities: recentActivities.length,
      threatFeedMetrics: {
        totalThreatFeedIPs: 0, // This will be populated from threat feed service
        threatFeedBlocks: blockedIPs.filter(ip => ip.reason.includes('threat feed')).length,
        lastUpdate: new Date().toISOString(),
        threatFeedHighSeverity: securityAlerts.filter(alert => alert.severity === 'high').length,
        threatFeedMediumSeverity: securityAlerts.filter(alert => alert.severity === 'medium').length,
        threatFeedLowSeverity: securityAlerts.filter(alert => alert.severity === 'low').length
      }
    };

    res.json({
      status: 'success',
      data: {
        metrics,
        shop: {
          name: shop.split('.')[0],
          domain: shop
        },
        recentActivities,
        securityAlerts,
        blockedIPs,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : error });
  }
});

// Bot activities endpoint
router.get('/bot-activities', async (req: Request, res: Response) => {
  try {
    const shop = (req as any).shop;
    if (!shop) {
      return res.status(400).json({ error: 'Missing required parameter: shop' });
    }

    const mongoService = await MongoDBService.getInstance();
    const activities = await mongoService.getCollection('bot_activities')
      .find({ shop })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    res.json(activities);
  } catch (error) {
    console.error('Error fetching bot activities:', error);
    res.status(500).json({ error: 'Failed to fetch bot activities', details: error instanceof Error ? error.message : error });
  }
});

// Activity log endpoint
router.get('/activity-log', async (req: Request, res: Response) => {
  try {
    const shop = (req as any).shop;
    if (!shop) {
      return res.status(400).json({ error: 'Missing required parameter: shop' });
    }

    const mongoService = await MongoDBService.getInstance();
    const activities = await mongoService.getCollection('security_alerts')
      .find({ shop })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    res.json(activities);
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ error: 'Failed to fetch activity log', details: error instanceof Error ? error.message : error });
  }
});

// Block IP endpoint
router.post('/block-ip', async (req: Request, res: Response) => {
  try {
    const shop = (req as any).shop;
    const { ip, reason, duration } = req.body;

    // Manual validation
    if (!shop) {
      return res.status(400).json({ error: 'Missing required parameter: shop' });
    }
    if (!ip || typeof ip !== 'string' || !/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
      return res.status(400).json({ error: 'Invalid or missing IP address', details: { ip } });
    }
    if (duration && (typeof duration !== 'number' || duration <= 0)) {
      return res.status(400).json({ error: 'Invalid duration', details: { duration } });
    }
    if (reason && typeof reason !== 'string') {
      return res.status(400).json({ error: 'Invalid reason', details: { reason } });
    }

    const redisService = await RedisService.getInstance();
    const success = await redisService.blockStoreIP(shop, ip, {
      duration: duration || 3600,
      reason: reason || 'Manual block'
    });

    if (success) {
      res.json({ status: 'success', message: 'IP blocked successfully' });
    } else {
      res.status(500).json({ error: 'Failed to block IP' });
    }
  } catch (error) {
    console.error('Error blocking IP:', error);
    res.status(500).json({ error: 'Failed to block IP', details: error instanceof Error ? error.message : error });
  }
});

// Unblock IP endpoint
router.post('/unblock-ip', async (req: Request, res: Response) => {
  try {
    const shop = (req as any).shop;
    const { ip } = req.body;

    if (!shop) {
      return res.status(400).json({ error: 'Missing required parameter: shop' });
    }
    if (!ip || typeof ip !== 'string' || !/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
      return res.status(400).json({ error: 'Invalid or missing IP address', details: { ip } });
    }

    const redisService = await RedisService.getInstance();
    const key = `blocked:${shop}:${ip}`;
    await redisService.del(key);

    res.json({ status: 'success', message: 'IP unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    res.status(500).json({ error: 'Failed to unblock IP', details: error instanceof Error ? error.message : error });
  }
});

// Store configuration endpoint
router.post('/store-config', async (req: Request, res: Response) => {
  try {
    const shop = (req as any).shop;
    const { config } = req.body;

    // Manual validation
    if (!shop) {
      return res.status(400).json({ error: 'Missing required parameter: shop' });
    }
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ error: 'Missing or invalid config object', details: { config } });
    }
    // Example: check for required config fields
    if (typeof config.blockThreshold !== 'number' || config.blockThreshold < 1 || config.blockThreshold > 100) {
      return res.status(400).json({ error: 'Invalid blockThreshold', details: { blockThreshold: config.blockThreshold } });
    }
    if (config.customDomain && typeof config.customDomain === 'string' && !/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(config.customDomain)) {
      return res.status(400).json({ error: 'Invalid customDomain', details: { customDomain: config.customDomain } });
    }

    const mongoService = await MongoDBService.getInstance();
    await mongoService.getCollection('store_configs').updateOne(
      { shop },
      { $set: { config, updatedAt: new Date() } },
      { upsert: true }
    );

    res.json({ status: 'success', message: 'Store configuration updated' });
  } catch (error) {
    console.error('Error updating store configuration:', error);
    res.status(500).json({ error: 'Failed to update store configuration', details: error instanceof Error ? error.message : error });
  }
});

// Get store configuration endpoint
router.get('/store-config', async (req: Request, res: Response) => {
  try {
    console.log('DEBUG /api/store-config', { reqShop: (req as any).shop, queryShop: req.query.shop });
    let shop = (req as any).shop;
    if (!shop && req.query.shop) {
      if (typeof req.query.shop === 'string') {
        shop = req.query.shop as string;
      } else if (Array.isArray(req.query.shop)) {
        shop = req.query.shop[0] as string;
      }
    }
    if (!shop) {
      return res.status(400).json({ error: 'No shop provided' });
    }

    const mongoService = await MongoDBService.getInstance();
    const config = await mongoService.getCollection('store_configs')
      .findOne({ shop });

    res.json({
      status: 'success',
      data: config?.config || {
        theme: 'system',
        notifications: true,
        autoBlock: true,
        blockThreshold: 5,
      }
    });
  } catch (error) {
    console.error('Error fetching store configuration:', error);
    res.status(500).json({ error: 'Failed to fetch store configuration' });
  }
});

// Get blocked IPs endpoint
router.get('/blocked-ips', async (req: Request, res: Response) => {
  try {
    const shop = (req as any).shop;
    if (!shop) {
      return res.status(400).json({ error: 'No shop provided' });
    }

    const redisService = await RedisService.getInstance();
    const blockedIPs = await redisService.getStoreBlockedIPs(shop);

    res.json({
      status: 'success',
      data: blockedIPs
    });
  } catch (error) {
    console.error('Error fetching blocked IPs:', error);
    res.status(500).json({ error: 'Failed to fetch blocked IPs' });
  }
});

export default router; 