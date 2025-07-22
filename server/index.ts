console.log("🚀 Starting server...");
import 'dotenv/config';
import '@shopify/shopify-api/adapters/node';
import express, { Request, Response, NextFunction } from 'express';
import { shopifyApi, ApiVersion, LATEST_API_VERSION } from '@shopify/shopify-api';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { json } from 'body-parser';
import { verifyRequest } from './middleware/verifyRequest';
import botProtectionMiddleware from './middleware/botProtectionMiddleware';
import botStatsRouter from './routes/botStats';
import dashboardRouter from './routes/dashboard';
import { RedisService } from './services/redis';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { initializeDatabase } from './db/init';
import { MongoDBService } from './services/mongodb';
import { botDetectionMiddleware } from './middleware/botDetection';
import { BlocklistUpdater } from './services/blocklistUpdater';
import { ThreatFeedService } from './services/threatFeedService';
import apiRoutes from './routes/api';
import path from 'path';
import authRoutes from './routes/auth';

// Environment variable validation
const requiredEnvVars = [
  'HOST',
  'SHOPIFY_API_KEY',
  'SHOPIFY_API_SECRET',
  'MONGODB_URI',
  'REDIS_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please set these variables in your Railway dashboard:');
  missingEnvVars.forEach(envVar => {
    console.error(`  - ${envVar}`);
  });
  
  // Don't exit immediately, let the app start with a warning
  console.warn('⚠️  App will start with limited functionality due to missing environment variables');
}

// Initialize Shopify API with fallback values
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || 'placeholder-key',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || 'placeholder-secret',
  scopes: process.env.SCOPES?.split(',') || ['read_products'],
  hostName: process.env.HOST?.replace(/https?:\/\//, '') || 'localhost',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
});

const app = express();

// Middleware
app.use(express.json());

// CORS configuration for development
if (process.env.NODE_ENV === 'development') {
  app.use(cors({
    origin: process.env.SHOPIFY_APP_URL,
    credentials: true
  }));
}

