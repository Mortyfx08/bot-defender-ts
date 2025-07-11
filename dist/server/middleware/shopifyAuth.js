"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopifyAuthMiddleware = shopifyAuthMiddleware;
const shopify_api_1 = require("@shopify/shopify-api");
const redis_1 = require("../services/redis");
const shopify = (0, shopify_api_1.shopifyApi)({
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SCOPES?.split(',') || [],
    hostName: process.env.HOST.replace(/https?:\/\//, ''),
    apiVersion: shopify_api_1.LATEST_API_VERSION,
    isEmbeddedApp: true,
});
async function shopifyAuthMiddleware(req, res, next) {
    try {
        // Get shop from query parameters or hostname
        let shop = req.query.shop;
        if (!shop) {
            // Try to get shop from hostname
            const hostname = req.hostname;
            if (hostname.includes('.myshopify.com')) {
                shop = hostname;
            }
            else {
                return res.status(400).json({
                    error: 'No shop provided',
                    message: 'Please provide a shop parameter or access through a Shopify domain'
                });
            }
        }
        // Validate shop domain format
        if (!shop.endsWith('.myshopify.com')) {
            return res.status(400).json({
                error: 'Invalid shop domain',
                message: 'Shop domain must end with .myshopify.com'
            });
        }
        // For now, just validate the shop format and add it to the request
        // We'll skip the session validation for embedded app scenarios
        req.shop = shop;
        // Try to get session if possible, but don't fail if not available
        try {
            const session = await shopify.session.customAppSession(shop);
            if (session && session.accessToken) {
                req.shopifySession = session;
            }
        }
        catch (sessionError) {
            console.log('Session not available for shop:', shop, sessionError);
            // Continue without session for now
        }
        // Check if shop is blocked in Redis (optional check)
        try {
            const redisService = await redis_1.RedisService.getInstance();
            const clientIp = req.ip || req.socket.remoteAddress || '';
            if (clientIp) {
                const isBlocked = await redisService.isStoreIPBlocked(shop, clientIp);
                if (isBlocked) {
                    const reason = await redisService.getStoreBlockReason(shop, clientIp);
                    return res.status(403).json({
                        error: 'Access denied',
                        reason: reason || 'IP is blocked',
                        message: 'Your IP address has been blocked. Please contact support if this is an error.'
                    });
                }
            }
        }
        catch (redisError) {
            console.log('Redis check failed, continuing:', redisError);
            // Continue even if Redis check fails
        }
        next();
    }
    catch (error) {
        console.error('Shopify auth error:', error);
        res.status(500).json({
            error: 'Authentication failed',
            message: 'An error occurred during authentication. Please try again.'
        });
    }
}
