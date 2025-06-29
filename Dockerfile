# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
# COPY .env ./.env
# For Railway/production: Do not copy .env, set all env vars in Railway dashboard

# Install backend dependencies
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy the backend source code
COPY server ./server
COPY middleware ./middleware
COPY database ./database
COPY config ./config
COPY types ./types

# Build the backend
RUN npm run build

# Build the frontend
WORKDIR /app/web
COPY web/package*.json ./
# Remove any existing lock files and node_modules in web directory
RUN rm -rf package-lock.json node_modules
RUN npm install --legacy-peer-deps
COPY web/ ./
RUN npm run build

# Move back to root and copy frontend build to backend
WORKDIR /app
RUN mkdir -p dist/web/build
RUN cp -r web/build/* dist/web/build/

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/server/index.js"]