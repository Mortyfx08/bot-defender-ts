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

## Testing & CI/CD

### Production-Ready Test Suite
- **All backend tests mock MongoDB, Redis, and Shopify API**—no real infrastructure required for CI or local runs.
- **Frontend tests** use React Testing Library and Polaris context, and do not require a running backend.
- **Test expectations match real app responses** (200/404 for not found, etc.).
- **Fast, reliable, and isolated tests**—perfect for CI/CD and Shopify app store review.

### Running Tests Locally
- **Backend:**
  ```
  npm test --prefix server
  ```
- **Frontend:**
  ```
  npm test --prefix web-next
  ```

### Continuous Integration
- Tests run automatically on every push/PR via GitHub Actions (see `.github/workflows/ci.yml`).
- No real MongoDB, Redis, or Shopify credentials are needed for CI.

### Integration Tests (Optional)
- You can add `.integration.test.ts` files that use real services for staging, but keep your main suite mocked for speed and reliability.

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