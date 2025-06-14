import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../services/redis';
import { BotAnalysisService } from '../services/botAnalysis';

// Bot detection rules
const BOT_RULES = {
  suspiciousUserAgents: [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,         // Added wget
    /python-requests/i,
    /java/i,
    /perl/i,
    /ruby/i,
    /go-http/i,
    /node-fetch/i,
    /axios/i
  ],
  suspiciousPaths: [
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
    /\.well-known/i,
    /\.vscode/i,
    /\.idea/i,
    /\.DS_Store/i,
    /\.gitignore/i,
    /\.npmrc/i,
    /\.yarnrc/i,
    /\.env.local/i,
    /\.env.development/i,
    /\.env.production/i,
    /\.env.test/i,
    /\.env.staging/i,
    /\.env.backup/i,
    /\.env.old/i,
    /\.env.save/i,
    /\.env.swp/i,
    /\.env.swo/i,
    /\.env.bak/i,
    /\.env.tmp/i,
    /\.env.temp/i,
    /\.env.orig/i,
    /\.env.dist/i,
    /\.env.example/i,
    /\.env.sample/i,
    /\.env.default/i,
    /\.env.backup/i,
    /\.env.save/i,
    /\.env.swp/i,
    /\.env.swo/i,
    /\.env.bak/i,
    /\.env.tmp/i,
    /\.env.temp/i,
    /\.env.orig/i,
    /\.env.dist/i,
    /\.env.example/i,
    /\.env.sample/i,
    /\.env.default/i
  ]
};

const botProtectionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const redisService = await RedisService.getInstance();
    const botAnalysisService = await BotAnalysisService.getInstance();
    
    const ip = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const path = req.path;

    if (!ip) {
      console.warn('No IP address found in request');
      return next();
    }

    // Check if IP is blocked
    const isBlocked = await redisService.isBlocked(ip);
    if (isBlocked) {
      const reason = await redisService.getBlockReason(ip);
      console.log(`Blocked request from IP ${ip}: ${reason}`);
      return res.status(429).json({
        error: 'IP blocked',
        reason: reason || 'Bot activity detected'
      });
    }

    // Analyze request for bot activity
    const { isBot, reason: botAnalysisReason } = await botAnalysisService.analyzeRequest(req);
    if (isBot) {
      await redisService.blockIP(ip, {
        duration: 0, // Permanent block
        reason: botAnalysisReason || 'Bot activity detected'
      });
      return res.status(429).json({
        error: 'Bot detected',
        reason: botAnalysisReason || 'Bot activity detected'
      });
    }

    // Check for suspicious patterns
    const isSuspiciousUserAgent = BOT_RULES.suspiciousUserAgents.some(pattern => pattern.test(userAgent));
    const isSuspiciousPath = BOT_RULES.suspiciousPaths.some(pattern => pattern.test(path));

    if (isSuspiciousUserAgent || isSuspiciousPath) {
      await redisService.blockIP(ip, {
        duration: 3600, // 1 hour
        reason: isSuspiciousUserAgent ? 'Suspicious user agent' : 'Suspicious path access'
      });
      return res.status(403).json({
        error: 'Access denied',
        message: 'Suspicious activity detected'
      });
    }

    next();
  } catch (error) {
    console.error('Error in bot protection middleware:', error);
    next();
  }
};

export default botProtectionMiddleware; 