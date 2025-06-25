"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBService = void 0;
const mongodb_1 = require("mongodb");
const client_1 = require("@prisma/client");
class MongoDBService {
    constructor() {
        console.log('Initializing MongoDB client...');
        console.log('MongoDB URI:', process.env.MONGODB_URI);
        this.client = new mongodb_1.MongoClient(process.env.MONGODB_URI);
        this.prisma = new client_1.PrismaClient();
    }
    static async getInstance() {
        if (!MongoDBService.instance) {
            MongoDBService.instance = new MongoDBService();
            await MongoDBService.instance.connect();
        }
        return MongoDBService.instance;
    }
    async connect() {
        try {
            console.log('Connecting to MongoDB...');
            await this.client.connect();
            this.db = this.client.db();
            console.log('Connected to MongoDB successfully');
            console.log('Database name:', this.db.databaseName);
            // List all collections
            const collections = await this.db.listCollections().toArray();
            console.log('Available collections:', collections.map(c => c.name));
        }
        catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }
    getCollection(collectionName) {
        return this.db.collection(collectionName);
    }
    getPrisma() {
        return this.prisma;
    }
    async logBotActivity(data) {
        const shop = data.session?.shop || 'test-shop';
        console.log('Logging bot activity for shop:', shop);
        // Use native MongoDB for bot activity
        const collection = this.getCollection('bot_activities');
        const result = await collection.insertOne({
            ip: data.ip,
            userAgent: data.userAgent,
            path: data.path,
            severity: data.severity,
            shop: shop,
            timestamp: new Date(),
            metadata: data.metadata
        });
        console.log('Bot activity logged successfully:', result);
        return result;
    }
    async getBotActivityStats(session) {
        const shop = session?.shop || 'test-shop';
        // Get stats from MongoDB
        const collection = this.getCollection('bot_activities');
        const stats = await collection.aggregate([
            {
                $match: { shop }
            },
            {
                $group: {
                    _id: '$severity',
                    count: { $sum: 1 },
                    uniqueIPs: { $addToSet: '$ip' }
                }
            }
        ]).toArray();
        // Get total blocked IPs
        const blockedCollection = this.getCollection('blocked_ips');
        const totalBlocked = await blockedCollection.countDocuments({ shop });
        // Get recent activity count
        const recentActivity = await collection.countDocuments({
            shop,
            timestamp: {
                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
        });
        return {
            stats,
            totalBlocked,
            recentActivity,
            timestamp: new Date()
        };
    }
    async getBotActivities(session, query) {
        const shop = session.shop;
        const collection = this.getCollection('bot_activities');
        const filter = { shop };
        if (query.startDate || query.endDate) {
            filter.timestamp = {};
            if (query.startDate)
                filter.timestamp.$gte = query.startDate;
            if (query.endDate)
                filter.timestamp.$lte = query.endDate;
        }
        if (query.severity) {
            filter.severity = query.severity;
        }
        return await collection.find(filter)
            .sort({ timestamp: -1 })
            .limit(100)
            .toArray();
    }
    async getRecentAttacks(session, limit = 10) {
        const shop = session.shop;
        const collection = this.getCollection('bot_activities');
        return await collection.find({
            shop,
            severity: 'high'
        })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
    }
    async getStoreAlerts(session) {
        const shop = session.shop;
        const collection = this.getCollection('security_alerts');
        return await collection.find({
            shop,
            resolved: false
        })
            .sort({ timestamp: -1 })
            .limit(50)
            .toArray();
    }
    async disconnect() {
        await this.client.close();
        await this.prisma.$disconnect();
    }
}
exports.MongoDBService = MongoDBService;
