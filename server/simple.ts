import express from 'express';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 'not set'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Bot Defender API is running',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/test', (req, res) => {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
}); 