import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateGrade } from '../../utils/gradeCalculator';
import { calculatePercentage } from '../../utils/attendanceCalculator';
import { calculateOutstanding, calculateTotalFee } from '../../utils/feeCalculator';
import { calculateTotalPages, getPageItems } from '../../utils/paginationHelper';
import { validatePositiveInt } from '../../utils/routeParamValidator';
import type { AttendanceRecord, FeeStructure, FeePayment } from '../../types/api';

// ── gradeCalculator ───────────────────────────────────────────────────────
describe('calculateGrade', () => {
  it('returns A for >= 90%', () => {
    expect(calculateGrade(90, 100)).toBe('A');
    expect(calculateGrade(100, 100)).toBe('A');
    expect(calculateGrade(45, 50)).toBe('A');
  });

  it('returns B for >= 75% and < 90%', () => {
    expect(calculateGrade(75, 100)).toBe('B');
    expect(calculateGrade(89, 100)).toBe('B');
  });

  it('returns C for >= 60% and < 75%', () => {
    expect(calculateGrade(60, 100)).toBe('C');
    expect(calculateGrade(74, 100)).toBe('C');
  });

  it('returns D for >= 45% and < 60%', () => {
    expect(calculateGrade(45, 100)).toBe('D');
    expect(calculateGrade(59, 100)).toBe('D');
  });

  it('returns F for < 45%', () => {
    expect(calculateGrade(0, 100)).toBe('F');
    expect(calculateGrade(44, 100)).toBe('F');
  });

  it('returns F when maxMarks is 0', () => {
    expect(calculateGrade(0, 0)).toBe('F');
  });
});

// ── attendanceCalculator ──────────────────────────────────────────────────
const makeRecord = (status: AttendanceRecord['status']): AttendanceRecord => ({
  id: 1,
  studentId: 1,
  studentName: 'Test',
  admissionNo: 'A001',
  date: new Date(),
  status,
});

describe('calculatePercentage', () => {
  it('returns 0 for empty records', () => {
    expect(calculatePercentage([])).toBe(0);
  });

  it('returns 100 when all present', () => {
    const records = [makeRecord('present'), makeRecord('present')];
    expect(calculatePercentage(records)).toBe(100);
  });

  it('returns 0 when all absent', () => {
    const records = [makeRecord('absent'), makeRecord('absent')];
    expect(calculatePercentage(records)).toBe(0);
  });

  it('counts late as attended', () => {
    const records = [makeRecord('present'), makeRecord('late'), makeRecord('absent')];
    expect(calculatePercentage(records)).toBeCloseTo(66.67, 1);
  });

  it('does not count excused as attended', () => {
    const records = [makeRecord('excused'), makeRecord('excused')];
    expect(calculatePercentage(records)).toBe(0);
  });
});

// ── feeCalculator ─────────────────────────────────────────────────────────
const makeStructure = (overrides: Partial<FeeStructure> = {}): FeeStructure => ({
  id: 1,
  classId: 1,
  className: 'Class 1',
  academicYear: '2024-2025',
  tuitionFee: 10000,
  transportFee: 2000,
  activityFee: 500,
  otherFee: 300,
  totalFee: 12800,
  ...overrides,
});

const makePayment = (amount: number): FeePayment => ({
  id: 1,
  studentId: 1,
  academicYear: '2024-2025',
  amount,
  paymentDate: new Date(),
  paymentMethod: 'cash',
});

describe('calculateTotalFee', () => {
  it('sums all fee components', () => {
    expect(calculateTotalFee(makeStructure())).toBe(12800);
  });

  it('handles zero components', () => {
    expect(calculateTotalFee(makeStructure({ tuitionFee: 0, transportFee: 0, activityFee: 0, otherFee: 0 }))).toBe(0);
  });
});

describe('calculateOutstanding', () => {
  it('returns totalFee when no payments', () => {
    expect(calculateOutstanding(makeStructure(), [])).toBe(12800);
  });

  it('subtracts payments from total', () => {
    expect(calculateOutstanding(makeStructure(), [makePayment(5000)])).toBe(7800);
  });

  it('floors at 0 for overpayment', () => {
    expect(calculateOutstanding(makeStructure(), [makePayment(20000)])).toBe(0);
  });
});

// ── paginationHelper ──────────────────────────────────────────────────────
describe('calculateTotalPages', () => {
  it('returns 0 for 0 items', () => {
    expect(calculateTotalPages(0, 10)).toBe(0);
  });

  it('returns 1 for items <= pageSize', () => {
    expect(calculateTotalPages(5, 10)).toBe(1);
    expect(calculateTotalPages(10, 10)).toBe(1);
  });

  it('rounds up for partial last page', () => {
    expect(calculateTotalPages(11, 10)).toBe(2);
    expect(calculateTotalPages(21, 10)).toBe(3);
  });

  it('returns 0 for invalid pageSize', () => {
    expect(calculateTotalPages(10, 0)).toBe(0);
  });
});

describe('getPageItems', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it('returns first page', () => {
    expect(getPageItems(items, 1, 3)).toEqual([1, 2, 3]);
  });

  it('returns last partial page', () => {
    expect(getPageItems(items, 4, 3)).toEqual([10]);
  });

  it('returns empty for out-of-range page', () => {
    expect(getPageItems(items, 10, 3)).toEqual([]);
  });

  it('returns empty for invalid page or pageSize', () => {
    expect(getPageItems(items, 0, 3)).toEqual([]);
    expect(getPageItems(items, 1, 0)).toEqual([]);
  });
});

// ── sanitize ──────────────────────────────────────────────────────────────
// Note: DOMPurify requires a DOM environment (jsdom) — tested via property tests
// Unit tests for known payloads are in utils.property.test.ts

// ── routeParamValidator ───────────────────────────────────────────────────
describe('validatePositiveInt', () => {
  it('returns null for undefined', () => {
    expect(validatePositiveInt(undefined)).toBeNull();
  });

  it('returns null for negative numbers', () => {
    expect(validatePositiveInt('-1')).toBeNull();
    expect(validatePositiveInt('-100')).toBeNull();
  });

  it('returns null for zero', () => {
    expect(validatePositiveInt('0')).toBeNull();
  });

  it('returns null for floats', () => {
    expect(validatePositiveInt('1.5')).toBeNull();
    expect(validatePositiveInt('3.14')).toBeNull();
  });

  it('returns null for non-numeric strings', () => {
    expect(validatePositiveInt('abc')).toBeNull();
    expect(validatePositiveInt('')).toBeNull();
    expect(validatePositiveInt('1a')).toBeNull();
  });

  it('returns parsed integer for valid positive integers', () => {
    expect(validatePositiveInt('1')).toBe(1);
    expect(validatePositiveInt('42')).toBe(42);
    expect(validatePositiveInt('1000')).toBe(1000);
  });
});
