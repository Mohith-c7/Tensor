/**
 * Database Configuration
 * Configures and exports Supabase client for database operations
 * Provides connection pooling and health check functionality
 */

const { createClient } = require('@supabase/supabase-js');
const config = require('./index');
const logger = require('./logger');

// Create Supabase client with configuration
const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  }
});

/**
 * Health check for database connection
 * @returns {Promise<Object>} Health status object
 */
async function healthCheck() {
  try {
    // Simple query to verify database connectivity
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      logger.error('Database health check failed', { error: error.message });
      return {
        status: 'disconnected',
        error: error.message
      };
    }

    return {
      status: 'connected',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Database health check error', { error: error.message });
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Execute query with error handling and logging
 * @param {Function} queryFn - Query function to execute
 * @param {string} operation - Operation name for logging
 * @returns {Promise<Object>} Query result
 */
async function executeQuery(queryFn, operation = 'query') {
  try {
    const startTime = Date.now();
    const result = await queryFn();
    const duration = Date.now() - startTime;

    if (result.error) {
      logger.error(`Database ${operation} failed`, {
        error: result.error.message,
        duration
      });
      throw result.error;
    }

    logger.debug(`Database ${operation} completed`, { duration });
    return result;
  } catch (error) {
    logger.error(`Database ${operation} error`, {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = {
  supabase,
  healthCheck,
  executeQuery
};
