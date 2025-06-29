"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const mongodb_1 = require("../services/mongodb");
const redis_1 = require("../services/redis");
async function initializeDatabase() {
    try {
        const mongoService = await mongodb_1.MongoDBService.getInstance();
        const redisService = await redis_1.RedisService.getInstance();
        // Create indexes for bot_activities collection
        const botActivitiesCollection = mongoService.getCollection('bot_activities');
        await botActivitiesCollection.createIndexes([
            { key: { shop: 1 } },
            { key: { timestamp: -1 } },
            { key: { severity: 1 } },
            { key: { ip: 1 } }
        ]);
        // Create indexes for blocked_ips collection
        const blockedIPsCollection = mongoService.getCollection('blocked_ips');
        await blockedIPsCollection.createIndexes([
            { key: { shop: 1 } },
            { key: { ip: 1 } },
            { key: { blockedAt: -1 } },
            { key: { ip: 1, shop: 1 }, unique: true }
        ]);
        // Create indexes for security_alerts collection
        const securityAlertsCollection = mongoService.getCollection('security_alerts');
        await securityAlertsCollection.createIndexes([
            { key: { shop: 1 } },
            { key: { timestamp: -1 } },
            { key: { resolved: 1 } }
        ]);
        console.log('Database initialized successfully');
    }
    catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}
// Run initialization if this file is run directly
if (require.main === module) {
    initializeDatabase()
        .then(() => {
        console.log('Database initialization completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Database initialization failed:', error);
        process.exit(1);
    });
}
