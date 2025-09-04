# Bharat KYC App Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY 01-Project_Overview/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/01-Project_Overview/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/05-Documentation ./public/docs
COPY --from=builder --chown=nextjs:nodejs /app/04-Source_Code ./public/sdk

# Create necessary directories
RUN mkdir -p logs && chown nextjs:nodejs logs

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "src/backend/server.js"]
