"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotAnalysisService = void 0;
const redis_1 = require("./redis");
const mongodb_1 = require("./mongodb");
class BotAnalysisService {
    constructor() { }
    static async getInstance() {
        if (!BotAnalysisService.instance) {
            BotAnalysisService.instance = new BotAnalysisService();
            BotAnalysisService.instance.redisService = await redis_1.RedisService.getInstance();
            BotAnalysisService.instance.mongoService = await mongodb_1.MongoDBService.getInstance();
        }
        return BotAnalysisService.instance;
    }
    async analyzeRequest(req) {
        const ip = this.getClientIP(req);
        const userAgent = req.headers['user-agent'] || 'unknown';
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
    getClientIP(req) {
        return Array.isArray(req.headers['x-forwarded-for'])
            ? req.headers['x-forwarded-for'][0]
            : req.headers['x-forwarded-for'] || req.ip || 'unknown';
    }
    async checkIP(ip) {
        try {
            return await this.redisService.isBlocked(ip);
        }
        catch (error) {
            console.error('Error checking IP:', error);
            return false;
        }
    }
    isBotUserAgent(userAgent) {
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
    async checkRequestRate(ip) {
        try {
            const requests = await this.redisService.trackRequestRate(ip);
            return requests > 100; // More than 100 requests per minute
        }
        catch (error) {
            console.error('Error checking request rate:', error);
            return false;
        }
    }
    isSuspiciousPath(path) {
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
    async logBotActivity(activity) {
        try {
            await this.mongoService.getCollection('bot_activities').insertOne({
                ...activity,
                timestamp: new Date()
            });
        }
        catch (error) {
            console.error('Error logging bot activity:', error);
        }
    }
}
exports.BotAnalysisService = BotAnalysisService;
