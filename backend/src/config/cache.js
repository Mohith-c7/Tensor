/**
 * Cache Configuration
 * Configures node-cache for in-memory caching
 * Provides methods for cache operations with TTL support
 */

const NodeCache = require('node-cache');
const config = require('./index');
const logger = require('./logger');

// Create cache instance with default configuration
const cache = new NodeCache({
  stdTTL: config.cacheDefaultTtl, // Default TTL in seconds
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false, // Don't clone objects for better performance
  deleteOnExpire: true
});

// Cache event listeners for monitoring
cache.on('set', (key, value) => {
  logger.debug('Cache set', { key });
});

cache.on('del', (key, value) => {
  logger.debug('Cache delete', { key });
});

cache.on('expired', (key, value) => {
  logger.debug('Cache expired', { key });
});

cache.on('flush', () => {
  logger.info('Cache flushed');
});

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {*|null} Cached value or null if not found
 */
function get(key) {
  try {
    const value = cache.get(key);
    if (value === undefined) {
      logger.debug('Cache miss', { key });
      return null;
    }
    logger.debug('Cache hit', { key });
    return value;
  } catch (error) {
    logger.error('Cache get error', { key, error: error.message });
    return null;
  }
}

/**
 * Set value in cache with optional TTL
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {boolean} Success status
 */
function set(key, value, ttl = config.cacheDefaultTtl) {
  try {
    const success = cache.set(key, value, ttl);
    if (!success) {
      logger.warn('Cache set failed', { key });
    }
    return success;
  } catch (error) {
    logger.error('Cache set error', { key, error: error.message });
    return false;
  }
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {number} Number of deleted entries
 */
function del(key) {
  try {
    return cache.del(key);
  } catch (error) {
    logger.error('Cache delete error', { key, error: error.message });
    return 0;
  }
}

/**
 * Delete all keys matching pattern
 * @param {string} pattern - Key pattern (e.g., 'student:*')
 * @returns {number} Number of deleted entries
 */
function delPattern(pattern) {
  try {
    const keys = cache.keys();
    // Escape all special regex chars (including *), then replace \* with .*
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
    const regex = new RegExp(`^${escaped}$`);
    const matchingKeys = keys.filter(key => regex.test(key));
    
    if (matchingKeys.length > 0) {
      const deleted = cache.del(matchingKeys);
      logger.info('Cache pattern delete', { pattern, deleted });
      return deleted;
    }
    return 0;
  } catch (error) {
    logger.error('Cache pattern delete error', { pattern, error: error.message });
    return 0;
  }
}

/**
 * Clear all cache entries
 */
function flush() {
  try {
    cache.flushAll();
    logger.info('Cache cleared');
  } catch (error) {
    logger.error('Cache flush error', { error: error.message });
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getStats() {
  return cache.getStats();
}

/**
 * Check if key exists in cache
 * @param {string} key - Cache key
 * @returns {boolean} True if key exists
 */
function has(key) {
  return cache.has(key);
}

module.exports = {
  get,
  set,
  del,
  delPattern,
  flush,
  getStats,
  has,
  // Cache TTL constants
  TTL: {
    DEFAULT: config.cacheDefaultTtl,
    CLASS: config.cacheClassTtl,
    FEE: config.cacheFeeTtl,
    SHORT: 300, // 5 minutes
    LONG: 7200 // 2 hours
  }
};
