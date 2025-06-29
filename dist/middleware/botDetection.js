"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.botDetectionMiddleware = botDetectionMiddleware;
const redis_1 = require("../services/redis");
const mongodb_1 = require("../services/mongodb");
const botAnalysis_1 = require("../utils/botAnalysis");
async function botDetectionMiddleware(req, res, next) {
    try {
        const ip = Array.isArray(req.headers['x-forwarded-for'])
            ? req.headers['x-forwarded-for'][0]
            : req.headers['x-forwarded-for'] || req.ip || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const path = req.path;
        const shop = res.locals.shopify?.session?.shop || 'test-shop.myshopify.com';
        // Check if IP is blocked
        const redisService = await redis_1.RedisService.getInstance();
        const isBlocked = await redisService.isStoreIPBlocked(shop, ip);
        if (isBlocked) {
            console.log(`Blocked request from IP: ${ip}`);
            return res.status(403).send(`
        <html>
          <head>
            <title>Access Denied</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .warning { color: red; font-size: 24px; }
            </style>
          </head>
          <body>
            <div class="warning">⚠️ Access Denied</div>
            <p>Suspicious bot activity detected. Your IP has been blocked.</p>
          </body>
        </html>
      `);
        }
        // Analyze request
        const analysis = await (0, botAnalysis_1.analyzeRequest)(req);
        if (analysis.isBot) {
            console.log('Bot detected:', analysis);
            // Log bot activity with severity
            const mongoService = await mongodb_1.MongoDBService.getInstance();
            await mongoService.logBotActivity({
                ip,
                userAgent,
                path,
                severity: analysis.severity,
                metadata: {
                    headers: req.headers,
                    reason: analysis.reason,
                    requestCount: analysis.requestCount,
                    ipReputation: analysis.ipReputation,
                    timestamp: new Date()
                }
            });
            // Create security alert with severity
            await mongoService.getCollection('security_alerts').insertOne({
                shop,
                type: 'suspicious_bot',
                severity: analysis.severity,
                message: analysis.reason,
                details: {
                    ip,
                    userAgent,
                    path,
                    requestCount: analysis.requestCount,
                    ipReputation: analysis.ipReputation,
                    timestamp: new Date()
                },
                timestamp: new Date(),
                resolved: false
            });
            // Block IP based on severity
            if (analysis.severity === 'high' || analysis.severity === 'medium') {
                const blockDuration = analysis.severity === 'high' ? 3600 : 1800; // 1 hour for high, 30 minutes for medium
                await redisService.blockStoreIP(shop, ip, {
                    duration: blockDuration,
                    reason: analysis.reason
                });
                // Log blocked IP with severity
                await mongoService.getCollection('blocked_ips').insertOne({
                    shop,
                    ip,
                    reason: analysis.reason,
                    severity: analysis.severity,
                    blockedAt: new Date(),
                    expiresAt: new Date(Date.now() + blockDuration * 1000),
                    metadata: {
                        userAgent,
                        path,
                        headers: req.headers,
                        requestCount: analysis.requestCount,
                        ipReputation: analysis.ipReputation,
                        timestamp: new Date()
                    }
                });
                return res.status(403).send(`
          <html>
            <head>
              <title>Access Denied</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .warning { color: red; font-size: 24px; }
                .severity { color: ${analysis.severity === 'high' ? 'red' : 'orange'}; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="warning">⚠️ Access Denied</div>
              <p>Suspicious bot activity detected. Your IP has been blocked.</p>
              <p>Reason: ${analysis.reason}</p>
              <p>Severity: <span class="severity">${analysis.severity.toUpperCase()}</span></p>
            </body>
          </html>
        `);
            }
            // For low severity, just log but don't block
            return res.status(403).send(`
        <html>
          <head>
            <title>Access Denied</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .warning { color: orange; font-size: 24px; }
            </style>
          </head>
          <body>
            <div class="warning">⚠️ Access Denied</div>
            <p>Suspicious activity detected.</p>
            <p>Reason: ${analysis.reason}</p>
            <p>Severity: LOW</p>
          </body>
        </html>
      `);
        }
        next();
    }
    catch (error) {
        console.error('Bot detection error:', error);
        next();
    }
}
