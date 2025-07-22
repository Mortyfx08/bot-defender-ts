import { createClient, RedisClientType, RedisModules, RedisFunctions, RedisScripts } from 'redis';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import { ThreatFeedService } from './threatFeedService';

// Initialize Redis client with enhanced configuration
const redisClient = createClient({
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
  } catch (error) {
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
    } catch (err) {
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

interface BlockOptions {
  duration: number; // Duration in seconds
  reason?: string;
}

export class RedisService {
  private static instance: RedisService;
  private client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
  private _isConnected: boolean = false;
  private threatFeedService!: ThreatFeedService;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL
    });

    // Handle Redis events
    this.client.on('error', (err) => console.error('Redis Client Error:', err));
    this.client.on('connect', () => {
      console.log('Redis client connected');
      this._isConnected = true;
    });
    this.client.on('ready', () => console.log('Redis client ready'));
    this.client.on('end', () => {
      console.log('Redis client disconnected');
      this._isConnected = false;
    });
  }

  public static async getInstance(): Promise<RedisService> {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
      await RedisService.instance.connect();
      RedisService.instance.threatFeedService = await ThreatFeedService.getInstance();
    }
    return RedisService.instance;
  }

  private async connect() {
    try {
      await this.client.connect();
      console.log('Connected to Redis');
    } catch (error) {
      console.error('Redis connection error:', error);
      throw error;
    }
  }

  public isConnected(): boolean {
    return this._isConnected;
  }

  public async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, value, { EX: ttl });
    } else {
      await this.client.set(key, value);
    }
  }

  public async del(...keys: string[]): Promise<number> {
    return this.client.del(keys);
  }

  public async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  public async cleanupOldData(): Promise<void> {
    try {
      // Get all blocked IP keys
      const keys = await this.client.keys('blocked:*');
      
      // Sort keys by last access time
      const keyStats = await Promise.all(
        keys.map(async (key) => {
          const idleTime = await this.client.object('idletime', key);
          return { key, idleTime: Number(idleTime) || 0 };
        })
      );
      
      // Sort by idle time (most idle first)
      keyStats.sort((a, b) => (b.idleTime || 0) - (a.idleTime || 0));
      
      // Remove 80% of the most idle blocked IPs to free up more space
      const keysToRemove = keyStats.slice(0, Math.ceil(keyStats.length * 0.8));
      
      if (keysToRemove.length > 0) {
        console.log(`Cleaning up ${keysToRemove.length} idle blocked IPs...`);
        await this.client.del(keysToRemove.map(k => k.key));
      }
      
      console.log('Cleanup of blocked IPs completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  public async checkMemoryStatus(): Promise<{ used: number; max: number; percentage: number }> {
    try {
      const info = await this.client.info('memory');
      const usedMemory = parseInt(info.match(/used_memory:(\d+)/)?.[1] || '0');
      const maxMemory = parseInt(info.match(/maxmemory:(\d+)/)?.[1] || '0');
      
      return {
        used: usedMemory,
        max: maxMemory,
        percentage: (usedMemory / maxMemory) * 100
      };
    } catch (error) {
      console.error('Error checking memory status:', error);
      return { used: 0, max: 0, percentage: 0 };
    }
  }

  public async blockIP(ip: string, options: BlockOptions): Promise<boolean> {
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
    } catch (error) {
      console.error('Error blocking IP:', error);
      return false;
    }
  }

  public async cleanupExpiredBlocks(): Promise<void> {
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
    } catch (error) {
      console.error('Error cleaning up expired blocks:', error);
    }
  }

  public async isBlocked(ip: string): Promise<boolean> {
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
    } catch (error) {
      console.error('Error checking blocked IP:', error);
      return false;
    }
  }

  public async getBlockedIPs(): Promise<Array<{ ip: string; reason: string; expiresAt: Date }>> {
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
    } catch (error) {
      console.error('Error getting blocked IPs:', error);
      return [];
    }
  }

  public async getBlockReason(ip: string): Promise<string | null> {
    try {
      const key = `blocked:${ip}`;
      const data = await this.client.get(key);
      if (data) {
        const { reason } = JSON.parse(data);
        return reason;
      }
      return null;
    } catch (error) {
      console.error('Error getting block reason:', error);
      return null;
    }
  }

  public async logAttack(ip: string, userAgent: string, path: string): Promise<void> {
    try {
      const key = `attack:${ip}`;
      const data = {
        ip,
        userAgent,
        path,
        timestamp: Date.now()
      };
      await this.client.set(key, JSON.stringify(data), { EX: 86400 }); // Store for 24 hours
    } catch (error) {
      console.error('Error logging attack:', error);
    }
  }

  public async disconnect() {
    await this.client.quit();
  }

  public async getStoreBlockedIPs(shop: string): Promise<Array<{ ip: string; reason: string; expiresAt: Date }>> {
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
    } catch (error) {
      console.error('Error getting store blocked IPs:', error);
      return [];
    }
  }

  public async blockStoreIP(shop: string, ip: string, options: BlockOptions = { duration: 3600 }): Promise<boolean> {
    try {
      const { duration, reason = 'Bot activity detected' } = options;
      const key = `blocked:${shop}:${ip}`;
      await this.client.set(key, JSON.stringify({ reason, timestamp: Date.now() }), { EX: duration });
      return true;
    } catch (error) {
      console.error('Error blocking store IP:', error);
      return false;
    }
  }

  public async isStoreIPBlocked(shop: string, ip: string): Promise<boolean> {
    try {
      const key = `blocked:${shop}:${ip}`;
      const result = await this.client.get(key);
      return result !== null;
    } catch (error) {
      console.error('Error checking store blocked IP:', error);
      return false;
    }
  }

  public async getStoreBlockReason(shop: string, ip: string): Promise<string | null> {
    try {
      const key = `blocked:${shop}:${ip}`;
      const data = await this.client.get(key);
      if (data) {
        const { reason } = JSON.parse(data);
        return reason;
      }
      return null;
    } catch (error) {
      console.error('Error getting store block reason:', error);
      return null;
    }
  }

  public async getTTL(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('Error getting TTL:', error);
      return -1;
    }
  }

  public async clearAllBlockedIPs(): Promise<void> {
    try {
      const keys = await this.client.keys('blocked:*');
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log('Cleared all blocked IPs');
      }
    } catch (error) {
      console.error('Error clearing blocked IPs:', error);
    }
  }

  public async cleanupRedis(): Promise<void> {
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
    } catch (error) {
      console.error('Error cleaning up Redis:', error);
      throw error;
    }
  }

  public async trackRequestRate(ip: string): Promise<number> {
    try {
      const key = `requests:${ip}`;
      const requests = await this.client.incr(key);
      
      if (requests === 1) {
        await this.client.expire(key, 60); // 1 minute window
      }

      return requests;
    } catch (error) {
      console.error('Error tracking request rate:', error);
      return 0;
    }
  }
}

// Shopify integration example
export async function blockShopifyBot(session: any, ip: string) {
  if (!ip) {
    console.warn('Attempted to block Shopify bot with undefined IP address');
    return;
  }

  const shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY!,
    apiSecretKey: process.env.SHOPIFY_API_SECRET!,
    hostName: process.env.HOST!,
    apiVersion: ApiVersion.January24,
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