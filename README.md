# Shopify Bot Defender App

A modern, production-ready Shopify embedded app for bot protection, built with Next.js, Polaris, App Bridge, Express, MongoDB, and Redis.

## Features
- Real-time bot detection and blocking
- Dashboard with live metrics and activity logs
- Shopify embedded app experience (App Bridge, Polaris)
- Store configuration and settings
- Rate limiting, IP blocklist, and threat feed integration
- Secure OAuth and session management
- Responsive, accessible UI

## Tech Stack
- **Frontend:** Next.js, React, Shopify Polaris, App Bridge
- **Backend:** Express, MongoDB, Redis, Prisma
- **Auth:** Shopify OAuth, session cookies
- **Validation:** Manual (compatible with TypeScript 4.9+)
- **Type Safety:** TypeScript (shared types for API)

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance
- Redis instance
- Shopify Partner account & development store

### Environment Variables
Create a `.env` file in the root with the following:
```
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
HOST=https://your-ngrok-or-production-domain
MONGODB_URI=your-mongodb-uri
REDIS_URL=your-redis-url
SCOPES=read_products,write_products
```

### Install Dependencies
```
npm install
cd web-next && npm install
```

### Development
- **Backend:**
  ```
  npm run dev:backend
  ```
- **Frontend (Next.js):**
  ```
  cd web-next
  npm run dev
  ```
- Visit your app at `https://your-ngrok-url?shop=your-store.myshopify.com`

### Deployment
- Deploy backend and frontend to your preferred platform (Railway, Vercel, Heroku, etc.)
- Set environment variables in your deployment dashboard
- Update your Shopify app settings with the correct URLs

## Troubleshooting
- **OAuth issues:** Ensure your `HOST` and Shopify app URLs match exactly.
- **Database errors:** Check your MongoDB/Redis connection strings and service status.
- **TypeScript errors:** Use TypeScript 4.9.5 for compatibility with Prisma 6.x.
- **App Bridge issues:** Ensure the app is loaded as an embedded app in Shopify admin.

## Contributing
- Fork the repo and create a feature branch
- Use clear commit messages and open a pull request
- Follow Shopify Polaris and Next.js best practices

## License
MIT 