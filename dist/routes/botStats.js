"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AttemptLog_1 = __importDefault(require("../models/AttemptLog"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get bot attack statistics for a specific store
router.get('/stats', auth_1.authenticateShopify, async (req, res) => {
    try {
        const shopId = req.shopify?.session?.shop;
        if (!shopId) {
            return res.status(401).json({ error: 'Unauthorized - No shop ID provided' });
        }
        const stats = await AttemptLog_1.default.aggregate([
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
        const recentAttacks = await AttemptLog_1.default.find({ shopId })
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
    }
    catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
exports.default = router;
