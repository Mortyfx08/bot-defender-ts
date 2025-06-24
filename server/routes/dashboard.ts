import express, { Request, Response } from 'express';
import { MongoDBService } from '../services/mongodb';
import { RedisService } from '../services/redis';
import { Session } from '@shopify/shopify-api';

const router = express.Router();

// Get overall dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const session = (req as any).session as Session;
    const mongoService = await MongoDBService.getInstance();
    const redisService = await RedisService.getInstance();

    // Get bot activity stats
    const botStats = await mongoService.getBotActivityStats(session);

    // Get blocked IPs
    const blockedIPs = await redisService.getStoreBlockedIPs(session.shop);

    // Get recent attacks
    const recentAttacks = await mongoService.getRecentAttacks(session, 10); // Last 10 attacks

    res.json({
      botStats,
      blockedIPs,
      recentAttacks,
      shop: session.shop,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      error: 'Failed to get dashboard stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get bot activity with filters
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const session = (req as any).session as Session;
    const mongoService = await MongoDBService.getInstance();

    // Parse query parameters
    const query = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      severity: req.query.severity as string | undefined
    };

    const activities = await mongoService.getBotActivities(session, query);

    res.json({
      activities,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting bot activities:', error);
    res.status(500).json({
      error: 'Failed to get bot activities',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get blocked IPs
router.get('/blocked-ips', async (req: Request, res: Response) => {
  try {
    const session = (req as any).session as Session;
    const redisService = await RedisService.getInstance();
    const mongoService = await MongoDBService.getInstance();

    // Get temporary blocked IPs from Redis
    const redisBlockedIPs = await redisService.getStoreBlockedIPs(session.shop);

    // Get permanent blocked IPs from MongoDB
    const mongoBlockedIPs = await mongoService.getCollection('blocked_ips').find({
      shop: session.shop
    }).sort({ blockedAt: -1 }).toArray();

    res.json({
      temporary: redisBlockedIPs,
      permanent: mongoBlockedIPs,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting blocked IPs:', error);
    res.status(500).json({
      error: 'Failed to get blocked IPs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get security alerts
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const session = (req as any).session as Session;
    const mongoService = await MongoDBService.getInstance();

    const alerts = await mongoService.getStoreAlerts(session);

    res.json({
      alerts,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting security alerts:', error);
    res.status(500).json({
      error: 'Failed to get security alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Unblock an IP
router.post('/unblock-ip', async (req: Request, res: Response) => {
  try {
    const session = (req as any).session as Session;
    const { ip } = req.body;

    if (!ip) {
      return res.status(400).json({
        error: 'IP address is required'
      });
    }

    const redisService = await RedisService.getInstance();
    const mongoService = await MongoDBService.getInstance();

    // Remove from Redis
    await redisService.del(`blocked:${session.shop}:${ip}`);

    // Remove from MongoDB
    await mongoService.getCollection('blocked_ips').deleteMany({
      shop: session.shop,
      ip: ip
    });

    res.json({
      message: 'IP unblocked successfully',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    res.status(500).json({
      error: 'Failed to unblock IP',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Resolve a security alert
router.post('/resolve-alert', async (req: Request, res: Response) => {
  try {
    const session = (req as any).session as Session;
    const { alertId } = req.body;

    if (!alertId) {
      return res.status(400).json({
        error: 'Alert ID is required'
      });
    }

    const mongoService = await MongoDBService.getInstance();

    await mongoService.getPrisma().securityAlert.update({
      where: {
        id: alertId
      },
      data: {
        resolved: true
      }
    });

    res.json({
      message: 'Alert resolved successfully',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      error: 'Failed to resolve alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 