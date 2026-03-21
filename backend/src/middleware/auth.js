/**
 * Authentication Middleware
 * Verifies JWT from Authorization header and attaches user context to req.user
 * Returns 401 for missing, invalid, or expired tokens
 */

const jwt = require('jsonwebtoken');
const config = require('../config/index');
const logger = require('../config/logger');

/**
 * Verify JWT and attach user to request
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Authorization token is required'
      }
    });
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      issuer: 'tensor-school-erp',
      audience: 'tensor-api'
    });
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      email: decoded.email
    };
    next();
  } catch (err) {
    logger.warn('JWT verification failed', { error: err.message, ip: req.ip });

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired. Please log in again.'
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authorization token'
      }
    });
  }
}

module.exports = { authenticate };
