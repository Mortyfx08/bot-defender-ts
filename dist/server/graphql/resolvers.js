"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const AttemptLog_1 = __importDefault(require("../models/AttemptLog"));
exports.resolvers = {
    Query: {
        getBotStats: async (_, __, { req }) => {
            const shopId = req.shopify?.session?.shop;
            if (!shopId) {
                throw new Error('Unauthorized - No shop ID provided');
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
