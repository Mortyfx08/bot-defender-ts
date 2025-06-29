"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("../services/mongodb");
const redis_1 = require("../services/redis");
const router = express_1.default.Router();
// Get overall dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const session = req.session;
        const mongoService = await mongodb_1.MongoDBService.getInstance();
        const redisService = await redis_1.RedisService.getInstance();
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
    }
    catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({
            error: 'Failed to get dashboard stats',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get bot activity with filters
router.get('/activity', async (req, res) => {
    try {
        const session = req.session;
        const mongoService = await mongodb_1.MongoDBService.getInstance();
        // Parse query parameters
        const query = {
            startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
            severity: req.query.severity
        };
        const activities = await mongoService.getBotActivities(session, query);
        res.json({
            activities,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Error getting bot activities:', error);
        res.status(500).json({
            error: 'Failed to get bot activities',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get blocked IPs
router.get('/blocked-ips', async (req, res) => {
    try {
        const session = req.session;
        const redisService = await redis_1.RedisService.getInstance();
        const mongoService = await mongodb_1.MongoDBService.getInstance();
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
    }
    catch (error) {
        console.error('Error getting blocked IPs:', error);
        res.status(500).json({
            error: 'Failed to get blocked IPs',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get security alerts
router.get('/alerts', async (req, res) => {
    try {
        const session = req.session;
        const mongoService = await mongodb_1.MongoDBService.getInstance();
        const alerts = await mongoService.getStoreAlerts(session);
        res.json({
            alerts,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Error getting security alerts:', error);
        res.status(500).json({
            error: 'Failed to get security alerts',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Unblock an IP
router.post('/unblock-ip', async (req, res) => {
    try {
        const session = req.session;
        const { ip } = req.body;
        if (!ip) {
            return res.status(400).json({
                error: 'IP address is required'
            });
        }
        const redisService = await redis_1.RedisService.getInstance();
        const mongoService = await mongodb_1.MongoDBService.getInstance();
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
    }
    catch (error) {
        console.error('Error unblocking IP:', error);
        res.status(500).json({
            error: 'Failed to unblock IP',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Resolve a security alert
router.post('/resolve-alert', async (req, res) => {
    try {
        const session = req.session;
        const { alertId } = req.body;
        if (!alertId) {
            return res.status(400).json({
                error: 'Alert ID is required'
            });
        }
        const mongoService = await mongodb_1.MongoDBService.getInstance();
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
    }
    catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({
            error: 'Failed to resolve alert',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
