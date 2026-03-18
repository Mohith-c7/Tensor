/**
 * Request Logger Middleware
 * Generates a unique request ID per request
 * Logs incoming requests and outgoing responses with timing
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

function requestLogger(req, res, next) {
  const requestId = uuidv4();
  const startTime = Date.now();

  // Attach request ID to req and response header
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Log incoming request
  logger.http('Incoming request', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || null
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 500 ? 'error'
      : res.statusCode >= 400 ? 'warn'
      : 'http';

    logger[level]('Outgoing response', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      userId: req.user?.id || null
    });
  });

  next();
}

module.exports = { requestLogger };
