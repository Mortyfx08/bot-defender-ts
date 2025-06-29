# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the basic server
COPY server/basic.js ./server/

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start with basic server for testing
CMD ["npm", "run", "start:basic"]