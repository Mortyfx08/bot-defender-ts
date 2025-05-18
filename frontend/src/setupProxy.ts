// src/setupProxy.js
import { Application, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

module.exports = function(app: Application) {
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      pathRewrite: { '^/auth': '' },
      onProxyReq: (proxyReq: any) => {
        // Shopify-specific headers
        proxyReq.setHeader('X-Shopify-API-Version', '2024-01');
        proxyReq.setHeader('Accept', 'application/json');
      }
    })
  );

  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      pathRewrite: { '^/api': '' },
      onError: (err: any, req: Request, res: Response) => {
        console.error('Proxy API Error:', err);
        res.status(500).json({ error: 'Proxy Error' });
      }
    })
  );

  app.use(
    '/graphql',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      ws: true, // Enable websockets for GraphQL subscriptions
      onProxyReqWs: (proxyReq: any) => {
        // Shopify GraphQL specific headers
        proxyReq.setHeader('X-Shopify-Storefront-Access-Token', process.env.SHOPIFY_STOREFRONT_TOKEN || '');
      }
    })
  );

  // WebSocket support for HMR
  app.use(
    '/sockjs-node',
    createProxyMiddleware({
      target: 'ws://localhost:3000',
      ws: true,
      changeOrigin: true
    })
  );
};