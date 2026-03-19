/**
 * Property 14: Grade Calculator Monotonicity
 * Validates: Requirements 9.11, 20.6
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateGrade } from '../../utils/gradeCalculator';

// Grade ordering: A > B > C > D > F
const GRADE_ORDER: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };

describe('Property 14: Grade Calculator Monotonicity', () => {
  it('higher marks always produce equal or higher grade', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // maxMarks
        fc.integer({ min: 0, max: 1000 }),  // a
        fc.integer({ min: 0, max: 1000 }),  // b
        (maxMarks, rawA, rawB) => {
          const a = Math.min(rawA, maxMarks);
          const b = Math.min(rawB, maxMarks);
          if (a <= b) return; // only test when a > b

          const gradeA = calculateGrade(a, maxMarks);
          const gradeB = calculateGrade(b, maxMarks);
          expect(GRADE_ORDER[gradeA]).toBeGreaterThanOrEqual(GRADE_ORDER[gradeB]);
        }
      )
    );
  });
});

/**
 * Property 15: Attendance Percentage Bounds
 * Validates: Requirements 7.8, 20.7
 */
import { calculatePercentage } from '../../utils/attendanceCalculator';
import type { AttendanceRecord } from '../../types/api';

describe('Property 15: Attendance Percentage Bounds', () => {
  it('result is always in [0, 100] for any attendance records', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1 }),
            studentId: fc.integer({ min: 1 }),
            studentName: fc.string({ minLength: 1 }),
            admissionNo: fc.string({ minLength: 1 }),
            date: fc.date(),
            status: fc.constantFrom('present' as const, 'absent' as const, 'late' as const, 'excused' as const),
          }),
          { maxLength: 100 }
        ),
        (records: AttendanceRecord[]) => {
          const result = calculatePercentage(records);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(100);
        }
      )
    );
  });
});

/**
 * Property 17: Fee Outstanding Balance Invariant
 * Validates: Requirements 20.9
 */
import { calculateOutstanding, calculateTotalFee } from '../../utils/feeCalculator';
import type { FeeStructure, FeePayment } from '../../types/api';

describe('Property 17: Fee Outstanding Balance Invariant', () => {
  it('outstandingBalance === totalFee - totalPaid and outstandingBalance >= 0', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1 }),
          classId: fc.integer({ min: 1 }),
          className: fc.string({ minLength: 1 }),
          academicYear: fc.string({ minLength: 1 }),
          tuitionFee: fc.float({ min: 0, max: 100_000, noNaN: true }),
          transportFee: fc.float({ min: 0, max: 10_000, noNaN: true }),
          activityFee: fc.float({ min: 0, max: 10_000, noNaN: true }),
          otherFee: fc.float({ min: 0, max: 10_000, noNaN: true }),
          totalFee: fc.float({ min: 0, noNaN: true }), // ignored by calculateTotalFee
        }),
        fc.array(
          fc.record({
            id: fc.integer({ min: 1 }),
            studentId: fc.integer({ min: 1 }),
            academicYear: fc.string({ minLength: 1 }),
            amount: fc.float({ min: 0, max: 200_000, noNaN: true }),
            paymentDate: fc.date(),
            paymentMethod: fc.constantFrom('cash' as const, 'card' as const, 'bank_transfer' as const, 'cheque' as const, 'online' as const),
          }),
          { maxLength: 20 }
        ),
        (structure: FeeStructure, payments: FeePayment[]) => {
          const totalFee = calculateTotalFee(structure);
          const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
          const outstanding = calculateOutstanding(structure, payments);

          expect(outstanding).toBeGreaterThanOrEqual(0);
          if (totalPaid <= totalFee) {
            expect(outstanding).toBeCloseTo(totalFee - totalPaid, 5);
          } else {
            expect(outstanding).toBe(0);
          }
        }
      )
    );
  });
});

/**
 * Property 18: Fee Total Equals Sum of Components
 * Validates: Requirements 8.3
 */
describe('Property 18: Fee Total Equals Sum of Components', () => {
  it('totalFee === tuitionFee + transportFee + activityFee + otherFee', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100_000, noNaN: true }),
        fc.float({ min: 0, max: 10_000, noNaN: true }),
        fc.float({ min: 0, max: 10_000, noNaN: true }),
        fc.float({ min: 0, max: 10_000, noNaN: true }),
        (tuitionFee, transportFee, activityFee, otherFee) => {
          const structure: FeeStructure = {
            id: 1,
            classId: 1,
            className: 'Class 1',
            academicYear: '2024-2025',
            tuitionFee,
            transportFee,
            activityFee,
            otherFee,
            totalFee: 0, // not used by calculateTotalFee
          };
          const result = calculateTotalFee(structure);
          expect(result).toBeCloseTo(tuitionFee + transportFee + activityFee + otherFee, 5);
        }
      )
    );
  });
});

/**
 * Property 16: Pagination Invariant
 * Validates: Requirements 18.8, 20.8
 */
import { calculateTotalPages, getPageItems } from '../../utils/paginationHelper';

describe('Property 16: Pagination Invariant', () => {
  it('totalPages === Math.ceil(total / pageSize)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000 }), // total
        fc.integer({ min: 1, max: 100 }),     // pageSize
        (total, pageSize) => {
          const result = calculateTotalPages(total, pageSize);
          expect(result).toBe(Math.ceil(total / pageSize));
        }
      )
    );
  });

  it('last page item count is total % pageSize or pageSize', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }), // total
        fc.integer({ min: 1, max: 50 }),  // pageSize
        (total, pageSize) => {
          const items = Array.from({ length: total }, (_, i) => i);
          const totalPages = calculateTotalPages(total, pageSize);
          const lastPage = getPageItems(items, totalPages, pageSize);
          const expectedCount = total % pageSize === 0 ? pageSize : total % pageSize;
          expect(lastPage.length).toBe(expectedCount);
        }
      )
    );
  });
});

/**
 * Property 22: XSS Sanitization
 * Validates: Requirements 15.2
 */
import { sanitize } from '../../utils/sanitize';

describe('Property 22: XSS Sanitization', () => {
  it('sanitized output contains no script tags, javascript: URIs, or on* attributes', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (s) => {
          const result = sanitize(s);
          expect(result.toLowerCase()).not.toMatch(/<script/i);
          expect(result.toLowerCase()).not.toMatch(/javascript:/i);
          expect(result.toLowerCase()).not.toMatch(/\bon\w+\s*=/i);
        }
      )
    );
  });

  it('known XSS payloads are stripped', () => {
    const payloads = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '<a href="javascript:alert(1)">click</a>',
      '<svg onload=alert(1)>',
    ];
    for (const payload of payloads) {
      const result = sanitize(payload);
      expect(result).not.toMatch(/<script/i);
      expect(result).not.toMatch(/javascript:/i);
      expect(result).not.toMatch(/\bon\w+\s*=/i);
    }
  });
});

/**
 * Property 23: Route Parameter Validation
 * Validates: Requirements 15.8
 */
import { validatePositiveInt } from '../../utils/routeParamValidator';

describe('Property 23: Route Parameter Validation', () => {
  it('returns null for any string not matching /^[1-9]\\d*$/', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !/^[1-9]\d*$/.test(s)),
        (s) => {
          expect(validatePositiveInt(s)).toBeNull();
        }
      )
    );
  });

  it('returns the parsed integer for valid positive integer strings', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }),
        (n) => {
          const result = validatePositiveInt(String(n));
          expect(result).toBe(n);
        }
      )
    );
  });

  it('returns null for undefined', () => {
    expect(validatePositiveInt(undefined)).toBeNull();
  });
});
