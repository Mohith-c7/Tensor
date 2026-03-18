/**
 * Centralized Error Handler Middleware
 * Must be registered LAST in Express middleware chain
 * Formats all errors consistently, hides stack traces in production
 */

const config = require('../config/index');
const logger = require('../config/logger');

// Map of error names to HTTP status codes
const ERROR_STATUS_MAP = {
  ValidationError: 400,
  UnauthorizedError: 401,
  ForbiddenError: 403,
  NotFoundError: 404,
  ConflictError: 409,
  RateLimitError: 429,
  DatabaseError: 503,
  InternalServerError: 500
};

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const isProduction = config.nodeEnv === 'production';

  // Determine status code
  const statusCode = err.statusCode
    || ERROR_STATUS_MAP[err.name]
    || (err.isJoi ? 400 : 500);

  // Build error code
  const code = err.code || err.name || 'INTERNAL_SERVER_ERROR';

  // Log with full context
  logger.error(err.message, {
    requestId: req.requestId,
    code,
    statusCode,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    stack: isProduction ? undefined : err.stack
  });

  const response = {
    success: false,
    error: {
      code,
      message: isProduction && statusCode === 500
        ? 'An unexpected error occurred'
        : err.message
    }
  };

  // Include field-level errors for validation failures
  if (err.fields) {
    response.error.fields = err.fields;
  }

  // Include stack trace in non-production for debugging
  if (!isProduction && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = { errorHandler };
