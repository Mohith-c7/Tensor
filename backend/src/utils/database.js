/**
 * Database Utility Functions
 * Provides retry logic, health checks, and query helpers
 * for enterprise-grade database operations
 */

const { supabase, healthCheck } = require('../config/database');
const logger = require('../config/logger');

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 100;

/**
 * Execute a database operation with exponential backoff retry
 * @param {Function} operation - Async function that returns a Supabase query result
 * @param {string} operationName - Name for logging
 * @param {number} retries - Max retry attempts (default: 3)
 * @returns {Promise<Object>} Supabase result { data, error }
 * @throws {Error} After all retries exhausted
 */
async function executeWithRetry(operation, operationName = 'db_operation', retries = MAX_RETRIES) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await operation();

      // Supabase returns { data, error } — treat error as failure
      if (result.error) {
        // Don't retry on client errors (constraint violations, not found, etc.)
        const isClientError = isNonRetryableError(result.error);
        if (isClientError || attempt === retries) {
          logger.warn(`DB operation "${operationName}" failed`, {
            attempt,
            error: result.error.message,
            code: result.error.code
          });
          return result; // Return as-is so caller can handle
        }

        lastError = result.error;
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        logger.warn(`DB operation "${operationName}" retrying`, {
          attempt,
          nextRetryMs: delay,
          error: result.error.message
        });
        await sleep(delay);
        continue;
      }

      if (attempt > 1) {
        logger.info(`DB operation "${operationName}" succeeded on attempt ${attempt}`);
      }
      return result;

    } catch (err) {
      lastError = err;
      if (attempt === retries) break;

      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      logger.warn(`DB operation "${operationName}" threw, retrying`, {
        attempt,
        nextRetryMs: delay,
        error: err.message
      });
      await sleep(delay);
    }
  }

  logger.error(`DB operation "${operationName}" exhausted all ${retries} retries`, {
    error: lastError?.message
  });
  throw lastError || new Error(`Database operation "${operationName}" failed after ${retries} retries`);
}

/**
 * Determine if a Supabase error should NOT be retried
 * (constraint violations, auth errors, not found, etc.)
 * @param {Object} error - Supabase error object
 * @returns {boolean}
 */
function isNonRetryableError(error) {
  const nonRetryableCodes = [
    '23505', // unique_violation
    '23503', // foreign_key_violation
    '23502', // not_null_violation
    '23514', // check_violation
    '42P01', // undefined_table
    'PGRST116', // row not found (PostgREST)
    'PGRST301', // JWT expired
  ];
  return nonRetryableCodes.includes(error.code);
}

/**
 * Run a database health check
 * @returns {Promise<{status: string, latencyMs: number, timestamp: string}>}
 */
async function checkDatabaseHealth() {
  const start = Date.now();
  const result = await healthCheck();
  return {
    ...result,
    latencyMs: Date.now() - start
  };
}

/**
 * Build a paginated Supabase query
 * @param {Object} query - Supabase query builder
 * @param {number} page - 1-indexed page number
 * @param {number} limit - Records per page
 * @returns {Object} Query with range applied
 */
function paginate(query, page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return query.range(from, to);
}

/**
 * Build pagination metadata
 * @param {number} total - Total record count
 * @param {number} page - Current page
 * @param {number} limit - Records per page
 * @returns {Object} Pagination metadata
 */
function buildPaginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  supabase,
  executeWithRetry,
  checkDatabaseHealth,
  paginate,
  buildPaginationMeta
};
