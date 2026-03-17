/**
 * Configuration Loader
 * Loads and validates environment variables using Joi schema validation
 * Ensures all required configuration is present before application starts
 */

const Joi = require('joi');
require('dotenv').config();

// Define configuration schema with validation rules
const configSchema = Joi.object({
  // Database Configuration
  supabaseUrl: Joi.string().uri().required()
    .messages({
      'string.uri': 'SUPABASE_URL must be a valid URL',
      'any.required': 'SUPABASE_URL is required'
    }),
  supabaseKey: Joi.string().required()
    .messages({
      'any.required': 'SUPABASE_SERVICE_KEY is required'
    }),

  // Authentication Configuration
  jwtSecret: Joi.string().min(32).required()
    .messages({
      'string.min': 'JWT_SECRET must be at least 32 characters long',
      'any.required': 'JWT_SECRET is required'
    }),
  jwtExpiresIn: Joi.string().default('24h'),

  // Server Configuration
  port: Joi.number().port().default(3000),
  nodeEnv: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development'),

  // CORS Configuration
  allowedOrigins: Joi.string().required()
    .messages({
      'any.required': 'ALLOWED_ORIGINS is required'
    }),

  // Logging Configuration
  logLevel: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'debug')
    .default('info'),

  // Rate Limiting Configuration
  authRateLimitWindow: Joi.number().default(900000), // 15 minutes
  authRateLimitMax: Joi.number().default(5),
  apiRateLimitWindow: Joi.number().default(900000),
  apiRateLimitMax: Joi.number().default(100),

  // Caching Configuration
  cacheDefaultTtl: Joi.number().default(3600), // 1 hour
  cacheClassTtl: Joi.number().default(3600),
  cacheFeeTtl: Joi.number().default(86400), // 24 hours

  // Pagination Configuration
  defaultPageSize: Joi.number().default(20),
  maxPageSize: Joi.number().default(100),

  // Password Hashing Configuration
  bcryptSaltRounds: Joi.number().min(10).default(10),

  // Graceful Shutdown Configuration
  shutdownTimeout: Joi.number().default(30000) // 30 seconds
}).unknown(true); // Allow other environment variables

/**
 * Load and validate configuration from environment variables
 * @returns {Object} Validated configuration object
 * @throws {Error} If configuration validation fails
 */
function loadConfig() {
  const config = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_KEY,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    allowedOrigins: process.env.ALLOWED_ORIGINS,
    logLevel: process.env.LOG_LEVEL,
    authRateLimitWindow: process.env.AUTH_RATE_LIMIT_WINDOW,
    authRateLimitMax: process.env.AUTH_RATE_LIMIT_MAX,
    apiRateLimitWindow: process.env.API_RATE_LIMIT_WINDOW,
    apiRateLimitMax: process.env.API_RATE_LIMIT_MAX,
    cacheDefaultTtl: process.env.CACHE_DEFAULT_TTL,
    cacheClassTtl: process.env.CACHE_CLASS_TTL,
    cacheFeeTtl: process.env.CACHE_FEE_TTL,
    defaultPageSize: process.env.DEFAULT_PAGE_SIZE,
    maxPageSize: process.env.MAX_PAGE_SIZE,
    bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS,
    shutdownTimeout: process.env.SHUTDOWN_TIMEOUT
  };

  // Validate configuration against schema
  const { error, value } = configSchema.validate(config, {
    abortEarly: false, // Collect all errors
    convert: true // Convert string values to appropriate types
  });

  if (error) {
    const errors = error.details.map(d => d.message).join(', ');
    throw new Error(`Configuration validation failed: ${errors}`);
  }

  return value;
}

// Load and export configuration
module.exports = loadConfig();
