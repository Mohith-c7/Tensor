/**
 * Express Application
 * Configures middleware stack and mounts all routes
 * Middleware order: CORS → body parsing → request logger → rate limiter → routes → error handler
 */

const express = require('express');
const corsMiddleware = require('./middleware/cors');
const { requestLogger } = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes/index');
const healthRoutes = require('./routes/health.routes');
const { setupSwagger } = require('./docs/swagger');

const app = express();

// ─── Security & CORS ──────────────────────────────────────────────────────────
app.use(corsMiddleware);

// ─── Body Parsing (10MB limit) ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request Logging ──────────────────────────────────────────────────────────
app.use(requestLogger);

// ─── Health Check (no auth, no rate limit) ────────────────────────────────────
app.use('/health', healthRoutes);

// ─── API Rate Limiter ─────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', apiRoutes);

// ─── API Documentation ────────────────────────────────────────────────────────
setupSwagger(app);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
});

// ─── Centralized Error Handler (must be last) ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
