# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma

# Install backend dependencies
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the backend (TypeScript -> dist/)
RUN npm run build

# Build the frontend (Next.js)
WORKDIR /app/web-next
COPY web-next/package*.json ./
RUN npm install --legacy-peer-deps
COPY web-next/ ./
RUN npm run build

# Move back to root and copy frontend build to backend if needed
WORKDIR /app
# Example: copy .next/static to dist/web-next/static if your backend serves static files
# RUN mkdir -p dist/web-next/static
# RUN cp -r web-next/.next/static dist/web-next/static/

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application using the compiled backend entry point
CMD ["node", "dist/server/index.js"]