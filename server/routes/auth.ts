import express from 'express';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';

const router = express.Router();

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SCOPES?.split(',') || [],
  hostName: process.env.HOST!.replace(/https?:\/\//, ''),
  apiVersion: LATEST_API_VERSION,
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
  } catch (error) {
    console.error('Shopify OAuth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

export default router; 