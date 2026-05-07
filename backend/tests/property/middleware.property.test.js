/**
 * Property Tests: Middleware
 * Properties 4, 6, 8, 13
 * Requirements: 1.4, 2.1, 2.4, 3.1, 3.2, 5.1, 5.2
 */

const fc = require('fast-check');
const jwt = require('jsonwebtoken');

jest.mock('../../src/config/index', () => ({
  jwtSecret: 'test-secret-key-for-property-tests',
  nodeEnv: 'test'
}));

const { authenticate } = require('../../src/middleware/auth');
const { authorize, adminOnly, teacherOrAdmin } = require('../../src/middleware/rbac');
const { validate } = require('../../src/middleware/validator');
const { errorHandler } = require('../../src/middleware/errorHandler');
const Joi = require('joi');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(overrides = {}) {
  return {
    headers: {},
    body: {},
    query: {},
    params: {},
    path: '/test',
    method: 'GET',
    ip: '127.0.0.1',
    ...overrides
  };
}

function makeRes() {
  const res = {
    _status: 200,
    _body: null,
    statusCode: 200,
    status(code) { this._status = code; this.statusCode = code; return this; },
    json(body) { this._body = body; return this; }
  };
  return res;
}

function makeNext() { return jest.fn(); }

function signToken(payload, secret = 'test-secret-key-for-property-tests', opts = {}) {
  return jwt.sign(payload, secret, { 
    expiresIn: '1h',
    issuer: 'tensor-school-erp',
    audience: 'tensor-api',
    ...opts 
  });
}

// ─── Property 4: JWT Token Verification ───────────────────────────────────────

describe('Property 4: JWT Token Verification', () => {
  it('valid tokens always attach user context and call next()', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.integer({ min: 1, max: 99999 }),
          role: fc.constantFrom('admin', 'teacher'),
          email: fc.emailAddress()
        }),
        (payload) => {
          const token = signToken(payload);
          const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
          const res = makeRes();
          const next = makeNext();
          authenticate(req, res, next);
          expect(next).toHaveBeenCalledTimes(1);
          expect(req.user.id).toBe(payload.userId);
          expect(req.user.role).toBe(payload.role);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('missing Authorization header always returns 401 MISSING_TOKEN', () => {
    const req = makeReq({ headers: {} });
    const res = makeRes();
    const next = makeNext();
    authenticate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body.error.code).toBe('MISSING_TOKEN');
  });

  it('non-Bearer auth header always returns 401', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.startsWith('Bearer ')),
        (authValue) => {
          const req = makeReq({ headers: { authorization: authValue } });
          const res = makeRes();
          const next = makeNext();
          authenticate(req, res, next);
          expect(next).not.toHaveBeenCalled();
          expect(res._status).toBe(401);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('tokens signed with wrong secret always return 401 INVALID_TOKEN', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.integer({ min: 1, max: 99999 }),
          role: fc.constantFrom('admin', 'teacher'),
          email: fc.emailAddress()
        }),
        (payload) => {
          const token = signToken(payload, 'wrong-secret');
          const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
          const res = makeRes();
          const next = makeNext();
          authenticate(req, res, next);
          expect(next).not.toHaveBeenCalled();
          expect(res._status).toBe(401);
          expect(res._body.error.code).toBe('INVALID_TOKEN');
        }
      ),
      { numRuns: 30 }
    );
  });

  it('expired tokens always return 401 TOKEN_EXPIRED', (done) => {
    const token = signToken({ userId: 1, role: 'admin', email: 'a@b.com' },
      'test-secret-key-for-property-tests', { expiresIn: '0s' });
    setTimeout(() => {
      const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
      const res = makeRes();
      const next = makeNext();
      authenticate(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res._status).toBe(401);
      expect(res._body.error.code).toBe('TOKEN_EXPIRED');
      done();
    }, 10);
  });
});

// ─── Property 6: Role-Based Access Control ────────────────────────────────────

describe('Property 6: Role-Based Access Control', () => {
  it('admin role always passes all authorization checks', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 99999 }), (userId) => {
        const req = makeReq();
        req.user = { id: userId, role: 'admin', email: 'admin@test.com' };

        const res1 = makeRes(); const next1 = makeNext();
        adminOnly(req, res1, next1);
        expect(next1).toHaveBeenCalledTimes(1);

        const res2 = makeRes(); const next2 = makeNext();
        teacherOrAdmin(req, res2, next2);
        expect(next2).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 30 }
    );
  });

  it('teacher role passes teacherOrAdmin but fails adminOnly with 403', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 99999 }), (userId) => {
        const req = makeReq();
        req.user = { id: userId, role: 'teacher', email: 'teacher@test.com' };

        const res1 = makeRes(); const next1 = makeNext();
        adminOnly(req, res1, next1);
        expect(next1).not.toHaveBeenCalled();
        expect(res1._status).toBe(403);
        expect(res1._body.error.code).toBe('FORBIDDEN');

        const res2 = makeRes(); const next2 = makeNext();
        teacherOrAdmin(req, res2, next2);
        expect(next2).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 30 }
    );
  });

  it('unknown roles are always denied with 403 FORBIDDEN', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(r => !['admin', 'teacher'].includes(r)),
        (role) => {
          const req = makeReq();
          req.user = { id: 1, role, email: 'x@test.com' };
          const res = makeRes(); const next = makeNext();
          adminOnly(req, res, next);
          expect(next).not.toHaveBeenCalled();
          expect(res._status).toBe(403);
          expect(res._body.error.code).toBe('FORBIDDEN');
        }
      ),
      { numRuns: 30 }
    );
  });

  it('requests without req.user always return 401 UNAUTHENTICATED', () => {
    const req = makeReq();
    const res = makeRes(); const next = makeNext();
    adminOnly(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body.error.code).toBe('UNAUTHENTICATED');
  });

  it('authorize() with multiple roles allows any matching role', () => {
    fc.assert(
      fc.property(fc.constantFrom('admin', 'teacher'), (role) => {
        const req = makeReq();
        req.user = { id: 1, role, email: 'x@test.com' };
        const res = makeRes(); const next = makeNext();
        authorize('admin', 'teacher')(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 20 }
    );
  });
});

