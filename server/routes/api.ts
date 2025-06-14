import express from 'express';
import { shopifyAuthMiddleware } from '../middleware/shopifyAuth';
import { RedisService } from '../services/redis';
import { MongoDBService } from '../services/mongodb';

const router = express.Router();

// Apply Shopify auth middleware to all routes
router.use(shopifyAuthMiddleware);

// Dashboard data endpoint
router.get('/dashboard', async (req, res) => {
  try {
    const { shop } = req;
    if (!shop) {
      return res.status(400).json({ error: 'No shop provided' });
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
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Bot activities endpoint
router.get('/bot-activities', async (req, res) => {
  try {
    const { shop } = req;
    if (!shop) {
      return res.status(400).json({ error: 'No shop provided' });
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
    res.status(500).json({ error: 'Failed to fetch bot activities' });
  }
});

// Activity log endpoint
router.get('/activity-log', async (req, res) => {
  try {
    const { shop } = req;
    if (!shop) {
      return res.status(400).json({ error: 'No shop provided' });
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
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

// Block IP endpoint
router.post('/block-ip', async (req, res) => {
  try {
    const { shop } = req;
    const { ip, reason, duration } = req.body;

    if (!shop || !ip) {
      return res.status(400).json({ error: 'Missing required parameters' });
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
    res.status(500).json({ error: 'Failed to block IP' });
  }
});

// Unblock IP endpoint
router.post('/unblock-ip', async (req, res) => {
  try {
    const { shop } = req;
    const { ip } = req.body;

    if (!shop || !ip) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const redisService = await RedisService.getInstance();
    const key = `blocked:${shop}:${ip}`;
    await redisService.del(key);

    res.json({ status: 'success', message: 'IP unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    res.status(500).json({ error: 'Failed to unblock IP' });
  }
});

// Store configuration endpoint
router.post('/store-config', async (req, res) => {
  try {
    const { shop } = req;
    const { config } = req.body;

    if (!shop || !config) {
      return res.status(400).json({ error: 'Missing required parameters' });
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
    res.status(500).json({ error: 'Failed to update store configuration' });
  }
});

// Get store configuration endpoint
router.get('/store-config', async (req, res) => {
  try {
    const { shop } = req;
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

export default router; 