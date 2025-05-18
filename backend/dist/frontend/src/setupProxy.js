"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_proxy_middleware_1 = require("http-proxy-middleware");
module.exports = function (app) {
    app.use('/auth', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        pathRewrite: { '^/auth': '' },
        onProxyReq: (proxyReq) => {
            // Shopify-specific headers
            proxyReq.setHeader('X-Shopify-API-Version', '2024-01');
            proxyReq.setHeader('Accept', 'application/json');
        }
    }));
    app.use('/api', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        pathRewrite: { '^/api': '' },
        onError: (err, req, res) => {
            console.error('Proxy API Error:', err);
            res.status(500).json({ error: 'Proxy Error' });
        }
    }));
    app.use('/graphql', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        onProxyReqWs: (proxyReq) => {
            // Shopify GraphQL specific headers
            proxyReq.setHeader('X-Shopify-Storefront-Access-Token', process.env.SHOPIFY_STOREFRONT_TOKEN || '');
        }
    }));
    // WebSocket support for HMR
    app.use('/sockjs-node', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: 'ws://localhost:3000',
        ws: true,
        changeOrigin: true
    }));
};
