/**
 * Unit Tests: Utility Functions
 * Tests for errors.js, serializer.js, and cache.js
 */

const {
  AppError, ValidationError, UnauthorizedError, ForbiddenError,
  NotFoundError, ConflictError, RateLimitError, DatabaseError, InternalServerError
} = require('../../src/utils/errors');

const { serialize, successResponse, errorResponse, paginatedResponse } = require('../../src/utils/serializer');

// ─── Error Classes ────────────────────────────────────────────────────────────

describe('Custom Error Classes', () => {
  it('ValidationError has correct statusCode, code, and isOperational', () => {
    const err = new ValidationError('bad input');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.isOperational).toBe(true);
    expect(err.message).toBe('bad input');
  });

  it('ValidationError with fields stores fields property', () => {
    const fields = { email: 'invalid email' };
    const err = new ValidationError('Validation failed', fields);
    expect(err.fields).toEqual(fields);
  });

  it('ValidationError without fields has no fields property', () => {
    const err = new ValidationError('bad input');
    expect(err.fields).toBeUndefined();
  });

  it('UnauthorizedError has statusCode 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.isOperational).toBe(true);
  });

  it('ForbiddenError has statusCode 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('NotFoundError formats message with resource name', () => {
    const err = new NotFoundError('Student');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Student not found');
    expect(err.code).toBe('NOT_FOUND');
  });

  it('NotFoundError uses default resource name', () => {
    const err = new NotFoundError();
    expect(err.message).toBe('Resource not found');
  });

  it('ConflictError has statusCode 409', () => {
    const err = new ConflictError('duplicate entry');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('RateLimitError has statusCode 429', () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('DatabaseError has statusCode 503 and isOperational false', () => {
    const err = new DatabaseError();
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe('DATABASE_ERROR');
    expect(err.isOperational).toBe(false);
  });

  it('InternalServerError has statusCode 500 and isOperational false', () => {
    const err = new InternalServerError();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_SERVER_ERROR');
    expect(err.isOperational).toBe(false);
  });

  it('all errors are instances of Error', () => {
    const errors = [
      new ValidationError('x'), new UnauthorizedError(), new ForbiddenError(),
      new NotFoundError(), new ConflictError('x'), new RateLimitError(),
      new DatabaseError(), new InternalServerError()
    ];
    errors.forEach(err => expect(err).toBeInstanceOf(Error));
  });
});

// ─── Serializer ───────────────────────────────────────────────────────────────

describe('Serializer', () => {
  describe('serialize()', () => {
    it('returns undefined for null', () => {
      expect(serialize(null)).toBeUndefined();
    });

    it('returns undefined for undefined', () => {
      expect(serialize(undefined)).toBeUndefined();
    });

    it('converts Date to ISO 8601 string', () => {
      const d = new Date('2024-01-15T10:00:00.000Z');
      expect(serialize(d)).toBe('2024-01-15T10:00:00.000Z');
    });

    it('converts numeric strings to numbers', () => {
      expect(serialize('42')).toBe(42);
      expect(serialize('3.14')).toBe(3.14);
    });

    it('leaves non-numeric strings unchanged', () => {
      expect(serialize('hello')).toBe('hello');
      expect(serialize('')).toBe('');
    });

    it('excludes null values from objects', () => {
      const result = serialize({ a: 1, b: null, c: 'test' });
      expect(result).toEqual({ a: 1, c: 'test' });
      expect(result.b).toBeUndefined();
    });

    it('recursively serializes nested objects', () => {
      const result = serialize({ user: { name: 'John', age: null } });
      expect(result).toEqual({ user: { name: 'John' } });
    });

    it('recursively serializes arrays', () => {
      const result = serialize([1, null, 'hello', '42']);
      expect(result).toEqual([1, 'hello', 42]);
    });

    it('converts Date objects inside objects', () => {
      const d = new Date('2024-01-15T10:00:00.000Z');
      const result = serialize({ createdAt: d, name: 'test' });
      expect(result.createdAt).toBe('2024-01-15T10:00:00.000Z');
    });

    it('passes through booleans unchanged', () => {
      expect(serialize(true)).toBe(true);
      expect(serialize(false)).toBe(false);
    });

    it('passes through numbers unchanged', () => {
      expect(serialize(42)).toBe(42);
      expect(serialize(0)).toBe(0);
    });
  });

  describe('successResponse()', () => {
    it('returns success:true with data', () => {
      const res = successResponse({ id: 1 });
      expect(res.success).toBe(true);
      expect(res.data).toEqual({ id: 1 });
    });

    it('includes message when provided', () => {
      const res = successResponse({}, 'Created successfully');
      expect(res.message).toBe('Created successfully');
    });

    it('omits message when not provided', () => {
      const res = successResponse({});
      expect(res.message).toBeUndefined();
    });

    it('includes meta when provided', () => {
      const res = successResponse([], null, { total: 10 });
      expect(res.meta).toBeDefined();
    });
  });

  describe('errorResponse()', () => {
    it('returns success:false with error code and message', () => {
      const res = errorResponse('NOT_FOUND', 'Resource not found');
      expect(res.success).toBe(false);
      expect(res.error.code).toBe('NOT_FOUND');
      expect(res.error.message).toBe('Resource not found');
    });

    it('includes fields when provided', () => {
      const res = errorResponse('VALIDATION_ERROR', 'Invalid', { email: 'required' });
      expect(res.error.fields).toEqual({ email: 'required' });
    });

    it('omits fields when not provided', () => {
      const res = errorResponse('ERROR', 'msg');
      expect(res.error.fields).toBeUndefined();
    });
  });

  describe('paginatedResponse()', () => {
    it('wraps data with pagination meta', () => {
      const pagination = { page: 1, limit: 20, total: 100, totalPages: 5 };
      const res = paginatedResponse([{ id: 1 }], pagination);
      expect(res.success).toBe(true);
      expect(res.data).toEqual([{ id: 1 }]);
      expect(res.meta.pagination).toBeDefined();
    });
  });
});
