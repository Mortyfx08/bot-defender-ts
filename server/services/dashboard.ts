import { MongoDBService } from './mongodb';
import { RedisService } from './redis';
import { ThreatFeedService } from './threatFeedService';

export class DashboardService {
  private static instance: DashboardService;
  private mongoService!: MongoDBService;
  private redisService!: RedisService;
  private threatFeedService!: ThreatFeedService;

  private constructor() {}

  public static async getInstance(): Promise<DashboardService> {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
      DashboardService.instance.mongoService = await MongoDBService.getInstance();
      DashboardService.instance.redisService = await RedisService.getInstance();
      DashboardService.instance.threatFeedService = await ThreatFeedService.getInstance();
    }
    return DashboardService.instance;
  }

  public async getDashboardData(shop: string) {
    try {
      // Get bot activity stats
      const botStats = await this.mongoService.getBotActivityStats();

      // Get recent bot activities
      const recentActivities = await this.mongoService.getCollection('bot_activities')
        .find({ shop })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();

      // Get security alerts
      const securityAlerts = await this.mongoService.getCollection('security_alerts')
        .find({ 
          shop,
          resolved: false,
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();

      // Get blocked IPs
      const blockedIPs = await this.mongoService.getCollection('blocked_ips')
        .find({ shop })
        .sort({ blockedAt: -1 })
        .limit(10)
        .toArray();

      // Get Redis blocked IPs
      const redisBlockedIPs = await this.redisService.getStoreBlockedIPs(shop);

      // Get threat feed specific data
      const threatFeedIPs = await this.threatFeedService.getThreatFeedIPs();
      const threatFeedStats = await this.mongoService.getCollection('threat_feed_updates')
        .find()
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray();

      // Get threat feed blocks
      const threatFeedBlocks = await this.mongoService.getCollection('blocked_ips')
        .find({ 
          shop,
          'metadata.type': 'threat_feed'
        })
        .sort({ blockedAt: -1 })
        .limit(10)
        .toArray();

      // Calculate metrics
      const metrics = {
        totalAlerts: securityAlerts.length,
        totalBlockedIPs: blockedIPs.length + redisBlockedIPs.length,
        recentBotActivities: recentActivities.length,
        highSeverityAlerts: securityAlerts.filter(alert => alert.severity === 'high').length,
        mediumSeverityAlerts: securityAlerts.filter(alert => alert.severity === 'medium').length,
        lowSeverityAlerts: securityAlerts.filter(alert => alert.severity === 'low').length,
        // Threat feed specific metrics
        threatFeedMetrics: {
          totalThreatFeedIPs: threatFeedIPs.length,
          threatFeedBlocks: threatFeedBlocks.length,
          lastUpdate: threatFeedStats[0]?.timestamp || null,
          threatFeedHighSeverity: securityAlerts.filter(alert => 
            alert.type === 'threat_feed_ip' && alert.severity === 'high'
          ).length,
          threatFeedMediumSeverity: securityAlerts.filter(alert => 
            alert.type === 'threat_feed_ip' && alert.severity === 'medium'
          ).length,
          threatFeedLowSeverity: securityAlerts.filter(alert => 
            alert.type === 'threat_feed_ip' && alert.severity === 'low'
          ).length
        }
      };

      return {
        status: 'success',
        data: {
          metrics,
          botStats,
          recentActivities,
          securityAlerts,
          blockedIPs: {
            mongo: blockedIPs,
            redis: redisBlockedIPs
          },
          threatFeedData: {
            totalIPs: threatFeedIPs.length,
            lastUpdate: threatFeedStats[0]?.timestamp || null,
            recentBlocks: threatFeedBlocks,
            updateStats: threatFeedStats[0] || null
          },
          timestamp: new Date()
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
} 