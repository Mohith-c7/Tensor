/**
 * Rate Limiter Middleware
 * Two limiters: strict for auth endpoints, relaxed for general API
 * Returns 429 with Retry-After header on limit exceeded
 */

const rateLimit = require('express-rate-limit');
const config = require('../config/index');
const logger = require('../config/logger');

/**
 * Build a rate limiter with standard options
 * @param {number} windowMs
 * @param {number} max
 * @param {string} name - for logging
 */
function createLimiter(windowMs, max, name) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,  // Return RateLimit-* headers
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Key by IP + user ID if authenticated
      return req.user ? `${req.ip}:${req.user.id}` : req.ip;
    },
    handler(req, res) {
      const retryAfter = Math.ceil(windowMs / 1000);
      logger.warn(`Rate limit exceeded [${name}]`, {
        ip: req.ip,
        path: req.path,
        userId: req.user?.id
      });
      res.set('Retry-After', retryAfter);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Please retry after ${retryAfter} seconds.`
        }
      });
    },
    skip: (req) => req.method === 'OPTIONS' || process.env.NODE_ENV === 'test'
  });
}

// 5 requests per 15 minutes — for login/auth endpoints
const authLimiter = createLimiter(
  config.authRateLimitWindow,
  config.authRateLimitMax,
  'auth'
);

// 100 requests per 15 minutes — for general API endpoints
const apiLimiter = createLimiter(
  config.apiRateLimitWindow,
  config.apiRateLimitMax,
  'api'
);

module.exports = { authLimiter, apiLimiter };
