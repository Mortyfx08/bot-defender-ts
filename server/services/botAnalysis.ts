import { Request } from 'express';
import { RedisService } from './redis';
import { MongoDBService } from './mongodb';

interface BotActivity {
  ip: string;
  userAgent: string;
  path: string;
  severity: 'low' | 'medium' | 'high';
  metadata: {
    headers: any;
    reason: string;
    type: string;
  };
}

export class BotAnalysisService {
  private static instance: BotAnalysisService;
  private redisService!: RedisService;
  private mongoService!: MongoDBService;

  private constructor() {}

  public static async getInstance(): Promise<BotAnalysisService> {
    if (!BotAnalysisService.instance) {
      BotAnalysisService.instance = new BotAnalysisService();
      BotAnalysisService.instance.redisService = await RedisService.getInstance();
      BotAnalysisService.instance.mongoService = await MongoDBService.getInstance();
    }
    return BotAnalysisService.instance;
  }

  public async analyzeRequest(req: Request): Promise<{ isBot: boolean; reason?: string }> {
    const ip = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] as string || 'unknown';
    const path = req.path;

    // Check if IP is already blocked
    if (await this.checkIP(ip)) {
      return { isBot: true, reason: 'IP is blocked' };
    }

    // Check user agent
    if (this.isBotUserAgent(userAgent)) {
      await this.logBotActivity({
        ip,
        userAgent,
        path,
        severity: 'high',
        metadata: {
          headers: req.headers,
          reason: 'Bot user agent detected',
          type: 'user_agent'
        }
      });
      return { isBot: true, reason: 'Bot user agent detected' };
    }

    // Check request rate
    const isHighRate = await this.checkRequestRate(ip);
    if (isHighRate) {
      await this.logBotActivity({
        ip,
        userAgent,
        path,
        severity: 'medium',
        metadata: {
          headers: req.headers,
          reason: 'High request rate detected',
          type: 'rate_limit'
        }
      });
      return { isBot: true, reason: 'High request rate detected' };
    }

    // Check suspicious paths
    if (this.isSuspiciousPath(path)) {
      await this.logBotActivity({
        ip,
        userAgent,
        path,
        severity: 'high',
        metadata: {
          headers: req.headers,
          reason: 'Suspicious path access',
          type: 'path_scan'
        }
      });
      return { isBot: true, reason: 'Suspicious path access' };
    }

    return { isBot: false };
  }

  private getClientIP(req: Request): string {
    return Array.isArray(req.headers['x-forwarded-for']) 
      ? req.headers['x-forwarded-for'][0] 
      : (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
  }

  private async checkIP(ip: string): Promise<boolean> {
    try {
      return await this.redisService.isBlocked(ip);
    } catch (error) {
      console.error('Error checking IP:', error);
      return false;
    }
  }

  private isBotUserAgent(userAgent: string): boolean {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python-requests/i,
      /java/i,
      /perl/i,
      /ruby/i,
      /go-http/i,
      /php/i
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  private async checkRequestRate(ip: string): Promise<boolean> {
    try {
      const requests = await this.redisService.trackRequestRate(ip);
      return requests > 100; // More than 100 requests per minute
    } catch (error) {
      console.error('Error checking request rate:', error);
      return false;
    }
  }

  private isSuspiciousPath(path: string): boolean {
    const suspiciousPatterns = [
      /wp-admin/i,
      /wp-login/i,
      /admin/i,
      /login/i,
      /phpmyadmin/i,
      /\.env/i,
      /\.git/i,
      /\.svn/i,
      /\.htaccess/i,
      /\.htpasswd/i,
      /\.php/i,
      /\.asp/i,
      /\.aspx/i,
      /\.jsp/i,
      /\.sql/i,
      /\.bak/i,
      /\.backup/i,
      /\.old/i,
      /\.swp/i,
      /\.tmp/i,
      /\.temp/i,
      /\.log/i,
      /\.ini/i,
      /\.config/i,
      /\.conf/i,
      /\.xml/i,
      /\.json/i,
      /\.yaml/i,
      /\.yml/i,
      /\.toml/i,
      /\.properties/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(path));
  }

  private async logBotActivity(activity: BotActivity): Promise<void> {
    try {
      await this.mongoService.getCollection('bot_activities').insertOne({
        ...activity,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging bot activity:', error);
    }
  }
} 