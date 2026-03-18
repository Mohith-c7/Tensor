/**
 * Health Check Integration Tests
 */

const request = require('supertest');
const app = require('../../src/app');

describe('GET /health', () => {
  it('returns 200 when healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('does not require authentication', async () => {
    const res = await request(app).get('/health');
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('returns service and uptime info', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('responds within 5 seconds', async () => {
    const start = Date.now();
    await request(app).get('/health');
    expect(Date.now() - start).toBeLessThan(5000);
  });
});
