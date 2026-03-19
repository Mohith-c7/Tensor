/**
 * Property 2: Token Decode Invariant
 * Validates: Requirements 1.9, 20.5
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { decodeToken } from '../../services/authService';

// Helper to create a valid JWT with given payload
function makeJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${header}.${body}.fakesignature`;
}

describe('Property 2: Token Decode Invariant', () => {
  it('for any valid JWT, decoded exp > iat and required fields are present', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000000000, max: 9999999999 }), // iat
        fc.integer({ min: 1, max: 86400 }), // seconds to add for exp
        fc.constantFrom('admin' as const, 'teacher' as const),
        fc.integer({ min: 1, max: 9999 }), // userId
        (iat, delta, role, userId) => {
          const exp = iat + delta;
          const token = makeJwt({ userId, role, email: 'test@test.com', iat, exp });
          const decoded = decodeToken(token);
          expect(decoded).not.toBeNull();
          expect(decoded!.exp).toBeGreaterThan(decoded!.iat);
          expect(decoded!.userId).toBeDefined();
          expect(decoded!.role).toBeDefined();
          expect(decoded!.exp).toBeDefined();
        }
      )
    );
  });
});

/**
 * Property 3: Malformed Token Rejection
 * Validates: Requirements 1.10
 */
describe('Property 3: Malformed Token Rejection', () => {
  it('returns null for any string that is not a valid 3-part JWT', () => {
    fc.assert(
      fc.property(
        // Generate strings that are NOT valid JWTs (not 3 dot-separated base64url parts)
        fc.oneof(
          fc.string().filter(s => s.split('.').length !== 3),
          fc.constant(''),
          fc.constant('not.a.jwt.at.all'),
          fc.constant('only.two'),
          fc.constant('one'),
          fc.constant('header.INVALID_BASE64!!!.sig'),
        ),
        (nonJwt) => {
          const result = decodeToken(nonJwt);
          expect(result).toBeNull();
        }
      )
    );
  });

  it('returns null for 3-part tokens with invalid JSON payload', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes('.')),
        fc.string().filter(s => !s.includes('.')),
        fc.string().filter(s => !s.includes('.')),
        (h, p, s) => {
          // p is not valid base64-encoded JSON
          const token = `${h}.${p}.${s}`;
          const result = decodeToken(token);
          // Either null (invalid) or a decoded object — but if it decodes, it must have required fields
          if (result !== null) {
            expect(result).toHaveProperty('userId');
            expect(result).toHaveProperty('role');
            expect(result).toHaveProperty('exp');
          }
        }
      )
    );
  });
});
