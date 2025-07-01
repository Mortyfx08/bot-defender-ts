"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const mongodb_1 = require("../services/mongodb");
const redis_1 = require("../services/redis");
async function initializeDatabase() {
    try {
        // Check if required environment variables are set
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not set');
        }
        if (!process.env.REDIS_URL) {
            throw new Error('REDIS_URL environment variable is not set');
        }
        console.log('Connecting to MongoDB...');
        const mongoService = await mongodb_1.MongoDBService.getInstance();
        console.log('MongoDB connected successfully');
        console.log('Connecting to Redis...');
        const redisService = await redis_1.RedisService.getInstance();
        console.log('Redis connected successfully');
        // Create indexes for bot_activities collection
        console.log('Creating database indexes...');
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
        console.log('✅ Database initialized successfully');
    }
    catch (error) {
        console.error('❌ Database initialization error:', error);
        console.error('Please check your environment variables:');
        console.error('- MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Missing');
        console.error('- REDIS_URL:', process.env.REDIS_URL ? 'Set' : 'Missing');
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
