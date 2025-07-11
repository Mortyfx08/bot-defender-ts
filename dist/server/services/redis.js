"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
exports.blockShopifyBot = blockShopifyBot;
const redis_1 = require("redis");
const shopify_api_1 = require("@shopify/shopify-api");
const threatFeedService_1 = require("./threatFeedService");
// Initialize Redis client with enhanced configuration
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => {
            console.log(`Redis reconnection attempt ${retries}`);
            return Math.min(retries * 100, 3000);
        },
        keepAlive: true,
        connectTimeout: 10000
    }
});
// Enhanced error handling
redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
    console.error('Connection URL:', process.env.REDIS_URL?.replace(/:[^:@]+@/, ':****@'));
});
redisClient.on('connect', async () => {
    console.log('Redis client connected');
    try {
        // The following CONFIG commands are not supported on most managed Redis services (e.g., Redis Cloud), so they are disabled.
        // await redisClient.sendCommand(['CONFIG', 'SET', 'maxmemory-policy', 'allkeys-lru']);
        // await redisClient.sendCommand(['CONFIG', 'SET', 'maxmemory', '30mb']);
        // console.log('Redis memory configuration set to 30MB');
    }
    catch (error) {
        console.error('Error setting Redis memory configuration:', error);
    }
});
redisClient.on('ready', () => console.log('Redis client ready'));
redisClient.on('reconnecting', () => console.log('Redis client reconnecting'));
// Initialize Redis connection with retry logic
async function initializeRedis(retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await redisClient.connect();
            console.log('Redis client connected successfully');
            await redisClient.ping();
            console.log('Redis ping successful');
            return;
        }
        catch (err) {
            console.error(`Redis connection attempt ${i + 1} failed:`, err);
            if (i === retries - 1) {
                console.error('All Redis connection attempts failed');
                process.exit(1);
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}
// Call initialization
initializeRedis();
class RedisService {
    constructor() {
        this.isConnected = false;
        this.client = (0, redis_1.createClient)({
            url: process.env.REDIS_URL
        });
        // Handle Redis events
        this.client.on('error', (err) => console.error('Redis Client Error:', err));
        this.client.on('connect', () => {
            console.log('Redis client connected');
            this.isConnected = true;
        });
        this.client.on('ready', () => console.log('Redis client ready'));
        this.client.on('end', () => {
            console.log('Redis client disconnected');
            this.isConnected = false;
        });
    }
    static async getInstance() {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
            await RedisService.instance.connect();
            RedisService.instance.threatFeedService = await threatFeedService_1.ThreatFeedService.getInstance();
        }
        return RedisService.instance;
    }
    async connect() {
        try {
            await this.client.connect();
            console.log('Connected to Redis');
        }
        catch (error) {
            console.error('Redis connection error:', error);
            throw error;
        }
    }
    async get(key) {
        return this.client.get(key);
    }
    async set(key, value, ttl) {
        if (ttl) {
            await this.client.set(key, value, { EX: ttl });
        }
        else {
            await this.client.set(key, value);
        }
    }
    async del(...keys) {
        return this.client.del(keys);
    }
    async keys(pattern) {
        return this.client.keys(pattern);
    }
    async cleanupOldData() {
        try {
            // Get all blocked IP keys
            const keys = await this.client.keys('blocked:*');
            // Sort keys by last access time
            const keyStats = await Promise.all(keys.map(async (key) => {
                const idleTime = await this.client.object('idletime', key);
                return { key, idleTime: Number(idleTime) || 0 };
            }));
            // Sort by idle time (most idle first)
            keyStats.sort((a, b) => (b.idleTime || 0) - (a.idleTime || 0));
            // Remove 80% of the most idle blocked IPs to free up more space
            const keysToRemove = keyStats.slice(0, Math.ceil(keyStats.length * 0.8));
            if (keysToRemove.length > 0) {
                console.log(`Cleaning up ${keysToRemove.length} idle blocked IPs...`);
                await this.client.del(keysToRemove.map(k => k.key));
            }
            console.log('Cleanup of blocked IPs completed');
        }
        catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
    async checkMemoryStatus() {
        try {
            const info = await this.client.info('memory');
            const usedMemory = parseInt(info.match(/used_memory:(\d+)/)?.[1] || '0');
            const maxMemory = parseInt(info.match(/maxmemory:(\d+)/)?.[1] || '0');
            return {
                used: usedMemory,
                max: maxMemory,
                percentage: (usedMemory / maxMemory) * 100
            };
        }
        catch (error) {
            console.error('Error checking memory status:', error);
            return { used: 0, max: 0, percentage: 0 };
        }
    }
    async blockIP(ip, options) {
        try {
            const key = `blocked:${ip}`;
            const blockData = {
                reason: options.reason ?? 'No reason provided',
                timestamp: Date.now(),
                expiresAt: options.duration ? Date.now() + (options.duration * 1000) : Date.now()
            };
            await this.client.set(key, JSON.stringify(blockData));
            // Set 24-hour expiration for blocked IPs
            await this.client.expire(key, 24 * 60 * 60); // 24 hours
            return true;
        }
        catch (error) {
            console.error('Error blocking IP:', error);
            return false;
        }
    }
    async cleanupExpiredBlocks() {
        try {
            // Clean up all blocked IPs
            const keys = await this.client.keys('blocked:*');
            for (const key of keys) {
                const ttl = await this.client.ttl(key);
                if (ttl <= 0) {
                    await this.client.del(key);
                }
            }
            console.log('Cleaned up expired blocked IPs');
        }
        catch (error) {
            console.error('Error cleaning up expired blocks:', error);
        }
    }
    async isBlocked(ip) {
        try {
            // Check if IP is manually blocked
            const exists = await this.client.exists(`blocked:${ip}`);
            if (exists === 1) {
                return true;
            }
            // Check if IP is in threat feed
            const isInThreatFeed = await this.threatFeedService.isIPInThreatFeed(ip);
            if (isInThreatFeed) {
                // If IP is in threat feed, block it
                await this.blockIP(ip, {
                    duration: 24 * 60 * 60, // 24 hours
                    reason: 'IP found in threat feed'
                });
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error checking blocked IP:', error);
            return false;
        }
    }
    async getBlockedIPs() {
        try {
            await this.cleanupExpiredBlocks();
            // Get only manually blocked IPs
            const keys = await this.client.keys('blocked:*');
            const manuallyBlockedIPs = [];
            for (const key of keys) {
                const ip = key.replace('blocked:', '');
                const data = await this.client.get(key);
                if (data) {
                    const { reason, timestamp } = JSON.parse(data);
                    const ttl = await this.client.ttl(key);
                    manuallyBlockedIPs.push({
                        ip,
                        reason,
                        expiresAt: new Date(timestamp + ttl * 1000)
                    });
                }
            }
            return manuallyBlockedIPs;
        }
        catch (error) {
            console.error('Error getting blocked IPs:', error);
            return [];
        }
    }
    async getBlockReason(ip) {
        try {
            const key = `blocked:${ip}`;
            const data = await this.client.get(key);
            if (data) {
                const { reason } = JSON.parse(data);
                return reason;
            }
            return null;
        }
        catch (error) {
            console.error('Error getting block reason:', error);
            return null;
        }
    }
    async logAttack(ip, userAgent, path) {
        try {
            const key = `attack:${ip}`;
            const data = {
                ip,
                userAgent,
                path,
                timestamp: Date.now()
            };
            await this.client.set(key, JSON.stringify(data), { EX: 86400 }); // Store for 24 hours
        }
        catch (error) {
            console.error('Error logging attack:', error);
        }
    }
    async disconnect() {
        await this.client.quit();
    }
    async getStoreBlockedIPs(shop) {
        try {
            const keys = await this.client.keys(`blocked:${shop}:*`);
            const blockedIPs = [];
            for (const key of keys) {
                const ip = key.replace(`blocked:${shop}:`, '');
                const data = await this.client.get(key);
                if (data) {
                    const { reason, timestamp } = JSON.parse(data);
                    const ttl = await this.client.ttl(key);
                    blockedIPs.push({
                        ip,
                        reason,
                        expiresAt: new Date(timestamp + ttl * 1000)
                    });
                }
            }
            return blockedIPs;
        }
        catch (error) {
            console.error('Error getting store blocked IPs:', error);
            return [];
        }
    }
    async blockStoreIP(shop, ip, options = { duration: 3600 }) {
        try {
            const { duration, reason = 'Bot activity detected' } = options;
            const key = `blocked:${shop}:${ip}`;
            await this.client.set(key, JSON.stringify({ reason, timestamp: Date.now() }), { EX: duration });
            return true;
        }
        catch (error) {
            console.error('Error blocking store IP:', error);
            return false;
        }
    }
    async isStoreIPBlocked(shop, ip) {
        try {
            const key = `blocked:${shop}:${ip}`;
            const result = await this.client.get(key);
            return result !== null;
        }
        catch (error) {
            console.error('Error checking store blocked IP:', error);
            return false;
        }
    }
    async getStoreBlockReason(shop, ip) {
        try {
            const key = `blocked:${shop}:${ip}`;
            const data = await this.client.get(key);
            if (data) {
                const { reason } = JSON.parse(data);
                return reason;
            }
            return null;
        }
        catch (error) {
            console.error('Error getting store block reason:', error);
            return null;
        }
    }
    async getTTL(key) {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            console.error('Error getting TTL:', error);
            return -1;
        }
    }
    async clearAllBlockedIPs() {
        try {
            const keys = await this.client.keys('blocked:*');
            if (keys.length > 0) {
                await this.client.del(keys);
                console.log('Cleared all blocked IPs');
            }
        }
        catch (error) {
            console.error('Error clearing blocked IPs:', error);
        }
    }
    async cleanupRedis() {
        try {
            console.log('Starting Redis cleanup...');
            // Get all keys
            const keys = await this.client.keys('*');
            console.log(`Found ${keys.length} keys in Redis`);
            // Delete all keys
            if (keys.length > 0) {
                await this.client.del(keys);
                console.log('All Redis keys deleted successfully');
            }
            // Clear blocked IPs
            const blockedKeys = await this.client.keys('blocked:*');
            if (blockedKeys.length > 0) {
                await this.client.del(blockedKeys);
                console.log('All blocked IPs cleared');
            }
            // Clear request counts
            const requestKeys = await this.client.keys('requests:*');
            if (requestKeys.length > 0) {
                await this.client.del(requestKeys);
                console.log('All request counts cleared');
            }
            console.log('Redis cleanup completed successfully');
        }
        catch (error) {
            console.error('Error cleaning up Redis:', error);
            throw error;
        }
    }
    async trackRequestRate(ip) {
        try {
            const key = `requests:${ip}`;
            const requests = await this.client.incr(key);
            if (requests === 1) {
                await this.client.expire(key, 60); // 1 minute window
            }
            return requests;
        }
        catch (error) {
            console.error('Error tracking request rate:', error);
            return 0;
        }
    }
}
exports.RedisService = RedisService;
// Shopify integration example
async function blockShopifyBot(session, ip) {
    if (!ip) {
        console.warn('Attempted to block Shopify bot with undefined IP address');
        return;
    }
    const shopify = (0, shopify_api_1.shopifyApi)({
        apiKey: process.env.SHOPIFY_API_KEY,
        apiSecretKey: process.env.SHOPIFY_API_SECRET,
        hostName: process.env.HOST,
        apiVersion: shopify_api_1.ApiVersion.January24,
        isEmbeddedApp: true
    });
    const redisService = await RedisService.getInstance();
    await redisService.blockIP(ip, {
        reason: 'Shopify bot rule violation',
        duration: 3600 // 1 hour block
    });
    await shopify.rest.Webhook.create({
        session,
        address: `${process.env.HOST}/api/bot-alert`,
        topic: 'BOT_DETECTED',
        format: 'json'
    });
}
