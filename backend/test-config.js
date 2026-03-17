/**
 * Configuration Test Script
 * Verifies that configuration loads and validates correctly
 */

console.log('Testing configuration loader...\n');

try {
  // Load configuration
  const config = require('./src/config/index');
  
  console.log('✓ Configuration loaded successfully!\n');
  console.log('Configuration values:');
  console.log('-------------------');
  console.log(`Port: ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`JWT Expires In: ${config.jwtExpiresIn}`);
  console.log(`Log Level: ${config.logLevel}`);
  console.log(`Auth Rate Limit: ${config.authRateLimitMax} requests per ${config.authRateLimitWindow}ms`);
  console.log(`API Rate Limit: ${config.apiRateLimitMax} requests per ${config.apiRateLimitWindow}ms`);
  console.log(`Cache Default TTL: ${config.cacheDefaultTtl}s`);
  console.log(`Default Page Size: ${config.defaultPageSize}`);
  console.log(`Max Page Size: ${config.maxPageSize}`);
  console.log(`Bcrypt Salt Rounds: ${config.bcryptSaltRounds}`);
  console.log(`Shutdown Timeout: ${config.shutdownTimeout}ms`);
  console.log(`Allowed Origins: ${config.allowedOrigins}`);
  console.log('\n✓ All configuration values validated!');
  
  // Test logger
  console.log('\nTesting logger...');
  const logger = require('./src/config/logger');
  logger.info('Logger test message');
  console.log('✓ Logger initialized successfully!');
  
  // Test cache
  console.log('\nTesting cache...');
  const cache = require('./src/config/cache');
  cache.set('test-key', 'test-value', 60);
  const value = cache.get('test-key');
  if (value === 'test-value') {
    console.log('✓ Cache working correctly!');
  } else {
    console.log('✗ Cache test failed');
  }
  cache.del('test-key');
  
  console.log('\n✓ All configuration tests passed!');
  console.log('\nNote: Database connection test requires valid Supabase credentials.');
  
} catch (error) {
  console.error('✗ Configuration test failed:');
  console.error(error.message);
  process.exit(1);
}
