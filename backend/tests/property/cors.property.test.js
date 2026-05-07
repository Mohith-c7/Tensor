/**
 * Property Tests: CORS Headers
 * Property 30: CORS Header Inclusion
 * Requirements: 13.1, 13.2
 */

const fc = require('fast-check');
const request = require('supertest');

jest.mock('../../src/config/index', () => ({
  jwtSecret: 'test-secret-key-for-property-tests',
  nodeEnv: 'test',
  allowedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
  supabaseUrl: 'https://test.supabase.co',
  supabaseKey: 'test-key',
  port: 5000,
  logLevel: 'error'
}));

jest.mock('../../src/config/database', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null })
  },
  healthCheck: jest.fn().mockResolvedValue({ status: 'connected' })
}));

const app = require('../../src/app');

// ─── Property 30: CORS Header Inclusion ───────────────────────────────────────

describe('Property 30: CORS Header Inclusion', () => {
  it('all responses include CORS headers for allowed origins', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('http://localhost:3000', 'http://localhost:5173'),
        fc.constantFrom('/health', '/api/v1/auth/verify'),
        async (origin, endpoint) => {
          const response = await request(app)
            .get(endpoint)
            .set('Origin', origin);

          // CORS headers must be present
          expect(response.headers['access-control-allow-origin']).toBeDefined();
          expect(response.headers['access-control-allow-credentials']).toBe('true');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('preflight requests return correct CORS headers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('http://localhost:3000', 'http://localhost:5173'),
        fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
        async (origin, method) => {
          const response = await request(app)
            .options('/api/v1/students')
            .set('Origin', origin)
            .set('Access-Control-Request-Method', method);

          // Preflight response must include allowed methods
          expect(response.status).toBeLessThan(300);
          expect(response.headers['access-control-allow-methods']).toBeDefined();
          expect(response.headers['access-control-allow-headers']).toBeDefined();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('unauthorized origins are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl().filter(url => 
          !url.includes('localhost:3000') && 
          !url.includes('localhost:5173')
        ),
        async (origin) => {
          const response = await request(app)
            .get('/health')
            .set('Origin', origin);

          // Either no CORS header or explicit rejection
          const allowOrigin = response.headers['access-control-allow-origin'];
          if (allowOrigin) {
            expect(allowOrigin).not.toBe(origin);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('CORS headers are consistent across all endpoints', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('http://localhost:3000'),
        fc.constantFrom(
          '/health',
          '/api/v1/auth/verify',
          '/api/v1/students',
          '/api/v1/attendance',
          '/api/v1/fees/structures'
        ),
        async (origin, endpoint) => {
          const response = await request(app)
            .get(endpoint)
            .set('Origin', origin);

          // All endpoints should have consistent CORS behavior
          const allowOrigin = response.headers['access-control-allow-origin'];
          if (allowOrigin) {
            expect(allowOrigin).toBe(origin);
            expect(response.headers['access-control-allow-credentials']).toBe('true');
          }
        }
      ),
      { numRuns: 25 }
    );
  });

  it('CORS headers include proper credentials flag', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('http://localhost:3000', 'http://localhost:5173'),
        async (origin) => {
          const response = await request(app)
            .get('/health')
            .set('Origin', origin);

          // Credentials flag must be true for authenticated requests
          if (response.headers['access-control-allow-origin']) {
            expect(response.headers['access-control-allow-credentials']).toBe('true');
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
