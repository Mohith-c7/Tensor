/**
 * CORS Middleware
 * Validates request origins against allowed list from environment config
 * Supports credentials and preflight (OPTIONS) requests
 */

const cors = require('cors');
const config = require('../config/index');
const logger = require('../config/logger');

// Parse comma-separated origins into an array
const allowedOrigins = config.allowedOrigins
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (server-to-server, curl, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin, allowedOrigins });
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // Cache preflight for 24 hours
  optionsSuccessStatus: 204
};

module.exports = cors(corsOptions);
