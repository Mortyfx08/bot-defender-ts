"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlocklistUpdater = void 0;
const axios_1 = __importDefault(require("axios"));
const redis_1 = require("./redis");
const mongodb_1 = require("./mongodb");
const threatFeedService_1 = require("./threatFeedService");
const THREAT_FEEDS = [
    'https://lists.blocklist.de/lists/all.txt',
    'https://www.binarydefense.com/banlist.txt',
    'https://rules.emergingthreats.net/blockrules/compromised-ips.txt'
];
function isValidIP(ip) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}
class BlocklistUpdater {
    constructor() {
        this.isUpdating = false;
        this.updateInterval = null;
        this.isPaused = false;
        // Start daily updates (every 24 hours)
        this.startDailyUpdates();
    }
    static getInstance() {
        if (!BlocklistUpdater.instance) {
            BlocklistUpdater.instance = new BlocklistUpdater();
        }
        return BlocklistUpdater.instance;
    }
    startDailyUpdates() {
        // Run immediately on startup
        this.updateBlocklist();
        // Then run every 24 hours
        this.updateInterval = setInterval(() => {
            if (!this.isPaused) {
                this.updateBlocklist();
            }
        }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    }
    async updateBlocklist() {
        if (this.isUpdating || this.isPaused) {
            console.log('Blocklist update skipped - already updating or paused');
            return;
        }
        try {
            this.isUpdating = true;
            console.log('Starting blocklist update...');
            const badIPs = new Set();
            for (const url of THREAT_FEEDS) {
                try {
                    console.log(`Fetching from ${url}...`);
                    const { data } = await axios_1.default.get(url);
                    data.split('\n').forEach((ip) => {
                        if (isValidIP(ip))
                            badIPs.add(ip.trim());
                    });
                }
                catch (error) {
                    console.error(`Error fetching from ${url}:`, error);
                }
            }
            console.log(`Found ${badIPs.size} bad IPs`);
            // Get services
            const redisService = await redis_1.RedisService.getInstance();
            const threatFeedService = await threatFeedService_1.ThreatFeedService.getInstance();
            // Update threat feed list
            await threatFeedService.updateThreatFeeds();
            console.log(`Updated threat feed list with ${badIPs.size} IPs`);
            // Update MongoDB only for actual blocked attempts
            const mongoService = await mongodb_1.MongoDBService.getInstance();
            // Log the update event in MongoDB
            await mongoService.getCollection('threat_feed_updates').insertOne({
                timestamp: new Date(),
                totalIPs: badIPs.size,
                sources: THREAT_FEEDS,
                metadata: {
                    type: 'threat_feed_update',
                    status: 'success'
                }
            });
            console.log('Blocklist update completed successfully');
        }
        catch (error) {
            console.error('Error updating blocklist:', error);
            // Log the error in MongoDB
            const mongoService = await mongodb_1.MongoDBService.getInstance();
            await mongoService.getCollection('threat_feed_updates').insertOne({
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error',
                metadata: {
                    type: 'threat_feed_update',
                    status: 'error'
                }
            });
        }
        finally {
            this.isUpdating = false;
        }
    }
    pauseUpdates() {
        this.isPaused = true;
        console.log('Blocklist updates paused');
    }
    resumeUpdates() {
        this.isPaused = false;
        console.log('Blocklist updates resumed');
    }
    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}
exports.BlocklistUpdater = BlocklistUpdater;
