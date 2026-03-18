/**
 * Health Check Route
 * GET /health - No authentication required
 * Returns 200 when healthy, 503 when dependencies fail
 * Must respond within 5 seconds
 */

const { Router } = require('express');
const { healthCheck } = require('../config/database');
const cache = require('../utils/cache');

const router = Router();

router.get('/', async (req, res) => {
  const startTime = Date.now();

  try {
    // Check database with 4-second timeout
    const dbCheck = await Promise.race([
      healthCheck(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database health check timed out')), 4000)
      )
    ]);

    const cacheStats = cache.getStats();
    const duration = Date.now() - startTime;

    const isHealthy = dbCheck.status === 'connected';

    const payload = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${duration}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      dependencies: {
        database: dbCheck,
        cache: {
          status: 'connected',
          keys: cacheStats.keys,
          hits: cacheStats.hits,
          misses: cacheStats.misses
        }
      }
    };

    return res.status(isHealthy ? 200 : 503).json(payload);
  } catch (err) {
    const duration = Date.now() - startTime;
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${duration}ms`,
      error: err.message,
      dependencies: {
        database: { status: 'error', error: err.message }
      }
    });
  }
});

module.exports = router;
