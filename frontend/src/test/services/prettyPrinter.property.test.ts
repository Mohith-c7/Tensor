/**
 * Property 11: Date Round-Trip
 * Validates: Requirements 11.12, 16.7, 20.2
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatDate, parseDate, formatCurrency, parseCurrency } from '../../services/prettyPrinter';

describe('Property 11: Date Round-Trip', () => {
  it('formatDate(parseDate(formatDate(date))) equals formatDate(date)', () => {
    fc.assert(
      fc.property(
        // Generate dates between 1900 and 2100 (realistic range)
        fc.date({ min: new Date('1900-01-01'), max: new Date('2100-12-31') }),
        (date) => {
          const formatted = formatDate(date);
          const parsed = parseDate(formatted);
          const reformatted = formatDate(parsed);
          expect(reformatted).toBe(formatted);
        }
      )
    );
  });

  it('formatDate produces dd/MM/yyyy format', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('1900-01-01'), max: new Date('2100-12-31') }),
        (date) => {
          const formatted = formatDate(date);
          expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
        }
      )
    );
  });
});

/**
 * Property 12: Currency Round-Trip
 * Validates: Requirements 11.12, 16.8, 20.3
 */
describe('Property 12: Currency Round-Trip', () => {
  it('parseCurrency(formatCurrency(n)) === n for non-negative numbers with ≤ 2 decimal places', () => {
    fc.assert(
      fc.property(
        // Generate non-negative numbers with at most 2 decimal places
        fc.float({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true })
          .map(n => Math.round(n * 100) / 100), // round to 2 decimal places
        (n) => {
          const formatted = formatCurrency(n);
          const parsed = parseCurrency(formatted);
          // Allow for floating point epsilon
          expect(Math.abs(parsed - n)).toBeLessThanOrEqual(0.001);
        }
      )
    );
  });

  it('formatCurrency always produces a string with 2 decimal places', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (n) => {
          const formatted = formatCurrency(n);
          // Should contain a decimal separator with 2 digits after
          expect(formatted).toMatch(/\.\d{2}$/);
        }
      )
    );
  });
});
