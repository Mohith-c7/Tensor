/**
 * Property Tests: Cache Operations
 * Properties 17, 18 — cache population on miss, cache invalidation on modification
 * Requirements: 9.1, 9.4, 9.6
 */

const fc = require('fast-check');

// Use a fresh cache instance for each test to avoid cross-test pollution
jest.mock('../../src/config/index', () => ({
  cacheDefaultTtl: 3600,
  cacheClassTtl: 3600,
  cacheFeeTtl: 86400
}));

// We test the cache utility directly
const cache = require('../../src/utils/cache');

beforeEach(() => {
  cache.flush();
});

// Prototype property names that node-cache's internal object may already have
const protoProps = new Set([
  ...Object.getOwnPropertyNames(Object.prototype),
  ...Object.getOwnPropertyNames(Array.prototype)
]);

// Safe key generator that avoids prototype property names
const safeKey = fc.string({ minLength: 1, maxLength: 50 }).filter(k => !protoProps.has(k));

// ─── Property 17: Cache Population on Miss ────────────────────────────────────

describe('Property 17: Cache Population on Miss', () => {
  /**
   * For any key not yet in cache, get() must return null (cache miss).
   * After set(), get() must return the stored value (cache hit).
   */
  it('get() returns null on miss, then value after set()', () => {
    fc.assert(
      fc.property(
        safeKey,
        fc.jsonValue(),
        (key, value) => {
          cache.flush();
          // Miss
          expect(cache.get(key)).toBeNull();
          // Populate
          cache.set(key, value);
          // Hit
          const result = cache.get(key);
          expect(result).toEqual(value);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * has() must return false before set and true after set.
   */
  it('has() correctly reflects cache state', () => {
    fc.assert(
      fc.property(
        safeKey,
        fc.string({ minLength: 1, maxLength: 100 }),
        (key, value) => {
          cache.flush();
          expect(cache.has(key)).toBe(false);
          cache.set(key, value);
          expect(cache.has(key)).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Setting the same key twice must overwrite with the latest value.
   */
  it('set() overwrites existing value for same key', () => {
    fc.assert(
      fc.property(
        safeKey,
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (key, value1, value2) => {
          cache.flush();
          cache.set(key, value1);
          cache.set(key, value2);
          expect(cache.get(key)).toEqual(value2);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Multiple distinct keys must be independently stored and retrieved.
   */
  it('multiple distinct keys are stored independently', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(safeKey, { minLength: 2, maxLength: 5 }),
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 5 }),
        (keys, values) => {
          cache.flush();
          const pairs = keys.map((k, i) => [k, values[i % values.length]]);
          pairs.forEach(([k, v]) => cache.set(k, v));
          pairs.forEach(([k, v]) => {
            expect(cache.get(k)).toEqual(v);
          });
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ─── Property 18: Cache Invalidation on Modification ─────────────────────────

describe('Property 18: Cache Invalidation on Modification', () => {
  /**
   * After del(), get() must return null for that key.
   */
  it('del() removes the key from cache', () => {
    fc.assert(
      fc.property(
        safeKey,
        fc.string({ minLength: 1, maxLength: 100 }),
        (key, value) => {
          cache.flush();
          cache.set(key, value);
          expect(cache.get(key)).toEqual(value);
          cache.del(key);
          expect(cache.get(key)).toBeNull();
          expect(cache.has(key)).toBe(false);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * delPattern() must remove all keys matching the pattern and leave others intact.
   */
  it('delPattern() removes matching keys and preserves non-matching keys', () => {
    fc.assert(
      fc.property(
        // Prefix must not contain regex special chars (especially * . + ? etc.) to avoid
        // the pattern matching unintended keys
        fc.string({ minLength: 1, maxLength: 20 })
          .filter(k => !protoProps.has(k) && !/[.*+?^${}()|[\]\\]/.test(k)),
        fc.array(
          fc.string({ minLength: 1, maxLength: 20 })
            .filter(k => !protoProps.has(k) && !/[.*+?^${}()|[\]\\]/.test(k)),
          { minLength: 1, maxLength: 5 }
        ),
        (prefix, suffixes) => {
          cache.flush();
          const matchingKeys = suffixes.map(s => `${prefix}:${s}`);
          const otherKey = `other:${prefix}:preserved`;

          matchingKeys.forEach(k => cache.set(k, 'value'));
          cache.set(otherKey, 'preserved');

          cache.delPattern(`${prefix}:*`);

          matchingKeys.forEach(k => {
            expect(cache.get(k)).toBeNull();
          });
          // Other key should still be there
          expect(cache.get(otherKey)).toBe('preserved');
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * flush() must clear all keys from cache.
   */
  it('flush() removes all keys from cache', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(safeKey, { minLength: 1, maxLength: 10 }),
        (keys) => {
          cache.flush();
          keys.forEach(k => cache.set(k, 'value'));
          cache.flush();
          keys.forEach(k => {
            expect(cache.get(k)).toBeNull();
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * getStats() must return an object with hits and misses tracking.
   */
  it('getStats() returns cache statistics object', () => {
    cache.flush();
    cache.set('stat-key', 'value');
    cache.get('stat-key');   // hit
    cache.get('missing-key'); // miss

    const stats = cache.getStats();
    expect(stats).toBeDefined();
    expect(typeof stats).toBe('object');
    expect(typeof stats.hits).toBe('number');
    expect(typeof stats.misses).toBe('number');
  });

  /**
   * del() on a non-existent key must not throw.
   */
  it('del() on non-existent key does not throw', () => {
    fc.assert(
      fc.property(
        safeKey,
        (key) => {
          cache.flush();
          expect(() => cache.del(key)).not.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });
});
