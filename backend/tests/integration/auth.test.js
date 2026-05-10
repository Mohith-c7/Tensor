/**
 * Authentication Integration Tests
 * Tests POST /api/v1/auth/login and POST /api/v1/auth/verify
 */

const request = require('supertest');
const app = require('../../src/app');

// Seed credentials from seed.sql
const ADMIN = { email: 'admin@tensorschool.com', password: 'Admin@123' };

describe('POST /api/v1/auth/login', () => {
  it('returns 200 with token on valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send(ADMIN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user.email).toBe(ADMIN.email);
    expect(res.body.data.user).not.toHaveProperty('password_hash');
  });

  it('returns 401 on invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 on non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'password' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 on missing password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN.email });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toHaveProperty('password');
  });

  it('returns 400 on invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'password' });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty('email');
  });
});

describe('POST /api/v1/auth/verify', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send(ADMIN);
    token = res.body.data.accessToken || res.body.data.token;
  });

  it('returns 200 with user info on valid token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user).toHaveProperty('role');
  });

  it('returns 401 with no token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('MISSING_TOKEN');
  });

  it('returns 401 with malformed token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify')
      .set('Authorization', 'Bearer not.a.valid.token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });
});