// ─── Property 8: Request Validation ──────────────────────────────────────────

describe('Property 8: Request Validation and Error Response', () => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    age: Joi.number().integer().min(0).max(150).required(),
    email: Joi.string().email().required()
  });
  const validateBody = validate(schema, 'body');

  it('valid inputs always pass validation and call next()', () => {
    // Use a fixed set of valid emails that Joi accepts (fc.emailAddress() generates
    // emails with short TLDs that Joi's strict validator rejects)
    const validEmails = [
      'test@example.com', 'user@domain.org', 'hello@test.net',
      'admin@school.edu', 'info@company.io'
    ];
    fc.assert(
      fc.property(
        fc.record({
          // Joi trims whitespace, so ensure name has at least one non-whitespace char
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          age: fc.integer({ min: 0, max: 150 }),
          email: fc.constantFrom(...validEmails)
        }),
        (body) => {
          const req = makeReq({ body });
          const res = makeRes(); const next = makeNext();
          validateBody(req, res, next);
          expect(next).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('missing required fields always return 400 VALIDATION_ERROR with field details', () => {
    const cases = [
      { age: 25, email: 'test@example.com' },
      { name: 'Test', email: 'test@example.com' },
      { name: 'Test', age: 25 },
      {}
    ];
    cases.forEach(body => {
      const req = makeReq({ body });
      const res = makeRes(); const next = makeNext();
      validateBody(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res._status).toBe(400);
      expect(res._body.success).toBe(false);
      expect(res._body.error.code).toBe('VALIDATION_ERROR');
      expect(Object.keys(res._body.error.fields).length).toBeGreaterThan(0);
    });
  });

  it('unknown fields are stripped without causing errors', () => {
    // Filter out prototype property names to avoid prototype pollution issues
    const protoProps = new Set(Object.getOwnPropertyNames(Object.prototype));
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(k =>
          !['name', 'age', 'email'].includes(k) && !protoProps.has(k)
        ),
        fc.string({ minLength: 1, maxLength: 50 }),
        (unknownKey, unknownValue) => {
          const body = { name: 'Test', age: 25, email: 'test@example.com', [unknownKey]: unknownValue };
          const req = makeReq({ body });
          const res = makeRes(); const next = makeNext();
          validateBody(req, res, next);
          expect(next).toHaveBeenCalledTimes(1);
          expect(req.body[unknownKey]).toBeUndefined();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('invalid email format always fails validation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@')),
        (badEmail) => {
          const req = makeReq({ body: { name: 'Test', age: 25, email: badEmail } });
          const res = makeRes(); const next = makeNext();
          validateBody(req, res, next);
          expect(next).not.toHaveBeenCalled();
          expect(res._status).toBe(400);
          expect(res._body.error.fields.email).toBeDefined();
        }
      ),
      { numRuns: 30 }
    );
  });
});

// ─── Property 13: Error Handling and Formatting ───────────────────────────────

describe('Property 13: Error Handling and Formatting', () => {
  const {
    ValidationError, UnauthorizedError, ForbiddenError,
    NotFoundError, ConflictError, DatabaseError
  } = require('../../src/utils/errors');

  it('custom errors always produce correct HTTP status codes', () => {
    const cases = [
      { err: new ValidationError('bad input'), status: 400 },
      { err: new UnauthorizedError('not auth'), status: 401 },
      { err: new ForbiddenError('no access'), status: 403 },
      { err: new NotFoundError('resource'), status: 404 },
      { err: new ConflictError('duplicate'), status: 409 },
      { err: new DatabaseError('db fail'), status: 503 }
    ];
    cases.forEach(({ err, status }) => {
      const req = makeReq(); req.requestId = 'test-req-id';
      const res = makeRes(); const next = makeNext();
      errorHandler(err, req, res, next);
      expect(res._status).toBe(status);
      expect(res._body.success).toBe(false);
      expect(res._body.error.code).toBeDefined();
      expect(res._body.error.message).toBeDefined();
    });
  });

  it('error responses always have success:false regardless of error type', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.integer({ min: 400, max: 599 }),
        (message, statusCode) => {
          const err = new Error(message);
          err.statusCode = statusCode;
          const req = makeReq(); req.requestId = 'test-id';
          const res = makeRes(); const next = makeNext();
          errorHandler(err, req, res, next);
          expect(res._body.success).toBe(false);
          expect(res._body.error).toBeDefined();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('validation errors with fields always include field-level details', () => {
    fc.assert(
      fc.property(
        fc.record({
          fieldA: fc.string({ minLength: 1, maxLength: 50 }),
          fieldB: fc.string({ minLength: 1, maxLength: 50 })
        }),
        (fields) => {
          const err = new ValidationError('Validation failed');
          err.fields = fields;
          const req = makeReq(); req.requestId = 'test-id';
          const res = makeRes(); const next = makeNext();
          errorHandler(err, req, res, next);
          expect(res._body.error.fields).toEqual(fields);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('unknown errors default to 500 status', () => {
    const err = new Error('Something unexpected');
    const req = makeReq(); req.requestId = 'test-id';
    const res = makeRes(); const next = makeNext();
    errorHandler(err, req, res, next);
    expect(res._status).toBe(500);
    expect(res._body.success).toBe(false);
  });
});
