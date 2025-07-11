"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreatFeedService = void 0;
const axios_1 = __importDefault(require("axios"));
const mongodb_1 = require("./mongodb");
class ThreatFeedService {
    constructor() {
        this.updateInterval = null;
        this.updateThreshold = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
        this.threatFeedSources = [
            // Bot and crawler specific lists
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/php_commenters.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/php_dictionary.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/php_harvesters.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/php_spammers.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/stopforumspam.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/stopforumspam_180d.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/stopforumspam_1d.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/stopforumspam_30d.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/stopforumspam_7d.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/stopforumspam_90d.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/stopforumspam_toxic.ipset',
            // Botnet and malicious bot lists
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/malwaredomainlist.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/sblam.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/sorbs_web.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/sorbs_zombie.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/sslbl.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/sslbl_aggressive.ipset',
            // Aggressive crawler and scraper lists
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/cruzit_web_attacks.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/dshield_top_1000.ipset',
            'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/talosintel_ipfilter.ipset'
        ];
    }
    static async getInstance() {
        if (!ThreatFeedService.instance) {
            ThreatFeedService.instance = new ThreatFeedService();
        }
        return ThreatFeedService.instance;
    }
    async fetchIPsFromSource(url) {
        try {
            console.log(`Fetching bot IPs from source: ${url}`);
            const response = await axios_1.default.get(url, { timeout: 10000 });
            const content = response.data;
            const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
            const matches = content.match(ipRegex) || [];
            const validIPs = new Set();
            for (const ip of matches) {
                const parts = ip.split('.');
                if (parts.length === 4 && parts.every((part) => {
                    const num = parseInt(part);
                    return num >= 0 && num <= 255;
                })) {
                    validIPs.add(ip);
                }
            }
            console.log(`Source ${url}: Found ${validIPs.size} valid unique bot IPs`);
            return validIPs;
        }
        catch (error) {
            if (error.response) {
                console.error(`Error fetching bot IPs from ${url}: HTTP ${error.response.status} - ${error.response.statusText}`);
            }
            else if (error.code === 'ECONNABORTED') {
                console.error(`Error fetching bot IPs from ${url}: Request timed out`);
            }
            else if (error.code === 'ERR_BAD_REQUEST') {
                console.error(`Error fetching bot IPs from ${url}: Bad request`);
            }
            else {
                console.error(`Error fetching bot IPs from ${url}:`, error.message || error);
            }
            return new Set();
        }
    }
    async updateThreatFeeds() {
        try {
            // Use a timestamp collection to check last update
            const mongoService = await mongodb_1.MongoDBService.getInstance();
            const metaCollection = mongoService.getCollection('threat_feed_meta');
            const ipCollection = mongoService.getCollection('threat_feed_ips');
            const meta = await metaCollection.findOne({ _id: 'meta' });
            const now = Date.now();
            if (meta && meta.lastUpdated && (now - new Date(meta.lastUpdated).getTime()) < this.updateThreshold) {
                console.log('Threat feed list is up to date, skipping update');
                return;
            }
            console.log('Starting threat feed update...');
            const startTime = Date.now();
            let allIPs = new Set();
            let failedSources = 0;
            let successfulSources = 0;
            const concurrencyLimit = 10;
            const chunks = [];
            for (let i = 0; i < this.threatFeedSources.length; i += concurrencyLimit) {
                chunks.push(this.threatFeedSources.slice(i, i + concurrencyLimit));
            }
            for (const chunk of chunks) {
                const results = await Promise.allSettled(chunk.map(source => this.fetchIPsFromSource(source)));
                results.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        result.value.forEach(ip => allIPs.add(ip));
                        successfulSources++;
                    }
                    else {
                        console.error(`Failed to fetch from ${chunk[index]}:`, result.reason);
                        failedSources++;
                    }
                });
                if (chunks.indexOf(chunk) < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            console.log('\nThreat Feed Update Summary:');
            console.log(`- Total sources processed: ${this.threatFeedSources.length}`);
            console.log(`- Successful sources: ${successfulSources}`);
            console.log(`- Failed sources: ${failedSources}`);
            console.log(`- Total unique IPs: ${allIPs.size}`);
            // Remove old IPs
            await ipCollection.deleteMany({});
            // Insert new IPs
            if (allIPs.size > 0) {
                await ipCollection.insertMany(Array.from(allIPs).map(ip => ({ ip })));
            }
            await ipCollection.createIndex({ ip: 1 }, { unique: true });
            // Update meta
            await metaCollection.updateOne({ _id: 'meta' }, { $set: { lastUpdated: new Date().toISOString(), totalIPs: allIPs.size, sources: this.threatFeedSources } }, { upsert: true });
            console.log('✓ Successfully updated threat feed list in MongoDB');
            const endTime = Date.now();
            console.log(`\nUpdate completed in ${(endTime - startTime) / 1000} seconds`);
        }
        catch (error) {
            console.error('Error updating threat feeds:', error);
            throw error;
        }
    }
    async isIPInThreatFeed(ip) {
        const mongoService = await mongodb_1.MongoDBService.getInstance();
        const ipCollection = mongoService.getCollection('threat_feed_ips');
        const exists = await ipCollection.findOne({ ip });
        return !!exists;
    }
    startPeriodicUpdates(intervalHours = 6) {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.updateThreatFeeds();
        this.updateInterval = setInterval(() => {
            this.updateThreatFeeds();
        }, intervalHours * 60 * 60 * 1000);
    }
    stopPeriodicUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}
exports.ThreatFeedService = ThreatFeedService;
