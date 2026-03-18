/**
 * Cache Service Utility
 * Wraps the node-cache instance from config with a clean service interface
 * Provides get/set/del/delPattern/flush with hit-miss logging
 */

const cacheStore = require('../config/cache');
const logger = require('../config/logger');

class CacheService {
  /**
   * Get a value from cache
   * @param {string} key
   * @returns {*|null} value or null on miss
   */
  get(key) {
    const value = cacheStore.get(key);
    if (value === null) {
      logger.debug('Cache miss', { key });
    } else {
      logger.debug('Cache hit', { key });
    }
    return value;
  }

  /**
   * Set a value in cache
   * @param {string} key
   * @param {*} value
   * @param {number} ttl - seconds (uses default if omitted)
   * @returns {boolean}
   */
  set(key, value, ttl) {
    return cacheStore.set(key, value, ttl);
  }

  /**
   * Delete a single key
   * @param {string} key
   * @returns {number} count deleted
   */
  del(key) {
    return cacheStore.del(key);
  }

  /**
   * Delete all keys matching a glob-style pattern (e.g. 'student:*')
   * @param {string} pattern
   * @returns {number} count deleted
   */
  delPattern(pattern) {
    return cacheStore.delPattern(pattern);
  }

  /**
   * Flush entire cache
   */
  flush() {
    cacheStore.flush();
  }

  /**
   * Check if key exists
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return cacheStore.has(key);
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  stats() {
    return cacheStore.getStats();
  }
}

// Export a singleton instance + TTL constants for convenience
const cache = new CacheService();

module.exports = {
  cache,
  TTL: cacheStore.TTL
};
