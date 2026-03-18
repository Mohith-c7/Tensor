# ============================================================
# Tensor School ERP - Backend Dockerfile
# Node.js 18 Alpine for minimal image size
# ============================================================

FROM node:18-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# ─── Dependencies stage ───────────────────────────────────────────────────────
FROM base AS deps

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ─── Production stage ─────────────────────────────────────────────────────────
FROM base AS production

ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application source
COPY --chown=nodejs:nodejs src/ ./src/
COPY --chown=nodejs:nodejs package.json ./

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

USER nodejs

EXPOSE 5000

# Health check using the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
