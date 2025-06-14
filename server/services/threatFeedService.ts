import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

interface ThreatFeedData {
  lastUpdated: string;
  totalIPs: number;
  sources: string[];
  ips: Set<string>;
}

export class ThreatFeedService {
  private static instance: ThreatFeedService;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly threatFeedPath = path.join(__dirname, '../data/threatFeedList.json');
  private readonly updateThreshold = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

  private readonly threatFeedSources = [
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

  private constructor() {}

  public static async getInstance(): Promise<ThreatFeedService> {
    if (!ThreatFeedService.instance) {
      ThreatFeedService.instance = new ThreatFeedService();
    }
    return ThreatFeedService.instance;
  }

  private async fetchIPsFromSource(url: string): Promise<Set<string>> {
    try {
      console.log(`Fetching bot IPs from source: ${url}`);
      const response = await axios.get(url, { timeout: 5000 }); // 5 second timeout
      const content = response.data;
      
      // Extract IPs using a more efficient regex
      const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
      const matches = content.match(ipRegex) || [];
      
      // Validate IPs and add to Set for automatic deduplication
      const validIPs = new Set<string>();
      for (const ip of matches) {
        const parts = ip.split('.');
        if (parts.length === 4 && parts.every((part: string) => {
          const num = parseInt(part);
          return num >= 0 && num <= 255;
        })) {
          validIPs.add(ip);
        }
      }

      console.log(`Source ${url}: Found ${validIPs.size} valid unique bot IPs`);
      return validIPs;
    } catch (error) {
      console.error(`Error fetching bot IPs from ${url}:`, error);
      return new Set();
    }
  }

  private async readThreatFeedFile(): Promise<ThreatFeedData> {
    try {
      const data = await fs.readFile(this.threatFeedPath, 'utf-8');
      const parsed = JSON.parse(data);
      // Convert array back to Set
      return {
        ...parsed,
        ips: new Set(parsed.ips)
      };
    } catch (error) {
      // If file doesn't exist or is invalid, return empty structure
      return {
        lastUpdated: '',
        totalIPs: 0,
        sources: [],
        ips: new Set()
      };
    }
  }

  private async writeThreatFeedFile(data: ThreatFeedData): Promise<void> {
    // Convert Set to array for JSON serialization
    const serializableData = {
      ...data,
      ips: Array.from(data.ips)
    };
    await fs.writeFile(this.threatFeedPath, JSON.stringify(serializableData, null, 2));
  }

  public async updateThreatFeeds(): Promise<void> {
    try {
      // Check if we need to update
      const currentData = await this.readThreatFeedFile();
      const lastUpdate = new Date(currentData.lastUpdated).getTime();
      const now = Date.now();

      if (currentData.lastUpdated && (now - lastUpdate) < this.updateThreshold) {
        console.log('Threat feed list is up to date, skipping update');
        return;
      }

      console.log('Starting threat feed update...');
      const startTime = Date.now();
      let allIPs: Set<string> = new Set(currentData.ips); // Start with existing IPs
      let failedSources = 0;
      let successfulSources = 0;

      // Process sources in parallel with increased concurrency
      const concurrencyLimit = 10; // Increased concurrency
      const chunks = [];
      for (let i = 0; i < this.threatFeedSources.length; i += concurrencyLimit) {
        chunks.push(this.threatFeedSources.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        const results = await Promise.allSettled(
          chunk.map(source => this.fetchIPsFromSource(source))
        );

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            // Merge new IPs with existing ones
            result.value.forEach(ip => allIPs.add(ip));
            successfulSources++;
          } else {
            console.error(`Failed to fetch from ${chunk[index]}:`, result.reason);
            failedSources++;
          }
        });

        // Minimal delay between chunks
        if (chunks.indexOf(chunk) < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log('\nThreat Feed Update Summary:');
      console.log(`- Total sources processed: ${this.threatFeedSources.length}`);
      console.log(`- Successful sources: ${successfulSources}`);
      console.log(`- Failed sources: ${failedSources}`);
      console.log(`- Total unique IPs: ${allIPs.size}`);

      // Update the JSON file
      const threatFeedData: ThreatFeedData = {
        lastUpdated: new Date().toISOString(),
        totalIPs: allIPs.size,
        sources: this.threatFeedSources,
        ips: allIPs
      };

      await this.writeThreatFeedFile(threatFeedData);
      console.log('✓ Successfully updated threat feed list');

      const endTime = Date.now();
      console.log(`\nUpdate completed in ${(endTime - startTime) / 1000} seconds`);

    } catch (error) {
      console.error('Error updating threat feeds:', error);
      throw error;
    }
  }

  public async getThreatFeedIPs(): Promise<string[]> {
    const data = await this.readThreatFeedFile();
    return Array.from(data.ips);
  }

  public async isIPInThreatFeed(ip: string): Promise<boolean> {
    const data = await this.readThreatFeedFile();
    return data.ips.has(ip);
  }

  public startPeriodicUpdates(intervalHours: number = 6): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Initial update
    this.updateThreatFeeds();

    // Set up periodic updates
    this.updateInterval = setInterval(() => {
      this.updateThreatFeeds();
    }, intervalHours * 60 * 60 * 1000);
  }

  public stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
} 