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

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SCOPES?.split(',') || [],
  hostName: process.env.HOST!.replace(/https?:\/\//, ''),
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
    const mongoService = await MongoDBService.getInstance();
    const testShop = 'test-shop.myshopify.com';

    // Get security alerts
    const securityAlerts = await mongoService.getCollection('security_alerts')
      .find({ 
        shop: testShop,
        resolved: false
      })
      .sort({ timestamp: -1 })
      .toArray();

    // Get bot activities
    const botActivities = await mongoService.getCollection('bot_activities')
      .find({ shop: testShop })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    // Get blocked IPs
    const blockedIPs = await mongoService.getCollection('blocked_ips')
      .find({ shop: testShop })
      .sort({ blockedAt: -1 })
      .toArray();

    res.json({
      status: 'success',
      data: {
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
  
  // For API endpoints, check for session
  if (req.path.startsWith('/api/')) {
    const session = res.locals.shopify?.session;
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  next();
});

// Root route handler
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Bot Defender API',
    status: 'running',
    endpoints: {
      graphql: '/graphql',
      api: '/api',
      botStats: '/api/bot-stats',
      test: {
        redis: '/test/redis',
        mongodb: '/test/mongodb',
        botActivity: '/test/bot-activity',
        botDefender: '/test/bot-defender'
      }
    },
    documentation: 'API documentation coming soon'
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

// Apply Shopify session middleware
app.use('/api', verifyRequest);

// Apply bot detection middleware for all routes
app.use(botDetectionMiddleware);

// API routes
app.use('/api', botProtectionMiddleware);

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

// Start Apollo Server and Express app
async function startServer() {
  try {
    // Initialize database first
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully');

    // Initialize threat feed service
    console.log('Initializing threat feed service...');
    const threatFeedService = await ThreatFeedService.getInstance();
    await threatFeedService.updateThreatFeeds(); // Ensure threat feeds are updated on startup
    console.log('Threat feed service initialized');

    // Initialize blocklist updater
    console.log('Initializing blocklist updater...');
    BlocklistUpdater.getInstance();
    console.log('Blocklist updater initialized');

    await apolloServer.start();
    
    // Apply Apollo middleware
    app.use('/graphql', 
      cors<cors.CorsRequest>(),
      json(),
      expressMiddleware(apolloServer, {
        context: async ({ req }) => {
          return { req };
        },
      })
    );

    // Apply bot stats router
    app.use('/api', botStatsRouter);

    // Apply dashboard router
    app.use('/api/dashboard', dashboardRouter);

    // Start the server
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
      console.log(`API endpoint: http://localhost:${PORT}/api`);
      console.log(`Dashboard endpoint: http://localhost:${PORT}/api/dashboard`);
      console.log(`Root endpoint: http://localhost:${PORT}/`);
      console.log(`Test endpoints:`);
      console.log(`- Redis test: http://localhost:${PORT}/test/redis`);
      console.log(`- MongoDB test: http://localhost:${PORT}/test/mongodb`);
      console.log(`- Bot Activity test: http://localhost:${PORT}/test/bot-activity`);
      console.log(`- Bot Defender test: http://localhost:${PORT}/test/bot-defender`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port or kill the process using this port.`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });

    // Handle process termination
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { app };
export default app;