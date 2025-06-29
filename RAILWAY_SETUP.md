# Railway Deployment Setup Guide

## Required Environment Variables

Set these environment variables in your Railway dashboard:

### Database Configuration
- `MONGODB_URI` - Your MongoDB connection string
- `REDIS_URL` - Your Redis connection string

### Shopify App Configuration
- `HOST` - Your Railway app URL (e.g., `https://your-app-name.up.railway.app`)
- `SHOPIFY_API_KEY` - Your Shopify app API key
- `SHOPIFY_API_SECRET` - Your Shopify app API secret
- `SCOPES` - Comma-separated list of Shopify scopes (e.g., `read_products,write_products`)

### Optional Configuration
- `NODE_ENV` - Set to `production` for production deployment
- `PORT` - Railway sets this automatically

## How to Set Environment Variables in Railway

1. Go to your Railway dashboard
2. Select your project
3. Go to the "Variables" tab
4. Add each environment variable listed above
5. Redeploy your application

## Testing Your Deployment

After setting the environment variables:

1. Visit your Railway app URL
2. Check the health endpoint: `https://your-app.up.railway.app/health`
3. The health endpoint will show if any environment variables are missing

## Common Issues

### 502 Bad Gateway
- Check Railway logs for error messages
- Ensure all required environment variables are set
- Verify database connection strings are correct

### Database Connection Failures
- Ensure `MONGODB_URI` and `REDIS_URL` are properly formatted
- Check if your database services are running
- Verify network connectivity

### Shopify Integration Issues
- Ensure `HOST` matches your Railway app URL exactly
- Verify `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are correct
- Check that your app is properly configured in Shopify Partner dashboard 