// Add this BEFORE any middleware
// Dashboard endpoint
app.get('/api/dashboard', async (req: Request, res: Response) => {
  try {
    const shop = req.query.shop as string;
    if (!shop) {
      return res.status(400).json({ error: 'Shop parameter is required' });
    }

    const mongoService = await MongoDBService.getInstance();

    // Get security alerts
    const securityAlerts = await mongoService.getCollection('security_alerts')
      .find({ 
        shop: shop,
        resolved: false
      })
      .sort({ timestamp: -1 })
      .toArray();

    // Get bot activities
    const botActivities = await mongoService.getCollection('bot_activities')
      .find({ shop: shop })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    // Get blocked IPs
    const blockedIPs = await mongoService.getCollection('blocked_ips')
      .find({ shop: shop })
      .sort({ blockedAt: -1 })
      .toArray();

    res.json({
      status: 'success',
      data: {
        shop: shop,
        securityAlerts,
        botActivities,
        blockedIPs,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Then add the authentication middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // Allow access to test endpoints without authentication
  if (req.path.startsWith('/test/')) {
    return next();
  }
  // Allow all API endpoints with a shop query param
  if (req.path.startsWith('/api/') && req.query.shop) {
    return next();
  }
  // For other API endpoints, allow them to pass through (they'll be handled by individual route middleware)
  if (req.path.startsWith('/api/')) {
    return next();
  }
  next();
});

// Health check route for Railway/Shopify
app.get('/health', async (req, res) => {
  try {
    // Check critical connections
    const mongoService = await MongoDBService.getInstance();
    const redisService = await RedisService.getInstance();
    
    // Check if services are connected
    const isMongoConnected = await mongoService.isConnected();
    const isRedisConnected = await redisService.isConnected();
    
    if (isMongoConnected && isRedisConnected) {
      res.status(200).json({
        status: 'ok',
        mongoDB: 'connected',
        redis: 'connected'
      });
    } else {
      res.status(503).json({
        status: 'error',
        mongoDB: isMongoConnected ? 'connected' : 'disconnected',
        redis: isRedisConnected ? 'connected' : 'disconnected'
      });
    }
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Root route handler
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'Bot Defender API is running',
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });
}

// Test route
app.get('/test', (req: Request, res: Response) => {
  res.json({
    message: 'Test endpoint working',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      HOST: process.env.HOST,
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Missing',
      REDIS_URL: process.env.REDIS_URL ? 'Set' : 'Missing',
      SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ? 'Set' : 'Missing'
    }
  });
});

// Test endpoints
app.get('/test/redis', async (req: Request, res: Response) => {
  try {
    const redisService = await RedisService.getInstance();
    const testKey = 'test:connection';
    const testValue = Date.now().toString();
    
    // Test Redis SET
    await redisService.set(testKey, testValue, 60);
    
    // Test Redis GET
    const retrievedValue = await redisService.get(testKey);
    
    // Test Redis DEL
    await redisService.del(testKey);
    
    res.json({
      status: 'success',
      message: 'Redis connection test successful',
      test: {
        set: true,
        get: retrievedValue === testValue,
        del: true
      }
    });
  } catch (error) {
    console.error('Redis test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Redis connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/test/mongodb', async (req: Request, res: Response) => {
  try {
    const mongoService = await MongoDBService.getInstance();
    const testCollection = mongoService.getCollection('test_collection');
    
    // Test MongoDB insert
    const testDoc = {
      test: true,
      timestamp: new Date(),
      random: Math.random()
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    
    // Test MongoDB find
    const findResult = await testCollection.findOne({ _id: insertResult.insertedId });
    
    // Test MongoDB delete
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    
    res.json({
      status: 'success',
      message: 'MongoDB connection test successful',
      test: {
        insert: true,
        find: findResult !== null,
        delete: true
      }
    });
  } catch (error) {
    console.error('MongoDB test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'MongoDB connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/test/bot-activity', async (req: Request, res: Response) => {
  try {
    const mongoService = await MongoDBService.getInstance();
    
    // Test bot activity logging
    await mongoService.logBotActivity({
      ip: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'test-agent',
      path: '/test/bot-activity',
      severity: 'low',
      metadata: {
        test: true,
        timestamp: new Date()
      }
    });
    
    // Get bot activity stats
    const stats = await mongoService.getBotActivityStats();
    
    res.json({
      status: 'success',
      message: 'Bot activity test successful',
      stats
    });
  } catch (error) {
    console.error('Bot activity test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Bot activity test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bot Defender Test Endpoint
app.get('/test/bot-defender', async (req: Request, res: Response) => {
  try {
    const redisService = await RedisService.getInstance();
    const mongoService = await MongoDBService.getInstance();
    const testIP = req.ip || '127.0.0.1';
    const testResults = {
      ip: testIP,
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    };

    // Test 1: Basic Bot Activity Logging
    try {
      await mongoService.logBotActivity({
        ip: testIP,
        userAgent: 'Test Bot/1.0',
        path: '/test/bot-defender',
        severity: 'low',
        metadata: { test: 'basic_logging' }
      });
      testResults.tests.push({
        name: 'Basic Bot Activity Logging',
        status: 'success',
        message: 'Successfully logged bot activity'
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Basic Bot Activity Logging',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: IP Blocking
    try {
      const blockResult = await redisService.blockIP(testIP, {
        duration: 60, // 1 minute block for testing
        reason: 'Test block'
      });
      testResults.tests.push({
        name: 'IP Blocking',
        status: blockResult ? 'success' : 'error',
        message: blockResult ? 'Successfully blocked IP' : 'Failed to block IP'
      });
    } catch (error) {
      testResults.tests.push({
        name: 'IP Blocking',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Check Block Status
    try {
      const isBlocked = await redisService.isBlocked(testIP);
      const blockReason = await redisService.getBlockReason(testIP);
      testResults.tests.push({
        name: 'Block Status Check',
        status: 'success',
        message: `IP is ${isBlocked ? 'blocked' : 'not blocked'}`,
        details: {
          isBlocked,
          reason: blockReason
        }
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Block Status Check',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Attack Logging
    try {
      await redisService.logAttack(testIP, 'Test Bot/1.0', '/test/bot-defender');
      testResults.tests.push({
        name: 'Attack Logging',
        status: 'success',
        message: 'Successfully logged attack'
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Attack Logging',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 5: Get Bot Activity Stats
    try {
      const stats = await mongoService.getBotActivityStats();
      testResults.tests.push({
        name: 'Bot Activity Stats',
        status: 'success',
        message: 'Successfully retrieved bot activity stats',
        details: stats
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Bot Activity Stats',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Clean up test data after 1 minute
    setTimeout(async () => {
      try {
        await redisService.del(`blocked:${testIP}`);
        console.log(`Cleaned up test data for IP: ${testIP}`);
      } catch (error) {
        console.error('Error cleaning up test data:', error);
      }
    }, 60000);

    res.json(testResults);
  } catch (error) {
    console.error('Bot defender test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Bot defender test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add test storefront endpoint
app.get('/test/storefront', async (req: Request, res: Response) => {
  try {
    const mongoService = await MongoDBService.getInstance();
    const redisService = await RedisService.getInstance();

    // Generate random shop data
    const shopId = Math.floor(Math.random() * 1000);
    const shop = `test-shop-${shopId}.myshopify.com`;
    const shopName = `Test Store ${shopId}`;
    
    // Get the IP and user agent from the request
    const ip = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const referer = req.headers.referer || 'https://www.google.com';
    const path = req.path;

    // Simulate store data
    const storeData = {
      shop,
      shopName,
      theme: {
        name: 'Dawn',
        version: '1.0.0'
      },
      products: [
        { id: 1, title: 'Test Product 1', price: 29.99 },
        { id: 2, title: 'Test Product 2', price: 39.99 }
      ],
      collections: [
        { id: 1, title: 'Featured Collection' },
        { id: 2, title: 'New Arrivals' }
      ]
    };

    // Check if this is a suspicious bot or in threat feed
    const isSuspicious = userAgent.toLowerCase().includes('bot') || 
                        userAgent.toLowerCase().includes('crawler') ||
                        userAgent.toLowerCase().includes('spider');

    // Check if IP is blocked (including threat feed)
    const isBlocked = await redisService.isBlocked(ip.toString());
    const blockReason = await redisService.getBlockReason(ip.toString());

    if (isSuspicious || isBlocked) {
      console.log(`${isBlocked ? 'Threat feed IP' : 'Suspicious bot'} detected on ${shop}!`);
      
      // 1. Log bot activity with shop context
      await mongoService.logBotActivity({
        ip: ip.toString(),
        userAgent: userAgent.toString(),
        path,
        severity: 'high',
        session: { shop } as any,
        metadata: {
          headers: req.headers,
          reason: isBlocked ? (blockReason || 'IP found in threat feed') : 'Suspicious bot activity detected on storefront',
          referer,
          shopName,
          type: isBlocked ? 'threat_feed' : 'suspicious_bot'
        }
      });

      // 2. Block the IP in both Redis and MongoDB
      // First in Redis for temporary blocking
      await redisService.blockStoreIP(shop, ip.toString(), {
        duration: 3600, // 1 hour
        reason: isBlocked ? (blockReason || 'IP found in threat feed') : 'Suspicious bot activity detected on storefront'
      });

      // Then in MongoDB for permanent record
      const blockedIPsCollection = mongoService.getCollection('blocked_ips');
      await blockedIPsCollection.insertOne({
        ip: ip.toString(),
        shop,
        shopName,
        reason: isBlocked ? (blockReason || 'IP found in threat feed') : 'Suspicious bot activity detected on storefront',
        blockedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        metadata: {
          userAgent: userAgent.toString(),
          path,
          referer,
          headers: req.headers,
          type: isBlocked ? 'threat_feed' : 'suspicious_bot'
        }
      });

      // 3. Create security alert
      const alertsCollection = mongoService.getCollection('security_alerts');
      await alertsCollection.insertOne({
        shop,
        shopName,
        type: isBlocked ? 'threat_feed_ip' : 'suspicious_bot',
        severity: 'high',
        message: isBlocked ? (blockReason || 'IP found in threat feed') : 'Suspicious bot activity detected on storefront',
        details: {
          ip: ip.toString(),
          userAgent: userAgent.toString(),
          path,
          referer,
          timestamp: new Date()
        },
        timestamp: new Date(),
        resolved: false
      });

      // Return a warning page
      res.send(`
        <html>
          <head>
            <title>Access Denied - ${shopName}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .warning { color: red; font-size: 24px; }
              .shop-name { color: #666; font-size: 18px; }
            </style>
          </head>
          <body>
            <div class="warning">⚠️ Access Denied</div>
            <p class="shop-name">${shopName}</p>
            <p>Suspicious bot activity detected. Your IP has been blocked.</p>
          </body>
        </html>
      `);
    } else {
      // Normal visitor - show welcome page with store data
      res.send(`
        <html>
          <head>
            <title>${shopName}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
              .header { text-align: center; padding: 20px; }
              .shop-name { color: #333; font-size: 24px; }
              .products { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; padding: 20px; }
              .product { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
              .collections { display: flex; gap: 20px; padding: 20px; }
              .collection { background: #f5f5f5; padding: 10px 20px; border-radius: 4px; }
              .debug { margin-top: 20px; padding: 20px; background: #f9f9f9; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="shop-name">${shopName}</h1>
              <p>Welcome to our test store</p>
            </div>
            
            <div class="collections">
              ${storeData.collections.map(c => `
                <div class="collection">${c.title}</div>
              `).join('')}
            </div>

            <div class="products">
              ${storeData.products.map(p => `
                <div class="product">
                  <h3>${p.title}</h3>
                  <p>$${p.price}</p>
                </div>
              `).join('')}
            </div>

            <div class="debug">
              <h3>Debug Information:</h3>
              <p>Shop: ${shop}</p>
              <p>Theme: ${storeData.theme.name} v${storeData.theme.version}</p>
              <p>Your IP: ${ip}</p>
              <p>User Agent: ${userAgent}</p>
              <p>Referer: ${referer}</p>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error in test storefront:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Add a test endpoint to view bot activities
app.get('/test/view-bot-activities', async (req: Request, res: Response) => {
  try {
    const mongoService = await MongoDBService.getInstance();
    const collection = mongoService.getCollection('bot_activities');
    
    // Get all bot activities
    const activities = await collection.find({}).toArray();
    
    res.json({
      status: 'success',
      count: activities.length,
      activities: activities
    });
  } catch (error) {
    console.error('Error viewing bot activities:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to view bot activities',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add Redis cleanup endpoint
app.get('/test/cleanup-redis', async (req: Request, res: Response) => {
  try {
    // Pause blocklist updates
    const blocklistUpdater = BlocklistUpdater.getInstance();
    blocklistUpdater.pauseUpdates();

    // Clean up Redis
    const redisService = await RedisService.getInstance();
    await redisService.cleanupExpiredBlocks();
    
    // Resume blocklist updates after 5 minutes
    setTimeout(() => {
      blocklistUpdater.resumeUpdates();
    }, 5 * 60 * 1000); // 5 minutes

    res.json({
      status: 'success',
      message: 'Redis cleanup completed successfully. Blocklist updates paused for 5 minutes.'
    });
  } catch (error) {
    console.error('Redis cleanup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clean up Redis',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Apply bot detection middleware for all routes
app.use(botDetectionMiddleware);

// API routes
app.use('/api', botProtectionMiddleware);

// Mount API routes
app.use('/api', apiRoutes);
app.use('/api', dashboardRouter);
app.use('/api', botStatsRouter);
app.use(authRoutes);

// IP Blocking Middleware
app.use(async (req: Request, res: Response, next: Function) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || '';
    if (!ip) {
      console.warn('No IP address found in request');
      return next();
    }

    const redisService = await RedisService.getInstance();
    const isBlocked = await redisService.isBlocked(ip);
    
    if (isBlocked) {
      const reason = await redisService.getBlockReason(ip);
      console.log(`Blocked request from IP ${ip}: ${reason}`);
      return res.status(429).json({
        error: 'IP blocked',
        reason: reason || 'Bot activity detected'
      });
    }
    next();
  } catch (error) {
    console.error('Error in IP blocking middleware:', error);
    next(); // Continue even if Redis check fails
  }
});

// Create Apollo Server instance
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    return {
      message: error.message,
      path: error.path,
    };
  },
});

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, 'web', 'build');
  app.use(express.static(frontendBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

export { app };

// Start Apollo Server and Express app
async function startServer() {
  try {
    // Initialize database first (with error handling)
    console.log('Initializing database...');
    try {
      await initializeDatabase();
      console.log('Database initialized successfully');
    } catch (dbError) {
      console.error('⚠️  Database initialization failed:', dbError);
      console.log('🔄 Continuing without database functionality...');
    }

    // Initialize threat feed service (with error handling)
    console.log('Initializing threat feed service...');
    try {
      const threatFeedService = await ThreatFeedService.getInstance();
      await threatFeedService.updateThreatFeeds();
      console.log('Threat feed service initialized successfully');
    } catch (threatError) {
      console.error('⚠️  Threat feed service initialization failed:', threatError);
      console.log('🔄 Continuing without threat feed functionality...');
    }

    // Start Apollo Server
    await apolloServer.start();

    // Apply Apollo middleware
    app.use(
      '/graphql',
      json(),
      expressMiddleware(apolloServer, {
        context: async ({ req, res }) => ({
          req,
          res,
        }),
      })
    );

    // Start Express server
    const PORT = Number(process.env.PORT) || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server ready at http://0.0.0.0:${PORT}`);
      console.log(`📊 Health check available at http://0.0.0.0:${PORT}/health`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      if (missingEnvVars.length > 0) {
        console.log(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
        console.log('Please set these in your Railway dashboard for full functionality');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});