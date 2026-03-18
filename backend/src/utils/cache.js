/**
 * Cache Service Utility
 * Thin wrapper around config/cache — exposes a consistent interface
 * used by services and routes throughout the application.
 */

const cacheConfig = require('../config/cache');

class CacheService {
  get(key) { return cacheConfig.get(key); }
  set(key, value, ttl) { return cacheConfig.set(key, value, ttl); }
  del(key) { return cacheConfig.del(key); }
  delPattern(pattern) { return cacheConfig.delPattern(pattern); }
  flush() { return cacheConfig.flush(); }
  has(key) { return cacheConfig.has(key); }
  getStats() { return cacheConfig.getStats(); }
  stats() { return cacheConfig.getStats(); }
}

module.exports = new CacheService();
