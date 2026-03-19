/**
 * Unit Tests: Auth Service (pure methods only)
 * Tests generateToken, verifyToken, hashPassword, comparePassword
 * Requirements: 1.1, 1.2, 1.3, 1.5, 1.6
 */

jest.mock('../../src/config/index', () => ({
  jwtSecret: 'test-secret-key-for-unit-tests-minimum-32-chars',
  jwtExpiresIn: '24h',
  bcryptSaltRounds: 10
}));

// Mock database to avoid Supabase URL requirement
jest.mock('../../src/config/database', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null })
  },
  healthCheck: jest.fn().mockResolvedValue({ status: 'connected' })
}));

const jwt = require('jsonwebtoken');
const authService = require('../../src/services/auth.service');

describe('AuthService - generateToken', () => {
  it('generates a valid JWT with user payload', () => {
    const user = { id: 1, role: 'admin', email: 'admin@test.com' };
    const token = authService.generateToken(user);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('token contains correct user id and role', () => {
    const user = { id: 42, role: 'teacher', email: 'teacher@test.com' };
    const token = authService.generateToken(user);
    const decoded = jwt.decode(token);
    expect(decoded.id).toBe(42);
    expect(decoded.role).toBe('teacher');
    expect(decoded.email).toBe('teacher@test.com');
  });

  it('token has issuer and audience claims', () => {
    const user = { id: 1, role: 'admin', email: 'a@b.com' };
    const token = authService.generateToken(user);
    const decoded = jwt.decode(token);
    expect(decoded.iss).toBe('tensor-school-erp');
    expect(decoded.aud).toBe('tensor-api');
  });

  it('token expires in approximately 24 hours', () => {
    const user = { id: 1, role: 'admin', email: 'a@b.com' };
    const token = authService.generateToken(user);
    const decoded = jwt.decode(token);
    const expectedExpiry = Math.floor(Date.now() / 1000) + 24 * 3600;
    expect(decoded.exp).toBeGreaterThan(expectedExpiry - 60);
    expect(decoded.exp).toBeLessThan(expectedExpiry + 60);
  });
});

describe('AuthService - verifyToken', () => {
  it('verifies a valid token and returns payload', () => {
    const user = { id: 1, role: 'admin', email: 'a@b.com' };
    const token = authService.generateToken(user);
    const payload = authService.verifyToken(token);
    expect(payload.id).toBe(1);
    expect(payload.role).toBe('admin');
  });

  it('throws UnauthorizedError for invalid token', () => {
    expect(() => authService.verifyToken('invalid.token.here')).toThrow();
  });

  it('throws UnauthorizedError for token signed with wrong secret', () => {
    const token = jwt.sign({ id: 1, role: 'admin' }, 'wrong-secret');
    expect(() => authService.verifyToken(token)).toThrow();
  });

  it('throws UnauthorizedError for expired token', (done) => {
    const token = jwt.sign(
      { id: 1, role: 'admin', email: 'a@b.com' },
      'test-secret-key-for-unit-tests-minimum-32-chars',
      { expiresIn: '0s', issuer: 'tensor-school-erp', audience: 'tensor-api' }
    );
    setTimeout(() => {
      expect(() => authService.verifyToken(token)).toThrow();
      done();
    }, 10);
  });
});

describe('AuthService - hashPassword and comparePassword', () => {
  it('hashPassword produces a bcrypt hash', async () => {
    const hash = await authService.hashPassword('mypassword123');
    expect(hash).toMatch(/^\$2[ab]\$\d+\$/);
  });

  it('comparePassword returns true for matching password', async () => {
    const hash = await authService.hashPassword('correctpassword');
    const result = await authService.comparePassword('correctpassword', hash);
    expect(result).toBe(true);
  });

  it('comparePassword returns false for wrong password', async () => {
    const hash = await authService.hashPassword('correctpassword');
    const result = await authService.comparePassword('wrongpassword', hash);
    expect(result).toBe(false);
  });

  it('same password produces different hashes (salt)', async () => {
    const hash1 = await authService.hashPassword('password');
    const hash2 = await authService.hashPassword('password');
    expect(hash1).not.toBe(hash2);
  });
});
