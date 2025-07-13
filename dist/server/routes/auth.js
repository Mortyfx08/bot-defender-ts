"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const shopify_api_1 = require("@shopify/shopify-api");
const router = express_1.default.Router();
const shopify = (0, shopify_api_1.shopifyApi)({
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SCOPES?.split(',') || [],
    hostName: process.env.HOST.replace(/https?:\/\//, ''),
    apiVersion: shopify_api_1.LATEST_API_VERSION,
    isEmbeddedApp: true,
});
// Shopify OAuth callback handler
router.get('/auth/callback', async (req, res) => {
    try {
        const { shop, host } = req.query;
        // Validate the callback and exchange code for access token
        await shopify.auth.callback({
            rawRequest: req,
            rawResponse: res,
        });
        // Redirect to your app's main page (or wherever you want)
        res.redirect(`/?shop=${shop}&host=${host}`);
    }
    catch (error) {
        console.error('Shopify OAuth callback error:', error);
        res.status(500).send('Authentication failed');
    }
});
exports.default = router;
