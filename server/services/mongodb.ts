import { MongoClient, Db, Collection, Document } from 'mongodb';
import { PrismaClient } from '@prisma/client';
import { Session } from '@shopify/shopify-api';

interface BotActivityQuery {
  startDate?: Date;
  endDate?: Date;
  severity?: string;
}

export class MongoDBService {
  private static instance: MongoDBService;
  private client: MongoClient;
  private db!: Db;
  private prisma: PrismaClient;

  private constructor() {
    console.log('Initializing MongoDB client...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    this.client = new MongoClient(process.env.MONGODB_URI!);
    this.prisma = new PrismaClient();
  }

  public static async getInstance(): Promise<MongoDBService> {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService();
      await MongoDBService.instance.connect();
    }
    return MongoDBService.instance;
  }

  private async connect() {
    try {
      console.log('Connecting to MongoDB...');
      await this.client.connect();
      this.db = this.client.db();
      console.log('Connected to MongoDB successfully');
      console.log('Database name:', this.db.databaseName);
      
      // List all collections
      const collections = await this.db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  public async isConnected(): Promise<boolean> {
    return !!this.client && !!this.client.topology && this.client.topology.isConnected();
  }

  public getCollection<T extends Document>(collectionName: string): Collection<T> {
    return this.db.collection<T>(collectionName);
  }

  public getPrisma(): PrismaClient {
    return this.prisma;
  }

  public async logBotActivity(data: {
    ip: string;
    userAgent: string;
    path: string;
    severity: string;
    session?: Session;
    metadata?: any;
  }) {
    const shop = data.session?.shop || 'test-shop';
    console.log('Logging bot activity for shop:', shop);
    
    // Use native MongoDB for bot activity
    const collection = this.getCollection<Document>('bot_activities');
    const result = await collection.insertOne({
      ip: data.ip,
      userAgent: data.userAgent,
      path: data.path,
      severity: data.severity,
      shop: shop,
      timestamp: new Date(),
      metadata: data.metadata
    } as Document);
    
    console.log('Bot activity logged successfully:', result);
    return result;
  }

  public async getBotActivityStats(session?: Session) {
    const shop = session?.shop || 'test-shop';
    
    // Get stats from MongoDB
    const collection = this.getCollection<Document>('bot_activities');
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
    const blockedCollection = this.getCollection<Document>('blocked_ips');
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

  public async getBotActivities(session: Session, query: BotActivityQuery) {
    const shop = session.shop;
    const collection = this.getCollection<Document>('bot_activities');
    
    const filter: any = { shop };
    
    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) filter.timestamp.$gte = query.startDate;
      if (query.endDate) filter.timestamp.$lte = query.endDate;
    }

    if (query.severity) {
      filter.severity = query.severity;
    }

    return await collection.find(filter)
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
  }

  public async getRecentAttacks(session: Session, limit: number = 10) {
    const shop = session.shop;
    const collection = this.getCollection<Document>('bot_activities');
    
    return await collection.find({
      shop,
      severity: 'high'
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  }

  public async getStoreAlerts(session: Session) {
    const shop = session.shop;
    const collection = this.getCollection<Document>('security_alerts');
    
    return await collection.find({
      shop,
      resolved: false
    })
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray();
  }

  public async disconnect() {
    await this.client.close();
    await this.prisma.$disconnect();
  }
} 