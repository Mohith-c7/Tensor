/**
 * Server Entry Point
 * Starts the HTTP server after verifying database connectivity
 * Implements graceful shutdown with 30-second timeout
 * Handles SIGTERM, SIGINT, uncaughtException, unhandledRejection
 */

require('dotenv').config();

const app = require('./app');
const config = require('./config/index');
const logger = require('./config/logger');
const { healthCheck } = require('./config/database');

let server;

/**
 * Start the HTTP server
 */
async function start() {
  // Verify database connection before accepting traffic
  logger.info('Verifying database connection...');
  const dbStatus = await healthCheck();

  if (dbStatus.status !== 'connected') {
    logger.error('Database connection failed on startup', { dbStatus });
    process.exit(1);
  }

  logger.info('Database connection verified', { status: dbStatus.status });

  server = app.listen(config.port, () => {
    logger.info(`Server started`, {
      port: config.port,
      env: config.nodeEnv,
      pid: process.pid
    });
  });

  // Set server timeouts
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  return server;
}

/**
 * Graceful shutdown — stop accepting new connections, drain existing ones
 * @param {string} signal - signal name for logging
 */
async function shutdown(signal) {
  logger.info(`${signal} received — initiating graceful shutdown`);

  if (!server) {
    process.exit(0);
    return;
  }

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Flush any pending log writes
      await new Promise(resolve => setTimeout(resolve, 500));
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown cleanup', { error: err.message });
      process.exit(1);
    }
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error(`Forced shutdown after ${config.shutdownTimeout}ms timeout`);
    process.exit(1);
  }, config.shutdownTimeout).unref();
}

// ─── Signal Handlers ──────────────────────────────────────────────────────────
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Unhandled Errors ─────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — shutting down', {
    error: err.message,
    stack: err.stack
  });
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection — shutting down', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined
  });
  shutdown('unhandledRejection');
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
start().catch((err) => {
  logger.error('Failed to start server', { error: err.message, stack: err.stack });
  process.exit(1);
});
