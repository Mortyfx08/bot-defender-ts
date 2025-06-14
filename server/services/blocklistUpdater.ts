import axios from 'axios';
import { RedisService } from './redis';
import { MongoDBService } from './mongodb';
import { ThreatFeedService } from './threatFeedService';

const THREAT_FEEDS = [
  'https://lists.blocklist.de/lists/all.txt',
  'https://www.binarydefense.com/banlist.txt',
  'https://rules.emergingthreats.net/blockrules/compromised-ips.txt'
];

function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export class BlocklistUpdater {
  private static instance: BlocklistUpdater;
  private isUpdating: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private isPaused: boolean = false;

  private constructor() {
    // Start daily updates (every 24 hours)
    this.startDailyUpdates();
  }

  public static getInstance(): BlocklistUpdater {
    if (!BlocklistUpdater.instance) {
      BlocklistUpdater.instance = new BlocklistUpdater();
    }
    return BlocklistUpdater.instance;
  }

  private startDailyUpdates(): void {
    // Run immediately on startup
    this.updateBlocklist();

    // Then run every 24 hours
    this.updateInterval = setInterval(() => {
      if (!this.isPaused) {
        this.updateBlocklist();
      }
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
  }

  public async updateBlocklist(): Promise<void> {
    if (this.isUpdating || this.isPaused) {
      console.log('Blocklist update skipped - already updating or paused');
      return;
    }

    try {
      this.isUpdating = true;
      console.log('Starting blocklist update...');
      
      const badIPs = new Set<string>();
      
      for (const url of THREAT_FEEDS) {
        try {
          console.log(`Fetching from ${url}...`);
          const { data } = await axios.get(url);
          data.split('\n').forEach((ip: string) => {
            if (isValidIP(ip)) badIPs.add(ip.trim());
          });
        } catch (error) {
          console.error(`Error fetching from ${url}:`, error);
        }
      }

      console.log(`Found ${badIPs.size} bad IPs`);

      // Get services
      const redisService = await RedisService.getInstance();
      const threatFeedService = await ThreatFeedService.getInstance();
      
      // Update threat feed list
      await threatFeedService.updateThreatFeeds();
      console.log(`Updated threat feed list with ${badIPs.size} IPs`);

      // Update MongoDB only for actual blocked attempts
      const mongoService = await MongoDBService.getInstance();
      
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
    } catch (error) {
      console.error('Error updating blocklist:', error);
      
      // Log the error in MongoDB
      const mongoService = await MongoDBService.getInstance();
      await mongoService.getCollection('threat_feed_updates').insertOne({
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          type: 'threat_feed_update',
          status: 'error'
        }
      });
    } finally {
      this.isUpdating = false;
    }
  }

  public pauseUpdates(): void {
    this.isPaused = true;
    console.log('Blocklist updates paused');
  }

  public resumeUpdates(): void {
    this.isPaused = false;
    console.log('Blocklist updates resumed');
  }

  public stopUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
} 