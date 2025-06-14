import { Request } from 'express';
import AttemptLog from '../models/AttemptLog';

interface Context {
  req: Request;
}

export const resolvers = {
  Query: {
    getBotStats: async (_: any, __: any, { req }: Context) => {
      const shopId = req.shopify?.session?.shop;
      if (!shopId) {
        throw new Error('Unauthorized - No shop ID provided');
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

      // Calculate health score
      const healthScore = stats[0] ? 
        Math.max(0, 100 - (stats[0].falsePositives / stats[0].totalScanAttempts * 100)) : 
        100;

      return {
        totalBlockedBots: stats[0]?.totalBlockedBots || 0,
        totalScanAttempts: stats[0]?.totalScanAttempts || 0,
        lastScan: stats[0]?.lastScan || new Date().toISOString(),
        falsePositives: stats[0]?.falsePositives || 0,
        healthScore,
        recentAttacks: recentAttacks.map(attack => ({
          ip: attack.ip,
          timestamp: attack.timestamp.toISOString(),
          userAgent: attack.userAgent,
          blocked: attack.type === 'blocked'
        }))
      };
    }
  }
}; 