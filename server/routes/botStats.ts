import { Request, Response, Router } from 'express';
import AttemptLog from '../models/AttemptLog';
import { authenticateShopify } from '../middleware/auth';

const router = Router();

// Get bot attack statistics for a specific store
router.get('/stats', authenticateShopify, async (req: Request, res: Response) => {
  try {
    const shopId = req.shopify?.session?.shop;
    if (!shopId) {
      return res.status(401).json({ error: 'Unauthorized - No shop ID provided' });
    }

    const stats = await AttemptLog.aggregate([
      { $match: { shopId } },
      {
        $group: {
          _id: null,
          totalBlockedBots: {
            $sum: { $cond: [{ $eq: ['$type', 'blocked'] }, 1, 0] }
          },
          totalScanAttempts: { $sum: 1 },
          lastScan: { $max: '$timestamp' },
          falsePositives: {
            $sum: { $cond: [{ $eq: ['$type', 'false_positive'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get recent attacks
    const recentAttacks = await AttemptLog.find({ shopId })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('ip timestamp userAgent blocked');

    // Calculate health score (example calculation)
    const healthScore = stats[0] ? 
      Math.max(0, 100 - (stats[0].falsePositives / stats[0].totalScanAttempts * 100)) : 
      100;

    res.json({
      stats: stats[0] || {
        totalBlockedBots: 0,
        totalScanAttempts: 0,
        lastScan: new Date(),
        falsePositives: 0
      },
      healthScore,
      recentAttacks
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;