import { describe, it, expect, beforeEach } from 'vitest';
import {
  storeToken,
  getToken,
  clearSession,
  decodeToken,
  isExpired,
  isNearExpiry,
} from '../../services/authService';

// Helper to build a JWT with a given payload
function makeJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${header}.${body}.fakesig`;
}

const now = Math.floor(Date.now() / 1000);

describe('authService', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('storeToken / getToken', () => {
    it('stores and retrieves a token', () => {
      storeToken('mytoken');
      expect(getToken()).toBe('mytoken');
    });

    it('returns null when no token stored', () => {
      expect(getToken()).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('removes all sessionStorage keys', () => {
      sessionStorage.setItem('foo', 'bar');
      storeToken('mytoken');
      clearSession();
      expect(getToken()).toBeNull();
      expect(sessionStorage.getItem('foo')).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('decodes a valid JWT and returns correct fields', () => {
      const payload = { userId: 1, role: 'admin', email: 'a@b.com', iat: now, exp: now + 3600 };
      const token = makeJwt(payload);
      const decoded = decodeToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded!.userId).toBe(1);
      expect(decoded!.role).toBe('admin');
      expect(decoded!.exp).toBe(now + 3600);
    });

    it('returns null for a string with wrong number of parts', () => {
      expect(decodeToken('only.two')).toBeNull();
      expect(decodeToken('one')).toBeNull();
      expect(decodeToken('')).toBeNull();
    });

    it('returns null for a token with invalid base64 payload', () => {
      expect(decodeToken('header.!!!invalid!!!.sig')).toBeNull();
    });

    it('returns null for a token missing required fields', () => {
      const token = makeJwt({ foo: 'bar' }); // no userId/role/exp/iat
      expect(decodeToken(token)).toBeNull();
    });
  });

  describe('isExpired', () => {
    it('returns true for an expired token', () => {
      const token = makeJwt({ userId: 1, role: 'admin', email: 'a@b.com', iat: now - 7200, exp: now - 3600 });
      expect(isExpired(token)).toBe(true);
    });

    it('returns false for a valid token', () => {
      const token = makeJwt({ userId: 1, role: 'admin', email: 'a@b.com', iat: now, exp: now + 3600 });
      expect(isExpired(token)).toBe(false);
    });

    it('returns true for a malformed token', () => {
      expect(isExpired('not.a.jwt')).toBe(true);
    });
  });

  describe('isNearExpiry', () => {
    it('returns true when token expires within 5 minutes', () => {
      const token = makeJwt({ userId: 1, role: 'admin', email: 'a@b.com', iat: now, exp: now + 200 }); // 200s < 300s
      expect(isNearExpiry(token)).toBe(true);
    });

    it('returns false when token has more than 5 minutes remaining', () => {
      const token = makeJwt({ userId: 1, role: 'admin', email: 'a@b.com', iat: now, exp: now + 3600 });
      expect(isNearExpiry(token)).toBe(false);
    });

    it('returns true for a malformed token', () => {
      expect(isNearExpiry('bad')).toBe(true);
    });
  });
});
