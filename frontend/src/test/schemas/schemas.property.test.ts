/**
 * Property-based tests for Zod validation schemas
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { studentFullSchema } from '../../schemas/studentSchemas';
import { paymentSchema } from '../../schemas/feeSchemas';
import { examSchema, marksEntrySchema } from '../../schemas/examSchemas';
import { timetableEntrySchema } from '../../schemas/timetableSchemas';

/**
 * Property 8: Validator Idempotence
 * Validates: Requirements 20.1
 * For any input v, validate(validate(v)) produces the same result as validate(v)
 */
describe('Property 8: Validator Idempotence', () => {
  it('payment schema parse result is stable when re-parsed', () => {
    fc.assert(
      fc.property(
        fc.record({
          studentId: fc.integer({ min: 1 }),
          academicYear: fc.constantFrom('2024-2025', '2023-2024', '2025-2026'),
          amount: fc.double({ min: 0.01, max: 100_000, noNaN: true }),
          paymentDate: fc.constantFrom('2024-01-15', '2023-06-30', '2024-12-01'),
          paymentMethod: fc.constantFrom('cash' as const, 'card' as const, 'bank_transfer' as const),
        }),
        (input) => {
          const first = paymentSchema.safeParse(input);
          if (!first.success) return; // only test valid inputs
          const second = paymentSchema.safeParse(first.data);
          expect(second.success).toBe(true);
          if (second.success) {
            expect(second.data).toEqual(first.data);
          }
        }
      )
    );
  });
});

/**
 * Property 9: Name Validator Whitespace Invariance
 * Validates: Requirements 15.9, 20.10
 * For any string where s.trim().length is 2–100, validator returns valid regardless of surrounding whitespace
 */
describe('Property 9: Name Validator Whitespace Invariance', () => {
  it('firstName validation is invariant to surrounding whitespace', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 98 }).filter((s) => s.trim().length >= 2),
        fc.integer({ min: 0, max: 5 }),
        (name, spaces) => {
          const padded = ' '.repeat(spaces) + name + ' '.repeat(spaces);
          // Build a minimal valid student object
          const base = {
            admissionNo: 'A001',
            firstName: padded,
            lastName: 'Test',
            dateOfBirth: '2010-01-01',
            gender: 'male' as const,
            classId: 1,
            sectionId: 1,
            admissionDate: '2020-01-01',
            parentName: 'Parent Name',
            parentPhone: '1234567890',
          };
          const result = studentFullSchema.safeParse(base);
          // If the trimmed name is valid length, it should pass
          if (padded.trim().length >= 2 && padded.trim().length <= 100) {
            expect(result.success).toBe(true);
          }
        }
      )
    );
  });
});

/**
 * Property 10: Amount Validator Rejects Non-Positive Values
 * Validates: Requirements 8.12, 16.6
 */
describe('Property 10: Amount Validator Rejects Non-Positive Values', () => {
  it('rejects amount <= 0', () => {
    fc.assert(
      fc.property(
        fc.float({ max: 0, noNaN: true }),
        (amount) => {
          const result = paymentSchema.safeParse({
            studentId: 1,
            academicYear: '2024-2025',
            amount,
            paymentDate: '2024-01-01',
            paymentMethod: 'cash',
          });
          expect(result.success).toBe(false);
        }
      )
    );
  });

  it('accepts amount > 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1_000_000, noNaN: true }),
        (amount) => {
          const result = paymentSchema.safeParse({
            studentId: 1,
            academicYear: '2024-2025',
            amount,
            paymentDate: '2024-01-01',
            paymentMethod: 'cash',
          });
          expect(result.success).toBe(true);
        }
      )
    );
  });
});

/**
 * Property 19: Exam Marks Bounds
 * Validates: Requirements 9.6
 */
describe('Property 19: Exam Marks Bounds', () => {
  it('absent student must have marksObtained of 0 or undefined', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 100, noNaN: true }), // non-zero marks
        (marks) => {
          const result = marksEntrySchema.safeParse({
            marksObtained: marks,
            isAbsent: true,
          });
          expect(result.success).toBe(false);
        }
      )
    );
  });

  it('absent student with 0 marks is valid', () => {
    const result = marksEntrySchema.safeParse({ marksObtained: 0, isAbsent: true });
    expect(result.success).toBe(true);
  });

  it('absent student with undefined marks is valid', () => {
    const result = marksEntrySchema.safeParse({ isAbsent: true });
    expect(result.success).toBe(true);
  });
});

/**
 * Property 20: Passing Marks Constraint
 * Validates: Requirements 9.3
 */
describe('Property 20: Passing Marks Constraint', () => {
  it('rejects exam where passingMarks > maxMarks', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),  // maxMarks
        fc.integer({ min: 1, max: 100 }),  // extra
        (maxMarks, extra) => {
          const result = examSchema.safeParse({
            name: 'Test Exam',
            examType: 'unit_test',
            classId: 1,
            subject: 'Math',
            maxMarks,
            passingMarks: maxMarks + extra,
            examDate: '2024-06-01',
          });
          expect(result.success).toBe(false);
        }
      )
    );
  });

  it('accepts exam where passingMarks <= maxMarks', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100 }),  // maxMarks
        fc.integer({ min: 1, max: 100 }),  // passingMarks base
        (maxMarks, base) => {
          const passingMarks = Math.min(base, maxMarks);
          const result = examSchema.safeParse({
            name: 'Test Exam',
            examType: 'unit_test',
            classId: 1,
            subject: 'Math',
            maxMarks,
            passingMarks,
            examDate: '2024-06-01',
          });
          expect(result.success).toBe(true);
        }
      )
    );
  });
});

/**
 * Property 21: Timetable Time Order
 * Validates: Requirements 10.4
 */
describe('Property 21: Timetable Time Order', () => {
  const toTime = (h: number, m: number) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  it('rejects entries where endTime <= startTime', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 0, max: 59 }),
        (h, m) => {
          const time = toTime(h, m);
          // endTime === startTime
          const result = timetableEntrySchema.safeParse({
            subject: 'Math',
            teacherId: 1,
            startTime: time,
            endTime: time,
          });
          expect(result.success).toBe(false);
        }
      )
    );
  });

  it('accepts entries where endTime > startTime', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 22 }),
        fc.integer({ min: 0, max: 59 }),
        (h, m) => {
          const startTime = toTime(h, m);
          const endTime = toTime(h + 1, m);
          const result = timetableEntrySchema.safeParse({
            subject: 'Math',
            teacherId: 1,
            startTime,
            endTime,
          });
          expect(result.success).toBe(true);
        }
      )
    );
  });
});
