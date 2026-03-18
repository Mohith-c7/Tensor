/**
 * Global Test Setup
 * Configures environment, timeouts, and shared test utilities
 */

process.env.NODE_ENV = 'test';
process.env.SUPPRESS_LOGS = 'true';

jest.setTimeout(30000);

// Suppress winston logs during tests
jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  http: jest.fn()
}));

global.testUtils = {
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  randomString: (len = 8) => Math.random().toString(36).substring(2, 2 + len).toUpperCase(),
  randomEmail: () => `test.${Date.now()}@example.com`,
  randomAdmissionNo: () => `ADM${Date.now()}`,
  randomDate: (year = 2010) => `${year}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
};
